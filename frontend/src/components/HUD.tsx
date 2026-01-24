import React from 'react';

interface HUDProps {
  apiUsage: number;
  maxQuota: number;
}

export const Header: React.FC = () => (
  <div className="absolute top-2 sm:top-8 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none text-center w-full px-4">
    <h1 className="text-2xl sm:text-5xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.8)] italic">
      INFOMAP<span className="text-blue-500">.</span>
    </h1>
    <p className="text-blue-400 text-[7px] sm:text-[10px] tracking-[0.1em] sm:tracking-[0.4em] font-bold uppercase mt-0.5 opacity-70">Intelligence Matrix</p>
  </div>
);

export const ApiUsageHUD: React.FC<HUDProps> = ({ apiUsage, maxQuota }) => (
  <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-[1000]">
    <div className="bg-[#0d1117]/80 backdrop-blur-md border border-[#30363d] px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-2xl flex items-center gap-2 sm:gap-4">
      <div className="flex flex-col">
        <span className="text-[7px] sm:text-[10px] text-gray-400 font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] mb-0.5">Quota</span>
        <span className={`text-xs sm:text-base font-mono font-bold ${apiUsage >= maxQuota - 2 ? 'text-red-500' : 'text-blue-400'}`}>
          {apiUsage}/{maxQuota}
        </span>
      </div>
      <div className="h-6 sm:h-10 w-[1px] bg-[#30363d]"></div>
      <div className="relative w-6 h-6 sm:w-8 sm:h-8">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="12" cy="12" r="10" className="sm:hidden" fill="transparent" stroke="#161b22" strokeWidth="2" />
          <circle cx="16" cy="16" r="14" className="hidden sm:block" fill="transparent" stroke="#161b22" strokeWidth="3" />
          <circle
            cx="12" cy="12" r="10"
            className="sm:hidden transition-all duration-1000 ease-out"
            fill="transparent"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray={63}
            strokeDashoffset={63 - (apiUsage / maxQuota) * 63}
          />
          <circle
            cx="16" cy="16" r="14"
            className="hidden sm:block transition-all duration-1000 ease-out"
            fill="transparent"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeDasharray={88}
            strokeDashoffset={88 - (apiUsage / maxQuota) * 88}
          />
        </svg>
      </div>
    </div>
  </div>
);
