import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link } from '@inertiajs/react';
import { getStudentSemester, AVAILABLE_SEMESTERS } from '../../lib/academicUtils.js';
import StatusBadge from '../../Components/common/StatusBadge.jsx';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  GraduationCap, 
  UserCheck, 
  Users, 
  Edit3, 
  CheckCheck, 
  Send, 
  AlertCircle, 
  AlertTriangle,
  X,
  Info
} from 'lucide-react';

export default function ManajemenTAPage() {
  const { thesisTitles, advisors, updateThesisTitleAdvisors, confirmThesisAdvisors } = useAuth();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('Semua Semester');
  const [confirmFilter, setConfirmFilter] = useState('all'); // 'all' | 'confirmed' | 'unconfirmed'

  // Toast
  const [toastMessage, setToastMessage] = useState('');

  // Modals state
  const [editingTitle, setEditingTitle] = useState(null);
  const [editDospem1Nip, setEditDospem1Nip] = useState('');
  const [editDospem2Nip, setEditDospem2Nip] = useState('');
  const [editError, setEditError] = useState('');

  const [confirmingTitle, setConfirmingTitle] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Helper to resolve advisor NIP from advisor name
  const resolveNipFromName = (name) => {
    if (!name) return '';
    const clean = String(name).toLowerCase().trim();
    const found = advisors.find(a => 
      a.nama.toLowerCase().includes(clean) || 
      clean.includes(a.nama.toLowerCase())
    );
    return found ? found.nip : '';
  };

  // Filter approved thesis titles
  const approvedTitles = useMemo(() => {
    return thesisTitles.filter(t => t.status === 'disetujui');
  }, [thesisTitles]);

  // Filtered titles
  const filteredTitles = useMemo(() => {
    return approvedTitles.filter(t => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        t.mhs_nama?.toLowerCase().includes(q) ||
        t.mhs_nim?.toLowerCase().includes(q) ||
        t.judul?.toLowerCase().includes(q) ||
        t.mhs_kelas?.toLowerCase().includes(q) ||
        t.pembimbing_1_nama?.toLowerCase().includes(q) ||
        t.pembimbing_2_nama?.toLowerCase().includes(q) ||
        t.pembimbing_1?.toLowerCase().includes(q) ||
        t.pembimbing_2?.toLowerCase().includes(q);

      const sem = getStudentSemester(t);
      const matchSemester = semesterFilter === 'Semua Semester' || sem === semesterFilter;

      const isConfirmed = Boolean(t.dospem_confirmed);
      const matchConfirm = 
        confirmFilter === 'all' ? true :
        confirmFilter === 'confirmed' ? isConfirmed :
        confirmFilter === 'unconfirmed' ? !isConfirmed : true;

      return matchSearch && matchSemester && matchConfirm;
    });
  }, [approvedTitles, searchQuery, semesterFilter, confirmFilter]);

  // Counts
  const confirmedCount = useMemo(() => approvedTitles.filter(t => t.dospem_confirmed).length, [approvedTitles]);
  const unconfirmedCount = approvedTitles.length - confirmedCount;

  // Open Edit Dospem Modal
  const handleOpenEdit = (t) => {
    setEditingTitle(t);
    const d1 = t.pembimbing_1_nip || resolveNipFromName(t.pembimbing_1_nama || t.pembimbing_1);
    const d2 = t.pembimbing_2_nip || resolveNipFromName(t.pembimbing_2_nama || t.pembimbing_2);
    setEditDospem1Nip(d1 || '');
    setEditDospem2Nip(d2 || '');
    setEditError('');
  };

  // Save Edit Dospem
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingTitle) return;

    if (editDospem1Nip && editDospem2Nip && editDospem1Nip === editDospem2Nip) {
      setEditError('Pembimbing 1 dan Pembimbing 2 tidak boleh dosen yang sama.');
      return;
    }

    updateThesisTitleAdvisors(editingTitle.id, editDospem1Nip, editDospem2Nip);
    showToast(`Dosen pembimbing untuk ${editingTitle.mhs_nama} berhasil diperbarui. Silakan klik tombol "Confirm" untuk mengirim notifikasi resmi.`);
    setEditingTitle(null);
  };

  // Open Confirm Modal
  const handleOpenConfirm = (t) => {
    setConfirmingTitle(t);
  };

  // Confirm Thesis Advisors
  const handleExecuteConfirm = () => {
    if (!confirmingTitle) return;

    confirmThesisAdvisors(confirmingTitle.id);
    showToast(`Penetapan Dospem untuk ${confirmingTitle.mhs_nama} berhasil dikonfirmasi! Notifikasi resmi telah dikirim ke Dosen & Mahasiswa.`);
    setConfirmingTitle(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs sm:text-sm font-semibold border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <span>Manajemen Tugas Akhir Mahasiswa</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Kelola tugas akhir aktif mahasiswa yang telah disetujui, sesuaikan dosen pembimbing, dan konfirmasi penetapan resmi untuk mengirimkan notifikasi penugasan ke dosen dan mahasiswa.
        </p>
      </div>

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total TA Aktif (ACC)</div>
          <div className="text-2xl font-extrabold text-indigo-600 flex items-center justify-between">
            <span>{approvedTitles.length} Mahasiswa</span>
            <BookOpen className="w-6 h-6 text-indigo-500/30" />
          </div>
          <p className="text-[11px] text-slate-500">Judul telah resmi disetujui oleh Kaprodi</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dospem Dikonfirmasi</div>
          <div className="text-2xl font-extrabold text-emerald-600 flex items-center justify-between">
            <span>{confirmedCount} Mahasiswa</span>
            <CheckCheck className="w-6 h-6 text-emerald-500/30" />
          </div>
          <p className="text-[11px] text-slate-500">Notifikasi resmi telah terkirim ke dosen &amp; mhs</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Menunggu Konfirmasi</div>
          <div className="text-2xl font-extrabold text-amber-600 flex items-center justify-between">
            <span>{unconfirmedCount} Mahasiswa</span>
            <Clock className="w-6 h-6 text-amber-500/30" />
          </div>
          <p className="text-[11px] text-slate-500">Dospem perlu dikonfirmasi agar notif dikirim</p>
        </div>

      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama mahasiswa, NIM, judul, dospem..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm outline-none transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Semester Filter */}
          <div className="flex items-center space-x-1.5">
            <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none focus:border-indigo-600 cursor-pointer"
            >
              {AVAILABLE_SEMESTERS.map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>

          {/* Status Konfirmasi Filter */}
          <div className="flex items-center space-x-1.5">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={confirmFilter}
              onChange={(e) => setConfirmFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none focus:border-indigo-600 cursor-pointer"
            >
              <option value="all">Semua Status Konfirmasi ({approvedTitles.length})</option>
              <option value="unconfirmed">Menunggu Konfirmasi ({unconfirmedCount})</option>
              <option value="confirmed">Sudah Dikonfirmasi ({confirmedCount})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span>Daftar Tugas Akhir Mahasiswa Aktif</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Gunakan tombol icon <span className="font-semibold text-indigo-600">Edit</span> untuk mengubah pembimbing, atau <span className="font-semibold text-emerald-600">Confirm</span> untuk menetapkan dan mengirim notifikasi ke dosen serta mahasiswa.
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-600">
            Menampilkan <span className="text-indigo-600 font-bold">{filteredTitles.length}</span> data
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-2 w-8 text-center">No</th>
                <th className="py-3 px-2.5 w-[22%]">Mahasiswa</th>
                <th className="py-3 px-3">Judul Tugas Akhir</th>
                <th className="py-3 px-2.5 w-[23%]">Dosen Pembimbing</th>
                <th className="py-3 px-1 text-center w-28">Status</th>
                <th className="py-3 px-1 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTitles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-slate-700 text-xs">Tidak ada data Tugas Akhir yang sesuai.</p>
                      <p className="text-[11px] text-slate-400">
                        Pengajuan TA yang di-ACC dari halaman "Tinjau Pengajuan TA" akan otomatis masuk ke sini.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTitles.map((t, idx) => {
                  const studentSem = getStudentSemester(t);
                  const isConfirmed = Boolean(t.dospem_confirmed);
                  const d1Nama = t.pembimbing_1_nama || t.pembimbing_1 || '-';
                  const d2Nama = t.pembimbing_2_nama || t.pembimbing_2 || '-';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      
                      {/* No */}
                      <td className="py-3 px-2 text-center font-bold text-slate-400 align-middle">
                        {idx + 1}
                      </td>

                      {/* Mahasiswa */}
                      <td className="py-3 px-2.5 font-semibold text-slate-900 align-middle">
                        <div className="font-bold text-slate-900 text-xs truncate" title={t.mhs_nama}>
                          {t.mhs_nama}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono flex flex-wrap items-center gap-1 mt-0.5">
                          <span>{t.mhs_nim}</span>
                          <span>•</span>
                          <span className="text-indigo-600 font-semibold">{t.mhs_kelas}</span>
                          <span>•</span>
                          <span className="px-1 py-0.2 rounded bg-indigo-50 text-indigo-700 font-medium text-[9px] border border-indigo-200">
                            {studentSem}
                          </span>
                        </div>
                      </td>

                      {/* Judul TA */}
                      <td className="py-3 px-3 font-medium text-slate-800 align-middle">
                        <p className="text-xs font-semibold text-slate-900 leading-snug italic line-clamp-2" title={t.judul}>
                          "{t.judul}"
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="text-slate-400">
                            ACC: {t.updated_at ? new Date(t.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Baru saja'}
                          </span>
                          {t.skor_kemiripan_terakhir !== undefined && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold border border-emerald-200">
                                Sim: {t.skor_kemiripan_terakhir}%
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Dosen Pembimbing */}
                      <td className="py-3 px-2.5 align-middle">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5 min-w-0">
                            <span className="w-4 h-4 rounded bg-indigo-50 text-indigo-700 font-extrabold text-[9px] flex items-center justify-center shrink-0 border border-indigo-100">
                              1
                            </span>
                            <span className="font-bold text-slate-800 text-xs truncate min-w-0" title={d1Nama}>
                              {d1Nama}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5 min-w-0">
                            <span className="w-4 h-4 rounded bg-blue-50 text-blue-700 font-extrabold text-[9px] flex items-center justify-center shrink-0 border border-blue-100">
                              2
                            </span>
                            <span className="font-bold text-slate-800 text-xs truncate min-w-0" title={d2Nama}>
                              {d2Nama}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status Konfirmasi */}
                      <td className="py-3 px-1 text-center align-middle">
                        <StatusBadge type="confirmation" status={isConfirmed} />
                      </td>

                      {/* Aksi (Icon-Only Buttons) */}
                      <td className="py-3 px-1 text-center align-middle">
                        <div className="flex items-center justify-center space-x-1">
                          
                          {/* Button Edit Dospem */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(t)}
                            className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-all cursor-pointer shadow-2xs group"
                            title="Edit Dosen Pembimbing"
                            aria-label="Edit Dosen Pembimbing"
                          >
                            <Edit3 className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                          </button>

                          {/* Button Confirm */}
                          <button
                            type="button"
                            onClick={() => handleOpenConfirm(t)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-2xs group ${
                              isConfirmed
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 border border-slate-200'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 hover:scale-105'
                            }`}
                            title={isConfirmed ? "Konfirmasi Ulang Penetapan Dospem" : "Konfirmasi & Kirim Notifikasi Dospem"}
                            aria-label={isConfirmed ? "Konfirmasi Ulang Penetapan Dospem" : "Konfirmasi & Kirim Notifikasi Dospem"}
                          >
                            {isConfirmed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 transition-transform group-hover:scale-110" />
                            ) : (
                              <Send className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                            )}
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

      {/* MODAL EDIT DOSEN PEMBIMBING */}
      {editingTitle && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in" data-lenis-prevent>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-indigo-600 font-bold text-sm">
                <Edit3 className="w-4 h-4" />
                <span>Edit Dosen Pembimbing</span>
              </div>
              <button 
                type="button"
                onClick={() => setEditingTitle(null)} 
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800">{editingTitle.mhs_nama} ({editingTitle.mhs_nim} • {editingTitle.mhs_kelas})</div>
              <div className="text-slate-600 line-clamp-2 italic">"{editingTitle.judul}"</div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              
              {/* Pembimbing 1 Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dosen Pembimbing 1:
                </label>
                <select
                  value={editDospem1Nip}
                  onChange={(e) => {
                    setEditDospem1Nip(e.target.value);
                    if (editError) setEditError('');
                  }}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Pilih Pembimbing 1 --</option>
                  {advisors.map(adv => (
                    <option 
                      key={adv.id || adv.nip} 
                      value={adv.nip}
                      disabled={adv.nip === editDospem2Nip}
                    >
                      {adv.nama} (Kuota: {adv.kuota_dospem1 || 8})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pembimbing 2 Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dosen Pembimbing 2:
                </label>
                <select
                  value={editDospem2Nip}
                  onChange={(e) => {
                    setEditDospem2Nip(e.target.value);
                    if (editError) setEditError('');
                  }}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Pilih Pembimbing 2 --</option>
                  {advisors.map(adv => (
                    <option 
                      key={adv.id || adv.nip} 
                      value={adv.nip}
                      disabled={adv.nip === editDospem1Nip}
                    >
                      {adv.nama} (Kuota: {adv.kuota_dospem2 || 8})
                    </option>
                  ))}
                </select>
              </div>

              {editError && (
                <div className="flex items-center space-x-1.5 text-rose-600 text-xs font-semibold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start space-x-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Setelah menyimpan perubahan dospem, klik tombol <strong>Confirm</strong> pada tabel untuk mengirimkan pemberitahuan resmi ke dosen dan mahasiswa.
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTitle(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI (CONFIRM BUTTON) */}
      {confirmingTitle && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in" data-lenis-prevent>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-emerald-100">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm">
                <Send className="w-4 h-4" />
                <span>Konfirmasi Penetapan Dosen Pembimbing</span>
              </div>
              <button 
                type="button"
                onClick={() => setConfirmingTitle(null)} 
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Apakah Anda yakin ingin mengonfirmasi penetapan dosen pembimbing untuk mahasiswa berikut?
              </p>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="font-bold text-slate-900 text-sm">{confirmingTitle.mhs_nama}</div>
                <div className="text-slate-500 font-mono text-[11px]">{confirmingTitle.mhs_nim} • {confirmingTitle.mhs_kelas}</div>
                <div className="text-slate-700 italic pt-1 border-t border-slate-200/80">"{confirmingTitle.judul}"</div>
              </div>

              {/* Dospem Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-0.5">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase">Pembimbing 1:</div>
                  <div className="font-bold text-slate-800 truncate">
                    {confirmingTitle.pembimbing_1_nama || confirmingTitle.pembimbing_1 || '-'}
                  </div>
                  {confirmingTitle.pembimbing_1_nip && (
                    <div className="text-[10px] text-slate-400 font-mono">NIP. {confirmingTitle.pembimbing_1_nip}</div>
                  )}
                </div>

                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-0.5">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase">Pembimbing 2:</div>
                  <div className="font-bold text-slate-800 truncate">
                    {confirmingTitle.pembimbing_2_nama || confirmingTitle.pembimbing_2 || '-'}
                  </div>
                  {confirmingTitle.pembimbing_2_nip && (
                    <div className="text-[10px] text-slate-400 font-mono">NIP. {confirmingTitle.pembimbing_2_nip}</div>
                  )}
                </div>
              </div>

            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmingTitle(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirm}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ya, Konfirmasi &amp; Kirim Notifikasi</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
