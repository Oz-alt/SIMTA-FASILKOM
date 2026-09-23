import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
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
  AlertCircle,
  Database,
  Building2,
  Tag,
  ShieldCheck,
  RefreshCw,
  Check
} from 'lucide-react';

export default function MasterDataKaprodi() {
  const { 
    getAllRegisteredStudents, 
    addStudentUser, 
    updateStudentUser, 
    deleteStudentUser,
    advisors, 
    addAdvisor, 
    updateAdvisor, 
    deleteAdvisor 
  } = useAuth();

  // Active Tab: 'mahasiswa' | 'dosen'
  const [activeTab, setActiveTab] = useState('mahasiswa');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [dosenStatusFilter, setDosenStatusFilter] = useState('ALL');

  // Modal States - Mahasiswa
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);

  // Form State - Mahasiswa
  const [studentForm, setStudentForm] = useState({
    nim: '',
    nama: '',
    email: '',
    no_hp: '',
    prodi: 'D3 Manajemen Informatika',
    kelas: 'MI 5A',
    status: 'aktif'
  });

  // Modal States - Dosen
  const [isAddDosenOpen, setIsAddDosenOpen] = useState(false);
  const [editingDosen, setEditingDosen] = useState(null);
  const [deletingDosen, setDeletingDosen] = useState(null);

  // Form State - Dosen
  const [dosenForm, setDosenForm] = useState({
    nip: '',
    nama: '',
    email: '',
    no_hp: '',
    prodi: 'D3 Manajemen Informatika',
    keahlian: '',
    kuota_dospem1: 8,
    kuota_dospem2: 8,
    status: 'aktif'
  });

  // Toast Notification
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Registered Students List
  const registeredStudents = useMemo(() => {
    return getAllRegisteredStudents();
  }, [getAllRegisteredStudents]);

  // Unique Classes list for filter
  const availableClasses = useMemo(() => {
    const classes = new Set(registeredStudents.map(s => s.kelas).filter(Boolean));
    return ['ALL', ...Array.from(classes).sort()];
  }, [registeredStudents]);

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    return registeredStudents.filter(std => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        std.nim?.toLowerCase().includes(q) ||
        std.nama?.toLowerCase().includes(q) ||
        std.email?.toLowerCase().includes(q) ||
        std.no_hp?.toLowerCase().includes(q);

      const matchClass = classFilter === 'ALL' || std.kelas === classFilter;
      return matchQuery && matchClass;
    });
  }, [registeredStudents, searchQuery, classFilter]);

  // Filtered Dosen List
  const filteredAdvisors = useMemo(() => {
    return advisors.filter(adv => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        adv.nip?.toLowerCase().includes(q) ||
        adv.nama?.toLowerCase().includes(q) ||
        adv.email?.toLowerCase().includes(q) ||
        (Array.isArray(adv.keahlian) && adv.keahlian.some(k => k.toLowerCase().includes(q)));

      const matchStatus = dosenStatusFilter === 'ALL' || adv.status === dosenStatusFilter;
      return matchQuery && matchStatus;
    });
  }, [advisors, searchQuery, dosenStatusFilter]);

  // Handle Save Student (Add / Edit)
  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!studentForm.nim || !studentForm.nama) {
      showToast('NIM dan Nama Mahasiswa wajib diisi!');
      return;
    }

    if (editingStudent) {
      await updateStudentUser(editingStudent.id || editingStudent.nim, studentForm);
      showToast(`Berhasil memperbarui data mahasiswa ${studentForm.nama}`);
      setEditingStudent(null);
    } else {
      await addStudentUser(studentForm);
      showToast(`Berhasil menambahkan mahasiswa baru ${studentForm.nama}`);
      setIsAddStudentOpen(false);
    }

    // Reset Form
    setStudentForm({
      nim: '',
      nama: '',
      email: '',
      no_hp: '',
      prodi: 'D3 Manajemen Informatika',
      kelas: 'MI 5A',
      status: 'aktif'
    });
  };

  // Handle Delete Student
  const handleDeleteStudent = async () => {
    if (!deletingStudent) return;
    await deleteStudentUser(deletingStudent.id || deletingStudent.nim);
    showToast(`Mahasiswa ${deletingStudent.nama} telah dihapus.`);
    setDeletingStudent(null);
  };

  // Handle Save Dosen (Add / Edit)
  const handleSaveDosen = (e) => {
    e.preventDefault();
    if (!dosenForm.nip || !dosenForm.nama) {
      showToast('NIP dan Nama Dosen wajib diisi!');
      return;
    }

    if (editingDosen) {
      updateAdvisor(editingDosen.id, dosenForm);
      showToast(`Berhasil memperbarui data dosen ${dosenForm.nama}`);
      setEditingDosen(null);
    } else {
      addAdvisor(dosenForm);
      showToast(`Berhasil menambahkan dosen baru ${dosenForm.nama}`);
      setIsAddDosenOpen(false);
    }

    // Reset Form
    setDosenForm({
      nip: '',
      nama: '',
      email: '',
      no_hp: '',
      prodi: 'D3 Manajemen Informatika',
      keahlian: '',
      kuota_dospem1: 8,
      kuota_dospem2: 8,
      status: 'aktif'
    });
  };

  // Handle Delete Dosen
  const handleDeleteDosen = () => {
    if (!deletingDosen) return;
    deleteAdvisor(deletingDosen.id);
    showToast(`Dosen ${deletingDosen.nama} telah dihapus.`);
    setDeletingDosen(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 select-none pb-12">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
            <Database className="w-4 h-4" />
            <span>Portal Data Master Kaprodi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Kelola Master Data Mahasiswa &amp; Dosen
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Pusat pendataan akun mahasiswa dan dosen pembimbing FASILKOM UNSRI. Tambah, perbarui, dan pantau status keaktifan civitas akademika secara terstruktur.
          </p>
        </div>
      </div>

      {/* Tab Switcher & Action Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          
          {/* Main Tabs */}
          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => { setActiveTab('mahasiswa'); setSearchQuery(''); }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'mahasiswa' 
                  ? 'bg-white text-indigo-700 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Data Master Mahasiswa ({registeredStudents.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('dosen'); setSearchQuery(''); }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dosen' 
                  ? 'bg-white text-indigo-700 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Data Master Dosen ({advisors.length})</span>
            </button>
          </div>

          {/* Add New Button */}
          {activeTab === 'mahasiswa' ? (
            <button
              onClick={() => {
                setStudentForm({
                  nim: '',
                  nama: '',
                  email: '',
                  no_hp: '',
                  prodi: 'D3 Manajemen Informatika',
                  kelas: 'MI 5A',
                  status: 'aktif'
                });
                setIsAddStudentOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Mahasiswa Baru</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setDosenForm({
                  nip: '',
                  nama: '',
                  email: '',
                  no_hp: '',
                  prodi: 'D3 Manajemen Informatika',
                  keahlian: '',
                  kuota_dospem1: 8,
                  kuota_dospem2: 8,
                  status: 'aktif'
                });
                setIsAddDosenOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Dosen Baru</span>
            </button>
          )}

        </div>

        {/* Search & Secondary Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'mahasiswa' 
                  ? "Cari NIM, Nama Mahasiswa, Email, atau No HP..." 
                  : "Cari NIP, Nama Dosen, Email, atau Keahlian..."
              }
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs font-medium text-slate-900 bg-white transition-all outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Specific Filters */}
          {activeTab === 'mahasiswa' ? (
            <div className="relative shrink-0">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="pl-8 pr-8 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Kelas / Rombel</option>
                {availableClasses.filter(c => c !== 'ALL').map(c => (
                  <option key={c} value={c}>Kelas {c}</option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          ) : (
            <div className="relative shrink-0">
              <select
                value={dosenStatusFilter}
                onChange={(e) => setDosenStatusFilter(e.target.value)}
                className="pl-8 pr-8 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Status Dosen</option>
                <option value="aktif">Status: Aktif</option>
                <option value="nonaktif">Status: Cuti / Non-aktif</option>
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          )}
        </div>
      </div>

      {/* TAB 1: MAHASISWA CONTENT */}
      {activeTab === 'mahasiswa' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-0">
          
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Menampilkan <strong className="text-slate-900 font-bold">{filteredStudents.length}</strong> mahasiswa terdaftar</span>
            <span className="text-slate-400 text-[11px]">Format NIM UNSRI Resmi</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">NIM</th>
                  <th className="py-3 px-4">Nama Mahasiswa</th>
                  <th className="py-3 px-4">Email Official UNSRI</th>
                  <th className="py-3 px-4">No. HP / WA</th>
                  <th className="py-3 px-4">Prodi &amp; Kelas</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      Tidak ada data mahasiswa ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((std, idx) => (
                    <tr key={std.id || std.nim || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{std.nim}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{std.nama}</div>
                        <div className="text-[10px] text-slate-400 font-medium">Role: Mahasiswa</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {std.email || `${std.nim}@student.unsri.ac.id`}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {std.no_hp || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px] border border-indigo-100">
                          {std.kelas || 'MI 5A'}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">{std.prodi || 'D3 Manajemen Informatika'}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => {
                              setEditingStudent(std);
                              setStudentForm({
                                nim: std.nim || '',
                                nama: std.nama || '',
                                email: std.email || '',
                                no_hp: std.no_hp || '',
                                prodi: std.prodi || 'D3 Manajemen Informatika',
                                kelas: std.kelas || 'MI 5A',
                                status: std.status || 'aktif'
                              });
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Edit Data Mahasiswa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingStudent(std)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Mahasiswa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* TAB 2: DOSEN CONTENT */}
      {activeTab === 'dosen' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-0">
          
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Menampilkan <strong className="text-slate-900 font-bold">{filteredAdvisors.length}</strong> dosen terdaftar</span>
            <span className="text-slate-400 text-[11px]">FASILKOM UNSRI Academic Staff</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">NIP</th>
                  <th className="py-3 px-4">Nama Dosen &amp; Gelar</th>
                  <th className="py-3 px-4">Kontak Email / HP</th>
                  <th className="py-3 px-4">Bidang Keahlian</th>
                  <th className="py-3 px-4 text-center">Kuota Dospem 1/2</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAdvisors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                      Tidak ada data dosen ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredAdvisors.map((adv, idx) => (
                    <tr key={adv.id || adv.nip || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{adv.nip}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{adv.nama}</div>
                        <div className="text-[10px] text-slate-400">{adv.prodi || 'D3 Manajemen Informatika'}</div>
                      </td>
                      <td className="py-3 px-4 space-y-0.5">
                        <div className="text-slate-700 font-mono text-[11px] flex items-center space-x-1">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{adv.email}</span>
                        </div>
                        {adv.no_hp && (
                          <div className="text-slate-500 font-mono text-[10px] flex items-center space-x-1">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{adv.no_hp}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(adv.keahlian) ? (
                            adv.keahlian.map((k, kIdx) => (
                              <span key={kIdx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                                {k}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                              {adv.keahlian || 'Umum'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="font-bold text-indigo-700">
                          {adv.kuota_dospem1 || 8} <span className="text-slate-400 font-normal">/</span> {adv.kuota_dospem2 || 8}
                        </div>
                        <div className="text-[9px] text-slate-400 uppercase">Maks Mahasiswa</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          adv.status === 'aktif' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {adv.status === 'aktif' ? 'Aktif' : 'Non-aktif'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => {
                              setEditingDosen(adv);
                              setDosenForm({
                                nip: adv.nip || '',
                                nama: adv.nama || '',
                                email: adv.email || '',
                                no_hp: adv.no_hp || '',
                                prodi: adv.prodi || 'D3 Manajemen Informatika',
                                keahlian: Array.isArray(adv.keahlian) ? adv.keahlian.join(', ') : (adv.keahlian || ''),
                                kuota_dospem1: adv.kuota_dospem1 || 8,
                                kuota_dospem2: adv.kuota_dospem2 || 8,
                                status: adv.status || 'aktif'
                              });
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Edit Data Dosen"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingDosen(adv)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Dosen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* MODAL MAHASISWA: TAMBAH / EDIT */}
      {(isAddStudentOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <span>{editingStudent ? 'Edit Data Mahasiswa' : 'Tambah Mahasiswa Baru'}</span>
              </h3>
              <button 
                onClick={() => { setIsAddStudentOpen(false); setEditingStudent(null); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">NIM Mahasiswa <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={studentForm.nim}
                  onChange={(e) => setStudentForm({ ...studentForm, nim: e.target.value })}
                  placeholder="Contoh: 09010182428002"
                  disabled={!!editingStudent}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none font-mono text-slate-900 disabled:bg-slate-100"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Lengkap <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={studentForm.nama}
                  onChange={(e) => setStudentForm({ ...studentForm, nama: e.target.value })}
                  placeholder="Masukkan nama lengkap mahasiswa"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email UNSRI</label>
                  <input
                    type="email"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    placeholder="name@student.unsri.ac.id"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">No. HP / WA</label>
                  <input
                    type="text"
                    value={studentForm.no_hp}
                    onChange={(e) => setStudentForm({ ...studentForm, no_hp: e.target.value })}
                    placeholder="0812xxxxxxxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Program Studi</label>
                  <select
                    value={studentForm.prodi}
                    onChange={(e) => setStudentForm({ ...studentForm, prodi: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-900"
                  >
                    <option value="D3 Manajemen Informatika">D3 Manajemen Informatika</option>
                    <option value="S1 Teknik Informatika">S1 Teknik Informatika</option>
                    <option value="S1 Sistem Informasi">S1 Sistem Informasi</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kelas / Rombel</label>
                  <input
                    type="text"
                    value={studentForm.kelas}
                    onChange={(e) => setStudentForm({ ...studentForm, kelas: e.target.value })}
                    placeholder="Contoh: MI 5A"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => { setIsAddStudentOpen(false); setEditingStudent(null); }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md cursor-pointer"
                >
                  Simpan Data Mahasiswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DOSEN: TAMBAH / EDIT */}
      {(isAddDosenOpen || editingDosen) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <span>{editingDosen ? 'Edit Data Dosen' : 'Tambah Dosen Baru'}</span>
              </h3>
              <button 
                onClick={() => { setIsAddDosenOpen(false); setEditingDosen(null); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDosen} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">NIP Dosen <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={dosenForm.nip}
                  onChange={(e) => setDosenForm({ ...dosenForm, nip: e.target.value })}
                  placeholder="Contoh: 198509152010121004"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none font-mono text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Lengkap &amp; Gelar <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={dosenForm.nama}
                  onChange={(e) => setDosenForm({ ...dosenForm, nama: e.target.value })}
                  placeholder="Contoh: Dr. Ir. Hendra Kusuma, M.T."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email UNSRI</label>
                  <input
                    type="email"
                    value={dosenForm.email}
                    onChange={(e) => setDosenForm({ ...dosenForm, email: e.target.value })}
                    placeholder="dosen@unsri.ac.id"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">No. HP / WA</label>
                  <input
                    type="text"
                    value={dosenForm.no_hp}
                    onChange={(e) => setDosenForm({ ...dosenForm, no_hp: e.target.value })}
                    placeholder="0812xxxxxxxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Bidang Keahlian / Riset (pisahkan dengan koma)</label>
                <input
                  type="text"
                  value={dosenForm.keahlian}
                  onChange={(e) => setDosenForm({ ...dosenForm, keahlian: e.target.value })}
                  placeholder="Contoh: Sistem Informasi, Web, Database"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kuota Dospem 1</label>
                  <input
                    type="number"
                    value={dosenForm.kuota_dospem1}
                    onChange={(e) => setDosenForm({ ...dosenForm, kuota_dospem1: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kuota Dospem 2</label>
                  <input
                    type="number"
                    value={dosenForm.kuota_dospem2}
                    onChange={(e) => setDosenForm({ ...dosenForm, kuota_dospem2: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status Keaktifan</label>
                  <select
                    value={dosenForm.status}
                    onChange={(e) => setDosenForm({ ...dosenForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-900 font-bold"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Non-aktif</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => { setIsAddDosenOpen(false); setEditingDosen(null); }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md cursor-pointer"
                >
                  Simpan Data Dosen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HAPUS MAHASISWA */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Hapus Data Mahasiswa?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus data mahasiswa <strong className="text-slate-900">{deletingStudent.nama}</strong> (NIM: {deletingStudent.nim})? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center space-x-2 justify-center pt-2">
              <button
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteStudent}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HAPUS DOSEN */}
      {deletingDosen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Hapus Data Dosen?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus data dosen <strong className="text-slate-900">{deletingDosen.nama}</strong> (NIP: {deletingDosen.nip})?
              </p>
            </div>
            <div className="flex items-center space-x-2 justify-center pt-2">
              <button
                onClick={() => setDeletingDosen(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteDosen}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
