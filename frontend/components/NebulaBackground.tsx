
import React from 'react';

const NebulaBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[#050505]"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/10 blur-[150px]"></div>
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-600/5 blur-[100px] animate-bounce" style={{ animationDuration: '20s' }}></div>
      
      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{ 
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      ></div>
    </div>
  );
};

export default NebulaBackground;
