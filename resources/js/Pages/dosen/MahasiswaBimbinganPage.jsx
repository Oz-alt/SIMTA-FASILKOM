import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link } from '@inertiajs/react';
import StudentWhatsAppLink from '../../Components/common/StudentWhatsAppLink.jsx';
import { isConsultationEvaluated } from '../../lib/consultationUtils.js';
import { 
  Users, 
  Search, 
  MessageSquare, 
  Send 
} from 'lucide-react';

export default function MahasiswaBimbinganPage() {
  const { currentUser, studentAdvisors, thesisTitles, consultations } = useAuth();

  const userNip = currentUser?.nip || currentUser?.nim || '';
  const userNama = currentUser?.nama || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterHealth, setFilterHealth] = useState('all'); // 'all' | 'new' | 'active' | 'warning'
  const [sentReminders, setSentReminders] = useState({});

  // Pelacakan pengajuan yang telah dilihat / dibuka dosen
  const [seenStudentMap, setSeenStudentMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('simta_seen_student_bimbingan') || '{}');
    } catch {
      return {};
    }
  });

  const [seenConsultationIds, setSeenConsultationIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('simta_seen_consultation_ids') || '[]'));
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    const handleSync = () => {
      try {
        setSeenStudentMap(JSON.parse(localStorage.getItem('simta_seen_student_bimbingan') || '{}'));
        setSeenConsultationIds(new Set(JSON.parse(localStorage.getItem('simta_seen_consultation_ids') || '[]')));
      } catch {}
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('simta_notifications_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('simta_notifications_updated', handleSync);
    };
  }, []);

  const handleOpenStudentLog = (studentNim, pendingList = []) => {
    try {
      const seen = JSON.parse(localStorage.getItem('simta_seen_student_bimbingan') || '{}');
      seen[String(studentNim).trim()] = Date.now();
      localStorage.setItem('simta_seen_student_bimbingan', JSON.stringify(seen));

      const seenIds = new Set(JSON.parse(localStorage.getItem('simta_seen_consultation_ids') || '[]'));
      (pendingList || []).forEach(c => {
        if (c?.id) seenIds.add(String(c.id));
      });
      localStorage.setItem('simta_seen_consultation_ids', JSON.stringify(Array.from(seenIds)));

      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('simta_notifications_updated'));
    } catch {}
  };

  // 1. Filter students assigned to this dosen
  const assignedStudents = useMemo(() => {
    const cleanNip = String(userNip || '').trim();
    const cleanNama = (userNama || '').split(',')[0].toLowerCase().trim();

    const matched = studentAdvisors.filter(sa => {
      const isDospem1 = (cleanNip && String(sa.dospem1_nip || '').trim() === cleanNip) ||
                        (cleanNama && sa.dospem1_nama && sa.dospem1_nama.toLowerCase().includes(cleanNama));
      const isDospem2 = (cleanNip && String(sa.dospem2_nip || '').trim() === cleanNip) ||
                        (cleanNama && sa.dospem2_nama && sa.dospem2_nama.toLowerCase().includes(cleanNama));
      return isDospem1 || isDospem2;
    });

    // Ensure all 16 students from standard cohort are present for Dr. Abdiansah if localStorage only had 14
    if (cleanNip === '198410012009121005' || cleanNama.includes('abdiansah')) {
      const standard16 = [
        { nim: '09010182428003', nama: 'AKHMAD LATIEF SRI BINTANG PAMUNGKAS', dospem1_nip: '198410012009121005' },
        { nim: '09010182428002', nama: 'AULIA AZZAHRA', dospem1_nip: '198410012009121005', no_hp: '088747905153' },
        { nim: '09010582428099', nama: 'CINOIEY JULIEN RIZKY', dospem1_nip: '198410012009121005' },
        { nim: '09010282428041', nama: 'EGIR EXTRA APENA', dospem1_nip: '198410012009121005' },
        { nim: '09010282428042', nama: 'INTAN NURAINI', dospem1_nip: '198410012009121005' },
        { nim: '09010182428009', nama: 'MEDINA ZAHRAH', dospem1_nip: '198410012009121005' },
        { nim: '09010182428011', nama: 'MELVA OLIFIA', dospem1_nip: '198410012009121005' },
        { nim: '09010282428031', nama: 'MUHAMMAD RIZKY ELPARIZA', dospem1_nip: '198410012009121005' },
        { nim: '09010182428017', nama: 'MUHAMMAD RUSLI ANDIKA', dospem1_nip: '198410012009121005' },
        { nim: '09010182428013', nama: 'NAZWA KAMILA TABITA SARI', dospem1_nip: '198410012009121005' },
        { nim: '09010282428021', nama: 'NYIMAS AYU ASRI MUTH MAINNAH', dospem1_nip: '198410012009121005' },
        { nim: '09010182428012', nama: 'TESA ALIZIA PUTRI', dospem1_nip: '198410012009121005' },
        { nim: '09010582428094', nama: 'YUDA BAGASKARA SARIPUDIN', dospem1_nip: '198410012009121005' },
        { nim: '09010282428029', nama: 'ZAQILLA SAHIL', dospem1_nip: '198410012009121005' },
        { nim: '09010582428095', nama: 'ALDURRA HADI PRAMANTYO', dospem1_nip: '198410012009121005' },
        { nim: '09010582428096', nama: 'ALIEF RIDOVI PANJAITAN', dospem1_nip: '198410012009121005' }
      ];

      const existingNims = new Set(matched.map(s => String(s.student_nim)));
      standard16.forEach(std => {
        if (!existingNims.has(std.nim)) {
          matched.push({
            id: `seed-std-${std.nim}`,
            student_nim: std.nim,
            student_nama: std.nama,
            prodi: 'D3 Manajemen Informatika',
            judul_ta: '',
            dospem1_nip: std.dospem1_nip,
            dospem1_nama: 'Dr. Abdiansah, S.Kom., M.Cs.',
            status_pembagian: 'lengkap',
            ...(std.no_hp ? { no_hp: std.no_hp } : {})
          });
        }
      });
    }

    return matched;
  }, [studentAdvisors, userNip, userNama]);

  const isDummyTitle = (val) => {
    const clean = String(val || '').trim();
    return (
      !clean ||
      clean === '-' ||
      clean === 'Judul Tugas Akhir' ||
      clean === 'Sistem Informasi Tugas Akhir' ||
      clean === 'Rancang Bangun Sistem Informasi Tugas Akhir' ||
      clean === 'Rancang Bangun Sistem Informasi Tugas Akhir Berbasis Web' ||
      clean.includes('Peminjaman Ruang Sidang')
    );
  };

  // 2. Data mahasiswa diperkaya dengan info bimbingan real-time
  const enrichedStudents = useMemo(() => {
    return assignedStudents.map(student => {
      const title = thesisTitles.find(t => String(t.mhs_nim || '').trim() === String(student.student_nim || '').trim());

      // Konsultasi milik mahasiswa ini
      const mhsConsultations = consultations.filter(c => String(c.mhs_nim || c.nim).trim() === String(student.student_nim).trim());
      const approvedConsultations = mhsConsultations.filter(c => isConsultationEvaluated(c));
      
      // Pengajuan bimbingan baru yang belum diperiksa (status menunggu tanggapan)
      const pendingConsultations = mhsConsultations.filter(c => 
        !c.status || 
        c.status === 'menunggu' || 
        c.status === 'menunggu_tanggapan' || 
        c.status === 'menunggu_validasi' || 
        c.status === 'pending' || 
        c.jenis_revisi === 'Menunggu'
      );
      
      const totalCount = mhsConsultations.length;
      const progressPercent = Math.min(100, Math.round((totalCount / 24) * 100));
      const pendingCount = pendingConsultations.length;

      // Mahasiswa hanya memiliki indikator titik merah jika ada pengajuan bimbingan yang belum pernah dilihat/dibuka dosen
      const studentNim = String(student.student_nim || '').trim();
      const lastSeenTime = seenStudentMap[studentNim] ? Number(seenStudentMap[studentNim]) : 0;
      
      const unviewedPendingConsultations = pendingConsultations.filter(c => {
        if (c.id && seenConsultationIds.has(String(c.id))) return false;
        if (lastSeenTime > 0) {
          const cTime = c.created_at || c.tanggal ? new Date(c.created_at || c.tanggal).getTime() : 0;
          if (cTime && lastSeenTime >= cTime) return false;
          if (!cTime) return false;
        }
        return true;
      });

      const hasNewSubmission = unviewedPendingConsultations.length > 0;

      // Ambil waktu pengajuan bimbingan terbaru untuk keperluan pengurutan
      const latestPendingDate = hasNewSubmission 
        ? (unviewedPendingConsultations[0]?.tanggal || unviewedPendingConsultations[0]?.created_at || '2026-10-28')
        : null;

      let lastDate = null;
      let daysInactive = 999;

      if (mhsConsultations.length > 0) {
        const sorted = [...mhsConsultations].sort((a, b) => new Date(b.created_at || b.tanggal) - new Date(a.created_at || a.tanggal));
        lastDate = sorted[0].tanggal || sorted[0].created_at;
        if (lastDate) {
          const diffMs = Date.now() - new Date(lastDate).getTime();
          daysInactive = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        }
      }

      // Inaktif jika > 21 hari tanpa bimbingan
      const isInactive = daysInactive > 21;

      return {
        ...student,
        thesisTitle: title?.judul || (!isDummyTitle(student.judul_ta) ? student.judul_ta : '-'),
        totalConsultations: totalCount,
        approvedConsultations: approvedConsultations.length,
        pendingCount,
        pendingConsultationsList: pendingConsultations,
        hasNewSubmission,
        latestPendingDate,
        progressPercent,
        daysInactive,
        isInactive,
        isReadyForDefense: totalCount >= 24
      };
    });
  }, [assignedStudents, thesisTitles, consultations, seenStudentMap, seenConsultationIds]);

  // 3. Filter dan Pengurutan Otomatis:
  // Data mahasiswa yang memiliki pengajuan baru (hasNewSubmission) diprioritaskan di urutan paling atas!
  const filteredStudents = useMemo(() => {
    const list = enrichedStudents.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        s.student_nama.toLowerCase().includes(q) ||
        s.student_nim.toLowerCase().includes(q) ||
        s.thesisTitle.toLowerCase().includes(q);

      const matchHealth = 
        filterHealth === 'all' ||
        (filterHealth === 'new' && s.hasNewSubmission) ||
        (filterHealth === 'warning' && s.isInactive) ||
        (filterHealth === 'active' && !s.isInactive);

      return matchSearch && matchHealth;
    });

    // Otomatis prioritaskan pengajuan baru paling atas
    return list.sort((a, b) => {
      // 1. Yang punya pengajuan baru (belum diperiksa) pindah ke urutan teratas
      if (a.hasNewSubmission && !b.hasNewSubmission) return -1;
      if (!a.hasNewSubmission && b.hasNewSubmission) return 1;

      // 2. Jika sama-sama ada pengajuan baru, dahulukan tanggal pengajuan yang paling baru
      if (a.hasNewSubmission && b.hasNewSubmission) {
        const timeA = new Date(a.latestPendingDate || '2026-01-01').getTime();
        const timeB = new Date(b.latestPendingDate || '2026-01-01').getTime();
        return timeB - timeA;
      }

      // 3. Sisanya diurutkan alfabetis nama
      return a.student_nama.localeCompare(b.student_nama);
    });
  }, [enrichedStudents, searchQuery, filterHealth]);

  const handleSendReminder = (studentNim) => {
    setSentReminders(prev => ({ ...prev, [studentNim]: true }));
    setTimeout(() => {
      setSentReminders(prev => ({ ...prev, [studentNim]: false }));
    }, 4000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* ── 1. HEADER BANNER ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl py-8 sm:py-9 px-6 sm:px-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Progres Monitoring
          </h1>
        </div>
      </div>



      {/* ── 3. SEARCH & FILTERS ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-9 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setFilterHealth('all')}
            className={`h-10 inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filterHealth === 'all' 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterHealth('new')}
            className={`h-10 inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filterHealth === 'new' 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Pengajuan Baru
          </button>
          <button
            onClick={() => setFilterHealth('active')}
            className={`h-10 inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filterHealth === 'active' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Lancar
          </button>
          <button
            onClick={() => setFilterHealth('warning')}
            className={`h-10 inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filterHealth === 'warning' 
                ? 'bg-amber-500 text-white shadow-xs' 
                : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Perlu Pengingat
          </button>
        </div>
      </div>

      {/* ── 4. STUDENT CARDS LIST (DENGAN PRIORITAS PENGAJUAN BARU DI ATAS) ── */}
      <div className="space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3 shadow-xs">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-semibold text-slate-700">Tidak ada data mahasiswa yang sesuai</div>
            <p className="text-xs text-slate-400 max-w-md mx-auto font-normal">
              Silakan sesuaikan kata kunci pencarian atau tombol filter status di atas.
            </p>
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div 
              key={student.id} 
              className="relative bg-white rounded-xl p-3.5 sm:p-4 transition-all shadow-xs hover:shadow-sm border border-slate-200/80 hover:border-slate-300"
            >
              {/* Titik Merah Otomatis di Sudut Kiri Atas Ketika Ada Pengajuan Baru */}
              {student.hasNewSubmission && (
                <span 
                  className="absolute -top-1 -left-1 flex h-2.5 w-2.5 z-10" 
                  title="Ada pengajuan bimbingan baru"
                >
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 ring-2 ring-white shadow-xs"></span>
                </span>
              )}

              {/* Baris Konten: Nama & Judul Berdekatan (Kiri) & Progres Bimbingan di atas Tombol Log (Kanan) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Kolom Kiri: Nama Mahasiswa & Judul TA Saling Berdekatan Tanpa Pemisah */}
                <div className="flex-1 min-w-0 space-y-1 pr-0 md:pr-4">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    {/* Nama Mahasiswa (Tautan WhatsApp bersih tanpa ikon) */}
                    <StudentWhatsAppLink
                      student={student}
                      nim={student.student_nim}
                      nama={student.student_nama}
                      className="font-medium text-xs text-slate-900 tracking-tight hover:text-emerald-700"
                      showIcon={false}
                    >
                      {student.student_nama}
                    </StudentWhatsAppLink>

                    {/* NIM */}
                    <span className="font-mono text-[11px] text-slate-500 bg-slate-100/90 border border-slate-200/60 px-1.5 py-0.5 rounded font-medium">
                      {student.student_nim}
                    </span>
                  </div>

                  {/* Judul Tugas Akhir ditampilkan LANGSUNG berdekatan dengan nama */}
                  <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-normal" title={student.thesisTitle}>
                    {student.thesisTitle}
                  </p>
                </div>

                {/* Kolom Kanan: Progres Bimbingan di ATAS Tombol Buka Log Bimbingan */}
                <div className="w-full md:w-64 shrink-0 space-y-2">
                  {/* Progres Bimbingan Sederhana & Bersih */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-medium">
                      <span className="text-slate-500">Progres Bimbingan</span>
                      <span className={`font-mono font-semibold ${student.isReadyForDefense ? 'text-emerald-600' : 'text-indigo-600'}`}>
                        {student.progressPercent}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          student.isReadyForDefense ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${student.progressPercent > 0 ? Math.max(student.progressPercent, 4) : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Tombol Aksi */}
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/dosen/validasi?nim=${student.student_nim}`}
                      onClick={() => handleOpenStudentLog(student.student_nim, student.pendingConsultationsList)}
                      className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shadow-xs cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span>Buka Log Bimbingan</span>
                    </Link>

                    {student.isInactive && (
                      <button
                        onClick={() => handleSendReminder(student.student_nim)}
                        disabled={sentReminders[student.student_nim]}
                        className="inline-flex items-center justify-center space-x-1 px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-medium border border-amber-200/90 whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
                        title="Kirim pengingat agar mahasiswa aktif bimbingan"
                      >
                        <Send className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{sentReminders[student.student_nim] ? 'Terkirim' : 'Ingatkan'}</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
