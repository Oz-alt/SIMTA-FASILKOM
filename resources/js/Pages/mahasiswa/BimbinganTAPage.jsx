import React, { useState, useMemo } from 'react';
import { Link } from '@inertiajs/react';
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
  ExternalLink,
  Printer,
  Building2,
  Video,
  X,
  AlertTriangle
} from 'lucide-react';
import ModalAjukanBimbingan from '../../Components/common/ModalAjukanBimbingan.jsx';
import ModalEditBimbingan from '../../Components/common/ModalEditBimbingan.jsx';
import BimbinganReminderBanner from '../../Components/common/BimbinganReminderBanner.jsx';
import { calculateBimbinganReminder } from '../../lib/bimbinganReminder.js';

export default function BimbinganTAPage() {
  const { currentUser, consultations, reviewConsultation } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConsultation, setEditingConsultation] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [feedbackInput, setFeedbackInput] = useState({});

  const isStudentRole = currentUser?.role === 'mahasiswa';

  // Automatic 2x/month reminder calculation
  const reminderStatus = useMemo(() => {
    return calculateBimbinganReminder(consultations, currentUser?.nim, 2);
  }, [consultations, currentUser?.nim]);

  // Filter consultations based on logged-in user role
  const studentConsultations = useMemo(() => {
    if (!currentUser) return [];

    if (isStudentRole) {
      return consultations
        .filter(c => String(c.mhs_nim).trim() === String(currentUser.nim || '').trim())
        .sort((a, b) => {
          const dateDiff = (b.tanggal || '').localeCompare(a.tanggal || '');
          if (dateDiff !== 0) return dateDiff;
          return (b.waktu || '').localeCompare(a.waktu || '');
        });
    }

    // Dosen & Kaprodi: Only see consultations directed to THEM
    const cleanUserNama = (currentUser.nama || '').toLowerCase().replace(/dr\.|ir\.|prof\.|s\.kom\.|m\.cs\.|m\.t\.|m\.kom\.|ph\.d\.|st\.|s\.t\./gi, '').trim();
    const userNip = String(currentUser.nip || '').trim();

    return consultations.filter(c => {
      if (c.dosen_nip && userNip && String(c.dosen_nip).trim() === userNip) {
        return true;
      }
      if (c.dosen_nama && cleanUserNama) {
        const cleanConsNama = c.dosen_nama.toLowerCase().replace(/dr\.|ir\.|prof\.|s\.kom\.|m\.cs\.|m\.t\.|m\.kom\.|ph\.d\.|st\.|s\.t\./gi, '').trim();
        if (cleanConsNama.includes(cleanUserNama) || cleanUserNama.includes(cleanConsNama)) {
          return true;
        }
      }
      return false;
    });
  }, [consultations, currentUser, isStudentRole]);

  // Recap stats
  const totalApproved = studentConsultations.filter(c => c.status === 'disetujui').length;
  const countPemb1 = studentConsultations.filter(c => c.pembimbing === 'Pembimbing 1' && c.status === 'disetujui').length;
  const countPemb2 = studentConsultations.filter(c => c.pembimbing === 'Pembimbing 2' && c.status === 'disetujui').length;
  const minRequiredPerPembimbing = 12;
  const minRequired = 24; // 12x masing-masing pembimbing (Pembimbing 1 & Pembimbing 2)
  const approvedPemb1 = Math.min(countPemb1, minRequiredPerPembimbing);
  const approvedPemb2 = Math.min(countPemb2, minRequiredPerPembimbing);
  const progressPercent = Math.min(100, Math.round(((approvedPemb1 + approvedPemb2) / minRequired) * 100));
  const isEligibleForDefense = countPemb1 >= minRequiredPerPembimbing && countPemb2 >= minRequiredPerPembimbing;

  const handleFeedbackSubmit = (consId, newStatus) => {
    const notes = feedbackInput[consId] || 'Telah diverifikasi pembimbing.';
    reviewConsultation(consId, newStatus, notes);
    setFeedbackInput(prev => ({ ...prev, [consId]: '' }));
  };

  // Cek apakah mahasiswa memiliki sesi bimbingan yang masih berstatus menunggu tanggapan
  const pendingConsultation = useMemo(() => {
    if (!isStudentRole) return null;
    return studentConsultations.find(c => 
      c.status === 'menunggu_tanggapan' || c.status === 'menunggu' || c.status === 'menunggu_validasi'
    );
  }, [studentConsultations, isStudentRole]);

  const hasPendingConsultation = Boolean(pendingConsultation);

  return (
    <div className="max-w-7xl mx-auto space-y-6 select-none">
      
      {/* Modal Ajukan Bimbingan (Mahasiswa Only) */}
      {isStudentRole && (
        <ModalAjukanBimbingan 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}

      {/* Modal Edit Catatan Bimbingan (Mahasiswa Only) */}
      {isStudentRole && (
        <ModalEditBimbingan
          isOpen={Boolean(editingConsultation)}
          onClose={() => setEditingConsultation(null)}
          consultation={editingConsultation}
          onSaved={(msg) => {
            setToastMsg(msg);
            setTimeout(() => setToastMsg(''), 4000);
          }}
        />
      )}

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
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30 backdrop-blur-md">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Form Bimbingan &amp; Konsultasi TA Terpadu</span>
            </div>
            {isStudentRole && (
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/25 text-emerald-200 text-xs font-bold border border-emerald-400/40 backdrop-blur-md shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span>Notifikasi Real-time Dosen: AKTIF (ON)</span>
              </div>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Form Bimbingan Tugas Akhir
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            {isStudentRole 
              ? 'Catat riwayat pertemuan konsultasi, unggah berkas draf revisi, dapatkan masukan dosen pembimbing secara real-time, dan pantau kelayakan pendaftaran sidang TA.'
              : 'Tinjau dan validasi catatan konsultasi bimbingan yang diajukan oleh mahasiswa bimbingan Anda.'
            }
          </p>

          {isStudentRole && (
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/thesis/consultations/card"
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 backdrop-blur-md transition-all flex items-center space-x-2"
              >
                <Printer className="w-4 h-4 text-blue-300" />
                <span>Kartu Bimbingan Digital</span>
              </Link>
              <div className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-white/10 text-emerald-300 text-xs font-medium border border-white/15 backdrop-blur-md">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Respon status &amp; revisi dari dosen langsung muncul secara realtime</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Automatic Bimbingan Cadence Reminder Banner for Mahasiswa (Min. 2x/Bulan) */}
      {isStudentRole && (
        <BimbinganReminderBanner 
          reminder={reminderStatus} 
          studentEmail={currentUser?.email}
          studentUser={currentUser}
          showAction={false}
        />
      )}

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
          <span className="text-[11px] text-slate-500">Utama (Min. {minRequiredPerPembimbing} Sesi)</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sesi Pembimbing 2</span>
          <div className="text-2xl font-extrabold text-purple-700">{countPemb2} Sesi</div>
          <span className="text-[11px] text-slate-500">Pendamping (Min. {minRequiredPerPembimbing} Sesi)</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Kelayakan Sidang</span>
            <span className="text-[11px] font-bold text-slate-700">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <span className={`text-[10px] font-bold block leading-tight ${isEligibleForDefense ? 'text-emerald-700' : 'text-amber-600'}`}>
            {isEligibleForDefense ? '✓ Layak Daftar Sidang' : `Syarat Min. ${minRequired} Sesi (12x Tiap Pembimbing)`}
          </span>
        </div>

      </div>

      {/* LOG & RIWAYAT BIMBINGAN SECTION */}
      <div className="space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900">
            {isStudentRole ? 'Riwayat Pertemuan Konsultasi' : 'Daftar Pengajuan Bimbingan Mahasiswa'}
          </h2>
          {isStudentRole && (
            hasPendingConsultation ? (
              <div className="flex items-center space-x-2">
                <span className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200">
                  <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span>Sesi menunggu tanggapan dosen</span>
                </span>
                <button
                  type="button"
                  disabled
                  title="Entry bimbingan dinonaktifkan sementara karena sesi bimbingan sebelumnya masih menunggu tanggapan dosen."
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-400 font-bold text-xs border border-slate-200 cursor-not-allowed flex items-center space-x-1.5 shadow-none select-none"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tambah Catatan Bimbingan</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Tambah Catatan Bimbingan</span>
              </button>
            )
          )}
        </div>

        {/* Notifikasi jika ada sesi yang masih berstatus menunggu tanggapan */}
        {isStudentRole && hasPendingConsultation && pendingConsultation && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50/40 border border-amber-200/90 text-amber-900 text-xs flex items-start space-x-3 shadow-xs animate-in fade-in">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1 leading-relaxed">
              <div className="font-bold text-amber-950 flex items-center space-x-2">
                <span>Entry Bimbingan Selanjutnya Dinonaktifkan</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900 border border-amber-300">
                  Menunggu Tanggapan
                </span>
              </div>
              <p className="text-amber-800 text-[11px]">
                Sesi bimbingan tanggal <strong>{pendingConsultation.tanggal}</strong> ({pendingConsultation.pembimbing} - {pendingConsultation.dosen_nama}) masih menunggu respon atau validasi dosen. Tombol <em>Tambah Catatan Bimbingan</em> akan aktif kembali secara otomatis setelah dosen pembimbing memberikan tanggapan atau menyetujui sesi ini.
              </p>
            </div>
          </div>
        )}

        {studentConsultations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">
              {isStudentRole ? 'Belum Ada Sesi Bimbingan Dicatat' : 'Belum Ada Bimbingan Masuk'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {isStudentRole 
                ? 'Klik tombol "Tambah Catatan Bimbingan" di atas untuk mulai mencatat riwayat konsultasi dan mengunggah berkas revisi Anda.'
                : 'Belum ada catatan konsultasi yang diajukan oleh mahasiswa bimbingan Anda.'
              }
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
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center space-x-1 ${
                      item.metode === 'daring'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {item.metode === 'daring' ? (
                        <>
                          <Video className="w-3 h-3 text-emerald-600" />
                          <span>Daring</span>
                        </>
                      ) : (
                        <>
                          <Building2 className="w-3 h-3 text-slate-500" />
                          <span>Luring</span>
                        </>
                      )}
                    </span>
                    <div className="flex items-center space-x-2">
                      {!isStudentRole && item.mhs_nama && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                          {item.mhs_nama} ({item.mhs_nim})
                        </span>
                      )}
                      <h3 className="text-sm font-bold text-slate-900">{item.dosen_nama}</h3>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-slate-500 font-medium flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.tanggal} ({item.waktu})</span>
                    </span>

                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      {/* Jenis Revisi Badge */}
                      {item.jenis_revisi && (
                        <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] flex items-center space-x-1 border ${
                          item.jenis_revisi === 'Diterima' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          item.jenis_revisi === 'Minor' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                          item.jenis_revisi === 'Mayor' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                          item.jenis_revisi === 'Menunggu' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                          'bg-rose-100 text-rose-800 border-rose-300'
                        }`}>
                          {item.jenis_revisi === 'Diterima' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {item.jenis_revisi === 'Minor' && <AlertCircle className="w-3 h-3 text-blue-600" />}
                          {item.jenis_revisi === 'Mayor' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                          {item.jenis_revisi === 'Menunggu' && <Clock className="w-3 h-3 text-amber-600" />}
                          {item.jenis_revisi === 'Ditolak' && <X className="w-3 h-3 text-rose-600" />}
                          <span>Revisi: {item.jenis_revisi}</span>
                        </span>
                      )}

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
                      {item.status === 'ditolak' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-bold text-[10px] flex items-center space-x-1">
                          <X className="w-3 h-3 text-rose-600" />
                          <span>Ditolak</span>
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
                </div>

                {/* Bab & Catatan Mahasiswa */}
                <div className="space-y-2 text-xs">
                    {item.bab_topik && item.bab_topik !== item.catatan_mahasiswa && (
                      <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{item.bab_topik}</span>
                      </div>
                    )}

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed">
                      <span className="font-bold text-slate-900 block mb-0.5">Catatan Konsultasi &amp; Poin Progres:</span>
                      <p>{item.catatan_mahasiswa || item.bab_topik}</p>
                    </div>
                  </div>

                  {/* Masukan Dosen Pembimbing */}
                  {item.masukan_dosen && (
                    <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                      item.jenis_revisi === 'Diterima' ? 'bg-emerald-50/70 border-emerald-200' :
                      item.jenis_revisi === 'Minor' ? 'bg-blue-50/70 border-blue-200' :
                      item.jenis_revisi === 'Mayor' ? 'bg-rose-50/70 border-rose-200' :
                      item.jenis_revisi === 'Menunggu' ? 'bg-amber-50/70 border-amber-200' :
                      item.jenis_revisi === 'Ditolak' ? 'bg-rose-50/70 border-rose-200' :
                      'bg-indigo-50/60 border-indigo-100'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                          <MessageSquare className="w-4 h-4 text-indigo-600" />
                          <span>Masukan / Catatan Dosen Pembimbing:</span>
                        </span>
                        {item.jenis_revisi && (
                          <span className="text-[10px] font-extrabold text-slate-700 bg-white/90 px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                            Kategori: {item.jenis_revisi}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-800 leading-relaxed pl-5 font-medium">{String(item.masukan_dosen).replace(/^\[(Revisi Mayor|Revisi Minor|Mayor|Minor|Menunggu|Diterima|Disetujui|Ditolak)\]\s*/i, '')}</p>
                    </div>
                  )}

                {/* Link Dokumen Drive & Action Buttons */}
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
                    {/* Tombol Edit Catatan (Khusus Mahasiswa Pemilik Log) */}
                    {isStudentRole && (
                      <button
                        type="button"
                        onClick={() => setEditingConsultation(item)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer hover:shadow-xs"
                        title="Ubah Catatan &amp; Tautan Bimbingan"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Catatan</span>
                      </button>
                    )}

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

                {/* PANEL RESPONS DOSEN (Tampil jika Login Sebagai Dosen/Kaprodi dan Status Menunggu Tanggapan) */}
                {!isStudentRole && item.status === 'menunggu_tanggapan' && (
                  <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <span className="font-bold text-slate-800 text-xs block">Form Validasi / Masukan Dosen Pembimbing:</span>
                    <input
                      type="text"
                      placeholder="Tuliskan masukan / catatan revisi dosen di sini..."
                      value={feedbackInput[item.id] || ''}
                      onChange={(e) => setFeedbackInput(prev => ({ ...prev, [item.id]: e.target.value }))}
                      className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white outline-none focus:border-blue-600"
                    />

                    <div className="flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => handleFeedbackSubmit(item.id, 'perlu_revisi')}
                        className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-xs transition-all cursor-pointer"
                      >
                        Minta Revisi
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFeedbackSubmit(item.id, 'disetujui')}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
                      >
                        Setujui Bimbingan
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
  );
}
