import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  ExternalLink, 
  RefreshCw, 
  Maximize2, 
  Calendar
} from 'lucide-react';
import { marsAudio } from '../utils/audioSystem';
import { TRANSLATIONS } from '../data/translations';

const CURATED_NASA_PHOTOS = [
  {
    id: 'boxwork-01',
    rover: 'Curiosity (MSL)',
    sol: 4212,
    camera: 'Mastcam High-Resolution',
    title: 'Mount Sharp Boxwork Polygonal Vein Networks',
    title_uz: 'Mount Sharp Boxwork Ko\'pburchakli Mineral Tomirlari',
    desc: 'Curiosity close-up of intricate boxwork honeycomb mineral ridges created when mineral-rich fluids cemented fractures in bedrock, which were later exposed by wind erosion.',
    desc_uz: 'Curiosity tomonidan olingan yaqin surat: yerosti suvlari yoriqlarga minerallarni to\'ldirishi va shamol yemirilishi natijasida yuzada qolgan asalari uyasimon tosh tizmalari.',
    url: 'https://science.nasa.gov/wp-content/uploads/2024/09/boxwork-pia26388.jpg',
    site: 'Mount Sharp Gediz Vallis Ridge',
    coords: '-4.8350° S, 137.3200° E'
  },
  {
    id: 'vera-rubin-02',
    rover: 'Curiosity (MSL)',
    sol: 1926,
    camera: 'Mastcam Panoramic',
    title: 'Vera Rubin Hematite Ridge & Gale Crater Floor',
    title_uz: 'Vera Rubin Gematit Tizmasi va Gale Krateri Tubi',
    desc: 'View from the top of Vera Rubin Ridge looking back down across the clay-bearing Glen Torridon trough towards the northern rim of Gale Crater.',
    desc_uz: 'Vera Rubin tizmasining tepasidan Glen Torridon gil botiqligi va Gale kraterining shimoliy devoriga qarata olingan panorama.',
    url: 'https://mars.nasa.gov/msl-raw-images/proj/msl/redops/ods/surface/sol/01926/soas/fdr/fcam/FLB_568600108EDR_F0672044FHAZ00337M_.JPG',
    site: 'Vera Rubin Ridge',
    coords: '-4.7290° S, 137.3820° E'
  },
  {
    id: 'gediz-vallis-03',
    rover: 'Curiosity (MSL)',
    sol: 3880,
    camera: 'Front Hazard Avoidance (Hazcam)',
    title: 'Gediz Vallis Megablock Boulder Field',
    title_uz: 'Gediz Vallis Ulkan Toshlar Maydoni',
    desc: 'Traversing the debris flow corridor with massive dark boulders washed down Mount Sharp during ancient catastrophic wet debris events.',
    desc_uz: 'Qadimgi halokatli sel toshqinlari davrida Mount Sharp tog\'idan oqib tushgan ulkan qora xarsangtoshlar maydoni.',
    url: 'https://mars.nasa.gov/msl-raw-images/proj/msl/redops/ods/surface/sol/03880/soas/fdr/fcam/FLB_742137599EDR_F1020000FHAZ00304M_.JPG',
    site: 'Gediz Vallis Ridge',
    coords: '-4.7820° S, 137.3550° E'
  },
  {
    id: 'cheyava-04',
    rover: 'Perseverance',
    sol: 1217,
    camera: 'SHERLOC WATSON Microscopic',
    title: 'Cheyava Falls "Leopard Spots" Biosignature Candidate',
    title_uz: 'Cheyava Falls "Qoplon Dog\'lari" Hayot Izlari Namunasi',
    desc: 'High-magnification view of reddish vein rock showing millimeter-scale white halos with black borders containing iron phosphate, pointing to chemical reactions that could have sustained microbial life.',
    desc_uz: 'Mikroskopik surat: qizg\'ish tosh yuzasida temir fosfatini o\'z ichiga olgan oq halqalar — qadimda mikrobial hayotni quvvatlagan kimyoviy reaksiyalar dalili.',
    url: 'https://mars.nasa.gov/system/resources/detail_files/28080_PIA26372-web.jpg',
    site: 'Bright Angel Margin Unit',
    coords: '18.5120° N, 77.3480° E'
  },
  {
    id: 'kodiak-05',
    rover: 'Perseverance',
    sol: 78,
    camera: 'Mastcam-Z Telephoto',
    title: 'Kodiak Butte Delta Sediment Stratigraphy',
    title_uz: 'Kodiak Butte Qadimgi Daryo Deltasi Qatlamlari',
    desc: 'Telephoto view of the isolated Kodiak butte displaying clear horizontal bottomset beds capped by dipping foreset delta beds, demonstrating ancient high-energy river lake inflow.',
    desc_uz: 'Alohida turgan Kodiak qoyasida qadimgi daryoning ko\'lga quyilishi natijasida hosil bo\'lgan gorizontal va nishab cho\'kindi qatlamlar.',
    url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/00078/ids/edr/browse/mcam/ML0_0078_0673753303_193ECM_N0010052AUT_04095_00_2J01.png',
    site: 'Kodiak Butte Delta Remnant',
    coords: '18.4090° N, 77.4080° E'
  },
  {
    id: 'hawksbill-06',
    rover: 'Perseverance',
    sol: 525,
    camera: 'Mastcam-Z Right Eye',
    title: 'Hawksbill Gap Delta Front Scarp',
    title_uz: 'Hawksbill Gap Delta Qoyasi',
    desc: 'Climbing into the lower delta front sediments where abundant organic matter was discovered in the Wildcat Ridge mudstone core sample.',
    desc_uz: 'Wildcat Ridge namunalarida ko\'plab organik birikmalar topilgan quyi delta qoyasi bo\'ylab ko\'tarilish.',
    url: 'https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/00525/ids/edr/browse/zcam/ZR0_0525_0713783457_012ECM_N0010052AUT_04095_00_2J01.png',
    site: 'Hawksbill Gap',
    coords: '18.4550° N, 77.3910° E'
  }
];

