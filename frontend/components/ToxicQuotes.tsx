import React, { useState, useEffect } from 'react';
import { Language, translations } from '../locales';

interface ToxicQuotesProps {
  lang?: Language;
}

const ToxicQuotes: React.FC<ToxicQuotesProps> = ({ lang = 'pt-BR' }) => {
  const t = translations[lang];
  const [quote, setQuote] = useState("");
  const [loading, setLoading] = useState(false);

  // Update initial quote when language changes
  useEffect(() => {
     setQuote(t.quotes.initial);
  }, [lang]);

  const fetchQuote = async () => {
    setLoading(true);
    try {
      // Pequeno delay artificial para "dramatizar" o processamento da IA e garantir transição visual
      const [res] = await Promise.all([
        fetch(`/api/insulto?lang=${lang}&ts=${Date.now()}`),
        new Promise(resolve => setTimeout(resolve, 800)) 
      ]);
      
      const data = await res.json();
      setQuote(data.text || t.quotes.error);
    } catch (error) {
      console.error("Falha ao carregar insulto:", error);
      setQuote(t.quotes.fallback);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="toxic" className="py-24 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-black uppercase text-purple-500 mb-12 tracking-widest">{t.quotes.title}</h2>
        
        <div className="relative p-12 rounded-3xl bg-zinc-900 border-2 border-purple-900/30 overflow-hidden group">
          <div className="absolute top-0 left-0 p-4 text-6xl text-purple-900/20 font-serif">"</div>
          <div className="absolute bottom-0 right-0 p-4 text-6xl text-purple-900/20 font-serif">"</div>
          
          <p className={`text-2xl md:text-4xl font-medium leading-tight mb-8 transition-opacity duration-500 ${loading ? 'opacity-30' : 'opacity-100'}`}>
            {quote || t.quotes.initial}
          </p>

          <button 
            onClick={fetchQuote}
            disabled={loading}
            className="px-6 py-2 bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-600/30 rounded-lg transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2 mx-auto disabled:opacity-50"
          >
            {loading ? t.quotes.btn_loading : t.quotes.btn_request}
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default ToxicQuotes;
