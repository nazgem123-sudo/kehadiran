
import React, { useMemo, useState } from 'react';
import { Student, AttendanceRecord } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell 
} from 'recharts';
import { FIELDS } from '../constants';
import { getLocalISOString } from '../App';

interface SummaryProps {
  students: Student[];
  attendance: AttendanceRecord[];
  googleScriptUrl?: string;
  onImportCloudData?: (records: AttendanceRecord[]) => void;
  onClearAll?: () => void;
}

const FIELD_COLORS: Record<string, string> = {
  'MUZIK': '#ef4444',
  'VISUAL': '#facc15',
  'TARI': '#22c55e',
  'TEATER': '#3b82f6'
};

const Summary: React.FC<SummaryProps> = ({ students, attendance, googleScriptUrl, onImportCloudData, onClearAll }) => {
  const [reportType, setReportType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<string>('');
  
  // Gunakan utiliti getLocalISOString untuk zon masa Malaysia
  const today = getLocalISOString();
  const thirtyDaysAgoDate = new Date();
  thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
  const defaultStart = getLocalISOString(thirtyDaysAgoDate);

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(today);

  const getWeekNumber = (d: Date) => {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  const attendanceData = useMemo(() => {
    const dailyStats = [];
    const totalStudents = students.length;
    
    // Pecahkan string ke tarikh tanpa offset UTC
    const [sY, sM, sD] = startDate.split('-').map(Number);
    const [eY, eM, eD] = endDate.split('-').map(Number);
    const start = new Date(sY, sM - 1, sD);
    const end = new Date(eY, eM - 1, eD);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const actualDays = Math.min(diffDays, 365); // Maksimum setahun

    for (let i = 0; i < actualDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = getLocalISOString(d);
      const count = attendance.filter(a => a.date === dateStr && a.status === 'PRESENT').length;
      
      dailyStats.push({
        date: d,
        dateStr: dateStr,
        hadir: count,
        tidakHadir: totalStudents - count
      });
    }

    if (reportType === 'DAILY') {
      return dailyStats.map(s => ({
        label: s.dateStr.split('-').reverse().slice(0, 2).join('/'),
        fullLabel: s.dateStr.split('-').reverse().join('-'),
        hadir: s.hadir,
        tidakHadir: s.tidakHadir,
        rate: totalStudents > 0 ? (s.hadir / totalStudents) * 100 : 0
      }));
    }

    if (reportType === 'WEEKLY') {
      const weeks: Record<string, { hadir: number, total: number, count: number }> = {};
      dailyStats.forEach(s => {
        const weekNum = getWeekNumber(s.date);
        const year = s.date.getFullYear();
        const key = `${year}-W${weekNum}`;
        if (!weeks[key]) weeks[key] = { hadir: 0, total: 0, count: 0 };
        weeks[key].hadir += s.hadir;
        weeks[key].total += totalStudents;
        weeks[key].count++;
      });
      return Object.keys(weeks).map(key => ({
        label: `M${key.split('-W')[1]}`,
        fullLabel: `Minggu ${key.split('-W')[1]} (${key.split('-W')[0]})`,
        hadir: Math.round(weeks[key].hadir / weeks[key].count),
        rate: weeks[key].total > 0 ? (weeks[key].hadir / weeks[key].total) * 100 : 0
      }));
    }

    if (reportType === 'MONTHLY') {
      const months: Record<string, { hadir: number, total: number, count: number, name: string }> = {};
      dailyStats.forEach(s => {
        const month = s.date.getMonth();
        const year = s.date.getFullYear();
        const key = `${year}-${month}`;
        const name = s.date.toLocaleString('ms-MY', { month: 'short' });
        if (!months[key]) months[key] = { hadir: 0, total: 0, count: 0, name: name };
        months[key].hadir += s.hadir;
        months[key].total += totalStudents;
        months[key].count++;
      });
      return Object.keys(months).map(key => ({
        label: months[key].name,
        fullLabel: `${months[key].name} ${key.split('-')[0]}`,
        hadir: Math.round(months[key].hadir / months[key].count),
        rate: months[key].total > 0 ? (months[key].hadir / months[key].total) * 100 : 0
      }));
    }
    return [];
  }, [attendance, students, startDate, endDate, reportType]);

  const fieldData = useMemo(() => {
    return FIELDS.map(field => {
      const fieldStudents = students.filter(s => s.field === field);
      const studentIds = new Set(fieldStudents.map(s => s.id));
      const rangeAttendance = attendance.filter(a => studentIds.has(a.studentId) && a.date >= startDate && a.date <= endDate);
      const presentCount = rangeAttendance.filter(a => a.status === 'PRESENT').length;
      
      const [sY, sM, sD] = startDate.split('-').map(Number);
      const [eY, eM, eD] = endDate.split('-').map(Number);
      const start = new Date(sY, sM - 1, sD);
      const end = new Date(eY, eM - 1, eD);
      const days = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const potential = fieldStudents.length * days;
      const rate = potential > 0 ? (presentCount / potential) * 100 : 0;

      return { name: field, rate: parseFloat(rate.toFixed(1)), count: fieldStudents.length };
    });
  }, [attendance, students, startDate, endDate]);

  const stats = useMemo(() => {
    const hasAnyHadir = attendanceData.some(d => d.hadir > 0);
    const avgRate = attendanceData.length > 0 ? attendanceData.reduce((acc, curr) => acc + curr.rate, 0) / attendanceData.length : 0;
    const peakDay = hasAnyHadir ? [...attendanceData].sort((a, b) => b.hadir - a.hadir)[0] : null;
    return { avgRate: avgRate.toFixed(1), peakDay: peakDay ? peakDay.label : '-', totalStudents: students.length, hasAnyHadir };
  }, [attendanceData, students]);

  const handleFetchCloud = async () => {
    if (!googleScriptUrl || !onImportCloudData) return;
    
    const [sY, sM, sD] = startDate.split('-').map(Number);
    const [eY, eM, eD] = endDate.split('-').map(Number);
    const start = new Date(sY, sM - 1, sD);
    const end = new Date(eY, eM - 1, eD);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays > 31) {
      if (!confirm(`Julat tarikh anda adalah ${diffDays} hari. Muat turun pukal mungkin mengambil masa sedikit lama. Teruskan?`)) return;
    }

    setIsFetching(true);
    setFetchStatus('Memulakan muat turun...');
    
    try {
      const datesToFetch = [];
      for (let i = 0; i < diffDays; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        datesToFetch.push(getLocalISOString(d));
      }

      const allResults: AttendanceRecord[] = [];
      let successCount = 0;

      for (const dateStr of datesToFetch) {
        setFetchStatus(`Menarik data: ${dateStr.split('-').reverse().join('-')} (${successCount + 1}/${datesToFetch.length})`);
        
        try {
          const response = await fetch(googleScriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'search_attendance', targetDate: dateStr }),
            redirect: 'follow'
          });
          
          const text = await response.text();
          const data = JSON.parse(text);
          
          if (Array.isArray(data)) {
            data.forEach((item: any) => {
              const student = students.find(s => s.name.trim() === item.name.trim());
              if (student) {
                allResults.push({
                  studentId: student.id,
                  date: item.date || dateStr,
                  status: (item.status === 'HADIR' || item.status === 'PRESENT') ? 'PRESENT' : 'ABSENT',
                  timeSlot: item.timeSlot || 'N/A'
                });
              }
            });
          }
          successCount++;
        } catch (err) {
          console.error(`Gagal tarik data untuk tarikh ${dateStr}`, err);
        }
      }
      
      if (allResults.length > 0) {
        onImportCloudData(allResults);
        setFetchStatus('Selesai!');
        setTimeout(() => setFetchStatus(''), 3000);
      } else {
        setFetchStatus('Tiada data ditemui di Cloud bagi julat tarikh ini.');
        setTimeout(() => setFetchStatus(''), 5000);
      }
    } catch (e) {
      console.error(e);
      alert("Gagal menghubungi pelayan Google.");
      setFetchStatus('');
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 flex-1">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Tarikh Mula</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Tarikh Tamat</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Jenis Analisis</label>
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 h-[46px]">
                {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map(type => (
                  <button key={type} onClick={() => setReportType(type)} className={`flex-1 text-[9px] font-black rounded-xl transition-all uppercase ${reportType === type ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{type === 'DAILY' ? 'Harian' : type === 'WEEKLY' ? 'Minggu' : 'Bulan'}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2 min-w-[300px] justify-end">
            <button 
              onClick={onClearAll}
              className="px-6 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-black rounded-2xl transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 border border-rose-100"
            >
              <i className="fas fa-trash-alt"></i>
              KOSONGKAN DATA
            </button>
            <button 
              onClick={handleFetchCloud} 
              disabled={isFetching} 
              className={`px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 ${isFetching ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isFetching ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-cloud-download-alt"></i>}
              {isFetching ? 'SEDANG MENARIK...' : 'TARIK DATA CLOUD'}
            </button>
            {fetchStatus && (
              <p className="w-full text-[9px] font-black text-indigo-600 text-right uppercase tracking-tighter animate-pulse">{fetchStatus}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Purata Kehadiran" value={`${stats.avgRate}%`} sub="Kadar Sesi" color="text-indigo-600" />
        <StatCard label="Puncak Kehadiran" value={stats.peakDay} sub="Tarikh/Tempoh" />
        <StatCard label="Jumlah Murid" value={stats.totalStudents} sub="Berdaftar" />
      </div>

      {!stats.hasAnyHadir ? (
        <div className="bg-white p-20 rounded-3xl shadow-sm border border-slate-200 text-center">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
            <i className="fas fa-chart-area text-5xl"></i>
          </div>
          <h3 className="text-lg font-black text-slate-800 uppercase">Tiada Rekod Dijumpai</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">Sila pastikan anda telah tanda kehadiran di <strong>Papan Pemuka</strong> atau klik <strong>Tarik Data Cloud</strong> untuk memuat turun sejarah dari Google Sheets (Sila pilih julat tarikh yang betul).</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight mb-8">
              <i className="fas fa-chart-line text-indigo-600"></i>
              Trend Kehadiran {reportType === 'DAILY' ? 'Harian' : reportType === 'WEEKLY' ? 'Mingguan' : 'Bulanan'}
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: '900', fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                  <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="hadir" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight mb-8">
              <i className="fas fa-users-cog text-emerald-600"></i>
              Prestasi Bidang (Kseluruhan)
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fieldData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: '900', fill: '#475569'}} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="rate" radius={[0, 10, 10, 0]} barSize={28}>
                    {fieldData.map((entry, index) => <Cell key={index} fill={FIELD_COLORS[entry.name] || '#6366f1'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, sub, color = "text-slate-800" }: any) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 group hover:border-indigo-200 transition-all">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <div className="flex items-baseline gap-2">
      <h3 className={`text-3xl font-black ${color}`}>{value}</h3>
      <span className="text-[9px] font-black text-slate-400 uppercase">{sub}</span>
    </div>
  </div>
);

export default Summary;
