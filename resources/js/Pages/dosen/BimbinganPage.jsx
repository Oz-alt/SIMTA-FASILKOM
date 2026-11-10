import React, { useState, useMemo, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { useAuth } from '../../context/AuthContext.jsx';
import StudentWhatsAppLink from '../../Components/common/StudentWhatsAppLink.jsx';
import { sortConsultationsChronologically } from '../../lib/consultationUtils.js';

export default function BimbinganPage() {
  const { currentUser, studentAdvisors, consultations, thesisTitles, reviewConsultation, notifications, markNotificationAsRead } = useAuth();
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

    const isDummyTitle = (val) => {
      const clean = String(val || '').trim();
      return (
        !clean ||
        clean === '-' ||
        clean === 'Judul Tugas Akhir' ||
        clean === 'Sistem Informasi Tugas Akhir' ||
        clean === 'Rancang Bangun Sistem Informasi Tugas Akhir' ||
        clean === 'Rancang Bangun Sistem Informasi Tugas Akhir Berbasis Web' ||
        clean.includes('Peminjaman Ruang Sidang')
      );
    };

    return targetNims.map(nim => {
      const sa = studentAdvisors.find(s => String(s.student_nim) === nim);
      const cons = consultations.find(c => String(c.mhs_nim) === nim);
      const tt = thesisTitles?.find(t => String(t.mhs_nim) === nim);
      return {
        id: `std-${nim}`,
        student_nim: nim,
        student_nama: sa?.student_nama || cons?.mhs_nama || tt?.mhs_nama || `Mahasiswa (${nim})`,
        judul_ta: tt?.judul || (!isDummyTitle(sa?.judul_ta) ? sa.judul_ta : '-'),
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

  // Jika dibuka langsung tanpa parameter NIM, arahkan ke Progres Monitoring
  useEffect(() => {
    if (!nimFromUrl) {
      router.visit('/dosen/monitoring');
    }
  }, [nimFromUrl]);

  // Mahasiswa yang sedang dilihat log bimbingannya (HANYA mahasiswa yang diklik)
  const selectedNim = useMemo(() => {
    if (nimFromUrl) return nimFromUrl;
    return '';
  }, [nimFromUrl]);

  // Cari data lengkap mahasiswa yang sedang aktif dipilih
  const currentStudent = useMemo(() => {
    if (!selectedNim) return null;

    const sa = studentAdvisors.find(s => String(s.student_nim) === String(selectedNim));
    const cons = consultations.find(c => String(c.mhs_nim) === String(selectedNim));
    const tt = thesisTitles?.find(t => String(t.mhs_nim) === String(selectedNim));
    const fromList = myStudents.find(s => String(s.student_nim) === String(selectedNim));

    const isDummyTitle = (val) => {
      const clean = String(val || '').trim();
      return (
        !clean ||
        clean === '-' ||
        clean === 'Judul Tugas Akhir' ||
        clean === 'Sistem Informasi Tugas Akhir' ||
        clean === 'Rancang Bangun Sistem Informasi Tugas Akhir' ||
        clean === 'Rancang Bangun Sistem Informasi Tugas Akhir Berbasis Web' ||
        clean.includes('Peminjaman Ruang Sidang')
      );
    };

    return {
      nim: selectedNim,
      nama: sa?.student_nama || cons?.mhs_nama || tt?.mhs_nama || fromList?.student_nama || `Mahasiswa (${selectedNim})`,
      judul: tt?.judul || (!isDummyTitle(sa?.judul_ta) ? sa.judul_ta : (!isDummyTitle(fromList?.judul_ta) ? fromList.judul_ta : '-')),
      prodi: sa?.prodi || 'D3 Manajemen Informatika',
      dospem1_nip: sa?.dospem1_nip || tt?.pembimbing_1_nip || '',
      dospem1_nama: sa?.dospem1_nama || tt?.pembimbing_1_nama || tt?.pembimbing_1 || '',
      dospem2_nip: sa?.dospem2_nip || tt?.pembimbing_2_nip || '',
      dospem2_nama: sa?.dospem2_nama || tt?.pembimbing_2_nama || tt?.pembimbing_2 || ''
    };
  }, [selectedNim, studentAdvisors, consultations, thesisTitles, myStudents]);

  // HANYA bimbingan mahasiswa yang diklik itu saja!
  // Diurutkan kronologis (terlama di atas) supaya nomor "Pertemuan" mengikuti
  // tanggal, bukan urutan baris yang dikembalikan database. Tanpa ini sesi
  // terbaru tampil sebagai Pertemuan 1.
  const studentConsultations = useMemo(() => {
    if (!selectedNim) return [];
    const mine = consultations.filter(c => String(c.mhs_nim).trim() === String(selectedNim).trim());
    return sortConsultationsChronologically(mine);
  }, [consultations, selectedNim]);

  // Sinkronisasi: Saat halaman dibuka, tandai bimbingan mahasiswa ini sebagai telah dilihat
  // dan bersihkan notifikasi titik merah terkait
  useEffect(() => {
    if (!selectedNim) return;

    try {
      // 1. Simpan bahwa log bimbingan mahasiswa ini telah dibuka/dilihat oleh dosen
      const seenMap = JSON.parse(localStorage.getItem('simta_seen_student_bimbingan') || '{}');
      seenMap[String(selectedNim).trim()] = Date.now();
      localStorage.setItem('simta_seen_student_bimbingan', JSON.stringify(seenMap));

      // 2. Simpan semua ID bimbingan mahasiswa ini ke dalam ID konsultasi yang telah dilihat
      const seenIds = new Set(JSON.parse(localStorage.getItem('simta_seen_consultation_ids') || '[]'));
      studentConsultations.forEach(c => {
        if (c?.id) seenIds.add(String(c.id));
      });
      localStorage.setItem('simta_seen_consultation_ids', JSON.stringify(Array.from(seenIds)));

      // 3. Tandai semua notifikasi terkait mahasiswa ini sebagai sudah dibaca
      const readNotifs = new Set(JSON.parse(localStorage.getItem('simta_read_notif_ids') || '[]'));
      let hasNewRead = false;
      (notifications || []).forEach(n => {
        if (!n) return;
        const matchesStudent = 
          String(n.mhs_nim || '').trim() === String(selectedNim).trim() ||
          String(n.student_nim || '').trim() === String(selectedNim).trim() ||
          String(n.recipient_nim || '').trim() === String(selectedNim).trim() ||
          (n.message && n.message.includes(selectedNim)) ||
          (n.action_url && n.action_url.includes(selectedNim));

        if (matchesStudent && n.id) {
          if (!readNotifs.has(String(n.id))) {
            readNotifs.add(String(n.id));
            hasNewRead = true;
          }
          if (markNotificationAsRead) {
            markNotificationAsRead(n.id);
          }
        }
      });

      if (hasNewRead) {
        localStorage.setItem('simta_read_notif_ids', JSON.stringify(Array.from(readNotifs)));
      }

      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('simta_notifications_updated'));
    } catch (e) {
      console.error(e);
    }
  }, [selectedNim, studentConsultations, notifications, markNotificationAsRead]);

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

  // Helper penentuan hak akses respon bimbingan (Pembimbing 1 vs Pembimbing 2)
  // Kedua pembimbing dapat melihat seluruh riwayat bimbingan, namun hanya pembimbing bersangkutan yang dapat memberikan/mengubah tanggapan
  const isAuthorizedSupervisor = (cons) => {
    if (!cons || !currentUser) return false;

    const userNip = String(currentUser.nip || currentUser.nim || '').trim();
    const userNama = (currentUser.nama || '').toLowerCase().replace(/dr\.|ir\.|prof\.|s\.kom\.|m\.cs\.|m\.t\.|m\.kom\.|ph\.d\.|st\.|s\.t\./gi, '').trim();

    // 1. Cek langsung kecocokan NIP atau Nama pada sesi bimbingan
    const consNip = String(cons.dosen_nip || '').trim();
    const consNama = (cons.dosen_nama || '').toLowerCase().replace(/dr\.|ir\.|prof\.|s\.kom\.|m\.cs\.|m\.t\.|m\.kom\.|ph\.d\.|st\.|s\.t\./gi, '').trim();

    // 2. Tentukan peran target sesi bimbingan: 'Pembimbing 1' atau 'Pembimbing 2'
    let isTargetPemb2 = false;
    if (cons.pembimbing && cons.pembimbing.includes('2')) {
      isTargetPemb2 = true;
    } else if (cons.pembimbing && cons.pembimbing.includes('1')) {
      isTargetPemb2 = false;
    } else {
      if (currentStudent?.dospem2_nip && consNip && consNip === String(currentStudent.dospem2_nip).trim()) {
        isTargetPemb2 = true;
      } else if (currentStudent?.dospem2_nama && consNama && currentStudent.dospem2_nama.toLowerCase().includes(consNama)) {
        isTargetPemb2 = true;
      }
    }

    if (isTargetPemb2) {
      // Sesi ditujukan untuk Pembimbing 2
      if (userNip && currentStudent?.dospem2_nip && String(currentStudent.dospem2_nip).trim() === userNip) return true;
      if (userNip && consNip && userNip === consNip) return true;
      if (userNama && currentStudent?.dospem2_nama) {
        const d2Clean = currentStudent.dospem2_nama.toLowerCase().replace(/dr\.|ir\.|prof\.|s\.kom\.|m\.cs\.|m\.t\.|m\.kom\.|ph\.d\.|st\.|s\.t\./gi, '').trim();
        if (d2Clean.includes(userNama) || userNama.includes(d2Clean)) return true;
      }
      if (userNama && consNama && (consNama.includes(userNama) || userNama.includes(consNama))) return true;
      return false;
    } else {
      // Sesi ditujukan untuk Pembimbing 1
      if (userNip && currentStudent?.dospem1_nip && String(currentStudent.dospem1_nip).trim() === userNip) return true;
      if (userNip && consNip && userNip === consNip) return true;
      if (userNama && currentStudent?.dospem1_nama) {
        const d1Clean = currentStudent.dospem1_nama.toLowerCase().replace(/dr\.|ir\.|prof\.|s\.kom\.|m\.cs\.|m\.t\.|m\.kom\.|ph\.d\.|st\.|s\.t\./gi, '').trim();
        if (d1Clean.includes(userNama) || userNama.includes(d1Clean)) return true;
      }
      if (userNama && consNama && (consNama.includes(userNama) || userNama.includes(consNama))) return true;
      return false;
    }
  };

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
        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-[11px]">
          Diterima
        </span>
      );
    }
    if (isMinor) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium text-[11px]">
          Revisi Minor
        </span>
      );
    }
    if (isMayor) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-medium text-[11px]">
          Revisi Mayor
        </span>
      );
    }
    if (isMenunggu) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium text-[11px]">
          Menunggu
        </span>
      );
    }
    return (
      <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium text-[11px]">
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
    if (jenis === 'Menunggu') return; // Status Menunggu bawaan mahasiswa, tidak dapat diklik/dipilih dosen
    const targetCons = studentConsultations.find(sc => String(sc.id) === String(consId));
    if (!isAuthorizedSupervisor(targetCons)) return; // Pembatasan hak akses: bukan pembimbing sesi ini

    setFeedbackState(prev => ({
      ...prev,
      [consId]: {
        ...(prev[consId] || {}),
        jenis
      }
    }));
  };

  const handleCatatanChange = (consId, catatan) => {
    const targetCons = studentConsultations.find(sc => String(sc.id) === String(consId));
    if (!isAuthorizedSupervisor(targetCons)) return; // Pembatasan hak akses: bukan pembimbing sesi ini

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
    
    // Pembatasan hak akses: Setiap pembimbing hanya dapat memberikan tanggapan pada log bimbingan masing-masing
    if (!isAuthorizedSupervisor(targetCons)) {
      const isPemb2 = String(targetCons?.pembimbing || '').includes('2');
      const targetRole = isPemb2 ? 'Pembimbing 2' : 'Pembimbing 1';
      setToastMsg(`Anda tidak memiliki hak akses untuk memberikan atau mengubah tanggapan pada sesi bimbingan milik ${targetRole}.`);
      setTimeout(() => setToastMsg(''), 4500);
      return;
    }

    const feedback = feedbackState[consId] || {};
    
    const chosenJenis = feedback.jenis !== undefined 
      ? feedback.jenis 
      : (targetCons?.jenis_revisi || (targetCons?.status === 'disetujui' ? 'Diterima' : targetCons?.status === 'menunggu_tanggapan' ? 'Menunggu' : targetCons?.status === 'perlu_revisi' ? 'Minor' : 'Menunggu'));
      
    const rawNotes = feedback.catatan !== undefined 
      ? feedback.catatan 
      : (targetCons?.masukan_dosen || '');
    const cleanNotes = String(rawNotes).replace(/^\[(Revisi Mayor|Revisi Minor|Mayor|Minor|Menunggu|Diterima|Disetujui|Ditolak)\]\s*/i, '').trim();

    // 1. Validasi: Hasil evaluasi wajib dipilih dosen (tidak boleh Menunggu)
    if (!chosenJenis || chosenJenis === 'Menunggu') {
      setToastMsg('Silakan pilih hasil evaluasi bimbingan: Revisi Mayor, Revisi Minor, atau Diterima.');
      setTimeout(() => setToastMsg(''), 4500);
      return;
    }

    // 2. Validasi: Dosen wajib memberikan tanggapan atau catatan sebelum menyimpan
    if (!cleanNotes) {
      setToastMsg('Catatan perbaikan untuk mahasiswa wajib diisi sebelum menyimpan tanggapan.');
      setTimeout(() => setToastMsg(''), 4500);
      return;
    }

    let status = 'perlu_revisi';
    if (chosenJenis === 'Diterima') {
      status = 'disetujui';
    } else if (chosenJenis === 'Mayor' || chosenJenis === 'Minor') {
      status = 'perlu_revisi';
    }

    setSavingId(consId);
    try {
      if (reviewConsultation) {
        await reviewConsultation(consId, status, cleanNotes, chosenJenis);
      }
      setToastMsg(`Tanggapan bimbingan berhasil disimpan: ${chosenJenis === 'Mayor' ? 'Revisi Mayor' : chosenJenis === 'Minor' ? 'Revisi Minor' : chosenJenis}`);
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
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl py-8 sm:py-9 px-6 sm:px-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Log Bimbingan Mahasiswa
          </h1>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Top Bar: Navigasi Kembali & Info Mahasiswa (NIM langsung tanpa label, tanpa ikon, tanpa total sesi/tervalidasi/menunggu/kelayakan) */}
        <div className="p-4 sm:px-6 sm:py-3.5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 min-w-0">
            <button
              type="button"
              onClick={handleGoBack}
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-semibold transition-all cursor-pointer shrink-0 shadow-2xs"
              title="Kembali ke halaman sebelumnya"
            >
              <span>Kembali</span>
            </button>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xs sm:text-sm font-medium text-slate-900 tracking-tight truncate">
                  {currentStudent ? (
                    <StudentWhatsAppLink
                      nim={currentStudent.nim}
                      nama={currentStudent.nama}
                      className="text-slate-900 hover:text-emerald-700 font-medium text-xs sm:text-sm"
                      showIcon={false}
                    >
                      {currentStudent.nama}
                    </StudentWhatsAppLink>
                  ) : (
                    'Log Bimbingan'
                  )}
                </h2>
                {currentStudent && (
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                    {currentStudent.nim}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* REKAP LOG BIMBINGAN: TABEL BERSIH (Desktop) & DAFTAR KARTU (Mobile) */}
        {studentConsultations.length === 0 ? (
          <div className="text-center py-16 px-6 bg-slate-50/50">
            <h3 className="text-sm font-semibold text-slate-800">
              Belum Ada Log Bimbingan
            </h3>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-3.5 w-28">Pertemuan</th>
                    <th className="py-2.5 px-3.5 w-32">Tanggal</th>
                    <th className="py-2.5 px-3.5 w-28">Waktu</th>
                    <th className="py-2.5 px-3.5 w-32">Pembimbing</th>
                    <th className="py-2.5 px-3.5 w-24">Metode</th>
                    <th className="py-2.5 px-3.5 w-32 text-center">Status Tanggapan</th>
                    <th className="py-2.5 px-3.5 w-24 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                  {studentConsultations.map((c, idx) => {
                    const sessionNum = idx + 1;
                    return (
                      <tr 
                        key={c.id || idx}
                        className="hover:bg-blue-50/40 transition-colors"
                      >
                        {/* Pertemuan (tanpa #) */}
                        <td className="py-2.5 px-3.5 font-semibold text-blue-900 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-semibold">
                            Pertemuan {sessionNum}
                          </span>
                        </td>

                        {/* Tanggal (Terpisah) */}
                        <td className="py-2.5 px-3.5 whitespace-nowrap font-medium text-slate-900 text-[11px]">
                          {c.tanggal || '-'}
                        </td>

                        {/* Waktu (Terpisah & tanpa icon) */}
                        <td className="py-2.5 px-3.5 whitespace-nowrap font-medium text-slate-600 text-[11px]">
                          {c.waktu ? (String(c.waktu).includes('WIB') ? c.waktu : `${c.waktu} WIB`) : '10:00 WIB'}
                        </td>

                        {/* Pembimbing */}
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                            c.pembimbing === 'Pembimbing 1'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : 'bg-purple-50 text-purple-800 border-purple-200'
                          }`}>
                            {c.pembimbing || 'Pembimbing'}
                          </span>
                        </td>

                        {/* Metode (tanpa icon) */}
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                            c.metode === 'daring'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {c.metode === 'daring' ? 'Daring' : 'Luring'}
                          </span>
                        </td>

                        {/* Status Tanggapan (tanpa icon) */}
                        <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                          {renderStatusBadge(c)}
                        </td>

                        {/* Tombol Detail (tanpa icon) */}
                        <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setDetailModalCons(c)}
                            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition-all shadow-xs hover:shadow cursor-pointer"
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
            className="relative bg-white rounded-2xl shadow-xl border border-slate-200/90 max-w-2xl w-full overflow-hidden my-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal Detail (tanpa icon) */}
            <div className="px-5 sm:px-6 py-3 border-b border-slate-200/80 flex items-center justify-between bg-white">
              <div>
                <h3 className="text-xs text-slate-900 flex items-center space-x-1.5 font-medium">
                  <StudentWhatsAppLink
                    nim={currentStudent?.nim}
                    nama={currentStudent?.nama}
                    className="text-slate-900 hover:text-emerald-700 font-medium text-xs"
                    showIcon={false}
                  >
                    {currentStudent?.nama}
                  </StudentWhatsAppLink>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-500 font-medium text-xs">({currentStudent?.nim})</span>
                </h3>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setDetailModalCons(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer text-xs font-semibold"
                  title="Tutup Modal"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
              
              {/* Seksi 1: Metadata Pertemuan (Tanggal, Jam, Metode & Pembimbing Bold di Label, Nilai Bawah Normal) */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 sm:p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                    Tanggal
                  </span>
                  <span className="text-xs font-normal text-slate-700 block mt-0.5">
                    {formatDateIndo(activeDetailCons.tanggal)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                    Jam
                  </span>
                  <span className="text-xs font-normal text-slate-700 block mt-0.5 font-mono">
                    {activeDetailCons.waktu ? (String(activeDetailCons.waktu).includes('WIB') ? activeDetailCons.waktu : `${activeDetailCons.waktu} WIB`) : '10:00 WIB'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                    Metode
                  </span>
                  <span className="text-xs font-normal text-slate-700 block mt-0.5">
                    {String(activeDetailCons.metode || '').toLowerCase().includes('daring') ? 'Daring' : 'Luring'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                    {pembimbingInfo.role}
                  </span>
                  <span className="text-xs font-normal text-slate-700 block mt-0.5 leading-snug break-words">
                    {pembimbingInfo.namaDosen}
                  </span>
                </div>
              </div>

              {/* Seksi 2: Catatan Progres Mahasiswa */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-medium text-slate-600 block">
                  Catatan progres mahasiswa
                </label>
                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-normal whitespace-pre-wrap">
                  {activeDetailCons.catatan_mahasiswa || 'Tidak ada rincian catatan progres dari mahasiswa.'}
                </div>
                
                {/* Lampiran Dokumen Mahasiswa (tanpa icon) */}
                {activeDetailCons.file_revisi_url && (
                  <div className="pt-1.5">
                    <a
                      href={activeDetailCons.file_revisi_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-3.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-all"
                    >
                      Buka Berkas Dokumen / Naskah Revisi Mahasiswa
                    </a>
                  </div>
                )}
              </div>

              {/* Seksi 3: Form Tanggapan & Evaluasi Dosen (Pembatasan Hak Akses Pembimbing 1 vs Pembimbing 2) */}
              {(() => {
                const c = activeDetailCons;
                const isAuthorized = isAuthorizedSupervisor(c);
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
                  <div className="pt-2 border-t border-slate-100 space-y-4">
                    
                    {/* Header Seksi: Label & Tanggal Respon */}
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-medium text-slate-600 block">
                        Evaluasi dan tanggapan bimbingan
                      </h4>
                      {c.reviewed_at && (
                        <span className="text-xs text-slate-400 font-normal">
                          Respon: {new Date(c.reviewed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>

                    {/* SATU STATUS BIMBINGAN */}
                    <div>
                      {isCompleted ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
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
                        <div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            
                            {/* 1. Menunggu (Nonaktif / tidak dapat diklik dosen) */}
                            <button
                              type="button"
                              disabled={true}
                              title="Status bawaan pengajuan mahasiswa (tidak dapat dipilih dosen)"
                              className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-center cursor-not-allowed select-none ${
                                currentJenis === 'Menunggu'
                                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs opacity-90'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
                              }`}
                            >
                              <span>Menunggu</span>
                            </button>

                            {/* 2. Revisi Mayor */}
                            <button
                              type="button"
                              disabled={!isAuthorized}
                              onClick={() => isAuthorized && handleSelectJenis(c.id, 'Mayor')}
                              className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                                currentJenis === 'Mayor'
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs cursor-pointer'
                                  : !isAuthorized
                                    ? 'bg-white text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 cursor-pointer'
                              }`}
                            >
                              <span>Revisi Mayor</span>
                            </button>

                            {/* 3. Revisi Minor */}
                            <button
                              type="button"
                              disabled={!isAuthorized}
                              onClick={() => isAuthorized && handleSelectJenis(c.id, 'Minor')}
                              className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                                currentJenis === 'Minor'
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs cursor-pointer'
                                  : !isAuthorized
                                    ? 'bg-white text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 cursor-pointer'
                              }`}
                            >
                              <span>Revisi Minor</span>
                            </button>

                            {/* 4. Diterima */}
                            <button
                              type="button"
                              disabled={!isAuthorized || isDiterimaDisabled}
                              onClick={() => isAuthorized && !isDiterimaDisabled && handleSelectJenis(c.id, 'Diterima')}
                              title={
                                !isAuthorized
                                  ? 'Hanya dapat dipilih oleh dosen pembimbing bersangkutan'
                                  : !isEligibleForDiterima 
                                    ? `Tombol Diterima baru aktif setelah mahasiswa menyelesaikan minimal 12 kali bimbingan (saat ini: ${totalBimbinganCount}/12 kali).`
                                    : 'Beri status Diterima'
                              }
                              className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                                currentJenis === 'Diterima'
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs cursor-pointer'
                                  : (!isAuthorized || isDiterimaDisabled)
                                    ? 'bg-slate-100 text-slate-400 border-slate-200/80 cursor-not-allowed opacity-60'
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 cursor-pointer'
                              }`}
                            >
                              <span>Diterima</span>
                            </button>

                          </div>
                        </div>
                      )}
                    </div>

                    {/* Catatan perbaikan untuk mahasiswa */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600 block">
                        Catatan perbaikan untuk mahasiswa
                      </label>
                      <textarea
                        rows={3}
                        readOnly={isCompleted || !isAuthorized}
                        disabled={isCompleted || !isAuthorized}
                        value={currentCatatan}
                        onChange={(e) => isAuthorized && !isCompleted && handleCatatanChange(c.id, e.target.value)}
                        placeholder={
                          isCompleted
                            ? "Tidak ada catatan perbaikan."
                            : "Tuliskan catatan perbaikan untuk mahasiswa..."
                        }
                        className={`w-full text-xs p-3 rounded-xl border transition-all leading-relaxed ${
                          isCompleted || !isAuthorized
                            ? 'bg-slate-50 text-slate-700 border-slate-200 cursor-default select-text'
                            : 'bg-white text-slate-800 border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                        }`}
                      />
                      {isAuthorized && !isCompleted && !currentCatatan.trim() && (
                        <p className="text-[10px] text-red-500 font-normal">
                          Catatan perbaikan wajib diisi sebelum menyimpan tanggapan.
                        </p>
                      )}
                    </div>

                  </div>
                );
              })()}

            </div>

            {/* Footer Modal: Tombol Simpan jika belum selesai dan memiliki hak akses */}
            {(() => {
              const c = activeDetailCons;
              const isAuthorized = isAuthorizedSupervisor(c);
              const isCompleted = Boolean(
                c.reviewed_at || 
                c.status === 'disetujui' || 
                (c.status === 'perlu_revisi' && c.jenis_revisi) ||
                (c.jenis_revisi && c.jenis_revisi !== 'Menunggu') ||
                (c.masukan_dosen && c.status !== 'menunggu_tanggapan' && c.status !== 'menunggu')
              );

              // Jika sudah selesai atau bukan pembimbing yang berhak, tombol Simpan tidak tampil
              if (isCompleted || !isAuthorized) return null;

              const currentFeedback = feedbackState[c.id] || {};
              const currentJenis = currentFeedback.jenis !== undefined 
                ? currentFeedback.jenis 
                : (c.jenis_revisi || (c.status === 'disetujui' ? 'Diterima' : c.status === 'menunggu_tanggapan' ? 'Menunggu' : 'Menunggu'));
              const rawCatatan = currentFeedback.catatan !== undefined 
                ? currentFeedback.catatan 
                : (c.masukan_dosen || '');
              const cleanCatatan = String(rawCatatan).replace(/^\[(Revisi Mayor|Revisi Minor|Mayor|Minor|Menunggu|Diterima|Disetujui|Ditolak)\]\s*/i, '').trim();

              const isFormValid = Boolean(cleanCatatan && currentJenis && currentJenis !== 'Menunggu');

              return (
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-end">
                  <button
                    type="button"
                    disabled={savingId === c.id || !isFormValid}
                    onClick={() => handleSaveFeedback(c.id)}
                    title={!cleanCatatan ? 'Catatan perbaikan wajib diisi sebelum menyimpan' : (!currentJenis || currentJenis === 'Menunggu') ? 'Silakan pilih hasil evaluasi bimbingan' : 'Simpan tanggapan bimbingan'}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{savingId === c.id ? 'Menyimpan...' : 'Simpan Tanggapan'}</span>
                  </button>
                </div>
              );
            })()}

          </div>
        </div>
      )}

    </div>
  );
}
