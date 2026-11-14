import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Layers, 
  MapPin, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  Compass, 
  Maximize2, 
  Plus, 
  X,
  Mountain,
  Flame,
  ShieldAlert,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { marsAudio } from '../utils/audioSystem';
import { TRANSLATIONS } from '../data/translations';

const MARS_CRS = L.extend({}, L.CRS, {
  projection: L.Projection.LonLat,
  transformation: new L.Transformation(1 / 180, 1, -1 / 180, 0.5),
  scale: (zoom) => 256 * Math.pow(2, zoom),
  zoom: (scale) => Math.log(scale / 256) / Math.LN2,
  wrapLng: [-180, 180]
});

const createMarsTrekLayer = (product, format, maxNativeZoom, attribution, minZoom = 2, className) =>
  L.tileLayer(
    `https://trek.nasa.gov/tiles/Mars/EQ/${product}/1.0.0//default/default028mm/{z}/{y}/{x}.${format}`,
    { minZoom, maxZoom: 13, maxNativeZoom, attribution, className }
  );

const createVikingLayer = () => {
  const layer = L.TileLayer.extend({
    getTileUrl(coords) {
      const bounds = this._tileCoordsToBounds(coords);
      const size = this.getTileSize();
      const params = new URLSearchParams({
        bbox: bounds.toBBoxString(),
        bboxSR: '104905',
        imageSR: '104905',
        size: `${size.x},${size.y}`,
        format: 'jpgpng',
        f: 'image'
      });

      return `https://trek.nasa.gov/mars/trekarcgis/rest/services/Mars_Viking_MDIM21_ClrMosaic_global_232m/ImageServer/exportImage?${params}`;
    }
  });

  return new layer('', {
    maxZoom: 13,
    attribution: 'NASA/USGS Viking MDIM 2.1 Color Mosaic'
  });
};

