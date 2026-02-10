
import React from 'react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  onLogout: () => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, onLogout, isOpen, toggleSidebar }) => {
  const menuItems: { id: View; label: string; icon: string }[] = [
    { id: 'DASHBOARD', label: 'Papan Pemuka', icon: 'fa-chart-line' },
    { id: 'CARIAN_ARKIB', label: 'Semakan Arkib', icon: 'fa-search-location' },
    { id: 'DATA_MURID', label: 'Data Murid', icon: 'fa-users' },
    { id: 'TAMBAH_MURID', label: 'Tambah Murid', icon: 'fa-user-plus' },
    { id: 'IMPORT_MURID', label: 'Import Murid', icon: 'fa-file-import' },
    { id: 'RINGKASAN', label: 'Ringkasan', icon: 'fa-file-contract' },
    { id: 'MANUAL', label: 'Manual Pengguna', icon: 'fa-book' },
  ];

  const handleNavClick = (view: View) => {
    setView(view);
    // Pada mobile, tutup sidebar selepas pilih menu
    if (window.innerWidth < 1024) {
      toggleSidebar();
    }
  };

  return (
    <>
      {/* Backdrop untuk Mobile/Tablet */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={toggleSidebar}
      />

      {/* Sidebar Container */}
      <aside 
        className={`fixed lg:sticky top-0 left-0 flex flex-col w-64 bg-[#0f172a] text-slate-400 h-screen shadow-2xl z-50 transition-transform duration-300 lg:transition-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'
        }`}
      >
        <div className="p-8 border-b border-slate-800/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#2563eb] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <i className="fas fa-palette text-xl"></i>
            </div>
            <div>
              <h2 className="text-[13px] font-black text-white leading-tight uppercase tracking-tight">Sistem Kesenian</h2>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Attendance V2.0</p>
            </div>
          </div>
          {/* Close button for mobile inside sidebar */}
          <button onClick={toggleSidebar} className="lg:hidden text-slate-500 hover:text-white p-2">
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>
        
        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
                currentView === item.id 
                  ? 'bg-[#2563eb] text-white shadow-xl shadow-blue-500/30 font-bold' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <i className={`fas ${item.icon} w-5 text-center text-sm ${currentView === item.id ? 'text-white' : 'text-slate-500'}`}></i>
              <span className="text-sm tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800/50">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all font-bold text-sm"
          >
            <i className="fas fa-power-off w-5 text-center text-sm"></i>
            <span>Log Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
