import React, { useState, useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileText, 
  Building2, 
  Video, 
  AlertTriangle, 
  Link2, 
  ArrowLeft, 
  BookOpen,
  Send,
  Lock
} from 'lucide-react';

export default function BimbinganPage() {
  const { currentUser, studentAdvisors, consultations, thesisTitles, reviewConsultation } = useAuth();
  const { url } = usePage();

  const [feedbackState, setFeedbackState] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  
  // Dapatkan daftar mahasiswa bimbingan dari dosen ini / kaprodi
  const myStudents = useMemo(() => {
    if (!currentUser) return [];

    const cleanNip = String(currentUser.nip || currentUser.nim || '').trim();
    const cleanName = (currentUser.nama || '').split(',')[0].toLowerCase().trim();

    // 1. Direct assignments from studentAdvisors
    const assignedNims = studentAdvisors
      .filter(sa => (cleanNip && (String(sa.dospem1_nip || '').trim() === cleanNip || String(sa.dospem2_nip || '').trim() === cleanNip)) ||
                    (cleanName && ((sa.dospem1_nama && sa.dospem1_nama.toLowerCase().includes(cleanName)) || (sa.dospem2_nama && sa.dospem2_nama.toLowerCase().includes(cleanName)))))
      .map(sa => String(sa.student_nim));

    // 2. Students who submitted consultations to this dosen
    const consNims = consultations
      .filter(c => 
        (cleanNip && String(c.dosen_nip || '').trim() === cleanNip) ||
        (cleanName && c.dosen_nama && c.dosen_nama.toLowerCase().includes(cleanName))
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
      const tt = thesisTitles?.find(t => String(t.mhs_nim) === nim);
      return {
        id: `std-${nim}`,
        student_nim: nim,
        student_nama: sa?.student_nama || cons?.mhs_nama || tt?.mhs_nama || `Mahasiswa (${nim})`,
        judul_ta: tt?.judul || sa?.judul_ta || 'Sistem Informasi Tugas Akhir',
        dospem1: sa?.dospem1_nama || tt?.pembimbing_1_nama || 'Dosen Pembimbing 1',
        dospem2: sa?.dospem2_nama || tt?.pembimbing_2_nama || 'Dosen Pembimbing 2'
      };
    });
  }, [studentAdvisors, consultations, thesisTitles, currentUser]);

  // Ekstrak parameter ?nim=... dari Inertia URL atau window.location
  const nimFromUrl = useMemo(() => {
    let q = '';
    if (url && url.includes('?')) {
      q = url.split('?')[1];
    } else if (typeof window !== 'undefined' && window.location.search) {
      q = window.location.search.replace(/^\?/, '');
    }
    const params = new URLSearchParams(q);
    return params.get('nim');
  }, [url]);

  // Mahasiswa yang sedang dilihat log bimbingannya (HANYA mahasiswa yang diklik)
  const selectedNim = useMemo(() => {
    if (nimFromUrl) return nimFromUrl;
    // Fallback jika dibuka langsung tanpa parameter ?nim=
    const studentWithLogs = myStudents.find(s => consultations.some(c => String(c.mhs_nim) === String(s.student_nim)));
    return studentWithLogs?.student_nim || myStudents[0]?.student_nim || '';
  }, [nimFromUrl, myStudents, consultations]);

  // Cari data lengkap mahasiswa yang sedang aktif dipilih
  const currentStudent = useMemo(() => {
    if (!selectedNim) return null;

    const sa = studentAdvisors.find(s => String(s.student_nim) === String(selectedNim));
    const cons = consultations.find(c => String(c.mhs_nim) === String(selectedNim));
    const tt = thesisTitles?.find(t => String(t.mhs_nim) === String(selectedNim));
    const fromList = myStudents.find(s => String(s.student_nim) === String(selectedNim));

    return {
      nim: selectedNim,
      nama: sa?.student_nama || cons?.mhs_nama || tt?.mhs_nama || fromList?.student_nama || `Mahasiswa (${selectedNim})`,
      judul: tt?.judul || sa?.judul_ta || fromList?.judul_ta || 'Sistem Informasi Tugas Akhir',
      prodi: sa?.prodi || 'Sistem Informasi'
    };
  }, [selectedNim, studentAdvisors, consultations, thesisTitles, myStudents]);

  // HANYA bimbingan mahasiswa yang diklik itu saja!
  const studentConsultations = useMemo(() => {
    if (!selectedNim) return [];
    return consultations.filter(c => String(c.mhs_nim).trim() === String(selectedNim).trim());
  }, [consultations, selectedNim]);

  // Helper badge untuk jenis revisi
  // Revisi Mayor: Merah, Revisi Minor: Biru, Menunggu: Kuning, Diterima: Hijau
  const getJenisRevisiBadge = (jenis) => {
    switch (jenis) {
      case 'Diterima':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[10px] flex items-center space-x-1 shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Revisi: Diterima</span>
          </span>
        );
      case 'Minor':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 font-extrabold text-[10px] flex items-center space-x-1 shadow-2xs">
            <AlertCircle className="w-3 h-3 text-blue-600" />
            <span>Revisi: Minor</span>
          </span>
        );
      case 'Mayor':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-extrabold text-[10px] flex items-center space-x-1 shadow-2xs">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Revisi: Mayor</span>
          </span>
        );
      case 'Menunggu':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-extrabold text-[10px] flex items-center space-x-1 shadow-2xs">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Menunggu</span>
          </span>
        );
      case 'Ditolak':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-extrabold text-[10px] flex items-center space-x-1 shadow-2xs">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>Revisi: Ditolak</span>
          </span>
        );
      default:
        return null;
    }
  };

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/dosen/monitoring';
    }
  };

  const handleSelectJenis = (consId, jenis) => {
    setFeedbackState(prev => ({
      ...prev,
      [consId]: {
        ...(prev[consId] || {}),
        jenis
      }
    }));
  };

  const handleCatatanChange = (consId, catatan) => {
    setFeedbackState(prev => ({
      ...prev,
      [consId]: {
        ...(prev[consId] || {}),
        catatan
      }
    }));
  };

  const handleSaveFeedback = async (consId) => {
    const targetCons = studentConsultations.find(sc => sc.id === consId);
    const feedback = feedbackState[consId] || {};
    
    const chosenJenis = feedback.jenis !== undefined 
      ? feedback.jenis 
      : (targetCons?.jenis_revisi || (targetCons?.status === 'disetujui' ? 'Diterima' : targetCons?.status === 'menunggu_tanggapan' ? 'Menunggu' : targetCons?.status === 'perlu_revisi' ? 'Minor' : 'Menunggu'));
      
    const notes = feedback.catatan !== undefined 
      ? feedback.catatan 
      : (targetCons?.masukan_dosen || '');

    let status = 'perlu_revisi';
    if (chosenJenis === 'Diterima') {
      status = 'disetujui';
    } else if (chosenJenis === 'Menunggu') {
      status = 'menunggu_tanggapan';
    } else if (chosenJenis === 'Mayor' || chosenJenis === 'Minor') {
      status = 'perlu_revisi';
    }

    setSavingId(consId);
    try {
      if (reviewConsultation) {
        await reviewConsultation(consId, status, notes, chosenJenis);
      }
      setToastMsg(`Tanggapan bimbingan berhasil disimpan: ${chosenJenis}`);
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setToastMsg('Gagal menyimpan tanggapan.');
      setTimeout(() => setToastMsg(''), 4000);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center space-x-3">
          <FileText className="w-6 h-6 text-blue-400" />
          <span>Log Bimbingan Mahasiswa</span>
        </h1>
        <p className="text-sm text-indigo-100/90 mt-1 max-w-2xl leading-relaxed">
          Riwayat catatan sesi bimbingan konsultasi dan progres naskah Tugas Akhir mahasiswa yang dipilih.
        </p>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        
        {/* Top Bar: Navigasi Kembali & Info Mahasiswa yang Diklik */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-start sm:items-center space-x-3">
            <button
              type="button"
              onClick={handleGoBack}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shrink-0"
              title="Kembali ke halaman sebelumnya"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
              <span>Kembali</span>
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {currentStudent ? currentStudent.nama : 'Log Bimbingan'}
                </h2>
                {currentStudent && (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                    {currentStudent.nim}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="line-clamp-1 italic">
                  {currentStudent?.judul || 'Sistem Informasi Tugas Akhir'}
                </span>
              </p>
            </div>
          </div>

          {/* Right Controls: Pertemuan Counter */}
          <div className="flex items-center space-x-3 self-end sm:self-auto">
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              Total {studentConsultations.length} Pertemuan
            </span>
          </div>
        </div>

        {/* List of Consultations (HANYA milik mahasiswa yang diklik) */}
        {studentConsultations.length === 0 ? (
          <div className="text-center py-16 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              Belum Ada Log Bimbingan
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Mahasiswa <strong>{currentStudent?.nama || selectedNim}</strong> ({selectedNim}) belum pernah mengajukan atau mencatat sesi bimbingan konsultasi Tugas Akhir.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {studentConsultations.map((c, idx) => {
              const isLocked = Boolean(
                c.reviewed_at || 
                c.status === 'disetujui' || 
                (c.status === 'perlu_revisi' && c.jenis_revisi) ||
                (c.jenis_revisi && c.jenis_revisi !== 'Menunggu') ||
                (c.masukan_dosen && c.status !== 'menunggu_tanggapan' && c.status !== 'menunggu')
              );

              const currentJenis = feedbackState[c.id]?.jenis !== undefined 
                ? feedbackState[c.id].jenis 
                : (c.jenis_revisi || (c.status === 'disetujui' ? 'Diterima' : c.status === 'menunggu_tanggapan' ? 'Menunggu' : c.status === 'perlu_revisi' ? 'Minor' : 'Menunggu'));

              const rawCatatan = feedbackState[c.id]?.catatan !== undefined 
                ? feedbackState[c.id].catatan 
                : (c.masukan_dosen || '');
              const currentCatatan = String(rawCatatan).replace(/^\[(Revisi Mayor|Revisi Minor|Mayor|Minor|Menunggu|Diterima|Disetujui|Ditolak)\]\s*/i, '');

              return (
                <div 
                  key={c.id || idx} 
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all space-y-4"
                >
                  {/* Header Row: Sesi Pertemuan, Waktu, Metode, Status Badge */}
                  <div className="flex flex-wrap gap-2 items-center justify-between text-xs border-b border-slate-100 pb-3">
                    
                    {/* Left: Pertemuan # & Pembimbing */}
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg text-xs">
                        Pertemuan #{idx + 1}
                      </span>

                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        c.pembimbing === 'Pembimbing 1' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' : 'bg-purple-50 text-purple-800 border-purple-200'
                      }`}>
                        {c.pembimbing || 'Pembimbing'}
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
                    </div>

                    {/* Right: Tanggal & Status / Kategori Revisi */}
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-slate-500 font-medium flex items-center space-x-1 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.tanggal} ({c.waktu || '09:00'})</span>
                      </span>

                      {/* Status & Revision Badge */}
                      {c.jenis_revisi && getJenisRevisiBadge(c.jenis_revisi)}
                      
                      {(!c.jenis_revisi && c.status === 'disetujui') && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[10px] flex items-center space-x-1 shadow-2xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Revisi: Diterima</span>
                        </span>
                      )}
                      {(!c.jenis_revisi && c.status === 'perlu_revisi') && (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 font-extrabold text-[10px] flex items-center space-x-1 shadow-2xs">
                          <AlertCircle className="w-3 h-3 text-blue-600" />
                          <span>Revisi: Minor</span>
                        </span>
                      )}
                      {(c.status === 'menunggu_tanggapan' || (!c.status && !c.jenis_revisi)) && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-extrabold text-[10px] flex items-center space-x-1 shadow-2xs">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Menunggu Tanggapan</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Topic & Student Notes */}
                  <div className="space-y-2 text-xs">
                    <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{c.bab_topik || 'Topik Bimbingan'}</span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                      <span className="font-bold text-slate-700 block mb-1">Catatan Progres Mahasiswa:</span>
                      <p className="text-slate-600 leading-relaxed">{c.catatan_mahasiswa || '-'}</p>
                    </div>
                  </div>

                  {/* Document / Revision Link */}
                  {c.file_revisi_url && (
                    <div className="text-xs">
                      <a
                        href={c.file_revisi_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-semibold underline inline-flex items-center space-x-1.5"
                      >
                        <Link2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Lihat Dokumen / Lampiran Mahasiswa</span>
                      </a>
                    </div>
                  )}

                  {/* Form Tanggapan & Validasi Dosen */}
                  <div className="pt-4 border-t border-slate-100 bg-slate-50/70 -mx-5 -mb-5 p-5 rounded-b-2xl space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                          Tanggapan & Validasi Dosen
                        </span>
                        {isLocked && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700">
                            <Lock className="w-3 h-3 text-slate-600" />
                            <span>Terkunci</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {isLocked 
                          ? 'Tanggapan sudah diberikan & dikunci (hanya 1x respon).'
                          : 'Pilih status evaluasi & berikan catatan arahan:'}
                      </span>
                    </div>

                    {/* 4 Status Buttons:
                        1. Revisi Mayor (Merah)
                        2. Revisi Minor (Biru)
                        3. Menunggu (Kuning)
                        4. Diterima (Hijau)
                    */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      
                      {/* 1. Revisi Mayor - MERAH */}
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => !isLocked && handleSelectJenis(c.id, 'Mayor')}
                        className={`px-3 py-2.5 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center space-x-1.5 ${
                          currentJenis === 'Mayor'
                            ? `bg-rose-600 text-white border-rose-600 shadow-sm ${isLocked ? 'cursor-default ring-1 ring-rose-300' : 'cursor-pointer ring-2 ring-rose-200'}`
                            : isLocked
                              ? 'bg-slate-50 text-slate-300 border-slate-200 opacity-40 cursor-not-allowed'
                              : 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-300 cursor-pointer'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Revisi Mayor</span>
                      </button>

                      {/* 2. Revisi Minor - BIRU */}
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => !isLocked && handleSelectJenis(c.id, 'Minor')}
                        className={`px-3 py-2.5 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center space-x-1.5 ${
                          currentJenis === 'Minor'
                            ? `bg-blue-600 text-white border-blue-600 shadow-sm ${isLocked ? 'cursor-default ring-1 ring-blue-300' : 'cursor-pointer ring-2 ring-blue-200'}`
                            : isLocked
                              ? 'bg-slate-50 text-slate-300 border-slate-200 opacity-40 cursor-not-allowed'
                              : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-300 cursor-pointer'
                        }`}
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Revisi Minor</span>
                      </button>

                      {/* 3. Menunggu - KUNING */}
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => !isLocked && handleSelectJenis(c.id, 'Menunggu')}
                        className={`px-3 py-2.5 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center space-x-1.5 ${
                          currentJenis === 'Menunggu'
                            ? `bg-amber-500 text-white border-amber-500 shadow-sm ${isLocked ? 'cursor-default ring-1 ring-amber-300' : 'cursor-pointer ring-2 ring-amber-200'}`
                            : isLocked
                              ? 'bg-slate-50 text-slate-300 border-slate-200 opacity-40 cursor-not-allowed'
                              : 'bg-white hover:bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300 cursor-pointer'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>Menunggu</span>
                      </button>

                      {/* 4. Diterima - HIJAU */}
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => !isLocked && handleSelectJenis(c.id, 'Diterima')}
                        className={`px-3 py-2.5 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center space-x-1.5 ${
                          currentJenis === 'Diterima'
                            ? `bg-emerald-600 text-white border-emerald-600 shadow-sm ${isLocked ? 'cursor-default ring-1 ring-emerald-300' : 'cursor-pointer ring-2 ring-emerald-200'}`
                            : isLocked
                              ? 'bg-slate-50 text-slate-300 border-slate-200 opacity-40 cursor-not-allowed'
                              : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-300 cursor-pointer'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Diterima</span>
                      </button>

                    </div>

                    {/* Kolom Catatan Dosen */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                          <span>Catatan & Arahan Dosen Pembimbing:</span>
                          {isLocked && (
                            <span className="text-[10px] font-semibold text-slate-400">
                              (Terkunci)
                            </span>
                          )}
                        </label>
                        {c.reviewed_at && (
                          <span className="text-[10px] text-slate-400">
                            Waktu respon: {new Date(c.reviewed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <textarea
                        rows={3}
                        readOnly={isLocked}
                        disabled={isLocked}
                        value={currentCatatan}
                        onChange={(e) => !isLocked && handleCatatanChange(c.id, e.target.value)}
                        placeholder={isLocked ? "Tidak ada catatan tambahan." : "Tuliskan catatan revisi, evaluasi naskah, atau arahan untuk mahasiswa..."}
                        className={`w-full text-xs p-3 rounded-xl border transition-all leading-relaxed ${
                          isLocked
                            ? 'bg-slate-100/80 text-slate-700 border-slate-200 cursor-not-allowed focus:outline-none focus:ring-0 focus:border-slate-200 select-none'
                            : 'bg-white text-slate-800 border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                        }`}
                      />
                    </div>

                    {/* Tombol Simpan Tanggapan / Status Terkunci */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                      <div className="text-[11px] text-slate-500">
                        {isLocked ? (
                          <span>Status permanen: <strong className="text-slate-800">{currentJenis}</strong></span>
                        ) : (
                          <span>Status terpilih: <strong className="text-slate-800">{currentJenis}</strong></span>
                        )}
                      </div>
                      
                      {isLocked ? (
                        <div className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold cursor-not-allowed select-none">
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Tanggapan Terkunci (Selesai)</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={savingId === c.id}
                          onClick={() => handleSaveFeedback(c.id)}
                          className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{savingId === c.id ? 'Menyimpan...' : 'Simpan Tanggapan'}</span>
                        </button>
                      )}
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
