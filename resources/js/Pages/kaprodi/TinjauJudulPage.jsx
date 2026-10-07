import React, { useState, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { useAuth } from '../../context/AuthContext.jsx';
import SimilarityGauge from '../../Components/common/SimilarityGauge.jsx';
import StatusBadge from '../../Components/common/StatusBadge.jsx';
import { getStudentSemester, AVAILABLE_SEMESTERS } from '../../lib/academicUtils.js';
import { 
  CheckSquare, 
  CheckCircle2, 
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
  BookOpen,
  Send,
  History,
  FileText,
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';

export default function TinjauJudulPage() {
  const { 
    thesisTitles, 
    advisors, 
    addProdiRevisionNote, 
    setThesisTitleFix 
  } = useAuth();

  const [selectedTitleId, setSelectedTitleId] = useState(null);
  const [revisiCatatan, setRevisiCatatan] = useState('');
  const [catatanFix, setCatatanFix] = useState('');
  const [confirmedDospem1Nip, setConfirmedDospem1Nip] = useState('');
  const [confirmedDospem2Nip, setConfirmedDospem2Nip] = useState('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState('');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('Semua Semester');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'tinjauan' | 'perlu_revisi' | 'disetujui'

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Find currently selected title object (always reactive from thesisTitles state)
  const selectedTitle = useMemo(() => {
    if (!selectedTitleId) return null;
    return thesisTitles.find(t => t.id === selectedTitleId) || null;
  }, [thesisTitles, selectedTitleId]);

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

  // Open detail & review modal
  const handleOpenDetail = (title) => {
    setSelectedTitleId(title.id);
    setRevisiCatatan('');
    setCatatanFix(title.catatan_kaprodi || '');

    // Penetapan dosen otomatis masuk dari usulan mahasiswa
    const autoD1 = resolveAdvisorNip(title.pembimbing_1_nip, title.pembimbing_1_nama || title.pembimbing_1);
    const autoD2 = resolveAdvisorNip(title.pembimbing_2_nip, title.pembimbing_2_nama || title.pembimbing_2);

    setConfirmedDospem1Nip(autoD1);
    setConfirmedDospem2Nip(autoD2);
  };

  // Quick suggestion chips for revision notes
  const quickNotes = [
    'Similarity tinggi (>40%), disarankan konsultasikan alternatif judul dengan pembimbing.',
    'Ganti objek/studi kasus penelitian agar topik lebih spesifik dan orisinal.',
    'Ruang lingkup sistem terlalu luas, mohon batasi pada modul inti kebutuhan D3 MI.',
    'Metodologi pengembangan sistem perlu diperjelas bersama dosen pembimbing.'
  ];

  // Submit Catatan Revisi Rapat Prodi (Status berubah jadi "Perlu Revisi" - Kuning)
  const handleSendRevisionNote = () => {
    if (!selectedTitle) return;
    if (!revisiCatatan.trim()) {
      showToast('Harap tuliskan catatan revisi sebelum mengirim.');
      return;
    }

    addProdiRevisionNote(selectedTitle.id, revisiCatatan.trim());
    showToast(`Catatan revisi berhasil disimpan & dikirim ke ${selectedTitle.mhs_nama}. Status menjadi "Perlu Revisi".`);
    setRevisiCatatan('');
  };

  // Tetapkan Status Judul Fix (Final) - Hijau Emerald
  const handleSetTitleFix = () => {
    if (!selectedTitle) return;

    setThesisTitleFix(
      selectedTitle.id,
      confirmedDospem1Nip,
      confirmedDospem2Nip,
      catatanFix.trim() || 'Judul resmi ditetapkan FIX oleh Kaprodi.'
    );

    showToast(`Judul Tugas Akhir ${selectedTitle.mhs_nama} resmi berstatus JUDUL FIX!`);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = thesisTitles.length;
    const tinjauan = thesisTitles.filter(t => t.status === 'tinjauan' || t.status === 'diajukan').length;
    const perluRevisi = thesisTitles.filter(t => t.status === 'perlu_revisi').length;
    const judulFix = thesisTitles.filter(t => t.status === 'disetujui' || t.status === 'judul_fix').length;

    return { total, tinjauan, perluRevisi, judulFix };
  }, [thesisTitles]);

  // Filtered titles
  const filteredTitles = useMemo(() => {
    return thesisTitles.filter(t => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        t.mhs_nama?.toLowerCase().includes(q) ||
        t.mhs_nim?.toLowerCase().includes(q) ||
        t.judul?.toLowerCase().includes(q) ||
        t.mhs_kelas?.toLowerCase().includes(q);

      const sem = getStudentSemester(t);
      const matchSemester = semesterFilter === 'Semua Semester' || sem === semesterFilter;

      const norm = String(t.status || '').toLowerCase().trim();
      const matchStatus = 
        statusFilter === 'all' ? true :
        statusFilter === 'tinjauan' ? (norm === 'tinjauan' || norm === 'diajukan') :
        statusFilter === 'perlu_revisi' ? norm === 'perlu_revisi' :
        statusFilter === 'disetujui' ? (norm === 'disetujui' || norm === 'judul_fix') : true;

      return matchSearch && matchSemester && matchStatus;
    });
  }, [thesisTitles, searchQuery, semesterFilter, statusFilter]);

  // Format timestamp helper
  const formatDate = (isoString) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' WIB';
    } catch {
      return isoString;
    }
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

      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-900 via-blue-800 to-blue-950 text-white p-6 sm:p-8 overflow-hidden shadow-xl border border-blue-700/40">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-bold uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5 text-blue-300" />
            <span>Portal Kaprodi FASILKOM UNSRI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Peninjauan &amp; Catatan Revisi Judul TA
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal">
            Pengajuan judul mahasiswa otomatis masuk ke tahap peninjauan. Berikan catatan jika terdapat revisi dari rapat Prodi, lacak riwayat perubahan bersama dosen pembimbing, dan tetapkan judul yang sudah fix.
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-slate-500 uppercase">Total Pengajuan</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Semua data usulan TA</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('tinjauan')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'tinjauan'
              ? 'bg-yellow-50 border-yellow-300 ring-2 ring-yellow-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-yellow-200'
          }`}
        >
          <div className="text-xs font-bold text-yellow-800 uppercase flex items-center justify-between">
            <span>Dalam Tinjauan</span>
            <Clock className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="text-2xl font-black text-yellow-800 mt-1">{stats.tinjauan}</div>
          <p className="text-[11px] text-yellow-700/80 mt-0.5">Otomatis masuk tahap tinjauan</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('perlu_revisi')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'perlu_revisi'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="text-xs font-bold text-amber-800 uppercase flex items-center justify-between">
            <span>Perlu Revisi</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-800 mt-1">{stats.perluRevisi}</div>
          <p className="text-[11px] text-amber-700/80 mt-0.5">Ada catatan rapat / similarity</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('disetujui')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'disetujui'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div className="text-xs font-bold text-emerald-800 uppercase flex items-center justify-between">
            <span>Judul Fix</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{stats.judulFix}</div>
          <p className="text-[11px] text-emerald-700/80 mt-0.5">Judul final disetujui Prodi</p>
        </button>
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
          {/* Status Tabs */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('tinjauan')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'tinjauan' ? 'bg-white text-yellow-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tinjauan ({stats.tinjauan})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('perlu_revisi')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'perlu_revisi' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Revisi ({stats.perluRevisi})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('disetujui')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'disetujui' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fix ({stats.judulFix})
            </button>
          </div>

          {/* Semester Filter */}
          <div className="flex items-center space-x-1.5">
            <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none focus:border-indigo-600 cursor-pointer"
            >
              {AVAILABLE_SEMESTERS.map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px]">
                <th className="py-3 px-4 w-1/4">Mahasiswa (NIM &amp; Kelas)</th>
                <th className="py-3 px-4 w-1/3">Judul Tugas Akhir</th>
                <th className="py-3 px-4 text-center w-36">Status Sistem</th>
                <th className="py-3 px-4 text-center w-28">Similarity</th>
                <th className="py-3 px-4 text-right w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTitles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Tidak ada pengajuan TA yang sesuai dengan kriteria filter saat ini.
                  </td>
                </tr>
              ) : (
                filteredTitles.map(t => {
                  const studentSem = getStudentSemester(t);
                  const isFix = t.status === 'disetujui' || t.status === 'judul_fix';
                  const isRevisi = t.status === 'perlu_revisi';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 align-top">
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
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-800 align-top">
                        <p className="text-xs font-semibold text-slate-900 leading-relaxed italic line-clamp-2" title={t.judul}>
                          "{t.judul}"
                        </p>
                        {t.catatan_kaprodi && (
                          <div className="mt-1.5 text-[11px] text-amber-800 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200 flex items-start space-x-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-1 italic">{t.catatan_kaprodi}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center align-top">
                        <StatusBadge type="thesis" status={t.status} />
                      </td>

                      <td className="py-3.5 px-4 text-center align-top">
                        <span className={`inline-block font-mono font-bold px-2 py-0.5 rounded-full text-xs border ${
                          t.skor_kemiripan_terakhir > 40
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {t.skor_kemiripan_terakhir}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right align-top">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(t)}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center space-x-1.5 cursor-pointer transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Detail &amp; Catatan</span>
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

      {/* DETAIL, LOG REVISI & ACTION MODAL */}
      {selectedTitle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in" data-lenis-prevent>
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Panel Peninjauan &amp; Catatan Rapat Prodi
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedTitle.mhs_nama} ({selectedTitle.mhs_nim} • {selectedTitle.mhs_kelas})
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <StatusBadge type="thesis" status={selectedTitle.status} />
                <button 
                  type="button"
                  onClick={() => setSelectedTitleId(null)} 
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer rounded-lg hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Judul TA Saat Ini */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 block flex items-center justify-between">
                <span>Judul Tugas Akhir (Versi Terkini):</span>
                <span className="text-[11px] font-normal text-slate-500">
                  Similarity Engine: <strong className="text-indigo-600">{selectedTitle.skor_kemiripan_terakhir}%</strong>
                </span>
              </span>
              <p className="text-sm font-semibold text-slate-900 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                "{selectedTitle.judul}"
              </p>
            </div>

            {/* Deskripsi Topik */}
            {selectedTitle.deskripsi && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-700 block">Deskripsi / Ringkasan Topik:</span>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {selectedTitle.deskripsi}
                </p>
              </div>
            )}

            <SimilarityGauge score={selectedTitle.skor_kemiripan_terakhir} />

            {/* SECTION 1: RIWAYAT REVISI & CATATAN RAPAT BERDASARKAN TANGGAL */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 flex items-center space-x-2">
                  <History className="w-4 h-4 text-indigo-600" />
                  <span>Riwayat Log Revisi &amp; Catatan Rapat (Tersimpan Berdasarkan Tanggal)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {selectedTitle.riwayat_revisi ? selectedTitle.riwayat_revisi.length : 1} Catatan Tersimpan
                </span>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {(!selectedTitle.riwayat_revisi || selectedTitle.riwayat_revisi.length === 0) ? (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-500 italic">
                    Belum ada riwayat revisi tambahan. Pengajuan berada di tahap awal.
                  </div>
                ) : (
                  selectedTitle.riwayat_revisi.map((rev, index) => {
                    const isFixLog = rev.tipe === 'judul_fix';
                    const isProdiNote = rev.tipe === 'catatan_prodi';
                    const isMhsRevision = rev.tipe === 'revisi_mahasiswa';

                    return (
                      <div 
                        key={rev.id || index}
                        className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                          isFixLog 
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                            : isProdiNote
                            ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                            : isMhsRevision
                            ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 border shadow-2xs">
                            {isFixLog && '✓ Judul Ditetapkan Fix'}
                            {isProdiNote && '💬 Catatan Rapat Prodi'}
                            {isMhsRevision && '✏️ Revisi Judul Mahasiswa'}
                            {!isFixLog && !isProdiNote && !isMhsRevision && '📄 Pengajuan Awal'}
                          </span>
                          <span className="font-mono text-slate-500">
                            {formatDate(rev.tanggal)}
                          </span>
                        </div>

                        {rev.judul && rev.judul !== selectedTitle.judul && (
                          <div className="text-[11px] font-medium text-slate-600 line-through">
                            Judul Sebelumnya: "{rev.judul}"
                          </div>
                        )}

                        <p className="text-xs font-semibold leading-relaxed">
                          "{rev.catatan}"
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-[10px] text-slate-500">
                          <span>Oleh: <strong>{rev.oleh || 'Sistem'}</strong></span>
                          {rev.skor_similarity !== undefined && (
                            <span className="font-mono">Similarity saat itu: {rev.skor_similarity}%</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* SECTION 2: FORM CATATAN HASIL RAPAT PRODI (JIKA ADA REVISI) */}
            <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-900 flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-amber-600" />
                  <span>Berikan Catatan Revisi Rapat Prodi (Status Menjadi "Perlu Revisi")</span>
                </span>
                <span className="text-[10px] text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full font-semibold">
                  Kuning = Tahap Revisi
                </span>
              </div>
              
              <p className="text-[11px] text-amber-800/90 leading-relaxed">
                Jika terdapat masalah pada judul (contoh: similarity tinggi atau topik perlu penyesuaian), berikan catatan di bawah ini. Mahasiswa akan melakukan revisi bersama dosen pembimbing.
              </p>

              {/* Quick Suggestion Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {quickNotes.map((note, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRevisiCatatan(note)}
                    className="text-[10px] bg-white hover:bg-amber-100/70 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-left"
                  >
                    + {note.substring(0, 48)}...
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                value={revisiCatatan}
                onChange={(e) => setRevisiCatatan(e.target.value)}
                placeholder="Tuliskan catatan arahan hasil rapat Prodi untuk mahasiswa dan dosen pembimbing..."
                className="w-full text-xs p-3 border border-amber-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-slate-400"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSendRevisionNote}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center space-x-1.5 cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Catatan Revisi (Ubah Status ke Perlu Revisi)</span>
                </button>
              </div>
            </div>

            {/* SECTION 3: PENETAPAN DOSEN PEMBIMBING & STATUS JUDUL FIX */}
            <div className="bg-emerald-50/40 border border-emerald-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-950 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Penetapan Status Judul Fix (Final) &amp; Dosen Pembimbing Definitif</span>
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full font-semibold">
                  Hijau = Judul Fix
                </span>
              </div>

              <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                Tetapkan status judul menjadi <strong>JUDUL FIX</strong> ketika judul sudah sesuai dan similarity aman. Status ini menjadi informasi resmi bahwa mahasiswa berhak melanjutkan ke pendaftaran Seminar Proposal.
              </p>

              {/* Dospem Definitif Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Dosen Pembimbing 1 Definitif:
                  </label>
                  <select
                    value={confirmedDospem1Nip}
                    onChange={(e) => setConfirmedDospem1Nip(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    Dosen Pembimbing 2 Definitif:
                  </label>
                  <select
                    value={confirmedDospem2Nip}
                    onChange={(e) => setConfirmedDospem2Nip(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

              {/* Catatan Fix Tambahan (Opsional) */}
              <div>
                <input
                  type="text"
                  value={catatanFix}
                  onChange={(e) => setCatatanFix(e.target.value)}
                  placeholder="Catatan pengesahan final judul (opsional, misal: Judul resmi disetujui dalam rapat Prodi)..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSetTitleFix}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 inline-flex items-center space-x-1.5 cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tetapkan Sebagai Judul Fix (Final)</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              <span>Sistem alur tanpa tombol Tolak: Pembimbing dan Mahasiswa berkoordinasi menyelesaikan revisi.</span>
              <button
                type="button"
                onClick={() => setSelectedTitleId(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
