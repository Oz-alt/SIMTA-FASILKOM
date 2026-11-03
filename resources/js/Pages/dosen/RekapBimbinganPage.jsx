import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link } from '@inertiajs/react';
import StudentWhatsAppLink from '../../Components/common/StudentWhatsAppLink.jsx';
import { isConsultationEvaluated } from '../../lib/consultationUtils.js';
import { 
  FileText, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Search, 
  Users, 
  Download,
  AlertCircle
} from 'lucide-react';

export default function RekapBimbinganPage() {
  const { currentUser, studentAdvisors, thesisTitles, consultations } = useAuth();

  const userNip = currentUser?.nip || currentUser?.nim || '';
  const userNama = currentUser?.nama || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'eligible' | 'ineligible' | 'pending'

  const MIN_BIMBINGAN = 12; // Minimal 12x bimbingan untuk kelayakan ujian (Status: Diterima)

  // Filter students assigned to this dosen
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

    if (cleanNip === '198410012009121005' || cleanNama.includes('abdiansah')) {
      const standard16 = [
        { nim: '09010182428003', nama: 'AKHMAD LATIEF SRI BINTANG PAMUNGKAS', dospem1_nip: '198410012009121005' },
        { nim: '09010182428002', nama: 'AULIA AZZAHRA', dospem1_nip: '198410012009121005' },
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
            status_pembagian: 'lengkap'
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

  const rekapData = useMemo(() => {
    return assignedStudents.map(student => {
      const title = thesisTitles.find(t => String(t.mhs_nim || '').trim() === String(student.student_nim || '').trim());
      const mhsConsultations = consultations.filter(c => String(c.mhs_nim || c.nim || '').trim() === String(student.student_nim || '').trim());
      // Sesi bimbingan terhitung apabila telah ditanggapi dosen (Revisi Minor, Revisi Mayor, atau Diterima)
      const approvedCount = mhsConsultations.filter(c => isConsultationEvaluated(c)).length;
      const pendingCount = mhsConsultations.filter(c => !isConsultationEvaluated(c)).length;
      
      const isEligible = approvedCount >= MIN_BIMBINGAN;
      const realTitle = title?.judul || (!isDummyTitle(student.judul_ta) ? student.judul_ta : '-');

      return {
        ...student,
        thesisTitle: realTitle,
        totalConsultations: mhsConsultations.length,
        approvedCount,
        pendingCount,
        isEligible
      };
    });
  }, [assignedStudents, thesisTitles, consultations]);

  const filteredRekap = useMemo(() => {
    return rekapData.filter(s => {
      const matchSearch = 
        s.student_nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.student_nim.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.thesisTitle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = 
        filterStatus === 'all' ||
        (filterStatus === 'eligible' && s.isEligible) ||
        (filterStatus === 'ineligible' && !s.isEligible) ||
        (filterStatus === 'pending' && s.pendingCount > 0);

      return matchSearch && matchStatus;
    });
  }, [rekapData, searchQuery, filterStatus]);

  const eligibleCount = rekapData.filter(s => s.isEligible).length;
  const pendingTotalCount = rekapData.reduce((acc, s) => acc + s.pendingCount, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-400/20 text-blue-200 text-xs font-medium border border-blue-400/30">
              <FileText className="w-3.5 h-3.5" />
              <span>Rekapitulasi Konsultasi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2">
              Rekap Bimbingan Mahasiswa
            </h1>
            <p className="text-sm text-indigo-100/90 max-w-2xl leading-relaxed mt-1 font-normal">
              Rekapitulasi jumlah bimbingan mahasiswa untuk evaluasi syarat kelayakan pendaftaran Seminar Hasil &amp; Sidang Tugas Akhir (Minimal {MIN_BIMBINGAN} bimbingan tervalidasi).
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-semibold transition-all shadow-sm shrink-0 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-700" />
            <span>Cetak Rekap Bimbingan</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Mahasiswa</div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">{rekapData.length} Mahasiswa</div>
          <p className="text-xs text-slate-500 mt-1 font-normal">Dalam pembimbingan aktif</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status Kelayakan Diterima (&ge; {MIN_BIMBINGAN})</div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 tracking-tight flex items-center justify-between">
            <span>{eligibleCount} Mahasiswa</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500/40" />
          </div>
          <p className="text-xs text-slate-500 mt-1 font-normal">Tervalidasi minimal 12 sesi</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Belum Memenuhi (&lt; {MIN_BIMBINGAN})</div>
          <div className="mt-2 text-2xl font-bold text-amber-600 tracking-tight flex items-center justify-between">
            <span>{rekapData.length - eligibleCount} Mahasiswa</span>
            <Clock className="w-5 h-5 text-amber-500/40" />
          </div>
          <p className="text-xs text-slate-500 mt-1 font-normal">Memerlukan sesi bimbingan lanjutan</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari mahasiswa atau judul..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-normal"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto flex-wrap gap-y-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterStatus('eligible')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === 'eligible' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Diterima ({eligibleCount})
          </button>
          <button
            onClick={() => setFilterStatus('ineligible')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === 'ineligible' ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Belum Cukup ({rekapData.length - eligibleCount})
          </button>
        </div>
      </div>

      {/* Table Rekapitulasi */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 font-semibold text-slate-500 uppercase text-xs tracking-wider">
                <th className="py-3 px-4">No.</th>
                <th className="py-3 px-4">Nama Mahasiswa &amp; NIM</th>
                <th className="py-3 px-4">Judul Tugas Akhir</th>
                <th className="py-3 px-4 text-center">Tervalidasi</th>
                <th className="py-3 px-4 text-center">Status Kelayakan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRekap.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    Tidak ada data yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredRekap.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-400 text-xs">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 text-sm">
                        <StudentWhatsAppLink
                          student={item}
                          nim={item.student_nim}
                          nama={item.student_nama}
                          className="text-slate-900 font-semibold hover:text-emerald-700"
                          showIcon={false}
                        >
                          {item.student_nama}
                        </StudentWhatsAppLink>
                      </div>
                      <div className="text-xs font-mono text-slate-500 font-medium">{item.student_nim}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium text-xs sm:text-sm leading-relaxed max-w-[280px] truncate" title={item.thesisTitle}>
                      {item.thesisTitle}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-xs">
                        {item.approvedCount} / {MIN_BIMBINGAN}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {item.isEligible ? (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Diterima</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Kurang {MIN_BIMBINGAN - item.approvedCount}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/dosen/validasi?nim=${item.student_nim}`}
                        className="inline-flex items-center space-x-1 text-blue-700 hover:text-blue-900 font-semibold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors text-xs"
                      >
                        <span>Lihat Log</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
