import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link } from '@inertiajs/react';
import StatusBadge from '../../Components/common/StatusBadge.jsx';
import { 
  BookOpen, 
  Clock, 
  BarChart3, 
  ArrowRight, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  Search, 
  Filter, 
  ArrowUpDown, 
  TrendingDown, 
  Bell, 
  Send, 
  History, 
  X, 
  Sparkles, 
  Check, 
  MessageSquare, 
  SlidersHorizontal, 
  ExternalLink,
  ShieldCheck,
  Building2,
  CalendarDays,
  UserCheck,
  ChevronRight,
  GraduationCap,
  Award,
  FileText,
  Printer,
  Edit3
} from 'lucide-react';

/**
 * Utility to calculate color coding and risk level based on similarity score & dynamic threshold.
 * Semakin tinggi similarity, semakin merah.
 * Semakin rendah similarity, semakin hijau.
 */
export const getSimilarityColorMeta = (score, threshold = 30) => {
  const num = Number(score) || 0;
  if (num <= 20) {
    return {
      scoreText: 'text-emerald-700',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      progressBar: 'bg-emerald-500',
      statusLabel: 'Sangat Aman',
      isAboveThreshold: false,
      riskLevel: 'very_low',
      indicatorDot: 'bg-emerald-500'
    };
  }
  if (num <= threshold) {
    return {
      scoreText: 'text-teal-700',
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
      progressBar: 'bg-teal-500',
      statusLabel: 'Aman (Di Bawah Ambang)',
      isAboveThreshold: false,
      riskLevel: 'low',
      indicatorDot: 'bg-teal-500'
    };
  }
  if (num <= 50) {
    return {
      scoreText: 'text-amber-700',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      progressBar: 'bg-amber-500',
      statusLabel: 'Sedang (Perlu Perhatian)',
      isAboveThreshold: true,
      riskLevel: 'medium',
      indicatorDot: 'bg-amber-500'
    };
  }
  if (num <= 70) {
    return {
      scoreText: 'text-orange-700',
      badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
      progressBar: 'bg-orange-500',
      statusLabel: 'Tinggi (Perlu Revisi)',
      isAboveThreshold: true,
      riskLevel: 'high',
      indicatorDot: 'bg-orange-500'
    };
  }
  return {
    scoreText: 'text-rose-700',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    progressBar: 'bg-rose-600',
    statusLabel: 'Kritis (Sangat Tinggi)',
    isAboveThreshold: true,
    riskLevel: 'critical',
    indicatorDot: 'bg-rose-600'
  };
};

