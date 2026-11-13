import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import RoomScheduleTimeline from '../../Components/common/RoomScheduleTimeline.jsx';

const getTodayDateString = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function JadwalRuangPage() {
  const { rooms, bookings, buildings } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayDateString);

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
