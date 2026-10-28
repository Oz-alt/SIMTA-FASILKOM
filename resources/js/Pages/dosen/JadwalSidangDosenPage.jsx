import React, { useMemo } from 'react';
import { CalendarDays, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import StudentWhatsAppLink from '../../Components/common/StudentWhatsAppLink.jsx';

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
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Jadwal Sidang Tugas Akhir</h1>
        <p className="text-sm text-indigo-100/90 max-w-2xl leading-relaxed mt-1 font-normal">
          Tinjau jadwal sidang dan seminar terkait penugasan pengujian Anda.
        </p>
      </div>

      {/* Kolom Jadwal Sidang */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center space-x-2 mb-6 border-b border-slate-100 pb-4">
          <CalendarDays className="w-5 h-5 text-indigo-600" />
          <span>Jadwal Terdekat</span>
        </h2>

        {jadwalSidang.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs sm:text-sm font-normal">
            Tidak ada jadwal sidang terdekat.
          </div>
        ) : (
          <div className="space-y-4">
            {jadwalSidang.map((jadwal) => (
              <div key={jadwal.id} className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-white hover:border-indigo-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1.5 flex-wrap gap-y-1">
                    <span className="px-2.5 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-semibold uppercase tracking-wider">
                      {jadwal.jenis}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg">
                      {jadwal.peran}
                    </span>
                  </div>
                  <div className="mt-2">
                    <StudentWhatsAppLink
                      nim={jadwal.mhs_nim}
                      nama={jadwal.mhs_nama}
                      className="text-sm sm:text-base font-semibold text-slate-900 hover:text-emerald-700"
                      showIcon={false}
                    >
                      {jadwal.mhs_nama}
                    </StudentWhatsAppLink>
                  </div>
                  <p className="text-xs font-mono font-medium text-slate-500 mt-0.5">{jadwal.mhs_nim}</p>
                </div>

                <div className="flex flex-col space-y-2 sm:text-right">
                  <div className="flex items-center sm:justify-end space-x-1.5 text-xs text-slate-600 font-medium">
                    <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                    <span>{jadwal.tanggal}</span>
                  </div>
                  <div className="flex items-center sm:justify-end space-x-1.5 text-xs text-slate-600 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{jadwal.waktu}</span>
                  </div>
                  <div className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2.5 py-1 rounded-lg inline-block self-start sm:self-end">
                    {jadwal.ruangan}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
