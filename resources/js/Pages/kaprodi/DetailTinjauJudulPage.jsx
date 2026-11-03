import React, { useState, useMemo, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useAuth } from '../../context/AuthContext.jsx';
import SimilarityGauge from '../../Components/common/SimilarityGauge.jsx';
import StatusBadge from '../../Components/common/StatusBadge.jsx';
import { getStudentSemester } from '../../lib/academicUtils.js';
import {
  getStudentCredential,
  getCachedStudentCredential,
  normalizeStudentAngkatan
} from '../../services/studentCredentials.js';
import {
  ArrowLeft,
  CheckCircle2, 
  MessageSquare, 
  AlertCircle, 
  GraduationCap, 
  BookOpen,
  Send,
  History,
  Calendar
} from 'lucide-react';

export default function DetailTinjauJudulPage({ titleId: propTitleId }) {
  const { url } = usePage();
  const { 
    thesisTitles, 
    addProdiRevisionNote, 
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

  // State Management for Forms
  const [revisiCatatan, setRevisiCatatan] = useState('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // Quick suggestion chips for revision notes
  const quickNotes = [
    'Similarity tinggi (>40%), disarankan konsultasikan alternatif formulasi judul dengan dosen pembimbing.',
    'Ganti objek/studi kasus penelitian agar topik lebih spesifik dan orisinal.',
    'Ruang lingkup sistem terlalu luas, mohon batasi pada modul inti kebutuhan D3 Manajemen Informatika.',
    'Metodologi pengembangan sistem perlu diperjelas bersama dosen pembimbing.'
  ];

  // Submit Catatan Revisi Rapat Prodi (Status berubah jadi "Perlu Revisi" - Kuning)
  const handleSendRevisionNote = (e) => {
    e.preventDefault();
    if (!title) return;
    if (!revisiCatatan.trim()) {
      showToast('Harap tuliskan catatan revisi sebelum mengirim.');
      return;
    }

    addProdiRevisionNote(title.id, revisiCatatan.trim());
    showToast(`Catatan revisi berhasil disimpan & dikirim ke ${title.mhs_nama}. Status menjadi "Perlu Revisi".`);
    setRevisiCatatan('');
  };

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
  const isFix = title.status === 'disetujui' || title.status === 'judul_fix';
  const isRevisi = title.status === 'perlu_revisi';

  return (
    <div className="space-y-6 pb-12">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs sm:text-sm font-semibold border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

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
          <span className="text-xs font-bold text-slate-500">Detail &amp; Catatan Rapat Prodi</span>
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
                Skor Similarity: <strong className="text-indigo-600">{title.skor_kemiripan_terakhir}%</strong>
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
              <SimilarityGauge score={title.skor_kemiripan_terakhir} />
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

        {/* Right Column: Actions (Catatan Revisi Rapat Prodi) */}
        <div className="space-y-6">
          
          {/* FORM 1: BERIKAN CATATAN REVISI RAPAT PRODI */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
              <h4 className="text-xs font-bold text-amber-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-600" />
                <span>Beri Catatan Revisi Rapat Prodi</span>
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Ubah Status &rarr; Perlu Revisi
              </span>
            </div>

            <p className="text-xs text-amber-900/90 leading-relaxed">
              Jika terdapat masukan pada judul atau similarity, berikan catatan arahan di bawah ini. Status usulan akan otomatis berubah menjadi <strong>Perlu Revisi</strong> (Kuning).
            </p>

            {/* Quick Chips */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Template Catatan Cepat:</span>
              <div className="flex flex-col gap-1.5">
                {quickNotes.map((note, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRevisiCatatan(note)}
                    className="text-[11px] bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 p-2 rounded-xl transition-colors cursor-pointer text-left leading-snug"
                  >
                    + {note}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendRevisionNote} className="space-y-3 pt-2">
              <textarea
                rows={3}
                value={revisiCatatan}
                onChange={(e) => setRevisiCatatan(e.target.value)}
                placeholder="Tuliskan catatan arahan hasil rapat Prodi untuk mahasiswa..."
                className="w-full text-xs p-3 border border-amber-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400"
              />

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center justify-center space-x-2 cursor-pointer transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Catatan (Status Perlu Revisi)</span>
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
