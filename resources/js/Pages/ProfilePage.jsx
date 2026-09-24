import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  User, 
  Mail, 
  CreditCard, 
  Phone, 
  GraduationCap, 
  ShieldCheck, 
  Camera, 
  Edit3, 
  Save, 
  X, 
  CheckCircle2, 
  Loader2, 
  Lock,
  Upload
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabase.js';

export default function ProfilePage() {
  const { currentUser, updateUserProfile, departments } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    nama: currentUser?.nama || '',
    no_hp: currentUser?.no_hp || '',
    prodi: currentUser?.prodi || 'D3 Manajemen Informatika',
    kelas: currentUser?.kelas || 'MI 5A'
  });

  const roleLabels = {
    mahasiswa: { label: 'Mahasiswa', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    kaprodi: { label: 'Dosen / Kaprodi', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
    admin_sarana: { label: 'Admin Sarana & Prasarana', badge: 'bg-purple-100 text-purple-800 border-purple-200' }
  };

  const currentRole = roleLabels[currentUser?.role] || roleLabels.mahasiswa;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStartEdit = () => {
    setFormData({
      nama: currentUser?.nama || '',
      no_hp: currentUser?.no_hp || '',
      prodi: currentUser?.prodi || 'D3 Manajemen Informatika',
      kelas: currentUser?.kelas || 'MI 5A'
    });
    setIsEditing(true);
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrorMsg('');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      setErrorMsg('Nama lengkap tidak boleh kosong.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await updateUserProfile({
        nama: formData.nama.trim(),
        no_hp: formData.no_hp.trim(),
        prodi: formData.prodi,
        kelas: formData.kelas.trim()
      });

      setIsSaving(false);
      setIsEditing(false);
      setSuccessMsg('Profil berhasil diperbarui!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setIsSaving(false);
      setErrorMsg(err.message || 'Gagal memperbarui profil.');
    }
  };

  // Upload Avatar Photo to Supabase Storage Bucket ('avatars')
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('File harus berupa gambar (JPG, PNG, atau WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran file foto maksimal 5 MB.');
      return;
    }

    setIsUploadingPhoto(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let avatarUrl = '';

      // 1. Try Supabase Storage Upload if configured
      if (isSupabaseConfigured && supabase) {
        const fileExt = file.name.split('.').pop();
        const fileName = `avatar-${currentUser?.id || Date.now()}-${Date.now()}.${fileExt}`;
        const filePath = `user-avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { upsert: true });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          avatarUrl = publicUrlData.publicUrl;
        } else {
          console.warn('Supabase storage upload fallback to Local DataURL:', uploadError.message);
        }
      }

      // 2. Local DataURL Fallback if Storage Bucket is offline or pending
      if (!avatarUrl) {
        avatarUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      }

      await updateUserProfile({ avatar_url: avatarUrl });
      setIsUploadingPhoto(false);
      setSuccessMsg('Foto profil berhasil diunggah!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setIsUploadingPhoto(false);
      setErrorMsg(err.message || 'Gagal mengunggah foto profil.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Alert Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in shadow-2xs">
          <X className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header Banner Card with Interactive Avatar Upload */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          
          {/* Avatar Photo Circle with Upload Trigger */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white font-extrabold text-3xl flex items-center justify-center shadow-md overflow-hidden border-2 border-white">
              {currentUser?.avatar_url ? (
                <img 
                  src={currentUser.avatar_url} 
                  alt={currentUser.nama} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{currentUser?.nama?.charAt(0) || 'U'}</span>
              )}

              {/* Uploading Spinner */}
              {isUploadingPhoto && (
                <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              )}
            </div>

            {/* Hidden File Input */}
            <input 
              type="file"
              id="avatar-file-input"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {/* Camera Overlay Button */}
            <label
              htmlFor="avatar-file-input"
              className="absolute -bottom-1.5 -right-1.5 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center border-2 border-white hover:scale-105"
              title="Ganti Foto Profil (Upload Ke Supabase Storage)"
            >
              <Camera className="w-4 h-4" />
            </label>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{currentUser?.nama}</h1>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${currentRole.badge}`}>
                {currentRole.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">{currentUser?.email || (currentUser?.nim ? `${currentUser.nim}@student.unsri.ac.id` : '-')}</p>
            <div className="text-[11px] text-slate-400 font-medium pt-0.5 flex items-center space-x-1">
              <span>Fakultas Ilmu Komputer • Universitas Sriwijaya</span>
            </div>
          </div>

        </div>

        {/* Action Toggle Button: Edit / Batal */}
        <div>
          {!isEditing ? (
            <button
              onClick={handleStartEdit}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center space-x-2 cursor-pointer shrink-0"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profil</span>
            </button>
          ) : (
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center space-x-2 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
              <span>Batal Edit</span>
            </button>
          )}
        </div>

      </div>

      {/* User Profile Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>Informasi Profil Akun</span>
          </h2>

          <div className="text-[11px] text-slate-400 font-medium">
            {isEditing ? 'Mode Pengeditan Aktif' : 'Mode Tampilan'}
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            
            {/* 1. Nama Lengkap */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Nama Lengkap {!isEditing ? '' : '*'}
              </span>
              {isEditing ? (
                <div className="relative">
                  <input
                    type="text"
                    name="nama"
                    value={formData.nama}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs font-semibold text-slate-900 bg-white transition-all outline-none"
                    placeholder="Masukkan nama lengkap Anda..."
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-slate-900 font-semibold pt-0.5">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>{currentUser?.nama}</span>
                </div>
              )}
            </div>

            {/* 2. NIM / NIP (Read-Only Identity Key) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {currentUser?.role === 'mahasiswa' ? 'NIM (Nomor Induk Mahasiswa)' : 'NIP / ID Pegawai'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Terkunci</span>
                </span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700 font-semibold pt-0.5">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span>{currentUser?.nim || currentUser?.nip || '09010182428002'}</span>
              </div>
            </div>

            {/* 3. Email (Read-Only Identity Key) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Resmi</span>
                <span className="text-[10px] text-slate-400 font-medium flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Terkunci</span>
                </span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700 font-semibold pt-0.5">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{currentUser?.email || (currentUser?.nim ? `${currentUser.nim}@student.unsri.ac.id` : '-')}</span>
              </div>
            </div>

            {/* 4. No. WhatsApp */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">No. HP / WhatsApp</span>
              {isEditing ? (
                <div className="relative">
                  <input
                    type="tel"
                    name="no_hp"
                    value={formData.no_hp}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs font-semibold text-slate-900 bg-white transition-all outline-none"
                    placeholder="Contoh: 081278901234"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-slate-900 font-semibold pt-0.5">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{currentUser?.no_hp || '081278901234'}</span>
                </div>
              )}
            </div>

            {/* 5. Program Studi (Prodi) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Program Studi (Prodi)</span>
              {isEditing ? (
                <div className="relative">
                  <select
                    name="prodi"
                    value={formData.prodi}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs font-semibold text-slate-900 bg-white transition-all outline-none cursor-pointer"
                  >
                    {departments && departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-slate-900 font-semibold pt-0.5">
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                  <span>{currentUser?.prodi || 'D3 Manajemen Informatika'}</span>
                </div>
              )}
            </div>

            {/* 6. Kelas Mahasiswa */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kelas Mahasiswa</span>
              {isEditing ? (
                <div className="relative">
                  <input
                    type="text"
                    name="kelas"
                    value={formData.kelas}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs font-semibold text-slate-900 bg-white transition-all outline-none"
                    placeholder="Contoh: MI 5A, TI 3B"
                  />
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-slate-900 font-semibold pt-0.5">
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                  <span>{currentUser?.kelas || 'MI 5A'}</span>
                </div>
              )}
            </div>


          </div>

          {/* Submit Button when in Edit Mode */}
          {isEditing && (
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          )}

        </form>

      </div>

    </div>
  );
}
