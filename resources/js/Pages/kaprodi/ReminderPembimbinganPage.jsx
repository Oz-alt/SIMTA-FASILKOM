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
  ArrowRight
} from 'lucide-react';

export default function ReminderPembimbinganPage() {
  const { 
    thesisTitles, 
    consultations, 
    bimbinganReminderLogs, 
    sendBimbinganCadenceReminder, 
    sendBatchBimbinganCadenceReminders,
    currentUser
  } = useAuth();

  // Navigation & Filter States
  const [activeTab, setActiveTab] = useState('monitoring'); // 'monitoring' | 'history_logs'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all'); // 'all' | 'critical' | 'warning' | 'empty' | 'compliant'
  const [toastMessage, setToastMessage] = useState(null);

  // Modals
  const [sendModal, setSendModal] = useState({
    isOpen: false,
    student: null,
    target: 'both', // 'mahasiswa' | 'dospem' | 'both'
    subject: '',
    message: '',
    isSending: false
  });

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

  // Process Students Cadence Data
  const studentsCadence = useMemo(() => {
    return thesisTitles.map(t => {
      const reminder = calculateBimbinganReminder(consultations, t.mhs_nim, 2);
      
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
        lastReminderSentAt: studentLogs.length > 0 ? studentLogs[0].tanggal_kirim : null
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

  // Handler to open Send Modal for individual student
  const handleOpenSendModal = (studentItem) => {
    const rem = studentItem.reminder;
    const isCrit = rem.severity === 'critical';
    
    const subject = isCrit 
      ? `[Peringatan Kritis Prodi D3 MI] Keterlambatan Pembimbingan TA (${studentItem.mhs_nama} - ${studentItem.mhs_nim})`
      : `[Pengingat Rutin Prodi D3 MI] Kewajiban Pembimbingan Minimal 2x/Bulan (${studentItem.mhs_nama})`;

    const message = rem.daysSinceLast !== null
      ? `Pemberitahuan resmi Prodi D3 Manajemen Informatika: Berdasarkan pemantauan SIMTA, mahasiswa ${studentItem.mhs_nama} (${studentItem.mhs_nim}) belum melaksanakan bimbingan selama ${rem.daysSinceLast} hari (terakhir: ${rem.latestDateFormatted || '-'}). Ketentuan akademik mewajibkan minimal 2 kali pembimbingan dalam 1 bulan. Mohon agar mahasiswa dan dosen pembimbing segera menjadwalkan sesi bimbingan lanjutan.`
      : `Pemberitahuan resmi Prodi D3 Manajemen Informatika: Mahasiswa ${studentItem.mhs_nama} (${studentItem.mhs_nim}) belum memiliki catatan bimbingan di Kartu Bimbingan Digital SIMTA. Mohon agar mahasiswa segera berkonsultasi dengan Dosen Pembimbing untuk memenuhi target minimal 2 kali bimbingan per bulan.`;

    setSendModal({
      isOpen: true,
      student: studentItem,
      target: 'both',
      subject,
      message,
      isSending: false
    });
  };

  // Handler to submit single reminder
  const handleSubmitSend = (e) => {
    e.preventDefault();
    if (!sendModal.student) return;

    setSendModal(prev => ({ ...prev, isSending: true }));

    const log = sendBimbinganCadenceReminder({
      studentNim: sendModal.student.mhs_nim,
      target: sendModal.target,
      customSubject: sendModal.subject,
      customMessage: sendModal.message
    });

    setSendModal({ isOpen: false, student: null, target: 'both', subject: '', message: '', isSending: false });
    showToast(`Pengingat berhasil dikirim melalui Gmail/Email dan tercatat dalam bukti proses!`);
  };

  // Handler for Batch Reminder Dispatch
  const handleBatchBroadcast = () => {
    const count = stats.needsReminderCount;
    if (count === 0) {
      showToast('Semua mahasiswa saat ini sudah memenuhi target minimal 2x bimbingan per bulan.');
      return;
    }

    if (window.confirm(`Kirim reminder via Gmail/Email serentak kepada ${count} mahasiswa & dosen pembimbing yang belum memenuhi target 2x bimbingan/bulan?`)) {
      const logs = sendBatchBimbinganCadenceReminders('both');
      showToast(`Berhasil mengirimkan ${logs.length} reminder bimbingan ke Gmail mahasiswa dan pembimbing!`);
    }
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

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-blue-700/40 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold backdrop-blur-sm border border-blue-400/20">
            <Bell className="w-3.5 h-3.5 text-amber-300" />
            <span>Sistem Pengingat Kepatuhan Bimbingan &amp; Audit Trail Prodi</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white">
            Pengingat Pembimbingan Tugas Akhir (Cadence Reminder)
          </h1>

          <p className="text-sm text-blue-100/90 max-w-3xl leading-relaxed">
            Sesuai standar operasional akademik D3 Manajemen Informatika, mahasiswa diwajibkan melakukan bimbingan <strong>minimal 2 kali dalam 1 bulan</strong> (interval maksimal 15 hari). Sistem ini secara otomatis memantau kepatuhan bimbingan, mengirimkan notifikasi via Gmail/Email kepada mahasiswa maupun dosen pembimbing, serta merekam riwayat sebagai bukti proses sah monitoring Prodi.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-blue-200 font-medium">
            <span className="inline-flex items-center gap-1.5 bg-blue-950/60 px-3 py-1 rounded-lg border border-blue-800/50">
              <Clock className="w-3.5 h-3.5 text-indigo-300" />
              Kebijakan: Min. 2x Bimbingan / 30 Hari
            </span>
            <span className="inline-flex items-center gap-1.5 bg-blue-950/60 px-3 py-1 rounded-lg border border-blue-800/50">
              <Mail className="w-3.5 h-3.5 text-emerald-300" />
              Terkirim via Gmail (Mahasiswa &amp; Pembimbing)
            </span>
            <span className="inline-flex items-center gap-1.5 bg-blue-950/60 px-3 py-1 rounded-lg border border-blue-800/50">
              <FileText className="w-3.5 h-3.5 text-amber-300" />
              Riwayat Tersimpan Sebagai Bukti Proses
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
          <p className="text-[11px] text-rose-600 font-medium">Terhenti &gt; 1 bulan tanpa bimbingan</p>
        </div>

        {/* Peringatan: >= 15 Hari atau < 2x */}
        <div 
          onClick={() => { setActiveTab('monitoring'); setFilterSeverity('warning'); }}
          className={`cursor-pointer bg-white border rounded-xl p-4 shadow-2xs space-y-1 transition-all hover:shadow-md ${
            filterSeverity === 'warning' ? 'ring-2 ring-amber-500 border-amber-300 bg-amber-50/20' : 'border-slate-200 hover:border-amber-400'
          }`}
        >
          <div className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center justify-between">
            <span>Peringatan (&ge; 15 Hari)</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 pt-1">
            {stats.warningCount} Mahasiswa
          </div>
          <p className="text-[11px] text-amber-600 font-medium">Belum penuhi target 2x bimbingan</p>
        </div>

        {/* Belum Ada Bimbingan */}
        <div 
          onClick={() => { setActiveTab('monitoring'); setFilterSeverity('empty'); }}
          className={`cursor-pointer bg-white border rounded-xl p-4 shadow-2xs space-y-1 transition-all hover:shadow-md ${
            filterSeverity === 'empty' ? 'ring-2 ring-orange-500 border-orange-300 bg-orange-50/20' : 'border-slate-200 hover:border-orange-400'
          }`}
        >
          <div className="text-xs font-bold text-orange-700 uppercase tracking-wider flex items-center justify-between">
            <span>Belum Bimbingan</span>
            <AlertCircle className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-orange-700 pt-1">
            {stats.emptyCount} Mahasiswa
          </div>
          <p className="text-[11px] text-orange-600 font-medium">0 sesi di kartu bimbingan</p>
        </div>

        {/* Aktif & Memenuhi Standar */}
        <div 
          onClick={() => { setActiveTab('monitoring'); setFilterSeverity('compliant'); }}
          className={`cursor-pointer bg-white border rounded-xl p-4 shadow-2xs space-y-1 transition-all hover:shadow-md ${
            filterSeverity === 'compliant' ? 'ring-2 ring-emerald-500 border-emerald-300 bg-emerald-50/20' : 'border-slate-200 hover:border-emerald-400'
          }`}
        >
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center justify-between">
            <span>Memenuhi Target</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 pt-1">
            {stats.compliantCount} Mahasiswa
          </div>
          <p className="text-[11px] text-emerald-600 font-medium">Lengkap &ge; 2x bimbingan / bulan</p>
        </div>

        {/* Total Bukti Reminder Terkirim */}
        <div 
          onClick={() => setActiveTab('history_logs')}
          className={`cursor-pointer bg-white border rounded-xl p-4 shadow-2xs space-y-1 transition-all hover:shadow-md ${
            activeTab === 'history_logs' ? 'ring-2 ring-indigo-500 border-indigo-300 bg-indigo-50/20' : 'border-slate-200 hover:border-indigo-400'
          }`}
        >
          <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center justify-between">
            <span>Bukti Pengingat</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700 pt-1">
            {stats.totalRemindersSent} Terkirim
          </div>
          <p className="text-[11px] text-indigo-600 font-medium">Terekam dalam audit trail</p>
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
              <Clock className="w-3.5 h-3.5" />
              <span>Matriks Pemantauan Cadence Bimbingan ({studentsCadence.length})</span>
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
              <span>Riwayat &amp; Bukti Pengingat Terkirim ({bimbinganReminderLogs?.length || 0})</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Batch Reminder Button */}
            <button
              type="button"
              onClick={handleBatchBroadcast}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              title="Kirimkan reminder via Gmail/Email serentak ke semua mahasiswa & dospem yang belum memenuhi target 2x bimbingan"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Reminder ({stats.needsReminderCount} Terlambat)</span>
            </button>

            {/* Print Proof Button */}
            <button
              type="button"
              onClick={() => setPrintPreviewModal({ isOpen: true })}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors border border-slate-200"
              title="Cetak lembar rekapitulasi bukti pengingat resmi prodi"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Cetak Bukti Proses</span>
            </button>

          </div>

        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'monitoring' ? "Cari nama mahasiswa, NIM, judul TA, atau pembimbing..." : "Cari riwayat email, penerima, atau subjek pengingat..."}
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

        {/* TAB 1: Matriks Pemantauan Cadence Bimbingan */}
        {activeTab === 'monitoring' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Mahasiswa &amp; NIM</th>
                  <th className="py-3 px-4 min-w-[240px]">Judul Tugas Akhir</th>
                  <th className="py-3 px-4 min-w-[190px]">Dosen Pembimbing</th>
                  <th className="py-3 px-4 text-center min-w-[150px]">Frekuensi Bulan Ini (Min. 2x)</th>
                  <th className="py-3 px-4 min-w-[170px]">Status Kepatuhan</th>
                  <th className="py-3 px-4 text-right">Aksi Pengingat Gmail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">Tidak ada mahasiswa yang cocok dengan filter</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Semua mahasiswa bimbingan telah terpantau sesuai kriteria.</p>
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
                            {s.judul}
                          </p>
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

                        {/* Cadence Count in 30 Days */}
                        <td className="py-3.5 px-4 text-center align-top">
                          <div className="inline-flex flex-col items-center">
                            <span className={`text-base font-black px-2.5 py-0.5 rounded-lg border ${
                              isCompliant 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : isCritical 
                                ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {rem.consultationsInLastMonth} / 2 Sesi
                            </span>
                            
                            <span className="text-[10px] text-slate-400 mt-1">
                              {rem.daysSinceLast !== null ? `${rem.daysSinceLast} hari lalu` : 'Belum pernah'}
                            </span>
                          </div>
                        </td>

                        {/* Status Kepatuhan */}
                        <td className="py-3.5 px-4 align-top space-y-1">
                          <div>
                            {isCritical && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                <span>Kritis (&gt;30 Hari)</span>
                              </span>
                            )}
                            {isWarning && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Peringatan (&ge;15 Hari)</span>
                              </span>
                            )}
                            {isEmpty && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-800 border border-orange-300">
                                <AlertCircle className="w-3 h-3 text-orange-600" />
                                <span>Belum Ada Sesi</span>
                              </span>
                            )}
                            {isCompliant && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                <span>Target Terpenuhi (2x)</span>
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] text-slate-500">
                            {s.remindersSentCount > 0 ? (
                              <span className="text-indigo-600 font-semibold">
                                &bull; Telah diingatkan {s.remindersSentCount}x
                              </span>
                            ) : (
                              <span>&bull; Belum pernah diingatkan</span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right align-top space-y-1">
                          <button
                            type="button"
                            onClick={() => handleOpenSendModal(s)}
                            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                              !isCompliant
                                ? 'bg-amber-600 hover:bg-amber-700 text-white ring-2 ring-amber-300'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                            title="Kirim reminder resmi via Gmail/Email kepada mahasiswa dan dosen pembimbing"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Kirim Reminder</span>
                          </button>

                          <div className="text-[10px] text-slate-400">
                            Ke: Mhs &amp; Pembimbing
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: Riwayat & Bukti Pengingat Terkirim (Audit Trail Proof) */}
        {activeTab === 'history_logs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Waktu Pengiriman</th>
                  <th className="py-3 px-4 min-w-[200px]">Mahasiswa &amp; NIM</th>
                  <th className="py-3 px-4 min-w-[180px]">Dosen Pembimbing</th>
                  <th className="py-3 px-4 min-w-[240px]">Subjek &amp; Pesan Email</th>
                  <th className="py-3 px-4 min-w-[160px]">Alamat Email Penerima</th>
                  <th className="py-3 px-4 text-right">Status Bukti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">Belum ada riwayat pengingat yang terekam</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Riwayat pengingat akan otomatis tersimpan permanen di sini sebagai bukti proses.</p>
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
                      </td>

                      {/* Mahasiswa */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 align-top">
                        <div className="text-xs font-bold text-slate-900">{log.student_nama}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{log.student_nim} ({log.student_kelas})</div>
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
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline pt-0.5"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Lihat Salinan Surat/Email Lengkap</span>
                        </button>
                      </td>

                      {/* Recipient Emails */}
                      <td className="py-3.5 px-4 align-top space-y-1 font-mono text-[10px]">
                        <div className="font-bold text-slate-700 capitalize">Target: {log.target_penerima === 'both' ? 'Mahasiswa & Pembimbing' : log.target_penerima}</div>
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
                          <span>Sah &amp; Terkirim</span>
                        </span>

                        <div className="text-[10px] text-slate-400">
                          Channel: Gmail/Email
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Modal 1: Kirim Reminder Kustom (Mahasiswa / Pembimbing / Keduanya) */}
      {sendModal.isOpen && sendModal.student && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Kirim Pengingat Pembimbingan (Min. 2x/Bulan)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Notifikasi resmi Prodi terkirim melalui Gmail/Email dan tercatat ke audit trail
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => setSendModal({ isOpen: false, student: null, target: 'both', subject: '', message: '', isSending: false })}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student & Advisors Info */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{sendModal.student.mhs_nama} ({sendModal.student.mhs_nim})</span>
                <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {sendModal.student.mhs_nim}@student.unsri.ac.id
                </span>
              </div>
              <p className="text-slate-700 italic">
                &ldquo;{sendModal.student.judul}&rdquo;
              </p>
              
              <div className="pt-1 grid grid-cols-2 gap-2 text-[11px] text-slate-600 border-t border-slate-200/60">
                <div>Dospem 1: <strong>{sendModal.student.pembimbing_1_nama || '-'}</strong></div>
                <div>Dospem 2: <strong>{sendModal.student.pembimbing_2_nama || '-'}</strong></div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitSend} className="space-y-4">
              
              {/* Target Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tujuan Pengiriman Notifikasi Gmail:
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  
                  <label className={`flex items-center justify-center p-2 rounded-lg border cursor-pointer font-bold transition-all ${
                    sendModal.target === 'both' ? 'border-indigo-600 bg-indigo-50 text-indigo-800' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}>
                    <input 
                      type="radio" 
                      name="target" 
                      checked={sendModal.target === 'both'} 
                      onChange={() => setSendModal(prev => ({ ...prev, target: 'both' }))}
                      className="sr-only"
                    />
                    <span>Keduanya (Mhs &amp; Dosen)</span>
                  </label>

                  <label className={`flex items-center justify-center p-2 rounded-lg border cursor-pointer font-bold transition-all ${
                    sendModal.target === 'mahasiswa' ? 'border-indigo-600 bg-indigo-50 text-indigo-800' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}>
                    <input 
                      type="radio" 
                      name="target" 
                      checked={sendModal.target === 'mahasiswa'} 
                      onChange={() => setSendModal(prev => ({ ...prev, target: 'mahasiswa' }))}
                      className="sr-only"
                    />
                    <span>Mahasiswa Saja</span>
                  </label>

                  <label className={`flex items-center justify-center p-2 rounded-lg border cursor-pointer font-bold transition-all ${
                    sendModal.target === 'dospem' ? 'border-indigo-600 bg-indigo-50 text-indigo-800' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}>
                    <input 
                      type="radio" 
                      name="target" 
                      checked={sendModal.target === 'dospem'} 
                      onChange={() => setSendModal(prev => ({ ...prev, target: 'dospem' }))}
                      className="sr-only"
                    />
                    <span>Dosen Pembimbing Saja</span>
                  </label>

                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subjek Email Gmail:
                </label>
                <input
                  type="text"
                  value={sendModal.subject}
                  onChange={(e) => setSendModal(prev => ({ ...prev, subject: e.target.value }))}
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 font-semibold"
                />
              </div>

              {/* Message Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Isi Surat Pengingat Resmi Prodi:
                </label>
                <textarea
                  rows={4}
                  value={sendModal.message}
                  onChange={(e) => setSendModal(prev => ({ ...prev, message: e.target.value }))}
                  required
                  className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-800 leading-relaxed"
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSendModal({ isOpen: false, student: null, target: 'both', subject: '', message: '', isSending: false })}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={sendModal.isSending}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendModal.isSending ? 'Mengirim...' : 'Kirim via Gmail/Email Sekarang'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal 2: Salinan / Preview Email Resmi Gmail (Audit Proof Detail) */}
      {testEmailModal.isOpen && testEmailModal.selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Gmail Header Simulation */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono tracking-wider uppercase text-slate-300">
                  Salinan Bukti Surat Elektronik Gmail
                </span>
              </div>
              <button 
                onClick={() => setTestEmailModal({ isOpen: false, selectedLog: null })}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              {/* Mail Header Details */}
              <div className="border-b border-slate-200 pb-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-sm">{testEmailModal.selectedLog.subjek_email}</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {new Date(testEmailModal.selectedLog.tanggal_kirim).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="text-slate-600">
                  <span className="font-semibold text-slate-800">Dari: </span>
                  {testEmailModal.selectedLog.pengirim_nama} &lt;kaprodi.mi@unsri.ac.id&gt;
                </div>

                <div className="text-slate-600">
                  <span className="font-semibold text-slate-800">Kepada: </span>
                  {testEmailModal.selectedLog.recipients_emails?.join(', ')}
                </div>
              </div>

              {/* Official Academic Letter Body */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/80 space-y-3 font-serif text-slate-800 text-xs leading-relaxed">
                <div className="text-center pb-2 border-b border-slate-300 font-sans">
                  <div className="font-bold text-slate-900 uppercase">Program Studi D3 Manajemen Informatika</div>
                  <div className="text-[10px] text-slate-500">Fakultas Ilmu Komputer - Universitas Sriwijaya</div>
                </div>

                <p>
                  Yth. Mahasiswa dan Dosen Pembimbing Tugas Akhir,
                </p>

                <p className="indent-4">
                  {testEmailModal.selectedLog.isi_pesan}
                </p>

                <div className="bg-white p-3 rounded border border-slate-200 font-sans text-[11px] space-y-1">
                  <div>Mahasiswa: <strong>{testEmailModal.selectedLog.student_nama} ({testEmailModal.selectedLog.student_nim})</strong></div>
                  <div>Judul TA: <em>&ldquo;{testEmailModal.selectedLog.judul_ta}&rdquo;</em></div>
                  <div>Status Kepatuhan: <strong>Minimal 2x Bimbingan per Bulan</strong></div>
                </div>

                <p>
                  Demikian pemberitahuan resmi ini disampaikan untuk dipatuhi demi kelancaran penyelesaian Tugas Akhir dan kelulusan tepat waktu.
                </p>

                <div className="pt-4 text-right font-sans text-xs">
                  <div>Hormat kami,</div>
                  <div className="font-bold text-slate-900 mt-6">{testEmailModal.selectedLog.pengirim_nama}</div>
                  <div className="text-[10px] text-slate-500">{testEmailModal.selectedLog.pengirim_role}</div>
                </div>
              </div>

              {/* Status footer */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Status: Terkirim &amp; Terverifikasi Sah
                </span>

                <button
                  onClick={() => setTestEmailModal({ isOpen: false, selectedLog: null })}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800"
                >
                  Tutup
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Modal 3: Lembar Cetak Bukti Proses (Official Audit Report) */}
      {printPreviewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b pb-3 print:hidden">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Cetak Lembar Rekapitulasi Bukti Pengingat Bimbingan
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintProof}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button 
                  onClick={() => setPrintPreviewModal({ isOpen: false })}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Academic Header for Audit */}
            <div className="p-6 bg-white space-y-4 text-xs font-serif leading-relaxed">
              
              <div className="text-center pb-3 border-b-2 border-slate-900 font-sans space-y-0.5">
                <div className="font-black text-sm tracking-wider uppercase text-slate-900">
                  KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI
                </div>
                <div className="font-black text-sm uppercase text-slate-900">
                  UNIVERSITAS SRIWIJAYA &bull; FAKULTAS ILMU KOMPUTER
                </div>
                <div className="font-bold text-xs text-slate-800 uppercase">
                  PROGRAM STUDI D3 MANAJEMEN INFORMATIKA
                </div>
                <div className="text-[10px] text-slate-500 font-sans">
                  Jl. Srijaya Negara, Bukit Besar, Palembang 30139 &bull; Laman: https://simta.fasilkom.unsri.ac.id
                </div>
              </div>

              <div className="text-center font-sans space-y-1 py-1">
                <div className="font-black text-xs uppercase tracking-wider underline">
                  BERITA ACARA &amp; BUKTI PROSES MONITORING PENGINGAT PEMBIMBINGAN TA
                </div>
                <div className="text-[10px] text-slate-500">
                  Kepatuhan Standar Frekuensi Bimbingan Minimal 2 Kali per Bulan
                </div>
              </div>

              <p className="font-sans text-xs text-slate-700">
                Berikut ini adalah rekapitulasi riwayat pengingat resmi yang telah dikirimkan oleh Program Studi D3 Manajemen Informatika melalui sistem SIMTA dan Gmail kepada mahasiswa dan dosen pembimbing yang bersangkutan:
              </p>

              {/* Table of Evidence */}
              <table className="w-full text-left border-collapse border border-slate-300 font-sans text-[11px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                    <th className="p-2 border border-slate-300 text-center">No</th>
                    <th className="p-2 border border-slate-300">Waktu Kirim</th>
                    <th className="p-2 border border-slate-300">Mahasiswa (NIM)</th>
                    <th className="p-2 border border-slate-300">Dosen Pembimbing</th>
                    <th className="p-2 border border-slate-300">Alamat Gmail / Email</th>
                    <th className="p-2 border border-slate-300 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(bimbinganReminderLogs || []).map((l, i) => (
                    <tr key={l.id} className="border-b border-slate-300">
                      <td className="p-2 border border-slate-300 text-center font-bold">{i + 1}</td>
                      <td className="p-2 border border-slate-300 font-mono text-[10px]">
                        {new Date(l.tanggal_kirim).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-2 border border-slate-300">
                        <div className="font-bold">{l.student_nama}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{l.student_nim}</div>
                      </td>
                      <td className="p-2 border border-slate-300 text-[10px]">
                        <div>1. {l.dospem_1_nama}</div>
                        {l.dospem_2_nama && <div>2. {l.dospem_2_nama}</div>}
                      </td>
                      <td className="p-2 border border-slate-300 text-[10px] font-mono">
                        {(l.recipients_emails || []).join('; ')}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-bold text-emerald-800">
                        Terkirim
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signature block */}
              <div className="pt-6 flex justify-end font-sans text-xs">
                <div className="text-center w-64 space-y-12">
                  <div>
                    <div>Palembang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    <div className="font-semibold text-slate-700">Ketua Program Studi D3 Manajemen Informatika</div>
                  </div>

                  <div>
                    <div className="font-bold text-slate-900 underline">Dr. Abdiansah, S.Kom., M.Cs.</div>
                    <div className="text-[10px] text-slate-500 font-mono">NIP. 197805122005011002</div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
