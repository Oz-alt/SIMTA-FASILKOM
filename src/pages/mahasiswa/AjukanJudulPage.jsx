import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import SimilarityGauge from '../../components/common/SimilarityGauge.jsx';
import { checkClientSimilarity } from '../../lib/similarityEngine.js';
import { preProcessTitle, getSimilarityThreshold } from '@backend/services/titleService.js';
import { FileText, Send, AlertTriangle, ShieldCheck, Info, CheckCircle2 } from 'lucide-react';

import { supabase, isSupabaseConfigured } from '../../services/supabase.js';

export default function AjukanJudulPage() {
  const { currentUser, thesisTitles, historicalTitles, addThesisTitle } = useAuth();
  const navigate = useNavigate();

  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [similarityResult, setSimilarityResult] = useState({ highestScore: 0, processedInput: '', matches: [] });
  const [isChecking, setIsChecking] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Combine database titles for similarity engine fallback
  const allDbTitles = [...thesisTitles, ...historicalTitles];

  // Live Similarity Check debounce effect (Calls real Supabase RPC if configured)
  useEffect(() => {
    if (!judul || judul.trim().length < 5) {
      setSimilarityResult({ highestScore: 0, processedInput: '', matches: [] });
      return;
    }

    setIsChecking(true);
    const timer = setTimeout(async () => {
      // 1. Call real Supabase RPC check_title_similarity function
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
      setIsChecking(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [judul, thesisTitles, historicalTitles]);

  const threshold = getSimilarityThreshold(similarityResult.highestScore);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!threshold.allowSubmit) {
      alert('Pengajuan terkunci karena skor kemiripan melebihi 70%. Silakan revisi judul Anda terlebih dahulu.');
      return;
    }

    if (threshold.status === 'peringatan' && !showWarningModal) {
      setShowWarningModal(true);
      return;
    }

    const processedText = preProcessTitle(judul);

    // Save to real Supabase thesis_titles table
    if (isSupabaseConfigured && supabase && currentUser.id) {
      try {
        await supabase.from('thesis_titles').insert({
          profile_id: currentUser.id,
          mhs_nama: currentUser.nama,
          mhs_nim: currentUser.nim || '09031182328001',
          mhs_kelas: currentUser.kelas || 'MI 5A',
          judul: judul.trim(),
          judul_processed: processedText,
          abstrak: deskripsi.trim(),
          skor_similarity: similarityResult.highestScore,
          status: 'diajukan'
        });
      } catch (err) {
        console.error('Supabase insert title error:', err);
      }
    }

    addThesisTitle({
      judul,
      deskripsi,
      judul_processed: processedText,
      skor_kemiripan_terakhir: similarityResult.highestScore
    });

    navigate('/thesis/status');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          <span>Pengajuan Judul Tugas Akhir & Real-Time Similarity Check</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Sistem akan memeriksa kemiripan judul Anda secara otomatis terhadap arsip historis D3 MI UNSRI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Input Form */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Student Profile Info */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs grid grid-cols-2 gap-2 text-slate-700">
              <div><span className="font-semibold text-slate-500">Nama:</span> {currentUser.nama}</div>
              <div><span className="font-semibold text-slate-500">NIM:</span> {currentUser.nim}</div>
              <div><span className="font-semibold text-slate-500">Kelas:</span> {currentUser.kelas}</div>
              <div><span className="font-semibold text-slate-500">Prodi:</span> D3 Manajemen Informatika</div>
            </div>

            {/* Title Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Judul Tugas Akhir <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Contoh: Rancang Bangun Sistem Informasi Manajemen Penjualan Alat Kesehatan Berbasis Web..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-medium"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                * Minimal 5 kata. Pre-processing otomatis akan menghapus kata umum (stop-words).
              </p>
            </div>

            {/* Abstract / Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Deskripsi / Ringkasan Topik <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Jelaskan secara singkat latar belakang, masalah, dan metode yang digunakan dalam TA ini..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!threshold.allowSubmit || !judul.trim()}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  !threshold.allowSubmit || !judul.trim()
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Ajukan Judul Ke Kaprodi</span>
              </button>
            </div>

          </form>
        </div>

        {/* Right: Similarity Engine Live Feedback */}
        <div className="lg:col-span-5 space-y-4">
          
          <SimilarityGauge score={similarityResult.highestScore} isChecking={isChecking} />

          {/* Text Pre-processing Token Breakdown */}
          {similarityResult.processedInput && (
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
              Daftar Judul Pembanding Mirip ({similarityResult.matches.length})
            </h4>

            {similarityResult.matches.length === 0 ? (
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
