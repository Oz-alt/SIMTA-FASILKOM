import React, { useState, useMemo, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useAuth } from '../../context/AuthContext.jsx';
import SimilarityGauge from '../../Components/common/SimilarityGauge.jsx';
import StatusBadge from '../../Components/common/StatusBadge.jsx';
import { checkClientMultiFieldSimilarity } from '../../lib/similarityEngine.js';
import { getStudentSemester } from '../../lib/academicUtils.js';
import {
  getStudentCredential,
  getCachedStudentCredential,
  normalizeStudentAngkatan
} from '../../services/studentCredentials.js';
import {
  ArrowLeft,
  AlertCircle,
  GraduationCap,
  BookOpen,
  History,
  Calendar,
  Users
} from 'lucide-react';

export default function DetailTinjauJudulPage({ titleId: propTitleId }) {
  const { url } = usePage();
  const {
    thesisTitles,
    historicalTitles = [],
    thesisArchives = [],
    advisors = [],
    getStudentAdvisors,
    getAllMahasiswaAccounts,
    accountsVersion
  } = useAuth();

  // Resolve ID from props or URL pathname (/kaprodi/titles/:id)
  const resolvedId = useMemo(() => {
    if (propTitleId) return String(propTitleId);
    const parts = (url || window.location.pathname).split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1];
    return lastPart || null;
  }, [propTitleId, url]);

  // Find target title in reactive state
  const title = useMemo(() => {
    if (!resolvedId) return null;
    return thesisTitles.find(t => String(t.id).trim() === String(resolvedId).trim()) || null;
  }, [thesisTitles, resolvedId]);

  const [remoteCred, setRemoteCred] = useState(() => (
    title?.mhs_nim ? getCachedStudentCredential(title.mhs_nim) : null
  ));

  useEffect(() => {
    if (!title?.mhs_nim) return;
    let active = true;
    const cached = getCachedStudentCredential(title.mhs_nim);
    if (cached) setRemoteCred(cached);
    getStudentCredential(title.mhs_nim, { fresh: true })
      .then(res => {
        if (active && res) setRemoteCred(res);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [title?.mhs_nim]);

  // Resolve Angkatan Mahasiswa langsung mengikuti isi profil mahasiswa bersangkutan
  const studentAngkatan = useMemo(() => {
    if (!title) return '';
    const nim = String(title.mhs_nim || '').trim();
    const cred = remoteCred || (nim ? getCachedStudentCredential(nim) : null);
    if (cred?.kelas) {
      const fromCred = normalizeStudentAngkatan(cred.kelas);
      if (fromCred) return fromCred;
    }

    if (nim && typeof getAllMahasiswaAccounts === 'function') {
      const allMhs = getAllMahasiswaAccounts() || [];
      const matched = allMhs.find(m => String(m.nim || '').trim() === nim);
      if (matched?.kelas) {
        const fromAcc = normalizeStudentAngkatan(matched.kelas);
        if (fromAcc) return fromAcc;
      }
    }

    return normalizeStudentAngkatan(title.angkatan || title.mhs_kelas || '');
  }, [title, remoteCred, getAllMahasiswaAccounts, accountsVersion]);

  const assignedAdv = useMemo(() => {
    if (!title?.mhs_nim || typeof getStudentAdvisors !== 'function') return null;
    return getStudentAdvisors(title.mhs_nim);
  }, [title?.mhs_nim, getStudentAdvisors]);

  const resolvedPembimbing = useMemo(() => {
    if (!title) return { p1: null, p2: null };
    const findByNip = (nip) => (advisors || []).find(a => String(a.nip || '').trim() === String(nip || '').trim()) || null;
    const p1 = assignedAdv?.dospem1 || findByNip(title.pembimbing_1_nip) || (title.pembimbing_1_nama ? { nama: title.pembimbing_1_nama, nip: title.pembimbing_1_nip || '' } : null);
    const p2 = assignedAdv?.dospem2 || findByNip(title.pembimbing_2_nip) || (title.pembimbing_2_nama ? { nama: title.pembimbing_2_nama, nip: title.pembimbing_2_nip || '' } : null);
    return { p1, p2 };
  }, [title, assignedAdv, advisors]);

  // Hitung skor similarity secara real-time dengan engine yang identik 100% dengan halaman Mahasiswa (AjukanJudulPage)
  const liveSimilarity = useMemo(() => {
    if (!title) {
      return { highestScore: 0, highestTitleScore: 0, highestAbstractScore: 0, hasAbstract: false };
    }
    const initJudul = String(title.judul || '').trim();
    const initAbstrak = String(title.deskripsi || title.abstrak || '').trim();
    if (initJudul.length < 5) {
      const fallback = Number(title.skor_kemiripan_terakhir) || 0;
      return { highestScore: fallback, highestTitleScore: fallback, highestAbstractScore: 0, hasAbstract: Boolean(initAbstrak) };
    }
    const targetNim = String(title.mhs_nim || '').trim();
    const otherDbTitles = [...(thesisTitles || []), ...(historicalTitles || [])].filter(
      (t) =>
        String(t.id) !== String(title.id) &&
        (!targetNim || String(t.mhs_nim || '').trim() !== targetNim)
    );
    const otherArchives = Array.isArray(thesisArchives)
      ? thesisArchives.filter((arc) => !targetNim || String(arc.penulis_nim || '').trim() !== targetNim)
      : [];
    return checkClientMultiFieldSimilarity(initJudul, initAbstrak, otherDbTitles, otherArchives, { limit: 6 });
  }, [title, thesisTitles, historicalTitles, thesisArchives]);

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

  if (!title) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 max-w-xl mx-auto shadow-sm my-12">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Data Pengajuan Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500">
            Pengajuan Tugas Akhir dengan ID tersebut tidak ditemukan dalam sistem SIMONITA.
          </p>
          <Link
            href="/kaprodi/titles"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Tinjauan TA</span>
          </Link>
        </div>
      </div>
    );
  }

  const studentSem = getStudentSemester(title);

  return (
    <div className="space-y-6 pb-12">

      {/* Navigation Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/kaprodi/titles"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-300 px-3.5 py-2 rounded-xl transition-all shadow-2xs hover:shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Pengajuan</span>
          </Link>
          <span className="text-slate-300 text-sm">/</span>
          <span className="text-xs font-bold text-slate-500">Detail Tugas Akhir</span>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge type="thesis" status={title.status} />
          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold">
            {studentSem}
          </span>
        </div>
      </div>

      {/* Header Profile Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-blue-700/40 relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
              <GraduationCap className="w-3.5 h-3.5 text-blue-300" />
              <span>Usulan Tugas Akhir D3 Manajemen Informatika</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-blue-200 font-mono">
              <Calendar className="w-3.5 h-3.5" />
              <span>Diajukan: {formatDate(title.created_at || title.tanggal_pengajuan)}</span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {title.mhs_nama}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-blue-200 font-medium">
              <span className="font-mono bg-blue-950/60 px-2.5 py-0.5 rounded border border-blue-800">
                NIM: {title.mhs_nim}
              </span>
              {studentAngkatan && (
                <>
                  <span>•</span>
                  <span className="bg-blue-950/60 px-2.5 py-0.5 rounded border border-blue-800">
                    Angkatan: {studentAngkatan}
                  </span>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Judul, Deskripsi & Similarity Gauge */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Judul & Deskripsi Topik */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Judul Tugas Akhir (Versi Terkini)</span>
              </h3>
              <span className="text-xs font-mono font-bold text-slate-500">
                Skor Similarity: <strong className="text-indigo-600">{liveSimilarity.highestScore}%</strong>
              </span>
            </div>

            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
              <p className="text-base font-bold text-slate-900 leading-relaxed italic">
                &ldquo;{title.judul}&rdquo;
              </p>
            </div>

            {title.deskripsi && (
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold text-slate-700 block">Deskripsi / Ringkasan Topik Penelitian:</span>
                <p className="text-xs text-slate-600 bg-slate-50/60 p-3.5 rounded-xl border border-slate-200 leading-relaxed">
                  {title.deskripsi}
                </p>
              </div>
            )}

            {/* Similarity Gauge Analysis */}
            <div className="pt-2">
              <SimilarityGauge
                score={liveSimilarity.highestScore}
                titleScore={liveSimilarity.highestTitleScore}
                abstractScore={liveSimilarity.highestAbstractScore}
                hasAbstract={liveSimilarity.hasAbstract}
              />
            </div>
          </div>

          {/* SECTION: RIWAYAT REVISI & CATATAN RAPAT BERDASARKAN TANGGAL */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <span>Riwayat Log Revisi &amp; Catatan Rapat (Tersimpan Berdasarkan Tanggal)</span>
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                {title.riwayat_revisi ? title.riwayat_revisi.length : 1} Catatan
              </span>
            </div>

            <div className="space-y-3">
              {(!title.riwayat_revisi || title.riwayat_revisi.length === 0) ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 italic text-center">
                  Belum ada riwayat revisi tambahan. Pengajuan berada di tahap awal peninjauan.
                </div>
              ) : (
                title.riwayat_revisi.map((rev, index) => {
                  const isFixLog = rev.tipe === 'judul_fix';
                  const isProdiNote = rev.tipe === 'catatan_prodi';
                  const isMhsRevision = rev.tipe === 'revisi_mahasiswa';

                  return (
                    <div 
                      key={rev.id || index}
                      className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
                        isFixLog 
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                          : isProdiNote
                          ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                          : isMhsRevision
                          ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white border shadow-2xs">
                          {isFixLog && '✓ Judul Ditetapkan Fix'}
                          {isProdiNote && '💬 Catatan Rapat Prodi'}
                          {isMhsRevision && '✏️ Revisi Judul Mahasiswa'}
                          {!isFixLog && !isProdiNote && !isMhsRevision && '📄 Pengajuan Awal'}
                        </span>
                        <span className="font-mono text-slate-500">
                          {formatDate(rev.tanggal)}
                        </span>
                      </div>

                      {rev.judul && rev.judul !== title.judul && (
                        <div className="text-[11px] font-medium text-slate-600 line-through">
                          Judul Sebelumnya: &ldquo;{rev.judul}&rdquo;
                        </div>
                      )}

                      <p className="text-xs font-semibold leading-relaxed">
                        &ldquo;{rev.catatan}&rdquo;
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                        <span>Pencatat: <strong>{rev.oleh || 'Sistem SIMONITA'}</strong></span>
                        {rev.skor_similarity !== undefined && (
                          <span className="font-mono font-semibold">Similarity saat itu: {rev.skor_similarity}%</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Info Dosen Pembimbing */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Dosen Pembimbing</span>
              </h4>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Dosen Pembimbing 1
                </span>
                {resolvedPembimbing.p1 ? (
                  <>
                    <p className="text-xs font-bold text-slate-900">{resolvedPembimbing.p1.nama}</p>
                    {resolvedPembimbing.p1.nip && (
                      <p className="text-[11px] font-mono text-slate-500">NIP: {resolvedPembimbing.p1.nip}</p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-slate-400 italic">Belum ditetapkan</p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Dosen Pembimbing 2
                </span>
                {resolvedPembimbing.p2 ? (
                  <>
                    <p className="text-xs font-bold text-slate-900">{resolvedPembimbing.p2.nama}</p>
                    {resolvedPembimbing.p2.nip && (
                      <p className="text-[11px] font-mono text-slate-500">NIP: {resolvedPembimbing.p2.nip}</p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-slate-400 italic">Belum ditetapkan</p>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
