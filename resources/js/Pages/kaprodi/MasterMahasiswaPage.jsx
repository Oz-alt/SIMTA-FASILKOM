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
  Building2,
  RefreshCw,
  Check
} from 'lucide-react';

export default function MasterMahasiswaPage() {
  const { 
    getAllRegisteredStudents, 
    addStudentUser, 
    updateStudentUser, 
    deleteStudentUser 
  } = useAuth();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);

  // Form State
  const [studentForm, setStudentForm] = useState({
    nim: '',
    nama: '',
    email: '',
    no_hp: '',
    prodi: 'D3 Manajemen Informatika',
    kelas: 'MI 5A',
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
      setIsAddOpen(false);
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

  // Open Edit Modal
  const openEditModal = (student) => {
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
            <GraduationCap className="w-4 h-4" />
            <span>Master Data Mahasiswa</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Kelola Master Data Mahasiswa
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Pusat pendataan akun dan profil seluruh mahasiswa FASILKOM UNSRI. Tambah, perbarui, dan kelola data angkatan serta status keaktifan mahasiswa.
          </p>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Total Mahasiswa</p>
            <p className="text-2xl font-black text-slate-900">{registeredStudents.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Mahasiswa Aktif</p>
            <p className="text-2xl font-black text-slate-900">
              {registeredStudents.filter(s => (s.status || 'aktif') === 'aktif').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Jumlah Kelas</p>
            <p className="text-2xl font-black text-slate-900">
              {availableClasses.filter(c => c !== 'ALL').length} Kelas
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Action Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          {/* Search Bar & Class Filter */}
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Cari NIM, Nama Mahasiswa, Email, No HP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
              />
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL">Semua Kelas</option>
                {availableClasses.filter(c => c !== 'ALL').map(cls => (
                  <option key={cls} value={cls}>Kelas {cls}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Add Button */}
          <button
            type="button"
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
              setIsAddOpen(true);
            }}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Mahasiswa</span>
          </button>

        </div>

        {/* Table View */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider">
                <th className="py-3.5 px-4">NIM</th>
                <th className="py-3.5 px-4">Nama Mahasiswa</th>
                <th className="py-3.5 px-4">Kontak / Email</th>
                <th className="py-3.5 px-4">Prodi &amp; Kelas</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((std) => (
                  <tr key={std.id || std.nim} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {std.nim}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{std.nama}</p>
                    </td>
                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="flex items-center space-x-1.5 text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{std.email || '-'}</span>
                      </div>
                      {std.no_hp && (
                        <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{std.no_hp}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{std.prodi || 'D3 Manajemen Informatika'}</span>
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {std.kelas || 'MI 5A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        (std.status || 'aktif') === 'aktif'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          (std.status || 'aktif') === 'aktif' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`} />
                        <span className="capitalize">{std.status || 'aktif'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(std)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                          title="Edit Data Mahasiswa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingStudent(std)}
                          className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Hapus Data Mahasiswa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <p className="text-sm font-semibold">Tidak ada data mahasiswa ditemukan.</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter kelas.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal Tambah / Edit Mahasiswa */}
      {(isAddOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  {editingStudent ? 'Edit Data Mahasiswa' : 'Tambah Mahasiswa Baru'}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => { setIsAddOpen(false); setEditingStudent(null); }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">NIM Mahasiswa <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    disabled={!!editingStudent}
                    placeholder="Contoh: 09010182428002"
                    value={studentForm.nim}
                    onChange={(e) => setStudentForm({ ...studentForm, nim: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Kelas <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: MI 5A"
                    value={studentForm.kelas}
                    onChange={(e) => setStudentForm({ ...studentForm, kelas: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Lengkap Mahasiswa <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Aulia Azzahra"
                  value={studentForm.nama}
                  onChange={(e) => setStudentForm({ ...studentForm, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Student UNSRI</label>
                  <input
                    type="email"
                    placeholder="nim@student.unsri.ac.id"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">No HP / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={studentForm.no_hp}
                    onChange={(e) => setStudentForm({ ...studentForm, no_hp: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Program Studi</label>
                  <input
                    type="text"
                    disabled
                    value={studentForm.prodi}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 text-slate-600 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status Keaktifan</label>
                  <select
                    value={studentForm.status}
                    onChange={(e) => setStudentForm({ ...studentForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="non-aktif">Non-Aktif / Lulus</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsAddOpen(false); setEditingStudent(null); }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Data</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Mahasiswa */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Hapus Data Mahasiswa?</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              Apakah Anda yakin ingin menghapus mahasiswa <strong className="text-slate-900">{deletingStudent.nama}</strong> ({deletingStudent.nim})?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteStudent}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
