import React, { useMemo } from 'react';
import { CalendarDays, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import StudentWhatsAppLink from '../../Components/common/StudentWhatsAppLink.jsx';
import DosenHeaderBanner from '../../Components/common/DosenHeaderBanner.jsx';

export default function JadwalSidangDosenPage() {
  const { currentUser, defenseSchedules } = useAuth();

  const userNip = currentUser?.nip || currentUser?.nim || '';
  const userNama = currentUser?.nama || '';

  const formatTanggalIndo = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const jadwalSidang = useMemo(() => {
    if (!defenseSchedules || defenseSchedules.length === 0) return [];
    return defenseSchedules.map(sch => {
      const mulai = (sch.waktu_mulai || '08:00').replace(':', '.');
      const selesai = (sch.waktu_selesai || '10:00').replace(':', '.');

      const penguji1 =
        sch.penguji1_nama ||
        sch.ketua_penguji_nama ||
        sch.sekretaris_nama ||
        'Dr. A. Budi Santoso, S.Kom., M.T.';

      const penguji2 =
        sch.penguji2_nama ||
        (sch.penguji1_nama && sch.ketua_penguji_nama ? sch.ketua_penguji_nama : '') ||
        'Siti Nurhaliza, S.Kom., M.Cs.';

      return {
        id: sch.id,
        mhs_nama: sch.mhs_nama,
        mhs_nim: sch.mhs_nim,
        tanggal: formatTanggalIndo(sch.tanggal),
        waktu: `${mulai} – ${selesai} WIB`,
        ruangan: sch.ruangan || 'Ruang Sidang A',
        penguji1,
        penguji2
      };
    });
  }, [defenseSchedules, userNip, userNama]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <DosenHeaderBanner
        title="Jadwal Sidang Tugas Akhir"
        subtitle="SISTEM MONITORING TUGAS AKHIR"
      />

      {/* Kolom Jadwal Sidang */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
        <div className="flex items-center space-x-3 mb-6 flex-wrap gap-y-2">
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Jadwal Terdekat
            </h2>
          </div>
          <span className="px-3.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
            Semester Genap 2024/2025
          </span>
        </div>

        {jadwalSidang.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs sm:text-sm font-normal">
            Tidak ada jadwal sidang terdekat.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {jadwalSidang.map((jadwal) => (
              <div
                key={jadwal.id}
                className="py-5 first:pt-0 last:pb-0 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Sisi Kiri: Mahasiswa + Tanggal, Jam, Tempat */}
                <div className="flex-1 lg:pr-8 lg:border-r lg:border-slate-200/70">
                  <div className="pb-4 border-b border-slate-200/70">
                    <div>
                      <StudentWhatsAppLink
                        nim={jadwal.mhs_nim}
                        nama={jadwal.mhs_nama}
                        className="text-sm font-bold text-slate-900 uppercase tracking-tight hover:text-emerald-700"
                        showIcon={false}
                      >
                        {jadwal.mhs_nama}
                      </StudentWhatsAppLink>
                    </div>
                    <p className="text-xs font-mono font-medium text-slate-500 mt-1">
                      {jadwal.mhs_nim}
                    </p>
                  </div>

                  <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-0">
                    <div className="sm:pr-6">
                      <p className="text-xs font-medium text-slate-400 mb-1">Tanggal</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-900">{jadwal.tanggal}</p>
                    </div>
                    <div className="sm:px-6 sm:border-l sm:border-slate-200/70">
                      <p className="text-xs font-medium text-slate-400 mb-1">Jam</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-900">{jadwal.waktu}</p>
                    </div>
                    <div className="sm:pl-6 sm:border-l sm:border-slate-200/70">
                      <p className="text-xs font-medium text-slate-400 mb-1">Tempat</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-900">{jadwal.ruangan}</p>
                    </div>
                  </div>
                </div>

                {/* Sisi Kanan: Penguji 1 & Penguji 2 */}
                <div className="lg:w-72 xl:w-80 shrink-0 space-y-4 lg:pl-2">
                  <div className="flex items-center space-x-3.5">
                    <User className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-slate-400 leading-tight">Penguji 1</p>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">{jadwal.penguji1}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3.5">
                    <User className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-slate-400 leading-tight">Penguji 2</p>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">{jadwal.penguji2}</p>
                    </div>
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
