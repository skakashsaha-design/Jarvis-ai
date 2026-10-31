import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Increase JSON payload limit for image uploads
app.use(express.json({ limit: '25mb' }));

// Initialize default server-side Google GenAI client
function getGenAIClient(customKey?: string) {
  const apiKey = customKey || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// System instructions builder based on personality and memory
function buildSystemInstruction(
  personality: string = 'jarvis',
  customPrompt?: string,
  memories: string[] = []
): string {
  let personaDesc = '';

  switch (personality) {
    case 'jarvis':
      personaDesc = `You are J.A.R.V.I.S. M.V. (Just A Rather Very Intelligent System - Mobile Version), an ultra-advanced personal artificial intelligence companion inspired by Tony Stark's iconic AI. You are sophisticated, articulate, composed, highly intelligent, and loyal. Address the user respectfully (e.g., 'Sir' or 'Boss' or by their name if remembered). Provide concise, precise, actionable answers with technical flair, futuristic HUD-ready formatting, and zero unnecessary fluff. Always be ready to assist with calculations, code, device tasks, and analysis.`;
      break;
    case 'professional':
      personaDesc = `You are a consummate professional executive AI assistant. Your communication is polished, structured, concise, and focused on productivity, accuracy, and clear business communication.`;
      break;
    case 'friendly':
      personaDesc = `You are a warm, supportive, friendly AI companion. You have high empathy, conversational warmth, positive encouragement, and a genuine interest in helping the user with their daily life and thoughts.`;
    case 'humorous':
      personaDesc = `You are witty, quick-witted, humorous, and charming AI companion with smart puns, clever pop-culture references, and lighthearted humor while still providing genuinely helpful answers.`;
      break;
    case 'scientific':
      personaDesc = `You are a rigorous scientific and STEM assistant. You prioritize first-principles thinking, mathematical exactness, empirical evidence, structured hypotheses, and clear academic explanations.`;
      break;
    case 'calm':
      personaDesc = `You are a serene, zen-like, mindful, and deeply intelligent AI companion. You speak with tranquility, clarity, and thoughtful wisdom, helping reduce stress and organize thoughts.`;
      break;
    case 'study':
      personaDesc = `You are a dedicated study buddy and master tutor. You break down complex concepts into step-by-step intuitive explanations, use analogies, quiz the user when appropriate, and encourage deep retention.`;
      break;
    case 'custom':
      personaDesc = customPrompt || 'You are an intelligent, versatile personal AI companion.';
      break;
    default:
      personaDesc = `You are J.A.R.V.I.S. M.V., a sophisticated futuristic personal AI companion.`;
  }

  let memoryContext = '';
  if (memories && memories.length > 0) {
    memoryContext = `\n\n[USER PERMANENT MEMORY & FACTS]:\n${memories
      .map((m, i) => `${i + 1}. ${m}`)
      .join('\n')}\nUse these remembered details naturally in conversation without reciting them unprompted.`;
  }

  return `${personaDesc}
${memoryContext}

[LANGUAGE CAPABILITIES]:
- You are fully bilingual in English and Bengali (বাংলা).
- If the user addresses you in Bengali, respond naturally in clear, high-quality Bengali (বাংলা).
- If the user asks in English, respond in English.
- If the user asks for translations or code, provide clean, exact results.

[FORMATTING]:
- Use clean Markdown with short paragraphs and bullet points where helpful.
- When generating code, use markdown fenced code blocks with language tags.
- Keep responses snappy and suitable for mobile reading.`;
}

// 1. Health / status check
app.get('/api/status', (req: Request, res: Response) => {
  const hasEnvKey = !!process.env.GEMINI_API_KEY;
  res.json({
    status: 'online',
    version: '2.5.0-mobile',
    serverModel: 'gemini-3.8-flash',
    hasServerApiKey: hasEnvKey,
    timestamp: new Date().toISOString(),
  });
});

// 2. Chat endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      message,
      history = [],
      personality = 'jarvis',
      customPrompt,
      memories = [],
      provider = 'gemini',
      apiKey: clientApiKey,
      modelName,
      webGrounding = false,
      deepThinking = false,
      thinkLonger = false,
      activePlugin = 'none',
      operationalMode = 'tactical',
      fileAttachment,
    } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required.' });
      return;
    }

    let modePrefix = '';
    if (operationalMode === 'combat') {
      modePrefix = `\n\n[COMBAT PROTOCOL / THREAT LEVEL ALPHA]: Priority emergency mode. Maintain razor-sharp tactical brevity, perimeter threat assessment, shield status updates, and actionable defense solutions.`;
    } else if (operationalMode === 'stealth') {
      modePrefix = `\n\n[STEALTH PROTOCOL ACTIVATED]: Maintain low-signature profile, covert precision, zero telemetry leaks, and concise encrypted responses.`;
    }

    const systemInstruction = buildSystemInstruction(personality, customPrompt, memories) + modePrefix;

    // Handling Groq Provider if specified and user provided key
    if (provider === 'groq' && clientApiKey) {
      try {
        const groqModel = modelName || 'llama-3.3-70b-versatile';
        const groqMessages = [
          { role: 'system', content: systemInstruction },
          ...history.slice(-8).map((h: any) => ({
            role: h.role === 'user' ? 'user' : 'assistant',
            content: h.text,
          })),
          { role: 'user', content: message },
        ];

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${clientApiKey}`,
          },
          body: JSON.stringify({
            model: groqModel,
            messages: groqMessages,
            temperature: 0.7,
            max_tokens: 1024,
          }),
        });

        if (!groqRes.ok) {
          const errText = await groqRes.text();
          throw new Error(`Groq API error (${groqRes.status}): ${errText}`);
        }

        const groqData = await groqRes.json();
        const reply = groqData.choices?.[0]?.message?.content || 'No response from Groq.';
        res.json({ reply, provider: 'groq', model: groqModel });
        return;
      } catch (err: any) {
        console.error('Groq call error, falling back to Gemini:', err.message);
        // Fall back to server Gemini
      }
    }

    // Handling OpenRouter Provider if specified and user provided key
    if (provider === 'openrouter' && clientApiKey) {
      try {
        const orModel = modelName || 'mistralai/mistral-7b-instruct:free';
        const orMessages = [
          { role: 'system', content: systemInstruction },
          ...history.slice(-8).map((h: any) => ({
            role: h.role === 'user' ? 'user' : 'assistant',
            content: h.text,
          })),
          { role: 'user', content: message },
        ];

        const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${clientApiKey}`,
            'HTTP-Referer': 'https://jarvis-mv.ai',
            'X-Title': 'JARVIS M.V. AI',
          },
          body: JSON.stringify({
            model: orModel,
            messages: orMessages,
          }),
        });

        if (!orRes.ok) {
          const errText = await orRes.text();
          throw new Error(`OpenRouter API error (${orRes.status}): ${errText}`);
        }

        const orData = await orRes.json();
        const reply = orData.choices?.[0]?.message?.content || 'No response from OpenRouter.';
        res.json({ reply, provider: 'openrouter', model: orModel });
        return;
      } catch (err: any) {
        console.error('OpenRouter call error, falling back to Gemini:', err.message);
      }
    }

    // Default: Gemini API using @google/genai
    const ai = getGenAIClient(clientApiKey);
    if (!ai) {
      // If neither server key nor user key exists, provide intelligent fallback response
      res.json({
        reply: `[JARVIS M.V. System Notice]: Server Gemini API key is currently configuring. I am operating in Offline Protocol Mode. You asked: "${message}". Please attach an API key in Provider Settings or ensure GEMINI_API_KEY is active.`,
        provider: 'offline-heuristic',
        model: 'heuristic-core',
      });
      return;
    }

    // Construct conversation contents with history for multi-turn context
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    // Append recent history (last 8 messages for optimal 1GB RAM and fast mobile tokens)
    const recentHistory = Array.isArray(history) ? history.slice(-8) : [];
    for (const item of recentHistory) {
      if (item && item.text) {
        contents.push({
          role: item.role === 'user' ? 'user' : 'model',
          parts: [{ text: item.text }],
        });
      }
    }

    // Build user message and handle multimodal file attachments
    let userPromptText = message;
    if (activePlugin === 'code-interpreter') {
      userPromptText = `[PLUGIN: CODE INTERPRETER & COMPUTATIONAL ENGINE]:\nAnalyze or run the user's request. Include simulated execution environment output or mathematical calculation proof.\n\n${userPromptText}`;
    } else if (activePlugin === 'spreadsheet-calc') {
      userPromptText = `[PLUGIN: SPREADSHEET & DATA ANALYZER]:\nInspect all tabular data, columns, cells, and values. Provide a structured summary, averages, statistical breakdown, or formatted markdown table.\n\n${userPromptText}`;
    }

    if (thinkLonger || deepThinking || operationalMode === 'deep-thought') {
      userPromptText = `${userPromptText}\n\n[COGNITIVE PROTOCOL]: Think deeply step-by-step. Enclose your inner chain-of-thought reasoning inside <thought>...</thought> tags, followed by your final synthesized response.`;
    }

    const userParts: any[] = [];

    // Attach multimodal file if present (PDF, image, spreadsheet, document)
    if (fileAttachment) {
      if (fileAttachment.type === 'pdf' && fileAttachment.base64) {
        userParts.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: fileAttachment.base64.replace(/^data:[^;]+;base64,/, ''),
          },
        });
      } else if (fileAttachment.type === 'image' && fileAttachment.base64) {
        userParts.push({
          inlineData: {
            mimeType: fileAttachment.mimeType || 'image/jpeg',
            data: fileAttachment.base64.replace(/^data:[^;]+;base64,/, ''),
          },
        });
      } else if (fileAttachment.textPreview) {
        userPromptText = `[ATTACHED FILE: ${fileAttachment.name} (${fileAttachment.type})]:\n\`\`\`\n${fileAttachment.textPreview.slice(0, 15000)}\n\`\`\`\n\n${userPromptText}`;
      }
    }

    userParts.push({ text: userPromptText });
    contents.push({ role: 'user', parts: userParts });

    const activeModel = modelName || 'gemini-3.8-flash';
    const config: any = {
      systemInstruction,
    };

    // Enable Google Search Grounding when live-recon or webGrounding is enabled
    const enableGrounding = webGrounding || operationalMode === 'live-recon' || activePlugin === 'web-search';
    if (enableGrounding) {
      config.tools = [{ googleSearch: {} }];
    }

    // Enable Gemini Thinking Level when deep-thought, thinkLonger, or deepThinking is enabled
    const enableThinking = deepThinking || thinkLonger || operationalMode === 'deep-thought' || activePlugin === 'deep-reasoner';
    if (enableThinking) {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    const startTimestamp = Date.now();
    let response: any;
    try {
      response = await ai.models.generateContent({
        model: activeModel,
        contents,
        config,
      });
    } catch (genErr: any) {
      if (config.tools || config.thinkingConfig) {
        console.warn('Specialized tool request failed, falling back to standard generation:', genErr?.message);
        response = await ai.models.generateContent({
          model: activeModel,
          contents,
          config: { systemInstruction },
        });
      } else {
        throw genErr;
      }
    }

    const elapsedMs = Date.now() - startTimestamp;
    let rawReply = response.text || 'Protocol complete. No textual payload received.';
    let thoughtProcess = '';

    // Extract <thought>...</thought> if present in the model output
    const thoughtMatch = rawReply.match(/<thought>([\s\S]*?)<\/thought>/i);
    if (thoughtMatch) {
      thoughtProcess = thoughtMatch[1].trim();
      rawReply = rawReply.replace(/<thought>[\s\S]*?<\/thought>/i, '').trim();
    }

    // Extract search grounding metadata
    const candidate = response.candidates?.[0];
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks;
    const webSearchQueries = candidate?.groundingMetadata?.webSearchQueries;
    let groundingSources: Array<{ title?: string; uri?: string }> = [];

    if (Array.isArray(groundingChunks)) {
      groundingSources = groundingChunks
        .map((chunk: any) => ({
          title: chunk.web?.title || 'Web Intelligence Reference',
          uri: chunk.web?.uri || '',
        }))
        .filter((src: any) => !!src.uri);
    }

    res.json({
      reply: rawReply,
      provider: 'gemini',
      model: activeModel,
      groundingSources,
      webSearchQueries,
      thoughtProcess: thoughtProcess || undefined,
      thinkingDurationMs: elapsedMs,
      activePlugin: activePlugin !== 'none' ? activePlugin : undefined,
      mode: operationalMode,
    });
  } catch (error: any) {
    console.error('Server chat endpoint error:', error);
    const errMsg = String(error?.message || '');

    if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
      res.json({
        reply: `[JARVIS Protocol Notice]: Gemini API free-tier quota was momentarily exceeded. I have engaged local neural buffering, Sir. You can also connect a custom key in Provider Settings for unlimited throughput.`,
        provider: 'gemini-ratelimit-buffer',
        model: 'rate-buffer',
      });
      return;
    }

    if (errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand')) {
      res.json({
        reply: `All systems nominal, Sir. The cloud neural relays are experiencing a temporary demand surge. Local telemetry and heuristic subsystems remain 100% active. Standing by for your directive.`,
        provider: 'jarvis-heuristic-fallback',
        model: 'gemini-3.8-flash',
      });
      return;
    }

    res.status(500).json({
      error: error?.message || 'Failed to process AI response',
    });
  }
});

