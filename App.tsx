
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

// Fungsi Utiliti untuk mendapatkan tarikh YYYY-MM-DD zon masa tempatan
export const getLocalISOString = (date: Date = new Date()) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`; 
};

// URL TERKINI YANG DIBERIKAN OLEH PENGGUNA (DIKEMASKINI)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzsM8D2172lI_QVBAlqbmzJmm4TR2iHlRz-db534os6h5EpOy6I7XT0mYYWbCZAIu92kw/exec';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('Data Berjaya Disimpan');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  
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
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'sync_attendance',
          timestamp: new Date().toISOString(),
          coachName: coachName,
          students: students,
          attendance: filteredAttendance
        }),
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
        body: JSON.stringify({ action: 'search_attendance', targetDate: date }),
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
        return <ArchiveSearch googleScriptUrl={GOOGLE_SCRIPT_URL} attendance={attendance} />;
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
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3"><i className="fas fa-book-reader text-blue-600"></i>Manual & Kod Cloud (VERSI 17.0)</h2>
            <div className="space-y-8 text-slate-600">
              <section className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                <h3 className="text-indigo-900 font-bold mb-4 flex items-center gap-2"><i className="fas fa-code"></i> Kod Google Apps Script (VERSI 17.0 - SYNC & DELETE)</h3>
                <p className="text-xs mb-4 text-indigo-700 font-bold italic">KEMASKINI: Gunakan kod ini pada Google Apps Script anda untuk menyokong fungsi 'DELETE' rekod terus daripada aplikasi.</p>
                <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl text-[10px] overflow-x-auto font-mono">
{`function doPost(e) {
  var SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";
  var ss;
  try { ss = SpreadsheetApp.openById(SPREADSHEET_ID); } catch (err) { return createJsonResponse({ error: "ID Spreadsheet salah." }); }
  
  try {
    if (!e || !e.postData || !e.postData.contents) return createJsonResponse({ error: "Tiada data." });
    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === "search_attendance") {
      var sheet = ss.getSheetByName("REKOD KEHADIRAN");
      if (!sheet || sheet.getLastRow() < 2) return createJsonResponse([]);
      var rows = sheet.getDataRange().getValues();
      var headers = rows[0];
      
      function findHeader(target) {
        var t = target.toLowerCase().trim();
        for(var i=0; i<headers.length; i++) {
          if(headers[i].toString().toLowerCase().trim().indexOf(t) > -1) return i;
        }
        return -1;
      }

      var idx = {
        date: findHeader("Tarikh"),
        day: findHeader("Hari"),
        time: findHeader("Masa"),
        coach: findHeader("Nama Jurulatih"),
        form: findHeader("Tingkatan"),
        group: findHeader("Kumpulan"),
        name: findHeader("Nama Murid"),
        status: findHeader("Status"),
        notes: findHeader("Catatan")
      };

      var results = [];
      var targetDate = data.targetDate;

      for (var i = 1; i < rows.length; i++) {
        var row = rows[i];
        if (!row) continue;
        
        var rowDateValue = row[idx.date > -1 ? idx.date : 0];
        if (!rowDateValue) continue;
        
        var rowDateStr = (rowDateValue instanceof Date) 
          ? Utilities.formatDate(rowDateValue, "GMT+8", "yyyy-MM-dd") 
          : rowDateValue.toString().trim();
        
        if (rowDateStr === targetDate) {
          results.push({
            date: rowDateStr,
            day: idx.day > -1 ? row[idx.day] : "N/A",
            timeSlot: idx.time > -1 ? row[idx.time] : "N/A",
            coachName: idx.coach > -1 ? row[idx.coach].toString().trim() : "DATA TIDAK DITEMUI",
            form: idx.form > -1 ? row[idx.form] : "N/A",
            group: idx.group > -1 ? row[idx.group] : "N/A",
            name: idx.name > -1 ? row[idx.name] : "TANPA NAMA",
            status: idx.status > -1 ? row[idx.status] : "N/A",
            notes: idx.notes > -1 ? row[idx.notes] : ""
          });
        }
      }
      return createJsonResponse(results);
    }
    else if (action === "delete_attendance") {
      var sheet = ss.getSheetByName("REKOD KEHADIRAN");
      if (!sheet) return ContentService.createTextOutput("ERROR: No Sheet").setMimeType(ContentService.MimeType.TEXT);
      var rows = sheet.getDataRange().getValues();
      var targetDate = data.targetDate;
      var targetTime = data.timeSlot;
      
      var deletedCount = 0;
      for (var i = rows.length - 1; i >= 1; i--) {
        var row = rows[i];
        var rowDateValue = row[0]; // Assumes Tarikh is Col A
        var rowTimeValue = row[2]; // Assumes Masa is Col C
        
        var rowDateStr = (rowDateValue instanceof Date) 
          ? Utilities.formatDate(rowDateValue, "GMT+8", "yyyy-MM-dd") 
          : rowDateValue.toString().trim();
        
        if (rowDateStr === targetDate && rowTimeValue.toString().trim() === targetTime) {
          sheet.deleteRow(i + 1);
          deletedCount++;
        }
      }
      return ContentService.createTextOutput("SUCCESS: Deleted " + deletedCount).setMimeType(ContentService.MimeType.TEXT);
    }
    else if (action === "sync_attendance") {
      var attendanceList = data.attendance || [];
      var studentList = data.students || [];
      var days = ["AHAD", "ISNIN", "SELASA", "RABU", "KHAMIS", "JUMAAT", "SABTU"];
      var sheetArchive = ss.getSheetByName("REKOD KEHADIRAN") || ss.insertSheet("REKOD KEHADIRAN");
      
      var headerRow = ["Tarikh", "Hari", "Masa", "Nama Jurulatih", "ROLE", "Tingkatan", "Kumpulan", "Nama Murid", "Status", "Catatan"];
      if (sheetArchive.getLastRow() === 0) sheetArchive.appendRow(headerRow);

      for (var j = 0; j < attendanceList.length; j++) {
        var a = attendanceList[j];
        var student = studentList.find(function(s) { return s.id === a.studentId; });
        if (student) {
          var dParts = a.date.split("-");
          var dateObj = new Date(dParts[0], dParts[1] - 1, dParts[2]);
          sheetArchive.appendRow([
            a.date, 
            days[dateObj.getDay()], 
            a.timeSlot, 
            data.coachName || "TIADA JURULATIH",
            student.role || "MURID",
            student.form || "N/A",
            student.group || "N/A",
            student.name,
            a.status === "PRESENT" ? "HADIR" : "TIDAK HADIR",
            student.notes || ""
          ]);
        }
      }
      return ContentService.createTextOutput("SUCCESS").setMimeType(ContentService.MimeType.TEXT);
    }
  } catch (err) { return createJsonResponse({ error: err.message }); }
}
function createJsonResponse(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }`}
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
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar currentView={currentView} setView={setCurrentView} onLogout={() => setIsAuthenticated(false)} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header currentView={currentView} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          {showToast && <div className="fixed top-20 right-8 z-50 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce"><i className="fas fa-check-circle"></i><span className="font-bold">{toastMsg}</span></div>}
          <div className="max-w-6xl mx-auto">{renderView()}</div>
        </main>
      </div>
    </div>
  );
};

export default App;
