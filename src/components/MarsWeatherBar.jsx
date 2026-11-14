import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Wind, 
  Thermometer, 
  Gauge, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  RefreshCw,
  Clock
} from 'lucide-react';
import { DEFAULT_MARS_WEATHER } from '../data/marsMissionData';
import { marsAudio } from '../utils/audioSystem';
import { TRANSLATIONS } from '../data/translations';

export default function MarsWeatherBar({ weather, setWeather, lang = 'en' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const [isMuted, setIsMuted] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch live MSL REMS weather from NASA JSON feed
  const fetchLiveWeather = async () => {
    setIsUpdating(true);
    marsAudio.playBlip();

    try {
      const res = await fetch('https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json');
      if (res.ok) {
        const data = await res.json();
        if (data.soles && data.soles.length > 0) {
          const latest = data.soles[0];
          setWeather({
            sol: parseInt(latest.sol) || DEFAULT_MARS_WEATHER.sol,
            terrestrial_date: latest.terrestrial_date || DEFAULT_MARS_WEATHER.terrestrial_date,
            min_temp: parseInt(latest.min_temp) || DEFAULT_MARS_WEATHER.min_temp,
            max_temp: parseInt(latest.max_temp) || DEFAULT_MARS_WEATHER.max_temp,
            pressure: parseInt(latest.pressure) || DEFAULT_MARS_WEATHER.pressure,
            pressure_string: latest.pressure_string || DEFAULT_MARS_WEATHER.pressure_string,
            atmo_opacity: latest.atmo_opacity || DEFAULT_MARS_WEATHER.atmo_opacity,
            wind_speed: latest.wind_speed !== '--' ? latest.wind_speed : DEFAULT_MARS_WEATHER.wind_speed,
            wind_direction: latest.wind_direction !== '--' ? latest.wind_direction : DEFAULT_MARS_WEATHER.wind_direction,
            local_uv_irradiance_index: latest.local_uv_irradiance_index || DEFAULT_MARS_WEATHER.local_uv_irradiance_index,
            ground_min_temp: parseInt(latest.min_gts_temp) || DEFAULT_MARS_WEATHER.ground_min_temp,
            ground_max_temp: parseInt(latest.max_gts_temp) || DEFAULT_MARS_WEATHER.ground_max_temp,
            radiation_dose: DEFAULT_MARS_WEATHER.radiation_dose,
            dust_tau: DEFAULT_MARS_WEATHER.dust_tau,
            sunrise: latest.sunrise || DEFAULT_MARS_WEATHER.sunrise,
            sunset: latest.sunset || DEFAULT_MARS_WEATHER.sunset
          });
        }
      }
    } catch (e) {
      console.warn('Using baseline Mars weather telemetry:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchLiveWeather();
  }, []);

  const handleToggleMute = () => {
    const muted = marsAudio.toggleMute();
    setIsMuted(muted);
    if (!muted) marsAudio.playBlip();
  };

  return (
    <div className="w-full bg-slate-950/95 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-300 z-30 select-none">
      
      {/* Left: Mission Sol & Active Time */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-mars-orange/15 border border-mars-orange/30 text-mars-orange">
          <Clock className="w-3.5 h-3.5 animate-pulse" />
          <span className="font-orbitron font-bold">{t.solLabel} {weather.sol}</span>
        </div>
        <span className="hidden sm:inline text-slate-500">•</span>
        <span className="hidden sm:inline text-slate-400">{t.earthDate}: {weather.terrestrial_date}</span>
      </div>

      {/* Center: Live Environmental Readings */}
      <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto py-0.5">
        
        {/* Air Temperature */}
        <div className="flex items-center gap-1.5" title={t.airTemp}>
          <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            <strong className="text-white">{weather.max_temp}°C</strong> / <span className="text-cyan-300">{weather.min_temp}°C</span>
          </span>
        </div>

        {/* Atmospheric Pressure */}
        <div className="flex items-center gap-1.5" title={t.pressure}>
          <Gauge className="w-3.5 h-3.5 text-amber-400" />
          <span>{weather.pressure} Pa</span>
        </div>

        {/* Wind */}
        <div className="flex items-center gap-1.5" title={t.wind}>
          <Wind className="w-3.5 h-3.5 text-blue-400" />
          <span>{weather.wind_speed}</span>
        </div>

        {/* Sky Opacity & Dust */}
        <div className="flex items-center gap-1.5" title={t.skyOpacity}>
          <Sun className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-yellow-200">
            {lang === 'uz' ? (weather.atmo_opacity_uz || 'Quyoshli / Ochiq') : weather.atmo_opacity}
          </span>
        </div>

        {/* Radiation */}
        <div className="hidden md:flex items-center gap-1.5" title={t.radiation}>
          <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-purple-300">0.24 mSv/d ({t.nominal})</span>
        </div>
      </div>

      {/* Right: Audio Control & Refresh */}
      <div className="flex items-center gap-2">
        <button
          onClick={fetchLiveWeather}
          disabled={isUpdating}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
          title={t.refreshWeather}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin text-mars-orange' : ''}`} />
        </button>

        <button
          onClick={handleToggleMute}
          className={`p-1.5 rounded transition ${
            isMuted ? 'text-red-400 bg-red-950/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title={isMuted ? t.unmuteAudio : t.muteAudio}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>

    </div>
  );
}
