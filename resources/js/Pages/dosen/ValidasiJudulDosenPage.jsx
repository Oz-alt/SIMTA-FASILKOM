import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  Clock,
  X,
  Check
} from 'lucide-react';

export default function ValidasiJudulDosenPage() {
  const { currentUser, thesisTitles, studentAdvisors, validateThesisTitleDosen } = useAuth();
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [catatanInput, setCatatanInput] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Normalize current user identifiers
  const userNip = currentUser?.nip || currentUser?.nim || '';
  const userNama = currentUser?.nama || '';

  // Filter titles where this dosen is proposed as Pembimbing 1 or 2, or assigned
  const cleanNip = String(userNip || '').trim();
  const cleanNama = (userNama || '').split(',')[0].toLowerCase().trim();

  const relevantTitles = thesisTitles.filter(t => {
    const isProposed1 = (cleanNip && String(t.pembimbing_1_nip || '').trim() === cleanNip) || 
                        (cleanNama && t.pembimbing_1 && t.pembimbing_1.toLowerCase().includes(cleanNama));
    const isProposed2 = (cleanNip && String(t.pembimbing_2_nip || '').trim() === cleanNip) || 
                        (cleanNama && t.pembimbing_2 && t.pembimbing_2.toLowerCase().includes(cleanNama));
    const isAssigned = studentAdvisors.some(sa => 
      String(sa.student_nim || '').trim() === String(t.mhs_nim || '').trim() && 
      ((cleanNip && (String(sa.dospem1_nip || '').trim() === cleanNip || String(sa.dospem2_nip || '').trim() === cleanNip)) ||
       (cleanNama && ((sa.dospem1_nama && sa.dospem1_nama.toLowerCase().includes(cleanNama)) || (sa.dospem2_nama && sa.dospem2_nama.toLowerCase().includes(cleanNama)))))
    );
    return isProposed1 || isProposed2 || isAssigned;
  });

  // Split into pending validation by dosen vs already validated by dosen
  const pendingValidationTitles = relevantTitles.filter(t => 
    !t.rekomendasi_dospem_status || t.rekomendasi_dospem_status === 'menunggu_validasi'
  );
  const validatedTitles = relevantTitles.filter(t => 
    t.rekomendasi_dospem_status === 'direkomendasikan' || t.rekomendasi_dospem_status === 'perlu_revisi'
  );

  // 1 & 2: Langsung ACC tanpa modal catatan
  const handleDirectAcc = (title) => {
    validateThesisTitleDosen(title.id, 'direkomendasikan', '');
    setToastMsg(`Judul "${title.judul}" berhasil di-ACC.`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // 6: Buka modal Catatan
  const openCatatanModal = (title) => {
    setSelectedTitle(title);
    setCatatanInput(title.catatan_dospem || '');
  };

  const handleSendCatatan = () => {
    if (!selectedTitle) return;
    validateThesisTitleDosen(selectedTitle.id, 'perlu_revisi', catatanInput.trim());
    setToastMsg(`Catatan untuk ${selectedTitle.mhs_nama} berhasil dikirim.`);
    setSelectedTitle(null);
    setCatatanInput('');
    setTimeout(() => setToastMsg(''), 4000);
  };

  // 4: Helper warna skor kemiripan (hanya persentase)
  const getSimilarityColor = (score = 0) => {
    const num = Number(score) || 0;
    if (num <= 30) {
      return { textColor: 'text-emerald-700', barColor: 'bg-emerald-500' };
    }
    if (num <= 50) {
      return { textColor: 'text-amber-700', barColor: 'bg-amber-500' };
    }
    return { textColor: 'text-rose-700', barColor: 'bg-rose-500' };
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

      {/* Header Halaman (1: Hilangkan Kaprodi) */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Validasi Judul Mahasiswa</h1>
        <p className="text-xs text-slate-500 font-normal mt-1 leading-relaxed">
          Tinjau dan setujui (ACC) usulan judul tugas akhir mahasiswa bimbingan Anda.
        </p>
      </div>

      {/* Layout Utama 2 Kolom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Kolom Kiri: Antrean Menunggu Validasi */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-900">Menunggu Validasi</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {pendingValidationTitles.length}
              </span>
            </div>
            <div className="flex items-center space-x-1 text-[11px] text-slate-400 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>Antrean Dosen</span>
            </div>
          </div>

          {pendingValidationTitles.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Check className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-xs font-semibold text-slate-700">Semua usulan telah divalidasi</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Tidak ada pengajuan judul baru yang menunggu validasi Anda saat ini.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {pendingValidationTitles.map(t => {
                const isDospem1 = (cleanNip && String(t.pembimbing_1_nip || '').trim() === cleanNip) || (cleanNama && t.pembimbing_1 && t.pembimbing_1.toLowerCase().includes(cleanNama));
                const isDospem2 = (cleanNip && String(t.pembimbing_2_nip || '').trim() === cleanNip) || (cleanNama && t.pembimbing_2 && t.pembimbing_2.toLowerCase().includes(cleanNama));
                const roleLabel = isDospem1 ? 'Pembimbing 1' : isDospem2 ? 'Pembimbing 2' : 'Dosen Pembimbing';
                const similarity = getSimilarityColor(t.skor_kemiripan_terakhir);
                const scoreNum = Number(t.skor_kemiripan_terakhir) || 0;

                return (
                  <div 
                    key={t.id} 
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-3"
                  >
                    {/* Header Item: Mahasiswa & Role Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 truncate">{t.mhs_nama}</h3>
                        <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                          {t.mhs_nim} <span className="text-slate-300 mx-1">•</span> {t.mhs_kelas}
                        </p>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60 shrink-0">
                        {roleLabel}
                      </span>
                    </div>

                    {/* Judul & Deskripsi Tugas Akhir */}
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-slate-900 leading-snug">
                        {t.judul}
                      </h4>
                      {t.deskripsi && (
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {t.deskripsi}
                        </p>
                      )}
                    </div>
                    
                    {/* Footer Item: Skor Kemiripan (Hanya Persen) & Tombol Aksi */}
                    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* 4: Resiko persen saja */}
                      <div className="space-y-1 sm:max-w-xs flex-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Skor Kemiripan:</span>
                          <span className={`font-bold ${similarity.textColor}`}>
                            {scoreNum}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${similarity.barColor}`}
                            style={{ width: `${Math.min(100, Math.max(4, scoreNum))}%` }}
                          />
                        </div>
                      </div>

                      {/* Tombol Aksi (6: Cukup Catatan & 5: Tanpa Emot Ceklis Langsung ACC) */}
                      <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                        <button 
                          type="button"
                          onClick={() => openCatatanModal(t)}
                          className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
                        >
                          Catatan
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleDirectAcc(t)}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors shadow-2xs cursor-pointer"
                        >
                          ACC
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Riwayat Validasi Dosen */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-900">Riwayat Validasi</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {validatedTitles.length}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Telah Divalidasi</span>
          </div>

          {validatedTitles.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-1">
              <p className="text-xs font-medium text-slate-400">Belum ada judul yang divalidasi.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {validatedTitles.map(t => {
                const isAcc = t.rekomendasi_dospem_status === 'direkomendasikan' || t.status === 'disetujui';

                return (
                  <div key={t.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-900 block truncate">{t.mhs_nama}</span>
                        <span className="text-[11px] text-slate-400 font-normal">{t.mhs_nim}</span>
                      </div>

                      {/* 3: Tanda bulat di samping rekomendasi dihilangkan, 1: status ACC */}
                      {isAcc ? (
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md shrink-0">
                          ACC
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md shrink-0">
                          Revisi
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 font-medium leading-snug line-clamp-2" title={t.judul}>
                      {t.judul}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Modal Khusus Catatan Mahasiswa (6: Cukup Catatan) */}
      {selectedTitle && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in" data-lenis-prevent>
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-xl p-5 sm:p-6 space-y-4">
            
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Catatan untuk Mahasiswa</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {selectedTitle.mhs_nama} • {selectedTitle.mhs_nim}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedTitle(null)} 
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Judul Usulan</span>
              <p className="text-xs font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 leading-snug">
                {selectedTitle.judul}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                Catatan Revisi:
              </label>
              <textarea
                rows={3}
                value={catatanInput}
                onChange={(e) => setCatatanInput(e.target.value)}
                placeholder="Tuliskan catatan revisi untuk mahasiswa..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 text-slate-800 placeholder:text-slate-400"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTitle(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSendCatatan}
                disabled={!catatanInput.trim()}
                className="px-4 py-2 font-medium text-xs rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Kirim Catatan
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
