import React, { useState, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { useAuth } from '../../context/AuthContext.jsx';
import StatusBadge from '../../Components/common/StatusBadge.jsx';
import { getStudentSemester, AVAILABLE_SEMESTERS } from '../../lib/academicUtils.js';
import {
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  GraduationCap,
  Users,
  UserX,
  UserCheck,
  Copy,
  ExternalLink,
  BookOpen,
  ArrowRight,
  Send,
  Mail,
  Phone,
  FileSpreadsheet,
  Check
} from 'lucide-react';

export default function PeninjauanPengajuanPage() {
  const {
    getAllRegisteredStudents,
    studentAdvisors,
    thesisTitles,
    advisors
  } = useAuth();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('Semua Semester');
  const [submissionTab, setSubmissionTab] = useState('all'); // 'all' | 'sudah' | 'belum'
  const [accFilter, setAccFilter] = useState('all'); // 'all' | 'diajukan' | 'disetujui' | 'ditolak'
  const [copiedText, setCopiedText] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Compile full student list with their submission status
  const studentsList = useMemo(() => {
    const allStds = getAllRegisteredStudents();
    return allStds.map(std => {
      // Find thesis title submission
      const titleObj = thesisTitles.find(t => 
        (t.mhs_nim && String(t.mhs_nim).trim() === String(std.nim).trim()) || 
        (t.profile_id && t.profile_id === std.id)
      );

      // Find student advisor assignment if any
      const assignment = studentAdvisors.find(sa => 
        String(sa.student_nim).trim() === String(std.nim).trim()
      );

      const hasSubmitted = !!titleObj;
      const semester = getStudentSemester(std);

      return {
        id: std.id,
        nim: std.nim,
        nama: std.nama,
        email: std.email || `${std.nim}@student.unsri.ac.id`,
        no_hp: std.no_hp || '',
        prodi: std.prodi || 'D3 Manajemen Informatika',
        kelas: std.kelas || 'MI 5A',
        semester,
        hasSubmitted,
        title: titleObj || null,
        assignment: assignment || null
      };
    });
  }, [getAllRegisteredStudents, thesisTitles, studentAdvisors]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalStudents = studentsList.length;
    const sudah = studentsList.filter(s => s.hasSubmitted);
    const belum = studentsList.filter(s => !s.hasSubmitted);

    const disetujui = sudah.filter(s => s.title?.status === 'disetujui').length;
    const menunggu = sudah.filter(s => s.title?.status === 'diajukan').length;
    const ditolak = sudah.filter(s => s.title?.status === 'ditolak').length;

    const rate = totalStudents > 0 ? Math.round((sudah.length / totalStudents) * 100) : 0;

    return {
      totalStudents,
      totalSudah: sudah.length,
      totalBelum: belum.length,
      disetujui,
      menunggu,
      ditolak,
      rate
    };
  }, [studentsList]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return studentsList.filter(std => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q ||
        std.nama.toLowerCase().includes(q) ||
        std.nim.toLowerCase().includes(q) ||
        std.kelas.toLowerCase().includes(q) ||
        (std.title && std.title.judul.toLowerCase().includes(q));

      const matchSemester = semesterFilter === 'Semua Semester' || std.semester === semesterFilter;

      const matchTab = 
        submissionTab === 'all' ? true :
        submissionTab === 'sudah' ? std.hasSubmitted :
        submissionTab === 'belum' ? !std.hasSubmitted : true;

      const matchAcc = 
        accFilter === 'all' || !std.hasSubmitted ? true :
        std.title?.status === accFilter;

      return matchSearch && matchSemester && matchTab && matchAcc;
    });
  }, [studentsList, searchTerm, semesterFilter, submissionTab, accFilter]);

  // Copy list of unsubmitted NIMs
  const handleCopyUnsubmittedNims = () => {
    const unsubmitted = studentsList.filter(s => !s.hasSubmitted);
    if (unsubmitted.length === 0) {
      showToast('Semua mahasiswa sudah mengajukan judul TA.');
      return;
    }

    const nimsText = unsubmitted.map(s => `${s.nim} - ${s.nama} (${s.kelas})`).join('\n');
    navigator.clipboard.writeText(nimsText);
    setCopiedText(true);
    showToast(`Daftar ${unsubmitted.length} mahasiswa yang belum mengajukan berhasil disalin!`);
    setTimeout(() => setCopiedText(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs sm:text-sm font-semibold border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 overflow-hidden shadow-xl border border-blue-800/40">
        <div className="absolute right-0 top-0 opacity-15 translate-x-8 -translate-y-8 pointer-events-none">
          <ClipboardList className="w-80 h-80 text-white" />
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-bold uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5 text-blue-300" />
            <span>Portal Kaprodi FASILKOM UNSRI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Peninjauan Status Pengajuan TA Mahasiswa
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal">
            Sistem monitoring terpisah untuk memantau mahasiswa yang <strong>sudah mengajukan</strong> judul Tugas Akhir dan mahasiswa yang <strong>belum melakukan pengajuan</strong> per semester.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <Link
              href="/kaprodi/titles"
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Buka Tinjau Pengajuan TA (ACC)</span>
            </Link>
            <Link
              href="/kaprodi/advisors"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all flex items-center space-x-1.5 backdrop-blur-xs"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-300" />
              <span>Buka Pembagian Dospem</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Total Mahasiswa TA</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats.totalStudents} Mahasiswa</div>
          <p className="text-[11px] text-slate-500">Angkatan aktif D3 Manajemen Informatika</p>
        </div>

        {/* Sudah Mengajukan */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-2xs space-y-1 bg-gradient-to-br from-white to-emerald-50/40">
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center justify-between">
            <span>Sudah Mengajukan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">{stats.totalSudah} Mahasiswa</div>
          <div className="flex items-center space-x-1.5 text-[10px] text-emerald-600 font-semibold">
            <span>{stats.disetujui} ACC</span>
            <span>•</span>
            <span>{stats.menunggu} Menunggu</span>
            <span>•</span>
            <span>{stats.ditolak} Ditolak</span>
          </div>
        </div>

        {/* Belum Mengajukan */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs space-y-1 bg-gradient-to-br from-white to-amber-50/40">
          <div className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center justify-between">
            <span>Belum Mengajukan</span>
            <UserX className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700">{stats.totalBelum} Mahasiswa</div>
          <p className="text-[11px] text-amber-600/80 font-medium">Perlu tindak lanjut atau pengingat</p>
        </div>

        {/* Progress Rate */}
        <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-2xs space-y-2 bg-gradient-to-br from-white to-indigo-50/40">
          <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center justify-between">
            <span>Partisipasi Pengajuan</span>
            <span className="font-extrabold text-indigo-800 text-sm">{stats.rate}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.rate}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500">
            {stats.totalSudah} dari {stats.totalStudents} mahasiswa telah submit judul
          </p>
        </div>
      </div>

      {/* Control & Filter Header */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, NIM, kelas, atau judul..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm outline-none transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Tabs & Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
          
          {/* Submission Tab Segment */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setSubmissionTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                submissionTab === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({studentsList.length})
            </button>
            <button
              type="button"
              onClick={() => setSubmissionTab('sudah')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                submissionTab === 'sudah' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Sudah Mengajukan ({stats.totalSudah})</span>
            </button>
            <button
              type="button"
              onClick={() => setSubmissionTab('belum')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                submissionTab === 'belum' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertCircle className="w-3 h-3 text-amber-600" />
              <span>Belum ({stats.totalBelum})</span>
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

          {/* Quick Copy Unsubmitted Button */}
          <button
            type="button"
            onClick={handleCopyUnsubmittedNims}
            title="Salin daftar mahasiswa yang belum mengajukan untuk dikirim ke grup kelas"
            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-amber-600" />}
            <span>Salin NIM Belum Ajukan</span>
          </button>

        </div>
      </div>

      {/* Main Student Review Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-3 text-center w-10">No</th>
                <th className="py-3 px-4 w-1/4">Mahasiswa (NIM &amp; Semester)</th>
                <th className="py-3 px-4 w-1/3">Status &amp; Judul Tugas Akhir</th>
                <th className="py-3 px-3 w-1/5">Dosen Pembimbing</th>
                <th className="py-3 px-3 text-center w-28">Status Pengajuan</th>
                <th className="py-3 px-3 text-right w-24">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ada data mahasiswa yang cocok dengan kriteria filter saat ini.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std, idx) => {
                  return (
                    <tr key={std.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* Number */}
                      <td className="py-3 px-3 text-center text-slate-400 font-semibold text-[11px] align-top">
                        {idx + 1}
                      </td>

                      {/* Mahasiswa Info */}
                      <td className="py-3 px-4 align-top">
                        <div className="font-bold text-slate-900 leading-snug">{std.nama}</div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center space-x-1.5 mt-0.5">
                          <span>NIM. {std.nim}</span>
                          <span>•</span>
                          <span className="text-indigo-600 font-semibold">{std.kelas}</span>
                        </div>
                        <div className="mt-1 flex items-center space-x-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[9px] border border-indigo-200">
                            {std.semester}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {std.prodi}
                          </span>
                        </div>
                      </td>

                      {/* Thesis Title or Empty State */}
                      <td className="py-3 px-4 align-top">
                        {std.hasSubmitted && std.title ? (
                          <div className="space-y-1">
                            <p className="text-[11px] font-semibold text-slate-900 leading-relaxed italic line-clamp-2" title={std.title.judul}>
                              "{std.title.judul}"
                            </p>
                            <div className="flex items-center space-x-2 text-[10px]">
                              <span className="text-slate-500">Similarity:</span>
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                {std.title.skor_kemiripan_terakhir}%
                              </span>
                              {std.title.rekomendasi_dospem_status && (
                                <span className={`px-1.5 py-0.2 rounded font-medium ${
                                  std.title.rekomendasi_dospem_status === 'direkomendasikan'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {std.title.rekomendasi_dospem_status === 'direkomendasikan' ? 'Direkomendasikan' : 'Perlu Revisi'}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="py-1 space-y-1">
                            <div className="inline-flex items-center space-x-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              <span>Belum Mengajukan Judul TA</span>
                            </div>
                            <p className="text-[10px] text-slate-400 italic">
                              Mahasiswa belum submit proposal judul melalui akun SIMTA.
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Dospem Details */}
                      <td className="py-3 px-3 align-top">
                        {std.hasSubmitted && std.title ? (
                          <div className="space-y-0.5 text-[11px]">
                            <div className="truncate max-w-[200px]" title={std.title.pembimbing_1_nama || std.title.pembimbing_1}>
                              <span className="font-semibold text-slate-500">P1:</span> {std.title.pembimbing_1_nama || std.title.pembimbing_1 || '-'}
                            </div>
                            <div className="truncate max-w-[200px]" title={std.title.pembimbing_2_nama || std.title.pembimbing_2}>
                              <span className="font-semibold text-slate-500">P2:</span> {std.title.pembimbing_2_nama || std.title.pembimbing_2 || '-'}
                            </div>
                          </div>
                        ) : std.assignment?.dospem1_nip ? (
                          <div className="space-y-0.5 text-[11px] text-slate-600">
                            <div><span className="font-semibold text-slate-500">D1:</span> NIP. {std.assignment.dospem1_nip}</div>
                            <div><span className="font-semibold text-slate-500">D2:</span> NIP. {std.assignment.dospem2_nip || '-'}</div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">-</span>
                        )}
                      </td>

                      {/* Status ACC Badge */}
                      <td className="py-3 px-3 align-top text-center">
                        <StatusBadge 
                          type="thesis" 
                          status={std.hasSubmitted && std.title ? std.title.status : 'belum_mengajukan'} 
                        />
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 align-top text-right">
                        {std.hasSubmitted ? (
                          <Link
                            href="/kaprodi/titles"
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[11px] rounded-lg transition-colors inline-flex items-center space-x-1"
                          >
                            <span>Tinjau</span>
                            <ExternalLink className="w-3 h-3 text-indigo-600" />
                          </Link>
                        ) : (
                          <a
                            href={`mailto:${std.email}?subject=Pemberitahuan%20Pengajuan%20Judul%20Tugas%20Akhir%20D3%20MI&body=Halo%20${encodeURIComponent(std.nama)},%0A%0AAnda%20tercatat%20belum%20mengajukan%20judul%20Tugas%20Akhir%20di%20sistem%20SIMTA.%20Mohon%20segera%20melakukan%20pengajuan.%0A%0ATerima%20kasih.`}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[11px] rounded-lg transition-colors inline-flex items-center space-x-1"
                            title="Kirim email pengingat pengajuan judul"
                          >
                            <Mail className="w-3 h-3 text-amber-700" />
                            <span>Ingatkan</span>
                          </a>
                        )}
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
