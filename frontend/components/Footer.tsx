import React from 'react';
import { Link } from 'react-router-dom';
import { Language, translations } from '../locales';

interface FooterProps {
    lang?: Language;
}

const Footer: React.FC<FooterProps> = ({ lang = 'pt-BR' }) => {
  const t = translations[lang].footer;

  return (
    <footer className="border-t border-white/5 bg-black py-16 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <div className="flex flex-col items-center mb-12">
          <img 
            src="/sprite_logo_roxo.png" 
            alt="Spriters Bot" 
            className="h-16 w-auto object-contain mb-6 brightness-150 drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]"
          />
          <p className="text-gray-500 max-w-sm mx-auto mb-8">
            {t.description}
          </p>
          <div className="flex gap-6 justify-center items-center mb-10">
            <a href="https://discord.gg/bQdK693x" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform duration-300">
               <img src="/discord.png" alt="Discord" className="w-8 h-8 object-contain" />
            </a>
            <a href="https://github.com/AllvesMatteus" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform duration-300">
               <svg className="w-8 h-8 text-white hover:text-purple-400 transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
            </a>
            <a href="https://stats.uptimerobot.com/Zl6hlSMc61" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform duration-300">
               <img src="/uptimebot.png" alt="Uptime Robot" className="w-8 h-8 object-contain" />
            </a>
            <a href="https://render.com/your-render-link" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform duration-300">
               <img src="/render.png" alt="Render" className="w-8 h-8 object-contain" />
            </a>
          </div>

          <div className="flex gap-6 text-sm font-medium text-gray-500">
               <Link to="/ajuda" className="hover:text-purple-400 transition-colors uppercase tracking-wider text-[10px]">Docs / Ajuda</Link>
               <a href="/privacy.html" className="hover:text-purple-400 transition-colors uppercase tracking-wider text-[10px]">{t.links.privacy}</a>
               <a href="/terms.html" className="hover:text-purple-400 transition-colors uppercase tracking-wider text-[10px]">{t.links.terms}</a>
               <a href="/security.html" className="hover:text-purple-400 transition-colors uppercase tracking-wider text-[10px]">{t.links.security}</a>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t border-white/5 text-xs text-gray-600 font-bold uppercase tracking-widest">
          <p>{t.copyright}</p>
          <p>Silicon Overlord Certified</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
