import React, { useState, useEffect } from 'react';

interface UserRecord {
  id: number;
  email: str;
  is_admin: boolean;
  max_daily_quota: number;
}

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const defaultApi = window.location.hostname === 'localhost' ? 'http://localhost:8000' : `http://${window.location.hostname}:8000`;
      const apiBase = import.meta.env.VITE_API_URL || defaultApi;
      const response = await fetch(`${apiBase}/admin/users`, { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (e) {
      console.error(e);
      setMessage("Error loading users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateQuota = async (email: string, newQuota: number) => {
    try {
      const defaultApi = window.location.hostname === 'localhost' ? 'http://localhost:8000' : `http://${window.location.hostname}:8000`;
      const apiBase = import.meta.env.VITE_API_URL || defaultApi;
      const response = await fetch(`${apiBase}/admin/quota`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, max_daily_quota: newQuota }),
        credentials: 'include'
      });
      if (response.ok) {
        setMessage(`Updated ${email} successfully`);
        fetchUsers();
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
      setMessage("Update failed");
    }
  };

  const handleLogout = () => {
    const defaultApi = window.location.hostname === 'localhost' ? 'http://localhost:8000' : `http://${window.location.hostname}:8000`;
    const apiBase = import.meta.env.VITE_API_URL || defaultApi;
    window.location.href = `${apiBase}/logout`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[4000] p-6 animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#0d1117] border border-[#30363d] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-[#30363d] flex justify-between items-center bg-blue-500/5">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Intelligence Command</h2>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">User Authorization & Matrix Quotas</p>
          </div>
          <div className="flex gap-4">
             <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Terminate Session
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-gray-500 hover:text-white transition-all">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scroll">
          {message && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400 text-xs font-bold text-center animate-in slide-in-from-top-2">
              {message}
            </div>
          )}

          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-12 px-4 py-2 text-[8px] font-black text-gray-500 uppercase tracking-widest">
                <div className="col-span-6">Identity / Email</div>
                <div className="col-span-3 text-center">Status</div>
                <div className="col-span-3 text-right">Quota Limit</div>
              </div>
              {users.map(u => (
                <div key={u.id} className="grid grid-cols-12 items-center p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all group">
                  <div className="col-span-6 flex flex-col">
                    <span className="text-sm font-bold text-white truncate">{u.email}</span>
                    {u.is_admin && <span className="text-[8px] text-orange-500 font-black uppercase mt-0.5">Matrix Architect</span>}
                  </div>
                  <div className="col-span-3 flex justify-center">
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${u.is_admin ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-400'}`}>
                      {u.is_admin ? 'ADMIN' : 'VISITOR'}
                    </span>
                  </div>
                  <div className="col-span-3 flex justify-end items-center gap-3">
                    <input 
                      type="number"
                      defaultValue={u.max_daily_quota}
                      className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-blue-400 font-mono text-right focus:outline-none focus:border-blue-500/50"
                      onBlur={(e) => {
                        const val = parseInt(e.target.value);
                        if (val !== u.max_daily_quota) updateQuota(u.email, val);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 bg-black/40 border-t border-[#30363d] flex justify-center italic text-gray-700 text-[8px] font-bold tracking-widest uppercase">
          Authorization Level: Secure Architect Access
        </div>
      </div>
    </div>
  );
};
