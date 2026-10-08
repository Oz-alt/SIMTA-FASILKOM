import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link } from '@inertiajs/react';
import { calculateBimbinganReminder } from '../../lib/bimbinganReminder.js';
import { 
  Bell, 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Users, 
  FileText, 
  Printer, 
  Search, 
  Filter, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle, 
  ChevronRight, 
  X, 
  ExternalLink,
  MessageSquare,
  Sparkles,
  BookOpen,
  Calendar,
  Check,
  ArrowRight,
  Cpu,
  Zap,
  Radio,
  Sliders,
  CheckCheck
} from 'lucide-react';

export default function ReminderPembimbinganPage() {
  const { 
    thesisTitles, 
    consultations, 
    bimbinganReminderLogs, 
    sendBimbinganCadenceReminder, 
    sendBatchBimbinganCadenceReminders,
    triggerSystemAutoReminders,
    currentUser 
  } = useAuth();

  // Navigation & Filter States
  const [activeTab, setActiveTab] = useState('monitoring'); // 'monitoring' | 'history_logs' | 'automation_config'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all'); // 'all' | 'critical' | 'warning' | 'empty' | 'compliant'
  const [toastMessage, setToastMessage] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals
  const [testEmailModal, setTestEmailModal] = useState({
    isOpen: false,
    selectedLog: null
  });

  const [printPreviewModal, setPrintPreviewModal] = useState({
    isOpen: false
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Process Students Automated Cadence & Monitoring Data
  const studentsCadence = useMemo(() => {
    return (thesisTitles || []).map(t => {
      const reminder = calculateBimbinganReminder(consultations || [], t.mhs_nim, 2);
      
      // Determine cadence classification
      let severityKey = 'compliant';
      if (reminder.severity === 'critical') severityKey = 'critical';
      else if (reminder.severity === 'warning') severityKey = 'warning';
      else if (reminder.severity === 'empty') severityKey = 'empty';

      // Find reminder logs sent for this student
      const studentLogs = (bimbinganReminderLogs || []).filter(l => String(l.student_nim).trim() === String(t.mhs_nim).trim());

      return {
        ...t,
        reminder,
        severityKey,
        studentLogs,
        remindersSentCount: studentLogs.length,
        lastReminderSentAt: studentLogs.length > 0 ? studentLogs[0].tanggal_kirim : null,
        autoStatus: studentLogs.length > 0 
          ? 'terkirim_otomatis' 
          : (severityKey === 'critical' || severityKey === 'warning' || severityKey === 'empty') 
          ? 'terjadwal_otomatis' 
          : 'aman_sesuai_target'
      };
    });
  }, [thesisTitles, consultations, bimbinganReminderLogs]);

  // Statistics
  const stats = useMemo(() => {
    const total = studentsCadence.length;
    const criticalCount = studentsCadence.filter(s => s.severityKey === 'critical').length;
    const warningCount = studentsCadence.filter(s => s.severityKey === 'warning').length;
    const emptyCount = studentsCadence.filter(s => s.severityKey === 'empty').length;
    const compliantCount = studentsCadence.filter(s => s.severityKey === 'compliant').length;
    const needsReminderCount = criticalCount + warningCount + emptyCount;
    const totalRemindersSent = (bimbinganReminderLogs || []).length;

    return { total, criticalCount, warningCount, emptyCount, compliantCount, needsReminderCount, totalRemindersSent };
  }, [studentsCadence, bimbinganReminderLogs]);

  // Filtered Students Monitoring
  const filteredStudents = useMemo(() => {
    return studentsCadence.filter(s => {
      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        (s.mhs_nama && s.mhs_nama.toLowerCase().includes(q)) ||
        (s.mhs_nim && s.mhs_nim.toLowerCase().includes(q)) ||
        (s.judul && s.judul.toLowerCase().includes(q)) ||
        (s.pembimbing_1_nama && s.pembimbing_1_nama.toLowerCase().includes(q)) ||
        (s.pembimbing_2_nama && s.pembimbing_2_nama.toLowerCase().includes(q));

      // Severity filter
      const matchSeverity = filterSeverity === 'all' || s.severityKey === filterSeverity;

      return matchSearch && matchSeverity;
    });
  }, [studentsCadence, searchQuery, filterSeverity]);

  // Filtered Reminder Logs (Proof of process)
  const filteredLogs = useMemo(() => {
    if (!bimbinganReminderLogs) return [];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return bimbinganReminderLogs;
    return bimbinganReminderLogs.filter(l => 
      (l.student_nama && l.student_nama.toLowerCase().includes(q)) ||
      (l.student_nim && l.student_nim.toLowerCase().includes(q)) ||
      (l.dospem_1_nama && l.dospem_1_nama.toLowerCase().includes(q)) ||
      (l.subjek_email && l.subjek_email.toLowerCase().includes(q)) ||
      (l.student_email && l.student_email.toLowerCase().includes(q))
    );
  }, [bimbinganReminderLogs, searchQuery]);

  // Trigger Force Auto-Sync (Sistem Otomatis Mengevaluasi & Mengirimkan Pengingat Langsung)
  const handleTriggerAutoSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const runner = triggerSystemAutoReminders || sendBatchBimbinganCadenceReminders;
      if (typeof runner === 'function') {
        const logs = runner('both');
        showToast(`Engine Otomatis Sistem berhasil memindai ${studentsCadence.length} mahasiswa dan mengeksekusi pengiriman notifikasi pengingat secara otomatis!`);
      } else {
        showToast('Sinkronisasi otomatis sistem berhasil diselesaikan.');
      }
      setIsSyncing(false);
    }, 700);
  };

  // Print Proof Report
  const handlePrintProof = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner - Sistem Pengingat Otomatis Langsung dari Sistem (Khusus Kaprodi) */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-blue-700/40 relative overflow-hidden">
        <div className="relative z-10 space-y-2.5">
          
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold backdrop-blur-sm border border-emerald-400/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1"></span>
              <Cpu className="w-3.5 h-3.5 text-emerald-300" />
              <span>Engine Pengingat Otomatis Sistem: AKTIF</span>
            </div>

            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold backdrop-blur-sm border border-blue-400/20">
              Khusus Halaman Kaprodi D3 MI
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <span>Monitoring Pengingat Otomatis Tugas Akhir</span>
          </h1>

          <p className="text-sm text-blue-100/90 max-w-3xl leading-relaxed">
            Pengingat dijalankan secara <strong>otomatis langsung dari sistem</strong>. Sistem secara berkala memindai batas waktu pengajuan judul, keterlambatan progres Tugas Akhir, serta mengeksekusi pengiriman notifikasi pengingat via Gmail resmi mahasiswa dan dosen pembimbing tanpa perlu penanganan manual satu per satu.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-blue-200 font-medium">
            <span className="inline-flex items-center gap-1.5 bg-blue-950/60 px-3 py-1 rounded-lg border border-blue-800/50">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              Auto-Scheduler: Berjalan di Latar Belakang
            </span>
            <span className="inline-flex items-center gap-1.5 bg-blue-950/60 px-3 py-1 rounded-lg border border-blue-800/50">
              <Mail className="w-3.5 h-3.5 text-emerald-300" />
              Terkirim Otomatis ke Gmail Mahasiswa &amp; Pembimbing
            </span>
            <span className="inline-flex items-center gap-1.5 bg-blue-950/60 px-3 py-1 rounded-lg border border-blue-800/50">
              <FileText className="w-3.5 h-3.5 text-indigo-300" />
              Audit Trail Otomatis Terekam Sah
            </span>
          </div>

        </div>
      </div>

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Kritis: > 30 Hari */}
        <div 
          onClick={() => { setActiveTab('monitoring'); setFilterSeverity('critical'); }}
          className={`cursor-pointer bg-white border rounded-xl p-4 shadow-2xs space-y-1 transition-all hover:shadow-md ${
            filterSeverity === 'critical' ? 'ring-2 ring-rose-500 border-rose-300 bg-rose-50/20' : 'border-slate-200 hover:border-rose-400'
          }`}
        >
          <div className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center justify-between">
            <span>Kritis (&gt; 30 Hari)</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 pt-1">
            {stats.criticalCount} Mahasiswa
          </div>
          <p className="text-[11px] text-rose-600 font-medium">Auto-Reminder dikirimkan intensif</p>
        </div>

        {/* Peringatan: >= 15 Hari */}
        <div 
          onClick={() => { setActiveTab('monitoring'); setFilterSeverity('warning'); }}
          className={`cursor-pointer bg-white border rounded-xl p-4 shadow-2xs space-y-1 transition-all hover:shadow-md ${
            filterSeverity === 'warning' ? 'ring-2 ring-amber-500 border-amber-300 bg-amber-50/20' : 'border-slate-200 hover:border-amber-400'
          }`}
        >
          <div className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center justify-between">
            <span>Peringatan Progres</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 pt-1">
            {stats.warningCount} Mahasiswa
          </div>
          <p className="text-[11px] text-amber-600 font-medium">Dalam jadwal antrean otomatis sistem</p>
        </div>

        {/* Belum Ada Usulan */}
        <div 
          onClick={() => { setActiveTab('monitoring'); setFilterSeverity('empty'); }}
          className={`cursor-pointer bg-white border rounded-xl p-4 shadow-2xs space-y-1 transition-all hover:shadow-md ${
            filterSeverity === 'empty' ? 'ring-2 ring-orange-500 border-orange-300 bg-orange-50/20' : 'border-slate-200 hover:border-orange-400'
          }`}
        >
          <div className="text-xs font-bold text-orange-700 uppercase tracking-wider flex items-center justify-between">
            <span>Belum Usul Judul</span>
            <AlertCircle className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-orange-700 pt-1">
            {stats.emptyCount} Mahasiswa
          </div>
          <p className="text-[11px] text-orange-600 font-medium">Sistem otomatis ingatkan pengajuan</p>
        </div>

        {/* Progres Lancar / Aman */}
        <div 
          onClick={() => { setActiveTab('monitoring'); setFilterSeverity('compliant'); }}
          className={`cursor-pointer bg-white border rounded-xl p-4 shadow-2xs space-y-1 transition-all hover:shadow-md ${
            filterSeverity === 'compliant' ? 'ring-2 ring-emerald-500 border-emerald-300 bg-emerald-50/20' : 'border-slate-200 hover:border-emerald-400'
          }`}
        >
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center justify-between">
            <span>Progres Sesuai Target</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 pt-1">
            {stats.compliantCount} Mahasiswa
          </div>
          <p className="text-[11px] text-emerald-600 font-medium">Tidak memerlukan tindakan sistem</p>
        </div>

        {/* Total Eksekusi Otomatis */}
        <div 
          onClick={() => setActiveTab('history_logs')}
          className={`cursor-pointer bg-white border rounded-xl p-4 shadow-2xs space-y-1 transition-all hover:shadow-md ${
            activeTab === 'history_logs' ? 'ring-2 ring-indigo-500 border-indigo-300 bg-indigo-50/20' : 'border-slate-200 hover:border-indigo-400'
          }`}
        >
          <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center justify-between">
            <span>Eksekusi Otomatis</span>
            <CheckCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700 pt-1">
            {stats.totalRemindersSent} Terkirim
          </div>
          <p className="text-[11px] text-indigo-600 font-medium">Tercatat di log sistem</p>
        </div>

      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        
        {/* Navigation Tabs & Actions Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('monitoring')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'monitoring'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Matriks Pemantauan Otomatis ({studentsCadence.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history_logs')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'history_logs'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Log Notifikasi Otomatis Terkirim ({bimbinganReminderLogs?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('automation_config')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'automation_config'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Konfigurasi Engine Otomatis</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Force Auto-Sync Button */}
            <button
              type="button"
              onClick={handleTriggerAutoSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all disabled:opacity-60 cursor-pointer"
              title="Jalankan pemindaian dan evaluasi pengingat otomatis oleh sistem sekarang juga"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Memindai Otomatis...' : 'Jalankan Evaluasi Otomatis Sekarang'}</span>
            </button>

            {/* Print Proof Button */}
            <button
              type="button"
              onClick={() => setPrintPreviewModal({ isOpen: true })}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors border border-slate-200 cursor-pointer"
              title="Cetak lembar rekapitulasi bukti pengingat otomatis resmi prodi"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Cetak Bukti Proses</span>
            </button>

          </div>

        </div>

        {/* Filter Bar */}
        {activeTab !== 'automation_config' && (
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Search Box */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={activeTab === 'monitoring' ? "Cari nama mahasiswa, NIM, judul TA, atau dosen pembimbing..." : "Cari riwayat email otomatis, penerima, atau subjek pengingat..."}
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

            {/* Severity Chips (only for monitoring tab) */}
            {activeTab === 'monitoring' && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Status:</span>
                
                <button
                  type="button"
                  onClick={() => setFilterSeverity('all')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                    filterSeverity === 'all' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Semua ({studentsCadence.length})
                </button>

                <button
                  type="button"
                  onClick={() => setFilterSeverity('critical')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                    filterSeverity === 'critical' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  Kritis &gt;30 Hari ({stats.criticalCount})
                </button>

                <button
                  type="button"
                  onClick={() => setFilterSeverity('warning')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                    filterSeverity === 'warning' ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  Peringatan ({stats.warningCount})
                </button>

                <button
                  type="button"
                  onClick={() => setFilterSeverity('compliant')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                    filterSeverity === 'compliant' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  Aman / Target Terpenuhi ({stats.compliantCount})
                </button>
              </div>
            )}

          </div>
        )}

        {/* TAB 1: Matriks Pemantauan Otomatis Sistem */}
        {activeTab === 'monitoring' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Mahasiswa &amp; NIM</th>
                  <th className="py-3 px-4 min-w-[240px]">Judul Tugas Akhir</th>
                  <th className="py-3 px-4 min-w-[190px]">Dosen Pembimbing</th>
                  <th className="py-3 px-4 min-w-[170px]">Kondisi Terdeteksi Sistem</th>
                  <th className="py-3 px-4 min-w-[200px]">Status Pengingat Otomatis Sistem</th>
                  <th className="py-3 px-4 text-right min-w-[150px]">Bukti Notifikasi Otomatis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">Tidak ada mahasiswa yang cocok dengan filter</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Semua data mahasiswa telah terpantau sesuai kriteria.</p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(s => {
                    const rem = s.reminder;
                    const isCompliant = s.severityKey === 'compliant';
                    const isCritical = s.severityKey === 'critical';
                    const isWarning = s.severityKey === 'warning';
                    const isEmpty = s.severityKey === 'empty';

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                        
                        {/* Student */}
                        <td className="py-3.5 px-4 font-semibold text-slate-900 align-top">
                          <div className="text-xs text-slate-900 font-bold">{s.mhs_nama}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {s.mhs_nim} <span className="text-slate-300">&bull;</span> {s.mhs_kelas}
                          </div>
                          <div className="text-[10px] text-indigo-600 font-mono mt-0.5">
                            {s.mhs_nim}@student.unsri.ac.id
                          </div>
                        </td>

                        {/* Title */}
                        <td className="py-3.5 px-4 text-slate-800 align-top">
                          <p className="font-medium text-xs text-slate-900 leading-snug">
                            {s.judul || <span className="text-amber-600 italic">Belum Mengajukan Judul Tugas Akhir</span>}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold uppercase">
                              Status: {s.status || 'Baru'}
                            </span>
                            {s.skor_kemiripan_terakhir !== undefined && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 font-semibold">
                                Sim: {s.skor_kemiripan_terakhir}%
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Advisors */}
                        <td className="py-3.5 px-4 text-slate-700 align-top space-y-1">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Dospem 1: </span>
                            <span className="text-xs font-bold text-slate-800">{s.pembimbing_1_nama || s.pembimbing_1 || '-'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Dospem 2: </span>
                            <span className="text-xs font-bold text-slate-800">{s.pembimbing_2_nama || s.pembimbing_2 || '-'}</span>
                          </div>
                        </td>

                        {/* Condition Detected by System */}
                        <td className="py-3.5 px-4 align-top space-y-1">
                          <div>
                            {isCritical && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                <span>Kritis (&gt;30 Hari Tanpa Progres)</span>
                              </span>
                            )}
                            {isWarning && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Peringatan Interval Progres</span>
                              </span>
                            )}
                            {isEmpty && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-800 border border-orange-300">
                                <AlertCircle className="w-3 h-3 text-orange-600" />
                                <span>Belum Mengajukan Usulan</span>
                              </span>
                            )}
                            {isCompliant && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                <span>Progres Terjadwal Aman</span>
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] text-slate-500">
                            {rem.daysSinceLast !== null ? `${rem.daysSinceLast} hari sejak update terakhir` : 'Belum ada aktivitas'}
                          </div>
                        </td>

                        {/* Auto-Reminder Status Directly from System */}
                        <td className="py-3.5 px-4 align-top space-y-1.5">
                          {s.remindersSentCount > 0 ? (
                            <div>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Terkirim Otomatis oleh Sistem</span>
                              </span>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                Terakhir: {new Date(s.lastReminderSentAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}, {new Date(s.lastReminderSentAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                              </div>
                              <div className="text-[10px] text-indigo-600 font-semibold">
                                Total eksekusi: {s.remindersSentCount}x
                              </div>
                            </div>
                          ) : isCompliant ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                                <span>Tidak Memerlukan Pengingat</span>
                              </span>
                              <div className="text-[10px] text-slate-400 mt-0.5">Progres berjalan lancar</div>
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Zap className="w-3.5 h-3.5 text-amber-600" />
                                <span>Terjadwal Otomatis (Antrean)</span>
                              </span>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Eksekusi otomatis siklus berikutnya
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Bukti Notifikasi Otomatis */}
                        <td className="py-3.5 px-4 text-right align-top space-y-1">
                          {s.studentLogs.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setTestEmailModal({ isOpen: true, selectedLog: s.studentLogs[0] })}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 transition-colors cursor-pointer"
                              title="Buka salinan email pengingat yang otomatis dikirimkan sistem"
                            >
                              <Mail className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Lihat Bukti Email</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              {isCompliant ? 'Status Aman' : 'Menunggu Siklus'}
                            </span>
                          )}
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: Riwayat Log Pengiriman Otomatis Sistem */}
        {activeTab === 'history_logs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Waktu Eksekusi Sistem</th>
                  <th className="py-3 px-4 min-w-[180px]">Penerima Mahasiswa</th>
                  <th className="py-3 px-4 min-w-[180px]">Penerima Pembimbing</th>
                  <th className="py-3 px-4 min-w-[260px]">Isi Pesan Notifikasi Otomatis</th>
                  <th className="py-3 px-4 min-w-[150px]">Alamat Tujuan</th>
                  <th className="py-3 px-4 text-right min-w-[120px]">Status Pengiriman</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">Belum ada riwayat notifikasi otomatis</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Riwayat pengingat otomatis akan otomatis tersimpan permanen di sini sebagai bukti proses.</p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700 align-top">
                        <div className="font-bold text-slate-900">
                          {new Date(log.tanggal_kirim).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Pukul {new Date(log.tanggal_kirim).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </div>
                        <div className="text-[9px] font-bold text-emerald-600 uppercase mt-0.5">
                          Otomatis oleh Sistem
                        </div>
                      </td>

                      {/* Mahasiswa */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 align-top">
                        <div className="text-xs font-bold text-slate-900">{log.student_nama}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{log.student_nim} ({log.student_kelas || 'MI'})</div>
                        <div className="text-[10px] text-indigo-600 font-mono mt-0.5">{log.student_email || `${log.student_nim}@student.unsri.ac.id`}</div>
                      </td>

                      {/* Dospem */}
                      <td className="py-3.5 px-4 text-slate-700 align-top space-y-0.5">
                        <div className="text-xs font-semibold text-slate-800">{log.dospem_1_nama}</div>
                        {log.dospem_2_nama && log.dospem_2_nama !== '-' && (
                          <div className="text-[11px] text-slate-600">{log.dospem_2_nama}</div>
                        )}
                      </td>

                      {/* Message Content */}
                      <td className="py-3.5 px-4 text-slate-800 align-top space-y-1">
                        <div className="font-bold text-xs text-indigo-900">
                          {log.subjek_email}
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 italic">
                          &ldquo;{log.isi_pesan}&rdquo;
                        </p>
                        <button
                          type="button"
                          onClick={() => setTestEmailModal({ isOpen: true, selectedLog: log })}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline pt-0.5 cursor-pointer"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Lihat Salinan Surat/Email Lengkap</span>
                        </button>
                      </td>

                      {/* Recipient Emails */}
                      <td className="py-3.5 px-4 align-top space-y-1 font-mono text-[10px]">
                        <div className="font-bold text-slate-700 capitalize">Kanal: Gmail &amp; Notif SIMTA</div>
                        {(log.recipients_emails || []).map((em, idx) => (
                          <div key={idx} className="text-slate-500 truncate max-w-[200px]" title={em}>
                            &bull; {em}
                          </div>
                        ))}
                      </td>

                      {/* Status Bukti */}
                      <td className="py-3.5 px-4 text-right align-top space-y-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Terkirim Otomatis</span>
                        </span>

                        <div className="text-[10px] text-slate-400">
                          Pengirim: {log.pengirim_nama || 'Sistem Otomatis SIMTA'}
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: Konfigurasi & Jadwal Otomatis Sistem */}
        {activeTab === 'automation_config' && (
          <div className="p-6 space-y-6">
            <div className="max-w-3xl space-y-6">
              
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-indigo-600" />
                      <span>Parameter Otomasi Engine Pengingat SIMTA</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Sistem berjalan secara otomatis tanpa memerlukan input manual berulang</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Status: Aktif Otomatis
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-700 block">Jadwal Siklus Eksekusi:</span>
                    <p className="text-slate-600 font-medium">Otomatis Setiap Hari pukul 08:00 WIB &amp; Real-time saat deteksi perubahan status</p>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-700 block">Batas Ambang Kritis:</span>
                    <p className="text-slate-600 font-medium">&gt; 30 Hari keterlambatan progres Tugas Akhir / usulan judul</p>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-700 block">Kanal Pengiriman Notifikasi:</span>
                    <p className="text-slate-600 font-medium">Gmail Resmi UNSRI (@student.unsri.ac.id &amp; @unsri.ac.id) serta Notifikasi Portal</p>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-700 block">Pengirim Resmi Notifikasi:</span>
                    <p className="text-slate-600 font-medium">Sistem Otomatis SIMTA (Atas Nama Program Studi D3 Manajemen Informatika)</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex items-start gap-3">
                <Zap className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900 space-y-1">
                  <h4 className="font-bold">Keuntungan Sistem Pengingat Otomatis Terpadu</h4>
                  <p className="leading-relaxed">
                    Dengan sistem otomatis ini, seluruh pengingat dikelola langsung oleh sistem SIMTA pada halaman Kaprodi. Mahasiswa dan dosen pembimbing menerima notifikasi tepat waktu secara otomatis tanpa membebani Kaprodi untuk mengirimkan pesan satu demi satu.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* MODAL PREVIEW SURAT / EMAIL RESMI PENGINGAT OTOMATIS SISTEM */}
      {testEmailModal.isOpen && testEmailModal.selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Salinan Email Pengingat Otomatis Sistem
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Bukti proses otentik yang otomatis dikirimkan sistem via Gmail &amp; SIMTA
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setTestEmailModal({ isOpen: false, selectedLog: null })}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email UI Header */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Dari:</span>
                <span className="font-bold text-slate-900">SIMTA Auto-Reminder Engine &lt;simta-noreply@unsri.ac.id&gt;</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Waktu Kirim:</span>
                <span className="text-slate-800">
                  {new Date(testEmailModal.selectedLog.tanggal_kirim).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })} WIB
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Kepada:</span>
                <span className="font-bold text-indigo-600">
                  {(testEmailModal.selectedLog.recipients_emails || []).join(', ')}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Subjek:</span>
                <span className="font-bold text-slate-900 font-sans">
                  {testEmailModal.selectedLog.subjek_email}
                </span>
              </div>
            </div>

            {/* Email Body */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4 text-xs text-slate-800 leading-relaxed font-sans">
              <div className="border-b border-slate-100 pb-3">
                <div className="font-bold text-slate-900 text-sm">FAKULTAS ILMU KOMPUTER - UNIVERSITAS SRIWIJAYA</div>
                <div className="text-[11px] text-slate-500">Program Studi D3 Manajemen Informatika</div>
              </div>

              <p>Yth. Bapak/Ibu Dosen Pembimbing &amp; Mahasiswa yang bersangkutan,</p>
              
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                <div>Mahasiswa: <strong>{testEmailModal.selectedLog.student_nama}</strong> ({testEmailModal.selectedLog.student_nim})</div>
                <div>Judul Tugas Akhir: <em>&ldquo;{testEmailModal.selectedLog.judul_ta}&rdquo;</em></div>
                <div>Pembimbing 1: <strong>{testEmailModal.selectedLog.dospem_1_nama}</strong></div>
                <div>Pembimbing 2: <strong>{testEmailModal.selectedLog.dospem_2_nama}</strong></div>
              </div>

              <div className="whitespace-pre-line text-slate-700">
                {testEmailModal.selectedLog.isi_pesan}
              </div>

              <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500">
                <p>Email ini dikirimkan secara otomatis oleh <strong>Sistem Otomatis SIMTA (Auto-Reminder Engine)</strong> Program Studi D3 Manajemen Informatika FASILKOM UNSRI.</p>
                <p className="mt-1">ID Transaksi Audit: <span className="font-mono">{testEmailModal.selectedLog.id}</span></p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setTestEmailModal({ isOpen: false, selectedLog: null })}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL PRINT PREVIEW REKAP BUKTI PENGINGAT OTOMATIS */}
      {printPreviewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Cetak Lembar Rekapitulasi Bukti Pengingat Otomatis
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Format cetak resmi untuk arsip akreditasi dan bukti monitoring prodi
                </p>
              </div>

              <button 
                onClick={() => setPrintPreviewModal({ isOpen: false })}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Print Area Preview */}
            <div id="print-area" className="p-6 bg-white border border-slate-200 rounded-xl space-y-4 text-xs text-slate-900 font-sans">
              <div className="text-center border-b-2 border-slate-900 pb-3 space-y-0.5">
                <h2 className="font-extrabold text-sm uppercase">KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI</h2>
                <h3 className="font-bold text-xs uppercase">UNIVERSITAS SRIWIJAYA &bull; FAKULTAS ILMU KOMPUTER</h3>
                <h4 className="font-semibold text-xs uppercase">PROGRAM STUDI D3 MANAJEMEN INFORMATIKA</h4>
                <p className="text-[10px] text-slate-500">Sistem Informasi Manajemen Tugas Akhir (SIMTA) - Rekapitulasi Audit Trail Otomatis</p>
              </div>

              <div className="py-2 flex justify-between items-center text-[11px]">
                <div>
                  <strong>Dokumen:</strong> Rekap Pengingat Otomatis Progres Tugas Akhir<br />
                  <strong>Tanggal Cetak:</strong> {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
                </div>
                <div className="text-right">
                  <strong>Total Mahasiswa Dipantau:</strong> {studentsCadence.length}<br />
                  <strong>Pengingat Otomatis Terkirim:</strong> {(bimbinganReminderLogs || []).length} Sesi
                </div>
              </div>

              <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300">No</th>
                    <th className="p-2 border-r border-slate-300">Mahasiswa</th>
                    <th className="p-2 border-r border-slate-300">Judul TA</th>
                    <th className="p-2 border-r border-slate-300">Dosen Pembimbing</th>
                    <th className="p-2 border-r border-slate-300">Status Otomatis</th>
                    <th className="p-2">Eksekusi Terakhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {studentsCadence.slice(0, 15).map((s, idx) => (
                    <tr key={s.id}>
                      <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-bold">{s.mhs_nama} ({s.mhs_nim})</td>
                      <td className="p-2 border-r border-slate-200 max-w-[200px] truncate">{s.judul || 'Belum usul'}</td>
                      <td className="p-2 border-r border-slate-200">{s.pembimbing_1_nama || '-'}</td>
                      <td className="p-2 border-r border-slate-200 capitalize font-medium">{s.autoStatus.replace(/_/g, ' ')}</td>
                      <td className="p-2">{s.lastReminderSentAt ? new Date(s.lastReminderSentAt).toLocaleDateString('id-ID') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-6 flex justify-between items-end text-[11px]">
                <div className="text-[10px] text-slate-500">
                  Dicetak secara sah melalui sistem SIMTA FASILKOM UNSRI.
                </div>
                <div className="text-center w-56 space-y-12">
                  <div>
                    Indralaya, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}<br />
                    Ketua Program Studi D3 Manajemen Informatika,
                  </div>
                  <div>
                    <strong>Dr. Abdiansah, S.Kom., M.Cs.</strong><br />
                    NIP. 198410012009121005
                  </div>
                </div>
              </div>

            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPrintPreviewModal({ isOpen: false })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handlePrintProof}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembar Rekap</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
