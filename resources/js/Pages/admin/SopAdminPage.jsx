import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  FileCheck,
  Plus,
  Search,
  Eye,
  Download,
  Pencil,
  Trash2,
  X,
  Upload,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Layers,
  ArrowDownToLine
} from 'lucide-react';

const KATEGORI_OPTIONS = [
  'Bimbingan',
  'Ruangan & Sarana',
  'Pengajuan Judul',
  'Ujian Sidang',
  'Administrasi & Umum'
];

const STATUS_OPTIONS = ['aktif', 'nonaktif'];

function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;
  return (
    <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain animate-in fade-in">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />
      <div data-lenis-prevent className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden my-auto overscroll-contain`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div data-lenis-prevent className="px-6 py-5 overflow-y-auto flex-1 overscroll-contain">{children}</div>
      </div>
    </div>
  );
}

const emptyForm = {
  nama: '',
  kategori: KATEGORI_OPTIONS[0],
  deskripsi: '',
  file_name: '',
  ukuran: '450 KB',
  status: 'aktif'
};

export default function SopAdminPage() {
  const { adminSops, addAdminSop, updateAdminSop, deleteAdminSop } = useAuth();

  const [search, setSearch]             = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalForm, setModalForm]       = useState(false);
  const [modalPreview, setModalPreview] = useState(null);
  const [modalDelete, setModalDelete]   = useState(null);
  const [editTarget, setEditTarget]     = useState(null);
  const [form, setForm]                 = useState(emptyForm);
  const [fileInput, setFileInput]       = useState('');
  const [feedback, setFeedback]         = useState('');

  const list = adminSops || [];

  const filtered = list.filter(s => {
    const matchSearch = !search ||
      s.nama.toLowerCase().includes(search.toLowerCase()) ||
      (s.kategori && s.kategori.toLowerCase().includes(search.toLowerCase())) ||
      (s.deskripsi && s.deskripsi.toLowerCase().includes(search.toLowerCase()));
    const matchKategori = !filterKategori || s.kategori === filterKategori;
    const matchStatus   = !filterStatus || s.status === filterStatus;
    return matchSearch && matchKategori && matchStatus;
  });

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setFileInput('');
    setModalForm(true);
  };

  const openEdit = (sop) => {
    setEditTarget(sop);
    setForm({
      nama: sop.nama || '',
      kategori: sop.kategori || KATEGORI_OPTIONS[0],
      deskripsi: sop.deskripsi || '',
      file_name: sop.file_name || '',
      ukuran: sop.ukuran || '450 KB',
      status: sop.status || 'aktif'
    });
    setFileInput(sop.file_name || '');
    setModalForm(true);
  };

  const closeForm = () => {
    setModalForm(false);
    setEditTarget(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileInput(file.name);
      const kb = Math.round(file.size / 1024);
      setForm(prev => ({
        ...prev,
        file_name: file.name,
        ukuran: kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nama.trim()) return;

    const payload = {
      ...form,
      file_name: fileInput || form.file_name || `${form.nama.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`,
      file_url: '#'
    };

    if (editTarget) {
      updateAdminSop(editTarget.id, payload);
      setFeedback('Dokumen SOP berhasil diperbarui.');
    } else {
      addAdminSop(payload);
      setFeedback('Dokumen SOP baru berhasil ditambahkan.');
    }
    closeForm();
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleDelete = () => {
    if (!modalDelete) return;
    deleteAdminSop(modalDelete.id);
    setModalDelete(null);
    setFeedback('Dokumen SOP berhasil dihapus.');
    setTimeout(() => setFeedback(''), 4000);
  };

  const toggleStatus = (sop) => {
    const next = sop.status === 'aktif' ? 'nonaktif' : 'aktif';
    updateAdminSop(sop.id, { status: next });
  };

  const handleDownload = (sop) => {
    // Generate text blob download for standard compliance
    const content = `STANDAR OPERASIONAL PROSEDUR (SOP) SIMONITA FASILKOM UNSRI\n` +
      `============================================================\n\n` +
      `Judul SOP  : ${sop.nama}\n` +
      `Kategori   : ${sop.kategori || '-'}\n` +
      `Status     : ${sop.status || 'aktif'}\n` +
      `Pembaruan  : ${sop.updated_at || '-'}\n` +
      `Penyusun   : ${sop.uploader || 'Admin SIMTA FASILKOM'}\n\n` +
      `Deskripsi & Prosedur:\n${sop.deskripsi || 'Belum ada deskripsi khusus.'}\n\n` +
      `Dokumen Resmi Sistem Monitoring Tugas Akhir Fasilkom UNSRI (SIMONITA).`;
    const blob = new Blob([content], { type: 'application/pdf;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = sop.file_name || `${sop.nama}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Feedback */}
      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback('')} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold backdrop-blur-sm mb-3 border border-emerald-400/20">
            <FileCheck className="w-3.5 h-3.5" />
            <span>Konten &amp; Regulasi Resmi SIMTA</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Standar Operasional Prosedur (SOP)</h1>
          <p className="text-sm text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
            Kelola panduan tata kelola dan dokumen SOP resmi pelaksanaan tugas akhir, peminjaman ruangan, bimbingan, dan ujian sidang di Fakultas Ilmu Komputer UNSRI.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total SOP</span>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{list.length}</p>
          <span className="text-[11px] text-slate-500">Dokumen terdaftar</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SOP Aktif</span>
          <p className="text-xl font-bold text-emerald-600 mt-0.5">{list.filter(s => s.status === 'aktif').length}</p>
          <span className="text-[11px] text-emerald-600/80">Dapat diunduh</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kategori Regulasi</span>
          <p className="text-xl font-bold text-indigo-600 mt-0.5">{new Set(list.map(s => s.kategori)).size}</p>
          <span className="text-[11px] text-indigo-600/80">Bidang operasional</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pembaruan Terakhir</span>
          <p className="text-sm font-bold text-slate-800 mt-1">September 2026</p>
          <span className="text-[11px] text-slate-500">Tahun Akademik Aktif</span>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama SOP, kategori, atau deskripsi..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
            >
              <option value="">Semua Kategori</option>
              {KATEGORI_OPTIONS.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
            >
              <option value="">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </div>
        </div>

        <button
          onClick={openAdd}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Dokumen SOP</span>
        </button>
      </div>

      {/* SOP Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Dokumen SOP &amp; Deskripsi</th>
                <th className="py-3 px-4 w-40">Kategori</th>
                <th className="py-3 px-4 w-32">Pembaruan</th>
                <th className="py-3 px-4 w-36">Berkas Dokumen</th>
                <th className="py-3 px-4 w-24 text-center">Status</th>
                <th className="py-3 px-4 w-36 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold text-slate-600">Tidak ada dokumen SOP ditemukan</p>
                    <p className="text-[11px] mt-0.5">Coba sesuaikan kata kunci pencarian atau filter.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((sop, idx) => (
                  <tr key={sop.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                        <span className="text-red-500 font-bold">📕</span>
                        <span>{sop.nama}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{sop.deskripsi || '-'}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {sop.kategori || 'Umum'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {sop.updated_at || '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-[11px] text-slate-800 font-medium truncate max-w-[140px]" title={sop.file_name}>
                        {sop.file_name || 'dokumen.pdf'}
                      </div>
                      <span className="text-[10px] text-slate-400">{sop.ukuran || 'PDF'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleStatus(sop)}
                        title="Klik untuk mengubah status"
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                          sop.status === 'aktif'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {sop.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => setModalPreview(sop)}
                          title="Lihat Detail & Preview"
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownload(sop)}
                          title="Unduh Dokumen PDF"
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEdit(sop)}
                          title="Edit Dokumen SOP"
                          className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setModalDelete(sop)}
                          title="Hapus Dokumen SOP"
                          className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit */}
      <Modal
        open={modalForm}
        onClose={closeForm}
        title={editTarget ? 'Edit Standar Operasional Prosedur (SOP)' : 'Tambah Dokumen SOP Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Dokumen SOP <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.nama}
              onChange={(e) => setForm(prev => ({ ...prev, nama: e.target.value }))}
              placeholder="Contoh: SOP Pelaksanaan Bimbingan Tugas Akhir"
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
              <select
                value={form.kategori}
                onChange={(e) => setForm(prev => ({ ...prev, kategori: e.target.value }))}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {KATEGORI_OPTIONS.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status Publikasi</label>
              <select
                value={form.status}
                onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat / Tata Kelola</label>
            <textarea
              rows={3}
              value={form.deskripsi}
              onChange={(e) => setForm(prev => ({ ...prev, deskripsi: e.target.value }))}
              placeholder="Jelaskan ringkasan prosedur atau petunjuk penting dari dokumen SOP ini..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Unggah Dokumen PDF (Maks. 10 MB)</label>
            <label className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/30 transition-colors">
              <Upload className="w-5 h-5 text-slate-400 mb-1" />
              <span className="text-xs font-semibold text-slate-700">
                {fileInput || form.file_name || 'Pilih file PDF dari perangkat'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">Format dokumen PDF</span>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={closeForm}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-bold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              {editTarget ? 'Simpan Pembaruan' : 'Tambahkan SOP'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Preview */}
      <Modal
        open={Boolean(modalPreview)}
        onClose={() => setModalPreview(null)}
        title="Detail Dokumen SOP"
        maxWidth="max-w-xl"
      >
        {modalPreview && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {modalPreview.kategori}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  modalPreview.status === 'aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  Status: {modalPreview.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{modalPreview.nama}</h3>
              <p className="text-slate-600 leading-relaxed text-xs">{modalPreview.deskripsi || 'Tidak ada deskripsi.'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-600">
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nama Berkas</span>
                <span className="font-mono text-slate-800 text-[11px] truncate block mt-0.5">{modalPreview.file_name}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ukuran File</span>
                <span className="font-semibold text-slate-800 text-[11px] block mt-0.5">{modalPreview.ukuran || 'PDF'}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Penyusun / Diperbarui</span>
                <span className="font-semibold text-slate-800 text-[11px] block mt-0.5">{modalPreview.uploader || 'Admin SIMTA'}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tanggal Berlaku</span>
                <span className="font-mono text-slate-800 text-[11px] block mt-0.5">{modalPreview.updated_at || '-'}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setModalPreview(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => handleDownload(modalPreview)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Dokumen PDF</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Delete Confirmation */}
      <Modal
        open={Boolean(modalDelete)}
        onClose={() => setModalDelete(null)}
        title="Konfirmasi Hapus SOP"
        maxWidth="max-w-md"
      >
        {modalDelete && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-900">Apakah Anda yakin ingin menghapus SOP ini?</p>
                <p className="mt-1 text-red-700">
                  Dokumen <span className="font-semibold">{modalDelete.nama}</span> akan dihapus dari daftar regulasi dan tidak dapat diakses lagi oleh pengguna.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setModalDelete(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Hapus Dokumen
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

