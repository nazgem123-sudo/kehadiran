
import React, { useState, useEffect, useCallback } from 'react';
import { View, Student, AttendanceRecord } from './types';
import { INITIAL_STUDENTS } from './constants';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import AddStudent from './components/AddStudent';
import ImportStudent from './components/ImportStudent';
import Summary from './components/Summary';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ArchiveSearch from './components/ArchiveSearch';

export const getLocalISOString = (date: Date = new Date()) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`; 
};

// KEMASKINI: URL deployment baharu yang dibekalkan pengguna
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxje46YQpff6xm9GrjDBWNi4brRdt1Cib6h0dbwBa3Zkzd3pteiVtf0lZFJ-YkanhnLhA/exec';
const SPREADSHEET_ID = '1Otr6yM4-Zx2ifK_s7Wd2ofu8pE05hN561zpqDM-RFCA';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('Data Berjaya Disimpan');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(window.innerWidth >= 1024);
  
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('art_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('art_attendance');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[][]>([]);

  useEffect(() => {
    localStorage.setItem('art_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('art_attendance', JSON.stringify(attendance));
  }, [attendance]);

  const handleLogin = (user: string, pass: string) => {
    if (user === 'admin' && pass === 'spark') {
      setIsAuthenticated(true);
    } else {
      alert('Nama pengguna atau kata laluan salah!');
    }
  };

  const notifySuccess = (msg?: string) => {
    setToastMsg(msg || 'Data Berjaya Disimpan');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const syncToGoogleSheets = async (coachName: string, date: string, timeSlot: string) => {
    setIsSyncing(true);
    try {
      const filteredAttendance = attendance.filter(a => a.date === date && a.timeSlot === timeSlot);
      if (filteredAttendance.length === 0) {
        alert('Tiada data kehadiran untuk disimpan bagi sesi ini.');
        setIsSyncing(false);
        return;
      }
      
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'sync_attendance',
          spreadsheetId: SPREADSHEET_ID,
          timestamp: new Date().toISOString(),
          coachName: coachName,
          students: students,
          attendance: filteredAttendance
        }),
        redirect: 'follow'
      });
      
      notifySuccess('Berjaya Simpan ke Google Sheets!');
    } catch (error) {
      console.error('Error syncing:', error);
      alert('Gagal menyambung ke Google Sheets.');
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchAttendanceByDate = async (date: string) => {
    if (!date) return;
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
          action: 'search_attendance', 
          spreadsheetId: SPREADSHEET_ID,
          targetDate: date 
        }),
        redirect: 'follow'
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        const newRecords: AttendanceRecord[] = [];
        data.forEach((item: any) => {
          const student = students.find(s => s.name.trim().toUpperCase() === item.name.trim().toUpperCase());
          if (student) {
            newRecords.push({
              studentId: student.id,
              date: item.date || date,
              status: (item.status === 'HADIR' || item.status === 'PRESENT' || item.status === 'Hadir') ? 'PRESENT' : 'ABSENT',
              timeSlot: item.timeSlot || 'N/A'
            });
          }
        });
        if (newRecords.length > 0) {
          setAttendance(prev => {
            const otherDates = prev.filter(a => a.date !== date);
            return [...otherDates, ...newRecords];
          });
          notifySuccess(`Data tarikh ${date.split('-').reverse().join('-')} dikemaskini.`);
        } else {
          alert(`Tiada data kehadiran ditemui di Google Sheets bagi tarikh ${date}.`);
        }
      }
    } catch (error) {
      console.error('Refresh error:', error);
      alert('Gagal mengambil data.');
    }
  };

  const addStudent = (newStudent: Omit<Student, 'id'>) => {
    const studentWithId = { ...newStudent, id: Date.now().toString() };
    setStudents(prev => [...prev, studentWithId]);
    notifySuccess();
    setCurrentView('DATA_MURID');
  };

  const updateStudent = (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    notifySuccess();
  };

  const importStudents = (newStudents: Student[]) => {
    setStudents(prev => [...prev, ...newStudents]);
    notifySuccess();
    setCurrentView('DATA_MURID');
  };

  const updateAttendance = (studentId: string, date: string, status: 'PRESENT' | 'ABSENT', timeSlot: string) => {
    setAttendanceHistory(prev => [...prev.slice(-19), [...attendance]]);
    setAttendance(prev => {
      const filtered = prev.filter(a => !(a.studentId === studentId && a.date === date && a.timeSlot === timeSlot));
      return [...filtered, { studentId, date, status, timeSlot }];
    });
  };

  const bulkUpdateAttendance = (updates: { studentId: string; status: 'PRESENT' | 'ABSENT' }[], date: string, timeSlot: string) => {
    setAttendanceHistory(prev => [...prev.slice(-19), [...attendance]]);
    setAttendance(prev => {
      const studentIdsToUpdate = new Set(updates.map(u => u.studentId));
      const otherRecords = prev.filter(a => !(studentIdsToUpdate.has(a.studentId) && a.date === date && a.timeSlot === timeSlot));
      const newRecords = updates.map(u => ({ studentId: u.studentId, date, status: u.status, timeSlot }));
      return [...otherRecords, ...newRecords];
    });
  };

  const clearAttendance = (studentIds: string[], date: string, timeSlot: string) => {
    setAttendanceHistory(prev => [...prev.slice(-19), [...attendance]]);
    setAttendance(prev => prev.filter(a => !(studentIds.includes(a.studentId) && a.date === date && a.timeSlot === timeSlot)));
  };

  const clearAllAttendance = () => {
    if (confirm('ADAKAH ANDA PASTI? Storan aplikasi ini akan dikosongkan.')) {
      setAttendance([]);
      setAttendanceHistory([]);
      localStorage.removeItem('art_attendance');
      notifySuccess('Rekod kehadiran dikosongkan.');
    }
  };

  const undoAttendance = () => {
    if (attendanceHistory.length === 0) return;
    setAttendance(attendanceHistory[attendanceHistory.length - 1]);
    setAttendanceHistory(prev => prev.slice(0, -1));
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    notifySuccess();
  };

  const updateStudentNotes = (id: string, notes: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, notes } : s));
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return (
          <Dashboard 
            students={students} 
            attendance={attendance} 
            onMark={updateAttendance} 
            onBulkMark={bulkUpdateAttendance}
            onClear={clearAttendance}
            onUndo={undoAttendance}
            canUndo={attendanceHistory.length > 0}
            onUpdateStudent={updateStudent}
            onSave={syncToGoogleSheets}
            isSaving={isSyncing}
            onRefresh={fetchAttendanceByDate}
          />
        );
      case 'CARIAN_ARKIB':
        return <ArchiveSearch googleScriptUrl={GOOGLE_SCRIPT_URL} attendance={attendance} spreadsheetId={SPREADSHEET_ID} />;
      case 'DATA_MURID':
        return <StudentList students={students} onDelete={deleteStudent} onUpdateNotes={updateStudentNotes} onUpdateStudent={updateStudent} />;
      case 'TAMBAH_MURID':
        return <AddStudent onAdd={addStudent} />;
      case 'IMPORT_MURID':
        return <ImportStudent onImport={importStudents} />;
      case 'RINGKASAN':
        return (
          <Summary 
            students={students} 
            attendance={attendance} 
            googleScriptUrl={GOOGLE_SCRIPT_URL}
            spreadsheetId={SPREADSHEET_ID}
            onImportCloudData={(newRecords) => {
              setAttendance(prev => {
                const existing = new Set(prev.map(p => `${p.studentId}-${p.date}-${p.timeSlot}`));
                const toAdd = newRecords.filter(n => !existing.has(`${n.studentId}-${n.date}-${n.timeSlot}`));
                return [...prev, ...toAdd];
              });
            }}
            onClearAll={clearAllAttendance}
          />
        );
      case 'MANUAL':
        return (
          <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3"><i className="fas fa-book-reader text-blue-600"></i>Manual & Kod Cloud (VERSI 17.0)</h2>
            <div className="space-y-8 text-slate-600">
              <section className="bg-indigo-50 p-4 sm:p-6 rounded-2xl border border-indigo-100">
                <h3 className="text-indigo-900 font-bold mb-4 flex items-center gap-2 text-sm sm:text-base"><i className="fas fa-code"></i> Kod Google Apps Script (VERSI 17.0)</h3>
                <pre className="bg-slate-900 text-slate-300 p-3 sm:p-4 rounded-xl text-[9px] sm:text-[10px] overflow-x-auto font-mono">
{`function doPost(e) { ... kod ... }`}
                </pre>
              </section>
            </div>
          </div>
        );
      default:
        return <Dashboard students={students} attendance={attendance} onMark={updateAttendance} onBulkMark={bulkUpdateAttendance} onClear={clearAttendance} onUndo={undoAttendance} canUndo={attendanceHistory.length > 0} onUpdateStudent={updateStudent} onSave={syncToGoogleSheets} isSaving={isSyncing} onRefresh={fetchAttendanceByDate} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden relative">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        onLogout={() => setIsAuthenticated(false)} 
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header 
          currentView={currentView} 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-8 relative">
          {showToast && <div className="fixed top-20 right-4 sm:right-8 z-50 bg-emerald-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce"><i className="fas fa-check-circle"></i><span className="font-bold text-xs sm:text-sm">{toastMsg}</span></div>}
          <div className="max-w-6xl mx-auto w-full">{renderView()}</div>
        </main>
      </div>
    </div>
  );
};

export default App;
