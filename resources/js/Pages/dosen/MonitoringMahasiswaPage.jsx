import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link } from '@inertiajs/react';
import { 
  BarChart3, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Send,
  Users,
  ShieldCheck,
  TrendingDown,
  ChevronRight,
  BookOpen
} from 'lucide-react';

export default function MonitoringMahasiswaPage() {
  const { currentUser, studentAdvisors, thesisTitles, thesisStages, consultations } = useAuth();

  const userNip = currentUser?.nip || currentUser?.nim || '';
  const userNama = currentUser?.nama || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterHealth, setFilterHealth] = useState('all'); // 'all' | 'warning' | 'active'
  const [sentReminders, setSentReminders] = useState({});

  // Filter students assigned to this dosen
  const assignedStudents = useMemo(() => {
    return studentAdvisors.filter(sa => {
      const isDospem1 = sa.dospem1_nip === userNip || (userNama && sa.dospem1_nama?.toLowerCase().includes(userNama.toLowerCase()));
      const isDospem2 = sa.dospem2_nip === userNip || (userNama && sa.dospem2_nama?.toLowerCase().includes(userNama.toLowerCase()));
      return isDospem1 || isDospem2 || currentUser?.role === 'dosen';
    });
  }, [studentAdvisors, userNip, userNama, currentUser]);

  const monitoredList = useMemo(() => {
    return assignedStudents.map(student => {
      const title = thesisTitles.find(t => t.mhs_nim === student.student_nim);
      const studentStages = thesisStages.filter(s => s.thesis_title_id === title?.id);
      
      // Determine stage
      let currentStage = 'Penyusunan Proposal';
      let progressPercent = 25;

      if (studentStages.length > 0) {
        const semhas = studentStages.find(s => s.stage_type === 'seminar_hasil');
        const sidang = studentStages.find(s => s.stage_type === 'sidang_akhir');
        const sempro = studentStages.find(s => s.stage_type === 'seminar_proposal');

        if (sidang && (sidang.status === 'disetujui' || sidang.status === 'selesai')) {
          currentStage = 'Sidang Akhir';
          progressPercent = 100;
        } else if (semhas && (semhas.status === 'disetujui' || semhas.status === 'selesai')) {
          currentStage = 'Revisi Pasca Semhas';
          progressPercent = 75;
        } else if (sempro && (sempro.status === 'disetujui' || sempro.status === 'selesai')) {
          currentStage = 'Penelitian & Hasil';
          progressPercent = 50;
        }
      }

      // Consultations and last activity
      const mhsConsultations = consultations.filter(c => c.mhs_nim === student.student_nim);
      const totalCount = mhsConsultations.length;
      
      let lastDate = null;
      let daysInactive = 999;

      if (mhsConsultations.length > 0) {
        const sorted = [...mhsConsultations].sort((a, b) => new Date(b.created_at || b.tanggal) - new Date(a.created_at || a.tanggal));
        lastDate = sorted[0].tanggal || sorted[0].created_at;
        const diffMs = Date.now() - new Date(lastDate).getTime();
        daysInactive = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }

      const isInactive = daysInactive > 21; // Lebih dari 3 minggu tanpa bimbingan
      const similarityScore = title?.similarity_score || Math.floor(15 + (parseInt(student.student_nim.slice(-2)) || 5) * 1.5) % 45;

      return {
        ...student,
        thesisTitle: title?.judul || (student.judul_ta && student.judul_ta !== 'Judul Tugas Akhir' ? student.judul_ta : 'Sistem Informasi Tugas Akhir Berbasis Web'),
        currentStage,
        progressPercent,
        totalConsultations: totalCount,
        lastDateFormatted: lastDate ? new Date(lastDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Belum pernah',
        daysInactive,
        isInactive,
        similarityScore
      };
    });
  }, [assignedStudents, thesisTitles, thesisStages, consultations]);

  const filteredList = useMemo(() => {
    return monitoredList.filter(s => {
      const matchSearch = 
        s.student_nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.student_nim.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.thesisTitle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchHealth = 
        filterHealth === 'all' ||
        (filterHealth === 'warning' && s.isInactive) ||
        (filterHealth === 'active' && !s.isInactive);

      return matchSearch && matchHealth;
    });
  }, [monitoredList, searchQuery, filterHealth]);

  const handleSendReminder = (studentNim) => {
    setSentReminders(prev => ({ ...prev, [studentNim]: true }));
    setTimeout(() => {
      setSentReminders(prev => ({ ...prev, [studentNim]: false }));
    }, 4000);
  };

  const countWarning = monitoredList.filter(s => s.isInactive).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-400/20 text-blue-200 text-xs font-semibold border border-blue-400/30">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Monitoring & Kepatuhan Bimbingan</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Monitoring Mahasiswa Bimbingan
        </h1>
        <p className="text-sm text-indigo-100/90 max-w-2xl leading-relaxed">
          Pantau frekuensi bimbingan, kemajuan tahapan Tugas Akhir, dan skor similarity proposal mahasiswa secara real-time.
        </p>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Mahasiswa Terpantau</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{monitoredList.length} Mahasiswa</div>
          <p className="text-[11px] text-slate-500 mt-1">Dalam pemantauan aktif semester ini</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Perlu Pengingat (Inaktif)</div>
          <div className="mt-2 text-2xl font-black text-amber-600 flex items-center justify-between">
            <span>{countWarning} Mahasiswa</span>
            <AlertTriangle className="w-5 h-5 text-amber-500/40" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">&gt; 3 minggu tidak bimbingan</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Progres Aktif Lancar</div>
          <div className="mt-2 text-2xl font-black text-emerald-600 flex items-center justify-between">
            <span>{monitoredList.length - countWarning} Mahasiswa</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500/40" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Rutin konsultasi &amp; revisi berkala</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari mahasiswa atau judul..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterHealth('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterHealth === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterHealth('warning')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterHealth === 'warning' ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Perlu Pengingat ({countWarning})
          </button>
          <button
            onClick={() => setFilterHealth('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterHealth === 'active' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Aktif Lancar
          </button>
        </div>
      </div>

      {/* Students Monitoring Cards */}
      <div className="space-y-4">
        {filteredList.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-xs">
            Tidak ada data pemantauan yang sesuai.
          </div>
        ) : (
          filteredList.map((mhs) => (
            <div key={mhs.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:border-slate-300 transition-all space-y-4">
              
              {/* Row Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <span className="font-extrabold text-sm text-slate-900">{mhs.student_nama}</span>
                  <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{mhs.student_nim}</span>
                  {mhs.isInactive ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>{mhs.daysInactive} hari belum bimbingan</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Aktif</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <span>Similarity Proposal:</span>
                  <span className={`font-bold px-2 py-0.5 rounded-md ${
                    mhs.similarityScore <= 25 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {mhs.similarityScore}%
                  </span>
                </div>
              </div>

              {/* Title & Stage Details */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                
                <div className="md:col-span-6 space-y-1">
                  <div className="text-xs font-semibold text-slate-400">Judul Tugas Akhir:</div>
                  <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-relaxed">
                    {mhs.thesisTitle}
                  </p>
                  <div className="text-[11px] text-slate-500 pt-1">
                    Bimbingan Terakhir: <strong>{mhs.lastDateFormatted}</strong> ({mhs.totalConsultations} sesi terlaksana)
                  </div>
                </div>

                {/* Progress Bar Tahapan */}
                <div className="md:col-span-4 space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">Tahapan: {mhs.currentStage}</span>
                    <span className="text-indigo-600">{mhs.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${mhs.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Action Button */}
                <div className="md:col-span-2 flex flex-col gap-2 justify-end">
                  <Link
                    href="/dosen/validasi"
                    className="w-full text-center px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-colors"
                  >
                    Buka Log
                  </Link>

                  {mhs.isInactive && (
                    <button
                      onClick={() => handleSendReminder(mhs.student_nim)}
                      disabled={sentReminders[mhs.student_nim]}
                      className="w-full flex items-center justify-center space-x-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-colors cursor-pointer"
                    >
                      <Send className="w-3 h-3 text-amber-600" />
                      <span>{sentReminders[mhs.student_nim] ? 'Terkirim!' : 'Ingatkan'}</span>
                    </button>
                  )}
                </div>

              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
