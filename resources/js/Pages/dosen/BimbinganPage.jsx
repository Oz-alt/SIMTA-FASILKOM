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
  Building2, 
  Video,
  X,
  Send,
  AlertTriangle,
  HelpCircle,
  Link2,
  Check,
  ShieldCheck
} from 'lucide-react';

export default function BimbinganPage() {
  const { currentUser, studentAdvisors, consultations, reviewConsultation } = useAuth();
  
  // Dapatkan daftar mahasiswa bimbingan dari dosen ini / kaprodi
  const myStudents = useMemo(() => {
    if (!currentUser) return [];

    const cleanName = (currentUser.nama || '').split(',')[0].toLowerCase().trim();

    // 1. Direct assignments from studentAdvisors
    const assignedNims = studentAdvisors
      .filter(sa => sa.dospem1_nip === currentUser.nip || sa.dospem2_nip === currentUser.nip)
      .map(sa => String(sa.student_nim));

    // 2. Students who submitted consultations to this dosen
    const consNims = consultations
      .filter(c => 
        (c.dosen_nip && String(c.dosen_nip).trim() === String(currentUser.nip || '').trim()) ||
        (c.dosen_nama && cleanName && c.dosen_nama.toLowerCase().includes(cleanName))
      )
      .map(c => String(c.mhs_nim));

    let targetNims = [];
    if (currentUser.role === 'kaprodi' || currentUser.role === 'admin') {
      const allNims = new Set([
        ...consultations.map(c => String(c.mhs_nim)),
        ...studentAdvisors.map(sa => String(sa.student_nim))
      ]);
      targetNims = Array.from(allNims);
    } else {
      targetNims = Array.from(new Set([...assignedNims, ...consNims]));
    }

    return targetNims.map(nim => {
      const sa = studentAdvisors.find(s => String(s.student_nim) === nim);
      const cons = consultations.find(c => String(c.mhs_nim) === nim);
      return {
        id: `std-${nim}`,
        student_nim: nim,
        student_nama: sa?.student_nama || cons?.mhs_nama || `Mahasiswa (${nim})`,
      };
    });
  }, [studentAdvisors, consultations, currentUser]);

  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    if (!selectedStudent && myStudents.length > 0) {
      setSelectedStudent(myStudents[0]);
    }
  }, [myStudents, selectedStudent]);

  // Modal Confirmation State
  const [activeModalCons, setActiveModalCons] = useState(null);
  const [selectedJenisRevisi, setSelectedJenisRevisi] = useState('Diterima'); // 'Mayor' | 'Minor' | 'Diterima' | 'Ditolak'
  const [modalFeedback, setModalFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Filter consultations for the selected student
  const studentConsultations = useMemo(() => {
    if (!selectedStudent) return [];
    return consultations.filter(c => c.mhs_nim === selectedStudent.student_nim);
  }, [consultations, selectedStudent]);

  const openValidationModal = (consultation) => {
    setActiveModalCons(consultation);
    setSelectedJenisRevisi(consultation.jenis_revisi || (consultation.status === 'disetujui' ? 'Diterima' : 'Minor'));
    setModalFeedback(consultation.masukan_dosen || '');
  };

  const closeValidationModal = () => {
    if (isSubmitting) return;
    setActiveModalCons(null);
    setModalFeedback('');
  };

  const handleConfirmValidation = async (e) => {
    e.preventDefault();
    if (!activeModalCons) return;

    setIsSubmitting(true);

    // Map jenis revisi to status
    let targetStatus = 'disetujui';
    if (selectedJenisRevisi === 'Minor' || selectedJenisRevisi === 'Mayor') {
      targetStatus = 'perlu_revisi';
    } else if (selectedJenisRevisi === 'Ditolak') {
      targetStatus = 'ditolak';
    } else {
      targetStatus = 'disetujui';
    }

    const notes = modalFeedback.trim() || (
      selectedJenisRevisi === 'Diterima' ? 'Bimbingan telah tervalidasi dan disetujui tanpa catatan revisi.' :
      selectedJenisRevisi === 'Minor' ? 'Terdapat revisi minor yang perlu diperbaiki sesuai arahan pembimbing.' :
      selectedJenisRevisi === 'Mayor' ? 'Terdapat revisi mayor pada isi materi/bab. Harap perbaiki sebelum melanjutkan.' :
      'Materi bimbingan ditolak. Silakan ajukan ulang setelah berkonsultasi.'
    );

    try {
      await reviewConsultation(activeModalCons.id, targetStatus, notes, selectedJenisRevisi);
      setIsSubmitting(false);
      setActiveModalCons(null);
      setToastMsg(`Bimbingan berhasil divalidasi dengan kategori Revisi: ${selectedJenisRevisi}!`);
      setTimeout(() => setToastMsg(''), 4500);
    } catch (err) {
      setIsSubmitting(false);
      alert('Gagal memvalidasi bimbingan: ' + (err.message || 'Terjadi kesalahan sistem'));
    }
  };

  // Helper badge for revision categories
  const getJenisRevisiBadge = (jenis) => {
    switch (jenis) {
      case 'Diterima':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[11px] flex items-center space-x-1 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Revisi: Diterima</span>
          </span>
        );
      case 'Minor':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 font-extrabold text-[11px] flex items-center space-x-1 shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Revisi: Minor</span>
          </span>
        );
      case 'Mayor':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-orange-100 text-orange-800 border border-orange-300 font-extrabold text-[11px] flex items-center space-x-1 shadow-2xs">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
            <span>Revisi: Mayor</span>
          </span>
        );
      case 'Ditolak':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-300 font-extrabold text-[11px] flex items-center space-x-1 shadow-2xs">
            <X className="w-3.5 h-3.5 text-rose-600" />
            <span>Revisi: Ditolak</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-4 border border-emerald-500">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span className="text-xs font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center space-x-3">
          <UserCheck className="w-6 h-6 text-blue-400" />
          <span>Validasi Log Bimbingan</span>
        </h1>
        <p className="text-sm text-indigo-100/90 mt-1 max-w-2xl leading-relaxed">
          Pilih mahasiswa untuk memeriksa log konsultasi, menentukan kategori revisi (Mayor, Minor, Diterima, Ditolak), dan melakukan konfirmasi validasi.
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
                    onClick={() => setSelectedStudent(student)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
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
                <span className="text-xs text-slate-500 font-mono">
                  Total {studentConsultations.length} Pertemuan
                </span>
              </div>

              {studentConsultations.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs font-medium">
                  Belum ada log bimbingan yang diajukan oleh mahasiswa ini.
                </div>
              ) : (
                <div className="space-y-4">
                  {studentConsultations.map((c) => (
                    <div key={c.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all space-y-3.5">
                      
                      {/* Top Header Row */}
                      <div className="flex flex-wrap gap-2 items-center justify-between text-xs">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            c.pembimbing === 'Pembimbing 1' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' : 'bg-purple-50 text-purple-800 border-purple-200'
                          }`}>
                            {c.pembimbing}
                          </span>

                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center space-x-1 ${
                            c.metode === 'daring' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {c.metode === 'daring' ? (
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

                          <span className="text-slate-500 font-medium flex items-center space-x-1 text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{c.tanggal} ({c.waktu})</span>
                          </span>
                        </div>

                        {/* Status & Jenis Revisi Badge */}
                        <div className="flex items-center space-x-2">
                          {c.jenis_revisi && getJenisRevisiBadge(c.jenis_revisi)}
                          
                          {(!c.jenis_revisi && c.status === 'disetujui') && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Disetujui</span>
                            </span>
                          )}
                          {(!c.jenis_revisi && c.status === 'perlu_revisi') && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center space-x-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>Perlu Revisi</span>
                            </span>
                          )}
                          {c.status === 'menunggu_tanggapan' && (
                            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-bold text-[10px] flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-blue-600" />
                              <span>Menunggu Validasi</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Topic & Student Notes */}
                      <div className="space-y-2 text-xs">
                        <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>{c.bab_topik}</span>
                        </div>
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                          <span className="font-bold text-slate-700 block mb-1">Catatan Progres Mahasiswa:</span>
                          <p className="text-slate-600 leading-relaxed">{c.catatan_mahasiswa}</p>
                        </div>
                      </div>

                      {/* Display existing masukan dosen if available */}
                      {c.masukan_dosen && (
                        <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100 text-xs space-y-1">
                          <span className="font-bold text-indigo-900 flex items-center space-x-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Masukan / Catatan Dosen Pembimbing:</span>
                          </span>
                          <p className="text-indigo-950 leading-relaxed font-medium pl-5">{c.masukan_dosen}</p>
                        </div>
                      )}

                      {/* Drive Link & Action Button */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                        <div className="text-xs text-slate-500 truncate max-w-md">
                          {c.file_revisi_url ? (
                            <a
                              href={c.file_revisi_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 font-medium underline inline-flex items-center space-x-1 truncate"
                            >
                              <Link2 className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">Dokumen / Tautan Revisi Mahasiswa</span>
                            </a>
                          ) : (
                            <span className="italic text-slate-400">Tidak ada lampiran dokumen</span>
                          )}
                        </div>

                        {/* Tombol Validasi Bimbingan (Membuka Pop-up Konfirmasi Terlebih Dahulu) */}
                        <div>
                          {c.status === 'menunggu_tanggapan' ? (
                            <button
                              type="button"
                              onClick={() => openValidationModal(c)}
                              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center space-x-1.5 cursor-pointer"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              <span>Validasi Bimbingan</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openValidationModal(c)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-all flex items-center space-x-1.5 cursor-pointer"
                            >
                              <span>Ubah Validasi / Revisi</span>
                            </button>
                          )}
                        </div>
                      </div>

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

      {/* POP-UP KONFIRMASI VALIDASI BIMBINGAN (MODAL) */}
      {activeModalCons && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <ShieldCheck className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Konfirmasi Validasi Bimbingan</h3>
                  <p className="text-[11px] text-blue-200">Tentukan kategori revisi dan berikan catatan bimbingan</p>
                </div>
              </div>
              <button
                onClick={closeValidationModal}
                disabled={isSubmitting}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmValidation} className="p-6 space-y-5 overflow-y-auto flex-1">
              
              {/* Ringkasan Bimbingan Mahasiswa */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Mahasiswa: <strong className="text-slate-900">{activeModalCons.mhs_nama}</strong> ({activeModalCons.mhs_nim})</span>
                  <span className="font-mono">{activeModalCons.tanggal}</span>
                </div>
                <div className="font-bold text-slate-800 text-sm">
                  {activeModalCons.bab_topik}
                </div>
                <p className="text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80 line-clamp-3">
                  "{activeModalCons.catatan_mahasiswa}"
                </p>
              </div>

              {/* 1. PEMILIHAN JENIS REVISI (Mayor, Minor, Diterima, Ditolak) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Pilih Kategori / Jenis Revisi *</span>
                  <span className="text-[11px] font-normal text-slate-500">Wajib dipilih</span>
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  
                  {/* Kategori 1: Diterima */}
                  <div
                    onClick={() => setSelectedJenisRevisi('Diterima')}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      selectedJenisRevisi === 'Diterima'
                        ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-emerald-800 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Diterima</span>
                      </span>
                      {selectedJenisRevisi === 'Diterima' && (
                        <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-emerald-900/80 leading-tight">
                      Materi disetujui / progress diterima tanpa revisi substansial.
                    </p>
                  </div>

                  {/* Kategori 2: Minor */}
                  <div
                    onClick={() => setSelectedJenisRevisi('Minor')}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      selectedJenisRevisi === 'Minor'
                        ? 'border-amber-500 bg-amber-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-amber-800 flex items-center space-x-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span>Minor</span>
                      </span>
                      {selectedJenisRevisi === 'Minor' && (
                        <div className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-amber-900/80 leading-tight">
                      Revisi ringan: typo, sitasi, perbaikan format / diagram kecil.
                    </p>
                  </div>

                  {/* Kategori 3: Mayor */}
                  <div
                    onClick={() => setSelectedJenisRevisi('Mayor')}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      selectedJenisRevisi === 'Mayor'
                        ? 'border-orange-500 bg-orange-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-orange-800 flex items-center space-x-1.5">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <span>Mayor</span>
                      </span>
                      {selectedJenisRevisi === 'Mayor' && (
                        <div className="w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-orange-900/80 leading-tight">
                      Revisi mendasar: perombakan bab, metodologi, arsitektur sistem.
                    </p>
                  </div>

                  {/* Kategori 4: Ditolak */}
                  <div
                    onClick={() => setSelectedJenisRevisi('Ditolak')}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      selectedJenisRevisi === 'Ditolak'
                        ? 'border-rose-500 bg-rose-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-rose-800 flex items-center space-x-1.5">
                        <X className="w-4 h-4 text-rose-600" />
                        <span>Ditolak</span>
                      </span>
                      {selectedJenisRevisi === 'Ditolak' && (
                        <div className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-rose-900/80 leading-tight">
                      Materi tidak memenuhi standar, mahasiswa harus konsultasi ulang.
                    </p>
                  </div>

                </div>
              </div>

              {/* 2. Catatan / Masukan Dosen Pembimbing */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>Catatan &amp; Masukan Dosen Pembimbing</span>
                </label>
                <textarea
                  rows={4}
                  value={modalFeedback}
                  onChange={(e) => setModalFeedback(e.target.value)}
                  placeholder="Tuliskan arahan revisi, referensi tambahan, atau masukan untuk mahasiswa di sini..."
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-900 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed"
                />
              </div>

              {/* Box Konfirmasi Peringatan */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start space-x-2.5 text-xs text-blue-900">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  Bimbingan akan divalidasi dengan status <strong>{selectedJenisRevisi === 'Diterima' ? 'Disetujui' : selectedJenisRevisi === 'Ditolak' ? 'Ditolak' : 'Perlu Revisi'}</strong> dan kategori revisi <strong>{selectedJenisRevisi}</strong>. Mahasiswa dapat melihat hasil validasi ini pada dashboard portal mereka.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeValidationModal}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <span>Menyimpan Validasi...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Konfirmasi &amp; Simpan Validasi</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
