import React from 'react';

interface NewsItem {
  titre: string;
  date: string;
  source_url: string;
}

interface CountryStats {
  population: number;
  region: string;
  subregion: string;
  capital: string;
  flag_emoji: string;
}

interface HistoryItem {
  country: string;
  time_filter: string;
  topic: string;
  news: NewsItem[];
  stats: CountryStats | null;
  timestamp: Date;
}

interface MatrixLogProps {
  history: HistoryItem[];
  setHistory: (history: HistoryItem[]) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCountry: string | null;
  timeFilter: string;
  topic: string;
  onRestore: (h: HistoryItem) => void;
}

export const MatrixLog: React.FC<MatrixLogProps> = ({
  history,
  setHistory,
  searchQuery,
  setSearchQuery,
  selectedCountry,
  timeFilter,
  topic,
  onRestore
}) => {
  return (
    <div className="absolute left-6 bottom-6 w-96 h-48 z-[1000] bg-[#0d1117]/60 backdrop-blur-md border border-[#30363d] rounded-3xl flex flex-col overflow-hidden pointer-events-auto shadow-xl">
      <div className="px-5 py-3 border-b border-[#30363d]/50 flex flex-col gap-2 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Matrix Log</span>
          <button onClick={() => setHistory([])} className="text-[9px] text-gray-500 hover:text-red-500 transition-colors uppercase font-black">Force Reset</button>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 text-[10px] text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/40 transition-all font-bold"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 custom-scroll">
        {history.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {history
              .filter(h => h.country.toLowerCase().includes(searchQuery.toLowerCase()) || h.topic.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((h, i) => (
                <button
                  key={i}
                  onClick={() => onRestore(h)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 ${selectedCountry === h.country && timeFilter === h.time_filter && topic === h.topic ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/40' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'}`}
                >
                  <div className="flex flex-col items-start leading-none">
                    <span>{h.country}</span>
                    <span className="text-[7px] text-orange-400/60 mt-0.5">{h.topic}</span>
                  </div>
                  <span className="opacity-50 text-[8px] border-l border-white/20 pl-2 self-center">{h.time_filter}</span>
                </button>
              ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-30 gap-2">
            <div className="w-8 h-8 rounded-full border border-dashed border-gray-500 animate-[spin_4s_linear_infinite] flex items-center justify-center">
              <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Await Reconnaissance</span>
          </div>
        )}
      </div>
    </div>
  );
};