export default function MarsRawGallery({ zone, lang = 'en' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const [photos, setPhotos] = useState(CURATED_NASA_PHOTOS);
  const [selectedRover, setSelectedRover] = useState(zone.id === 'gale' ? 'Curiosity' : 'Perseverance');
  const [activePhoto, setActivePhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [solFilter, setSolFilter] = useState('');

  const fetchLiveNASAImages = async () => {
    setLoading(true);
    marsAudio.playBlip();

    const category = selectedRover === 'Curiosity' ? 'msl' : 'mars2020';
    const endpoint = `https://mars.nasa.gov/rss/api/?feed=raw_images&category=${category}&feedtype=json&num=12&page=0`;

    try {
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.images && data.images.length > 0) {
          const liveList = data.images.map((img) => ({
            id: img.imageid || String(img.id),
            rover: selectedRover,
            sol: img.sol,
            camera: img.camera?.full_name || img.camera?.instrument || 'Engineering Navcam',
            title: `Sol ${img.sol} Raw Surface Exposure`,
            title_uz: `Sol ${img.sol} Mars Sirti Xom Surati`,
            desc: `Raw image captured on Mars by ${selectedRover}. UTC: ${img.date_taken_utc || 'Recently received via DSN'}.`,
            desc_uz: `${selectedRover} tomonidan Marsda olingan haqiqiy xom surat. UTC: ${img.date_taken_utc || 'DSN orqali qabul qilingan'}.`,
            url: img.image_files?.full_res || img.image_files?.large || img.image_files?.medium,
            site: lang === 'uz' ? (zone.name_uz || zone.name) : zone.name,
            coords: `${zone.center[0]}°, ${zone.center[1]}°`
          })).filter(item => item.url);

          setPhotos([...liveList, ...CURATED_NASA_PHOTOS]);
        }
      }
    } catch (err) {
      console.warn('Using curated NASA raw images archive:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedRover(zone.id === 'gale' ? 'Curiosity' : 'Perseverance');
  }, [zone.id]);

  const filteredPhotos = photos.filter(p => {
    const matchRover = p.rover.toLowerCase().includes(selectedRover.toLowerCase());
    const matchSol = !solFilter || String(p.sol).includes(solFilter);
    return matchRover && matchSol;
  });

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

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={t.filterSolPlaceholder}
              value={solFilter}
              onChange={(e) => setSolFilter(e.target.value)}
              className="w-24 bg-transparent text-white focus:outline-none placeholder:text-slate-500"
            />
          </div>

          <button
            onClick={fetchLiveNASAImages}
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
        {filteredPhotos.map((photo) => {
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
                  onError={(e) => {
                    e.target.src = 'https://science.nasa.gov/wp-content/uploads/2024/09/boxwork-pia26388.jpg';
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
                src={activePhoto.url}
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
