import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  BookOpen, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileText, 
  Download, 
  UserCheck, 
  GraduationCap, 
  FileCheck, 
  MessageSquare, 
  Calendar,
  Edit3,
  Link2,
  ExternalLink
} from 'lucide-react';
import ModalAjukanBimbingan from '../../components/common/ModalAjukanBimbingan.jsx';
import ModalEditBimbingan from '../../components/common/ModalEditBimbingan.jsx';

export default function BimbinganTAPage() {
  const { currentUser, consultations, reviewConsultation } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConsultation, setEditingConsultation] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [feedbackInput, setFeedbackInput] = useState({});

  // Filter consultations for current student
  const studentConsultations = useMemo(() => {
    return consultations.filter(c => !currentUser?.nim || c.mhs_nim === currentUser.nim);
  }, [consultations, currentUser]);

  // Recap stats
  const totalApproved = studentConsultations.filter(c => c.status === 'disetujui').length;
  const countPemb1 = studentConsultations.filter(c => c.pembimbing === 'Pembimbing 1' && c.status === 'disetujui').length;
  const countPemb2 = studentConsultations.filter(c => c.pembimbing === 'Pembimbing 2' && c.status === 'disetujui').length;
  const minRequired = 8;
  const progressPercent = Math.min(100, Math.round((totalApproved / minRequired) * 100));
  const isEligibleForDefense = totalApproved >= minRequired;

  const handleFeedbackSubmit = (consId, newStatus) => {
    const notes = feedbackInput[consId] || 'Telah diverifikasi pembimbing.';
    reviewConsultation(consId, newStatus, notes);
    setFeedbackInput(prev => ({ ...prev, [consId]: '' }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 select-none">
      
      {/* Modal Ajukan Bimbingan */}
      <ModalAjukanBimbingan 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      {/* Modal Edit Catatan Bimbingan */}
      <ModalEditBimbingan
        isOpen={Boolean(editingConsultation)}
        onClose={() => setEditingConsultation(null)}
        consultation={editingConsultation}
        onSaved={(msg) => {
          setToastMsg(msg);
          setTimeout(() => setToastMsg(''), 4000);
        }}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center space-x-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span className="text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30 backdrop-blur-md">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Form Bimbingan &amp; Konsultasi TA Terpadu</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Form Bimbingan Tugas Akhir
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            Catat riwayat pertemuan konsultasi, unggah berkas draf revisi, dapatkan masukan dosen pembimbing, dan pantau kelayakan pendaftaran sidang TA secara real-time.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Catat Sesi Bimbingan Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Rekapitulasi Quick Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold">
        
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Bimbingan Disetujui</span>
          <div className="text-2xl font-extrabold text-blue-700">{totalApproved} Sesi</div>
          <span className="text-[11px] text-slate-500">Dari total {studentConsultations.length} catatan</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sesi Pembimbing 1</span>
          <div className="text-2xl font-extrabold text-indigo-700">{countPemb1} Sesi</div>
          <span className="text-[11px] text-slate-500">Utama</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sesi Pembimbing 2</span>
          <div className="text-2xl font-extrabold text-purple-700">{countPemb2} Sesi</div>
          <span className="text-[11px] text-slate-500">Pendamping</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Kelayakan Sidang</span>
            <span className="text-[11px] font-bold text-slate-700">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <span className={`text-[10px] font-bold block ${isEligibleForDefense ? 'text-emerald-700' : 'text-amber-600'}`}>
            {isEligibleForDefense ? '✓ Layak Daftar Sidang' : `Syarat Min. ${minRequired} Sesi Bimbingan`}
          </span>
        </div>

      </div>

      {/* LOG & RIWAYAT BIMBINGAN SECTION */}
      <div className="space-y-4">
        
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Riwayat Pertemuan Konsultasi</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Tambah Catatan Bimbingan</span>
          </button>
        </div>

        {studentConsultations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Belum Ada Sesi Bimbingan Dicatat</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Klik tombol "Tambah Catatan Bimbingan" di atas untuk mulai mencatat riwayat konsultasi dan mengunggah berkas revisi Anda.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {studentConsultations.map((item) => (
              <div 
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4 hover:border-blue-200 transition-all"
              >
                {/* Item Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      item.pembimbing === 'Pembimbing 1' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' : 'bg-purple-50 text-purple-800 border-purple-200'
                    }`}>
                      {item.pembimbing}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{item.dosen_nama}</h3>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-slate-500 font-medium flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.tanggal} ({item.waktu})</span>
                    </span>

                    {/* Status Badge */}
                    {item.status === 'disetujui' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px] flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Disetujui</span>
                      </span>
                    )}
                    {item.status === 'perlu_revisi' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px] flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        <span>Perlu Revisi</span>
                      </span>
                    )}
                    {item.status === 'menunggu_tanggapan' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-bold text-[10px] flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                        <span>Menunggu Tanggapan</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Bab & Catatan Mahasiswa */}
                <div className="space-y-2 text-xs">
                  <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{item.bab_topik}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed">
                    <span className="font-bold text-slate-900 block mb-0.5">Catatan Progres Mahasiswa:</span>
                    <p>{item.catatan_mahasiswa}</p>
                  </div>
                </div>

                {/* Masukan Dosen Pembimbing */}
                {item.masukan_dosen && (
                  <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs space-y-1">
                    <span className="font-bold text-indigo-900 flex items-center space-x-1.5">
                      <MessageSquare className="w-4 h-4 text-indigo-600" />
                      <span>Masukan / Catatan Dosen Pembimbing:</span>
                    </span>
                    <p className="text-indigo-950 leading-relaxed pl-5 font-medium">{item.masukan_dosen}</p>
                  </div>
                )}

                {/* Link Dokumen Drive & Action Buttons (Edit Catatan & Buka Link) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100 text-xs">
                  <div className="flex items-center space-x-2 text-slate-600 truncate max-w-sm sm:max-w-md">
                    <Link2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="truncate">
                      <span className="font-semibold text-slate-800 mr-1.5">Tautan Dokumen / Drive:</span>
                      {item.file_revisi_url ? (
                        <a
                          href={item.file_revisi_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-medium underline inline-flex items-center space-x-0.5 truncate"
                        >
                          <span className="truncate">{item.file_revisi_url}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Belum ada tautan</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
                    {/* Tombol Edit Catatan */}
                    <button
                      type="button"
                      onClick={() => setEditingConsultation(item)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer hover:shadow-xs"
                      title="Ubah Catatan &amp; Tautan Bimbingan"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Catatan</span>
                    </button>

                    {/* Tombol Buka Link Drive */}
                    {item.file_revisi_url && (
                      <a
                        href={item.file_revisi_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-all flex items-center space-x-1.5 shadow-2xs hover:shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Link Drive</span>
                      </a>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* TINJAUAN DOSEN PEMBIMBING (Khusus Dosen / Kaprodi) */}
      {currentUser?.role !== 'mahasiswa' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <span>Panel Verifikasi Dosen Pembimbing</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">Mode Dosen Pembimbing</span>
          </div>

          <div className="space-y-4">
            {studentConsultations.map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{c.mhs_nama} ({c.mhs_nim}) — {c.pembimbing}</span>
                  <span className="text-slate-500 font-medium">{c.tanggal}</span>
                </div>

                <p className="text-xs font-semibold text-slate-800">{c.bab_topik}</p>
                <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-100">{c.catatan_mahasiswa}</p>

                {/* Input Feedback */}
                <div className="space-y-2 pt-2">
                  <input
                    type="text"
                    placeholder="Tuliskan masukan / catatan revisi dosen di sini..."
                    value={feedbackInput[c.id] || ''}
                    onChange={(e) => setFeedbackInput(prev => ({ ...prev, [c.id]: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white outline-none focus:border-blue-600"
                  />

                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleFeedbackSubmit(c.id, 'perlu_revisi')}
                      className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-xs transition-all cursor-pointer"
                    >
                      Minta Revisi
                    </button>
                    <button
                      onClick={() => handleFeedbackSubmit(c.id, 'disetujui')}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
                    >
                      Setujui Bimbingan
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}
