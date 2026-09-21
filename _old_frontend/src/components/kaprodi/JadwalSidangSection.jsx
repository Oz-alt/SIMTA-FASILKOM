import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  UserCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  FileText,
  Printer,
  X,
  Sparkles,
  Building2,
  ChevronDown,
  ExternalLink,
  BookOpen,
  GraduationCap,
  ArrowLeft
} from 'lucide-react';

export default function JadwalSidangSection({ showHeaderBanner = true }) {
  const {
    currentUser,
    defenseSchedules,
    addDefenseSchedule,
    updateDefenseSchedule,
    deleteDefenseSchedule,
    advisors,
    studentAdvisors,
    getAllRegisteredStudents,
    thesisTitles,
    rooms
  } = useAuth();

  // View Mode: 'list' (tabel & ringkasan) | 'form' (halaman penuh formulir) | 'detail' (halaman cetak undangan)
  const [viewMode, setViewMode] = useState('list');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');

  // Form & Detail State
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Form Initial State
  const initialFormState = {
    mhs_nim: '',
    mhs_nama: '',
    prodi: 'D3 Manajemen Informatika',
    judul: '',
    jenis_sidang: 'Seminar Proposal',
    tanggal: new Date().toISOString().split('T')[0],
    waktu_mulai: '09:00',
    waktu_selesai: '10:30',
    ruangan: 'Ruang Sidang Utama DIPKOM',
    ketua_penguji_nama: '',
    ketua_penguji_nip: '',
    sekretaris_nama: '',
    sekretaris_nip: '',
    penguji1_nama: '',
    penguji1_nip: '',
    penguji2_nama: '',
    penguji2_nip: '',
    status: 'terjadwal',
    catatan: 'Mahasiswa wajib membawa berkas draft rangkap 4 dan berpakaian almamater lengkap.',
    link_berkas: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  // Student list for autocomplete dropdown
  const registeredStudents = useMemo(() => {
    return getAllRegisteredStudents ? getAllRegisteredStudents() : [];
  }, [getAllRegisteredStudents]);

  // Handle Toast
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Buka Halaman Form Tambah
  const handleOpenAdd = () => {
    setEditingSchedule(null);
    setFormData(initialFormState);
    setViewMode('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Buka Halaman Form Edit
  const handleOpenEdit = (sch) => {
    setEditingSchedule(sch);
    setFormData({
      mhs_nim: sch.mhs_nim || '',
      mhs_nama: sch.mhs_nama || '',
      prodi: sch.prodi || 'D3 Manajemen Informatika',
      judul: sch.judul || '',
      jenis_sidang: sch.jenis_sidang || 'Seminar Proposal',
      tanggal: sch.tanggal || new Date().toISOString().split('T')[0],
      waktu_mulai: sch.waktu_mulai || '09:00',
      waktu_selesai: sch.waktu_selesai || '10:30',
      ruangan: sch.ruangan || 'Ruang Sidang Utama DIPKOM',
      ketua_penguji_nama: sch.ketua_penguji_nama || '',
      ketua_penguji_nip: sch.ketua_penguji_nip || '',
      sekretaris_nama: sch.sekretaris_nama || '',
      sekretaris_nip: sch.sekretaris_nip || '',
      penguji1_nama: sch.penguji1_nama || '',
      penguji1_nip: sch.penguji1_nip || '',
      penguji2_nama: sch.penguji2_nama || '',
      penguji2_nip: sch.penguji2_nip || '',
      status: sch.status || 'terjadwal',
      catatan: sch.catatan || '',
      link_berkas: sch.link_berkas || ''
    });
    setViewMode('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Buka Halaman Detail / Cetak
  const handleOpenDetail = (sch) => {
    setSelectedSchedule(sch);
    setViewMode('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Auto-fill when Student is selected
  const handleStudentSelect = (nim) => {
    if (!nim) return;
    const std = registeredStudents.find(s => s.nim === nim);
    if (!std) return;

    // Find assigned dospem if available
    const assignment = (studentAdvisors || []).find(sa => sa.student_nim === nim);
    const adv1 = (advisors || []).find(a => a.nip === assignment?.dospem1_nip);
    const adv2 = (advisors || []).find(a => a.nip === assignment?.dospem2_nip);

    // Find student's approved thesis title
    const titleObj = (thesisTitles || []).find(t => t.mhs_nim === nim || t.profile_id === std.id);

    setFormData(prev => ({
      ...prev,
      mhs_nim: std.nim,
      mhs_nama: std.nama,
      prodi: std.prodi || 'D3 Manajemen Informatika',
      judul: titleObj?.judul || prev.judul || 'Judul Tugas Akhir Belum Terdaftar',
      sekretaris_nama: adv1 ? adv1.nama : prev.sekretaris_nama,
      sekretaris_nip: adv1 ? adv1.nip : prev.sekretaris_nip,
      penguji1_nama: adv2 ? adv2.nama : prev.penguji1_nama,
      penguji1_nip: adv2 ? adv2.nip : prev.penguji1_nip
    }));
  };

  // Handle Form Submit
  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (!formData.mhs_nim || !formData.mhs_nama) {
      alert('Mohon masukkan NIM dan Nama Mahasiswa.');
      return;
    }

    if (!formData.tanggal || !formData.waktu_mulai || !formData.waktu_selesai) {
      alert('Mohon tentukan tanggal dan rentang waktu sidang.');
      return;
    }

    if (!formData.ketua_penguji_nama) {
      alert('Mohon pilih Ketua Penguji sidang.');
      return;
    }

    if (editingSchedule) {
      updateDefenseSchedule(editingSchedule.id, formData);
      showToast(`Jadwal sidang untuk ${formData.mhs_nama} berhasil diperbarui.`);
    } else {
      addDefenseSchedule(formData);
      showToast(`Jadwal sidang baru untuk ${formData.mhs_nama} berhasil ditambahkan.`);
    }

    setViewMode('list');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Delete Schedule
  const handleDelete = (sch) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus jadwal sidang untuk ${sch.mhs_nama}?`)) {
      deleteDefenseSchedule(sch.id);
      showToast(`Jadwal sidang ${sch.mhs_nama} telah dihapus.`);
    }
  };

  // Available room names
  const availableRooms = useMemo(() => {
    const list = rooms && rooms.length > 0 ? rooms.map(r => r.name) : [];
    const defaults = [
      'Ruang Sidang Utama DIPKOM',
      'Ruang Seminar DIPKOM Lt. 2',
      'Ruang Sidang Diklat A',
      'Ruang Sidang Diklat B',
      'Online Zoom Meeting'
    ];
    return Array.from(new Set([...list, ...defaults]));
  }, [rooms]);

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    return (defenseSchedules || []).filter(sch => {
      const matchText = (
        (sch.mhs_nama || '') + ' ' +
        (sch.mhs_nim || '') + ' ' +
        (sch.judul || '') + ' ' +
        (sch.ketua_penguji_nama || '') + ' ' +
        (sch.ruangan || '')
      ).toLowerCase();

      const matchesSearch = matchText.includes(searchTerm.toLowerCase());
      const matchesStage = stageFilter === 'all' || sch.jenis_sidang === stageFilter;
      const matchesStatus = statusFilter === 'all' || sch.status === statusFilter;
      const matchesRoom = roomFilter === 'all' || sch.ruangan === roomFilter;

      return matchesSearch && matchesStage && matchesStatus && matchesRoom;
    });
  }, [defenseSchedules, searchTerm, stageFilter, statusFilter, roomFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = (defenseSchedules || []).length;
    const sempro = (defenseSchedules || []).filter(s => s.jenis_sidang === 'Seminar Proposal').length;
    const semhas = (defenseSchedules || []).filter(s => s.jenis_sidang === 'Seminar Hasil').length;
    const sidangAkhir = (defenseSchedules || []).filter(s => s.jenis_sidang === 'Sidang Akhir').length;
    return { total, sempro, semhas, sidangAkhir };
  }, [defenseSchedules]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs sm:text-sm font-semibold border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAMPILAN 1: HALAMAN FORM PENJADWALAN SIDANG (DEDICATED FULL PAGE VIEW) */}
      {/* ========================================================================= */}
      {viewMode === 'form' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header & Back Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="p-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all flex items-center space-x-2 text-xs font-bold cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Daftar</span>
              </button>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  {editingSchedule ? 'Edit Jadwal Sidang Tugas Akhir' : 'Form Penjadwalan Sidang Tugas Akhir'}
                </h2>
                <p className="text-xs text-slate-500">
                  Lengkapi data mahasiswa, tahapan sidang, ruangan, serta tim dewan penguji.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                form="form-jadwal-sidang"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex items-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingSchedule ? 'Simpan Perubahan' : 'Simpan & Jadwalkan'}</span>
              </button>
            </div>
          </div>

          {/* Form Body - Halaman Penuh */}
          <form id="form-jadwal-sidang" onSubmit={handleFormSubmit} className="space-y-6">
            
            {/* Bagian 1: Data Mahasiswa & Judul */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>1. Identitas Mahasiswa &amp; Tugas Akhir</span>
              </div>

              {/* Pilih Mahasiswa Otomatis */}
              {!editingSchedule && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pilih Mahasiswa Terdaftar (Auto-fill data mahasiswa, judul &amp; pembimbing)
                  </label>
                  <select
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 bg-white font-medium text-xs outline-none transition-all cursor-pointer"
                  >
                    <option value="">-- Pilih Mahasiswa Dari Daftar --</option>
                    {registeredStudents.map(s => (
                      <option key={s.id} value={s.nim}>
                        {s.nama} ({s.nim}) - {s.prodi || 'D3 MI'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    NIM Mahasiswa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.mhs_nim}
                    onChange={(e) => setFormData({ ...formData, mhs_nim: e.target.value.replace(/\D/g, '') })}
                    placeholder="Contoh: 09031182328001"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 font-mono font-semibold text-xs outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Mahasiswa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.mhs_nama}
                    onChange={(e) => setFormData({ ...formData, mhs_nama: e.target.value })}
                    placeholder="Nama lengkap mahasiswa"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 font-medium text-xs outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Judul Tugas Akhir <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  placeholder="Masukkan judul tugas akhir lengkap..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 font-medium text-xs outline-none transition-all leading-relaxed"
                />
              </div>
            </div>

            {/* Bagian 2: Waktu, Jenis & Ruangan */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
                <Clock className="w-5 h-5 text-indigo-600" />
                <span>2. Pelaksanaan Sidang &amp; Ruangan</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tahapan / Jenis Sidang <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.jenis_sidang}
                    onChange={(e) => setFormData({ ...formData, jenis_sidang: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 bg-white font-semibold text-xs outline-none transition-all cursor-pointer"
                  >
                    <option value="Seminar Proposal">Seminar Proposal (Sempro)</option>
                    <option value="Seminar Hasil">Seminar Hasil (Semhas)</option>
                    <option value="Sidang Akhir">Sidang Komprehensif / Akhir</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Ruangan Sidang <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.ruangan}
                    onChange={(e) => setFormData({ ...formData, ruangan: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 bg-white font-medium text-xs outline-none transition-all cursor-pointer"
                  >
                    {availableRooms.map((r, i) => (
                      <option key={i} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tanggal Sidang <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 font-medium text-xs outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Jam Mulai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.waktu_mulai}
                    onChange={(e) => setFormData({ ...formData, waktu_mulai: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 font-medium text-xs outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Jam Selesai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.waktu_selesai}
                    onChange={(e) => setFormData({ ...formData, waktu_selesai: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 font-medium text-xs outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Bagian 3: Susunan Tim Dewan Penguji */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <span>3. Susunan Tim Dewan Penguji</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Ketua Penguji */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Ketua Penguji <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.ketua_penguji_nip}
                    onChange={(e) => {
                      const adv = (advisors || []).find(a => a.nip === e.target.value);
                      setFormData({
                        ...formData,
                        ketua_penguji_nip: e.target.value,
                        ketua_penguji_nama: adv ? adv.nama : ''
                      });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 bg-white font-medium text-xs outline-none transition-all cursor-pointer"
                  >
                    <option value="">-- Pilih Ketua Penguji --</option>
                    {(advisors || []).map(a => (
                      <option key={a.id} value={a.nip}>
                        {a.nama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sekretaris Penguji (Dospem 1) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Sekretaris Penguji (Dospem 1)
                  </label>
                  <select
                    value={formData.sekretaris_nip}
                    onChange={(e) => {
                      const adv = (advisors || []).find(a => a.nip === e.target.value);
                      setFormData({
                        ...formData,
                        sekretaris_nip: e.target.value,
                        sekretaris_nama: adv ? adv.nama : ''
                      });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 bg-white font-medium text-xs outline-none transition-all cursor-pointer"
                  >
                    <option value="">-- Pilih Sekretaris (Dospem 1) --</option>
                    {(advisors || []).map(a => (
                      <option key={a.id} value={a.nip}>
                        {a.nama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Penguji 1 (Dospem 2) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Anggota Penguji 1 (Dospem 2)
                  </label>
                  <select
                    value={formData.penguji1_nip}
                    onChange={(e) => {
                      const adv = (advisors || []).find(a => a.nip === e.target.value);
                      setFormData({
                        ...formData,
                        penguji1_nip: e.target.value,
                        penguji1_nama: adv ? adv.nama : ''
                      });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 bg-white font-medium text-xs outline-none transition-all cursor-pointer"
                  >
                    <option value="">-- Pilih Penguji 1 --</option>
                    {(advisors || []).map(a => (
                      <option key={a.id} value={a.nip}>
                        {a.nama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Penguji 2 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Anggota Penguji 2 / Tamu
                  </label>
                  <select
                    value={formData.penguji2_nip}
                    onChange={(e) => {
                      const adv = (advisors || []).find(a => a.nip === e.target.value);
                      setFormData({
                        ...formData,
                        penguji2_nip: e.target.value,
                        penguji2_nama: adv ? adv.nama : ''
                      });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 bg-white font-medium text-xs outline-none transition-all cursor-pointer"
                  >
                    <option value="">-- Pilih Penguji 2 --</option>
                    {(advisors || []).map(a => (
                      <option key={a.id} value={a.nip}>
                        {a.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Bagian 4: Status, Berkas & Catatan */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>4. Status &amp; Catatan Pengujian</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Status Sidang
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 bg-white font-semibold text-xs outline-none transition-all cursor-pointer"
                  >
                    <option value="terjadwal">Terjadwal</option>
                    <option value="berlangsung">Sedang Berlangsung</option>
                    <option value="selesai">Selesai / Lulus</option>
                    <option value="dibatalkan">Dibatalkan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Link Berkas / Draft Skripsi (Opsional)
                  </label>
                  <input
                    type="url"
                    value={formData.link_berkas}
                    onChange={(e) => setFormData({ ...formData, link_berkas: e.target.value })}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 font-medium text-xs outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Catatan / Instruksi Pengujian
                </label>
                <textarea
                  rows={3}
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  placeholder="Catatan untuk mahasiswa atau dewan penguji..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 font-medium text-xs outline-none transition-all leading-relaxed"
                />
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-7 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex items-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingSchedule ? 'Simpan Perubahan' : 'Simpan & Jadwalkan'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAMPILAN 2: HALAMAN DETAIL & CETAK UNDANGAN SIDANG (FULL PAGE VIEW) */}
      {/* ========================================================================= */}
      {viewMode === 'detail' && selectedSchedule && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-2xs print:hidden">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="p-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all flex items-center space-x-2 text-xs font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Daftar Jadwal</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center space-x-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Undangan Sidang</span>
              </button>
            </div>
          </div>

          {/* Lembar Surat Resmi (Printable Paper) */}
          <div className="bg-white rounded-3xl max-w-3xl mx-auto p-8 sm:p-12 shadow-md border border-slate-200 space-y-6 print:p-0 print:border-none print:shadow-none">
            {/* Header Surat */}
            <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
              <div className="text-xs font-extrabold uppercase tracking-widest text-slate-700">
                KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI
              </div>
              <div className="text-base font-black uppercase tracking-wider text-slate-900">
                UNIVERSITAS SRIWIJAYA - FAKULTAS ILMU KOMPUTER
              </div>
              <div className="text-xs font-bold text-slate-800">
                PROGRAM STUDI D3 MANAJEMEN INFORMATIKA
              </div>
              <p className="text-[11px] text-slate-500 font-serif italic">
                Jl. Raya Palembang-Prabumulih Km. 32 Indralaya, Ogan Ilir, Sumatera Selatan
              </p>
            </div>

            {/* Judul Dokumen */}
            <div className="text-center space-y-1 pt-2">
              <h3 className="text-sm font-extrabold uppercase underline tracking-wide text-slate-900">
                UNDANGAN SIDANG / SEMINAR TUGAS AKHIR
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Nomor: 042/UN9.1.8/TA-DIPKOM/{new Date().getFullYear()}
              </p>
            </div>

            {/* Isi Surat */}
            <div className="space-y-4 text-xs text-slate-800 leading-relaxed pt-2">
              <p>
                Bersama ini diundang kepada Bapak/Ibu Dewan Penguji untuk menghadiri dan menguji pelaksanaan 
                <strong> {selectedSchedule.jenis_sidang} </strong> mahasiswa Tugas Akhir yang akan dilaksanakan pada:
              </p>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500 font-medium">Hari, Tanggal</span>
                  <span className="col-span-2 font-bold text-slate-900">
                    : {new Date(selectedSchedule.tanggal).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500 font-medium">Waktu Sidang</span>
                  <span className="col-span-2 font-bold text-slate-900">
                    : {selectedSchedule.waktu_mulai} - {selectedSchedule.waktu_selesai} WIB
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500 font-medium">Tempat / Ruangan</span>
                  <span className="col-span-2 font-bold text-slate-900">: {selectedSchedule.ruangan}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="font-bold text-slate-900">Mahasiswa yang diuji:</div>
                <div className="pl-4 space-y-1 text-xs">
                  <div><strong>Nama:</strong> {selectedSchedule.mhs_nama}</div>
                  <div><strong>NIM:</strong> {selectedSchedule.mhs_nim}</div>
                  <div><strong>Program Studi:</strong> {selectedSchedule.prodi}</div>
                  <div><strong>Judul Tugas Akhir:</strong> <em>"{selectedSchedule.judul}"</em></div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="font-bold text-slate-900">Susunan Tim Dewan Penguji:</div>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Jabatan Tim Penguji</th>
                        <th className="py-2.5 px-4">Nama Lengkap Dosen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr>
                        <td className="py-2.5 px-4 font-semibold text-slate-600">Ketua Penguji</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{selectedSchedule.ketua_penguji_nama || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-semibold text-slate-600">Sekretaris Penguji (Dospem 1)</td>
                        <td className="py-2.5 px-4 text-slate-800">{selectedSchedule.sekretaris_nama || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-semibold text-slate-600">Anggota Penguji 1 (Dospem 2)</td>
                        <td className="py-2.5 px-4 text-slate-800">{selectedSchedule.penguji1_nama || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-semibold text-slate-600">Anggota Penguji 2</td>
                        <td className="py-2.5 px-4 text-slate-800">{selectedSchedule.penguji2_nama || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedSchedule.catatan && (
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs">
                  <strong>Catatan:</strong> {selectedSchedule.catatan}
                </div>
              )}
            </div>

            {/* Tanda Tangan Kaprodi */}
            <div className="pt-8 flex justify-end text-xs">
              <div className="text-center space-y-14">
                <div>
                  Indralaya, {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}<br />
                  Koordinator Program Studi,
                </div>
                <div>
                  <strong className="underline block text-sm">Dr. Deris Stiawan, M.T., Ph.D.</strong>
                  <span className="text-[11px] text-slate-500">NIP. 197805122003121001</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAMPILAN 3: DAFTAR JADWAL SIDANG (LIST VIEW) */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Optional Header Banner */}
          {showHeaderBanner && (
            <div className="relative rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 overflow-hidden shadow-xl border border-blue-800/40">
              <div className="absolute right-0 top-0 opacity-15 translate-x-10 -translate-y-10 pointer-events-none">
                <CalendarDays className="w-96 h-96 text-white" />
              </div>
              <div className="relative z-10 max-w-3xl space-y-3">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Portal Kaprodi FASILKOM UNSRI</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Manajemen Jadwal Sidang Tugas Akhir
                </h1>
                <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal">
                  Penetapan jadwal Seminar Proposal, Seminar Hasil, dan Sidang Komprehensif / Akhir, alokasi ruangan, serta susunan lengkap tim dewan penguji.
                </p>
              </div>
            </div>
          )}

          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Jadwal</span>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <CalendarDays className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{stats.total}</div>
              <p className="text-[10px] text-slate-500">Semua tahapan sidang</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Seminar Proposal</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-amber-700">{stats.sempro}</div>
              <p className="text-[10px] text-slate-500">Tahap awal pengujian</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Seminar Hasil</span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-blue-700">{stats.semhas}</div>
              <p className="text-[10px] text-slate-500">Tahap validasi hasil</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Sidang Akhir</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-emerald-700">{stats.sidangAkhir}</div>
              <p className="text-[10px] text-slate-500">Ujian komprehensif kelulusan</p>
            </div>
          </div>

          {/* Filter and Action Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari mahasiswa, NIM, judul, penguji..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none focus:border-indigo-600 cursor-pointer"
              >
                <option value="all">Semua Jenis Sidang</option>
                <option value="Seminar Proposal">Seminar Proposal</option>
                <option value="Seminar Hasil">Seminar Hasil</option>
                <option value="Sidang Akhir">Sidang Akhir</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none focus:border-indigo-600 cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="terjadwal">Terjadwal</option>
                <option value="berlangsung">Sedang Berlangsung</option>
                <option value="selesai">Selesai / Lulus</option>
                <option value="dibatalkan">Dibatalkan</option>
              </select>

              <select
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none focus:border-indigo-600 cursor-pointer max-w-[170px] truncate"
              >
                <option value="all">Semua Ruangan</option>
                {availableRooms.map((r, i) => (
                  <option key={i} value={r}>{r}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center space-x-1.5 cursor-pointer ml-auto sm:ml-0"
              >
                <Plus className="w-4 h-4" />
                <span>Jadwalkan Sidang Baru</span>
              </button>
            </div>
          </div>

          {/* Table: Daftar Jadwal Sidang (Compact - Tanpa scroll horizontal) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-3 w-1/5">Mahasiswa &amp; NIM</th>
                  <th className="py-3 px-3 w-1/4">Judul Tugas Akhir</th>
                  <th className="py-3 px-3 w-1/6">Jenis &amp; Ruangan</th>
                  <th className="py-3 px-3 w-1/6">Waktu Sidang</th>
                  <th className="py-3 px-3 w-1/5">Dewan Penguji</th>
                  <th className="py-3 px-2 text-center w-24">Status</th>
                  <th className="py-3 px-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <CalendarDays className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs font-semibold text-slate-600">Belum ada jadwal sidang yang sesuai.</p>
                        <p className="text-[11px] text-slate-400">Klik tombol "Jadwalkan Sidang Baru" untuk menambahkan jadwal.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSchedules.map((sch, index) => {
                    const stageColor =
                      sch.jenis_sidang === 'Sidang Akhir'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : sch.jenis_sidang === 'Seminar Hasil'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200';

                    const statusColor =
                      sch.status === 'selesai'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : sch.status === 'berlangsung'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : sch.status === 'dibatalkan'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200';

                    return (
                      <tr key={sch.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* No */}
                        <td className="py-2.5 px-2 text-center text-[11px] text-slate-400 font-semibold align-top">
                          {index + 1}
                        </td>

                        {/* Mahasiswa */}
                        <td className="py-2.5 px-3 align-top">
                          <div className="font-bold text-slate-900 leading-snug">{sch.mhs_nama}</div>
                          <div className="text-[10px] text-indigo-700 font-mono font-bold">NIM. {sch.mhs_nim}</div>
                          <div className="text-[10px] text-slate-500">{sch.prodi}</div>
                        </td>

                        {/* Judul TA */}
                        <td className="py-2.5 px-3 align-top">
                          <p className="text-[11px] text-slate-800 font-medium leading-relaxed italic line-clamp-2" title={sch.judul}>
                            "{sch.judul}"
                          </p>
                        </td>

                        {/* Jenis & Ruangan */}
                        <td className="py-2.5 px-3 align-top">
                          <div className="space-y-1">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${stageColor}`}>
                              {sch.jenis_sidang}
                            </span>
                            <div className="flex items-center space-x-1 text-[11px] text-slate-600">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[150px]" title={sch.ruangan}>{sch.ruangan}</span>
                            </div>
                          </div>
                        </td>

                        {/* Waktu Sidang */}
                        <td className="py-2.5 px-3 align-top">
                          <div className="space-y-0.5">
                            <div className="font-semibold text-slate-900 text-[11px]">
                              {new Date(sch.tanggal).toLocaleDateString('id-ID', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{sch.waktu_mulai} - {sch.waktu_selesai} WIB</span>
                            </div>
                          </div>
                        </td>

                        {/* Dewan Penguji */}
                        <td className="py-2.5 px-3 align-top">
                          <div className="space-y-0.5 text-[11px]">
                            <div className="text-slate-800">
                              <span className="font-bold text-slate-500 text-[10px]">Ketua: </span>
                              <span className="font-medium">{sch.ketua_penguji_nama || '-'}</span>
                            </div>
                            <div className="text-slate-600 text-[10.5px]">
                              <span className="font-bold text-slate-400 text-[10px]">Sekr: </span>
                              <span>{sch.sekretaris_nama || '-'}</span>
                            </div>
                            {sch.penguji1_nama && (
                              <div className="text-slate-500 text-[10px] truncate max-w-[180px]" title={sch.penguji1_nama}>
                                <span className="font-bold text-slate-400">P1: </span>{sch.penguji1_nama}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-2 text-center align-top">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize border ${statusColor}`}>
                            {sch.status}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="py-2.5 px-3 text-center align-top">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(sch)}
                              title="Lihat Detail & Cetak Undangan"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(sch)}
                              title="Edit Jadwal"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(sch)}
                              title="Hapus Jadwal"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
}
