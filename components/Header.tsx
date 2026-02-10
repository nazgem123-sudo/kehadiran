
import React from 'react';
import { View } from '../types';

interface HeaderProps {
  currentView: View;
}

const Header: React.FC<HeaderProps> = ({ currentView }) => {
  // Added missing CARIAN_ARKIB key to match Record<View, string>
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
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 overflow-hidden">
          <img 
            src="https://lh3.googleusercontent.com/d/1OztMsIrH9poyCdyv32GCvZOkzk8_ECe1" 
            alt="Logo" 
            className="w-full h-full object-contain p-1"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              // If image fails, show icon instead
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) {
                parent.innerHTML = '<i class="fas fa-palette text-blue-900 text-xl"></i>';
              }
            }}
          />
        </div>
        <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>
        <div>
          <h1 className="text-xl font-bold text-blue-900 tracking-tight">{titles[currentView]}</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sistem Maklumat Kehadiran Kelas Kesenian</p>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-700">Pentadbir Sistem</p>
            <p className="text-[10px] text-blue-500 font-bold">Admin</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <i className="fas fa-user-shield text-xl"></i>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
