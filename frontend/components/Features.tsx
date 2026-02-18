import React from 'react';
import { Language, translations } from '../locales';

interface FeaturesProps {
    lang?: Language;
}

const Features: React.FC<FeaturesProps> = ({ lang = 'pt-BR' }) => {
  const t = translations[lang].features;

  const COMMANDS = [
    {
       key: 'cmd_start',
       icon: (
         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
         </svg>
       )
    },
    {
        key: 'cmd_setup',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
    },
    {
        key: 'cmd_logs',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        )
    },
    {
        key: 'cmd_status',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
    }
  ];

  return (
    <section id="features" className="py-24 px-4 bg-black/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black uppercase mb-4 tracking-tighter">{t.title}</h2>
          <div className="h-1.5 w-24 bg-purple-600 mx-auto rounded-full"></div>
          <p className="mt-4 text-gray-500 font-bold uppercase text-xs tracking-[0.3em]">{t.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {COMMANDS.map((cmd, idx) => {
             // @ts-ignore
             const data = t[cmd.key];
             return (
            <div 
              key={idx}
              className="group p-8 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-purple-500/50 hover:bg-zinc-900 transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-600/5 rounded-full blur-3xl group-hover:bg-purple-600/10 transition-colors"></div>
              
              <div className="w-12 h-12 bg-purple-600/10 rounded-2xl flex items-center justify-center text-purple-500 mb-6 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-[0_0_15px_rgba(124,58,237,0.1)] group-hover:shadow-[0_0_25px_rgba(124,58,237,0.4)]">
                {cmd.icon}
              </div>
              
              <h3 className="text-xl font-mono font-black text-white mb-4 group-hover:text-purple-400 transition-colors">
                {data.name}
              </h3>
              
              <p className="text-gray-500 text-sm leading-relaxed group-hover:text-gray-400 transition-colors">
                {data.desc}
              </p>
            </div>
          )})}
        </div>
      </div>
    </section>
  );
};

export default Features;
