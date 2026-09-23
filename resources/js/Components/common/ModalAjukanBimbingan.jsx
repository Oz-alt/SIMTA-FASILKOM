import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  X, 
  Calendar, 
  Clock, 
  BookOpen, 
  Link2, 
  AlertCircle, 
  Loader2, 
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export default function ModalAjukanBimbingan({ isOpen, onClose }) {
  const { currentUser, studentAdvisors, advisors, addConsultation } = useAuth();

  // Dynamic Dospem 1 & 2 assigned for current logged-in student
  const sa = useMemo(() => {
    return studentAdvisors?.find(s => currentUser?.nim && String(s.student_nim).trim() === String(currentUser.nim).trim());
  }, [studentAdvisors, currentUser]);

  const dospem1 = useMemo(() => sa ? advisors?.find(a => a.nip === sa.dospem1_nip) : null, [advisors, sa]);
  const dospem2 = useMemo(() => sa ? advisors?.find(a => a.nip === sa.dospem2_nip) : null, [advisors, sa]);

  const dospem1Nama = dospem1?.nama || 'Dosen Pembimbing 1';
  const dospem2Nama = dospem2?.nama || 'Dosen Pembimbing 2';

  const [formData, setFormData] = useState({
    pembimbing: 'Pembimbing 1',
    dosen_nama: dospem1Nama,
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '09:00',
    bab_topik: '',
    catatan_mahasiswa: '',
    file_revisi_url: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Synchronize dynamic advisor names when student changes selection or state updates
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      dosen_nama: prev.pembimbing === 'Pembimbing 2' ? dospem2Nama : dospem1Nama
    }));
  }, [dospem1Nama, dospem2Nama]);

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

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'pembimbing') {
      const isPemb2 = value === 'Pembimbing 2';
      setFormData(prev => ({
        ...prev,
        pembimbing: value,
        dosen_nama: isPemb2 ? dospem2Nama : dospem1Nama
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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
      await addConsultation({
        pembimbing: formData.pembimbing,
        dosen_nama: formData.dosen_nama,
        tanggal: formData.tanggal,
        waktu: formData.waktu,
        bab_topik: formData.bab_topik.trim(),
        catatan_mahasiswa: formData.catatan_mahasiswa.trim(),
        file_revisi_url: formData.file_revisi_url.trim()
      });

      setIsSubmitting(false);
      onClose();

    } catch (err) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Gagal mengajukan bimbingan.');
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
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200">
              <BookOpen className="w-3 h-3" />
              <span>Sesi Bimbingan Baru</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Catat Sesi Bimbingan &amp; Tautan Dokumen
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
          
          {/* 1. Pilih Pembimbing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Pilih Pembimbing *</label>
              <select
                name="pembimbing"
                value={formData.pembimbing}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-white"
              >
                <option value="Pembimbing 1">Pembimbing 1 (Utama)</option>
                <option value="Pembimbing 2">Pembimbing 2 (Pendamping)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Nama Dosen Pembimbing</label>
              <input
                type="text"
                readOnly
                value={formData.dosen_nama}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-700 bg-slate-50"
              />
            </div>
          </div>

          {/* 2. Tanggal & Waktu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Tanggal Bimbingan *</label>
              <div className="relative">
                <input
                  type="date"
                  name="tanggal"
                  value={formData.tanggal}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-white"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Waktu Bimbingan *</label>
              <div className="relative">
                <input
                  type="time"
                  name="waktu"
                  value={formData.waktu}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-white"
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* 3. Bab / Topik Consultation */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">
              Bab / Topik Bimbingan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="bab_topik"
              value={formData.bab_topik}
              onChange={handleChange}
              placeholder="Ketik Bab atau Topik Bimbingan (misal: Bab 4 - Hasil & Pembahasan)"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          {/* 4. Catatan Mahasiswa */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">
              Catatan Konsultasi &amp; Poin Progres *
            </label>
            <textarea
              name="catatan_mahasiswa"
              value={formData.catatan_mahasiswa}
              onChange={handleChange}
              rows={4}
              placeholder="Tuliskan poin-poin yang dikonsultasikan atau pertanyaan untuk pembimbing..."
              className="w-full p-3 rounded-xl border border-slate-300 font-medium text-slate-900 bg-white leading-relaxed focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          {/* 5. Link Google Drive / Dokumen Draf */}
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
                className="w-full pl-9 pr-12 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-900 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
              />
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              
              {formData.file_revisi_url && (
                <a
                  href={formData.file_revisi_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-colors"
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
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/30 flex items-center space-x-2 disabled:opacity-75 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Sesi Bimbingan</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
