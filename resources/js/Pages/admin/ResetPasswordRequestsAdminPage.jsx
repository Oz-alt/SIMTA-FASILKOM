import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Head, Link, router } from '@inertiajs/react';
import { 
  KeyRound, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  UserCheck, 
  GraduationCap, 
  Eye, 
  Check, 
  Copy, 
  ExternalLink, 
  MessageSquare, 
  AlertTriangle, 
  RefreshCw, 
  FileText, 
  ChevronRight, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Calendar, 
  ArrowRight, 
  Lock,
  Plus,
  Trash2,
  AlertCircle,
  HelpCircle,
  CheckSquare,
  Share2
} from 'lucide-react';

export default function ResetPasswordRequestsAdminPage() {
  const { 
    currentUser,
    passwordResetRequests = [],
    passwordResetLogs = [],
    checkUserIdentityInDatabase,
    adminCreatePasswordResetRequest,
    approvePasswordResetRequest,
    rejectPasswordResetRequest,
    deletePasswordResetRequest,
    getAllMahasiswaAccounts,
    getAllDosenAccounts
  } = useAuth();

  // Guard: Hanya role Admin yang dapat mengakses halaman ini
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      router.visit('/login');
    }
  }, [currentUser]);

  // Tab State: 'permintaan' | 'riwayat'
  const [activeTab, setActiveTab] = useState('permintaan');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'menunggu' | 'disetujui' | 'ditolak' | 'selesai'
  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL' | 'mahasiswa' | 'dosen'

  // Modal States
  const [verifyingRequest, setVerifyingRequest] = useState(null);
  const [approvingRequest, setApprovingRequest] = useState(null);
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [sharingRequest, setSharingRequest] = useState(null);
  const [deletingRequest, setDeletingRequest] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form States for Modals
  const [approvalNote, setApprovalNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Form State for Manual Creation by Admin
  const [createForm, setCreateForm] = useState({
    identifier: '',
    alasan: 'Permintaan reset kata sandi langsung oleh pengguna ke Admin SIMTA.',
    catatanAdmin: 'Identitas diverifikasi langsung di ruangan Admin SIMTA.',
    autoApprove: true
  });
  const [createSearch, setCreateSearch] = useState('');

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Lock background scroll when modals are open
  useEffect(() => {
    const isModalOpen = Boolean(
      verifyingRequest || approvingRequest || rejectingRequest || sharingRequest || deletingRequest || isCreateOpen
    );
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [verifyingRequest, approvingRequest, rejectingRequest, sharingRequest, deletingRequest, isCreateOpen]);

  // Metrics computation
  const stats = useMemo(() => {
    const list = Array.isArray(passwordResetRequests) ? passwordResetRequests : [];
    return {
      total: list.length,
      menunggu: list.filter(r => r.status === 'menunggu').length,
      disetujui: list.filter(r => r.status === 'disetujui').length,
      ditolak: list.filter(r => r.status === 'ditolak').length,
      selesai: list.filter(r => r.status === 'selesai').length
    };
  }, [passwordResetRequests]);

  // Filtered requests list
  const filteredRequests = useMemo(() => {
    const list = Array.isArray(passwordResetRequests) ? passwordResetRequests : [];
    const query = searchQuery.toLowerCase().trim();

    return list.filter(item => {
      // Status filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;

      // Role filter
      if (roleFilter !== 'ALL' && item.role !== roleFilter) return false;

      // Query search
      if (query) {
        const nama = String(item.nama || '').toLowerCase();
        const nim = String(item.nim || '').toLowerCase();
        const nip = String(item.nip || '').toLowerCase();
        const email = String(item.email || '').toLowerCase();
        const identifier = String(item.identifier || '').toLowerCase();
        const prodi = String(item.prodi || '').toLowerCase();

        return (
          nama.includes(query) ||
          nim.includes(query) ||
          nip.includes(query) ||
          email.includes(query) ||
          identifier.includes(query) ||
          prodi.includes(query)
        );
      }

      return true;
    });
  }, [passwordResetRequests, searchQuery, statusFilter, roleFilter]);

  // Combined accounts list for manual creation dropdown
  const allAccountsForSelect = useMemo(() => {
    const mhs = typeof getAllMahasiswaAccounts === 'function' ? getAllMahasiswaAccounts() : [];
    const dsn = typeof getAllDosenAccounts === 'function' ? getAllDosenAccounts() : [];
    return [
      ...mhs.map(s => ({ ...s, role: 'mahasiswa', key: s.nim || s.id })),
      ...dsn.map(d => ({ ...d, role: d.role || 'dosen', key: d.nip || d.id }))
    ];
  }, [getAllMahasiswaAccounts, getAllDosenAccounts]);

  const filteredAccountOptions = useMemo(() => {
    if (!createSearch.trim()) return allAccountsForSelect.slice(0, 15);
    const q = createSearch.toLowerCase().trim();
    return allAccountsForSelect.filter(a =>
      String(a.nama || '').toLowerCase().includes(q) ||
      String(a.nim || '').toLowerCase().includes(q) ||
      String(a.nip || '').toLowerCase().includes(q) ||
      String(a.email || '').toLowerCase().includes(q)
    ).slice(0, 20);
  }, [allAccountsForSelect, createSearch]);

  // Handle Approve action
  const handleApprove = () => {
    if (!approvingRequest) return;
    const res = approvePasswordResetRequest(approvingRequest.id, approvalNote.trim());
    setApprovingRequest(null);
    setApprovalNote('');
    if (res) {
      showToast(`Permintaan reset kata sandi untuk ${res.nama} berhasil disetujui.`);
      setSharingRequest(res);
    }
  };

  // Handle Reject action
  const handleReject = () => {
    if (!rejectingRequest) return;
    if (!rejectionReason.trim()) {
      alert('Silakan masukkan alasan penolakan permintaan.');
      return;
    }
    const res = rejectPasswordResetRequest(rejectingRequest.id, rejectionReason.trim());
    setRejectingRequest(null);
    setRejectionReason('');
    if (res) {
      showToast(`Permintaan reset kata sandi untuk ${res.nama} telah ditolak.`);
    }
  };

  // Handle Create Manual Request
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.identifier) {
      alert('Pilih pengguna yang akan direset kata sandinya.');
      return;
    }

    try {
      const res = await adminCreatePasswordResetRequest({
        identifier: createForm.identifier,
        alasan: createForm.alasan,
        catatanAdmin: createForm.catatanAdmin,
        autoApprove: createForm.autoApprove
      });
      setIsCreateOpen(false);
      setCreateForm({
        identifier: '',
        alasan: 'Permintaan reset kata sandi langsung oleh pengguna ke Admin SIMTA.',
        catatanAdmin: 'Identitas diverifikasi langsung di ruangan Admin SIMTA.',
        autoApprove: true
      });
      showToast(`Permintaan reset kata sandi untuk ${res.nama} berhasil dibuat.`);
      if (res.status === 'disetujui') {
        setSharingRequest(res);
      }
    } catch (err) {
      alert(err.message || 'Gagal membuat permintaan reset kata sandi.');
    }
  };

  // Copy helper
  const handleCopy = (text, type = 'link') => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      } else {
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2500);
      }
    }
  };

  // Generate WhatsApp message link
  const getWhatsAppShareUrl = (req) => {
    if (!req) return '';
    const phone = String(req.no_hp || '').replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.substring(1) : phone;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = req.reset_link || `${origin}/reset-password?token=${req.token}&email=${encodeURIComponent(req.email)}`;
    const msg = `Halo ${req.nama}, permintaan reset kata sandi akun SIMONITA FASILKOM Anda telah disetujui oleh Admin SIMTA. Silakan klik tautan berikut untuk membuat kata sandi baru (berlaku 24 jam):\n\n${link}\n\nToken Verifikasi: ${req.token}\n\nJika Anda tidak merasa mengajukan ini, segera laporkan ke Admin SIMTA.`;
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
  };

  // Status Badge Component
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'menunggu':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
            <span>Menunggu</span>
          </span>
        );
      case 'disetujui':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            <span>Disetujui (Tautan Aktif)</span>
          </span>
        );
      case 'selesai':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckSquare className="w-3 h-3 text-emerald-600" />
            <span>Selesai Direset</span>
          </span>
        );
      case 'ditolak':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Ditolak</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 select-none font-sans">
      <Head title="Permintaan Reset Password - Admin SIMTA" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold backdrop-blur-sm border border-indigo-400/20">
              <KeyRound className="w-3.5 h-3.5 text-amber-300" />
              <span>Protokol Keamanan Akun &amp; Pemulihan Sandi SIMTA</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Manajemen Permintaan Reset Password
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed font-normal">
              Pusat verifikasi identitas resmi dan pengelolaan izin reset kata sandi Mahasiswa dan Dosen SIMTA Fakultas Ilmu Komputer UNSRI.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-950/40 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Permintaan Manual</span>
            </button>
          </div>
        </div>
      </div>

      {/* SMTP Email Configuration Status Notice (Ketentuan #9) */}
      <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 flex items-center space-x-2">
              <span>Status Pengiriman Email Otomatis:</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[10px]">
                Mode Lokal (SMTP Belum Terkonfigurasi)
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Sistem tidak mengirim email palsu. Saat permintaan disetujui, Admin dapat menyalin tautan reset resmi atau mengirimkannya secara langsung melalui kontak WhatsApp terdaftar.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center space-x-1.5 self-end sm:self-auto">
          <span className="text-[10px] font-semibold text-amber-900 bg-white/80 px-2.5 py-1 rounded-lg border border-amber-200">
            Tautan Berlaku 24 Jam
          </span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Permintaan */}
        <div 
          onClick={() => { setActiveTab('permintaan'); setStatusFilter('ALL'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            statusFilter === 'ALL' && activeTab === 'permintaan' 
              ? 'border-indigo-400 shadow-md ring-2 ring-indigo-100' 
              : 'border-slate-200 shadow-2xs hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Permintaan</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Semua pengajuan</p>
        </div>

        {/* Menunggu Persetujuan */}
        <div 
          onClick={() => { setActiveTab('permintaan'); setStatusFilter('menunggu'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            statusFilter === 'menunggu' && activeTab === 'permintaan' 
              ? 'border-amber-400 shadow-md ring-2 ring-amber-100' 
              : 'border-slate-200 shadow-2xs hover:border-amber-200'
          }`}
        >
          <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center space-x-1">
            <span>Menunggu</span>
            {stats.menunggu > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />}
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{stats.menunggu}</div>
          <p className="text-[10px] text-amber-700/80 mt-0.5 font-semibold">Perlu diverifikasi Admin</p>
        </div>

        {/* Disetujui (Tautan Aktif) */}
        <div 
          onClick={() => { setActiveTab('permintaan'); setStatusFilter('disetujui'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            statusFilter === 'disetujui' && activeTab === 'permintaan' 
              ? 'border-blue-400 shadow-md ring-2 ring-blue-100' 
              : 'border-slate-200 shadow-2xs hover:border-blue-200'
          }`}
        >
          <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Disetujui</div>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">{stats.disetujui}</div>
          <p className="text-[10px] text-blue-700/80 mt-0.5">Tautan reset aktif</p>
        </div>

        {/* Selesai Direset */}
        <div 
          onClick={() => { setActiveTab('permintaan'); setStatusFilter('selesai'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            statusFilter === 'selesai' && activeTab === 'permintaan' 
              ? 'border-emerald-400 shadow-md ring-2 ring-emerald-100' 
              : 'border-slate-200 shadow-2xs hover:border-emerald-200'
          }`}
        >
          <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Selesai</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.selesai}</div>
          <p className="text-[10px] text-emerald-700/80 mt-0.5">Kata sandi diperbarui</p>
        </div>

        {/* Ditolak */}
        <div 
          onClick={() => { setActiveTab('permintaan'); setStatusFilter('ditolak'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            statusFilter === 'ditolak' && activeTab === 'permintaan' 
              ? 'border-rose-400 shadow-md ring-2 ring-rose-100' 
              : 'border-slate-200 shadow-2xs hover:border-rose-200'
          }`}
        >
          <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Ditolak</div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">{stats.ditolak}</div>
          <p className="text-[10px] text-rose-700/80 mt-0.5">Tidak lolos verifikasi</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="border-b border-slate-200 px-5 pt-4 pb-0 flex items-center justify-between flex-wrap gap-3 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('permintaan')}
              className={`pb-3.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'permintaan'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Daftar Permintaan Reset</span>
              {stats.menunggu > 0 && (
                <span className="ml-1.5 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold">
                  {stats.menunggu}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('riwayat')}
              className={`pb-3.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'riwayat'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Riwayat Aktivitas (Log)</span>
              <span className="ml-1.5 px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-extrabold">
                {passwordResetLogs.length}
              </span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 pb-3 font-medium">
            Administrator: <span className="font-bold text-slate-700">Rina Agustina, S.Kom.</span>
          </div>
        </div>

        {/* Tab 1: Daftar Permintaan */}
        {activeTab === 'permintaan' && (
          <div className="p-5 space-y-4">
            {/* Search and Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari berdasarkan NIM, NIP, Nama, atau Email..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs text-slate-900 transition-all outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-700 font-semibold focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none bg-white cursor-pointer"
                >
                  <option value="ALL">Semua Role</option>
                  <option value="mahasiswa">Mahasiswa</option>
                  <option value="dosen">Dosen</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-700 font-semibold focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none bg-white cursor-pointer"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="menunggu">Menunggu</option>
                  <option value="disetujui">Disetujui</option>
                  <option value="selesai">Selesai</option>
                  <option value="ditolak">Ditolak</option>
                </select>

                {(searchQuery || statusFilter !== 'ALL' || roleFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setRoleFilter('ALL'); }}
                    className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Pemohon</th>
                    <th className="py-3 px-4">Kontak &amp; Program Studi</th>
                    <th className="py-3 px-4">Waktu Pengajuan</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi &amp; Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-16 text-center">
                        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                          <KeyRound className="w-7 h-7 text-slate-400" />
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-700">
                          {searchQuery || statusFilter !== 'ALL' || roleFilter !== 'ALL'
                            ? 'Tidak Ada Permintaan yang Cocok'
                            : 'Belum Ada Permintaan Reset Password'}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                          {searchQuery || statusFilter !== 'ALL' || roleFilter !== 'ALL'
                            ? 'Silakan sesuaikan kata kunci pencarian atau bersihkan filter di atas.'
                            : 'Saat ini belum ada pengajuan pemulihan kata sandi yang masuk dari Mahasiswa maupun Dosen SIMTA.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map(req => {
                      const officialCheck = checkUserIdentityInDatabase(req.identifier || req.nim || req.nip || req.email);
                      const officialUser = officialCheck.user;
                      const displayName = (officialCheck.found && officialUser?.nama) ? officialUser.nama : req.nama;
                      const isRowValid = officialCheck.found && officialCheck.status === 'valid';
                      const isRowInactive = officialCheck.found && officialCheck.status === 'inactive';
                      const isRowNotFound = !officialCheck.found;
                      const isMahasiswa = (officialUser?.role || req.role) === 'mahasiswa';

                      return (
                        <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Pemohon */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                isMahasiswa 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-purple-100 text-purple-700'
                              }`}>
                                {isMahasiswa ? <GraduationCap className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate flex items-center space-x-1.5">
                                  <span>{displayName}</span>
                                  <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                    isMahasiswa ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                                  }`}>
                                    {isMahasiswa ? 'Mahasiswa' : 'Dosen'}
                                  </span>

                                  {isRowValid && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-0.5" title="Identitas terdaftar resmi di database">
                                      <Check className="w-2.5 h-2.5 inline" />
                                      <span>Terverifikasi</span>
                                    </span>
                                  )}
                                  {isRowInactive && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200" title="Akun berstatus non-aktif">
                                      Non-Aktif
                                    </span>
                                  )}
                                  {isRowNotFound && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200" title="Akun tidak ditemukan di database">
                                      Tidak Terdaftar
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                  {isMahasiswa ? `NIM: ${req.nim || req.identifier}` : `NIP: ${req.nip || req.identifier}`}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Kontak & Prodi */}
                          <td className="py-3.5 px-4 text-slate-600">
                            <div className="truncate font-medium">{officialUser?.email || req.email}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-1.5">
                              <span>{officialUser?.prodi || req.prodi || 'D3 Manajemen Informatika'}</span>
                              <span>•</span>
                              <span>{officialUser?.kelas || req.kelas || '-'}</span>
                            </div>
                          </td>

                          {/* Waktu & Alasan */}
                          <td className="py-3.5 px-4">
                            <div className="text-slate-800 font-medium">
                              {req.created_at ? new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs" title={req.alasan_pengajuan}>
                              {req.alasan_pengajuan || 'Lupa kata sandi'}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {renderStatusBadge(req.status)}
                            {req.processed_by && (
                              <div className="text-[10px] text-slate-400 mt-1">
                                Oleh: {req.processed_by}
                              </div>
                            )}
                          </td>

                          {/* Aksi & Verifikasi */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center space-x-1.5 justify-end">
                              {/* 1. Tombol Periksa Identitas (Ketentuan #3) */}
                              <button
                                type="button"
                                onClick={() => setVerifyingRequest(req)}
                                className="p-2 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-600 transition-colors cursor-pointer"
                                title="Periksa Identitas di Basis Data Resmi"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* 2. Tombol Setujui (Jika status Menunggu) */}
                              {req.status === 'menunggu' && (
                                <>
                                  <button
                                    type="button"
                                    disabled={!isRowValid}
                                    onClick={() => {
                                      if (!isRowValid) return;
                                      setApprovingRequest(req);
                                    }}
                                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center space-x-1 ${
                                      isRowValid
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                    }`}
                                    title={
                                      isRowValid
                                        ? "Setujui Permintaan"
                                        : isRowNotFound
                                        ? "Persetujuan dinonaktifkan: Akun tidak ditemukan di database"
                                        : "Persetujuan dinonaktifkan: Status akun non-aktif"
                                    }
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Setujui</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setRejectingRequest(req)}
                                    className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer"
                                    title="Tolak Permintaan"
                                  >
                                    Tolak
                                  </button>
                                </>
                              )}

                              {/* 3. Tombol Salin Tautan (Jika status Disetujui) */}
                              {req.status === 'disetujui' && (
                                <button
                                  type="button"
                                  onClick={() => setSharingRequest(req)}
                                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center space-x-1"
                                  title="Lihat & Bagikan Tautan Reset"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                  <span>Bagikan Tautan</span>
                                </button>
                              )}

                              {/* 4. Tombol Hapus (Untuk membersihkan pengajuan lama) */}
                              <button
                                type="button"
                                onClick={() => setDeletingRequest(req)}
                                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Hapus Pengajuan"
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
          </div>
        )}

        {/* Tab 2: Riwayat Aktivitas (Log) (Ketentuan #8) */}
        {activeTab === 'riwayat' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Audit Trail &amp; Catatan Aktivitas Reset Password</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Tercatat {passwordResetLogs.length} kejadian aktivitas
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Waktu Kejadian</th>
                    <th className="py-3 px-4">Pengguna Akun</th>
                    <th className="py-3 px-4">Tindakan / Aksi</th>
                    <th className="py-3 px-4">Pelaksana (Aktor)</th>
                    <th className="py-3 px-4">Keterangan &amp; Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {passwordResetLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-16 text-center">
                        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                          <Clock className="w-7 h-7 text-slate-400" />
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-700">Belum Ada Riwayat Aktivitas</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                          Seluruh jejak audit pengajuan, persetujuan, penolakan, dan pembaruan kata sandi oleh pengguna dan Admin akan tercatat secara otomatis di sini.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    passwordResetLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                          {log.created_at ? new Date(log.created_at).toLocaleString('id-ID', { 
                            day: 'numeric', month: 'short', year: 'numeric', 
                            hour: '2-digit', minute: '2-digit', second: '2-digit' 
                          }) : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{log.user_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{log.user_identifier}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] inline-block uppercase ${
                            log.action === 'disetujui' ? 'bg-blue-100 text-blue-800' :
                            log.action === 'ditolak' ? 'bg-rose-100 text-rose-800' :
                            log.action === 'selesai' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {log.action_label || log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {log.actor}
                        </td>
                        <td className="py-3 px-4 text-slate-600 leading-relaxed">
                          {log.notes || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL 1: PERIKSA IDENTITAS PENGGUNA TERHADAP BASIS DATA (Ketentuan #2 & #3) ── */}
      {verifyingRequest && (() => {
        const checkResult = checkUserIdentityInDatabase(verifyingRequest.identifier || verifyingRequest.nim || verifyingRequest.nip || verifyingRequest.email);
        const dbUser = checkResult.user;
        const isFound = Boolean(checkResult.found && dbUser);
        const isStatusActive = isFound && (dbUser.status || 'aktif').toLowerCase() === 'aktif';
        const hasConflict = isFound && !isStatusActive;
        const verificationState = !isFound ? 'not_found' : (hasConflict ? 'conflict' : 'valid');

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden space-y-4 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    verificationState === 'valid' ? 'bg-emerald-100 text-emerald-700' :
                    verificationState === 'conflict' ? 'bg-amber-100 text-amber-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Verifikasi Identitas Akun</h3>
                    <p className="text-xs text-slate-500">Pemeriksaan identitas resmi pada basis data akun SIMTA UNSRI</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVerifyingRequest(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* Hasil Verifikasi Banner */}
                {verificationState === 'valid' && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start space-x-3 text-emerald-950 text-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-sm text-emerald-900 block">Identitas Terverifikasi (Akun Valid &amp; Aktif)</span>
                      <span className="text-emerald-800 leading-relaxed block">
                        Akun ditemukan pada <strong>{checkResult.source}</strong>. Data identitas resmi cocok dan berstatus aktif. Permintaan reset kata sandi aman untuk disetujui.
                      </span>
                    </div>
                  </div>
                )}

                {verificationState === 'conflict' && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-3 text-amber-950 text-xs">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-sm text-amber-900 block">Perhatian: Status Akun Non-Aktif / Perlu Pemeriksaan</span>
                      <span className="text-amber-800 leading-relaxed block">
                        Data akun ditemukan di database namun berstatus <strong>{dbUser.status || 'Non-Aktif'}</strong>. Mohon periksa kembali status keaktifan akun pengguna sebelum memberikan persetujuan.
                      </span>
                    </div>
                  </div>
                )}

                {verificationState === 'not_found' && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-950 text-xs">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-sm text-rose-900 block">Akun Tidak Ditemukan di Basis Data</span>
                      <span className="text-rose-800 leading-relaxed block">
                        NIM/NIP atau identitas <code className="font-bold text-rose-950 bg-rose-100/60 px-1 py-0.5 rounded">{verifyingRequest.identifier}</code> tidak terdaftar dalam basis data resmi Mahasiswa, Dosen, maupun Pengguna SIMTA UNSRI. Tombol persetujuan dinonaktifkan demi keamanan.
                      </span>
                    </div>
                  </div>
                )}

                {/* SATU IDENTITAS RESMI AKUN (Ketentuan #2: Tampilkan hanya satu identitas resmi dari database) */}
                {isFound ? (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    {/* Header Banner Kartu Identitas Resmi */}
                    <div className="bg-gradient-to-r from-slate-50 to-indigo-50/50 p-4 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
                          {dbUser.nama ? dbUser.nama.substring(0, 2).toUpperCase() : 'US'}
                        </div>
                        <div>
                          <div className="font-extrabold text-sm text-slate-900">{dbUser.nama}</div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {dbUser.role === 'dosen' ? `NIP: ${dbUser.nip || dbUser.nim}` : `NIM: ${dbUser.nim || dbUser.nip || dbUser.identifier}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                          {dbUser.role || 'Pengguna'}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isStatusActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {dbUser.status || 'Aktif'}
                        </span>
                      </div>
                    </div>

                    {/* Rincian Data Akun Resmi */}
                    <div className="p-4 space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nama Resmi (Database):</span>
                          <span className="font-extrabold text-slate-900 text-xs mt-0.5 block">{dbUser.nama}</span>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">NIM / NIP Resmi:</span>
                          <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">
                            {dbUser.nim || dbUser.nip || dbUser.identifier}
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Email Resmi Terdaftar:</span>
                          <span className="font-semibold text-slate-800 text-xs mt-0.5 block truncate" title={dbUser.email}>
                            {dbUser.email || '-'}
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Role / Jabatan:</span>
                          <span className="font-semibold text-slate-800 text-xs mt-0.5 block capitalize">
                            {dbUser.role} {dbUser.jabatan_fungsional ? `(${dbUser.jabatan_fungsional})` : ''}
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Program Studi:</span>
                          <span className="font-medium text-slate-700 text-xs mt-0.5 block">
                            {dbUser.prodi || 'D3 Manajemen Informatika'}
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Kelas / Kontak Resmi:</span>
                          <span className="font-medium text-slate-700 text-xs mt-0.5 block">
                            {dbUser.kelas || dbUser.no_hp || '-'}
                          </span>
                        </div>
                      </div>

                      {/* Alasan Pengajuan & Waktu Pengajuan */}
                      <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-amber-900 font-bold uppercase tracking-wider">Alasan Pengajuan Reset:</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {verifyingRequest.created_at ? new Date(verifyingRequest.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 italic">
                          "{verifyingRequest.alasan_pengajuan || 'Lupa kata sandi akun SIMONITA.'}"
                        </p>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                        <span>Basis Data: <strong className="text-slate-600">{checkResult.source}</strong></span>
                        <span>ID Pengajuan: <code className="font-mono text-slate-500">{verifyingRequest.id}</code></span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 border border-rose-200 rounded-2xl bg-rose-50/30 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">Data Identitas Tidak Terdaftar</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                        Identitas yang dimasukkan pemohon (<span className="font-mono font-bold text-slate-700">{verifyingRequest.identifier}</span>) tidak ditemukan di database resmi SIMTA. Pastikan pemohon memasukkan nomor induk resmi yang terdaftar.
                      </p>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Waktu Pengajuan: {verifyingRequest.created_at ? new Date(verifyingRequest.created_at).toLocaleString('id-ID') : '-'}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setVerifyingRequest(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Tutup
                </button>

                <div className="flex items-center space-x-2">
                  {/* Tombol Tolak: Selalu bisa digunakan untuk menolak pengajuan tidak valid */}
                  {verifyingRequest.status === 'menunggu' && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = verifyingRequest;
                        setVerifyingRequest(null);
                        setRejectingRequest(target);
                      }}
                      className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Tolak Pengajuan</span>
                    </button>
                  )}

                  {/* Tombol Setujui: HANYA AKTIF JIKA verificationState === 'valid' */}
                  {verifyingRequest.status === 'menunggu' && (
                    <button
                      type="button"
                      disabled={verificationState !== 'valid'}
                      onClick={() => {
                        if (verificationState !== 'valid') return;
                        const target = verifyingRequest;
                        setVerifyingRequest(null);
                        setApprovingRequest(target);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-sm ${
                        verificationState === 'valid'
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                      }`}
                      title={
                        verificationState === 'valid'
                          ? 'Setujui Permintaan Reset Kata Sandi'
                          : verificationState === 'not_found'
                          ? 'Persetujuan dinonaktifkan: Akun tidak ditemukan di database'
                          : 'Persetujuan dinonaktifkan: Status akun non-aktif'
                      }
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Setujui Permintaan</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL 2: SETUJUI PERMINTAAN RESET PASSWORD (Ketentuan #4 & #5) ── */}
      {approvingRequest && (() => {
        const official = checkUserIdentityInDatabase(approvingRequest.identifier || approvingRequest.nim || approvingRequest.nip || approvingRequest.email);
        const displayName = (official.found && official.user?.nama) ? official.user.nama : approvingRequest.nama;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden space-y-4">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Setujui Permintaan Reset Kata Sandi</h3>
                    <p className="text-xs text-slate-500">{displayName} ({approvingRequest.nim || approvingRequest.nip || approvingRequest.identifier})</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setApprovingRequest(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Anda akan menyetujui pemulihan kata sandi untuk akun <span className="font-bold text-slate-900">{displayName}</span>. Sistem akan menghasilkan tautan reset resmi dengan token verifikasi unik yang aktif selama 24 jam.
                </p>

                {/* Informative SMTP note (Ketentuan #9) */}
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Informasi Konfigurasi Email:</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Karena SMTP email saat ini belum dikonfigurasi aktif, tautan reset akan langsung disediakan pada dialog berikutnya agar Admin dapat menyalin dan memberikannya kepada pemohon.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    Catatan Verifikasi Admin (Opsional):
                  </label>
                  <textarea
                    rows="3"
                    value={approvalNote}
                    onChange={(e) => setApprovalNote(e.target.value)}
                    placeholder="Contoh: Identitas KTM/KTP telah diverifikasi langsung oleh Admin SIMTA."
                    className="w-full p-3 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setApprovingRequest(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Konfirmasi &amp; Setujui</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL 3: TOLAK PERMINTAAN RESET PASSWORD (Ketentuan #4) ── */}
      {rejectingRequest && (() => {
        const official = checkUserIdentityInDatabase(rejectingRequest.identifier || rejectingRequest.nim || rejectingRequest.nip || rejectingRequest.email);
        const displayName = (official.found && official.user?.nama) ? official.user.nama : rejectingRequest.nama;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden space-y-4">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Tolak Permintaan Reset Kata Sandi</h3>
                    <p className="text-xs text-slate-500">{displayName} ({rejectingRequest.nim || rejectingRequest.nip || rejectingRequest.identifier})</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRejectingRequest(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-3 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Anda akan menolak pengajuan pemulihan kata sandi untuk <span className="font-bold text-slate-900">{displayName}</span>. Masukkan alasan penolakan agar tercatat dalam riwayat audit.
                </p>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    Alasan Penolakan <span className="text-rose-500">*</span>:
                  </label>
                  <textarea
                    rows="3"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Contoh: Identitas pemohon tidak sesuai dengan data resmi mahasiswa UNSRI atau nomor HP tidak dapat dihubungi."
                    className="w-full p-3 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRejectingRequest(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shadow-sm"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Konfirmasi Tolak</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL 4: BAGIKAN / SALIN TAUTAN RESET RESMI (Ketentuan #5) ── */}
      {sharingRequest && (() => {
        const official = checkUserIdentityInDatabase(sharingRequest.identifier || sharingRequest.nim || sharingRequest.nip || sharingRequest.email);
        const displayName = (official.found && official.user?.nama) ? official.user.nama : sharingRequest.nama;
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const fullLink = sharingRequest.reset_link || `${origin}/reset-password?token=${sharingRequest.token}&email=${encodeURIComponent(sharingRequest.email)}`;
        const waUrl = getWhatsAppShareUrl({ ...sharingRequest, nama: displayName });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden space-y-4">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Tautan Reset Password Aktif</h3>
                    <p className="text-xs text-slate-500">Berikan tautan ini langsung kepada {displayName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSharingRequest(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <span className="font-bold block flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Permintaan Disetujui &amp; Tautan Siap Digunakan</span>
                  </span>
                  <p className="text-[11px] text-emerald-800">
                    Tautan reset ini aman dan terikat secara spesifik ke akun <span className="font-bold">{displayName}</span> ({sharingRequest.email}). Tautan kedaluwarsa dalam 24 jam.
                  </p>
                </div>

                {/* Tautan Reset Box */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Tautan Reset Password Resmi:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={fullLink}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-mono text-[11px] text-slate-800 select-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(fullLink, 'link')}
                      className={`px-3 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer shrink-0 flex items-center space-x-1 ${
                        copiedLink ? 'bg-emerald-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedLink ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                {/* Token Verifikasi Box */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Token Verifikasi:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={sharingRequest.token || '-'}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-mono text-xs font-bold text-slate-900 select-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(sharingRequest.token || '', 'token')}
                      className={`px-3 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer shrink-0 flex items-center space-x-1 ${
                        copiedToken ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      {copiedToken ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedToken ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                {/* WhatsApp Direct Share Button */}
                {sharingRequest.no_hp && sharingRequest.no_hp !== '-' && (
                  <div className="pt-2">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-2 shadow-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Kirim Tautan via WhatsApp ({sharingRequest.no_hp})</span>
                    </a>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <a
                  href={fullLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                >
                  <span>Buka Halaman Reset</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => setSharingRequest(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL 5: BUAT PERMINTAAN RESET MANUAL OLEH ADMIN ── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden space-y-4">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Buat Permintaan Reset Manual</h3>
                  <p className="text-xs text-slate-500">Bantu pengguna yang melapor langsung ke ruangan Admin SIMTA</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs">
              {/* User Selector with Search */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Pilih Mahasiswa atau Dosen <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  value={createSearch}
                  onChange={(e) => setCreateSearch(e.target.value)}
                  placeholder="Cari nama atau NIM / NIP..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs mb-1.5 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100"
                />
                <select
                  value={createForm.identifier}
                  onChange={(e) => setCreateForm({ ...createForm, identifier: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium bg-white outline-none focus:border-indigo-600"
                  required
                >
                  <option value="">-- Pilih Akun Terdaftar --</option>
                  {filteredAccountOptions.map(acc => (
                    <option key={acc.key} value={acc.nim || acc.nip || acc.id}>
                      [{acc.role === 'mahasiswa' ? 'MHS' : 'DOSEN'}] {acc.nama} ({acc.nim || acc.nip}) - {acc.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Alasan */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Alasan Pengajuan / Laporan:</label>
                <input
                  type="text"
                  value={createForm.alasan}
                  onChange={(e) => setCreateForm({ ...createForm, alasan: e.target.value })}
                  placeholder="Contoh: Pengguna lupa kata sandi lama dan melapor langsung ke Admin"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-indigo-600"
                />
              </div>

              {/* Checkbox Auto-Approve */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={createForm.autoApprove}
                    onChange={(e) => setCreateForm({ ...createForm, autoApprove: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>Langsung Setujui &amp; Buat Tautan Reset</span>
                </label>
                <p className="text-[11px] text-slate-500 pl-6">
                  Jika dicentang, token reset resmi akan langsung dibuat dan Admin dapat segera menyalin tautan reset untuk pengguna.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Permintaan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 6: KONFIRMASI HAPUS PENGAJUAN ── */}
      {/* ── MODAL 5: KONFIRMASI HAPUS PERMINTAAN ── */}
      {deletingRequest && (() => {
        const official = checkUserIdentityInDatabase(deletingRequest.identifier || deletingRequest.nim || deletingRequest.nip || deletingRequest.email);
        const displayName = (official.found && official.user?.nama) ? official.user.nama : deletingRequest.nama;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 p-5 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-slate-900">Hapus Catatan Pengajuan?</h3>
                <p className="text-xs text-slate-500">
                  Catatan pengajuan untuk <span className="font-bold text-slate-800">{displayName}</span> akan dihapus dari antrean Admin.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingRequest(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deletePasswordResetRequest(deletingRequest.id);
                    setDeletingRequest(null);
                    showToast('Pengajuan reset kata sandi berhasil dihapus.');
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}

