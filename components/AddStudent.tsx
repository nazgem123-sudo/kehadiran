
import React, { useState } from 'react';
import { Student, Gender, Group, Form, Field } from '../types';
import { FORMS, FIELDS, GENDERS, GROUPS } from '../constants';

interface AddStudentProps {
  onAdd: (student: Omit<Student, 'id'>) => void;
}

const AddStudent: React.FC<AddStudentProps> = ({ onAdd }) => {
  const [formData, setFormData] = useState<Omit<Student, 'id'>>({
    name: '',
    gender: 'LELAKI',
    group: '1 PANGGUNG',
    form: '1 BALADA',
    field: 'MUZIK',
    role: 'MURID'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onAdd(formData);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
          <i className="fas fa-user-plus text-xl"></i>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Daftar Murid Baru</h2>
          <p className="text-sm text-slate-500">Sila masukkan maklumat murid dan role akses.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Murid</label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            placeholder="CONTOH: ALI BIN ABU"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Jantina</label>
            <select
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all bg-white"
              value={formData.gender}
              onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as Gender }))}
            >
              {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Kumpulan</label>
            <select
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all bg-white"
              value={formData.group}
              onChange={(e) => setFormData(prev => ({ ...prev, group: e.target.value as Group }))}
            >
              {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Role Akses</label>
            <select
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all bg-white font-bold text-indigo-600"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
            >
              <option value="MURID">MURID</option>
              <option value="KETUA KELAS">KETUA KELAS</option>
              <option value="PEN. KETUA KELAS">PEN. KETUA KELAS</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Bidang</label>
            <select
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all bg-white"
              value={formData.field}
              onChange={(e) => setFormData(prev => ({ ...prev, field: e.target.value as Field }))}
            >
              {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
        >
          <i className="fas fa-save"></i>
          SIMPAN MAKLUMAT
        </button>
      </form>
    </div>
  );
};

export default AddStudent;
