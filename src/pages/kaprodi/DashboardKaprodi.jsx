import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  CheckSquare, 
  Clock, 
  UploadCloud, 
  BarChart3, 
  ArrowRight, 
  Users, 
  CheckCircle2, 
  Building2 
} from 'lucide-react';

export default function DashboardKaprodi() {
  const { thesisTitles, thesisStages, bookings } = useAuth();

  const pendingTitles = thesisTitles.filter(t => t.status === 'diajukan');
  const approvedTitles = thesisTitles.filter(t => t.status === 'disetujui');

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold backdrop-blur-sm mb-3 border border-blue-400/20">
          <span>Portal Akses Kaprodi D3 Manajemen Informatika</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Dashboard Manajemen Akademik TA</h1>
        <p className="text-sm text-blue-100/90 mt-1 max-w-2xl leading-relaxed">
          Tinjau pengajuan judul dengan skor similarity check engine serta pantau progres perjalanan sidang mahasiswa secara terpadu dalam satu tampilan.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Menunggu Tinjauan</div>
          <div className="text-2xl font-extrabold text-amber-600 flex items-center justify-between">
            <span>{pendingTitles.length} Judul</span>
            <Clock className="w-6 h-6 text-amber-500/30" />
          </div>
          <p className="text-[11px] text-slate-500">Judul baru perlu verifikasi Kaprodi</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Judul Disetujui</div>
          <div className="text-2xl font-extrabold text-emerald-600 flex items-center justify-between">
            <span>{approvedTitles.length} Judul</span>
            <CheckCircle2 className="w-6 h-6 text-emerald-500/30" />
          </div>
          <p className="text-[11px] text-slate-500">Mahasiswa telah mengunci topik TA</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Ruang Sidang Approved</div>
          <div className="text-2xl font-extrabold text-blue-600 flex items-center justify-between">
            <span>{bookings.filter(b => b.status === 'disetujui').length} Sidang</span>
            <Building2 className="w-6 h-6 text-blue-500/30" />
          </div>
          <p className="text-[11px] text-slate-500">Jadwal seminar/sidang telah disetujui</p>
        </div>

      </div>

      {/* Combined Dashboard Table: Status Judul + Status Tahapan Sidang Per Mahasiswa */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Matriks Perjalanan TA Mahasiswa (Thesis Journey Matrix)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Dashboard terpadu penggabungan status judul + status 3 tahapan ruang sidang per mahasiswa
            </p>
          </div>

          <Link to="/kaprodi/titles" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1">
            <span>Buka Halaman Tinjau Judul</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px]">
                <th className="py-3 px-3">Mahasiswa (NIM)</th>
                <th className="py-3 px-3">Judul TA</th>
                <th className="py-3 px-3">Skor Similarity</th>
                <th className="py-3 px-3">Status Judul</th>
                <th className="py-3 px-3 text-center">Seminar Proposal</th>
                <th className="py-3 px-3 text-center">Seminar Hasil</th>
                <th className="py-3 px-3 text-center">Sidang Akhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {thesisTitles.map(t => {
                const titleStages = thesisStages.filter(s => s.thesis_title_id === t.id);
                const sempro = titleStages.find(s => s.stage_type === 'seminar_proposal');
                const semhas = titleStages.find(s => s.stage_type === 'seminar_hasil');
                const sidang = titleStages.find(s => s.stage_type === 'sidang_akhir');

                return (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      <div>{t.mhs_nama}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{t.mhs_nim} ({t.mhs_kelas})</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800 max-w-xs truncate" title={t.judul}>
                      {t.judul}
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-600">
                      {t.skor_kemiripan_terakhir}%
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        t.status === 'disetujui' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sempro?.status === 'disetujui' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {sempro?.status || 'Belum'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        semhas?.status === 'disetujui' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {semhas?.status || 'Belum'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sidang?.status === 'disetujui' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {sidang?.status || 'Belum'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
