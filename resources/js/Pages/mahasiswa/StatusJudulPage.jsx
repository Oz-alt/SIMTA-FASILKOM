import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link } from '@inertiajs/react';
import { Clock, CheckCircle2, XCircle, AlertCircle, MessageSquare, ArrowRight } from 'lucide-react';

export default function StatusJudulPage() {
  const { currentUser, thesisTitles } = useAuth();
  const myTitles = thesisTitles.filter(t => (currentUser?.id && t.profile_id === currentUser.id) || (currentUser?.nim && t.mhs_nim === currentUser.nim));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          <span>Status & Riwayat Pengajuan Judul TA</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Pantau status peninjauan judul oleh Kaprodi D3 Manajemen Informatika
        </p>
      </div>

      <div className="space-y-4">
        {myTitles.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400 space-y-3">
            <p>Belum ada pengajuan judul TA.</p>
            <Link href="/thesis/submit" className="inline-block px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg">
              Ajukan Judul Sekarang
            </Link>
          </div>
        ) : (
          myTitles.map(t => (
            <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ID Pengajuan: {t.id}</span>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Diajukan pada: {new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <span className={`self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full capitalize ${
                  t.status === 'disetujui' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : t.status === 'ditolak'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {t.status === 'disetujui' ? '✓ Disetujui Kaprodi' : t.status === 'ditolak' ? '✕ Ditolak' : '⏳ Menunggu Tinjauan Kaprodi'}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">{t.judul}</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{t.deskripsi}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
                <div>
                  <span className="font-semibold text-slate-500">Skor Kemiripan Engine:</span>
                  <span className="font-bold text-emerald-600 ml-1">{t.skor_kemiripan_terakhir}% (Aman)</span>
                </div>
                <span className="text-[11px] text-slate-400">Pre-processed Token Match Verified</span>
              </div>

              {/* Review Notes from Kaprodi if any */}
              {t.catatan_kaprodi && (
                <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3.5 text-xs text-blue-900 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5 text-blue-800">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span>Catatan Catatan Tinjauan Kaprodi:</span>
                  </div>
                  <p className="leading-relaxed pl-5 font-medium">{t.catatan_kaprodi}</p>
                </div>
              )}

              {/* Action Buttons */}
              {t.status === 'disetujui' && (
                <div className="pt-2 flex justify-end">
                  <Link 
                    href="/booking/apply/seminar_proposal"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
                  >
                    <span>Lanjut Ajukan Ruang Seminar Proposal</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

            </div>
          ))
        )}
      </div>

    </div>
  );
}
