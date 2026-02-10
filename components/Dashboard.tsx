
import React, { useState, useMemo } from 'react';
import { Student, AttendanceRecord, Field, Form, Group, Gender, Coach } from '../types';
import { FIELDS, FORMS, GROUPS, GENDERS, COACHES } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import CustomCalendar from './CustomCalendar';
import { getLocalISOString } from '../App';

interface DashboardProps {
  students: Student[];
  attendance: AttendanceRecord[];
  onMark: (studentId: string, date: string, status: 'PRESENT' | 'ABSENT', timeSlot: string) => void;
  onBulkMark: (updates: { studentId: string; status: 'PRESENT' | 'ABSENT' }[], date: string, timeSlot: string) => void;
  onClear: (studentIds: string[], date: string, timeSlot: string) => void;
  onUndo: () => void;
  canUndo: boolean;
  onUpdateStudent: (student: Student) => void;
  onSave: (coachName: string, date: string, timeSlot: string) => void;
  isSaving: boolean;
  onRefresh?: (date: string) => Promise<void>;
}

const FIELD_COLORS: Record<string, string> = {
  'MUZIK': '#ef4444',
  'VISUAL': '#facc15',
  'TARI': '#22c55e',
  'TEATER': '#3b82f6'
};

const TIME_SLOTS = [
  '8:00 - 11:00',
  '8:30 - 12:00',
  '2:30 - 16:00'
];

const TINGKATAN_MAP: Record<string, string> = {
  '1': 'SATU',
  '2': 'DUA',
  '3': 'TIGA',
  '4': 'EMPAT',
  '5': 'LIMA'
};

