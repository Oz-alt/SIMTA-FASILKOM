import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { router } from '@inertiajs/react';
import SimilarityGauge from '../../Components/common/SimilarityGauge.jsx';
import { checkClientSimilarity } from '../../lib/similarityEngine.js';
import { preProcessTitle, getSimilarityThreshold } from '@backend/services/titleService.js';
import { FileText, Send, AlertTriangle, ShieldCheck, Info, CheckCircle2, Search, RefreshCw } from 'lucide-react';

import { supabase, isSupabaseConfigured } from '../../services/supabase.js';

export default function AjukanJudulPage() {
  const { currentUser, thesisTitles, historicalTitles, advisors, addThesisTitle } = useAuth();
  const navigate = (url) => router.visit(url);

  const [judul, setJudul] = useState('');
  const [abstrak, setAbstrak] = useState('');
  const [pembimbing1Nip, setPembimbing1Nip] = useState('');
  const [pembimbing2Nip, setPembimbing2Nip] = useState('');
  const [similarityResult, setSimilarityResult] = useState({ highestScore: 0, processedInput: '', matches: [] });
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Auto-resize ref for judul textarea
  const judulRef = useRef(null);

  useEffect(() => {
    if (judulRef.current) {
      judulRef.current.style.height = 'auto';
      judulRef.current.style.height = `${Math.max(75, judulRef.current.scrollHeight)}px`;
    }
  }, [judul]);

  // Combine database titles for similarity engine fallback
  const allDbTitles = [...thesisTitles, ...historicalTitles];

  // Explicit Similarity Check triggered by button click
  const handleCheckSimilarity = async () => {
    if (!judul || judul.trim().length < 5) {
      alert('Silakan masukkan judul tugas akhir minimal 5 karakter terlebih dahulu.');
      return;
    }

    setIsChecking(true);

    // 1. Call real Supabase RPC check_title_similarity function if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('check_title_similarity', {
          input_title: judul.trim()
        });

        if (!error && data) {
          const matches = data.map(item => ({
            judul: item.matched_title,
            penulis: item.source_type === 'thesis_titles' ? 'Mahasiswa Aktif' : 'Arsip Alumni',
            tahun: '2025',
            skor_fts: item.skor_fts || 0,
            skor_trigram: item.skor_trigram || 0,
            skor_gabungan: item.skor_gabungan || 0
          }));

          const highest = matches.length > 0 ? Math.max(...matches.map(m => m.skor_gabungan)) : 0;
          const processedText = preProcessTitle(judul);

          setSimilarityResult({
            highestScore: highest,
            processedInput: processedText,
            matches: matches
          });
          setHasChecked(true);
          setIsChecking(false);
          return;
        }
      } catch (err) {
        console.error('Supabase RPC similarity check error:', err);
      }
    }

    // 2. Fallback to client similarity engine
    const result = checkClientSimilarity(judul, allDbTitles);
    setSimilarityResult(result);
    setHasChecked(true);
    setIsChecking(false);
  };

  const threshold = getSimilarityThreshold(similarityResult.highestScore);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!judul || !judul.trim()) {
      alert('Judul Tugas Akhir wajib diisi.');
      return;
    }

    if (!abstrak || !abstrak.trim()) {
      alert('Abstrak Tugas Akhir wajib diisi.');
      return;
    }

    let currentScore = similarityResult.highestScore;

    // If user filled in title but hasn't clicked check yet, run check first
    if (judul && judul.trim().length >= 5 && !hasChecked) {
      setIsChecking(true);
      let res;
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase.rpc('check_title_similarity', {
            input_title: judul.trim()
          });
          if (!error && data) {
            const matches = data.map(item => ({
              judul: item.matched_title,
              penulis: item.source_type === 'thesis_titles' ? 'Mahasiswa Aktif' : 'Arsip Alumni',
              tahun: '2025',
              skor_fts: item.skor_fts || 0,
              skor_trigram: item.skor_trigram || 0,
              skor_gabungan: item.skor_gabungan || 0
            }));
            const highest = matches.length > 0 ? Math.max(...matches.map(m => m.skor_gabungan)) : 0;
            res = { highestScore: highest, processedInput: preProcessTitle(judul), matches };
          }
        } catch (err) {
          console.error(err);
        }
      }
      if (!res) {
        res = checkClientSimilarity(judul, allDbTitles);
      }
      setSimilarityResult(res);
      setHasChecked(true);
      setIsChecking(false);
      currentScore = res.highestScore;

      const checkThreshold = getSimilarityThreshold(currentScore);
      if (!checkThreshold.allowSubmit) {
        alert('Pengajuan terkunci karena skor kemiripan melebihi 70%. Silakan revisi judul Anda terlebih dahulu.');
        return;
      }

      if (checkThreshold.status === 'peringatan' && !showWarningModal) {
        setShowWarningModal(true);
        return;
      }
    } else if (hasChecked) {
      if (!threshold.allowSubmit) {
        alert('Pengajuan terkunci karena skor kemiripan melebihi 70%. Silakan revisi judul Anda terlebih dahulu.');
        return;
      }

      if (threshold.status === 'peringatan' && !showWarningModal) {
        setShowWarningModal(true);
        return;
      }
    }

    const processedText = preProcessTitle(judul);
    const selectedDospem1 = advisors.find(a => a.nip === pembimbing1Nip);
    const selectedDospem2 = advisors.find(a => a.nip === pembimbing2Nip);

    // Save to real Supabase thesis_titles table
    if (isSupabaseConfigured && supabase && currentUser?.id) {
      try {
        await supabase.from('thesis_titles').insert({
          profile_id: currentUser.id,
          mhs_nama: currentUser?.nama || 'Aulia Azzahra',
          mhs_nim: currentUser?.nim || '09010182428002',
          mhs_kelas: currentUser?.kelas || 'MI 5A',
          judul: judul.trim(),
          judul_processed: processedText,
          abstrak: abstrak.trim(),
          skor_similarity: currentScore,
          pembimbing_1_nip: pembimbing1Nip,
          pembimbing_1_nama: selectedDospem1?.nama || '',
          pembimbing_2_nip: pembimbing2Nip,
          pembimbing_2_nama: selectedDospem2?.nama || '',
          status: 'tinjauan'
        });
      } catch (err) {
        console.error('Supabase insert title error:', err);
      }
    }

    addThesisTitle({
      judul: judul.trim(),
      abstrak: abstrak.trim(),
      deskripsi: abstrak.trim(),
      judul_processed: processedText,
      skor_kemiripan_terakhir: currentScore,
      pembimbing_1_nip: pembimbing1Nip,
      pembimbing_1_nama: selectedDospem1?.nama || '',
      pembimbing_2_nip: pembimbing2Nip,
      pembimbing_2_nama: selectedDospem2?.nama || ''
    });

    navigate('/thesis/status');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          <span>Pengajuan Tugas Akhir & Dosen Pembimbing</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Sistem akan memeriksa kemiripan judul Anda terhadap arsip historis D3 MI UNSRI melalui tombol Cek Similarity.
        </p>
      </div>

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
                placeholder="Contoh: Rancang Bangun Sistem Informasi Manajemen Penjualan Alat Kesehatan Berbasis Web..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-medium overflow-hidden resize-none transition-[height] duration-75 min-h-[75px]"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Pre-processing otomatis akan menghapus kata umum (stop-words) dan memeriksa kemiripan saat tombol Cek Similarity diklik.
              </p>
            </div>

            {/* Abstrak Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Abstrak <span className="text-red-500 font-bold">*</span>
              </label>
              <textarea
                rows={6}
                required
                data-lenis-prevent
                value={abstrak}
                onChange={(e) => setAbstrak(e.target.value)}
                onWheel={(e) => e.stopPropagation()}
                placeholder="Masukkan ringkasan abstrak penelitian tugas akhir (latar belakang, rumusan masalah, metode, dan tujuan penelitian)..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed overflow-y-auto overscroll-contain no-scrollbar h-36 max-h-56 resize-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Wajib diisi secara lengkap sebagai ringkasan substansi topik tugas akhir.
              </p>
            </div>

            {/* Usulan Dosen Pembimbing */}
            <div className="border-t border-slate-200 pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  Usulan Dosen Pembimbing
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Opsional / Direkomendasikan</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pembimbing 1 */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Usulan Pembimbing 1:
                  </label>
                  <select
                    value={pembimbing1Nip}
                    onChange={(e) => setPembimbing1Nip(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">-- Pilih Usulan Pembimbing 1 --</option>
                    {advisors.map(adv => (
                      <option 
                        key={adv.id || adv.nip} 
                        value={adv.nip}
                        disabled={adv.nip === pembimbing2Nip}
                      >
                        {adv.nama} ({adv.prodi || 'MI'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pembimbing 2 */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Usulan Pembimbing 2:
                  </label>
                  <select
                    value={pembimbing2Nip}
                    onChange={(e) => setPembimbing2Nip(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">-- Pilih Usulan Pembimbing 2 --</option>
                    {advisors.map(adv => (
                      <option 
                        key={adv.id || adv.nip} 
                        value={adv.nip}
                        disabled={adv.nip === pembimbing1Nip}
                      >
                        {adv.nama} ({adv.prodi || 'MI'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Info Alur Persetujuan */}
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg p-2.5 text-[11px] text-indigo-900 flex items-start space-x-2">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">Alur Verifikasi:</span> Usulan dosen pembimbing akan ditinjau & divalidasi oleh dosen bersangkutan. <strong>Persetujuan final (ACC Judul & Penetapan Pembimbing) tetap diputuskan oleh Kaprodi</strong>.
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!judul.trim() || !abstrak.trim() || (hasChecked && !threshold.allowSubmit)}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  !judul.trim() || !abstrak.trim() || (hasChecked && !threshold.allowSubmit)
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Ajukan Tugas Akhir</span>
              </button>
            </div>

          </form>
        </div>

        {/* Right: Similarity Engine Feedback */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="space-y-3">
            <SimilarityGauge 
              score={similarityResult.highestScore} 
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
                  <span>Sedang Memeriksa Kemiripan...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>{hasChecked ? 'Cek Ulang Similarity' : 'Cek Similarity'}</span>
                </>
              )}
            </button>
          </div>

          {/* Text Pre-processing Token Breakdown */}
          {hasChecked && similarityResult.processedInput && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
              <span className="font-bold text-slate-700 block mb-1">Hasil Pre-processing (Token Inti):</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {similarityResult.processedInput.split(' ').map((token, idx) => (
                  <span key={idx} className="bg-white border border-slate-300 px-2 py-0.5 rounded text-[11px] font-mono text-slate-700">
                    {token}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Matched Titles List */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Daftar Judul Pembanding Mirip {hasChecked ? `(${similarityResult.matches.length})` : ''}
            </h4>

            {!hasChecked ? (
              <div className="text-center py-6 text-xs text-slate-400">
                Klik tombol <strong>"Cek Similarity"</strong> untuk melihat perbandingan kemiripan dengan arsip judul.
              </div>
            ) : similarityResult.matches.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                Tidak ada judul historis yang mirip.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {similarityResult.matches.map((m, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700 truncate max-w-[200px]">{m.penulis} ({m.tahun})</span>
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {m.skor_gabungan}%
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-800 leading-snug">{m.judul}</p>
                    <div className="text-[10px] text-slate-400 flex items-center space-x-2 pt-0.5">
                      <span>FTS: {m.skor_fts}%</span>
                      <span>•</span>
                      <span>Trigram: {m.skor_trigram}%</span>
                    </div>
                  </div>
                ))}
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
              <h3 className="text-base font-bold text-slate-900">Peringatan Kemiripan Judul (41% - 70%)</h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Judul Anda memiliki tingkat kemiripan <strong>{similarityResult.highestScore}%</strong> terhadap arsip judul sebelumnya. Anda tetap diizinkan mengajukan judul ini, namun pastikan Anda dapat menjelaskan kebaruan (novelty) topik Anda saat ditinjau oleh Kaprodi.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              Apakah Anda yakin ingin tetap mengajukan judul ini?
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowWarningModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Revisi Judul Dulu
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
