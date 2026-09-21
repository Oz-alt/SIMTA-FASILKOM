import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  FileStack, Plus, Search, Eye, Download, Pencil, Trash2, X, Upload, Filter
} from 'lucide-react';

const JENIS_OPTIONS = ['Surat Keterangan', 'Surat Pengajuan', 'Surat Pengantar', 'Berita Acara', 'Formulir', 'Panduan'];
const STATUS_OPTIONS = ['aktif', 'nonaktif'];

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
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

const emptyForm = { nama: '', jenis: JENIS_OPTIONS[0], deskripsi: '', file_name: '', status: 'aktif' };

export default function DokumenAdminPage() {
  const { adminDocuments, addAdminDocument, updateAdminDocument, deleteAdminDocument } = useAuth();

  const [search, setSearch]           = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [modalForm, setModalForm]     = useState(false);
  const [modalPreview, setModalPreview] = useState(null);
  const [modalDelete, setModalDelete] = useState(null);
  const [editTarget, setEditTarget]   = useState(null);
  const [form, setForm]               = useState(emptyForm);
  const [fileInput, setFileInput]     = useState('');

  const filtered = adminDocuments.filter(d => {
    const matchSearch = !search || d.nama.toLowerCase().includes(search.toLowerCase()) || d.jenis.toLowerCase().includes(search.toLowerCase());
    const matchJenis  = !filterJenis || d.jenis === filterJenis;
    return matchSearch && matchJenis;
  });

  const openAdd = () => { setEditTarget(null); setForm(emptyForm); setFileInput(''); setModalForm(true); };
  const openEdit = (doc) => { setEditTarget(doc); setForm({ nama: doc.nama, jenis: doc.jenis, deskripsi: doc.deskripsi, file_name: doc.file_name, status: doc.status }); setFileInput(doc.file_name); setModalForm(true); };
  const closeForm = () => { setModalForm(false); setEditTarget(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, file_name: fileInput || form.file_name || 'dokumen.pdf', file_url: '#' };
    if (editTarget) { updateAdminDocument(editTarget.id, payload); }
    else { addAdminDocument(payload); }
    closeForm();
  };

  const handleDelete = () => {
    deleteAdminDocument(modalDelete.id);
    setModalDelete(null);
  };

  const statusBadge = (status) => (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status === 'aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
      {status}
    </span>
  );

  const jenisBadge = (jenis) => (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">{jenis}</span>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold backdrop-blur-sm mb-3 border border-blue-400/20">
          <FileStack className="w-3 h-3" />
          <span>Admin SIMTA</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Manajemen Dokumen / Surat</h1>
        <p className="text-sm text-blue-100/90 mt-1 max-w-xl leading-relaxed">
          Kelola seluruh dokumen dan surat resmi yang tersedia pada sistem SIMTA Fasilkom UNSRI.
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2.5 flex-1 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama / jenis dokumen..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterJenis} onChange={e => setFilterJenis(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white appearance-none pr-8"
            >
              <option value="">Semua Jenis</option>
              {JENIS_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Upload Dokumen</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center space-x-2">
            <FileStack className="w-3.5 h-3.5 text-blue-600" />
            <span>Daftar Dokumen ({filtered.length})</span>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Nama Dokumen</th>
                <th className="py-3 px-4">Jenis</th>
                <th className="py-3 px-4 hidden md:table-cell">Deskripsi</th>
                <th className="py-3 px-4 hidden sm:table-cell">Tgl Upload</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-slate-400 text-xs">Tidak ada dokumen yang ditemukan.</td></tr>
              ) : filtered.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900 max-w-[180px]">
                    <div className="truncate" title={doc.nama}>{doc.nama}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{doc.file_name}</div>
                  </td>
                  <td className="py-3 px-4">{jenisBadge(doc.jenis)}</td>
                  <td className="py-3 px-4 hidden md:table-cell text-slate-500 max-w-[220px]">
                    <div className="truncate" title={doc.deskripsi}>{doc.deskripsi}</div>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell text-slate-500">{doc.tanggal_upload}</td>
                  <td className="py-3 px-4">{statusBadge(doc.status)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button onClick={() => setModalPreview(doc)} title="Lihat" className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <a href={doc.file_url} download={doc.file_name} title="Download" className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors">
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button onClick={() => openEdit(doc)} title="Edit" className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setModalDelete(doc)} title="Hapus" className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors">
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

      {/* Modal Form Upload/Edit */}
      <Modal open={modalForm} onClose={closeForm} title={editTarget ? 'Edit Dokumen' : 'Upload Dokumen Baru'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Dokumen <span className="text-rose-500">*</span></label>
            <input required value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
              placeholder="Contoh: Surat Keterangan Aktif Kuliah"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jenis Dokumen <span className="text-rose-500">*</span></label>
            <select value={form.jenis} onChange={e => setForm(f => ({ ...f, jenis: e.target.value }))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
              {JENIS_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Deskripsi</label>
            <textarea value={form.deskripsi} onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))}
              rows={3} placeholder="Keterangan singkat mengenai dokumen ini..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Upload File</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-indigo-300 transition-colors">
              <Upload className="w-6 h-6 text-slate-300 mx-auto mb-2" />
              <input type="file" className="hidden" id="file-upload"
                onChange={e => { if (e.target.files[0]) setFileInput(e.target.files[0].name); }} />
              <label htmlFor="file-upload" className="cursor-pointer text-xs text-indigo-600 font-semibold hover:text-indigo-800">
                Pilih file
              </label>
              <span className="text-xs text-slate-400"> atau drag & drop</span>
              {fileInput && <div className="mt-2 text-[10px] text-emerald-600 font-medium">{fileInput}</div>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={closeForm}
              className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              Batal
            </button>
            <button type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors">
              {editTarget ? 'Simpan Perubahan' : 'Upload Dokumen'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Preview */}
      <Modal open={!!modalPreview} onClose={() => setModalPreview(null)} title="Detail Dokumen">
        {modalPreview && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-slate-500 font-semibold">Nama Dokumen</span><p className="text-slate-900 font-bold mt-0.5">{modalPreview.nama}</p></div>
              <div><span className="text-slate-500 font-semibold">Jenis</span><p className="text-slate-900 font-bold mt-0.5">{modalPreview.jenis}</p></div>
              <div><span className="text-slate-500 font-semibold">Tanggal Upload</span><p className="text-slate-900 font-bold mt-0.5">{modalPreview.tanggal_upload}</p></div>
              <div><span className="text-slate-500 font-semibold">Status</span><p className="mt-0.5">{modalPreview.status === 'aktif' ? <span className="text-emerald-700 font-bold">Aktif</span> : <span className="text-slate-500 font-bold">Nonaktif</span>}</p></div>
              <div className="col-span-2"><span className="text-slate-500 font-semibold">File</span><p className="text-indigo-600 font-semibold font-mono mt-0.5">{modalPreview.file_name}</p></div>
              <div className="col-span-2"><span className="text-slate-500 font-semibold">Deskripsi</span><p className="text-slate-700 mt-0.5 leading-relaxed">{modalPreview.deskripsi}</p></div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex space-x-2">
              <a href={modalPreview.file_url} download={modalPreview.file_name}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors">
                <Download className="w-3.5 h-3.5" /><span>Download</span>
              </a>
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
              Apakah Anda yakin ingin menghapus dokumen <strong className="text-slate-900">"{modalDelete.nama}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setModalDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                Batal
              </button>
              <button onClick={handleDelete}
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
