import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Battery, 
  Wind, 
  Gauge, 
  Radio, 
  AlertTriangle, 
  Camera, 
  Compass, 
  Crosshair, 
  Minimize,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { marsAudio } from '../utils/audioSystem';
import { TRANSLATIONS } from '../data/translations';

export default function AstronautHUD({ 
  waypoints, 
  currentWaypointIndex, 
  setCurrentWaypointIndex, 
  zone,
  weather,
  onExitHUD,
  lang = 'en'
}) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const currentWp = waypoints[currentWaypointIndex] || waypoints[0];

  // Astronaut Biometrics Simulation
  const [heartRate, setHeartRate] = useState(78);
  const [o2Level, setO2Level] = useState(86);
  const [suitPressure] = useState(4.3);
  const [batteryPct] = useState(79);
  const [heading, setHeading] = useState(142);
  const [visorMode, setVisorMode] = useState('optical');
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  const [flashActive, setFlashActive] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const targetHr = (currentWp?.slopeDeg || 5) > 15 ? 112 : 76;
      setHeartRate(prev => Math.round(prev + (targetHr - prev) * 0.1 + (Math.random() * 4 - 2)));
      setO2Level(prev => Math.max(15, Number((prev - 0.01).toFixed(2))));
      setHeading(prev => (prev + (Math.random() * 2 - 1) + 360) % 360);
    }, 2000);

    return () => clearInterval(timer);
  }, [currentWp]);

  useEffect(() => {
    if ((currentWp?.slopeDeg || 0) > 18) {
      setIsAlertActive(true);
      marsAudio.playWarningAlarm();
    } else {
      setIsAlertActive(false);
    }
  }, [currentWp]);

  const takeSnapshot = () => {
    setFlashActive(true);
    marsAudio.playBlip();
    setTimeout(() => setFlashActive(false), 200);

    const newShot = {
      id: Date.now(),
      target: lang === 'uz' ? (currentWp?.name_uz || currentWp?.name) : currentWp?.name,
      timestamp: new Date().toLocaleTimeString(),
      coords: `${currentWp?.lat.toFixed(4)}°, ${currentWp?.lng.toFixed(4)}°`,
      mineral: lang === 'uz' ? (currentWp?.mineralogy_uz || currentWp?.mineralogy) : currentWp?.mineralogy
    };
    setSnapshots([newShot, ...snapshots]);
  };

  const wpName = lang === 'uz' ? (currentWp?.name_uz || currentWp?.name) : currentWp?.name;
  const wpGoal = lang === 'uz' ? (currentWp?.scienceGoal_uz || currentWp?.scienceGoal) : currentWp?.scienceGoal;
  const wpSample = lang === 'uz' ? (currentWp?.sampleTarget_uz || currentWp?.sampleTarget) : currentWp?.sampleTarget;
  const zoneName = lang === 'uz' ? (zone.name_uz || zone.name) : zone.name;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none font-mono">
      {/* 1. Camera Flash Effect */}
      {flashActive && (
        <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-200" />
      )}

      {/* 2. Martian Surface Panorama Background View */}
      <div 
        className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ${
          visorMode === 'thermal' 
            ? 'filter hue-rotate-180 contrast-200 saturate-200' 
            : (visorMode === 'mineral' ? 'filter contrast-150 saturate-150 brightness-90' : '')
        }`}
        style={{
          backgroundImage: `url(${
            currentWp?.img || 
            (zone.id === 'gale' 
              ? 'https://mars.nasa.gov/msl-raw-images/proj/msl/redops/ods/surface/sol/01926/soas/fdr/fcam/FLB_568600108EDR_F0672044FHAZ00337M_.JPG'
              : 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/00525/ids/edr/browse/zcam/ZR0_0525_0713783457_012ECM_N0010052AUT_04095_00_2J01.png'
            )
          })`
        }}
      />

      {/* 3. Curved Astronaut Visor Reflection & Scanlines */}
      <div className="absolute inset-0 scanlines pointer-events-none z-10" />
      <div className="absolute inset-0 pointer-events-none z-10 shadow-[inset_0_0_120px_rgba(0,0,0,0.95)]" />

      {/* 4. Helmet Inner Rim Border */}
      <div className="absolute inset-2 md:inset-6 rounded-[40px] border-2 border-cyan-500/30 pointer-events-none z-10 flex flex-col justify-between p-4 md:p-6">
        
        {/* TOP HUD BAR */}
        <div className="flex items-start justify-between w-full pointer-events-auto">
          {/* Left: Astronaut Identity */}
          <div className="glass-panel-cyan px-3 py-2 rounded-lg border border-cyan-500/40 text-cyan-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-orbitron font-bold text-xs tracking-wider text-white">
                {t.visorHudHeader}
              </span>
            </div>
            <div className="text-[10px] text-cyan-400/80 mt-0.5">
              {t.solLabel} {weather.sol} • CDR. S. CHEN • {zoneName.toUpperCase()}
            </div>
          </div>

          {/* Center: Digital Compass Ring */}
          <div className="flex flex-col items-center">
            <div className="glass-panel-cyan px-4 py-1.5 rounded-lg border border-cyan-400/50 flex items-center gap-2 text-cyan-300">
              <Compass className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '40s' }} />
              <span className="text-sm font-bold font-orbitron">{Math.round(heading)}° {t.heading}</span>
              <span className="text-[10px] px-1 bg-cyan-900/60 rounded">
                {heading >= 315 || heading < 45 ? t.north : heading < 135 ? t.east : heading < 225 ? t.south : t.west}
              </span>
            </div>
            <div className="flex gap-2 text-[9px] text-cyan-500/60 mt-1">
              <span>090</span>
              <span>•</span>
              <span>120</span>
              <span className="text-cyan-300 font-bold">▼</span>
              <span>150</span>
              <span>•</span>
              <span>180</span>
            </div>
          </div>

          {/* Right: Visor Filters & Exit HUD */}
          <div className="flex items-center gap-2">
            <div className="glass-panel px-2 py-1 rounded-lg border border-slate-700 flex gap-1 text-[10px]">
              {[
                { id: 'optical', label: t.opticalMode },
                { id: 'thermal', label: t.thermalMode },
                { id: 'mineral', label: t.mineralMode }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setVisorMode(m.id);
                    marsAudio.playBlip();
                  }}
                  className={`px-2 py-1 rounded font-bold uppercase transition ${
                    visorMode === m.id 
                      ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/40' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                onExitHUD();
                marsAudio.playQuindarOutro();
              }}
              className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-white font-orbitron text-xs font-bold transition flex items-center gap-1.5 shadow-lg border border-red-400"
            >
              <Minimize className="w-3.5 h-3.5" />
              {t.exitHud}
            </button>
          </div>
        </div>

        {/* CENTER VIEWPORT: Artificial Horizon & Target Reticle */}
        <div className="relative flex items-center justify-center my-auto">
          <div className="absolute w-64 h-32 pointer-events-none opacity-40">
            <div className="absolute top-1/2 left-0 w-20 h-0.5 bg-cyan-400" />
            <div className="absolute top-1/2 right-0 w-20 h-0.5 bg-cyan-400" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-cyan-400" />
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-cyan-400/60" />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-cyan-400/60" />
          </div>

          <div className="glass-panel-cyan p-3 rounded-xl border-2 border-cyan-400 text-cyan-200 pointer-events-auto max-w-xs shadow-2xl backdrop-blur-md animate-pulse">
            <div className="flex items-center justify-between pb-1.5 border-b border-cyan-500/30">
              <span className="text-[10px] font-bold text-mars-orange flex items-center gap-1">
                <Crosshair className="w-3.5 h-3.5" />
                WP {currentWaypointIndex + 1}/{waypoints.length}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300">
                {t.bearing} 142°
              </span>
            </div>

            <div className="text-sm font-orbitron font-bold text-white mt-1">
              {wpName}
            </div>

            <div className="text-[11px] text-cyan-300 mt-1 leading-tight">
              {wpGoal}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-cyan-500/30 text-[10px]">
              <div>
                <span className="text-cyan-400/70 block">{t.slopeIncline}</span>
                <span className={`font-bold ${currentWp?.slopeDeg > 15 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {currentWp?.slopeDeg}° {currentWp?.slopeDeg > 15 ? t.steepAlert : t.nominalSlope}
                </span>
              </div>
              <div>
                <span className="text-cyan-400/70 block">{t.elevation}</span>
                <span className="font-bold text-white">{currentWp?.elevation}m</span>
              </div>
            </div>

            {wpSample && (
              <div className="mt-2 p-1.5 rounded bg-fuchsia-950/60 border border-fuchsia-500/50 text-[10px] text-fuchsia-200 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-fuchsia-400" />
                <span>{wpSample}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-cyan-500/30">
              <button
                disabled={currentWaypointIndex === 0}
                onClick={() => {
                  setCurrentWaypointIndex(prev => Math.max(0, prev - 1));
                  marsAudio.playBlip();
                }}
                className="px-2 py-1 rounded bg-cyan-900/60 hover:bg-cyan-800 disabled:opacity-40 text-[10px] text-cyan-200"
              >
                {t.prevWp}
              </button>
              <button
                disabled={currentWaypointIndex === waypoints.length - 1}
                onClick={() => {
                  setCurrentWaypointIndex(prev => Math.min(waypoints.length - 1, prev + 1));
                  marsAudio.playBlip();
                }}
                className="px-2 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold disabled:opacity-40 text-[10px]"
              >
                {t.nextWp}
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM HUD BAR */}
        <div className="flex items-end justify-between w-full pointer-events-auto">
          <div className="glass-panel-cyan p-3 rounded-xl border border-cyan-500/40 space-y-2 text-xs">
            <div className="text-[10px] font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {t.suitLifeSupport}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-cyan-200">
              <div className="flex items-center gap-2">
                <Heart className={`w-4 h-4 ${heartRate > 100 ? 'text-red-500 animate-ping' : 'text-rose-400'}`} />
                <div>
                  <div className="text-[9px] text-cyan-400/80">{t.pulse}</div>
                  <div className="font-bold text-sm text-white">{heartRate} <span className="text-[9px]">BPM</span></div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-[9px] text-cyan-400/80">{t.o2Tank}</div>
                  <div className="font-bold text-sm text-emerald-300">{o2Level}%</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-[9px] text-cyan-400/80">{t.suitPressureLabel}</div>
                  <div className="font-bold text-sm text-white">{suitPressure} <span className="text-[9px]">PSI</span></div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Battery className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-[9px] text-cyan-400/80">{t.battery}</div>
                  <div className="font-bold text-sm text-white">{batteryPct}%</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={takeSnapshot}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-orbitron font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/50 transition transform hover:scale-105 active:scale-95"
            >
              <Camera className="w-4 h-4" />
              {t.captureFieldPhoto} ({snapshots.length})
            </button>

            <button
              onClick={() => marsAudio.playQuindarIntro()}
              className="px-3 py-2.5 rounded-xl glass-panel border border-cyan-500/40 text-cyan-300 hover:text-white transition flex items-center gap-1.5 text-xs font-mono"
              title="Test Radio Quindar Mic"
            >
              <Radio className="w-4 h-4 text-mars-orange" />
              {t.commsRadio}
            </button>
          </div>

          <div className="glass-panel-cyan p-3 rounded-xl border border-cyan-500/40 text-right text-xs">
            <div className="text-[10px] text-cyan-400 tracking-wider">{t.marsAmbient}</div>
            <div className="text-sm font-bold text-white mt-0.5">
              {weather.max_temp}°C / {weather.min_temp}°C
            </div>
            <div className="text-[10px] text-cyan-300/80 mt-1">
              {weather.pressure} Pa • {weather.wind_speed}
            </div>
          </div>
        </div>

      </div>

      {isAlertActive && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 glass-panel-alert px-6 py-2.5 rounded-full border border-red-500 text-red-300 flex items-center gap-3 shadow-2xl animate-bounce">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span className="font-orbitron font-bold text-xs text-white tracking-widest uppercase">
            {t.slopeWarningHud} ({currentWp?.slopeDeg}°)
          </span>
        </div>
      )}
    </div>
  );
}
