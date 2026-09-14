import React, { useState } from 'react';
import { Clock, Calendar, Building2, CheckCircle2, XCircle, AlertCircle, Wrench } from 'lucide-react';

export default function RoomScheduleTimeline({ rooms = [], bookings = [], buildings = [], selectedDate, onDateChange }) {
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'
  ];

  const filteredRooms = selectedBuilding === 'ALL' 
    ? rooms 
    : rooms.filter(r => r.building_id === selectedBuilding);

  const getSlotStatus = (roomId, time) => {
    const room = rooms.find(r => r.id === roomId);
    if (room && room.status === 'maintenance') {
      return { type: 'maintenance', label: 'Maintenance', color: 'bg-slate-200 text-slate-600' };
    }

    const booking = bookings.find(b => {
      if (b.room_id !== roomId || b.booking_date !== selectedDate) return false;
      if (b.status === 'ditolak' || b.status === 'dibatalkan') return false;
      
      const startHour = parseInt(b.start_time.split(':')[0]);
      const endHour = parseInt(b.end_time.split(':')[0]);
      const slotHour = parseInt(time.split(':')[0]);
      
      return slotHour >= startHour && slotHour < endHour;
    });

    if (!booking) {
      return { type: 'tersedia', label: 'Tersedia', color: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' };
    }

    if (booking.status === 'disetujui') {
      return { 
        type: 'terpakai', 
        label: `Terpakai: ${booking.stage_label || booking.purpose}`, 
        color: 'bg-rose-100 text-rose-800 font-semibold' 
      };
    }

    return { 
      type: 'menunggu', 
      label: `Menunggu ACC: ${booking.stage_label || booking.purpose}`, 
      color: 'bg-amber-100 text-amber-800 font-semibold' 
    };
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
      
      {/* Timeline Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Matriks Jadwal Timeline Ruang Sidang</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Visibilitas ketersediaan ruangan real-time per jam</p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Date Picker */}
          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {/* Building Filter */}
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">Semua Gedung</option>
            {buildings.map(b => (
              <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend Indicators */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 pt-1">
        <span className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span>Tersedia</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-500"></span>
          <span>Terpakai (Disetujui)</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span>Menunggu Persetujuan</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-slate-400"></span>
          <span>Maintenance</span>
        </span>
      </div>

      {/* Timeline Matrix Grid */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
              <th className="py-3 px-4 border-r border-slate-200 w-48">Ruangan</th>
              {timeSlots.map(time => (
                <th key={time} className="py-3 px-2 text-center border-r border-slate-200">{time}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredRooms.map(room => (
              <tr key={room.id} className="hover:bg-slate-50/50">
                <td className="py-3 px-4 font-semibold text-slate-900 border-r border-slate-200">
                  <div className="text-xs">{room.name}</div>
                  <div className="text-[10px] text-slate-500 font-normal">Kap: {room.capacity} orang</div>
                </td>
                {timeSlots.map(time => {
                  const status = getSlotStatus(room.id, time);
                  return (
                    <td key={time} className="p-1 border-r border-slate-100">
                      <div 
                        title={status.label}
                        className={`h-9 rounded-md text-[10px] flex items-center justify-center p-1 text-center transition-all cursor-pointer ${status.color}`}
                      >
                        {status.type === 'tersedia' && 'Kosong'}
                        {status.type === 'terpakai' && 'Booked'}
                        {status.type === 'menunggu' && 'Pending'}
                        {status.type === 'maintenance' && <Wrench className="w-3.5 h-3.5" />}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
