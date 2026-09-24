import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  UserCheck, 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  CheckCircle2, 
  Mail, 
  Phone, 
  BookOpen, 
  Tag,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function MasterDosenPage() {
  const { 
    advisors, 
    addAdvisor, 
    updateAdvisor, 
    deleteAdvisor 
  } = useAuth();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [dosenStatusFilter, setDosenStatusFilter] = useState('ALL');

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDosen, setEditingDosen] = useState(null);
  const [deletingDosen, setDeletingDosen] = useState(null);

  // Form State
  const [dosenForm, setDosenForm] = useState({
    nip: '',
    nama: '',
    email: '',
    no_hp: '',
    prodi: 'D3 Manajemen Informatika',
    jabatan_fungsional: 'Asisten Ahli',
    keahlian: '',
    kuota_dospem1: 8,
    kuota_dospem2: 8,
    status: 'aktif'
  });

  // Toast Notification
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Filtered Dosen List
  const filteredAdvisors = useMemo(() => {
    return advisors.filter(adv => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        adv.nip?.toLowerCase().includes(q) ||
        adv.nama?.toLowerCase().includes(q) ||
        adv.email?.toLowerCase().includes(q) ||
        adv.jabatan_fungsional?.toLowerCase().includes(q) ||
        (Array.isArray(adv.keahlian) && adv.keahlian.some(k => k.toLowerCase().includes(q)));

      const matchStatus = dosenStatusFilter === 'ALL' || adv.status === dosenStatusFilter;
      return matchQuery && matchStatus;
    });
  }, [advisors, searchQuery, dosenStatusFilter]);

  // Handle Save Dosen (Add / Edit)
  const handleSaveDosen = (e) => {
    e.preventDefault();
    if (!dosenForm.nip || !dosenForm.nama) {
      showToast('NIP dan Nama Dosen wajib diisi!');
      return;
    }

    if (editingDosen) {
      updateAdvisor(editingDosen.id, dosenForm);
      showToast(`Berhasil memperbarui data dosen ${dosenForm.nama}`);
      setEditingDosen(null);
    } else {
      addAdvisor(dosenForm);
      showToast(`Berhasil menambahkan dosen baru ${dosenForm.nama}`);
      setIsAddOpen(false);
    }

    // Reset Form
    setDosenForm({
      nip: '',
      nama: '',
      email: '',
      no_hp: '',
      prodi: 'D3 Manajemen Informatika',
      jabatan_fungsional: 'Asisten Ahli',
      keahlian: '',
      kuota_dospem1: 8,
      kuota_dospem2: 8,
      status: 'aktif'
    });
  };

  // Handle Delete Dosen
  const handleDeleteDosen = () => {
    if (!deletingDosen) return;
    deleteAdvisor(deletingDosen.id);
    showToast(`Dosen ${deletingDosen.nama} telah dihapus.`);
    setDeletingDosen(null);
  };

  // Open Edit Modal
  const openEditModal = (dosen) => {
    setEditingDosen(dosen);
    setDosenForm({
      nip: dosen.nip || '',
      nama: dosen.nama || '',
      email: dosen.email || '',
      no_hp: dosen.no_hp || '',
      prodi: dosen.prodi || 'D3 Manajemen Informatika',
      jabatan_fungsional: dosen.jabatan_fungsional || 'Asisten Ahli',
      keahlian: Array.isArray(dosen.keahlian) ? dosen.keahlian.join(', ') : (dosen.keahlian || ''),
      kuota_dospem1: dosen.kuota_dospem1 || 8,
      kuota_dospem2: dosen.kuota_dospem2 || 8,
      status: dosen.status || 'aktif'
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 select-none pb-12">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
            <UserCheck className="w-4 h-4" />
            <span>Master Data Dosen Pembimbing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Kelola Master Data Dosen
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Pusat pendataan dosen pembimbing Tugas Akhir FASILKOM UNSRI. Kelola NIP, keahlian riset, serta alokasi kuota bimbingan Dospem 1 &amp; Dospem 2.
          </p>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Total Dosen</p>
            <p className="text-2xl font-black text-slate-900">{advisors.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Dosen Aktif</p>
            <p className="text-2xl font-black text-slate-900">
              {advisors.filter(a => String(a.status || 'aktif').toLowerCase() === 'aktif').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Total Kuota Bimbingan</p>
            <p className="text-2xl font-black text-slate-900">
              {advisors.reduce((acc, a) => acc + (a.kuota_dospem1 || 8) + (a.kuota_dospem2 || 8), 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Action Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          {/* Search Bar & Status Filter */}
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Cari NIP, Nama Dosen, Email, Bidang Keahlian..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
              />
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={dosenStatusFilter}
                onChange={(e) => setDosenStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL">Semua Status Dosen</option>
                <option value="aktif">Status Aktif</option>
                <option value="non-aktif">Status Non-Aktif / Cuti</option>
              </select>
            </div>
          </div>

          {/* Add Button */}
          <button
            type="button"
            onClick={() => {
              setDosenForm({
                nip: '',
                nama: '',
                email: '',
                no_hp: '',
                prodi: 'D3 Manajemen Informatika',
                jabatan_fungsional: 'Asisten Ahli',
                keahlian: '',
                kuota_dospem1: 8,
                kuota_dospem2: 8,
                status: 'aktif'
              });
              setIsAddOpen(true);
            }}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Dosen</span>
          </button>

        </div>

        {/* Table View */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider">
                <th className="py-3.5 px-4">NIP / Kode</th>
                <th className="py-3.5 px-4">Nama Dosen &amp; Gelar</th>
                <th className="py-3.5 px-4">Jabatan Fungsional</th>
                <th className="py-3.5 px-4">Kontak / Email</th>
                <th className="py-3.5 px-4">Bidang Keahlian</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredAdvisors.length > 0 ? (
                filteredAdvisors.map((adv) => (
                  <tr key={adv.id || adv.nip} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {adv.nip}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{adv.nama}</p>
                      <p className="text-[11px] text-slate-600">{adv.prodi || 'D3 Manajemen Informatika'}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                        {adv.jabatan_fungsional || 'Asisten Ahli'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="flex items-center space-x-1.5 text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{adv.email || '-'}</span>
                      </div>
                      {adv.no_hp && (
                        <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{adv.no_hp}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {Array.isArray(adv.keahlian) ? (
                          adv.keahlian.map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-semibold border border-indigo-100">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-semibold border border-indigo-100">
                            {adv.keahlian || 'Umum'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {(() => {
                        const s = String(adv.status || 'aktif').toLowerCase().trim();
                        const isAktif = s === 'aktif';
                        return (
                          <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            isAktif
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isAktif ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className="capitalize">{adv.status || 'Aktif'}</span>
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(adv)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Edit Data Dosen"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingDosen(adv)}
                          className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Hapus Data Dosen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <p className="text-sm font-semibold">Tidak ada data dosen ditemukan.</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter status dosen.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal Tambah / Edit Dosen */}
      {(isAddOpen || editingDosen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  {editingDosen ? 'Edit Data Dosen' : 'Tambah Dosen Pembimbing Baru'}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => { setIsAddOpen(false); setEditingDosen(null); }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDosen} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">NIP Dosen <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    disabled={!!editingDosen}
                    placeholder="Contoh: 197805122005011002"
                    value={dosenForm.nip}
                    onChange={(e) => setDosenForm({ ...dosenForm, nip: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status Keaktifan</label>
                  <select
                    value={dosenForm.status}
                    onChange={(e) => setDosenForm({ ...dosenForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="non-aktif">Non-Aktif / Cuti</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Lengkap &amp; Gelar <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dr. Ir. Hendra Kusuma, M.T."
                  value={dosenForm.nama}
                  onChange={(e) => setDosenForm({ ...dosenForm, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Jabatan Fungsional Akademik</label>
                <select
                  value={dosenForm.jabatan_fungsional}
                  onChange={(e) => setDosenForm({ ...dosenForm, jabatan_fungsional: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                >
                  <option value="Tenaga Pengajar">Tenaga Pengajar</option>
                  <option value="Asisten Ahli">Asisten Ahli</option>
                  <option value="Lektor">Lektor</option>
                  <option value="Lektor Kepala">Lektor Kepala</option>
                  <option value="Guru Besar">Guru Besar / Profesor</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Resmi UNSRI</label>
                  <input
                    type="email"
                    placeholder="dosen@unsri.ac.id"
                    value={dosenForm.email}
                    onChange={(e) => setDosenForm({ ...dosenForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">No HP / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={dosenForm.no_hp}
                    onChange={(e) => setDosenForm({ ...dosenForm, no_hp: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Bidang Keahlian / Riset (Pisahkan koma)</label>
                <input
                  type="text"
                  placeholder="Kecerdasan Buatan, Data Mining, Web System"
                  value={dosenForm.keahlian}
                  onChange={(e) => setDosenForm({ ...dosenForm, keahlian: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Kuota Maks Dospem 1</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={dosenForm.kuota_dospem1}
                    onChange={(e) => setDosenForm({ ...dosenForm, kuota_dospem1: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Kuota Maks Dospem 2</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={dosenForm.kuota_dospem2}
                    onChange={(e) => setDosenForm({ ...dosenForm, kuota_dospem2: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsAddOpen(false); setEditingDosen(null); }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Data Dosen</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Dosen */}
      {deletingDosen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Hapus Data Dosen?</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              Apakah Anda yakin ingin menghapus dosen <strong className="text-slate-900">{deletingDosen.nama}</strong> (NIP: {deletingDosen.nip})?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDosen(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteDosen}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
