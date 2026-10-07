import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  BookOpen, 
  CheckCircle2, 
  Globe, 
  Smartphone, 
  Bot, 
  Download, 
  Printer, 
  Filter, 
  Search, 
  Layers, 
  Sparkles, 
  Users, 
  GraduationCap, 
  FileSpreadsheet, 
  Info, 
  ArrowUpRight,
  ChevronRight,
  ExternalLink,
  Tag
} from 'lucide-react';
import { Link } from '@inertiajs/react';

// Configuration for the 3 target scientific fields (Poin 36)
export const TOPIC_DOMAINS = {
  web: {
    id: 'web',
    name: 'Web & Sistem Informasi',
    shortName: 'Web',
    icon: Globe,
    color: 'blue',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    barClass: 'bg-blue-600',
    gradientClass: 'from-blue-600 to-indigo-600',
    bgLight: 'bg-blue-50/50',
    borderLight: 'border-blue-100',
    textDark: 'text-blue-900',
    description: 'Pengembangan portal web, sistem informasi manajemen, arsitektur client-server, dan aplikasi berbasis cloud.',
    keywords: [
      'web', 'website', 'portal', 'sistem informasi', 'si ', 'e-commerce', 'ecommerce', 
      'laravel', 'react', 'vue', 'rest api', 'dashboard', 'cloud', 'oauth', 'cms', 
      'arsip', 'inventaris', 'tracer study', 'administrasi', 'pendataan', 'pemesanan',
      'rawat inap', 'pelayanan', 'ticketing', 'kepegawaian', 'peminjaman'
    ],
    sampleTech: ['Laravel', 'React.js', 'MySQL/PostgreSQL', 'TailwindCSS', 'RESTful API']
  },
  android: {
    id: 'android',
    name: 'Aplikasi Mobile & Android',
    shortName: 'Android',
    icon: Smartphone,
    color: 'emerald',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    barClass: 'bg-emerald-600',
    gradientClass: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50/50',
    borderLight: 'border-emerald-100',
    textDark: 'text-emerald-900',
    description: 'Aplikasi perangkat bergerak berbasis Android, teknologi mobile lintas-platform, LBS, dan Augmented Reality.',
    keywords: [
      'android', 'mobile', 'smartphone', 'apk', 'flutter', 'kotlin', 'react native', 
      'augmented reality', ' ar ', 'markerless', 'lbs', 'location based', 'geografis', 
      'gis', 'gps', 'aplikasi bergerak', 'smart mobile', 'iot mobile'
    ],
    sampleTech: ['Flutter / Kotlin', 'Android SDK', 'Firebase Mobile', 'ARCore', 'Google Maps API']
  },
  ai: {
    id: 'ai',
    name: 'Artificial Intelligence & Data Cerdas',
    shortName: 'AI',
    icon: Bot,
    color: 'purple',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    barClass: 'bg-purple-600',
    gradientClass: 'from-purple-600 to-violet-600',
    bgLight: 'bg-purple-50/50',
    borderLight: 'border-purple-100',
    textDark: 'text-purple-900',
    description: 'Penerapan kecerdasan buatan, machine learning, data mining, NLP, dan sistem pendukung keputusan (SPK).',
    keywords: [
      'ai', 'artificial intelligence', 'machine learning', 'deep learning', 'cnn', 'svm',
      'k-means', 'kmeans', 'clustering', 'klasifikasi', 'prediksi', 'nlp', 'text mining',
      'sentiment', 'neural network', 'computer vision', 'fuzzy', 'saw', 'ahp', 'topsis',
      'algoritma', 'naive bayes', 'decision tree', 'spk', 'sistem pendukung keputusan',
      'expert system', 'sistem pakar', 'pengelompokan', 'rekomendasi'
    ],
    sampleTech: ['Python / Scikit-learn', 'Metode SAW / AHP / TOPSIS', 'K-Means Clustering', 'NLP / Text Mining']
  }
};

