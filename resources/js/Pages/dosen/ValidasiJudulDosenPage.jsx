import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Clock,
  UserCheck,
  MessageSquare,
  AlertCircle,
  Info,
  Send,
  Eye
} from 'lucide-react';

export default function ValidasiJudulDosenPage() {
  const { currentUser, thesisTitles, studentAdvisors, validateThesisTitleDosen } = useAuth();
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [actionType, setActionType] = useState('direkomendasikan'); // 'direkomendasikan' | 'perlu_revisi'
  const [catatanInput, setCatatanInput] = useState('');

  // Normalize current user identifiers
  const userNip = currentUser?.nip || currentUser?.nim || '';
  const userNama = currentUser?.nama || '';

  // Filter titles where this dosen is proposed as Pembimbing 1 or 2, or assigned
  const relevantTitles = thesisTitles.filter(t => {
    const isProposed1 = (t.pembimbing_1_nip && t.pembimbing_1_nip === userNip) || (t.pembimbing_1 && t.pembimbing_1 === userNama);
    const isProposed2 = (t.pembimbing_2_nip && t.pembimbing_2_nip === userNip) || (t.pembimbing_2 && t.pembimbing_2 === userNama);
    const isAssigned = studentAdvisors.some(sa => 
      sa.student_nim === t.mhs_nim && (sa.dospem1_nip === userNip || sa.dospem2_nip === userNip)
    );
    // If user is general dosen or mock test, fallback to show unreviewed or relevant
    return isProposed1 || isProposed2 || isAssigned || currentUser?.role === 'dosen';
  });

  // Split into pending validation by dosen vs already validated by dosen
  const pendingValidationTitles = relevantTitles.filter(t => 
    !t.rekomendasi_dospem_status || t.rekomendasi_dospem_status === 'menunggu_validasi'
  );
  const validatedTitles = relevantTitles.filter(t => 
    t.rekomendasi_dospem_status === 'direkomendasikan' || t.rekomendasi_dospem_status === 'perlu_revisi'
  );

  const openReviewModal = (title, type) => {
    setSelectedTitle(title);
    setActionType(type);
    setCatatanInput(
      type === 'direkomendasikan'
        ? 'Usulan topik sangat relevan dan layak dilanjutkan. Direkomendasikan untuk persetujuan (ACC) Kaprodi.'
        : 'Perlu penyesuaian pada batasan masalah dan metodologi penelitian.'
    );
  };

  const handleConfirmValidation = () => {
    if (!selectedTitle) return;
    validateThesisTitleDosen(selectedTitle.id, actionType, catatanInput);
    setSelectedTitle(null);
    setCatatanInput('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg space-y-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Validasi & Rekomendasi Judul Mahasiswa</h1>
            <p className="text-sm text-teal-100/90 mt-1 max-w-2xl leading-relaxed">
              Tinjau usulan topik tugas akhir dari mahasiswa bimbingan Anda. Berikan catatan kelayakan akademik sebelum diputuskan (ACC) oleh Kaprodi.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shrink-0">
            <Info className="w-4 h-4 text-teal-300 shrink-0" />
            <span>ACC Final Judul tetap diputuskan oleh <strong>Kaprodi</strong></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Antrean Menunggu Validasi Dosen */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>Menunggu Validasi Anda ({pendingValidationTitles.length})</span>
            </h2>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Antrean Dosen
            </span>
          </div>

          {pendingValidationTitles.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Semua usulan telah divalidasi!</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tidak ada pengajuan judul baru yang menunggu validasi rekomendasi Anda saat ini.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingValidationTitles.map(t => {
                const isDospem1 = t.pembimbing_1_nip === userNip || t.pembimbing_1 === userNama;
                const isDospem2 = t.pembimbing_2_nip === userNip || t.pembimbing_2 === userNama;
                const roleLabel = isDospem1 ? 'Usulan Pembimbing 1' : isDospem2 ? 'Usulan Pembimbing 2' : 'Dosen Pembimbing';

                return (
                  <div key={t.id} className="p-5 rounded-xl border border-amber-200 bg-amber-50/20 space-y-3.5 transition-all hover:border-amber-300">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{t.mhs_nama}</div>
                        <div className="text-[11px] font-mono text-slate-500">{t.mhs_nim} • {t.mhs_kelas}</div>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                        {roleLabel}
                      </span>
                    </div>

                    <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Judul Yang Diajukan:</span>
                      <p className="text-xs font-bold text-slate-800 leading-snug">{t.judul}</p>
                      {t.deskripsi && (
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed pt-1">
                          {t.deskripsi}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-3 rounded-lg border border-slate-200 gap-2">
                      <div className="text-xs">
                        <span className="text-[10px] font-bold text-slate-500 block">Skor Kemiripan (Engine)</span>
                        <span className={`font-extrabold text-sm ${t.skor_kemiripan_terakhir > 40 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {t.skor_kemiripan_terakhir}% (Aman &lt; 70%)
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                        <button 
                          onClick={() => openReviewModal(t, 'perlu_revisi')}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg border border-rose-200 transition-colors cursor-pointer"
                        >
                          Beri Catatan Revisi
                        </button>
                        <button 
                          onClick={() => openReviewModal(t, 'direkomendasikan')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer flex items-center space-x-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Rekomendasikan ke Kaprodi</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Riwayat Validasi & Status ACC Kaprodi */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <span>Riwayat Validasi Dosen</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {validatedTitles.length} Judul
            </span>
          </div>

          {validatedTitles.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-medium text-slate-500">Belum ada judul yang divalidasi.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {validatedTitles.map(t => (
                <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white transition-all space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{t.mhs_nama}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{t.mhs_nim}</div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      {t.rekomendasi_dospem_status === 'direkomendasikan' ? (
                        <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Direkomendasikan Dospem</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3" />
                          <span>Perlu Revisi Topik</span>
                        </span>
                      )}

                      {/* Kaprodi Final Status Badge */}
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded capitalize ${
                        t.status === 'disetujui' 
                          ? 'bg-blue-100 text-blue-800' 
                          : t.status === 'ditolak'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        Status Kaprodi: {t.status === 'disetujui' ? '✓ ACC Final' : t.status === 'ditolak' ? '✕ Ditolak' : '⏳ Menunggu ACC'}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs font-medium text-slate-800 line-clamp-2" title={t.judul}>
                    {t.judul}
                  </div>

                  {t.catatan_dospem && (
                    <div className="bg-white p-2 rounded border border-slate-200 text-[11px] text-slate-600 flex items-start space-x-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-700">Catatan Dosen: </span>
                        <span>{t.catatan_dospem}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Modal Review / Validasi Dosen */}
      {selectedTitle && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in" data-lenis-prevent>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Validasi Akademik Dosen Pembimbing</span>
                <h3 className="text-base font-bold text-slate-900">{selectedTitle.mhs_nama} ({selectedTitle.mhs_nim})</h3>
              </div>
              <button 
                onClick={() => setSelectedTitle(null)} 
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 block">Judul Tugas Akhir:</span>
              <p className="text-xs font-semibold text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {selectedTitle.judul}
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 block">Pilihan Tindakan:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActionType('direkomendasikan')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-all ${
                    actionType === 'direkomendasikan'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Rekomendasikan (ACC Usulan)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('perlu_revisi')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-all ${
                    actionType === 'perlu_revisi'
                      ? 'bg-amber-50 border-amber-500 text-amber-700 ring-2 ring-amber-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Minta Revisi Topik</span>
                </button>
              </div>
            </div>

            {/* Input Catatan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan / Masukan Dosen Pembimbing:
              </label>
              <textarea
                rows={3}
                value={catatanInput}
                onChange={(e) => setCatatanInput(e.target.value)}
                placeholder="Tuliskan catatan kelayakan topik, saran metodologi, atau revisi..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] text-slate-600">
              💡 Catatan ini akan diteruskan ke mahasiswa dan menjadi pertimbangan utama bagi <strong>Kaprodi</strong> dalam memberikan persetujuan (ACC) final.
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTitle(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmValidation}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simpan Validasi Dosen</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

