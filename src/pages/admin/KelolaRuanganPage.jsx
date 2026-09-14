import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Building2, Plus, Wrench, CheckCircle2, XCircle } from 'lucide-react';

export default function KelolaRuanganPage() {
  const { rooms, setRooms, buildings } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [capacity, setCapacity] = useState(25);
  const [buildingId, setBuildingId] = useState(buildings[0]?.id || '');

  const toggleRoomStatus = (roomId) => {
    setRooms(prev => prev.map(r => {
      if (r.id === roomId) {
        const nextStatus = r.status === 'aktif' ? 'maintenance' : 'aktif';
        return { ...r, status: nextStatus };
      }
      return r;
    }));
  };

  const handleAddRoom = (e) => {
    e.preventDefault();
    const newRoom = {
      id: `room-${Date.now()}`,
      building_id: buildingId,
      name,
      code,
      capacity: parseInt(capacity),
      facilities: ['AC', 'Proyektor', 'Whiteboard'],
      status: 'aktif'
    };
    setRooms(prev => [...prev, newRoom]);
    setShowModal(false);
    setName('');
    setCode('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span>Manajemen Ruangan & Gedung Sidang</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data master fisik ruangan, kapasitas, dan status perbaikan / maintenance.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Ruangan Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rooms.map(r => (
          <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] text-slate-400 block">{r.code}</span>
                <h3 className="text-sm font-bold text-slate-900">{r.name}</h3>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                r.status === 'aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {r.status}
              </span>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div><span className="font-semibold text-slate-500">Kapasitas:</span> {r.capacity} Orang</div>
              <div><span className="font-semibold text-slate-500">Fasilitas:</span> {r.facilities.join(', ')}</div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => toggleRoomStatus(r.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  r.status === 'aktif'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>{r.status === 'aktif' ? 'Set Mode Maintenance' : 'Set Mode Aktif'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Room Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <form onSubmit={handleAddRoom} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Tambah Ruangan Sidang Baru</h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Ruangan</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Ruangan Sidang Diklat C"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kode Ruangan</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Contoh: RS-DIKLAT-C"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kapasitas (Orang)</label>
              <input
                type="number"
                required
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md"
              >
                Simpan Ruangan
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