/**
 * Helper to classify a thesis title into one of the 3 key domains: Web, Android, AI
 */
export function classifyTitleField(title = '') {
  const text = (title || '').toLowerCase();

  const matchedAi = TOPIC_DOMAINS.ai.keywords.filter(k => text.includes(k));
  const matchedAndroid = TOPIC_DOMAINS.android.keywords.filter(k => text.includes(k));
  const matchedWeb = TOPIC_DOMAINS.web.keywords.filter(k => text.includes(k));

  // 1. Android / Mobile detection
  if (matchedAndroid.length > 0 && !text.includes('berbasis web')) {
    return {
      field: 'android',
      config: TOPIC_DOMAINS.android,
      matchedKeywords: matchedAndroid.slice(0, 3)
    };
  }

  // 2. AI / Intelligent systems / SPK detection
  if (matchedAi.length > 0) {
    return {
      field: 'ai',
      config: TOPIC_DOMAINS.ai,
      matchedKeywords: matchedAi.slice(0, 3)
    };
  }

  // 3. Web & Information Systems (core D3 MI competency)
  return {
    field: 'web',
    config: TOPIC_DOMAINS.web,
    matchedKeywords: matchedWeb.length > 0 ? matchedWeb.slice(0, 3) : ['sistem informasi']
  };
}

