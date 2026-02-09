import { useState, useEffect, useRef } from 'react';
import './App.css';
import { Header, ApiUsageHUD } from './components/HUD';
import { ControlPanel } from './components/ControlPanel';
import { MatrixLog } from './components/MatrixLog';
import { NewsSidebar } from './components/NewsSidebar';
import { GlobeView } from './components/GlobeView';
import { Login } from './components/Login';
import { AdminPanel } from './components/AdminPanel';
import { useAuth } from './hooks/useAuth';

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
  const { authenticated, loading: authLoading, is_admin } = useAuth();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeEl = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [geoData, setGeoData] = useState<any>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [timeFilter, setTimeFilter] = useState<string>('24h');
  const [topic, setTopic] = useState<string>('General');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [countryStats, setCountryStats] = useState<CountryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiUsage, setApiUsage] = useState<number>(0);
  const [maxQuota, setMaxQuota] = useState<number>(5);
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
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Mobile Menu States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileLogOpen, setMobileLogOpen] = useState(false);
  const [mobileFeedOpen, setMobileFeedOpen] = useState(false);

  // Check WebGL support
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const support = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      setWebglSupported(support);
      if (!support) {
        setError("WebGL is not supported or enabled in your browser. The 3D globe cannot be rendered.");
      }
    } catch (e) {
      setWebglSupported(false);
      setError("Error checking WebGL support.");
    }
  }, []);

  useEffect(() => {
    if (!authenticated) return;

    const defaultApi = window.location.hostname === 'localhost' ? 'http://localhost:8000' : (window.location.hostname === 'infomap.ovh' ? '/api' : `http://${window.location.hostname}:8000`);
    const apiBase = import.meta.env.VITE_API_URL || defaultApi;

    fetch(`${apiBase}/quota`, { credentials: 'include' })
      .then(res => {
        if (res.status === 401) return;
        if (!res.ok) throw new Error(`Backend unreachable (Status: ${res.status})`);
        return res.json();
      })
      .then(data => {
        if (data) {
          setApiUsage(data.count);
          setMaxQuota(data.max);
        }
      })
      .catch(err => {
        console.error("Could not fetch quota:", err);
        setError(`Backend Connection Error: Make sure port 8000 is open.`);
      });

    // Fetch server history and merge with localStorage
    fetch(`${apiBase}/history`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((serverHistory: Array<{ country: string; time_filter: string; topic: string; news: NewsItem[]; stats: CountryStats | null; timestamp: string }>) => {
        if (serverHistory && serverHistory.length > 0) {
          setHistory(prev => {
            // Merge: server history takes priority for same country/topic/filter
            const merged = [...serverHistory.map(h => ({
              ...h,
              timestamp: new Date(h.timestamp)
            }))];

            // Add local items that aren't in server history
            prev.forEach(localItem => {
              const exists = merged.some(
                m => m.country === localItem.country &&
                  m.topic === localItem.topic &&
                  m.time_filter === localItem.time_filter
              );
              if (!exists) {
                merged.push(localItem);
              }
            });

            // Sort by timestamp descending and limit to 20
            return merged
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 20);
          });
        }
      })
      .catch(err => console.error("Could not fetch server history:", err));

    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => {
        if (!res.ok) throw new Error("Failed to load country map data");
        return res.json();
      })
      .then(data => {
        setGeoData(data);
      })
      .catch(err => {
        console.error("Error loading GeoJSON:", err);
        setError("Map Data Error: Could not load country boundaries.");
      });

    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [authenticated]);

  useEffect(() => {
    if (globeEl.current && webglSupported) {
      const controls = globeEl.current.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.3;
      }
    }
  }, [webglSupported, authenticated]);

  useEffect(() => {
    const CACHE_EXPIRY_MS = 4 * 60 * 60 * 1000;
    const now = new Date().getTime();
    setHistory(prev => prev.filter(h => (now - new Date(h.timestamp).getTime()) < CACHE_EXPIRY_MS));
  }, []);

  useEffect(() => {
    localStorage.setItem('infomap_history', JSON.stringify(history));
  }, [history]);

  const fetchNews = async (country: string, filter: string = timeFilter, currentTopic: string = topic) => {
    if (!country || country === 'undefined') return;

    const CACHE_EXPIRY_MS = 4 * 60 * 60 * 1000;
    const existingIndex = history.findIndex(h => h.country === country && h.time_filter === filter && h.topic === currentTopic);
    const existing = history[existingIndex];

    if (existing) {
      const isExpired = new Date().getTime() - new Date(existing.timestamp).getTime() > CACHE_EXPIRY_MS;
      if (!isExpired) {
        setNews(existing.news);
        setCountryStats(existing.stats);
        return;
      } else {
        setHistory(prev => prev.filter((_, i) => i !== existingIndex));
      }
    }

    setLoading(true);
    if (selectedCountry !== country) {
      setNews([]);
      setCountryStats(null);
    }
    setError(null);

    try {
      const defaultApi = window.location.hostname === 'localhost' ? 'http://localhost:8000' : (window.location.hostname === 'infomap.ovh' ? '/api' : `http://${window.location.hostname}:8000`);
      const apiBase = import.meta.env.VITE_API_URL || defaultApi;
      const url = `${apiBase}/news/${encodeURIComponent(country)}?time_filter=${filter}&topic=${currentTopic}`;
      const response = await fetch(url, { credentials: 'include' });
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

  const onPolygonClick = (polygon: any) => {
    const countryName = polygon.properties.NAME || polygon.properties.name || polygon.properties.ADMIN;
    if (!countryName) return;

    setSelectedCountry(countryName);
    fetchNews(countryName, timeFilter, topic);

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

  const handleRestoreFromHistory = (h: HistoryItem) => {
    setSelectedCountry(h.country);
    setTimeFilter(h.time_filter);
    setTopic(h.topic);
    setNews(h.news);
    setCountryStats(h.stats);
    setError(null);
  };

  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!authenticated) {
    return <Login />;
  }

  return (
    <div className="fixed inset-0 bg-[#000] overflow-hidden font-sans select-none">
      {/* Critical Error Overlay */}
      {error && !geoData && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-sm p-6">
          <div className="max-w-md w-full bg-[#0d1117] border border-red-500/50 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" /></svg>
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2">System Failure</h2>
            <p className="text-red-400 text-sm font-bold mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all"
            >
              Re-initialize Matrix
            </button>
          </div>
        </div>
      )}

      <GlobeView
        globeRef={globeEl}
        webglSupported={webglSupported}
        dimensions={dimensions}
        geoData={geoData}
        history={history}
        onPolygonClick={onPolygonClick}
      />

      <Header />
      <ApiUsageHUD apiUsage={apiUsage} maxQuota={maxQuota} />

      {/* Mobile Toggle Buttons */}
      <div className="sm:hidden fixed inset-0 pointer-events-none z-[1500]">
        {/* Top Left: Menu/Settings */}
        {!selectedCountry && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="absolute top-4 left-4 pointer-events-auto p-3 bg-[#0d1117]/80 backdrop-blur-md border border-blue-500/30 rounded-2xl text-blue-400 shadow-lg"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {mobileMenuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
            </svg>
          </button>
        )}

        {/* Bottom Left: Matrix Log */}
        {!selectedCountry && !mobileMenuOpen && (
          <button
            onClick={() => { setMobileLogOpen(!mobileLogOpen); setMobileFeedOpen(false); }}
            className={`absolute bottom-4 left-4 pointer-events-auto p-3 backdrop-blur-md border rounded-2xl shadow-lg transition-all ${mobileLogOpen ? 'bg-orange-600 border-orange-400 text-white' : 'bg-[#0d1117]/80 border-gray-700 text-gray-400'}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9M3 20h.01M3 16h.01M3 12h.01M3 8h.01M3 4h.01M7 4h14M7 8h14M7 12h14M7 16h14" /></svg>
          </button>
        )}

        {/* Bottom Right: Tactical Feed */}
        {!selectedCountry && !mobileMenuOpen && (
          <button
            onClick={() => { setMobileFeedOpen(!mobileFeedOpen); setMobileLogOpen(false); }}
            className={`absolute bottom-4 right-4 pointer-events-auto p-3 backdrop-blur-md border rounded-2xl shadow-lg transition-all ${mobileFeedOpen ? 'bg-blue-600 border-blue-400 text-white' : 'bg-[#0d1117]/80 border-gray-700 text-gray-400'}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12h-4l-3 9L9 3l-3 9H2" /></svg>
          </button>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && !selectedCountry && (
        <div className="sm:hidden fixed inset-0 z-[1400] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in">
          <div className="w-full max-w-xs bg-[#0d1117] border border-blue-500/20 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] text-center mb-4">Systems Access</h3>
            {is_admin && (
              <button
                className="w-full p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 font-bold flex items-center justify-center gap-3"
                onClick={() => { setShowAdmin(true); setMobileMenuOpen(false); }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 01-2.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
                ADMIN PANEL
              </button>
            )}
            <button
              className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 font-bold flex items-center justify-center gap-3"
              onClick={() => {
                const defaultApi = window.location.hostname === 'localhost' ? 'http://localhost:8000' : (window.location.hostname === 'infomap.ovh' ? '/api' : `http://${window.location.hostname}:8000`);
                const apiBase = import.meta.env.VITE_API_URL || defaultApi; window.location.href = `${apiBase}/logout`;
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
              TERMINATE
            </button>
            <button
              className="w-full p-2 text-gray-500 text-[10px] font-black uppercase mt-4"
              onClick={() => setMobileMenuOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {selectedCountry && (
        <NewsSidebar
          selectedCountry={selectedCountry}
          setSelectedCountry={setSelectedCountry}
          countryStats={countryStats}
          loading={loading}
          news={news}
          error={error}
          timeFilter={timeFilter}
          topic={topic}
          onRefresh={() => fetchNews(selectedCountry)}
        />
      )}

      <div className={`${mobileLogOpen ? 'flex' : 'hidden sm:flex'}`}>
        <MatrixLog
          history={history}
          setHistory={setHistory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCountry={selectedCountry}
          timeFilter={timeFilter}
          topic={topic}
          onRestore={(h) => { handleRestoreFromHistory(h); setMobileLogOpen(false); }}
        />
      </div>

      <div className={`${mobileFeedOpen ? 'block' : 'hidden sm:block'}`}>
        <ControlPanel
          timeFilter={timeFilter}
          setTimeFilter={setTimeFilter}
          topic={topic}
          setTopic={setTopic}
        />
      </div>

      {authenticated && !selectedCountry && (
        <div className="hidden sm:flex absolute top-4 left-4 sm:top-6 sm:left-6 z-[1000] pointer-events-auto items-center gap-2 sm:gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
          {is_admin && (
            <button
              className="p-2 sm:p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl sm:rounded-2xl text-blue-400 transition-all flex items-center gap-2 group"
              onClick={() => setShowAdmin(true)}
              title="Matrix Control"
            >
              <svg width="18" height="18" className="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 01-2.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
              <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Admin Access</span>
            </button>
          )}
          <button
            className="p-2 sm:p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl sm:rounded-2xl text-red-400 transition-all flex items-center gap-2 group"
            onClick={() => {
              const defaultApi = window.location.hostname === 'localhost' ? 'http://localhost:8000' : (window.location.hostname === 'infomap.ovh' ? '/api' : `http://${window.location.hostname}:8000`);
              const apiBase = import.meta.env.VITE_API_URL || defaultApi;
              window.location.href = `${apiBase}/logout`;
            }}
            title="Terminate Session"
          >
            <svg width="18" height="18" className="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
            <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Logout</span>
          </button>
        </div>
      )}

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}

      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-[1] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:100px_100px]"></div>
    </div>
  );
}

export default App;