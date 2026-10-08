import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link } from '@inertiajs/react';
import StatusBadge from '../../Components/common/StatusBadge.jsx';
import SimilarityGauge from '../../Components/common/SimilarityGauge.jsx';
import { checkClientSimilarity } from '../../lib/similarityEngine.js';
import { preProcessTitle } from '@backend/services/titleService.js';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  ArrowRight, 
  ArrowLeft,
  UserCheck, 
  ShieldCheck, 
  FileText, 
  Users,
  Edit3,
  History,
  Send,
  X,
  Sparkles,
  TrendingDown,
  Search,
  RefreshCw,
  Trash2,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabase.js';

export default function StatusJudulPage() {
  const { 
    currentUser, 
    thesisTitles, 
    historicalTitles, 
    reviseThesisTitle,
    cancelThesisTitle
  } = useAuth();

  const myTitles = thesisTitles.filter(t => 
    (currentUser?.id && t.profile_id === currentUser.id) || 
    (currentUser?.nim && t.mhs_nim === currentUser.nim) ||
    t.mhs_nama === currentUser?.nama
  );

  // Selected Detail Page State (Read from query param or internal state)
  const [selectedId, setSelectedId] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('id') || null;
    }
    return null;
  });

  const selectedTitle = myTitles.find(t => t.id === selectedId);

  // Revision Modal State
  const [revisionModalTitle, setRevisionModalTitle] = useState(null);
  const [cancelModalTitle, setCancelModalTitle] = useState(null);
  const [newJudul, setNewJudul] = useState('');
  const [newDeskripsi, setNewDeskripsi] = useState('');
  const [catatanKonsultasi, setCatatanKonsultasi] = useState('');
  const [simScore, setSimScore] = useState(0);
  const [isCheckingSim, setIsCheckingSim] = useState(false);
  const [hasCheckedSim, setHasCheckedSim] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleOpenDetail = (id) => {
    setSelectedId(id);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location);
      url.searchParams.set('id', id);
      window.history.pushState({}, '', url);
    }
  };

  const handleBackToList = () => {
    setSelectedId(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location);
      url.searchParams.delete('id');
      window.history.pushState({}, '', url);
    }
  };

  // Open Revision Modal
  const handleOpenRevisionModal = (titleObj) => {
    setRevisionModalTitle(titleObj);
    setNewJudul(titleObj.judul || '');
    setNewDeskripsi(titleObj.deskripsi || '');
    setCatatanKonsultasi('');
    setSimScore(0);
    setHasCheckedSim(false);
  };

  const allDbTitles = [...thesisTitles, ...historicalTitles];

  // Manual Scan Similarity Check for revision input
  const handleScanSimilarityRevision = async () => {
    if (!newJudul || newJudul.trim().length < 5) {
      showToast('Harap masukkan judul baru minimal 5 karakter terlebih dahulu.');
      return;
    }

    setIsCheckingSim(true);

    // 1. Supabase RPC check if available
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('check_title_similarity', {
          input_title: newJudul.trim()
        });
        if (!error && data) {
          const otherMatches = data.filter(item => item.matched_title.toLowerCase().trim() !== (revisionModalTitle?.judul || '').toLowerCase().trim());
          const highest = otherMatches.length > 0 ? Math.max(...otherMatches.map(m => m.skor_gabungan || 0)) : 0;
          setSimScore(highest);
          setHasCheckedSim(true);
          setIsCheckingSim(false);
          return;
        }
      } catch (err) {
        console.error('Supabase RPC similarity check error:', err);
      }
    }

    // 2. Client similarity fallback (exclude current title being revised)
    const otherTitles = allDbTitles.filter(t => t.id !== revisionModalTitle?.id);
    const res = checkClientSimilarity(newJudul, otherTitles);
    setSimScore(res.highestScore || 0);
    setHasCheckedSim(true);
    setIsCheckingSim(false);
  };

  // Handle submit revision
  const handleSaveRevision = (e) => {
    e.preventDefault();
    if (!revisionModalTitle) return;
    if (!newJudul.trim() || newJudul.trim().length < 5) {
      showToast('Harap masukkan judul baru yang valid.');
      return;
    }

    let finalSimScore = simScore;
    if (!hasCheckedSim) {
      const otherTitles = allDbTitles.filter(t => t.id !== revisionModalTitle?.id);
      const res = checkClientSimilarity(newJudul, otherTitles);
      finalSimScore = res.highestScore || 0;
    }

    reviseThesisTitle(
      revisionModalTitle.id,
      newJudul.trim(),
      newDeskripsi.trim(),
      finalSimScore,
      catatanKonsultasi.trim() || 'Judul direvisi mahasiswa setelah konsultasi bersama dosen pembimbing.'
    );

    showToast('Judul revisi berhasil disimpan! Pengajuan kembali masuk tahap peninjauan rapat Prodi.');
    setRevisionModalTitle(null);
  };

  // Date formatter
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
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs sm:text-sm font-semibold border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* VIEW 1: DEDICATED DETAIL PAGE (Saat Card Di-klik) */}
      {selectedTitle ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Top Back Navigation */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBackToList}
              className="inline-flex items-center space-x-2 text-xs font-bold text-slate-700 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-200 px-4 py-2 rounded-xl shadow-2xs transition-all cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 group-hover:-translate-x-0.5 transition-all" />
              <span>Kembali ke Daftar Pengajuan</span>
            </button>
            <span className="text-xs text-slate-400 font-mono">
              ID: {selectedTitle.id}
            </span>
          </div>

          {/* Header Detail */}
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Detail Pengajuan Tugas Akhir</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Rincian data pengajuan tugas akhir, catatan pembahasan rapat prodi, dan log revisi.
            </p>
          </div>

          {/* Full Detail Sheet Container */}
          {(() => {
            const t = selectedTitle;
            const isFix = t.status === 'disetujui' || t.status === 'judul_fix';
            const isRevisi = t.status === 'perlu_revisi';
            const isTinjauan = t.status === 'tinjauan' || t.status === 'diajukan';

            return (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
                
                {/* Header Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      ID Pengajuan: {t.id}
                    </span>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Diajukan pada: {formatDate(t.created_at)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2.5 self-start sm:self-auto">
                    <StatusBadge type="thesis" status={t.status} />
                    {!isFix && (
                      <button
                        type="button"
                        onClick={() => setCancelModalTitle(t)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 text-xs font-bold rounded-xl transition-all inline-flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                        title="Batalkan pengajuan tugas akhir ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Batalkan Pengajuan</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Judul & Abstrak */}
                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Judul Tugas Akhir:
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                      "{t.judul}"
                    </h3>
                  </div>

                  {(t.abstrak || t.deskripsi) && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Abstrak / Deskripsi Topik:
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        {t.abstrak || t.deskripsi}
                      </p>
                    </div>
                  )}
                </div>

                {/* Similarity Score Badge */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-600">Skor Kemiripan (Similarity Engine):</span>
                    <span className={`font-mono font-bold px-2.5 py-0.5 rounded-lg border text-xs ${
                      t.skor_kemiripan_terakhir > 40
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {t.skor_kemiripan_terakhir}% {t.skor_kemiripan_terakhir <= 40 ? '(Aman < 40%)' : '(Perlu Perhatian)'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">Pemeriksaan Otomatis Terhadap Arsip SIMTA</span>
                </div>

                {/* CALLOUT BERDASARKAN STATUS */}
                {/* 1. Status PERLU REVISI */}
                {isRevisi && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4.5 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 text-amber-900 font-bold">
                        <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                        <span>Catatan Hasil Rapat Pembahasan Prodi (Perlu Revisi):</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
                        Tahap Revisi Bersama Pembimbing
                      </span>
                    </div>

                    <p className="text-xs text-amber-900 font-semibold bg-white p-3.5 rounded-xl border border-amber-200/80 leading-relaxed italic">
                      "{t.catatan_kaprodi || 'Similarity terdeteksi cukup tinggi atau topik perlu disesuaikan. Silakan konsultasikan perubahan judul dengan dosen pembimbing.'}"
                    </p>

                    <div className="text-[11px] text-amber-800 leading-relaxed">
                      💡 <strong>Langkah Selanjutnya:</strong> Hubungi atau temui Dosen Pembimbing Anda untuk mendiskusikan perubahan judul. Anda dapat merevisi judul beberapa kali sampai similarity turun dan judul disetujui.
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenRevisionModal(t)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center space-x-2 cursor-pointer transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Revisi Judul (Hasil Konsultasi Pembimbing)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Status DALAM TINJAUAN */}
                {isTinjauan && (
                  <div className="bg-yellow-50/70 border border-yellow-200 rounded-2xl p-4.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 text-yellow-900 font-bold">
                        <Clock className="w-4 h-4 text-yellow-600 shrink-0" />
                        <span>Pengajuan Otomatis Sedang Dalam Tahap Peninjauan Prodi</span>
                      </div>
                      <span className="text-[10px] font-semibold text-yellow-800 bg-yellow-100 px-2.5 py-0.5 rounded-full">
                        Menunggu Hasil Rapat
                      </span>
                    </div>
                    <p className="text-[11px] text-yellow-800 leading-relaxed">
                      Pengajuan judul Anda telah otomatis masuk ke tahap peninjauan Prodi. Tidak perlu ACC manual satu per satu. Jika pada saat rapat Prodi terdapat catatan (misal similarity tinggi), catatan akan langsung muncul di sini untuk Anda revisi bersama pembimbing.
                    </p>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenRevisionModal(t)}
                        className="text-xs text-indigo-700 hover:text-indigo-900 font-bold inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Ingin memperbarui judul sekarang bersama pembimbing? Klik di sini.</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Status JUDUL FIX */}
                {isFix && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4.5 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 text-emerald-900 font-bold">
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                        <span>Selamat! Judul Tugas Akhir Telah Berstatus JUDUL FIX (Final)</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        Resmi Disetujui Prodi
                      </span>
                    </div>

                    <p className="text-xs text-emerald-900 leading-relaxed">
                      Judul Tugas Akhir Anda telah disetujui resmi oleh Prodi dan siap digunakan untuk penyusunan proposal. Silakan melanjutkan ke tahap peminjaman ruang Seminar Proposal.
                    </p>

                    <div className="pt-1">
                      <Link
                        href="/booking/apply/seminar_proposal"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md inline-flex items-center space-x-2 transition-all"
                      >
                        <span>Lanjut Ajukan Ruang Seminar Proposal</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Dosen Pembimbing Details */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 text-xs space-y-2">
                  <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>{isFix ? 'Dosen Pembimbing Resmi (Definitif):' : 'Dosen Pembimbing yang Diajukan:'}</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700 pt-1">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 block">PEMBIMBING 1:</span>
                      <span className="font-bold text-slate-800 text-xs">
                        {t.pembimbing_1_nama || t.pembimbing_1 || 'Belum Ditentukan'}
                      </span>
                      {t.pembimbing_1_nip && (
                        <span className="text-[10px] text-slate-400 font-mono block">NIP. {t.pembimbing_1_nip}</span>
                      )}
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 block">PEMBIMBING 2:</span>
                      <span className="font-bold text-slate-800 text-xs">
                        {t.pembimbing_2_nama || t.pembimbing_2 || 'Belum Ditentukan'}
                      </span>
                      {t.pembimbing_2_nip && (
                        <span className="text-[10px] text-slate-400 font-mono block">NIP. {t.pembimbing_2_nip}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION RIWAYAT REVISI LENGKAP BERDASARKAN TANGGAL */}
                <div className="border border-slate-200 rounded-2xl p-4.5 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                      <History className="w-4 h-4 text-indigo-600" />
                      <span>Riwayat Log Revisi &amp; Catatan Rapat (Tersimpan Berdasarkan Tanggal)</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {t.riwayat_revisi ? t.riwayat_revisi.length : 1} Log Tersimpan
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {(!t.riwayat_revisi || t.riwayat_revisi.length === 0) ? (
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-500 italic">
                        Pengajuan baru dilakukan. Belum ada catatan revisi lanjutan.
                      </div>
                    ) : (
                      t.riwayat_revisi.map((rev, index) => {
                        const isFixLog = rev.tipe === 'judul_fix';
                        const isProdiNote = rev.tipe === 'catatan_prodi';
                        const isMhsRevision = rev.tipe === 'revisi_mahasiswa';

                        return (
                          <div 
                            key={rev.id || index}
                            className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
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

                            {rev.judul && (
                              <div className="text-[11px] font-semibold">
                                Judul: "{rev.judul}"
                              </div>
                            )}

                            <p className="text-xs font-medium leading-relaxed italic">
                              "{rev.catatan}"
                            </p>

                            <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/50 text-[10px] text-slate-500">
                              <span>Oleh: <strong>{rev.oleh || 'Sistem'}</strong></span>
                              {rev.skor_similarity !== undefined && (
                                <span className="font-mono">Similarity: {rev.skor_similarity}%</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            );
          })()}

        </div>
      ) : (
        /* VIEW 2: DAFTAR CARD STATUS PENGAJUAN (Default) */
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Header List */}
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <span>Status Pengajuan Tugas Akhir</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Pantau status dan alur verifikasi pengajuan tugas akhir Anda, rekomendasi dosen pembimbing, serta keputusan peninjauan rapat Prodi.
            </p>
          </div>

          {myTitles.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-xs text-slate-400 space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-700 text-sm">
                  Belum Ada Pengajuan Judul Tugas Akhir
                </p>
                <p className="text-slate-500 mt-1">
                  Silakan buat pengajuan judul baru. Pengajuan akan otomatis masuk ke tahap peninjauan rapat Prodi.
                </p>
              </div>
              <Link 
                href="/thesis/submit" 
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-xs transition-all"
              >
                <span>Ajukan Judul Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myTitles.map(t => {
                const isFix = t.status === 'disetujui' || t.status === 'judul_fix';

                return (
                  <div 
                    key={t.id} 
                    onClick={() => handleOpenDetail(t.id)}
                    className="bg-white border border-slate-200 hover:border-indigo-400 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer space-y-4 group"
                  >
                    {/* Top Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          ID Pengajuan: {t.id}
                        </span>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Diajukan pada: {formatDate(t.created_at)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2.5 self-start sm:self-auto" onClick={(e) => e.stopPropagation()}>
                        <StatusBadge type="thesis" status={t.status} />
                        {!isFix && (
                          <button
                            type="button"
                            onClick={() => setCancelModalTitle(t)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 text-xs font-bold rounded-xl transition-all inline-flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                            title="Batalkan pengajuan tugas akhir ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Batalkan Pengajuan</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Judul Tugas Akhir */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Judul Tugas Akhir:
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                        "{t.judul}"
                      </h3>
                    </div>

                    {/* Footer / Summary Chips & Action */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Similarity Chip */}
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border font-mono text-[11px] font-semibold ${
                          t.skor_kemiripan_terakhir > 40
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          <span>Kemiripan:</span>
                          <strong>{t.skor_kemiripan_terakhir}%</strong>
                          <span className="text-[10px] font-normal">
                            {t.skor_kemiripan_terakhir <= 40 ? '(Aman)' : '(Perlu Perhatian)'}
                          </span>
                        </span>

                        {/* Pembimbing Preview */}
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 text-[11px]">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span className="truncate max-w-[220px]">
                            {t.pembimbing_1_nama || t.pembimbing_1 || 'Pembimbing 1'}
                          </span>
                        </span>
                      </div>

                      {/* Detail CTA Button */}
                      <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white text-xs font-bold transition-all shadow-2xs">
                        <span>Buka Detail &amp; Catatan</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL FORM REVISI JUDUL BERSAMA PEMBIMBING */}
      {revisionModalTitle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in" data-lenis-prevent>
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-indigo-700 font-bold text-sm">
                <Edit3 className="w-5 h-5 shrink-0" />
                <span>Formulir Revisi Judul Bersama Pembimbing</span>
              </div>
              <button
                type="button"
                onClick={() => setRevisionModalTitle(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Ketikkan judul baru hasil konsultasi dengan Dosen Pembimbing. Klik tombol <strong>Scan Similarity</strong> untuk menguji skor kemiripan terhadap arsip judul.
            </p>

            <form onSubmit={handleSaveRevision} className="space-y-4">
              
              {/* Judul Baru */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  Judul Tugas Akhir Baru <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows={3}
                  value={newJudul}
                  onChange={(e) => {
                    setNewJudul(e.target.value);
                    if (hasCheckedSim) setHasCheckedSim(false);
                  }}
                  placeholder="Contoh: Rancang Bangun Sistem Informasi Monitoring Pelanggan Berbasis Web..."
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                />
              </div>

              {/* Similarity Scan Section */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Uji Kemiripan Judul Baru:</span>
                  </span>
                  <span className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded-full border ${
                    !hasCheckedSim
                      ? 'bg-slate-200/80 text-slate-600 border-slate-300'
                      : simScore > 40
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {isCheckingSim ? 'Memeriksa...' : (!hasCheckedSim ? '- %' : `${simScore}%`)}
                  </span>
                </div>

                {/* Tombol Scan Similarity */}
                <button
                  type="button"
                  onClick={handleScanSimilarityRevision}
                  disabled={isCheckingSim || !newJudul || newJudul.trim().length < 5}
                  className="w-full py-2 px-3 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  {isCheckingSim ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sedang Memeriksa Kemiripan...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>{hasCheckedSim ? 'Scan Ulang Similarity' : 'Scan Similarity'}</span>
                    </>
                  )}
                </button>

                {hasCheckedSim && revisionModalTitle.skor_kemiripan_terakhir > simScore && (
                  <div className="text-[11px] text-emerald-700 font-semibold flex items-center space-x-1 pt-0.5">
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Kemiripan turun dari {revisionModalTitle.skor_kemiripan_terakhir}% menjadi {simScore}%!</span>
                  </div>
                )}
              </div>

              {/* Catatan Konsultasi Pembimbing */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  Keterangan Perbaikan (Hasil Konsultasi Dosen Pembimbing):
                </label>
                <textarea
                  rows={2}
                  value={catatanKonsultasi}
                  onChange={(e) => setCatatanKonsultasi(e.target.value)}
                  placeholder="Contoh: Telah dikonsultasikan dengan Dosen Pembimbing 1 dan disepakati pengalihan studi kasus ke UMKM X agar similarity aman..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRevisionModalTitle(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center space-x-1.5 cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Simpan &amp; Ajukan Revisi</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI BATALKAN PENGAJUAN */}
      {cancelModalTitle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in" data-lenis-prevent>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Batalkan Pengajuan Tugas Akhir?</h3>
                <p className="text-[11px] text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 space-y-1">
              <span className="font-semibold text-slate-500 block text-[10px] uppercase">Judul yang Dibatalkan:</span>
              <p className="font-medium text-slate-900 leading-snug">"{cancelModalTitle.judul}"</p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin membatalkan pengajuan tugas akhir ini? Seluruh usulan judul beserta usulan dosen pembimbing akan dibatalkan, dan Anda dapat mengajukan judul baru kembali.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCancelModalTitle(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={async () => {
                  const idToCancel = cancelModalTitle.id;
                  setCancelModalTitle(null);
                  await cancelThesisTitle(idToCancel);
                  showToast('Pengajuan tugas akhir berhasil dibatalkan.');
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center space-x-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Batalkan Pengajuan</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
