import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  X, 
  UploadCloud, 
  Calendar, 
  Clock, 
  BookOpen, 
  UserCheck, 
  FileText, 
  AlertCircle, 
  Loader2, 
  CheckCircle2 
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabase.js';

export default function ModalAjukanBimbingan({ isOpen, onClose }) {
  const { currentUser, addConsultation } = useAuth();

  const [formData, setFormData] = useState({
    pembimbing: 'Pembimbing 1',
    dosen_nama: 'Dr. Ir. Hendra Kusuma, M.T.',
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '09:00',
    bab_topik: '',
    catatan_mahasiswa: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'pembimbing') {
      const isPemb2 = value === 'Pembimbing 2';
      setFormData(prev => ({
        ...prev,
        pembimbing: value,
        dosen_nama: isPemb2 ? 'Siti Nurhaliza, S.Kom., M.Kom.' : 'Dr. Ir. Hendra Kusuma, M.T.'
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setErrorMsg('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      setErrorMsg('Berkas revisi harus berformat PDF (.pdf) atau Word (.docx).');
      setSelectedFile(null);
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Ukuran file maksimal 15 MB.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
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
      let fileUrl = '';

      if (selectedFile) {
        // 1. Try Supabase Storage upload to 'bimbingan-docs'
        if (isSupabaseConfigured && supabase) {
          const fileExt = selectedFile.name.split('.').pop();
          const fileName = `revisi-${currentUser?.nim || Date.now()}-${Date.now()}.${fileExt}`;
          const filePath = `bimbingan/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('bimbingan-docs')
            .upload(filePath, selectedFile, { upsert: true });

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from('bimbingan-docs')
              .getPublicUrl(filePath);
            fileUrl = publicUrlData.publicUrl;
          }
        }

        // 2. DataURL Fallback if Storage Bucket is offline or pending
        if (!fileUrl) {
          fileUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(selectedFile);
          });
        }
      }

      await addConsultation({
        pembimbing: formData.pembimbing,
        dosen_nama: formData.dosen_nama,
        tanggal: formData.tanggal,
        waktu: formData.waktu,
        bab_topik: formData.bab_topik.trim(),
        catatan_mahasiswa: formData.catatan_mahasiswa.trim(),
        file_revisi_url: fileUrl
      });

      setIsSubmitting(false);
      onClose();

    } catch (err) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Gagal mengajukan bimbingan.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in select-none">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200">
              <BookOpen className="w-3 h-3" />
              <span>Sesi Bimbingan Baru</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Catat Sesi Bimbingan &amp; Upload Revisi
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
              className="w-full p-3 rounded-xl border border-slate-300 font-medium text-slate-900 bg-white leading-relaxed"
            />
          </div>

          {/* 5. Upload File Revisi (PDF / DOCX) */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="font-bold text-slate-700 block">
              Upload Dokumen Draf / Revisi (Opsional, PDF/DOCX)
            </label>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-blue-500 transition-colors bg-slate-50/50">
              <input
                type="file"
                id="consultation-file-input"
                accept=".pdf,.docx,.doc"
                onChange={handleFileChange}
                className="hidden"
              />

              <label htmlFor="consultation-file-input" className="cursor-pointer space-y-1 block">
                <UploadCloud className="w-6 h-6 text-blue-600 mx-auto" />
                {selectedFile ? (
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{selectedFile.name}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • File Siap Dilampirkan
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-slate-800 text-xs">Pilih Berkas PDF atau Word</p>
                    <p className="text-[10px] text-slate-400">Maksimal ukuran file 15 MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Form Controls */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/30 flex items-center space-x-2 disabled:opacity-75"
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
