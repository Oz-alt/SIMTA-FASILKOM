import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  Database, 
  Search, 
  Filter, 
  Plus, 
  Upload, 
  Download, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  GraduationCap, 
  UserCheck, 
  Calendar, 
  FileText, 
  Globe, 
  RefreshCw, 
  Sparkles, 
  FileCode, 
  Layers, 
  CheckSquare, 
  Square, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Terminal, 
  Copy, 
  Eye,
  Building2,
  FileSpreadsheet
} from 'lucide-react';

const PRODI_OPTIONS = [
  'D3 Manajemen Informatika',
  'S1 Teknik Informatika',
  'S1 Sistem Informasi',
  'S1 Sistem Komputer',
  'D3 Komputerisasi Akuntansi',
  'S2 Ilmu Komputer'
];

const TAHUN_OPTIONS = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018'];

export default function ManajemenRepositoryAdminPage() {
  const { 
    thesisArchives = [], 
    addRepositoryArchive, 
    updateRepositoryArchive, 
    deleteRepositoryArchive, 
    batchImportRepositoryArchives 
  } = useAuth();

  // State Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProdi, setSelectedProdi] = useState('Semua');
  const [selectedTahun, setSelectedTahun] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [sortBy, setSortBy] = useState('terbaru');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Selected for Bulk Action
  const [selectedIds, setSelectedIds] = useState([]);

  // Toast / Notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Modals
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [showFormModal, setShowFormModal] = useState(null); // null | 'add' | editItem
  const [showImportModal, setShowImportModal] = useState(false);
  const [showScraperModal, setShowScraperModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Scraper Simulation State
  const [isScraping, setIsScraping] = useState(false);
  const [scraperProgress, setScraperProgress] = useState(0);
  const [scraperLogs, setScraperLogs] = useState([]);
  const [scraperConfig, setScraperConfig] = useState({
    prodi: 'D3 Manajemen Informatika',
    tahun: '2024',
    maxRecords: 10,
    fetchAbstract: true
  });

  // Import JSON/CSV State
  const [importText, setImportText] = useState('');
  const [importFileName, setImportFileName] = useState('');
  const [importPreviewCount, setImportPreviewCount] = useState(0);

  const showNotification = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Helper Stats
  const stats = useMemo(() => {
    const total = thesisArchives.length;
    const dipublikasikan = thesisArchives.filter(a => (a.status || 'dipublikasikan') === 'dipublikasikan').length;
    const draf = total - dipublikasikan;
    const prodiCounts = thesisArchives.reduce((acc, curr) => {
      const p = curr.prodi || 'Lainnya';
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, {});
    const unikPenulis = new Set(thesisArchives.map(a => a.penulis_nim).filter(Boolean)).size;

    return { total, dipublikasikan, draf, prodiCounts, unikPenulis };
  }, [thesisArchives]);

  // Filtered and Sorted Archives
  const filteredArchives = useMemo(() => {
    return thesisArchives.filter(item => {
      const query = searchTerm.toLowerCase().trim();
      const matchSearch = !query || 
        (item.judul && item.judul.toLowerCase().includes(query)) ||
        (item.penulis_nama && item.penulis_nama.toLowerCase().includes(query)) ||
        (item.penulis_nim && item.penulis_nim.toLowerCase().includes(query)) ||
        (item.pembimbing_1 && item.pembimbing_1.toLowerCase().includes(query)) ||
        (item.pembimbing_2 && item.pembimbing_2.toLowerCase().includes(query)) ||
        (item.dosen_pa && item.dosen_pa.toLowerCase().includes(query)) ||
        (item.link_repo_unsri && item.link_repo_unsri.toLowerCase().includes(query)) ||
        (item.keywords && item.keywords.toLowerCase().includes(query));

      const matchProdi = selectedProdi === 'Semua' || item.prodi === selectedProdi;
      const matchTahun = selectedTahun === 'Semua' || String(item.tahun_ta || item.tahun_lulus) === selectedTahun;
      const itemStatus = item.status || 'dipublikasikan';
      const matchStatus = selectedStatus === 'Semua' || itemStatus === selectedStatus;

      return matchSearch && matchProdi && matchTahun && matchStatus;
    }).sort((a, b) => {
      if (sortBy === 'terbaru') {
        return (b.id || '').localeCompare(a.id || '');
      }
      if (sortBy === 'tahun_desc') {
        return (Number(b.tahun_ta || 0) - Number(a.tahun_ta || 0));
      }
      if (sortBy === 'tahun_asc') {
        return (Number(a.tahun_ta || 0) - Number(b.tahun_ta || 0));
      }
      if (sortBy === 'judul_asc') {
        return (a.judul || '').localeCompare(b.judul || '');
      }
      if (sortBy === 'penulis_asc') {
        return (a.penulis_nama || '').localeCompare(b.penulis_nama || '');
      }
      return 0;
    });
  }, [thesisArchives, searchTerm, selectedProdi, selectedTahun, selectedStatus, sortBy]);

  // Paginated Slices
  const totalPages = Math.ceil(filteredArchives.length / pageSize) || 1;
  const paginatedArchives = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredArchives.slice(start, start + pageSize);
  }, [filteredArchives, currentPage, pageSize]);

  // Bulk Selection Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedArchives.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Yakin ingin menghapus ${selectedIds.length} data repositori terpilih?`)) {
      selectedIds.forEach(id => deleteRepositoryArchive(id));
      setSelectedIds([]);
      showNotification(`Berhasil menghapus ${selectedIds.length} data repositori.`, 'success');
    }
  };

  const handleBulkPublish = () => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach(id => {
      updateRepositoryArchive(id, { status: 'dipublikasikan' });
    });
    setSelectedIds([]);
    showNotification(`Berhasil mempublikasikan ${selectedIds.length} data ke Arsip SIMTA Global.`, 'success');
  };

  // Export Data Handlers
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(filteredArchives, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repo_unsri_scraped_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Data repositori berhasil di-export ke format JSON.', 'success');
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Judul', 'Penulis', 'NIM', 'Prodi', 'Pembimbing 1', 'Pembimbing 2', 'Tahun TA', 'Link Repo UNSRI', 'Status'];
    const rows = filteredArchives.map(a => [
      `"${a.id || ''}"`,
      `"${(a.judul || '').replace(/"/g, '""')}"`,
      `"${(a.penulis_nama || '').replace(/"/g, '""')}"`,
      `"${a.penulis_nim || ''}"`,
      `"${a.prodi || ''}"`,
      `"${(a.pembimbing_1 || a.dosen_pa || '').replace(/"/g, '""')}"`,
      `"${(a.pembimbing_2 || '').replace(/"/g, '""')}"`,
      `"${a.tahun_ta || ''}"`,
      `"${a.link_repo_unsri || ''}"`,
      `"${a.status || 'dipublikasikan'}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repo_unsri_scraped_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Data repositori berhasil di-export ke format CSV.', 'success');
  };

  // File Upload JSON / CSV parser
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setImportText(content);
      try {
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            setImportPreviewCount(parsed.length);
          } else {
            setImportPreviewCount(1);
          }
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n').filter(l => l.trim().length > 0);
          setImportPreviewCount(Math.max(0, lines.length - 1));
        }
      } catch (err) {
        setImportPreviewCount(0);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    if (!importText.trim()) {
      showNotification('Harap unggah file atau tempel format data JSON/CSV.', 'error');
      return;
    }

    try {
      let parsedItems = [];
      if (importText.trim().startsWith('[') || importText.trim().startsWith('{')) {
        const parsed = JSON.parse(importText);
        parsedItems = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        // Parse CSV
        const lines = importText.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length > 1) {
          const headers = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.replace(/^["']|["']$/g, '').trim());
            const obj = {};
            headers.forEach((h, idx) => {
              obj[h] = values[idx] || '';
            });
            parsedItems.push({
              judul: obj.judul || obj.title || obj['judul tugas akhir'],
              penulis_nama: obj.penulis_nama || obj.nama || obj.author || obj['nama mahasiswa'],
              penulis_nim: obj.penulis_nim || obj.nim,
              prodi: obj.prodi || obj.jurusan || 'D3 Manajemen Informatika',
              pembimbing_1: obj.pembimbing_1 || obj.pembimbing || obj.dospem,
              pembimbing_2: obj.pembimbing_2,
              tahun_ta: obj.tahun_ta || obj.tahun || obj.year || '2024',
              abstrak: obj.abstrak || obj.abstract || '',
              link_repo_unsri: obj.link_repo_unsri || obj.link || obj.url
            });
          }
        }
      }

      const imported = batchImportRepositoryArchives(parsedItems);
      setShowImportModal(false);
      setImportText('');
      setImportFileName('');
      setImportPreviewCount(0);
      showNotification(`Sukses mengimpor ${imported} data repositori ke SIMTA!`, 'success');
    } catch (err) {
      showNotification('Format data tidak valid: ' + err.message, 'error');
    }
  };

  // Scraper Simulation Runner
  const handleStartScraping = () => {
    setIsScraping(true);
    setScraperProgress(5);
    setScraperLogs([
      `[${new Date().toLocaleTimeString()}] [INFO] Memulai koneksi ke server target: https://repository.unsri.ac.id/`,
      `[${new Date().toLocaleTimeString()}] [INFO] Target Fakultas: FAKULTAS ILMU KOMPUTER | Jurusan: ${scraperConfig.prodi}`,
      `[${new Date().toLocaleTimeString()}] [INFO] Filter Tahun Terbit: ${scraperConfig.tahun} | Batas Max: ${scraperConfig.maxRecords} item`
    ]);

    const sampleMockToScrape = [
      {
        id: `arc-scraped-${Date.now()}-1`,
        judul: `SISTEM PAKAR DIAGNOSIS HAMA PADA TANAMAN PANGAN MENGGUNAKAN METODE CERTAINTY FACTOR DI FASILKOM UNSRI`,
        abstrak: `Penelitian ini mengimplementasikan metode Certainty Factor untuk membantu petani mendiagnosis hama tanaman pangan secara cepat berbasis web responsive.`,
        penulis_nama: `RAHMAD HIDAYAT`,
        penulis_nim: `090112820250${Math.floor(10 + Math.random() * 80)}`,
        prodi: scraperConfig.prodi,
        pembimbing_1: `DERIS STIAWAN, M.T., Ph.D.`,
        pembimbing_2: `PACU PUTRA, M.Cs.`,
        tahun_ta: scraperConfig.tahun,
        link_repo_unsri: `http://repository.unsri.ac.id/${200000 + Math.floor(Math.random() * 8000)}/`,
        status: 'dipublikasikan'
      },
      {
        id: `arc-scraped-${Date.now()}-2`,
        judul: `ANALISIS SENTIMEN REVIEW APLIKASI SATU SEHAT PADA GOOGLE PLAY STORE MENGGUNAKAN ALGORITMA BERT`,
        abstrak: `Penelitian memanfaatkan transformer Bidirectional Encoder Representations from Transformers (BERT) untuk klasifikasi polaritas sentimen ulasan pengguna.`,
        penulis_nama: `SITI NURHALIZA`,
        penulis_nim: `090211820250${Math.floor(10 + Math.random() * 80)}`,
        prodi: scraperConfig.prodi,
        pembimbing_1: `RIFQI SYAMSUAR, M.Kom.`,
        pembimbing_2: `FATURRAHMAN, M.T.`,
        tahun_ta: scraperConfig.tahun,
        link_repo_unsri: `http://repository.unsri.ac.id/${200000 + Math.floor(Math.random() * 8000)}/`,
        status: 'dipublikasikan'
      },
      {
        id: `arc-scraped-${Date.now()}-3`,
        judul: `IMPLEMENTASI SMART LOCK DOOR SYSTEM BERBASIS INTERNET OF THINGS DENGAN PROTOKOL MQTT DAN RFID`,
        abstrak: `Perancangan sistem keamanan pintu cerdas berbasis NodeMCU ESP8266 dan cloud server broker MQTT dengan enkripsi token akses.`,
        penulis_nama: `DIMAS ARYA PRATAMA`,
        penulis_nim: `090312820250${Math.floor(10 + Math.random() * 80)}`,
        prodi: scraperConfig.prodi,
        pembimbing_1: `M. AGUS SYAMSUL, M.T.`,
        pembimbing_2: `ZULKIFLI, M.Kom.`,
        tahun_ta: scraperConfig.tahun,
        link_repo_unsri: `http://repository.unsri.ac.id/${200000 + Math.floor(Math.random() * 8000)}/`,
        status: 'dipublikasikan'
      }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep += 1;
      const progressVal = Math.min(100, currentStep * 20);
      setScraperProgress(progressVal);

      if (currentStep === 1) {
        setScraperLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [HTTP 200] Mengurai index list halaman e-prints view division...`,
          `[${new Date().toLocaleTimeString()}] [PARSER] Ditemukan 14 nomor index EPrint repository UNSRI aktif.`
        ]);
      } else if (currentStep === 2) {
        setScraperLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [METADATA] Mengekstrak DC.Title, DC.Creator, DC.Subject, dan DC.Description...`,
          `[${new Date().toLocaleTimeString()}] [DATA] Berhasil parse Dokumen: "${sampleMockToScrape[0].judul.slice(0, 45)}..."`
        ]);
      } else if (currentStep === 3) {
        setScraperLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [DATA] Berhasil parse Dokumen: "${sampleMockToScrape[1].judul.slice(0, 45)}..."`,
          `[${new Date().toLocaleTimeString()}] [DATA] Berhasil parse Dokumen: "${sampleMockToScrape[2].judul.slice(0, 45)}..."`
        ]);
      } else if (currentStep >= 5) {
        clearInterval(interval);
        setIsScraping(false);
        batchImportRepositoryArchives(sampleMockToScrape);
        setScraperLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [FINISH] Sukses menyinkronkan ${sampleMockToScrape.length} dokumen baru dari repository.unsri.ac.id ke SIMTA!`,
          `[${new Date().toLocaleTimeString()}] [DB SYNC] Status data telah otomatis dipublikasikan ke database lokal & master arsip.`
        ]);
        showNotification(`Berhasil scraping & menyimpan ${sampleMockToScrape.length} dokumen baru dari Repo UNSRI!`, 'success');
      }
    }, 700);
  };

  return (
    <div className="space-y-6 pb-16 select-none font-sans">

      {/* Floating Toast */}
      {toast.show && (
        <div className={`fixed top-20 right-6 z-50 flex items-center space-x-3 px-5 py-3.5 rounded-2xl shadow-2xl transition-all animate-in fade-in slide-in-from-top-4 ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-white flex-shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />}
          <span className="text-xs sm:text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Hero Header Banner */}
      <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <Database className="w-96 h-96 text-white" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30 backdrop-blur-md">
            <Globe className="w-4 h-4 text-cyan-400 animate-spin-slow" />
            <span>Wadah Scraping &amp; Manajemen Repositori UNSRI</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Manajemen Repositori &amp; Scraping Hub FASILKOM
          </h1>

          <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
            Pusat penampungan dan kurasi seluruh data karya ilmiah, Tugas Akhir, dan Skripsi yang di-scrape dari <span className="font-mono text-cyan-300 font-semibold">repository.unsri.ac.id</span>. Kelola metadata, sinkronisasi ke Arsip SIMTA Global, atau impor dataset JSON/CSV scraper.
          </p>

          <div className="pt-2 flex flex-wrap gap-2.5">
            <button
              onClick={() => setShowScraperModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Jalankan Scraper Simulator</span>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 backdrop-blur-sm transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Impor Data (JSON/CSV)</span>
            </button>

            <button
              onClick={() => setShowFormModal('add')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 backdrop-blur-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Dokumen Manual</span>
            </button>

            <div className="flex space-x-1">
              <button
                onClick={handleExportJSON}
                title="Export Hasil ke JSON"
                className="inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5 text-amber-400" />
                <span>JSON</span>
              </button>
              <button
                onClick={handleExportCSV}
                title="Export Hasil ke CSV / Excel"
                className="inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Data Repositori</div>
          <div className="mt-1 text-2xl font-black text-slate-900 flex items-center justify-between">
            <span>{stats.total.toLocaleString()}</span>
            <Database className="w-5 h-5 text-indigo-500/70" />
          </div>
          <span className="text-[10px] text-slate-500">Tercatat di Sistem</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Terpublikasi di Arsip</div>
          <div className="mt-1 text-2xl font-black text-emerald-600 flex items-center justify-between">
            <span>{stats.dipublikasikan.toLocaleString()}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500/70" />
          </div>
          <span className="text-[10px] text-emerald-600/80 font-medium">Tayang di Arsip Publik</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Penulis Unik</div>
          <div className="mt-1 text-2xl font-black text-blue-600 flex items-center justify-between">
            <span>{stats.unikPenulis.toLocaleString()}</span>
            <GraduationCap className="w-5 h-5 text-blue-500/70" />
          </div>
          <span className="text-[10px] text-slate-500">Mahasiswa Fasilkom</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">D3 Manajemen Informatika</div>
          <div className="mt-1 text-2xl font-black text-purple-600 flex items-center justify-between">
            <span>{stats.prodiCounts['D3 Manajemen Informatika'] || 0}</span>
            <BookOpen className="w-5 h-5 text-purple-500/70" />
          </div>
          <span className="text-[10px] text-slate-500">Karya Terkatalogisasi</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Program Studi Lain</div>
          <div className="mt-1 text-2xl font-black text-amber-600 flex items-center justify-between">
            <span>{stats.total - (stats.prodiCounts['D3 Manajemen Informatika'] || 0)}</span>
            <Layers className="w-5 h-5 text-amber-500/70" />
          </div>
          <span className="text-[10px] text-slate-500">TI, SI, SK &amp; Lainnya</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        
        {/* Filter and Search Bar */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Cari judul tugas akhir, nama mahasiswa, NIM, pembimbing, ID eprints..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-2xs"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400">Prodi:</span>
                <select
                  value={selectedProdi}
                  onChange={(e) => { setSelectedProdi(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="Semua">Semua Program Studi</option>
                  {PRODI_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400">Tahun:</span>
                <select
                  value={selectedTahun}
                  onChange={(e) => { setSelectedTahun(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="Semua">Semua Tahun</option>
                  {TAHUN_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="dipublikasikan">Dipublikasikan</option>
                  <option value="draf">Draf / Belum Publish</option>
                </select>
              </div>

              <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400">Urutan:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="terbaru">Terbaru Ditambahkan</option>
                  <option value="tahun_desc">Tahun (Terbaru - Terlama)</option>
                  <option value="tahun_asc">Tahun (Terlama - Terbaru)</option>
                  <option value="judul_asc">Judul (A-Z)</option>
                  <option value="penulis_asc">Penulis (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bulk Action Bar (if items selected) */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 px-4 py-2.5 rounded-xl animate-in fade-in">
              <div className="flex items-center space-x-2 text-xs font-bold text-indigo-900">
                <CheckSquare className="w-4 h-4 text-indigo-600" />
                <span>{selectedIds.length} item repositori terpilih</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBulkPublish}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  Publikasikan Massal
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  Hapus Terpilih
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-2 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-medium cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Repositories Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="p-3.5 pl-5 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={paginatedArchives.length > 0 && paginatedArchives.every(item => selectedIds.includes(item.id))}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="p-3.5 w-16">No / ID</th>
                <th className="p-3.5 min-w-[340px]">Judul Tugas Akhir &amp; Abstrak</th>
                <th className="p-3.5 min-w-[200px]">Mahasiswa / Penulis</th>
                <th className="p-3.5 min-w-[200px]">Dosen Pembimbing</th>
                <th className="p-3.5 w-24">Tahun</th>
                <th className="p-3.5 w-32">Status</th>
                <th className="p-3.5 pr-5 text-right w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedArchives.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-400">
                        <Database className="w-10 h-10" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">Tidak ada data repositori yang sesuai</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Coba ubah kata kunci pencarian, filter prodi/tahun, atau jalankan scraper simulator untuk mengisi data.
                      </p>
                      <button
                        onClick={() => { setSearchTerm(''); setSelectedProdi('Semua'); setSelectedTahun('Semua'); setSelectedStatus('Semua'); }}
                        className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer underline"
                      >
                        Reset Filter
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedArchives.map((item, idx) => {
                  const isSelected = selectedIds.includes(item.id);
                  const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                  const eprintId = item.link_repo_unsri ? item.link_repo_unsri.match(/\/(\d+)\/?/)?.[1] : (item.id || '').replace('arc-mi-', '');

                  return (
                    <tr 
                      key={item.id || idx}
                      className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}
                    >
                      <td className="p-3.5 pl-5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(item.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                      </td>

                      <td className="p-3.5 font-mono text-[11px] text-slate-400 font-semibold">
                        <div>#{rowNumber}</div>
                        {eprintId && (
                          <span className="text-[10px] text-indigo-500 font-bold">
                            e-{eprintId}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-1 max-w-lg">
                          <button
                            onClick={() => setShowDetailModal(item)}
                            className="text-left font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-2 cursor-pointer leading-snug"
                          >
                            {item.judul}
                          </button>

                          {item.abstrak && (
                            <p className="text-[11px] text-slate-400 line-clamp-1 italic font-serif">
                              "{item.abstrak.slice(0, 140)}..."
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                              {item.prodi || 'D3 Manajemen Informatika'}
                            </span>
                            {item.link_repo_unsri && (
                              <a
                                href={item.link_repo_unsri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-semibold hover:bg-blue-100 transition-colors"
                              >
                                <span>repository.unsri.ac.id</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                            <span>{item.penulis_nama || '-'}</span>
                          </div>
                          <div className="font-mono text-[11px] text-slate-500">
                            NIM: {item.penulis_nim || '-'}
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <div className="text-xs text-slate-800 font-medium line-clamp-1">
                            {item.pembimbing_1 || item.dosen_pa || '-'}
                          </div>
                          {item.pembimbing_2 && (
                            <div className="text-[11px] text-slate-500 line-clamp-1">
                              2: {item.pembimbing_2}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 font-bold text-slate-800">
                        <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs">
                          {item.tahun_ta || item.tahun_lulus || '-'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        {(item.status || 'dipublikasikan') === 'dipublikasikan' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Dipublikasikan</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
                            <Sparkles className="w-3 h-3" />
                            <span>Draf / Scraped</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => setShowDetailModal(item)}
                            title="Lihat Detail & Metadata"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setShowFormModal(item)}
                            title="Edit Data"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setShowDeleteConfirm(item)}
                            title="Hapus Data"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center space-x-3">
            <span>
              Menampilkan <span className="font-bold text-slate-900">{filteredArchives.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> - <span className="font-bold text-slate-900">{Math.min(currentPage * pageSize, filteredArchives.length)}</span> dari <span className="font-bold text-slate-900">{filteredArchives.length}</span> data
            </span>

            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">| Per halaman:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-bold text-slate-800">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: DETAIL & METADATA REPOSITORI */}
      {/* ========================================================================= */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-5 p-6 sm:p-8">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                  <Database className="w-3 h-3" />
                  <span>Metadata Repositori Tugas Akhir</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                  {showDetailModal.judul}
                </h2>
              </div>
              <button
                onClick={() => setShowDetailModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Nama Penulis / Mahasiswa</span>
                <p className="font-extrabold text-slate-900 text-sm">{showDetailModal.penulis_nama || '-'}</p>
                <p className="font-mono text-slate-500">NIM: {showDetailModal.penulis_nim || '-'}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Program Studi &amp; Tahun</span>
                <p className="font-bold text-indigo-700">{showDetailModal.prodi || 'D3 Manajemen Informatika'}</p>
                <p className="text-slate-500">Tahun TA / Lulus: {showDetailModal.tahun_ta || showDetailModal.tahun_lulus || '-'}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Dosen Pembimbing 1 / PA</span>
                <p className="font-bold text-slate-900">{showDetailModal.pembimbing_1 || showDetailModal.dosen_pa || '-'}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Dosen Pembimbing 2 / Penguji</span>
                <p className="font-bold text-slate-900">{showDetailModal.pembimbing_2 || showDetailModal.penguji_1 || '-'}</p>
              </div>
            </div>

            {/* Abstrak Box */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Abstrak Dokumen:</span>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed max-h-48 overflow-y-auto font-serif">
                {showDetailModal.abstrak || <span className="text-slate-400 italic">Tidak ada abstrak tercatat pada metadata repositori ini.</span>}
              </div>
            </div>

            {/* Link & URL Asli */}
            {showDetailModal.link_repo_unsri && (
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-blue-600 uppercase">URL Sumber Resmi:</span>
                  <p className="font-mono text-xs text-blue-900 truncate max-w-md">{showDetailModal.link_repo_unsri}</p>
                </div>
                <a
                  href={showDetailModal.link_repo_unsri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <span>Buka Repository Asli</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  const targetItem = showDetailModal;
                  setShowDetailModal(null);
                  setShowFormModal(targetItem);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Edit Metadata
              </button>
              <button
                onClick={() => setShowDetailModal(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FORM TAMBAH / EDIT DOKUMEN REPOSITORI */}
      {/* ========================================================================= */}
      {showFormModal && (
        <FormRepositoryModal
          item={showFormModal === 'add' ? null : showFormModal}
          onClose={() => setShowFormModal(null)}
          onSave={(formData) => {
            if (showFormModal === 'add') {
              addRepositoryArchive(formData);
              showNotification('Berhasil menambahkan dokumen baru ke Repositori!', 'success');
            } else {
              updateRepositoryArchive(showFormModal.id, formData);
              showNotification('Berhasil memperbarui data repositori!', 'success');
            }
            setShowFormModal(null);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: IMPORT DATA JSON / CSV SCRAPER */}
      {/* ========================================================================= */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 space-y-5 p-6 sm:p-8">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">Impor Dataset Scraper Repositori</h2>
                <p className="text-xs text-slate-500">Unggah file JSON atau CSV hasil scraping repository UNSRI untuk dimasukkan ke sistem</p>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
                <input
                  type="file"
                  id="import-file"
                  accept=".json,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="import-file" className="cursor-pointer flex flex-col items-center space-y-2">
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-indigo-700 hover:underline">
                    {importFileName ? `File Terpilih: ${importFileName}` : 'Klik untuk memilih file .JSON atau .CSV'}
                  </span>
                  <span className="text-[11px] text-slate-400">Mendukung format dump scraper Python / Scrapy / Puppeteer</span>
                </label>
              </div>

              {importPreviewCount > 0 && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Terdeteksi {importPreviewCount} baris / record data siap diimpor.</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Atau Tempel Raw JSON / CSV:</label>
                <textarea
                  rows={5}
                  value={importText}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    try {
                      const p = JSON.parse(e.target.value);
                      setImportPreviewCount(Array.isArray(p) ? p.length : 1);
                    } catch {
                      setImportPreviewCount(0);
                    }
                  }}
                  placeholder='[ { "judul": "...", "penulis_nama": "...", "penulis_nim": "...", "prodi": "D3 Manajemen Informatika", "tahun_ta": "2024", "link_repo_unsri": "http://repository.unsri.ac.id/..." } ]'
                  className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteImport}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                Impor ke Repositori
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SCRAPER SIMULATOR & CONNECTOR HUB */}
      {/* ========================================================================= */}
      {showScraperModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 text-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-800 space-y-5 p-6 sm:p-8">
            
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-400/30">
                  <Terminal className="w-3 h-3" />
                  <span>UNSRI Repository Scraper Engine</span>
                </div>
                <h2 className="text-lg font-black text-white">Jalankan Scraper &amp; Sinkronisasi Repo UNSRI</h2>
                <p className="text-xs text-slate-400">Target Endpoint: <code className="text-cyan-300">https://repository.unsri.ac.id/view/divisions/</code></p>
              </div>
              <button
                onClick={() => { if (!isScraping) setShowScraperModal(false); }}
                className="p-1.5 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Config options */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-bold text-[11px]">Program Studi Target:</label>
                <select
                  disabled={isScraping}
                  value={scraperConfig.prodi}
                  onChange={(e) => setScraperConfig({ ...scraperConfig, prodi: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-none"
                >
                  {PRODI_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold text-[11px]">Tahun Terbit:</label>
                <select
                  disabled={isScraping}
                  value={scraperConfig.tahun}
                  onChange={(e) => setScraperConfig({ ...scraperConfig, tahun: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-none"
                >
                  {TAHUN_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Progress Bar */}
            {isScraping && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-cyan-300">
                  <span>Sedang Mengikis Data...</span>
                  <span>{scraperProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-300"
                    style={{ width: `${scraperProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Terminal Console Logs */}
            <div className="p-4 bg-black/80 rounded-2xl border border-slate-800 font-mono text-[11px] text-emerald-400 max-h-48 overflow-y-auto space-y-1">
              {scraperLogs.length === 0 ? (
                <div className="text-slate-500 italic">Siap menjalankan sinkronisasi. Klik tombol "Mulai Scraping" di bawah.</div>
              ) : (
                scraperLogs.map((log, i) => (
                  <div key={i} className="leading-relaxed">
                    {log}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                disabled={isScraping}
                onClick={() => setShowScraperModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all disabled:opacity-40 cursor-pointer"
              >
                Tutup
              </button>
              <button
                disabled={isScraping}
                onClick={handleStartScraping}
                className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
              >
                {isScraping ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sedang Berjalan...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Mulai Scraping Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: KONFIRMASI HAPUS DOKUMEN */}
      {/* ========================================================================= */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="p-3 bg-red-50 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">Konfirmasi Hapus Data</h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Yakin ingin menghapus karya <span className="font-bold text-slate-900">"{showDeleteConfirm.judul}"</span> dari repositori? Data yang dihapus tidak dapat dipulihkan.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  deleteRepositoryArchive(showDeleteConfirm.id);
                  setShowDeleteConfirm(null);
                  showNotification('Data repositori berhasil dihapus.', 'success');
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/**
 * Sub-component Modal Form Tambah & Edit Repositori
 */
function FormRepositoryModal({ item, onClose, onSave }) {
  const [formData, setFormData] = useState({
    judul: item?.judul || '',
    penulis_nama: item?.penulis_nama || '',
    penulis_nim: item?.penulis_nim || '',
    prodi: item?.prodi || 'D3 Manajemen Informatika',
    pembimbing_1: item?.pembimbing_1 || item?.dosen_pa || '',
    pembimbing_2: item?.pembimbing_2 || '',
    penguji_1: item?.penguji_1 || '',
    penguji_2: item?.penguji_2 || '',
    tahun_ta: item?.tahun_ta || item?.tahun_lulus || '2024',
    abstrak: item?.abstrak || '',
    link_repo_unsri: item?.link_repo_unsri || '',
    keywords: item?.keywords || '',
    status: item?.status || 'dipublikasikan'
  });

  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!formData.judul.trim()) errs.judul = 'Judul Tugas Akhir wajib diisi';
    if (!formData.penulis_nama.trim()) errs.penulis_nama = 'Nama penulis wajib diisi';
    if (!formData.penulis_nim.trim()) errs.penulis_nim = 'NIM mahasiswa wajib diisi';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5">
        
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              {item ? 'Edit Metadata Dokumen Repositori' : 'Tambah Dokumen Repositori Baru'}
            </h2>
            <p className="text-xs text-slate-500">Lengkapi formulir metadata Tugas Akhir / Skripsi Fasilkom UNSRI</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Judul Tugas Akhir / Skripsi *</label>
            <textarea
              rows={3}
              value={formData.judul}
              onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
              placeholder="Contoh: RANCANG BANGUN SISTEM INFORMASI..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.judul && <p className="text-[11px] text-red-600 font-semibold">{errors.judul}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Nama Penulis / Mahasiswa *</label>
              <input
                type="text"
                value={formData.penulis_nama}
                onChange={(e) => setFormData({ ...formData, penulis_nama: e.target.value })}
                placeholder="Nama Lengkap"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.penulis_nama && <p className="text-[11px] text-red-600 font-semibold">{errors.penulis_nama}</p>}
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">NIM Mahasiswa *</label>
              <input
                type="text"
                value={formData.penulis_nim}
                onChange={(e) => setFormData({ ...formData, penulis_nim: e.target.value })}
                placeholder="Contoh: 09010182428019"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.penulis_nim && <p className="text-[11px] text-red-600 font-semibold">{errors.penulis_nim}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Program Studi</label>
              <select
                value={formData.prodi}
                onChange={(e) => setFormData({ ...formData, prodi: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {PRODI_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Tahun TA / Lulus</label>
              <select
                value={formData.tahun_ta}
                onChange={(e) => setFormData({ ...formData, tahun_ta: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {TAHUN_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Dosen Pembimbing 1 / PA</label>
              <input
                type="text"
                value={formData.pembimbing_1}
                onChange={(e) => setFormData({ ...formData, pembimbing_1: e.target.value })}
                placeholder="Nama Pembimbing 1"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Dosen Pembimbing 2</label>
              <input
                type="text"
                value={formData.pembimbing_2}
                onChange={(e) => setFormData({ ...formData, pembimbing_2: e.target.value })}
                placeholder="Nama Pembimbing 2 (Opsional)"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">URL Asli Repository UNSRI (E-Print Link)</label>
            <input
              type="url"
              value={formData.link_repo_unsri}
              onChange={(e) => setFormData({ ...formData, link_repo_unsri: e.target.value })}
              placeholder="http://repository.unsri.ac.id/200395/"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Abstrak Dokumen</label>
            <textarea
              rows={4}
              value={formData.abstrak}
              onChange={(e) => setFormData({ ...formData, abstrak: e.target.value })}
              placeholder="Isi abstrak atau ringkasan skripsi..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-serif"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Status Publikasi</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="dipublikasikan">Dipublikasikan (Tayang di Arsip Publik SIMTA)</option>
              <option value="draf">Draf / Belum Publish</option>
            </select>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
            >
              Simpan Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
