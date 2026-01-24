import React from 'react';

interface HUDProps {
  apiUsage: number;
  maxQuota: number;
}

export const Header: React.FC = () => (
  <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none text-center">
    <h1 className="text-5xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.8)] italic">
      INFOMAP<span className="text-blue-500">.</span>
    </h1>
    <p className="text-blue-400 text-[10px] tracking-[0.4em] font-bold uppercase mt-1 opacity-70">Global Intelligence Matrix</p>
  </div>
);

export const ApiUsageHUD: React.FC<HUDProps> = ({ apiUsage, maxQuota }) => (
  <div className="absolute top-6 right-6 z-[1000]">
    <div className="bg-[#0d1117]/80 backdrop-blur-md border border-[#30363d] px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-4">
      <div className="flex flex-col">
        <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-0.5">API Quota</span>
        <span className={`text-base font-mono font-bold ${apiUsage >= maxQuota - 2 ? 'text-red-500' : 'text-blue-400'}`}>
          {apiUsage} / {maxQuota}
        </span>
      </div>
      <div className="h-10 w-[1px] bg-[#30363d]"></div>
      <div className="relative w-8 h-8">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="16" cy="16" r="14" fill="transparent" stroke="#161b22" strokeWidth="3" />
          <circle
            cx="16" cy="16" r="14"
            fill="transparent"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeDasharray={88}
            strokeDashoffset={88 - (apiUsage / maxQuota) * 88}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
      </div>
    </div>
  </div>
);
