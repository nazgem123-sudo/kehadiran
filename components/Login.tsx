
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (user: string, pass: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  // Hardcoded defaults as requested: admin / spark
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('spark');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 -left-20 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 -right-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl"></div>

      <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] p-8 md:p-12 w-full max-w-md relative z-10 border border-slate-100">
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-white rounded-3xl mx-auto mb-6 flex items-center justify-center text-white shadow-xl border border-slate-100 overflow-hidden">
            {/* Using the provided logo URL converted to a direct link */}
            <img 
              src="https://lh3.googleusercontent.com/d/1OztMsIrH9poyCdyv32GCvZOkzk8_ECe1" 
              alt="Logo" 
              className="w-full h-full object-contain p-2"
              onError={(e) => {
                // Fallback to icon if link fails
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IiMwMDY2ZmYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEyLjUsMjJDOS41LDIyLDcsMTkuNSw3LDE2LjVjMC0xLjgsMC45LTMuNCwyLjMtNC40YzAuMS0wLjEsMC4yLTAuMSwwLjMtMC4xYzAuMSwwLDAuMiwwLDAuMywwLjFjMC4yLDAuMSwwLjMsMC4zLDAuMiwwLjVjLTAuMSwwLjItMC4yLDAuNC0wLjMsMC42Yy0xLDEtMS4zLDItMS4zLDMuM2MwLDIuMiwxLjgsNCw0LDRjMS40LDAsMi42LTAuNywzLjMtMS44YzAuMS0wLjIsMC40LTAuMywwLjYtMC4yYzAuMiwwLjEsMC4zLDAuNCwwLjIsMC42QzE2LjEsMjAuOCwxNC40LDIyLDEyLjUsMjJ6IE0xMy41LDIwLjVjLTAuMiwwLTAuNC0wLjEtMC41LTAuM2MtMC4xLTAuMiwwLTAuNSwwLjItMC42YzEuMS0wLjYsMS44LTEuOCwxLjgtMy4xYzAtMS4yLTAuNi0yLjQtMS42LTMuMWMtMC4yLTAuMS0wLjMtMC40LTAuMi0wLjZjMC4xLTAuMiwwLjQtMC4zLDAuNi0wLjJjMS40LDAuOSwyLjIsMi40LDIuMiw0YzAsMS43LTEsMy4yLTIuNCw0QzEzLjYsMjAuNSwxMy42LDIwLjUsMTMuNSwyMC41eiBNMTIuNSwxMy41Yy0wLjMsMC0wLjUtMC4yLTAuNS0wLjVWM2MwLTAuMywwLjItMC41LDAuNS0wLjVTMTMsMi43LDEzLDNWMTNjMCwwLjMtMC4yLDAuNS0wLjUsMC41SDEyLjV6IE0xOC41LDEwLjVjLTAuMSwwLTAuMSwwLTAuMiwwbC01LTJDMTMuMSw4LjQsMTMsOC4yLDEzLDhWNS4zYzAtMC4yLDAuMS0wLjQsMC4zLTAuNWMwLjItMC4xLDAuNC0wLjEsMC42LDBsNSwyQzE4LjksNi45LDE5LDcuMSwxOSw3LjN2Mi43YzAsMC4yLTAuMSwwLjQsLTAuMywwLjVDMTguNiwxMC41LDE4LjYsMTAuNSwxOC41LDEwLjV6Ii8+PC9zdmc+';
              }}
            />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Sistem Kehadiran</h1>
          <p className="text-blue-600 font-bold text-xs uppercase tracking-[0.2em]">Kelas Kesenian</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">ID Pengguna</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <i className="fas fa-id-card"></i>
              </span>
              <input
                type="text"
                className="w-full pl-11 pr-4 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold"
                placeholder="ID Pentadbir"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Kata Laluan</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <i className="fas fa-shield-alt"></i>
              </span>
              <input
                type="password"
                className="w-full pl-11 pr-4 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/30 transition-all transform active:scale-95 uppercase tracking-widest text-sm"
          >
            Log Masuk
          </button>
        </form>
        
        <div className="mt-10 pt-6 border-t border-slate-50 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
            Hak Cipta Terpelihara &copy; 20266
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
