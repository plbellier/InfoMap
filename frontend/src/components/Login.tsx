import React, { useState, useEffect } from 'react';

export const Login: React.FC = () => {
  const [text, setText] = useState('');
  const fullText = "SYSTEM ACCESS REQUIRED";
  
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(timer);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = () => {
    const defaultApi = window.location.hostname === 'localhost' ? 'http://localhost:8000' : (window.location.hostname === 'infomap.ovh' ? '/api' : `http://${window.location.hostname}:8000`);
    const apiBase = import.meta.env.VITE_API_URL || defaultApi;
    window.location.href = `${apiBase}/login`;
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-[3000] overflow-hidden">
      {/* Background Decorative Map (blurred) */}
      <div 
        className="absolute inset-0 opacity-20 blur-sm pointer-events-none"
        style={{
          backgroundImage: 'url(//unpkg.com/three-globe/example/img/earth-dark.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      ></div>
      
      {/* Decorative Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      {/* Login Terminal */}
      <div className="relative w-full max-w-md p-8 bg-[#0d1117]/80 backdrop-blur-xl border border-blue-500/20 rounded-3xl shadow-[0_0_50px_rgba(59,130,246,0.15)] animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/30">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          
          <h2 className="text-blue-400 font-mono text-xl font-black tracking-widest uppercase mb-2">
            {text}<span className="animate-pulse">_</span>
          </h2>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-10">Authorize Identity to Initialize Matrix</p>
          
          <button
            onClick={handleLogin}
            className="w-full group relative flex items-center justify-center gap-3 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-2xl transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-blue-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            <span className="text-sm font-black text-white uppercase tracking-widest">Connect with Google</span>
          </button>
          
          <div className="mt-8 flex gap-2">
            <div className="w-1 h-1 rounded-full bg-blue-500/40"></div>
            <div className="w-1 h-1 rounded-full bg-blue-500/20"></div>
            <div className="w-1 h-1 rounded-full bg-blue-500/10"></div>
          </div>
        </div>
      </div>
      
      {/* Footer System Info */}
      <div className="absolute bottom-6 left-6 font-mono text-[8px] text-gray-600 flex flex-col gap-1">
        <span>STATION: INFOMAP_ALPHA_v1.0</span>
        <span>STATUS: AWAITING_AUTHENTICATION</span>
        <span>ENCRYPTION: AES-256-GCM</span>
      </div>
    </div>
  );
};
