import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link } from '@inertiajs/react';
import StatusBadge from '../../Components/common/StatusBadge.jsx';
import { 
  calculateBimbinganDashboardStats,
  MONTH_NAMES
} from '../../lib/bimbinganDashboardData.js';
import { 
  Users, 
  UserCheck, 
  FileCheck, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Calendar, 
  CalendarDays, 
  Clock, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Download, 
  FileSpreadsheet, 
  RefreshCw, 
  ChevronRight, 
  X, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  Globe, 
  Building2, 
  Check, 
  SlidersHorizontal, 
  Bell, 
  Send, 
  History, 
  GraduationCap, 
  FileText, 
  Printer, 
  Edit3,
  Layers,
  ArrowRight
} from 'lucide-react';
import { getSimilarityColorMeta } from './DashboardKaprodiSimilarityHelper.js';

/**
 * Reusable interactive SVG Donut Chart with center tooltip and legend
 */
function DonutChart({
  items = [],
  total,
  totalLabel = 'Total Sesi',
  centerTitle,
  size = 165,
  strokeWidth = 20,
  innerRadius = 55
}) {
  const [hoveredItem, setHoveredItem] = useState(null);
  const activeItem = hoveredItem || null;

  const radius = innerRadius;
  const circumference = 2 * Math.PI * radius;
  const effectiveTotal = total || items.reduce((acc, it) => acc + (Number(it.count) || 0), 0);

  let currentOffset = 0;
  const gap = items.length > 1 ? 2.5 : 0;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 160 160"
          className="w-full h-full transform -rotate-90"
        >
          {/* Background track circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {effectiveTotal > 0 && items.map((item, idx) => {
            const count = Number(item.count) || 0;
            const fraction = count / effectiveTotal;
            const rawLength = fraction * circumference;
            const dashLength = Math.max(0, rawLength - gap);
            const spaceLength = circumference - dashLength;
            const offset = currentOffset + (gap / 2);
            currentOffset += rawLength;

            const isHovered = activeItem && activeItem.id === item.id;

            return (
              <circle
                key={item.id || idx}
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={`${dashLength} ${spaceLength}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredItem(item)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  filter: isHovered ? 'drop-shadow(0 2px 5px rgba(0,0,0,0.25))' : 'none',
                  opacity: activeItem && !isHovered ? 0.5 : 1
                }}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 pointer-events-none">
          <span className="text-xl font-black text-slate-900 tracking-tight leading-none">
            {activeItem ? activeItem.count.toLocaleString('id-ID') : effectiveTotal.toLocaleString('id-ID')}
          </span>
          <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider line-clamp-1 max-w-[95px]">
            {activeItem ? activeItem.label : (centerTitle || totalLabel)}
          </span>
          <span className="text-[10px] font-extrabold text-indigo-600 mt-0.5">
            {activeItem ? `${activeItem.percentage}%` : '100%'}
          </span>
        </div>
      </div>

      {/* Legend list below */}
      <div className="w-full mt-3 space-y-1.5 pt-2 border-t border-slate-100 text-xs">
        {items.map((item, idx) => {
          const isHovered = activeItem && activeItem.id === item.id;
          return (
            <div
              key={item.id || idx}
              onMouseEnter={() => setHoveredItem(item)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors ${
                isHovered ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate text-[11px] font-medium text-slate-800">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-mono font-bold text-[11px] text-slate-900">
                  {item.count.toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600">
                  {item.percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardKaprodi() {
  const { 
    thesisTitles = [], 
    thesisStages = [], 
    bookings = [], 
    defenseSchedules = [], 
    advisors = [], 
    studentAdvisors = [],
    consultations = [],
    registeredUsers = [],
    remindAdvisorAboutThesis,
    updateThesisAcademicStatus 
  } = useAuth();

  // Active Main Navigation Tab: 'ringkasan_prodi' (Default) | 'pemantauan_judul'
  const [activeMainTab, setActiveMainTab] = useState('ringkasan_prodi');

  // =========================================================================
  // 1. DATA COMPUTATION FOR RINGKASAN KONDISI BIMBINGAN SELURUH PRODI
  // =========================================================================
  const dashboardStats = useMemo(() => {
    return calculateBimbinganDashboardStats(
      advisors,
      studentAdvisors,
      consultations,
      thesisTitles,
      registeredUsers
    );
  }, [advisors, studentAdvisors, consultations, thesisTitles, registeredUsers]);

  // Sorting state for Beban Bimbingan per Dosen
  const [workloadSortBy, setWorkloadSortBy] = useState('total_desc'); // 'total_desc' | 'disparity_desc' | 'balanced' | 'name'

  // Sorted Workload List
  const sortedWorkloads = useMemo(() => {
    const list = [...dashboardStats.advisorWorkloads];
    if (workloadSortBy === 'total_desc') {
      list.sort((a, b) => b.totalBeban - a.totalBeban);
    } else if (workloadSortBy === 'disparity_desc') {
      list.sort((a, b) => b.selisih - a.selisih);
    } else if (workloadSortBy === 'balanced') {
      list.sort((a, b) => a.selisih - b.selisih);
    } else if (workloadSortBy === 'name') {
      list.sort((a, b) => a.nama.localeCompare(b.nama));
    }
    return list;
  }, [dashboardStats.advisorWorkloads, workloadSortBy]);

  // Selected Month Modal State (Drilldown Chart Bimbingan per Bulan)
  const [selectedMonthModal, setSelectedMonthModal] = useState({
    isOpen: false,
    monthData: null
  });
  const [monthModalSearch, setMonthModalSearch] = useState('');
  const [monthModalAdvisorFilter, setMonthModalAdvisorFilter] = useState('');
  const [monthModalMethodFilter, setMonthModalMethodFilter] = useState('all');
  const [monthModalStatusFilter, setMonthModalStatusFilter] = useState('all');

  // Filtered consultations inside Month Modal
  const filteredMonthConsultations = useMemo(() => {
    if (!selectedMonthModal.monthData) return [];
    return selectedMonthModal.monthData.consultations.filter(c => {
      const q = monthModalSearch.toLowerCase().trim();
      const matchSearch = !q ||
        c.mhs_nama?.toLowerCase().includes(q) ||
        c.mhs_nim?.toLowerCase().includes(q) ||
        c.dosen_nama?.toLowerCase().includes(q) ||
        c.bab_topik?.toLowerCase().includes(q);

      const matchAdvisor = !monthModalAdvisorFilter || c.dosen_nip === monthModalAdvisorFilter;
      const matchMethod = monthModalMethodFilter === 'all' || c.metode === monthModalMethodFilter;
      const matchStatus = monthModalStatusFilter === 'all' || c.status === monthModalStatusFilter;

      return matchSearch && matchAdvisor && matchMethod && matchStatus;
    });
  }, [selectedMonthModal.monthData, monthModalSearch, monthModalAdvisorFilter, monthModalMethodFilter, monthModalStatusFilter]);

  // Peringkat Keaktifan Dosen Table: Filter & Search
  const [advisorSearch, setAdvisorSearch] = useState('');
  const [advisorSortBy, setAdvisorSortBy] = useState('rasio_desc'); // 'rasio_desc' | 'total_desc' | 'mhs_desc' | 'name'

  const filteredAdvisorRankings = useMemo(() => {
    let list = [...dashboardStats.advisorRankings];
    if (advisorSearch.trim()) {
      const q = advisorSearch.toLowerCase().trim();
      list = list.filter(a => 
        a.nama.toLowerCase().includes(q) || 
        a.nip.includes(q) ||
        a.keahlian.some(k => k.toLowerCase().includes(q))
      );
    }

    if (advisorSortBy === 'rasio_desc') {
      list.sort((a, b) => b.rasio - a.rasio);
    } else if (advisorSortBy === 'total_desc') {
      list.sort((a, b) => b.totalBimbingan - a.totalBimbingan);
    } else if (advisorSortBy === 'mhs_desc') {
      list.sort((a, b) => b.totalMahasiswa - a.totalMahasiswa);
    } else if (advisorSortBy === 'name') {
      list.sort((a, b) => a.nama.localeCompare(b.nama));
    }

    return list;
  }, [dashboardStats.advisorRankings, advisorSearch, advisorSortBy]);

  // Peringkat Keaktifan Mahasiswa Top 10 Table: Filter & Search
  const [studentSearch, setStudentSearch] = useState('');
  const filteredTopStudents = useMemo(() => {
    let list = [...dashboardStats.top10ActiveStudents];
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase().trim();
      list = list.filter(s =>
        s.mhs_nama.toLowerCase().includes(q) ||
        s.mhs_nim.includes(q) ||
        s.p1_nama.toLowerCase().includes(q) ||
        s.p2_nama.toLowerCase().includes(q)
      );
    }
    return list;
  }, [dashboardStats.top10ActiveStudents, studentSearch]);

  // Excel Sync Info Modal
  const [isExcelInfoOpen, setIsExcelInfoOpen] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handler to export monthly consultation details as CSV
  const handleExportMonthCSV = () => {
    if (!selectedMonthModal.monthData) return;
    const items = filteredMonthConsultations;
    if (items.length === 0) {
      showToast('Tidak ada data bimbingan untuk diekspor.');
      return;
    }

    const headers = ['No', 'Tanggal', 'Waktu', 'NIM', 'Nama Mahasiswa', 'Kelas', 'Dosen Pembimbing', 'Peran', 'Metode', 'Bab/Topik', 'Status', 'Catatan Mahasiswa', 'Masukan Dosen'];
    const rows = items.map((it, idx) => [
      idx + 1,
      `"${it.tanggal}"`,
      `"${it.waktu}"`,
      `"'${it.mhs_nim}"`,
      `"${it.mhs_nama}"`,
      `"${it.mhs_kelas}"`,
      `"${it.dosen_nama}"`,
      `"${it.pembimbing}"`,
      `"${it.metode}"`,
      `"${(it.bab_topik || '').replace(/"/g, '""')}"`,
      `"${it.status}"`,
      `"${(it.catatan_mahasiswa || '').replace(/"/g, '""')}"`,
      `"${(it.masukan_dosen || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Bimbingan_${selectedMonthModal.monthData.short}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Berhasil mengunduh berkas CSV rekap bimbingan bulan ${selectedMonthModal.monthData.name}!`);
  };

  // =========================================================================
  // 2. STATE FOR TAB 2 (MONITORING JUDUL & KELULUSAN D3)
  // =========================================================================
  const [similarityThreshold, setSimilarityThreshold] = useState(30);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState('all');
  const [sortBy, setSortBy] = useState('similarity_desc');
  const [selectedAdvisorFilter, setSelectedAdvisorFilter] = useState('');

  const [reminderModal, setReminderModal] = useState({
    isOpen: false,
    title: null,
    targetAdvisorNip: 'all',
    customMessage: '',
    isSending: false
  });

  const [historyModal, setHistoryModal] = useState({
    isOpen: false,
    title: null
  });

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

  // KPI for Title Monitoring
  const kpiData = useMemo(() => {
    const total = thesisTitles.length;
    const safeCount = thesisTitles.filter(t => (Number(t.skor_kemiripan_terakhir) || 0) <= similarityThreshold).length;
    const warningCount = thesisTitles.filter(t => (Number(t.skor_kemiripan_terakhir) || 0) > similarityThreshold).length;
    const withRevisionsCount = thesisTitles.filter(t => Array.isArray(t.riwayat_revisi) && t.riwayat_revisi.length > 1).length;
    const fixCount = thesisTitles.filter(t => t.status === 'disetujui' || t.status === 'judul_fix').length;

    return { total, safeCount, warningCount, withRevisionsCount, fixCount };
  }, [thesisTitles, similarityThreshold]);

  // Filtered titles
  const filteredAndSortedTitles = useMemo(() => {
    let result = [...thesisTitles];

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

    if (selectedAdvisorFilter) {
      result = result.filter(t => 
        t.pembimbing_1_nip === selectedAdvisorFilter || 
        t.pembimbing_2_nip === selectedAdvisorFilter
      );
    }

    if (activeFilterTab === 'above_threshold') {
      result = result.filter(t => (Number(t.skor_kemiripan_terakhir) || 0) > similarityThreshold);
    } else if (activeFilterTab === 'safe') {
      result = result.filter(t => (Number(t.skor_kemiripan_terakhir) || 0) <= similarityThreshold);
    } else if (activeFilterTab === 'has_revisions') {
      result = result.filter(t => Array.isArray(t.riwayat_revisi) && t.riwayat_revisi.length > 1);
    } else if (activeFilterTab === 'fix') {
      result = result.filter(t => t.status === 'disetujui' || t.status === 'judul_fix');
    }

    result.sort((a, b) => {
      const simA = Number(a.skor_kemiripan_terakhir) || 0;
      const simB = Number(b.skor_kemiripan_terakhir) || 0;

      if (sortBy === 'similarity_desc') return simB - simA;
      if (sortBy === 'similarity_asc') return simA - simB;
      if (sortBy === 'name') return (a.mhs_nama || '').localeCompare(b.mhs_nama || '');
      return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
    });

    return result;
  }, [thesisTitles, searchQuery, selectedAdvisorFilter, activeFilterTab, sortBy, similarityThreshold]);

  // Unique Advisors for Filter dropdown
  const advisorOptions = useMemo(() => {
    const map = new Map();
    thesisTitles.forEach(t => {
      if (t.pembimbing_1_nip && t.pembimbing_1_nama) map.set(t.pembimbing_1_nip, t.pembimbing_1_nama);
      if (t.pembimbing_2_nip && t.pembimbing_2_nama) map.set(t.pembimbing_2_nip, t.pembimbing_2_nama);
    });
    return Array.from(map.entries()).map(([nip, nama]) => ({ nip, nama }));
  }, [thesisTitles]);

  return (
    <div className="space-y-6">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-blue-700/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold backdrop-blur-sm border border-blue-400/20">
              <BarChart3 className="w-3.5 h-3.5 text-blue-300" />
              <span>Pusat Kendali &amp; Analitik Bimbingan Prodi D3 Manajemen Informatika</span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/kaprodi/advisors"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-800/80 hover:bg-blue-700 text-white text-xs font-bold rounded-xl border border-blue-600/40 transition-colors shadow-2xs"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-200" />
                <span>Kelola Dospem</span>
              </Link>
              <Link
                href="/kaprodi/monitoring-mahasiswa"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Monitoring Mahasiswa</span>
              </Link>
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Dashboard Ringkasan Kondisi Bimbingan Seluruh Prodi
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 max-w-4xl leading-relaxed">
              Pantau perkembangan frekuensi bimbingan, kepatuhan syarat &ge;24 sesi bimbingan, ketimpangan beban dosen pembimbing (P1 vs P2), tren bimbingan bulanan, dan keaktifan mahasiswa dalam satu dasbor terpadu.
            </p>
          </div>

          {/* Quick Metrics Tag Badges */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs font-medium text-blue-200">
            <span className="inline-flex items-center gap-1.5 bg-blue-950/70 px-3 py-1.5 rounded-xl border border-blue-800/60">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>{dashboardStats.summary.totalMahasiswa} Mahasiswa TA Aktif</span>
            </span>
            <span className="inline-flex items-center gap-1.5 bg-blue-950/70 px-3 py-1.5 rounded-xl border border-blue-800/60">
              <UserCheck className="w-3.5 h-3.5 text-indigo-300" />
              <span>{dashboardStats.summary.totalDosen} Dosen Pembimbing</span>
            </span>
            <span className="inline-flex items-center gap-1.5 bg-blue-950/70 px-3 py-1.5 rounded-xl border border-blue-800/60">
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{dashboardStats.summary.totalBimbingan.toLocaleString('id-ID')} Total Bimbingan Tercatat</span>
            </span>
            <span className="inline-flex items-center gap-1.5 bg-blue-950/70 px-3 py-1.5 rounded-xl border border-blue-800/60">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>{dashboardStats.summary.persenMemenuhiTarget24}% Memenuhi Syarat &ge;24x</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Tab Switcher Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveMainTab('ringkasan_prodi')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeMainTab === 'ringkasan_prodi'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>1. Ringkasan Kondisi Bimbingan Seluruh Prodi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('pemantauan_judul')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeMainTab === 'pemantauan_judul'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>2. Pemantauan Similarity &amp; Kelulusan D3</span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 pr-2 text-xs text-slate-500 font-medium">
          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
          <span>Tahun Akademik 2026/2027 &bull; Semester Ganjil</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: RINGKASAN KONDISI BIMBINGAN SELURUH PRODI (USER SPECIFICATION)     */}
      {/* Layout:                                                                   */}
      {/* Baris 1: 4 kartu ringkasan                                                */}
      {/* Baris 2: chart batang Beban Bimbingan (kiri) & Bimbingan per Bulan (kanan) */}
      {/* Baris 3: donut Status, donut Jenis, tabel Dosen, tabel Mahasiswa Top 10    */}
      {/* ========================================================================= */}
      {activeMainTab === 'ringkasan_prodi' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* ===================================================================== */}
          {/* BARIS 1: 4 KARTU RINGKASAN                                            */}
          {/* 1. Mahasiswa: total, dengan rincian Aktif, Lulus, dan Tidak aktif     */}
          {/* 2. Dosen: jumlah dosen                                                */}
          {/* 3. Total bimbingan: total, dengan rata-rata per mahasiswa             */}
          {/* 4. Memenuhi ≥ 24 bimbingan: persentase dan “n dari N mahasiswa aktif”  */}
          {/* ===================================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1.1 KARTU MAHASISWA: Total dengan rincian Aktif, Lulus, Tidak aktif */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full pointer-events-none -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <div className="relative z-10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mahasiswa</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {dashboardStats.studentStatus.total}
                  <span className="text-xs font-semibold text-slate-500 ml-1.5 font-normal">Total Mhs TA</span>
                </div>
              </div>

              {/* Rincian Status: Aktif, Lulus, Tidak aktif (Tambahan Baru) */}
              <div className="relative z-10 pt-3 border-t border-slate-100 space-y-2 mt-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Rincian Status:</span>
                  <button 
                    type="button" 
                    onClick={() => setIsExcelInfoOpen(true)}
                    className="text-indigo-600 hover:text-indigo-800 font-bold lowercase text-[10px]"
                  >
                    excel sync
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="bg-blue-50/80 border border-blue-200/70 rounded-lg py-1 px-1">
                    <span className="text-[9px] font-bold text-blue-700 block uppercase">Aktif</span>
                    <span className="text-xs font-black text-blue-900">{dashboardStats.studentStatus.aktif}</span>
                    <span className="text-[9px] text-blue-600 font-medium block">({dashboardStats.studentStatus.persenAktif}%)</span>
                  </div>
                  <div className="bg-emerald-50/80 border border-emerald-200/70 rounded-lg py-1 px-1">
                    <span className="text-[9px] font-bold text-emerald-700 block uppercase">Lulus</span>
                    <span className="text-xs font-black text-emerald-900">{dashboardStats.studentStatus.lulus}</span>
                    <span className="text-[9px] text-emerald-600 font-medium block">({dashboardStats.studentStatus.persenLulus}%)</span>
                  </div>
                  <div className="bg-rose-50/80 border border-rose-200/70 rounded-lg py-1 px-1">
                    <span className="text-[9px] font-bold text-rose-700 block uppercase">Tdk Aktif</span>
                    <span className="text-xs font-black text-rose-900">{dashboardStats.studentStatus.tidakAktif}</span>
                    <span className="text-[9px] text-rose-600 font-medium block">({dashboardStats.studentStatus.persenTidakAktif}%)</span>
                  </div>
                </div>

                {/* Mini Segmented Bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-100 flex overflow-hidden">
                  <div className="bg-blue-600 h-full" style={{ width: `${dashboardStats.studentStatus.persenAktif}%` }} title={`Aktif: ${dashboardStats.studentStatus.aktif}`} />
                  <div className="bg-emerald-500 h-full" style={{ width: `${dashboardStats.studentStatus.persenLulus}%` }} title={`Lulus: ${dashboardStats.studentStatus.lulus}`} />
                  <div className="bg-rose-400 h-full" style={{ width: `${dashboardStats.studentStatus.persenTidakAktif}%` }} title={`Tidak Aktif: ${dashboardStats.studentStatus.tidakAktif}`} />
                </div>
              </div>
            </div>

            {/* 1.2 KARTU DOSEN: Jumlah Dosen */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full pointer-events-none -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <div className="relative z-10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dosen</span>
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <UserCheck className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {dashboardStats.summary.totalDosen}
                  <span className="text-xs font-semibold text-slate-500 ml-1.5 font-normal">Dosen Pembimbing</span>
                </div>
              </div>

              <div className="relative z-10 pt-3 border-t border-slate-100 space-y-1.5 mt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Beban Kuota Rata-rata:</span>
                  <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 text-[11px]">
                    ~16 Mhs / Dosen
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>100% Pembimbing aktif membimbing P1 &amp; P2</span>
                </div>
              </div>
            </div>

            {/* 1.3 KARTU TOTAL BIMBINGAN: Total dengan rata-rata per mahasiswa */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full pointer-events-none -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <div className="relative z-10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Bimbingan</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <FileCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
                <div className="text-3xl font-black text-emerald-700 tracking-tight">
                  {dashboardStats.summary.totalBimbingan.toLocaleString('id-ID')}
                  <span className="text-xs font-semibold text-slate-500 ml-1.5 font-normal">Sesi</span>
                </div>
              </div>

              <div className="relative z-10 pt-3 border-t border-slate-100 space-y-1.5 mt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Rata-rata per Mahasiswa:</span>
                  <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-xs">
                    {dashboardStats.summary.rataRataPerMahasiswa} sesi / mhs
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Log konsultasi terverifikasi &amp; tersimpan di SIMTA</span>
                </div>
              </div>
            </div>

            {/* 1.4 KARTU MEMENUHI >= 24 BIMBINGAN: Persentase dan “n dari N mahasiswa aktif” */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full pointer-events-none -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <div className="relative z-10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Memenuhi &ge; 24 Bimbingan</span>
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <Award className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-black text-indigo-700 tracking-tight">
                    {dashboardStats.summary.persenMemenuhiTarget24}%
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Memenuhi Syarat
                  </span>
                </div>
              </div>

              <div className="relative z-10 pt-3 border-t border-slate-100 space-y-1.5 mt-2">
                <div className="text-xs font-bold text-slate-800">
                  “{dashboardStats.summary.memenuhiTarget24Count} dari {dashboardStats.summary.totalMahasiswa} mahasiswa aktif”
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${dashboardStats.summary.persenMemenuhiTarget24}%` }} 
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  {dashboardStats.summary.belumMemenuhiCount} mahasiswa masih berproses menuju batas &ge;24x
                </p>
              </div>
            </div>

          </div>

          {/* ===================================================================== */}
          {/* BARIS 2: CHART BATANG BERDAMPINGAN (KIRI & KANAN)                     */}
          {/* Kiri: Beban Bimbingan per Dosen (P1 vs P2) - Grouped Bar               */}
          {/* Kanan: Bimbingan per Bulan (Bar Hijau dengan label MM/YYYY & Klik)    */}
          {/* ===================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            
            {/* 2.1 CHART KIRI: Beban Bimbingan per Dosen (P1 vs P2) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Beban Bimbingan per Dosen (P1 vs P2)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Grouped bar: Pembimbing 1 (Biru) vs Pembimbing 2 (Oranye) tiap dosen
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={workloadSortBy}
                    onChange={(e) => setWorkloadSortBy(e.target.value)}
                    className="py-1 px-2.5 text-xs border border-slate-200 rounded-xl bg-white font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="total_desc">Total Beban Terbanyak</option>
                    <option value="disparity_desc">Ketimpangan Tertinggi</option>
                    <option value="balanced">Beban Paling Seimbang</option>
                    <option value="name">Nama Dosen (A - Z)</option>
                  </select>
                </div>
              </div>

              {/* Grouped Bar Chart Area */}
              <div className="pt-2">
                {/* Legend */}
                <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-xs bg-blue-600 shadow-2xs" />
                      <span className="text-[11px] font-bold text-slate-700">Pembimbing-1 (P1)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-xs bg-orange-500 shadow-2xs" />
                      <span className="text-[11px] font-bold text-slate-700">Pembimbing-2 (P2)</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Kapasitas Max: 16 Mhs</span>
                </div>

                {/* Sumbu Y & Gridlines with Scrollable X-Axis */}
                <div className="relative border-b border-slate-200">
                  {/* Horizontal Gridlines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[9px] text-slate-400 pb-12">
                    <div className="border-b border-slate-100 w-full flex items-center justify-between"><span className="bg-white/90 px-0.5">16</span></div>
                    <div className="border-b border-slate-100 w-full flex items-center justify-between"><span className="bg-white/90 px-0.5">12</span></div>
                    <div className="border-b border-slate-100 w-full flex items-center justify-between"><span className="bg-white/90 px-0.5">8</span></div>
                    <div className="border-b border-slate-100 w-full flex items-center justify-between"><span className="bg-white/90 px-0.5">4</span></div>
                    <div className="border-b border-slate-200 w-full flex items-center justify-between"><span className="bg-white/90 px-0.5">0</span></div>
                  </div>

                  {/* Scrollable Columns */}
                  <div className="overflow-x-auto pb-1 pl-5">
                    <div className="h-56 flex items-end justify-between gap-3 min-w-[620px] pt-4">
                      {sortedWorkloads.map((adv) => {
                        const maxVal = 16;
                        const heightP1 = Math.min(100, Math.round((adv.p1Count / maxVal) * 100));
                        const heightP2 = Math.min(100, Math.round((adv.p2Count / maxVal) * 100));
                        const displayName = adv.nama.replace(/^(Dr\.|Prof\.|Ir\.)\s*/i, '').split(',')[0].trim();

                        return (
                          <div
                            key={adv.nip}
                            className="flex-1 flex flex-col items-center h-full justify-end group min-w-[46px]"
                            title={`${adv.nama}\nID / NIP: ${adv.nip}\n• Pembimbing 1: ${adv.p1Count} mhs\n• Pembimbing 2: ${adv.p2Count} mhs\nTotal: ${adv.totalBeban} mhs (${adv.ketimpanganLabel})`}
                          >
                            {/* Grouped Bars Container */}
                            <div className="w-full flex items-end justify-center gap-1.5 h-full pb-1">
                              {/* Bar P1 (Biru) */}
                              <div className="w-4 sm:w-5 flex flex-col items-center justify-end h-full">
                                <span className="text-[9px] font-extrabold text-blue-700 font-mono mb-0.5 opacity-90 group-hover:opacity-100">
                                  {adv.p1Count}
                                </span>
                                <div
                                  className="w-full bg-blue-600 group-hover:bg-blue-500 rounded-t-sm transition-all duration-300 shadow-2xs"
                                  style={{ height: `${Math.max(4, heightP1)}%` }}
                                />
                              </div>

                              {/* Bar P2 (Oranye) */}
                              <div className="w-4 sm:w-5 flex flex-col items-center justify-end h-full">
                                <span className="text-[9px] font-extrabold text-orange-600 font-mono mb-0.5 opacity-90 group-hover:opacity-100">
                                  {adv.p2Count}
                                </span>
                                <div
                                  className="w-full bg-orange-500 group-hover:bg-orange-400 rounded-t-sm transition-all duration-300 shadow-2xs"
                                  style={{ height: `${Math.max(4, heightP2)}%` }}
                                />
                              </div>
                            </div>

                            {/* Label Sumbu X: Nama dan ID Dosen */}
                            <div className="text-center mt-2 w-full pt-1 border-t border-slate-100">
                              <div className="text-[10px] font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors" title={adv.nama}>
                                {displayName}
                              </div>
                              <div className="text-[9px] text-slate-400 font-mono truncate" title={`NIP: ${adv.nip}`}>
                                ID: {adv.nip.slice(-4)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Rata-Rata: <strong className="text-slate-800">{dashboardStats.advisorWorkloadSummary.rataRataBeban} mhs / dosen</strong></span>
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-amber-200/80">
                    {dashboardStats.advisorWorkloadSummary.totalTimpang} Dosen Ketimpangan Tinggi
                  </span>
                </div>
              </div>
            </div>

            {/* 2.2 CHART KANAN: Bimbingan per Bulan (Bar Hijau dengan label MM/YYYY & Clickable) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Bimbingan per Bulan (Tahun 2026)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Bar hijau dengan label MM/YYYY &bull; Klik bar untuk membuka rincian log
                  </p>
                </div>

                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-200">
                  Interaktif &bull; Klik Bar Hijau
                </span>
              </div>

              {/* Monthly Green Bar Chart */}
              <div className="pt-2">
                <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-emerald-500 shadow-2xs" />
                    <span className="text-[11px] font-bold text-slate-700">Total Bimbingan Bulanan</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Bisa Diklik
                  </span>
                </div>

                {/* Chart Area */}
                <div className="h-56 flex items-end justify-between gap-2 sm:gap-2.5 px-1 border-b border-slate-200">
                  {dashboardStats.monthlyChartData.map((m) => {
                    const maxMonthly = 350;
                    const heightPercent = Math.min(100, Math.max(12, Math.round((m.total / maxMonthly) * 100)));
                    const isOctober = m.key === '2026-10';

                    return (
                      <div 
                        key={m.key} 
                        onClick={() => setSelectedMonthModal({ isOpen: true, monthData: m })}
                        className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                        title={`Klik untuk melihat detail ${m.name} (${m.labelMMYYYY}): ${m.total} bimbingan`}
                      >
                        {/* Value on top of bar */}
                        <span className="text-[10px] font-extrabold text-slate-600 group-hover:text-emerald-700 transition-colors mb-1 font-mono">
                          {m.total}
                        </span>

                        {/* Bar Hijau */}
                        <div
                          className="w-full max-w-[38px] bg-slate-100 rounded-t-lg overflow-hidden flex flex-col justify-end transition-all group-hover:shadow-md group-hover:scale-105"
                          style={{ height: `${heightPercent}%` }}
                        >
                          <div 
                            className={`w-full h-full transition-all duration-300 rounded-t-lg flex flex-col justify-between p-1 ${
                              isOctober 
                                ? 'bg-gradient-to-t from-emerald-600 to-teal-500 ring-2 ring-emerald-400' 
                                : 'bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:from-emerald-500 group-hover:to-teal-300'
                            }`}
                          >
                            <div className="w-full flex justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                            </div>
                            <div className="text-[8px] text-white/95 text-center font-bold font-mono">
                              {m.daringCount}d
                            </div>
                          </div>
                        </div>

                        {/* Label Sumbu X: MM/YYYY */}
                        <span className={`text-[10px] font-bold mt-2 transition-colors font-mono ${
                          isOctober ? 'text-emerald-700 font-black' : 'text-slate-600 group-hover:text-emerald-600'
                        }`}>
                          {m.labelMMYYYY}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Rata-rata: <strong className="text-slate-800">~232 sesi / bulan</strong></span>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Klik bar bulan untuk detail</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ===================================================================== */}
          {/* BARIS 3: 4 ELEMEN                                                     */}
          {/* 1. Donut Status: Menunggu Validasi, Revisi Mayor, Revisi Minor        */}
          {/* 2. Donut Jenis: Daring dan Luring                                     */}
          {/* 3. Tabel Peringkat Keaktifan Dosen (bisa di-scroll)                   */}
          {/* 4. Tabel Peringkat Keaktifan Mahasiswa Top 10 (bisa di-scroll)        */}
          {/* ===================================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">
            
            {/* 3.1 DONUT STATUS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
              <div className="border-b border-slate-100 pb-2.5 mb-2">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Donut Status
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Menunggu Validasi, Revisi Mayor, Revisi Minor
                </p>
              </div>

              <div className="py-2 flex-1 flex flex-col justify-center">
                <DonutChart
                  items={dashboardStats.statusAndMethodStats.statusDonutItems}
                  total={dashboardStats.statusAndMethodStats.totalStatusThree}
                  totalLabel="Total Revisi"
                  size={165}
                  strokeWidth={20}
                  innerRadius={55}
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Total Menunggu &amp; Revisi:</span>
                <span className="font-mono font-bold text-slate-800">
                  {dashboardStats.statusAndMethodStats.totalStatusThree.toLocaleString('id-ID')} Sesi
                </span>
              </div>
            </div>

            {/* 3.2 DONUT JENIS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
              <div className="border-b border-slate-100 pb-2.5 mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Donut Jenis
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Distribusi metode bimbingan Daring dan Luring
                </p>
              </div>

              <div className="py-2 flex-1 flex flex-col justify-center">
                <DonutChart
                  items={dashboardStats.statusAndMethodStats.jenisDonutItems}
                  total={dashboardStats.statusAndMethodStats.totalMetode}
                  totalLabel="Total Sesi"
                  size={165}
                  strokeWidth={20}
                  innerRadius={55}
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Total Metode:</span>
                <span className="font-mono font-bold text-slate-800">
                  {dashboardStats.statusAndMethodStats.totalMetode.toLocaleString('id-ID')} Sesi
                </span>
              </div>
            </div>

            {/* 3.3 TABEL PERINGKAT KEAKTIFAN DOSEN */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
              <div className="border-b border-slate-100 pb-2.5 mb-2">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Award className="w-4 h-4 text-indigo-600 shrink-0" />
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      Peringkat Keaktifan Dosen
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 shrink-0">
                    {dashboardStats.advisorRankings.length} Dosen
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  Kolom #, Dosen, Bimbingan, Mahasiswa, Rasio
                </p>
              </div>

              {/* Search bar inside card */}
              <div className="relative mb-2">
                <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={advisorSearch}
                  onChange={(e) => setAdvisorSearch(e.target.value)}
                  placeholder="Cari dosen / NIP..."
                  className="w-full pl-7 pr-2 py-1 text-[11px] rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Scrollable Table Container */}
              <div className="overflow-y-auto overflow-x-auto max-h-[290px] rounded-xl border border-slate-200 text-xs flex-1">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200 font-bold text-slate-600 uppercase text-[9px] tracking-wider">
                    <tr>
                      <th className="py-2 px-2 text-center w-8">#</th>
                      <th className="py-2 px-2.5 min-w-[110px]">Dosen</th>
                      <th className="py-2 px-1.5 text-center">Bimbingan</th>
                      <th className="py-2 px-1.5 text-center">Mahasiswa</th>
                      <th className="py-2 px-2 text-center">Rasio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAdvisorRankings.map((adv, idx) => {
                      const rank = idx + 1;
                      return (
                        <tr key={adv.nip} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2 px-1 text-center align-middle">
                            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                          </td>
                          <td className="py-2 px-2 align-middle">
                            <div className="font-bold text-slate-900 text-[11px] line-clamp-1" title={adv.nama}>
                              {adv.nama.replace(/^(Dr\.|Prof\.|Ir\.)\s*/i, '').split(',')[0]}
                            </div>
                            <div className="text-[9px] text-slate-400 font-mono">
                              NIP. {adv.nip.slice(-4)}
                            </div>
                          </td>
                          <td className="py-2 px-1.5 text-center align-middle font-bold text-indigo-700 font-mono">
                            {adv.totalBimbingan}
                          </td>
                          <td className="py-2 px-1.5 text-center align-middle text-slate-700 font-medium">
                            {adv.totalMahasiswa}
                          </td>
                          <td className="py-2 px-2 text-center align-middle">
                            <span className="font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] border border-slate-200/60 font-mono">
                              {adv.rasioFormatted}x
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 mt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Tabel bisa di-scroll ke bawah</span>
                <span className="font-medium text-slate-600">Rasio: Sesi / Mahasiswa</span>
              </div>
            </div>

            {/* 3.4 TABEL PERINGKAT KEAKTIFAN MAHASISWA TOP 10 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
              <div className="border-b border-slate-100 pb-2.5 mb-2">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      Peringkat Mahasiswa Top 10
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                    Top 10
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  Tabel keaktifan mahasiswa paling sering bimbingan
                </p>
              </div>

              {/* Search bar inside card */}
              <div className="relative mb-2">
                <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Cari mahasiswa / NIM..."
                  className="w-full pl-7 pr-2 py-1 text-[11px] rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Scrollable Table Container */}
              <div className="overflow-y-auto overflow-x-auto max-h-[290px] rounded-xl border border-slate-200 text-xs flex-1">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200 font-bold text-slate-600 uppercase text-[9px] tracking-wider">
                    <tr>
                      <th className="py-2 px-2 text-center w-8">#</th>
                      <th className="py-2 px-2.5 min-w-[110px]">Mahasiswa</th>
                      <th className="py-2 px-1.5 text-center">Bulan Ini</th>
                      <th className="py-2 px-1.5 text-center">Total</th>
                      <th className="py-2 px-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTopStudents.map((st) => (
                      <tr key={st.mhs_nim} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2 px-1 text-center align-middle">
                          {st.rank === 1 ? '🥇' : st.rank === 2 ? '🥈' : st.rank === 3 ? '🥉' : `#${st.rank}`}
                        </td>
                        <td className="py-2 px-2 align-middle">
                          <div className="font-bold text-slate-900 text-[11px] line-clamp-1" title={st.mhs_nama}>
                            {st.mhs_nama}
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono">
                            NIM. {st.mhs_nim}
                          </div>
                        </td>
                        <td className="py-2 px-1.5 text-center align-middle font-bold text-emerald-700 font-mono">
                          {st.bimbinganBulanIni}x
                        </td>
                        <td className="py-2 px-1.5 text-center align-middle font-bold text-indigo-700 font-mono">
                          {st.totalBimbingan}
                        </td>
                        <td className="py-2 px-2 text-center align-middle">
                          {st.isMemenuhi24 ? (
                            <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              &ge;24x
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                              Proses
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 mt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Tabel bisa di-scroll ke bawah</span>
                <span className="font-medium text-emerald-700">Top 10 Keaktifan Mhs</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: PEMANTAUAN JUDUL & SIMILARITY CHECK (RETAINED FROM PREVIOUS)      */}
      {/* ========================================================================= */}
      {activeMainTab === 'pemantauan_judul' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* KPI Title Monitoring */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Usulan Dipantau</span>
              <div className="text-2xl font-black text-slate-900 pt-1">{kpiData.total} Mahasiswa</div>
              <p className="text-[11px] text-slate-500">Usulan judul aktif dalam sistem</p>
            </div>

            <div 
              onClick={() => setActiveFilterTab('above_threshold')}
              className={`cursor-pointer bg-white border rounded-xl p-4 shadow-2xs space-y-1 transition-all ${
                activeFilterTab === 'above_threshold' ? 'ring-2 ring-rose-500 border-rose-300 bg-rose-50/20' : 'border-slate-200 hover:border-rose-400'
              }`}
            >
              <div className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center justify-between">
                <span>Di Atas Ambang (&gt; {similarityThreshold}%)</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-rose-700 pt-1">{kpiData.warningCount} Mahasiswa</div>
              <p className="text-[11px] text-rose-600 font-medium">Perlu perhatian &amp; revisi</p>
            </div>

            <div 
              onClick={() => setActiveFilterTab('safe')}
              className={`cursor-pointer bg-white border rounded-xl p-4 shadow-2xs space-y-1 transition-all ${
                activeFilterTab === 'safe' ? 'ring-2 ring-emerald-500 border-emerald-300 bg-emerald-50/20' : 'border-slate-200 hover:border-emerald-400'
              }`}
            >
              <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center justify-between">
                <span>Aman (&le; {similarityThreshold}%)</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600 pt-1">{kpiData.safeCount} Mahasiswa</div>
              <p className="text-[11px] text-emerald-600 font-medium">Batas aman bimbingan</p>
            </div>

            <div 
              onClick={() => setActiveFilterTab('has_revisions')}
              className={`cursor-pointer bg-white border rounded-xl p-4 shadow-2xs space-y-1 transition-all ${
                activeFilterTab === 'has_revisions' ? 'ring-2 ring-indigo-500 border-indigo-300 bg-indigo-50/20' : 'border-slate-200 hover:border-indigo-400'
              }`}
            >
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">Ada Riwayat Revisi</span>
              <div className="text-2xl font-black text-indigo-700 pt-1">{kpiData.withRevisionsCount} Mahasiswa</div>
              <p className="text-[11px] text-indigo-600">Telah mengunggah perbaikan</p>
            </div>

            <div 
              onClick={() => setActiveFilterTab('fix')}
              className={`cursor-pointer bg-white border rounded-xl p-4 shadow-2xs space-y-1 transition-all ${
                activeFilterTab === 'fix' ? 'ring-2 ring-teal-500 border-teal-300 bg-teal-50/20' : 'border-slate-200 hover:border-teal-400'
              }`}
            >
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block">Judul Fix Disetujui</span>
              <div className="text-2xl font-black text-teal-700 pt-1">{kpiData.fixCount} Judul</div>
              <p className="text-[11px] text-teal-600">Disetujui rapat prodi</p>
            </div>
          </div>

          {/* Threshold Controls */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-900">
                  Ambang Batas Toleransi Similarity: {similarityThreshold}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Judul di bawah batas ini dianggap aman melanjutkan pembimbingan proposal.</p>
            </div>

            <div className="flex items-center gap-2">
              {[20, 25, 30, 35, 40].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSimilarityThreshold(val)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    similarityThreshold === val
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>

          {/* Table Titles */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Matriks Pemantauan Similarity Judul Tugas Akhir D3</span>
              </h3>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Cari nama, NIM, judul..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 w-60"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px]">
                    <th className="py-3 px-4">Mahasiswa</th>
                    <th className="py-3 px-4">Judul yang Diusulkan</th>
                    <th className="py-3 px-4 text-center">Similarity</th>
                    <th className="py-3 px-4">Dosen Pembimbing</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAndSortedTitles.map(t => {
                    const currentScore = Number(t.skor_kemiripan_terakhir) || 0;
                    const colorMeta = getSimilarityColorMeta(currentScore, similarityThreshold);

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div>{t.mhs_nama}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{t.mhs_nim} &bull; {t.mhs_kelas}</div>
                        </td>
                        <td className="py-3 px-4 max-w-md">
                          <p className="font-medium text-slate-900">{t.judul}</p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-base font-black ${colorMeta.scoreText}`}>
                            {currentScore.toFixed(1)}%
                          </span>
                          <div className="text-[10px] font-bold text-slate-500">{colorMeta.statusLabel}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          <div>P1: {t.pembimbing_1_nama || '-'}</div>
                          <div>P2: {t.pembimbing_2_nama || '-'}</div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setHistoryModal({ isOpen: true, title: t })}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors"
                          >
                            Riwayat
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* DRILLDOWN MODAL: DETAIL LOG BIMBINGAN BULAN TERPILIH (REQUIREMENT 4)      */}
      {/* ========================================================================= */}
      {selectedMonthModal.isOpen && selectedMonthModal.monthData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Rincian Sesi Bimbingan Bulan {selectedMonthModal.monthData.name}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold">
                      {selectedMonthModal.monthData.total} Sesi Bimbingan
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Menampilkan seluruh log bimbingan antara dosen dan mahasiswa yang dilaksanakan pada periode {selectedMonthModal.monthData.name}.
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setSelectedMonthModal({ isOpen: false, monthData: null })}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick KPI Header in Modal */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Sesi Bulan Ini:</span>
                <span className="font-black text-slate-900 text-sm">{selectedMonthModal.monthData.total} Sesi</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Mahasiswa Bimbingan:</span>
                <span className="font-black text-blue-700 text-sm">{selectedMonthModal.monthData.uniqueStudentsCount} Mahasiswa</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Dosen Membimbing:</span>
                <span className="font-black text-indigo-700 text-sm">{selectedMonthModal.monthData.uniqueLecturersCount} Dosen</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Rasio Daring/Luring:</span>
                <span className="font-black text-emerald-700 text-sm">
                  {selectedMonthModal.monthData.daringCount} Daring &bull; {selectedMonthModal.monthData.luringCount} Luring
                </span>
              </div>
            </div>

            {/* Modal Filters & Search Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={monthModalSearch}
                  onChange={(e) => setMonthModalSearch(e.target.value)}
                  placeholder="Cari nama mahasiswa, NIM, dosen, atau bab pembahasan..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Filter Metode */}
              <select
                value={monthModalMethodFilter}
                onChange={(e) => setMonthModalMethodFilter(e.target.value)}
                className="py-1.5 px-3 text-xs border border-slate-200 rounded-xl bg-white font-medium text-slate-700"
              >
                <option value="all">Semua Metode (Daring &amp; Luring)</option>
                <option value="Daring">Daring (Online)</option>
                <option value="Luring">Luring (Tatap Muka)</option>
              </select>

              {/* Filter Status */}
              <select
                value={monthModalStatusFilter}
                onChange={(e) => setMonthModalStatusFilter(e.target.value)}
                className="py-1.5 px-3 text-xs border border-slate-200 rounded-xl bg-white font-medium text-slate-700"
              >
                <option value="all">Semua Status</option>
                <option value="disetujui">Disetujui / Selesai</option>
                <option value="revisi_minor">Revisi Minor</option>
                <option value="revisi_mayor">Revisi Mayor</option>
                <option value="menunggu_validasi">Menunggu Validasi</option>
              </select>

              <button
                type="button"
                onClick={handleExportMonthCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh CSV</span>
              </button>
            </div>

            {/* Modal Detail Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-96 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Tanggal &amp; Waktu</th>
                    <th className="py-2.5 px-3">Mahasiswa</th>
                    <th className="py-2.5 px-3">Dosen Pembimbing</th>
                    <th className="py-2.5 px-3">Bab &amp; Topik</th>
                    <th className="py-2.5 px-2 text-center">Metode</th>
                    <th className="py-2.5 px-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMonthConsultations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Tidak ada log bimbingan yang cocok dengan kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    filteredMonthConsultations.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 align-top whitespace-nowrap">
                          <div className="font-bold text-slate-900">{item.tanggal}</div>
                          <div className="text-[10px] text-slate-400">{item.waktu}</div>
                        </td>

                        <td className="py-2.5 px-3 align-top">
                          <div className="font-bold text-slate-900">{item.mhs_nama}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.mhs_nim} &bull; {item.mhs_kelas}</div>
                        </td>

                        <td className="py-2.5 px-3 align-top">
                          <div className="font-semibold text-slate-800">{item.dosen_nama}</div>
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                            {item.pembimbing}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 align-top max-w-xs">
                          <div className="font-medium text-slate-900 text-xs">{item.bab_topik}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 italic">
                            &ldquo;{item.masukan_dosen || item.catatan_mahasiswa}&rdquo;
                          </div>
                        </td>

                        <td className="py-2.5 px-2 text-center align-top">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.metode === 'Daring' 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                              : 'bg-teal-50 text-teal-700 border border-teal-200'
                          }`}>
                            {item.metode}
                          </span>
                        </td>

                        <td className="py-2.5 px-2 text-center align-top">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'disetujui'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : item.status === 'revisi_minor'
                              ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                              : item.status === 'revisi_mayor'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {item.status === 'disetujui' && 'Disetujui'}
                            {item.status === 'revisi_minor' && 'Revisi Minor'}
                            {item.status === 'revisi_mayor' && 'Revisi Mayor'}
                            {item.status === 'menunggu_validasi' && 'Menunggu Validasi'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                Menampilkan {filteredMonthConsultations.length} dari {selectedMonthModal.monthData.total} catatan sesi
              </span>
              <button
                type="button"
                onClick={() => setSelectedMonthModal({ isOpen: false, monthData: null })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL METADATA EXCEL SYNC INFO                                           */}
      {/* ========================================================================= */}
      {isExcelInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Metadata Sinkronisasi Excel Prodi
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Informasi pembaruan berkas status mahasiswa TA
                  </p>
                </div>
              </div>
              <button onClick={() => setIsExcelInfoOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">Nama Berkas Sumber:</span>
                <span className="font-mono font-bold text-slate-900 text-xs">{dashboardStats.studentStatus.excelMeta.fileName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Waktu Sinkronisasi Terakhir:</span>
                <span className="font-bold text-slate-900">{dashboardStats.studentStatus.excelMeta.lastSync}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Baris Terproses:</span>
                <span className="font-bold text-slate-900">{dashboardStats.studentStatus.excelMeta.totalRows} Mahasiswa</span>
              </div>
              <div>
                <span className="text-slate-500 block">Pengunggah:</span>
                <span className="font-bold text-slate-900">{dashboardStats.studentStatus.excelMeta.importedBy}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Data status (Aktif, Lulus, dan Tidak Aktif) diperbarui secara periodik dengan mengunggah template Excel prodi pada menu Bulk Import.
            </p>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <Link
                href="/kaprodi/import"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Buka Menu Import Excel
              </Link>
              <button
                type="button"
                onClick={() => setIsExcelInfoOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retention of Modal History & Reminder for Tab 2 */}
      {historyModal.isOpen && historyModal.title && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Riwayat Usulan Judul</h3>
              <button onClick={() => setHistoryModal({ isOpen: false, title: null })}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <p className="text-xs text-slate-700 font-serif italic">&ldquo;{historyModal.title.judul}&rdquo;</p>
            <div className="text-xs text-slate-500">Skor Terakhir: {historyModal.title.skor_kemiripan_terakhir}%</div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setHistoryModal({ isOpen: false, title: null })} className="px-4 py-1.5 bg-slate-100 text-xs font-bold rounded-lg">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
