import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  Users, 
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  FileText
} from 'lucide-react';

export default function BimbinganPage() {
  const { currentUser, studentAdvisors, consultations, reviewConsultation } = useAuth();
  
  // Dapatkan daftar mahasiswa bimbingan dari dosen ini
  const myStudents = useMemo(() => {
    return studentAdvisors.filter(sa => sa.dospem1_nip === currentUser.nip || sa.dospem2_nip === currentUser.nip);
  }, [studentAdvisors, currentUser]);

  const [selectedStudent, setSelectedStudent] = useState(myStudents.length > 0 ? myStudents[0] : null);
  const [feedbackInput, setFeedbackInput] = useState({});

  // Filter consultations for the selected student that involve the current dosen
  const studentConsultations = useMemo(() => {
    if (!selectedStudent) return [];
    return consultations.filter(c => c.mhs_nim === selectedStudent.student_nim);
  }, [consultations, selectedStudent]);

  const handleFeedbackSubmit = (consId, newStatus) => {
    const notes = feedbackInput[consId] || 'Telah diverifikasi pembimbing.';
    reviewConsultation(consId, newStatus, notes);
    setFeedbackInput(prev => ({ ...prev, [consId]: '' }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center space-x-3">
          <UserCheck className="w-6 h-6 text-blue-400" />
          <span>Validasi Log Bimbingan</span>
        </h1>
        <p className="text-sm text-indigo-100/90 mt-1 max-w-2xl leading-relaxed">
          Pilih mahasiswa untuk melihat dan memvalidasi log bimbingan yang telah diajukan.
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
                      setFeedbackInput({});
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                      selectedStudent?.id === student.id 
                      ? 'bg-blue-50 border-blue-200 text-blue-800 shadow-2xs' 
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
        </div>

        {/* Main Content Area */}
        {selectedStudent ? (
          <div className="lg:col-span-3 space-y-6">
            
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Log Bimbingan Mahasiswa: {selectedStudent.student_nama}</span>
                </h2>
              </div>

              {studentConsultations.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm font-medium">
                  Belum ada log bimbingan yang diajukan oleh mahasiswa ini.
                </div>
              ) : (
                <div className="space-y-4">
                  {studentConsultations.map((c) => (
                    <div key={c.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex flex-wrap gap-2 items-center justify-between text-xs mb-2">
                        <div className="flex items-center space-x-2">
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              c.pembimbing === 'Pembimbing 1' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' : 'bg-purple-50 text-purple-800 border-purple-200'
                            }`}>
                              {c.pembimbing}
                            </span>
                            <span className="text-slate-500 font-medium flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{c.tanggal} ({c.waktu})</span>
                            </span>
                        </div>
                        <div className="flex items-center space-x-2 font-bold text-[10px]">
                           {c.status === 'disetujui' && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Disetujui</span>
                              </span>
                            )}
                            {c.status === 'perlu_revisi' && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center space-x-1">
                                <AlertCircle className="w-3 h-3" />
                                <span>Perlu Revisi</span>
                              </span>
                            )}
                            {c.status === 'menunggu_tanggapan' && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>Menunggu Validasi</span>
                              </span>
                            )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-800">Materi: {c.bab_topik}</p>
                        <div className="bg-white p-3 rounded-lg border border-slate-100 text-xs">
                           <span className="font-bold text-slate-700 block mb-1">Catatan Mahasiswa:</span>
                           <p className="text-slate-600">{c.catatan_mahasiswa}</p>
                        </div>
                      </div>

                      {/* Display existing masukan dosen if available and not waiting */}
                      {c.status !== 'menunggu_tanggapan' && c.masukan_dosen && (
                         <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-xs mt-2">
                           <span className="font-bold text-indigo-800 block mb-1 flex items-center space-x-1">
                             <MessageSquare className="w-3 h-3" />
                             <span>Masukan Pembimbing:</span>
                           </span>
                           <p className="text-indigo-900">{c.masukan_dosen}</p>
                         </div>
                      )}

                      {/* Input Feedback for Validation */}
                      {c.status === 'menunggu_tanggapan' && (
                        <div className="space-y-2 pt-2 border-t border-slate-200 mt-2">
                          <input
                            type="text"
                            placeholder="Tuliskan masukan / catatan validasi dosen di sini..."
                            value={feedbackInput[c.id] || ''}
                            onChange={(e) => setFeedbackInput(prev => ({ ...prev, [c.id]: e.target.value }))}
                            className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white outline-none focus:border-blue-600"
                          />

                          <div className="flex items-center justify-end space-x-2 mt-2">
                            <button
                              onClick={() => handleFeedbackSubmit(c.id, 'perlu_revisi')}
                              className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-xs transition-all cursor-pointer"
                            >
                              Tolak / Revisi
                            </button>
                            <button
                              onClick={() => handleFeedbackSubmit(c.id, 'disetujui')}
                              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
                            >
                              Validasi (Setuju)
                            </button>
                          </div>
                        </div>
                      )}
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
            <p className="text-sm text-slate-500 mt-2 max-w-sm">Pilih mahasiswa di panel sebelah kiri untuk melihat dan memvalidasi log bimbingan mereka.</p>
          </div>
        )}

      </div>
    </div>
  );
}
