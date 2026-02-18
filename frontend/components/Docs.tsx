import React from 'react';
import { translations, Language } from '../locales';

interface DocsProps {
  lang: Language;
}

const Docs: React.FC<DocsProps> = ({ lang }) => {
  const t = translations[lang];

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-8 font-mono relative z-10 text-gray-200">
      <div className="max-w-5xl mx-auto space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-600 to-indigo-600 glitch-effect cursor-default">
                  {t.docs.title_start}
              </span>{' '}
              <span className="text-white">
                  {t.docs.title_end}
              </span>
            </h1>
            <p className="text-lg md:text-2xl text-purple-300 border-l-4 border-purple-500 pl-4 inline-block font-bold">
                {t.docs.subtitle}
            </p>
        </div>

        {/* Intro Section */}
        <div className="bg-gray-900/80 p-8 rounded-xl border border-purple-500/30 backdrop-blur-sm shadow-[0_0_20px_rgba(168,85,247,0.15)] relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl">📖</div>
             <p className="text-xl leading-relaxed font-medium mb-6">{t.docs.intro}</p>
             <ul className="space-y-2 text-purple-200 list-disc pl-5">
                <li><strong className="text-purple-400">Target:</strong> {t.docs.intro_list.l1}</li>
                <li><strong className="text-purple-400">Core:</strong> {t.docs.intro_list.l2}</li>
                <li><strong className="text-purple-400">You:</strong> {t.docs.intro_list.l3}</li>
             </ul>
        </div>

        {/* Configuration Flow (Cheat Sheet) */}
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <span className="text-purple-500 text-4xl">⚡</span> {t.docs.steps.title}
            </h2>
            <div className="grid md:grid-cols-5 gap-4">
                {[t.docs.steps.s1, t.docs.steps.s2, t.docs.steps.s3, t.docs.steps.s4, t.docs.steps.s5].map((step, i) => (
                    <div key={i} className="bg-purple-900/20 p-4 rounded-lg border border-purple-500/50 hover:bg-purple-900/40 transition-all cursor-default">
                        <p className="text-sm font-bold text-purple-100">{step}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* Commands Section */}
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white border-b border-purple-500 pb-2 flex items-center gap-3">
                <span className="text-red-500">⌨️</span> {t.docs.sections.commands.title}
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
                {[
                    t.docs.sections.commands.iniciar,
                    t.docs.sections.commands.status,
                    t.docs.sections.commands.limpar,
                    t.docs.sections.commands.logs,
                    t.docs.sections.commands.dates
                ].map((cmd, i) => (
                    <div key={i} className="bg-gray-800/50 p-6 rounded-lg border-l-4 border-purple-500 hover:bg-gray-800 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-2xl font-black text-purple-400 font-mono group-hover:text-purple-300 transition-colors">{cmd.name}</h3>
                            <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300 uppercase tracking-wider">{cmd.perms}</span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">{cmd.desc}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* Detailed Features Grid */}
        <div className="space-y-8">
             <h2 className="text-3xl font-bold text-white border-b border-purple-500 pb-2 flex items-center gap-3">
                <span className="text-purple-500">⚙️</span> MODULES
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Cleaning */}
                <div className="bg-gray-900/60 p-6 rounded-xl border border-red-500/30">
                    <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                        🧹 {t.docs.sections.cleaning.title}
                    </h3>
                    <p className="text-sm mb-4 italic text-gray-400">"{t.docs.sections.cleaning.desc}"</p>
                    <ul className="space-y-3 text-sm">
                        <li className="flex gap-2"><span className="text-red-500">▸</span> {t.docs.sections.cleaning.auto}</li>
                        <li className="flex gap-2"><span className="text-red-500">▸</span> {t.docs.sections.cleaning.filters}</li>
                        <li className="bg-red-500/10 p-2 rounded border border-red-500/20 text-red-200 text-xs">
                           🛡️ <strong>SAFEGUARD:</strong> {t.docs.sections.cleaning.safety}
                        </li>
                    </ul>
                </div>

                {/* Anti-Spam */}
                <div className="bg-gray-900/60 p-6 rounded-xl border border-yellow-500/30">
                    <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                        🛡️ {t.docs.sections.antispam.title}
                    </h3>
                    <p className="text-sm mb-4 italic text-gray-400">"{t.docs.sections.antispam.desc}"</p>
                     <ul className="space-y-3 text-sm">
                        <li className="flex gap-2"><span className="text-yellow-500">▸</span> {t.docs.sections.antispam.types}</li>
                        <li className="flex gap-2"><span className="text-yellow-500">▸</span> {t.docs.sections.antispam.actions}</li>
                    </ul>
                </div>

                {/* Dates */}
                <div className="bg-gray-900/60 p-6 rounded-xl border border-blue-500/30">
                    <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                        📅 {t.docs.sections.dates.title}
                    </h3>
                    <p className="text-sm mb-4 italic text-gray-400">"{t.docs.sections.dates.desc}"</p>
                    <ul className="space-y-3 text-sm">
                        <li className="flex gap-2"><span className="text-blue-500">▸</span> {t.docs.sections.dates.globals}</li>
                        <li className="flex gap-2"><span className="text-blue-500">▸</span> {t.docs.sections.dates.custom}</li>
                    </ul>
                </div>

                 {/* Logs */}
                 <div className="bg-gray-900/60 p-6 rounded-xl border border-green-500/30">
                    <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                        📝 {t.docs.sections.logs.title}
                    </h3>
                    <p className="text-sm mb-4 italic text-gray-400">"{t.docs.sections.logs.desc}"</p>
                    <div className="bg-green-900/20 p-3 rounded text-xs text-green-200 border border-green-500/30">
                        {t.docs.sections.logs.note}
                    </div>
                </div>
            </div>
        </div>

        {/* Status Command Bonus */}
        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 p-8 rounded-xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">💡 {t.docs.status_cmd.title}</h3>
                <p className="text-gray-300 max-w-xl">{t.docs.status_cmd.desc}</p>
            </div>
             <div className="flex gap-2">
                <button className="px-4 py-2 bg-gray-700 rounded text-gray-400 cursor-not-allowed border border-gray-600 font-mono text-sm">🌐 Site</button>
                <button className="px-4 py-2 bg-gray-700 rounded text-gray-400 cursor-not-allowed border border-gray-600 font-mono text-sm">📖 Docs</button>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded shadow-lg shadow-blue-500/30 font-bold flex items-center gap-2 transform hover:scale-105 transition-all">
                    <span>⚙️</span> Configurar
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Docs;
