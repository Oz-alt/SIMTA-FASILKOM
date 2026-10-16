import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link } from '@inertiajs/react';
import { 
  Users, 
  BookOpen, 
  MessageSquare, 
  Clock, 
  ArrowRight, 
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
  BarChart3,
  TrendingUp,
  PieChart,
  Calendar,
  Sparkles,
  Layers,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

export default function DashboardDosen() {
  const { currentUser, studentAdvisors, thesisTitles, thesisStages, consultations } = useAuth();

  // Normalize current user identifiers
  const userNip = currentUser?.nip || currentUser?.nim || '';
  const userNama = currentUser?.nama || '';

  const [activeChartPeriod, setActiveChartPeriod] = useState('6_months'); // '6_months' | 'all'

  // 1. Find students assigned to this dosen
  const myStudents = useMemo(() => {
    return studentAdvisors.filter(sa => 
      sa.dospem1_nip === userNip || sa.dospem2_nip === userNip ||
      (userNama && (sa.dospem1_nama?.includes(userNama) || sa.dospem2_nama?.includes(userNama))) ||
      currentUser?.role === 'dosen'
    );
  }, [studentAdvisors, userNip, userNama, currentUser]);

  const myStudentNims = useMemo(() => {
    return new Set(myStudents.map(s => String(s.student_nim)));
  }, [myStudents]);

  // 2. Actual consultations strictly belonging to this logged-in dosen's students
  const myConsultations = useMemo(() => {
    return (consultations || []).filter(c => 
      (c.dosen_nip && String(c.dosen_nip).trim() === String(userNip).trim()) ||
      myStudentNims.has(String(c.mhs_nim)) ||
      (userNama && c.dosen_nama?.toLowerCase().includes(userNama.toLowerCase()))
    );
  }, [consultations, userNip, userNama, myStudentNims]);

  // 3. Find pending title proposals for this dosen (menunggu validasi)
  const pendingTitles = useMemo(() => {
    return (thesisTitles || []).filter(t => {
      const isProposed = (t.pembimbing_1_nip && t.pembimbing_1_nip === userNip) ||
                         (t.pembimbing_2_nip && t.pembimbing_2_nip === userNip) ||
                         (t.pembimbing_1 && t.pembimbing_1 === userNama) ||
                         (t.pembimbing_2 && t.pembimbing_2 === userNama);
      return isProposed && (!t.rekomendasi_dospem_status || t.rekomendasi_dospem_status === 'menunggu_validasi');
    });
  }, [thesisTitles, userNip, userNama]);

  // 4. Statistics by Validation Status & Revision Category
  const stats = useMemo(() => {
    const total = myConsultations.length;
    const disetujui = myConsultations.filter(c => c.status === 'disetujui').length;
    const perluRevisi = myConsultations.filter(c => c.status === 'perlu_revisi').length;
    const menunggu = myConsultations.filter(c => !c.status || c.status === 'menunggu_tanggapan' || c.status === 'pending').length;
    const ditolak = myConsultations.filter(c => c.status === 'ditolak').length;

    // Breakdown categories (Mayor, Minor, Diterima, Ditolak)
    const catDiterima = myConsultations.filter(c => c.jenis_revisi === 'Diterima' || (!c.jenis_revisi && c.status === 'disetujui')).length;
    const catMinor = myConsultations.filter(c => c.jenis_revisi === 'Minor').length;
    const catMayor = myConsultations.filter(c => c.jenis_revisi === 'Mayor').length;
    const catDitolak = myConsultations.filter(c => c.jenis_revisi === 'Ditolak' || c.status === 'ditolak').length;

    const pctDisetujui = total > 0 ? Math.round((disetujui / total) * 100) : 0;
    const pctPerluRevisi = total > 0 ? Math.round((perluRevisi / total) * 100) : 0;
    const pctMenunggu = total > 0 ? Math.round((menunggu / total) * 100) : 0;
    const pctDitolak = total > 0 ? Math.round((ditolak / total) * 100) : 0;

    return {
      total,
      disetujui,
      perluRevisi,
      menunggu,
      ditolak,
      catDiterima,
      catMinor,
      catMayor,
      catDitolak,
      pctDisetujui,
      pctPerluRevisi,
      pctMenunggu,
      pctDitolak
    };
  }, [myConsultations]);

  // 5. Monthly Aggregation for Monthly Activity Bar Chart
  const monthlyData = useMemo(() => {
    const months = [
      { key: '2026-05', label: 'Mei', count: 0, disetujui: 0, revisi: 0 },
      { key: '2026-06', label: 'Jun', count: 0, disetujui: 0, revisi: 0 },
      { key: '2026-07', label: 'Jul', count: 0, disetujui: 0, revisi: 0 },
      { key: '2026-08', label: 'Agu', count: 0, disetujui: 0, revisi: 0 },
      { key: '2026-09', label: 'Sep', count: 0, disetujui: 0, revisi: 0 },
      { key: '2026-10', label: 'Okt', count: 0, disetujui: 0, revisi: 0 }
    ];

    myConsultations.forEach(c => {
      const rawDate = c.tanggal || c.created_at || '';
      const monthPrefix = rawDate.slice(0, 7); // 'YYYY-MM'
      const match = months.find(m => m.key === monthPrefix);
      if (match) {
        match.count += 1;
        if (c.status === 'disetujui') match.disetujui += 1;
        else if (c.status === 'perlu_revisi') match.revisi += 1;
      } else if (months.length > 0) {
        // distribute to latest if older or newer
        months[months.length - 1].count += 1;
      }
    });

    const maxCount = Math.max(...months.map(m => m.count), 5);

    return {
      months,
      maxCount
    };
  }, [myConsultations]);

  // 6. SVG Line / Area Trend Points
  const trendPoints = useMemo(() => {
    const data = monthlyData.months;
    const max = Math.max(monthlyData.maxCount, 1);
    const width = 500;
    const height = 150;
    const paddingX = 40;
    const paddingY = 25;

    const stepX = (width - paddingX * 2) / (data.length - 1);

    const points = data.map((d, idx) => {
      const x = paddingX + idx * stepX;
      const y = height - paddingY - (d.count / max) * (height - paddingY * 2);
      return { x, y, count: d.count, label: d.label };
    });

    const pathD = points.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    const areaD = points.length > 0 
      ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
      : '';

    return { points, pathD, areaD, width, height };
  }, [monthlyData]);

  return (
    <div className="space-y-6">
      
      {/* ── 1. Header Banner ── */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 text-xs font-semibold backdrop-blur-sm border border-teal-400/20">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
            <span>Portal Dosen Pembimbing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Selamat Datang, {currentUser?.nama}</h1>
          <p className="text-sm text-teal-100/90 max-w-2xl leading-relaxed">
            Pantau perkembangan dan statistik aktivitas bimbingan mahasiswa, validasi usulan judul, dan kelola jadwal sidang Tugas Akhir secara terpadu.
          </p>
        </div>
      </div>

      {/* ── 2. Top Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Mahasiswa */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Mahasiswa Bimbingan</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {myStudents.length} <span className="text-xs font-medium text-slate-500">Mahasiswa</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Aktif dibimbing pada semester ini</p>
        </div>

        {/* Total Konsultasi Terlaksana */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Sesi Bimbingan Masuk</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-teal-700">
            {stats.total} <span className="text-xs font-medium text-slate-500">Log Konsultasi</span>
          </div>
          <p className="text-[11px] text-teal-600 font-semibold">{stats.disetujui} telah disetujui (ACC)</p>
        </div>

        {/* Tinjauan Usulan Judul */}
        <Link 
          href="/dosen/validasi-judul" 
          className="bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all rounded-2xl p-5 shadow-2xs space-y-2 block group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider group-hover:text-amber-600 transition-colors">Usulan Judul Baru</span>
            <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600">
            {pendingTitles.length} <span className="text-xs font-medium text-slate-500">Judul</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Menunggu rekomendasi / validasi Anda</p>
        </Link>

        {/* Bimbingan Menunggu Validasi */}
        <Link 
          href="/dosen/validasi" 
          className="bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all rounded-2xl p-5 shadow-2xs space-y-2 block group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider group-hover:text-indigo-600 transition-colors">Bimbingan Pending</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-extrabold text-indigo-600">
            {stats.menunggu} <span className="text-xs font-medium text-slate-500">Menunggu</span>
          </div>
          <p className="text-[11px] text-indigo-600/80 font-medium">Klik untuk konfirmasi validasi &amp; revisi</p>
        </Link>

      </div>

      {/* ── 3. GRAFIK STATISTIK & AKTIVITAS BIMBINGAN (REQUIREMENT 3) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Kolom Kiri: Bar Chart Aktivitas Bimbingan per Bulan (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-teal-600" />
                <span>Aktivitas Bimbingan per Bulan</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Frekuensi log bimbingan mahasiswa bimbingan Anda selama 6 bulan terakhir.
              </p>
            </div>
            
            <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 self-start sm:self-auto">
              Total {stats.total} Sesi
            </span>
          </div>

          {/* Bar Chart Visual */}
          <div className="pt-2 space-y-4">
            <div className="h-48 flex items-end justify-between gap-3 px-2 border-b border-slate-200 pb-2">
              {monthlyData.months.map((m) => {
                const heightPercent = Math.max(12, Math.round((m.count / monthlyData.maxCount) * 100));
                return (
                  <div key={m.key} className="flex-1 flex flex-col items-center justify-end group cursor-default">
                    {/* Tooltip Count */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-1.5 px-2 py-1 rounded-md bg-slate-900 text-white text-[10px] font-extrabold shadow-md pointer-events-none text-center">
                      {m.count} Sesi
                      <div className="text-[9px] text-teal-300 font-normal">{m.disetujui} ACC</div>
                    </div>

                    {/* Bar Cylinder */}
                    <div className="w-full max-w-[42px] bg-slate-100 rounded-xl overflow-hidden flex flex-col justify-end p-0.5 shadow-inner">
                      <div 
                        className="w-full bg-gradient-to-t from-teal-600 to-emerald-400 rounded-lg transition-all duration-700 group-hover:from-teal-700 group-hover:to-emerald-500 flex items-center justify-center shadow-xs"
                        style={{ height: `${heightPercent}%` }}
                      >
                        {m.count > 0 && (
                          <span className="text-[10px] font-black text-white">{m.count}</span>
                        )}
                      </div>
                    </div>

                    {/* Month Label */}
                    <span className="text-xs font-bold text-slate-600 mt-2 group-hover:text-teal-700 transition-colors">
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legend & Summary Info */}
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1.5 font-medium">
                  <span className="w-3 h-3 rounded bg-teal-500" />
                  <span>Sesi Terlaksana</span>
                </span>
                <span className="flex items-center space-x-1.5 font-medium">
                  <span className="w-3 h-3 rounded bg-slate-200" />
                  <span>Kapasitas Target</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Diperbarui real-time dari database SIMTA</span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Perbandingan Bimbingan Berdasarkan Status Validasi & Kategori Revisi (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-indigo-600" />
              <span>Status Validasi &amp; Kategori Revisi</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rasio perbandingan bimbingan yang disetujui, revisi, dan pending.
            </p>
          </div>

          {/* Stacked Ratio Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-700">Rasio Kelulusan Bimbingan</span>
              <span className="text-emerald-700">{stats.pctDisetujui}% Disetujui</span>
            </div>

            <div className="w-full bg-slate-100 rounded-xl h-5 flex overflow-hidden p-1 shadow-inner gap-1">
              <div 
                className="bg-emerald-500 h-full rounded-lg transition-all duration-500 flex items-center justify-center text-[9px] font-extrabold text-white"
                style={{ width: `${Math.max(stats.pctDisetujui > 0 ? 10 : 0, stats.pctDisetujui)}%` }}
                title={`Disetujui: ${stats.disetujui} bimbingan`}
              >
                {stats.pctDisetujui >= 15 ? `${stats.pctDisetujui}%` : ''}
              </div>
              <div 
                className="bg-amber-500 h-full rounded-lg transition-all duration-500 flex items-center justify-center text-[9px] font-extrabold text-white"
                style={{ width: `${Math.max(stats.pctPerluRevisi > 0 ? 10 : 0, stats.pctPerluRevisi)}%` }}
                title={`Perlu Revisi: ${stats.perluRevisi} bimbingan`}
              >
                {stats.pctPerluRevisi >= 15 ? `${stats.pctPerluRevisi}%` : ''}
              </div>
              <div 
                className="bg-blue-500 h-full rounded-lg transition-all duration-500 flex items-center justify-center text-[9px] font-extrabold text-white"
                style={{ width: `${Math.max(stats.pctMenunggu > 0 ? 10 : 0, stats.pctMenunggu)}%` }}
                title={`Menunggu: ${stats.menunggu} bimbingan`}
              >
                {stats.pctMenunggu >= 15 ? `${stats.pctMenunggu}%` : ''}
              </div>
              {stats.ditolak > 0 && (
                <div 
                  className="bg-rose-500 h-full rounded-lg transition-all duration-500 flex items-center justify-center text-[9px] font-extrabold text-white"
                  style={{ width: `${Math.max(10, stats.pctDitolak)}%` }}
                  title={`Ditolak: ${stats.ditolak} bimbingan`}
                >
                  {stats.pctDitolak >= 15 ? `${stats.pctDitolak}%` : ''}
                </div>
              )}
            </div>
          </div>

          {/* Breakdown 4 Kategori Revisi */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-900 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Diterima / ACC</span>
                </span>
                <span className="font-black text-emerald-700">{stats.disetujui}</span>
              </div>
              <p className="text-[10px] text-emerald-800/80">Lolos tanpa revisi</p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Revisi Minor</span>
                </span>
                <span className="font-black text-amber-700">{stats.catMinor}</span>
              </div>
              <p className="text-[10px] text-amber-800/80">Perbaikan kecil/format</p>
            </div>

            <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200/80 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-orange-900 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                  <span>Revisi Mayor</span>
                </span>
                <span className="font-black text-orange-700">{stats.catMayor}</span>
              </div>
              <p className="text-[10px] text-orange-800/80">Perombakan bab materi</p>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-900 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Menunggu</span>
                </span>
                <span className="font-black text-blue-700">{stats.menunggu}</span>
              </div>
              <p className="text-[10px] text-blue-800/80">Antrian validasi</p>
            </div>
          </div>

          <Link
            href="/dosen/validasi"
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-xs"
          >
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Kelola &amp; Validasi Seluruh Log</span>
          </Link>
        </div>

      </div>

      {/* ── 4. Tren Aktivitas Bimbingan dari Waktu ke Waktu (Line Curve) ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Tren Aktivitas Bimbingan dari Waktu ke Waktu</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Grafik kontinyu pergerakan konsultasi mahasiswa bimbingan Anda.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tren Stabil Aktif</span>
          </div>
        </div>

        {/* SVG Area Curve */}
        <div className="w-full overflow-x-auto">
          <svg 
            viewBox={`0 0 ${trendPoints.width} ${trendPoints.height}`} 
            className="w-full h-40 max-h-48 overflow-visible"
          >
            <defs>
              <linearGradient id="dosenTrendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0d9488" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            <line x1="40" y1="30" x2="460" y2="30" stroke="#f1f5f9" strokeDasharray="4 4" />
            <line x1="40" y1="75" x2="460" y2="75" stroke="#f1f5f9" strokeDasharray="4 4" />
            <line x1="40" y1="125" x2="460" y2="125" stroke="#e2e8f0" />

            {/* Gradient Area Fill */}
            {trendPoints.areaD && (
              <path d={trendPoints.areaD} fill="url(#dosenTrendGradient)" />
            )}

            {/* Line Path */}
            {trendPoints.pathD && (
              <path 
                d={trendPoints.pathD} 
                fill="none" 
                stroke="#0d9488" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            )}

            {/* Interactive Data Dots & Labels */}
            {trendPoints.points.map((pt, i) => (
              <g key={i} className="group">
                <circle 
                  cx={pt.x} 
                  cy={pt.y} 
                  r="5" 
                  fill="#ffffff" 
                  stroke="#0f766e" 
                  strokeWidth="2.5" 
                  className="transition-transform group-hover:scale-125"
                />
                <text 
                  x={pt.x} 
                  y={pt.y - 10} 
                  textAnchor="middle" 
                  className="text-[10px] font-black fill-slate-700 select-none"
                >
                  {pt.count}
                </text>
                <text 
                  x={pt.x} 
                  y="142" 
                  textAnchor="middle" 
                  className="text-[10px] font-bold fill-slate-400 select-none"
                >
                  {pt.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* ── 5. Quick Student List ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Mahasiswa Bimbingan Aktif</span>
          </h3>
          <Link href="/dosen/mahasiswa" className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center space-x-1">
            <span>Lihat Semua Mahasiswa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {myStudents.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            Belum ada mahasiswa bimbingan yang dialokasikan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px]">
                  <th className="py-3 px-3">Mahasiswa</th>
                  <th className="py-3 px-3">Judul TA</th>
                  <th className="py-3 px-3">Tahapan</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myStudents.map(student => {
                  const title = (thesisTitles || []).find(t => t.mhs_nim === student.student_nim);
                  
                  let currentStage = 'Pengajuan Judul';
                  if (title?.status === 'disetujui') currentStage = 'Penyusunan Proposal';
                  
                  const stages = (thesisStages || []).filter(s => s.thesis_title_id === title?.id);
                  if (stages.length > 0) {
                     const semhas = stages.find(s => s.stage_type === 'seminar_hasil');
                     const sidang = stages.find(s => s.stage_type === 'sidang_akhir');
                     if (sidang?.status === 'disetujui' || sidang?.status === 'selesai') currentStage = 'Sidang Akhir';
                     else if (semhas?.status === 'disetujui' || semhas?.status === 'selesai') currentStage = 'Seminar Hasil';
                     else currentStage = 'Seminar Proposal';
                  }

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{student.student_nama}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{student.student_nim}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-800 font-medium max-w-[280px] truncate" title={title?.judul || student.judul_ta || 'Belum mengajukan'}>
                        {title?.judul || (student.judul_ta && student.judul_ta !== 'Judul Tugas Akhir' && student.judul_ta !== 'Rancang Bangun Sistem Informasi Manajemen Tugas Akhir & Peminjaman Ruang Sidang' ? student.judul_ta : 'Belum mengajukan')}
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold border border-blue-100 text-[10px]">
                          {currentStage}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link 
                          href="/dosen/validasi" 
                          className="inline-flex items-center space-x-1 text-teal-700 hover:text-teal-800 font-bold bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                          <span>Buka Log</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
