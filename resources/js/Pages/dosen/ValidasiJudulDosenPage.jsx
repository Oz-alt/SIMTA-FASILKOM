import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import StudentWhatsAppLink from '../../Components/common/StudentWhatsAppLink.jsx';
import { isConsultationEvaluated } from '../../lib/consultationUtils.js';
import { 
  Clock,
  X,
  Check,
  CheckCircle2,
  Search,
  Lock,
  Eye
} from 'lucide-react';

export default function ValidasiJudulDosenPage() {
  const {
    currentUser,
    thesisTitles = [],
    studentAdvisors = [],
    consultations = [],
    studentAccounts = [],
    masterStudents = [],
    validateThesisTitleDosen
  } = useAuth();

  const [toastMsg, setToastMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const MIN_BIMBINGAN = 12;

  // Normalize current user identifiers
  const userNip = currentUser?.nip || currentUser?.nim || '';
  const userNama = currentUser?.nama || '';
  const cleanNip = String(userNip || '').trim();
  const cleanNama = (userNama || '').split(',')[0].toLowerCase().trim();

  // Helper ambil Angkatan sesuai profil mahasiswa bersangkutan
  const getStudentAngkatan = (t) => {
    const nim = String(t?.mhs_nim || '').trim();
    const acc = (studentAccounts || []).find(a => String(a.nim || '').trim() === nim);
    const master = (masterStudents || []).find(m => String(m.nim || '').trim() === nim);
    return (
      (t?.mhs_kelas && t.mhs_kelas !== '-' && t.mhs_kelas !== 'MI 2024' ? t.mhs_kelas : '') ||
      (acc?.kelas && acc.kelas !== '-' ? acc.kelas : '') ||
      (master?.angkatan ? String(master.angkatan) : '') ||
      t?.mhs_kelas ||
      '-'
    );
  };

  // Filter titles where this dosen is proposed as Pembimbing 1 or 2, or assigned
  const relevantTitles = useMemo(() => {
    return (thesisTitles || []).filter(t => {
      const isProposed1 = (cleanNip && String(t.pembimbing_1_nip || '').trim() === cleanNip) || 
                          (cleanNama && t.pembimbing_1 && t.pembimbing_1.toLowerCase().includes(cleanNama));
      const isProposed2 = (cleanNip && String(t.pembimbing_2_nip || '').trim() === cleanNip) || 
                          (cleanNama && t.pembimbing_2 && t.pembimbing_2.toLowerCase().includes(cleanNama));
      const isAssigned = (studentAdvisors || []).some(sa => 
        String(sa.student_nim || '').trim() === String(t.mhs_nim || '').trim() && 
        ((cleanNip && (String(sa.dospem1_nip || '').trim() === cleanNip || String(sa.dospem2_nip || '').trim() === cleanNip)) ||
         (cleanNama && ((sa.dospem1_nama && sa.dospem1_nama.toLowerCase().includes(cleanNama)) || (sa.dospem2_nama && sa.dospem2_nama.toLowerCase().includes(cleanNama)))))
      );
      return isProposed1 || isProposed2 || isAssigned;
    });
  }, [thesisTitles, studentAdvisors, cleanNip, cleanNama]);

  // Enrich setiap baris dengan peran dosen (Pembimbing 1 / 2), progres bimbingan, dan status persetujuan
  const tableRows = useMemo(() => {
    return relevantTitles.map(t => {
      const nim = String(t.mhs_nim || '').trim();
      const sa = (studentAdvisors || []).find(s => String(s.student_nim || '').trim() === nim);

      const isDospem1 =
        (cleanNip && (String(t.pembimbing_1_nip || '').trim() === cleanNip || String(sa?.dospem1_nip || '').trim() === cleanNip)) ||
        (cleanNama && ((t.pembimbing_1 && t.pembimbing_1.toLowerCase().includes(cleanNama)) || (sa?.dospem1_nama && sa.dospem1_nama.toLowerCase().includes(cleanNama))));

      const isDospem2 =
        !isDospem1 && (
          (cleanNip && (String(t.pembimbing_2_nip || '').trim() === cleanNip || String(sa?.dospem2_nip || '').trim() === cleanNip)) ||
          (cleanNama && ((t.pembimbing_2 && t.pembimbing_2.toLowerCase().includes(cleanNama)) || (sa?.dospem2_nama && sa.dospem2_nama.toLowerCase().includes(cleanNama))))
        );

      // Hitung bimbingan mahasiswa di Pembimbing 1
      const mhsCons = (consultations || []).filter(c => String(c.mhs_nim || c.nim || '').trim() === nim);
      const pemb1Cons = mhsCons.filter(c => {
        const p = String(c.pembimbing || '').toLowerCase().trim();
        return !p.includes('2');
      });

      const evaluatedCount = pemb1Cons.filter(c => isConsultationEvaluated(c)).length;
      const hasDiterimaInLog = pemb1Cons.some(c =>
        c.status === 'disetujui' || String(c.jenis_revisi || '').toLowerCase().trim() === 'diterima'
      );

      // Status judul: Disetujui jika sudah direkomendasikan/disetujui Pembimbing 1, selain itu default "Diajukan"
      const isApproved =
        t.rekomendasi_dospem_status === 'direkomendasikan' ||
        t.status === 'disetujui' ||
        t.status === 'judul_fix';

      // Syarat tombol Disetujui aktif: Hanya untuk Pembimbing 1, bimbingan >= 12x & ada status Diterima di log bimbingan
      const canApprove = isDospem1 && evaluatedCount >= MIN_BIMBINGAN && hasDiterimaInLog;

      return {
        ...t,
        angkatan: getStudentAngkatan(t),
        isDospem1,
        isDospem2,
        roleLabel: isDospem1 ? 'Pembimbing 1' : isDospem2 ? 'Pembimbing 2' : 'Pembimbing 1',
        evaluatedCount,
        hasDiterimaInLog,
        isApproved,
        statusLabel: isApproved ? 'Disetujui' : 'Diajukan',
        canApprove
      };
    });
  }, [relevantTitles, studentAdvisors, consultations, studentAccounts, masterStudents, cleanNip, cleanNama]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return tableRows;
    return tableRows.filter(r =>
      (r.mhs_nama || '').toLowerCase().includes(q) ||
      (r.mhs_nim || '').toLowerCase().includes(q) ||
      (r.judul || '').toLowerCase().includes(q) ||
      String(r.angkatan || '').toLowerCase().includes(q)
    );
  }, [tableRows, searchQuery]);

  // Statistik rekap
  const totalUsulan = tableRows.length;
  const totalDisetujui = tableRows.filter(t => t.isApproved).length;
  const totalDiajukan = tableRows.filter(t => !t.isApproved).length;

  const pct = (n) => totalUsulan > 0 ? Math.round((n / totalUsulan) * 100) : 0;

  // Setujui judul (khusus Pembimbing 1 yang memenuhi syarat)
  const handleApproveTitle = (row) => {
    if (!row.canApprove || row.isApproved) return;
    validateThesisTitleDosen(row.id, 'direkomendasikan', '');
    setToastMsg(`Judul "${row.judul}" milik ${row.mhs_nama} berhasil disetujui.`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Helper warna skor kemiripan
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Toast Notification Alert */}
      {toastMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-2xs animate-in fade-in">
          <span>{toastMsg}</span>
          <button 
            type="button" 
            onClick={() => setToastMsg('')} 
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer text-xs p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Halaman */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl py-8 sm:py-9 px-6 sm:px-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Validasi Judul Mahasiswa
          </h1>
        </div>
      </div>

      {/* Search Bar Terpisah */}
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
      </div>

      {/* Tabel Validasi Judul Mahasiswa */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 font-semibold text-slate-500 uppercase text-[11px] tracking-wider">
                <th className="py-2.5 px-3.5 whitespace-nowrap">Nama</th>
                <th className="py-2.5 px-3.5 whitespace-nowrap">NIM</th>
                <th className="py-2.5 px-3.5 text-center whitespace-nowrap">Angkatan</th>
                <th className="py-2.5 px-3.5">Judul</th>
                <th className="py-2.5 px-3.5 text-center whitespace-nowrap">Similarity</th>
                <th className="py-2.5 px-3.5 text-center whitespace-nowrap">Status</th>
                <th className="py-2.5 px-3.5 text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                    Belum ada usulan judul mahasiswa bimbingan yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const scoreNum = Number(row.skor_kemiripan_terakhir) || 0;
                  const similarity = getSimilarityColor(scoreNum);

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors align-middle">
                      {/* Nama Mahasiswa (Wajib 1 Baris, seukuran NIM) */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <div className="font-medium text-slate-900 text-[11px] whitespace-nowrap">
                          <StudentWhatsAppLink
                            nim={row.mhs_nim}
                            nama={row.mhs_nama}
                            className="text-slate-900 font-medium hover:text-emerald-700 whitespace-nowrap text-[11px]"
                            showIcon={false}
                          >
                            {row.mhs_nama}
                          </StudentWhatsAppLink>
                        </div>
                      </td>

                      {/* NIM */}
                      <td className="py-2.5 px-3.5 font-mono font-medium text-slate-600 whitespace-nowrap text-[11px]">
                        {row.mhs_nim}
                      </td>

                      {/* Angkatan */}
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200/80">
                          {row.angkatan}
                        </span>
                      </td>

                      {/* Judul Tugas Akhir */}
                      <td className="py-2.5 px-3.5 max-w-md">
                        <p className="text-xs font-normal text-slate-700 leading-snug" title={row.judul}>
                          {row.judul}
                        </p>
                      </td>

                      {/* Similarity */}
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center space-x-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${similarity.barColor}`}
                              style={{ width: `${Math.min(100, Math.max(6, scoreNum))}%` }}
                            />
                          </div>
                          <span className={`font-mono text-xs font-semibold ${similarity.textColor}`}>
                            {scoreNum}%
                          </span>
                        </div>
                      </td>

                      {/* Status (Default: Diajukan | Setelah disetujui Pembimbing 1: Disetujui) */}
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        {row.isApproved ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Disetujui</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Diajukan</span>
                          </span>
                        )}
                      </td>

                      {/* Aksi: Simetris di tengah (text-center) */}
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        {row.isDospem2 ? (
                          <span
                            className="inline-flex items-center justify-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium"
                            title="Sebagai Pembimbing 2, Anda hanya dapat melihat status persetujuan dari Pembimbing 1"
                          >
                            <Eye className="w-3 h-3 text-slate-400" />
                            <span>{row.isApproved ? 'Disetujui' : 'Diajukan'}</span>
                          </span>
                        ) : row.isApproved ? (
                          <button
                            type="button"
                            disabled
                            className="inline-flex items-center justify-center space-x-1 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs cursor-default"
                          >
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Disetujui</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleApproveTitle(row)}
                            disabled={!row.canApprove}
                            title={
                              row.canApprove
                                ? 'Klik untuk menyetujui judul Tugas Akhir mahasiswa'
                                : `Syarat belum terpenuhi: Bimbingan Pembimbing 1 (${row.evaluatedCount}/${MIN_BIMBINGAN}) & status Diterima di log bimbingan`
                            }
                            className={`inline-flex items-center justify-center space-x-1 px-3 py-1 rounded-lg font-semibold text-xs transition-all ${
                              row.canApprove
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer'
                                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            }`}
                          >
                            {row.canApprove ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Lock className="w-3 h-3 text-slate-400" />
                            )}
                            <span>Disetujui</span>
                          </button>
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
