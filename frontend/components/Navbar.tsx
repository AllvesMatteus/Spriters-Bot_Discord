import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Language, translations } from '../locales';

interface NavbarProps {
  onAddClick: () => void;
  lang?: Language;
  toggleLang?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onAddClick, lang = 'pt-BR', toggleLang }) => {
  const t = translations[lang];
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img 
            src="/sprite_logo_roxo.png" 
            alt="Spriters" 
            className="h-10 w-auto object-contain brightness-150 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)] group-hover:scale-105 transition-transform"
          />
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium uppercase tracking-widest text-gray-400">
          {isHome ? (
            <>
                <a href="#features" className="hover:text-white transition-colors">{t.nav.commands}</a>
                <a href="#status" className="hover:text-white transition-colors">{t.nav.status}</a>
                <a href="#toxic" className="hover:text-white transition-colors">{t.nav.personality}</a>
            </>
          ) : (
                <Link to="/" className="hover:text-white transition-colors">{t.nav.home}</Link>
          )}
          <Link to="/ajuda" className={`hover:text-white transition-colors ${!isHome ? 'text-white font-bold' : ''}`}>
             <span className="flex items-center gap-1">
                {t.nav.docs}
             </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleLang}
            className="text-gray-400 hover:text-white transition-colors text-sm font-bold border border-gray-700 rounded px-2 py-1"
          >
            {lang === 'pt-BR' ? '🇺🇸 EN' : '🇧🇷 PT'}
          </button>

          <a 
            href="https://github.com/AllvesMatteus" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hidden sm:block text-gray-400 hover:text-white transition-colors"
          >
            <span className="sr-only">GitHub</span>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
          </a>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
