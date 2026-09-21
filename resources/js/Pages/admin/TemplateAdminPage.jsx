import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  FileText, Plus, Search, Eye, Download, Pencil, Trash2, X, Upload, Filter, ToggleLeft, ToggleRight
} from 'lucide-react';

const JENIS_OPTIONS  = ['Proposal', 'Laporan', 'Presentasi', 'Berita Acara', 'Jurnal', 'Formulir'];
const STATUS_OPTIONS = ['aktif', 'nonaktif'];

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

const emptyForm = { nama: '', jenis: JENIS_OPTIONS[0], deskripsi: '', file_name: '', ukuran: '', status: 'aktif' };

export default function TemplateAdminPage() {
  const { adminTemplates, addAdminTemplate, updateAdminTemplate, deleteAdminTemplate } = useAuth();

  const [search, setSearch]             = useState('');
  const [filterJenis, setFilterJenis]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalForm, setModalForm]       = useState(false);
  const [modalPreview, setModalPreview] = useState(null);
  const [modalDelete, setModalDelete]   = useState(null);
  const [editTarget, setEditTarget]     = useState(null);
  const [form, setForm]                 = useState(emptyForm);
  const [fileInput, setFileInput]       = useState('');

  const filtered = adminTemplates.filter(t => {
    const matchSearch  = !search || t.nama.toLowerCase().includes(search.toLowerCase()) || t.jenis.toLowerCase().includes(search.toLowerCase());
    const matchJenis   = !filterJenis  || t.jenis === filterJenis;
    const matchStatus  = !filterStatus || t.status === filterStatus;
    return matchSearch && matchJenis && matchStatus;
  });

  const openAdd  = () => { setEditTarget(null); setForm(emptyForm); setFileInput(''); setModalForm(true); };
  const openEdit = (tpl) => { setEditTarget(tpl); setForm({ nama: tpl.nama, jenis: tpl.jenis, deskripsi: tpl.deskripsi, file_name: tpl.file_name, ukuran: tpl.ukuran, status: tpl.status }); setFileInput(tpl.file_name); setModalForm(true); };
  const closeForm = () => { setModalForm(false); setEditTarget(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, file_name: fileInput || form.file_name || 'template.docx', file_url: '#' };
    if (editTarget) updateAdminTemplate(editTarget.id, payload);
    else addAdminTemplate(payload);
    closeForm();
  };

  const toggleAktif = (tpl) => {
    updateAdminTemplate(tpl.id, { status: tpl.status === 'aktif' ? 'nonaktif' : 'aktif' });
  };

  const statusBadge = (status) => (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status === 'aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
      {status}
    </span>
  );

  const jenisBadge = (jenis) => {
    const colors = { Proposal: 'bg-blue-50 text-blue-700', Laporan: 'bg-indigo-50 text-indigo-700', Presentasi: 'bg-purple-50 text-purple-700', 'Berita Acara': 'bg-rose-50 text-rose-700', Jurnal: 'bg-teal-50 text-teal-700', Formulir: 'bg-amber-50 text-amber-700' };
    const cls = colors[jenis] || 'bg-slate-50 text-slate-600';
    return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{jenis}</span>;
  };

  const fileIcon = (fileName = '') => {
    if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) return '📄';
    if (fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) return '📊';
    if (fileName.endsWith('.pdf')) return '📕';
    return '📁';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold backdrop-blur-sm mb-3 border border-emerald-400/20">
          <FileText className="w-3 h-3" />
          <span>Admin SIMTA</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Manajemen Template Dokumen</h1>
        <p className="text-sm text-emerald-100/90 mt-1 max-w-xl leading-relaxed">
          Kelola template dokumen resmi yang dapat diunduh oleh mahasiswa dan dosen melalui sistem SIMTA.
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2.5 flex-1 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama / jenis template..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <select value={filterJenis} onChange={e => setFilterJenis(e.target.value)}
              className="pl-8 pr-6 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white appearance-none">
              <option value="">Semua Jenis</option>
              {JENIS_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="pl-8 pr-6 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white appearance-none">
              <option value="">Semua Status</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <button onClick={openAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm whitespace-nowrap">
          <Plus className="w-3.5 h-3.5" /><span>+ Tambah Template</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-700 flex items-center space-x-2">
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>Daftar Template ({filtered.length})</span>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Nama Template</th>
                <th className="py-3 px-4">Jenis</th>
                <th className="py-3 px-4 hidden md:table-cell">Deskripsi</th>
                <th className="py-3 px-4 hidden sm:table-cell">Tgl Update</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-slate-400 text-xs">Tidak ada template yang ditemukan.</td></tr>
              ) : filtered.map(tpl => (
                <tr key={tpl.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 max-w-[200px]">
                    <div className="flex items-center space-x-2">
                      <span className="text-base">{fileIcon(tpl.file_name)}</span>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate" title={tpl.nama}>{tpl.nama}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{tpl.file_name} {tpl.ukuran && <span className="ml-1 text-slate-300">· {tpl.ukuran}</span>}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">{jenisBadge(tpl.jenis)}</td>
                  <td className="py-3 px-4 hidden md:table-cell text-slate-500 max-w-[200px]">
                    <div className="truncate" title={tpl.deskripsi}>{tpl.deskripsi}</div>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell text-slate-500">{tpl.updated_at}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => toggleAktif(tpl)} title="Toggle aktif/nonaktif"
                      className="flex items-center space-x-1.5 hover:opacity-80 transition-opacity group">
                      {tpl.status === 'aktif'
                        ? <ToggleRight className="w-5 h-5 text-emerald-500 group-hover:text-emerald-600" />
                        : <ToggleLeft className="w-5 h-5 text-slate-300 group-hover:text-slate-400" />
                      }
                      {statusBadge(tpl.status)}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button onClick={() => setModalPreview(tpl)} title="Lihat" className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <a href={tpl.file_url} download={tpl.file_name} title="Download" className="p-1.5 rounded-lg hover:bg-teal-50 text-slate-400 hover:text-teal-600 transition-colors">
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button onClick={() => openEdit(tpl)} title="Edit" className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setModalDelete(tpl)} title="Hapus" className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors">
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
      <Modal open={modalForm} onClose={closeForm} title={editTarget ? 'Edit Template' : 'Tambah Template Baru'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Template <span className="text-rose-500">*</span></label>
            <input required value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
              placeholder="Contoh: Template Proposal Tugas Akhir"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jenis Template <span className="text-rose-500">*</span></label>
            <select value={form.jenis} onChange={e => setForm(f => ({ ...f, jenis: e.target.value }))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white">
              {JENIS_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Deskripsi</label>
            <textarea value={form.deskripsi} onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))}
              rows={3} placeholder="Keterangan singkat mengenai template ini..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Upload File Template</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-emerald-300 transition-colors">
              <Upload className="w-6 h-6 text-slate-300 mx-auto mb-2" />
              <input type="file" className="hidden" id="tpl-file-upload"
                onChange={e => {
                  if (e.target.files[0]) {
                    setFileInput(e.target.files[0].name);
                    const sizeKB = Math.round(e.target.files[0].size / 1024);
                    setForm(f => ({ ...f, ukuran: sizeKB >= 1024 ? `${(sizeKB/1024).toFixed(1)} MB` : `${sizeKB} KB` }));
                  }
                }} />
              <label htmlFor="tpl-file-upload" className="cursor-pointer text-xs text-emerald-600 font-semibold hover:text-emerald-800">
                Pilih file
              </label>
              <span className="text-xs text-slate-400"> (.docx, .pptx, .pdf)</span>
              {fileInput && <div className="mt-2 text-[10px] text-emerald-600 font-medium">{fileInput}</div>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white">
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={closeForm}
              className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              Batal
            </button>
            <button type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors">
              {editTarget ? 'Simpan Perubahan' : 'Tambah Template'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Preview */}
      <Modal open={!!modalPreview} onClose={() => setModalPreview(null)} title="Detail Template">
        {modalPreview && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-3xl">{fileIcon(modalPreview.file_name)}</span>
              <div>
                <div className="text-sm font-bold text-slate-900">{modalPreview.nama}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{modalPreview.file_name}</div>
                {modalPreview.ukuran && <div className="text-[10px] text-slate-400 mt-0.5">Ukuran: {modalPreview.ukuran}</div>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-slate-500 font-semibold">Jenis</span><p className="mt-0.5">{jenisBadge(modalPreview.jenis)}</p></div>
              <div><span className="text-slate-500 font-semibold">Status</span><p className="mt-0.5">{statusBadge(modalPreview.status)}</p></div>
              <div><span className="text-slate-500 font-semibold">Terakhir Diperbarui</span><p className="text-slate-900 font-bold mt-0.5">{modalPreview.updated_at}</p></div>
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
              Apakah Anda yakin ingin menghapus template <strong className="text-slate-900">"{modalDelete.nama}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setModalDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                Batal
              </button>
              <button onClick={() => { deleteAdminTemplate(modalDelete.id); setModalDelete(null); }}
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
