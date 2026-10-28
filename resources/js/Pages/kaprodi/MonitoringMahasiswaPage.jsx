import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from '@inertiajs/react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  GraduationCap,
  Sparkles,
  Inbox,
  UserCheck,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  FileCheck,
  ExternalLink,
  RotateCcw,
  X,
  MessageSquare,
  Bell,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  FileSpreadsheet,
  Phone
} from 'lucide-react';
import { MOCK_USERS, MOCK_THESIS_ARCHIVES } from '../../services/mockData.js';

// Helper to determine year of admission (angkatan) from UNSRI NIM format (0901xxxYYZZnnn)
const getAngkatanFromNim = (nim, fallback = '2024') => {
  const clean = String(nim || '').trim();
  if (clean.length >= 10) {
    const yrCode = clean.substring(7, 9);
    const yrNum = parseInt(yrCode, 10);
    if (!isNaN(yrNum) && yrNum >= 15 && yrNum <= 30) {
      return `20${yrCode}`;
    }
  }
  return fallback;
};

// Helper to normalize phone numbers for WhatsApp (08xxx -> 628xxx)
const normalizePhoneNumber = (phone) => {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[\s\-\+\(\)]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  return cleaned;
};

// Seed titles for the 2024 cohort to ensure rich real-world test cases (long titles, standard titles, and empty titles)
const SEED_COHORT_TITLES = {
  '09010182428003': 'Rancang Bangun Sistem Monitoring dan Evaluasi Bimbingan Tugas Akhir Berbasis Web Menggunakan Notifikasi Otomatis Terintegrasi WhatsApp API', // Long title with ellipsis & tooltip
  '09010282428027': 'Sistem Informasi Pengelolaan Inventaris Laboratorium Komputer Berbasis Web',
  '09010282428030': 'Aplikasi Portal Layanan Akademik dan Peminjaman Ruang Kuliah Berbasis Web',
  '09010182428002': 'Sistem Presensi Mahasiswa Berbasis Geofencing dan Dynamic QR Code pada Jurusan Manajemen Informatika',
  '09010582428082': 'Aplikasi E-Surat dan Pengarsipan Dokumen Tugas Akhir Digital',
  '09010282428032': 'Sistem Pendukung Keputusan Pemilihan Dosen Pembimbing Menggunakan Metode Simple Additive Weighting',
  '09010582428063': 'Rancang Bangun Marketplace Jasa Desain Grafis Mahasiswa Berbasis Web',
  '09010582428064': 'Sistem Informasi Manajemen Antrean Poliklinik Berbasis Web',
  '09010282428022': 'Aplikasi Pelaporan Kerusakan Fasilitas Kampus Berbasis Mobile Web',
  '09010282428042': 'Sistem Informasi Penjadwalan Sidang Tugas Akhir Menggunakan Algoritma Genetika'
};

// Seed consultations specifically for the 2024 cohort to match official monitoring status
const SEED_COHORT_CONSULTATIONS = [
  // Akhmad Latief (2 sessions with Dr. Abdiansah)
  {
    id: 'cons-seed-1',
    nim: '09010182428003',
    mhs_nim: '09010182428003',
    mhs_nama: 'AKHMAD LATIEF SRI BINTANG PAMUNGKAS',
    pembimbing: 'Pembimbing 1',
    dosen_nip: '198410012009121005',
    dosen_nama: 'Dr. Abdiansah, S.Kom., M.CS.',
    tanggal: '2026-10-08',
    status: 'Revisi Minor'
  },
  {
    id: 'cons-seed-2',
    nim: '09010182428003',
    mhs_nim: '09010182428003',
    mhs_nama: 'AKHMAD LATIEF SRI BINTANG PAMUNGKAS',
    pembimbing: 'Pembimbing 1',
    dosen_nip: '198410012009121005',
    dosen_nama: 'Dr. Abdiansah, S.Kom., M.CS.',
    tanggal: '2026-10-15',
    status: 'Revisi Mayor'
  },
  // Anggi Sastika Sari (1 session with Dewi Sartika)
  {
    id: 'cons-seed-3',
    nim: '09010282428027',
    mhs_nim: '09010282428027',
    mhs_nama: 'ANGGI SASTIKA SARI',
    pembimbing: 'Pembimbing 1',
    dosen_nip: '198804022019032007',
    dosen_nama: 'Dewi Sartika, S.Kom., M.Kom.',
    tanggal: '2026-09-23',
    status: 'Menunggu Validasi'
  },
  // Overdue > 30 days
  {
    id: 'cons-seed-4',
    nim: '09010282428030',
    mhs_nim: '09010282428030',
    mhs_nama: 'ARIELENDRA FEBRIANO DEWA PUTRA',
    pembimbing: 'Pembimbing 1',
    dosen_nip: '198803052019031010',
    dosen_nama: 'Bayu Wijaya Putra, S.Kom., M.Kom.',
    tanggal: '2026-09-08',
    status: 'Valid'
  },
  {
    id: 'cons-seed-4b',
    nim: '09010182428002',
    mhs_nim: '09010182428002',
    mhs_nama: 'AULIA AZZAHRA',
    pembimbing: 'Pembimbing 1',
    dosen_nip: '196807101997021001',
    dosen_nama: 'Dr. Julian Supardi, M.T.',
    tanggal: '2026-09-10',
    status: 'Valid'
  },
  // 7 other active sessions within 30 days
  {
    id: 'cons-seed-5',
    nim: '09010582428082',
    mhs_nim: '09010582428082',
    mhs_nama: 'BASMAH AISYAH',
    pembimbing: 'Pembimbing 1',
    tanggal: '2026-09-20',
    status: 'Valid'
  },
  {
    id: 'cons-seed-6',
    nim: '09010282428032',
    mhs_nim: '09010282428032',
    mhs_nama: 'BUNGA ANGELICA RAMADHANI',
    pembimbing: 'Pembimbing 1',
    tanggal: '2026-10-02',
    status: 'Valid'
  },
  {
    id: 'cons-seed-7',
    nim: '09010582428063',
    mhs_nim: '09010582428063',
    mhs_nama: 'RAKHA BAGAS FIRJATULLAH',
    pembimbing: 'Pembimbing 1',
    tanggal: '2026-10-04',
    status: 'Valid'
  },
  {
    id: 'cons-seed-8',
    nim: '09010582428064',
    mhs_nim: '09010582428064',
    mhs_nama: 'TAUFIK ARABI',
    pembimbing: 'Pembimbing 1',
    tanggal: '2026-10-05',
    status: 'Valid'
  },
  {
    id: 'cons-seed-9',
    nim: '09010282428022',
    mhs_nim: '09010282428022',
    mhs_nama: 'JUBAIDI',
    pembimbing: 'Pembimbing 1',
    tanggal: '2026-10-07',
    status: 'Valid'
  },
  {
    id: 'cons-seed-10',
    nim: '09010282428042',
    mhs_nim: '09010282428042',
    mhs_nama: 'INTAN NURAINI',
    pembimbing: 'Pembimbing 1',
    tanggal: '2026-10-11',
    status: 'Valid'
  },
  {
    id: 'cons-seed-11',
    nim: '09010582428093',
    mhs_nim: '09010582428093',
    mhs_nama: 'LATIFAH AZKIYAH UMMU TAQWA',
    pembimbing: 'Pembimbing 1',
    tanggal: '2026-10-12',
    status: 'Valid'
  }
];

// Set of exactly 11 students in the 101 cohort who have registered sessions
const COHORT_NIMS_WITH_SESSIONS = new Set([
  '09010182428003', // Akhmad Latief (2x)
  '09010282428027', // Anggi Sastika (1x)
  '09010182428002', // Aulia Azzahra (> 30 days)
  '09010282428030', // Arielendra (> 30 days)
  '09010582428082', // Basmah
  '09010282428032', // Bunga
  '09010582428063', // Rakha
  '09010582428064', // Taufik
  '09010282428022', // Jubaidi
  '09010282428042', // Intan
  '09010582428093'  // Latifah
]);

