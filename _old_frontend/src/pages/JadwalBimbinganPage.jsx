import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  MessageSquare, 
  ExternalLink, 
  Search, 
  UserCheck, 
  Edit3, 
  X, 
  CheckCircle2, 
  Info,
  Building2,
  Users
} from 'lucide-react';

export default function JadwalBimbinganPage() {
  const { currentUser, advisorSchedules, updateAdvisorSchedule } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    dosen_nip: '',
    dosen_nama: '',
    peran: '',
    hari_bimbingan: '',
    jam_bimbingan: '',
    lokasi: '',
    link_wa_group: '',
    no_hp_wa: '',
    catatan: ''
  });
  const [toastMessage, setToastMessage] = useState('');

  const isDosenOrKaprodi = currentUser?.role === 'kaprodi' || currentUser?.role === 'admin_sarana';

  // Filter schedules by search term
  const filteredSchedules = advisorSchedules.filter(sch => 
    sch.dosen_nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sch.dosen_nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sch.lokasi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Identify student's primary advisors (Dr. Ir. Hendra Kusuma & Siti Nurhaliza for demo)
  const myAdvisorNames = ['Dr. Ir. Hendra Kusuma, M.T.', 'Siti Nurhaliza, S.Kom., M.Kom.'];
  const myAdvisors = advisorSchedules.filter(sch => 
    myAdvisorNames.some(name => sch.dosen_nama.toLowerCase().includes(name.toLowerCase()))
  );

  const handleOpenEdit = (schedule) => {
    if (schedule) {
      setEditForm({ ...schedule });
    } else {
      setEditForm({
        id: `adv-sch-${Date.now()}`,
        dosen_nip: currentUser?.nip || '197805122005011002',
        dosen_nama: currentUser?.nama || 'Dr. Ir. Hendra Kusuma, M.T.',
        peran: 'Pembimbing Utama',
        hari_bimbingan: 'Senin & Rabu',
        jam_bimbingan: '09:00 - 12:00 WIB',
        lokasi: 'Ruang Dosen Gedung DIPKOM Lt. 2',
        link_wa_group: 'https://chat.whatsapp.com/ExAmPlELiNk123',
        no_hp_wa: currentUser?.no_hp || '081278901234',
        catatan: 'Wajib konfirmasi H-1 sebelum bimbingan offline.'
      });
    }
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    await updateAdvisorSchedule(editForm);
    setIsEditModalOpen(false);
    setToastMessage('Jadwal & Link Grup WA Bimbingan berhasil diperbarui!');
    setTimeout(() => setToastMessage(''), 4000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center space-x-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-500/30">
            <CalendarDays className="w-4 h-4" />
            <span>Jadwal & Akses Komunikasi Dosen</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Jadwal Bimbingan Offline & Grup WA</h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Informasi lengkap hari, jam, dan lokasi bimbingan tatap muka dosen pembimbing. Gabung langsung ke <strong>Grup WhatsApp Bimbingan</strong> resmi dosen untuk informasi koordinasi revisi.
          </p>

          {isDosenOrKaprodi && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  const mySch = advisorSchedules.find(s => s.dosen_nama.includes(currentUser?.nama) || s.dosen_nip === currentUser?.nip);
                  handleOpenEdit(mySch);
                }}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Kelola Jadwal & Link WA Saya</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 1: Mahasiswa's Designated Advisors (If student) */}
      {!isDosenOrKaprodi && myAdvisors.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Dosen Pembimbing Anda</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myAdvisors.map((sch) => (
              <div 
                key={sch.id} 
                className="bg-white rounded-2xl border-2 border-emerald-100 p-6 shadow-md hover:shadow-lg transition-all relative overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                  {sch.peran || 'Dosen Pembimbing'}
                </div>

                <div>
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 font-bold text-base flex items-center justify-center shrink-0 border border-emerald-200">
                      {sch.dosen_nama.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug">{sch.dosen_nama}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">NIP. {sch.dosen_nip}</p>
                    </div>
                  </div>

                  <div className="space-y-3 bg-slate-50/80 rounded-xl p-4 border border-slate-100 text-xs">
                    <div className="flex items-center text-slate-700 font-medium">
                      <CalendarDays className="w-4 h-4 text-emerald-600 mr-2.5 shrink-0" />
                      <span className="text-slate-500 w-24 shrink-0">Hari Layanan:</span>
                      <span className="font-bold text-slate-900">{sch.hari_bimbingan}</span>
                    </div>

                    <div className="flex items-center text-slate-700 font-medium">
                      <Clock className="w-4 h-4 text-emerald-600 mr-2.5 shrink-0" />
                      <span className="text-slate-500 w-24 shrink-0">Jam Bimbingan:</span>
                      <span className="font-bold text-slate-900">{sch.jam_bimbingan}</span>
                    </div>

                    <div className="flex items-start text-slate-700 font-medium">
                      <MapPin className="w-4 h-4 text-emerald-600 mr-2.5 mt-0.5 shrink-0" />
                      <span className="text-slate-500 w-24 shrink-0">Lokasi Offline:</span>
                      <span className="font-bold text-slate-900">{sch.lokasi}</span>
                    </div>

                    {sch.catatan && (
                      <div className="pt-2 border-t border-slate-200/60 text-slate-600 italic text-[11px] leading-relaxed">
                        <Info className="w-3.5 h-3.5 text-slate-400 inline mr-1 -mt-0.5" />
                        "{sch.catatan}"
                      </div>
                    )}
                  </div>
                </div>

                {/* WhatsApp Group Link Button */}
                <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                  {sch.link_wa_group ? (
                    <a
                      href={sch.link_wa_group}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm group cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>Gabung Grup WA Bimbingan</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>
                  ) : (
                    <button 
                      disabled 
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs text-center cursor-not-allowed"
                    >
                      Link Grup WA Belum Diunggah Dosen
                    </button>
                  )}

                  {sch.no_hp_wa && (
                    <a
                      href={`https://wa.me/${sch.no_hp_wa.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all cursor-pointer"
                    >
                      <span>Chat Dosen via Personal WA</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: Master Directory of All Lecturers */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Direktori Jadwal & Dosen FASILKOM</h2>
            <p className="text-xs text-slate-500">Cari jadwal bimbingan offline seluruh dosen pengajar dan penguji</p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari dosen / NIP / lokasi..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchedules.map((sch) => (
            <div 
              key={sch.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {sch.peran || 'Dosen Fasilkom'}
                  </span>
                  {isDosenOrKaprodi && (
                    <button
                      onClick={() => handleOpenEdit(sch)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Jadwal"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug">{sch.dosen_nama}</h3>
                <p className="text-[11px] text-slate-400 font-medium mb-4">NIP. {sch.dosen_nip}</p>

                <div className="space-y-2 text-xs text-slate-600 bg-slate-50/60 p-3 rounded-xl">
                  <div className="flex items-center">
                    <CalendarDays className="w-3.5 h-3.5 text-emerald-600 mr-2 shrink-0" />
                    <span className="font-semibold text-slate-800">{sch.hari_bimbingan}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 mr-2 shrink-0" />
                    <span>{sch.jam_bimbingan}</span>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 mr-2 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{sch.lokasi}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                {sch.link_wa_group ? (
                  <a
                    href={sch.link_wa_group}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Grup WA Bimbingan</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400 block text-center italic">Link WA belum di-upload</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL EDIT JADWAL & LINK WA (DOSEN / KAPRODI) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Kelola Jadwal & Link WA Bimbingan</h3>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Dosen</label>
                <input
                  type="text"
                  required
                  value={editForm.dosen_nama}
                  onChange={(e) => setEditForm({ ...editForm, dosen_nama: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">NIP Dosen</label>
                  <input
                    type="text"
                    required
                    value={editForm.dosen_nip}
                    onChange={(e) => setEditForm({ ...editForm, dosen_nip: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hari Bimbingan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Senin & Rabu"
                    value={editForm.hari_bimbingan}
                    onChange={(e) => setEditForm({ ...editForm, hari_bimbingan: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Layanan Bimbingan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 09:00 - 12:00 WIB"
                    value={editForm.jam_bimbingan}
                    onChange={(e) => setEditForm({ ...editForm, jam_bimbingan: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. WA Personal (Opsional)</label>
                  <input
                    type="text"
                    placeholder="0812xxxxxxxx"
                    value={editForm.no_hp_wa}
                    onChange={(e) => setEditForm({ ...editForm, no_hp_wa: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi Ruangan Offline</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ruang Dosen Gedung DIPKOM Lt. 2 (Ruang 204)"
                  value={editForm.lokasi}
                  onChange={(e) => setEditForm({ ...editForm, lokasi: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-800 mb-1">Link Grup WhatsApp Bimbingan</label>
                <input
                  type="url"
                  placeholder="https://chat.whatsapp.com/..."
                  value={editForm.link_wa_group}
                  onChange={(e) => setEditForm({ ...editForm, link_wa_group: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-emerald-50/50 border border-emerald-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">Salin link udangan grup WhatsApp dari aplikasi WhatsApp Dosen.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan / Ketentuan untuk Mahasiswa</label>
                <textarea
                  rows="2"
                  placeholder="Contoh: Konfirmasi H-1, cetak draf revisi sebelum hadir."
                  value={editForm.catatan}
                  onChange={(e) => setEditForm({ ...editForm, catatan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
