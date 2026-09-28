import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  GraduationCap, 
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
  UserCheck, 
  AlertTriangle,
  RefreshCw,
  Check,
  Building2,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

export default function AkunMahasiswaAdminPage() {
  const { 
    getAllMahasiswaAccounts, 
    addMahasiswaAccount, 
    updateMahasiswaAccount, 
    deleteMahasiswaAccount, 
    resetMahasiswaPassword 
  } = useAuth();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [resettingStudent, setResettingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);

  // Form State for Add / Edit
  const [studentForm, setStudentForm] = useState({
    nim: '',
    nama: '',
    email: '',
    no_hp: '',
    prodi: 'D3 Manajemen Informatika',
    kelas: 'MI 5A',
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

  // Live Mahasiswa Accounts Dataset
  const mahasiswaList = useMemo(() => {
    return getAllMahasiswaAccounts();
  }, [getAllMahasiswaAccounts]);

  // Unique Classes list for filter
  const availableClasses = useMemo(() => {
    const classes = new Set(mahasiswaList.map(s => s.kelas).filter(Boolean));
    return ['ALL', ...Array.from(classes).sort()];
  }, [mahasiswaList]);

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    return mahasiswaList.filter(std => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        (std.nim && String(std.nim).toLowerCase().includes(q)) ||
        (std.nama && std.nama.toLowerCase().includes(q)) ||
        (std.email && std.email.toLowerCase().includes(q)) ||
        (std.no_hp && String(std.no_hp).toLowerCase().includes(q));

      const matchStatus = statusFilter === 'ALL' || std.status === statusFilter;
      const matchClass = classFilter === 'ALL' || std.kelas === classFilter;
      return matchQuery && matchStatus && matchClass;
    });
  }, [mahasiswaList, searchQuery, statusFilter, classFilter]);

  // Statistics
  const totalAkun = mahasiswaList.length;
  const totalAktif = mahasiswaList.filter(s => s.status === 'aktif').length;
  const totalNonaktif = mahasiswaList.filter(s => s.status !== 'aktif').length;
  const totalKelas = new Set(mahasiswaList.map(s => s.kelas).filter(Boolean)).size;

  // Open Add Modal
  const handleOpenAdd = () => {
    setStudentForm({
      nim: '',
      nama: '',
      email: '',
      no_hp: '',
      prodi: 'D3 Manajemen Informatika',
      kelas: 'MI 5A',
      status: 'aktif',
      password: ''
    });
    setIsAddOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setStudentForm({
      nim: student.nim || '',
      nama: student.nama || '',
      email: student.email || '',
      no_hp: student.no_hp || '',
      prodi: student.prodi || 'D3 Manajemen Informatika',
      kelas: student.kelas || 'MI 5A',
      status: student.status || 'aktif',
      password: ''
    });
  };

  // Open Reset Password Modal
  const handleOpenReset = (student) => {
    setResettingStudent(student);
    setNewPasswordInput(student.nim || 'unsri123');
  };

  // Handle Save Student (Add / Edit)
  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!studentForm.nim || !studentForm.nama) {
      showToast('NIM dan Nama Mahasiswa wajib diisi!');
      return;
    }

    const emailToUse = studentForm.email || `${studentForm.nim.trim()}@student.unsri.ac.id`;

    if (editingStudent) {
      await updateMahasiswaAccount(editingStudent.id || editingStudent.nim, {
        ...studentForm,
        email: emailToUse
      });
      showToast(`Berhasil memperbarui data akun mahasiswa: ${studentForm.nama}`);
      setEditingStudent(null);
    } else {
      await addMahasiswaAccount({
        ...studentForm,
        email: emailToUse,
        password: studentForm.password || studentForm.nim
      });
      showToast(`Berhasil mendaftarkan akun mahasiswa baru: ${studentForm.nama}`);
      setIsAddOpen(false);
    }
  };

  // Handle Confirm Reset Password
  const handleConfirmReset = async (e) => {
    e.preventDefault();
    if (!resettingStudent) return;

    const newPass = newPasswordInput.trim() || resettingStudent.nim;
    await resetMahasiswaPassword(resettingStudent.id || resettingStudent.nim, newPass);
    showToast(`Kata sandi untuk ${resettingStudent.nama} berhasil diatur ulang menjadi: "${newPass}"`);
    setResettingStudent(null);
  };

  // Handle Confirm Delete Student
  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    await deleteMahasiswaAccount(deletingStudent.id || deletingStudent.nim);
    showToast(`Akun mahasiswa ${deletingStudent.nama} berhasil dihapus`);
    setDeletingStudent(null);
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
      case 'cuti':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Cuti
          </span>
        );
      case 'ditangguhkan':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Ditangguhkan
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
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold backdrop-blur-sm mb-2 border border-blue-400/20">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
              <span>Admin Resource Management</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Manajemen Akun Mahasiswa</h1>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-2xl leading-relaxed">
              Kelola data otorisasi, status keaktifan, dan kredensial akses seluruh akun mahasiswa Fakultas Ilmu Komputer UNSRI.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Akun Mahasiswa</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1 hover:border-blue-300 transition-all">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Akun Terdaftar</div>
          <div className="text-2xl font-extrabold text-slate-900 flex items-center justify-between">
            <span>{totalAkun}</span>
            <Users className="w-6 h-6 text-blue-500/40" />
          </div>
          <p className="text-[11px] text-slate-500">Mahasiswa SIMTA Fasilkom</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1 hover:border-emerald-300 transition-all">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Akun Aktif</div>
          <div className="text-2xl font-extrabold text-emerald-600 flex items-center justify-between">
            <span>{totalAktif}</span>
            <UserCheck className="w-6 h-6 text-emerald-500/40" />
          </div>
          <p className="text-[11px] text-emerald-600/80 font-medium">Bisa login dan mengajukan TA</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1 hover:border-amber-300 transition-all">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cuti / Nonaktif</div>
          <div className="text-2xl font-extrabold text-amber-600 flex items-center justify-between">
            <span>{totalNonaktif}</span>
            <AlertTriangle className="w-6 h-6 text-amber-500/40" />
          </div>
          <p className="text-[11px] text-slate-500">Status akun dibatasi</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1 hover:border-indigo-300 transition-all">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rombel / Kelas</div>
          <div className="text-2xl font-extrabold text-indigo-600 flex items-center justify-between">
            <span>{totalKelas} Kelas</span>
            <GraduationCap className="w-6 h-6 text-indigo-500/40" />
          </div>
          <p className="text-[11px] text-slate-500">Angkatan aktif</p>
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
              placeholder="Cari NIM, Nama, Email, atau No. HP..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white outline-none font-medium transition-all"
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
                className="bg-transparent text-xs font-bold text-blue-600 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="cuti">Cuti</option>
                <option value="nonaktif">Nonaktif</option>
                <option value="ditangguhkan">Ditangguhkan</option>
              </select>
            </div>

            {/* Class Filter */}
            <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              <span>Kelas:</span>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-indigo-600 outline-none cursor-pointer"
              >
                {availableClasses.map(c => (
                  <option key={c} value={c}>{c === 'ALL' ? 'Semua Kelas' : c}</option>
                ))}
              </select>
            </div>

            <div className="text-xs font-bold text-slate-500 px-2">
              Menampilkan <span className="text-slate-900">{filteredStudents.length}</span> dari {mahasiswaList.length} akun
            </div>

          </div>

        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Mahasiswa</th>
                <th className="py-3.5 px-4">Kontak &amp; Email</th>
                <th className="py-3.5 px-4">Prodi &amp; Kelas</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4 text-center">Status Akun</th>
                <th className="py-3.5 px-4 text-right">Aksi Kelola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <GraduationCap className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-xs text-slate-500">Tidak ada akun mahasiswa yang sesuai kriteria pencarian.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std, idx) => (
                  <tr key={std.id || std.nim || idx} className="hover:bg-blue-50/40 transition-colors group">
                    
                    {/* No */}
                    <td className="py-3.5 px-4 text-center text-slate-400 font-semibold text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Mahasiswa Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {std.nama ? std.nama.charAt(0).toUpperCase() : 'M'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {std.nama}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-500 font-mono">
                            NIM: {std.nim}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact & Email */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5 text-slate-700 font-medium">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{std.email || `${std.nim}@student.unsri.ac.id`}</span>
                        </div>
                        {std.no_hp && std.no_hp !== '-' && (
                          <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{std.no_hp}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Prodi & Kelas */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-800 text-[11px]">{std.prodi || 'D3 Manajemen Informatika'}</div>
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px]">
                          {std.kelas || 'MI 5A'}
                        </span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                        Mahasiswa
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      {renderStatusBadge(std.status || 'aktif')}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center space-x-1">
                        
                        {/* View Detail */}
                        <button
                          type="button"
                          onClick={() => setViewingStudent(std)}
                          title="Lihat Detail Akun"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Reset Password */}
                        <button
                          type="button"
                          onClick={() => handleOpenReset(std)}
                          title="Reset Kata Sandi"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(std)}
                          title="Edit Akun"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setDeletingStudent(std)}
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

      {/* ── MODAL: TAMBAH / EDIT AKUN MAHASISWA ────────────────────────────── */}
      {(isAddOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {editingStudent ? 'Edit Akun Mahasiswa' : 'Tambah Akun Mahasiswa Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingStudent ? 'Perbarui data identitas & status akun' : 'Daftarkan akun mahasiswa ke database SIMTA'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsAddOpen(false); setEditingStudent(null); }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveStudent} className="space-y-4 pt-4 text-xs">
              
              {/* NIM */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">NIM (Nomor Induk Mahasiswa) *</label>
                <input
                  type="text"
                  required
                  value={studentForm.nim}
                  onChange={(e) => setStudentForm({ ...studentForm, nim: e.target.value })}
                  placeholder="Contoh: 09010182428002"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none font-mono text-xs font-semibold"
                />
              </div>

              {/* Nama */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nama Lengkap Mahasiswa *</label>
                <input
                  type="text"
                  required
                  value={studentForm.nama}
                  onChange={(e) => setStudentForm({ ...studentForm, nama: e.target.value })}
                  placeholder="Masukkan nama lengkap sesuai KTM"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-xs font-medium"
                />
              </div>

              {/* Email Resmi & No HP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email Resmi UNSRI</label>
                  <input
                    type="email"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    placeholder="nama@student.unsri.ac.id"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-xs font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    value={studentForm.no_hp}
                    onChange={(e) => setStudentForm({ ...studentForm, no_hp: e.target.value })}
                    placeholder="08123456789"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-xs font-medium"
                  />
                </div>
              </div>

              {/* Prodi & Kelas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Program Studi</label>
                  <select
                    value={studentForm.prodi}
                    onChange={(e) => setStudentForm({ ...studentForm, prodi: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-xs font-semibold bg-white cursor-pointer"
                  >
                    <option value="D3 Manajemen Informatika">D3 Manajemen Informatika</option>
                    <option value="D3 Teknik Komputer">D3 Teknik Komputer</option>
                    <option value="S1 Sistem Informasi">S1 Sistem Informasi</option>
                    <option value="S1 Teknik Informatika">S1 Teknik Informatika</option>
                    <option value="S1 Sistem Komputer">S1 Sistem Komputer</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kelas / Rombel</label>
                  <input
                    type="text"
                    value={studentForm.kelas}
                    onChange={(e) => setStudentForm({ ...studentForm, kelas: e.target.value })}
                    placeholder="Contoh: MI 5A"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-xs font-medium"
                  />
                </div>
              </div>

              {/* Status Akun */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Status Akun</label>
                <div className="grid grid-cols-3 gap-2">
                  {['aktif', 'cuti', 'nonaktif'].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStudentForm({ ...studentForm, status: st })}
                      className={`py-2 px-3 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                        studentForm.status === st
                          ? 'bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-100'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Password Initial (Only for new accounts) */}
              {!editingStudent && (
                <div className="space-y-1 pt-1">
                  <label className="font-bold text-slate-700">Kata Sandi Awal (Opsional)</label>
                  <input
                    type="text"
                    value={studentForm.password}
                    onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                    placeholder="Default: Sesuai NIM jika dikosongkan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-xs font-medium"
                  />
                  <p className="text-[10px] text-slate-400">Kata sandi standar otomatis menggunakan NIM mahasiswa.</p>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsAddOpen(false); setEditingStudent(null); }}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                >
                  {editingStudent ? 'Simpan Perubahan' : 'Daftarkan Akun'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ── MODAL: DETAIL AKUN MAHASISWA ─────────────────────────────────── */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Detail Akun Mahasiswa</h3>
              <button
                type="button"
                onClick={() => setViewingStudent(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-600/30">
                {viewingStudent.nama ? viewingStudent.nama.charAt(0).toUpperCase() : 'M'}
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">{viewingStudent.nama}</h4>
                <p className="text-xs font-mono font-bold text-blue-600">{viewingStudent.nim}</p>
                <div className="mt-1">{renderStatusBadge(viewingStudent.status || 'aktif')}</div>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Email Resmi:</span>
                <span className="font-bold text-slate-900">{viewingStudent.email || `${viewingStudent.nim}@student.unsri.ac.id`}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">No. HP / WhatsApp:</span>
                <span className="font-bold text-slate-900">{viewingStudent.no_hp || '-'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Program Studi:</span>
                <span className="font-bold text-slate-900">{viewingStudent.prodi || 'D3 Manajemen Informatika'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Kelas:</span>
                <span className="font-bold text-slate-900">{viewingStudent.kelas || 'MI 5A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Role Sistem:</span>
                <span className="font-bold text-blue-600 uppercase">Mahasiswa</span>
              </div>
              {viewingStudent.judul_ta && (
                <div className="py-2">
                  <span className="text-slate-500 font-semibold block mb-1">Judul Tugas Akhir:</span>
                  <p className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900 font-medium text-[11px] leading-relaxed">
                    "{viewingStudent.judul_ta}"
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const s = viewingStudent;
                  setViewingStudent(null);
                  handleOpenReset(s);
                }}
                className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs flex items-center space-x-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Reset Sandi</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL: RESET PASSWORD MAHASISWA ──────────────────────────────── */}
      {resettingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 font-bold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Reset Kata Sandi Akun</h3>
                <p className="text-xs text-slate-500">Atur ulang kata sandi mahasiswa</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Anda akan mengatur ulang kata sandi untuk akun <span className="font-bold text-slate-900">{resettingStudent.nama}</span> (NIM: {resettingStudent.nim}).
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
                    onClick={() => setNewPasswordInput(resettingStudent.nim)}
                    className="text-blue-600 hover:underline font-bold"
                  >
                    Gunakan NIM ({resettingStudent.nim})
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setResettingStudent(null)}
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

      {/* ── MODAL: KONFIRMASI HAPUS MAHASISWA ────────────────────────────── */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-slate-900">Hapus Akun Mahasiswa?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Apakah Anda yakin ingin menghapus akun <span className="font-bold text-slate-900">{deletingStudent.nama}</span> ({deletingStudent.nim})? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
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
