
import React from 'react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, onLogout }) => {
  const menuItems: { id: View; label: string; icon: string }[] = [
    { id: 'DASHBOARD', label: 'Papan Pemuka', icon: 'fa-chart-line' },
    { id: 'CARIAN_ARKIB', label: 'Semakan Arkib', icon: 'fa-search-location' },
    { id: 'DATA_MURID', label: 'Data Murid', icon: 'fa-users' },
    { id: 'TAMBAH_MURID', label: 'Tambah Murid', icon: 'fa-user-plus' },
    { id: 'IMPORT_MURID', label: 'Import Murid', icon: 'fa-file-import' },
    { id: 'RINGKASAN', label: 'Ringkasan', icon: 'fa-file-contract' },
    { id: 'MANUAL', label: 'Manual Pengguna', icon: 'fa-book' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-400 h-screen sticky top-0 shadow-2xl">
      <div className="p-8 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/50">
            <i className="fas fa-palette text-xl"></i>
          </div>
          <div>
            <h2 className="text-xs font-black text-white leading-tight uppercase tracking-tighter">Sistem Kesenian</h2>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Attendance V2.0</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 py-8 px-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${
              currentView === item.id 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/60 font-bold transform translate-x-1' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <i className={`fas ${item.icon} w-5 text-sm ${currentView === item.id ? 'text-white' : 'text-slate-500'}`}></i>
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all font-bold text-sm"
        >
          <i className="fas fa-power-off w-5 text-sm"></i>
          <span>Log Keluar</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
