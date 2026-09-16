import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ListOrdered, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';

export default function PrioritasRuangPage() {
  const { roomPriorities, setRoomPriorities, rooms } = useAuth();

  const roomMap = new Map(rooms.map(r => [r.id, r]));

  const movePriority = (index, direction) => {
    const nextList = [...roomPriorities];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= nextList.length) return;

    const temp = nextList[index];
    nextList[index] = nextList[targetIndex];
    nextList[targetIndex] = temp;

    // Re-index priority order
    nextList.forEach((item, idx) => {
      item.priority_order = idx + 1;
    });

    setRoomPriorities(nextList);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <ListOrdered className="w-5 h-5 text-indigo-600" />
          <span>Konfigurasi Prioritas Ruangan Per Jurusan & Tahapan</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Admin Sarana dapat mengatur urutan rekomendasi ruangan otomatis secara dinamis tanpa hardcoding.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        
        <div className="bg-purple-50/70 border border-purple-200 rounded-lg p-3.5 text-xs text-purple-900 flex items-start space-x-2">
          <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Aturan Sistem Rekomendasi Ruangan:</span>
            <span>Saat mahasiswa memilih tanggal & jam, sistem akan mengecek ruangan sesuai urutan prioritas di bawah ini hingga menemukan slot kosong pertama.</span>
          </div>
        </div>

        <div className="space-y-2">
          {roomPriorities.map((prio, idx) => {
            const room = roomMap.get(prio.room_id);
            return (
              <div key={prio.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                    #{prio.priority_order}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{room?.name || prio.room_id}</div>
                    <div className="text-[11px] text-slate-500 capitalize">
                      Tahapan: {prio.stage_type.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    disabled={idx === 0}
                    onClick={() => movePriority(idx, 'up')}
                    className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="w-4 h-4 text-slate-700" />
                  </button>
                  <button
                    disabled={idx === roomPriorities.length - 1}
                    onClick={() => movePriority(idx, 'down')}
                    className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="w-4 h-4 text-slate-700" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
