import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import RoomScheduleTimeline from '../../components/common/RoomScheduleTimeline.jsx';

export default function JadwalRuangPage() {
  const { rooms, bookings, buildings } = useAuth();
  const [selectedDate, setSelectedDate] = useState('2026-09-12');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Jadwal & Ketersediaan Ruang Sidang</h1>
        <p className="text-xs text-slate-500 mt-1">
          Cek ketersediaan ruangan real-time sebelum mengajukan peminjaman ruang untuk seminar/sidang.
        </p>
      </div>

      <RoomScheduleTimeline 
        rooms={rooms}
        bookings={bookings}
        buildings={buildings}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />
    </div>
  );
}
