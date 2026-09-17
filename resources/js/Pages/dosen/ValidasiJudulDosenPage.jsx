import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Clock,
  UserCheck
} from 'lucide-react';

export default function ValidasiJudulDosenPage() {
  const { currentUser, thesisTitles, studentAdvisors, reviewThesisTitle } = useAuth();

  // Get students assigned to this dosen
  const myStudents = studentAdvisors.filter(sa => 
    sa.dospem1_nip === currentUser.nip || sa.dospem2_nip === currentUser.nip
  );

  // Get titles for these students
  const titles = thesisTitles.filter(t => 
    myStudents.some(sa => sa.student_nim === t.mhs_nim) ||
    t.pembimbing_1 === currentUser.nama ||
    t.pembimbing_2 === currentUser.nama
  );

  const pendingTitles = titles.filter(t => t.status === 'diajukan');
  const reviewedTitles = titles.filter(t => t.status !== 'diajukan');

  const handleReview = (titleId, status) => {
    // In a real app, this might just add a "Dosen Approval" flag before it goes to Kaprodi.
    // Here we'll use the existing reviewThesisTitle action to simulate it.
    reviewThesisTitle(titleId, status, `Ditinjau oleh Dosen Pembimbing (${currentUser.nama})`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-extrabold tracking-tight">Validasi Judul Mahasiswa</h1>
        <p className="text-sm text-teal-100/90 mt-1 max-w-2xl leading-relaxed">
          Tinjau pengajuan judul tugas akhir dari mahasiswa bimbingan Anda sebelum diproses lebih lanjut oleh Kaprodi.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Antrean Validasi */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>Menunggu Validasi Anda</span>
            </h2>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {pendingTitles.length} Judul
            </span>
          </div>

          {pendingTitles.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-sm font-medium text-slate-500">Tidak ada pengajuan judul baru yang perlu divallidasi.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingTitles.map(t => (
                <div key={t.id} className="p-5 rounded-xl border border-amber-200 bg-amber-50/30 space-y-4 transition-all">
                  <div>
                    <div className="font-bold text-slate-900">{t.mhs_nama}</div>
                    <div className="text-xs font-mono text-slate-500 mb-2">{t.mhs_nim} • {t.mhs_kelas}</div>
                    <div className="text-sm font-bold text-slate-800">{t.judul}</div>
                    <p className="text-xs text-slate-600 mt-1">{t.deskripsi}</p>
                  </div>
                  
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                    <div className="text-xs">
                      <span className="block font-bold text-slate-700">Skor Kemiripan (Similarity)</span>
                      <span className={`font-extrabold text-lg ${t.skor_kemiripan_terakhir > 40 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {t.skor_kemiripan_terakhir}%
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleReview(t.id, 'ditolak')}
                        className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Tolak
                      </button>
                      <button 
                        onClick={() => handleReview(t.id, 'disetujui')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center space-x-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Rekomendasikan (ACC)</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Riwayat Validasi */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Riwayat Validasi Judul</h2>
          </div>

          {reviewedTitles.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-sm font-medium text-slate-500">Belum ada riwayat validasi judul.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviewedTitles.map(t => (
                <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{t.mhs_nama}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{t.mhs_nim}</div>
                    </div>
                    {t.status === 'disetujui' ? (
                      <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Disetujui</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" />
                        <span>Ditolak</span>
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-xs font-medium text-slate-800 line-clamp-2" title={t.judul}>
                    {t.judul}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
