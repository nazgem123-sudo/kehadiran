
import React from 'react';
import { View } from '../types';

interface HeaderProps {
  currentView: View;
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, toggleSidebar }) => {
  const titles: Record<View, string> = {
    DASHBOARD: 'SELAMAT DATANG',
    DATA_MURID: 'Senarai Data Murid',
    TAMBAH_MURID: 'Daftar Murid Baru',
    IMPORT_MURID: 'Import Data Pukal (Excel)',
    RINGKASAN: 'Rumusan & Laporan',
    MANUAL: 'Manual Penggunaan',
    CARIAN_ARKIB: 'Semakan Arkib',
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Butang Toggle Sidebar - Kini dipaparkan pada SEMUA peranti */}
        <button 
          onClick={toggleSidebar}
          className="flex w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-xl items-center justify-center text-slate-600 transition-all border border-slate-200 active:scale-95"
          title="Tutup/Buka Sidebar"
        >
          <i className="fas fa-bars-staggered text-lg"></i>
        </button>

        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 overflow-hidden">
          <img 
            src="https://lh3.googleusercontent.com/d/1OztMsIrH9poyCdyv32GCvZOkzk8_ECe1" 
            alt="Logo" 
            className="w-full h-full object-contain p-1"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) {
                parent.innerHTML = '<i class="fas fa-palette text-blue-900 text-xl"></i>';
              }
            }}
          />
        </div>
        <div className="h-8 w-px bg-slate-200 hidden xs:block"></div>
        <div className="overflow-hidden">
          <h1 className="text-sm sm:text-xl font-bold text-blue-900 tracking-tight leading-none mb-1 truncate">
            {titles[currentView]}
          </h1>
          <p className="text-[7px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
            Sistem Maklumat Kehadiran
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-right hidden md:block">
            <p className="text-xs sm:text-sm font-bold text-slate-700">Pentadbir</p>
            <p className="text-[9px] sm:text-[10px] text-blue-500 font-bold">Admin System</p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <i className="fas fa-user-shield text-base sm:text-xl"></i>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
