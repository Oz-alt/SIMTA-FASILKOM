import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import ThesisStepper from '../../components/common/ThesisStepper.jsx';
import { 
  FileText, 
  CalendarDays, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  PlusCircle,
  UserCheck
} from 'lucide-react';

export default function DashboardMahasiswa() {
  const { currentUser, thesisTitles, thesisStages, bookings } = useAuth();

  // Get current student's title
  const myTitle = thesisTitles.find(t => (currentUser?.id && t.profile_id === currentUser.id) || (currentUser?.nim && t.mhs_nim === currentUser.nim)) || thesisTitles[0];
  const myStages = thesisStages.filter(s => s.thesis_title_id === myTitle?.id);
  const myBookings = bookings.filter(b => currentUser?.nim && b.mhs_nim === currentUser.nim);

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-sm mb-3">
            <span>Portal Mahasiswa</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang, {currentUser?.nama || 'Mahasiswa'}!
          </h1>
          <p className="text-sm text-indigo-100/90 mt-1 max-w-2xl leading-relaxed">
            Kelola pengajuan judul Tugas Akhir dengan Similarity Check Engine serta ajukan ruang seminar &amp; sidang secara terpadu.
          </p>

          {/* Integrated Duo Dospem Assigned by Kaprodi */}
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl text-xs">
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4 text-indigo-200" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Dosen Pembimbing 1 (Utama)</span>
                <p className="font-bold text-white truncate">{myTitle?.pembimbing_1 || 'Dr. Ir. Hendra Kusuma, M.T.'}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/30 border border-purple-400/40 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4 text-purple-200" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">Dosen Pembimbing 2 (Pendamping)</span>
                <p className="font-bold text-white truncate">{myTitle?.pembimbing_2 || 'Siti Nurhaliza, S.Kom., M.Kom.'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thesis Journey Stepper */}
      <ThesisStepper currentTitle={myTitle} stages={myStages} />

      {/* Status Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Active Title Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Judul TA Terdaftar</span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
              myTitle?.status === 'disetujui' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {myTitle?.status || 'Belum Ada'}
            </span>
          </div>

          {myTitle ? (
            <div>
              <h4 className="text-sm font-bold text-slate-900 leading-snug">{myTitle.judul}</h4>
              <p className="text-xs text-slate-500 mt-2 line-clamp-2">{myTitle.deskripsi}</p>
              
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">Similarity Score:</span>
                <span className="font-bold text-emerald-600">{myTitle.skor_kemiripan_terakhir}% (Aman)</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">
              Belum ada judul diajukan.
            </div>
          )}

          <div className="pt-2">
            <Link to="/thesis/status" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1">
              <span>Lihat Detail Audit & Status</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Room Defense Booking Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Ruang Sidang</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {myBookings.length} Pengajuan
            </span>
          </div>

          {myBookings.length > 0 ? (
            <div className="space-y-2">
              {myBookings.slice(0, 2).map(b => (
                <div key={b.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">{b.stage_label || b.purpose}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{b.room_name} • {b.booking_date} ({b.start_time}-{b.end_time})</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                    b.status === 'disetujui' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {b.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">
              Belum ada peminjaman ruangan diajukan.
            </div>
          )}

          <div className="pt-2">
            <Link to="/booking/status" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1">
              <span>Lihat Riwayat Peminjaman Ruang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
