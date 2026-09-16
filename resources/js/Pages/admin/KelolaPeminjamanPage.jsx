import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { CheckSquare, CheckCircle2, XCircle, AlertTriangle, Building2, Calendar } from 'lucide-react';

export default function KelolaPeminjamanPage() {
  const { bookings, reviewBooking } = useAuth();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filteredBookings = filterStatus === 'ALL'
    ? bookings
    : bookings.filter(b => b.status === filterStatus);

  const handleApprove = (id) => {
    reviewBooking(id, 'disetujui');
  };

  const handleRejectSubmit = () => {
    if (!selectedBooking || !rejectionReason.trim()) {
      alert('Alasan penolakan wajib diisi oleh Admin Sarana.');
      return;
    }
    reviewBooking(selectedBooking.id, 'ditolak', rejectionReason);
    setSelectedBooking(null);
    setRejectionReason('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            <span>Persetujuan Peminjaman Ruang Sidang</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tinjau dan setujui / tolak pengajuan penggunaan ruangan oleh mahasiswa D3 MI.
          </p>
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 self-start sm:self-auto"
        >
          <option value="ALL">Semua Status</option>
          <option value="menunggu_persetujuan">Menunggu Persetujuan</option>
          <option value="disetujui">Disetujui</option>
          <option value="ditolak">Ditolak</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px]">
                <th className="py-3 px-3">Kode / Mahasiswa</th>
                <th className="py-3 px-3">Keperluan Tahapan</th>
                <th className="py-3 px-3">Ruangan</th>
                <th className="py-3 px-3">Jadwal Tanggal & Jam</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Aksi Persetujuan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.map(b => (
                <tr key={b.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    <div className="font-mono text-[10px] text-slate-400">{b.booking_code}</div>
                    <div>{b.mhs_nama} ({b.mhs_nim})</div>
                  </td>
                  <td className="py-3 px-3 font-medium text-indigo-700">
                    {b.stage_label || b.purpose}
                  </td>
                  <td className="py-3 px-3 text-slate-800 font-medium">
                    {b.room_name}
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {b.booking_date} ({b.start_time} - {b.end_time})
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                      b.status === 'disetujui' ? 'bg-emerald-100 text-emerald-800' : b.status === 'ditolak' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {b.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right space-x-1.5">
                    {b.status === 'menunggu_persetujuan' && (
                      <>
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] rounded-lg cursor-pointer"
                        >
                          Tolak
                        </button>
                        <button
                          onClick={() => handleApprove(b.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg shadow-xs cursor-pointer"
                        >
                          Setujui
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mandatory Rejection Reason Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-rose-600 font-bold text-base">
              <AlertTriangle className="w-5 h-5" />
              <h3>Alasan Penolakan Peminjaman Ruang</h3>
            </div>

            <p className="text-xs text-slate-600">
              Sistem mengharuskan Admin Sarana mengisi alasan resmi penolakan untuk mahasiswa <strong>{selectedBooking.mhs_nama}</strong>.
            </p>

            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Contoh: Ruangan sedang dalam perawatan AC emergency / bentrok dengan kegiatan fakultas..."
              className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleRejectSubmit}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-md"
              >
                Konfirmasi Penolakan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
