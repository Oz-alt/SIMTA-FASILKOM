import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  Users, 
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  FileText,
  Play,
  Save,
  Edit,
  History,
  XCircle,
  Video
} from 'lucide-react';

export default function BimbinganPage() {
  const { currentUser, studentAdvisors } = useAuth();
  
  // Dapatkan daftar mahasiswa bimbingan dari dosen ini (baik sebagai PA 1 atau PA 2)
  const myStudents = useMemo(() => {
    return studentAdvisors.filter(sa => sa.dospem1_nip === currentUser.nip || sa.dospem2_nip === currentUser.nip);
  }, [studentAdvisors, currentUser]);

  const [selectedStudent, setSelectedStudent] = useState(myStudents.length > 0 ? myStudents[0] : null);

  // === State Absensi & Timer Sesi ===
  const [sessionActive, setSessionActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0); // 10 menit = 600 detik
  const [presenceStatus, setPresenceStatus] = useState('belum_mulai'); // belum_mulai, aktif, hadir, terlewat
  
  // === State Logbook ===
  const [logbooks, setLogbooks] = useState([
    // Mock initial history
    { id: 1, studentNim: '09010182428002', pembimbing: 'PA 1', catatan: 'Revisi bab 1, perbaiki latar belakang.', tanggal: '20 Okt 2026 10:00', status_kehadiran: 'hadir' }
  ]);
  const [formLogbook, setFormLogbook] = useState({ pembimbing: 'PA 1', catatan: '' });
  const [editingId, setEditingId] = useState(null);

  // Timer Effect
  useEffect(() => {
    let interval;
    if (sessionActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (sessionActive && timerSeconds === 0) {
      setSessionActive(false);
      if (presenceStatus === 'aktif') {
        setPresenceStatus('terlewat'); // Batas waktu habis, mahasiswa terlewat absen
      }
    }
    return () => clearInterval(interval);
  }, [sessionActive, timerSeconds, presenceStatus]);

  const startSession = () => {
    setSessionActive(true);
    setTimerSeconds(600); // 10 menit
    setPresenceStatus('aktif');
  };

  const markPresence = () => {
    if (sessionActive && timerSeconds > 0) {
      setPresenceStatus('hadir');
      setSessionActive(false);
      setTimerSeconds(0);
    }
  };

  const saveLogbook = () => {
    if (!formLogbook.catatan.trim()) return;

    if (editingId) {
      setLogbooks(prev => prev.map(log => log.id === editingId ? { ...log, ...formLogbook } : log));
      setEditingId(null);
    } else {
      const newLog = {
        id: Date.now(),
        studentNim: selectedStudent.student_nim,
        pembimbing: formLogbook.pembimbing,
        catatan: formLogbook.catatan,
        tanggal: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        status_kehadiran: presenceStatus === 'hadir' ? 'hadir' : 'tidak_hadir'
      };
      setLogbooks(prev => [newLog, ...prev]);
      
      // Reset presence after saving logbook
      setPresenceStatus('belum_mulai');
    }
    
    setFormLogbook({ pembimbing: 'PA 1', catatan: '' });
  };

  const editLogbook = (log) => {
    setEditingId(log.id);
    setFormLogbook({ pembimbing: log.pembimbing, catatan: log.catatan });
  };

  const currentStudentLogs = logbooks.filter(log => log.studentNim === selectedStudent?.student_nim);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center space-x-3">
          <Video className="w-6 h-6 text-emerald-400" />
          <span>Room Bimbingan</span>
        </h1>
        <p className="text-sm text-teal-100/90 mt-1 max-w-2xl leading-relaxed">
          Ruang utama untuk aktivitas bimbingan. Mulai sesi untuk mengaktifkan timer absensi (10 menit) dan catat logbook bimbingan secara terstruktur.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar Kiri: Pilih Mahasiswa */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">Pilih Mahasiswa</h2>
            {myStudents.length === 0 ? (
              <p className="text-xs text-slate-500">Anda belum memiliki mahasiswa bimbingan.</p>
            ) : (
              <div className="space-y-2">
                {myStudents.map(student => (
                  <button
                    key={student.id}
                    onClick={() => {
                      setSelectedStudent(student);
                      setSessionActive(false);
                      setTimerSeconds(0);
                      setPresenceStatus('belum_mulai');
                      setFormLogbook({ pembimbing: 'PA 1', catatan: '' });
                      setEditingId(null);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                      selectedStudent?.id === student.id 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-2xs' 
                      : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <span className="block text-slate-900 truncate">{student.student_nama}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{student.student_nim}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info Dosen Pembimbing */}
          {selectedStudent && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2 flex items-center space-x-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Tim Pembimbing</span>
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pembimbing 1 (PA 1)</p>
                  <p className="text-xs font-medium text-slate-800">{selectedStudent.dospem1_nip || 'Belum diatur'}</p>
                  {currentUser.nip === selectedStudent.dospem1_nip && (
                    <span className="inline-block mt-0.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md">Anda</span>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pembimbing 2 (PA 2)</p>
                  <p className="text-xs font-medium text-slate-800">{selectedStudent.dospem2_nip || 'Belum diatur'}</p>
                  {currentUser.nip === selectedStudent.dospem2_nip && (
                    <span className="inline-block mt-0.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md">Anda</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        {selectedStudent ? (
          <div className="lg:col-span-3 space-y-6">
            
            {/* Bagian Absensi & Timer */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Clock className="w-24 h-24" />
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                    <span>Absensi Kehadiran</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Status Kehadiran: Mahasiswa bimbingan <strong>{selectedStudent.student_nama}</strong></p>
                </div>

                <div className="flex items-center space-x-3">
                  {presenceStatus === 'belum_mulai' && (
                    <button onClick={startSession} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center space-x-2 cursor-pointer">
                      <Play className="w-4 h-4" />
                      <span>Mulai Sesi (Timer 10 Menit)</span>
                    </button>
                  )}

                  {presenceStatus === 'aktif' && (
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 text-rose-600 font-mono bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                        <Clock className="w-4 h-4" />
                        <span className="font-bold text-sm">
                          {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <button onClick={markPresence} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center space-x-2 cursor-pointer">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Validasi Hadir</span>
                      </button>
                    </div>
                  )}

                  {presenceStatus === 'hadir' && (
                    <div className="flex items-center space-x-2 text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-bold text-xs">Hadir Tervalidasi</span>
                    </div>
                  )}

                  {presenceStatus === 'terlewat' && (
                    <div className="flex items-center space-x-2 text-rose-700 bg-rose-50 px-4 py-2 rounded-xl border border-rose-200">
                      <XCircle className="w-4 h-4" />
                      <span className="font-bold text-xs">Waktu Habis (Tidak Valid)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bagian Input Logbook */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 mb-4">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>{editingId ? 'Edit Catatan Logbook' : 'Catatan Baru Logbook'}</span>
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih Peran Pembimbing</label>
                  <select 
                    value={formLogbook.pembimbing}
                    onChange={(e) => setFormLogbook({...formLogbook, pembimbing: e.target.value})}
                    className="w-full sm:w-1/3 px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all bg-white"
                  >
                    <option value="PA 1">Sebagai Dosen PA 1</option>
                    <option value="PA 2">Sebagai Dosen PA 2</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Catatan Bimbingan</label>
                  <textarea 
                    value={formLogbook.catatan}
                    onChange={(e) => setFormLogbook({...formLogbook, catatan: e.target.value})}
                    placeholder="Tuliskan arahan, revisi, atau catatan progress untuk mahasiswa..."
                    className="w-full px-4 py-3 min-h-[120px] text-sm border border-slate-300 rounded-xl outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-3">
                  {editingId && (
                    <button 
                      onClick={() => { setEditingId(null); setFormLogbook({ pembimbing: 'PA 1', catatan: '' }); }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Batal Edit
                    </button>
                  )}
                  <button 
                    onClick={saveLogbook}
                    disabled={!formLogbook.catatan.trim()}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingId ? 'Simpan Perubahan' : 'Simpan Logbook'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Riwayat Bimbingan */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 mb-6">
                <History className="w-5 h-5 text-slate-600" />
                <span>Riwayat Bimbingan</span>
              </h2>

              {currentStudentLogs.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm font-medium">
                  Belum ada riwayat catatan logbook.
                </div>
              ) : (
                <div className="space-y-4">
                  {currentStudentLogs.map(log => (
                    <div key={log.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-md hover:border-indigo-200 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                            log.pembimbing === 'PA 1' ? 'bg-indigo-100 text-indigo-800' : 'bg-teal-100 text-teal-800'
                          }`}>
                            {log.pembimbing}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{log.tanggal}</span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center space-x-1 ${
                            log.status_kehadiran === 'hadir' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {log.status_kehadiran === 'hadir' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            <span>{log.status_kehadiran === 'hadir' ? 'Hadir (Sesi)' : 'Tidak Hadir/Manual'}</span>
                          </span>
                          <button 
                            onClick={() => editLogbook(log)}
                            className="text-slate-400 hover:text-indigo-600 p-1 cursor-pointer transition-colors"
                            title="Edit Catatan"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {log.catatan}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-10 shadow-xs flex flex-col items-center justify-center text-center">
            <Users className="w-16 h-16 text-slate-200 mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Silakan Pilih Mahasiswa</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-sm">Pilih mahasiswa di panel sebelah kiri untuk memulai sesi bimbingan dan melihat riwayat logbook.</p>
          </div>
        )}

      </div>
    </div>
  );
}
