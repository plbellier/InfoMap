import React from 'react';

interface ControlPanelProps {
  timeFilter: string;
  setTimeFilter: (filter: string) => void;
  topic: string;
  setTopic: (topic: string) => void;
}

const topics = [
  { id: 'General', label: 'General', icon: '🌐' },
  { id: 'Economy', label: 'Finance', icon: '🏦' },
  { id: 'Politics', label: 'Politics', icon: '🏛️' },
  { id: 'Tech', label: 'Tech', icon: '⚡' },
  { id: 'Military', label: 'Military/Geo', icon: '⚔️' }
];

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
  timeFilter, 
  setTimeFilter, 
  topic, 
  setTopic 
}) => {
  return (
    <div className="absolute bottom-20 left-4 right-4 sm:left-auto sm:translate-x-0 sm:right-6 sm:bottom-6 z-[1000] pointer-events-auto flex flex-col items-center sm:items-end gap-3 sm:w-72 animate-in slide-in-from-bottom-4">
      <div className="w-full bg-[#0d1117]/80 backdrop-blur-xl border border-[#30363d] p-1 sm:p-1.5 rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col">
        {/* Header */}
        <div className="px-3 py-1 sm:px-4 sm:py-2 border-b border-[#30363d]/50 flex items-center justify-between mb-1 sm:mb-2">
          <span className="text-[7px] sm:text-[8px] font-black text-gray-500 uppercase tracking-[0.1em] sm:tracking-[0.2em]">Tactical Feed</span>
          <div className="flex gap-2">
            {[
              { id: '24h', label: '24H' },
              { id: '7d', label: '7D' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setTimeFilter(f.id)}
                className={`px-2.5 py-1 rounded-md text-[8px] font-black transition-all ${timeFilter === f.id ? 'bg-orange-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Grid */}
        <div className="grid grid-cols-2 gap-1.5 p-1.5 w-full">
          {topics.map((t) => (
            <button
              key={t.id}
              onClick={() => setTopic(t.id)}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border transition-all duration-300 group relative ${topic === t.id
                ? 'bg-blue-600/20 border-blue-500/50 text-white shadow-[inset_0_0_15px_rgba(59,130,246,0.1)]'
                : 'bg-white/[0.01] border-white/5 text-gray-500 hover:bg-white/[0.03] hover:border-white/10 hover:text-gray-300'
                }`}
            >
              <span className={`text-base transition-transform group-hover:scale-110 ${topic === t.id ? 'opacity-100' : 'opacity-30'}`}>{t.icon}</span>
              <span className="text-[7px] font-black uppercase tracking-wider">{t.label}</span>
              {topic === t.id && (
                <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-blue-400 animate-pulse"></div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
