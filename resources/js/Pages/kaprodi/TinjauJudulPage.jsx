import React, { useState, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { useAuth } from '../../context/AuthContext.jsx';
import SimilarityGauge from '../../Components/common/SimilarityGauge.jsx';
import StatusBadge from '../../Components/common/StatusBadge.jsx';
import { getStudentSemester, AVAILABLE_SEMESTERS } from '../../lib/academicUtils.js';
import { 
  CheckSquare, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  AlertTriangle, 
  MessageSquare, 
  UserCheck, 
  Users,
  Clock,
  ShieldCheck,
  AlertCircle,
  Search,
  GraduationCap,
  X,
  BookOpen
} from 'lucide-react';

export default function TinjauJudulPage() {
  const { thesisTitles, historicalTitles, advisors, reviewThesisTitle } = useAuth();

  const [selectedTitle, setSelectedTitle] = useState(null);
  const [catatan, setCatatan] = useState('');
  const [confirmedDospem1Nip, setConfirmedDospem1Nip] = useState('');
  const [confirmedDospem2Nip, setConfirmedDospem2Nip] = useState('');

  // Rejection Popup Modal States
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState('');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('Semua Semester');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Helper to resolve advisor NIP from name or title fields
  const resolveAdvisorNip = (nip, name) => {
    if (nip && advisors.some(a => a.nip === nip)) return nip;
    if (name) {
      const cleanName = String(name).toLowerCase().trim();
      const matched = advisors.find(a => 
        a.nama.toLowerCase().includes(cleanName) || 
        cleanName.includes(a.nama.toLowerCase())
      );
      if (matched) return matched.nip;
    }
    return '';
  };

  const handleOpenReview = (title) => {
    setSelectedTitle(title);
    setCatatan(title.catatan_kaprodi || '');

    // Penetapan dosen otomatis masuk dari yang diajukan mahasiswa
    const autoD1 = resolveAdvisorNip(title.pembimbing_1_nip, title.pembimbing_1_nama || title.pembimbing_1);
    const autoD2 = resolveAdvisorNip(title.pembimbing_2_nip, title.pembimbing_2_nama || title.pembimbing_2);

    setConfirmedDospem1Nip(autoD1);
    setConfirmedDospem2Nip(autoD2);
    setRejectReason('');
    setRejectError('');
  };

  // Handle ACC (Setujui)
  const handleAcc = () => {
    if (!selectedTitle) return;
    
    reviewThesisTitle(
      selectedTitle.id, 
      'disetujui', 
      catatan || 'Pengajuan Tugas Akhir dan penetapan Dosen Pembimbing resmi disetujui (ACC) oleh Kaprodi.',
      confirmedDospem1Nip,
      confirmedDospem2Nip
    );

    showToast(`Pengajuan TA ${selectedTitle.mhs_nama} berhasil di-ACC & masuk ke Manajemen Tugas Akhir.`);
    setSelectedTitle(null);
    setCatatan('');
  };

  // Open Rejection Popup Modal
  const handleOpenRejectModal = () => {
    setRejectReason('');
    setRejectError('');
    setIsRejectModalOpen(true);
  };

  // Confirm Rejection with Reason
  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      setRejectError('Alasan penolakan wajib diisi sebelum konfirmasi penolakan.');
      return;
    }

    if (!selectedTitle) return;

    reviewThesisTitle(
      selectedTitle.id,
      'ditolak',
      rejectReason.trim(),
      confirmedDospem1Nip,
      confirmedDospem2Nip
    );

    showToast(`Pengajuan TA ${selectedTitle.mhs_nama} berhasil ditolak & dihapus. Mahasiswa telah menerima notifikasi.`);
    setIsRejectModalOpen(false);
    setSelectedTitle(null);
    setCatatan('');
    setRejectReason('');
    setRejectError('');
  };

  // Filtered titles (Halaman ini khusus memproses pengajuan yang berstatus 'diajukan' / menunggu ACC)
  const filteredTitles = useMemo(() => {
    return thesisTitles.filter(t => {
      // Pengajuan yang sudah di-ACC masuk ke Manajemen TA, dan yang ditolak dihapus
      if (t.status !== 'diajukan') return false;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        t.mhs_nama?.toLowerCase().includes(q) ||
        t.mhs_nim?.toLowerCase().includes(q) ||
        t.judul?.toLowerCase().includes(q) ||
        t.mhs_kelas?.toLowerCase().includes(q);

      const sem = getStudentSemester(t);
      const matchSemester = semesterFilter === 'Semua Semester' || sem === semesterFilter;

      return matchSearch && matchSemester;
    });
  }, [thesisTitles, searchQuery, semesterFilter]);

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs sm:text-sm font-semibold border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-900 via-blue-800 to-blue-950 text-white p-6 sm:p-8 overflow-hidden shadow-xl border border-blue-700/40">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-bold uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5 text-blue-300" />
            <span>Portal Kaprodi FASILKOM UNSRI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Tinjauan &amp; Persetujuan Pengajuan TA Mahasiswa
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal">
            Verifikasi skor similarity check engine, evaluasi rekomendasi dosen pembimbing, dan tetapkan keputusan final persetujuan pengajuan TA mahasiswa D3 MI.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama mahasiswa, NIM, atau judul TA..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm outline-none transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
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

          {/* Counter info badge */}
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-semibold">
            Menunggu ACC: <span className="text-indigo-600 font-bold">{filteredTitles.length}</span>
          </div>
        </div>
      </div>


      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px]">
                <th className="py-3 px-4 w-1/3">Mahasiswa (NIM)</th>
                <th className="py-3 px-4 w-1/2">Judul Tugas Akhir</th>
                <th className="py-3 px-4 text-right w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTitles.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-10 text-center text-slate-400">
                    Tidak ada pengajuan TA yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredTitles.map(t => {
                  const studentSem = getStudentSemester(t);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-900 align-top">
                        <div className="font-bold text-slate-900 text-sm">{t.mhs_nama}</div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center space-x-1.5 mt-0.5">
                          <span>{t.mhs_nim}</span>
                          <span>•</span>
                          <span className="text-indigo-600 font-semibold">{t.mhs_kelas}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-medium text-[9px] border border-indigo-200">
                            {studentSem}
                          </span>
                        </div>
                        <div className="mt-2">
                          <StatusBadge type="thesis" status={t.status} />
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 align-top">
                        <p className="text-xs font-semibold text-slate-900 leading-relaxed italic line-clamp-3" title={t.judul}>
                          "{t.judul}"
                        </p>
                      </td>
                      <td className="py-3 px-4 text-right align-top">
                        <button
                          onClick={() => handleOpenReview(t)}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 ml-auto cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Evaluasi</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Review Modal */}
      {selectedTitle && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in" data-lenis-prevent>
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Panel Evaluasi &amp; Persetujuan Final (Kaprodi)</span>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedTitle.mhs_nama} ({selectedTitle.mhs_nim} • {selectedTitle.mhs_kelas} • {getStudentSemester(selectedTitle)})
                </h3>
              </div>
              <button 
                onClick={() => setSelectedTitle(null)} 
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Judul TA */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 block">Judul Tugas Akhir:</span>
              <p className="text-sm font-semibold text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {selectedTitle.judul}
              </p>
            </div>

            {/* Deskripsi */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 block">Deskripsi / Ringkasan Topik:</span>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                {selectedTitle.deskripsi || 'Tidak ada deskripsi tambahan.'}
              </p>
            </div>

            <SimilarityGauge score={selectedTitle.skor_kemiripan_terakhir} />

            {/* Review Dosen Pembimbing Status Box */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900 flex items-center space-x-1.5">
                  <UserCheck className="w-4 h-4 text-amber-600" />
                  <span>Rekomendasi Validasi Dosen Pembimbing:</span>
                </span>
                <StatusBadge type="recommendation" status={selectedTitle.rekomendasi_dospem_status} />
              </div>
              {selectedTitle.catatan_dospem ? (
                <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-amber-200/80 leading-relaxed">
                  <span className="font-semibold text-slate-500">Catatan Dospem: </span>
                  "{selectedTitle.catatan_dospem}"
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 italic">
                  Belum ada catatan tertulis dari dosen pembimbing.
                </p>
              )}
            </div>

            {/* Usulan Dospem oleh Mahasiswa */}
            <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-900 flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Usulan Dosen Pembimbing oleh Mahasiswa:</span>
                </span>
                <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-100/70 px-2 py-0.5 rounded-full">
                  Diajukan Mahasiswa
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-indigo-100 space-y-0.5">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Usulan Pembimbing 1:</div>
                  <div className="font-bold text-slate-800">
                    {selectedTitle.pembimbing_1_nama || selectedTitle.pembimbing_1 || '(Belum memilih)'}
                  </div>
                  {selectedTitle.pembimbing_1_nip && (
                    <div className="text-[10px] text-slate-400 font-mono">NIP. {selectedTitle.pembimbing_1_nip}</div>
                  )}
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-indigo-100 space-y-0.5">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Usulan Pembimbing 2:</div>
                  <div className="font-bold text-slate-800">
                    {selectedTitle.pembimbing_2_nama || selectedTitle.pembimbing_2 || '(Belum memilih)'}
                  </div>
                  {selectedTitle.pembimbing_2_nip && (
                    <div className="text-[10px] text-slate-400 font-mono">NIP. {selectedTitle.pembimbing_2_nip}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Form Penetapan Pembimbing Resmi oleh Kaprodi (Otomatis Masuk dari Usulan Mahasiswa) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Penetapan Dosen Pembimbing Resmi (Definitif)</span>
                </span>
                <span className="text-[10px] text-slate-500">Otomatis Terisi dari Usulan Mahasiswa • Dapat Disesuaikan</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Dosen Pembimbing 1:
                  </label>
                  <select
                    value={confirmedDospem1Nip}
                    onChange={(e) => setConfirmedDospem1Nip(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Pilih Pembimbing 1 --</option>
                    {advisors.map(adv => (
                      <option 
                        key={adv.id || adv.nip} 
                        value={adv.nip}
                        disabled={adv.nip === confirmedDospem2Nip}
                      >
                        {adv.nama} (Kuota: {adv.kuota_dospem1 || 8})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Dosen Pembimbing 2:
                  </label>
                  <select
                    value={confirmedDospem2Nip}
                    onChange={(e) => setConfirmedDospem2Nip(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Pilih Pembimbing 2 --</option>
                    {advisors.map(adv => (
                      <option 
                        key={adv.id || adv.nip} 
                        value={adv.nip}
                        disabled={adv.nip === confirmedDospem1Nip}
                      >
                        {adv.nama} (Kuota: {adv.kuota_dospem2 || 8})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Catatan Kaprodi Input (Opsional untuk ACC) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan / Arahan Metodologi dari Kaprodi (Opsional):
              </label>
              <textarea
                rows={2}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Tuliskan catatan tambahan atau arahan penyusunan proposal untuk mahasiswa..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Modal Actions: HANYA DUA BUTTON (ACC & Tolak) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                Persetujuan (ACC) akan mengaktifkan izin pendaftaran Seminar Proposal bagi mahasiswa.
              </span>

              <div className="flex space-x-2.5 w-full sm:w-auto justify-end">
                {/* Button 1: Tolak (Membuka popup alasan penolakan) */}
                <button
                  type="button"
                  onClick={handleOpenRejectModal}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Tolak</span>
                </button>

                {/* Button 2: ACC */}
                <button
                  type="button"
                  onClick={handleAcc}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ACC (Setujui Pengajuan)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* POPUP ALASAN PENOLAKAN (Wajib Diisi Sebelum Konfirmasi Tolak) */}
      {isRejectModalOpen && selectedTitle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-in fade-in" data-lenis-prevent>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-rose-100">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-rose-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Alasan Penolakan Pengajuan TA</span>
              </div>
              <button 
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800">{selectedTitle.mhs_nama} ({selectedTitle.mhs_nim})</div>
              <div className="text-slate-600 line-clamp-2 italic">"{selectedTitle.judul}"</div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Alasan Penolakan <span className="text-rose-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Berikan penjelasan yang jelas agar mahasiswa mengetahui poin evaluasi atau revisi yang harus diperbaiki.
              </p>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  if (rejectError) setRejectError('');
                }}
                placeholder="Contoh: Topik memiliki kemiripan tinggi dengan arsip judul tahun 2023, ruang lingkup terlalu sempit, atau disarankan mengganti studi kasus..."
                className={`w-full text-xs p-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  rejectError 
                    ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30' 
                    : 'border-slate-300 focus:ring-indigo-500 bg-white'
                }`}
              />
              {rejectError && (
                <div className="flex items-center space-x-1 text-rose-600 text-[11px] font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{rejectError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim()}
                onClick={handleConfirmReject}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer ${
                  !rejectReason.trim()
                    ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>Konfirmasi Tolak</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
