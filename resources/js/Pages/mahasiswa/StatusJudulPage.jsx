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
  UserCheck, 
  ShieldCheck, 
  FileText, 
  Users,
  Edit3,
  History,
  Send,
  X,
  Sparkles,
  TrendingDown
} from 'lucide-react';

export default function StatusJudulPage() {
  const { 
    currentUser, 
    thesisTitles, 
    historicalTitles, 
    reviseThesisTitle 
  } = useAuth();

  const myTitles = thesisTitles.filter(t => 
    (currentUser?.id && t.profile_id === currentUser.id) || 
    (currentUser?.nim && t.mhs_nim === currentUser.nim) ||
    t.mhs_nama === currentUser?.nama
  );

  // Revision Modal State
  const [revisionModalTitle, setRevisionModalTitle] = useState(null);
  const [newJudul, setNewJudul] = useState('');
  const [newDeskripsi, setNewDeskripsi] = useState('');
  const [catatanKonsultasi, setCatatanKonsultasi] = useState('');
  const [simScore, setSimScore] = useState(0);
  const [isCheckingSim, setIsCheckingSim] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Open Revision Modal
  const handleOpenRevisionModal = (titleObj) => {
    setRevisionModalTitle(titleObj);
    setNewJudul(titleObj.judul || '');
    setNewDeskripsi(titleObj.deskripsi || '');
    setCatatanKonsultasi('');
    setSimScore(titleObj.skor_kemiripan_terakhir || 0);
  };

  // Live Similarity Check for revision input
  const allDbTitles = [...thesisTitles, ...historicalTitles];
  useEffect(() => {
    if (!newJudul || newJudul.trim().length < 5) {
      setSimScore(0);
      return;
    }

    setIsCheckingSim(true);
    const timer = setTimeout(() => {
      // Exclude current title from check to avoid self-match 100%
      const otherTitles = allDbTitles.filter(t => t.id !== revisionModalTitle?.id);
      const res = checkClientSimilarity(newJudul, otherTitles);
      setSimScore(res.highestScore || 0);
      setIsCheckingSim(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [newJudul, revisionModalTitle]);

  // Handle submit revision
  const handleSaveRevision = (e) => {
    e.preventDefault();
    if (!revisionModalTitle) return;
    if (!newJudul.trim() || newJudul.trim().length < 5) {
      showToast('Harap masukkan judul baru yang valid.');
      return;
    }

    reviseThesisTitle(
      revisionModalTitle.id,
      newJudul.trim(),
      newDeskripsi.trim(),
      simScore,
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

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          <span>Status &amp; Alur Peninjauan Judul TA</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Pengajuan judul otomatis masuk tahap peninjauan Prodi. Jika terdapat catatan rapat, lakukan revisi bersama dosen pembimbing sampai judul berstatus fix.
        </p>
      </div>

      <div className="space-y-5">
        {myTitles.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-400 space-y-4 shadow-xs">
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
          myTitles.map(t => {
            const isFix = t.status === 'disetujui' || t.status === 'judul_fix';
            const isRevisi = t.status === 'perlu_revisi';
            const isTinjauan = t.status === 'tinjauan' || t.status === 'diajukan';

            return (
              <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                
                {/* Header Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ID Pengajuan: {t.id}</span>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Diajukan pada: {formatDate(t.created_at)}
                    </div>
                  </div>
                  <StatusBadge type="thesis" status={t.status} className="self-start sm:self-auto" />
                </div>

                {/* Judul & Deskripsi */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Judul Tugas Akhir:
                  </span>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    "{t.judul}"
                  </h3>
                  {t.deskripsi && (
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {t.deskripsi}
                    </p>
                  )}
                </div>

                {/* Similarity Score Badge */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-600">Skor Kemiripan (Similarity Engine):</span>
                    <span className={`font-mono font-bold px-2 py-0.5 rounded-md border text-xs ${
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

                    <p className="text-xs text-amber-900 font-semibold bg-white p-3 rounded-xl border border-amber-200/80 leading-relaxed italic">
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
                  <div className="bg-yellow-50/70 border border-yellow-200 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 text-yellow-900 font-bold">
                        <Clock className="w-4 h-4 text-yellow-600 shrink-0" />
                        <span>Pengajuan Otomatis Sedang Dalam Tahap Peninjauan Prodi</span>
                      </div>
                      <span className="text-[10px] font-semibold text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded-full">
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
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                  <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>{isFix ? 'Dosen Pembimbing Resmi (Definitif):' : 'Dosen Pembimbing yang Diajukan:'}</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 pt-1">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block">PEMBIMBING 1:</span>
                      <span className="font-bold text-slate-800 text-xs">
                        {t.pembimbing_1_nama || t.pembimbing_1 || 'Belum Ditentukan'}
                      </span>
                      {t.pembimbing_1_nip && (
                        <span className="text-[10px] text-slate-400 font-mono block">NIP. {t.pembimbing_1_nip}</span>
                      )}
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
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
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                      <History className="w-4 h-4 text-indigo-600" />
                      <span>Riwayat Log Revisi &amp; Catatan Rapat (Tersimpan Berdasarkan Tanggal)</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {t.riwayat_revisi ? t.riwayat_revisi.length : 1} Log Tersimpan
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(!t.riwayat_revisi || t.riwayat_revisi.length === 0) ? (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-500 italic">
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
                            className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
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

                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-[10px] text-slate-500">
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
          })
        )}
      </div>

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
              Ketikkan judul baru hasil konsultasi dengan Dosen Pembimbing. Sistem akan langsung menguji skor kemiripan secara langsung.
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
                  onChange={(e) => setNewJudul(e.target.value)}
                  placeholder="Contoh: Rancang Bangun Sistem Informasi Monitoring Pelanggan Berbasis Web..."
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Live Similarity Gauge Box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Uji Kemiripan Judul Baru:</span>
                  </span>
                  <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded-full border ${
                    simScore > 40
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {isCheckingSim ? 'Memeriksa...' : `${simScore}%`}
                  </span>
                </div>
                {revisionModalTitle.skor_kemiripan_terakhir > simScore && (
                  <div className="text-[11px] text-emerald-700 font-semibold flex items-center space-x-1">
                    <TrendingDown className="w-3.5 h-3.5" />
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

    </div>
  );
}