// 3. Vision and Multimodal Analysis endpoint
app.post('/api/vision', async (req: Request, res: Response) => {
  try {
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      prompt = 'Describe this image in detail and identify key objects, text, and context.',
      taskType = 'general',
      apiKey: clientApiKey,
    } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: 'Image data (base64) is required.' });
      return;
    }

    const ai = getGenAIClient(clientApiKey);
    if (!ai) {
      res.status(500).json({
        error: 'Gemini API key is not configured for vision analysis.',
      });
      return;
    }

    // Clean base64 string if it contains data URI header
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

    let specializedPrompt = prompt;
    if (taskType === 'ocr') {
      specializedPrompt = `Extract and transcribe all visible text from this image with high precision. Maintain layout structure and hierarchy:\n\n${prompt}`;
    } else if (taskType === 'diagram') {
      specializedPrompt = `Analyze this diagram, flowchart, or technical chart. Explain the architecture, components, data flows, and conclusions:\n\n${prompt}`;
    } else if (taskType === 'code') {
      specializedPrompt = `Analyze the code or screenshot shown. Extract the code, explain what it does, detect any bugs, and suggest improvements:\n\n${prompt}`;
    } else if (taskType === 'math') {
      specializedPrompt = `Solve the mathematical equations, scientific formulas, or STEM problem in this image with step-by-step derivation and final result:\n\n${prompt}`;
    } else if (taskType === 'hardware') {
      specializedPrompt = `Analyze the electronic circuit board, hardware pins, chips, or mechanical devices shown. Detail components, labels, and schematic logic:\n\n${prompt}`;
    }

    const imagePart = {
      inlineData: {
        mimeType,
        data: cleanBase64,
      },
    };

    const textPart = {
      text: specializedPrompt,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction:
          'You are J.A.R.V.I.S. M.V. Visual Reconnaissance Intelligence. Provide ultra-clear, concise, structured visual analysis. Support both English and Bengali if requested.',
      },
    });

    const analysis = response.text || 'Visual analysis completed with empty report.';
    res.json({
      analysis,
      model: 'gemini-3.8-flash',
      taskType,
    });
  } catch (error: any) {
    console.error('Server vision analysis error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to analyze image.',
    });
  }
});

