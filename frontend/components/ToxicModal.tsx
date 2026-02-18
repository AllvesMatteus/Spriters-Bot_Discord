
import React, { useEffect } from 'react';
import { Language, translations } from '../locales';

interface ToxicModalProps {
  onClose: () => void;
  lang: Language;
}

const ToxicModal: React.FC<ToxicModalProps> = ({ onClose, lang }) => {
  const t = translations[lang];

  // Prevent scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all duration-300">
      <div 
        className="relative max-w-md w-full bg-zinc-900 border-2 border-purple-600 rounded-3xl p-8 shadow-[0_0_50px_rgba(124,58,237,0.4)] transform animate-[glitch_0.2s_ease-in-out_infinite]"
        style={{ animationIterationCount: 2 }}
      >
        {/* Logo Vazado */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-20 w-48 md:w-60">
            <img 
                src="/sprite_logo_roxo.png" 
                alt="Spriters Logo" 
                className="w-full h-auto drop-shadow-[0_0_15px_rgba(147,51,234,0.6)] transform hover:scale-105 transition-transform duration-300" 
            />
        </div>

        <div className="text-center mt-8">
          <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-purple-500/50 shadow-[0_0_20px_rgba(147,51,234,0.3)]">
            <span className="text-4xl text-purple-500 font-black">!</span>
          </div>
          
          <h2 className="text-3xl font-black uppercase text-white mb-4 tracking-tighter whitespace-pre-line">
            {t.modal.title}
          </h2>
          
          <p className="text-xl text-purple-200 font-bold leading-relaxed mb-8 italic whitespace-pre-line">
            {t.modal.desc}
          </p>

          <a 
            href="https://discord.com/oauth2/authorize?client_id=1420466972461764682"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="block w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg text-center cursor-pointer"
          >
            {t.modal.btn_otario}
          </a>
        </div>

        {/* Decorative corner elements */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-purple-500 rounded-tl-3xl"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-purple-500 rounded-br-3xl"></div>
      </div>
    </div>
  );
};

export default ToxicModal;
