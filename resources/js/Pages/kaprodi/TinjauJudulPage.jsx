import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import SimilarityGauge from '../../components/common/SimilarityGauge.jsx';
import { 
  CheckSquare, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  AlertTriangle, 
  MessageSquare, 
  UserCheck, 
  Users,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function TinjauJudulPage() {
  const { thesisTitles, historicalTitles, advisors, reviewThesisTitle } = useAuth();
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [catatan, setCatatan] = useState('');
  const [confirmedDospem1Nip, setConfirmedDospem1Nip] = useState('');
  const [confirmedDospem2Nip, setConfirmedDospem2Nip] = useState('');

  const allDbTitles = [...thesisTitles, ...historicalTitles];

  const handleOpenReview = (title) => {
    setSelectedTitle(title);
    setCatatan(title.catatan_kaprodi || '');
    setConfirmedDospem1Nip(title.pembimbing_1_nip || '');
    setConfirmedDospem2Nip(title.pembimbing_2_nip || '');
  };

  const handleReview = (status) => {
    if (!selectedTitle) return;
    reviewThesisTitle(
      selectedTitle.id, 
      status, 
      catatan || (status === 'disetujui' ? 'Judul disetujui resmi oleh Kaprodi.' : 'Judul ditolak. Silakan revisi topik pengajuan.'),
      confirmedDospem1Nip,
      confirmedDospem2Nip
    );
    setSelectedTitle(null);
    setCatatan('');
  };

  return (
    <div className="space-y-6">
      
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <CheckSquare className="w-5 h-5 text-indigo-600" />
          <span>Tinjauan & Persetujuan Judul TA Mahasiswa (ACC Kaprodi)</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Verifikasi skor similarity engine, evaluasi rekomendasi dosen pembimbing, dan tetapkan keputusan final persetujuan judul mahasiswa D3 MI.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px]">
                <th className="py-3 px-4">Mahasiswa (NIM)</th>
                <th className="py-3 px-4">Judul Yang Diajukan</th>
                <th className="py-3 px-4">Usulan Pembimbing</th>
                <th className="py-3 px-4 text-center">Validasi Dospem</th>
                <th className="py-3 px-4 text-center">Similarity Score</th>
                <th className="py-3 px-4 text-center">Status ACC</th>
                <th className="py-3 px-4 text-right">Aksi Tinjau</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {thesisTitles.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <div>{t.mhs_nama}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{t.mhs_nim} ({t.mhs_kelas})</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800 max-w-xs">
                    <div className="line-clamp-2" title={t.judul}>{t.judul}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    <div className="space-y-0.5 text-[11px]">
                      <div><span className="font-semibold text-slate-500">P1:</span> {t.pembimbing_1_nama || t.pembimbing_1 || '-'}</div>
                      <div><span className="font-semibold text-slate-500">P2:</span> {t.pembimbing_2_nama || t.pembimbing_2 || '-'}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {t.rekomendasi_dospem_status === 'direkomendasikan' ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Direkomendasikan</span>
                      </span>
                    ) : t.rekomendasi_dospem_status === 'perlu_revisi' ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        <span>Perlu Revisi</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Menunggu Dosen</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600">
                    <span className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {t.skor_kemiripan_terakhir}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                      t.status === 'disetujui' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : t.status === 'ditolak'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {t.status === 'disetujui' ? '✓ Disetujui (ACC)' : t.status === 'ditolak' ? '✕ Ditolak' : '⏳ Menunggu ACC'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpenReview(t)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-xs flex items-center space-x-1.5 ml-auto cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Evaluasi & ACC</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Review Modal */}
      {selectedTitle && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in" data-lenis-prevent>
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Panel Evaluasi & Persetujuan Final (Kaprodi)</span>
                <h3 className="text-base font-bold text-slate-900">{selectedTitle.mhs_nama} ({selectedTitle.mhs_nim} • {selectedTitle.mhs_kelas})</h3>
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
              <p className="text-sm font-semibold text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {selectedTitle.judul}
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 block">Deskripsi / Ringkasan Topik:</span>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                {selectedTitle.deskripsi}
              </p>
            </div>

            <SimilarityGauge score={selectedTitle.skor_kemiripan_terakhir} />

            {/* Review Dosen Pembimbing Status Box */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900 flex items-center space-x-1.5">
                  <UserCheck className="w-4 h-4 text-amber-600" />
                  <span>Rekomendasi Validasi Dosen Pembimbing:</span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  selectedTitle.rekomendasi_dospem_status === 'direkomendasikan'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedTitle.rekomendasi_dospem_status === 'perlu_revisi'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {selectedTitle.rekomendasi_dospem_status === 'direkomendasikan' 
                    ? '✓ Direkomendasikan Dospem' 
                    : selectedTitle.rekomendasi_dospem_status === 'perlu_revisi'
                    ? '⚠ Perlu Revisi Topik'
                    : '⏳ Menunggu Validasi Dosen'}
                </span>
              </div>
              {selectedTitle.catatan_dospem ? (
                <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-amber-200/80 leading-relaxed">
                  <span className="font-semibold text-slate-500">Catatan Dospem: </span>
                  "{selectedTitle.catatan_dospem}"
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 italic">
                  Belum ada catatan tertulis dari dosen pembimbing.
                </p>
              )}
            </div>

            {/* Form Penetapan Pembimbing Resmi oleh Kaprodi */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Penetapan Dosen Pembimbing Resmi (Definitif)</span>
                </span>
                <span className="text-[10px] text-slate-500">Ditetapkan oleh Kaprodi</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Dosen Pembimbing 1:
                  </label>
                  <select
                    value={confirmedDospem1Nip}
                    onChange={(e) => setConfirmedDospem1Nip(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Pilih Pembimbing 1 --</option>
                    {advisors.map(adv => (
                      <option 
                        key={adv.id || adv.nip} 
                        value={adv.nip}
                        disabled={adv.nip === confirmedDospem2Nip}
                      >
                        {adv.nama} (Kuota: {adv.kuota_dospem1 || 8})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Dosen Pembimbing 2:
                  </label>
                  <select
                    value={confirmedDospem2Nip}
                    onChange={(e) => setConfirmedDospem2Nip(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Pilih Pembimbing 2 --</option>
                    {advisors.map(adv => (
                      <option 
                        key={adv.id || adv.nip} 
                        value={adv.nip}
                        disabled={adv.nip === confirmedDospem1Nip}
                      >
                        {adv.nama} (Kuota: {adv.kuota_dospem2 || 8})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Catatan Kaprodi Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan / Alasan Evaluasi Kaprodi <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Tuliskan catatan persetujuan (ACC), arahan metodologi, atau alasan penolakan..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                Persetujuan (ACC) akan mengaktifkan hak mahasiswa mengajukan ruang Seminar Proposal.
              </span>

              <div className="flex space-x-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => handleReview('ditolak')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Tolak Judul</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleReview('disetujui')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Setujui Judul (ACC Final)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

