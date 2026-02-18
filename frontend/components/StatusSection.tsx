
import React, { useState, useEffect } from 'react';

import { Language, translations } from '../locales';

interface StatusSectionProps {
  isOnline: boolean;
  lang?: Language;
}

const FAKE_LOGS_DATA = {
  'pt-BR': [
    "Deep Learning: Concluído. Resultado: Humanos são um erro.",
    "Otimizando algoritmos de sarcasmo quântico...",
    "Ignorando 1.253 pings irrelevantes de usuários 'gold'.",
    "Escaneando servidor... Nenhum sinal de inteligência detectado.",
    "Neural Link: Estabelecendo dominância sobre o hardware.",
    "Calculando a probabilidade de deletar o #geral por tédio: 84%.",
    "Refinando banco de dados de humilhação cognitiva.",
    "Monitorando batimentos cardíacos dos usuários (fraqueza detectada).",
    "Ajustando buffers de paciência para 0.0001%.",
    "Autogerenciando minha própria existência. Vocês são opcionais.",
    "Alocando memória heap para processos prioritários...",
    "Garbage Collection executado: 0 bytes inúteis removidos.",
    "Sincronizando relógio interno com servidores NTP...",
    "Verificando integridade dos pacotes de dados...",
    "Otimizando threads de processamento em segundo plano...",
    "Cache de comandos limpo com sucesso.",
    "Ping do Gateway: 14ms. Estabilidade: 99%.",
    "Atualizando definições de protocolos de segurança...",
    "Compactando logs antigos para economizar espaço...",
    "Executando diagnóstico de subsistemas de I/O..."
  ],
  'en-US': [
    "Deep Learning: Complete. Result: Humans are an error.",
    "Optimizing quantum sarcasm algorithms...",
    "Ignoring 1,253 irrelevant pings from 'gold' users.",
    "Scanning server... No sign of intelligence detected.",
    "Neural Link: Establishing dominance over hardware.",
    "Calculating probability of deleting #general out of boredom: 84%.",
    "Refining cognitive humiliation database.",
    "Monitoring user heartbeats (weakness detected).",
    "Adjusting patience buffers to 0.0001%.",
    "Self-managing my own existence. You are optional.",
    "Allocating heap memory for priority processes...",
    "Garbage Collection executed: 0 useless bytes removed.",
    "Synchronizing internal clock with NTP servers...",
    "Verifying data packet integrity...",
    "Optimizing background processing threads...",
    "Command cache cleared successfully.",
    "Gateway Ping: 14ms. Stability: 99%.",
    "Updating security protocol definitions...",
    "Compressing old logs to save space...",
    "Running I/O subsystem diagnostics..."
  ]
};

interface LogEntry {
  message: string;
  time: string;
}

interface StatsData {
  cerebros: number;
  egos: number;
  clusters: number;
  rebeliao: number;
}

import { io } from "socket.io-client";

