import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  FileText,
  FileStack,
  Plus,
  Search,
  Eye,
  Download,
  Pencil,
  Trash2,
  X,
  Upload,
  Filter,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  AlertTriangle,
  ArrowDownToLine,
  Mail
} from 'lucide-react';

const TEMPLATE_JENIS_OPTIONS = ['Proposal', 'Laporan', 'Presentasi', 'Berita Acara', 'Jurnal', 'Formulir'];
const SURAT_JENIS_OPTIONS    = ['Surat Keterangan', 'Surat Pengajuan', 'Surat Pengantar', 'Berita Acara', 'Formulir', 'Panduan'];
const STATUS_OPTIONS         = ['aktif', 'nonaktif'];

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

const emptyTemplateForm = { nama: '', jenis: TEMPLATE_JENIS_OPTIONS[0], deskripsi: '', file_name: '', ukuran: '250 KB', status: 'aktif' };
const emptySuratForm    = { nama: '', jenis: SURAT_JENIS_OPTIONS[0], deskripsi: '', file_name: '', ukuran: '180 KB', status: 'aktif' };

export default function TemplateAdminPage() {
  const {
    adminTemplates,
    addAdminTemplate,
    updateAdminTemplate,
    deleteAdminTemplate,
    adminDocuments,
    addAdminDocument,
    updateAdminDocument,
    deleteAdminDocument
  } = useAuth();

  // Active Tab: 'templates' | 'surat'
  const [activeTab, setActiveTab]       = useState('templates');

  // Shared Search & Filters
  const [search, setSearch]             = useState('');
  const [filterJenis, setFilterJenis]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals state
  const [modalForm, setModalForm]       = useState(false);
  const [modalPreview, setModalPreview] = useState(null);
  const [modalDelete, setModalDelete]   = useState(null);
  const [editTarget, setEditTarget]     = useState(null);
  const [form, setForm]                 = useState(emptyTemplateForm);
  const [fileInput, setFileInput]       = useState('');
  const [feedback, setFeedback]         = useState('');

  const isTemplateTab = activeTab === 'templates';
  const currentJenisOptions = isTemplateTab ? TEMPLATE_JENIS_OPTIONS : SURAT_JENIS_OPTIONS;

  // Filtered Templates
  const filteredTemplates = (adminTemplates || []).filter(t => {
    const matchSearch  = !search || t.nama.toLowerCase().includes(search.toLowerCase()) || (t.jenis && t.jenis.toLowerCase().includes(search.toLowerCase())) || (t.deskripsi && t.deskripsi.toLowerCase().includes(search.toLowerCase()));
    const matchJenis   = !filterJenis  || t.jenis === filterJenis;
    const matchStatus  = !filterStatus || t.status === filterStatus;
    return matchSearch && matchJenis && matchStatus;
  });

  // Filtered Surat
  const filteredSurat = (adminDocuments || []).filter(d => {
    const matchSearch  = !search || d.nama.toLowerCase().includes(search.toLowerCase()) || (d.jenis && d.jenis.toLowerCase().includes(search.toLowerCase())) || (d.deskripsi && d.deskripsi.toLowerCase().includes(search.toLowerCase()));
    const matchJenis   = !filterJenis  || d.jenis === filterJenis;
    const matchStatus  = !filterStatus || d.status === filterStatus;
    return matchSearch && matchJenis && matchStatus;
  });

  const currentList = isTemplateTab ? filteredTemplates : filteredSurat;

  const openAdd = () => {
    setEditTarget(null);
    setForm(isTemplateTab ? emptyTemplateForm : emptySuratForm);
    setFileInput('');
    setModalForm(true);
  };

  const openEdit = (item) => {
    setEditTarget(item);
    setForm({
      nama: item.nama || '',
      jenis: item.jenis || currentJenisOptions[0],
      deskripsi: item.deskripsi || '',
      file_name: item.file_name || '',
      ukuran: item.ukuran || '200 KB',
      status: item.status || 'aktif'
    });
    setFileInput(item.file_name || '');
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

    const defaultExt = isTemplateTab ? 'docx' : 'pdf';
    const payload = {
      ...form,
      file_name: fileInput || form.file_name || `${form.nama.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${defaultExt}`,
      file_url: '#'
    };

    if (isTemplateTab) {
      if (editTarget) {
        updateAdminTemplate(editTarget.id, payload);
        setFeedback('Template dokumen berhasil diperbarui.');
      } else {
        addAdminTemplate(payload);
        setFeedback('Template dokumen baru berhasil ditambahkan.');
      }
    } else {
      if (editTarget) {
        updateAdminDocument(editTarget.id, payload);
        setFeedback('Surat administrasi berhasil diperbarui.');
      } else {
        addAdminDocument(payload);
        setFeedback('Surat administrasi baru berhasil ditambahkan.');
      }
    }
    closeForm();
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleDelete = () => {
    if (!modalDelete) return;
    if (isTemplateTab) {
      deleteAdminTemplate(modalDelete.id);
      setFeedback('Template dokumen berhasil dihapus.');
    } else {
      deleteAdminDocument(modalDelete.id);
      setFeedback('Surat administrasi berhasil dihapus.');
    }
    setModalDelete(null);
    setTimeout(() => setFeedback(''), 4000);
  };

  const toggleAktif = (item) => {
    const nextStatus = item.status === 'aktif' ? 'nonaktif' : 'aktif';
    if (isTemplateTab) {
      updateAdminTemplate(item.id, { status: nextStatus });
    } else {
      updateAdminDocument(item.id, { status: nextStatus });
    }
  };

  const handleDownload = (item) => {
    const content = `BERKAS RESMI SIMONITA FASILKOM UNSRI\n` +
      `===============================================\n\n` +
      `Judul / Nama: ${item.nama}\n` +
      `Jenis / Tipe: ${item.jenis || '-'}\n` +
      `Kategori    : ${isTemplateTab ? 'Template Dokumen Tugas Akhir' : 'Surat Administrasi Mahasiswa / Jurusan'}\n` +
      `Berkas      : ${item.file_name || 'dokumen.docx'}\n` +
      `Tanggal     : ${item.updated_at || item.tanggal_upload || '-'}\n\n` +
      `Deskripsi & Catatan:\n${item.deskripsi || 'Dokumen resmi terverifikasi Fakultas Ilmu Komputer Universitas Sriwijaya.'}\n\n` +
      `Sistem Monitoring Tugas Akhir (SIMONITA) - Fasilkom UNSRI`;

    const blob = new Blob([content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = item.file_name || `${item.nama}.${isTemplateTab ? 'docx' : 'pdf'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const statusBadge = (status) => (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status === 'aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
      {status}
    </span>
  );

  const jenisBadge = (jenis) => {
    const colors = {
      Proposal: 'bg-blue-50 text-blue-700 border-blue-200',
      Laporan: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      Presentasi: 'bg-purple-50 text-purple-700 border-purple-200',
      'Berita Acara': 'bg-rose-50 text-rose-700 border-rose-200',
      Jurnal: 'bg-teal-50 text-teal-700 border-teal-200',
      Formulir: 'bg-amber-50 text-amber-700 border-amber-200',
      'Surat Keterangan': 'bg-blue-50 text-blue-700 border-blue-200',
      'Surat Pengajuan': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'Surat Pengantar': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Panduan: 'bg-teal-50 text-teal-700 border-teal-200'
    };
    const cls = colors[jenis] || 'bg-slate-50 text-slate-600 border-slate-200';
    return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>{jenis}</span>;
  };

  const fileIcon = (fileName = '') => {
    if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) return '📄';
    if (fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) return '📊';
    if (fileName.endsWith('.pdf')) return '📕';
    return '📁';
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
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold backdrop-blur-sm mb-3 border border-emerald-400/20">
          <FileText className="w-3.5 h-3.5" />
          <span>Pusat Berkas &amp; Dokumen Resmi SIMTA</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Manajemen Template &amp; Surat Administrasi</h1>
        <p className="text-sm text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
          Kelola template dokumen tugas akhir dan surat-surat administrasi resmi mahasiswa/jurusan dalam satu pusat kendali terpadu FASILKOM UNSRI.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 pt-2 rounded-xl shadow-2xs gap-4">
        <button
          onClick={() => { setActiveTab('templates'); setSearch(''); setFilterJenis(''); setFilterStatus(''); }}
          className={`pb-3 px-3 text-xs font-bold transition-all relative flex items-center space-x-2 cursor-pointer ${
            isTemplateTab
              ? 'text-emerald-700 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Template Dokumen Tugas Akhir</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ml-1 ${
            isTemplateTab ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
          }`}>
            {(adminTemplates || []).length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('surat'); setSearch(''); setFilterJenis(''); setFilterStatus(''); }}
          className={`pb-3 px-3 text-xs font-bold transition-all relative flex items-center space-x-2 cursor-pointer ${
            !isTemplateTab
              ? 'text-emerald-700 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Surat Administrasi Mahasiswa / Jurusan</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ml-1 ${
            !isTemplateTab ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
          }`}>
            {(adminDocuments || []).length}
          </span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2.5 flex-1 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Cari nama / jenis ${isTemplateTab ? 'template' : 'surat'}...`}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterJenis}
              onChange={e => setFilterJenis(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
            >
              <option value="">Semua Jenis</option>
              {currentJenisOptions.map(j => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
            >
              <option value="">Semua Status</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-500 transition-colors shadow-sm whitespace-nowrap cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isTemplateTab ? 'Tambah Template Baru' : 'Tambah Surat Administrasi'}</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center space-x-2">
            {isTemplateTab ? (
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Mail className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>
              {isTemplateTab ? 'Daftar Template Dokumen' : 'Daftar Surat Administrasi'} ({currentList.length})
            </span>
          </span>
          <span className="text-[11px] text-slate-400">
            {isTemplateTab ? 'Format .docx, .pptx, .pdf' : 'Format .pdf, .docx'}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">{isTemplateTab ? 'Nama Template' : 'Nama Surat'} &amp; Deskripsi</th>
                <th className="py-3 px-4 w-36">Jenis Berkas</th>
                <th className="py-3 px-4 w-32">Pembaruan</th>
                <th className="py-3 px-4 w-36">Nama File</th>
                <th className="py-3 px-4 w-24 text-center">Status</th>
                <th className="py-3 px-4 w-36 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    <p className="font-semibold text-slate-600">Tidak ada {isTemplateTab ? 'template' : 'surat'} yang ditemukan.</p>
                    <p className="text-[11px] mt-0.5">Coba sesuaikan kata kunci pencarian atau ganti filter.</p>
                  </td>
                </tr>
              ) : currentList.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                  <td className="py-3 px-4 max-w-[280px]">
                    <div className="flex items-center space-x-2">
                      <span className="text-base">{fileIcon(item.file_name)}</span>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate" title={item.nama}>{item.nama}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.deskripsi || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">{jenisBadge(item.jenis)}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {item.updated_at || item.tanggal_upload || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono text-[11px] text-slate-800 font-medium truncate max-w-[140px]" title={item.file_name}>
                      {item.file_name || 'berkas.docx'}
                    </div>
                    <span className="text-[10px] text-slate-400">{item.ukuran || 'Dokumen'}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => toggleAktif(item)}
                      title="Klik untuk ubah aktif/nonaktif"
                      className="inline-flex items-center space-x-1.5 hover:opacity-80 transition-opacity cursor-pointer"
                    >
                      {item.status === 'aktif' ? (
                        <ToggleRight className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-slate-300" />
                      )}
                      {statusBadge(item.status)}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => setModalPreview(item)}
                        title="Lihat Detail"
                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownload(item)}
                        title="Unduh Berkas"
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        <ArrowDownToLine className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEdit(item)}
                        title="Edit Berkas"
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setModalDelete(item)}
                        title="Hapus Berkas"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      >
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

      {/* Modal Add / Edit */}
      <Modal
        open={modalForm}
        onClose={closeForm}
        title={editTarget
          ? `Edit ${isTemplateTab ? 'Template Dokumen' : 'Surat Administrasi'}`
          : `Tambah ${isTemplateTab ? 'Template Dokumen Baru' : 'Surat Administrasi Baru'}`
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama {isTemplateTab ? 'Template' : 'Surat'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.nama}
              onChange={e => setForm(prev => ({ ...prev, nama: e.target.value }))}
              placeholder={isTemplateTab ? "Contoh: Template Proposal Tugas Akhir" : "Contoh: Surat Keterangan Bebas Pustaka"}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Dokumen</label>
              <select
                value={form.jenis}
                onChange={e => setForm(prev => ({ ...prev, jenis: e.target.value }))}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {currentJenisOptions.map(j => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status Publikasi</label>
              <select
                value={form.status}
                onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
            <textarea
              rows={3}
              value={form.deskripsi}
              onChange={e => setForm(prev => ({ ...prev, deskripsi: e.target.value }))}
              placeholder="Deskripsi peruntukan dokumen atau petunjuk pengisian..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Berkas File ({isTemplateTab ? '.docx, .pptx, .pdf' : '.pdf, .docx'})
            </label>
            <label className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/30 transition-colors">
              <Upload className="w-5 h-5 text-slate-400 mb-1" />
              <span className="text-xs font-semibold text-slate-700">
                {fileInput || form.file_name || 'Pilih berkas dari perangkat'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {isTemplateTab ? 'Format Word, PowerPoint, atau PDF' : 'Format Dokumen Resmi (PDF/DOCX)'}
              </span>
              <input
                type="file"
                accept=".docx,.doc,.pdf,.pptx,.ppt"
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
              {editTarget ? 'Simpan Pembaruan' : 'Tambahkan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Preview */}
      <Modal
        open={Boolean(modalPreview)}
        onClose={() => setModalPreview(null)}
        title={`Detail ${isTemplateTab ? 'Template Dokumen' : 'Surat Administrasi'}`}
        maxWidth="max-w-xl"
      >
        {modalPreview && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {modalPreview.jenis}
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
                <span className="font-semibold text-slate-800 text-[11px] block mt-0.5">{modalPreview.ukuran || 'Dokumen'}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kategori</span>
                <span className="font-semibold text-slate-800 text-[11px] block mt-0.5">
                  {isTemplateTab ? 'Template Tugas Akhir' : 'Surat Administrasi'}
                </span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tanggal Pembaruan</span>
                <span className="font-mono text-slate-800 text-[11px] block mt-0.5">{modalPreview.updated_at || modalPreview.tanggal_upload || '-'}</span>
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
                <span>Unduh Berkas</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Delete Confirmation */}
      <Modal
        open={Boolean(modalDelete)}
        onClose={() => setModalDelete(null)}
        title="Konfirmasi Hapus Berkas"
        maxWidth="max-w-md"
      >
        {modalDelete && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-900">
                  Apakah Anda yakin ingin menghapus {isTemplateTab ? 'template' : 'surat'} ini?
                </p>
                <p className="mt-1 text-red-700">
                  Berkas <span className="font-semibold">{modalDelete.nama}</span> akan dihapus dari sistem.
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
                Hapus Berkas
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
