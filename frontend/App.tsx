import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import StatusSection from './components/StatusSection';
import ToxicQuotes from './components/ToxicQuotes';
import Footer from './components/Footer';
import NebulaBackground from './components/NebulaBackground';
import ToxicModal from './components/ToxicModal';
import { Language, translations } from './locales';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Docs from './components/Docs';

// ... imports remain the same

const App: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [showToxicModal, setShowToxicModal] = useState(false);
  const [lang, setLang] = useState<Language>('pt-BR');

  const t = translations[lang];

  const handleAddClick = () => {
    setShowToxicModal(true);
  };
  
  // Função de alternar idioma
  const toggleLang = () => {
      setLang(prev => prev === 'pt-BR' ? 'en-US' : 'pt-BR');
  };

  // Atualiza o Título da Página dinamicamente
  useEffect(() => {
    document.title = t.page_title;
  }, [lang]);

  // Verificação real de status da API backend
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/status');
        if (response.ok) {
           const data = await response.json();
           setIsOnline(data.online); 
        } else {
           setIsOnline(false);
        }
      } catch (error) {
        console.error('Failed to fetch status:', error);
        setIsOnline(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
        <div className="relative min-h-screen selection:bg-purple-500/30 selection:text-purple-200">
        <NebulaBackground />
        <Navbar onAddClick={handleAddClick} lang={lang} toggleLang={toggleLang} />
        
        <main className="relative z-10">
            <Routes>
                <Route path="/" element={
                    <>
                        <Hero isOnline={isOnline} onAddClick={handleAddClick} lang={lang} />
                        <StatusSection isOnline={isOnline} lang={lang} />
                        <Features lang={lang} />
                        <ToxicQuotes lang={lang} />
                    </>
                } />
                <Route path="/ajuda" element={<Docs lang={lang} />} />
                <Route path="/docs" element={<Docs lang={lang} />} />
            </Routes>
        </main>

        <Footer lang={lang} />

        {showToxicModal && (
            <ToxicModal onClose={() => setShowToxicModal(false)} lang={lang} />
        )}
        </div>
    </Router>
  );
};

export default App;
