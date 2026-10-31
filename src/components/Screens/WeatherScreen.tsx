import React, { useState, useEffect } from 'react';
import {
  CloudSun,
  Cloud,
  Sun,
  CloudRain,
  CloudLightning,
  CloudSnow,
  Wind,
  Droplets,
  Gauge,
  Compass,
  Search,
  MapPin,
  RefreshCw,
  Volume2,
  VolumeX,
  Sparkles,
  Thermometer,
  Shield,
  Eye,
} from 'lucide-react';
import { AppSettings, WeatherData } from '../../types';
import { soundEffects, voiceSynthesizer } from '../../services/speech';

interface WeatherScreenProps {
  settings: AppSettings;
  onSendDirective?: (text: string) => void;
}

export const WeatherScreen: React.FC<WeatherScreenProps> = ({ settings, onSendDirective }) => {
  const [cityQuery, setCityQuery] = useState('');
  const [activeCity, setActiveCity] = useState('Dhaka');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');

  const popularCities = [
    { name: 'Dhaka', country: 'Bangladesh', lat: 23.8103, lon: 90.4125 },
    { name: 'Chittagong', country: 'Bangladesh', lat: 22.3569, lon: 91.7832 },
    { name: 'Sylhet', country: 'Bangladesh', lat: 24.8949, lon: 91.8687 },
    { name: 'New York', country: 'United States', lat: 40.7128, lon: -74.006 },
    { name: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278 },
    { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503 },
  ];

  // Helper to decode Open-Meteo WMO weather codes
  const decodeWmoCode = (code: number): { label: string; icon: string } => {
    if (code === 0) return { label: 'Clear Sky', icon: 'sun' };
    if (code === 1 || code === 2) return { label: 'Partly Cloudy', icon: 'cloud-sun' };
    if (code === 3) return { label: 'Overcast', icon: 'cloud' };
    if (code >= 45 && code <= 48) return { label: 'Foggy / Haze', icon: 'cloud' };
    if (code >= 51 && code <= 67) return { label: 'Rain Showers', icon: 'rain' };
    if (code >= 71 && code <= 77) return { label: 'Snowfall', icon: 'snow' };
    if (code >= 80 && code <= 82) return { label: 'Heavy Rain Showers', icon: 'rain' };
    if (code >= 95 && code <= 99) return { label: 'Thunderstorm', icon: 'storm' };
    return { label: 'Atmospheric Conditions', icon: 'cloud-sun' };
  };

  const fetchWeather = async (lat: number, lon: number, cityName: string, countryName: string = '') => {
    setIsLoading(true);
    setErrorMsg(null);
    if (settings.soundFX) soundEffects.playPing('click');

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,surface_pressure,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Atmospheric satellite connection failed');
      const data = await res.json();

      const current = data.current || {};
      const daily = data.daily || {};
      const wmo = decodeWmoCode(current.weather_code || 0);

      // Build 5-day forecast
      const forecastDays: WeatherData['forecast'] = [];
      const times = daily.time || [];
      for (let i = 0; i < Math.min(times.length, 5); i++) {
        const dateObj = new Date(times[i]);
        const dayLabel = i === 0 ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const code = daily.weather_code?.[i] ?? 0;
        forecastDays.push({
          day: dayLabel,
          tempMax: Math.round(daily.temperature_2m_max?.[i] ?? current.temperature_2m),
          tempMin: Math.round(daily.temperature_2m_min?.[i] ?? current.temperature_2m - 4),
          condition: decodeWmoCode(code).label,
        });
      }

      // Synthesize JARVIS environmental advisory
      let advice = `Atmospheric pressure is nominal at ${Math.round(current.surface_pressure || 1013)} hPa. `;
      if (current.temperature_2m > 30) {
        advice += `High thermal load detected (${Math.round(current.temperature_2m)}°C). Recommend optimal hydration and cooling protocols.`;
      } else if (current.temperature_2m < 15) {
        advice += `Cool environmental baseline. Recommend thermal layering, Sir.`;
      } else {
        advice += `Mild ambient temperatures. Ideal operational parameters for outdoor traversal.`;
      }
      if (current.weather_code >= 51 && current.weather_code <= 99) {
        advice += ` Precipitation alert: Ensure water-resistant gear.`;
      }

      const compiled: WeatherData = {
        city: cityName,
        country: countryName,
        temp: Math.round(current.temperature_2m ?? 25),
        apparentTemp: Math.round(current.apparent_temperature ?? current.temperature_2m ?? 25),
        condition: wmo.label,
        conditionCode: current.weather_code || 0,
        humidity: Math.round(current.relative_humidity_2m ?? 60),
        windSpeed: Math.round(current.wind_speed_10m ?? 10),
        pressure: Math.round(current.surface_pressure ?? 1013),
        forecast: forecastDays,
        aiBriefing: advice,
        updatedAt: Date.now(),
      };

      setWeatherData(compiled);
      setActiveCity(cityName);
    } catch (err: any) {
      console.error('Weather error:', err);
      setErrorMsg(err.message || 'Unable to retrieve meteorological telemetry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = cityQuery.trim();
    if (!query) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
      const res = await fetch(geoUrl);
      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        throw new Error(`Location "${query}" not found in atmospheric registry.`);
      }
      const loc = data.results[0];
      await fetchWeather(loc.latitude, loc.longitude, loc.name, loc.country || '');
      setCityQuery('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Geocoding query failed.');
      setIsLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation sensor is not supported by this browser.');
      return;
    }
    setIsLoading(true);
    if (settings.soundFX) soundEffects.playPing('click');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        await fetchWeather(latitude, longitude, 'Local Coordinate Zone', 'GPS');
      },
      (err) => {
        setIsLoading(false);
        setErrorMsg('GPS location access denied. Please select a city above.');
      },
      { timeout: 8000 }
    );
  };

  const handleSpeakWeather = () => {
    if (!weatherData) return;

    if (isSpeaking && voiceSynthesizer.isSpeaking()) {
      voiceSynthesizer.stop();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `Meteorological report for ${weatherData.city}. Current temperature is ${weatherData.temp} degrees Celsius, conditions are ${weatherData.condition}. Relative humidity is ${weatherData.humidity} percent, with winds at ${weatherData.windSpeed} kilometers per hour. ${weatherData.aiBriefing}`;

    setIsSpeaking(true);
    voiceSynthesizer.speak(textToSpeak, {
      lang: settings.voiceLang,
      gender: settings.voiceGender,
      speed: settings.voiceSpeed,
      pitch: settings.voicePitch,
      volume: settings.voiceVolume,
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  // Initial load default city
  useEffect(() => {
    fetchWeather(23.8103, 90.4125, 'Dhaka', 'Bangladesh');
  }, []);

  const renderWeatherIcon = (code: number, className = 'w-8 h-8') => {
    if (code === 0) return <Sun className={`${className} text-amber-400 animate-spin-slow`} />;
    if (code === 1 || code === 2) return <CloudSun className={`${className} text-amber-300`} />;
    if (code === 3 || (code >= 45 && code <= 48)) return <Cloud className={`${className} text-slate-300`} />;
    if (code >= 51 && code <= 82) return <CloudRain className={`${className} text-cyan-400 animate-pulse`} />;
    if (code >= 95) return <CloudLightning className={`${className} text-purple-400 animate-bounce`} />;
    if (code >= 71 && code <= 77) return <CloudSnow className={`${className} text-blue-200`} />;
    return <CloudSun className={`${className} text-cyan-300`} />;
  };

  const formatTemp = (celsius: number) => {
    if (tempUnit === 'F') {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${celsius}°C`;
  };

  return (
    <div className="space-y-4 pb-20 p-3 max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <CloudSun className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-base font-bold font-hud text-cyan-200 tracking-wider">
              ATMOSPHERIC RECONNAISSANCE
            </h1>
            <p className="text-[11px] font-mono text-slate-400">
              Live Meteorological Sensors & Forecast Telemetry
            </p>
          </div>
        </div>

        {/* C/F Unit Toggle */}
        <div className="flex items-center gap-1 bg-black/50 p-0.5 rounded-lg border border-cyan-500/30 text-xs font-mono">
          <button
            onClick={() => setTempUnit('C')}
            className={`px-2 py-0.5 rounded ${tempUnit === 'C' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            °C
          </button>
          <button
            onClick={() => setTempUnit('F')}
            className={`px-2 py-0.5 rounded ${tempUnit === 'F' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            °F
          </button>
        </div>
      </div>

      {/* Search & Location Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleCitySearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              placeholder="Search city (Dhaka, Chittagong, New York...)"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !cityQuery.trim()}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-black font-hud text-xs font-bold transition flex items-center gap-1.5"
          >
            <span>Track</span>
          </button>
        </form>

        <button
          onClick={handleUseCurrentLocation}
          disabled={isLoading}
          className="px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center justify-center gap-1.5 transition active:scale-95"
          title="Detect GPS Location"
        >
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <span>GPS Auto-Detect</span>
        </button>
      </div>

      {/* Quick City Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono scrollbar-none">
        <span className="text-[10px] text-slate-500 shrink-0 uppercase tracking-wider">Presets:</span>
        {popularCities.map((c) => (
          <button
            key={c.name}
            onClick={() => fetchWeather(c.lat, c.lon, c.name, c.country)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition active:scale-95 ${
              activeCity === c.name
                ? 'bg-cyan-950 text-cyan-300 border-cyan-400'
                : 'bg-black/40 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-mono flex items-center justify-between">
          <span>{errorMsg}</span>
          <button
            onClick={() => fetchWeather(23.8103, 90.4125, 'Dhaka', 'Bangladesh')}
            className="underline ml-2 text-rose-300"
          >
            Reset to Dhaka
          </button>
        </div>
      )}

      {/* Main Weather Card */}
      {weatherData && (
        <div className="hud-panel rounded-2xl border border-cyan-500/40 p-4 sm:p-5 relative overflow-hidden space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-500/20">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <h2 className="text-lg font-bold font-hud text-cyan-200">
                  {weatherData.city}
                </h2>
                {weatherData.country && (
                  <span className="text-xs font-mono text-slate-400">
                    ({weatherData.country})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Observed: {new Date(weatherData.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSpeakWeather}
                className={`p-2 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition ${
                  isSpeaking
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500 animate-pulse'
                    : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/60'
                }`}
                title="Listen to Atmospheric Briefing"
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span className="text-[11px] font-hud">
                  {isSpeaking ? 'Mute Briefing' : 'Voice Report'}
                </span>
              </button>

              <button
                onClick={() => {
                  const cityMatch = popularCities.find((c) => c.name === weatherData.city);
                  if (cityMatch) fetchWeather(cityMatch.lat, cityMatch.lon, cityMatch.name, cityMatch.country);
                  else handleCitySearch({ preventDefault: () => {} } as any);
                }}
                disabled={isLoading}
                className="p-2 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-cyan-400 hover:text-cyan-200 transition"
                title="Refresh Satellite Data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Primary Temperature & Condition Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-cyan-950/50 border border-cyan-500/30">
                {renderWeatherIcon(weatherData.conditionCode, 'w-12 h-12')}
              </div>
              <div>
                <div className="text-4xl font-extrabold font-hud text-cyan-100 tracking-tight">
                  {formatTemp(weatherData.temp)}
                </div>
                <div className="text-sm font-semibold text-cyan-300">
                  {weatherData.condition}
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  Apparent: {formatTemp(weatherData.apparentTemp)}
                </div>
              </div>
            </div>

            {/* Sensor Telemetry Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-black/40 border border-cyan-500/20 text-center">
                <Droplets className="w-4 h-4 mx-auto text-blue-400 mb-1" />
                <div className="text-[10px] text-slate-400 font-mono">HUMIDITY</div>
                <div className="text-xs font-bold font-hud text-slate-200 mt-0.5">
                  {weatherData.humidity}%
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 border border-cyan-500/20 text-center">
                <Wind className="w-4 h-4 mx-auto text-teal-400 mb-1" />
                <div className="text-[10px] text-slate-400 font-mono">WIND VELOCITY</div>
                <div className="text-xs font-bold font-hud text-slate-200 mt-0.5">
                  {weatherData.windSpeed} km/h
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 border border-cyan-500/20 text-center">
                <Gauge className="w-4 h-4 mx-auto text-purple-400 mb-1" />
                <div className="text-[10px] text-slate-400 font-mono">PRESSURE</div>
                <div className="text-xs font-bold font-hud text-slate-200 mt-0.5">
                  {weatherData.pressure} hPa
                </div>
              </div>
            </div>
          </div>

          {/* JARVIS Tactical Environmental Advisory */}
          {weatherData.aiBriefing && (
            <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-950/60 to-blue-950/40 border border-cyan-500/30 text-xs font-sans text-cyan-100 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-cyan-300 font-mono text-[11px] block mb-0.5">
                  JARVIS ENVIRONMENTAL ANALYSIS:
                </span>
                <span className="leading-relaxed text-slate-200">{weatherData.aiBriefing}</span>
              </div>
            </div>
          )}

          {/* 5-Day Forecast Grid */}
          <div>
            <h3 className="text-xs font-bold font-hud text-cyan-300 tracking-wider mb-2 uppercase">
              5-DAY PROJECTION MATRIX
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {weatherData.forecast.map((f, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-black/40 border border-cyan-500/20 text-center flex flex-col items-center justify-between"
                >
                  <span className="text-[11px] font-mono font-bold text-cyan-300">{f.day}</span>
                  <div className="my-1.5">
                    {renderWeatherIcon(
                      f.condition.includes('Rain') ? 61 : f.condition.includes('Cloud') ? 2 : 0,
                      'w-6 h-6'
                    )}
                  </div>
                  <div className="text-[10px] text-slate-300 font-sans line-clamp-1 mb-1">
                    {f.condition}
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-200">
                    {formatTemp(f.tempMax)} <span className="text-[10px] text-slate-400">/ {formatTemp(f.tempMin)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
