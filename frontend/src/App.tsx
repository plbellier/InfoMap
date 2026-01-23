import { useState, useEffect, useRef, useMemo } from 'react';
import Globe from 'react-globe.gl';
import './App.css';

interface CountryStats {
  population: number;
  region: string;
  subregion: string;
  capital: string;
  flag_emoji: string;
}

interface NewsItem {
  titre: string;
  date: string;
  source_url: string;
}

interface HistoryItem {
  country: string;
  time_filter: string;
  topic: string;
  news: NewsItem[];
  stats: CountryStats | null;
  timestamp: Date;
}

function App() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeEl = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [geoData, setGeoData] = useState<any>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<string>('24h');
  const [topic, setTopic] = useState<string>('General');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [countryStats, setCountryStats] = useState<CountryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiUsage, setApiUsage] = useState<number>(0);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('infomap_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse history from localStorage:", e);
      return [];
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    // Use dynamic API URL based on current host
    const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:8000' : `http://${window.location.hostname}:8000`;

    // 1. Initial Load of Quota
    fetch(`${apiBase}/quota`)
      .then(res => res.json())
      .then(data => setApiUsage(data.count))
      .catch(err => console.error("Could not fetch quota:", err));

    // 2. Load GeoJSON
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(data => {
        console.log("GeoJSON loaded:", data.features.length, "features");
        setGeoData(data);
      })
      .catch(err => console.error("Error loading GeoJSON:", err));

    // 3. Handle Resize
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);

    // 4. Auto-rotate
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.3;
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 5. Cleanup expired history on mount
  useEffect(() => {
    const CACHE_EXPIRY_MS = 4 * 60 * 60 * 1000;
    const now = new Date().getTime();
    setHistory(prev => prev.filter(h => (now - new Date(h.timestamp).getTime()) < CACHE_EXPIRY_MS));
  }, []);

  // Sync history to LocalStorage
  useEffect(() => {
    localStorage.setItem('infomap_history', JSON.stringify(history));
  }, [history]);

  const fetchNews = async (country: string, filter: string = timeFilter, currentTopic: string = topic) => {
    if (!country || country === 'undefined') return;

    // Check frontend history first (session cache)
    const CACHE_EXPIRY_MS = 4 * 60 * 60 * 1000; // 4 hours
    const existingIndex = history.findIndex(h => h.country === country && h.time_filter === filter && h.topic === currentTopic);
    const existing = history[existingIndex];

    if (existing) {
      const isExpired = new Date().getTime() - new Date(existing.timestamp).getTime() > CACHE_EXPIRY_MS;
      if (!isExpired) {
        setNews(existing.news);
        setCountryStats(existing.stats);
        return;
      } else {
        // Remove expired entry from state
        setHistory(prev => prev.filter((_, i) => i !== existingIndex));
      }
    }

    setLoading(true);
    // Only clear news if we are switching to a DIFFERENT country
    // This allows keeping the previous data visible while "Updating Signal"
    if (selectedCountry !== country) {
      setNews([]);
      setCountryStats(null);
    }
    setError(null);

    try {
      const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:8000' : `http://${window.location.hostname}:8000`;
      const url = `${apiBase}/news/${encodeURIComponent(country)}?time_filter=${filter}&topic=${currentTopic}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `Server error: ${response.status}`);
      }

      setNews(data.news);
      setCountryStats(data.stats || null);
      setApiUsage(data.quota);

      setHistory(prev => [{
        country,
        time_filter: filter,
        topic: currentTopic,
        news: data.news,
        stats: data.stats || null,
        timestamp: new Date()
      }, ...prev]);

    } catch (error) {
      console.error("Error fetching news:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch news.");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onPolygonClick = (polygon: any) => {
    const countryName = polygon.properties.NAME || polygon.properties.name || polygon.properties.ADMIN;
    console.log("Clicked on polygon:", countryName);

    if (!countryName) return;

    setSelectedCountry(countryName);
    fetchNews(countryName, timeFilter, topic);

    // Zoom to country
    if (globeEl.current) {
      const { bbox } = polygon;
      if (bbox) {
        globeEl.current.pointOfView({
          lat: (bbox[1] + bbox[3]) / 2,
          lng: (bbox[0] + bbox[2]) / 2,
          altitude: 1.8
        }, 1000);
      }
    }
  };

  const polygons = useMemo(() => geoData ? geoData.features : [], [geoData]);

  return (
    <div className="fixed inset-0 bg-[#000] overflow-hidden font-sans select-none">
      {/* Container for Globe to ensure it doesn't push elements */}
      <div className="absolute inset-0 z-0">
        <Globe
          ref={globeEl}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          polygonsData={polygons}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          polygonCapColor={(d: any) => {
            const countryName = d.properties.NAME || d.properties.name || d.properties.ADMIN;
            const isInHistory = history.some(h => h.country === countryName);
            return isInHistory ? 'rgba(249, 115, 22, 0.4)' : 'rgba(29, 78, 216, 0.2)';
          }}
          polygonSideColor={() => 'rgba(0, 0, 0, 0.6)'}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          polygonStrokeColor={(d: any) => {
            const countryName = d.properties.NAME || d.properties.name || d.properties.ADMIN;
            const isInHistory = history.some(h => h.country === countryName);
            return isInHistory ? '#fb923c' : '#3b82f6';
          }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          polygonLabel={({ properties: d }: any) => `
            <div style="background: rgba(13, 17, 23, 0.95); color: white; border: 1px solid #30363d; padding: 6px 12px; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); pointer-events: none;">
              <b style="font-size: 14px;">${d.NAME || d.name || d.ADMIN}</b>
            </div>
          `}
          onPolygonClick={onPolygonClick}
          polygonAltitude={0.01}
        />
      </div>

      {/* --- OVERLAYS --- */}

      {/* API Usage HUD */}
      <div className="absolute top-6 right-6 z-[1000]">
        <div className="bg-[#0d1117]/80 backdrop-blur-md border border-[#30363d] px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-0.5">API Quota</span>
            <span className={`text-base font-mono font-bold ${apiUsage >= 13 ? 'text-red-500' : 'text-blue-400'}`}>
              {apiUsage} / 15
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
                strokeDashoffset={88 - (apiUsage / 15) * 88}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none text-center">
        <h1 className="text-5xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.8)] italic">
          INFOMAP<span className="text-blue-500">.</span>
        </h1>
        <p className="text-blue-400 text-[10px] tracking-[0.4em] font-bold uppercase mt-1 opacity-70">Global Intelligence Matrix</p>
      </div>

      {/* Country News Sidebar (LEFT) */}
      {selectedCountry && (
        <div className="absolute left-6 top-6 bottom-[15.5rem] w-96 z-[1000] flex flex-col pointer-events-none">
          <div className="h-full bg-[#0d1117]/90 backdrop-blur-2xl border border-blue-500/20 rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-in pointer-events-auto">
            <div className="p-6 border-b border-[#30363d] flex justify-between items-start bg-blue-500/5">
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
                  {/* Manual Refresh Button */}
                  {!loading && (
                    <button
                      onClick={() => fetchNews(selectedCountry, timeFilter, topic)}
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
                  {/* Tactical Error Banner (only if news already exists) */}
                  {error && news.length > 0 && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="3"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
                      <p className="text-red-400 text-[10px] font-bold leading-tight uppercase tracking-wider">{error}</p>
                    </div>
                  )}

                  {/* Critical Error Full Box (only if NO news exists) */}
                  {error && news.length === 0 && (
                    <div className="p-5 bg-red-500/10 border border-red-500/30 rounded-2xl flex flex-col items-center text-center">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" className="mb-3"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
                      <p className="text-red-400 text-sm font-bold">{error}</p>
                    </div>
                  )}

                  {/* Rest of the content */}
                  {news.length > 0 && (
                    <>

                      {/* Country Stats HUD */}
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
      )}

      {/* Matrix Log (Persistent BOTTOM LEFT) */}
      <div className="absolute left-6 bottom-6 w-96 h-48 z-[1000] bg-[#0d1117]/60 backdrop-blur-md border border-[#30363d] rounded-3xl flex flex-col overflow-hidden pointer-events-auto shadow-xl">
        <div className="px-5 py-3 border-b border-[#30363d]/50 flex flex-col gap-2 bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Matrix Log</span>
            <button onClick={() => setHistory([])} className="text-[9px] text-gray-500 hover:text-red-500 transition-colors uppercase font-black">Force Reset</button>
          </div>
          {/* Tactical Search Input */}
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
                    onClick={() => {
                      setSelectedCountry(h.country);
                      setTimeFilter(h.time_filter);
                      setTopic(h.topic);
                      setNews(h.news);
                      setCountryStats(h.stats);
                      setError(null); // Clear errors when restoring from log
                    }}
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

      {/* Unified Control Panel (BOTTOM RIGHT) */}
      <div className="absolute bottom-6 right-6 z-[1000] pointer-events-auto flex flex-col items-end gap-3 w-72">
        <div className="w-full bg-[#0d1117]/80 backdrop-blur-xl border border-[#30363d] p-1.5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col">

          {/* Header */}
          <div className="px-4 py-2 border-b border-[#30363d]/50 flex items-center justify-between mb-2">
            <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em]">Tactical Feed</span>
            <div className="flex gap-2">
              {[
                { id: '24h', label: '24H' },
                { id: '7d', label: '7D' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setTimeFilter(f.id);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[8px] font-black transition-all ${timeFilter === f.id ? 'bg-orange-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Grid - 2 Columns for Side Placement */}
          <div className="grid grid-cols-2 gap-1.5 p-1.5 w-full">
            {[
              { id: 'General', label: 'General', icon: '🌐' },
              { id: 'Economy', label: 'Finance', icon: '🏦' },
              { id: 'Politics', label: 'Politics', icon: '🏛️' },
              { id: 'Tech', label: 'Tech', icon: '⚡' },
              { id: 'Military', label: 'Military/Geo', icon: '⚔️' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTopic(t.id);
                }}
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

      {/* Helper text */}
      {!selectedCountry && history.length === 0 && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-blue-500/10 backdrop-blur-md px-8 py-3 rounded-2xl border border-blue-500/20 z-[1000] animate-pulse">
          <p className="text-blue-400 text-xs font-black tracking-[0.4em] uppercase">Authorize Terminal Selection</p>
        </div>
      )}

      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-[1] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:100px_100px]"></div>
    </div>
  );
}

export default App;
