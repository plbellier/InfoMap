import React, { useState, useEffect } from 'react';

interface UserRecord {
  id: number;
  email: string;
  is_admin: boolean;
  is_active: boolean;
  max_daily_quota: number;
  today_count: number;
}

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');

  const fetchUsers = async () => {
    try {
      const defaultApi = window.location.hostname === 'localhost' ? 'http://localhost:8000' : (window.location.hostname === 'infomap.ovh' ? '/api' : `http://${window.location.hostname}:8000`);
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
      const defaultApi = window.location.hostname === 'localhost' ? 'http://localhost:8000' : (window.location.hostname === 'infomap.ovh' ? '/api' : `http://${window.location.hostname}:8000`);
      const apiBase = import.meta.env.VITE_API_URL || defaultApi;
      const response = await fetch(`${apiBase}/admin/quota`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, max_daily_quota: newQuota }),
        credentials: 'include'
      });
      if (response.ok) {
        setMessage(`Updated quota for ${email}`);
        fetchUsers();
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
      setMessage("Update failed");
    }
  };

  const toggleStatus = async (email: string, currentStatus: boolean) => {
    try {
      const defaultApi = window.location.hostname === 'localhost' ? 'http://localhost:8000' : (window.location.hostname === 'infomap.ovh' ? '/api' : `http://${window.location.hostname}:8000`);
      const apiBase = import.meta.env.VITE_API_URL || defaultApi;
      const response = await fetch(`${apiBase}/admin/user/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, is_active: !currentStatus }),
        credentials: 'include'
      });
      if (response.ok) {
        setMessage(`Status updated for ${email}`);
        fetchUsers();
        setTimeout(() => setMessage(null), 2000);
      } else {
        const data = await response.json();
        setMessage(data.detail || "Update failed");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteUser = async (email: string) => {
    if (!window.confirm(`Permanently remove ${email} from matrix?`)) return;
    try {
      const defaultApi = window.location.hostname === 'localhost' ? 'http://localhost:8000' : (window.location.hostname === 'infomap.ovh' ? '/api' : `http://${window.location.hostname}:8000`);
      const apiBase = import.meta.env.VITE_API_URL || defaultApi;
      const response = await fetch(`${apiBase}/admin/user/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        setMessage(`User ${email} removed`);
        fetchUsers();
        setTimeout(() => setMessage(null), 2000);
      } else {
        const data = await response.json();
        setMessage(data.detail || "Deletion failed");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    try {
      const defaultApi = window.location.hostname === 'localhost' ? 'http://localhost:8000' : (window.location.hostname === 'infomap.ovh' ? '/api' : `http://${window.location.hostname}:8000`);
      const apiBase = import.meta.env.VITE_API_URL || defaultApi;
      const response = await fetch(`${apiBase}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, is_active: true, max_daily_quota: 5 }),
        credentials: 'include'
      });
      if (response.ok) {
        setMessage(`Authorized ${newEmail}`);
        setNewEmail('');
        fetchUsers();
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await response.json();
        setMessage(data.detail || "Failed to add user");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    const defaultApi = window.location.hostname === 'localhost' ? 'http://localhost:8000' : (window.location.hostname === 'infomap.ovh' ? '/api' : `http://${window.location.hostname}:8000`);
    const apiBase = import.meta.env.VITE_API_URL || defaultApi;
    window.location.href = `${apiBase}/logout`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[4000] p-4 sm:p-6 animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#0d1117] border border-[#30363d] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 sm:p-6 border-b border-[#30363d] flex justify-between items-center bg-blue-500/5">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tighter italic leading-none">Intelligence Command</h2>
            <p className="text-[9px] sm:text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">User Authorization & Matrix Quotas</p>
          </div>
          <div className="flex gap-2 sm:gap-4">
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-gray-500 hover:text-white transition-all">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-b border-[#30363d]/50 bg-white/[0.01]">
          <form onSubmit={addUser} className="flex gap-2">
            <input
              type="email"
              placeholder="Authorize new email address..."
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
            >
              Authorize
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scroll">
          {message && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400 text-[10px] font-bold text-center animate-in slide-in-from-top-2">
              {message}
            </div>
          )}

          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map(u => (
                <div key={u.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all group grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] items-center gap-4">
                  {/* User Identity Column */}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 pr-4">
                      <span className={`w-2 h-2 shrink-0 rounded-full ${u.is_active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></span>
                      <span className={`text-sm font-bold truncate ${u.is_active ? 'text-white' : 'text-gray-500'}`} title={u.email}>{u.email}</span>
                    </div>
                    {u.is_admin && <span className="text-[8px] text-orange-500 font-black uppercase mt-0.5 ml-4 tracking-wider">Matrix Architect</span>}
                  </div>

                  {/* Stats & Controls Columns */}
                  <div className="flex items-center gap-6 sm:gap-4 justify-between sm:justify-end">
                    {/* Queries Today */}
                    <div className="flex flex-col items-center w-20">
                      <span className="text-[7px] text-gray-500 font-black uppercase mb-1 tracking-widest text-center">Queries Today</span>
                      <div className="w-12 bg-black/40 border border-white/5 rounded-lg px-2 py-1 text-[10px] text-white font-mono text-center">
                        {u.today_count || 0}
                      </div>
                    </div>

                    <div className="h-8 w-[1px] bg-white/5 hidden sm:block"></div>

                    {/* Daily Quota */}
                    <div className="flex flex-col items-center w-20">
                      <span className="text-[7px] text-gray-500 font-black uppercase mb-1 tracking-widest text-center">Daily Quota</span>
                      <input
                        type="number"
                        defaultValue={u.max_daily_quota}
                        className="w-12 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-blue-400 font-mono text-center focus:outline-none focus:border-blue-500/50"
                        onBlur={(e) => {
                          const val = parseInt(e.target.value);
                          if (val !== u.max_daily_quota) updateQuota(u.email, val);
                        }}
                      />
                    </div>

                    <div className="h-8 w-[1px] bg-white/5 hidden sm:block shrink-0"></div>

                    {/* Actions */}
                    <div className="flex gap-2 ml-2 justify-end shrink-0">
                      <button
                        onClick={() => toggleStatus(u.email, u.is_active)}
                        className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-2 ${u.is_active ? 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20' : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20'}`}
                        title={u.is_active ? "Deactivate User" : "Activate User"}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          {u.is_active ? <path d="M20 6L9 17l-5-5" /> : <path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10" />}
                        </svg>
                        <span className="text-[9px] font-black uppercase">{u.is_active ? 'Active' : 'Banned'}</span>
                      </button>
                      <button
                        onClick={() => deleteUser(u.email)}
                        className="p-2 bg-white/5 border border-white/10 rounded-xl text-gray-500 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 transition-all"
                        title="Remove User"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-black/40 border-t border-[#30363d] flex justify-between items-center px-6">
          <span className="italic text-gray-700 text-[8px] font-bold tracking-widest uppercase">Authorization Level: Secure Architect Access</span>
          <button
            onClick={handleLogout}
            className="text-[8px] font-black text-red-500/60 hover:text-red-500 uppercase tracking-widest transition-colors"
          >
            Terminate Session
          </button>
        </div>
      </div>
    </div>
  );
};
