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

interface NewsSidebarProps {
  selectedCountry: string;
  setSelectedCountry: (country: string | null) => void;
  countryStats: CountryStats | null;
  loading: boolean;
  news: NewsItem[];
  error: string | null;
  timeFilter: string;
  topic: string;
  onRefresh: () => void;
}

export const NewsSidebar: React.FC<NewsSidebarProps> = ({
  selectedCountry,
  setSelectedCountry,
  countryStats,
  loading,
  news,
  error,
  onRefresh
}) => {
  return (
    <div className="absolute inset-0 sm:left-6 sm:top-6 sm:bottom-[15.5rem] sm:w-96 z-[2000] flex flex-col pointer-events-none sm:p-0">
      <div className="h-full w-full bg-[#0d1117] sm:bg-[#0d1117]/90 backdrop-blur-2xl sm:border sm:border-blue-500/20 sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom sm:slide-in-from-left-4 duration-300 pointer-events-auto">
        <div className="p-5 sm:p-6 border-b border-[#30363d] flex justify-between items-start bg-blue-500/5">
          <div className="flex-1 mr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{countryStats?.flag_emoji}</span>
              <h2 className="text-2xl font-black text-white tracking-tight leading-none uppercase">{selectedCountry}</h2>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${loading ? 'bg-blue-500 animate-ping' : 'bg-green-500'}`}></div>
                <span className="text-[10px] text-blue-400/80 font-bold uppercase tracking-[0.1em]">
                  {loading ? 'Decrypting frequencies...' : 'Real-time Signal'}
                </span>
              </div>
              {!loading && (
                <button
                  onClick={onRefresh}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all border border-blue-500/10 group"
                  title="Update Intelligence with current filters"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:rotate-180 transition-transform duration-500"><path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                  <span className="text-[8px] font-black uppercase">Update Signal</span>
                </button>
              )}
            </div>
          </div>
          <button
            onClick={() => setSelectedCountry(null)}
            className="p-1.5 hover:bg-white/10 rounded-xl text-gray-500 hover:text-white transition-all"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scroll">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-60">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-blue-400 text-xs font-black tracking-[0.3em] uppercase">Synchronizing</p>
            </div>
          ) : (
            <>
              {error && news.length > 0 && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="3"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
                  <p className="text-red-400 text-[10px] font-bold leading-tight uppercase tracking-wider">{error}</p>
                </div>
              )}

              {error && news.length === 0 && (
                <div className="p-5 bg-red-500/10 border border-red-500/30 rounded-2xl flex flex-col items-center text-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" className="mb-3"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
                  <p className="text-red-400 text-sm font-bold">{error}</p>
                </div>
              )}

              {news.length > 0 && (
                <>
                  {countryStats && (
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div className="bg-white/[0.03] border border-white/5 p-3 rounded-2xl">
                        <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1">Population</span>
                        <span className="text-sm font-bold text-blue-400">{(countryStats.population / 1000000).toFixed(1)}M</span>
                      </div>
                      <div className="bg-white/[0.03] border border-white/5 p-3 rounded-2xl">
                        <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1">Capital</span>
                        <span className="text-sm font-bold text-blue-400 truncate">{countryStats.capital}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-[1px] flex-1 bg-blue-500/20"></div>
                      <span className="text-[9px] font-black text-gray-500 uppercase tracking-[.3em]">Headlines</span>
                      <div className="h-[1px] flex-1 bg-blue-500/20"></div>
                    </div>
                    {news.map((item, idx) => (
                      <a
                        key={idx}
                        href={item.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-blue-600/10 hover:border-blue-500/40 transition-all duration-300"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black text-blue-500/60 uppercase tracking-widest">{item.date}</span>
                          <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M7 17L17 7M7 7h10v10" /></svg>
                          </div>
                        </div>
                        <h3 className="text-[14px] font-bold text-gray-100 group-hover:text-white leading-tight">{item.titre}</h3>
                      </a>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
