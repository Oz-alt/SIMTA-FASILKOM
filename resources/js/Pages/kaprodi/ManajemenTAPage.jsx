import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link } from '@inertiajs/react';
import { getStudentSemester, AVAILABLE_SEMESTERS } from '../../lib/academicUtils.js';
import StatusBadge from '../../Components/common/StatusBadge.jsx';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  GraduationCap, 
  UserCheck, 
  Users, 
  UserX,
  Edit3, 
  CheckCheck, 
  Send, 
  AlertCircle, 
  AlertTriangle,
  X,
  Info,
  BellRing,
  Mail,
  Calendar,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Check,
  Download,
  Copy,
  FileSpreadsheet
} from 'lucide-react';

export default function ManajemenTAPage() {
  const { 
    thesisTitles, 
    advisors, 
    updateThesisTitleAdvisors, 
    confirmThesisAdvisors, 
    confirmAllThesisAdvisors,
    getAllRegisteredStudents,
    sendBroadcastSubmissionReminder,
    submissionBroadcastLogs
  } = useAuth();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('Semua Semester');
  const [submissionTab, setSubmissionTab] = useState('all'); // 'all' | 'sudah' | 'belum'
  const [confirmFilter, setConfirmFilter] = useState('all'); // 'all' | 'confirmed' | 'unconfirmed'

  // Toast
  const [toastMessage, setToastMessage] = useState('');

  // Modals state
  const [editingTitle, setEditingTitle] = useState(null);
  const [editDospem1Nip, setEditDospem1Nip] = useState('');
  const [editDospem2Nip, setEditDospem2Nip] = useState('');
  const [editError, setEditError] = useState('');

  const [confirmingTitle, setConfirmingTitle] = useState(null);
  const [isConfirmAllModalOpen, setIsConfirmAllModalOpen] = useState(false);

  // Broadcast Reminder Modal State (Point 23)
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState('[Pemberitahuan Prodi D3 MI] Pengingat Batas Pengajuan Usulan Judul Tugas Akhir');
  const [broadcastCustomMessage, setBroadcastCustomMessage] = useState(
    'Yth. Mahasiswa Program Studi D3 Manajemen Informatika,\n\nBerdasarkan pantauan sistem SIMTA, Anda tercatat belum mengusulkan judul Tugas Akhir untuk semester ini. Mohon segera menyusun usulan judul dan mengajukannya melalui sistem SIMTA agar proses peninjauan topik dan penetapan dosen pembimbing dapat segera dilakukan.\n\nTerima kasih,\nKetua Program Studi D3 Manajemen Informatika\nFakultas Ilmu Komputer, Universitas Sriwijaya'
  );
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // Helper to resolve advisor NIP from advisor name
  const resolveNipFromName = (name) => {
    if (!name) return '';
    const clean = String(name).toLowerCase().trim();
    const found = advisors.find(a => 
      a.nama.toLowerCase().includes(clean) || 
      clean.includes(a.nama.toLowerCase())
    );
    return found ? found.nip : '';
  };

  // Compile unified list of all D3 students: Submitted + Unsubmitted (Points 21 & 22)
  const allStudents = useMemo(() => {
    const registeredStudents = typeof getAllRegisteredStudents === 'function' ? getAllRegisteredStudents() : [];
    const matchedNims = new Set();

    // 1. Mahasiswa yang sudah mengusulkan judul (otomatis masuk manajemen tanpa perlu ACC manual - Point 21)
    const submittedList = thesisTitles.map(t => {
      const cleanNim = String(t.mhs_nim || '').trim();
      if (cleanNim) matchedNims.add(cleanNim);
      const matchedProfile = registeredStudents.find(s => String(s.nim).trim() === cleanNim);

      return {
        id: t.id,
        mhs_nim: t.mhs_nim,
        mhs_nama: t.mhs_nama || matchedProfile?.nama || 'Mahasiswa D3 MI',
        mhs_kelas: t.mhs_kelas || matchedProfile?.kelas || 'MI 5A',
        prodi: t.prodi || matchedProfile?.prodi || 'D3 Manajemen Informatika',
        semester: getStudentSemester(t),
        hasSubmitted: true,
        judul: t.judul,
        skor_kemiripan_terakhir: t.skor_kemiripan_terakhir,
        status_pengajuan: t.status || 'tinjauan', // 'tinjauan' | 'perlu_revisi' | 'disetujui' | 'judul_fix'
        pembimbing_1: t.pembimbing_1,
        pembimbing_2: t.pembimbing_2,
        pembimbing_1_nama: t.pembimbing_1_nama || t.pembimbing_1 || '',
        pembimbing_2_nama: t.pembimbing_2_nama || t.pembimbing_2 || '',
        pembimbing_1_nip: t.pembimbing_1_nip || '',
        pembimbing_2_nip: t.pembimbing_2_nip || '',
        dospem_confirmed: Boolean(t.dospem_confirmed),
        dospem_confirmed_at: t.dospem_confirmed_at,
        updated_at: t.updated_at,
        created_at: t.created_at,
        email: matchedProfile?.email || (t.mhs_nim ? `${t.mhs_nim}@student.unsri.ac.id` : 'student@unsri.ac.id'),
        originalThesis: t
      };
    });

    // 2. Mahasiswa yang belum mengusulkan judul (Point 22)
    const unsubmittedList = registeredStudents
      .filter(s => !matchedNims.has(String(s.nim).trim()))
      .map(s => ({
        id: `unsub-${s.nim}`,
        mhs_nim: s.nim,
        mhs_nama: s.nama,
        mhs_kelas: s.kelas || 'MI 5A',
        prodi: s.prodi || 'D3 Manajemen Informatika',
        semester: getStudentSemester(s),
        hasSubmitted: false,
        judul: null,
        skor_kemiripan_terakhir: null,
        status_pengajuan: 'belum_mengajukan',
        pembimbing_1: null,
        pembimbing_2: null,
        pembimbing_1_nama: null,
        pembimbing_2_nama: null,
        pembimbing_1_nip: null,
        pembimbing_2_nip: null,
        dospem_confirmed: false,
        email: s.email || `${s.nim}@student.unsri.ac.id`,
        created_at: s.created_at
      }));

    return [...submittedList, ...unsubmittedList];
  }, [thesisTitles, getAllRegisteredStudents]);

  // Aggregate Stats
  const totalStudentsCount = allStudents.length;
  const submittedStudents = useMemo(() => allStudents.filter(s => s.hasSubmitted), [allStudents]);
  const unsubmittedStudents = useMemo(() => allStudents.filter(s => !s.hasSubmitted), [allStudents]);
  const confirmedCount = useMemo(() => submittedStudents.filter(s => s.dospem_confirmed).length, [submittedStudents]);
  const unconfirmedCount = submittedStudents.length - confirmedCount;

  // Filtered titles & students
  const filteredStudents = useMemo(() => {
    return allStudents.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        s.mhs_nama?.toLowerCase().includes(q) ||
        s.mhs_nim?.toLowerCase().includes(q) ||
        s.mhs_kelas?.toLowerCase().includes(q) ||
        (s.judul && s.judul.toLowerCase().includes(q)) ||
        (s.pembimbing_1_nama && s.pembimbing_1_nama.toLowerCase().includes(q)) ||
        (s.pembimbing_2_nama && s.pembimbing_2_nama.toLowerCase().includes(q));

      const matchSemester = semesterFilter === 'Semua Semester' || s.semester === semesterFilter;

      const matchTab = 
        submissionTab === 'all' ? true :
        submissionTab === 'sudah' ? s.hasSubmitted :
        submissionTab === 'belum' ? !s.hasSubmitted : true;

      const isConfirmed = Boolean(s.dospem_confirmed);
      const matchConfirm = 
        confirmFilter === 'all' || !s.hasSubmitted ? true :
        confirmFilter === 'confirmed' ? isConfirmed :
        confirmFilter === 'unconfirmed' ? !isConfirmed : true;

      return matchSearch && matchSemester && matchTab && matchConfirm;
    });
  }, [allStudents, searchQuery, semesterFilter, submissionTab, confirmFilter]);

  // Unconfirmed submitted titles in current filtered view (for Confirm All action)
  const unconfirmedInView = useMemo(() => {
    return filteredStudents.filter(s => s.hasSubmitted && !s.dospem_confirmed);
  }, [filteredStudents]);

  // Last broadcast reminder details
  const lastBroadcast = useMemo(() => {
    if (Array.isArray(submissionBroadcastLogs) && submissionBroadcastLogs.length > 0) {
      return submissionBroadcastLogs[0];
    }
    return null;
  }, [submissionBroadcastLogs]);

  // Open Edit Dospem Modal
  const handleOpenEdit = (student) => {
    if (!student.hasSubmitted) return;
    setEditingTitle(student.originalThesis || student);
    const d1 = student.pembimbing_1_nip || resolveNipFromName(student.pembimbing_1_nama || student.pembimbing_1);
    const d2 = student.pembimbing_2_nip || resolveNipFromName(student.pembimbing_2_nama || student.pembimbing_2);
    setEditDospem1Nip(d1 || '');
    setEditDospem2Nip(d2 || '');
    setEditError('');
  };

  // Save Edit Dospem (Point 25: Langsung aktif diperbarui di portal mahasiswa)
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingTitle) return;

    if (editDospem1Nip && editDospem2Nip && editDospem1Nip === editDospem2Nip) {
      setEditError('Pembimbing 1 dan Pembimbing 2 tidak boleh dosen yang sama.');
      return;
    }

    updateThesisTitleAdvisors(editingTitle.id, editDospem1Nip, editDospem2Nip);
    showToast(`Dosen pembimbing untuk ${editingTitle.mhs_nama} langsung diperbarui & aktif di portal mahasiswa.`);
    setEditingTitle(null);
  };

  // Download Rekap Pembagian Dospem ke Excel / CSV (Point 26)
  const downloadAdvisorDistributionCsv = () => {
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    
    const headers = [
      'No',
      'NIM',
      'Nama Mahasiswa',
      'Program Studi',
      'Kelas',
      'Semester',
      'Judul Tugas Akhir',
      'Pembimbing 1 (Nama)',
      'Pembimbing 1 (NIP)',
      'Pembimbing 2 (Nama)',
      'Pembimbing 2 (NIP)',
      'Status Pembagian',
      'Status Pengajuan Judul',
      'Tanggal Update'
    ];

    const escape = (str) => `"${String(str || '').replace(/"/g, '""').trim()}"`;

    const rows = filteredStudents.map((std, idx) => {
      const d1Nama = std.pembimbing_1_nama || std.pembimbing_1 || (std.pembimbing_1_nip ? `NIP. ${std.pembimbing_1_nip}` : '-');
      const d2Nama = std.pembimbing_2_nama || std.pembimbing_2 || (std.pembimbing_2_nip ? `NIP. ${std.pembimbing_2_nip}` : '-');
      const statusText = (std.pembimbing_1_nip || std.pembimbing_1) && (std.pembimbing_2_nip || std.pembimbing_2) ? 'Lengkap (D1 & D2)' : (std.pembimbing_1_nip || std.pembimbing_1 || std.pembimbing_2_nip || std.pembimbing_2) ? 'Baru 1 Dospem' : 'Belum Ditetapkan';
      const submissionText = std.hasSubmitted ? 'Sudah Mengajukan' : 'Belum Mengajukan';

      return [
        idx + 1,
        `'${std.mhs_nim}`,
        escape(std.mhs_nama),
        escape(std.prodi || 'D3 Manajemen Informatika'),
        escape(std.mhs_kelas || 'MI 5A'),
        escape(std.semester || 'Semester 5'),
        escape(std.judul || 'Belum mengajukan judul'),
        escape(d1Nama),
        std.pembimbing_1_nip ? `'${std.pembimbing_1_nip}` : '-',
        escape(d2Nama),
        std.pembimbing_2_nip ? `'${std.pembimbing_2_nip}` : '-',
        escape(statusText),
        escape(submissionText),
        escape(today)
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rekap_pembagian_dospem_d3_mi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`File Rekap Pembagian Dospem (${filteredStudents.length} mahasiswa) berhasil di-download! Siap dibagikan ke grup.`);
  };

  // Salin Format Chat Pengumuman Grup (WhatsApp / Telegram) - Point 26 & 27
  const copyGroupAnnouncementText = () => {
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const assignedList = filteredStudents.filter(s => s.hasSubmitted && (s.pembimbing_1_nama || s.pembimbing_1 || s.pembimbing_2_nama || s.pembimbing_2));
    
    if (assignedList.length === 0) {
      showToast('Belum ada mahasiswa yang memiliki dosen pembimbing pada tampilan saat ini.');
      return;
    }

    let text = `📢 *PENGUMUMAN PEMBAGIAN DOSEN PEMBIMBING TUGAS AKHIR*\n`;
    text += `Program Studi D3 Manajemen Informatika - FASILKOM UNSRI\n`;
    text += `Tanggal: ${today}\n`;
    text += `----------------------------------------------------\n\n`;

    assignedList.forEach((std, idx) => {
      const d1Nama = std.pembimbing_1_nama || std.pembimbing_1 || '-';
      const d2Nama = std.pembimbing_2_nama || std.pembimbing_2 || '-';

      text += `${idx + 1}. *${std.mhs_nama}* (${std.mhs_nim} • ${std.mhs_kelas})\n`;
      if (std.judul) {
        text += `   Judul: "${std.judul}"\n`;
      }
      text += `   • Pembimbing 1: ${d1Nama}\n`;
      text += `   • Pembimbing 2: ${d2Nama}\n\n`;
    });

    text += `----------------------------------------------------\n`;
    text += `Total Terbagi: ${assignedList.length} Mahasiswa\n`;
    text += `Catatan: Mohon mahasiswa segera berkoordinasi dengan Dosen Pembimbing masing-masing untuk proses bimbingan minimal 2x dalam sebulan.\n\n`;
    text += `Terima kasih.\n_Ketua Program Studi D3 Manajemen Informatika_`;

    navigator.clipboard.writeText(text);
    showToast(`Format chat pengumuman grup (${assignedList.length} mahasiswa) berhasil disalin ke clipboard! Siap di-paste ke grup WhatsApp/Telegram.`);
  };

  // Open Confirm Modal
  const handleOpenConfirm = (student) => {
    if (!student.hasSubmitted) return;
    setConfirmingTitle(student.originalThesis || student);
  };

  // Confirm Thesis Advisors (Single)
  const handleExecuteConfirm = () => {
    if (!confirmingTitle) return;

    confirmThesisAdvisors(confirmingTitle.id);
    showToast(`Penetapan Dospem untuk ${confirmingTitle.mhs_nama} aktif & tercatat di sistem.`);
    setConfirmingTitle(null);
  };

  // Open Confirm All Modal
  const handleOpenConfirmAll = () => {
    if (unconfirmedInView.length === 0) {
      showToast('Semua mahasiswa pada filter ini sudah dikonfirmasi dospemnya.');
      return;
    }
    setIsConfirmAllModalOpen(true);
  };

  // Execute Confirm All (Batch)
  const handleExecuteConfirmAll = () => {
    if (unconfirmedInView.length === 0) return;

    const idsToConfirm = unconfirmedInView.map(s => s.id);
    if (typeof confirmAllThesisAdvisors === 'function') {
      confirmAllThesisAdvisors(idsToConfirm);
    } else {
      idsToConfirm.forEach(id => confirmThesisAdvisors(id));
    }

    showToast(`Berhasil mengonfirmasi penetapan Dospem untuk ${idsToConfirm.length} mahasiswa sekaligus! Notifikasi resmi telah dikirim.`);
    setIsConfirmAllModalOpen(false);
  };

  // Execute Broadcast Submission Reminder (Single Button Broadcast - Point 23)
  const handleExecuteBroadcastReminder = () => {
    if (unsubmittedStudents.length === 0) {
      showToast('Seluruh mahasiswa telah mengajukan judul. Tidak ada pengingat yang perlu dikirim.');
      return;
    }

    setIsSendingBroadcast(true);

    if (typeof sendBroadcastSubmissionReminder === 'function') {
      sendBroadcastSubmissionReminder({
        targetStudents: unsubmittedStudents,
        customSubject: broadcastSubject,
        customMessage: broadcastCustomMessage
      });
    }

    setIsSendingBroadcast(false);
    setIsBroadcastModalOpen(false);
    showToast(`Pengingat pengajuan judul serentak berhasil dikirim ke ${unsubmittedStudents.length} mahasiswa D3 MI via Notifikasi SIMTA & Email!`);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs sm:text-sm font-semibold border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-900 via-blue-800 to-blue-950 text-white p-6 sm:p-8 overflow-hidden shadow-xl border border-blue-700/40">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-bold uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5 text-blue-300" />
            <span>Portal Kaprodi FASILKOM UNSRI • D3 Manajemen Informatika</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Manajemen Tugas Akhir Mahasiswa
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal">
            Pantau seluruh mahasiswa tingkat akhir secara terintegrasi: usulan judul mahasiswa otomatis masuk ke manajemen tanpa proses ACC/Tolak manual, mahasiswa yang belum mengajukan judul dapat dipantau, dan pengingat pengajuan dapat dikirim secara serentak.
          </p>
        </div>
      </div>

      {/* Metrics Stat Cards (Points 21, 22, 23) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Mahasiswa */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Total Mahasiswa D3</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {totalStudentsCount} Mahasiswa
          </div>
          <p className="text-[11px] text-slate-500">Angkatan aktif D3 Manajemen Informatika</p>
        </div>

        {/* Sudah Mengajukan Judul (Point 21 - Otomatis masuk proses tanpa butuh ACC) */}
        <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-2xs space-y-1 bg-gradient-to-br from-white to-emerald-50/40">
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center justify-between">
            <span>Sudah Mengajukan Judul</span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">
            {submittedStudents.length} Mahasiswa
          </div>
          <p className="text-[11px] text-slate-500">Otomatis masuk proses pembimbingan &amp; review</p>
        </div>

        {/* Belum Mengajukan Judul (Point 22 & Point 23) */}
        <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-2xs space-y-2 bg-gradient-to-br from-white to-amber-50/40">
          <div className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center justify-between">
            <span>Belum Mengajukan Judul</span>
            <UserX className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700 flex items-center justify-between">
            <span>{unsubmittedStudents.length} Mahasiswa</span>
            {unsubmittedStudents.length > 0 && (
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(true)}
                className="px-2.5 py-1 text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-xs flex items-center space-x-1 cursor-pointer transition-all"
                title="Kirim pengingat serentak ke seluruh mahasiswa yang belum mengajukan"
              >
                <BellRing className="w-3 h-3 shrink-0" />
                <span>Ingatkan Serentak</span>
              </button>
            )}
          </div>
          <p className="text-[11px] text-amber-600/90 font-medium">
            {unsubmittedStudents.length > 0 ? 'Perlu pengingat pengajuan serentak' : 'Semua mahasiswa telah mengajukan'}
          </p>
        </div>

        {/* Dospem Dikonfirmasi */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Dospem Dikonfirmasi</span>
            <CheckCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-700 flex items-center justify-between">
            <span>{confirmedCount} Mahasiswa</span>
            <span className="text-xs font-bold text-slate-400">/ {submittedStudents.length}</span>
          </div>
          <p className="text-[11px] text-slate-500">{unconfirmedCount} masih menunggu konfirmasi</p>
        </div>

      </div>

      {/* Riwayat Broadcast Terakhir Banner (Jika ada) */}
      {lastBroadcast && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <span className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <BellRing className="w-4 h-4" />
            </span>
            <div>
              <span className="font-bold">Pengingat Serentak Terakhir:</span> Terkirim ke <strong className="font-extrabold text-amber-950">{lastBroadcast.total_recipients} mahasiswa</strong> pada {new Date(lastBroadcast.tanggal_kirim).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB via {lastBroadcast.channel}.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsBroadcastModalOpen(true)}
            className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer shrink-0"
          >
            Kirim Pengingat Lagi
          </button>
        </div>
      )}

      {/* Search and Filters Bar with Segmented Control & Single Broadcast Button (Points 22 & 23) */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        
        {/* Search Input */}
        <div className="relative w-full xl:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, NIM, kelas, judul, dospem..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm outline-none transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Tab Segments & Dropdowns & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 justify-between xl:justify-end">
          
          {/* Segmented Filter Tab: Semua | Sudah Mengajukan | Belum Mengajukan (Point 22) */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setSubmissionTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                submissionTab === 'all' 
                  ? 'bg-white text-indigo-700 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({totalStudentsCount})
            </button>
            <button
              type="button"
              onClick={() => setSubmissionTab('sudah')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                submissionTab === 'sudah' 
                  ? 'bg-white text-emerald-700 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sudah Mengajukan ({submittedStudents.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSubmissionTab('belum')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                submissionTab === 'belum' 
                  ? 'bg-white text-amber-700 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Belum Mengajukan ({unsubmittedStudents.length})</span>
            </button>
          </div>

          {/* Semester Filter */}
          <div className="flex items-center space-x-1.5">
            <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none focus:border-indigo-600 cursor-pointer"
            >
              {AVAILABLE_SEMESTERS.map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>

          {/* Status Konfirmasi Filter (Hanya untuk yang sudah mengajukan) */}
          <div className="flex items-center space-x-1.5">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={confirmFilter}
              onChange={(e) => setConfirmFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none focus:border-indigo-600 cursor-pointer"
            >
              <option value="all">Semua Status Dospem</option>
              <option value="unconfirmed">Menunggu Konfirmasi ({unconfirmedCount})</option>
              <option value="confirmed">Sudah Dikonfirmasi ({confirmedCount})</option>
            </select>
          </div>

          {/* Download Rekap Dospem (Point 26) */}
          <button
            type="button"
            onClick={downloadAdvisorDistributionCsv}
            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer shrink-0"
            title="Download data pembagian dospem ke format CSV / Excel untuk dibagikan ke grup"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Rekap</span>
          </button>

          {/* Salin Format Chat Grup WhatsApp / Telegram (Point 26 & 27) */}
          <button
            type="button"
            onClick={copyGroupAnnouncementText}
            className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
            title="Salin pesan rekap pembagian berformat chat untuk grup WhatsApp / Telegram"
          >
            <Copy className="w-3.5 h-3.5 text-emerald-600" />
            <span>Format Grup</span>
          </button>

          {/* SINGLE BUTTON BROADCAST: Kirim Reminder Pengajuan Serentak (Point 23) */}
          <button
            type="button"
            onClick={() => setIsBroadcastModalOpen(true)}
            disabled={unsubmittedStudents.length === 0}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm ${
              unsubmittedStudents.length > 0
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/20 hover:scale-[1.02] cursor-pointer'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-70'
            }`}
            title="Kirim pengingat pengajuan judul serentak ke seluruh mahasiswa yang belum mengajukan"
          >
            <BellRing className="w-4 h-4 shrink-0" />
            <span>Kirim Reminder Pengajuan Serentak</span>
            {unsubmittedStudents.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-amber-800 text-white rounded-full leading-none">
                {unsubmittedStudents.length}
              </span>
            )}
          </button>

          {/* Tombol Confirm All Dospem */}
          <button
            type="button"
            onClick={handleOpenConfirmAll}
            disabled={unconfirmedInView.length === 0}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm ${
              unconfirmedInView.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:scale-[1.02] cursor-pointer'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-75'
            }`}
            title={
              unconfirmedInView.length > 0
                ? `Konfirmasi semua (${unconfirmedInView.length}) dospem pada tampilan ini`
                : 'Semua dospem pada tampilan ini sudah dikonfirmasi'
            }
          >
            <CheckCheck className="w-4 h-4 shrink-0" />
            <span>Confirm All Dospem</span>
            {unconfirmedInView.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-emerald-800 text-white rounded-full leading-none">
                {unconfirmedInView.length}
              </span>
            )}
          </button>

        </div>
      </div>

      {/* Main Table (Mahasiswa Sudah & Belum Mengajukan Judul) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span>Daftar Mahasiswa &amp; Tugas Akhir D3 Manajemen Informatika</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Menampilkan mahasiswa yang sudah mengusulkan judul maupun yang belum mengajukan. Gunakan tombol reminder serentak di atas untuk mengirim pengingat secara keseluruhan.
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-600">
            Menampilkan <span className="text-indigo-600 font-bold">{filteredStudents.length}</span> data
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-2 w-8 text-center">No</th>
                <th className="py-3 px-2.5 w-[22%]">Mahasiswa</th>
                <th className="py-3 px-3">Judul Tugas Akhir / Status Usulan</th>
                <th className="py-3 px-2.5 w-[23%]">Dosen Pembimbing</th>
                <th className="py-3 px-1 text-center w-28">Status</th>
                <th className="py-3 px-1 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-slate-700 text-xs">Tidak ada data mahasiswa yang sesuai kriteria filter.</p>
                      <p className="text-[11px] text-slate-400">
                        Coba sesuaikan kata kunci pencarian atau ganti pilihan tab filter di atas.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std, idx) => {
                  const isConfirmed = Boolean(std.dospem_confirmed);
                  const d1Nama = std.pembimbing_1_nama || std.pembimbing_1 || '-';
                  const d2Nama = std.pembimbing_2_nama || std.pembimbing_2 || '-';

                  return (
                    <tr key={std.id} className="hover:bg-slate-50/60 transition-colors">
                      
                      {/* No */}
                      <td className="py-3 px-2 text-center font-bold text-slate-400 align-middle">
                        {idx + 1}
                      </td>

                      {/* Mahasiswa Info */}
                      <td className="py-3 px-2.5 font-semibold text-slate-900 align-middle">
                        <div className="font-bold text-slate-900 text-xs truncate" title={std.mhs_nama}>
                          {std.mhs_nama}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono flex flex-wrap items-center gap-1 mt-0.5">
                          <span>{std.mhs_nim}</span>
                          <span>•</span>
                          <span className="text-indigo-600 font-semibold">{std.mhs_kelas}</span>
                          <span>•</span>
                          <span className="px-1 py-0.2 rounded bg-indigo-50 text-indigo-700 font-medium text-[9px] border border-indigo-200">
                            {std.semester}
                          </span>
                        </div>
                      </td>

                      {/* Judul TA / Status Usulan (Point 21 & 22) */}
                      <td className="py-3 px-3 font-medium text-slate-800 align-middle">
                        {std.hasSubmitted && std.judul ? (
                          <>
                            <p className="text-xs font-semibold text-slate-900 leading-snug italic line-clamp-2" title={std.judul}>
                              "{std.judul}"
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                              <span className="text-slate-400">
                                Diajukan: {std.updated_at ? new Date(std.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Masuk proses'}
                              </span>
                              {std.skor_kemiripan_terakhir !== undefined && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold border border-emerald-200">
                                    Sim: {std.skor_kemiripan_terakhir}%
                                  </span>
                                </>
                              )}
                              <span className="text-slate-300">•</span>
                              <span className="text-indigo-600 font-medium capitalize">
                                Usulan: {std.status_pengajuan === 'perlu_revisi' ? 'Perlu Revisi' : std.status_pengajuan === 'disetujui' || std.status_pengajuan === 'judul_fix' ? 'Judul Disetujui' : 'Tinjauan'}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="py-0.5 space-y-1">
                            <div className="inline-flex items-center space-x-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                              <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>Belum Mengajukan Judul TA</span>
                            </div>
                            <p className="text-[10px] text-slate-400 italic">
                              Mahasiswa belum submit proposal judul melalui akun SIMTA.
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Dosen Pembimbing */}
                      <td className="py-3 px-2.5 align-middle">
                        {std.hasSubmitted ? (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1.5 min-w-0">
                              <span className="w-4 h-4 rounded bg-indigo-50 text-indigo-700 font-extrabold text-[9px] flex items-center justify-center shrink-0 border border-indigo-100">
                                1
                              </span>
                              <span className="font-bold text-slate-800 text-xs truncate min-w-0" title={d1Nama}>
                                {d1Nama}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1.5 min-w-0">
                              <span className="w-4 h-4 rounded bg-blue-50 text-blue-700 font-extrabold text-[9px] flex items-center justify-center shrink-0 border border-blue-100">
                                2
                              </span>
                              <span className="font-bold text-slate-800 text-xs truncate min-w-0" title={d2Nama}>
                                {d2Nama}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Belum Ditetapkan
                          </span>
                        )}
                      </td>

                      {/* Status Konfirmasi / Pengajuan */}
                      <td className="py-3 px-1 text-center align-middle">
                        {std.hasSubmitted ? (
                          <div className="space-y-1 inline-flex flex-col items-center">
                            <StatusBadge type="confirmation" status={isConfirmed} />
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                              std.status_pengajuan === 'perlu_revisi'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : std.status_pengajuan === 'disetujui' || std.status_pengajuan === 'judul_fix'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-yellow-50 text-yellow-800 border-yellow-200'
                            }`}>
                              {std.status_pengajuan === 'perlu_revisi' ? 'Revisi' : std.status_pengajuan === 'disetujui' || std.status_pengajuan === 'judul_fix' ? 'Judul Fix' : 'Tinjauan'}
                            </span>
                          </div>
                        ) : (
                          <StatusBadge type="thesis" status="belum_mengajukan" />
                        )}
                      </td>

                      {/* Aksi (Point 23: Tidak ada reminder satu per satu di baris tabel!) */}
                      <td className="py-3 px-1 text-center align-middle">
                        {std.hasSubmitted ? (
                          <div className="flex items-center justify-center space-x-1">
                            
                            {/* Button Edit Dospem */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(std)}
                              className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-all cursor-pointer shadow-2xs group"
                              title="Edit Dosen Pembimbing"
                              aria-label="Edit Dosen Pembimbing"
                            >
                              <Edit3 className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                            </button>

                            {/* Button Confirm Dospem */}
                            <button
                              type="button"
                              onClick={() => handleOpenConfirm(std)}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-2xs group ${
                                isConfirmed
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 border border-slate-200'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 hover:scale-105'
                              }`}
                              title={isConfirmed ? "Konfirmasi Ulang Penetapan Dospem" : "Konfirmasi & Kirim Notifikasi Dospem"}
                              aria-label={isConfirmed ? "Konfirmasi Ulang Penetapan Dospem" : "Konfirmasi & Kirim Notifikasi Dospem"}
                            >
                              {isConfirmed ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 transition-transform group-hover:scale-110" />
                              ) : (
                                <Send className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                              )}
                            </button>

                          </div>
                        ) : (
                          /* Point 23: Mahasiswa yang belum mengajukan tercakup di pengingat serentak */
                          <div className="flex items-center justify-center">
                            <span 
                              className="text-[10px] font-semibold text-amber-700 bg-amber-50/80 px-2 py-1 rounded-md border border-amber-200/70 inline-flex items-center space-x-1"
                              title="Mahasiswa ini tercakup dalam pengingat pengajuan judul serentak melalui tombol di atas"
                            >
                              <BellRing className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>Serentak</span>
                            </span>
                          </div>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL EDIT DOSEN PEMBIMBING */}
      {editingTitle && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in" data-lenis-prevent>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-indigo-600 font-bold text-sm">
                <Edit3 className="w-4 h-4" />
                <span>Edit Dosen Pembimbing</span>
              </div>
              <button 
                type="button"
                onClick={() => setEditingTitle(null)} 
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800">{editingTitle.mhs_nama} ({editingTitle.mhs_nim} • {editingTitle.mhs_kelas})</div>
              <div className="text-slate-600 line-clamp-2 italic">"{editingTitle.judul}"</div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              
              {/* Pembimbing 1 Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dosen Pembimbing 1:
                </label>
                <select
                  value={editDospem1Nip}
                  onChange={(e) => {
                    setEditDospem1Nip(e.target.value);
                    if (editError) setEditError('');
                  }}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Pilih Pembimbing 1 --</option>
                  {advisors.map(adv => (
                    <option 
                      key={adv.id || adv.nip} 
                      value={adv.nip}
                      disabled={adv.nip === editDospem2Nip}
                    >
                      {adv.nama} (Kuota: {adv.kuota_dospem1 || 8})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pembimbing 2 Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dosen Pembimbing 2:
                </label>
                <select
                  value={editDospem2Nip}
                  onChange={(e) => {
                    setEditDospem2Nip(e.target.value);
                    if (editError) setEditError('');
                  }}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Pilih Pembimbing 2 --</option>
                  {advisors.map(adv => (
                    <option 
                      key={adv.id || adv.nip} 
                      value={adv.nip}
                      disabled={adv.nip === editDospem1Nip}
                    >
                      {adv.nama} (Kuota: {adv.kuota_dospem2 || 8})
                    </option>
                  ))}
                </select>
              </div>

              {editError && (
                <div className="flex items-center space-x-1.5 text-rose-600 text-xs font-semibold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-200 text-[11px] text-blue-800 flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Perubahan dosen pembimbing langsung aktif dan otomatis diperbarui di portal mahasiswa tanpa perlu kirim email berulang. Anda dapat men-download rekap pembagian untuk dibagikan ke grup kelas.
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTitle(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI (CONFIRM BUTTON) */}
      {confirmingTitle && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in" data-lenis-prevent>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-emerald-100">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm">
                <Send className="w-4 h-4" />
                <span>Konfirmasi Penetapan Dosen Pembimbing</span>
              </div>
              <button 
                type="button"
                onClick={() => setConfirmingTitle(null)} 
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Apakah Anda yakin ingin mengonfirmasi penetapan dosen pembimbing untuk mahasiswa berikut?
              </p>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="font-bold text-slate-900 text-sm">{confirmingTitle.mhs_nama}</div>
                <div className="text-slate-500 font-mono text-[11px]">{confirmingTitle.mhs_nim} • {confirmingTitle.mhs_kelas}</div>
                <div className="text-slate-700 italic pt-1 border-t border-slate-200/80">"{confirmingTitle.judul}"</div>
              </div>

              {/* Dospem Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-0.5">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase">Pembimbing 1:</div>
                  <div className="font-bold text-slate-800 truncate">
                    {confirmingTitle.pembimbing_1_nama || confirmingTitle.pembimbing_1 || '-'}
                  </div>
                  {confirmingTitle.pembimbing_1_nip && (
                    <div className="text-[10px] text-slate-400 font-mono">NIP. {confirmingTitle.pembimbing_1_nip}</div>
                  )}
                </div>

                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-0.5">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase">Pembimbing 2:</div>
                  <div className="font-bold text-slate-800 truncate">
                    {confirmingTitle.pembimbing_2_nama || confirmingTitle.pembimbing_2 || '-'}
                  </div>
                  {confirmingTitle.pembimbing_2_nip && (
                    <div className="text-[10px] text-slate-400 font-mono">NIP. {confirmingTitle.pembimbing_2_nip}</div>
                  )}
                </div>
              </div>

            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmingTitle(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirm}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ya, Konfirmasi &amp; Kirim Notifikasi</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI MASSAL (CONFIRM ALL DOSPEM) */}
      {isConfirmAllModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in" data-lenis-prevent>
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-emerald-100">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm">
                <CheckCheck className="w-5 h-5 text-emerald-600" />
                <span>Konfirmasi Massal Penetapan Dosen Pembimbing</span>
              </div>
              <button 
                type="button"
                onClick={() => setIsConfirmAllModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Apakah Anda yakin ingin mengonfirmasi penetapan dosen pembimbing untuk seluruh <strong className="text-emerald-700 font-bold">{unconfirmedInView.length} mahasiswa</strong> di bawah ini secara bersamaan?
              </p>

              {/* Scrollable list preview */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 border border-slate-200/80 rounded-xl p-2 bg-slate-50/50">
                {unconfirmedInView.map((item, idx) => (
                  <div key={item.id} className="pt-2 first:pt-0 bg-white p-3 rounded-lg border border-slate-200/60 text-xs space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span>{item.mhs_nama}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">{item.mhs_nim} • {item.mhs_kelas}</span>
                    </div>

                    <div className="text-[11px] text-slate-600 italic line-clamp-1">
                      "{item.judul}"
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-slate-700 border-t border-slate-100 font-medium">
                      <div className="flex items-center space-x-1">
                        <span className="text-emerald-700 font-bold">P1:</span>
                        <span className="truncate max-w-[200px]">{item.pembimbing_1_nama || item.pembimbing_1 || '-'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-emerald-700 font-bold">P2:</span>
                        <span className="truncate max-w-[200px]">{item.pembimbing_2_nama || item.pembimbing_2 || '-'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Info banner */}
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-800 text-[11px] flex items-start space-x-2">
                <Send className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Sistem akan secara otomatis mengirimkan notifikasi penugasan resmi ke akun masing-masing <strong>Dosen Pembimbing 1</strong>, <strong>Dosen Pembimbing 2</strong>, serta <strong>Mahasiswa</strong> terkait.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfirmAllModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmAll}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ya, Konfirmasi Semua ({unconfirmedInView.length})</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL REMINDER PENGAJUAN SERENTAK / KESELURUHAN (Point 23) */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in" data-lenis-prevent>
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-4 border border-amber-200">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center space-x-2.5 text-amber-700 font-extrabold text-sm sm:text-base">
                <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <BellRing className="w-4 h-4" />
                </span>
                <span>Kirim Reminder Pengajuan Judul Serentak</span>
              </div>
              <button 
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="space-y-4">
              
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-amber-950 uppercase tracking-wide text-[10px]">
                    Target Penerima Pengingat
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white font-extrabold text-[10px]">
                    {unsubmittedStudents.length} Mahasiswa
                  </span>
                </div>
                <p className="text-amber-900 leading-relaxed text-[11px]">
                  Pengingat ini akan dikirim <strong>sekaligus secara serentak</strong> ke seluruh mahasiswa D3 Manajemen Informatika yang belum mengusulkan judul Tugas Akhir melalui sistem SIMTA &amp; Email resmi.
                </p>
              </div>

              {/* Daftar Mahasiswa Penerima */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Daftar Mahasiswa yang Belum Mengajukan ({unsubmittedStudents.length}):
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-xl p-2 bg-slate-50/60 divide-y divide-slate-100">
                  {unsubmittedStudents.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400 font-medium">
                      Semua mahasiswa sudah mengajukan judul.
                    </div>
                  ) : (
                    unsubmittedStudents.map((std, idx) => (
                      <div key={std.id} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="truncate">
                            <span className="font-bold text-slate-900">{std.mhs_nama}</span>
                            <span className="text-[10px] text-slate-400 font-mono ml-1.5">({std.mhs_nim})</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-semibold shrink-0">
                          {std.mhs_kelas}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Subjek Pengingat */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subjek Pengingat (Email &amp; Notifikasi):
                </label>
                <input
                  type="text"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-800"
                />
              </div>

              {/* Isi Pesan Pengingat */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pesan Pengingat Serentak:
                </label>
                <textarea
                  rows={4}
                  value={broadcastCustomMessage}
                  onChange={(e) => setBroadcastCustomMessage(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 leading-relaxed font-normal"
                />
              </div>

              {/* Saluran Pengiriman */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Saluran:</span>
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  <Check className="w-3 h-3" />
                  <span>Notifikasi SIMTA</span>
                </span>
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                  <Check className="w-3 h-3" />
                  <span>Email Resmi (@student.unsri.ac.id)</span>
                </span>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteBroadcastReminder}
                disabled={isSendingBroadcast || unsubmittedStudents.length === 0}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-60"
              >
                <BellRing className="w-4 h-4 shrink-0" />
                <span>
                  {isSendingBroadcast 
                    ? 'Mengirim Pengingat...' 
                    : `Kirim Pengingat ke ${unsubmittedStudents.length} Mahasiswa Sekaligus`
                  }
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
