import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link } from '@inertiajs/react';
import { Building2, CheckSquare, Clock, ListOrdered, Calendar, ArrowRight } from 'lucide-react';

export default function DashboardAdmin() {
  const { bookings, rooms } = useAuth();

  const pendingBookings = bookings.filter(b => b.status === 'menunggu_persetujuan');
  const approvedBookings = bookings.filter(b => b.status === 'disetujui');
  const activeRooms = rooms.filter(r => r.status === 'aktif');

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-xs font-semibold backdrop-blur-sm mb-3 border border-purple-400/20">
          <span>Portal Akses Admin Sarana Ruang Sidang</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Dashboard Operasional Ruang Sidang</h1>
        <p className="text-sm text-purple-100/90 mt-1 max-w-2xl leading-relaxed">
          Kelola persetujuan peminjaman ruangan, status pemeliharaan fasilitas, dan prioritas rekomendasi ruangan per jurusan.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Antrean Persetujuan</div>
          <div className="text-2xl font-extrabold text-amber-600 flex items-center justify-between">
            <span>{pendingBookings.length} Pengajuan</span>
            <Clock className="w-6 h-6 text-amber-500/30" />
          </div>
          <p className="text-[11px] text-slate-500">Perlu tindakan persetujuan Admin</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Peminjaman Disetujui</div>
          <div className="text-2xl font-extrabold text-emerald-600 flex items-center justify-between">
            <span>{approvedBookings.length} Peminjaman</span>
            <CheckSquare className="w-6 h-6 text-emerald-500/30" />
          </div>
          <p className="text-[11px] text-slate-500">Ruangan ter-booking</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ruangan Aktif Siap Pakai</div>
          <div className="text-2xl font-extrabold text-indigo-600 flex items-center justify-between">
            <span>{activeRooms.length} / {rooms.length} Ruangan</span>
            <Building2 className="w-6 h-6 text-indigo-500/30" />
          </div>
          <p className="text-[11px] text-slate-500">Kapasitas siap pakai</p>
        </div>

      </div>

      {/* Pending Queue Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Antrean Pengajuan Menunggu Persetujuan</span>
          </h3>
          <Link href="/admin/bookings" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1">
            <span>Buka Halaman Persetujuan Ruangan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingBookings.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Tidak ada pengajuan peminjaman ruangan yang menunggu persetujuan.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingBookings.map(b => (
              <div key={b.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-slate-900">{b.stage_label || b.purpose}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {b.mhs_nama} ({b.mhs_nim}) • {b.room_name} • {b.booking_date} ({b.start_time} - {b.end_time})
                  </div>
                </div>
                <Link href="/admin/bookings" className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-lg self-start sm:self-auto">
                  Proses Pengajuan
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
