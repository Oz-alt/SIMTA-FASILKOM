import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link } from '@inertiajs/react';
import StudentWhatsAppLink from '../../Components/common/StudentWhatsAppLink.jsx';
import DosenHeaderBanner from '../../Components/common/DosenHeaderBanner.jsx';
import { isConsultationEvaluated, getMinSessionsPerAdvisor } from '../../lib/consultationUtils.js';
import {
  Printer,
  CheckCircle2,
  Clock,
  Search,
  Users,
  Download,
  AlertCircle
} from 'lucide-react';

export default function RekapBimbinganPage() {
  const {
    currentUser,
    studentAdvisors,
    thesisTitles,
    consultations,
    studentAccounts = [],
    masterStudents = [],
    minSessionsRequirement
  } = useAuth();

  const userNip = currentUser?.nip || currentUser?.nim || '';
  const userNama = currentUser?.nama || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterAngkatan, setFilterAngkatan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'eligible' | 'ineligible'

  const MIN_BIMBINGAN = minSessionsRequirement?.minPerAdvisor || getMinSessionsPerAdvisor(); // Minimal bimbingan untuk kelayakan ujian (Status: Diterima)

  const getStudentAngkatan = (nim, titleObj) => {
    const cleanNim = String(nim || '').trim();
    const acc = (studentAccounts || []).find(a => String(a.nim || '').trim() === cleanNim);
    const master = (masterStudents || []).find(m => String(m.nim || '').trim() === cleanNim);
    return (
      (titleObj?.mhs_kelas && titleObj.mhs_kelas !== '-' && titleObj.mhs_kelas !== 'MI 2024' ? titleObj.mhs_kelas : '') ||
      (acc?.kelas && acc.kelas !== '-' ? acc.kelas : '') ||
      (master?.angkatan ? String(master.angkatan) : '') ||
      titleObj?.mhs_kelas ||
      (cleanNim.length >= 9 && /^2[0-9]$/.test(cleanNim.substring(7, 9)) ? `20${cleanNim.substring(7, 9)}` : '-')
    );
  };

  const getSimilarityColor = (score = 0) => {
    const num = Number(score) || 0;
    if (num <= 30) {
      return { textColor: 'text-emerald-700', barColor: 'bg-emerald-500', badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700' };
    }
    if (num <= 50) {
      return { textColor: 'text-amber-700', barColor: 'bg-amber-500', badgeBg: 'bg-amber-50 border-amber-200 text-amber-700' };
    }
    return { textColor: 'text-rose-700', barColor: 'bg-rose-500', badgeBg: 'bg-rose-50 border-rose-200 text-rose-700' };
  };

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

  const rekapData = useMemo(() => {
    return assignedStudents.map(student => {
      const title = thesisTitles.find(t => String(t.mhs_nim || '').trim() === String(student.student_nim || '').trim());
      const mhsConsultations = consultations.filter(c => String(c.mhs_nim || c.nim || '').trim() === String(student.student_nim || '').trim());
      // Sesi bimbingan terhitung apabila telah ditanggapi dosen (Revisi Minor, Revisi Mayor, atau Diterima)
      const approvedCount = mhsConsultations.filter(c => isConsultationEvaluated(c)).length;
      const pendingCount = mhsConsultations.filter(c => !isConsultationEvaluated(c)).length;

      const isEligible = approvedCount >= MIN_BIMBINGAN;
      const realTitle = title?.judul || (!isDummyTitle(student.judul_ta) ? student.judul_ta : '-');
      const angkatan = getStudentAngkatan(student.student_nim, title);
      const similarityScore = Number(title?.skor_kemiripan_terakhir) || 0;

      return {
        ...student,
        angkatan,
        similarityScore,
        thesisTitle: realTitle,
        totalConsultations: mhsConsultations.length,
        approvedCount,
        pendingCount,
        isEligible
      };
    });
  }, [assignedStudents, thesisTitles, consultations, studentAccounts, masterStudents]);

  const availableAngkatan = useMemo(() => {
    const set = new Set(['2025', '2024', '2023', '2022']);
    rekapData.forEach(s => {
      if (s.angkatan && s.angkatan !== '-') {
        set.add(String(s.angkatan));
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [rekapData]);

  const filteredRekap = useMemo(() => {
    return rekapData.filter(s => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        s.student_nama.toLowerCase().includes(q) ||
        s.student_nim.toLowerCase().includes(q) ||
        String(s.angkatan || '').toLowerCase().includes(q) ||
        s.thesisTitle.toLowerCase().includes(q);

      const matchAngkatan =
        filterAngkatan === 'all' ||
        String(s.angkatan || '').includes(filterAngkatan);

      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'eligible' && s.isEligible) ||
        (filterStatus === 'ineligible' && !s.isEligible);

      return matchSearch && matchAngkatan && matchStatus;
    });
  }, [rekapData, searchQuery, filterAngkatan, filterStatus]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header Banner */}
      <DosenHeaderBanner
        title="Evaluasi Bimbingan Mahasiswa"
        subtitle="SISTEM MONITORING TUGAS AKHIR"
        rightContent={
          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-900 text-xs font-semibold transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700" />
            <span>Cetak Rekap Bimbingan</span>
          </button>
        }
      />

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-3.5 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-normal"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <select
            value={filterAngkatan}
            onChange={(e) => setFilterAngkatan(e.target.value)}
            className="flex-1 sm:flex-none sm:w-40 px-3 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer"
          >
            <option value="all">Semua Angkatan</option>
            {availableAngkatan.map(ang => (
              <option key={ang} value={ang}>
                Angkatan {ang}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 sm:flex-none sm:w-44 px-3 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="eligible">Diterima</option>
            <option value="ineligible">Tidak Diterima</option>
          </select>
        </div>
      </div>

      {/* Table Rekapitulasi */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="w-full">
          <table className="w-full table-fixed text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 font-semibold text-slate-500 uppercase text-[10px] tracking-wider">
                <th className="py-3 pl-5 pr-4 w-[21%]">Nama Mahasiswa</th>
                <th className="py-3 px-3 w-[13%]">NIM</th>
                <th className="py-3 px-2 text-center w-[8%]">Angkatan</th>
                <th className="py-3 px-3.5 w-[30%]">Judul</th>
                <th className="py-3 px-2 text-center w-[11%]">Jumlah Bimbingan</th>
                <th className="py-3 px-2 text-center w-[10%]">Status</th>
                <th className="py-3 pl-2 pr-5 text-center w-[7%]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRekap.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    Tidak ada data yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredRekap.map((item) => {
                  const scoreNum = Number(item.similarityScore) || 0;
                  const similarity = getSimilarityColor(scoreNum);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors align-middle">
                      {/* Nama Mahasiswa */}
                      <td className="py-3 pl-5 pr-4 break-words">
                        <div className="font-medium text-slate-800 text-[10px] leading-snug">
                          <StudentWhatsAppLink
                            student={item}
                            nim={item.student_nim}
                            nama={item.student_nama}
                            className="text-slate-800 font-medium hover:text-emerald-700 text-[10px] leading-snug"
                            showIcon={false}
                          >
                            {item.student_nama}
                          </StudentWhatsAppLink>
                        </div>
                      </td>

                      {/* NIM */}
                      <td className="py-3 px-3 font-mono font-medium text-slate-600 text-[10.5px] whitespace-nowrap">
                        {item.student_nim}
                      </td>

                      {/* Angkatan */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200/80">
                          {item.angkatan}
                        </span>
                      </td>

                      {/* Judul & Similarity */}
                      <td className="py-3 px-3.5 break-words">
                        <div className="space-y-1">
                          <p className="text-slate-700 font-normal text-[11px] leading-snug">
                            {item.thesisTitle}
                          </p>
                          {item.thesisTitle && item.thesisTitle !== '-' && (
                            <div className="flex items-center space-x-2">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${similarity.barColor}`}
                                  style={{ width: `${Math.min(100, Math.max(6, scoreNum))}%` }}
                                />
                              </div>
                              <span className={`font-mono text-[10px] font-semibold ${similarity.textColor}`}>
                                {scoreNum}%
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px]">
                          {item.approvedCount} / {MIN_BIMBINGAN}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        {item.isEligible ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                            <span>Diterima</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
                            <span>Belum Diterima</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 pl-2 pr-5 text-center whitespace-nowrap">
                        <Link
                          href={`/dosen/validasi?nim=${item.student_nim}`}
                          className="inline-flex items-center justify-center text-blue-700 hover:text-blue-900 font-semibold bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors text-[10.5px] whitespace-nowrap"
                        >
                          <span>Log</span>
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
