import React, { useState, useMemo } from 'react';
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
  KeyRound, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Tag, 
  AlertTriangle,
  Award,
  Building2
} from 'lucide-react';

export default function AkunDosenAdminPage() {
  const { 
    getAllDosenAccounts, 
    addDosenAccount, 
    updateDosenAccount, 
    deleteDosenAccount, 
    resetDosenPassword 
  } = useAuth();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [jabatanFilter, setJabatanFilter] = useState('ALL');

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDosen, setEditingDosen] = useState(null);
  const [viewingDosen, setViewingDosen] = useState(null);
  const [resettingDosen, setResettingDosen] = useState(null);
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
    role: 'dosen',
    status: 'aktif',
    password: ''
  });

  // Password reset custom field
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Live Dosen Accounts Dataset
  const dosenList = useMemo(() => {
    return getAllDosenAccounts();
  }, [getAllDosenAccounts]);

  // Unique Functional Titles list for filter
  const availableJabatan = useMemo(() => {
    const list = new Set(dosenList.map(d => d.jabatan_fungsional).filter(Boolean));
    return ['ALL', ...Array.from(list).sort()];
  }, [dosenList]);

  // Filtered Dosen List
  const filteredDosen = useMemo(() => {
    return dosenList.filter(adv => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        (adv.nip && String(adv.nip).toLowerCase().includes(q)) ||
        (adv.nama && adv.nama.toLowerCase().includes(q)) ||
        (adv.email && adv.email.toLowerCase().includes(q)) ||
        (adv.jabatan_fungsional && adv.jabatan_fungsional.toLowerCase().includes(q)) ||
        (Array.isArray(adv.keahlian) && adv.keahlian.some(k => k.toLowerCase().includes(q)));

      const matchStatus = statusFilter === 'ALL' || adv.status === statusFilter;
      const matchJabatan = jabatanFilter === 'ALL' || adv.jabatan_fungsional === jabatanFilter;
      return matchQuery && matchStatus && matchJabatan;
    });
  }, [dosenList, searchQuery, statusFilter, jabatanFilter]);

  // Statistics
  const totalDosen = dosenList.length;
  const totalAktif = dosenList.filter(d => d.status === 'aktif').length;
  const totalCuti = dosenList.filter(d => d.status !== 'aktif').length;
  const totalKeahlian = new Set(dosenList.flatMap(d => Array.isArray(d.keahlian) ? d.keahlian : [])).size;

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
      role: 'dosen',
      status: 'aktif',
      password: ''
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
      kuota_dospem1: dosen.kuota_dospem1 ?? 8,
      kuota_dospem2: dosen.kuota_dospem2 ?? 8,
      role: dosen.role || 'dosen',
      status: dosen.status || 'aktif',
      password: ''
    });
  };

  // Open Reset Password Modal
  const handleOpenReset = (dosen) => {
    setResettingDosen(dosen);
    setNewPasswordInput(dosen.nip || 'unsri123');
  };

  // Handle Save Dosen (Add / Edit)
  const handleSaveDosen = async (e) => {
    e.preventDefault();
    if (!dosenForm.nip || !dosenForm.nama) {
      showToast('NIP dan Nama Dosen wajib diisi!');
      return;
    }

    const emailToUse = dosenForm.email || `${dosenForm.nip.trim()}@unsri.ac.id`;
    const keahlianArray = (dosenForm.keahlian || '')
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    const payload = {
      ...dosenForm,
      email: emailToUse,
      keahlian: keahlianArray,
      kuota_dospem1: Number(dosenForm.kuota_dospem1) || 8,
      kuota_dospem2: Number(dosenForm.kuota_dospem2) || 8
    };

    if (editingDosen) {
      await updateDosenAccount(editingDosen.id || editingDosen.nip, payload);
      showToast(`Berhasil memperbarui data akun dosen: ${dosenForm.nama}`);
      setEditingDosen(null);
    } else {
      await addDosenAccount({
        ...payload,
        password: dosenForm.password || dosenForm.nip
      });
      showToast(`Berhasil mendaftarkan akun dosen baru: ${dosenForm.nama}`);
      setIsAddOpen(false);
    }
  };

  // Handle Confirm Reset Password
  const handleConfirmReset = async (e) => {
    e.preventDefault();
    if (!resettingDosen) return;

    const newPass = newPasswordInput.trim() || resettingDosen.nip;
    await resetDosenPassword(resettingDosen.id || resettingDosen.nip, newPass);
    showToast(`Kata sandi untuk ${resettingDosen.nama} berhasil diatur ulang menjadi: "${newPass}"`);
    setResettingDosen(null);
  };

  // Handle Confirm Delete Dosen
  const handleConfirmDelete = async () => {
    if (!deletingDosen) return;
    await deleteDosenAccount(deletingDosen.id || deletingDosen.nip);
    showToast(`Akun dosen ${deletingDosen.nama} berhasil dihapus`);
    setDeletingDosen(null);
  };

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'aktif':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Aktif
          </span>
        );
      case 'cuti_studi':
      case 'cuti':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Cuti Studi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Nonaktif
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center space-x-3 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold backdrop-blur-sm mb-2 border border-indigo-400/20">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
              <span>Admin Resource Management</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Manajemen Akun Dosen &amp; Kaprodi</h1>
            <p className="text-xs sm:text-sm text-indigo-100/90 mt-1 max-w-2xl leading-relaxed">
              Kelola data otorisasi, jabatan fungsional, kuota pembimbingan, dan kredensial akses seluruh Dosen Fasilkom UNSRI.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Akun Dosen</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1 hover:border-indigo-300 transition-all">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Dosen Terdaftar</div>
          <div className="text-2xl font-extrabold text-slate-900 flex items-center justify-between">
            <span>{totalDosen} Dosen</span>
            <Users className="w-6 h-6 text-indigo-500/40" />
          </div>
          <p className="text-[11px] text-slate-500">Database resmi SIMTA</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1 hover:border-emerald-300 transition-all">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dosen Aktif Mengajar</div>
          <div className="text-2xl font-extrabold text-emerald-600 flex items-center justify-between">
            <span>{totalAktif}</span>
            <UserCheck className="w-6 h-6 text-emerald-500/40" />
          </div>
          <p className="text-[11px] text-emerald-600/80 font-medium">Aktif membimbing TA</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1 hover:border-amber-300 transition-all">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cuti Studi / Tugas</div>
          <div className="text-2xl font-extrabold text-amber-600 flex items-center justify-between">
            <span>{totalCuti}</span>
            <AlertTriangle className="w-6 h-6 text-amber-500/40" />
          </div>
          <p className="text-[11px] text-slate-500">Sementara tidak membimbing</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1 hover:border-blue-300 transition-all">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Keahlian &amp; Topik</div>
          <div className="text-2xl font-extrabold text-blue-600 flex items-center justify-between">
            <span>{totalKeahlian} Bidang</span>
            <Award className="w-6 h-6 text-blue-500/40" />
          </div>
          <p className="text-[11px] text-slate-500">Riset &amp; bimbingan TA</p>
        </div>

      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        
        {/* Search & Filter Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-3 bg-slate-50/50">
          
          {/* Search Input */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari NIP, Nama Dosen, Email, atau Keahlian..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white outline-none font-medium transition-all"
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

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
            
            {/* Status Filter */}
            <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-indigo-600 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="cuti_studi">Cuti Studi</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>

            {/* Jabatan Fungsional Filter */}
            <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700">
              <Award className="w-3.5 h-3.5 text-slate-400" />
              <span>Jabatan:</span>
              <select
                value={jabatanFilter}
                onChange={(e) => setJabatanFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-blue-600 outline-none cursor-pointer"
              >
                {availableJabatan.map(j => (
                  <option key={j} value={j}>{j === 'ALL' ? 'Semua Jabatan' : j}</option>
                ))}
              </select>
            </div>

            <div className="text-xs font-bold text-slate-500 px-2">
              Menampilkan <span className="text-slate-900">{filteredDosen.length}</span> dari {dosenList.length} dosen
            </div>

          </div>

        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Dosen Pembimbing</th>
                <th className="py-3.5 px-4">Kontak &amp; Email</th>
                <th className="py-3.5 px-4">Jabatan &amp; Keahlian</th>
                <th className="py-3.5 px-4 text-center">Kuota Dospem</th>
                <th className="py-3.5 px-4 text-center">Role</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi Kelola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredDosen.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <UserCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-xs text-slate-500">Tidak ada akun dosen yang sesuai kriteria pencarian.</p>
                  </td>
                </tr>
              ) : (
                filteredDosen.map((adv, idx) => (
                  <tr key={adv.id || adv.nip || idx} className="hover:bg-indigo-50/30 transition-colors group">
                    
                    {/* No */}
                    <td className="py-3.5 px-4 text-center text-slate-400 font-semibold text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Dosen Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {adv.nama ? adv.nama.charAt(0).toUpperCase() : 'D'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {adv.nama}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-500 font-mono">
                            NIP: {adv.nip}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact & Email */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5 text-slate-700 font-medium">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{adv.email || `${adv.nip}@unsri.ac.id`}</span>
                        </div>
                        {adv.no_hp && adv.no_hp !== '-' && (
                          <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{adv.no_hp}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Jabatan & Keahlian */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1 max-w-xs">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-100">
                          {adv.jabatan_fungsional || 'Asisten Ahli'}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(adv.keahlian) ? adv.keahlian : (adv.keahlian || '').split(',')).slice(0, 2).map((k, i) => (
                            <span key={i} className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-medium truncate max-w-[120px]">
                              {typeof k === 'string' ? k.trim() : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Kuota Bimbingan */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center space-x-2 text-[11px]">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold" title="Kuota Dospem 1">
                          P1: {adv.kuota_dospem1 ?? 8}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold" title="Kuota Dospem 2">
                          P2: {adv.kuota_dospem2 ?? 8}
                        </span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                        adv.role === 'kaprodi'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      }`}>
                        {adv.role === 'kaprodi' ? 'Kaprodi' : 'Dosen'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      {renderStatusBadge(adv.status || 'aktif')}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center space-x-1">
                        
                        {/* View Detail */}
                        <button
                          type="button"
                          onClick={() => setViewingDosen(adv)}
                          title="Lihat Detail Akun"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Reset Password */}
                        <button
                          type="button"
                          onClick={() => handleOpenReset(adv)}
                          title="Reset Kata Sandi"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(adv)}
                          title="Edit Akun"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setDeletingDosen(adv)}
                          title="Hapus Akun"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ── MODAL: TAMBAH / EDIT AKUN DOSEN ────────────────────────────────── */}
      {(isAddOpen || editingDosen) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {editingDosen ? 'Edit Akun Dosen' : 'Tambah Akun Dosen Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingDosen ? 'Perbarui data identitas, jabatan, dan kuota' : 'Daftarkan dosen pembimbing baru ke sistem SIMTA'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsAddOpen(false); setEditingDosen(null); }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveDosen} className="space-y-4 pt-4 text-xs">
              
              {/* NIP */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">NIP (Nomor Induk Pegawai) *</label>
                <input
                  type="text"
                  required
                  value={dosenForm.nip}
                  onChange={(e) => setDosenForm({ ...dosenForm, nip: e.target.value })}
                  placeholder="Contoh: 198410012009121005"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none font-mono text-xs font-semibold"
                />
              </div>

              {/* Nama Lengkap beserta Gelar */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nama Lengkap &amp; Gelar Akademik *</label>
                <input
                  type="text"
                  required
                  value={dosenForm.nama}
                  onChange={(e) => setDosenForm({ ...dosenForm, nama: e.target.value })}
                  placeholder="Contoh: Dr. Abdiansah, S.Kom., M.Cs."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-xs font-medium"
                />
              </div>

              {/* Email Resmi & No HP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email Resmi UNSRI</label>
                  <input
                    type="email"
                    value={dosenForm.email}
                    onChange={(e) => setDosenForm({ ...dosenForm, email: e.target.value })}
                    placeholder="nama@unsri.ac.id"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-xs font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    value={dosenForm.no_hp}
                    onChange={(e) => setDosenForm({ ...dosenForm, no_hp: e.target.value })}
                    placeholder="08123456789"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-xs font-medium"
                  />
                </div>
              </div>

              {/* Jabatan Fungsional & Prodi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Jabatan Fungsional</label>
                  <select
                    value={dosenForm.jabatan_fungsional}
                    onChange={(e) => setDosenForm({ ...dosenForm, jabatan_fungsional: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 outline-none text-xs font-semibold bg-white cursor-pointer"
                  >
                    <option value="Tenaga Pengajar">Tenaga Pengajar</option>
                    <option value="Asisten Ahli">Asisten Ahli</option>
                    <option value="Lektor">Lektor</option>
                    <option value="Lektor Kepala">Lektor Kepala</option>
                    <option value="Guru Besar / Profesor">Guru Besar / Profesor</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Program Studi</label>
                  <select
                    value={dosenForm.prodi}
                    onChange={(e) => setDosenForm({ ...dosenForm, prodi: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 outline-none text-xs font-semibold bg-white cursor-pointer"
                  >
                    <option value="D3 Manajemen Informatika">D3 Manajemen Informatika</option>
                    <option value="D3 Teknik Komputer">D3 Teknik Komputer</option>
                    <option value="S1 Sistem Informasi">S1 Sistem Informasi</option>
                    <option value="S1 Teknik Informatika">S1 Teknik Informatika</option>
                    <option value="S1 Sistem Komputer">S1 Sistem Komputer</option>
                  </select>
                </div>
              </div>

              {/* Bidang Keahlian */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Bidang Keahlian (Pisahkan dengan koma)</label>
                <input
                  type="text"
                  value={dosenForm.keahlian}
                  onChange={(e) => setDosenForm({ ...dosenForm, keahlian: e.target.value })}
                  placeholder="Contoh: Kecerdasan Buatan, Data Science, RPL"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-xs font-medium"
                />
              </div>

              {/* Kuota Dospem 1 & 2 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kuota Dospem 1</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={dosenForm.kuota_dospem1}
                    onChange={(e) => setDosenForm({ ...dosenForm, kuota_dospem1: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 outline-none text-xs font-bold font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kuota Dospem 2</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={dosenForm.kuota_dospem2}
                    onChange={(e) => setDosenForm({ ...dosenForm, kuota_dospem2: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 outline-none text-xs font-bold font-mono"
                  />
                </div>
              </div>

              {/* Status Akun & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Status Akun</label>
                  <select
                    value={dosenForm.status}
                    onChange={(e) => setDosenForm({ ...dosenForm, status: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 outline-none text-xs font-semibold bg-white cursor-pointer"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="cuti_studi">Cuti Studi</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Role Sistem</label>
                  <select
                    value={dosenForm.role}
                    onChange={(e) => setDosenForm({ ...dosenForm, role: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 outline-none text-xs font-semibold bg-white cursor-pointer"
                  >
                    <option value="dosen">Dosen Pembimbing</option>
                    <option value="kaprodi">Kaprodi (Ketua Jurusan)</option>
                  </select>
                </div>
              </div>

              {/* Password Initial (Only for new accounts) */}
              {!editingDosen && (
                <div className="space-y-1 pt-1">
                  <label className="font-bold text-slate-700">Kata Sandi Awal (Opsional)</label>
                  <input
                    type="text"
                    value={dosenForm.password}
                    onChange={(e) => setDosenForm({ ...dosenForm, password: e.target.value })}
                    placeholder="Default: Sesuai NIP jika dikosongkan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-xs font-medium"
                  />
                  <p className="text-[10px] text-slate-400">Kata sandi standar otomatis menggunakan NIP dosen.</p>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsAddOpen(false); setEditingDosen(null); }}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  {editingDosen ? 'Simpan Perubahan' : 'Daftarkan Akun'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ── MODAL: DETAIL AKUN DOSEN ─────────────────────────────────────── */}
      {viewingDosen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Detail Akun Dosen</h3>
              <button
                type="button"
                onClick={() => setViewingDosen(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-indigo-600/30">
                {viewingDosen.nama ? viewingDosen.nama.charAt(0).toUpperCase() : 'D'}
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">{viewingDosen.nama}</h4>
                <p className="text-xs font-mono font-bold text-indigo-600">NIP: {viewingDosen.nip}</p>
                <div className="mt-1">{renderStatusBadge(viewingDosen.status || 'aktif')}</div>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Email Resmi:</span>
                <span className="font-bold text-slate-900">{viewingDosen.email || `${viewingDosen.nip}@unsri.ac.id`}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">No. HP / WhatsApp:</span>
                <span className="font-bold text-slate-900">{viewingDosen.no_hp || '-'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Jabatan Fungsional:</span>
                <span className="font-bold text-slate-900">{viewingDosen.jabatan_fungsional || 'Asisten Ahli'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Kuota Dospem:</span>
                <span className="font-bold text-slate-900">P1: {viewingDosen.kuota_dospem1 ?? 8} | P2: {viewingDosen.kuota_dospem2 ?? 8}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Role Sistem:</span>
                <span className="font-bold text-indigo-600 uppercase">{viewingDosen.role || 'Dosen'}</span>
              </div>
              <div className="py-1">
                <span className="text-slate-500 font-semibold block mb-1.5">Bidang Keahlian:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(viewingDosen.keahlian) ? viewingDosen.keahlian : (viewingDosen.keahlian || '').split(',')).map((k, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-100">
                      {typeof k === 'string' ? k.trim() : ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const d = viewingDosen;
                  setViewingDosen(null);
                  handleOpenReset(d);
                }}
                className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs flex items-center space-x-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Reset Sandi</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingDosen(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL: RESET PASSWORD DOSEN ──────────────────────────────────── */}
      {resettingDosen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 font-bold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Reset Kata Sandi Akun Dosen</h3>
                <p className="text-xs text-slate-500">Atur ulang kata sandi dosen</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Anda akan mengatur ulang kata sandi untuk akun <span className="font-bold text-slate-900">{resettingDosen.nama}</span> (NIP: {resettingDosen.nip}).
            </p>

            <form onSubmit={handleConfirmReset} className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Kata Sandi Baru</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Masukkan kata sandi baru..."
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-amber-600 focus:ring-2 focus:ring-amber-100 outline-none text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-400">Kata sandi default:</span>
                  <button
                    type="button"
                    onClick={() => setNewPasswordInput(resettingDosen.nip)}
                    className="text-indigo-600 hover:underline font-bold"
                  >
                    Gunakan NIP ({resettingDosen.nip})
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setResettingDosen(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/30"
                >
                  Konfirmasi Reset Sandi
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ── MODAL: KONFIRMASI HAPUS DOSEN ────────────────────────────────── */}
      {deletingDosen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-slate-900">Hapus Akun Dosen?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Apakah Anda yakin ingin menghapus akun dosen <span className="font-bold text-slate-900">{deletingDosen.nama}</span> ({deletingDosen.nip})? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDosen(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30"
              >
                Ya, Hapus Akun
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
