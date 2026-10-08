import React, { useState, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { useAuth } from '../../context/AuthContext.jsx';
import StatusBadge from '../../Components/common/StatusBadge.jsx';
import { getStudentSemester, AVAILABLE_SEMESTERS } from '../../lib/academicUtils.js';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  GraduationCap, 
  BookOpen,
  MessageSquare
} from 'lucide-react';

export default function TinjauJudulPage() {
  const { thesisTitles } = useAuth();

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
                        <Link
                          href={`/kaprodi/titles/${t.id}`}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center space-x-1.5 cursor-pointer transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Detail &amp; Catatan</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>



    </div>
  );
}
