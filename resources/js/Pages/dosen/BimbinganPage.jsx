import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  Users, 
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  FileText,
  Download
} from 'lucide-react';

export default function BimbinganPage() {
  const { currentUser, consultations, reviewConsultation, studentAdvisors, thesisTitles } = useAuth();
  const [feedbackInput, setFeedbackInput] = useState({});

  // Filter consultations for current dosen
  const dosenConsultations = useMemo(() => {
    return consultations.filter(c => c.dosen_nama === currentUser.nama);
  }, [consultations, currentUser]);

  const handleFeedbackSubmit = (consId, newStatus) => {
    const notes = feedbackInput[consId] || 'Telah diverifikasi pembimbing.';
    reviewConsultation(consId, newStatus, notes);
    setFeedbackInput(prev => ({ ...prev, [consId]: '' }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-extrabold tracking-tight">Manajemen Bimbingan Mahasiswa</h1>
        <p className="text-sm text-teal-100/90 mt-1 max-w-2xl leading-relaxed">
          Tinjau riwayat konsultasi mahasiswa, periksa dokumen draf revisi, dan berikan persetujuan bimbingan.
        </p>
      </div>

      {/* Dosen Panel Verifikasi */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <span>Panel Verifikasi Konsultasi</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">Berdasarkan Pengajuan Terbaru</span>
        </div>

        {dosenConsultations.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            Belum ada catatan konsultasi yang masuk dari mahasiswa Anda.
          </div>
        ) : (
          <div className="space-y-4">
            {dosenConsultations.map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 transition-all hover:border-emerald-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">{c.mhs_nama}</span>
                    <span className="text-[11px] text-slate-500 font-mono block">{c.mhs_nim}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-slate-500 font-medium flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.tanggal} ({c.waktu})</span>
                    </span>

                    {c.status === 'disetujui' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px] flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Disetujui</span>
                      </span>
                    )}
                    {c.status === 'perlu_revisi' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px] flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        <span>Perlu Revisi</span>
                      </span>
                    )}
                    {c.status === 'menunggu_tanggapan' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-bold text-[10px] flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                        <span>Menunggu Tanggapan</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-bold text-slate-800">{c.bab_topik}</p>
                  <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200">{c.catatan_mahasiswa}</p>
                </div>

                {c.file_revisi_url && (
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 text-slate-600">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-slate-800">Draf Revisi Terlampir</span>
                    </div>
                    <a href={c.file_revisi_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all flex items-center space-x-1 shadow-2xs">
                      <Download className="w-3 h-3" />
                      <span>Unduh</span>
                    </a>
                  </div>
                )}

                <div className="space-y-2 pt-3 border-t border-slate-200 mt-2">
                  <span className="text-xs font-bold text-slate-700">Tanggapan / Catatan Dosen:</span>
                  <input
                    type="text"
                    placeholder="Tuliskan masukan atau catatan revisi di sini..."
                    value={feedbackInput[c.id] || ''}
                    onChange={(e) => setFeedbackInput(prev => ({ ...prev, [c.id]: e.target.value }))}
                    className="w-full px-3 py-2.5 text-xs font-medium border border-slate-300 rounded-lg bg-white outline-none focus:border-emerald-600 transition-colors"
                  />

                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                      onClick={() => handleFeedbackSubmit(c.id, 'perlu_revisi')}
                      className="px-4 py-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-xs transition-all cursor-pointer"
                    >
                      Minta Revisi
                    </button>
                    <button
                      onClick={() => handleFeedbackSubmit(c.id, 'disetujui')}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer flex items-center space-x-1"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Setujui Bimbingan</span>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
