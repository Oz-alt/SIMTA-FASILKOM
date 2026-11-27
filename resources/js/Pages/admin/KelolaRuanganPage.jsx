import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  Building2, 
  Plus, 
  Wrench, 
  CheckCircle2, 
  XCircle, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  AlertCircle
} from 'lucide-react';

export default function KelolaRuanganPage() {
  const { 
    rooms, 
    setRooms, 
    buildings = [], 
    bookings = [], 
    defenseSchedules = [],
    addRoom,
    updateRoom,
    deleteRoom
  } = useAuth();

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [deletingRoom, setDeletingRoom] = useState(null);

  // Form states for Add
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [capacity, setCapacity] = useState(25);
  const [buildingId, setBuildingId] = useState('');
  const [facilities, setFacilities] = useState('AC, Proyektor, Whiteboard');
  const [status, setStatus] = useState('aktif');
  const [formError, setFormError] = useState('');

  // Form states for Edit
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editCapacity, setEditCapacity] = useState(25);
  const [editBuildingId, setEditBuildingId] = useState('');
  const [editFacilities, setEditFacilities] = useState('');
  const [editStatus, setEditStatus] = useState('aktif');
  const [editError, setEditError] = useState('');

  // Lock background scroll when modal is open
  useEffect(() => {
    const isOpen = showAddModal || Boolean(editingRoom) || Boolean(deletingRoom);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddModal, editingRoom, deletingRoom]);

  // Set default building
  useEffect(() => {
    if (buildings.length > 0 && !buildingId) {
      setBuildingId(buildings[0].id);
    }
  }, [buildings]);

  // Open Edit Modal
  const openEditModal = (room) => {
    setEditingRoom(room);
    setEditName(room.name || '');
    setEditCode(room.code || '');
    setEditCapacity(room.capacity || 20);
    setEditBuildingId(room.building_id || buildings[0]?.id || '');
    setEditFacilities(Array.isArray(room.facilities) ? room.facilities.join(', ') : (room.facilities || ''));
    setEditStatus(room.status || 'aktif');
    setEditError('');
  };

  // Toggle Maintenance Mode
  const toggleRoomStatus = (roomId) => {
    const target = rooms.find(r => r.id === roomId);
    if (!target) return;
    const nextStatus = target.status === 'aktif' ? 'maintenance' : 'aktif';
    if (typeof updateRoom === 'function') {
      updateRoom(roomId, { status: nextStatus });
    } else {
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: nextStatus } : r));
    }
  };

  // Handle Add Room Submit
  const handleAddRoom = (e) => {
    e.preventDefault();
    setFormError('');

    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();
    const capNum = parseInt(capacity, 10);

    if (!cleanName) {
      setFormError('Nama ruangan tidak boleh kosong.');
      return;
    }
    if (!cleanCode) {
      setFormError('Kode ruangan tidak boleh kosong.');
      return;
    }
    if (isNaN(capNum) || capNum <= 0) {
      setFormError('Kapasitas harus berupa angka positif.');
      return;
    }
    if (rooms.some(r => String(r.code || '').trim().toUpperCase() === cleanCode || String(r.name || '').trim().toLowerCase() === cleanName.toLowerCase())) {
      setFormError(`Kode ruangan "${cleanCode}" atau nama ruangan "${cleanName}" sudah digunakan oleh ruangan lain.`);
      return;
    }

    const facArray = facilities
      .split(',')
      .map(f => f.trim())
      .filter(Boolean);

    const newRoomData = {
      id: `room-${Date.now()}`,
      building_id: buildingId || buildings[0]?.id || 'bld-diklat',
      name: cleanName,
      code: cleanCode,
      capacity: capNum,
      facilities: facArray.length > 0 ? facArray : ['AC', 'Proyektor', 'Whiteboard'],
      status: status || 'aktif'
    };

    if (typeof addRoom === 'function') {
      addRoom(newRoomData);
    } else {
      setRooms(prev => [...prev, newRoomData]);
    }

    setShowAddModal(false);
    setName('');
    setCode('');
    setCapacity(25);
    setFacilities('AC, Proyektor, Whiteboard');
  };

  // Handle Edit Room Submit
  const handleUpdateRoom = (e) => {
    e.preventDefault();
    setEditError('');

    if (!editingRoom) return;

    const cleanName = editName.trim();
    const cleanCode = editCode.trim().toUpperCase();
    const capNum = parseInt(editCapacity, 10);

    if (!cleanName) {
      setEditError('Nama ruangan tidak boleh kosong.');
      return;
    }
    if (!cleanCode) {
      setEditError('Kode ruangan tidak boleh kosong.');
      return;
    }
    if (isNaN(capNum) || capNum <= 0) {
      setEditError('Kapasitas harus berupa angka positif.');
      return;
    }
    if (rooms.some(r => r.id !== editingRoom.id && r.code.toUpperCase() === cleanCode)) {
      setEditError(`Kode ruangan "${cleanCode}" sudah digunakan oleh ruangan lain.`);
      return;
    }

    const facArray = editFacilities
      .split(',')
      .map(f => f.trim())
      .filter(Boolean);

    const updatedFields = {
      name: cleanName,
      code: cleanCode,
      capacity: capNum,
      building_id: editBuildingId || editingRoom.building_id,
      facilities: facArray.length > 0 ? facArray : editingRoom.facilities,
      status: editStatus
    };

    if (typeof updateRoom === 'function') {
      updateRoom(editingRoom.id, updatedFields);
    } else {
      setRooms(prev => prev.map(r => r.id === editingRoom.id ? { ...r, ...updatedFields } : r));
    }

    setEditingRoom(null);
  };

  // Check active room usage for deletion
  const checkRoomUsage = (room) => {
    if (!room) return { hasUsage: false, count: 0, details: [] };

    const activeBookings = (bookings || []).filter(b => 
      (b.room_id === room.id || (b.room_name && b.room_name.toLowerCase() === room.name.toLowerCase())) &&
      (b.status === 'disetujui' || b.status === 'menunggu')
    );

    const activeDefenses = (defenseSchedules || []).filter(d => 
      (d.room_id === room.id || (d.room_name && d.room_name.toLowerCase() === room.name.toLowerCase()))
    );

    const total = activeBookings.length + activeDefenses.length;
    return {
      hasUsage: total > 0,
      count: total,
      bookingsCount: activeBookings.length,
      defensesCount: activeDefenses.length
    };
  };

  // Handle Delete Room Action
  const handleDeleteRoom = () => {
    if (!deletingRoom) return;

    if (typeof deleteRoom === 'function') {
      deleteRoom(deletingRoom.id);
    } else {
      setRooms(prev => prev.filter(r => r.id !== deletingRoom.id));
    }
    setDeletingRoom(null);
  };

  // Handle Deactivate Alternative
  const handleDeactivateInstead = () => {
    if (!deletingRoom) return;

    if (typeof updateRoom === 'function') {
      updateRoom(deletingRoom.id, { status: 'nonaktif' });
    } else {
      setRooms(prev => prev.map(r => r.id === deletingRoom.id ? { ...r, status: 'nonaktif' } : r));
    }
    setDeletingRoom(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span>Manajemen Ruangan &amp; Gedung Sidang</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data master fisik ruangan, kapasitas, fasilitas, dan status operasional sidang.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError('');
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Ruangan Baru</span>
        </button>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rooms.map(r => {
          const building = buildings.find(b => b.id === r.building_id);
          const usage = checkRoomUsage(r);

          return (
            <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 block uppercase font-bold tracking-wider">{r.code}</span>
                    <h3 className="text-sm font-bold text-slate-900">{r.name}</h3>
                    {building && (
                      <span className="text-[11px] text-indigo-600 font-medium">{building.name}</span>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                    r.status === 'aktif' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : r.status === 'maintenance'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {r.status}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div><span className="font-semibold text-slate-500">Kapasitas:</span> {r.capacity} Orang</div>
                  <div>
                    <span className="font-semibold text-slate-500">Fasilitas:</span>{' '}
                    {Array.isArray(r.facilities) ? r.facilities.join(', ') : r.facilities}
                  </div>
                  {usage.hasUsage && (
                    <div className="text-[11px] text-blue-600 font-semibold pt-1">
                      ℹ️ Digunakan dalam {usage.count} jadwal aktif
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => openEditModal(r)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-600 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
                    title="Edit Ruangan"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setDeletingRoom(r)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-rose-600 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
                    title="Hapus Ruangan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>

                <button
                  onClick={() => toggleRoomStatus(r.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                    r.status === 'aktif'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{r.status === 'aktif' ? 'Maintenance' : 'Set Aktif'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── MODAL TAMBAH RUANGAN ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto overscroll-contain animate-in fade-in">
          <form onSubmit={handleAddRoom} className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Tambah Ruangan Sidang Baru</h3>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Ruangan *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Ruang Sidang MI"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kode Ruangan *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="RS-MI"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kapasitas (Orang) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {buildings.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gedung / Lokasi</label>
                <select
                  value={buildingId}
                  onChange={(e) => setBuildingId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {buildings.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Fasilitas (Pisahkan dengan koma)</label>
              <input
                type="text"
                value={facilities}
                onChange={(e) => setFacilities(e.target.value)}
                placeholder="AC, Proyektor, Whiteboard, Sound System"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status Operasional</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="aktif">Aktif (Siap Pakai)</option>
                <option value="maintenance">Maintenance (Perbaikan)</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md cursor-pointer"
              >
                Simpan Ruangan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL EDIT RUANGAN ── */}
      {editingRoom && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto overscroll-contain animate-in fade-in">
          <form onSubmit={handleUpdateRoom} className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Data Ruangan Sidang</h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {editingRoom.id}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingRoom(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{editError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Ruangan *</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Contoh: Ruang Sidang MI"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kode Ruangan *</label>
                <input
                  type="text"
                  required
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  placeholder="RS-MI"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kapasitas (Orang) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {buildings.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gedung / Lokasi</label>
                <select
                  value={editBuildingId}
                  onChange={(e) => setEditBuildingId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {buildings.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Fasilitas (Pisahkan dengan koma)</label>
              <input
                type="text"
                value={editFacilities}
                onChange={(e) => setEditFacilities(e.target.value)}
                placeholder="AC, Proyektor, Whiteboard"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status Ruangan</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="aktif">Aktif (Siap Digunakan)</option>
                <option value="maintenance">Maintenance (Perbaikan / Servis)</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingRoom(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md cursor-pointer"
              >
                Perbarui Ruangan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL HAPUS RUANGAN DENGAN PEMERIKSAAN KETERIKATAN DATA ── */}
      {deletingRoom && (() => {
        const usage = checkRoomUsage(deletingRoom);

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto overscroll-contain animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center space-x-3 text-rose-600">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Ruangan</h3>
                  <p className="text-xs text-slate-500">{deletingRoom.name} ({deletingRoom.code})</p>
                </div>
              </div>

              {usage.hasUsage ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                    <span className="font-bold flex items-center space-x-1.5 text-amber-950">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Ruangan Masih Memiliki Jadwal Aktif!</span>
                    </span>
                    <p className="text-[12px] text-amber-800 leading-relaxed">
                      Ruangan ini saat ini terikat dengan <strong>{usage.count} jadwal aktif</strong> ({usage.bookingsCount} peminjaman ruangan dan {usage.defensesCount} jadwal sidang).
                    </p>
                    <p className="text-[11px] text-amber-900 font-semibold pt-1">
                      Demi integritas data akademik, ruangan yang masih memiliki jadwal aktif <u>TIDAK DAPAT DIHAPUS PERMANEN</u>. Anda disarankan untuk <strong>menonaktifkan ruangan</strong> saja agar tidak dapat dipilih pada peminjaman baru.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleDeactivateInstead}
                      className="w-full sm:w-auto flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer text-center"
                    >
                      Nonaktifkan Ruangan Saja
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingRoom(null)}
                      className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Apakah Anda yakin ingin menghapus ruangan <strong className="text-slate-900">{deletingRoom.name} ({deletingRoom.code})</strong>? Data master ruangan ini akan dihapus dari sistem.
                  </p>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeletingRoom(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteRoom}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Permanen</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

    </div>
  );
}
