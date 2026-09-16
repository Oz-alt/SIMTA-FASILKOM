import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link } from '@inertiajs/react';
import { Building2, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, PlusCircle } from 'lucide-react';

export default function StatusPeminjamanPage() {
  const { currentUser, bookings } = useAuth();
  const myBookings = bookings.filter(b => currentUser?.nim && b.mhs_nim === currentUser.nim);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span>Status & Riwayat Peminjaman Ruang Sidang</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Daftar pengajuan ruangan untuk seminar proposal, seminar hasil, dan sidang akhir.
          </p>
        </div>

        <Link
          href="/booking/apply/seminar_proposal"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 self-start"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Ajukan Peminjaman Ruang</span>
        </Link>
      </div>

      <div className="space-y-4">
        {myBookings.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">
            Belum ada data peminjaman ruangan.
          </div>
        ) : (
          myBookings.map(b => (
            <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kode Booking: {b.booking_code}</span>
                  <div className="text-xs font-bold text-indigo-700 mt-0.5">{b.stage_label || b.purpose}</div>
                </div>
                <span className={`self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full capitalize ${
                  b.status === 'disetujui' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : b.status === 'ditolak'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {b.status === 'disetujui' ? '✓ Disetujui Admin Sarana' : b.status === 'ditolak' ? '✕ Ditolak Admin' : '⏳ Menunggu Persetujuan Admin'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-400 font-semibold text-[10px] block">Ruangan</span>
                  <span className="font-bold text-slate-900">{b.room_name}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-400 font-semibold text-[10px] block">Tanggal & Jam</span>
                  <span className="font-bold text-slate-900">{b.booking_date} ({b.start_time} - {b.end_time} WIB)</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-400 font-semibold text-[10px] block">Disetujui Oleh</span>
                  <span className="font-bold text-slate-900">{b.approved_by || 'Admin Sarana'}</span>
                </div>
              </div>

              {b.rejection_reason && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800">
                  <span className="font-bold">Alasan Penolakan Admin:</span> {b.rejection_reason}
                </div>
              )}

            </div>
          ))
        )}
      </div>

    </div>
  );
}