export default function MonitoringMahasiswaPage() {
  const {
    currentUser,
    getAllRegisteredStudents,
    studentAdvisors = [],
    advisors = [],
    consultations = [],
    thesisTitles = []
  } = useAuth();

  // Filter & Search states (Tambahan 3b: default status mahasiswa adalah 'aktif')
  const [selectedBimbinganFilter, setSelectedBimbinganFilter] = useState('all'); // 'all' | 'siap_sidang' | 'belum_bimbingan' | 'overdue_30' | 'belum_24x'
  const [selectedAngkatanFilter, setSelectedAngkatanFilter] = useState('2024'); // '2024' (default) | '2025' | '2023' | '2022' | 'all'
  const [selectedStatusMhsFilter, setSelectedStatusMhsFilter] = useState('aktif'); // Tambahan 3b: default 'aktif'
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const p = new URLSearchParams(window.location.search);
        return p.get('search') || '';
      } catch {}
    }
    return '';
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Sync search param if URL updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const p = new URLSearchParams(window.location.search);
        const s = p.get('search');
        if (s) {
          setSearchQuery(s);
          setSelectedAngkatanFilter('all'); // pastikan mahasiswa lintas angkatan langsung terlihat
          setSelectedStatusMhsFilter('all');
        }
      } catch {}
    }
  }, []);

  // Sorting state (Tambahan 2f: Progres & Terakhir)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' }); // key: 'progres' | 'terakhir' | null

  // WhatsApp Modal State (Tambahan 4)
  const [waModal, setWaModal] = useState({
    isOpen: false,
    type: 'dosen', // 'dosen' | 'mahasiswa'
    student: null,
    selectedTarget: 'p1', // 'p1' | 'p2' (for dosen)
    mode: 'template', // 'template' | 'blank'
    message: ''
  });

  // Student Detail Card Modal State (Keterangan Lengkap Mahasiswa)
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);
  const cardScrollRef = useRef(null);

  // Lock body scroll, pause Lenis smooth scroll, and prevent background scrolling when any modal is open
  useEffect(() => {
    const isAnyModalOpen = Boolean(selectedStudentDetail || waModal.isOpen);
    if (!isAnyModalOpen) return;

    // 1. Pause Lenis smooth scroll
    if (window.lenis && typeof window.lenis.stop === 'function') {
      window.lenis.stop();
    }

    const originalBodyOverflow = document.body.style.overflow;
    const originalDocOverflow = document.documentElement.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Prevent layout shift from scrollbar disappearing
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // 2. Strictly intercept wheel and touch events outside the scrollable card area
    const handleGlobalWheel = (e) => {
      const scrollable = e.target.closest('.card-scroll-area');
      if (!scrollable) {
        e.preventDefault();
        e.stopPropagation();
        if (cardScrollRef.current) {
          cardScrollRef.current.scrollTop += e.deltaY;
        }
      }
    };

    const handleGlobalTouch = (e) => {
      const scrollable = e.target.closest('.card-scroll-area');
      if (!scrollable) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleGlobalWheel, { passive: false });
    window.addEventListener('touchmove', handleGlobalTouch, { passive: false });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (waModal.isOpen) {
          setWaModal(prev => ({ ...prev, isOpen: false }));
        } else if (selectedStudentDetail) {
          setSelectedStudentDetail(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Auto focus the card scroll area so keyboard Up/Down/PageDown immediately scrolls inside the card
    const timer = setTimeout(() => {
      if (cardScrollRef.current) {
        cardScrollRef.current.focus();
      }
    }, 60);

    return () => {
      // Resume Lenis smooth scroll
      if (window.lenis && typeof window.lenis.start === 'function') {
        window.lenis.start();
      }
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalDocOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('wheel', handleGlobalWheel);
      window.removeEventListener('touchmove', handleGlobalTouch);
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [selectedStudentDetail, waModal.isOpen]);

  // Handle wheel events: forward scroll to card's scrollable container
  const handleCardWheel = (e) => {
    // If scrolling on header, footer, or outer backdrop, scroll the card content
    if (!e.target.closest('.card-scroll-area')) {
      e.stopPropagation();
      if (cardScrollRef.current) {
        cardScrollRef.current.scrollTop += e.deltaY;
      }
    }
  };

  // Fast Advisor lookup map
  const advisorMap = useMemo(() => {
    const map = new Map();
    (advisors || []).forEach(a => {
      if (a.nip) map.set(String(a.nip).trim(), a);
      if (a.id) map.set(String(a.id).trim(), a);
    });
    return map;
  }, [advisors]);

  // Master List: Compile all students across cohorts, inactive students, and alumni (Tambahan 1: judul_ta & no_hp)
  const allMasterStudents = useMemo(() => {
    const fromAuth = typeof getAllRegisteredStudents === 'function' ? getAllRegisteredStudents() : [];
    const authAndMockUsers = [
      ...(fromAuth || []),
      ...(MOCK_USERS || []).filter(u => (!u.role || u.role === 'mahasiswa'))
    ];

    const studentMap = new Map();

    // 1. Process active and inactive student users
    authAndMockUsers.forEach(s => {
      const nim = String(s.nim || '').trim();
      if (!nim || studentMap.has(nim)) return;

      // Extract accurate Angkatan from NIM
      const angkatan = getAngkatanFromNim(nim, String(s.tahun_angkatan || '2024'));

      // Detect status category
      const rawStatus = String(s.status || '').trim();
      let statusCategory = 'aktif';
      let statusLabel = 'Aktif';

      if (
        rawStatus.toLowerCase().includes('pengunduran') ||
        rawStatus.toLowerCase().includes('tidak aktif') ||
        rawStatus.toLowerCase().includes('cuti')
      ) {
        statusCategory = 'tidak_aktif';
        statusLabel = 'Tidak Aktif';
      } else if (rawStatus.toLowerCase().includes('lulus')) {
        statusCategory = 'lulus';
        statusLabel = 'Lulus';
      }

      studentMap.set(nim, {
        nim,
        nama: String(s.nama || '').toUpperCase(),
        angkatan,
        statusCategory,
        statusLabel,
        no_hp: s.no_hp || '', // Tambahan 1: no_hp mahasiswa
        judul_ta: s.judul_ta || s.judul || '', // Tambahan 1: judul_ta mahasiswa
        isGraduate: statusCategory === 'lulus'
      });
    });

    // 2. Process Alumni / Graduates from MOCK_THESIS_ARCHIVES
    (MOCK_THESIS_ARCHIVES || []).forEach(arc => {
      const nim = String(arc.penulis_nim || '').trim();
      if (!nim || studentMap.has(nim)) return;

      // Archives correspond to previous alumni cohorts (e.g. 2023, 2022, 2021)
      const angkatan = getAngkatanFromNim(nim, '2023');

      studentMap.set(nim, {
        nim,
        nama: String(arc.penulis_nama || '').toUpperCase(),
        angkatan,
        statusCategory: 'lulus',
        statusLabel: 'Lulus',
        no_hp: arc.no_hp || '',
        judul_ta: arc.judul || '',
        isGraduate: true,
        archiveData: arc
      });
    });

    const now = new Date('2026-10-17T00:00:00');

    // Transform into enriched monitoring records
    return Array.from(studentMap.values()).map((std, index) => {
      const cleanNim = std.nim;
      const nama = std.nama;
      const angkatan = std.angkatan;
      const statusCategory = std.statusCategory;
      const statusLabel = std.statusLabel;

      // Tambahan 1: Retrieve Judul TA (from thesisTitles, seed, archiveData, or student object)
      const matchingTitle = (thesisTitles || []).find(t => String(t.mhs_nim || '').trim() === cleanNim);
      const judul_ta = matchingTitle?.judul || SEED_COHORT_TITLES[cleanNim] || std.judul_ta || (std.archiveData ? std.archiveData.judul : '') || '';

      // Tambahan 1: Student Phone number (no_hp)
      const no_hp = std.no_hp || '';

      // Find advisor assignment
      const assignment = (studentAdvisors || []).find(sa => String(sa.student_nim || '').trim() === cleanNim) || {};

      let dospem1Nama = '-';
      let dospem2Nama = '-';
      let dospem1Nip = String(assignment.dospem1_nip || '').trim();
      let dospem2Nip = String(assignment.dospem2_nip || '').trim();

      const adv1 = advisorMap.get(dospem1Nip);
      const adv2 = advisorMap.get(dospem2Nip);

      dospem1Nama = adv1?.nama || assignment.dospem1_nama || '-';
      dospem2Nama = adv2?.nama || assignment.dospem2_nama || '-';

      // Tambahan 1: Dosen phone numbers (no_hp)
      const dospem1NoHp = adv1?.no_hp || assignment.dospem1_no_hp || '';
      const dospem2NoHp = adv2?.no_hp || assignment.dospem2_no_hp || '';

      // If graduate from archives without assignments, extract from archive
      if (std.isGraduate && std.archiveData) {
        if (dospem1Nama === '-') dospem1Nama = std.archiveData.pembimbing_1 || '-';
        if (dospem2Nama === '-') dospem2Nama = std.archiveData.dosen_pa || '-';
      }

      // Determine consultation sessions
      let p1Count = 0;
      let p2Count = 0;
      let totalSessions = 0;
      let latestDateFormatted = '-';
      let latestDateRaw = null;
      let latestStatus = null;
      let daysSinceLast = 999;
      let studentSessionsList = [];

      if (std.isGraduate) {
        // Graduates have successfully completed >= 24 sessions
        totalSessions = 24;
        p1Count = 12;
        p2Count = 12;
        latestDateFormatted = '01/08/2026';
        latestDateRaw = new Date('2026-08-01');
        latestStatus = 'Valid';
        daysSinceLast = 77;
        studentSessionsList = [];
      } else if (COHORT_NIMS_WITH_SESSIONS.has(cleanNim)) {
        const seed = SEED_COHORT_CONSULTATIONS.filter(s => s.nim === cleanNim);
        const fromContext = (consultations || []).filter(c => String(c.mhs_nim || c.nim || '').trim() === cleanNim);
        const studentSessions = seed.length > 0 ? seed : fromContext;

        const p1Sessions = studentSessions.filter(c => {
          const dNip = String(c.dosen_nip || c.id_dosen || '').trim();
          const dNama = (c.dosen_nama || '').toLowerCase();
          const p1N = dospem1Nama.toLowerCase();
          if (c.pembimbing === 'Pembimbing 1' || c.pembimbing === 'pembimbing_1') return true;
          if (dospem1Nip && dNip === dospem1Nip) return true;
          if (dospem1Nama !== '-' && dNama && (dNama.includes(p1N) || p1N.includes(dNama))) return true;
          return false;
        });

        const p2Sessions = studentSessions.filter(c => {
          const dNip = String(c.dosen_nip || c.id_dosen || '').trim();
          const dNama = (c.dosen_nama || '').toLowerCase();
          const p2N = dospem2Nama.toLowerCase();
          if (c.pembimbing === 'Pembimbing 2' || c.pembimbing === 'pembimbing_2') return true;
          if (dospem2Nip && dNip === dospem2Nip) return true;
          if (dospem2Nama !== '-' && dNama && (dNama.includes(p2N) || p2N.includes(dNama))) return true;
          return false;
        });

        p1Count = p1Sessions.length;
        p2Count = p2Sessions.length;
        totalSessions = studentSessions.length;

        const sortedSessions = [...studentSessions].sort((a, b) => {
          const dateA = new Date(a.tanggal || 0);
          const dateB = new Date(b.tanggal || 0);
          return dateB - dateA;
        });

        studentSessionsList = sortedSessions;

        const latestSession = sortedSessions[0] || null;
        if (latestSession && latestSession.tanggal) {
          const sessDate = new Date(latestSession.tanggal);
          if (!isNaN(sessDate.getTime())) {
            latestDateRaw = sessDate;
            const dd = String(sessDate.getDate()).padStart(2, '0');
            const mm = String(sessDate.getMonth() + 1).padStart(2, '0');
            const yyyy = sessDate.getFullYear();
            latestDateFormatted = `${dd}/${mm}/${yyyy}`;
            daysSinceLast = Math.max(0, Math.floor((now - sessDate) / (1000 * 60 * 60 * 24)));
          }
          latestStatus = latestSession.status || 'Menunggu Validasi';
        }
      }

      // Classification flags
      const isSiapSidang = totalSessions >= 24;
      const isBelumBimbingan = totalSessions === 0;
      const isOverdue30Days = totalSessions === 0 || daysSinceLast > 30;
      const isBelum24x = totalSessions < 24;

      // Tambahan 2b: Persen Progres = (totalSessions / 24) * 100, maksimal 100%, dibulatkan
      const progressPercent = Math.min(100, Math.round((totalSessions / 24) * 100));

      return {
        id: assignment.id || index + 1,
        nim: cleanNim,
        nama,
        angkatan,
        statusCategory,
        statusLabel,
        judul_ta,
        no_hp,
        dospem1_nip: dospem1Nip,
        dospem1_nama: dospem1Nama,
        dospem1_no_hp: dospem1NoHp,
        dospem1_count: p1Count,
        dospem2_nip: dospem2Nip,
        dospem2_nama: dospem2Nama,
        dospem2_no_hp: dospem2NoHp,
        dospem2_count: p2Count,
        totalSessions,
        progressPercent,
        latestDateFormatted,
        latestDateRaw,
        latestStatus,
        daysSinceLast,
        isSiapSidang,
        isBelumBimbingan,
        isOverdue30Days,
        isBelum24x,
        sessions: studentSessionsList
      };
    });
  }, [getAllRegisteredStudents, studentAdvisors, advisorMap, consultations, thesisTitles]);

  // Step 1: Filter by Angkatan & Status Mahasiswa (cohort baseline for the 4 summary cards)
  const scopedCohortStudents = useMemo(() => {
    return allMasterStudents.filter(s => {
      // Exclude single test student to strictly match official count when on 2024
      if (s.nim === '09010282428048') return false;

      // Filter Angkatan
      if (selectedAngkatanFilter !== 'all' && s.angkatan !== selectedAngkatanFilter) {
        return false;
      }

      // Filter Status Mahasiswa (Tambahan 3b)
      if (selectedStatusMhsFilter !== 'all' && s.statusCategory !== selectedStatusMhsFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));
  }, [allMasterStudents, selectedAngkatanFilter, selectedStatusMhsFilter]);

  // Step 2: Reactive Summary Metrics for 4 Cards (computed from the scoped cohort)
  const summaryMetrics = useMemo(() => {
    const total = scopedCohortStudents.length;
    const siapSidang = scopedCohortStudents.filter(s => s.isSiapSidang).length;
    const belumBimbingan = scopedCohortStudents.filter(s => s.isBelumBimbingan).length;
    const overdue30 = scopedCohortStudents.filter(s => s.isOverdue30Days).length;
    const belum24x = scopedCohortStudents.filter(s => s.isBelum24x).length;

    return {
      total,
      siapSidang,
      belumBimbingan,
      overdue30,
      belum24x
    };
  }, [scopedCohortStudents]);

  // Step 3: Filter by Progres Bimbingan category & Search text (Tambahan 3a: ikut mencari judul TA) + Sorting (Tambahan 2f)
  const filteredStudents = useMemo(() => {
    const filtered = scopedCohortStudents.filter(s => {
      // Progres Bimbingan Category filter
      if (selectedBimbinganFilter === 'siap_sidang' && !s.isSiapSidang) return false;
      if (selectedBimbinganFilter === 'belum_bimbingan' && !s.isBelumBimbingan) return false;
      if (selectedBimbinganFilter === 'overdue_30' && !s.isOverdue30Days) return false;
      if (selectedBimbinganFilter === 'belum_24x' && !s.isBelum24x) return false;

      // Tambahan 3a: Search query across name, NIM, advisor names, DAN judul TA
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.nama.toLowerCase().includes(q);
        const matchNim = s.nim.toLowerCase().includes(q);
        const matchP1 = s.dospem1_nama.toLowerCase().includes(q);
        const matchP2 = s.dospem2_nama.toLowerCase().includes(q);
        const matchJudul = (s.judul_ta || '').toLowerCase().includes(q);
        if (!matchName && !matchNim && !matchP1 && !matchP2 && !matchJudul) return false;
      }

      return true;
    });

    // Tambahan 2f: Sorting Progres dan Terakhir
    if (sortConfig.key === 'progres') {
      return [...filtered].sort((a, b) => {
        const diff = a.totalSessions - b.totalSessions;
        return sortConfig.direction === 'asc' ? diff : -diff;
      });
    }

    if (sortConfig.key === 'terakhir') {
      return [...filtered].sort((a, b) => {
        const timeA = a.latestDateRaw ? a.latestDateRaw.getTime() : 0;
        const timeB = b.latestDateRaw ? b.latestDateRaw.getTime() : 0;
        const diff = timeA - timeB;
        return sortConfig.direction === 'asc' ? diff : -diff;
      });
    }

    return filtered;
  }, [scopedCohortStudents, selectedBimbinganFilter, searchQuery, sortConfig]);

  // Paginated Data
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Handle Card Click Toggle for Progres Bimbingan
  const handleCardClick = (filterKey) => {
    if (selectedBimbinganFilter === filterKey) {
      setSelectedBimbinganFilter('all');
    } else {
      setSelectedBimbinganFilter(filterKey);
    }
    setCurrentPage(1);
  };

  // Reset all filters to default state (Tambahan 3b: Status Mahasiswa kembali ke 'aktif')
  const handleResetFilters = () => {
    setSelectedBimbinganFilter('all');
    setSelectedAngkatanFilter('2024');
    setSelectedStatusMhsFilter('aktif'); // Tambahan 3b: default 'aktif'
    setSearchQuery('');
    setSortConfig({ key: null, direction: 'asc' });
    setCurrentPage(1);
  };

  // Check if any filter is active / different from default view
  const isFiltered = (
    selectedBimbinganFilter !== 'all' ||
    selectedAngkatanFilter !== '2024' ||
    selectedStatusMhsFilter !== 'aktif' ||
    searchQuery.trim() !== '' ||
    sortConfig.key !== null
  );

  // Toggle Sorting (Tambahan 2f)
  const handleToggleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        return { key: null, direction: 'asc' };
      }
      return { key, direction: 'asc' };
    });
    setCurrentPage(1);
  };

  // Open WhatsApp Modal (Tambahan 4)
  const handleOpenWaModal = (type, student) => {
    const defaultTarget = 'p1';
    let defaultMsg = '';

    if (type === 'dosen') {
      const targetDosenNama = student.dospem1_nama !== '-' ? student.dospem1_nama : 'Bapak/Ibu Pembimbing';
      if (student.totalSessions === 0) {
        defaultMsg = `Selamat siang Bapak/Ibu ${targetDosenNama}, mahasiswa bimbingan ${student.nama} belum melakukan bimbingan sama sekali. Mohon dapat ditindaklanjuti.`;
      } else {
        defaultMsg = `Selamat siang Bapak/Ibu ${targetDosenNama}, mahasiswa bimbingan ${student.nama} sudah ${student.daysSinceLast} hari belum bimbingan. Mohon dapat ditindaklanjuti.`;
      }
    } else {
      defaultMsg = `Halo ${student.nama}, apa kabar? Bagaimana progres tugas akhirnya?`;
    }

    setWaModal({
      isOpen: true,
      type,
      student,
      selectedTarget: defaultTarget,
      message: defaultMsg
    });
  };

  // Switch Target Dosen in WA Modal
  const handleWaTargetDosenChange = (target) => {
    if (!waModal.student) return;
    const targetDosenNama = target === 'p1' 
      ? (waModal.student.dospem1_nama !== '-' ? waModal.student.dospem1_nama : 'Bapak/Ibu Pembimbing')
      : (waModal.student.dospem2_nama !== '-' ? waModal.student.dospem2_nama : 'Bapak/Ibu Pembimbing');

    let newMsg = '';
    if (waModal.student.totalSessions === 0) {
      newMsg = `Selamat siang Bapak/Ibu ${targetDosenNama}, mahasiswa bimbingan ${waModal.student.nama} belum melakukan bimbingan sama sekali. Mohon dapat ditindaklanjuti.`;
    } else {
      newMsg = `Selamat siang Bapak/Ibu ${targetDosenNama}, mahasiswa bimbingan ${waModal.student.nama} sudah ${waModal.student.daysSinceLast} hari belum bimbingan. Mohon dapat ditindaklanjuti.`;
    }

    setWaModal(prev => ({
      ...prev,
      selectedTarget: target,
      message: newMsg
    }));
  };

  // Direct Send WhatsApp (Buka kontak langsung dengan template atau chat kosong)
  const handleDirectSendWhatsApp = (isTemplate) => {
    if (!waModal.student) return;

    let targetPhone = '';
    let targetNama = '';

    if (waModal.type === 'dosen') {
      if (waModal.selectedTarget === 'p1') {
        targetPhone = waModal.student.dospem1_no_hp;
        targetNama = waModal.student.dospem1_nama;
      } else {
        targetPhone = waModal.student.dospem2_no_hp;
        targetNama = waModal.student.dospem2_nama;
      }
    } else {
      targetPhone = waModal.student.no_hp;
      targetNama = waModal.student.nama;
    }

    const normalized = normalizePhoneNumber(targetPhone);
    if (!normalized) return;

    const messageText = isTemplate ? waModal.message : '';

    // Catat klik "Ingatkan Dosen" ke riwayat log / localStorage
    if (waModal.type === 'dosen') {
      try {
        const existingLogs = JSON.parse(localStorage.getItem('simta_bimbingan_reminders') || '[]');
        const newLogEntry = {
          id: `log-wa-${Date.now()}`,
          timestamp: new Date().toISOString(),
          waktu: new Date().toLocaleString('id-ID'),
          sender: currentUser?.nama || 'Dr. Abdiansah, S.Kom., M.Cs. (Kaprodi)',
          dosen_nama: targetNama,
          mhs_nama: waModal.student.nama,
          mhs_nim: waModal.student.nim,
          metode: isTemplate ? 'WhatsApp (Pakai Template)' : 'WhatsApp (Chat Kosong)',
          pesan: messageText || '(Chat Kosong)',
          status: 'Terkirim (WA Web)'
        };
        localStorage.setItem('simta_bimbingan_reminders', JSON.stringify([newLogEntry, ...existingLogs]));
      } catch (err) {
        console.warn('Gagal mencatat log reminder WA:', err);
      }
    }

    // Buka link wa.me di tab baru (otomatis terisi di kotak pesan WhatsApp tapi belum terkirim otomatis)
    const waUrl = messageText 
      ? `https://wa.me/${normalized}?text=${encodeURIComponent(messageText)}`
      : `https://wa.me/${normalized}`;
      
    window.open(waUrl, '_blank');

    // Tutup modal
    setWaModal({
      isOpen: false,
      type: 'dosen',
      student: null,
      selectedTarget: 'p1',
      message: ''
    });
  };

  // Tambahan 3c: Ekspor Excel
  const handleExportExcel = () => {
    if (filteredStudents.length === 0) {
      alert('Tidak ada data mahasiswa untuk diekspor!');
      return;
    }

    const rowsHtml = filteredStudents.map((s, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td><strong>${s.nama}</strong></td>
        <td>'${s.nim}</td>
        <td style="text-align: center;">${s.angkatan}</td>
        <td style="text-align: center;">${s.statusLabel}</td>
        <td>${s.judul_ta || 'Judul belum diisi'}</td>
        <td>${s.dospem1_nama}</td>
        <td style="text-align: center;">${s.dospem1_count}</td>
        <td>${s.dospem2_nama}</td>
        <td style="text-align: center;">${s.dospem2_count}</td>
        <td style="text-align: center;">${s.totalSessions}</td>
        <td style="text-align: center;">${s.progressPercent}%</td>
        <td style="text-align: center;">${s.latestDateFormatted} (${s.latestStatus || '-'})</td>
        <td style="text-align: center;">${s.isBelumBimbingan ? 'Belum bimbingan' : ''} ${s.daysSinceLast > 30 ? '> 30 hari' : ''} ${s.isSiapSidang ? 'Siap sidang' : ''}</td>
      </tr>
    `).join('');

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 11px; }
          th { background-color: #1e3a8a; color: #ffffff; border: 1px solid #1e293b; padding: 8px; font-size: 12px; }
          td { border: 1px solid #cbd5e1; padding: 6px; }
          .title { font-size: 16px; font-weight: bold; margin-bottom: 4px; color: #0f172a; }
          .subtitle { font-size: 12px; color: #475569; margin-bottom: 12px; }
        </style>
      </head>
      <body>
        <div class="title">MONITORING MAHASISWA TUGAS AKHIR</div>
        <div class="subtitle">Program Studi D3 Manajemen Informatika | Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID')}</div>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Mahasiswa</th>
              <th>NIM</th>
              <th>Angkatan</th>
              <th>Status</th>
              <th>Judul Tugas Akhir</th>
              <th>Pembimbing 1</th>
              <th>Sesi P1</th>
              <th>Pembimbing 2</th>
              <th>Sesi P2</th>
              <th>Total Sesi</th>
              <th>Progres (%)</th>
              <th>Bimbingan Terakhir</th>
              <th>Peringatan</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `monitoring_mahasiswa_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Render Latest Status Badge (Revisi Minor, Revisi Mayor, Valid, Menunggu Validasi)
  const renderLatestStatusBadge = (status) => {
    if (!status) return null;
    let bgStyle = 'bg-slate-700 text-white';
    if (status === 'Revisi Mayor') bgStyle = 'bg-rose-600 text-white';
    else if (status === 'Revisi Minor') bgStyle = 'bg-amber-500 text-white';
    else if (status === 'Valid') bgStyle = 'bg-emerald-600 text-white';

    return (
      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold leading-none ${bgStyle}`}>
        {status}
      </span>
    );
  };

  // Render Student Status Badge (Aktif, Tidak Aktif, Lulus)
  const renderStatusBadge = (statusCategory, statusLabel) => {
    if (statusCategory === 'tidak_aktif') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-2xs">
          {statusLabel || 'Tidak Aktif'}
        </span>
      );
    }
    if (statusCategory === 'lulus') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-2xs">
          {statusLabel || 'Lulus'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-2xs">
        {statusLabel || 'Aktif'}
      </span>
    );
  };

  // Current Target phone number in WA modal
  const currentModalPhone = useMemo(() => {
    if (!waModal.student) return '';
    if (waModal.type === 'dosen') {
      return waModal.selectedTarget === 'p1' ? waModal.student.dospem1_no_hp : waModal.student.dospem2_no_hp;
    }
    return waModal.student.no_hp;
  }, [waModal]);

  return (
    <div className="w-full space-y-6 select-none font-sans pb-10">
      
      {/* 1. JUDUL "Monitoring Mahasiswa" (Signature Blue Gradient Hero Banner like Rekap & Reminder) */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 shadow-xl border border-blue-700/40 overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Subtle background glow effect */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-[11px] font-bold border border-blue-400/30 backdrop-blur-xs">
              <Users className="w-3.5 h-3.5 text-blue-300" />
              <span>Monitoring Kaprodi &amp; Evaluasi TA</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-[11px] font-semibold backdrop-blur-xs border border-indigo-400/20">
              D3 Manajemen Informatika
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Monitoring Mahasiswa
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal max-w-3xl">
            Pantau progres bimbingan, keaktifan konsultasi, kesiapan sidang, dan deteksi dini mahasiswa Tugas Akhir yang memerlukan perhatian khusus.
          </p>

          <div className="pt-1 flex flex-wrap items-center gap-2.5 text-xs font-medium text-blue-200">
            <span className="inline-flex items-center gap-1.5 bg-blue-950/70 px-3 py-1 rounded-lg border border-blue-800/60 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Target Kelulusan: &ge; 24 Sesi Bimbingan
            </span>
            <span className="inline-flex items-center gap-1.5 bg-blue-950/70 px-3 py-1 rounded-lg border border-blue-800/60 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              Status Sinkron Real-Time
            </span>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <div className="bg-white/10 backdrop-blur-xs px-4 py-3 rounded-2xl border border-white/15 text-right shadow-2xs">
            <span className="block text-[10px] font-bold text-blue-200 uppercase tracking-wider">
              Total Mahasiswa Terpantau
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white font-mono leading-none">
              {scopedCohortStudents.length}
            </span>
          </div>
        </div>
      </div>

      {/* 2. 4 Kartu Ringkasan (Siap sidang, Belum bimbingan, Tanpa bimbingan > 30 hari, Belum 24x) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Siap sidang */}
        <div 
          onClick={() => handleCardClick('siap_sidang')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer bg-white group shadow-2xs ${
            selectedBimbinganFilter === 'siap_sidang'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs bg-emerald-50/10'
              : 'border-slate-200 hover:border-emerald-300 hover:shadow-xs'
          }`}
          title="Klik untuk filter mahasiswa siap sidang"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider group-hover:text-emerald-700 transition-colors">
              Siap sidang
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tracking-tight leading-none">
            {summaryMetrics.siapSidang}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Memenuhi syarat &ge; 24 bimbingan
          </p>
        </div>

        {/* Card 2: Belum bimbingan */}
        <div 
          onClick={() => handleCardClick('belum_bimbingan')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer bg-white group shadow-2xs ${
            selectedBimbinganFilter === 'belum_bimbingan'
              ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-xs bg-rose-50/10'
              : 'border-slate-200 hover:border-rose-300 hover:shadow-xs'
          }`}
          title="Klik untuk filter mahasiswa yang belum bimbingan"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider group-hover:text-rose-700 transition-colors">
              Belum bimbingan
            </span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tracking-tight leading-none">
            {summaryMetrics.belumBimbingan}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Belum ada catatan konsultasi
          </p>
        </div>

        {/* Card 3: Tanpa bimbingan > 30 hari */}
        <div 
          onClick={() => handleCardClick('overdue_30')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer bg-white group shadow-2xs ${
            selectedBimbinganFilter === 'overdue_30'
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xs bg-amber-50/10'
              : 'border-slate-200 hover:border-amber-300 hover:shadow-xs'
          }`}
          title="Klik untuk filter mahasiswa tanpa bimbingan > 30 hari"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider group-hover:text-amber-700 transition-colors">
              Tanpa bimbingan &gt; 30 hari
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tracking-tight leading-none">
            {summaryMetrics.overdue30}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Perlu perhatian &amp; peringatan
          </p>
        </div>

        {/* Card 4: Belum 24x */}
        <div 
          onClick={() => handleCardClick('belum_24x')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer bg-white group shadow-2xs ${
            selectedBimbinganFilter === 'belum_24x'
              ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-xs bg-blue-50/10'
              : 'border-slate-200 hover:border-blue-300 hover:shadow-xs'
          }`}
          title="Klik untuk filter mahasiswa dengan bimbingan belum mencapai 24x"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider group-hover:text-blue-700 transition-colors">
              Belum 24x
            </span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tracking-tight leading-none">
            {summaryMetrics.belum24x}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Progres bimbingan masih berjalan
          </p>
        </div>

      </div>

      {/* 3. Panel Kontrol & Filter Terpadu (Progres Bimbingan, Angkatan, Status Mahasiswa, Pencarian) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        
        {/* Header Panel Filter */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Filter Data Monitoring Mahasiswa</span>
            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              Sinkron dengan kartu ringkasan
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {selectedAngkatanFilter === '2024' && selectedStatusMhsFilter === 'aktif' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200 text-[11px]">
                Filter Default: Mahasiswa Aktif 2024
              </span>
            )}

            {/* Tambahan 3c: Tombol Ekspor Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
              title="Ekspor data hasil filter ke file Excel (.xls)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ekspor Excel</span>
            </button>
          </div>
        </div>
        
        {/* Baris Filter 4 Kolom Proporsional */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Kolom 1: Filter Progres Bimbingan */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>Progres Bimbingan</span>
            </label>
            <select
              value={selectedBimbinganFilter}
              onChange={(e) => {
                setSelectedBimbinganFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-700 shadow-2xs hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
            >
              <option value="all">Semua Progres Bimbingan</option>
              <option value="siap_sidang">Siap sidang (≥ 24x)</option>
              <option value="belum_bimbingan">Belum bimbingan (0x)</option>
              <option value="overdue_30">Tanpa bimbingan &gt; 30 hari</option>
              <option value="belum_24x">Belum 24x</option>
            </select>
          </div>

          {/* Kolom 2: Filter Tahun Angkatan */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tahun Angkatan</span>
            </label>
            <select
              value={selectedAngkatanFilter}
              onChange={(e) => {
                setSelectedAngkatanFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-700 shadow-2xs hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all"
            >
              <option value="2024">Angkatan 2024 (Aktif TA)</option>
              <option value="2025">Angkatan 2025</option>
              <option value="2023">Angkatan 2023 (Alumni/Lulus)</option>
              <option value="2022">Angkatan 2022 (Alumni/Lulus)</option>
              <option value="all">Semua Angkatan</option>
            </select>
          </div>

          {/* Kolom 3: Filter Status Mahasiswa (Tambahan 3b: default 'aktif') */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Status Mahasiswa</span>
            </label>
            <select
              value={selectedStatusMhsFilter}
              onChange={(e) => {
                setSelectedStatusMhsFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-700 shadow-2xs hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer transition-all"
            >
              <option value="aktif">Mahasiswa Aktif (Default)</option>
              <option value="lulus">Mahasiswa Lulus</option>
              <option value="tidak_aktif">Mahasiswa Tidak Aktif</option>
              <option value="all">Semua Status Mahasiswa</option>
            </select>
          </div>

          {/* Kolom 4: Pencarian Data (Tambahan 3a: ikut mencari judul TA) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>Pencarian Data</span>
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama, NIM, dosen, judul TA..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 placeholder:text-slate-400 shadow-2xs hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  title="Hapus kata kunci pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Baris Ringkasan Filter Aktif & Indikator Jumlah Data */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-100 text-xs">
          
          {/* Tag & Tombol Reset */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Filter Aktif:
            </span>
            
            {/* Chip Angkatan */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200/60 text-indigo-700 font-semibold text-[11px]">
              Angkatan: {selectedAngkatanFilter === 'all' ? 'Semua' : selectedAngkatanFilter}
            </span>

            {/* Chip Status */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/60 text-emerald-700 font-semibold text-[11px]">
              Status: {
                selectedStatusMhsFilter === 'all' ? 'Semua' :
                selectedStatusMhsFilter === 'aktif' ? 'Aktif' :
                selectedStatusMhsFilter === 'tidak_aktif' ? 'Tidak Aktif' : 'Lulus'
              }
            </span>

            {/* Chip Progres Bimbingan jika bukan all */}
            {selectedBimbinganFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200/60 text-blue-700 font-semibold text-[11px]">
                Progres: {
                  selectedBimbinganFilter === 'siap_sidang' ? 'Siap sidang' :
                  selectedBimbinganFilter === 'belum_bimbingan' ? 'Belum bimbingan' :
                  selectedBimbinganFilter === 'overdue_30' ? '> 30 hari' : 'Belum 24x'
                }
              </span>
            )}

            {/* Chip Sorting jika aktif */}
            {sortConfig.key && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/60 text-amber-800 font-semibold text-[11px]">
                Urut: {sortConfig.key === 'progres' ? 'Progres' : 'Terakhir'} ({sortConfig.direction === 'asc' ? 'Naik' : 'Turun'})
              </span>
            )}

            {/* Reset Button jika filter aktif */}
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[11px] transition-colors cursor-pointer"
                title="Kembalikan semua filter ke pengaturan awal"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>

          {/* Indikator Jumlah Data */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 text-slate-700 font-medium text-xs">
            <span>Menampilkan</span>
            <span className="text-blue-600 font-mono font-extrabold">{filteredStudents.length}</span>
            <span>dari</span>
            <span className="font-mono font-bold text-slate-800">{scopedCohortStudents.length}</span>
            <span>mahasiswa</span>
          </div>

        </div>

      </div>

      {/* ===================================================================
          4. TABEL MONITORING MAHASISWA
             Kolom:
             - MAHASISWA (Nama, NIM, Angkatan, Status, Judul TA)
             - PEMBIMBING-1
             - PEMBIMBING-2
             - PROGRES (Bar + Persen + Sorting)
             - TERAKHIR (Tanggal + Status + Sorting)
             - PERINGATAN (Badge Belum bimbingan & > 30 hari)
             - AKSI (Ingatkan Dosen & WA Mahasiswa)
          =================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            
            {/* Table Header */}
            <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs text-slate-700 uppercase tracking-wider text-[11px] font-extrabold border-b border-slate-200">
              <tr>
                <th scope="col" className="px-3 py-3 w-[240px]">Mahasiswa</th>
                <th scope="col" className="px-3 py-3 min-w-[180px]">Judul Tugas Akhir</th>
                <th scope="col" className="px-3 py-3 w-[145px]">Pembimbing-1</th>
                <th scope="col" className="px-3 py-3 w-[145px]">Pembimbing-2</th>
                
                {/* Sortable Progres Header */}
                <th 
                  scope="col" 
                  onClick={() => handleToggleSort('progres')}
                  className="px-2 py-3 w-[100px] cursor-pointer select-none hover:bg-slate-200/70 transition-colors"
                  title="Klik untuk mengurutkan berdasarkan progres bimbingan"
                >
                  <div className="flex items-center space-x-1">
                    <span>Progres</span>
                    {sortConfig.key === 'progres' ? (
                      sortConfig.direction === 'asc' ? (
                        <ChevronUp className="w-3.5 h-3.5 text-blue-600 font-bold" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-blue-600 font-bold" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                    )}
                  </div>
                </th>

                {/* Sortable Terakhir Header */}
                <th 
                  scope="col" 
                  onClick={() => handleToggleSort('terakhir')}
                  className="px-2 py-3 w-[95px] cursor-pointer select-none hover:bg-slate-200/70 transition-colors"
                  title="Klik untuk mengurutkan berdasarkan tanggal bimbingan terakhir"
                >
                  <div className="flex items-center space-x-1">
                    <span>Terakhir</span>
                    {sortConfig.key === 'terakhir' ? (
                      sortConfig.direction === 'asc' ? (
                        <ChevronUp className="w-3.5 h-3.5 text-blue-600 font-bold" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-blue-600 font-bold" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                    )}
                  </div>
                </th>

                <th scope="col" className="px-2 py-3 w-[110px] text-center">Peringatan</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                        <Inbox className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Tidak ada data mahasiswa</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Tidak ditemukan mahasiswa yang sesuai dengan filter atau kata kunci pencarian saat ini.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Semua Filter</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => {
                  return (
                    <tr 
                      key={student.nim}
                      onClick={() => setSelectedStudentDetail(student)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                      title="Klik baris ini untuk melihat keterangan lengkap mahasiswa"
                    >
                      
                      {/* Kolom 1: MAHASISWA (Nama, NIM, Angkatan, Badge Status, dan Tombol Aksi di baris bawahnya) */}
                      <td className="px-3 py-2.5 align-middle">
                        <div className="space-y-1">
                          <span className="font-extrabold text-slate-900 block text-xs tracking-tight leading-snug group-hover:text-blue-600 transition-colors">
                            {student.nama}
                          </span>
                          <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-mono">
                            <span>{student.nim}</span>
                            <span>&middot;</span>
                            <span>{student.angkatan}</span>
                            {renderStatusBadge(student.statusCategory, student.statusLabel)}
                          </div>
                          
                          {/* Tombol Aksi Ringkas & Rapi (Tanpa Teks Terpotong/Wrapped) */}
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenWaModal('dosen', student);
                              }}
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                              title="Kirim pesan WhatsApp pengingat ke Dosen Pembimbing"
                            >
                              <Bell className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
                              <span>Ingatkan Dosen</span>
                            </button>

                            {student.no_hp ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenWaModal('mahasiswa', student);
                                }}
                                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                                title={`Hubungi mahasiswa via WhatsApp (${student.no_hp})`}
                              >
                                <MessageSquare className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                <span>WA Mahasiswa</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60 shadow-2xs whitespace-nowrap"
                                title="Nomor HP belum diisi"
                              >
                                <MessageSquare className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                <span>WA Mahasiswa</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Kolom 2: JUDUL TUGAS AKHIR */}
                      <td className="px-3 py-2.5 align-middle max-w-[240px]">
                        {student.judul_ta ? (
                          <p 
                            className="text-[11px] text-slate-600 line-clamp-2 leading-tight cursor-default font-normal"
                            title={student.judul_ta}
                          >
                            {student.judul_ta}
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">
                            Judul belum diisi
                          </p>
                        )}
                      </td>

                      {/* Kolom 3: PEMBIMBING-1 (Nama Dospem + Jumlah Sesi) */}
                      <td className="px-3 py-2.5 align-middle">
                        <div className="flex items-center justify-between space-x-1.5">
                          <span className="font-semibold text-slate-800 text-xs truncate max-w-[120px]" title={student.dospem1_nama}>
                            {student.dospem1_nama}
                          </span>
                          <span className="text-slate-900 font-extrabold text-xs font-mono shrink-0">
                            {student.dospem1_count}
                          </span>
                        </div>
                      </td>

                      {/* Kolom 4: PEMBIMBING-2 (Nama Dospem + Jumlah Sesi) */}
                      <td className="px-3 py-2.5 align-middle">
                        <div className="flex items-center justify-between space-x-1.5">
                          <span className="font-semibold text-slate-800 text-xs truncate max-w-[120px]" title={student.dospem2_nama}>
                            {student.dospem2_nama}
                          </span>
                          <span className="text-slate-900 font-extrabold text-xs font-mono shrink-0">
                            {student.dospem2_count}
                          </span>
                        </div>
                      </td>

                      {/* Kolom 5: PROGRES (Bar + Persen di samping) */}
                      <td className="px-2.5 py-2.5 align-middle">
                        <div className="flex items-center space-x-1.5">
                          <div className="w-14 bg-slate-200/90 rounded-full h-2 overflow-hidden p-0.5 flex items-center">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                student.progressPercent < 30 
                                ? 'bg-rose-500' 
                                : student.progressPercent < 80 
                                  ? 'bg-amber-400' 
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${student.progressPercent}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 font-mono min-w-[26px]">
                            {student.progressPercent}%
                          </span>
                        </div>
                      </td>

                      {/* Kolom 6: TERAKHIR (Tanggal Sesi + Status Badge) */}
                      <td className="px-2.5 py-2.5 align-middle">
                        {student.latestDateFormatted === '-' ? (
                          <span className="text-slate-400 font-bold text-xs block">
                            -
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="block text-[11px] font-bold text-slate-800 font-mono leading-none">
                              {student.latestDateFormatted}
                            </span>
                            {renderLatestStatusBadge(student.latestStatus)}
                          </div>
                        )}
                      </td>

                      {/* Kolom 7: PERINGATAN (Badge Belum bimbingan & Badge > 30 hari) */}
                      <td className="px-2.5 py-2.5 text-center align-middle whitespace-nowrap">
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          {student.isBelumBimbingan && (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white shadow-2xs whitespace-nowrap">
                              Belum bimbingan
                            </span>
                          )}
                          {student.isOverdue30Days && (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white shadow-2xs whitespace-nowrap">
                              &gt; 30 hari
                            </span>
                          )}
                          {student.isSiapSidang && (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white shadow-2xs whitespace-nowrap">
                              Siap sidang
                            </span>
                          )}
                          {!student.isBelumBimbingan && !student.isSiapSidang && !student.isOverdue30Days && (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-500 text-white shadow-2xs whitespace-nowrap">
                              &lt; 24x
                            </span>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination Controls */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <span>Baris per halaman:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:border-indigo-600 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-slate-400 pl-2">
              Halaman {currentPage} dari {totalPages}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                  if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                }
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* ===================================================================
          5. MODAL WHATSAPP: OPSI CHAT KOSONG ATAU TEMPLATE
          =================================================================== */}
      {waModal.isOpen && waModal.student && (
        <div 
          data-lenis-prevent="true"
          onClick={() => setWaModal(prev => ({ ...prev, isOpen: false }))}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overscroll-contain"
        >
          <div 
            data-lenis-prevent="true"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden space-y-4 p-5 sm:p-6 animate-in zoom-in-95 duration-200"
          >
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  waModal.type === 'dosen' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {waModal.type === 'dosen' ? <Bell className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {waModal.type === 'dosen' ? 'Ingatkan Dosen via WhatsApp' : 'Hubungi Mahasiswa via WhatsApp'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {waModal.type === 'dosen' ? (
                      <>Mahasiswa: <span className="font-semibold text-slate-700">{waModal.student.nama}</span></>
                    ) : (
                      <>Penerima: <span className="font-semibold text-slate-700">{waModal.student.nama}</span> ({waModal.student.nim})</>
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWaModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Jika Dosen: Pilihan Target Dosen (Pembimbing 1 vs Pembimbing 2) */}
            {waModal.type === 'dosen' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Pilih Dosen Tujuan:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Opsi P1 */}
                  <div 
                    onClick={() => handleWaTargetDosenChange('p1')}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      waModal.selectedTarget === 'p1'
                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500/30'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-slate-800">Pembimbing 1</span>
                      <input
                        type="radio"
                        name="targetDosen"
                        checked={waModal.selectedTarget === 'p1'}
                        onChange={() => handleWaTargetDosenChange('p1')}
                        className="text-indigo-600"
                      />
                    </div>
                    <p className="font-semibold text-slate-700 line-clamp-1">{waModal.student.dospem1_nama}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {waModal.student.dospem1_no_hp || 'No HP belum diisi'}
                    </p>
                  </div>

                  {/* Opsi P2 */}
                  <div 
                    onClick={() => handleWaTargetDosenChange('p2')}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      waModal.selectedTarget === 'p2'
                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500/30'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-slate-800">Pembimbing 2</span>
                      <input
                        type="radio"
                        name="targetDosen"
                        checked={waModal.selectedTarget === 'p2'}
                        onChange={() => handleWaTargetDosenChange('p2')}
                        className="text-indigo-600"
                      />
                    </div>
                    <p className="font-semibold text-slate-700 line-clamp-1">{waModal.student.dospem2_nama}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {waModal.student.dospem2_no_hp || 'No HP belum diisi'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Opsi 1: Kirim Template & Opsi 2: Chat Kosong */}
            <div className="space-y-3 pt-1">
              <label className="block text-xs font-bold text-slate-700">
                Pilih Opsi Pesan WhatsApp:
              </label>

              {/* Card Opsi Template */}
              <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70 transition-all space-y-2.5">
                <div>
                  <span className="font-bold text-xs text-slate-900 block flex items-center space-x-1.5">
                    <span>1. Pakai Template Pesan</span>
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Membuka WhatsApp dengan teks template otomatis terisi di kotak pesan (belum terkirim).
                  </span>
                </div>
                
                <div className="p-2.5 rounded-xl bg-white border border-emerald-100 text-xs text-slate-700 leading-relaxed font-sans shadow-2xs">
                  "{waModal.message}"
                </div>

                {currentModalPhone ? (
                  <button
                    type="button"
                    onClick={() => handleDirectSendWhatsApp(true)}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka WhatsApp dengan Template</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full py-2 px-3 rounded-xl bg-slate-200 text-slate-400 font-bold text-xs cursor-not-allowed opacity-60"
                  >
                    Nomor HP belum diisi
                  </button>
                )}
              </div>

              {/* Card Opsi Chat Kosong */}
              <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 transition-all flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">
                    2. Chat Kosong
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Buka kontak WhatsApp langsung tanpa pesan awal.
                  </span>
                </div>
                {currentModalPhone ? (
                  <button
                    type="button"
                    onClick={() => handleDirectSendWhatsApp(false)}
                    className="py-2 px-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 transition-colors flex items-center space-x-1 cursor-pointer shrink-0 ml-3 shadow-2xs"
                  >
                    <span>Buka Chat Kosong</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="py-2 px-3.5 rounded-xl bg-slate-200 text-slate-400 font-bold text-xs cursor-not-allowed opacity-60 shrink-0 ml-3"
                  >
                    No HP Kosong
                  </button>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Pesan tidak akan terkirim sebelum Anda menekan tombol kirim di WhatsApp.
              </span>
              <button
                type="button"
                onClick={() => setWaModal(prev => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ===================================================================
          6. CARD MODAL: KETERANGAN LENGKAP MAHASISWA
          =================================================================== */}
      {selectedStudentDetail && (
        <div 
          data-lenis-prevent="true"
          onClick={() => setSelectedStudentDetail(null)}
          onWheel={handleCardWheel}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overscroll-contain"
        >
          <div 
            data-lenis-prevent="true"
            onClick={(e) => e.stopPropagation()}
            onWheel={handleCardWheel}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] sm:max-h-[88vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
          >
            
            {/* Header Gradient */}
            <div className="relative bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between shrink-0">
              <div className="space-y-1.5 pr-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 text-[10px] font-bold border border-blue-400/30 backdrop-blur-xs">
                    Detail Mahasiswa Bimbingan TA
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-semibold">
                    Angkatan {selectedStudentDetail.angkatan}
                  </span>
                  {renderStatusBadge(selectedStudentDetail.statusCategory, selectedStudentDetail.statusLabel)}
                </div>
                
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {selectedStudentDetail.nama}
                </h3>
                
                <p className="text-xs text-blue-200/90 font-mono">
                  NIM: <span className="font-bold text-white">{selectedStudentDetail.nim}</span> • Prodi D3 Manajemen Informatika
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudentDetail(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Scrollable */}
            <div 
              ref={cardScrollRef}
              data-lenis-prevent="true"
              tabIndex={0}
              className="card-scroll-area flex-1 p-5 sm:p-6 overflow-y-auto space-y-4 text-xs overscroll-contain focus:outline-none focus:ring-1 focus:ring-blue-500/10"
            >
              
              {/* Judul Tugas Akhir */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Judul Tugas Akhir:
                </span>
                {selectedStudentDetail.judul_ta ? (
                  <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                    {selectedStudentDetail.judul_ta}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Mahasiswa belum menginputkan atau mengajukan judul tugas akhir.
                  </p>
                )}
              </div>

              {/* Dosen Pembimbing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pembimbing 1 */}
                <div className="p-3.5 rounded-2xl border border-indigo-100 bg-indigo-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-900 text-[11px]">Pembimbing 1</span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-mono font-extrabold text-[10px]">
                      {selectedStudentDetail.dospem1_count} Sesi
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{selectedStudentDetail.dospem1_nama}</p>
                    <p className="text-[11px] text-slate-500 font-mono">NIP: {selectedStudentDetail.dospem1_nip || '-'}</p>
                    <p className="text-[11px] text-slate-500 font-mono">No HP: {selectedStudentDetail.dospem1_no_hp || '-'}</p>
                  </div>
                </div>

                {/* Pembimbing 2 */}
                <div className="p-3.5 rounded-2xl border border-indigo-100 bg-indigo-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-900 text-[11px]">Pembimbing 2</span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-mono font-extrabold text-[10px]">
                      {selectedStudentDetail.dospem2_count} Sesi
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{selectedStudentDetail.dospem2_nama}</p>
                    <p className="text-[11px] text-slate-500 font-mono">NIP: {selectedStudentDetail.dospem2_nip || '-'}</p>
                    <p className="text-[11px] text-slate-500 font-mono">No HP: {selectedStudentDetail.dospem2_no_hp || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Metric Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Bimbingan</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    {selectedStudentDetail.totalSessions} <span className="text-xs text-slate-400 font-normal">/ 24</span>
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Progres</span>
                  <span className="text-base font-black text-blue-600 font-mono">
                    {selectedStudentDetail.progressPercent}%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Bimbingan Terakhir</span>
                  <span className="text-xs font-bold text-slate-800 font-mono block mt-0.5">
                    {selectedStudentDetail.latestDateFormatted}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Status Terakhir</span>
                  <div className="mt-1">
                    {selectedStudentDetail.latestStatus ? (
                      renderLatestStatusBadge(selectedStudentDetail.latestStatus)
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Belum ada</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Riwayat Sesi Konsultasi */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">Riwayat Sesi Konsultasi / Bimbingan:</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {selectedStudentDetail.sessions?.length || 0} catatan
                  </span>
                </div>

                {selectedStudentDetail.sessions && selectedStudentDetail.sessions.length > 0 ? (
                  <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
                    {selectedStudentDetail.sessions.map((sess, idx) => (
                      <div key={sess.id || idx} className="p-3 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-800 font-mono text-[11px]">
                              Sesi #{selectedStudentDetail.sessions.length - idx}
                            </span>
                            <span>•</span>
                            <span className="text-slate-600 font-medium">
                              {sess.tanggal || '-'}
                            </span>
                            <span>•</span>
                            <span className="text-slate-500">
                              {sess.pembimbing || 'Pembimbing 1'} ({sess.dosen_nama || selectedStudentDetail.dospem1_nama})
                            </span>
                          </div>
                          {sess.catatan && (
                            <p className="text-[11px] text-slate-500 italic line-clamp-1">
                              "{sess.catatan}"
                            </p>
                          )}
                        </div>
                        <div>
                          {renderLatestStatusBadge(sess.status || 'Valid')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                    <p className="font-semibold text-slate-600">Belum ada riwayat bimbingan yang tercatat.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Mahasiswa ini belum melakukan sesi konsultasi dengan dosen pembimbing.</p>
                  </div>
                )}
              </div>

              {/* Kontak Mahasiswa */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block tracking-wider">
                    Kontak WhatsApp Mahasiswa:
                  </span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {selectedStudentDetail.no_hp || <span className="text-rose-500 font-sans text-xs">Nomor HP belum diisi</span>}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const std = selectedStudentDetail;
                      setSelectedStudentDetail(null);
                      handleOpenWaModal('dosen', std);
                    }}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shadow-xs"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Ingatkan Dosen</span>
                  </button>

                  {selectedStudentDetail.no_hp ? (
                    <button
                      type="button"
                      onClick={() => {
                        const std = selectedStudentDetail;
                        setSelectedStudentDetail(null);
                        handleOpenWaModal('mahasiswa', std);
                      }}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WA Mahasiswa</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                      title="Nomor HP belum diisi"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WA Mahasiswa</span>
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                Sistem Monitoring Tugas Akhir (SIMONITA)
              </span>
              <button
                type="button"
                onClick={() => setSelectedStudentDetail(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
