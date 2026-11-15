import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  ExternalLink, 
  RefreshCw, 
  Maximize2, 
  Calendar,
  Search
} from 'lucide-react';
import { marsAudio } from '../utils/audioSystem';
import { TRANSLATIONS } from '../data/translations';

const STARTER_NASA_PHOTOS = [
  {
    id: 'NLB_847853302EDR_F1252490NCAM00354M_',
    rover: 'Curiosity',
    sol: 5073,
    camera: 'Navcam Left B',
    title: 'Sol 5073 Raw Surface Exposure',
    title_uz: '5073-sol Mars sirti surati',
    desc: 'NASA raw surface image captured by Curiosity.',
    desc_uz: 'Curiosity tomonidan olingan NASA Mars sirti surati.',
    url: 'https://mars.nasa.gov/msl-raw-images/proj/msl/redops/ods/surface/sol/05073/opgs/edr/ncam/NLB_847853302EDR_F1252490NCAM00354M_-thm.jpg',
    originalUrl: 'https://mars.nasa.gov/msl-raw-images/proj/msl/redops/ods/surface/sol/05073/opgs/edr/ncam/NLB_847853302EDR_F1252490NCAM00354M_.JPG',
    site: 'Gale Crater / Mount Sharp',
    coords: '-4.65°, 137.4°'
  },
  {
    id: 'NRB_847853302EDR_F1252490NCAM00354M_',
    rover: 'Curiosity',
    sol: 5073,
    camera: 'Navcam Right B',
    title: 'Sol 5073 Raw Surface Exposure',
    title_uz: '5073-sol Mars sirti surati',
    desc: 'NASA raw surface image captured by Curiosity.',
    desc_uz: 'Curiosity tomonidan olingan NASA Mars sirti surati.',
    url: 'https://mars.nasa.gov/msl-raw-images/proj/msl/redops/ods/surface/sol/05073/opgs/edr/ncam/NRB_847853302EDR_F1252490NCAM00354M_-thm.jpg',
    originalUrl: 'https://mars.nasa.gov/msl-raw-images/proj/msl/redops/ods/surface/sol/05073/opgs/edr/ncam/NRB_847853302EDR_F1252490NCAM00354M_.JPG',
    site: 'Gale Crater / Mount Sharp',
    coords: '-4.65°, 137.4°'
  },
  {
    id: 'NLB_847853270EDR_F1252490NCAM00354M_',
    rover: 'Curiosity',
    sol: 5073,
    camera: 'Navcam Left B',
    title: 'Sol 5073 Raw Surface Exposure',
    title_uz: '5073-sol Mars sirti surati',
    desc: 'NASA raw surface image captured by Curiosity.',
    desc_uz: 'Curiosity tomonidan olingan NASA Mars sirti surati.',
    url: 'https://mars.nasa.gov/msl-raw-images/proj/msl/redops/ods/surface/sol/05073/opgs/edr/ncam/NLB_847853270EDR_F1252490NCAM00354M_-thm.jpg',
    originalUrl: 'https://mars.nasa.gov/msl-raw-images/proj/msl/redops/ods/surface/sol/05073/opgs/edr/ncam/NLB_847853270EDR_F1252490NCAM00354M_.JPG',
    site: 'Gale Crater / Mount Sharp',
    coords: '-4.65°, 137.4°'
  },
  {
    id: 'LRF_2031_0847237865_241EBY_N0930000SCAM01031_0100I4J',
    rover: 'Perseverance',
    sol: 2031,
    camera: 'SuperCam RMI',
    title: 'Sol 2031 Raw Surface Exposure',
    title_uz: '2031-sol Mars sirti surati',
    desc: 'NASA raw surface image captured by Perseverance.',
    desc_uz: 'Perseverance tomonidan olingan NASA Mars sirti surati.',
    url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02031/ids/edr/browse/scam/LRF_2031_0847237865_241EBY_N0930000SCAM01031_0100I4J01_320.jpg',
    originalUrl: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02031/ids/edr/browse/scam/LRF_2031_0847237865_241EBY_N0930000SCAM01031_0100I4J01.png',
    site: 'Jezero Crater',
    coords: '18.45°, 77.45°'
  },
  {
    id: 'LRE_2031_0847237865_241ECM_N0930000SCAM01031_0100I4J',
    rover: 'Perseverance',
    sol: 2031,
    camera: 'SuperCam RMI',
    title: 'Sol 2031 Raw Surface Exposure',
    title_uz: '2031-sol Mars sirti surati',
    desc: 'NASA raw surface image captured by Perseverance.',
    desc_uz: 'Perseverance tomonidan olingan NASA Mars sirti surati.',
    url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02031/ids/edr/browse/scam/LRE_2031_0847237865_241ECM_N0930000SCAM01031_0100I4J01_320.jpg',
    originalUrl: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02031/ids/edr/browse/scam/LRE_2031_0847237865_241ECM_N0930000SCAM01031_0100I4J01.png',
    site: 'Jezero Crater',
    coords: '18.45°, 77.45°'
  },
  {
    id: 'LRF_2031_0847236596_261EBY_N0930000SCAM01031_0050I4J',
    rover: 'Perseverance',
    sol: 2031,
    camera: 'SuperCam RMI',
    title: 'Sol 2031 Raw Surface Exposure',
    title_uz: '2031-sol Mars sirti surati',
    desc: 'NASA raw surface image captured by Perseverance.',
    desc_uz: 'Perseverance tomonidan olingan NASA Mars sirti surati.',
    url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02031/ids/edr/browse/scam/LRF_2031_0847236596_261EBY_N0930000SCAM01031_0050I4J01_320.jpg',
    originalUrl: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02031/ids/edr/browse/scam/LRF_2031_0847236596_261EBY_N0930000SCAM01031_0050I4J01.png',
    site: 'Jezero Crater',
    coords: '18.45°, 77.45°'
  }
];