export default function AnalitikPage() {
  const { thesisTitles, historicalTitles, advisors } = useAuth();

  // State filters
  const [datasetFilter, setDatasetFilter] = useState('aktif'); // 'aktif', 'semua', 'arsip'
  const [fieldFilter, setFieldFilter] = useState('all'); // 'all', 'web', 'android', 'ai'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTitleModal, setSelectedTitleModal] = useState(null);

  // Combine & annotate dataset based on filter
  const classifiedDataset = useMemo(() => {
    let rawList = [];

    if (datasetFilter === 'aktif') {
      rawList = (thesisTitles || []).map(t => ({
        id: t.id,
        judul: t.judul,
        mhs_nama: t.mhs_nama || 'Mahasiswa D3 MI',
        mhs_nim: t.mhs_nim || '-',
        angkatan: t.angkatan || '2023',
        prodi: t.prodi || 'D3 Manajemen Informatika',
        pembimbing_1: t.pembimbing_1_nama || t.pembimbing_1 || '-',
        pembimbing_2: t.pembimbing_2_nama || t.pembimbing_2 || '-',
        status: t.status || 'proses',
        status_kelulusan: t.status_kelulusan || 'aktif_proses',
        skor_similarity: t.skor_kemiripan_terakhir || 0,
        source: 'Mahasiswa Aktif'
      }));
    } else if (datasetFilter === 'arsip') {
      rawList = (historicalTitles || []).map(h => ({
        id: h.id,
        judul: h.judul,
        mhs_nama: h.penulis || 'Alumni D3 MI',
        mhs_nim: h.nim || '-',
        angkatan: h.tahun_angkatan || '2026',
        prodi: 'D3 Manajemen Informatika',
        pembimbing_1: h.dosen_pa || 'Dosen Pembimbing D3',
        pembimbing_2: '-',
        status: 'lulus',
        status_kelulusan: 'lulus',
        skor_similarity: 15.0,
        source: 'Arsip Alumni'
      }));
    } else {
      // 'semua'
      const activeList = (thesisTitles || []).map(t => ({
        id: t.id,
        judul: t.judul,
        mhs_nama: t.mhs_nama || 'Mahasiswa D3 MI',
        mhs_nim: t.mhs_nim || '-',
        angkatan: t.angkatan || '2023',
        prodi: t.prodi || 'D3 Manajemen Informatika',
        pembimbing_1: t.pembimbing_1_nama || t.pembimbing_1 || '-',
        pembimbing_2: t.pembimbing_2_nama || t.pembimbing_2 || '-',
        status: t.status || 'proses',
        status_kelulusan: t.status_kelulusan || 'aktif_proses',
        skor_similarity: t.skor_kemiripan_terakhir || 0,
        source: 'Mahasiswa Aktif'
      }));

      const archiveList = (historicalTitles || []).slice(0, 50).map(h => ({
        id: h.id,
        judul: h.judul,
        mhs_nama: h.penulis || 'Alumni D3 MI',
        mhs_nim: h.nim || '-',
        angkatan: h.tahun_angkatan || '2026',
        prodi: 'D3 Manajemen Informatika',
        pembimbing_1: h.dosen_pa || 'Dosen Pembimbing D3',
        pembimbing_2: '-',
        status: 'lulus',
        status_kelulusan: 'lulus',
        skor_similarity: 15.0,
        source: 'Arsip Alumni'
      }));

      rawList = [...activeList, ...archiveList];
    }

    // Classify each title
    return rawList.map(item => {
      const classification = classifyTitleField(item.judul);
      return {
        ...item,
        field: classification.field,
        config: classification.config,
        matchedKeywords: classification.matchedKeywords
      };
    });
  }, [thesisTitles, historicalTitles, datasetFilter]);

  // Aggregated Statistics for Web, Android, AI (Poin 36)
  const stats = useMemo(() => {
    const total = classifiedDataset.length || 1;
    const webItems = classifiedDataset.filter(item => item.field === 'web');
    const androidItems = classifiedDataset.filter(item => item.field === 'android');
    const aiItems = classifiedDataset.filter(item => item.field === 'ai');

    const webCount = webItems.length;
    const androidCount = androidItems.length;
    const aiCount = aiItems.length;

    const webPercent = Math.round((webCount / total) * 100);
    const androidPercent = Math.round((androidCount / total) * 100);
    const aiPercent = 100 - webPercent - androidPercent; // ensure sum is 100%

    // Advisor distribution per field
    const advisorMap = {};
    classifiedDataset.forEach(item => {
      const p1 = item.pembimbing_1;
      if (p1 && p1 !== '-') {
        if (!advisorMap[p1]) {
          advisorMap[p1] = { nama: p1, web: 0, android: 0, ai: 0, total: 0 };
        }
        advisorMap[p1][item.field]++;
        advisorMap[p1].total++;
      }
    });

    const topAdvisors = Object.values(advisorMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      total: classifiedDataset.length,
      web: { count: webCount, percentage: Math.max(0, webPercent), items: webItems },
      android: { count: androidCount, percentage: Math.max(0, androidPercent), items: androidItems },
      ai: { count: aiCount, percentage: Math.max(0, aiPercent), items: aiItems },
      topAdvisors
    };
  }, [classifiedDataset]);

  // Filtered dataset for table display
  const displayedList = useMemo(() => {
    return classifiedDataset.filter(item => {
      // Field filter
      if (fieldFilter !== 'all' && item.field !== fieldFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = (item.judul || '').toLowerCase().includes(query);
        const matchMhs = (item.mhs_nama || '').toLowerCase().includes(query);
        const matchNim = (item.mhs_nim || '').toLowerCase().includes(query);
        const matchP1 = (item.pembimbing_1 || '').toLowerCase().includes(query);
        const matchKeywords = (item.matchedKeywords || []).some(k => k.toLowerCase().includes(query));
        return matchTitle || matchMhs || matchNim || matchP1 || matchKeywords;
      }
      return true;
    });
  }, [classifiedDataset, fieldFilter, searchQuery]);

  // CSV Export Function (Poin 26 & 37)
  const handleDownloadCsv = () => {
    const headers = [
      'No',
      'NIM',
      'Nama Mahasiswa',
      'Angkatan',
      'Bidang Keilmuan',
      'Kata Kunci Terdeteksi',
      'Judul Tugas Akhir',
      'Pembimbing 1',
      'Pembimbing 2',
      'Skor Similarity (%)',
      'Status',
      'Sumber Data'
    ];

    const rows = displayedList.map((item, idx) => [
      idx + 1,
      `'${item.mhs_nim}`,
      `"${(item.mhs_nama || '').replace(/"/g, '""')}"`,
      item.angkatan || '-',
      item.config.name,
      `"${(item.matchedKeywords || []).join(', ')}"`,
      `"${(item.judul || '').replace(/"/g, '""')}"`,
      `"${(item.pembimbing_1 || '').replace(/"/g, '""')}"`,
      `"${(item.pembimbing_2 || '').replace(/"/g, '""')}"`,
      item.skor_similarity || 0,
      item.status || '-',
      item.source
    ]);

    const csvContent = '\uFEFF' + [
      headers.join(';'),
      ...rows.map(e => e.join(';'))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Tren_Topik_${fieldFilter.toUpperCase()}_D3_MI_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* ── 1. Header Banner & Quick Controls ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 text-white shadow-lg border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold backdrop-blur-sm border border-indigo-400/20">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-300" />
              <span>Analitik &amp; Sebaran Tren Topik Bidang Keilmuan D3 MI</span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Sebaran Topik Tugas Akhir: Web, Android, dan AI</span>
            </h1>

            <p className="text-sm text-indigo-100/90 max-w-3xl leading-relaxed">
              Pemantauan sebaran fokus keilmuan tugas akhir prodi D3 Manajemen Informatika. Sistem mengelompokkan topik mahasiswa ke dalam 3 bidang utama: 
              <strong className="text-white"> Web &amp; Sistem Informasi</strong>, 
              <strong className="text-white"> Aplikasi Mobile / Android</strong>, dan 
              <strong className="text-white"> Artificial Intelligence (AI)</strong>.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-indigo-200">
              <span className="inline-flex items-center gap-1.5 bg-indigo-900/60 px-3 py-1 rounded-lg border border-indigo-700/50">
                <Globe className="w-3.5 h-3.5 text-blue-300" />
                Web: {stats.web.count} Judul ({stats.web.percentage}%)
              </span>
              <span className="inline-flex items-center gap-1.5 bg-indigo-900/60 px-3 py-1 rounded-lg border border-indigo-700/50">
                <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
                Android: {stats.android.count} Judul ({stats.android.percentage}%)
              </span>
              <span className="inline-flex items-center gap-1.5 bg-indigo-900/60 px-3 py-1 rounded-lg border border-indigo-700/50">
                <Bot className="w-3.5 h-3.5 text-purple-300" />
                AI: {stats.ai.count} Judul ({stats.ai.percentage}%)
              </span>
            </div>
          </div>

          <div className="flex flex-row md:flex-col gap-2 shrink-0">
            <button
              onClick={handleDownloadCsv}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Rekap (CSV)</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Cetak / Print Laporan</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Top Metric Cards (Fokus 3 Bidang Keilmuan) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Judul */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Judul Dianalisis</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {stats.total} <span className="text-xs font-medium text-slate-500">Judul</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Dataset D3 Manajemen Informatika</span>
          </div>
        </div>

        {/* 1. Bidang Web */}
        <div 
          onClick={() => setFieldFilter('web')}
          className={`bg-white border rounded-2xl p-5 shadow-2xs space-y-2 cursor-pointer transition-all hover:shadow-md ${
            fieldFilter === 'web' ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>1. Bidang Web</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
              {stats.web.percentage}%
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {stats.web.count} <span className="text-xs font-medium text-slate-500">Judul</span>
          </div>
          <p className="text-[11px] text-slate-500 line-clamp-1">
            Portal Web, SI Manajemen, Cloud &amp; REST API
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${stats.web.percentage}%` }} />
          </div>
        </div>

        {/* 2. Bidang Android */}
        <div 
          onClick={() => setFieldFilter('android')}
          className={`bg-white border rounded-2xl p-5 shadow-2xs space-y-2 cursor-pointer transition-all hover:shadow-md ${
            fieldFilter === 'android' ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              <span>2. Bidang Android</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
              {stats.android.percentage}%
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {stats.android.count} <span className="text-xs font-medium text-slate-500">Judul</span>
          </div>
          <p className="text-[11px] text-slate-500 line-clamp-1">
            Mobile Apps, Flutter, Kotlin, LBS &amp; AR
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${stats.android.percentage}%` }} />
          </div>
        </div>

        {/* 3. Bidang AI */}
        <div 
          onClick={() => setFieldFilter('ai')}
          className={`bg-white border rounded-2xl p-5 shadow-2xs space-y-2 cursor-pointer transition-all hover:shadow-md ${
            fieldFilter === 'ai' ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" />
              <span>3. Bidang AI</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800">
              {stats.ai.percentage}%
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {stats.ai.count} <span className="text-xs font-medium text-slate-500">Judul</span>
          </div>
          <p className="text-[11px] text-slate-500 line-clamp-1">
            Machine Learning, SPK, NLP &amp; Data Cerdas
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-purple-600 h-full rounded-full" style={{ width: `${stats.ai.percentage}%` }} />
          </div>
        </div>

      </div>

      {/* ── 3. Visual Comparison & Sebaran Proporsi (Poin 36 & 37) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visual Sebaran Batang Proporsi (Left 2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-600" />
                <span>Proporsi Sebaran Bidang Keilmuan</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rasio perbandingan minat mahasiswa pada ketiga bidang topik utama.
              </p>
            </div>
            <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
              Total {stats.total} Usulan
            </div>
          </div>

          {/* Combined Multi-segment Bar */}
          <div className="space-y-2">
            <div className="w-full bg-slate-100 rounded-2xl h-6 flex overflow-hidden p-1 shadow-inner gap-1">
              <div 
                className="bg-blue-600 h-full rounded-xl transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                style={{ width: `${Math.max(8, stats.web.percentage)}%` }}
                title={`Web: ${stats.web.count} judul (${stats.web.percentage}%)`}
              >
                {stats.web.percentage >= 15 ? `Web ${stats.web.percentage}%` : `${stats.web.percentage}%`}
              </div>
              <div 
                className="bg-emerald-600 h-full rounded-xl transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                style={{ width: `${Math.max(8, stats.android.percentage)}%` }}
                title={`Android: ${stats.android.count} judul (${stats.android.percentage}%)`}
              >
                {stats.android.percentage >= 15 ? `Android ${stats.android.percentage}%` : `${stats.android.percentage}%`}
              </div>
              <div 
                className="bg-purple-600 h-full rounded-xl transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                style={{ width: `${Math.max(8, stats.ai.percentage)}%` }}
                title={`AI: ${stats.ai.count} judul (${stats.ai.percentage}%)`}
              >
                {stats.ai.percentage >= 15 ? `AI ${stats.ai.percentage}%` : `${stats.ai.percentage}%`}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1.5 font-semibold text-blue-700">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                Web ({stats.web.count} Judul - {stats.web.percentage}%)
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                Android ({stats.android.count} Judul - {stats.android.percentage}%)
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-purple-700">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                AI ({stats.ai.count} Judul - {stats.ai.percentage}%)
              </span>
            </div>
          </div>

          {/* 3 Detailed Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            
            {/* Card Web */}
            <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-blue-900">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span>Bidang Web</span>
                </div>
                <span className="text-xs font-black text-blue-700">{stats.web.count} Judul</span>
              </div>
              <p className="text-[11px] text-blue-800/80 leading-snug">
                Fokus sistem informasi manajemen berbasis website dan arsitektur data.
              </p>
              <div className="flex flex-wrap gap-1 pt-1">
                {TOPIC_DOMAINS.web.sampleTech.map(tech => (
                  <span key={tech} className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-medium">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Card Android */}
            <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-900">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Bidang Android</span>
                </div>
                <span className="text-xs font-black text-emerald-700">{stats.android.count} Judul</span>
              </div>
              <p className="text-[11px] text-emerald-800/80 leading-snug">
                Aplikasi mobile praktis, pemetaan lokasi (LBS), dan augmented reality.
              </p>
              <div className="flex flex-wrap gap-1 pt-1">
                {TOPIC_DOMAINS.android.sampleTech.map(tech => (
                  <span key={tech} className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-medium">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Card AI */}
            <div className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-purple-900">
                  <Bot className="w-3.5 h-3.5 text-purple-600" />
                  <span>Bidang AI</span>
                </div>
                <span className="text-xs font-black text-purple-700">{stats.ai.count} Judul</span>
              </div>
              <p className="text-[11px] text-purple-800/80 leading-snug">
                Penerapan kecerdasan buatan, SPK terapan, klasifikasi, &amp; data cerdas.
              </p>
              <div className="flex flex-wrap gap-1 pt-1">
                {TOPIC_DOMAINS.ai.sampleTech.map(tech => (
                  <span key={tech} className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-medium">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Insight & Rekomendasi Kaprodi (Right 1 Col) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Insight Keilmuan Prodi D3</span>
            </h3>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              Evaluasi
            </span>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>Dominasi Topik Web ({stats.web.percentage}%)</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Topik berbasis web masih menjadi pilihan terbanyak karena relevan dengan kebutuhan administrasi perkantoran dan bisnis mitra prodi D3 MI.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tren Kenaikan Android &amp; AI</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Minat mahasiswa pada bidang aplikasi Android ({stats.android.percentage}%) dan AI/SPK ({stats.ai.percentage}%) menunjukkan tren peningkatan pada angkatan terbaru.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-1">
              <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-600" />
                <span>Rekomendasi Kaprodi</span>
              </div>
              <p className="text-[11px] text-indigo-900 leading-relaxed">
                Disarankan mendorong mahasiswa untuk memadukan studi kasus nyata UMKM/instansi dengan teknologi mobile Android atau metode cerdas (AI) sederhana.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* ── 4. Interactive Data Explorer & Table (Poin 36 & 37) ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden space-y-4 p-5">
        
        {/* Controls Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Field Tabs Filter (All, Web, Android, AI) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setFieldFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                fieldFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Semua Bidang ({classifiedDataset.length})
            </button>
            <button
              onClick={() => setFieldFilter('web')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                fieldFilter === 'web'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Web ({stats.web.count})</span>
            </button>
            <button
              onClick={() => setFieldFilter('android')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                fieldFilter === 'android'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android ({stats.android.count})</span>
            </button>
            <button
              onClick={() => setFieldFilter('ai')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                fieldFilter === 'ai'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI ({stats.ai.count})</span>
            </button>
          </div>

          {/* Dataset Source Selector & Search */}
          <div className="flex items-center gap-2">
            <select
              value={datasetFilter}
              onChange={(e) => setDatasetFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="aktif">Mahasiswa Aktif D3 MI</option>
              <option value="arsip">Arsip Alumni D3 MI</option>
              <option value="semua">Semua (Aktif + Arsip)</option>
            </select>

            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari judul, mhs, kata kunci..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

        </div>

        {/* Table of Classified Titles */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3 w-12 text-center">No</th>
                  <th className="py-3 px-4 w-44">Mahasiswa &amp; NIM</th>
                  <th className="py-3 px-4">Judul Tugas Akhir &amp; Kata Kunci</th>
                  <th className="py-3 px-3 w-32">Bidang Keilmuan</th>
                  <th className="py-3 px-4 w-48">Dosen Pembimbing</th>
                  <th className="py-3 px-3 w-24 text-center">Similarity</th>
                  <th className="py-3 px-3 w-20 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {displayedList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada usulan tugas akhir yang sesuai dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  displayedList.map((item, idx) => {
                    const isWeb = item.field === 'web';
                    const isAndroid = item.field === 'android';
                    const isAi = item.field === 'ai';

                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 text-center text-slate-400 font-semibold">
                          {idx + 1}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{item.mhs_nama}</div>
                          <div className="text-[11px] text-slate-500">{item.mhs_nim}</div>
                          <span className="inline-block mt-0.5 text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {item.angkatan ? `Angkatan ${item.angkatan}` : item.source}
                          </span>
                        </td>

                        <td className="py-3 px-4 space-y-1">
                          <div className="font-semibold text-slate-900 leading-snug">
                            {item.judul}
                          </div>
                          <div className="flex flex-wrap items-center gap-1 pt-0.5">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5" />
                              Kata Kunci:
                            </span>
                            {(item.matchedKeywords || []).map((k, i) => (
                              <span 
                                key={i} 
                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                  isWeb ? 'bg-blue-50 text-blue-700' :
                                  isAndroid ? 'bg-emerald-50 text-emerald-700' :
                                  'bg-purple-50 text-purple-700'
                                }`}
                              >
                                {k}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${item.config.badgeClass}`}>
                            {isWeb && <Globe className="w-3 h-3" />}
                            {isAndroid && <Smartphone className="w-3 h-3" />}
                            {isAi && <Bot className="w-3 h-3" />}
                            <span>{item.config.shortName}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800 text-[11px] truncate max-w-[180px]" title={item.pembimbing_1}>
                            1. {item.pembimbing_1}
                          </div>
                          {item.pembimbing_2 && item.pembimbing_2 !== '-' && (
                            <div className="text-slate-500 text-[10px] truncate max-w-[180px]" title={item.pembimbing_2}>
                              2. {item.pembimbing_2}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${
                            Number(item.skor_similarity) <= 25 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : Number(item.skor_similarity) <= 50 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {item.skor_similarity}%
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => setSelectedTitleModal(item)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Detail Judul & Klasifikasi"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
            <div>
              Menampilkan <strong>{displayedList.length}</strong> dari total <strong>{classifiedDataset.length}</strong> usulan judul.
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-semibold text-blue-600">
                <Globe className="w-3 h-3" /> Web: {stats.web.count}
              </span>
              <span className="flex items-center gap-1 font-semibold text-emerald-600">
                <Smartphone className="w-3 h-3" /> Android: {stats.android.count}
              </span>
              <span className="flex items-center gap-1 font-semibold text-purple-600">
                <Bot className="w-3 h-3" /> AI: {stats.ai.count}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ── 5. Modal Detail Judul & Penjelasan Bidang ── */}
      {selectedTitleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${selectedTitleModal.config.badgeClass}`}>
                  {selectedTitleModal.config.name}
                </span>
                <span className="text-xs text-slate-400">| ID: {selectedTitleModal.id}</span>
              </div>
              <button
                onClick={() => setSelectedTitleModal(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Judul Tugas Akhir</label>
                <div className="text-sm font-bold text-slate-900 leading-snug mt-0.5">
                  {selectedTitleModal.judul}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Mahasiswa</div>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">{selectedTitleModal.mhs_nama}</div>
                  <div className="text-[11px] text-slate-500">{selectedTitleModal.mhs_nim}</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Pembimbing 1</div>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">{selectedTitleModal.pembimbing_1}</div>
                  <div className="text-[11px] text-slate-500">2. {selectedTitleModal.pembimbing_2 || '-'}</div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Dasar Klasifikasi Bidang</div>
                <p className="text-xs text-slate-700">
                  {selectedTitleModal.config.description}
                </p>
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[10px] font-semibold text-slate-500">Kata Kunci Terdeteksi:</span>
                  {(selectedTitleModal.matchedKeywords || []).map((k, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded text-[10px] font-bold">
                      {k}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Skor Similarity: <strong>{selectedTitleModal.skor_similarity}%</strong></span>
                <span>Sumber Data: <strong>{selectedTitleModal.source}</strong></span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedTitleModal(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
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
