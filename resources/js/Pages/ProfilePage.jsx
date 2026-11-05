import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePage, router } from '@inertiajs/react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  User, 
  Mail, 
  CreditCard, 
  Phone, 
  GraduationCap, 
  ShieldCheck, 
  ShieldAlert,
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
  Check,
  Eye,
  EyeOff,
  KeyRound,
  ArrowRight
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabase.js';
import { getStudentCredential } from '../services/studentCredentials.js';
import { isValidNonDummyPhone } from '../lib/whatsappHelper.js';

export default function ProfilePage() {
  const { currentUser, updateUserProfile, departments, advisors } = useAuth();
  const { url } = usePage();

  const isMahasiswa = currentUser?.role === 'mahasiswa';
  const isPendingProfile = isMahasiswa && !currentUser?.is_profile_completed;
  const isFirstLogin = isPendingProfile || (typeof url === 'string' && url.includes('first_login'));

  const [isEditing, setIsEditing] = useState(() => isFirstLogin || false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Password setup state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCompletedSuccess, setIsCompletedSuccess] = useState(false);

  const JABATAN_FUNGSIONAL_OPTIONS = [
    'Lektor Kepala',
    'Lektor',
    'Asisten Ahli',
    'Tenaga Pengajar',
    'Staff'
  ];

  // Temukan data dosen di Data Master Dosen (yang dikelola Kaprodi / Admin)
  const matchedAdvisor = useMemo(() => {
    if (!currentUser || currentUser.role !== 'dosen') return null;
    const uNip = String(currentUser.nip || currentUser.nim || '').trim();
    const uEmail = String(currentUser.email || '').trim().toLowerCase();
    return (advisors || []).find(a =>
      (uNip && String(a.nip || '').trim() === uNip) ||
      (uEmail && String(a.email || '').trim().toLowerCase() === uEmail)
    ) || null;
  }, [currentUser, advisors]);

  const resolveStudentAngkatan = (user) => {
    if (!user || !user.is_profile_completed) return '';
    const val = String(user.kelas || '').trim();
    if (!val || val === '-' || val === 'MI 5A' || val === 'MI 5B') return '';
    return val.replace(/^MI\s+/i, '').trim();
  };

  // Resolusi jabatan fungsional: Sumber kebenaran utama adalah yang diset Kaprodi / Admin di Data Master Dosen
  const resolvedJabatan = useMemo(() => {
    if (isMahasiswa) return resolveStudentAngkatan(currentUser);
    if (matchedAdvisor?.jabatan_fungsional && matchedAdvisor.jabatan_fungsional !== 'Dosen Pembimbing') {
      return matchedAdvisor.jabatan_fungsional;
    }
    if (currentUser?.jabatan_fungsional && currentUser.jabatan_fungsional !== 'Dosen Pembimbing') {
      return currentUser.jabatan_fungsional;
    }
    if (currentUser?.kelas && currentUser.kelas !== 'Dosen Pembimbing') {
      return currentUser.kelas;
    }
    return 'Asisten Ahli';
  }, [currentUser, matchedAdvisor, isMahasiswa]);

  const resolvedKeilmuan = useMemo(() => {
    if (currentUser?.keilmuan) return currentUser.keilmuan;
    if (currentUser?.keahlian) {
      return Array.isArray(currentUser.keahlian) ? currentUser.keahlian.join(', ') : currentUser.keahlian;
    }
    if (matchedAdvisor?.keahlian) {
      return Array.isArray(matchedAdvisor.keahlian) ? matchedAdvisor.keahlian.join(', ') : matchedAdvisor.keahlian;
    }
    return '';
  }, [currentUser, matchedAdvisor]);

  const [formData, setFormData] = useState({
    nama: currentUser?.nama || '',
    no_hp: currentUser?.no_hp && currentUser?.no_hp !== '-' ? currentUser.no_hp : '',
    prodi: currentUser?.prodi || 'D3 Manajemen Informatika',
    kelas: isMahasiswa ? resolveStudentAngkatan(currentUser) : resolvedJabatan,
    jabatan_fungsional: resolvedJabatan,
    keilmuan: resolvedKeilmuan
  });

  useEffect(() => {
    if (isFirstLogin) {
      setIsEditing(true);
    }
  }, [isFirstLogin]);

  // Otomatis sinkronkan profil mahasiswa dari Supabase jika nomor HP belum terisi di sesi lokal saat ini
  useEffect(() => {
    let isMounted = true;
    if (isMahasiswa && currentUser?.nim && (!currentUser.no_hp || currentUser.no_hp === '-')) {
      getStudentCredential(currentUser.nim, { fresh: true }).then(cred => {
        if (!isMounted || !cred) return;
        const phone = cred.noHp || cred.no_hp;
        if (phone && isValidNonDummyPhone(phone)) {
          updateUserProfile({
            no_hp: phone,
            is_profile_completed: true,
            ...(cred.nama ? { nama: cred.nama } : {}),
            ...(cred.kelas ? { kelas: cred.kelas } : {}),
            ...(cred.prodi ? { prodi: cred.prodi } : {})
          });
          setIsEditing(false);
        }
      }).catch(() => {});
    }
    return () => { isMounted = false; };
  }, [isMahasiswa, currentUser?.nim, currentUser?.no_hp]);

  // State untuk Pengelolaan Tautan WhatsApp Group Bimbingan (Khusus Dosen Pembimbing)
  const isDosen = currentUser?.role === 'dosen';
  const [waLinkInput, setWaLinkInput] = useState(isDosen ? (currentUser?.link_wa_group || '') : '');
  const [savedWaLink, setSavedWaLink] = useState(isDosen ? (currentUser?.link_wa_group || '') : '');
  const [isEditingWa, setIsEditingWa] = useState(false);
  const [isSavingWa, setIsSavingWa] = useState(false);
  const [waError, setWaError] = useState('');
  const [waSuccess, setWaSuccess] = useState('');
  const [copiedWa, setCopiedWa] = useState(false);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'dosen') {
        const link = currentUser.link_wa_group || '';
        setWaLinkInput(link);
        setSavedWaLink(link);
      } else {
        setWaLinkInput('');
        setSavedWaLink('');
      }
      setFormData({
        nama: currentUser.nama || '',
        no_hp: currentUser.no_hp && currentUser.no_hp !== '-' ? currentUser.no_hp : '',
        prodi: currentUser.prodi || 'D3 Manajemen Informatika',
        kelas: isMahasiswa ? resolveStudentAngkatan(currentUser) : resolvedJabatan,
        jabatan_fungsional: resolvedJabatan,
        keilmuan: resolvedKeilmuan
      });
    }
  }, [currentUser?.id, currentUser?.link_wa_group, currentUser?.nip, currentUser?.nim, currentUser?.role, currentUser?.no_hp, currentUser?.kelas, currentUser?.is_profile_completed, resolvedJabatan, resolvedKeilmuan, isMahasiswa]);

  const roleLabels = {
    mahasiswa: { label: 'Mahasiswa', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    dosen: { label: 'Dosen Pembimbing', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    kaprodi: { label: 'Dosen / Kaprodi', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
    admin: { label: 'Admin SIMONITA', badge: 'bg-amber-100 text-amber-800 border-amber-200' }
  };

  const currentRole = roleLabels[currentUser?.role] || roleLabels.mahasiswa;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStartEdit = () => {
    setFormData({
      nama: currentUser?.nama || '',
      no_hp: currentUser?.no_hp && currentUser?.no_hp !== '-' ? currentUser.no_hp : '',
      prodi: currentUser?.prodi || 'D3 Manajemen Informatika',
      kelas: isMahasiswa ? resolveStudentAngkatan(currentUser) : resolvedJabatan,
      jabatan_fungsional: resolvedJabatan,
      keilmuan: resolvedKeilmuan
    });
    setIsEditing(true);
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleCancelEdit = () => {
    if (isPendingProfile) {
      setErrorMsg('Anda wajib melengkapi profil dan mengatur kata sandi baru akun Anda.');
      return;
    }
    setIsEditing(false);
    setErrorMsg('');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      setErrorMsg('Nama lengkap tidak boleh kosong.');
      return;
    }

    if (isMahasiswa) {
      if (!formData.no_hp.trim()) {
        setErrorMsg('Nomor HP / WhatsApp aktif wajib diisi.');
        return;
      }
      const digitsOnly = formData.no_hp.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        setErrorMsg('Nomor WhatsApp harus valid minimal 10 digit (contoh: 081234567890).');
        return;
      }
      if (!formData.kelas.trim()) {
        setErrorMsg('Angkatan mahasiswa wajib diisi (contoh: MI 2024).');
        return;
      }

    }

    // Password requirement for ALL roles (Mahasiswa, Dosen, Kaprodi, Admin)
    const hasPasswordInput = Boolean(newPassword.trim() || confirmPassword.trim());
    if (isPendingProfile || hasPasswordInput) {
      if (!newPassword.trim()) {
        setErrorMsg('Kata sandi baru wajib diisi untuk keamanan akun Anda.');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMsg('Kata sandi baru minimal harus 6 karakter.');
        return;
      }
      if (isMahasiswa && currentUser?.nim && newPassword.trim() === currentUser.nim.trim()) {
        setErrorMsg('Kata sandi baru tidak boleh sama dengan NIM Anda. Gunakan kata sandi yang lebih aman.');
        return;
      }
      const userNipVal = String(currentUser?.nip || (!isMahasiswa ? currentUser?.nim : '') || '').trim();
      if (!isMahasiswa && userNipVal && newPassword.trim() === userNipVal) {
        setErrorMsg('Kata sandi baru tidak boleh sama dengan NIP Anda. Gunakan kata sandi yang lebih aman.');
        return;
      }
      if (currentUser?.role === 'kaprodi' && newPassword.trim().toLowerCase() === 'koprodi123') {
        setErrorMsg('Kata sandi baru tidak boleh sama dengan kata sandi bawaan.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('Konfirmasi kata sandi tidak cocok. Silakan periksa kembali.');
        return;
      }
    }

    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        nama: formData.nama.trim(),
        no_hp: formData.no_hp.trim(),
        prodi: formData.prodi,
        kelas: isMahasiswa ? formData.kelas.trim() : (formData.jabatan_fungsional || formData.kelas || '').trim(),
        jabatan_fungsional: isMahasiswa ? '' : (formData.jabatan_fungsional || '').trim(),
        keilmuan: isDosen ? (formData.keilmuan || '').trim() : undefined
      };

      if (isMahasiswa) {
        payload.is_profile_completed = true;
      }
      if (newPassword.trim()) {
        payload.password = newPassword.trim();
      }

      await updateUserProfile(payload);
      setIsSaving(false);
      setIsEditing(false);
      if (isMahasiswa) {
        setIsCompletedSuccess(true);
      }
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMsg(newPassword.trim()
        ? (isMahasiswa ? 'Profil dan kata sandi baru berhasil disimpan! Akun Anda kini aktif sepenuhnya.' : 'Profil dan kata sandi baru akun Anda berhasil disimpan!')
        : (isMahasiswa ? 'Profil dan data akun berhasil disimpan!' : 'Profil berhasil diperbarui!')
      );

      if (isFirstLogin && isMahasiswa) {
        setTimeout(() => {
          router.visit('/dashboard');
        }, 2200);
      }
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
      setIsEditingWa(false);
      setWaSuccess('Tautan grup WhatsApp bimbingan berhasil disimpan!');
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

  // Photo Link & Interactive Crop Modal state
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoLinkInput, setPhotoLinkInput] = useState('');
  const [processedPhotoUrl, setProcessedPhotoUrl] = useState('');
  const [isProcessingLink, setIsProcessingLink] = useState(false);
  const [photoModalError, setPhotoModalError] = useState('');
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [naturalImgSize, setNaturalImgSize] = useState({ width: 300, height: 300 });
  const cropImgRef = useRef(null);
  const CROP_BOX_SIZE = 240;

  // Normalisasi URL gambar (mendukung Google Drive share link, Dropbox, maupun direct image link)
  const normalizeExternalImageUrl = (rawUrl) => {
    let url = String(rawUrl || '').trim();
    if (!url) return '';
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image/')) {
      url = 'https://' + url;
    }

    // Konversi Google Drive share link menjadi direct image link
    const gdriveMatch =
      url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/) ||
      url.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
    if (gdriveMatch && gdriveMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${gdriveMatch[1]}=w1000`;
    }

    // Konversi Dropbox link
    if (url.includes('dropbox.com') && url.includes('?dl=0')) {
      return url.replace('?dl=0', '?raw=1');
    }

    return url;
  };

  const handleOpenPhotoModal = () => {
    setPhotoModalError('');
    const existingUrl = currentUser?.avatar_url && !currentUser.avatar_url.startsWith('data:image/')
      ? currentUser.avatar_url
      : '';
    setPhotoLinkInput(existingUrl);
    setProcessedPhotoUrl('');
    setCropZoom(1);
    setCropOffset({ x: 0, y: 0 });
    setIsPhotoModalOpen(true);
  };

  const handleProcessPhotoLink = (e) => {
    if (e) e.preventDefault();
    setPhotoModalError('');

    const normalized = normalizeExternalImageUrl(photoLinkInput);
    if (!normalized) {
      setPhotoModalError('Masukkan tautan (link) foto terlebih dahulu.');
      return;
    }

    try {
      if (!normalized.startsWith('data:image/')) {
        new URL(normalized);
      }
    } catch {
      setPhotoModalError('Format link foto tidak valid. Pastikan diawali https://');
      return;
    }

    setIsProcessingLink(true);
    setCropZoom(1);
    setCropOffset({ x: 0, y: 0 });

    // Gunakan proxy CORS agar gambar dari domain mana pun bisa dimuat dan di-crop ke Canvas
    const proxyUrl = normalized.startsWith('data:image/')
      ? normalized
      : `https://images.weserv.nl/?url=${encodeURIComponent(normalized.replace(/^https?:\/\//, ''))}&w=1200&output=jpg`;

    const testImg = new Image();
    testImg.crossOrigin = 'anonymous';
    testImg.onload = () => {
      setNaturalImgSize({
        width: testImg.naturalWidth || 300,
        height: testImg.naturalHeight || 300
      });
      setProcessedPhotoUrl(proxyUrl);
      setIsProcessingLink(false);
    };
    testImg.onerror = () => {
      // Fallback: coba load URL asli secara langsung jika proxy gagal
      const directImg = new Image();
      directImg.onload = () => {
        setNaturalImgSize({
          width: directImg.naturalWidth || 300,
          height: directImg.naturalHeight || 300
        });
        setProcessedPhotoUrl(normalized);
        setIsProcessingLink(false);
      };
      directImg.onerror = () => {
        setIsProcessingLink(false);
        setPhotoModalError('Gagal memuat gambar dari link tersebut. Pastikan link foto bersifat publik dan dapat diakses.');
      };
      directImg.src = normalized;
    };
    testImg.src = proxyUrl;
  };

  // Handler drag / geser posisi foto di area crop
  const handleCropPointerDown = (e) => {
    if (!processedPhotoUrl) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setIsDraggingCrop(true);
    setDragStartPos({
      x: clientX - cropOffset.x,
      y: clientY - cropOffset.y
    });
  };

  const handleCropPointerMove = (e) => {
    if (!isDraggingCrop) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setCropOffset({
      x: clientX - dragStartPos.x,
      y: clientY - dragStartPos.y
    });
  };

  const handleCropPointerUp = () => {
    setIsDraggingCrop(false);
  };

  // Hitung dimensi render dasar agar gambar menutupi kotak CROP_BOX_SIZE (object-cover base)
  const baseRenderDims = useMemo(() => {
    const { width, height } = naturalImgSize;
    if (!width || !height) return { w: CROP_BOX_SIZE, h: CROP_BOX_SIZE };
    const scale = Math.max(CROP_BOX_SIZE / width, CROP_BOX_SIZE / height);
    return {
      w: width * scale,
      h: height * scale
    };
  }, [naturalImgSize]);

  // Simpan hasil crop ke profil pengguna
  const handleSaveCroppedPhoto = async () => {
    if (!processedPhotoUrl) {
      setPhotoModalError('Silakan masukkan link foto dan klik "Proses Link" terlebih dahulu.');
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoModalError('');
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let finalAvatarUrl = processedPhotoUrl;

      // Render hasil crop & zoom ke Canvas 300x300
      try {
        const imgEl = new Image();
        imgEl.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          imgEl.onload = resolve;
          imgEl.onerror = reject;
          imgEl.src = processedPhotoUrl;
        });

        const OUTPUT_SIZE = 300;
        const canvas = document.createElement('canvas');
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        const ctx = canvas.getContext('2d');

        const ratio = OUTPUT_SIZE / CROP_BOX_SIZE;
        const drawW = baseRenderDims.w * cropZoom * ratio;
        const drawH = baseRenderDims.h * cropZoom * ratio;
        const drawX = (OUTPUT_SIZE - drawW) / 2 + cropOffset.x * ratio;
        const drawY = (OUTPUT_SIZE - drawH) / 2 + cropOffset.y * ratio;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
        ctx.drawImage(imgEl, drawX, drawY, drawW, drawH);

        finalAvatarUrl = canvas.toDataURL('image/jpeg', 0.88);
      } catch (canvasErr) {
        // Jika CORS memblokir export canvas, simpan URL gambar langsung
        console.warn('Canvas crop fallback to direct URL:', canvasErr);
        finalAvatarUrl = normalizeExternalImageUrl(photoLinkInput) || processedPhotoUrl;
      }

      await updateUserProfile({ avatar_url: finalAvatarUrl });
      setIsUploadingPhoto(false);
      setIsPhotoModalOpen(false);
      setSuccessMsg('Foto profil berhasil diproses dan disimpan!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setIsUploadingPhoto(false);
      setPhotoModalError(err.message || 'Gagal menyimpan foto profil.');
    }
  };

  const handleRemovePhoto = async () => {
    setIsUploadingPhoto(true);
    try {
      await updateUserProfile({ avatar_url: '' });
      setIsUploadingPhoto(false);
      setIsPhotoModalOpen(false);
      setSuccessMsg('Foto profil berhasil dihapus.');
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setIsUploadingPhoto(false);
      setPhotoModalError(err.message || 'Gagal menghapus foto profil.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* First-Time Setup Required Banner for Mahasiswa */}
      {isMahasiswa && (isPendingProfile || (isFirstLogin && !isCompletedSuccess)) && (
        <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 shadow-sm animate-in fade-in space-y-3">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5 shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-sm text-amber-950">
                  Pengaturan Profil & Keamanan Akun Mahasiswa (Wajib Dilengkapi)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 uppercase tracking-wide border border-amber-300">
                  Aktivasi Pertama Kali
                </span>
              </div>
              <p className="text-xs text-amber-900/90 leading-relaxed">
                Halo <strong>{currentUser?.nama}</strong>, akun Anda saat ini terdeteksi masih menggunakan kredensial bawaan (kata sandi default NIM). Demi keamanan data akademik dan privasi proses bimbingan Tugas Akhir Anda di SIMTA, Anda diwajibkan melengkapi nomor WhatsApp aktif, angkatan mahasiswa, serta membuat <strong>kata sandi baru</strong> Anda.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Completion Success Celebration Banner */}
      {isMahasiswa && isCompletedSuccess && (
        <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 shadow-sm animate-in fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="font-extrabold text-sm text-emerald-950 block">
                Selamat! Profil & Kata Sandi Berhasil Dikonfigurasi
              </span>
              <p className="text-xs text-emerald-800">
                {isMahasiswa
                  ? 'Akun mahasiswa Anda kini telah aktif sepenuhnya. Seluruh modul dan menu SIMTA siap digunakan.'
                  : 'Profil Anda telah berhasil disimpan. Seluruh modul dan menu SIMTA siap digunakan.'
                }
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.visit('/dashboard')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center space-x-2 cursor-pointer shrink-0"
          >
            <span>Menuju Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
      
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
          
          {/* Avatar Photo Circle with Link + Crop Modal Trigger */}
          <div className="relative group shrink-0">
            <div
              onClick={handleOpenPhotoModal}
              className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white font-extrabold text-3xl flex items-center justify-center shadow-md overflow-hidden border-2 border-white cursor-pointer"
              title="Klik untuk mengubah foto profil via Link & Crop"
            >
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

            {/* Camera Overlay Button */}
            <button
              type="button"
              onClick={handleOpenPhotoModal}
              className="absolute -bottom-1.5 -right-1.5 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center border-2 border-white hover:scale-105"
              title="Atur Foto Profil dari Link & Crop"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{currentUser?.nama}</h1>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${currentRole.badge}`}>
                {currentRole.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">{currentUser?.email || (currentUser?.nim ? `${currentUser.nim}@student.unsri.ac.id` : '-')}</p>
            <div className="text-[11px] text-slate-400 font-medium pt-0.5 flex flex-wrap items-center gap-2">
              <span>Fakultas Ilmu Komputer • Universitas Sriwijaya</span>
              <button
                type="button"
                onClick={handleOpenPhotoModal}
                className="inline-flex items-center space-x-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-0.5 rounded-lg border border-blue-200 transition-colors cursor-pointer"
              >
                <Link2 className="w-3 h-3" />
                <span>Ubah Foto via Link</span>
              </button>
            </div>
          </div>

        </div>

        {/* Action Toggle Button: Edit / Batal */}
        <div>
          {isPendingProfile ? (
            <div key="btn-pending" className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold flex items-center space-x-1.5 shadow-2xs">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Aktivasi Wajib</span>
            </div>
          ) : !isEditing ? (
            <button
              key="btn-edit"
              type="button"
              onClick={handleStartEdit}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center space-x-2 cursor-pointer shrink-0"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profil</span>
            </button>
          ) : (
            <button
              key="btn-cancel"
              type="button"
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
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                No. HP / WhatsApp {isMahasiswa && isEditing && <span className="text-rose-500">*</span>}
              </span>
              {isEditing ? (
                <div className="relative">
                  <input
                    type="tel"
                    name="no_hp"
                    value={formData.no_hp}
                    onChange={handleChange}
                    required={isMahasiswa}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs font-semibold text-slate-900 bg-white transition-all outline-none"
                    placeholder="Contoh: 081278901234"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-slate-900 font-semibold pt-0.5">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{currentUser?.no_hp && currentUser.no_hp !== '-' ? currentUser.no_hp : <span className="text-slate-400 font-normal italic">Belum diisi</span>}</span>
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

            {/* 6. Angkatan Mahasiswa / Jabatan Fungsional */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {isMahasiswa ? 'Angkatan Mahasiswa' : 'Jabatan Fungsional'} {isMahasiswa && isEditing && <span className="text-rose-500">*</span>}
              </span>
              {isEditing ? (
                isMahasiswa ? (
                  <div className="relative">
                    <input
                      type="text"
                      name="kelas"
                      value={formData.kelas}
                      onChange={handleChange}
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs font-semibold text-slate-900 bg-white transition-all outline-none"
                      placeholder="Masukkan angkatan (contoh: 2024 / MI 2024)"
                    />
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      name="jabatan_fungsional"
                      value={formData.jabatan_fungsional}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs font-semibold text-slate-900 bg-white transition-all outline-none appearance-none"
                    >
                      <option value="">-- Pilih Jabatan Fungsional --</option>
                      {JABATAN_FUNGSIONAL_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                )
              ) : (
                <div className="flex items-center space-x-2 text-slate-900 font-semibold pt-0.5">
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                  <span>
                    {isMahasiswa
                      ? (resolveStudentAngkatan(currentUser) || <span className="text-slate-400 font-normal italic">Belum diisi</span>)
                      : resolvedJabatan}
                  </span>
                </div>
              )}
            </div>

            {/* 6b. Keilmuan — khusus Dosen */}
            {isDosen && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bidang Keilmuan</span>
                {isEditing ? (
                  <div className="relative">
                    <input
                      type="text"
                      name="keilmuan"
                      value={formData.keilmuan}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs font-semibold text-slate-900 bg-white transition-all outline-none"
                      placeholder="Contoh: Rekayasa Perangkat Lunak, Sistem Informasi"
                    />
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-slate-900 font-semibold pt-0.5">
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    <span>{currentUser?.keilmuan || (currentUser?.keahlian ? (Array.isArray(currentUser.keahlian) ? currentUser.keahlian.join(', ') : currentUser.keahlian) : '—')}</span>
                  </div>
                )}
              </div>
            )}

            {/* 7. Pengaturan Keamanan Kata Sandi Baru (Mahasiswa, Dosen, Kaprodi, Admin) */}
            <div className="col-span-1 md:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-blue-100/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100/80 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Keamanan Akun: {isPendingProfile ? 'Buat Kata Sandi Baru (Wajib Diatur)' : 'Ubah Kata Sandi Akun'}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {isPendingProfile 
                        ? 'Akun masih menggunakan kata sandi default NIM. Tentukan kata sandi baru untuk mengamankan akun Anda.' 
                        : 'Kosongkan kolom ini jika Anda tidak ingin mengubah kata sandi.'}
                    </p>
                  </div>
                </div>
                {isPendingProfile && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wide shrink-0">
                    Wajib Diisi
                  </span>
                )}
              </div>

              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Input Kata Sandi Baru */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Kata Sandi Baru {isPendingProfile && <span className="text-rose-500">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (errorMsg) setErrorMsg('');
                        }}
                        placeholder={isPendingProfile ? "Minimal 6 karakter (bukan NIM)..." : (isMahasiswa ? "Minimal 6 karakter (bukan NIM)..." : (currentUser?.nip ? "Minimal 6 karakter (bukan NIP)..." : "Masukkan kata sandi baru..."))}
                        className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs font-semibold text-slate-900 bg-white transition-all outline-none"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Input Konfirmasi Kata Sandi Baru */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Konfirmasi Kata Sandi Baru {isPendingProfile && <span className="text-rose-500">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errorMsg) setErrorMsg('');
                        }}
                        placeholder="Ulangi kata sandi baru..."
                        className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs font-semibold text-slate-900 bg-white transition-all outline-none"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-2 text-[11px] text-slate-500 flex items-center space-x-1.5 pt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Kata sandi minimal 6 karakter {isMahasiswa ? 'dan tidak boleh menggunakan NIM Anda.' : (currentUser?.nip ? 'dan tidak boleh menggunakan NIP Anda.' : '.')}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-slate-700 bg-white/80 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center space-x-2 font-mono">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>•••••••••••• (Tersimpan Aman)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                  >
                    Ubah Kata Sandi
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Submit Button when in Edit Mode */}
          {isEditing && (
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              {!isPendingProfile && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                disabled={isSaving}
                className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed ${
                  isPendingProfile 
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30' 
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
                }`}
              >
                {isSaving ? (
                  <span key="state-saving" className="inline-flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Menyimpan...</span>
                  </span>
                ) : (
                  <span key="state-idle" className="inline-flex items-center space-x-2">
                    <Save className="w-4 h-4" />
                    <span>{isPendingProfile ? 'Simpan & Aktifkan Akun Mahasiswa' : 'Simpan Perubahan'}</span>
                  </span>
                )}
              </button>
            </div>
          )}

        </form>

      </div>

      {/* ── WhatsApp Group Link Management (Khusus Dosen Pembimbing) ── */}
      {isDosen && (
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

          {/* Mode 1: Edit Mode (Inline Form saat tombol Pensil Edit ditekan) */}
          {isEditingWa ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                <span className="font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{savedWaLink ? 'Edit Tautan Grup WhatsApp' : 'Atur Tautan Grup WhatsApp'}</span>
                </span>
                <span className="text-slate-500">
                  Akun: <strong className="text-slate-800 font-semibold">{currentUser?.nama}</strong> (NIP: {currentUser?.nip || currentUser?.nim || '-'})
                </span>
              </div>

              <form onSubmit={handleSaveWaLink} className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={waLinkInput}
                      onChange={(e) => {
                        setWaLinkInput(e.target.value);
                        if (waError) setWaError('');
                      }}
                      placeholder="https://chat.whatsapp.com/GrupBimbinganTA-NamaDosen"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-xs font-semibold text-slate-900 bg-white outline-none"
                      autoFocus
                    />
                    <Link2 className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setWaLinkInput(savedWaLink || '');
                        setIsEditingWa(false);
                        setWaError('');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Batal</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isSavingWa || !waLinkInput.trim()}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingWa ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Simpan</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 font-medium">
                  Format yang didukung: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">https://chat.whatsapp.com/KodeUndangan</code> atau <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">https://wa.me/...</code>
                </p>
              </form>
            </div>
          ) : (
            /* Mode 2: Display View Mode (Tampilan Bersih Tautan) */
            <>
              {!savedWaLink ? (
                /* Notice jika belum pernah diatur */
                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-amber-900">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold block">Tautan Grup Belum Diatur</span>
                      <p className="text-amber-800/90 leading-relaxed">
                        Tautan grup WhatsApp bimbingan Anda belum diatur. Mahasiswa bimbingan Anda memerlukan tautan ini agar dapat bergabung ke grup koordinasi bimbingan di dashboard mereka.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setWaLinkInput('');
                      setIsEditingWa(true);
                      setWaError('');
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer shrink-0"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Atur Tautan</span>
                  </button>
                </div>
              ) : (
                /* Kartu Tautan Tersimpan Saat Ini */
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
                      {/* Tombol Salin */}
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

                      {/* Tombol Edit dengan Ikon Pensil */}
                      <button
                        type="button"
                        onClick={() => {
                          setWaLinkInput(savedWaLink);
                          setIsEditingWa(true);
                          setWaError('');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                        title="Edit tautan grup WhatsApp"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                        <span>Edit</span>
                      </button>

                      {/* Tombol Buka Grup (buka grup langsung di tab baru) */}
                      <button
                        type="button"
                        onClick={handleOpenWaGroup}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer"
                        title="Buka Grup WhatsApp di tab baru"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Grup</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal Input Link Foto Profil & Crop Interaktif */}
      {isPhotoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onMouseMove={handleCropPointerMove}
          onMouseUp={handleCropPointerUp}
          onMouseLeave={handleCropPointerUp}
          onTouchMove={handleCropPointerMove}
          onTouchEnd={handleCropPointerUp}
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Atur Foto Profil dari Link</h3>
                  <p className="text-[11px] text-slate-500">Masukkan tautan gambar, proses, lalu sesuaikan & crop</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Alert Error di dalam Modal */}
              {photoModalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{photoModalError}</span>
                </div>
              )}

              {/* Step 1: Input Link Foto + Tombol Proses */}
              <form onSubmit={handleProcessPhotoLink} className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Tautan / Link Foto (URL Gambar atau Google Drive Publik)
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={photoLinkInput}
                      onChange={(e) => {
                        setPhotoLinkInput(e.target.value);
                        if (photoModalError) setPhotoModalError('');
                      }}
                      placeholder="https://contoh.com/foto.jpg atau link Google Drive..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs font-medium text-slate-900 bg-white outline-none transition-all"
                    />
                    <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <button
                    type="submit"
                    disabled={isProcessingLink}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer shrink-0 disabled:opacity-60 flex items-center space-x-1.5"
                  >
                    {isProcessingLink ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <span>Proses Link</span>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Mendukung link gambar langsung (.jpg, .png, .webp), Imgur, Postimages, maupun link Google Drive (akses publik).
                </p>
              </form>

              {/* Step 2: Area Preview & Interactive Crop */}
              {processedPhotoUrl ? (
                <div className="space-y-4 pt-1">
                  <div className="flex flex-col items-center space-y-2">
                    <span className="text-[11px] font-semibold text-slate-600">
                      Geser foto di bawah untuk mengatur posisi wajah Anda:
                    </span>

                    {/* Kotak Crop 240x240 */}
                    <div
                      onMouseDown={handleCropPointerDown}
                      onTouchStart={handleCropPointerDown}
                      style={{ width: `${CROP_BOX_SIZE}px`, height: `${CROP_BOX_SIZE}px` }}
                      className="relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-blue-500 shadow-inner cursor-move select-none touch-none flex items-center justify-center"
                    >
                      <img
                        ref={cropImgRef}
                        src={processedPhotoUrl}
                        alt="Crop Preview"
                        draggable={false}
                        style={{
                          width: `${baseRenderDims.w * cropZoom}px`,
                          height: `${baseRenderDims.h * cropZoom}px`,
                          transform: `translate(${cropOffset.x}px, ${cropOffset.y}px)`,
                          maxWidth: 'none'
                        }}
                        className="pointer-events-none select-none object-cover"
                      />

                      {/* Garis bantu grid crop */}
                      <div className="absolute inset-0 pointer-events-none border border-white/25 rounded-2xl">
                        <div className="w-full h-1/3 border-b border-white/15" />
                        <div className="w-full h-1/3 border-b border-white/15" />
                      </div>
                      <div className="absolute inset-0 pointer-events-none flex">
                        <div className="w-1/3 h-full border-r border-white/15" />
                        <div className="w-1/3 h-full border-r border-white/15" />
                      </div>
                    </div>
                  </div>

                  {/* Kontrol Zoom & Reset */}
                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-600">Perbesar / Zoom ({Math.round(cropZoom * 100)}%)</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCropZoom(1);
                          setCropOffset({ x: 0, y: 0 });
                        }}
                        className="text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
                      >
                        Reset Posisi
                      </button>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.05"
                      value={cropZoom}
                      onChange={(e) => setCropZoom( parseFloat(e.target.value) )}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                </div>
              ) : (
                <div className="py-8 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">Belum Ada Foto yang Diproses</p>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Tempelkan link foto Anda pada kolom di atas lalu klik tombol <strong>Proses Link</strong> untuk mulai memotong (crop) foto.
                  </p>
                </div>
              )}

              {/* Footer Modal Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                {currentUser?.avatar_url ? (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={isUploadingPhoto}
                    className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Hapus Foto Saat Ini
                  </button>
                ) : <div />}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsPhotoModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCroppedPhoto}
                    disabled={!processedPhotoUrl || isUploadingPhoto}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingPhoto ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Simpan Hasil Crop</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