export default function DashboardKaprodi() {
  const { 
    thesisTitles, 
    thesisStages, 
    bookings, 
    defenseSchedules, 
    advisors, 
    remindAdvisorAboutThesis,
    updateThesisAcademicStatus 
  } = useAuth();

  // State Management for Monitoring Dashboard
  const [similarityThreshold, setSimilarityThreshold] = useState(30); // Default threshold 30%
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState('all'); // 'all' | 'above_threshold' | 'safe' | 'has_revisions' | 'fix'
  const [sortBy, setSortBy] = useState('similarity_desc'); // Default to highest similarity first
  const [selectedAdvisorFilter, setSelectedAdvisorFilter] = useState('');

  // State Management for D3 Status Akademik & Kelulusan (Point 18, 19, 20)
  const [academicFilterTab, setAcademicFilterTab] = useState('all'); // 'all' | 'aktif' | 'lulus'
  const [academicSearch, setAcademicSearch] = useState('');
  const [academicDetailModal, setAcademicDetailModal] = useState({ isOpen: false, student: null });
  const [academicEditModal, setAcademicEditModal] = useState({
    isOpen: false,
    student: null,
    status_kelulusan: 'aktif_proses',
    status_sidang: 'bimbingan',
    nilai_sidang: '',
    tanggal_lulus: '',
    no_sk_lulus: ''
  });

  // Modals & Feedback State
  const [reminderModal, setReminderModal] = useState({
    isOpen: false,
    title: null,
    targetAdvisorNip: 'all', // 'all' | specific NIP
    customMessage: '',
    isSending: false
  });

  const [historyModal, setHistoryModal] = useState({
    isOpen: false,
    title: null
  });

  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // KPI Calculations based on current threshold
  const kpiData = useMemo(() => {
    const total = thesisTitles.length;
    const safeCount = thesisTitles.filter(t => (Number(t.skor_kemiripan_terakhir) || 0) <= similarityThreshold).length;
    const warningCount = thesisTitles.filter(t => (Number(t.skor_kemiripan_terakhir) || 0) > similarityThreshold).length;
    const withRevisionsCount = thesisTitles.filter(t => Array.isArray(t.riwayat_revisi) && t.riwayat_revisi.length > 1).length;
    const fixCount = thesisTitles.filter(t => t.status === 'disetujui' || t.status === 'judul_fix').length;

    return { total, safeCount, warningCount, withRevisionsCount, fixCount };
  }, [thesisTitles, similarityThreshold]);

  // D3 Academic & Graduation KPI (Point 18, 19, 20)
  const academicKpi = useMemo(() => {
    const total = thesisTitles.length;
    const lulusList = thesisTitles.filter(t => t.status_kelulusan === 'lulus' || t.status_sidang === 'selesai');
    const aktifList = thesisTitles.filter(t => t.status_kelulusan !== 'lulus' && t.status_sidang !== 'selesai');
    const scheduledList = thesisTitles.filter(t => t.status_sidang === 'terjadwal');
    const readyList = thesisTitles.filter(t => t.status_sidang === 'siap_daftar');
    const bimbinganList = thesisTitles.filter(t => t.status_sidang === 'bimbingan' || (!t.status_sidang && t.status_kelulusan !== 'lulus'));

    const lulusCount = lulusList.length;
    const aktifCount = aktifList.length;
    const graduationRate = total > 0 ? Math.round((lulusCount / total) * 100) : 0;

    return {
      total,
      lulusCount,
      aktifCount,
      scheduledCount: scheduledList.length,
      readyCount: readyList.length,
      bimbinganCount: bimbinganList.length,
      graduationRate
    };
  }, [thesisTitles]);

  // Filtered D3 Students for Status Akademik Table (Point 20)
  const filteredAcademicStudents = useMemo(() => {
    return thesisTitles.filter(t => {
      const q = academicSearch.toLowerCase().trim();
      const matchSearch = !q ||
        t.mhs_nama?.toLowerCase().includes(q) ||
        t.mhs_nim?.toLowerCase().includes(q) ||
        t.judul?.toLowerCase().includes(q) ||
        t.mhs_kelas?.toLowerCase().includes(q);

      const isLulus = t.status_kelulusan === 'lulus' || t.status_sidang === 'selesai';
      const matchTab =
        academicFilterTab === 'all' ? true :
        academicFilterTab === 'lulus' ? isLulus :
        academicFilterTab === 'aktif' ? !isLulus : true;

      return matchSearch && matchTab;
    });
  }, [thesisTitles, academicSearch, academicFilterTab]);

  // Unique Advisors for Filter dropdown
  const advisorOptions = useMemo(() => {
    const map = new Map();
    thesisTitles.forEach(t => {
      if (t.pembimbing_1_nip && t.pembimbing_1_nama) {
        map.set(t.pembimbing_1_nip, t.pembimbing_1_nama);
      }
      if (t.pembimbing_2_nip && t.pembimbing_2_nama) {
        map.set(t.pembimbing_2_nip, t.pembimbing_2_nama);
      }
    });
    return Array.from(map.entries()).map(([nip, nama]) => ({ nip, nama }));
  }, [thesisTitles]);

  // Processed, Filtered & Sorted Titles
  const filteredAndSortedTitles = useMemo(() => {
    let result = [...thesisTitles];

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(t => 
        (t.mhs_nama && t.mhs_nama.toLowerCase().includes(q)) ||
        (t.mhs_nim && t.mhs_nim.toLowerCase().includes(q)) ||
        (t.judul && t.judul.toLowerCase().includes(q)) ||
        (t.pembimbing_1_nama && t.pembimbing_1_nama.toLowerCase().includes(q)) ||
        (t.pembimbing_2_nama && t.pembimbing_2_nama.toLowerCase().includes(q))
      );
    }

    // 2. Advisor Filter
    if (selectedAdvisorFilter) {
      result = result.filter(t => 
        t.pembimbing_1_nip === selectedAdvisorFilter || 
        t.pembimbing_2_nip === selectedAdvisorFilter
      );
    }

    // 3. Tab Filter
    if (activeFilterTab === 'above_threshold') {
      result = result.filter(t => (Number(t.skor_kemiripan_terakhir) || 0) > similarityThreshold);
    } else if (activeFilterTab === 'safe') {
      result = result.filter(t => (Number(t.skor_kemiripan_terakhir) || 0) <= similarityThreshold);
    } else if (activeFilterTab === 'has_revisions') {
      result = result.filter(t => Array.isArray(t.riwayat_revisi) && t.riwayat_revisi.length > 1);
    } else if (activeFilterTab === 'fix') {
      result = result.filter(t => t.status === 'disetujui' || t.status === 'judul_fix');
    }

    // 4. Sorting
    result.sort((a, b) => {
      const simA = Number(a.skor_kemiripan_terakhir) || 0;
      const simB = Number(b.skor_kemiripan_terakhir) || 0;

      if (sortBy === 'similarity_desc') {
        return simB - simA; // Highest similarity first (Default)
      }
      if (sortBy === 'similarity_asc') {
        return simA - simB; // Lowest similarity first
      }
      if (sortBy === 'improved') {
        // Sort by largest similarity reduction
        const getDelta = (item) => {
          const init = item.skor_awal !== undefined ? Number(item.skor_awal) : (
            Array.isArray(item.riwayat_revisi) && item.riwayat_revisi.length > 0
              ? Number(item.riwayat_revisi[item.riwayat_revisi.length - 1].skor_similarity)
              : Number(item.skor_kemiripan_terakhir)
          );
          return (init || 0) - (Number(item.skor_kemiripan_terakhir) || 0);
        };
        return getDelta(b) - getDelta(a);
      }
      if (sortBy === 'name') {
        return (a.mhs_nama || '').localeCompare(b.mhs_nama || '');
      }
      // Newest updated
      return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
    });

    return result;
  }, [thesisTitles, searchQuery, selectedAdvisorFilter, activeFilterTab, sortBy, similarityThreshold]);

  // Handler to open Reminder Modal
  const handleOpenReminder = (titleItem) => {
    const d1 = titleItem.pembimbing_1_nama || titleItem.pembimbing_1 || 'Dosen Pembimbing 1';
    const d2 = titleItem.pembimbing_2_nama || titleItem.pembimbing_2 || 'Dosen Pembimbing 2';
    const similarity = titleItem.skor_kemiripan_terakhir || 0;

    const defaultMsg = `Yth. Bapak/Ibu Dosen Pembimbing, kami menginformasikan dari pemantauan SIMTA Prodi D3 Manajemen Informatika bahwa usulan judul mahasiswa bimbingan Anda (${titleItem.mhs_nama} - NIM ${titleItem.mhs_nim}) saat ini memiliki skor kemiripan ${similarity}% (di atas batas aman ${similarityThreshold}%). Mohon kesediaan Bapak/Ibu untuk memberikan arahan pembimbingan intensif agar mahasiswa dapat merevisi formulasi judul atau studi kasus sehingga siap melangkah ke tahap bimbingan intensif dan pendaftaran Sidang Akhir Tugas Akhir D3.`;

    setReminderModal({
      isOpen: true,
      title: titleItem,
      targetAdvisorNip: 'all',
      customMessage: defaultMsg,
      isSending: false
    });
  };

  // Handler to send reminder
  const handleSendReminder = (e) => {
    e.preventDefault();
    if (!reminderModal.title) return;

    setReminderModal(prev => ({ ...prev, isSending: true }));

    const t = reminderModal.title;
    const targets = [];

    if (reminderModal.targetAdvisorNip === 'all' || reminderModal.targetAdvisorNip === t.pembimbing_1_nip) {
      if (t.pembimbing_1_nip) {
        targets.push({ nip: t.pembimbing_1_nip, nama: t.pembimbing_1_nama || 'Pembimbing 1' });
      }
    }
    if (reminderModal.targetAdvisorNip === 'all' || reminderModal.targetAdvisorNip === t.pembimbing_2_nip) {
      if (t.pembimbing_2_nip) {
        targets.push({ nip: t.pembimbing_2_nip, nama: t.pembimbing_2_nama || 'Pembimbing 2' });
      }
    }

    if (targets.length === 0) {
      // Fallback
      targets.push({ nip: t.pembimbing_1_nip || '197805122005011002', nama: t.pembimbing_1_nama || 'Dosen Pembimbing' });
    }

    targets.forEach(target => {
      remindAdvisorAboutThesis({
        thesisId: t.id,
        dospemNip: target.nip,
        dospemNama: target.nama,
        studentNama: t.mhs_nama,
        studentNim: t.mhs_nim,
        judul: t.judul,
        similarity: t.skor_kemiripan_terakhir,
        pesan: reminderModal.customMessage,
        channels: ['simta', 'email']
      });
    });

    setReminderModal({ isOpen: false, title: null, targetAdvisorNip: 'all', customMessage: '', isSending: false });
    showToast(`Pengingat pembimbingan berhasil dikirim ke ${targets.map(x => x.nama).join(' & ')}!`);
  };

  // Handler WhatsApp redirect
  const handleSendViaWhatsApp = () => {
    if (!reminderModal.title) return;
    const t = reminderModal.title;
    const textEncoded = encodeURIComponent(reminderModal.customMessage);
    window.open(`https://api.whatsapp.com/send?text=${textEncoded}`, '_blank');
  };

  // Handler Open Edit Academic Status
  const handleOpenEditAcademicStatus = (student) => {
    setAcademicEditModal({
      isOpen: true,
      student,
      status_kelulusan: student.status_kelulusan || (student.status === 'disetujui' && (student.id === 'title-101' || student.id === 'title-107' || student.id === 'title-108') ? 'lulus' : 'aktif_proses'),
      status_sidang: student.status_sidang || 'bimbingan',
      nilai_sidang: student.nilai_sidang || (student.status_kelulusan === 'lulus' ? '85.0 (A)' : ''),
      tanggal_lulus: student.tanggal_lulus || new Date().toISOString().split('T')[0],
      no_sk_lulus: student.no_sk_lulus || `049${Math.floor(10 + Math.random() * 90)}/UN9.1.8/AK/2026`
    });
  };

  // Handler Save Academic Status
  const handleSaveAcademicStatus = (e) => {
    e.preventDefault();
    if (!academicEditModal.student) return;

    const student = academicEditModal.student;
    const isNowLulus = academicEditModal.status_kelulusan === 'lulus';

    updateThesisAcademicStatus(student.id, {
      status_kelulusan: academicEditModal.status_kelulusan,
      status_sidang: isNowLulus ? 'selesai' : academicEditModal.status_sidang,
      nilai_sidang: isNowLulus ? (academicEditModal.nilai_sidang || '85.0 (A)') : null,
      tanggal_lulus: isNowLulus ? academicEditModal.tanggal_lulus : null,
      no_sk_lulus: isNowLulus ? academicEditModal.no_sk_lulus : null,
      status: isNowLulus ? 'disetujui' : student.status
    });

    showToast(`Status akademik ${student.mhs_nama} berhasil diperbarui menjadi ${isNowLulus ? 'LULUS' : 'AKTIF / PROSES'}!`);
    setAcademicEditModal({
      isOpen: false,
      student: null,
      status_kelulusan: 'aktif_proses',
      status_sidang: 'bimbingan',
      nilai_sidang: '',
      tanggal_lulus: '',
      no_sk_lulus: ''
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner - Pusat Pemantauan & Analitik Judul */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-blue-700/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold backdrop-blur-sm border border-blue-400/20">
            <BarChart3 className="w-3.5 h-3.5 text-blue-300" />
            <span>Pusat Pemantauan &amp; Monitoring Judul TA Prodi D3 MI</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white">
            Dashboard Pemantauan Perkembangan Judul Mahasiswa
          </h1>

          <p className="text-sm text-blue-100/90 max-w-3xl leading-relaxed">
            Pantau perkembangan dan riwayat revisi judul mahasiswa secara transparan. Sistem melacak tren penurunan similarity secara otomatis tanpa proses ACC manual, serta menyediakan koordinasi pengingat pembimbingan proaktif kepada Dosen Pembimbing.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-blue-200/90 font-medium">
            <span className="inline-flex items-center gap-1.5 bg-blue-950/60 px-3 py-1 rounded-lg border border-blue-800/50">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sistem Similarity Check Terintegrasi
            </span>
            <span className="inline-flex items-center gap-1.5 bg-blue-950/60 px-3 py-1 rounded-lg border border-blue-800/50">
              <History className="w-3.5 h-3.5 text-indigo-300" />
              Riwayat Revisi Berstempel Waktu
            </span>
            <span className="inline-flex items-center gap-1.5 bg-blue-950/60 px-3 py-1 rounded-lg border border-blue-800/50">
              <Bell className="w-3.5 h-3.5 text-amber-300" />
              Pengingat Dosen Pembimbing Langsung
            </span>
            <Link 
              href="/kaprodi/analytics" 
              className="inline-flex items-center gap-1.5 bg-indigo-500/30 hover:bg-indigo-500/40 text-indigo-200 px-3 py-1 rounded-lg border border-indigo-400/30 transition-colors md:ml-auto font-semibold hover:text-white"
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-300" />
              <span>Analitik Tren Topik (Web, Android, AI) &rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Cadence Reminder Quick Callout Banner (Point 15-17) */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200/90 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center border border-amber-300/50 shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span>Sistem Pengingat Kepatuhan Bimbingan (Minimal 2x per Bulan)</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-extrabold">
                Standar Akademik D3 MI
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Pantau mahasiswa yang terhenti bimbingan, kirim pengingat resmi melalui Gmail ke mahasiswa &amp; dosen pembimbing, serta cetak riwayat sebagai bukti proses sah monitoring Prodi.
            </p>
          </div>
        </div>

        <Link
          href="/kaprodi/reminders"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Kelola Reminder Pembimbingan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* KPI Overview Cards - Dynamic based on Threshold */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Monitored */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Total Usulan Dipantau</span>
            <BookOpen className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 pt-1">
            {kpiData.total} Mahasiswa
          </div>
          <p className="text-[11px] text-slate-500">Usulan judul aktif dalam sistem</p>
        </div>

        {/* Di Atas Ambang Batas (Perlu Perhatian) */}
        <div 
          onClick={() => setActiveFilterTab('above_threshold')}
          className={`cursor-pointer bg-white border rounded-xl p-4 shadow-2xs space-y-1 transition-all hover:shadow-md ${
            activeFilterTab === 'above_threshold' ? 'ring-2 ring-rose-500 border-rose-300 bg-rose-50/20' : 'border-slate-200 hover:border-rose-400'
          }`}
        >
          <div className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center justify-between">
            <span>Di Atas Ambang (&gt; {similarityThreshold}%)</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 pt-1">
            {kpiData.warningCount} Mahasiswa
          </div>
          <p className="text-[11px] text-rose-600 font-medium">Perlu perhatian &amp; pendampingan</p>
        </div>

        {/* Aman / Siap Bimbingan */}
        <div 
          onClick={() => setActiveFilterTab('safe')}
          className={`cursor-pointer bg-white border rounded-xl p-4 shadow-2xs space-y-1 transition-all hover:shadow-md ${
            activeFilterTab === 'safe' ? 'ring-2 ring-emerald-500 border-emerald-300 bg-emerald-50/20' : 'border-slate-200 hover:border-emerald-400'
          }`}
        >
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center justify-between">
            <span>Aman (&le; {similarityThreshold}%)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 pt-1">
            {kpiData.safeCount} Mahasiswa
          </div>
          <p className="text-[11px] text-emerald-600 font-medium">Batas aman untuk bimbingan</p>
        </div>

        {/* Telah Ada Revisi (Perkembangan) */}
        <div 
          onClick={() => setActiveFilterTab('has_revisions')}
          className={`cursor-pointer bg-white border rounded-xl p-4 shadow-2xs space-y-1 transition-all hover:shadow-md ${
            activeFilterTab === 'has_revisions' ? 'ring-2 ring-indigo-500 border-indigo-300 bg-indigo-50/20' : 'border-slate-200 hover:border-indigo-400'
          }`}
        >
          <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center justify-between">
            <span>Perkembangan Judul</span>
            <TrendingDown className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700 pt-1">
            {kpiData.withRevisionsCount} Mahasiswa
          </div>
          <p className="text-[11px] text-indigo-600">Telah mengunggah revisi judul</p>
        </div>

        {/* Judul Fix / Disetujui */}
        <div 
          onClick={() => setActiveFilterTab('fix')}
          className={`cursor-pointer bg-white border rounded-xl p-4 shadow-2xs space-y-1 transition-all hover:shadow-md ${
            activeFilterTab === 'fix' ? 'ring-2 ring-teal-500 border-teal-300 bg-teal-50/20' : 'border-slate-200 hover:border-teal-400'
          }`}
        >
          <div className="text-xs font-bold text-teal-800 uppercase tracking-wider flex items-center justify-between">
            <span>Judul Fix</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-teal-700 pt-1">
            {kpiData.fixCount} Judul
          </div>
          <p className="text-[11px] text-teal-600">Disetujui final dalam rapat prodi</p>
        </div>

      </div>

      {/* Threshold Control Bar & Dynamic Filter Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        
        {/* Row 1: Ambang Batas (Threshold) Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-900">
                Ambang Batas Maksimal Similarity (Threshold Toleransi)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-extrabold font-mono">
                {similarityThreshold}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Judul dengan skor kemiripan di bawah threshold ini dianggap aman untuk melanjutkan pembimbingan proposal.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-600">Pilih Threshold:</span>
            {[20, 25, 30, 35, 40].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setSimilarityThreshold(val)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  similarityThreshold === val
                    ? 'bg-indigo-600 text-white shadow-xs scale-105'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {val}% {val === 30 && <span className="text-[9px] font-normal opacity-80">(Standar)</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Search, Sort, Filter Tabs, and Advisor Select */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1">
          
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama mahasiswa, NIM, judul TA, atau nama pembimbing..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Advisor Filter Dropdown */}
          <div className="w-full sm:w-auto min-w-[200px]">
            <select
              value={selectedAdvisorFilter}
              onChange={(e) => setSelectedAdvisorFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700"
            >
              <option value="">Semua Dosen Pembimbing</option>
              {advisorOptions.map(adv => (
                <option key={adv.nip} value={adv.nip}>{adv.nama}</option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Urutkan:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-2 px-3 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-bold text-slate-800"
            >
              <option value="similarity_desc">Similarity Tertinggi (High &rarr; Low)</option>
              <option value="similarity_asc">Similarity Terendah (Low &rarr; High)</option>
              <option value="improved">Penurunan Terbesar (Paling Membaik)</option>
              <option value="newest">Terbaru Diperbarui</option>
              <option value="name">Nama Mahasiswa (A &rarr; Z)</option>
            </select>
          </div>

        </div>

        {/* Row 3: Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Filter Kategori:</span>
          
          <button
            type="button"
            onClick={() => setActiveFilterTab('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              activeFilterTab === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Judul ({thesisTitles.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilterTab('above_threshold')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeFilterTab === 'above_threshold'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Di Atas Ambang &gt;{similarityThreshold}% ({kpiData.warningCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilterTab('safe')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeFilterTab === 'safe'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Aman &le;{similarityThreshold}% ({kpiData.safeCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilterTab('has_revisions')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeFilterTab === 'has_revisions'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Ada Perkembangan Revisi ({kpiData.withRevisionsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilterTab('fix')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeFilterTab === 'fix'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Judul Fix ({kpiData.fixCount})</span>
          </button>

          {activeFilterTab !== 'all' && (
            <button
              onClick={() => setActiveFilterTab('all')}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 underline ml-2"
            >
              Reset Filter
            </button>
          )}
        </div>

      </div>

      {/* Main Monitoring Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        
        {/* Table Subheader */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Matriks Pemantauan Similarity &amp; Perkembangan Judul Tugas Akhir</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Menampilkan {filteredAndSortedTitles.length} dari {thesisTitles.length} pengajuan judul mahasiswa berdasarkan kriteria filter.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link 
              href="/kaprodi/titles" 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors"
            >
              <span>Halaman Tinjau Judul Formal</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </Link>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Mahasiswa</th>
                <th className="py-3 px-4 min-w-[280px]">Judul yang Diusulkan</th>
                <th className="py-3 px-4 min-w-[180px]">
                  <div className="flex items-center gap-1">
                    <span>Persentase Similarity</span>
                    <span className="text-[9px] text-slate-400 font-normal">(Ambang {similarityThreshold}%)</span>
                  </div>
                </th>
                <th className="py-3 px-4 min-w-[200px]">Dosen Pembimbing</th>
                <th className="py-3 px-4 min-w-[170px]">Perkembangan / Riwayat</th>
                <th className="py-3 px-4 text-right">Aksi Pemantauan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedTitles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Tidak ada data judul yang cocok dengan filter</p>
                    <p className="text-[11px] text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau ubah ambang batas similarity.</p>
                  </td>
                </tr>
              ) : (
                filteredAndSortedTitles.map((t) => {
                  const currentScore = Number(t.skor_kemiripan_terakhir) || 0;
                  const colorMeta = getSimilarityColorMeta(currentScore, similarityThreshold);

                  // Calculate similarity trend if revisions exist
                  const initialScore = t.skor_awal !== undefined ? Number(t.skor_awal) : (
                    Array.isArray(t.riwayat_revisi) && t.riwayat_revisi.length > 0
                      ? Number(t.riwayat_revisi[t.riwayat_revisi.length - 1].skor_similarity)
                      : currentScore
                  );
                  const scoreDelta = (initialScore || currentScore) - currentScore;
                  const hasSignificantDrop = scoreDelta > 0.5;

                  const revisionCount = Array.isArray(t.riwayat_revisi) ? t.riwayat_revisi.length : 1;
                  const hasReminded = (t.jumlah_diingatkan || 0) > 0;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      
                      {/* Mahasiswa Info */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 align-top">
                        <div className="text-xs text-slate-900 font-bold">{t.mhs_nama}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {t.mhs_nim} <span className="text-slate-300">&bull;</span> {t.mhs_kelas}
                        </div>
                        <div className="mt-1.5">
                          <StatusBadge type="thesis" status={t.status} size="sm" />
                        </div>
                      </td>

                      {/* Judul yang Diusulkan */}
                      <td className="py-3.5 px-4 text-slate-800 align-top">
                        <p className="font-medium text-xs text-slate-900 leading-snug">
                          {t.judul}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => setHistoryModal({ isOpen: true, title: t })}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                          >
                            <History className="w-3 h-3" />
                            <span>Lihat Catatan &amp; Log ({revisionCount})</span>
                          </button>
                        </div>
                      </td>

                      {/* Persentase Similarity with Dynamic Color Scale */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1.5">
                          
                          {/* Score & Threshold Badge */}
                          <div className="flex items-center justify-between">
                            <span className={`text-xl font-black ${colorMeta.scoreText}`}>
                              {currentScore.toFixed(1)}%
                            </span>

                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${colorMeta.badgeClass}`}>
                              {colorMeta.isAboveThreshold ? 'Di Atas Ambang' : 'Aman Lanjut'}
                            </span>
                          </div>

                          {/* Progress Meter Bar */}
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${colorMeta.progressBar}`}
                              style={{ width: `${Math.min(100, Math.max(5, currentScore))}%` }}
                            />
                          </div>

                          {/* Similarity Trend Drop Badge (Point 10: Persentase similarity berubah/turun) */}
                          {hasSignificantDrop ? (
                            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <TrendingDown className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>Turun dari {initialScore}% (-{scoreDelta.toFixed(1)}%)</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400">
                              Status: {colorMeta.statusLabel}
                            </div>
                          )}

                        </div>
                      </td>

                      {/* Dosen Pembimbing */}
                      <td className="py-3.5 px-4 text-slate-700 align-top space-y-1">
                        <div>
                          <div className="text-[10px] text-slate-400 font-semibold uppercase">Pembimbing 1</div>
                          <div className="font-semibold text-xs text-slate-900">
                            {t.pembimbing_1_nama || t.pembimbing_1 || <span className="text-slate-400 italic">Belum ditentukan</span>}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] text-slate-400 font-semibold uppercase mt-1">Pembimbing 2</div>
                          <div className="font-semibold text-xs text-slate-900">
                            {t.pembimbing_2_nama || t.pembimbing_2 || <span className="text-slate-400 italic">Belum ditentukan</span>}
                          </div>
                        </div>
                      </td>

                      {/* Perkembangan / Riwayat */}
                      <td className="py-3.5 px-4 text-slate-600 align-top space-y-1">
                        <div className="text-xs font-semibold text-slate-800">
                          {revisionCount > 1 ? (
                            <span className="text-indigo-700 font-bold">Revisi ke-{revisionCount - 1}</span>
                          ) : (
                            <span className="text-slate-500 font-medium">Pengajuan Awal</span>
                          )}
                        </div>

                        {/* Advisor reminder status badge */}
                        {hasReminded ? (
                          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Bell className="w-3 h-3 text-amber-600" />
                            <span>Diingatkan {t.jumlah_diingatkan}x</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400">
                            Belum ada pengingat
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400">
                          {t.updated_at ? new Date(t.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="py-3.5 px-4 text-right align-top space-y-1.5">
                        
                        {/* Tombol Ingatkan Dosen Pembimbing (Point 14) */}
                        <button
                          type="button"
                          onClick={() => handleOpenReminder(t)}
                          className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                            colorMeta.isAboveThreshold 
                              ? 'bg-amber-600 text-white hover:bg-amber-700 ring-2 ring-amber-300' 
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                          title="Kirimkan notifikasi kepada Dosen Pembimbing agar mahasiswa dibimbing intensif"
                        >
                          <Bell className={`w-3.5 h-3.5 ${colorMeta.isAboveThreshold ? 'text-white' : 'text-amber-500'}`} />
                          <span>Ingatkan Dospem</span>
                        </button>

                        <div>
                          <button
                            type="button"
                            onClick={() => setHistoryModal({ isOpen: true, title: t })}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                          >
                            <span>Detail Perkembangan</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>

                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* DASHBOARD STATUS AKADEMIK & KELULUSAN MAHASISWA D3 MANAJEMEN INFORMATIKA */}
      {/* Fokus D3 (Point 18): Tanpa Sempro/Semhas (Point 19), Bedakan Aktif vs Lulus (Point 20) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase tracking-wider">
                Khusus Jenjang D3 Manajemen Informatika
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Alur Bebas Sempro &amp; Semhas
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <span>Dashboard Status Akademik &amp; Kelulusan Mahasiswa D3</span>
            </h3>
            
            <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
              Fokus sistem diselaraskan dengan kurikulum D3: Mahasiswa yang usulan judulnya telah disetujui langsung menjalani proses pembimbingan intensif menuju <strong>Sidang Akhir Tugas Akhir D3</strong> dan penetapan status <strong>Kelulusan</strong> (tanpa tahapan Seminar Proposal / Seminar Hasil yang terpisah).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/kaprodi/defense-schedules" 
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition-colors"
            >
              <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
              <span>Jadwal Sidang Akhir D3</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* D3 Academic Summary Cards (Point 18, 20) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Mahasiswa TA D3</span>
            <div className="text-xl font-black text-slate-900">{academicKpi.total} Mahasiswa</div>
            <p className="text-[10px] text-slate-500">Angkatan 2023 tingkat akhir</p>
          </div>

          <div 
            onClick={() => setAcademicFilterTab('aktif')}
            className={`cursor-pointer rounded-xl p-3.5 border transition-all ${
              academicFilterTab === 'aktif' 
                ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400' 
                : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-bold text-blue-700 uppercase tracking-wider">
              <span>Aktif / Dalam Proses TA</span>
              <Clock className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-xl font-black text-blue-800">{academicKpi.aktifCount} Mahasiswa</div>
            <p className="text-[10px] text-blue-600 font-medium">
              {academicKpi.scheduledCount} Terjadwal &bull; {academicKpi.readyCount} Siap Sidang &bull; {academicKpi.bimbinganCount} Bimbingan
            </p>
          </div>

          <div 
            onClick={() => setAcademicFilterTab('lulus')}
            className={`cursor-pointer rounded-xl p-3.5 border transition-all ${
              academicFilterTab === 'lulus' 
                ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400' 
                : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              <span>Sudah Lulus TA D3</span>
              <Award className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-emerald-800">{academicKpi.lulusCount} Mahasiswa</div>
            <p className="text-[10px] text-emerald-600 font-medium">Lulus Sidang &amp; Berita Acara Sah</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tingkat Kelulusan Angkatan</span>
            <div className="text-xl font-black text-indigo-700">{academicKpi.graduationRate}%</div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mt-1">
              <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${academicKpi.graduationRate}%` }} />
            </div>
          </div>

        </div>

        {/* Filters & Search Toolbar (Point 20) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          
          {/* Filter Status Tabs (Aktif vs Lulus) */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setAcademicFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                academicFilterTab === 'all' 
                  ? 'bg-white text-slate-900 shadow-2xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Mahasiswa D3 ({academicKpi.total})
            </button>
            <button
              type="button"
              onClick={() => setAcademicFilterTab('aktif')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                academicFilterTab === 'aktif' 
                  ? 'bg-blue-600 text-white shadow-2xs font-bold' 
                  : 'text-blue-700 hover:text-blue-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>Aktif / Proses TA ({academicKpi.aktifCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setAcademicFilterTab('lulus')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                academicFilterTab === 'lulus' 
                  ? 'bg-emerald-600 text-white shadow-2xs font-bold' 
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sudah Lulus ({academicKpi.lulusCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={academicSearch}
              onChange={(e) => setAcademicSearch(e.target.value)}
              placeholder="Cari nama, NIM, judul..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            />
            {academicSearch && (
              <button 
                type="button" 
                onClick={() => setAcademicSearch('')} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

        </div>

        {/* Clean D3 Academic & Graduation Table (Point 18, 19, 20) */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Mahasiswa D3 MI</th>
                <th className="py-3 px-4">Judul Tugas Akhir D3 &amp; Dospem</th>
                <th className="py-3 px-3 text-center">Similarity</th>
                <th className="py-3 px-4 text-center">Proses Sidang Akhir D3</th>
                <th className="py-3 px-4 text-center">Status Kelulusan</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAcademicStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada mahasiswa yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredAcademicStudents.map(t => {
                  const isLulus = t.status_kelulusan === 'lulus' || t.status_sidang === 'selesai';
                  const isScheduled = t.status_sidang === 'terjadwal';
                  const isReady = t.status_sidang === 'siap_daftar';
                  const simScore = Number(t.skor_kemiripan_terakhir) || 0;
                  const colorMeta = getSimilarityColorMeta(simScore, similarityThreshold);

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      
                      {/* Mahasiswa Info */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 align-top">
                        <div className="font-bold text-slate-900 text-xs">{t.mhs_nama}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{t.mhs_nim}</div>
                        <div className="inline-flex items-center gap-1 mt-1">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {t.mhs_kelas || 'MI 5A'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Angkatan {t.angkatan || '2023'}
                          </span>
                        </div>
                      </td>

                      {/* Judul & Tim Dospem */}
                      <td className="py-3.5 px-4 align-top max-w-sm">
                        <div className="font-medium text-slate-800 text-xs leading-snug line-clamp-2" title={t.judul}>
                          {t.judul}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap items-center gap-1">
                          <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>P1: {t.pembimbing_1_nama || t.pembimbing_1 || '-'}</span>
                          {t.pembimbing_2_nama && (
                            <span>&bull; P2: {t.pembimbing_2_nama}</span>
                          )}
                        </div>
                      </td>

                      {/* Similarity */}
                      <td className="py-3.5 px-3 text-center align-top">
                        <div className="inline-flex flex-col items-center">
                          <span className={`text-xs font-black ${colorMeta.scoreText}`}>
                            {t.skor_kemiripan_terakhir}%
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border mt-0.5 ${colorMeta.badgeClass}`}>
                            {simScore <= similarityThreshold ? 'Aman' : 'Tinggi'}
                          </span>
                        </div>
                      </td>

                      {/* Proses Sidang Akhir D3 (Point 19: Focus on Sidang Akhir) */}
                      <td className="py-3.5 px-4 text-center align-top">
                        {isLulus ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Sidang Akhir Selesai</span>
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5">
                              {t.tanggal_lulus ? new Date(t.tanggal_lulus).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Telah Diuji'}
                            </span>
                          </div>
                        ) : isScheduled ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                              <CalendarDays className="w-3 h-3 text-indigo-600" />
                              <span>Terjadwal Sidang Akhir</span>
                            </span>
                            <span className="text-[10px] text-indigo-700 font-semibold mt-0.5">
                              {t.jadwal_sidang?.tanggal ? new Date(t.jadwal_sidang.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '25 Okt 2026'} &bull; {t.jadwal_sidang?.ruangan || 'Ruang Sidang'}
                            </span>
                          </div>
                        ) : isReady ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                              <Check className="w-3 h-3 text-teal-600" />
                              <span>Siap Daftar Sidang</span>
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5">
                              Bimbingan &ge;2x/Bulan Lengkap
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>Bimbingan Intensif TA</span>
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              Penyusunan Tugas Akhir
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Status Kelulusan (Point 20: Membedakan Aktif vs Lulus) */}
                      <td className="py-3.5 px-4 text-center align-top">
                        {isLulus ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black shadow-2xs">
                              <Award className="w-3.5 h-3.5" />
                              <span>LULUS TA D3</span>
                            </span>
                            <span className="text-[11px] font-bold text-emerald-800 mt-1">
                              Nilai: {t.nilai_sidang || '88.5 (A)'}
                            </span>
                            {t.no_sk_lulus && (
                              <span className="text-[9px] text-slate-500 font-mono">
                                SK: {t.no_sk_lulus}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                              <span>AKTIF / PROSES</span>
                            </span>
                            <span className="text-[10px] text-slate-500 mt-1">
                              Tingkat Akhir D3
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-3 text-right align-top space-y-1.5">
                        <div>
                          <button
                            type="button"
                            onClick={() => setAcademicDetailModal({ isOpen: true, student: t })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors"
                            title="Lihat detail status perjalanan akademik mahasiswa D3"
                          >
                            <FileText className="w-3 h-3 text-slate-500" />
                            <span>Detail Status</span>
                          </button>
                        </div>

                        <div>
                          <button
                            type="button"
                            onClick={() => handleOpenEditAcademicStatus(t)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-indigo-700 hover:bg-indigo-50 border border-indigo-200 text-[11px] font-semibold transition-colors"
                            title="Perbarui status kelulusan / nilai sidang"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Ubah Status</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal 1: Ingatkan Dosen Pembimbing (Point 14) */}
      {reminderModal.isOpen && reminderModal.title && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Ingatkan Dosen Pembimbing
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kirim informasi dari Prodi agar mahasiswa dibimbing intensif
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => setReminderModal({ isOpen: false, title: null, targetAdvisorNip: 'all', customMessage: '', isSending: false })}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student & Title Brief Summary */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">{reminderModal.title.mhs_nama}</span>
                <span className="font-mono text-slate-500">{reminderModal.title.mhs_nim} ({reminderModal.title.mhs_kelas})</span>
              </div>
              <p className="text-xs text-slate-700 italic font-serif">
                &ldquo;{reminderModal.title.judul}&rdquo;
              </p>
              
              <div className="flex items-center gap-3 pt-1 text-xs">
                <span className="text-slate-500">Skor Similarity:</span>
                <span className="font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {reminderModal.title.skor_kemiripan_terakhir}%
                </span>
                <span className="text-[11px] text-slate-400">
                  (Ambang batas aman prodi: &le; {similarityThreshold}%)
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSendReminder} className="space-y-4">
              
              {/* Select Target Advisor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tujukan Pengingat Kepada:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    reminderModal.targetAdvisorNip === 'all' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input 
                      type="radio" 
                      name="targetAdvisor" 
                      checked={reminderModal.targetAdvisorNip === 'all'} 
                      onChange={() => setReminderModal(prev => ({ ...prev, targetAdvisorNip: 'all' }))}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-bold text-slate-900">Semua Pembimbing</div>
                      <div className="text-[10px] text-slate-500">Dospem 1 &amp; Dospem 2</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    reminderModal.targetAdvisorNip === reminderModal.title.pembimbing_1_nip ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input 
                      type="radio" 
                      name="targetAdvisor" 
                      checked={reminderModal.targetAdvisorNip === reminderModal.title.pembimbing_1_nip} 
                      onChange={() => setReminderModal(prev => ({ ...prev, targetAdvisorNip: reminderModal.title.pembimbing_1_nip }))}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-bold text-slate-900 truncate max-w-[150px]">{reminderModal.title.pembimbing_1_nama || 'Pembimbing 1'}</div>
                      <div className="text-[10px] text-slate-500">Dosen Pembimbing Utama</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Message Template */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pesan Pengingat Prodi (Dapat Diedit):
                </label>
                <textarea
                  rows={4}
                  value={reminderModal.customMessage}
                  onChange={(e) => setReminderModal(prev => ({ ...prev, customMessage: e.target.value }))}
                  required
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-800 leading-relaxed"
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSendViaWhatsApp}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kirim via WhatsApp Web</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setReminderModal({ isOpen: false, title: null, targetAdvisorNip: 'all', customMessage: '', isSending: false })}
                    className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={reminderModal.isSending}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{reminderModal.isSending ? 'Mengirim...' : 'Kirim Notifikasi SIMTA'}</span>
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal 2: Riwayat & Log Perkembangan Judul */}
      {historyModal.isOpen && historyModal.title && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Log Riwayat Perkembangan Judul
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {historyModal.title.mhs_nama} ({historyModal.title.mhs_nim})
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setHistoryModal({ isOpen: false, title: null })}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Summary Card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">Judul Saat Ini:</div>
              <p className="text-xs text-slate-900 font-semibold leading-relaxed">
                {historyModal.title.judul}
              </p>
              <div className="flex items-center gap-3 pt-1 text-xs">
                <span className="text-slate-500">Skor Terkini:</span>
                <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {historyModal.title.skor_kemiripan_terakhir}%
                </span>
                <StatusBadge type="thesis" status={historyModal.title.status} size="sm" />
              </div>
            </div>

            {/* Timeline of Revisions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Kronologi Riwayat Perubahan &amp; Catatan:</span>
              </h4>

              <div className="space-y-3 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 pl-8">
                {(Array.isArray(historyModal.title.riwayat_revisi) && historyModal.title.riwayat_revisi.length > 0) ? (
                  historyModal.title.riwayat_revisi.map((rev, idx) => (
                    <div key={rev.id || idx} className="relative bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-1.5">
                      <span className="absolute -left-[27px] top-3.5 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white ring-2 ring-indigo-200" />
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-slate-900 capitalize">
                          {rev.tipe === 'pengajuan_awal' && 'Usulan Awal Mahasiswa'}
                          {rev.tipe === 'revisi_mahasiswa' && 'Pembaruan / Revisi Judul'}
                          {rev.tipe === 'catatan_prodi' && 'Catatan Rapat Pembahasan Prodi'}
                          {rev.tipe === 'judul_fix' && 'Penetapan Judul Fix'}
                          {!['pengajuan_awal', 'revisi_mahasiswa', 'catatan_prodi', 'judul_fix'].includes(rev.tipe) && rev.tipe}
                        </span>

                        <span className="text-[10px] text-slate-400 font-mono">
                          {rev.tanggal ? new Date(rev.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                        </span>
                      </div>

                      {rev.judul && (
                        <p className="text-xs font-medium text-slate-800 italic">
                          &ldquo;{rev.judul}&rdquo;
                        </p>
                      )}

                      {rev.skor_similarity !== undefined && (
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                          <span>Similarity:</span>
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800">
                            {rev.skor_similarity}%
                          </span>
                        </div>
                      )}

                      {rev.catatan && (
                        <div className="bg-slate-50 p-2.5 rounded-lg text-xs text-slate-700 border border-slate-100 mt-1">
                          <span className="font-semibold text-slate-800">Catatan: </span>
                          {rev.catatan}
                        </div>
                      )}

                      <div className="text-[10px] text-slate-400 text-right pt-0.5">
                        Oleh: {rev.oleh || 'Sistem'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 py-3">
                    Belum ada riwayat perbaikan yang tercatat.
                  </div>
                )}
              </div>
            </div>

            {/* Riwayat Pengingat Dosen (Point 14) */}
            {Array.isArray(historyModal.title.riwayat_pengingat_prodi) && historyModal.title.riwayat_pengingat_prodi.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-600" />
                  <span>Riwayat Pengingat ke Dosen Pembimbing:</span>
                </h4>

                <div className="space-y-2">
                  {historyModal.title.riwayat_pengingat_prodi.map((rem, i) => (
                    <div key={rem.id || i} className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-amber-900">
                        <span>Penerima: {rem.dospem_nama}</span>
                        <span className="text-[10px] text-amber-700 font-normal">
                          {new Date(rem.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-amber-800 text-[11px] leading-relaxed">
                        {rem.pesan}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-2 flex justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setHistoryModal({ isOpen: false, title: null })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal 3: Detail Status Akademik & Kelulusan Mahasiswa D3 (Point 18, 19, 20) */}
      {academicDetailModal.isOpen && academicDetailModal.student && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200 shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Kartu Status Akademik Mahasiswa D3
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Prodi D3 Manajemen Informatika &bull; Angkatan {academicDetailModal.student.angkatan || '2023'}
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setAcademicDetailModal({ isOpen: false, student: null })}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Kelulusan Callout Banner */}
            {(academicDetailModal.student.status_kelulusan === 'lulus' || academicDetailModal.student.status_sidang === 'selesai') ? (
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-emerald-600 text-white">
                      <Award className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                      Status Kelulusan: SUDAH LULUS TA D3
                    </span>
                  </div>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                    Nilai: {academicDetailModal.student.nilai_sidang || '88.5 (A)'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-emerald-950 pt-1">
                  <div>
                    <span className="text-emerald-700">Tanggal Lulus: </span>
                    <span className="font-semibold">{academicDetailModal.student.tanggal_lulus ? new Date(academicDetailModal.student.tanggal_lulus).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '28 September 2026'}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700">No. SK Kelulusan: </span>
                    <span className="font-mono font-bold">{academicDetailModal.student.no_sk_lulus || '0482/UN9.1.8/AK/2026'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                  <div>
                    <div className="text-xs font-bold text-blue-900">Status: AKTIF / DALAM PROSES TA D3</div>
                    <div className="text-[11px] text-blue-700 mt-0.5">
                      Tahap: {academicDetailModal.student.status_sidang === 'terjadwal' ? 'Terjadwal Sidang Akhir D3' : academicDetailModal.student.status_sidang === 'siap_daftar' ? 'Siap Daftar Sidang Akhir' : 'Dalam Bimbingan Intensif TA'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const st = academicDetailModal.student;
                    setAcademicDetailModal({ isOpen: false, student: null });
                    handleOpenEditAcademicStatus(st);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Tetapkan Lulus
                </button>
              </div>
            )}

            {/* Student & Thesis Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">Nama Mahasiswa:</span>
                <span className="font-bold text-slate-900 text-sm">{academicDetailModal.student.mhs_nama}</span>
              </div>
              <div>
                <span className="text-slate-500 block">NIM &amp; Kelas:</span>
                <span className="font-bold text-slate-900 font-mono">{academicDetailModal.student.mhs_nim} &bull; {academicDetailModal.student.mhs_kelas || 'MI 5A'}</span>
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-slate-200/60">
                <span className="text-slate-500 block">Judul Tugas Akhir D3:</span>
                <span className="font-semibold text-slate-900 leading-relaxed block mt-0.5">{academicDetailModal.student.judul}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Dosen Pembimbing 1:</span>
                <span className="font-semibold text-slate-800">{academicDetailModal.student.pembimbing_1_nama || academicDetailModal.student.pembimbing_1 || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Dosen Pembimbing 2:</span>
                <span className="font-semibold text-slate-800">{academicDetailModal.student.pembimbing_2_nama || academicDetailModal.student.pembimbing_2 || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Skor Kemiripan (Similarity):</span>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {academicDetailModal.student.skor_kemiripan_terakhir}% (Aman &le; {similarityThreshold}%)
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Kepatuhan Bimbingan:</span>
                <span className="font-bold text-emerald-700">
                  Terpenuhi (Standar Minimal 2x/Bulan)
                </span>
              </div>
            </div>

            {/* Defense Schedule / Results (Sidang Akhir D3) */}
            <div className="space-y-2 border border-slate-200 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                <span>Rincian Pelaksanaan Sidang Akhir Tugas Akhir D3</span>
              </h4>

              {academicDetailModal.student.jadwal_sidang ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-500">Tanggal &amp; Waktu: </span>
                    <span className="font-semibold text-slate-800">
                      {academicDetailModal.student.jadwal_sidang.tanggal ? new Date(academicDetailModal.student.jadwal_sidang.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'} ({academicDetailModal.student.jadwal_sidang.waktu || '09:00 - 10:30'})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Ruangan: </span>
                    <span className="font-semibold text-slate-800">{academicDetailModal.student.jadwal_sidang.ruangan || 'Ruang Sidang Utama DIPKOM'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Ketua Penguji: </span>
                    <span className="font-semibold text-slate-800">{academicDetailModal.student.jadwal_sidang.ketua_penguji || 'Dr. Ir. Hendra Kusuma, M.T.'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Anggota Penguji: </span>
                    <span className="font-semibold text-slate-800">{academicDetailModal.student.jadwal_sidang.penguji || 'Nurul Hidayah, M.Kom.'}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic pt-1">
                  Belum ada jadwal sidang akhir spesifik. Mahasiswa sedang dalam tahap bimbingan intensif penyusunan tugas akhir.
                </p>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Lembar Status</span>
              </button>

              <button
                type="button"
                onClick={() => setAcademicDetailModal({ isOpen: false, student: null })}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal 4: Ubah / Tetapkan Status Kelulusan Mahasiswa D3 (Point 20) */}
      {academicEditModal.isOpen && academicEditModal.student && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-200 shrink-0">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Perbarui Status Akademik Mahasiswa D3
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {academicEditModal.student.mhs_nama} ({academicEditModal.student.mhs_nim})
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setAcademicEditModal({ isOpen: false, student: null, status_kelulusan: 'aktif_proses', status_sidang: 'bimbingan', nilai_sidang: '', tanggal_lulus: '', no_sk_lulus: '' })}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Edit */}
            <form onSubmit={handleSaveAcademicStatus} className="space-y-4 text-xs">
              
              {/* Pilihan Status Mahasiswa: Aktif vs Lulus */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Status Mahasiswa (Point 20)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAcademicEditModal(prev => ({ ...prev, status_kelulusan: 'aktif_proses' }))}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      academicEditModal.status_kelulusan === 'aktif_proses'
                        ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-300 text-blue-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Aktif / Dalam Proses TA</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 font-normal">
                      Masih bimbingan atau siap/terjadwal sidang
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAcademicEditModal(prev => ({ ...prev, status_kelulusan: 'lulus' }))}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      academicEditModal.status_kelulusan === 'lulus'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-300 text-emerald-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Sudah Lulus TA D3</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 font-normal">
                      Telah selesai Sidang Akhir &amp; Yudisium
                    </div>
                  </button>
                </div>
              </div>

              {/* Detail jika LULUS */}
              {academicEditModal.status_kelulusan === 'lulus' ? (
                <div className="space-y-3 bg-emerald-50/50 border border-emerald-200 p-3.5 rounded-xl">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nilai Sidang Akhir:</label>
                    <input
                      type="text"
                      value={academicEditModal.nilai_sidang}
                      onChange={(e) => setAcademicEditModal(prev => ({ ...prev, nilai_sidang: e.target.value }))}
                      placeholder="Contoh: 88.5 (A)"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tanggal Kelulusan:</label>
                    <input
                      type="date"
                      value={academicEditModal.tanggal_lulus}
                      onChange={(e) => setAcademicEditModal(prev => ({ ...prev, tanggal_lulus: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nomor SK Kelulusan:</label>
                    <input
                      type="text"
                      value={academicEditModal.no_sk_lulus}
                      onChange={(e) => setAcademicEditModal(prev => ({ ...prev, no_sk_lulus: e.target.value }))}
                      placeholder="Contoh: 0482/UN9.1.8/AK/2026"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
                    />
                  </div>
                </div>
              ) : (
                /* Detail jika AKTIF / PROSES */
                <div className="space-y-1.5 bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                  <label className="font-bold text-slate-700 block">Tahap Sidang Akhir Saat Ini:</label>
                  <select
                    value={academicEditModal.status_sidang}
                    onChange={(e) => setAcademicEditModal(prev => ({ ...prev, status_sidang: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
                  >
                    <option value="bimbingan">Dalam Proses Bimbingan Intensif TA (min. 2x/bulan)</option>
                    <option value="siap_daftar">Siap Daftar Sidang Akhir D3 (Bimbingan terpenuhi)</option>
                    <option value="terjadwal">Terjadwal Sidang Akhir D3 (Tanggal &amp; Ruangan siap)</option>
                  </select>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAcademicEditModal({ isOpen: false, student: null, status_kelulusan: 'aktif_proses', status_sidang: 'bimbingan', nilai_sidang: '', tanggal_lulus: '', no_sk_lulus: '' })}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  Simpan Status Akademik
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
