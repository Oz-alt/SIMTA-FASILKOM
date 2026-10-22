import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  X, 
  BookOpen, 
  AlertCircle, 
  Loader2, 
  CheckCircle2,
  Edit3,
  Link2,
  ExternalLink,
  Building2,
  Video,
  Info
} from 'lucide-react';

function getNextDateString(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatIndoDate(dateStr) {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export default function ModalEditBimbingan({ isOpen, onClose, consultation, onSaved }) {
  const { consultations, updateConsultation } = useAuth();

  const studentNim = String(consultation?.mhs_nim || '').trim();

  // Cari tanggal bimbingan sebelumnya untuk mahasiswa ini
  const precedingBimbinganDate = useMemo(() => {
    if (!consultation || !studentNim) return null;

    // Filter konsultasi mahasiswa selain yang sedang diedit
    const studentCons = (consultations || [])
      .filter(c => String(c.mhs_nim || '').trim() === studentNim && c.id !== consultation.id && c.status !== 'ditolak')
      .sort((a, b) => (a.tanggal || '').localeCompare(b.tanggal || ''));

    // Cari sesi yang tanggalnya lebih awal dari sesi yang diedit
    const earlier = studentCons.filter(c => c.tanggal && c.tanggal < (consultation.tanggal || '9999-99-99'));
    if (earlier.length > 0) {
      return earlier[earlier.length - 1].tanggal;
    }
    return null;
  }, [consultations, consultation, studentNim]);

  const minAllowedDate = useMemo(() => {
    return precedingBimbinganDate ? getNextDateString(precedingBimbinganDate) : '';
  }, [precedingBimbinganDate]);

  const [formData, setFormData] = useState({
    pembimbing: 'Pembimbing 1',
    dosen_nama: '',
    metode: 'luring',
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
        metode: consultation.metode || 'luring',
        tanggal: consultation.tanggal || '',
        waktu: consultation.waktu || '09:00',
        bab_topik: consultation.bab_topik || '',
        catatan_mahasiswa: consultation.catatan_mahasiswa || consultation.bab_topik || '',
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
    if (name === 'tanggal' && precedingBimbinganDate && value && value <= precedingBimbinganDate) {
      setErrorMsg(`Tanggal bimbingan harus lebih besar dari tanggal bimbingan sebelumnya (${formatIndoDate(precedingBimbinganDate)}). Minimal tanggal yang diizinkan adalah ${formatIndoDate(minAllowedDate)}.`);
    } else {
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.catatan_mahasiswa.trim()) {
      setErrorMsg('Catatan konsultasi & poin progres wajib diisi.');
      return;
    }

    if (precedingBimbinganDate && formData.tanggal <= precedingBimbinganDate) {
      setErrorMsg(`Tanggal bimbingan harus lebih besar dari tanggal bimbingan sebelumnya (${formatIndoDate(precedingBimbinganDate)}). Minimal tanggal yang diizinkan adalah ${formatIndoDate(minAllowedDate)}.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const catatanTrimmed = formData.catatan_mahasiswa.trim();
      const babTopikVal = catatanTrimmed.split('\n')[0].trim().slice(0, 100) || catatanTrimmed;

      await updateConsultation(consultation.id, {
        pembimbing: formData.pembimbing,
        dosen_nama: formData.dosen_nama,
        metode: formData.metode || 'luring',
        tanggal: formData.tanggal,
        waktu: formData.waktu,
        bab_topik: babTopikVal,
        catatan_mahasiswa: catatanTrimmed,
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
              <label className="font-bold text-slate-700">Tanggal &amp; Waktu *</label>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  name="tanggal"
                  value={formData.tanggal}
                  onChange={handleChange}
                  min={minAllowedDate || undefined}
                  className={`w-full px-3 py-2 rounded-xl border font-semibold text-slate-900 bg-white ${
                    precedingBimbinganDate && formData.tanggal && formData.tanggal <= precedingBimbinganDate
                      ? 'border-rose-400 ring-2 ring-rose-200'
                      : 'border-slate-300'
                  }`}
                />
                <input
                  type="time"
                  name="waktu"
                  value={formData.waktu}
                  onChange={handleChange}
                  className="w-28 px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-white"
                />
              </div>
              {precedingBimbinganDate && (
                <div className="flex items-start space-x-1.5 text-[11px] text-slate-500 pt-0.5">
                  <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    Bimbingan sebelumnya: <strong className="text-slate-700">{formatIndoDate(precedingBimbinganDate)}</strong> (minimal <strong className="text-amber-700">{formatIndoDate(minAllowedDate)}</strong>).
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Metode Bimbingan (Daring / Luring) */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span>Metode Bimbingan <span className="text-rose-500">*</span></span>
              <span className="text-[11px] font-normal text-slate-400">Pilih opsi pelaksanaan konsultasi</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, metode: 'luring' }))}
                className={`flex items-center space-x-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  formData.metode === 'luring'
                    ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 text-amber-900 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  formData.metode === 'luring' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs flex items-center space-x-1.5">
                    <span>Luring (Tatap Muka)</span>
                    {formData.metode === 'luring' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">Di Kampus / Ruang Dosen</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, metode: 'daring' }))}
                className={`flex items-center space-x-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  formData.metode === 'daring'
                    ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-900 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  formData.metode === 'daring' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Video className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs flex items-center space-x-1.5">
                    <span>Daring (Online)</span>
                    {formData.metode === 'daring' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">Zoom / Meet / WhatsApp</div>
                </div>
              </button>
            </div>
          </div>

          {/* Catatan Konsultasi & Poin Progres */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">
              Catatan Konsultasi &amp; Poin Progres <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="catatan_mahasiswa"
              value={formData.catatan_mahasiswa}
              onChange={handleChange}
              rows={4}
              placeholder="Tuliskan bab/topik pembahasan, poin-poin yang dikonsultasikan, atau pertanyaan untuk pembimbing..."
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
