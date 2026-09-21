import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link } from '@inertiajs/react';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  MessageSquare, 
  ArrowRight,
  UserCheck,
  ShieldCheck,
  FileText,
  Users
} from 'lucide-react';

export default function StatusJudulPage() {
  const { currentUser, thesisTitles } = useAuth();
  const myTitles = thesisTitles.filter(t => 
    (currentUser?.id && t.profile_id === currentUser.id) || 
    (currentUser?.nim && t.mhs_nim === currentUser.nim) ||
    t.mhs_nama === currentUser?.nama
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          <span>Status & Alur Persetujuan Judul TA</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Pantau proses validasi dosen pembimbing hingga penetapan persetujuan final (ACC) oleh Kaprodi D3 Manajemen Informatika.
        </p>
      </div>

      <div className="space-y-5">
        {myTitles.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-400 space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-700 text-sm">Belum ada pengajuan judul TA</p>
              <p className="text-slate-500 mt-1">Silakan buat pengajuan judul dan pilih usulan dosen pembimbing Anda.</p>
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
            const isKaprodiApproved = t.status === 'disetujui';
            const isKaprodiRejected = t.status === 'ditolak';
            const isDosenRecommended = t.rekomendasi_dospem_status === 'direkomendasikan';
            const isDosenRevision = t.rekomendasi_dospem_status === 'perlu_revisi';

            return (
              <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                
                {/* Header Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ID Pengajuan: {t.id}</span>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Diajukan pada: {new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  <span className={`self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full capitalize ${
                    isKaprodiApproved 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : isKaprodiRejected
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isKaprodiApproved ? '✓ Disetujui Kaprodi (ACC)' : isKaprodiRejected ? '✕ Ditolak Kaprodi' : '⏳ Menunggu ACC Kaprodi'}
                  </span>
                </div>

                {/* Judul & Deskripsi */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{t.judul}</h3>
                  {t.deskripsi && (
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {t.deskripsi}
                    </p>
                  )}
                </div>

                {/* Similarity Score Badge */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
                  <div>
                    <span className="font-semibold text-slate-500">Skor Kemiripan (Similarity Engine):</span>
                    <span className="font-bold text-emerald-600 ml-1.5 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {t.skor_kemiripan_terakhir}% (Aman &lt; 70%)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">Pemeriksaan Otomatis Arsip Terverifikasi</span>
                </div>

                {/* 3-Step Flow Progress Timeline */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Tahapan Verifikasi & Persetujuan:
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    
                    {/* Step 1: Mahasiswa Submit */}
                    <div className="bg-white p-3 rounded-lg border border-emerald-200 shadow-2xs space-y-1">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>1. Pengajuan Judul</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Berhasil diajukan ke sistem</p>
                    </div>

                    {/* Step 2: Dosen Review */}
                    <div className={`bg-white p-3 rounded-lg border shadow-2xs space-y-1 ${
                      isDosenRecommended 
                        ? 'border-emerald-200' 
                        : isDosenRevision 
                        ? 'border-amber-200' 
                        : 'border-slate-200'
                    }`}>
                      <div className="flex items-center space-x-1.5 text-xs font-bold">
                        {isDosenRecommended ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-700">2. Validasi Dosen (ACC Usulan)</span>
                          </>
                        ) : isDosenRevision ? (
                          <>
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            <span className="text-amber-700">2. Revisi Dosen Pembimbing</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">2. Validasi Dosen Pembimbing</span>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {isDosenRecommended 
                          ? 'Direkomendasikan dosen ke Kaprodi' 
                          : isDosenRevision 
                          ? 'Dosen meminta perbaikan topik' 
                          : 'Menunggu review usulan dosen'}
                      </p>
                    </div>

                    {/* Step 3: Kaprodi Final ACC */}
                    <div className={`bg-white p-3 rounded-lg border shadow-2xs space-y-1 ${
                      isKaprodiApproved 
                        ? 'border-emerald-300 ring-2 ring-emerald-500/10' 
                        : isKaprodiRejected 
                        ? 'border-rose-300' 
                        : 'border-slate-200'
                    }`}>
                      <div className="flex items-center space-x-1.5 text-xs font-bold">
                        {isKaprodiApproved ? (
                          <>
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-700">3. Persetujuan Final (ACC Kaprodi)</span>
                          </>
                        ) : isKaprodiRejected ? (
                          <>
                            <XCircle className="w-4 h-4 text-rose-600" />
                            <span className="text-rose-700">3. Ditolak Kaprodi</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 text-amber-500" />
                            <span className="text-amber-700">3. ACC Final Kaprodi</span>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {isKaprodiApproved 
                          ? 'Judul resmi disetujui & Dospem aktif' 
                          : isKaprodiRejected 
                          ? 'Perlu revisi topik baru' 
                          : 'Menunggu keputusan akhir Kaprodi'}
                      </p>
                    </div>

                  </div>
                </div>

                {/* Dosen Pembimbing Details */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span>{isKaprodiApproved ? 'Dosen Pembimbing Resmi:' : 'Usulan Dosen Pembimbing:'}</span>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {isKaprodiApproved ? 'Ditetapkan oleh Kaprodi' : 'Diajukan Mahasiswa'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 pt-1">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block">PEMBIMBING 1:</span>
                      <span className="font-bold text-slate-800 text-xs">
                        {t.pembimbing_1_nama || t.pembimbing_1 || 'Belum Ditentukan'}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block">PEMBIMBING 2:</span>
                      <span className="font-bold text-slate-800 text-xs">
                        {t.pembimbing_2_nama || t.pembimbing_2 || 'Belum Ditentukan'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes from Dosen Pembimbing if any */}
                {t.catatan_dospem && (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-1">
                    <div className="font-bold flex items-center space-x-1.5 text-amber-800">
                      <UserCheck className="w-4 h-4 text-amber-600" />
                      <span>Catatan Validasi Dosen Pembimbing ({t.rekomendasi_oleh || 'Dospem'}):</span>
                    </div>
                    <p className="leading-relaxed pl-5 font-medium">{t.catatan_dospem}</p>
                  </div>
                )}

                {/* Notes from Kaprodi if any */}
                {t.catatan_kaprodi && (
                  <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 space-y-1">
                    <div className="font-bold flex items-center space-x-1.5 text-blue-800">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span>Catatan Evaluasi Resmi Kaprodi:</span>
                    </div>
                    <p className="leading-relaxed pl-5 font-medium">{t.catatan_kaprodi}</p>
                  </div>
                )}

                {/* Action Buttons */}
                {isKaprodiApproved && (
                  <div className="pt-2 flex justify-end">
                    <Link 
                      href="/booking/apply/seminar_proposal"
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
                    >
                      <span>Lanjut Ajukan Ruang Seminar Proposal</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}

