import React, { useState, useEffect } from 'react';
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
  Upload,
  MessageCircle,
  ExternalLink,
  Link2,
  AlertTriangle,
  Copy,
  Check
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

  // State untuk Pengelolaan Tautan WhatsApp Group Bimbingan (Dosen / Kaprodi)
  const isDosenOrKaprodi = currentUser?.role === 'dosen' || currentUser?.role === 'kaprodi';
  const [waLinkInput, setWaLinkInput] = useState(currentUser?.link_wa_group || '');
  const [savedWaLink, setSavedWaLink] = useState(currentUser?.link_wa_group || '');
  const [isSavingWa, setIsSavingWa] = useState(false);
  const [waError, setWaError] = useState('');
  const [waSuccess, setWaSuccess] = useState('');
  const [copiedWa, setCopiedWa] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const link = currentUser.link_wa_group || '';
      setWaLinkInput(link);
      setSavedWaLink(link);
    }
  }, [currentUser?.id, currentUser?.link_wa_group, currentUser?.nip]);

  const roleLabels = {
    mahasiswa: { label: 'Mahasiswa', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    dosen: { label: 'Dosen Pembimbing', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    kaprodi: { label: 'Dosen / Kaprodi', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
    admin_sarana: { label: 'Admin Sarana & Prasarana', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
    admin: { label: 'Admin SIMTA', badge: 'bg-amber-100 text-amber-800 border-amber-200' }
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

  // Validasi URL Tautan WhatsApp Grup resmi
  const validateWhatsAppUrl = (rawUrl) => {
    if (!rawUrl || !rawUrl.trim()) {
      return { valid: false, error: 'Tautan grup WhatsApp tidak boleh kosong.' };
    }
    let url = rawUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      const isWaHost = 
        host === 'chat.whatsapp.com' || 
        host === 'wa.me' || 
        host === 'api.whatsapp.com' ||
        host.endsWith('.whatsapp.com');

      if (!isWaHost) {
        return {
          valid: false,
          error: 'Format tautan tidak valid. Gunakan format tautan WhatsApp resmi seperti https://chat.whatsapp.com/... atau https://wa.me/...'
        };
      }

      if (host === 'chat.whatsapp.com' && (!parsed.pathname || parsed.pathname.length <= 1)) {
        return {
          valid: false,
          error: 'Tautan grup WhatsApp harus menyertakan kode undangan grup (contoh: https://chat.whatsapp.com/GrupBimbingan).'
        };
      }

      return { valid: true, formattedUrl: url };
    } catch {
      return {
        valid: false,
        error: 'Format URL tautan tidak valid. Periksa kembali tautan yang dimasukkan.'
      };
    }
  };

  // Simpan tautan WhatsApp grup ke profil dosen & database
  const handleSaveWaLink = async (e) => {
    if (e) e.preventDefault();
    setWaError('');
    setWaSuccess('');

    const validation = validateWhatsAppUrl(waLinkInput);
    if (!validation.valid) {
      setWaError(validation.error);
      return;
    }

    setIsSavingWa(true);
    try {
      await updateUserProfile({
        link_wa_group: validation.formattedUrl
      });
      setSavedWaLink(validation.formattedUrl);
      setWaLinkInput(validation.formattedUrl);
      setWaSuccess('Tautan grup WhatsApp bimbingan berhasil disimpan dan terhubung ke akun Anda!');
      setTimeout(() => setWaSuccess(''), 4500);
    } catch (err) {
      setWaError(err.message || 'Gagal menyimpan tautan grup WhatsApp.');
    } finally {
      setIsSavingWa(false);
    }
  };

  // Buka grup WhatsApp di tab baru
  const handleOpenWaGroup = () => {
    const targetUrl = savedWaLink || waLinkInput;
    if (!targetUrl) return;
    const validation = validateWhatsAppUrl(targetUrl);
    if (validation.valid) {
      window.open(validation.formattedUrl, '_blank', 'noopener,noreferrer');
    } else {
      setWaError('Tautan belum valid untuk dibuka. Silakan periksa tautan WhatsApp yang dimasukkan.');
    }
  };

  // Salin tautan ke clipboard
  const handleCopyWaLink = () => {
    const targetUrl = savedWaLink || waLinkInput;
    if (!targetUrl) return;
    try {
      navigator.clipboard.writeText(targetUrl);
      setCopiedWa(true);
      setTimeout(() => setCopiedWa(false), 2000);
    } catch {}
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

            {/* 6. Kelas / Jabatan Akademik */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {currentUser?.role === 'mahasiswa' ? 'Kelas Mahasiswa' : 'Jabatan / Peran Akademik'}
              </span>
              {isEditing ? (
                <div className="relative">
                  <input
                    type="text"
                    name="kelas"
                    value={formData.kelas}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs font-semibold text-slate-900 bg-white transition-all outline-none"
                    placeholder={currentUser?.role === 'mahasiswa' ? 'Contoh: MI 5A, TI 3B' : 'Contoh: Dosen Pembimbing'}
                  />
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-slate-900 font-semibold pt-0.5">
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                  <span>{currentUser?.kelas || (currentUser?.role === 'mahasiswa' ? 'MI 5A' : 'Dosen Pembimbing')}</span>
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

      {/* ── WhatsApp Group Link Management (Khusus Dosen Pembimbing & Kaprodi) ── */}
      {isDosenOrKaprodi && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span>Tautan Grup WhatsApp Bimbingan</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Kelola tautan grup WhatsApp untuk mahasiswa bimbingan Tugas Akhir Anda. Tautan ini akan otomatis ditampilkan pada dashboard mahasiswa bimbingan yang telah ditugaskan.
              </p>
            </div>

            {/* Status Badge */}
            <div className="shrink-0">
              {savedWaLink ? (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tautan Aktif & Terhubung</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tautan Belum Diatur</span>
                </span>
              )}
            </div>
          </div>

          {/* Alert Status Notification */}
          {waSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{waSuccess}</span>
            </div>
          )}

          {waError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in shadow-2xs">
              <X className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{waError}</span>
            </div>
          )}

          {/* Notice jika tautan belum pernah diatur */}
          {!savedWaLink ? (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start space-x-3 text-xs text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Tautan Grup Belum Diatur</span>
                <p className="text-amber-800/90 leading-relaxed">
                  Tautan grup WhatsApp bimbingan Anda belum diatur. Mahasiswa bimbingan Anda memerlukan tautan ini agar dapat bergabung ke grup koordinasi bimbingan di dashboard mereka. Silakan masukkan tautan grup WhatsApp bimbingan Anda pada formulir di bawah ini.
                </p>
              </div>
            </div>
          ) : (
            /* Current Saved Link Preview Card */
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                <span className="font-bold uppercase tracking-wider text-slate-500">
                  Tautan Tersimpan Saat Ini
                </span>
                <span className="text-slate-500">
                  Terhubung ke akun: <strong className="text-slate-800 font-semibold">{currentUser?.nama}</strong> (NIP: {currentUser?.nip || currentUser?.nim || '-'})
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center space-x-2.5 overflow-hidden text-xs text-slate-800 font-mono">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Link2 className="w-4 h-4" />
                  </div>
                  <span className="truncate select-all font-medium text-slate-900">{savedWaLink}</span>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyWaLink}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                    title="Salin tautan ke clipboard"
                  >
                    {copiedWa ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenWaGroup}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer"
                    title="Buka / Bergabung ke Grup WhatsApp di tab baru"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka / Gabung Grup</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form Input & Save Controls */}
          <form onSubmit={handleSaveWaLink} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="wa-group-url" className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>{savedWaLink ? 'Perbarui Tautan Grup WhatsApp' : 'Masukkan Tautan Grup WhatsApp Baru'}</span>
              </label>
              
              <div className="relative">
                <input
                  id="wa-group-url"
                  type="text"
                  value={waLinkInput}
                  onChange={(e) => {
                    setWaLinkInput(e.target.value);
                    if (waError) setWaError('');
                  }}
                  placeholder="https://chat.whatsapp.com/GrupBimbinganTA-NamaDosen"
                  className="w-full pl-9 pr-24 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-xs font-semibold text-slate-900 bg-white transition-all outline-none"
                />
                <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                
                {waLinkInput && waLinkInput !== savedWaLink && (
                  <button
                    type="button"
                    onClick={() => {
                      setWaLinkInput(savedWaLink);
                      setWaError('');
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 hover:text-slate-600 px-2 py-0.5 rounded cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Format yang diperbolehkan: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">https://chat.whatsapp.com/KodeUndangan</code> atau <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">https://wa.me/...</code>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="text-[11px] text-slate-400 font-medium max-w-md">
                Tautan tersimpan secara khusus pada akun dosen Anda (NIP: {currentUser?.nip || currentUser?.nim || '-'}) dan otomatis terisolasi agar tidak tertukar dengan dosen lain.
              </div>

              <div className="flex items-center space-x-2.5">
                {(savedWaLink || waLinkInput) && (
                  <button
                    type="button"
                    onClick={handleOpenWaGroup}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span>Uji Buka Tautan</span>
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSavingWa || !waLinkInput.trim() || waLinkInput.trim() === savedWaLink}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingWa ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Tautan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
