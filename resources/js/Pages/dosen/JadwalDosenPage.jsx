import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  CalendarDays, 
  MapPin, 
  Clock, 
  Users, 
  MessageCircle,
  AlertCircle
} from 'lucide-react';

export default function JadwalDosenPage() {
  const { currentUser, advisorSchedules, bookings, studentAdvisors } = useAuth();

  // Find this dosen's offline schedule configuration
  const mySchedule = advisorSchedules.find(s => s.dosen_nip === currentUser.nip);

  // Find this dosen's students
  const myStudents = studentAdvisors.filter(sa => 
    sa.dospem1_nip === currentUser.nip || sa.dospem2_nip === currentUser.nip
  );

  // Find upcoming bookings (Seminar/Sidang) for this dosen's students
  const upcomingBookings = useMemo(() => {
    return bookings.filter(b => 
      b.status === 'disetujui' && 
      myStudents.some(sa => sa.student_nim === b.mhs_nim)
    ).sort((a, b) => new Date(a.booking_date) - new Date(b.booking_date));
  }, [bookings, myStudents]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-extrabold tracking-tight">Jadwal Bimbingan & Sidang</h1>
        <p className="text-sm text-teal-100/90 mt-1 max-w-2xl leading-relaxed">
          Tinjau jadwal ketersediaan bimbingan offline Anda dan jadwal seminar/sidang mahasiswa bimbingan Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Jadwal Bimbingan Rutin (Read-Only) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <CalendarDays className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Jadwal Ketersediaan Bimbingan</h2>
          </div>

          {!mySchedule ? (
            <div className="text-center py-6 px-4 bg-slate-50 rounded-xl border border-slate-100">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">Jadwal bimbingan rutin Anda belum dikonfigurasi oleh Admin/Kaprodi.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Hari Bimbingan</div>
                  <div className="text-sm font-bold text-slate-800">{mySchedule.hari_bimbingan}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Waktu</div>
                  <div className="text-sm font-bold text-slate-800 flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{mySchedule.jam_bimbingan}</span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 space-y-3">
                <div>
                  <div className="text-[10px] uppercase font-bold text-emerald-600/70 mb-1">Lokasi Ruangan</div>
                  <div className="text-sm font-bold text-emerald-900 flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>{mySchedule.lokasi}</span>
                  </div>
                </div>
                
                {mySchedule.link_wa_group && (
                  <div className="pt-2 border-t border-emerald-100">
                    <div className="text-[10px] uppercase font-bold text-emerald-600/70 mb-1">Grup Koordinasi (WhatsApp)</div>
                    <a href={mySchedule.link_wa_group} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      <span>Buka Tautan Grup WA</span>
                    </a>
                  </div>
                )}
              </div>

              {mySchedule.catatan && (
                <div className="text-xs text-slate-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                  <span className="font-bold text-amber-800">Catatan Khusus: </span>
                  {mySchedule.catatan}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Jadwal Sidang/Seminar Mahasiswa Bimbingan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Users className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Jadwal Sidang Mahasiswa</h2>
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="text-center py-6 px-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">Tidak ada jadwal sidang/seminar dalam waktu dekat untuk mahasiswa bimbingan Anda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map(b => (
                <div key={b.id} className="p-4 rounded-xl border border-slate-200 hover:border-emerald-200 transition-colors bg-white group">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-emerald-600 mb-0.5">{b.stage_label}</div>
                      <div className="font-bold text-slate-900">{b.mhs_nama}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{b.mhs_nim}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-800">{new Date(b.booking_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <div className="text-[11px] text-slate-500 font-medium flex items-center justify-end space-x-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{b.start_time} - {b.end_time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center space-x-1 text-xs text-slate-600 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{b.room_name} ({b.building_code})</span>
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