export default function MarsMap({ 
  zone, 
  waypoints, 
  onSelectWaypoint, 
  selectedWaypoint, 
  onAddWaypoint, 
  onRemoveWaypoint,
  isAddMode,
  setIsAddMode,
  lang = 'en'
}) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const layersGroupRef = useRef({});
  const mapInteractionRef = useRef({});
  mapInteractionRef.current = { waypoints, onAddWaypoint, isAddMode };

  // Active Map Layer States
  const [baseMap, setBaseMap] = useState('mola'); // 'mola', 'viking', 'themis', 'trek'
  const [isLayersOpen, setIsLayersOpen] = useState(false); // Toggle state for the layers drawer!
  const [layerOpacity, setLayerOpacity] = useState({
    slopeHazard: 0.75,
    mineralogy: 0.7,
    thermalInertia: 0.6,
    radiation: 0.5,
    contours: 0.8
  });
  const [activeLayers, setActiveLayers] = useState({
    slopeHazard: true,
    mineralogy: true,
    thermalInertia: true,
    radiation: false,
    contours: true
  });
  const [mouseCoords, setMouseCoords] = useState({ lat: 0, lng: 0 });

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
    }

    const map = L.map(mapContainerRef.current, {
      center: zone.center,
      zoom: zone.zoom - 1,
      minZoom: 2,
      maxZoom: 13,
      crs: MARS_CRS,
      zoomControl: false,
      attributionControl: false
    });
    mapRef.current = map;

    // Zoom controls in top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Track mouse coordinates in Martian degrees
    map.on('mousemove', (e) => {
      setMouseCoords({
        lat: Number(e.latlng.lat.toFixed(4)),
        lng: Number(e.latlng.lng.toFixed(4))
      });
    });

    // Map click handler for adding custom waypoints
    map.on('click', (e) => {
      const { waypoints, onAddWaypoint, isAddMode } = mapInteractionRef.current;
      if (isAddMode && onAddWaypoint) {
        const wpNum = waypoints.length + 1;
        onAddWaypoint({
          id: `custom-${Date.now()}`,
          name: `EVA Waypoint ${wpNum}`,
          name_uz: `EVA Nuqtasi ${wpNum}`,
          lat: Number(e.latlng.lat.toFixed(4)),
          lng: Number(e.latlng.lng.toFixed(4)),
          elevation: Math.round(-4200 + Math.random() * 500),
          type: 'custom',
          hazard: 'Nominal',
          hazard_uz: 'Xavfsiz',
          slopeDeg: Math.round(3 + Math.random() * 12),
          mineralogy: 'Regolith / Silt Breccia',
          mineralogy_uz: 'Regolit / Mayda Tosh Cho\'kindisi',
          scienceGoal: 'Astronaut field inspection & rock hammer strike test.',
          scienceGoal_uz: 'Dala ko\'zdan kechiruvi va geologik bolg\'a zarba sinovi.',
          notes: 'Manually designated field target.',
          notes_uz: 'Qo\'lda belgilangan dala nuqtasi.',
          sampleTarget: null,
          img: null
        });
        marsAudio.playBlip();
      }
    });

    // Layer groups for science overlays
    layersGroupRef.current = {
      slopeHazard: L.layerGroup().addTo(map),
      mineralogy: L.layerGroup().addTo(map),
      thermalInertia: L.layerGroup().addTo(map),
      radiation: L.layerGroup().addTo(map),
      contours: L.layerGroup().addTo(map),
      markers: L.layerGroup().addTo(map),
      routes: L.layerGroup().addTo(map)
    };

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.setView(zone.center, zone.zoom - 1, { animate: false });
    const frame = requestAnimationFrame(() => map.invalidateSize({ pan: false }));

    return () => cancelAnimationFrame(frame);
  }, [zone.id]);

  // 2. Update the selected planetary base tile layer.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old base layers
    if (layersGroupRef.current.baseTile) {
      map.removeLayer(layersGroupRef.current.baseTile);
    }
    if (layersGroupRef.current.detailTile) {
      map.removeLayer(layersGroupRef.current.detailTile);
    }
    layersGroupRef.current.baseTile = null;
    layersGroupRef.current.detailTile = null;

    const baseTile = baseMap === 'mola'
      ? createMarsTrekLayer(
          'Mars_MGS_MOLA_ClrShade_merge_global_463m',
          'jpg',
          7,
          'NASA/GSFC MOLA Color Hillshade'
        )
      : baseMap === 'viking'
        ? createVikingLayer()
        : createMarsTrekLayer(
            'THEMIS_DayIR_ControlledMosaics_100m_v2_oct2018',
            'png',
            9,
            'NASA/JPL-Caltech/ASU THEMIS Day IR Mosaic'
          );

    baseTile.addTo(map);
    layersGroupRef.current.baseTile = baseTile;

    if (baseMap !== 'themis') {
      const detailTile = createMarsTrekLayer(
        zone.id === 'gale' ? 'Gale_CTX_BlockAdj_dd' : 'JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0',
        'png',
        zone.id === 'gale' ? 12 : 13,
        'NASA/JPL-Caltech/MSSS CTX Mosaic',
        7,
        'mars-detail-tile'
      );
      detailTile.setOpacity(0.55);
      detailTile.addTo(map);
      layersGroupRef.current.detailTile = detailTile;
    }
  }, [baseMap, zone.id]);

  // 3. Render Scientific Overlays (Slope Hazards, Minerals, Thermal Sand Traps)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersGroupRef.current.slopeHazard) return;

    layersGroupRef.current.slopeHazard.clearLayers();
    layersGroupRef.current.mineralogy.clearLayers();
    layersGroupRef.current.thermalInertia.clearLayers();
    layersGroupRef.current.radiation.clearLayers();
    layersGroupRef.current.contours.clearLayers();

    const [cLat, cLng] = zone.center;

    // A. Slope Hazard Heatmap Overlay
    if (activeLayers.slopeHazard) {
      const steepZones = [
        {
          coords: [
            [cLat - 0.07, cLng - 0.03],
            [cLat - 0.08, cLng - 0.01],
            [cLat - 0.065, cLng + 0.015],
            [cLat - 0.055, cLng - 0.01]
          ],
          color: '#ef4444',
          label: lang === 'uz' ? 'TIK QOYALAR (>22° Nishablik)' : 'STEEP ESCARPMENT (>22° Slope Hazard)',
          desc: lang === 'uz' 
            ? 'Yuqori sirpanish xavfi. Rover o\'ta olmaydi. Skafandrli astronavtlar uchun arqon tasmalar shart.'
            : 'High slip risk. Unpassable for pressurized rover. Hand-tethers required for astronauts.'
        },
        {
          coords: [
            [cLat + 0.04, cLng - 0.06],
            [cLat + 0.03, cLng - 0.04],
            [cLat + 0.05, cLng - 0.025]
          ],
          color: '#f59e0b',
          label: lang === 'uz' ? 'O\'RTA QIYALIK (12°-18° Nishablik)' : 'MODERATE INCLINE (12°-18° Slope Caution)',
          desc: lang === 'uz'
            ? 'Kislorod sarfi +45% oshadi. Toshli so\'qmoqlarda ehtiyotkorlik zarur.'
            : 'Increased suit oxygen burn rate (+45%). Rocky scree traversability caution.'
        }
      ];

      steepZones.forEach((sz) => {
        const poly = L.polygon(sz.coords, {
          color: sz.color,
          fillColor: sz.color,
          fillOpacity: layerOpacity.slopeHazard * 0.45,
          weight: 2,
          dashArray: '4, 4'
        });
        layersGroupRef.current.slopeHazard.addLayer(poly);
      });
    }

    // B. CRISM Mineralogy Overlays (Phyllosilicates, Sulfates, Boxwork Formations, Carbonates)
    if (activeLayers.mineralogy) {
      const mineralFeatures = [
        {
          center: [cLat - 0.12, cLng - 0.08],
          radius: 2200,
          color: '#e879f9',
          label: lang === 'uz' ? 'Curiosity 2024-2025 Boxwork Tizmalari' : 'Curiosity 2024-2025 Boxwork Ridge System',
          desc: lang === 'uz'
            ? 'Yerosti suvlari yoriqlarni minerallar bilan to\'ldirishi natijasida hosil bo\'lgan asalari uyasimon tosh tizmalari.'
            : 'Polygonal honeycomb boxwork ridges formed by groundwater mineral veins filling bedrock fractures.'
        },
        {
          center: [cLat + 0.02, cLng + 0.02],
          radius: 1800,
          color: '#38bdf8',
          label: lang === 'uz' ? 'Gidratlangan Fillosilikatlar (Smektit Gillari)' : 'Hydrated Phyllosilicates (Smectite Clays)',
          desc: lang === 'uz'
            ? 'Organik birikmalarni saqlab qolish xususiyatiga ega qadimgi chuchuk suvli ko\'l cho\'kindilari.'
            : 'Ancient freshwater lake sediments with high organic compound preservation potential.'
        },
        {
          center: [cLat - 0.04, cLng + 0.05],
          radius: 1500,
          color: '#34d399',
          label: lang === 'uz' ? 'Magniy Karbonatli Sohil Qatlamlari' : 'Magnesium Carbonate Margin Beds',
          desc: lang === 'uz'
            ? 'Ishqoriy ko\'l suvidan cho\'kkan va mikrofosil qoldiqlarini germetik saqlab qoluvchi karbonat qatlamlari.'
            : 'Precipitated alkaline lake minerals sealing potential biosignature microbial fossils.'
        }
      ];

      mineralFeatures.forEach((mf) => {
        const circle = L.circle(mf.center, {
          radius: mf.radius,
          color: mf.color,
          fillColor: mf.color,
          fillOpacity: layerOpacity.mineralogy * 0.4,
          weight: 2
        });
        layersGroupRef.current.mineralogy.addLayer(circle);
      });
    }

    // C. THEMIS Thermal Inertia / Loose Sand Traps (Bagnold Dunes / Séítah)
    if (activeLayers.thermalInertia) {
      const sandTraps = [
        {
          center: [cLat - 0.035, cLng - 0.005],
          radius: 1400,
          color: '#f97316',
          label: lang === 'uz' ? 'Faol Bazalt Qum Barxanlari (Past Termal Inersiya)' : 'Active Basaltic Sand Dunes (Low Thermal Inertia)',
          desc: lang === 'uz'
            ? 'Yumshoq nozik qum. 60%+ g\'ildirak sirpanish xavfi. Rover kirishi taqiqlanadi.'
            : 'Loose fine sand. 60%+ wheel slippage hazard. Avoid rover ingress.'
        }
      ];

      sandTraps.forEach((st) => {
        const circle = L.circle(st.center, {
          radius: st.radius,
          color: st.color,
          fillColor: st.color,
          fillOpacity: layerOpacity.thermalInertia * 0.45,
          weight: 2,
          dashArray: '6, 6'
        });
        layersGroupRef.current.thermalInertia.addLayer(circle);
      });
    }

    // D. Elevation Contours
    if (activeLayers.contours) {
      const contourRings = [
        { center: [cLat, cLng], radius: 3000, label: '-4,200m' },
        { center: [cLat, cLng], radius: 5500, label: '-4,000m' },
        { center: [cLat, cLng], radius: 8000, label: '-3,800m' },
        { center: [cLat, cLng], radius: 10500, label: '-3,600m' }
      ];

      contourRings.forEach((cr) => {
        const ring = L.circle(cr.center, {
          radius: cr.radius,
          color: 'rgba(255, 255, 255, 0.25)',
          fill: false,
          weight: 1,
          dashArray: '3, 6'
        });
        layersGroupRef.current.contours.addLayer(ring);
      });
    }

    // E. Radiation Field
    if (activeLayers.radiation) {
      const radZone = L.circle([cLat + 0.01, cLng - 0.02], {
        radius: 4000,
        color: '#a855f7',
        fillColor: '#a855f7',
        fillOpacity: layerOpacity.radiation * 0.35,
        weight: 1,
        dashArray: '8, 8'
      });
      layersGroupRef.current.radiation.addLayer(radZone);
    }

  }, [activeLayers, layerOpacity, zone.id, lang]);

  // 4. Render Route Polyline & Waypoint Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersGroupRef.current.markers) return;

    layersGroupRef.current.markers.clearLayers();
    layersGroupRef.current.routes.clearLayers();

    if (waypoints.length === 0) return;

    const latLngs = waypoints.map(w => [w.lat, w.lng]);
    const routeLine = L.polyline(latLngs, {
      color: '#ff5722',
      weight: 3.5,
      opacity: 0.9,
      dashArray: '8, 6'
    });
    layersGroupRef.current.routes.addLayer(routeLine);

    waypoints.forEach((wp, index) => {
      const isSelected = selectedWaypoint?.id === wp.id;
      const isBase = wp.type === 'base';
      const isPrimary = wp.type === 'primary-objective';
      const isHazard = wp.type === 'hazard';

      let markerBg = 'bg-slate-800 border-slate-400 text-white';
      if (isBase) markerBg = 'bg-blue-600 border-blue-300 text-white';
      else if (isPrimary) markerBg = 'bg-fuchsia-600 border-fuchsia-300 text-white animate-pulse';
      else if (isHazard) markerBg = 'bg-amber-600 border-amber-300 text-white';
      else if (isSelected) markerBg = 'bg-mars-orange border-white text-white scale-125';

      const customIcon = L.divIcon({
        className: 'custom-mars-marker',
        html: `
          <div class="flex items-center justify-center w-7 h-7 rounded-full border-2 ${markerBg} shadow-lg text-xs font-mono font-bold transition-all transform hover:scale-110">
            ${index + 1}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([wp.lat, wp.lng], { icon: customIcon });

      marker.on('click', () => {
        onSelectWaypoint(wp);
        marsAudio.playBlip();
      });

      const wpDisplayName = lang === 'uz' ? (wp.name_uz || wp.name) : wp.name;
      marker.bindTooltip(`
        <div class="p-1">
          <div class="text-[10px] font-mono text-mars-orange font-bold uppercase">WP ${index + 1}</div>
          <div class="text-xs font-bold text-white">${wpDisplayName}</div>
          <div class="text-[11px] text-slate-300 mt-1">${t.elevation}: ${wp.elevation}m | ${t.slopeIncline}: ${wp.slopeDeg}°</div>
        </div>
      `, { direction: 'top', offset: [0, -12] });

      layersGroupRef.current.markers.addLayer(marker);
    });

  }, [waypoints, selectedWaypoint, lang]);

  const activeLayersCount = Object.values(activeLayers).filter(Boolean).length;

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />

      {/* TOP LEFT: COMPACT TOGGLE BUTTON & DRAWER FOR NASA SCIENCE LAYERS */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-auto">
        
        {/* Toggle Button (Always visible compact pill) */}
        <button
          onClick={() => {
            setIsLayersOpen(!isLayersOpen);
            marsAudio.playBlip();
          }}
          className={`glass-panel px-3.5 py-2 rounded-xl border text-xs font-orbitron font-bold flex items-center gap-2 shadow-2xl transition transform hover:scale-105 ${
            isLayersOpen 
              ? 'bg-mars-orange/25 border-mars-orange text-white' 
              : 'border-mars-orange/40 text-slate-200 hover:text-white hover:border-mars-orange'
          }`}
        >
          <Layers className="w-4 h-4 text-mars-orange" />
          <span>{t.layersButton}</span>
          <span className="text-[10px] font-mono text-mars-orange bg-mars-orange/20 px-1.5 py-0.5 rounded border border-mars-orange/30">
            {activeLayersCount}/5
          </span>
          {isLayersOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </button>

        {/* Floating Drawer Panel (ONLY opens when user clicks the button!) */}
        {isLayersOpen && (
          <div className="glass-panel p-3.5 rounded-xl border border-mars-orange/40 w-72 sm:w-80 shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-2">
            
            {/* Header with Close '✕' Button */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
              <span className="text-xs font-orbitron font-bold text-slate-100 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-mars-orange" />
                {t.layersButton}
              </span>
              <button
                onClick={() => setIsLayersOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 text-xs font-mono transition"
                title={t.closePanel}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Base Map Switcher */}
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">{t.baseTileset}</label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'mola', label: 'MOLA DEM' },
                  { id: 'viking', label: 'Viking Color' },
                  { id: 'themis', label: 'THEMIS IR' }
                ].map(b => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setBaseMap(b.id);
                      marsAudio.playBlip();
                    }}
                    className={`text-[10px] py-1 px-1.5 rounded font-mono font-bold transition text-center border ${
                      baseMap === b.id
                        ? 'bg-mars-orange/30 border-mars-orange text-white'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Layer Toggles & Opacity */}
            <div className="space-y-2 text-xs">
              {/* Slope Hazard */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveLayers(p => ({ ...p, slopeHazard: !p.slopeHazard }))}
                    className={`p-1 rounded ${activeLayers.slopeHazard ? 'text-red-400' : 'text-slate-500'}`}
                  >
                    {activeLayers.slopeHazard ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <span className="text-slate-200 text-[11px] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    {t.slopeHazardMap}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={layerOpacity.slopeHazard}
                  onChange={(e) => setLayerOpacity(p => ({ ...p, slopeHazard: parseFloat(e.target.value) }))}
                  className="w-16 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-red-500"
                />
              </div>

              {/* Mineralogy / CRISM */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveLayers(p => ({ ...p, mineralogy: !p.mineralogy }))}
                    className={`p-1 rounded ${activeLayers.mineralogy ? 'text-fuchsia-400' : 'text-slate-500'}`}
                  >
                    {activeLayers.mineralogy ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <span className="text-slate-200 text-[11px] flex items-center gap-1">
                    <Mountain className="w-3 h-3 text-fuchsia-400" />
                    {t.crismMinerals}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={layerOpacity.mineralogy}
                  onChange={(e) => setLayerOpacity(p => ({ ...p, mineralogy: parseFloat(e.target.value) }))}
                  className="w-16 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-fuchsia-500"
                />
              </div>

              {/* THEMIS Thermal / Sand Traps */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveLayers(p => ({ ...p, thermalInertia: !p.thermalInertia }))}
                    className={`p-1 rounded ${activeLayers.thermalInertia ? 'text-amber-400' : 'text-slate-500'}`}
                  >
                    {activeLayers.thermalInertia ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <span className="text-slate-200 text-[11px] flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400" />
                    {t.thermalSandTraps}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={layerOpacity.thermalInertia}
                  onChange={(e) => setLayerOpacity(p => ({ ...p, thermalInertia: parseFloat(e.target.value) }))}
                  className="w-16 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* Elevation Contours */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveLayers(p => ({ ...p, contours: !p.contours }))}
                    className={`p-1 rounded ${activeLayers.contours ? 'text-cyan-400' : 'text-slate-500'}`}
                  >
                    {activeLayers.contours ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <span className="text-slate-200 text-[11px]">{t.elevationContours}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={layerOpacity.contours}
                  onChange={(e) => setLayerOpacity(p => ({ ...p, contours: parseFloat(e.target.value) }))}
                  className="w-16 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* Space Weather & Radiation */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveLayers(p => ({ ...p, radiation: !p.radiation }))}
                    className={`p-1 rounded ${activeLayers.radiation ? 'text-purple-400' : 'text-slate-500'}`}
                  >
                    {activeLayers.radiation ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <span className="text-slate-200 text-[11px] flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-purple-400" />
                    {t.gcrRadiationZone}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={layerOpacity.radiation}
                  onChange={(e) => setLayerOpacity(p => ({ ...p, radiation: parseFloat(e.target.value) }))}
                  className="w-16 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>

            {/* Map Legend Sub-card inside the panel */}
            <div className="pt-2 border-t border-slate-700/60 text-[10px] font-mono space-y-1 text-slate-300">
              <div className="font-bold text-slate-400 mb-1">{t.slopeClassification}</div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{t.slopeNominal}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span>{t.slopeCaution}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                <span>{t.slopeImpassable}</span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500 shrink-0" />
                <span>{t.boxworkRidgesLegend}</span>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Top Center: Add Custom Waypoint Mode Banner */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        <button
          onClick={() => {
            setIsAddMode(!isAddMode);
            marsAudio.playBlip();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-orbitron font-bold transition flex items-center gap-2 shadow-xl border ${
            isAddMode 
              ? 'bg-amber-500 border-amber-300 text-black animate-pulse'
              : 'glass-panel border-mars-orange/40 text-mars-orange hover:bg-mars-orange/20'
          }`}
        >
          <Plus className="w-4 h-4" />
          {isAddMode ? t.clickMapToPlace : t.addCustomWaypoint}
        </button>

        <button
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.setView(zone.center, zone.zoom - 1);
              marsAudio.playBlip();
            }
          }}
          className="glass-panel border-slate-700 text-slate-300 hover:text-white p-2 rounded-xl transition"
          title={t.recenterMap}
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Bar: Live Martian Coordinates */}
      <div className="absolute bottom-4 left-4 z-10 glass-panel px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-mars-orange">
          <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '30s' }} />
          <span>MARS-CRS:</span>
        </div>
        <span>LAT: {mouseCoords.lat >= 0 ? `${mouseCoords.lat}° N` : `${Math.abs(mouseCoords.lat)}° S`}</span>
        <span>LON: {mouseCoords.lng}° E</span>
        <span className="text-slate-500">|</span>
        <span className="text-emerald-400 font-bold">{lang === 'uz' ? (zone.name_uz || zone.name) : zone.name}</span>
      </div>
    </div>
  );
}
