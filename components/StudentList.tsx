
import React, { useState } from 'react';
import { Student, Form, Field, Group, Gender } from '../types';
import { FORMS, FIELDS, GROUPS, GENDERS } from '../constants';

interface StudentListProps {
  students: Student[];
  onDelete: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onUpdateStudent: (student: Student) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, onDelete, onUpdateNotes, onUpdateStudent }) => {
  const [filterForm, setFilterForm] = useState<Form | 'ALL'>('ALL');
  const [filterField, setFilterField] = useState<Field | 'ALL'>('ALL');
  const [filterGroup, setFilterGroup] = useState<Group | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const filtered = students.filter(s => {
    const matchesForm = filterForm === 'ALL' || s.form === filterForm;
    const matchesField = filterField === 'ALL' || s.field === filterField;
    const matchesGroup = filterGroup === 'ALL' || s.group === filterGroup;
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    return matchesForm && matchesField && matchesGroup && matchesSearch;
  }).sort((a, b) => {
    if (a.gender !== b.gender) {
      return a.gender.localeCompare(b.gender);
    }
    return a.name.localeCompare(b.name);
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      onUpdateStudent(editingStudent);
      setEditingStudent(null);
    }
  };

  return (
    <div className="relative">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2 relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <i className="fas fa-search"></i>
              </span>
              <input
                type="text"
                placeholder="Cari nama murid..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <select
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value as Group)}
              >
                <option value="ALL">SEMUA KUMPULAN</option>
                {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i>
            </div>

            <div className="relative">
              <select
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                value={filterForm}
                onChange={(e) => setFilterForm(e.target.value as Form)}
              >
                <option value="ALL">SEMUA TINGKATAN</option>
                {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i>
            </div>

            <div className="relative">
              <select
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                value={filterField}
                onChange={(e) => setFilterField(e.target.value as Field)}
              >
                <option value="ALL">SEMUA BIDANG</option>
                {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4 text-left">Nama Murid</th>
                <th className="px-6 py-4 text-left">Kumpulan</th>
                <th className="px-6 py-4 text-left">Role Akses</th>
                <th className="px-6 py-4 text-left">Bidang</th>
                <th className="px-6 py-4 text-left">Catatan</th>
                <th className="px-6 py-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? filtered.map((student) => (
                <tr key={student.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setEditingStudent(student)}
                      className="flex flex-col text-left hover:text-blue-600 transition-colors"
                    >
                      <span className="text-sm font-bold text-slate-800 group-hover:underline underline-offset-4">{student.name}</span>
                      <span className={`text-[10px] font-bold ${student.gender === 'LELAKI' ? 'text-blue-500' : 'text-rose-500'}`}>
                        {student.gender}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-600 font-semibold">{student.group}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded-md">{student.role || 'MURID'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold uppercase tracking-tight ${
                      student.field === 'MUZIK' ? 'text-red-500' :
                      student.field === 'VISUAL' ? 'text-yellow-600' :
                      student.field === 'TARI' ? 'text-green-600' :
                      'text-blue-600'
                    }`}>{student.field}</span>
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="text" 
                      placeholder="Tambah catatan..."
                      className="text-xs bg-transparent border-b border-transparent focus:border-blue-300 focus:outline-none w-full py-1 text-slate-600 italic"
                      value={student.notes || ''}
                      onChange={(e) => onUpdateNotes(student.id, e.target.value)}
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditingStudent(student)}
                        className="text-slate-300 hover:text-blue-500 p-2 transition-all"
                        title="Edit Murid"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => { if(confirm('Adakah anda pasti mahu memadam rekod ini?')) onDelete(student.id); }}
                        className="text-slate-300 hover:text-red-500 p-2 transition-all"
                        title="Padam Murid"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <i className="fas fa-user-slash text-4xl mb-4 block opacity-20"></i>
                    Tiada rekod murid ditemui.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                  <i className="fas fa-user-edit"></i>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Edit Maklumat Murid</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-black">ID: {editingStudent.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingStudent(null)}
                className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Nama Penuh</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-800"
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Jantina</label>
                  <select
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-700 bg-slate-50"
                    value={editingStudent.gender}
                    onChange={(e) => setEditingStudent({ ...editingStudent, gender: e.target.value as Gender })}
                  >
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Kumpulan</label>
                  <select
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-700 bg-slate-50"
                    value={editingStudent.group}
                    onChange={(e) => setEditingStudent({ ...editingStudent, group: e.target.value })}
                  >
                    {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Role Akses</label>
                  <select
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-indigo-700 bg-indigo-50"
                    value={editingStudent.role || 'MURID'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, role: e.target.value })}
                  >
                    <option value="MURID">MURID</option>
                    <option value="KETUA KELAS">KETUA KELAS</option>
                    <option value="PEN. KETUA KELAS">PEN. KETUA KELAS</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Bidang</label>
                  <select
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-700 bg-slate-50"
                    value={editingStudent.field}
                    onChange={(e) => setEditingStudent({ ...editingStudent, field: e.target.value as Field })}
                  >
                    {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl transition-all uppercase tracking-widest text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all uppercase tracking-widest text-xs"
                >
                  Kemaskini Rekod
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