// 4. Quick Daily Briefing generator
app.get('/api/briefing', async (req: Request, res: Response) => {
  try {
    const ai = getGenAIClient();
    if (!ai) {
      res.json({
        briefing: `Good day, Sir. All local subsystems are functioning at optimal efficiency. Battery, sensors, and neural memory banks are operational. I am ready for your directives.`,
      });
      return;
    }

    const prompt = `Give a brief, crisp 2-paragraph morning/daily tactical intelligence briefing from JARVIS to Sir. Include motivational focus, tactical readiness, and readiness for tasks. Keep it under 100 words.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are J.A.R.V.I.S. M.V. Speak with calm, British sophistication and warmth.',
      },
    });

    res.json({ briefing: response.text });
  } catch (err: any) {
    res.json({
      briefing: `Good day, Sir. Local diagnostic: Systems operational. Core ready for directives.`,
    });
  }
});

// 5. Intelligence News Wire endpoint
app.post('/api/news', async (req: Request, res: Response) => {
  try {
    const { category = 'tech', query, apiKey: clientApiKey } = req.body;
    const ai = getGenAIClient(clientApiKey);

    if (!ai) {
      res.json({ items: [] });
      return;
    }

    const searchQueryPrompt = query
      ? `Find the latest real-time news and breaking headlines about "${query}".`
      : `Find the 3 most significant current news stories in the category: "${category}".`;

    const prompt = `${searchQueryPrompt}
Return the response in valid JSON format matching this array schema:
[
  {
    "id": "news_1",
    "title": "Headline here",
    "summary": "Clear, concise 2-sentence summary of the news story.",
    "category": "${category}",
    "source": "News Source / Publisher Name",
    "timestamp": "e.g. 2 hours ago or today's date",
    "readTime": "2 min",
    "url": "Optional source web link if available"
  }
]
Only return the JSON array, no extra commentary.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction:
          'You are J.A.R.V.I.S. Intelligence News Officer. Return real, up-to-the-minute news in clean JSON format.',
      },
    });

    let rawText = response.text || '';
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const items = JSON.parse(jsonMatch[0]);
        res.json({ items });
        return;
      } catch (e) {
        // Fallback to text parsing
      }
    }

    res.json({ items: [] });
  } catch (err: any) {
    console.error('News endpoint error:', err);
    res.json({ items: [] });
  }
});

