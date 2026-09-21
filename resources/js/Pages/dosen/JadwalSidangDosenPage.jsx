import React, { useMemo } from 'react';
import { CalendarDays, Bell, Mail, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function JadwalSidangDosenPage() {
  const { currentUser, defenseSchedules } = useAuth();

  const userNip = currentUser?.nip || currentUser?.nim || '';
  const userNama = currentUser?.nama || '';

  const jadwalSidang = useMemo(() => {
    if (!defenseSchedules || defenseSchedules.length === 0) return [];
    return defenseSchedules.map(sch => {
      let peran = 'Dewan Penguji';
      if (sch.ketua_penguji_nip === userNip || (userNama && sch.ketua_penguji_nama?.toLowerCase().includes(userNama.toLowerCase()))) {
        peran = 'Ketua Penguji';
      } else if (sch.sekretaris_nip === userNip || (userNama && sch.sekretaris_nama?.toLowerCase().includes(userNama.toLowerCase()))) {
        peran = 'Sekretaris (Dospem 1)';
      } else if (sch.penguji1_nip === userNip || (userNama && sch.penguji1_nama?.toLowerCase().includes(userNama.toLowerCase()))) {
        peran = 'Anggota Penguji 1';
      } else if (sch.penguji2_nip === userNip || (userNama && sch.penguji2_nama?.toLowerCase().includes(userNama.toLowerCase()))) {
        peran = 'Anggota Penguji 2';
      }

      return {
        id: sch.id,
        mhs_nama: sch.mhs_nama,
        mhs_nim: sch.mhs_nim,
        tanggal: sch.tanggal,
        waktu: `${sch.waktu_mulai || '09:00'} - ${sch.waktu_selesai || '10:30'} WIB`,
        ruangan: sch.ruangan,
        jenis: sch.jenis_sidang || 'Sidang Akhir',
        peran
      };
    });
  }, [defenseSchedules, userNip, userNama]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-extrabold tracking-tight">Notifikasi & Jadwal Sidang Tugas Akhir</h1>
        <p className="text-sm text-blue-100/90 mt-1 max-w-2xl leading-relaxed">
          Tinjau jadwal sidang, seminar, serta notifikasi resmi terkait penugasan pengujian Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Kolom Notifikasi & Email */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 mb-4">
              <Bell className="w-5 h-5 text-indigo-600" />
              <span>Notifikasi Sistem</span>
            </h2>
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <p className="text-xs font-semibold text-slate-800">Penugasan Penguji Baru</p>
                <p className="text-[11px] text-slate-500 mt-1">Anda ditugaskan sebagai Ketua Penguji untuk mhs. Budi Santoso.</p>
                <span className="text-[10px] font-mono text-slate-400 mt-2 block">1 hari yang lalu</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 mb-4">
              <Mail className="w-5 h-5 text-rose-600" />
              <span>Email Undangan Resmi</span>
            </h2>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Email undangan resmi beserta SK Pengujian telah dikirimkan ke email Anda (<strong>{currentUser.email}</strong>).
            </p>
            <button className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors border border-slate-200 flex items-center justify-center space-x-2 cursor-pointer">
              <Mail className="w-4 h-4" />
              <span>Kirim Ulang Email</span>
            </button>
          </div>
        </div>

        {/* Kolom Jadwal */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs h-full">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 mb-6 border-b border-slate-100 pb-4">
              <CalendarDays className="w-5 h-5 text-indigo-600" />
              <span>Jadwal Terdekat</span>
            </h2>

            {jadwalSidang.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">
                Tidak ada jadwal sidang terdekat.
              </div>
            ) : (
              <div className="space-y-4">
                {jadwalSidang.map((jadwal) => (
                  <div key={jadwal.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-indigo-300">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-extrabold uppercase tracking-wider">
                          {jadwal.jenis}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                          {jadwal.peran}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 mt-2">{jadwal.mhs_nama}</p>
                      <p className="text-[11px] font-mono text-slate-500">{jadwal.mhs_nim}</p>
                    </div>

                    <div className="flex flex-col space-y-2 sm:text-right">
                      <div className="flex items-center sm:justify-end space-x-1.5 text-xs text-slate-700 font-medium">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                        <span>{jadwal.tanggal}</span>
                      </div>
                      <div className="flex items-center sm:justify-end space-x-1.5 text-xs text-slate-700 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{jadwal.waktu}</span>
                      </div>
                      <div className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md inline-block self-start sm:self-end">
                        {jadwal.ruangan}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
