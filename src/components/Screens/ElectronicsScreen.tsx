import React, { useState } from 'react';
import {
  Cpu,
  Smartphone,
  Zap,
  Layers,
  Search,
  Sliders,
  Check,
  Sparkles,
  Info,
  HelpCircle,
  ExternalLink,
  MessageSquare,
  Activity,
  Battery,
  Shield,
  Gauge,
} from 'lucide-react';
import { AppSettings, ElectronicProduct } from '../../types';
import { soundEffects } from '../../services/speech';

interface ElectronicsScreenProps {
  settings: AppSettings;
  onNavigateToChat?: (initialPrompt: string) => void;
}

export const ElectronicsScreen: React.FC<ElectronicsScreenProps> = ({ settings, onNavigateToChat }) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'resistor' | 'ai-lookup'>('presets');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('a2-core');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Resistor Color Code state (4-Band)
  const [band1, setBand1] = useState(1); // Brown (1)
  const [band2, setBand2] = useState(0); // Black (0)
  const [multiplier, setMultiplier] = useState(2); // Red (x100) -> 1,000 Ohm = 1k
  const [tolerance, setTolerance] = useState(5); // Gold (+-5%)

  const colorCodes = [
    { label: 'Black', value: 0, mult: 1, color: 'bg-black text-white border-slate-700' },
    { label: 'Brown', value: 1, mult: 10, color: 'bg-amber-900 text-amber-100 border-amber-800' },
    { label: 'Red', value: 2, mult: 100, color: 'bg-red-600 text-white border-red-500' },
    { label: 'Orange', value: 3, mult: 1000, color: 'bg-orange-500 text-black border-orange-400' },
    { label: 'Yellow', value: 4, mult: 10000, color: 'bg-yellow-400 text-black border-yellow-300' },
    { label: 'Green', value: 5, mult: 100000, color: 'bg-emerald-600 text-white border-emerald-500' },
    { label: 'Blue', value: 6, mult: 1000000, color: 'bg-blue-600 text-white border-blue-500' },
    { label: 'Violet', value: 7, mult: 10000000, color: 'bg-purple-600 text-white border-purple-500' },
    { label: 'Gray', value: 8, mult: 100000000, color: 'bg-gray-500 text-white border-gray-400' },
    { label: 'White', value: 9, mult: 1000000000, color: 'bg-slate-100 text-black border-slate-300' },
  ];

  const toleranceCodes = [
    { label: 'Gold (±5%)', value: 5, color: 'bg-amber-400 text-black' },
    { label: 'Silver (±10%)', value: 10, color: 'bg-slate-300 text-black' },
    { label: 'Brown (±1%)', value: 1, color: 'bg-amber-900 text-white' },
    { label: 'Red (±2%)', value: 2, color: 'bg-red-600 text-white' },
    { label: 'Green (±0.5%)', value: 0.5, color: 'bg-emerald-600 text-white' },
  ];

  const calculateResistance = () => {
    const rawOhms = (band1 * 10 + band2) * Math.pow(10, multiplier);
    if (rawOhms >= 1000000) {
      return `${(rawOhms / 1000000).toFixed(rawOhms % 1000000 === 0 ? 0 : 2)} MΩ (Megaohms)`;
    }
    if (rawOhms >= 1000) {
      return `${(rawOhms / 1000).toFixed(rawOhms % 1000 === 0 ? 0 : 2)} kΩ (Kilohms)`;
    }
    return `${rawOhms} Ω (Ohms)`;
  };

  const hardwarePresets: Record<string, ElectronicProduct> = {
    'a2-core': {
      id: 'a2-core',
      name: 'Samsung Galaxy A2 Core (Host Hardware Profile)',
      category: 'phone',
      description: 'Host Android smartphone tailored for ultra-lightweight execution. Powered by an energy-efficient octa-core Exynos architecture running Android 8.1 Oreo (Go Edition).',
      specs: {
        'Processor (SoC)': 'Samsung Exynos 7870 Octa (14 nm FinFET)',
        'CPU Architecture': '8x ARM Cortex-A53 @ 1.6 GHz (ARMv7 32-bit execution mode)',
        'GPU Subsystem': 'ARM Mali-T830 MP1 (Single Core)',
        'System Memory': '1.0 GB LPDDR3 RAM (Android Go zRAM kernel compressed)',
        'Storage Module': '8 GB / 16 GB eMMC 5.1 (MicroSD expandable up to 256 GB)',
        'Display Panel': '5.0 inch qHD PLS TFT (540 x 960 px, 220 ppi)',
        'Battery Capacity': '2600 mAh Li-Ion (Removable pack)',
        'OS Platform': 'Android 8.1.0 Oreo (Go edition), API Level 27',
        'Radio Telemetry': 'Wi-Fi 802.11 b/g/n, Bluetooth 4.2 LE, FM Radio, GPS/GLONASS',
      },
      pinoutOrDiagram: `[EXYNOS 7870 SOC BLOCK DIAGRAM]
+--------------------------------------------------------+
| 8x ARM Cortex-A53 (1.6 GHz)  [14nm FinFET Low Power]   |
| +----+ +----+ +----+ +----+   +----+ +----+ +----+ +----+ |
| | C0 | | C1 | | C2 | | C3 |   | C4 | | C5 | | C6 | | C7 | |
| +----+ +----+ +----+ +----+   +----+ +----+ +----+ +----+ |
+--------------------------------------------------------+
| GPU: Mali-T830 MP1      | Memory: 1GB LPDDR3 (933MHz)  |
| ISP: 13MP + 5MP Cam     | Modem: LTE Cat.6 2CA (300M)  |
+--------------------------------------------------------+`,
      practicalApplications: [
        'Optimal execution in JARVIS Lite Mode with 30 FPS canvas rendering',
        'Hardware WebAPK acceleration with Chrome WebView API 27',
        'AMOLED Black theme minimizes display backlight power draw',
        'Zero background CPU polling to preserve 2600mAh battery lifespan',
      ],
    },
    'esp32': {
      id: 'esp32',
      name: 'ESP32 Wi-Fi & BLE Microcontroller (NodeMCU/DevKit)',
      category: 'microcontroller',
      description: 'Ultra-versatile dual-core 32-bit IoT microcontroller module with built-in Wi-Fi and dual-mode Bluetooth (Classic + BLE).',
      specs: {
        'MCU Core': 'Tensilica Xtensa Dual-Core 32-bit LX6 @ 240 MHz (600 DMIPS)',
        'Internal Memory': '520 KB SRAM, 448 KB ROM, 16 KB RTC SRAM',
        'External Flash': '4 MB SPI Flash (up to 16 MB supported)',
        'Wireless Radios': 'Wi-Fi 802.11 b/g/n (up to 150 Mbps) + Bluetooth 4.2 BR/EDR & BLE',
        'Operating Voltage': '3.0 V to 3.6 V DC (Typical 3.3V, 5V input via USB VIN)',
        'Analog Channels': '18x 12-bit ADC channels, 2x 8-bit DAC outputs',
        'Digital Interfaces': '3x UART, 3x SPI, 2x I2C, 16x PWM, 10x Touch sensors',
        'Deep Sleep Power': '5 µA in Deep Sleep mode (RTC timer active)',
      },
      pinoutOrDiagram: `[ESP32 30-PIN DEVKIT V1 PINOUT GUIDE]
       +--------------------+
3V3    | [1]            [30]|  GND
EN     | [2]   [ESP32]  [29]|  GPIO23 (MOSI / PWM)
GPIO36 | [3] ADC1_CH0   [28]|  GPIO22 (I2C SCL)
GPIO39 | [4] ADC1_CH3   [27]|  GPIO1 (TXD0)
GPIO34 | [5] ADC1_CH6   [26]|  GPIO3 (RXD0)
GPIO35 | [6] ADC1_CH7   [25]|  GPIO21 (I2C SDA)
GPIO32 | [7] ADC1_CH4   [24]|  GND
GPIO33 | [8] ADC1_CH5   [23]|  GPIO19 (MISO)
GPIO25 | [9] DAC1       [22]|  GPIO18 (SCK)
GPIO26 | [10] DAC2      [21]|  GPIO5 (CS)
GPIO27 | [11] TOUCH7    [20]|  NC
GPIO14 | [12] HSPI_CLK  [19]|  GPIO17 (TX2)
GPIO12 | [13] HSPI_MISO [18]|  GPIO16 (RX2)
GND    | [14]           [17]|  GPIO4 (ADC2_CH0)
VIN(5V)| [15]           [16]|  GPIO2 (Onboard LED)
       +--------------------+`,
      practicalApplications: [
        'Home automation & IoT sensor node telemetry relay to JARVIS',
        'Smart environmental monitoring (connect DHT22, MQ-135, BME280)',
        'Bluetooth beacon tracking and wireless robotics controllers',
        'Stand-alone web servers and REST API endpoints on local Wi-Fi',
      ],
    },
    'arduino-uno': {
      id: 'arduino-uno',
      name: 'Arduino Uno R3 (ATmega328P)',
      category: 'microcontroller',
      description: 'The global standard prototyping board for electronics engineers, hobbyists, and roboticists.',
      specs: {
        'Microcontroller': 'Microchip ATmega328P 8-bit AVR RISC',
        'Clock Speed': '16 MHz Crystal Oscillator',
        'Operating Logic': '5.0 V DC (Input voltage recommended: 7-12V)',
        'Flash Memory': '32 KB (0.5 KB used by Optiboot bootloader)',
        'SRAM / EEPROM': '2 KB SRAM, 1 KB EEPROM',
        'Digital I/O': '14 pins (6 provide 8-bit hardware PWM output)',
        'Analog Inputs': '6 channels (10-bit ADC resolution: 0 to 1023)',
        'DC Current per Pin': '20 mA recommended (40 mA absolute max)',
      },
      pinoutOrDiagram: `[ARDUINO UNO R3 PIN LAYOUT]
Digital Header: [0(RX), 1(TX), 2, 3~, 4, 5~, 6~, 7, 8, 9~, 10~, 11~, 12, 13]
Analog Header : [A0, A1, A2, A3, A4(SDA), A5(SCL)]
Power Pins    : [IOREF, RESET, 3.3V, 5V, GND, GND, VIN]
(~ designates 490Hz / 980Hz PWM support)`,
      practicalApplications: [
        'Motor control (H-Bridge L298N, Servos SG90, Steppers 28BYJ-48)',
        'Analog sensor readings (photoresistors, thermistors, potentiometers)',
        'Beginner STEM education and hardware firmware logic testing',
      ],
    },
    'sensor-hc-sr04': {
      id: 'sensor-hc-sr04',
      name: 'HC-SR04 Ultrasonic Distance Sensor',
      category: 'sensor',
      description: 'Non-contact ultrasonic sonar distance measurement module ranging from 2 cm to 400 cm with 3mm precision.',
      specs: {
        'Working Voltage': '5.0 V DC',
        'Working Current': '15 mA',
        'Working Frequency': '40 kHz Acoustic Ultrasonic Burst',
        'Max / Min Range': '400 cm (4 meters) / 2 cm',
        'Measuring Angle': '15 Degrees cone',
        'Trigger Signal': '10 µs High level TTL pulse',
        'Formula': 'Distance (cm) = (Echo Time (µs) * 0.0343) / 2',
      },
      pinoutOrDiagram: `[HC-SR04 PINOUT]
Pin 1: VCC   -> +5V DC
Pin 2: TRIG  -> Send 10 microsecond HIGH trigger pulse
Pin 3: ECHO  -> Measure pulse width duration (3.3V divider needed for ESP32!)
Pin 4: GND   -> Power Ground 0V`,
      practicalApplications: [
        'Obstacle avoidance systems for autonomous rovers',
        'Water tank fluid level monitoring',
        'Presence detection and contactless security alarms',
      ],
    },
    'ic-555': {
      id: 'ic-555',
      name: 'NE555 Precision Timer IC',
      category: 'ic',
      description: 'The iconic 8-pin precision timer producing accurate oscillation delays in Astable, Monostable, and Bistable circuit configurations.',
      specs: {
        'Supply Voltage (Vcc)': '4.5 V to 16.0 V DC (Typical 5V or 12V)',
        'Output Current': 'Up to 200 mA source or sink capability',
        'Max Frequency': 'Up to 500 kHz operation',
        'Operating Modes': 'Astable (Square wave generator), Monostable (One-shot pulse), Bistable (Flip-flop)',
        'Timing Equation (Astable)': 'f = 1.44 / ((R1 + 2*R2) * C)',
      },
      pinoutOrDiagram: `[NE555 8-PIN DIP DIAGRAM]
         +---v---+
GND   [1]|       |[8] VCC (+4.5V to +16V)
TRIG  [2]| NE555 |[7] DISCHARGE
OUT   [3]| TIMER |[6] THRESHOLD
RESET [4]|       |[5] CONTROL VOLTAGE (0.01uF to GND)
         +-------+`,
      practicalApplications: [
        'PWM LED dimmers and buzzer frequency tone generators',
        'Switch debounce circuits and power-on delay relays',
        'Analog clock pulse generators for digital logic counters',
      ],
    },
  };

  const handleAiLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsLoadingAi(true);
    setAiReport(null);
    if (settings.soundFX) soundEffects.playPing('click');

    try {
      const res = await fetch('/api/electronics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          apiKey: settings.customGeminiKey || undefined,
        }),
      });

      if (!res.ok) throw new Error('Electronics laboratory analysis failed');
      const data = await res.json();
      setAiReport(data.report || 'No technical telemetry returned for this component.');
    } catch (err: any) {
      setAiReport(`[JARVIS Laboratory Notice]: Technical spec lookup encountered an error (${err.message}). Try asking in the Chat module.`);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const currentPreset = hardwarePresets[selectedPresetId] || hardwarePresets['a2-core'];

  return (
    <div className="space-y-4 pb-20 p-3 max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-base font-bold font-hud text-cyan-200 tracking-wider">
              ELECTRONICS & HARDWARE LAB
            </h1>
            <p className="text-[11px] font-mono text-slate-400">
              Component Pinouts, Resistor Calculator & Device Architecture
            </p>
          </div>
        </div>
      </div>

      {/* Mode Sub-navigation */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/50 border border-cyan-500/25">
        <button
          onClick={() => {
            if (settings.soundFX) soundEffects.playPing('click');
            setActiveTab('presets');
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'presets'
              ? 'bg-cyan-500 text-black shadow-sm shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Hardware Catalog</span>
        </button>

        <button
          onClick={() => {
            if (settings.soundFX) soundEffects.playPing('click');
            setActiveTab('resistor');
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'resistor'
              ? 'bg-cyan-500 text-black shadow-sm shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Resistor Calc</span>
        </button>

        <button
          onClick={() => {
            if (settings.soundFX) soundEffects.playPing('click');
            setActiveTab('ai-lookup');
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'ai-lookup'
              ? 'bg-cyan-500 text-black shadow-sm shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>AI Spec Finder</span>
        </button>
      </div>

      {/* TAB 1: Hardware Catalog & Presets */}
      {activeTab === 'presets' && (
        <div className="space-y-4">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {Object.values(hardwarePresets).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (settings.soundFX) soundEffects.playPing('click');
                  setSelectedPresetId(item.id);
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-mono whitespace-nowrap transition active:scale-95 flex items-center gap-1.5 ${
                  selectedPresetId === item.id
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-400 shadow-sm shadow-cyan-500/30'
                    : 'bg-black/40 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {item.id === 'a2-core' && <Smartphone className="w-3.5 h-3.5 text-cyan-400" />}
                {item.id.includes('esp') && <Zap className="w-3.5 h-3.5 text-teal-400" />}
                {item.id.includes('arduino') && <Cpu className="w-3.5 h-3.5 text-blue-400" />}
                {item.id.includes('sensor') && <Activity className="w-3.5 h-3.5 text-amber-400" />}
                {item.id.includes('ic') && <Layers className="w-3.5 h-3.5 text-purple-400" />}
                <span>{item.name.split('(')[0].trim()}</span>
              </button>
            ))}
          </div>

          {/* Active Preset Spec Card */}
          <div className="hud-panel rounded-2xl border border-cyan-500/35 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-cyan-500/20">
              <div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  {currentPreset.category}
                </span>
                <h2 className="text-base font-bold font-hud text-cyan-200 mt-1">
                  {currentPreset.name}
                </h2>
              </div>

              {onNavigateToChat && (
                <button
                  onClick={() =>
                    onNavigateToChat(
                      `JARVIS, explain the technical pinout and coding examples for: ${currentPreset.name}.`
                    )
                  }
                  className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Consult JARVIS</span>
                </button>
              )}
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              {currentPreset.description}
            </p>

            {/* Technical Specifications Grid */}
            <div>
              <h3 className="text-xs font-bold font-hud text-cyan-300 tracking-wider mb-2 uppercase">
                HARDWARE SPECIFICATIONS MATRIX
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {Object.entries(currentPreset.specs).map(([label, val]) => (
                  <div
                    key={label}
                    className="p-2.5 rounded-xl bg-black/40 border border-cyan-500/20 flex flex-col justify-between"
                  >
                    <span className="text-[10px] text-cyan-400/80 uppercase">{label}</span>
                    <span className="text-slate-200 font-semibold mt-0.5">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pinout / ASCII Schematic */}
            {currentPreset.pinoutOrDiagram && (
              <div>
                <h3 className="text-xs font-bold font-hud text-cyan-300 tracking-wider mb-2 uppercase">
                  PINOUT ARCHITECTURE & SCHEMATICS
                </h3>
                <pre className="p-3 rounded-xl bg-black/80 border border-cyan-500/30 text-[11px] font-mono text-cyan-300 overflow-x-auto leading-tight">
                  {currentPreset.pinoutOrDiagram}
                </pre>
              </div>
            )}

            {/* Practical Applications */}
            <div>
              <h3 className="text-xs font-bold font-hud text-cyan-300 tracking-wider mb-2 uppercase">
                RECOMMENDED IMPLEMENTATIONS & USE-CASES
              </h3>
              <ul className="space-y-1.5">
                {currentPreset.practicalApplications.map((app, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-slate-300 font-sans"
                  >
                    <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{app}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Resistor Color Code Calculator */}
      {activeTab === 'resistor' && (
        <div className="hud-panel rounded-2xl border border-cyan-500/35 p-4 sm:p-5 space-y-4">
          <div className="pb-3 border-b border-cyan-500/20">
            <h2 className="text-sm font-bold font-hud text-cyan-200">
              4-BAND RESISTOR COLOR CODE CALCULATOR
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Calculate standard axial resistor values and tolerance in real-time
            </p>
          </div>

          {/* Graphical Resistor Representation */}
          <div className="p-4 rounded-xl bg-black/50 border border-cyan-500/30 flex items-center justify-center">
            <div className="flex items-center">
              <div className="w-8 h-1.5 bg-slate-400 rounded-l" />
              <div className="relative w-48 h-14 bg-amber-100 rounded-xl border border-amber-300 flex items-center justify-around px-4 shadow-inner">
                {/* Band 1 */}
                <div
                  className={`w-3.5 h-full ${colorCodes[band1].color} border-x shadow`}
                  title={`Band 1: ${colorCodes[band1].label}`}
                />
                {/* Band 2 */}
                <div
                  className={`w-3.5 h-full ${colorCodes[band2].color} border-x shadow`}
                  title={`Band 2: ${colorCodes[band2].label}`}
                />
                {/* Multiplier */}
                <div
                  className={`w-3.5 h-full ${colorCodes[multiplier].color} border-x shadow`}
                  title={`Multiplier: x10^${multiplier}`}
                />
                {/* Tolerance */}
                <div
                  className={`w-3.5 h-full ml-4 ${
                    tolerance === 5 ? 'bg-amber-400' : tolerance === 10 ? 'bg-slate-300' : 'bg-amber-900'
                  } border-x shadow`}
                  title={`Tolerance: ±${tolerance}%`}
                />
              </div>
              <div className="w-8 h-1.5 bg-slate-400 rounded-r" />
            </div>
          </div>

          {/* Result Banner */}
          <div className="p-3.5 rounded-xl bg-cyan-950/60 border border-cyan-400/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div>
              <div className="text-[11px] font-mono text-cyan-400 uppercase">
                CALCULATED RESISTANCE VALUE:
              </div>
              <div className="text-xl font-hud font-bold text-cyan-100">
                {calculateResistance()}
              </div>
            </div>
            <div className="text-xs font-mono text-slate-300 px-3 py-1 rounded-lg bg-black/40 border border-cyan-500/20">
              Tolerance: <strong className="text-cyan-300">±{tolerance}%</strong>
            </div>
          </div>

          {/* Color Selector Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
            {/* Band 1 */}
            <div className="space-y-1">
              <label className="text-[10px] text-cyan-400 font-bold block">1ST DIGIT</label>
              <select
                value={band1}
                onChange={(e) => setBand1(Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-black/60 border border-cyan-500/30 text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                {colorCodes.slice(1).map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.value} - {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Band 2 */}
            <div className="space-y-1">
              <label className="text-[10px] text-cyan-400 font-bold block">2ND DIGIT</label>
              <select
                value={band2}
                onChange={(e) => setBand2(Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-black/60 border border-cyan-500/30 text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                {colorCodes.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.value} - {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Multiplier */}
            <div className="space-y-1">
              <label className="text-[10px] text-cyan-400 font-bold block">MULTIPLIER</label>
              <select
                value={multiplier}
                onChange={(e) => setMultiplier(Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-black/60 border border-cyan-500/30 text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                {colorCodes.map((c) => (
                  <option key={c.value} value={c.value}>
                    ×10^{c.value} ({c.label})
                  </option>
                ))}
              </select>
            </div>

            {/* Tolerance */}
            <div className="space-y-1">
              <label className="text-[10px] text-cyan-400 font-bold block">TOLERANCE</label>
              <select
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-black/60 border border-cyan-500/30 text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                {toleranceCodes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AI Electronic Spec Finder */}
      {activeTab === 'ai-lookup' && (
        <div className="hud-panel rounded-2xl border border-cyan-500/35 p-4 sm:p-5 space-y-4">
          <div className="pb-3 border-b border-cyan-500/20">
            <h2 className="text-sm font-bold font-hud text-cyan-200">
              AI ELECTRONICS & PRODUCT SPEC RECONNAISSANCE
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Search any microcontroller, IC, sensor, smartphone, or electronic component
            </p>
          </div>

          <form onSubmit={handleAiLookup} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., STM32 Blue Pill, LM358, Samsung Galaxy A2 Core, RTX 4090..."
              className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
            />
            <button
              type="submit"
              disabled={isLoadingAi || !searchQuery.trim()}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-black font-hud text-xs font-bold transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Inspect</span>
            </button>
          </form>

          {/* Quick Suggestions */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono scrollbar-none">
            <span className="text-[10px] text-slate-500 shrink-0 uppercase">Try:</span>
            {['Samsung Exynos 7870', 'Raspberry Pi 5', 'STM32F103C8T6', 'LM7805 Regulator', 'OLED SSD1306'].map(
              (query) => (
                <button
                  key={query}
                  onClick={() => {
                    setSearchQuery(query);
                    if (settings.soundFX) soundEffects.playPing('click');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-black/40 border border-slate-800 text-slate-400 hover:text-slate-200 text-[11px] whitespace-nowrap"
                >
                  {query}
                </button>
              )
            )}
          </div>

          {/* AI Analysis Result */}
          {isLoadingAi ? (
            <div className="p-8 text-center rounded-xl bg-black/40 border border-cyan-500/20">
              <Cpu className="w-6 h-6 mx-auto text-cyan-400 animate-spin mb-2" />
              <p className="text-xs font-mono text-cyan-300">
                Retrieving silicon architecture, pin assignments, and electrical characteristics...
              </p>
            </div>
          ) : aiReport ? (
            <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-cyan-400 pb-2 border-b border-cyan-500/20">
                <span className="font-bold font-hud">TELEMETRY DOSSIER</span>
                {onNavigateToChat && (
                  <button
                    onClick={() =>
                      onNavigateToChat(
                        `JARVIS, discuss and build code for this electronic component: ${searchQuery}.`
                      )
                    }
                    className="flex items-center gap-1 text-[11px] text-cyan-300 hover:underline"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Open in Chat</span>
                  </button>
                )}
              </div>
              <div className="text-xs font-sans text-slate-200 leading-relaxed whitespace-pre-line">
                {aiReport}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