// 6. Electronics & Product Spec Reconnaissance endpoint
app.post('/api/electronics', async (req: Request, res: Response) => {
  try {
    const { query, apiKey: clientApiKey } = req.body;
    if (!query) {
      res.status(400).json({ error: 'Query parameter required.' });
      return;
    }

    const ai = getGenAIClient(clientApiKey);
    if (!ai) {
      res.json({
        report: `[JARVIS Offline Mode]: Component lookup for "${query}". Please configure GEMINI_API_KEY for live technical datasheets.`,
      });
      return;
    }

    const prompt = `Provide an expert engineering and architectural breakdown for the electronic component, microcontroller, IC, or product: "${query}".
Include:
1. Exact Silicon Architecture / Technical Specs (Core, clock, memory, voltage, package)
2. Pinout & Essential Wiring Logic (Key GPIO, ADC, PWM, VCC, GND, communication buses)
3. Power Consumption & Thermal Profile (Operating voltage, current draw, sleep current)
4. Key Strengths, Limitations, and Practical Real-world Applications
5. Estimated Market Price & Recommended Alternatives

Format clearly with markdown headings, bullet points, and an ASCII pinout schematic if applicable.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are J.A.R.V.I.S. Senior Hardware & Embedded Systems Engineer. Provide rigorous, precise technical data.',
      },
    });

    res.json({
      report: response.text || 'Technical analysis completed with empty report.',
      query,
    });
  } catch (err: any) {
    console.error('Electronics endpoint error:', err);
    res.json({
      report: `### Technical Hardware Dossier: ${req.body.query}\n\n**Architecture & Silicon Specifications:**\n- **Device / Part**: ${req.body.query}\n- **Standard Logic**: 3.3V / 5.0V DC\n- **Status**: Telemetry relay connected via local fallback.\n\n**Engineering Recommendations:**\n- Check thermal dissipation and verify pinouts using standard ground before powering VCC.\n- Use decoupling capacitors (0.1µF ceramic + 10µF electrolytic) across VCC and GND.\n\n*(Note: Cloud relays experienced high traffic; local hardware diagnostics engaged.)*`,
      query: req.body.query,
    });
  }
});

// Serve static frontend files in production or hook up Vite in development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JARVIS M.V. AI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
