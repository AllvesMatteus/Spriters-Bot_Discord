import React from 'react';
import { Language, translations } from '../locales';

interface HeroProps {
  isOnline: boolean;
  onAddClick: () => void;
  lang?: Language;
}

const Hero: React.FC<HeroProps> = ({ isOnline, onAddClick, lang = 'pt-BR' }) => {
  const t = translations[lang];

  return (
    <section className="relative pt-32 pb-20 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto text-center">
        <div className="flex justify-center mb-8 relative group">
          <div className="absolute inset-0 bg-purple-600/20 blur-[50px] rounded-full group-hover:bg-purple-600/30 transition-all duration-500"></div>
          <img 
            src="/logo.png" 
            alt="Spriters Bot Logic Core" 
            className="relative w-40 h-40 md:w-56 md:h-56 object-contain drop-shadow-[0_0_20px_rgba(124,58,237,0.5)] animate-float"
          />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-400 uppercase tracking-widest mb-8 animate-pulse">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 animate-ping'}`}></span>
          {isOnline ? t.hero.active : t.hero.hibernating}
        </div>

        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-6">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-600 to-indigo-600 glitch-effect cursor-default">
            {t.hero.title_start}
          </span>{' '}
          <span className="text-white">
            {t.hero.title_end}
          </span>
        </h1>

        <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-400 mb-10 leading-relaxed">
          {t.hero.description}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <button 
            onClick={onAddClick}
            className="w-full sm:w-auto px-10 py-4 bg-purple-600 hover:bg-purple-500 text-white font-black text-lg rounded-xl shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-all hover:-translate-y-1"
          >
            {t.hero.cta_add}
          </button>
          <a 
            href="https://github.com/AllvesMatteus" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-10 py-4 bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 rounded-xl transition-all text-center"
          >
            {t.hero.cta_github}
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
