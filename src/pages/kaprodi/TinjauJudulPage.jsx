import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import SimilarityGauge from '../../components/common/SimilarityGauge.jsx';
import { checkClientSimilarity } from '../../lib/similarityEngine.js';
import { CheckSquare, CheckCircle2, XCircle, Eye, AlertTriangle, MessageSquare } from 'lucide-react';

export default function TinjauJudulPage() {
  const { thesisTitles, historicalTitles, reviewThesisTitle } = useAuth();
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [catatan, setCatatan] = useState('');

  const allDbTitles = [...thesisTitles, ...historicalTitles];

  const handleReview = (status) => {
    if (!selectedTitle) return;
    reviewThesisTitle(selectedTitle.id, status, catatan || (status === 'disetujui' ? 'Judul disetujui Kaprodi.' : 'Judul ditolak. Silakan revisi topik.'));
    setSelectedTitle(null);
    setCatatan('');
  };

  return (
    <div className="space-y-6">
      
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <CheckSquare className="w-5 h-5 text-indigo-600" />
          <span>Tinjauan & Persetujuan Judul TA Mahasiswa</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Verifikasi skor similarity engine dan setujui / tolak pengajuan judul mahasiswa D3 MI.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px]">
                <th className="py-3 px-4">Mahasiswa (NIM)</th>
                <th className="py-3 px-4">Judul Yang Diajukan</th>
                <th className="py-3 px-4 text-center">Similarity Score</th>
                <th className="py-3 px-4 text-center">Status</th>
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
                  <td className="py-3 px-4 font-medium text-slate-800 max-w-sm">
                    <div className="line-clamp-2">{t.judul}</div>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600">
                    <span className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {t.skor_kemiripan_terakhir}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                      t.status === 'disetujui' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedTitle(t);
                        setCatatan(t.catatan_kaprodi || '');
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-xs flex items-center space-x-1.5 ml-auto cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Tinjau & Detail</span>
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Panel Evaluasi Kaprodi</span>
                <h3 className="text-base font-bold text-slate-900">{selectedTitle.mhs_nama} ({selectedTitle.mhs_nim})</h3>
              </div>
              <button 
                onClick={() => setSelectedTitle(null)} 
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Tutup ✕
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Judul Tugas Akhir:</span>
              <p className="text-sm font-semibold text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {selectedTitle.judul}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Deskripsi / Abstrak:</span>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                {selectedTitle.deskripsi}
              </p>
            </div>

            <SimilarityGauge score={selectedTitle.skor_kemiripan_terakhir} />

            {/* Catatan Kaprodi Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan / Alasan Evaluasi Kaprodi <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Tuliskan alasan persetujuan atau catatan revisi untuk mahasiswa..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleReview('ditolak')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Tolak Judul</span>
              </button>
              <button
                onClick={() => handleReview('disetujui')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Setujui Judul (ACC)</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
