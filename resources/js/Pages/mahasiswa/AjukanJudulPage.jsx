import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { router } from '@inertiajs/react';
import SimilarityGauge from '../../Components/common/SimilarityGauge.jsx';
import { checkClientMultiFieldSimilarity, checkClientSimilarity } from '../../lib/similarityEngine.js';
import { preProcessTitle, getSimilarityThreshold } from '../../services/titleService.js';
import {
  FileText,
  Save,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Search,
  RefreshCw,
  ExternalLink,
  BookOpen,
  Tag,
  Layers,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

import { supabase, isSupabaseConfigured } from '../../services/supabase.js';

export default function AjukanJudulPage() {
  const { 
    currentUser, 
    thesisTitles, 
    historicalTitles, 
    thesisArchives, 
    addThesisTitle,
    updateThesisSubmission 
  } = useAuth();
  const navigate = (url) => router.visit(url);

  // Deteksi apakah mahasiswa yang login sudah memiliki pengajuan tugas akhir sebelumnya
  const existingThesis = useMemo(() => {
    if (!thesisTitles || !currentUser) return null;
    const myNim = String(currentUser.nim || '').trim();
    const myId = String(currentUser.id || '').trim();
    const myNama = String(currentUser.nama || '').trim();

    return thesisTitles.find(t => 
      (myNim && String(t.mhs_nim || '').trim() === myNim) ||
      (myId && String(t.profile_id || '').trim() === myId) ||
      (myNama && String(t.mhs_nama || '').trim() === myNama)
    ) || null;
  }, [thesisTitles, currentUser]);

  const isEditMode = Boolean(existingThesis);

  const [judul, setJudul] = useState('');
  const [abstrak, setAbstrak] = useState('');
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' | 'warning' }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const toastTimeoutRef = useRef(null);

  // Jika mahasiswa sudah memiliki data usulan judul tersimpan, muat data tersebut ke form
  useEffect(() => {
    if (existingThesis && !hasInitialized) {
      setJudul(existingThesis.judul || '');
      setAbstrak(existingThesis.deskripsi || existingThesis.abstrak || '');
      if (existingThesis.skor_kemiripan_terakhir !== undefined && existingThesis.skor_kemiripan_terakhir !== null) {
        setSimilarityResult(prev => ({
          ...prev,
          highestScore: Number(existingThesis.skor_kemiripan_terakhir) || 0,
          highestTitleScore: Number(existingThesis.skor_kemiripan_terakhir) || 0,
          highestAbstractScore: Number(existingThesis.skor_kemiripan_terakhir) || 0,
          hasAbstract: Boolean(existingThesis.deskripsi || existingThesis.abstrak)
        }));
        setHasChecked(true);
      }
      setHasInitialized(true);
    }
  }, [existingThesis, hasInitialized]);

  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4500);
  };
  const [similarityResult, setSimilarityResult] = useState({
    highestScore: 0,
    highestTitleScore: 0,
    highestAbstractScore: 0,
    hasAbstract: false,
    processedInput: '',
    extractedConcepts: [],
    matches: []
  });
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [expandedArchiveId, setExpandedArchiveId] = useState(null);

  // Auto-resize ref for judul textarea
  const judulRef = useRef(null);

  useEffect(() => {
    if (judulRef.current) {
      judulRef.current.style.height = 'auto';
      judulRef.current.style.height = `${Math.max(75, judulRef.current.scrollHeight)}px`;
    }
  }, [judul]);

  // Combine active and historical titles (kecualikan judul sendiri agar tidak menghitung 100% kemiripan terhadap diri sendiri saat edit)
  const allDbTitles = useMemo(() => {
    const combined = [...thesisTitles, ...historicalTitles];
    if (existingThesis?.id) {
      const myNim = String(currentUser?.nim || '').trim();
      return combined.filter(t => 
        String(t.id) !== String(existingThesis.id) && 
        (!myNim || String(t.mhs_nim || '').trim() !== myNim)
      );
    }
    return combined;
  }, [thesisTitles, historicalTitles, existingThesis, currentUser]);

  // Explicit Similarity Check triggered by button click
  const handleCheckSimilarity = async () => {
    if (!judul || judul.trim().length < 5) {
      showToast('Silakan masukkan judul tugas akhir minimal 5 karakter terlebih dahulu.', 'warning');
      return;
    }

    setIsChecking(true);

    // Call dual-layer hybrid similarity engine against UNSRI repository archives + active titles
    const result = checkClientMultiFieldSimilarity(
      judul,
      abstrak,
      allDbTitles,
      thesisArchives || [],
      { limit: 6 }
    );

    setSimilarityResult(result);
    setHasChecked(true);
    setIsChecking(false);
  };

  const threshold = getSimilarityThreshold(similarityResult.highestScore);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    if (!judul || !judul.trim()) {
      showToast('Judul Tugas Akhir wajib diisi.', 'error');
      return;
    }

    if (!abstrak || !abstrak.trim()) {
      showToast('Abstrak Tugas Akhir wajib diisi.', 'error');
      return;
    }

    let currentScore = similarityResult.highestScore;

    // If user filled in title but hasn't clicked check yet, run check first
    if (judul && judul.trim().length >= 5 && !hasChecked) {
      setIsChecking(true);
      const res = checkClientMultiFieldSimilarity(
        judul,
        abstrak,
        allDbTitles,
        thesisArchives || [],
        { limit: 6 }
      );
      setSimilarityResult(res);
      setHasChecked(true);
      setIsChecking(false);
      currentScore = res.highestScore;

      const checkThreshold = getSimilarityThreshold(currentScore);
      if (!checkThreshold.allowSubmit) {
        showToast('Pengajuan terkunci karena skor kemiripan melebihi 50% terhadap Repositori UNSRI. Silakan modifikasi judul atau objek studi Anda terlebih dahulu.', 'error');
        return;
      }

      if (checkThreshold.status === 'peringatan' && !showWarningModal) {
        setShowWarningModal(true);
        return;
      }
    } else if (hasChecked) {
      if (!threshold.allowSubmit) {
        showToast('Pengajuan terkunci karena skor kemiripan melebihi 50% terhadap Repositori UNSRI. Silakan modifikasi judul atau objek studi Anda terlebih dahulu.', 'error');
        return;
      }

      if (threshold.status === 'peringatan' && !showWarningModal) {
        setShowWarningModal(true);
        return;
      }
    }

    const processedText = preProcessTitle(judul);
    setIsSubmitting(true);

    try {
      if (isEditMode && existingThesis) {
        // Mode Edit: Perbarui data pengajuan usulan yang sudah ada
        await updateThesisSubmission({
          titleId: existingThesis.id,
          judul: judul.trim(),
          abstrak: abstrak.trim(),
          deskripsi: abstrak.trim(),
          judul_processed: processedText,
          skor_kemiripan_terakhir: currentScore
        });

        try {
          sessionStorage.setItem('simta_toast_message', 'Perubahan Tugas Akhir berhasil disimpan & notifikasi telah dikirim ke Dospem dan Koprodi!');
        } catch (e) { }

        showToast('Perubahan Tugas Akhir berhasil diperbarui!', 'success');
      } else {
        // Mode Pengajuan Awal
        await addThesisTitle({
          judul: judul.trim(),
          abstrak: abstrak.trim(),
          deskripsi: abstrak.trim(),
          judul_processed: processedText,
          skor_kemiripan_terakhir: currentScore,
          pembimbing_1_nip: '',
          pembimbing_1_nama: '',
          pembimbing_2_nip: '',
          pembimbing_2_nama: ''
        });

        try {
          sessionStorage.setItem('simta_toast_message', 'Pengajuan Tugas Akhir berhasil disimpan!');
        } catch (e) { }

        showToast('Pengajuan Tugas Akhir berhasil disimpan!', 'success');
      }

      // Beri sedikit jeda agar toast tampak jelas sebelum berpindah halaman
      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);
    } catch (err) {
      setIsSubmitting(false);
      showToast('Gagal menyimpan pengajuan tugas akhir. Silakan coba beberapa saat lagi.', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      
      {/* Custom Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-[9999] max-w-md w-full sm:w-auto animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`flex items-start gap-3.5 p-4 rounded-2xl shadow-2xl border backdrop-blur-md ${
            toast.type === 'error'
              ? 'bg-slate-900/95 border-rose-500/50 text-white'
              : toast.type === 'warning'
              ? 'bg-slate-900/95 border-amber-500/50 text-white'
              : 'bg-slate-900/95 border-emerald-500/50 text-white'
          }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              toast.type === 'error'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-400/30'
                : toast.type === 'warning'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-400/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
            }`}>
              {toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5" />
              ) : toast.type === 'warning' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                {toast.type === 'error' ? 'Peringatan Validasi' : toast.type === 'warning' ? 'Perhatian' : 'Berhasil Disimpan'}
              </h4>
              <p className="text-xs sm:text-sm font-semibold text-white mt-0.5 leading-snug">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>{isEditMode ? 'Kelola & Perbarui Tugas Akhir' : 'Pengajuan Tugas Akhir'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isEditMode 
              ? 'Data pengajuan Anda tersimpan di sistem. Silakan perbarui judul atau abstrak di bawah ini jika terdapat perubahan.'
              : 'Sistem akan memeriksa kemiripan judul dan abstrak Anda terhadap arsip historis D3 MI Fasilkom yang terhubung langsung ke Repositori UNSRI.'}
          </p>
        </div>

        {isEditMode && (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              existingThesis.status === 'disetujui' || existingThesis.status === 'judul_fix' || existingThesis.rekomendasi_dospem_status === 'direkomendasikan'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                existingThesis.status === 'disetujui' || existingThesis.status === 'judul_fix' || existingThesis.rekomendasi_dospem_status === 'direkomendasikan'
                  ? 'bg-emerald-500'
                  : 'bg-amber-500'
              }`} />
              <span>
                {existingThesis.status === 'disetujui' || existingThesis.status === 'judul_fix' || existingThesis.rekomendasi_dospem_status === 'direkomendasikan'
                  ? 'Disetujui'
                  : 'Diajukan'}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Mode Edit Banner */}
      {isEditMode && (
        <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-4 text-xs text-indigo-950 flex items-start gap-3 shadow-2xs">
          <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-semibold text-indigo-900">
              Pengajuan Anda sudah tersimpan di sistem SIMTA.
            </p>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Jika Anda melakukan perubahan pada judul atau abstrak, data usulan akan langsung diperbarui tanpa membuat duplikasi pengajuan baru. Notifikasi detail perubahan akan diteruskan secara otomatis ke Dosen Pembimbing dan Koprodi.
            </p>
            {existingThesis.catatan_kaprodi && (
              <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs font-medium">
                <span className="font-bold text-amber-950 block mb-0.5">Catatan Rapat Prodi Sebelumnya:</span>
                &ldquo;{existingThesis.catatan_kaprodi}&rdquo;
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Input Form */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Student Profile Info */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs grid grid-cols-2 gap-2 text-slate-700">
              <div><span className="font-semibold text-slate-500">Nama:</span> {currentUser?.nama || 'Aulia Azzahra'}</div>
              <div><span className="font-semibold text-slate-500">NIM:</span> {currentUser?.nim || '09010182428002'}</div>
              <div><span className="font-semibold text-slate-500">Kelas:</span> {currentUser?.kelas || 'MI 5A'}</div>
              <div><span className="font-semibold text-slate-500">Prodi:</span> {currentUser?.prodi || 'D3 Manajemen Informatika'}</div>
            </div>

            {/* Title Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Judul Tugas Akhir <span className="text-red-500 font-bold">*</span>
              </label>
              <textarea
                ref={judulRef}
                rows={3}
                required
                value={judul}
                onChange={(e) => {
                  setJudul(e.target.value);
                  if (hasChecked) {
                    setHasChecked(false);
                  }
                }}
                placeholder="Contoh: Rancang Bangun Sistem Manajemen Pemesanan Menu dengan QR Code pada Kafe Jalan Pulang..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-medium overflow-hidden resize-none transition-[height] duration-75 min-h-[75px]"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Pre-processing otomatis akan menyaring kata umum (stop-words) dan menghitung kemiripan terhadap judul di Repositori UNSRI.
              </p>
            </div>

            {/* Abstrak Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Abstrak Tugas Akhir <span className="text-red-500 font-bold">*</span>
                </label>
                <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  Bilingual ID / EN
                </span>
              </div>
              <textarea
                rows={6}
                required
                data-lenis-prevent
                value={abstrak}
                onChange={(e) => {
                  setAbstrak(e.target.value);
                  if (hasChecked) {
                    setHasChecked(false);
                  }
                }}
                onWheel={(e) => e.stopPropagation()}
                placeholder="Masukkan ringkasan abstrak penelitian tugas akhir (latar belakang, rumusan masalah, metodologi seperti RAD/Waterfall/Agile, framework, dan metode pengujian)..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed overflow-y-auto overscroll-contain no-scrollbar h-36 max-h-56 resize-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Engine akan mengekstrak konsep metode, framework, dan domain bisnis secara bilingual mencocokkan abstrak bahasa Indonesia maupun Inggris di Repositori UNSRI.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !judul.trim() || !abstrak.trim() || (hasChecked && !threshold.allowSubmit)}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  isSubmitting || !judul.trim() || !abstrak.trim() || (hasChecked && !threshold.allowSubmit)
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 active:scale-[0.99]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isEditMode ? 'Menyimpan Perubahan...' : 'Menyimpan Pengajuan...'}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isEditMode ? 'Simpan Perubahan Tugas Akhir' : 'Simpan Pengajuan'}</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* Right: Similarity Engine Feedback */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="space-y-3">
            <SimilarityGauge 
              score={similarityResult.highestScore} 
              titleScore={similarityResult.highestTitleScore}
              abstractScore={similarityResult.highestAbstractScore}
              hasAbstract={similarityResult.hasAbstract}
              isChecking={isChecking} 
              hasChecked={hasChecked}
            />

            {/* Tombol Cek Similarity Dibawah Persentase */}
            <button
              type="button"
              onClick={handleCheckSimilarity}
              disabled={isChecking || !judul || judul.trim().length < 5}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sedang Memeriksa Kemiripan Multi-Field...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>{hasChecked ? 'Cek Ulang Similarity' : 'Cek Similarity (Judul & Abstrak)'}</span>
                </>
              )}
            </button>
          </div>

          {/* Detected Concepts & Keyphrases */}
          {hasChecked && similarityResult.extractedConcepts && similarityResult.extractedConcepts.length > 0 && (
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 text-xs space-y-1.5">
              <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                <span>Konsep & Metodologi Terdeteksi:</span>
              </span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {similarityResult.extractedConcepts.map((c, idx) => (
                  <span key={idx} className="bg-white border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-medium shadow-2xs">
                    {c.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Text Pre-processing Token Breakdown */}
          {hasChecked && similarityResult.processedInput && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
              <span className="font-bold text-slate-700 block mb-1">Hasil Pre-processing Judul (Token Inti):</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {similarityResult.processedInput.split(' ').map((token, idx) => (
                  <span key={idx} className="bg-white border border-slate-300 px-2 py-0.5 rounded text-[11px] font-mono text-slate-700">
                    {token}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Matched Titles List with UNSRI Repository Links */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Daftar Arsip Pembanding Mirip {hasChecked ? `(${similarityResult.matches.length})` : ''}</span>
              </h4>
            </div>

            {!hasChecked ? (
              <div className="text-center py-6 text-xs text-slate-400">
                Klik tombol <strong>"Cek Similarity (Judul & Abstrak)"</strong> untuk melihat pembandingan terhadap {thesisArchives?.length || 400}+ arsip tugas akhir Repositori UNSRI.
              </div>
            ) : similarityResult.matches.length === 0 ? (
              <div className="text-center py-6 text-xs text-emerald-600 bg-emerald-50/60 border border-emerald-100 rounded-lg p-3">
                <ShieldCheck className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
                <p className="font-semibold">Tidak ditemukan tugas akhir dengan kemiripan signifikan di Repositori UNSRI.</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Topik dan metodologi Anda memiliki kebaruan (novelty) yang baik.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {similarityResult.matches.map((m, idx) => {
                  const isExpanded = expandedArchiveId === m.id;
                  const scoreColor = m.skor_gabungan <= 30
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : m.skor_gabungan <= 50
                    ? 'text-amber-700 bg-amber-50 border-amber-200'
                    : 'text-red-700 bg-red-50 border-red-200';

                  return (
                    <div key={idx} className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-slate-50 transition-all space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[11px] font-semibold text-slate-800">
                            {m.penulis} ({m.tahun})
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {m.prodi || 'D3 Manajemen Informatika'}
                          </div>
                        </div>

                        {/* Combined Score Badge */}
                        <div className={`px-2 py-0.5 rounded-lg border text-xs font-bold text-center shrink-0 ${scoreColor}`}>
                          <div>{m.skor_gabungan}%</div>
                          <div className="text-[9px] font-medium opacity-80">Kemiripan</div>
                        </div>
                      </div>

                      {/* Thesis Title */}
                      <p className="text-xs font-semibold text-slate-800 leading-snug">
                        {m.judul}
                      </p>

                      {/* Sub-Scores Breakdown */}
                      <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-2 pt-0.5">
                        <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                          Skor Judul: <strong>{m.skor_judul}%</strong>
                        </span>
                        <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                          Skor Abstrak: <strong>{m.skor_abstrak}%</strong>
                        </span>
                      </div>

                      {/* Matched Keywords Tags */}
                      {m.matched_keywords && m.matched_keywords.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          <span className="text-[10px] font-bold text-slate-500 mr-0.5">Kecocokan:</span>
                          {m.matched_keywords.slice(0, 3).map((kw, kidx) => (
                            <span key={kidx} className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded font-medium">
                              {kw}
                            </span>
                          ))}
                          {m.matched_keywords.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              +{m.matched_keywords.length - 3} lagi
                            </span>
                          )}
                        </div>
                      )}

                      {/* Abstract Snippet / Expandable */}
                      {m.abstrak_preview && (
                        <div className="pt-1">
                          <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/80 leading-relaxed">
                            <span className="font-semibold text-slate-700 block text-[10px] uppercase mb-0.5 text-slate-400">
                              Kutipan Abstrak Arsip:
                            </span>
                            {isExpanded ? m.abstrak : m.abstrak_preview}
                          </div>
                          {m.abstrak && m.abstrak.length > 170 && (
                            <button
                              type="button"
                              onClick={() => setExpandedArchiveId(isExpanded ? null : m.id)}
                              className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 mt-1 inline-flex items-center gap-0.5"
                            >
                              {isExpanded ? (
                                <><span>Tutup Abstrak</span><ChevronUp className="w-3 h-3" /></>
                              ) : (
                                <><span>Lihat Abstrak Lengkap</span><ChevronDown className="w-3 h-3" /></>
                              )}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Action: Open in UNSRI Repository */}
                      {m.link_repo_unsri && (
                        <div className="pt-1.5 flex justify-end">
                          <a
                            href={m.link_repo_unsri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-2xs"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Buka di Repository UNSRI</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Yellow Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-amber-600">
              <AlertTriangle className="w-7 h-7 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">Peringatan Kemiripan Topik (31% - 50%)</h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Pengajuan Anda memiliki tingkat kemiripan <strong>{similarityResult.highestScore}%</strong> terhadap arsip tugas akhir di Repositori UNSRI. Anda tetap diizinkan mengajukan judul ini, namun pastikan Anda dapat menjelaskan kebaruan (novelty) topik dan perbedaan studi kasus saat ditinjau oleh Kaprodi.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              Apakah Anda yakin ingin tetap mengajukan usulan ini?
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowWarningModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Revisi Topik Dulu
              </button>
              <button
                onClick={(e) => {
                  setShowWarningModal(false);
                  handleSubmit(e);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-md"
              >
                Ya, Tetap Ajukan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