export default function MarsRawGallery({ zone, lang = 'en' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const [photos, setPhotos] = useState(STARTER_NASA_PHOTOS);
  const [selectedRover, setSelectedRover] = useState(zone.id === 'gale' ? 'Curiosity' : 'Perseverance');
  const [activePhoto, setActivePhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [solFilter, setSolFilter] = useState('');
  const [searchError, setSearchError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchLiveNASAImages = async ({
    signal,
    playSound = true,
    sol,
    page = 0,
    append = false
  } = {}) => {
    setLoading(true);
    setSearchError('');
    if (!append) setHasMore(false);
    if (playSound) marsAudio.playBlip();

    const category = selectedRover === 'Curiosity' ? 'msl' : 'mars2020';
    const solQuery = sol ? `&sol=${encodeURIComponent(sol)}` : '';
    const endpoint = `https://mars.nasa.gov/rss/api/?feed=raw_images&category=${category}&feedtype=json&num=12&page=${page}${solQuery}`;

    try {
      const res = await fetch(endpoint, { signal });
      if (!res.ok) {
        throw new Error(`NASA raw image request failed (${res.status})`);
      }

      const data = await res.json();
      const images = Array.isArray(data.images) ? data.images.slice(0, 12) : [];
      const liveList = images.map((img) => ({
        id: img.imageid || String(img.id),
        rover: selectedRover,
        sol: img.sol,
        camera: img.camera?.full_name || img.camera?.instrument || 'Engineering Navcam',
        title: `Sol ${img.sol} Raw Surface Exposure`,
        title_uz: `Sol ${img.sol} Mars Sirti Xom Surati`,
        desc: `Raw image captured on Mars by ${selectedRover}. UTC: ${img.date_taken_utc || 'Recently received via DSN'}.`,
        desc_uz: `${selectedRover} tomonidan Marsda olingan haqiqiy xom surat. UTC: ${img.date_taken_utc || 'DSN orqali qabul qilingan'}.`,
        url: img.image_files?.small || img.image_files?.medium || img.image_files?.large || img.image_files?.full_res,
        originalUrl: img.image_files?.full_res || img.image_files?.large || img.image_files?.medium || img.image_files?.small,
        site: lang === 'uz' ? (zone.name_uz || zone.name) : zone.name,
        coords: `${zone.center[0]}°, ${zone.center[1]}°`
      })).filter(item => item.url);

      setPhotos((currentPhotos) => {
        const nextPhotos = append
          ? [...currentPhotos, ...liveList]
          : [...liveList, ...STARTER_NASA_PHOTOS];
        const seen = new Set();
        return nextPhotos.filter((photo) => {
          if (seen.has(photo.id)) return false;
          seen.add(photo.id);
          return true;
        });
      });
      setCurrentPage(page);
      setHasMore(images.length === 12);
    } catch (err) {
      if (!signal?.aborted) {
        console.warn('Using curated NASA raw images archive:', err);
        if (sol) setSearchError(t.solSearchFailed);
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchLiveNASAImages({
      signal: controller.signal,
      playSound: false
    });
    return () => controller.abort();
  }, [selectedRover]);

  useEffect(() => {
    setSelectedRover(zone.id === 'gale' ? 'Curiosity' : 'Perseverance');
  }, [zone.id]);

  const filteredPhotos = photos.filter(p => {
    const matchRover = p.rover.toLowerCase().includes(selectedRover.toLowerCase());
    const matchSol = !solFilter || String(p.sol).includes(solFilter.trim());
    return matchRover && matchSol;
  });

  const handleSolSearch = (event) => {
    event.preventDefault();
    const sol = solFilter.trim();
    if (/^\d+$/.test(sol)) {
      fetchLiveNASAImages({ sol, page: 0 });
    }
  };

  return (
    <div className="w-full h-full flex flex-col glass-panel p-4 overflow-y-auto space-y-4 text-slate-100">
      {/* 1. Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-3 border-b border-slate-700/80 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-mars-orange" />
            <h1 className="text-base font-orbitron font-bold text-white">
              {t.rawGalleryTitle}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.rawGallerySubtitle}
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-slate-700 text-xs font-mono">
            {['Curiosity', 'Perseverance'].map((rover) => (
              <button
                key={rover}
                onClick={() => {
                  setSelectedRover(rover);
                  marsAudio.playBlip();
                }}
                className={`px-3 py-1.5 transition ${
                  selectedRover === rover
                    ? 'bg-mars-orange text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {rover}
              </button>
            ))}
          </div>

          <form
            onSubmit={handleSolSearch}
            className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="number"
              min="0"
              step="1"
              required
              placeholder={t.filterSolPlaceholder}
              value={solFilter}
              onChange={(e) => setSolFilter(e.target.value)}
              className="w-24 bg-transparent text-white focus:outline-none placeholder:text-slate-500"
            />
            <button
              type="submit"
              aria-label={t.searchSol}
              title={t.searchSol}
              disabled={loading}
              className="text-cyan-400 hover:text-white disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>

          <button
            onClick={() => fetchLiveNASAImages({ page: 0 })}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-cyan-600/80 hover:bg-cyan-500 text-white font-mono text-xs transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? t.receivingDsn : t.fetchLiveDsn}
          </button>
        </div>
      </div>

      {/* 2. Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {searchError ? (
          <p role="alert" className="col-span-full py-8 text-center text-sm text-red-300">
            {searchError}
          </p>
        ) : filteredPhotos.length === 0 ? (
          <p className="col-span-full py-8 text-center text-sm text-slate-400">
            {loading ? t.receivingDsn : t.noPhotosFound}
          </p>
        ) : filteredPhotos.map((photo) => {
          const photoTitle = lang === 'uz' ? (photo.title_uz || photo.title) : photo.title;
          const photoDesc = lang === 'uz' ? (photo.desc_uz || photo.desc) : photo.desc;

          return (
            <div
              key={photo.id}
              onClick={() => {
                setActivePhoto(photo);
                marsAudio.playBlip();
              }}
              className="group relative bg-slate-900/80 border border-slate-800 hover:border-mars-orange rounded-xl overflow-hidden transition-all duration-300 cursor-pointer shadow-lg hover:shadow-mars-orange/20 flex flex-col"
            >
              <div className="w-full h-44 bg-slate-950 overflow-hidden relative">
                <img
                  src={photo.url}
                  alt={photoTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = STARTER_NASA_PHOTOS[0].url;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

                <span className="absolute top-2 left-2 text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-mars-orange border border-mars-orange/40">
                  {t.solLabel} {photo.sol}
                </span>

                <span className="absolute top-2 right-2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-cyan-300">
                  {photo.camera.split(' ')[0]}
                </span>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                  <span className="px-3 py-1.5 rounded-lg bg-mars-orange text-white text-xs font-orbitron font-bold flex items-center gap-1.5 shadow-lg">
                    <Maximize2 className="w-3.5 h-3.5" />
                    {t.inspectTelemetry}
                  </span>
                </div>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white line-clamp-1 group-hover:text-mars-orange transition">
                    {photoTitle}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {photoDesc}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 mt-2 text-[10px] font-mono text-slate-500">
                  <span>{photo.site}</span>
                  <span className="text-slate-400">{photo.coords}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {hasMore && (
        <div className="flex justify-center pb-2">
          <button
            type="button"
            onClick={() => fetchLiveNASAImages({ page: currentPage + 1, append: true })}
            disabled={loading}
            className="rounded-lg border border-cyan-700 bg-cyan-950/40 px-4 py-2 text-xs font-mono text-cyan-300 transition hover:bg-cyan-900/60 disabled:opacity-50"
          >
            {loading ? t.receivingDsn : t.loadMorePhotos}
          </button>
        </div>
      )}

      {/* 3. Lightbox Modal */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in">
          <div className="relative max-w-4xl w-full bg-slate-900 border border-mars-orange/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-mars-orange/20 text-mars-orange border border-mars-orange/30">
                    NASA • {t.solLabel} {activePhoto.sol}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ROVER: {activePhoto.rover}
                  </span>
                </div>
                <h2 className="text-base font-orbitron font-bold text-white mt-1">
                  {lang === 'uz' ? (activePhoto.title_uz || activePhoto.title) : activePhoto.title}
                </h2>
              </div>
              <button
                onClick={() => setActivePhoto(null)}
                className="text-slate-400 hover:text-white p-2 text-base font-mono rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 bg-black overflow-auto flex items-center justify-center p-2 min-h-[350px]">
              <img
                src={activePhoto.originalUrl || activePhoto.url}
                alt={activePhoto.title}
                className="max-h-[60vh] max-w-full object-contain rounded-lg"
              />
            </div>

            <div className="p-4 bg-slate-950/90 border-t border-slate-800 text-xs font-mono space-y-2">
              <p className="text-slate-300">
                {lang === 'uz' ? (activePhoto.desc_uz || activePhoto.desc) : activePhoto.desc}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px]">{t.cameraInstrument}</span>
                  <span className="text-cyan-300">{activePhoto.camera}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">{t.surfaceLocation}</span>
                  <span className="text-white">{activePhoto.site}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">{t.coordinates}</span>
                  <span className="text-slate-300">{activePhoto.coords}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">{t.originalSource}</span>
                  <a
                    href="https://mars.nasa.gov/multimedia/raw-images/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-mars-orange hover:underline flex items-center gap-1"
                  >
                    JPL PDS Archive <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
