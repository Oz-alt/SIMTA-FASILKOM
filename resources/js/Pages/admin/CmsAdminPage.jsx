import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LayoutGrid, Plus, Search, Eye, Pencil, Trash2, X, Filter, Globe, FileText
} from 'lucide-react';

const KATEGORI_OPTIONS = ['Beranda', 'Panduan', 'Pengumuman', 'Informasi', 'FAQ'];
const STATUS_OPTIONS   = ['publikasi', 'draf'];

function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

const emptyForm = { judul: '', kategori: KATEGORI_OPTIONS[0], isi: '', status: 'draf' };

export default function CmsAdminPage() {
  const { adminCmsContents, addAdminCms, updateAdminCms, deleteAdminCms } = useAuth();

  const [search, setSearch]             = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalForm, setModalForm]       = useState(false);
  const [modalPreview, setModalPreview] = useState(null);
  const [modalDelete, setModalDelete]   = useState(null);
  const [editTarget, setEditTarget]     = useState(null);
  const [form, setForm]                 = useState(emptyForm);

  const filtered = adminCmsContents.filter(c => {
    const matchSearch    = !search || c.judul.toLowerCase().includes(search.toLowerCase()) || c.kategori.toLowerCase().includes(search.toLowerCase());
    const matchKategori  = !filterKategori || c.kategori === filterKategori;
    const matchStatus    = !filterStatus   || c.status === filterStatus;
    return matchSearch && matchKategori && matchStatus;
  });

  const openAdd  = () => { setEditTarget(null); setForm(emptyForm); setModalForm(true); };
  const openEdit = (item) => { setEditTarget(item); setForm({ judul: item.judul, kategori: item.kategori, isi: item.isi, status: item.status }); setModalForm(true); };
  const closeForm = () => { setModalForm(false); setEditTarget(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editTarget) updateAdminCms(editTarget.id, form);
    else addAdminCms(form);
    closeForm();
  };

  const toggleStatus = (item) => {
    updateAdminCms(item.id, { status: item.status === 'publikasi' ? 'draf' : 'publikasi' });
  };

  const statusBadge = (status) => (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status === 'publikasi' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
      {status}
    </span>
  );

  const kategoriBadge = (kategori) => {
    const colors = { Beranda: 'bg-blue-50 text-blue-700', Panduan: 'bg-indigo-50 text-indigo-700', Pengumuman: 'bg-rose-50 text-rose-700', Informasi: 'bg-teal-50 text-teal-700', FAQ: 'bg-amber-50 text-amber-700' };
    const cls = colors[kategori] || 'bg-slate-50 text-slate-700';
    return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border border-transparent ${cls}`}>{kategori}</span>;
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    return iso.split('T')[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-xs font-semibold backdrop-blur-sm mb-3 border border-purple-400/20">
          <LayoutGrid className="w-3 h-3" />
          <span>Admin SIMTA</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Content Management System (CMS)</h1>
        <p className="text-sm text-purple-100/90 mt-1 max-w-xl leading-relaxed">
          Kelola konten yang ditampilkan pada halaman-halaman sistem SIMTA. Atur status publikasi dan preview sebelum dipublikasikan.
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2.5 flex-1 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari judul / kategori konten..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <select value={filterKategori} onChange={e => setFilterKategori(e.target.value)}
              className="pl-8 pr-6 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white appearance-none">
              <option value="">Semua Kategori</option>
              {KATEGORI_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="pl-8 pr-6 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white appearance-none">
              <option value="">Semua Status</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <button onClick={openAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 transition-colors shadow-sm whitespace-nowrap">
          <Plus className="w-3.5 h-3.5" /><span>+ Tambah Konten</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-700 flex items-center space-x-2">
            <LayoutGrid className="w-3.5 h-3.5 text-purple-600" />
            <span>Daftar Konten CMS ({filtered.length})</span>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Judul</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 hidden sm:table-cell">Terakhir Diperbarui</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-slate-400 text-xs">Tidak ada konten yang ditemukan.</td></tr>
              ) : filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 max-w-[220px]">
                    <div className="font-semibold text-slate-900 truncate" title={item.judul}>{item.judul}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">{item.isi?.slice(0, 60)}...</div>
                  </td>
                  <td className="py-3 px-4">{kategoriBadge(item.kategori)}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => toggleStatus(item)} title="Klik untuk toggle status"
                      className="hover:opacity-80 transition-opacity cursor-pointer">
                      {statusBadge(item.status)}
                    </button>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell text-slate-500">{formatDate(item.updated_at)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button onClick={() => setModalPreview(item)} title="Preview" className="p-1.5 rounded-lg hover:bg-purple-50 text-slate-400 hover:text-purple-600 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openEdit(item)} title="Edit" className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setModalDelete(item)} title="Hapus" className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Tambah/Edit */}
      <Modal open={modalForm} onClose={closeForm} title={editTarget ? 'Edit Konten CMS' : 'Tambah Konten Baru'} maxWidth="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Judul <span className="text-rose-500">*</span></label>
            <input required value={form.judul} onChange={e => setForm(f => ({ ...f, judul: e.target.value }))}
              placeholder="Judul konten..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kategori / Halaman <span className="text-rose-500">*</span></label>
            <select value={form.kategori} onChange={e => setForm(f => ({ ...f, kategori: e.target.value }))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white">
              {KATEGORI_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Isi Konten <span className="text-rose-500">*</span></label>
            <textarea required value={form.isi} onChange={e => setForm(f => ({ ...f, isi: e.target.value }))}
              rows={8} placeholder="Tulis isi konten di sini..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 resize-y font-sans" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status Publikasi</label>
            <div className="flex gap-3">
              {STATUS_OPTIONS.map(s => (
                <label key={s} className={`flex items-center space-x-2 px-4 py-2 rounded-xl border cursor-pointer transition-all text-xs font-semibold ${form.status === s ? (s === 'publikasi' ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-amber-400 bg-amber-50 text-amber-800') : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <input type="radio" name="status" value={s} checked={form.status === s} onChange={() => setForm(f => ({ ...f, status: s }))} className="hidden" />
                  <span>{s === 'publikasi' ? '🟢' : '🟡'} {s.charAt(0).toUpperCase() + s.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={closeForm}
              className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              Batal
            </button>
            <button type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors">
              {editTarget ? 'Simpan Perubahan' : 'Tambah Konten'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Preview */}
      <Modal open={!!modalPreview} onClose={() => setModalPreview(null)} title="Preview Konten" maxWidth="max-w-2xl">
        {modalPreview && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {kategoriBadge(modalPreview.kategori)}
              {statusBadge(modalPreview.status)}
              <span className="text-[10px] text-slate-400">Diperbarui: {formatDate(modalPreview.updated_at)}</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">{modalPreview.judul}</h3>
            <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-100 min-h-[120px]">
              {modalPreview.isi}
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => { setModalPreview(null); openEdit(modalPreview); }}
                className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition-colors">
                <Pencil className="w-3.5 h-3.5" /><span>Edit Konten</span>
              </button>
              <button onClick={() => setModalPreview(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Hapus */}
      <Modal open={!!modalDelete} onClose={() => setModalDelete(null)} title="Konfirmasi Hapus">
        {modalDelete && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus konten <strong className="text-slate-900">"{modalDelete.judul}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setModalDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                Batal
              </button>
              <button onClick={() => { deleteAdminCms(modalDelete.id); setModalDelete(null); }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors flex items-center space-x-1.5">
                <Trash2 className="w-3.5 h-3.5" /><span>Hapus</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
