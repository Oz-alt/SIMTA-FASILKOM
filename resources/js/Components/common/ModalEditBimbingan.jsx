import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  X, 
  BookOpen, 
  AlertCircle, 
  Loader2, 
  CheckCircle2,
  Edit3,
  Link2,
  ExternalLink
} from 'lucide-react';

export default function ModalEditBimbingan({ isOpen, onClose, consultation, onSaved }) {
  const { updateConsultation } = useAuth();

  const [formData, setFormData] = useState({
    pembimbing: 'Pembimbing 1',
    dosen_nama: '',
    tanggal: '',
    waktu: '',
    bab_topik: '',
    catatan_mahasiswa: '',
    file_revisi_url: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (consultation) {
      setFormData({
        pembimbing: consultation.pembimbing || 'Pembimbing 1',
        dosen_nama: consultation.dosen_nama || '',
        tanggal: consultation.tanggal || '',
        waktu: consultation.waktu || '09:00',
        bab_topik: consultation.bab_topik || '',
        catatan_mahasiswa: consultation.catatan_mahasiswa || '',
        file_revisi_url: consultation.file_revisi_url || ''
      });
      setErrorMsg('');
    }
  }, [consultation]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !consultation) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.bab_topik.trim()) {
      setErrorMsg('Bab / Topik bimbingan wajib diisi.');
      return;
    }

    if (!formData.catatan_mahasiswa.trim()) {
      setErrorMsg('Catatan konsultasi / progres bimbingan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await updateConsultation(consultation.id, {
        pembimbing: formData.pembimbing,
        dosen_nama: formData.dosen_nama,
        tanggal: formData.tanggal,
        waktu: formData.waktu,
        bab_topik: formData.bab_topik.trim(),
        catatan_mahasiswa: formData.catatan_mahasiswa.trim(),
        file_revisi_url: formData.file_revisi_url.trim()
      });

      setIsSubmitting(false);
      if (onSaved) onSaved('Catatan bimbingan berhasil diperbarui!');
      onClose();

    } catch (err) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Gagal memperbarui catatan bimbingan.');
    }
  };

  return (
    <div 
      data-lenis-prevent
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto overscroll-contain animate-in fade-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        data-lenis-prevent
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
              <Edit3 className="w-3 h-3 text-amber-600" />
              <span>Edit Catatan Bimbingan</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Ubah Catatan &amp; Link Dokumen
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Info Dosen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Dosen Pembimbing</label>
              <input
                type="text"
                readOnly
                value={`${formData.pembimbing} - ${formData.dosen_nama}`}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-700 bg-slate-50"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Tanggal &amp; Waktu</label>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  name="tanggal"
                  value={formData.tanggal}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-white"
                />
                <input
                  type="time"
                  name="waktu"
                  value={formData.waktu}
                  onChange={handleChange}
                  className="w-28 px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Bab / Topik */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">
              Bab / Topik Bimbingan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="bab_topik"
              value={formData.bab_topik}
              onChange={handleChange}
              placeholder="Contoh: Bab 1 - Pendahuluan & Latar Belakang"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          {/* Catatan Mahasiswa */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">
              Catatan Progres Mahasiswa <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="catatan_mahasiswa"
              value={formData.catatan_mahasiswa}
              onChange={handleChange}
              rows={4}
              placeholder="Tuliskan poin-poin progres konsultasi terbaru..."
              className="w-full p-3 rounded-xl border border-slate-300 font-medium text-slate-900 bg-white leading-relaxed focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          {/* Link Google Drive / Dokumen */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700">
                Link Dokumen Draf / Google Drive (Opsional)
              </label>
              <span className="text-[11px] text-slate-400">Google Drive, Docs, dsb.</span>
            </div>

            <div className="relative">
              <input
                type="url"
                name="file_revisi_url"
                value={formData.file_revisi_url}
                onChange={handleChange}
                placeholder="https://drive.google.com/... atau https://docs.google.com/..."
                className="w-full pl-9 pr-12 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-900 bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-100 outline-none"
              />
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              
              {formData.file_revisi_url && (
                <a
                  href={formData.file_revisi_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-colors"
                  title="Uji buka link"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Cek</span>
                </a>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              💡 Pastikan akses link Google Drive telah diset ke <em>"Anyone with the link / Siapa saja yang memiliki link"</em> agar dosen pembimbing dapat membukanya.
            </p>
          </div>

          {/* Form Controls */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/30 flex items-center space-x-2 disabled:opacity-75 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Menyimpan Perubahan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
