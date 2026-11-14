import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Route, 
  Clock, 
  Wind, 
  ShieldAlert, 
  CheckSquare, 
  Square, 
  FileDown, 
  Award, 
  Radio, 
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { EVA_PHYSICS } from '../data/marsMissionData';
import { marsAudio } from '../utils/audioSystem';
import { TRANSLATIONS } from '../data/translations';

export default function MissionPlanner({ 
  zone, 
  waypoints, 
  selectedMission, 
  onSelectMission,
  onOpenHUD,
  onSelectWaypoint,
  selectedWaypoint,
  lang = 'en'
}) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const [completedTasks, setCompletedTasks] = useState({});

  // 1. Calculate Real-time Route Metrics
  let totalDistanceKm = 0;
  let totalAscent = 0;
  let totalDescent = 0;
  let maxSlope = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const p1 = waypoints[i];
    const p2 = waypoints[i + 1];

    const latDiff = (p2.lat - p1.lat) * 59.16;
    const lngDiff = (p2.lng - p1.lng) * 59.16 * Math.cos((p1.lat * Math.PI) / 180);
    const dist = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    totalDistanceKm += dist;

    const elevDiff = p2.elevation - p1.elevation;
    if (elevDiff > 0) totalAscent += elevDiff;
    else totalDescent += Math.abs(elevDiff);

    if (p2.slopeDeg > maxSlope) maxSlope = p2.slopeDeg;
  }

  const walkingSpeedKmH = Math.max(1.0, 2.2 - (maxSlope * 0.05));
  const walkingDurationMin = Math.round((totalDistanceKm / walkingSpeedKmH) * 60 + (waypoints.length * 20));

  const o2ConsumedLiters = Math.round(walkingDurationMin * EVA_PHYSICS.o2ConsumptionRateLiterMin * (1 + maxSlope * 0.02));
  const caloriesBurned = Math.round((walkingDurationMin / 60) * (EVA_PHYSICS.baseMetabolicRateKcalHr + maxSlope * EVA_PHYSICS.slopeMetabolicMultiplier));
  const radiationDoseMicroSv = Math.round((walkingDurationMin / 60) * 10.5);

  const toggleTask = (id) => {
    marsAudio.playBlip();
    const updated = { ...completedTasks, [id]: !completedTasks[id] };
    setCompletedTasks(updated);

    const sampleWaypoints = waypoints.filter(w => w.sampleTarget);
    const allDone = sampleWaypoints.every(w => updated[w.id]);
    if (allDone && sampleWaypoints.length > 0) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      marsAudio.playQuindarIntro();
    }
  };

  const missionTitle = lang === 'uz' ? (selectedMission.title_uz || selectedMission.title) : selectedMission.title;
  const leadExplorer = lang === 'uz' ? (selectedMission.leadExplorer_uz || selectedMission.leadExplorer) : selectedMission.leadExplorer;
  const primaryObjective = lang === 'uz' ? (selectedMission.primaryObjective_uz || selectedMission.primaryObjective) : selectedMission.primaryObjective;

  // Export Mission Flight Plan as printable text download
  const handleExportPlan = () => {
    marsAudio.playBlip();
    const manifest = `
=============================================================================
NASA ARES SURFACE EXPLORATION PROGRAM // EVA FLIGHT MANIFEST
MISSION: ${missionTitle}
ZONE: ${lang === 'uz' ? (zone.name_uz || zone.name) : zone.name}
SOL: ${selectedMission.sol}
ASTRONAUT CREW: ${leadExplorer}
=============================================================================
MISSION SUMMARY:
- Total Traverse Distance: ${totalDistanceKm.toFixed(2)} km
- Elevation Profile: Ascent +${totalAscent}m / Descent -${totalDescent}m
- Max Terrain Slope: ${maxSlope}°
- Estimated EVA Duration: ${Math.floor(walkingDurationMin / 60)}h ${walkingDurationMin % 60}m
- Consumables Budget: ${o2ConsumedLiters} Liters O2 | ${caloriesBurned} kcal
- Est. Radiation Exposure: ${radiationDoseMicroSv} microSv (Within NASA safety limit)

PRIMARY SCIENCE OBJECTIVE:
${primaryObjective}

WAYPOINTS & GEOLOGICAL SAMPLING MANIFEST:
${waypoints.map((w, idx) => `
[WP-${idx + 1}] ${lang === 'uz' ? (w.name_uz || w.name) : w.name}
  Coordinates: Lat ${w.lat.toFixed(4)}°, Lon ${w.lng.toFixed(4)}° | Elevation: ${w.elevation}m
  Slope Angle: ${w.slopeDeg}° (${lang === 'uz' ? (w.hazard_uz || w.hazard) : w.hazard})
  Target Mineralogy: ${lang === 'uz' ? (w.mineralogy_uz || w.mineralogy) : w.mineralogy}
  Science Task: ${lang === 'uz' ? (w.scienceGoal_uz || w.scienceGoal) : w.scienceGoal}
  Sample Tube: ${lang === 'uz' ? (w.sampleTarget_uz || w.sampleTarget || 'None') : (w.sampleTarget || 'None')}
`).join('\n')}

SAFETY CONTINGENCY PROTOCOL:
1. Slopes exceeding 20° require safety tethers and walking pace below 1.2 km/h.
2. In case of dust storm or solar particle event (SPE), abort traverse immediately and return to Pressurized Habitat.
3. Consumable abort threshold: Return when O2 reaches 35% capacity.
=============================================================================
`;
    const blob = new Blob([manifest], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NASA_EVA_MANIFEST_SOL_${selectedMission.sol}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full flex flex-col glass-panel p-4 overflow-y-auto space-y-4 text-slate-100">
      {/* 1. Header & Expedition Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-3 border-b border-slate-700/80 gap-3">
        <div>
          <span className="text-[10px] font-mono text-mars-orange bg-mars-orange/20 px-2 py-0.5 rounded border border-mars-orange/30">
            {t.humanExplorationProgram}
          </span>
          <h1 className="text-base font-orbitron font-bold text-white mt-1">
            {missionTitle}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {leadExplorer} • Sol {selectedMission.sol}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenHUD}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-orbitron text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-cyan-950"
          >
            <Radio className="w-4 h-4 text-black" />
            {t.launchVisorHud}
          </button>

          <button
            onClick={handleExportPlan}
            className="px-3 py-2 rounded-xl glass-panel border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-mono transition flex items-center gap-1.5"
            title="Download NASA Flight Manifest"
          >
            <FileDown className="w-4 h-4 text-mars-orange" />
            {t.exportPlan}
          </button>
        </div>
      </div>

      {/* 2. Key EVA Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Distance */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{t.traverseDistance}</span>
            <Route className="w-4 h-4 text-mars-orange" />
          </div>
          <div className="text-xl font-orbitron font-bold text-white mt-1">
            {totalDistanceKm.toFixed(2)} <span className="text-xs font-mono text-slate-400">km</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {waypoints.length} {lang === 'uz' ? 'dala nuqtalari' : 'field waypoints'}
          </div>
        </div>

        {/* Duration */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{t.estEvaTime}</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-orbitron font-bold text-white mt-1">
            {Math.floor(walkingDurationMin / 60)}h {walkingDurationMin % 60}m
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {t.maxLimit} 6h 30m
          </div>
        </div>

        {/* Oxygen Consumption */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{t.o2Consumption}</span>
            <Wind className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-orbitron font-bold text-emerald-300 mt-1">
            {o2ConsumedLiters} <span className="text-xs font-mono text-slate-400">L</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {t.tankReserve}: 1,500 L
          </div>
        </div>

        {/* Metabolic Heat & Radiation */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{t.radiationCalories}</span>
            <ShieldAlert className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-orbitron font-bold text-purple-300 mt-1">
            {radiationDoseMicroSv} <span className="text-xs font-mono text-slate-400">µSv</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {caloriesBurned} kcal {t.energyBurn}
          </div>
        </div>
      </div>

      {/* 3. Elevation Profile Graph */}
      <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-mars-orange" />
            <span className="text-xs font-orbitron font-bold text-slate-200">
              {t.topoElevationProfile}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {t.ascent}: +{totalAscent}m • {t.descent}: -{totalDescent}m • {t.maxSlope}: {maxSlope}°
          </span>
        </div>

        {/* SVG Elevation Profile Chart */}
        <div className="w-full h-28 relative">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
            <line x1="0" y1="20" x2="500" y2="20" stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />
            <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />
            <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />

            {waypoints.length > 1 && (() => {
              const minElev = Math.min(...waypoints.map(w => w.elevation));
              const maxElev = Math.max(...waypoints.map(w => w.elevation));
              const elevRange = Math.max(1, maxElev - minElev);

              const points = waypoints.map((w, idx) => {
                const x = (idx / (waypoints.length - 1)) * 480 + 10;
                const y = 90 - ((w.elevation - minElev) / elevRange) * 70;
                return { x, y, w, idx };
              });

              const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
              const polygonPoints = `10,95 ${polylinePoints} 490,95`;

              return (
                <>
                  <polygon
                    points={polygonPoints}
                    fill="url(#elevGrad)"
                    opacity="0.3"
                  />
                  <polyline
                    points={polylinePoints}
                    fill="none"
                    stroke="#ff5722"
                    strokeWidth="3"
                  />
                  <defs>
                    <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff5722" />
                      <stop offset="100%" stopColor="#08090d" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {points.map((p) => {
                    const isSteep = p.w.slopeDeg > 15;
                    return (
                      <g key={p.idx} className="cursor-pointer" onClick={() => onSelectWaypoint(p.w)}>
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={selectedWaypoint?.id === p.w.id ? 6 : 4}
                          fill={isSteep ? '#ef4444' : '#06b6d4'}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        <text
                          x={p.x}
                          y={p.y - 8}
                          fontSize="8"
                          fill="#cbd5e1"
                          textAnchor="middle"
                          fontFamily="JetBrains Mono"
                        >
                          {p.w.elevation}m
                        </text>
                      </g>
                    );
                  })}
                </>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* 4. Waypoints & Scientific Sampling Manifest */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-fuchsia-400" />
            <h2 className="text-xs font-orbitron font-bold text-slate-100 uppercase">
              {t.fieldScienceProtocols}
            </h2>
          </div>
          <span className="text-[10px] font-mono text-fuchsia-400 bg-fuchsia-950/60 px-2 py-0.5 rounded border border-fuchsia-500/30">
            {Object.values(completedTasks).filter(Boolean).length} / {waypoints.filter(w => w.sampleTarget).length} {t.tubesSealed}
          </span>
        </div>

        <div className="space-y-2">
          {waypoints.map((wp, index) => {
            const isDone = !!completedTasks[wp.id];
            const isSelected = selectedWaypoint?.id === wp.id;
            const wpDisplayName = lang === 'uz' ? (wp.name_uz || wp.name) : wp.name;
            const wpGoal = lang === 'uz' ? (wp.scienceGoal_uz || wp.scienceGoal) : wp.scienceGoal;
            const wpHazard = lang === 'uz' ? (wp.hazard_uz || wp.hazard) : wp.hazard;
            const wpMineral = lang === 'uz' ? (wp.mineralogy_uz || wp.mineralogy) : wp.mineralogy;
            const wpSample = lang === 'uz' ? (wp.sampleTarget_uz || wp.sampleTarget) : wp.sampleTarget;

            return (
              <div
                key={wp.id}
                onClick={() => onSelectWaypoint(wp)}
                className={`p-3 rounded-xl border transition cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                  isSelected 
                    ? 'bg-mars-orange/15 border-mars-orange shadow-lg' 
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 ${
                    wp.type === 'primary-objective' ? 'bg-fuchsia-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {index + 1}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-orbitron">
                        {wpDisplayName}
                      </span>
                      {wp.type === 'primary-objective' && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-fuchsia-900/70 text-fuchsia-300 border border-fuchsia-500/40">
                          {t.priority1Target}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-300 mt-1">
                      {wpGoal}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] font-mono text-slate-400">
                      <span>{t.elevation}: {wp.elevation}m</span>
                      <span>•</span>
                      <span className={wp.slopeDeg > 15 ? 'text-red-400 font-bold' : 'text-slate-300'}>
                        {t.slopeIncline}: {wp.slopeDeg}° ({wpHazard})
                      </span>
                      <span>•</span>
                      <span className="text-cyan-400">{wpMineral}</span>
                    </div>

                    {wpSample && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-amber-300">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>{wpSample}</span>
                      </div>
                    )}
                  </div>
                </div>

                {wpSample && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTask(wp.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition shrink-0 ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                    }`}
                  >
                    {isDone ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    {isDone ? t.sampleSealed : t.extractCore}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
