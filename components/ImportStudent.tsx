
import React, { useState } from 'react';
import { Student, Gender, Group, Form, Field } from '../types';

interface ImportStudentProps {
  onImport: (students: Student[]) => void;
}

const ImportStudent: React.FC<ImportStudentProps> = ({ onImport }) => {
  const [fileSelected, setFileSelected] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileSelected(file.name);
      // Simulating a CSV parse for demonstration
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        console.log("File content ready for processing:", text);
      };
      reader.readAsText(file);
    }
  };

  const handleProcessImport = () => {
    // Logic to parse the simulated text would go here
    // For now, we mock some imported data
    const mockImported: Student[] = [
      { id: Date.now().toString() + '1', name: 'MOHD ZAKI', gender: 'LELAKI', group: 'A', form: 'TINGKATAN 1', field: 'MUZIK' },
      { id: Date.now().toString() + '2', name: 'NUR AMIRA', gender: 'PEREMPUAN', group: 'B', form: 'TINGKATAN 1', field: 'TARI' },
    ];
    onImport(mockImported);
    alert('2 rekod murid telah diimport berjaya!');
  };

  const downloadTemplate = () => {
    const headers = "Nama Murid,Jantina,Kumpulan,Tingkatan,Bidang\n";
    const example = "ALI BIN ABU,LELAKI,A,TINGKATAN 1,MUZIK";
    const blob = new Blob([headers + example], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'templat_murid_kesenian.csv';
    a.click();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Import Murid Pukal</h2>
        <p className="text-sm text-slate-500 mb-8">Gunakan fail Excel/CSV untuk memuat naik senarai murid dengan cepat.</p>
        
        <div className="space-y-8">
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <i className="fas fa-file-excel text-4xl text-green-500 mb-4"></i>
            <div className="flex flex-col items-center">
              <label className="cursor-pointer bg-white border border-slate-200 px-6 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all mb-3">
                Pilih Fail
                <input type="file" className="hidden" accept=".csv,.xlsx" onChange={handleFileUpload} />
              </label>
              <p className="text-xs text-slate-400">Pastikan format fail adalah .csv atau .xlsx</p>
              {fileSelected && (
                <p className="mt-4 text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                  <i className="fas fa-check-circle mr-2"></i> {fileSelected}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={downloadTemplate}
              className="flex-1 px-6 py-3 border-2 border-indigo-100 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-all text-sm flex items-center justify-center gap-2"
            >
              <i className="fas fa-download"></i>
              MUAT TURUN TEMPLAT
            </button>
            <button
              disabled={!fileSelected}
              onClick={handleProcessImport}
              className={`flex-1 px-6 py-3 font-bold rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 ${fileSelected ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            >
              <i className="fas fa-upload"></i>
              MULAKAN IMPORT
            </button>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h4 className="text-amber-800 font-bold text-sm mb-2 flex items-center gap-2">
          <i className="fas fa-info-circle"></i>
          Panduan Import
        </h4>
        <ul className="text-xs text-amber-700 space-y-2 list-disc list-inside">
          <li>Pastikan ejaan <strong>Jantina</strong> adalah 'LELAKI' atau 'PEREMPUAN'.</li>
          <li><strong>Tingkatan</strong> mestilah mengikut format 'TINGKATAN 1' hingga 'TINGKATAN 5'.</li>
          <li><strong>Bidang</strong> mestilah 'MUZIK', 'SENI VISUAL', 'TARI' atau 'TEATER'.</li>
          <li>Jangan tukar susunan tajuk (header) dalam fail CSV.</li>
        </ul>
      </div>
    </div>
  );
};

export default ImportStudent;
