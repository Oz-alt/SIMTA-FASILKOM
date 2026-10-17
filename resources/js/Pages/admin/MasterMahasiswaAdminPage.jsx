import React, { useState, useMemo, useEffect } from 'react';
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
  ShieldCheck, 
  AlertTriangle, 
  Download, 
  Eye, 
  ChevronDown, 
  Calendar, 
  Building2, 
  Sparkles, 
  Check, 
  FileSpreadsheet,
  Layers,
  Clock,
  UserCheck,
  UserX
} from 'lucide-react';
import { getStudentSemester, AVAILABLE_SEMESTERS } from '../../lib/academicUtils.js';

export default function MasterMahasiswaAdminPage() {
  const { 
    getAllMahasiswaAccounts, 
    addMahasiswaAccount, 
    updateMahasiswaAccount, 
    deleteMahasiswaAccount,
    thesisTitles = []
  } = useAuth();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('Semua Semester');
  const [prodiFilter, setProdiFilter] = useState('ALL');

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [statusManagingStudent, setStatusManagingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);

  // Form State for Add / Edit
  const [studentForm, setStudentForm] = useState({
    nim: '',
    nama: '',
    email: '',
    no_hp: '',
    prodi: 'D3 Manajemen Informatika',
    kelas: 'MI 5A',
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
    const isModalOpen = Boolean(isAddOpen || editingStudent || viewingStudent || statusManagingStudent || deletingStudent);
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAddOpen, editingStudent, viewingStudent, statusManagingStudent, deletingStudent]);

  // Master Mahasiswa Dataset
  const rawMahasiswaList = useMemo(() => {
    return getAllMahasiswaAccounts ? getAllMahasiswaAccounts() : [];
  }, [getAllMahasiswaAccounts]);

  // Dynamic filter lists
  const availableClasses = useMemo(() => {
    const classes = new Set(rawMahasiswaList.map(s => s.kelas).filter(Boolean));
    return ['ALL', ...Array.from(classes).sort()];
  }, [rawMahasiswaList]);

  const availableProdis = useMemo(() => {
    const prodis = new Set(rawMahasiswaList.map(s => s.prodi).filter(Boolean));
    return ['ALL', ...Array.from(prodis).sort()];
  }, [rawMahasiswaList]);

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    return rawMahasiswaList.filter(std => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        (std.nim && String(std.nim).toLowerCase().includes(q)) ||
        (std.nama && std.nama.toLowerCase().includes(q)) ||
        (std.email && std.email.toLowerCase().includes(q)) ||
        (std.no_hp && String(std.no_hp).toLowerCase().includes(q));

      const matchStatus = statusFilter === 'ALL' || (std.status || 'aktif').toLowerCase() === statusFilter.toLowerCase();
      const matchClass = classFilter === 'ALL' || std.kelas === classFilter;
      const matchSemester = semesterFilter === 'Semua Semester' || getStudentSemester(std) === semesterFilter;
      const matchProdi = prodiFilter === 'ALL' || std.prodi === prodiFilter;

      return matchQuery && matchStatus && matchClass && matchSemester && matchProdi;
    });
  }, [rawMahasiswaList, searchQuery, statusFilter, classFilter, semesterFilter, prodiFilter]);

  // Statistics Summary
  const totalMahasiswa = rawMahasiswaList.length;
  const totalAktif = rawMahasiswaList.filter(s => (s.status || 'aktif') === 'aktif').length;
  const totalCuti = rawMahasiswaList.filter(s => s.status === 'cuti').length;
  const totalNonaktif = rawMahasiswaList.filter(s => s.status === 'nonaktif' || s.status === 'ditangguhkan').length;

  // Open Add Modal
  const handleOpenAdd = () => {
    setStudentForm({
      nim: '',
      nama: '',
      email: '',
      no_hp: '',
      prodi: 'D3 Manajemen Informatika',
      kelas: 'MI 5A',
      status: 'aktif'
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
      status: student.status || 'aktif'
    });
  };

  // Open Status Management Modal
  const handleOpenStatusModal = (student) => {
    setStatusManagingStudent(student);
    setTargetStatus(student.status || 'aktif');
  };

  // Save Student (Add / Edit)
  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!studentForm.nim || !studentForm.nama) {
      showToast('NIM dan Nama Mahasiswa wajib diisi!');
      return;
    }

    const emailToUse = studentForm.email?.trim() || `${studentForm.nim.trim()}@student.unsri.ac.id`;

    if (editingStudent) {
      await updateMahasiswaAccount(editingStudent.id || editingStudent.nim, {
        ...studentForm,
        email: emailToUse
      });
      showToast(`Data master mahasiswa ${studentForm.nama} berhasil diperbarui.`);
      setEditingStudent(null);
    } else {
      await addMahasiswaAccount({
        ...studentForm,
        email: emailToUse
      });
      showToast(`Mahasiswa baru ${studentForm.nama} berhasil ditambahkan ke data master.`);
      setIsAddOpen(false);
    }
  };

  // Save Quick Status Update
  const handleSaveStatusUpdate = async () => {
    if (!statusManagingStudent) return;
    await updateMahasiswaAccount(statusManagingStudent.id || statusManagingStudent.nim, {
      status: targetStatus
    });
    showToast(`Status mahasiswa ${statusManagingStudent.nama} diubah menjadi "${targetStatus}".`);
    setStatusManagingStudent(null);
  };

  // Delete Student
  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    await deleteMahasiswaAccount(deletingStudent.id || deletingStudent.nim);
    showToast(`Mahasiswa ${deletingStudent.nama} telah dihapus dari data master.`);
    setDeletingStudent(null);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['NIM', 'Nama Mahasiswa', 'Email', 'No HP', 'Program Studi', 'Kelas', 'Semester', 'Status Mahasiswa'];
    const rows = filteredStudents.map(std => [
      `"${std.nim || ''}"`,
      `"${(std.nama || '').replace(/"/g, '""')}"`,
      `"${std.email || ''}"`,
      `"${std.no_hp || '-'}"`,
      `"${std.prodi || 'D3 Manajemen Informatika'}"`,
      `"${std.kelas || '-'}"`,
      `"${getStudentSemester(std)}"`,
      `"${std.status || 'aktif'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `data_master_mahasiswa_simta_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Data master mahasiswa berhasil diunduh dalam format CSV.');
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
      case 'cuti':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Cuti
          </span>
        );
      case 'lulus':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Lulus
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

  // Find thesis info for viewing student
  const studentThesis = useMemo(() => {
    if (!viewingStudent) return null;
    return thesisTitles.find(t => String(t.mhs_nim || '').trim() === String(viewingStudent.nim || '').trim());
  }, [viewingStudent, thesisTitles]);

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
            <h1 className="text-2xl font-extrabold tracking-tight">Data Master Mahasiswa</h1>
            <p className="text-xs sm:text-sm text-indigo-100/90 mt-1 max-w-2xl leading-relaxed">
              Kelola data master biodata mahasiswa, identitas NIM, program studi, pembagian kelas, semester, serta status keaktifan akademik terintegrasi database sistem.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
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
              <span>Tambah Mahasiswa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1 hover:border-indigo-300 transition-all">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Mahasiswa</div>
          <div className="text-2xl font-extrabold text-slate-900 flex items-center justify-between">
            <span>{totalMahasiswa}</span>
            <Users className="w-6 h-6 text-indigo-500/40" />
          </div>
          <p className="text-[11px] text-slate-500">Tercatat di data master SIMTA</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1 hover:border-emerald-300 transition-all">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status Aktif</div>
          <div className="text-2xl font-extrabold text-emerald-600 flex items-center justify-between">
            <span>{totalAktif}</span>
            <UserCheck className="w-6 h-6 text-emerald-500/40" />
          </div>
          <p className="text-[11px] text-emerald-600/80 font-medium">Memiliki hak akses layanan TA</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1 hover:border-amber-300 transition-all">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status Cuti</div>
          <div className="text-2xl font-extrabold text-amber-600 flex items-center justify-between">
            <span>{totalCuti}</span>
            <AlertTriangle className="w-6 h-6 text-amber-500/40" />
          </div>
          <p className="text-[11px] text-slate-500">Tercatat cuti semester berjalan</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1 hover:border-slate-300 transition-all">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nonaktif / Lainnya</div>
          <div className="text-2xl font-extrabold text-slate-600 flex items-center justify-between">
            <span>{totalNonaktif}</span>
            <UserX className="w-6 h-6 text-slate-400/40" />
          </div>
          <p className="text-[11px] text-slate-500">Akun dibekukan atau nonaktif</p>
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
              placeholder="Cari berdasarkan NIM, Nama Mahasiswa, Email, atau No. Handphone..."
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
                <option value="cuti">Cuti</option>
                <option value="nonaktif">Nonaktif</option>
                <option value="lulus">Lulus</option>
              </select>
            </div>

            {/* Semester Filter */}
            <div className="flex items-center space-x-1.5">
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {AVAILABLE_SEMESTERS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Class Filter */}
            <div className="flex items-center space-x-1.5">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Semua Kelas</option>
                {availableClasses.filter(c => c !== 'ALL').map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            {/* Reset Filter Button */}
            {(searchQuery || statusFilter !== 'ALL' || classFilter !== 'ALL' || semesterFilter !== 'Semua Semester' || prodiFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setClassFilter('ALL');
                  setSemesterFilter('Semua Semester');
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
                <th className="py-3.5 px-4">Mahasiswa</th>
                <th className="py-3.5 px-4">Kontak</th>
                <th className="py-3.5 px-4">Program Studi & Kelas</th>
                <th className="py-3.5 px-4">Semester</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <GraduationCap className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-sm text-slate-600">Tidak ada data mahasiswa ditemukan</p>
                    <p className="text-xs text-slate-400 mt-0.5">Coba sesuaikan kata kunci pencarian atau reset filter di atas.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std) => (
                  <tr key={std.id || std.nim} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Mahasiswa Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                          {std.nama ? std.nama.charAt(0).toUpperCase() : 'M'}
                        </div>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setViewingStudent(std)}
                            className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-left truncate block cursor-pointer"
                          >
                            {std.nama}
                          </button>
                          <div className="text-[11px] font-mono text-slate-500 font-medium">{std.nim}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5 text-slate-600 text-[11px]">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{std.email || `${std.nim}@student.unsri.ac.id`}</span>
                        </div>
                        {std.no_hp && std.no_hp !== '-' && (
                          <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{std.no_hp}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Prodi & Kelas */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{std.prodi || 'D3 Manajemen Informatika'}</div>
                      <div className="inline-flex items-center px-2 py-0.5 mt-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                        {std.kelas || 'MI 5A'}
                      </div>
                    </td>

                    {/* Semester */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {getStudentSemester(std)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleOpenStatusModal(std)}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        title="Klik untuk ubah status cepat"
                      >
                        {renderStatusBadge(std.status)}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        
                        {/* Detail */}
                        <button
                          type="button"
                          onClick={() => setViewingStudent(std)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Lihat Detail Lengkap"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(std)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit Data Master"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Kelola Status */}
                        <button
                          type="button"
                          onClick={() => handleOpenStatusModal(std)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="Kelola Status Mahasiswa"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setDeletingStudent(std)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Mahasiswa"
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

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            Menampilkan <span className="font-bold text-slate-800">{filteredStudents.length}</span> dari <span className="font-bold text-slate-800">{totalMahasiswa}</span> mahasiswa terdaftar
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <span>Sinkronisasi otomatis dengan Database Supabase &amp; Local Storage</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: DETAIL MAHASISWA */}
      {/* ============================================================== */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 relative space-y-5 animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md shadow-indigo-600/30">
                  {viewingStudent.nama ? viewingStudent.nama.charAt(0).toUpperCase() : 'M'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{viewingStudent.nama}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="font-mono text-xs text-slate-500 font-semibold">{viewingStudent.nim}</span>
                    <span className="text-slate-300">•</span>
                    {renderStatusBadge(viewingStudent.status)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingStudent(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Academic & Identity Cards */}
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Data Akademik</div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Program Studi:</span>
                    <span className="font-bold text-slate-800">{viewingStudent.prodi || 'D3 Manajemen Informatika'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Kelas:</span>
                    <span className="font-bold text-slate-800">{viewingStudent.kelas || 'MI 5A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Semester:</span>
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 inline-block mt-0.5">
                      {getStudentSemester(viewingStudent)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Peran Pengguna:</span>
                    <span className="font-bold text-slate-800 capitalize">{viewingStudent.role || 'Mahasiswa'}</span>
                  </div>
                </div>
              </div>

              {/* Contact Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Informasi Kontak</div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      Email Universitas:
                    </span>
                    <span className="font-mono font-medium text-slate-900">{viewingStudent.email || `${viewingStudent.nim}@student.unsri.ac.id`}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      No. WhatsApp / HP:
                    </span>
                    <span className="font-mono font-medium text-slate-900">{viewingStudent.no_hp || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Thesis Progress Snapshot */}
              <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100 space-y-2 text-xs">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 flex items-center justify-between">
                  <span>Status Tugas Akhir</span>
                  {studentThesis ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {studentThesis.status === 'judul_fix' ? 'Judul Fix' : studentThesis.status === 'disetujui' ? 'Disetujui' : 'Dalam Proses'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                      Belum Mengajukan
                    </span>
                  )}
                </div>
                {studentThesis ? (
                  <div className="space-y-1 text-slate-700">
                    <p className="font-bold text-slate-900 line-clamp-2">"{studentThesis.judul}"</p>
                    <p className="text-[11px] text-slate-600">
                      Pembimbing 1: <span className="font-semibold">{studentThesis.pembimbing_1_nama || studentThesis.pembimbing_1 || '-'}</span>
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Pembimbing 2: <span className="font-semibold">{studentThesis.pembimbing_2_nama || studentThesis.pembimbing_2 || '-'}</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">Mahasiswa belum mengusulkan judul Tugas Akhir pada sistem SIMTA.</p>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const s = viewingStudent;
                  setViewingStudent(null);
                  handleOpenEdit(s);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all cursor-pointer shadow-sm"
              >
                Edit Data Mahasiswa
              </button>
              <button
                type="button"
                onClick={() => setViewingStudent(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: TAMBAH / EDIT MAHASISWA */}
      {/* ============================================================== */}
      {(isAddOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingStudent ? 'Edit Data Master Mahasiswa' : 'Tambah Mahasiswa Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Pastikan data NIM dan Program Studi sesuai kurikulum Fasilkom.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingStudent(null);
                }}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3.5 text-xs">
              
              {/* NIM */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nomor Induk Mahasiswa (NIM) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingStudent)}
                  value={studentForm.nim}
                  onChange={(e) => setStudentForm({ ...studentForm, nim: e.target.value })}
                  placeholder="Contoh: 09010182428019"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nama Lengkap Mahasiswa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studentForm.nama}
                  onChange={(e) => setStudentForm({ ...studentForm, nama: e.target.value })}
                  placeholder="Contoh: Rahmat Hidayatullah"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Email Mahasiswa</label>
                <input
                  type="email"
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  placeholder={studentForm.nim ? `${studentForm.nim}@student.unsri.ac.id` : 'mahasiswa@student.unsri.ac.id'}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Biarkan kosong untuk otomatis memakai email NIM@student.unsri.ac.id</span>
              </div>

              {/* No HP */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">No. Handphone / WhatsApp</label>
                <input
                  type="text"
                  value={studentForm.no_hp}
                  onChange={(e) => setStudentForm({ ...studentForm, no_hp: e.target.value })}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Prodi & Kelas Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Program Studi</label>
                  <select
                    value={studentForm.prodi}
                    onChange={(e) => setStudentForm({ ...studentForm, prodi: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="D3 Manajemen Informatika">D3 Manajemen Informatika</option>
                    <option value="D3 Komputerisasi Akuntansi">D3 Komputerisasi Akuntansi</option>
                    <option value="S1 Sistem Informasi">S1 Sistem Informasi</option>
                    <option value="S1 Teknik Informatika">S1 Teknik Informatika</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Kelas</label>
                  <input
                    type="text"
                    value={studentForm.kelas}
                    onChange={(e) => setStudentForm({ ...studentForm, kelas: e.target.value })}
                    placeholder="Contoh: MI 5A"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Status Keaktifan</label>
                <select
                  value={studentForm.status}
                  onChange={(e) => setStudentForm({ ...studentForm, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="aktif">Aktif</option>
                  <option value="cuti">Cuti</option>
                  <option value="nonaktif">Nonaktif</option>
                  <option value="lulus">Lulus</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md shadow-blue-600/30"
                >
                  {editingStudent ? 'Simpan Perubahan' : 'Tambahkan Mahasiswa'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: KELOLA STATUS CEPAT */}
      {/* ============================================================== */}
      {statusManagingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative space-y-4 animate-in zoom-in-95">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Kelola Status Mahasiswa</h3>
                <p className="text-[11px] text-slate-500">{statusManagingStudent.nama}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block text-slate-700 font-bold">Pilih Status Baru:</label>
              <div className="grid grid-cols-2 gap-2">
                {['aktif', 'cuti', 'nonaktif', 'lulus'].map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setTargetStatus(st)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all text-center cursor-pointer ${
                      targetStatus === st
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setStatusManagingStudent(null)}
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
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative space-y-4 animate-in zoom-in-95">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Hapus Mahasiswa?</h3>
                <p className="text-[11px] text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              Apakah Anda yakin ingin menghapus mahasiswa <span className="font-bold text-slate-900">{deletingStudent.nama}</span> (NIM: {deletingStudent.nim}) dari data master SIMTA?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
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

    </div>
  );
}