const Dashboard: React.FC<DashboardProps> = ({ 
  students, 
  attendance, 
  onMark, 
  onBulkMark, 
  onClear,
  onUndo, 
  canUndo, 
  onUpdateStudent,
  onSave,
  isSaving,
  onRefresh
}) => {
  const [selectedDate, setSelectedDate] = useState(getLocalISOString());
  const [selectedTime, setSelectedTime] = useState(TIME_SLOTS[0]);
  const [selectedCoach, setSelectedCoach] = useState<string>('');
  const [filterField, setFilterField] = useState<Field | 'ALL'>('ALL');
  const [filterForm, setFilterForm] = useState<Form | 'ALL'>('ALL');
  const [filterGroup, setFilterGroup] = useState<Group | 'ALL'>('ALL');
  const [searchName, setSearchName] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const recordedDates = useMemo(() => {
    const dates = new Set<string>();
    attendance.forEach(record => { if (record.date) dates.add(record.date); });
    return dates;
  }, [attendance]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesField = filterField === 'ALL' || s.field === filterField;
      const matchesForm = filterForm === 'ALL' || s.form === filterForm;
      const matchesGroup = filterGroup === 'ALL' || s.group === filterGroup;
      const matchesName = s.name.toLowerCase().includes(searchName.toLowerCase());
      return matchesField && matchesForm && matchesGroup && matchesName;
    }).sort((a, b) => {
      if (a.gender !== b.gender) return a.gender.localeCompare(b.gender);
      return a.name.localeCompare(b.name);
    });
  }, [students, filterField, filterForm, filterGroup, searchName]);

  const stats = useMemo(() => {
    const filteredIds = new Set(filteredStudents.map(s => s.id));
    const todayAttendance = attendance.filter(a => a.date === selectedDate && a.timeSlot === selectedTime && filteredIds.has(a.studentId));
    const presentCount = todayAttendance.filter(a => a.status === 'PRESENT').length;
    const totalInView = filteredStudents.length;
    const rate = totalInView > 0 ? (presentCount / totalInView) * 100 : 0;
    const fieldStats = FIELDS.map(field => {
      const count = filteredStudents.filter(s => s.field === field).length;
      return { name: field, value: count };
    });
    return { presentCount, rate, fieldStats, totalInView };
  }, [attendance, filteredStudents, selectedDate, selectedTime]);

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const groupLabel = filterGroup === 'ALL' ? 'SEMUA' : filterGroup.replace(/^\d+\s*/, '');
    
    // Menukar angka kepada perkataan (Contoh: 1 -> SATU)
    let tingkatLabel = 'SEMUA';
    if (filterForm !== 'ALL') {
      const num = filterForm.split(' ')[0];
      tingkatLabel = TINGKATAN_MAP[num] || num;
    } else if (filteredStudents.length > 0) {
      // Jika pilih SEMUA KELAS tetapi murid dalam view semuanya dari tingkatan yang sama
      const forms = new Set<string>(filteredStudents.map(s => s.form.split(' ')[0]));
      if (forms.size === 1) {
        const num = Array.from(forms)[0] as string;
        tingkatLabel = TINGKATAN_MAP[num] || num;
      }
    }

    const formattedDate = selectedDate.split('-').reverse().join('-');
    const maleCount = filteredStudents.filter(s => s.gender === 'LELAKI').length;
    const femaleCount = filteredStudents.filter(s => s.gender === 'PEREMPUAN').length;

    let tableRows = filteredStudents.map((s, idx) => {
      const record = attendance.find(a => a.studentId === s.id && a.date === selectedDate && a.timeSlot === selectedTime);
      return `
        <tr>
          <td class="data-cell" style="text-align: center;">${idx + 1}</td>
          <td class="data-cell">${s.name}</td>
          <td class="data-cell" style="text-align: center;">${s.form}</td>
          <td class="data-cell" style="text-align: center;">${s.gender === 'LELAKI' ? 'L' : 'P'}</td>
          <td class="data-cell" style="text-align: center;">${record?.status === 'PRESENT' ? '/' : ''}</td>
          <td class="data-cell">${s.notes || ''}</td>
        </tr>
      `;
    }).join('');

    const minRows = 25;
    if (filteredStudents.length < minRows) {
      for (let i = filteredStudents.length; i < minRows; i++) {
        tableRows += `<tr><td style="height: 24px;"></td><td></td><td></td><td></td><td></td><td></td></tr>`;
      }
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>REKOD KEHADIRAN - ${formattedDate}</title>
          <style>
            @media print {
              body { margin: 0; padding: 10mm; }
              @page { size: A4; margin: 0mm; }
              .grey-box { background-color: #d1d5db !important; -webkit-print-color-adjust: exact; }
              .dark-grey { background-color: #000 !important; color: #fff !important; }
            }
            body { font-family: 'Arial Narrow', Arial, sans-serif; color: #000; line-height: 1.2; font-size: 10pt; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: -1.5px; }
            th, td { border: 1.5px solid black; padding: 4px; }
            .grey-box { background-color: #d1d5db; font-weight: bold; text-align: center; }
            .data-cell { font-size: 9pt; font-weight: bold; text-transform: uppercase; }
            .header-title { text-align: center; font-size: 12pt; font-weight: bold; padding: 10px; border: 1.5px solid black; }
          </style>
        </head>
        <body>
          <div class="header-title grey-box">REKOD KEHADIRAN KELAS KESENIAN</div>
          <table>
            <tr>
              <td class="grey-box" style="width: 20%;">KUMPULAN</td>
              <td style="width: 30%; text-align: center; font-weight: bold;">${groupLabel.toUpperCase()}</td>
              <td class="grey-box" style="width: 20%;">TINGKATAN</td>
              <td style="width: 30%; text-align: center; font-weight: bold;">${tingkatLabel.toUpperCase()}</td>
            </tr>
          </table>
          <table>
            <thead>
              <tr>
                <th rowspan="2" class="grey-box" style="width: 5%;">Bil</th>
                <th rowspan="2" class="grey-box" style="width: 45%;">Nama Murid</th>
                <th rowspan="2" class="grey-box" style="width: 15%;">Ting</th>
                <th colspan="2" class="grey-box" style="width: 15%;">Tarikh / Masa<br>${formattedDate} / ${selectedTime}</th>
                <th rowspan="2" class="grey-box" style="width: 20%;">Laporan Disiplin / Catatan</th>
              </tr>
              <tr>
                <th class="grey-box" style="font-size: 7pt;">Jantina</th>
                <th class="grey-box" style="font-size: 7pt;">Kehadiran</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
          <table>
            <tr>
              <td class="grey-box" style="width: 20%;">Nama Jurulatih</td>
              <td style="width: 40%; font-weight: bold;">${selectedCoach || '-'}</td>
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
          <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSaveClick = () => {
    if (!selectedCoach || selectedCoach === '') {
      alert("SILA PILIH NAMA JURULATIH TERLEBIH DAHULU SEBELUM SIMPAN.");
      return;
    }
    onSave(selectedCoach, selectedDate, selectedTime);
  };

  const handleRefreshClick = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh(selectedDate);
      setIsRefreshing(false);
    }
  };

  const handleMarkAllPresent = () => {
    if (filteredStudents.length === 0) return;
    const updates = filteredStudents.map(s => ({ studentId: s.id, status: 'PRESENT' as const }));
    onBulkMark(updates, selectedDate, selectedTime);
  };

  const handleResetSelection = () => {
    if (filteredStudents.length === 0) return;
    const ids = filteredStudents.map(s => s.id);
    onClear(ids, selectedDate, selectedTime);
  };

  const handleDeleteRecord = () => {
    if (filteredStudents.length === 0) return;
    const dateFormatted = selectedDate.split('-').reverse().join('-');
    if (confirm(`PADAM REKOD SESI?\n\nRekod kehadiran bagi tarikh ${dateFormatted} dan sesi ${selectedTime} untuk murid-murid dalam senarai ini akan dikosongkan.`)) {
      const ids = filteredStudents.map(s => s.id);
      onClear(ids, selectedDate, selectedTime);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      onUpdateStudent(editingStudent);
      setEditingStudent(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <i className="fas fa-users text-xl"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Murid (Tapis)</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats.totalInView}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
              <i className="fas fa-calendar-check text-xl"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Hadir (Sesi Ini)</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats.presentCount}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white">
              <i className="fas fa-percentage text-xl"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Kadar Sesi</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats.rate.toFixed(1)}%</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <i className="fas fa-calendar-alt text-indigo-600"></i>
              Pemilihan Tarikh
            </h3>
            <div className="flex justify-center">
              <CustomCalendar selectedDate={selectedDate} onDateChange={(d) => setSelectedDate(d)} recordedDates={recordedDates} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-1">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">Statistik Bidang</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.fieldStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {stats.fieldStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={FIELD_COLORS[entry.name as keyof typeof FIELD_COLORS] || '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h3 className="text-lg font-bold text-slate-800">Tanda Kehadiran</h3>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-black uppercase">Masa:</span>
                <select className="px-3 py-2 border rounded-xl text-xs bg-emerald-50 border-emerald-100 focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-800 outline-none" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)}>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={handleDeleteRecord} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black rounded-xl shadow-lg shadow-rose-200 transition-all flex items-center gap-2">
                  <i className="fas fa-trash-alt text-[8px]"></i>DELETE
                </button>
                <button onClick={handleResetSelection} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black rounded-xl shadow-lg shadow-amber-200 transition-all flex items-center gap-2">
                  <i className="fas fa-undo text-[8px]"></i>UNDO / RESET
                </button>
                <button onClick={handleMarkAllPresent} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center gap-2">
                  <i className="fas fa-check-double text-[8px]"></i>HADIR SEMUA
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="relative md:col-span-1">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input type="text" placeholder="Cari nama..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 font-semibold outline-none" value={searchName} onChange={(e) => setSearchName(e.target.value)} />
            </div>
            <div className="relative">
              <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 appearance-none outline-none" value={filterForm} onChange={(e) => setFilterForm(e.target.value as Form | 'ALL')}>
                <option value="ALL">SEMUA KELAS</option>
                {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="relative">
              <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 appearance-none outline-none" value={filterGroup} onChange={(e) => setFilterGroup(e.target.value as Group | 'ALL')}>
                <option value="ALL">SEMUA KUMPULAN</option>
                {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="relative">
              <select className={`w-full px-4 py-2 border rounded-xl text-xs font-bold appearance-none outline-none transition-all ${!selectedCoach ? 'bg-amber-50 border-amber-200 text-amber-700 ring-2 ring-amber-500 animate-pulse' : 'bg-blue-50 border-blue-100 text-blue-800'}`} value={selectedCoach} onChange={(e) => setSelectedCoach(e.target.value)}>
                <option value="">Wajib Pilih Jurulatih</option>
                {COACHES.map(coach => <option key={coach.name} value={coach.name}>{coach.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[450px] border border-slate-100 rounded-xl divide-y scrollbar-hide">
            {filteredStudents.length > 0 ? filteredStudents.map(student => {
              const record = attendance.find(a => a.studentId === student.id && a.date === selectedDate && a.timeSlot === selectedTime);
              return (
                <div key={student.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-slate-50 transition-colors gap-3">
                  <div className="flex-1">
                    <button onClick={() => setEditingStudent(student)} className="text-sm font-bold text-slate-800 text-left hover:text-blue-600 hover:underline underline-offset-4">{student.name}</button>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-black ${student.gender === 'LELAKI' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>{student.gender}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase">{student.group}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => onMark(student.id, selectedDate, 'PRESENT', selectedTime)} className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-[10px] font-black transition-all border-2 ${record?.status === 'PRESENT' ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg' : 'bg-white text-emerald-600 border-emerald-100'}`}>HADIR</button>
                    <button onClick={() => onMark(student.id, selectedDate, 'ABSENT', selectedTime)} className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-[10px] font-black transition-all border-2 ${record?.status === 'ABSENT' ? 'bg-rose-500 text-white border-rose-500 shadow-lg' : 'bg-white text-rose-600 border-rose-100'}`}>T. HADIR</button>
                  </div>
                </div>
              );
            }) : <div className="p-12 text-center text-slate-400 text-xs italic">Tiada murid ditemui.</div>}
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap justify-between items-center gap-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Sesi: {selectedTime} | {filteredStudents.length} Murid</span>
            <div className="flex flex-wrap gap-3">
              <button onClick={handlePrintPDF} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl shadow-xl transition-all uppercase tracking-widest text-xs flex items-center gap-2"><i className="fas fa-print"></i>CETAK PDF</button>
              <button onClick={handleRefreshClick} disabled={isRefreshing} className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-black rounded-xl shadow-xl transition-all uppercase tracking-widest text-xs flex items-center gap-2">{isRefreshing ? <i className="fas fa-sync-alt fa-spin"></i> : <i className="fas fa-sync-alt"></i>}REFRESH</button>
              <button onClick={handleSaveClick} disabled={isSaving} className={`px-6 py-3 font-black rounded-xl shadow-xl transition-all uppercase tracking-widest text-xs flex items-center gap-2 ${isSaving ? 'bg-slate-400 text-slate-200' : 'bg-indigo-600 text-white'}`}>{isSaving ? <><i className="fas fa-spinner fa-spin"></i>SIMPAN...</> : <><i className="fas fa-save"></i>SIMPAN</>}</button>
            </div>
          </div>
        </div>
      </div>
      {editingStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Edit Murid</h3>
              <button onClick={() => setEditingStudent(null)} className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Nama Penuh</label>
                <input type="text" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-800" value={editingStudent.name} onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value.toUpperCase() })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Jantina</label>
                  <select className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-700 bg-slate-50" value={editingStudent.gender} onChange={(e) => setEditingStudent({ ...editingStudent, gender: e.target.value as Gender })}>{GENDERS.map(g => <option key={g} value={g}>{g}</option>)}</select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Kumpulan</label>
                  <select className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-700 bg-slate-50" value={editingStudent.group} onChange={(e) => setEditingStudent({ ...editingStudent, group: e.target.value })}>{GROUPS.map(g => <option key={g} value={g}>{g}</option>)}</select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingStudent(null)} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl transition-all uppercase tracking-widest text-xs">Batal</button>
                <button type="submit" className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all uppercase tracking-widest text-xs">Kemaskini Rekod</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
