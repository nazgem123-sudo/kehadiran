
import React, { useState, useMemo, useEffect } from 'react';
import CustomCalendar from './CustomCalendar';
import { AttendanceRecord, Group } from '../types';
import { GROUPS, COACHES } from '../constants';

interface ArchiveResult {
  date: string;
  day: string;
  timeSlot: string;
  coachName: string;
  form: string;
  group: string;
  name: string;
  status: string;
  notes: string;
}

interface ArchiveSearchProps {
  googleScriptUrl: string;
  attendance: AttendanceRecord[];
  spreadsheetId: string;
}

const TINGKATAN_MAP: Record<string, string> = {
  '1': 'SATU',
  '2': 'DUA',
  '3': 'TIGA',
  '4': 'EMPAT',
  '5': 'LIMA'
};

const TIME_SLOTS = [
  '8:00 - 11:00',
  '8:30 - 12:00',
  '2:30 - 16:00'
];

const ArchiveSearch: React.FC<ArchiveSearchProps> = ({ googleScriptUrl, attendance, spreadsheetId }) => {
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterGroup, setFilterGroup] = useState<Group | 'ALL'>('ALL');
  const [filterCoach, setFilterCoach] = useState<string | 'ALL'>('ALL');
  const [filterTime, setFilterTime] = useState<string | 'ALL'>('ALL');
  const [results, setResults] = useState<ArchiveResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const recordedDates = useMemo(() => {
    return new Set(attendance.map(a => a.date));
  }, [attendance]);

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const matchesGroup = filterGroup === 'ALL' || r.group === filterGroup;
      const matchesCoach = filterCoach === 'ALL' || r.coachName === filterCoach;
      const matchesTime = filterTime === 'ALL' || r.timeSlot === filterTime;
      return matchesGroup && matchesCoach && matchesTime;
    });
  }, [results, filterGroup, filterCoach, filterTime]);

  const groupedResults = useMemo(() => {
    return filteredResults.reduce((acc, item) => {
      const groupName = item.group || 'TIADA KUMPULAN';
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(item);
      return acc;
    }, {} as Record<string, ArchiveResult[]>);
  }, [filteredResults]);

  const handleSearch = async () => {
    if (!googleScriptUrl) {
      setErrorMsg("URL Skrip Google tidak dijumpai.");
      return;
    }
    setIsSearching(true);
    setHasSearched(false);
    setErrorMsg(null);
    try {
      const response = await fetch(googleScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
          action: 'search_attendance', 
          spreadsheetId: spreadsheetId,
          targetDate: searchDate 
        }),
        redirect: 'follow'
      });
      if (!response.ok) throw new Error(`Ralat Pelayan: ${response.status}`);
      const responseText = await response.text();
      const trimmedText = responseText.trim();
      const data = JSON.parse(trimmedText);
      if (Array.isArray(data)) {
        setResults(data.map(item => ({
          ...item,
          coachName: (item.coachName && item.coachName !== "TIADA DATA") ? item.coachName.toString().trim() : "TIADA NAMA JURULATIH"
        })));
      } else {
        setResults([]);
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Gagal menghubungi pelayan Google.");
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  };

  const handleDeleteArchive = async () => {
    if (filteredResults.length === 0 || !googleScriptUrl) return;
    
    const formattedDate = searchDate.split('-').reverse().join('-');
    const timeSlot = filterTime === 'ALL' ? (filteredResults[0]?.timeSlot || 'SEMUA SESI') : filterTime;
    const groupContext = filterGroup === 'ALL' ? "SEMUA KUMPULAN" : `KUMPULAN ${filterGroup}`;
    const coachContext = filterCoach === 'ALL' ? "SEMUA JURULATIH" : `JURULATIH: ${filterCoach}`;

    if (!confirm(`AMARAN PEMADAMAN REKOD!\n\nAdakah anda pasti mahu memadam rekod berikut daripada Google Sheets:\n\nTARIKH: ${formattedDate}\nSESI: ${timeSlot}\nKUMPULAN: ${groupContext}\n${coachContext}\n\nTindakan ini tidak boleh diundur!`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await fetch(googleScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
          action: 'delete_attendance', 
          spreadsheetId: spreadsheetId,
          targetDate: searchDate,
          timeSlot: filterTime === 'ALL' ? '' : filterTime,
          group: filterGroup === 'ALL' ? '' : filterGroup,
          coachName: filterCoach === 'ALL' ? '' : filterCoach
        }),
      });
      
      alert(`Arahan pemadaman bagi ${formattedDate} telah dihantar ke Cloud. Sila klik "CARIAN ARKIB" semula untuk kemaskini paparan.`);
      
      if (filterGroup !== 'ALL' || filterTime !== 'ALL' || filterCoach !== 'ALL') {
         setResults(prev => prev.filter(r => {
           const matchesGroup = filterGroup === 'ALL' || r.group !== filterGroup;
           const matchesTime = filterTime === 'ALL' || r.timeSlot !== filterTime;
           const matchesCoach = filterCoach === 'ALL' || r.coachName !== filterCoach;
           return matchesGroup && matchesTime && matchesCoach;
         }));
      } else {
         setResults([]);
         setHasSearched(false);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Gagal memadam rekod. Sila periksa sambungan internet.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrintPDF = () => {
    if (filteredResults.length === 0) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formattedDate = searchDate.split('-').reverse().join('-');
    const groupKeys = Object.keys(groupedResults).sort();
    let pagesHtml = '';

    groupKeys.forEach((groupName, pageIdx) => {
      const groupData = groupedResults[groupName];
      const firstRes = groupData[0];
      
      const numPart = firstRes?.form?.split(' ')[0] || '';
      const tingMain = TINGKATAN_MAP[numPart] || numPart || '-';
      const groupDisplayName = groupName.replace(/^\d+\s*/, '');
      
      const maleCount = groupData.filter(r => 
        r.name.includes(' BIN ') || r.name.startsWith('MOHD ') || r.name.startsWith('MUHAMMAD ') || r.name.startsWith('AHMAD ')
      ).length;
      const femaleCount = groupData.length - maleCount;

      let rows = groupData.map((res, idx) => {
        const isMale = res.name.includes(' BIN ') || res.name.startsWith('MOHD ') || res.name.startsWith('MUHAMMAD ') || res.name.startsWith('AHMAD ');
        const statusMark = (res.status === 'HADIR' || res.status === 'PRESENT' || res.status === 'Hadir') ? '/' : '';
        return `
          <tr>
            <td class="data-cell" style="text-align: center;">${idx + 1}</td>
            <td class="data-cell">${res.name}</td>
            <td class="data-cell" style="text-align: center;">${res.form}</td>
            <td class="data-cell" style="text-align: center;">${isMale ? 'L' : 'P'}</td>
            <td class="data-cell" style="text-align: center;">${statusMark}</td>
            <td class="data-cell">${res.notes || ''}</td>
          </tr>
        `;
      }).join('');

      const minRows = 22;
      if (groupData.length < minRows) {
        for (let i = groupData.length; i < minRows; i++) {
          rows += `<tr><td style="height: 25px;"></td><td></td><td></td><td></td><td></td><td></td></tr>`;
        }
      }

      pagesHtml += `
        <div class="page-container">
          <div class="main-header grey-box">REKOD KEHADIRAN KELAS KESENIAN</div>
          
          <table class="info-table">
            <tr>
              <td class="grey-box" style="width: 20%;">KUMPULAN</td>
              <td style="width: 30%; font-weight: bold; text-align: center;">${groupDisplayName.toUpperCase()}</td>
              <td class="grey-box" style="width: 20%;">TINGKATAN</td>
              <td style="width: 30%; font-weight: bold; text-align: center;">${tingMain.toUpperCase()}</td>
            </tr>
          </table>

          <table class="data-table">
            <thead>
              <tr>
                <th rowspan="2" class="grey-box" style="width: 5%;">Bil</th>
                <th rowspan="2" class="grey-box" style="width: 45%;">Nama Murid</th>
                <th rowspan="2" class="grey-box" style="width: 15%;">Ting</th>
                <th colspan="2" class="grey-box" style="width: 15%;">Tarikh / Masa<br><span style="font-size: 8pt;">${formattedDate} / ${firstRes?.timeSlot || '-'}</span></th>
                <th rowspan="2" class="grey-box" style="width: 20%;">Laporan Disiplin /<br>Salah Laku / Catatan</th>
              </tr>
              <tr>
                <th class="grey-box" style="font-size: 8pt;">Jantina</th>
                <th class="grey-box" style="font-size: 8pt;">Kehadiran</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <table class="footer-table">
            <tr>
              <td class="grey-box" style="width: 20%;">Nama Jurulatih</td>
              <td style="width: 40%; font-weight: bold;">${firstRes?.coachName || '-'}</td>
              <td class="grey-box" style="width: 20%;">Tandatangan Jurulatih</td>
              <td style="width: 20%;"></td>
            </tr>
            <tr>
              <td class="grey-box">Kelas lewat di keluarkan</td>
              <td colspan="3"></td>
            </tr>
            <tr>
              <td class="grey-box dark-grey">Disemak Oleh: Ketua Bidang</td>
              <td class="dark-grey"></td>
              <td class="grey-box dark-grey">Tarikh</td>
              <td class="dark-grey"></td>
            </tr>
            <tr>
              <td class="grey-box" style="text-align: left; padding-left: 10px;">MURID LELAKI</td>
              <td colspan="3" style="font-weight: bold;">${maleCount} ORANG</td>
            </tr>
            <tr>
              <td class="grey-box" style="text-align: left; padding-left: 10px;">MURID PEREMPUAN</td>
              <td colspan="3" style="font-weight: bold;">${femaleCount} ORANG</td>
            </tr>
          </table>
        </div>
        ${pageIdx < groupKeys.length - 1 ? '<div class="page-break"></div>' : ''}
      `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>ARKIB - ${formattedDate}</title>
          <style>
            @media print { 
              body { margin: 0; padding: 0; }
              .page-break { page-break-after: always; }
              .grey-box { background-color: #d1d5db !important; -webkit-print-color-adjust: exact; }
              .dark-grey { background-color: #000 !important; color: #fff !important; }
            }
            body { font-family: 'Arial Narrow', Arial, sans-serif; font-size: 10pt; line-height: 1.1; }
            .page-container { padding: 10mm; height: 270mm; position: relative; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: -1.5px; }
            th, td { border: 1.5px solid black; padding: 4px; text-align: left; }
            .grey-box { background-color: #d1d5db; font-weight: bold; text-align: center; }
            .dark-grey { background-color: #333; color: white; font-weight: bold; }
            .main-header { font-size: 12pt; font-weight: bold; padding: 10px; border: 1.5px solid black; text-align: center; }
            .data-cell { font-size: 9pt; font-weight: bold; text-transform: uppercase; }
            .info-table td { height: 35px; vertical-align: middle; }
            .data-table th { font-size: 9pt; }
            .data-table td { font-size: 9pt; height: 22px; }
            .footer-table td { height: 30px; }
          </style>
        </head>
        <body>
          ${pagesHtml}
          <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
               <i className="fas fa-filter text-lg"></i>
             </div>
             <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Kriteria Carian Arkib</h3>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">1. Pilih Tarikh</label>
              <div className="flex justify-center mb-4">
                <CustomCalendar selectedDate={searchDate} onDateChange={(d) => setSearchDate(d)} recordedDates={recordedDates} />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">2. Kumpulan Murid</label>
                <div className="relative">
                  <select 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 text-xs appearance-none focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={filterGroup}
                    onChange={(e) => setFilterGroup(e.target.value as Group | 'ALL')}
                  >
                    <option value="ALL">SEMUA KUMPULAN</option>
                    {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <i className="fas fa-layer-group absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">3. Nama Jurulatih</label>
                <div className="relative">
                  <select 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 text-xs appearance-none focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={filterCoach}
                    onChange={(e) => setFilterCoach(e.target.value)}
                  >
                    <option value="ALL">SEMUA JURULATIH</option>
                    {COACHES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                  <i className="fas fa-chalkboard-teacher absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">4. Sesi / Masa</label>
                <div className="relative">
                  <select 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 text-xs appearance-none focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={filterTime}
                    onChange={(e) => setFilterTime(e.target.value)}
                  >
                    <option value="ALL">SEMUA SESI</option>
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <i className="fas fa-clock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleSearch} 
              disabled={isSearching} 
              className={`w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3 ${isSearching ? 'opacity-70 active:scale-100' : 'active:scale-95'}`}
            >
              {isSearching ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
              {isSearching ? 'MENCARI DATA...' : 'CARIAN ARKIB'}
            </button>
          </div>

          {errorMsg && (
            <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700">
              <i className="fas fa-exclamation-triangle text-sm"></i>
              <p className="text-[10px] font-bold">{errorMsg}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {!hasSearched ? (
            <div className="bg-white p-20 rounded-3xl shadow-sm border border-slate-200 text-center flex flex-col items-center justify-center min-h-[500px]">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200">
                <i className="fas fa-search-location text-5xl"></i>
              </div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Pilih Tarikh, Kumpulan, Jurulatih Atau Masa Untuk Memulakan Carian Arkib.</h3>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              {results.length > 0 && (
                <div className="bg-indigo-600 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 text-white border-4 border-white/10">
                   <div className="flex items-center gap-5">
                     <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                       <i className="fas fa-database text-2xl"></i>
                     </div>
                     <div>
                       <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200 mb-1">Status Carian Arkib</p>
                       <h2 className="text-lg md:text-xl font-black uppercase tracking-tight">DATA CLOUD DITEMUI</h2>
                     </div>
                   </div>
                   <div className="flex flex-wrap gap-3 justify-center">
                     <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-sm text-center min-w-[100px]">
                       <p className="text-[8px] font-bold text-indigo-200 uppercase mb-0.5">Jumlah Rekod</p>
                       <p className="text-xs font-black">{filteredResults.length}</p>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={handlePrintPDF} disabled={filteredResults.length === 0} className="bg-white text-indigo-600 hover:bg-indigo-50 px-5 py-3 rounded-2xl font-black shadow-lg transition-all uppercase tracking-widest text-[10px] flex items-center gap-2">
                          <i className="fas fa-file-pdf"></i>CETAK PDF
                        </button>
                        <button 
                          onClick={handleDeleteArchive} 
                          disabled={isDeleting || filteredResults.length === 0}
                          className="bg-rose-600 text-white hover:bg-rose-700 px-5 py-3 rounded-2xl font-black shadow-lg transition-all uppercase tracking-widest text-[10px] flex items-center gap-2"
                        >
                          {isDeleting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash-alt"></i>}
                          PADAM REKOD
                        </button>
                     </div>
                   </div>
                </div>
              )}

              {filteredResults.length > 0 ? Object.keys(groupedResults).sort().map(groupName => (
                <div key={groupName} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                        <i className="fas fa-users text-[10px]"></i>
                      </div>
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">KUMPULAN: {groupName}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-black uppercase tracking-tighter">Sesi: {groupedResults[groupName][0].timeSlot}</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-black">{groupedResults[groupName].length} MURID</span>
                    </div>
                  </div>
                  <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 flex items-center gap-2">
                    <i className="fas fa-user-tie text-xs text-indigo-600"></i>
                    <p className="text-[10px] font-bold text-slate-600 uppercase">Jurulatih: <span className="text-slate-900">{groupedResults[groupName][0].coachName}</span></p>
                  </div>
                  <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left">
                      <thead className="bg-yellow-400 text-black text-[11px] font-bold uppercase tracking-widest border-b border-yellow-500">
                        <tr>
                          <th className="px-5 py-3 w-16">Bil</th>
                          <th className="px-5 py-3">Nama Murid</th>
                          <th className="px-5 py-3">Ting</th>
                          <th className="px-5 py-3 text-center">Status Kehadiran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {groupedResults[groupName].map((res, idx) => (
                          <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="px-5 py-3 text-[10px] font-bold text-slate-900">{idx + 1}</td>
                            <td className="px-5 py-3">
                              <div className="text-[11px] font-bold text-slate-800 uppercase leading-none">{res.name}</div>
                            </td>
                            <td className="px-5 py-3 text-[10px] font-semibold text-slate-600">{res.form}</td>
                            <td className="px-5 py-3 text-center">
                              <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${res.status === 'HADIR' || res.status === 'PRESENT' || res.status === 'Hadir' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {res.status === 'PRESENT' || res.status === 'HADIR' || res.status === 'Hadir' ? 'HADIR' : 'ABSENT'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )) : hasSearched && (
                <div className="bg-white p-20 rounded-3xl shadow-sm border border-slate-200 text-center flex flex-col items-center justify-center min-h-[400px]">
                  <i className="fas fa-folder-open text-5xl text-slate-200 mb-6 block"></i>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                    {results.length > 0 ? "Tiada rekod sepadan dengan kriteria carian anda." : "Tiada Data Arkib Ditemui bagi tarikh ini di Cloud."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchiveSearch;
