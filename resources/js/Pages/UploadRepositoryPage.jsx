import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  UploadCloud, 
  FileText, 
  User, 
  GraduationCap, 
  BookOpen, 
  Tag, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowLeft,
  X,
  FileCheck,
  FileCode
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabase.js';

export default function UploadRepositoryPage() {
  const navigate = (url) => router.visit(url);
  const { currentUser, uploadThesisRepository, departments } = useAuth();

  const [formData, setFormData] = useState({
    judul: '',
    abstrak: '',
    abstrak_en: '',
    pembimbing_1: 'Dr. Ir. Hendra Kusuma, M.T. (NIP. 197805122005011002)',
    pembimbing_2: 'Siti Nurhaliza, S.Kom., M.Kom. (NIP. 198804102015042001)',
    penguji_1: 'Prof. Dr. Ir. Ahmad Zaki, M.Sc.',
    penguji_2: 'Rina Kartika, S.T., M.T.',
    kata_kunci: '',
    tahun_angkatan: '2022',
    tahun_lulus: new Date().getFullYear().toString()
  });

  const [selectedPdfFile, setSelectedPdfFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setErrorMsg('Berkas laporan akhir harus berformat PDF (.pdf).');
      setSelectedPdfFile(null);
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Ukuran file PDF maksimal 15 MB.');
      setSelectedPdfFile(null);
      return;
    }

    setSelectedPdfFile(file);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.judul.trim()) {
      setErrorMsg('Judul lengkap Tugas Akhir wajib diisi.');
      return;
    }

    if (!formData.abstrak.trim() || formData.abstrak.trim().length < 30) {
      setErrorMsg('Abstrak bahasa Indonesia wajib diisi minimal 30 karakter.');
      return;
    }

    if (!formData.pembimbing_1.trim()) {
      setErrorMsg('Nama Dosen Pembimbing 1 wajib diisi.');
      return;
    }

    if (!selectedPdfFile) {
      setErrorMsg('Wajib mengunggah file Laporan Akhir TA berformat PDF.');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let pdfUrl = '';

      // 1. Try Supabase Storage upload to 'repository-docs' bucket
      if (isSupabaseConfigured && supabase) {
        const fileExt = selectedPdfFile.name.split('.').pop();
        const fileName = `laporan-ta-${currentUser?.nim || Date.now()}-${Date.now()}.${fileExt}`;
        const filePath = `laporan-akhir/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('repository-docs')
          .upload(filePath, selectedPdfFile, { upsert: true });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('repository-docs')
            .getPublicUrl(filePath);
          pdfUrl = publicUrlData.publicUrl;
        } else {
          console.warn('Supabase repository storage upload fallback to DataURL:', uploadError.message);
        }
      }

      // 2. DataURL Fallback if Storage Bucket is offline or pending
      if (!pdfUrl) {
        pdfUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(selectedPdfFile);
        });
      }

      const keywordsArray = formData.kata_kunci
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);

      await uploadThesisRepository({
        judul: formData.judul.trim(),
        abstrak: formData.abstrak.trim(),
        abstrak_en: formData.abstrak_en.trim(),
        pembimbing_1: formData.pembimbing_1.trim(),
        pembimbing_2: formData.pembimbing_2.trim(),
        penguji_1: formData.penguji_1.trim(),
        penguji_2: formData.penguji_2.trim(),
        kata_kunci: keywordsArray,
        tahun_angkatan: formData.tahun_angkatan,
        tahun_lulus: formData.tahun_lulus,
        file_pdf_url: pdfUrl
      });

      setIsUploading(false);
      setSuccessMsg('Laporan Akhir TA berhasil diunggah ke Repositori! Status: Menunggu Verifikasi Kaprodi & Publikasi Admin.');

    } catch (err) {
      setIsUploading(false);
      setErrorMsg(err.message || 'Gagal mengunggah laporan repositori.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 select-none">
      
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/thesis/archive"
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Arsip Tugas Akhir</span>
        </Link>
      </div>

      {/* Header Title Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Form Unggah Repositori TA Mahasiswa</span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Unggah Laporan Akhir Tugas Akhir
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed mt-1">
            Unggah berkas Laporan Akhir TA berformat PDF beserta abstrak dan data pembimbing.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form Submission */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        
        {/* 1. Identity Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mahasiswa Penulis</span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{currentUser?.nama || 'Aulia Azzahra'}</p>
            <p className="text-slate-500 font-medium">NIM: {currentUser?.nim || '09010182428002'}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Program Studi</span>
            <p className="font-bold text-blue-700 mt-0.5">{currentUser?.prodi || 'D3 Manajemen Informatika'}</p>
            <p className="text-slate-500 font-medium">Kelas: {currentUser?.kelas || 'MI 5A'}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tahun Angkatan *</span>
            <input
              type="text"
              name="tahun_angkatan"
              value={formData.tahun_angkatan}
              onChange={handleChange}
              placeholder="Contoh: 2022"
              className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-900 bg-white text-xs"
            />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tahun Kelulusan *</span>
            <input
              type="text"
              name="tahun_lulus"
              value={formData.tahun_lulus}
              onChange={handleChange}
              placeholder="Contoh: 2026"
              className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-900 bg-white text-xs"
            />
          </div>
        </div>

        {/* 2. Judul Lengkap TA */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-900">
            Judul Lengkap Tugas Akhir <span className="text-rose-500">*</span>
          </label>
          <textarea
            name="judul"
            value={formData.judul}
            onChange={handleChange}
            rows={3}
            placeholder="Tuliskan judul lengkap Tugas Akhir yang telah diuji dan disetujui..."
            className="w-full p-3.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm font-semibold text-slate-900 bg-white transition-all outline-none leading-relaxed"
          />
        </div>

        {/* 3. Dosen Pembimbing & Penguji Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900">
              Dosen Pembimbing 1 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="pembimbing_1"
              value={formData.pembimbing_1}
              onChange={handleChange}
              placeholder="Nama & Gelar Pembimbing 1..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900">Dosen Pembimbing 2</label>
            <input
              type="text"
              name="pembimbing_2"
              value={formData.pembimbing_2}
              onChange={handleChange}
              placeholder="Nama & Gelar Pembimbing 2 (Opsional)..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900">Dosen Penguji 1</label>
            <input
              type="text"
              name="penguji_1"
              value={formData.penguji_1}
              onChange={handleChange}
              placeholder="Nama & Gelar Penguji 1..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900">Dosen Penguji 2</label>
            <input
              type="text"
              name="penguji_2"
              value={formData.penguji_2}
              onChange={handleChange}
              placeholder="Nama & Gelar Penguji 2..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
            />
          </div>

        </div>

        {/* 4. Abstrak Bahasa Indonesia */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-900">
            Abstrak (Bahasa Indonesia) <span className="text-rose-500">*</span>
          </label>
          <textarea
            name="abstrak"
            value={formData.abstrak}
            onChange={handleChange}
            rows={5}
            placeholder="Tuliskan isi abstrak ringkasan Laporan Akhir TA Anda dalam Bahasa Indonesia..."
            className="w-full p-3.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs text-slate-800 bg-white transition-all outline-none leading-relaxed"
          />
        </div>

        {/* 5. Abstrak Bahasa Inggris */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-900">Abstract (English - Opsional)</label>
          <textarea
            name="abstrak_en"
            value={formData.abstrak_en}
            onChange={handleChange}
            rows={4}
            placeholder="Write abstract summary in English..."
            className="w-full p-3.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs text-slate-800 bg-white transition-all outline-none leading-relaxed italic"
          />
        </div>

        {/* 6. Kata Kunci / Keywords */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-900">Kata Kunci (Keywords)</label>
          <input
            type="text"
            name="kata_kunci"
            value={formData.kata_kunci}
            onChange={handleChange}
            placeholder="Pisahkan dengan koma. Contoh: ReactJS, Geolocation, Supabase, Presensi"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
          />
        </div>

        {/* 7. PDF File Picker Upload */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-900 block">
            Upload File Laporan Akhir (PDF) <span className="text-rose-500">*</span>
          </label>

          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-blue-500 transition-colors bg-slate-50/50">
            <input
              type="file"
              id="pdf-file-upload"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <label htmlFor="pdf-file-upload" className="cursor-pointer space-y-2 block">
              <UploadCloud className="w-8 h-8 text-blue-600 mx-auto" />
              {selectedPdfFile ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900">{selectedPdfFile.name}</p>
                  <p className="text-[11px] text-emerald-600 font-semibold">
                    {(selectedPdfFile.size / (1024 * 1024)).toFixed(2)} MB • Berkas PDF Siap Diunggah
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">Klik untuk memilih file Laporan PDF</p>
                  <p className="text-[11px] text-slate-400 font-medium">Format .pdf • Ukuran Maksimal 15 MB</p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <Link
            href="/thesis/archive"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
          >
            Batal
          </Link>

          <button
            type="submit"
            disabled={isUploading}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Mengunggah Ke Repositori...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Upload &amp; Publikasikan Laporan TA</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
}
