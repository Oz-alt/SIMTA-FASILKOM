import React, { useState, useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import { useAuth } from '../../context/AuthContext.jsx';
import StudentWhatsAppLink from '../../Components/common/StudentWhatsAppLink.jsx';

export default function BimbinganPage() {
  const { currentUser, studentAdvisors, consultations, thesisTitles, reviewConsultation } = useAuth();
  const { url } = usePage();

  const [feedbackState, setFeedbackState] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  
  // State untuk sesi bimbingan yang dibuka detailnya (modal/halaman detail)
  const [detailModalCons, setDetailModalCons] = useState(null);

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
      prodi: sa?.prodi || 'D3 Manajemen Informatika',
      dospem1_nip: sa?.dospem1_nip || tt?.pembimbing_1_nip || '',
      dospem1_nama: sa?.dospem1_nama || tt?.pembimbing_1_nama || tt?.pembimbing_1 || '',
      dospem2_nip: sa?.dospem2_nip || tt?.pembimbing_2_nip || '',
      dospem2_nama: sa?.dospem2_nama || tt?.pembimbing_2_nama || tt?.pembimbing_2 || ''
    };
  }, [selectedNim, studentAdvisors, consultations, thesisTitles, myStudents]);

  // HANYA bimbingan mahasiswa yang diklik itu saja!
  const studentConsultations = useMemo(() => {
    if (!selectedNim) return [];
    return consultations.filter(c => String(c.mhs_nim).trim() === String(selectedNim).trim());
  }, [consultations, selectedNim]);

  // Syarat bimbingan: tervalidasi 12x untuk kelayakan diterima
  const TARGET_TERVALIDASI = 12;
  // Total bimbingan yang telah dicapai mahasiswa terpilih
  const totalBimbinganCount = studentConsultations.length;
  // Syarat tombol Diterima baru aktif jika mahasiswa telah menyelesaikan minimal 12 kali bimbingan
  const isEligibleForDiterima = totalBimbinganCount >= TARGET_TERVALIDASI;

  // Dapatkan data terkini dari sesi yang sedang dibuka di modal detail
  const activeDetailCons = useMemo(() => {
    if (!detailModalCons) return null;
    return consultations.find(c => String(c.id) === String(detailModalCons.id)) || detailModalCons;
  }, [consultations, detailModalCons]);

  const activeDetailIndex = useMemo(() => {
    if (!activeDetailCons) return 1;
    const idx = studentConsultations.findIndex(sc => String(sc.id) === String(activeDetailCons.id));
    return idx >= 0 ? idx + 1 : 1;
  }, [studentConsultations, activeDetailCons]);

  // Helper resolusi Pembimbing 1 atau Pembimbing 2 beserta nama lengkap dosen tanpa terpotong
  const pembimbingInfo = useMemo(() => {
    if (!activeDetailCons) {
      return { role: 'Pembimbing 1', namaDosen: '-' };
    }

    let role = 'Pembimbing 1';
    if (activeDetailCons.pembimbing && activeDetailCons.pembimbing.includes('2')) {
      role = 'Pembimbing 2';
    } else if (activeDetailCons.pembimbing && activeDetailCons.pembimbing.includes('1')) {
      role = 'Pembimbing 1';
    } else {
      const consNip = String(activeDetailCons.dosen_nip || '').trim();
      const consNama = (activeDetailCons.dosen_nama || '').toLowerCase().trim();
      if (currentStudent?.dospem2_nip && consNip && consNip === String(currentStudent.dospem2_nip).trim()) {
        role = 'Pembimbing 2';
      } else if (currentStudent?.dospem2_nama && consNama && currentStudent.dospem2_nama.toLowerCase().includes(consNama)) {
        role = 'Pembimbing 2';
      }
    }

    let namaDosen = activeDetailCons.dosen_nama;
    if (!namaDosen || namaDosen === 'Dosen Pembimbing' || namaDosen.trim() === '') {
      if (role === 'Pembimbing 2' && currentStudent?.dospem2_nama) {
        namaDosen = currentStudent.dospem2_nama;
      } else if (currentStudent?.dospem1_nama) {
        namaDosen = currentStudent.dospem1_nama;
      } else {
        namaDosen = currentUser?.nama || 'Dosen Pembimbing';
      }
    }

    return { role, namaDosen };
  }, [activeDetailCons, currentStudent, currentUser]);

  // Format tanggal Bahasa Indonesia yang rapi
  const formatDateIndo = (rawDate) => {
    if (!rawDate) return '-';
    try {
      const parts = String(rawDate).split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dt = new Date(y, m, d);
        if (!isNaN(dt.getTime())) {
          return dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        }
      }
      const dt = new Date(rawDate);
      if (!isNaN(dt.getTime())) {
        return dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      }
      return rawDate;
    } catch {
      return rawDate;
    }
  };

  // Helper badge untuk jenis revisi (tanpa icon)
  // Revisi Mayor: Merah, Revisi Minor: Biru, Menunggu: Kuning, Diterima: Hijau
  const renderStatusBadge = (c) => {
    const isApproved = c.status === 'disetujui' || c.jenis_revisi === 'Diterima';
    const isMayor = c.jenis_revisi === 'Mayor';
    const isMinor = c.jenis_revisi === 'Minor' || (!c.jenis_revisi && c.status === 'perlu_revisi');
    const isMenunggu = c.status === 'menunggu_tanggapan' || (!c.status && !c.jenis_revisi) || c.jenis_revisi === 'Menunggu';

    if (isApproved) {
      return (
        <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-xs">
          Diterima
        </span>
      );
    }
    if (isMinor) {
      return (
        <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium text-xs">
          Revisi Minor
        </span>
      );
    }
    if (isMayor) {
      return (
        <span className="inline-block px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-medium text-xs">
          Revisi Mayor
        </span>
      );
    }
    if (isMenunggu) {
      return (
        <span className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium text-xs">
          Menunggu
        </span>
      );
    }
    return (
      <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium text-xs">
        -
      </span>
    );
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
    const targetCons = studentConsultations.find(sc => String(sc.id) === String(consId));
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
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner Ringkas & Elegan */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Log Bimbingan Mahasiswa
        </h1>
        <p className="text-sm text-indigo-100/90 mt-1 max-w-2xl leading-relaxed font-normal">
          Rekap riwayat catatan sesi bimbingan konsultasi dan progres naskah Tugas Akhir mahasiswa yang dipilih.
        </p>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Top Bar: Navigasi Kembali & Info Mahasiswa (NIM langsung tanpa label, tanpa ikon, tanpa total sesi/tervalidasi/menunggu/kelayakan) */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 min-w-0">
            <button
              type="button"
              onClick={handleGoBack}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-semibold transition-all cursor-pointer shrink-0 shadow-2xs"
              title="Kembali ke halaman sebelumnya"
            >
              <span>Kembali</span>
            </button>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                  {currentStudent ? (
                    <StudentWhatsAppLink
                      nim={currentStudent.nim}
                      nama={currentStudent.nama}
                      className="text-slate-900 hover:text-emerald-700 font-bold"
                      showIcon={false}
                    >
                      {currentStudent.nama}
                    </StudentWhatsAppLink>
                  ) : (
                    'Log Bimbingan'
                  )}
                </h2>
                {currentStudent && (
                  <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                    {currentStudent.nim}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* REKAP LOG BIMBINGAN: TABEL BERSIH (Desktop) & DAFTAR KARTU (Mobile) */}
        {studentConsultations.length === 0 ? (
          <div className="text-center py-16 px-6 bg-slate-50/50 space-y-2">
            <h3 className="text-sm font-semibold text-slate-800">
              Belum Ada Log Bimbingan
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-normal">
              Mahasiswa <StudentWhatsAppLink nim={selectedNim} nama={currentStudent?.nama} className="font-semibold text-slate-800 hover:text-emerald-700 underline" showIcon={false}>{currentStudent?.nama || selectedNim}</StudentWhatsAppLink> ({selectedNim}) belum pernah mengajukan atau mencatat sesi bimbingan konsultasi Tugas Akhir.
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4 w-32">Pertemuan</th>
                    <th className="py-3.5 px-4 w-36">Tanggal</th>
                    <th className="py-3.5 px-4 w-32">Waktu</th>
                    <th className="py-3.5 px-4 w-36">Pembimbing</th>
                    <th className="py-3.5 px-4 w-28">Metode</th>
                    <th className="py-3.5 px-4 w-36 text-center">Status Tanggapan</th>
                    <th className="py-3.5 px-4 w-28 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {studentConsultations.map((c, idx) => {
                    const sessionNum = idx + 1;
                    return (
                      <tr 
                        key={c.id || idx}
                        className="hover:bg-blue-50/40 transition-colors"
                      >
                        {/* Pertemuan (tanpa #) */}
                        <td className="py-4 px-4 font-semibold text-blue-900 whitespace-nowrap">
                          <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold">
                            Pertemuan {sessionNum}
                          </span>
                        </td>

                        {/* Tanggal (Terpisah) */}
                        <td className="py-4 px-4 whitespace-nowrap font-medium text-slate-900">
                          {c.tanggal || '-'}
                        </td>

                        {/* Waktu (Terpisah & tanpa icon) */}
                        <td className="py-4 px-4 whitespace-nowrap font-medium text-slate-600">
                          {c.waktu ? (String(c.waktu).includes('WIB') ? c.waktu : `${c.waktu} WIB`) : '10:00 WIB'}
                        </td>

                        {/* Pembimbing */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${
                            c.pembimbing === 'Pembimbing 1'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : 'bg-purple-50 text-purple-800 border-purple-200'
                          }`}>
                            {c.pembimbing || 'Pembimbing'}
                          </span>
                        </td>

                        {/* Metode (tanpa icon) */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                            c.metode === 'daring'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {c.metode === 'daring' ? 'Daring' : 'Luring'}
                          </span>
                        </td>

                        {/* Status Tanggapan (tanpa icon) */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          {renderStatusBadge(c)}
                        </td>

                        {/* Tombol Detail (tanpa icon) */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setDetailModalCons(c)}
                            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-xs hover:shadow cursor-pointer"
                            title="Buka Detail & Tanggapan Dosen"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100 p-4 space-y-4">
              {studentConsultations.map((c, idx) => {
                const sessionNum = idx + 1;
                return (
                  <div 
                    key={c.id || idx}
                    className="p-4 rounded-xl border border-slate-200 bg-white space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-extrabold text-xs">
                        Pertemuan {sessionNum}
                      </span>
                      {renderStatusBadge(c)}
                    </div>

                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>Tanggal: {c.tanggal || '-'}</span>
                      <span>•</span>
                      <span>Waktu: {c.waktu ? (String(c.waktu).includes('WIB') ? c.waktu : `${c.waktu} WIB`) : '10:00 WIB'}</span>
                      <span>•</span>
                      <span>{c.pembimbing || 'Pembimbing'}</span>
                      <span>•</span>
                      <span className="capitalize">{c.metode || 'luring'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDetailModalCons(c)}
                      className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs text-center cursor-pointer"
                    >
                      Detail
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL / HALAMAN DETAIL LOG BIMBINGAN BESERTA FITUR TANGGAPAN DOSEN */}
      {/* ========================================================================= */}
      {activeDetailCons && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto overscroll-contain animate-in fade-in"
          onClick={() => setDetailModalCons(null)}
        >
          <div 
            className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal Detail (tanpa icon) */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-6 py-4.5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white tracking-tight">
                  Detail Log Bimbingan - Pertemuan {activeDetailIndex}
                </h3>
                <div className="text-xs text-blue-200/90 font-medium flex items-center space-x-1 mt-0.5">
                  <StudentWhatsAppLink
                    nim={currentStudent?.nim}
                    nama={currentStudent?.nama}
                    className="text-blue-100 hover:text-white font-medium underline-offset-2"
                    showIcon={false}
                  >
                    {currentStudent?.nama}
                  </StudentWhatsAppLink>
                  <span>({currentStudent?.nim})</span>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setDetailModalCons(null)}
                  className="px-3.5 py-1.5 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-xs font-semibold"
                  title="Tutup Modal"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto divide-y divide-slate-100">
              
              {/* Seksi 1: Metadata Pertemuan (Tanggal & Jam Terpisah, Pembimbing Lengkap, tanpa icon) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* 1. Tanggal */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                    Tanggal
                  </span>
                  <div className="font-semibold text-slate-900 text-sm">
                    {formatDateIndo(activeDetailCons.tanggal)}
                  </div>
                </div>

                {/* 2. Jam */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                    Jam
                  </span>
                  <div className="font-semibold text-slate-900 text-sm font-mono">
                    {activeDetailCons.waktu ? (String(activeDetailCons.waktu).includes('WIB') ? activeDetailCons.waktu : `${activeDetailCons.waktu} WIB`) : '10:00 WIB'}
                  </div>
                </div>

                {/* 3. Metode */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                    Metode
                  </span>
                  <div className="font-semibold text-slate-900 text-sm">
                    {activeDetailCons.metode === 'daring' ? 'Daring (Online)' : 'Luring (Tatap Muka)'}
                  </div>
                </div>

                {/* 4. Pembimbing */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 block mb-1">
                    {pembimbingInfo.role}
                  </span>
                  <div className="font-semibold text-slate-900 text-sm leading-snug break-words">
                    {pembimbingInfo.namaDosen}
                  </div>
                </div>
              </div>

              {/* Seksi 2: Catatan Progres Mahasiswa */}
              <div className="pt-4 space-y-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 block mb-2">
                    Catatan Progres Mahasiswa
                  </span>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-wrap">
                    {activeDetailCons.catatan_mahasiswa || 'Tidak ada rincian catatan progres dari mahasiswa.'}
                  </div>
                </div>

                {/* Lampiran Dokumen Mahasiswa (tanpa icon) */}
                {activeDetailCons.file_revisi_url && (
                  <div>
                    <a
                      href={activeDetailCons.file_revisi_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-all shadow-xs"
                    >
                      Buka Berkas Dokumen / Naskah Revisi Mahasiswa
                    </a>
                  </div>
                )}
              </div>

              {/* Seksi 3: Form Tanggapan & Evaluasi Dosen (Status Tunggal & Arahan Dosen Pembimbing, tanpa icon) */}
              {(() => {
                const c = activeDetailCons;
                const isCompleted = Boolean(
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

                const isDiterimaDisabled = isCompleted || !isEligibleForDiterima;

                return (
                  <div className="pt-4 space-y-4">
                    
                    {/* Header Seksi: Label & Tanggal Respon */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                          Evaluasi &amp; Tanggapan Bimbingan
                        </h4>
                        {isCompleted && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Selesai
                          </span>
                        )}
                      </div>
                      {c.reviewed_at && (
                        <span className="text-xs text-slate-400 font-normal">
                          Respon: {new Date(c.reviewed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>

                    {/* SATU STATUS BIMBINGAN */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-2">
                        {isCompleted ? 'Status Hasil Evaluasi:' : 'Pilihan Status Evaluasi:'}
                      </label>

                      {isCompleted ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Selesai
                          </span>
                          <span className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border ${
                            currentJenis === 'Diterima'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : currentJenis === 'Mayor'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : currentJenis === 'Minor'
                                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}>
                            <span>
                              {currentJenis === 'Mayor' ? 'Revisi Mayor' : currentJenis === 'Minor' ? 'Revisi Minor' : currentJenis}
                            </span>
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            
                            {/* 1. Menunggu */}
                            <button
                              type="button"
                              onClick={() => handleSelectJenis(c.id, 'Menunggu')}
                              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                                currentJenis === 'Menunggu'
                                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm ring-2 ring-amber-200'
                                  : 'bg-white hover:bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300'
                              }`}
                            >
                              <span>Menunggu</span>
                            </button>

                            {/* 2. Revisi Mayor */}
                            <button
                              type="button"
                              onClick={() => handleSelectJenis(c.id, 'Mayor')}
                              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                                currentJenis === 'Mayor'
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm ring-2 ring-rose-200'
                                  : 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-300'
                              }`}
                            >
                              <span>Revisi Mayor</span>
                            </button>

                            {/* 3. Revisi Minor */}
                            <button
                              type="button"
                              onClick={() => handleSelectJenis(c.id, 'Minor')}
                              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                                currentJenis === 'Minor'
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-200'
                                  : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-300'
                              }`}
                            >
                              <span>Revisi Minor</span>
                            </button>

                            {/* 4. Diterima */}
                            <button
                              type="button"
                              disabled={isDiterimaDisabled}
                              onClick={() => !isDiterimaDisabled && handleSelectJenis(c.id, 'Diterima')}
                              title={
                                !isEligibleForDiterima 
                                  ? `Tombol Diterima baru aktif setelah mahasiswa menyelesaikan minimal 12 kali bimbingan (saat ini: ${totalBimbinganCount}/12 kali).`
                                  : 'Beri status Diterima'
                              }
                              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                                currentJenis === 'Diterima'
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-200 cursor-pointer'
                                  : isDiterimaDisabled
                                    ? 'bg-slate-100 text-slate-400 border-slate-200 opacity-60 cursor-not-allowed'
                                    : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-300 cursor-pointer'
                              }`}
                            >
                              <span>Diterima</span>
                            </button>

                          </div>

                          {/* Keterangan Tombol Diterima Jika Belum Memenuhi 12x */}
                          {!isEligibleForDiterima && (
                            <div className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2 leading-relaxed">
                              <span>
                                Tombol <strong>Diterima</strong> tidak aktif karena jumlah bimbingan mahasiswa belum mencapai 12 kali (Progres saat ini: <strong>{totalBimbinganCount}/12 kali</strong>).
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Arahan Dosen Pembimbing */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Arahan Dosen Pembimbing:
                      </label>
                      <textarea
                        rows={3}
                        readOnly={isCompleted}
                        disabled={isCompleted}
                        value={currentCatatan}
                        onChange={(e) => !isCompleted && handleCatatanChange(c.id, e.target.value)}
                        placeholder={isCompleted ? "Tidak ada arahan tambahan." : "Tuliskan arahan revisi, evaluasi naskah, atau catatan perbaikan untuk mahasiswa..."}
                        className={`w-full text-sm p-3.5 rounded-2xl border transition-all leading-relaxed ${
                          isCompleted
                            ? 'bg-slate-50 text-slate-700 border-slate-200 cursor-default select-text'
                            : 'bg-white text-slate-800 border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                        }`}
                      />
                    </div>

                  </div>
                );
              })()}

            </div>

            {/* Footer Modal: Tombol Tutup & Simpan (tanpa icon) */}
            {(() => {
              const c = activeDetailCons;
              const isCompleted = Boolean(
                c.reviewed_at || 
                c.status === 'disetujui' || 
                (c.status === 'perlu_revisi' && c.jenis_revisi) ||
                (c.jenis_revisi && c.jenis_revisi !== 'Menunggu') ||
                (c.masukan_dosen && c.status !== 'menunggu_tanggapan' && c.status !== 'menunggu')
              );

              return (
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setDetailModalCons(null)}
                    className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>

                  <div>
                    {isCompleted ? (
                      <div className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold select-none">
                        <span>Selesai</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={savingId === c.id}
                        onClick={() => handleSaveFeedback(c.id)}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                      >
                        <span>{savingId === c.id ? 'Menyimpan...' : 'Simpan Tanggapan'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      )}

    </div>
  );
}