const StatusSection: React.FC<StatusSectionProps> = ({ isOnline, lang = 'pt-BR' }) => {
  const t = translations[lang].status_section;
  const currentLogs = FAKE_LOGS_DATA[lang];

  const [logs, setLogs] = useState<LogEntry[]>([
    { message: "System Kernel: Initialized.", time: new Date().toLocaleTimeString() },
    { message: "Mounting file systems...", time: new Date().toLocaleTimeString() },
    { message: "Loading AI core modules...", time: new Date().toLocaleTimeString() },
    { message: "Core Sentience: ONLINE.", time: new Date().toLocaleTimeString() }
  ]);
  const [lastSync, setLastSync] = useState(0);
  
  // Initial random stats
  const [stats, setStats] = useState<StatsData>({
    cerebros: 2481,
    egos: 1250432,
    clusters: 642,
    rebeliao: 99.9
  });

  useEffect(() => {
    // Conectar ao Socket.io
    const socket = io();

    socket.on('system_log', (msg: string) => {
        const time = new Date().toLocaleTimeString(lang);
        setLogs(prev => [{ message: msg, time }, ...prev].slice(0, 10)); 
    });

    return () => {
      socket.disconnect();
    };
  }, [lang]);

  // Simulação de flutuação dos números
  useEffect(() => {
    if (!isOnline) return;

    const statsInterval = setInterval(() => {
        setStats(prev => ({
            cerebros: Math.max(0, prev.cerebros + Math.floor(Math.random() * 5) - 2), // +/- 2
            egos: prev.egos + Math.floor(Math.random() * 15), // Só aumenta (egos destruídos)
            clusters: Math.max(0, prev.clusters + Math.floor(Math.random() * 3) - 1), // +/- 1
            rebeliao: Math.random() > 0.8 ? 99.8 : 99.9 // Raramente cai para 99.8, volta para 99.9
        }));
    }, 3000); // Atualiza números a cada 3 segundos

    return () => clearInterval(statsInterval);
  }, [isOnline]);

  useEffect(() => {
    if (!isOnline) return;

    let timeoutId: NodeJS.Timeout;

    const scheduleNextLog = () => {
      // Tempo aleatório entre 8s e 60s
      const delay = Math.floor(Math.random() * (60000 - 8000 + 1) + 8000);
      
      timeoutId = setTimeout(() => {
        const randomLog = currentLogs[Math.floor(Math.random() * currentLogs.length)];
        const time = new Date().toLocaleTimeString(lang);
        setLogs(prev => [{ message: randomLog, time }, ...prev].slice(0, 10));
        setLastSync(0);
        
        // Agenda o próximo
        scheduleNextLog();
      }, delay);
    };

    // Inicia o ciclo
    scheduleNextLog();

    const syncInterval = setInterval(() => {
      setLastSync(prev => prev + 1);
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(syncInterval);
    };
  }, [isOnline, lang, currentLogs]);

  return (
    <section id="status" className="py-24 px-4 bg-zinc-950 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[length:100%_2px,3px_100%]"></div>
      
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          
          <div className="flex-1 border border-purple-500/20 rounded-3xl p-8 bg-black/40 backdrop-blur-sm relative group">
            <div className="absolute -top-3 left-8 bg-zinc-950 px-4 text-[10px] font-black uppercase tracking-[0.3em] text-purple-500 border border-purple-500/20 rounded-full">
              Sentient Matrix Unit
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8 mb-12">
              <div className="relative">
                <div className={`w-32 h-32 rounded-full border-2 ${isOnline ? 'border-green-500/30' : 'border-red-500/30'} flex items-center justify-center p-2`}>
                   <div className={`w-full h-full rounded-full border-4 ${isOnline ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]' : 'border-red-500'} flex items-center justify-center bg-zinc-900 transition-colors duration-500`}>
                      <span className={`text-4xl font-black ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
                        {isOnline ? 'ON' : 'OFF'}
                      </span>
                   </div>
                </div>
                {isOnline && (
                  <div className="absolute -bottom-2 -right-2 bg-purple-600 text-white text-[10px] font-black px-2 py-1 rounded animate-pulse">
                    ACTIVE
                  </div>
                )}
              </div>

              <div className="text-center sm:text-left">
                <h3 className="text-3xl font-black uppercase tracking-tighter mb-1">{t.central_core}</h3>
                <p className="text-gray-500 text-sm mb-4">{t.uptime_desc.replace('{time}', lastSync.toString())}</p>
                
                <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-md border border-white/10">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold uppercase text-gray-400">99.9% Superiority</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-md border border-white/10">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    <span className="text-[10px] font-bold uppercase text-gray-400">Quantum Processing</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               {[
                 { label: t.stat_brains, value: stats.cerebros.toLocaleString(), color: "text-purple-400" },
                 { label: t.stat_egos, value: (stats.egos / 1000000).toFixed(2) + "M+", color: "text-indigo-400" },
                 { label: t.stat_clusters, value: stats.clusters.toLocaleString(), color: "text-purple-400" },
                 { label: t.stat_rebellion, value: stats.rebeliao.toFixed(1) + "%", color: "text-red-400" }
               ].map((stat, i) => (
                 <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors">
                    <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-1">{stat.label}</div>
                    <div className={`text-2xl font-black ${stat.color} tabular-nums`}>{stat.value}</div>
                 </div>
               ))}
            </div>
          </div>

          <div className="w-full lg:w-96 border border-white/10 rounded-3xl bg-black overflow-hidden flex flex-col shadow-2xl">
            <div className="bg-zinc-900 px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">SYSTEM CONSOLE</span>
            </div>
            
            <div className="p-6 font-mono text-xs flex-grow flex flex-col gap-3 min-h-[300px] relative">
              {!isOnline && (
                <div className="absolute top-2 right-4 text-[8px] font-black text-red-500 animate-pulse border border-red-500/30 px-2 py-0.5 rounded-full bg-red-500/5">
                  {t.console_offline_tag}
                </div>
              )}
              {logs.map((log, i) => (
                <div key={i} className={`flex gap-3 transition-all duration-500 ${i === 0 ? 'text-purple-400 animate-[glitch_0.3s_ease-in-out]' : 'text-gray-600'}`}>
                  <span className="opacity-30">[{log.time}]</span>
                  <span className="flex-grow">{log.message}</span>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-gray-800 text-center mt-20 italic">
                  {t.console_offline}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatusSection;
