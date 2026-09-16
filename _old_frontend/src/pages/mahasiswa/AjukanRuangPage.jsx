import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate, useParams } from 'react-router-dom';
import { getRecommendedRooms, checkBookingCollision, STAGE_LABELS } from '@backend/services/bookingService.js';
import { Building2, CalendarDays, Clock, CheckCircle2, AlertTriangle, Send, Sparkles } from 'lucide-react';

export default function AjukanRuangPage() {
  const { currentUser, thesisTitles, thesisStages, rooms, roomPriorities, bookings, addBooking } = useAuth();
  const navigate = useNavigate();
  const { stage = 'seminar_proposal' } = useParams();

  const myApprovedTitle = thesisTitles.find(t => (currentUser?.id && t.profile_id === currentUser.id) || (currentUser?.nim && t.mhs_nim === currentUser.nim)) || thesisTitles[0];
  const myCurrentStage = thesisStages.find(s => s.thesis_title_id === myApprovedTitle?.id && s.stage_type === stage) || thesisStages[0];

  const [bookingDate, setBookingDate] = useState('2026-09-15');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id || '');
  const [purpose, setPurpose] = useState(`${STAGE_LABELS[stage] || 'Seminar Proposal'} - ${currentUser?.nama || 'Mahasiswa'}`);

  // Recommended rooms based on Department & Stage type priority rules
  const recommendations = getRecommendedRooms(
    rooms,
    roomPriorities,
    currentUser?.department_id || 'dept-mi-1',
    stage,
    bookings,
    bookingDate,
    startTime,
    endTime
  );

  const selectedRoomCollision = checkBookingCollision(bookings, selectedRoomId, bookingDate, startTime, endTime);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!myApprovedTitle || myApprovedTitle.status !== 'disetujui') {
      alert('Judul TA Anda harus berstatus "Disetujui" terlebih dahulu sebelum dapat mengajukan ruangan.');
      return;
    }

    if (selectedRoomCollision.hasCollision) {
      alert('Ruangan pada slot jam dan tanggal tersebut sudah terpakai/bentrok. Silakan pilih ruangan atau slot waktu lain.');
      return;
    }

    const selectedRoom = rooms.find(r => r.id === selectedRoomId);

    addBooking({
      thesis_stage_id: myCurrentStage?.id || 'stage-1',
      room_id: selectedRoomId,
      booking_date: bookingDate,
      start_time: startTime,
      end_time: endTime,
      purpose,
      room_name: selectedRoom?.name,
      building_code: 'DIPKOM',
      mhs_nama: currentUser.nama,
      mhs_nim: currentUser.nim,
      judul_ta: myApprovedTitle?.judul,
      stage_label: STAGE_LABELS[stage] || 'Seminar Proposal'
    });

    navigate('/booking/status');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <Building2 className="w-5 h-5 text-indigo-600" />
          <span>Form Pengajuan Peminjaman Ruang Sidang</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Tahapan: <span className="font-bold text-indigo-700">{STAGE_LABELS[stage] || 'Seminar Proposal'}</span>
        </p>
      </div>

      {!myApprovedTitle || myApprovedTitle.status !== 'disetujui' ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 text-rose-900 text-xs space-y-2">
          <div className="font-bold text-sm flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>Syarat Belum Terpenuhi</span>
          </div>
          <p>
            Sistem mensyaratkan judul Tugas Akhir Anda berstatus <strong>"Disetujui"</strong> oleh Kaprodi sebelum dapat mengajukan ruangan untuk seminar proposal / hasil / sidang akhir.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Form Fields */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            
            {/* Auto-filled Badge */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-3 text-xs space-y-1">
              <div className="font-bold text-indigo-900 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Form Pra-terisi Otomatis (Single Source of Truth)</span>
              </div>
              <p className="text-indigo-800 text-[11px]">
                Data identitas & judul TA diambil otomatis dari profil Anda sehingga tidak perlu input ulang.
              </p>
            </div>

            {/* Readonly Fields */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-semibold block text-[10px]">Nama Mahasiswa</span>
                <span className="font-bold text-slate-900">{currentUser.nama}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-semibold block text-[10px]">NIM & Kelas</span>
                <span className="font-bold text-slate-900">{currentUser.nim} ({currentUser.kelas})</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-500 font-semibold block text-[10px]">Judul TA Terkait (Disetujui)</span>
              <span className="font-bold text-slate-900 leading-snug">{myApprovedTitle.judul}</span>
            </div>

            {/* Date & Time Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Sidang</label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jam Mulai</label>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="08:00">08:00 WIB</option>
                  <option value="09:00">09:00 WIB</option>
                  <option value="10:00">10:00 WIB</option>
                  <option value="11:00">11:00 WIB</option>
                  <option value="13:00">13:00 WIB</option>
                  <option value="14:00">14:00 WIB</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jam Selesai</label>
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="10:00">10:00 WIB</option>
                  <option value="11:00">11:00 WIB</option>
                  <option value="12:00">12:00 WIB</option>
                  <option value="15:00">15:00 WIB</option>
                  <option value="16:00">16:00 WIB</option>
                </select>
              </div>
            </div>

            {/* Purpose Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Keperluan Peminjaman</label>
              <input
                type="text"
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Room Selection Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Ruangan Sidang</label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
              >
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} (Kapasitas {r.capacity} orang) - {r.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Anti-collision Alert */}
            {selectedRoomCollision.hasCollision && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-xs text-rose-800 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Slot ruangan ini telah terpakai/bentrok untuk jadwal lain.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={selectedRoomCollision.hasCollision}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                selectedRoomCollision.hasCollision
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-md'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Kirim Pengajuan Peminjaman Ruang</span>
            </button>

          </div>

          {/* Right: Room Priorities Recommendations */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Rekomendasi Ruangan Prodi MI</span>
                </h4>
              </div>
              <p className="text-[11px] text-slate-500">
                Diurutkan berdasarkan aturan prioritas ruangan yang dikonfigurasi prodi D3 MI.
              </p>

              <div className="space-y-2.5">
                {recommendations.map((rec, idx) => (
                  <div 
                    key={rec.room.id}
                    onClick={() => setSelectedRoomId(rec.room.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedRoomId === rec.room.id
                        ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        #{rec.priorityOrder} {rec.room.name}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rec.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {rec.isAvailable ? '✓ Slot Kosong' : '✕ Bentrok'}
                      </span>
                    </div>

                    <div className="mt-1 text-[11px] text-slate-500">
                      Kapasitas: {rec.room.capacity} orang • {rec.room.facilities.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </form>
      )}

    </div>
  );
}
