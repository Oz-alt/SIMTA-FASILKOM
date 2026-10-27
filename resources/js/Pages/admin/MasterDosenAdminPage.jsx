import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  UserCheck, 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  CheckCircle2, 
  Mail, 
  Phone, 
  BookOpen, 
  Users, 
  ShieldCheck, 
  AlertTriangle, 
  Download, 
  Eye, 
  ChevronDown, 
  Building2, 
  Tag, 
  Award,
  Sparkles,
  Layers,
  GraduationCap,
  UserX,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import ModalImportMasterData from '../../Components/common/ModalImportMasterData.jsx';

export default function MasterDosenAdminPage() {
  const { 
    getAllDosenAccounts, 
    addDosenAccount, 
    batchImportDosen,
    updateDosenAccount, 
    deleteDosenAccount,
    advisors = [],
    thesisTitles = []
  } = useAuth();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [jabatanFilter, setJabatanFilter] = useState('ALL');
  const [prodiFilter, setProdiFilter] = useState('ALL');

  // Modal States
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDosen, setEditingDosen] = useState(null);
  const [viewingDosen, setViewingDosen] = useState(null);
  const [statusManagingDosen, setStatusManagingDosen] = useState(null);
  const [deletingDosen, setDeletingDosen] = useState(null);

  // Form State for Add / Edit
  const [dosenForm, setDosenForm] = useState({
    nip: '',
    nama: '',
    email: '',
    no_hp: '',
    prodi: 'D3 Manajemen Informatika',
    jabatan_fungsional: 'Asisten Ahli',
    keahlian: '',
    kuota_dospem1: 8,
    kuota_dospem2: 8,
    status: 'aktif'
  });

  // Quick Status change selection
  const [targetStatus, setTargetStatus] = useState('aktif');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Lock background scroll when modal is open
  useEffect(() => {
    const isModalOpen = Boolean(isImportOpen || isAddOpen || editingDosen || viewingDosen || statusManagingDosen || deletingDosen);
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isImportOpen, isAddOpen, editingDosen, viewingDosen, statusManagingDosen, deletingDosen]);

  // Master Dosen Dataset
  const rawDosenList = useMemo(() => {
    return getAllDosenAccounts ? getAllDosenAccounts() : advisors;
  }, [getAllDosenAccounts, advisors]);

  // Dynamic filter lists
  const availableJabatan = useMemo(() => {
    const jab = new Set(rawDosenList.map(d => d.jabatan_fungsional).filter(Boolean));
    return ['ALL', ...Array.from(jab).sort()];
  }, [rawDosenList]);

  const availableProdis = useMemo(() => {
    const prodis = new Set(rawDosenList.map(d => d.prodi).filter(Boolean));
    return ['ALL', ...Array.from(prodis).sort()];
  }, [rawDosenList]);

  // Filtered Dosen List
  const filteredDosen = useMemo(() => {
    return rawDosenList.filter(adv => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        (adv.nip && String(adv.nip).toLowerCase().includes(q)) ||
        (adv.nama && adv.nama.toLowerCase().includes(q)) ||
        (adv.email && adv.email.toLowerCase().includes(q)) ||
        (adv.jabatan_fungsional && adv.jabatan_fungsional.toLowerCase().includes(q)) ||
        (Array.isArray(adv.keahlian) && adv.keahlian.some(k => k.toLowerCase().includes(q))) ||
        (typeof adv.keahlian === 'string' && adv.keahlian.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'ALL' || (adv.status || 'aktif').toLowerCase() === statusFilter.toLowerCase();
      const matchJabatan = jabatanFilter === 'ALL' || adv.jabatan_fungsional === jabatanFilter;
      const matchProdi = prodiFilter === 'ALL' || adv.prodi === prodiFilter;

      return matchQuery && matchStatus && matchJabatan && matchProdi;
    });
  }, [rawDosenList, searchQuery, statusFilter, jabatanFilter, prodiFilter]);

  // Statistics Summary
  const totalDosen = rawDosenList.length;
  const totalAktif = rawDosenList.filter(d => (d.status || 'aktif') === 'aktif').length;
  const totalTugasBelajar = rawDosenList.filter(d => d.status === 'tugas_belajar' || d.status === 'cuti').length;
  const totalKuotaUtama = rawDosenList.reduce((acc, curr) => acc + (Number(curr.kuota_dospem1) || 8), 0);

  // Open Add Modal
  const handleOpenAdd = () => {
    setDosenForm({
      nip: '',
      nama: '',
      email: '',
      no_hp: '',
      prodi: 'D3 Manajemen Informatika',
      jabatan_fungsional: 'Asisten Ahli',
      keahlian: '',
      kuota_dospem1: 8,
      kuota_dospem2: 8,
      status: 'aktif'
    });
    setIsAddOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (dosen) => {
    setEditingDosen(dosen);
    setDosenForm({
      nip: dosen.nip || '',
      nama: dosen.nama || '',
      email: dosen.email || '',
      no_hp: dosen.no_hp || '',
      prodi: dosen.prodi || 'D3 Manajemen Informatika',
      jabatan_fungsional: dosen.jabatan_fungsional || 'Asisten Ahli',
      keahlian: Array.isArray(dosen.keahlian) ? dosen.keahlian.join(', ') : (dosen.keahlian || ''),
      kuota_dospem1: dosen.kuota_dospem1 || 8,
      kuota_dospem2: dosen.kuota_dospem2 || 8,
      status: dosen.status || 'aktif'
    });
  };

  // Open Status Management Modal
  const handleOpenStatusModal = (dosen) => {
    setStatusManagingDosen(dosen);
    setTargetStatus(dosen.status || 'aktif');
  };

  // Save Dosen (Add / Edit)
  const handleSaveDosen = async (e) => {
    e.preventDefault();
    if (!dosenForm.nip || !dosenForm.nama) {
      showToast('NIP dan Nama Dosen wajib diisi!');
      return;
    }

    const emailToUse = dosenForm.email?.trim() || `${dosenForm.nip.trim()}@unsri.ac.id`;
    const keahlianArray = typeof dosenForm.keahlian === 'string'
      ? dosenForm.keahlian.split(',').map(s => s.trim()).filter(Boolean)
      : dosenForm.keahlian;

    const payload = {
      ...dosenForm,
      email: emailToUse,
      keahlian: keahlianArray,
      kuota_dospem1: Number(dosenForm.kuota_dospem1) || 8,
      kuota_dospem2: Number(dosenForm.kuota_dospem2) || 8
    };

    if (editingDosen) {
      await updateDosenAccount(editingDosen.id || editingDosen.nip, payload);
      showToast(`Data master dosen ${dosenForm.nama} berhasil diperbarui.`);
      setEditingDosen(null);
    } else {
      await addDosenAccount(payload);
      showToast(`Dosen baru ${dosenForm.nama} berhasil ditambahkan ke data master.`);
      setIsAddOpen(false);
    }
  };

  // Save Quick Status Update
  const handleSaveStatusUpdate = async () => {
    if (!statusManagingDosen) return;
    await updateDosenAccount(statusManagingDosen.id || statusManagingDosen.nip, {
      status: targetStatus
    });
    showToast(`Status dosen ${statusManagingDosen.nama} diubah menjadi "${targetStatus}".`);
    setStatusManagingDosen(null);
  };

  // Delete Dosen
  const handleConfirmDelete = async () => {
    if (!deletingDosen) return;
    await deleteDosenAccount(deletingDosen.id || deletingDosen.nip);
    showToast(`Dosen ${deletingDosen.nama} telah dihapus dari data master.`);
    setDeletingDosen(null);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['NIP', 'Nama Dosen', 'Email', 'No HP', 'Program Studi', 'Jabatan Fungsional', 'Bidang Keahlian', 'Kuota Dospem 1', 'Kuota Dospem 2', 'Status'];
    const rows = filteredDosen.map(adv => [
      `"${adv.nip || ''}"`,
      `"${(adv.nama || '').replace(/"/g, '""')}"`,
      `"${adv.email || ''}"`,
      `"${adv.no_hp || '-'}"`,
      `"${adv.prodi || 'D3 Manajemen Informatika'}"`,
      `"${adv.jabatan_fungsional || '-'}"`,
      `"${Array.isArray(adv.keahlian) ? adv.keahlian.join(', ') : (adv.keahlian || '-')}"`,
      `"${adv.kuota_dospem1 || 8}"`,
      `"${adv.kuota_dospem2 || 8}"`,
      `"${adv.status || 'aktif'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `data_master_dosen_simta_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Data master dosen berhasil diekspor dalam format CSV.');
  };

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    const s = String(status || 'aktif').toLowerCase();
    switch (s) {
      case 'aktif':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Aktif
          </span>
        );
      case 'tugas_belajar':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Tugas Belajar
          </span>
        );
      case 'cuti':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Cuti
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Nonaktif
          </span>
        );
    }
  };

  // Active advisees for viewing dosen
  const dosenAdvisees = useMemo(() => {
    if (!viewingDosen) return [];
    const nip = String(viewingDosen.nip || '').trim();
    const nama = String(viewingDosen.nama || '').toLowerCase().trim();
    return thesisTitles.filter(t => {
      const p1Match = String(t.pembimbing_1_nip || '').trim() === nip || String(t.pembimbing_1 || '').toLowerCase().includes(nama);
      const p2Match = String(t.pembimbing_2_nip || '').trim() === nip || String(t.pembimbing_2 || '').toLowerCase().includes(nama);
      return p1Match || p2Match;
    });
  }, [viewingDosen, thesisTitles]);

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center space-x-3 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 sm:p-7 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold backdrop-blur-sm mb-2 border border-indigo-400/20">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
              <span>Admin SIMTA • Data Master</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Data Dosen</h1>
            <p className="text-xs sm:text-sm text-indigo-100/90 mt-1 max-w-2xl leading-relaxed">
              Kelola data pengajar, NIP resmi, jabatan fungsional, bidang keahlian riset, alokasi kuota bimbingan, serta status keaktifan akademik Fakultas Ilmu Komputer UNSRI.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
              title="Import data dosen dari berkas Excel (.xlsx) atau CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Import Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-300" />
              <span>Ekspor CSV</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Dosen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1 hover:border-indigo-300 transition-all">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Dosen Terdaftar</div>
          <div className="text-2xl font-extrabold text-slate-900 flex items-center justify-between">
            <span>{totalDosen}</span>
            <Users className="w-6 h-6 text-indigo-500/40" />
          </div>
          <p className="text-[11px] text-slate-500">Tercatat di data master SIMTA</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1 hover:border-emerald-300 transition-all">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dosen Aktif</div>
          <div className="text-2xl font-extrabold text-emerald-600 flex items-center justify-between">
            <span>{totalAktif}</span>
            <UserCheck className="w-6 h-6 text-emerald-500/40" />
          </div>
          <p className="text-[11px] text-emerald-600/80 font-medium">Tersedia membimbing tugas akhir</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1 hover:border-blue-300 transition-all">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Kuota Bimbingan</div>
          <div className="text-2xl font-extrabold text-blue-600 flex items-center justify-between">
            <span>{totalKuotaUtama}</span>
            <GraduationCap className="w-6 h-6 text-blue-500/40" />
          </div>
          <p className="text-[11px] text-slate-500">Kapasitas pembimbing utama</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1 hover:border-amber-300 transition-all">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tugas Belajar / Cuti</div>
          <div className="text-2xl font-extrabold text-amber-600 flex items-center justify-between">
            <span>{totalTugasBelajar}</span>
            <AlertTriangle className="w-6 h-6 text-amber-500/40" />
          </div>
          <p className="text-[11px] text-slate-500">Tidak menerima bimbingan baru</p>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan NIP, Nama Dosen, Email, Jabatan, atau Bidang Keahlian..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Status Filter */}
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="tugas_belajar">Tugas Belajar</option>
                <option value="cuti">Cuti</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>

            {/* Jabatan Fungsional Filter */}
            <div className="flex items-center space-x-1.5">
              <select
                value={jabatanFilter}
                onChange={(e) => setJabatanFilter(e.target.value)}
                className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Semua Jabatan</option>
                {availableJabatan.filter(j => j !== 'ALL').map(jab => (
                  <option key={jab} value={jab}>{jab}</option>
                ))}
              </select>
            </div>

            {/* Prodi Filter */}
            <div className="flex items-center space-x-1.5">
              <select
                value={prodiFilter}
                onChange={(e) => setProdiFilter(e.target.value)}
                className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Semua Program Studi</option>
                {availableProdis.filter(p => p !== 'ALL').map(prd => (
                  <option key={prd} value={prd}>{prd}</option>
                ))}
              </select>
            </div>

            {/* Reset Filter Button */}
            {(searchQuery || statusFilter !== 'ALL' || jabatanFilter !== 'ALL' || prodiFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setJabatanFilter('ALL');
                  setProdiFilter('ALL');
                }}
                className="px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                Reset Filter
              </button>
            )}

          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Dosen</th>
                <th className="py-3.5 px-4">Kontak</th>
                <th className="py-3.5 px-4">Jabatan &amp; Prodi</th>
                <th className="py-3.5 px-4">Bidang Keahlian</th>
                <th className="py-3.5 px-4 text-center">Kuota (P1 / P2)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredDosen.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <UserCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-sm text-slate-600">Tidak ada data dosen ditemukan</p>
                    <p className="text-xs text-slate-400 mt-0.5">Coba sesuaikan kata kunci pencarian atau reset filter di atas.</p>
                  </td>
                </tr>
              ) : (
                filteredDosen.map((adv) => {
                  const keahlianList = Array.isArray(adv.keahlian) 
                    ? adv.keahlian 
                    : (adv.keahlian || '').split(',').map(s => s.trim()).filter(Boolean);

                  return (
                    <tr key={adv.id || adv.nip} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Dosen Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                            {adv.nama ? adv.nama.charAt(0).toUpperCase() : 'D'}
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setViewingDosen(adv)}
                              className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left truncate block cursor-pointer"
                            >
                              {adv.nama}
                            </button>
                            <div className="text-[11px] font-mono text-slate-500 font-medium">{adv.nip}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-1.5 text-slate-600 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[170px]">{adv.email || `${adv.nip}@unsri.ac.id`}</span>
                          </div>
                          {adv.no_hp && adv.no_hp !== '-' && (
                            <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{adv.no_hp}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Jabatan & Prodi */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{adv.jabatan_fungsional || 'Asisten Ahli'}</div>
                        <div className="text-[11px] text-slate-500">{adv.prodi || 'D3 Manajemen Informatika'}</div>
                      </td>

                      {/* Keahlian Chips */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {keahlianList.slice(0, 2).map((k, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {k}
                            </span>
                          ))}
                          {keahlianList.length > 2 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600">
                              +{keahlianList.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Kuota (P1 / P2) */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-50 text-slate-800 border border-slate-200">
                          {adv.kuota_dospem1 || 8} / {adv.kuota_dospem2 || 8}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleOpenStatusModal(adv)}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          title="Klik untuk ubah status cepat"
                        >
                          {renderStatusBadge(adv.status)}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          
                          {/* Detail */}
                          <button
                            type="button"
                            onClick={() => setViewingDosen(adv)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Lihat Detail Lengkap"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(adv)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Data Master Dosen"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Kelola Status */}
                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(adv)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Kelola Status Dosen"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeletingDosen(adv)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Dosen"
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

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            Menampilkan <span className="font-bold text-slate-800">{filteredDosen.length}</span> dari <span className="font-bold text-slate-800">{totalDosen}</span> dosen terdaftar
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <span>Sinkronisasi otomatis dengan Database Supabase &amp; Local Storage</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: DETAIL DOSEN */}
      {/* ============================================================== */}
      {viewingDosen && (
        <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto overscroll-contain">
          <div data-lenis-prevent className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto p-6 shadow-2xl border border-slate-100 relative space-y-4 animate-in zoom-in-95 overscroll-contain">
            
            {/* Modal Header (Fixed at top) */}
            <div className="flex items-start justify-between shrink-0">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md shadow-blue-600/30 shrink-0">
                  {viewingDosen.nama ? viewingDosen.nama.charAt(0).toUpperCase() : 'D'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{viewingDosen.nama}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="font-mono text-xs text-slate-500 font-semibold">{viewingDosen.nip}</span>
                    <span className="text-slate-300">•</span>
                    {renderStatusBadge(viewingDosen.status)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingDosen(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Academic & Identity Cards */}
            <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3 pr-1 py-1">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Data Fungsional &amp; Prodi</div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Jabatan Fungsional:</span>
                    <span className="font-bold text-slate-800">{viewingDosen.jabatan_fungsional || 'Asisten Ahli'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Program Studi:</span>
                    <span className="font-bold text-slate-800">{viewingDosen.prodi || 'D3 Manajemen Informatika'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Kuota Pembimbing 1 (Utama):</span>
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 inline-block mt-0.5">
                      Maksimal {viewingDosen.kuota_dospem1 || 8} Mahasiswa
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Kuota Pembimbing 2 (Pendamping):</span>
                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 inline-block mt-0.5">
                      Maksimal {viewingDosen.kuota_dospem2 || 8} Mahasiswa
                    </span>
                  </div>
                </div>
              </div>

              {/* Bidang Keahlian */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Bidang Keahlian / Riset</div>
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(viewingDosen.keahlian) 
                    ? viewingDosen.keahlian 
                    : (viewingDosen.keahlian || '').split(',').map(s => s.trim()).filter(Boolean)
                  ).map((k, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-200">
                      {k}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Informasi Kontak</div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      Email Resmi Dosen:
                    </span>
                    <span className="font-mono font-medium text-slate-900">{viewingDosen.email || `${viewingDosen.nip}@unsri.ac.id`}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      No. WhatsApp / HP:
                    </span>
                    <span className="font-mono font-medium text-slate-900">{viewingDosen.no_hp || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Active Advisees Section */}
              <div className="bg-indigo-50/60 rounded-2xl p-4 border border-indigo-100 space-y-2 text-xs">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 flex items-center justify-between">
                  <span>Mahasiswa Bimbingan Aktif</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                    {dosenAdvisees.length} Mahasiswa
                  </span>
                </div>
                {dosenAdvisees.length > 0 ? (
                  <div className="divide-y divide-indigo-100/80 max-h-40 overflow-y-auto overscroll-contain space-y-1 pr-1">
                    {dosenAdvisees.map(t => (
                      <div key={t.id} className="pt-1.5 text-slate-700">
                        <div className="font-bold text-slate-900 flex items-center justify-between">
                          <span>{t.mhs_nama}</span>
                          <span className="font-mono text-[10px] text-slate-500">{t.mhs_nim}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-1 italic">"{t.judul}"</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">Belum ada mahasiswa yang tercatat dalam bimbingan aktif dosen ini.</p>
                )}
              </div>
            </div>

            {/* Modal Actions (Fixed at bottom) */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const d = viewingDosen;
                  setViewingDosen(null);
                  handleOpenEdit(d);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all cursor-pointer shadow-sm"
              >
                Edit Data Dosen
              </button>
              <button
                type="button"
                onClick={() => setViewingDosen(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: TAMBAH / EDIT DOSEN */}
      {/* ============================================================== */}
      {(isAddOpen || editingDosen) && (
        <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto overscroll-contain">
          <div data-lenis-prevent className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden my-auto p-6 shadow-2xl border border-slate-100 relative space-y-4 animate-in zoom-in-95 overscroll-contain">
            
            {/* Modal Header (Fixed at top) */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingDosen ? 'Edit Data Master Dosen' : 'Tambah Dosen Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Isi kelengkapan NIP, gelar akademik, dan alokasi kuota bimbingan.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingDosen(null);
                }}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDosen} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs" data-lenis-prevent>
              
              {/* Dedicated Scrollable Form Body */}
              <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3.5 pr-1 py-1">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Nomor Induk Pegawai (NIP) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingDosen)}
                    value={dosenForm.nip}
                    onChange={(e) => setDosenForm({ ...dosenForm, nip: e.target.value })}
                    placeholder="Contoh: 198410012009121005"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                {/* Nama Lengkap + Gelar */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Nama Lengkap &amp; Gelar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={dosenForm.nama}
                    onChange={(e) => setDosenForm({ ...dosenForm, nama: e.target.value })}
                    placeholder="Contoh: Dr. Ir. Hendra Kusuma, M.T."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Resmi</label>
                  <input
                    type="email"
                    value={dosenForm.email}
                    onChange={(e) => setDosenForm({ ...dosenForm, email: e.target.value })}
                    placeholder={dosenForm.nip ? `${dosenForm.nip}@unsri.ac.id` : 'dosen@unsri.ac.id'}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Biarkan kosong untuk otomatis memakai format NIP@unsri.ac.id</span>
                </div>

                {/* No HP */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">No. Handphone / WhatsApp</label>
                  <input
                    type="text"
                    value={dosenForm.no_hp}
                    onChange={(e) => setDosenForm({ ...dosenForm, no_hp: e.target.value })}
                    placeholder="Contoh: 081298765432"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Jabatan Fungsional & Prodi */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Jabatan Fungsional</label>
                    <select
                      value={dosenForm.jabatan_fungsional}
                      onChange={(e) => setDosenForm({ ...dosenForm, jabatan_fungsional: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    >
                      <option value="Tenaga Pengajar">Tenaga Pengajar</option>
                      <option value="Asisten Ahli">Asisten Ahli</option>
                      <option value="Lektor">Lektor</option>
                      <option value="Lektor Kepala">Lektor Kepala</option>
                      <option value="Guru Besar">Guru Besar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Program Studi</label>
                    <select
                      value={dosenForm.prodi}
                      onChange={(e) => setDosenForm({ ...dosenForm, prodi: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    >
                      <option value="D3 Manajemen Informatika">D3 Manajemen Informatika</option>
                      <option value="D3 Komputerisasi Akuntansi">D3 Komputerisasi Akuntansi</option>
                      <option value="S1 Sistem Informasi">S1 Sistem Informasi</option>
                      <option value="S1 Teknik Informatika">S1 Teknik Informatika</option>
                    </select>
                  </div>
                </div>

                {/* Bidang Keahlian */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Bidang Keahlian / Riset</label>
                  <input
                    type="text"
                    value={dosenForm.keahlian}
                    onChange={(e) => setDosenForm({ ...dosenForm, keahlian: e.target.value })}
                    placeholder="Contoh: Rekayasa Web, Sistem Informasi, Basis Data (Pisahkan koma)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Kuota Dospem 1 & 2 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Kuota Pembimbing 1</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={dosenForm.kuota_dospem1}
                      onChange={(e) => setDosenForm({ ...dosenForm, kuota_dospem1: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Kuota Pembimbing 2</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={dosenForm.kuota_dospem2}
                      onChange={(e) => setDosenForm({ ...dosenForm, kuota_dospem2: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status Keaktifan</label>
                  <select
                    value={dosenForm.status}
                    onChange={(e) => setDosenForm({ ...dosenForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="tugas_belajar">Tugas Belajar</option>
                    <option value="cuti">Cuti</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons (Fixed at bottom) */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setEditingDosen(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md shadow-blue-600/30"
                >
                  {editingDosen ? 'Simpan Perubahan' : 'Tambahkan Dosen'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: KELOLA STATUS CEPAT */}
      {/* ============================================================== */}
      {statusManagingDosen && (
        <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto overscroll-contain">
          <div data-lenis-prevent className="bg-white rounded-3xl max-w-sm w-full max-h-[90vh] overflow-y-auto my-auto p-6 shadow-2xl border border-slate-100 relative space-y-4 animate-in zoom-in-95 overscroll-contain">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Kelola Status Dosen</h3>
                <p className="text-[11px] text-slate-500">{statusManagingDosen.nama}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block text-slate-700 font-bold">Pilih Status Baru:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'aktif', label: 'Aktif' },
                  { id: 'tugas_belajar', label: 'Tugas Belajar' },
                  { id: 'cuti', label: 'Cuti' },
                  { id: 'nonaktif', label: 'Nonaktif' }
                ].map(st => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setTargetStatus(st.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      targetStatus === st.id
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setStatusManagingDosen(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveStatusUpdate}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/30"
              >
                Perbarui Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: KONFIRMASI HAPUS */}
      {/* ============================================================== */}
      {deletingDosen && (
        <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto overscroll-contain">
          <div data-lenis-prevent className="bg-white rounded-3xl max-w-sm w-full max-h-[90vh] overflow-y-auto my-auto p-6 shadow-2xl border border-slate-100 relative space-y-4 animate-in zoom-in-95 overscroll-contain">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Hapus Dosen?</h3>
                <p className="text-[11px] text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              Apakah Anda yakin ingin menghapus dosen <span className="font-bold text-slate-900">{deletingDosen.nama}</span> (NIP: {deletingDosen.nip}) dari data master SIMTA?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setDeletingDosen(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-md shadow-rose-600/30"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import Data Master Dosen */}
      <ModalImportMasterData
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        entityType="dosen"
        existingData={rawDosenList}
        onImport={batchImportDosen}
        onSuccess={(result) => {
          showToast(`Import data selesai: ${result.imported} dosen baru ditambahkan, ${result.updated} diperbarui.`);
        }}
      />

    </div>
  );
}
