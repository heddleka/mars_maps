import React from 'react';
import { 
  Mountain, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle,
  FlaskConical,
  History,
  X
} from 'lucide-react';
import { marsAudio } from '../utils/audioSystem';
import { TRANSLATIONS } from '../data/translations';

export default function BoxworkScienceGuide({ onClose, lang = 'en' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in select-none">
      <div className="relative max-w-3xl w-full bg-slate-900 border border-fuchsia-500/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30">
              <Mountain className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-mono text-fuchsia-400 font-bold uppercase tracking-wider">
                {t.dossierBadge}
              </span>
              <h2 className="text-base font-orbitron font-bold text-white">
                {t.dossierTitle}
              </h2>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              marsAudio.playBlip();
            }}
            className="text-slate-400 hover:text-white p-2 text-base font-mono rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-slate-200 text-xs leading-relaxed">
          
          {/* Main Visual Banner */}
          <div className="relative rounded-xl overflow-hidden border border-fuchsia-500/30 bg-black">
            <img 
              src="https://science.nasa.gov/wp-content/uploads/2024/09/boxwork-pia26388.jpg" 
              alt="Curiosity Boxwork Formations"
              className="w-full h-56 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90" />
            <div className="absolute bottom-3 left-3 right-3 text-[11px] font-mono text-slate-300">
              {t.dossierImageCaption}
            </div>
          </div>

          {/* Section 1: What is Boxwork? */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <h3 className="text-sm font-orbitron font-bold text-fuchsia-400 flex items-center gap-2">
              <History className="w-4 h-4" />
              {t.dossierSec1Title}
            </h3>
            <p className="text-slate-300">
              {t.dossierSec1P1}
            </p>
            <p className="text-slate-300">
              {t.dossierSec1P2}
            </p>
          </div>

          {/* Section 2: Why is it Critical for Astronauts? */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-cyan-500/30">
              <div className="flex items-center gap-2 text-cyan-400 font-bold font-orbitron text-xs mb-1">
                <FlaskConical className="w-4 h-4" />
                {t.dossierSec2LeftTitle}
              </div>
              <p className="text-slate-300 text-[11px]">
                {t.dossierSec2LeftDesc}
              </p>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-400 font-bold font-orbitron text-xs mb-1">
                <AlertCircle className="w-4 h-4" />
                {t.dossierSec2RightTitle}
              </div>
              <p className="text-slate-300 text-[11px]">
                {t.dossierSec2RightDesc}
              </p>
            </div>
          </div>

          {/* Section 3: Astronaut Field Protocol */}
          <div className="bg-fuchsia-950/30 p-4 rounded-xl border border-fuchsia-500/40 space-y-2">
            <h3 className="text-sm font-orbitron font-bold text-fuchsia-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {t.dossierSec3Title}
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300 font-mono text-[11px]">
              <li>{t.dossierSec3Step1}</li>
              <li>{t.dossierSec3Step2}</li>
              <li>{t.dossierSec3Step3}</li>
              <li>{t.dossierSec3Step4}</li>
            </ol>
          </div>

          {/* External Citation */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>{t.dossierCitation}</span>
            <a 
              href="https://science.nasa.gov/resource/curiositys-proposed-path-up-mount-sharp/" 
              target="_blank" 
              rel="noreferrer"
              className="text-mars-orange hover:underline flex items-center gap-1"
            >
              Curiosity Mount Sharp Traverse <ExternalLink className="w-3 h-3" />
            </a>
          </div>

        </div>

      </div>
    </div>
  );
}
