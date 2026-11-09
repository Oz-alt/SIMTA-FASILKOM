import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, router } from '@inertiajs/react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  GraduationCap, 
  Bell, 
  User, 
  ChevronDown, 
  BookOpen, 
  CheckCircle2,
  Building2,
  Mail,
  Sparkles,
  ExternalLink,
  ArrowRight,
  AlertTriangle,
  X,
  KeyRound,
  Check,
  CheckCheck,
  Clock,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

import unsriLogo from '../../assets/photo/unsri logo.png';

/**
 * Format waktu notifikasi dinamis:
 * Berubah dari jam (< 24 jam), hari (1 - 6 hari), baru tanggal (>= 7 hari)
 */
export function formatRelativeTime(dateInput, now = new Date()) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.max(0, Math.floor(diffInMs / 1000));
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  // 1. Satuan Jam: jika dalam kurun waktu 24 jam (< 1 hari)
  if (diffInHours < 24) {
    if (diffInHours < 1) {
      if (diffInMinutes < 1) return 'baru saja';
      return `${diffInMinutes} menit yang lalu`;
    }
    return `${diffInHours} jam yang lalu`;
  }

  // 2. Satuan Hari: jika antara 1 sampai 6 hari yang lalu
  if (diffInDays < 7) {
    if (diffInDays === 1) return '1 hari yang lalu';
    return `${diffInDays} hari yang lalu`;
  }

  // 3. Satuan Tanggal: jika 7 hari atau lebih
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export default function Navbar() {
  const { 
    currentUser, 
    switchRole, 
    notifications = [], 
    passwordResetRequests = [],
    bookings = [],
    markAllNotificationsAsRead, 
    markNotificationAsRead 
  } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const notifRef = useRef(null);

  useEffect(() => {
    setAvatarError(false);
  }, [currentUser?.avatar_url]);

  // Status baca persisten untuk notifikasi sistem & admin
  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      const saved = localStorage.getItem('simta_read_notif_ids');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch {
      return new Set();
    }
  });

  const saveReadNotifIds = (newSet) => {
    setReadNotifIds(newSet);
    try {
      localStorage.setItem('simta_read_notif_ids', JSON.stringify(Array.from(newSet)));
    } catch {}
  };

  // Close floating notification popover on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotif(false);
      }
    }
    if (showNotif) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotif]);

  // Interval pembaruan waktu otomatis tanpa memuat ulang halaman
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Filter & bangun notifikasi dinamis berdasarkan aktivitas nyata dalam sistem
  const userNotifications = useMemo(() => {
    if (!currentUser) return [];

    // ============================================================
    // KHUSUS ROLE ADMIN: Data Notifikasi Terpadu dari Realitas Sistem
    // ============================================================
    if (currentUser.role === 'admin') {
      // 1. Permintaan Reset Password yang Menunggu Verifikasi
      const resetNotifs = (passwordResetRequests || [])
        .filter(r => r && r.status === 'menunggu')
        .map(r => ({
          id: `notif-reset-${r.id}`,
          source_type: 'password_reset',
          raw_data: r,
          title: 'Permintaan Reset Password Baru',
          message: `Terdapat 1 pengguna (${r.nama || 'Pengguna'} - ${r.nim || r.nip || r.role}) yang mengajukan pemulihan kata sandi dan menunggu verifikasi Admin.`,
          created_at: r.created_at || new Date().toISOString(),
          action_url: '/admin-simta/accounts/password-resets',
          action_label: 'Lihat Permintaan',
          badge_label: 'Reset Sandi',
          badge_color: 'bg-amber-100 text-amber-900 border-amber-300',
          icon_type: 'key',
          recipient_role: 'admin',
          is_read: readNotifIds.has(`notif-reset-${r.id}`)
        }));

      // 2. Pengajuan Peminjaman Ruang Sidang Menunggu Persetujuan Admin
      const bookingNotifs = (bookings || [])
        .filter(b => b && b.status === 'menunggu_persetujuan')
        .map(b => ({
          id: `notif-booking-${b.id}`,
          source_type: 'booking',
          raw_data: b,
          title: 'Pengajuan Peminjaman Ruang Sidang',
          message: `Peminjaman ruang ${b.room_name || 'Ruang Sidang'} oleh ${b.mhs_nama || b.mhs_nim || 'Mahasiswa'} (${b.booking_date || 'Terjadwal'}) menunggu persetujuan Admin.`,
          created_at: b.created_at || new Date().toISOString(),
          action_url: '/admin/bookings',
          action_label: 'Persetujuan Ruangan',
          badge_label: 'Sarana Sidang',
          badge_color: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          icon_type: 'building',
          recipient_role: 'admin',
          is_read: readNotifIds.has(`notif-booking-${b.id}`)
        }));

      // 3. Notifikasi Sistem Eksisting Bertarget Admin
      const existingAdminNotifs = (notifications || []).filter(n => {
        if (!n) return false;
        if (n.id === 'notif-1' || n.id === 'notif-2' || n.is_mock) return false;
        if (n.title === 'Judul TA Disetujui!' || n.title === 'Peminjaman Ruangan Disetujui') return false;
        return (
          n.recipient_role === 'admin' ||
          n.target_role === 'admin' ||
          String(n.profile_id) === String(currentUser.id) ||
          String(n.recipient_id) === String(currentUser.id)
        );
      }).map(n => ({
        ...n,
        is_read: Boolean(n.is_read || readNotifIds.has(String(n.id)))
      }));

      // Deduplikasi & Pengurutan Waktu Terkini (Hanya tampilkan yang belum dibaca)
      const seen = new Set();
      return [...resetNotifs, ...bookingNotifs, ...existingAdminNotifs]
        .filter(n => {
          if (!n || !n.id) return false;
          if (n.is_read || readNotifIds.has(String(n.id))) return false;
          if (seen.has(String(n.id))) return false;
          seen.add(String(n.id));
          return true;
        })
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }

    // ============================================================
    // ROLE KAPRODI, MAHASISWA, & DOSEN (Preserve 100% existing logic)
    // ============================================================
    return (notifications || []).filter(n => {
      if (!n) return false;
      if (n.is_read || readNotifIds.has(String(n.id))) return false;
      if (n.id === 'notif-1' || n.id === 'notif-2' || n.is_mock) return false;
      if (
        n.title === 'Judul TA Disetujui!' ||
        n.title === 'Peminjaman Ruangan Disetujui' ||
        n.title === 'Catatan Revisi Judul dari Dosen'
      ) {
        return false;
      }

      if (currentUser.role === 'kaprodi') {
        if (n.recipient_role === 'mahasiswa' || n.recipient_role === 'dosen') return false;
        if (
          String(n.id || '').endsWith('-mhs') ||
          n.title === 'Usulan Judul Disetujui (ACC) Dosen' ||
          n.title === 'Usulan Judul Disetujui Dosen Pembimbing'
        ) {
          return false;
        }
        if (n.related_type === 'bimbingan_status' || n.related_type === 'consultation' || n.related_type === 'bimbingan_reminder') {
          return false;
        }
        return (
          n.recipient_role === 'kaprodi' ||
          n.recipient_role === 'all' ||
          n.related_type === 'thesis_title' ||
          n.related_type === 'thesis_title_revised' ||
          n.related_type === 'thesis_title_cancelled' ||
          n.related_type === 'kaprodi_bimbingan_inactivity_alert' ||
          n.related_type === 'kaprodi_siap_sidang_alert' ||
          n.related_type === 'similarity_warning' ||
          n.related_type === 'kaprodi_monitoring'
        );
      }

      if (currentUser.role === 'mahasiswa') {
        // Pengingat kepatuhan bimbingan dari prodi adalah ranah monitoring untuk Dosen Pembimbing, bukan mahasiswa
        if (n.related_type === 'bimbingan_cadence_reminder' || n.related_type === 'kaprodi_bimbingan_inactivity_alert') {
          return false;
        }

        if (n.recipient_role && n.recipient_role !== 'mahasiswa' && n.recipient_role !== 'all') return false;

        const myNim = String(currentUser.nim || '').trim();
        const myId = String(currentUser.id || '').trim();

        if (n.recipient_nim && myNim) {
          return String(n.recipient_nim).trim() === myNim;
        }
        if (n.profile_id) {
          if (String(n.profile_id) === myId || String(n.profile_id) === myNim || String(n.profile_id) === `user-${myNim}`) {
            return true;
          }
          // Jika profile_id terisi tapi milik mahasiswa lain, jangan tampilkan
          return false;
        }
        if (n.student_nim && myNim) {
          return String(n.student_nim).trim() === myNim;
        }

        // Jangan tampilkan notifikasi tanpa sasaran mahasiswa yang spesifik
        return false;
      }

      if (currentUser.role === 'dosen') {
        if (n.recipient_role === 'mahasiswa' || n.recipient_role === 'kaprodi') return false;
        const cleanNip = String(currentUser.nip || currentUser.nim || '').trim();
        const cleanNama = (currentUser.nama || '').toLowerCase().replace(/dr\.|ir\.|prof\.|s\.kom\.|m\.cs\.|m\.t\.|m\.kom\.|ph\.d\.|st\.|s\.t\./gi, '').trim();

        if (n.recipient_nip && cleanNip && String(n.recipient_nip).trim() === cleanNip) {
          return true;
        }
        if (n.dosen_nama && cleanNama) {
          const cleanNotifNama = n.dosen_nama.toLowerCase().replace(/dr\.|ir\.|prof\.|s\.kom\.|m\.cs\.|m\.t\.|m\.kom\.|ph\.d\.|st\.|s\.t\./gi, '').trim();
          if (cleanNotifNama.includes(cleanNama) || cleanNama.includes(cleanNotifNama)) {
            return true;
          }
        }
        if (n.recipient_role === 'dosen') {
          return !n.recipient_nip || (cleanNip && String(n.recipient_nip).trim() === cleanNip);
        }
        return false;
      }

      return false;
    });
  }, [currentUser, notifications, passwordResetRequests, bookings, readNotifIds]);

  const unreadCount = userNotifications.length;

  const handleMarkSingleAsRead = (id) => {
    if (id && markNotificationAsRead) {
      markNotificationAsRead(id);
    }
    const next = new Set(readNotifIds);
    next.add(String(id));
    saveReadNotifIds(next);
  };

  const handleMarkAllAsRead = () => {
    if (markAllNotificationsAsRead) {
      markAllNotificationsAsRead(currentUser);
    }
    const next = new Set(readNotifIds);
    userNotifications.forEach(n => {
      if (n?.id) next.add(String(n.id));
    });
    saveReadNotifIds(next);
  };

  const handleNotificationItemClick = (n) => {
    handleMarkSingleAsRead(n.id);
    if (n.action_url) {
      setShowNotif(false);
      router.visit(n.action_url);
      return;
    }
    handleNotificationClick(n);
  };

  const roleBadges = {
    mahasiswa: { label: 'Mahasiswa', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: GraduationCap },
    kaprodi: { label: 'Kaprodi', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: BookOpen },
    dosen: { label: 'Dosen Pembimbing', color: 'bg-teal-100 text-teal-800 border-teal-300', icon: BookOpen },
    admin: { label: 'Admin SIMONITA', color: 'bg-rose-100 text-rose-800 border-rose-300', icon: Building2 }
  };

  const userRole = currentUser?.role || 'mahasiswa';
  const currentRoleBadge = roleBadges[userRole] || roleBadges.mahasiswa;
  const RoleIcon = currentRoleBadge.icon;

  const handleNotificationClick = (n) => {
    setShowNotif(false);
    if (n.id && markNotificationAsRead) {
      markNotificationAsRead(n.id);
    }

    // Arahkan dosen langsung ke validasi bimbingan mahasiswa yang bersangkutan atau ke progres monitoring
    if (userRole === 'dosen') {
      const isBimbingan = n.related_type === 'bimbingan_masuk' || 
                          n.related_type === 'consultation' || 
                          n.related_type === 'bimbingan_status' || 
                          n.related_type === 'bimbingan_reminder' || 
                          (n.action_url && (n.action_url.includes('/dosen/bimbingan') || n.action_url.includes('/dosen/validasi')));

      if (isBimbingan) {
        // Ambil NIM mahasiswa secara akurat dari properti notifikasi atau parse dari teks pesan
        const studentNim = n.mhs_nim || 
                           n.student_nim || 
                           (n.recipient_role !== 'dosen' ? n.recipient_nim : null) || 
                           (n.message ? n.message.match(/\((\d{8,})\)/)?.[1] : null);

        if (studentNim) {
          router.visit(`/dosen/validasi?nim=${studentNim}`);
          return;
        }
        router.visit('/dosen/monitoring');
        return;
      }

      if (n.related_type === 'defense_schedule' || n.related_type === 'defense') {
        router.visit('/dosen/jadwal-sidang');
        return;
      }
    }

    // 1. Prioritaskan action_url langsung jika ada
    if (n.action_url) {
      router.visit(n.action_url);
      return;
    }

    // 2. Notifikasi jadwal sidang
    if (n.related_type === 'defense_schedule' || n.related_type === 'defense') {
      if (userRole === 'dosen') {
        router.visit('/dosen/jadwal-sidang');
      } else if (userRole === 'kaprodi' || userRole === 'admin') {
        router.visit('/kaprodi/defense-schedules');
      } else {
        router.visit('/dosen/jadwal-sidang');
      }
      return;
    }

    // 3. Notifikasi bimbingan / konsultasi
    if (n.related_type === 'consultation' || n.related_type === 'bimbingan_status' || n.related_type === 'bimbingan_reminder') {
      router.visit('/thesis/consultations');
      return;
    }

    // 4. Judul TA
    if (n.related_id && (n.related_type === 'thesis_title' || n.related_type === 'thesis_title_revised')) {
      if (userRole === 'dosen') {
        router.visit('/dosen/validasi-judul');
      } else {
        router.visit(`/kaprodi/titles/${n.related_id}`);
      }
      return;
    }

    // 5. Booking
    if (n.related_type === 'booking') {
      router.visit('/booking/status');
      return;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 cursor-default select-none">
            <img 
              src={unsriLogo} 
              alt="Logo UNSRI" 
              className="h-10 w-auto object-contain pointer-events-none" 
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">SIMONITA</span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
                Sistem Monitoring Tugas Akhir
              </p>
            </div>
          </div>

          {/* Right Menu Controls */}
          <div className="flex items-center space-x-3 sm:space-x-4">

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotif(!showNotif)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Notifikasi"
              >
                <Bell className="w-5 h-5" />
                {unreadCount === 1 ? (
                  // Titik merah kecil untuk 1 notifikasi baru / belum dibaca
                  <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 pointer-events-none">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600 ring-2 ring-white"></span>
                  </span>
                ) : unreadCount > 1 ? (
                  // Badge angka untuk beberapa notifikasi belum dibaca
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white font-bold text-[10px] shadow-sm leading-none flex items-center justify-center pointer-events-none ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : null}
              </button>

              {showNotif && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in">
                  <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-800">
                        {userRole === 'admin' ? 'Notifikasi Admin' : 'Notifikasi'}
                      </span>
                    </div>
                    {userNotifications.length > 0 && (
                      <button 
                        type="button"
                        onClick={handleMarkAllAsRead}
                        className="inline-flex items-center space-x-1 text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer transition-colors hover:underline"
                        title="Tandai seluruh notifikasi sebagai sudah dibaca dan bersihkan"
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>Tandai sudah dibaca</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {userNotifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        {userRole === 'admin' ? 'Tidak ada notifikasi baru untuk Admin' : 'Tidak ada notifikasi baru'}
                      </div>
                    ) : (
                      userNotifications.map((n, index) => {
                        const isNewest = index === 0;
                        // ==========================================
                        // RENDER KHUSUS NOTIFIKASI ROLE ADMIN
                        // ==========================================
                        if (userRole === 'admin') {
                          return (
                            <div 
                              key={n.id} 
                              onClick={() => handleNotificationItemClick(n)}
                              className={`p-2.5 sm:p-3 hover:bg-slate-50 transition-colors cursor-pointer group relative ${
                                !n.is_read 
                                  ? (n.source_type === 'password_reset' 
                                      ? 'border-l-4 border-l-amber-500 bg-amber-50/25' 
                                      : 'border-l-4 border-l-indigo-500 bg-indigo-50/25')
                                  : 'border-l-4 border-l-transparent bg-white hover:bg-slate-50 opacity-80'
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                {/* Category Icon Capsule */}
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                  n.icon_type === 'key' 
                                    ? 'bg-amber-100 text-amber-700 border border-amber-200/80 shadow-2xs' 
                                    : 'bg-indigo-100 text-indigo-700 border border-indigo-200/80 shadow-2xs'
                                }`}>
                                  {n.icon_type === 'key' ? (
                                    <KeyRound className="w-3.5 h-3.5" />
                                  ) : (
                                    <Building2 className="w-3.5 h-3.5" />
                                  )}
                                </div>

                                {/* Body Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <div className="flex items-center space-x-1.5 min-w-0">
                                      {!n.is_read && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" title="Belum dibaca"></span>
                                      )}
                                      <h4 className={`text-[11px] truncate ${!n.is_read ? 'font-extrabold text-slate-900 group-hover:text-blue-600' : 'font-semibold text-slate-700'}`}>
                                        {n.title}
                                      </h4>
                                    </div>

                                    <div className="flex items-center space-x-1 shrink-0">
                                      <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-extrabold border ${n.badge_color || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                        {n.badge_label || 'Pemberitahuan'}
                                      </span>
                                      {!n.is_read && (
                                        <span className="px-1.5 py-0.5 rounded text-[8.5px] font-black bg-rose-100 text-rose-700">
                                          Baru
                                        </span>
                                      )}
                                      {!n.is_read && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleMarkSingleAsRead(n.id);
                                          }}
                                          className="p-0.5 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                          title="Tandai sudah dibaca"
                                        >
                                          <Check className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <p className="text-[10px] text-slate-600 mt-0.5 leading-normal">
                                    {n.message}
                                  </p>

                                  {/* Footer: Clock relative time & Action Button */}
                                  <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-100/80">
                                    <span className="flex items-center space-x-1">
                                      <Clock className="w-2.5 h-2.5 text-slate-400" />
                                      <span>{formatRelativeTime(n.created_at, currentTime)}</span>
                                    </span>

                                    <span className="text-indigo-600 font-bold inline-flex items-center space-x-0.5 group-hover:translate-x-0.5 transition-transform text-[9px]">
                                      <span>{n.action_label || 'Lihat Permintaan'}</span>
                                      <ArrowRight className="w-2.5 h-2.5" />
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        // ==========================================
                        // RENDER NOTIFIKASI MAHASISWA, DOSEN, KAPRODI
                        // ==========================================
                        const isInactivityNotif = n.related_type === 'kaprodi_bimbingan_inactivity_alert';
                        const isSiapSidangNotif = n.related_type === 'kaprodi_siap_sidang_alert';
                        const isSimilarityNotif = n.related_type === 'similarity_warning';
                        const isBimbinganMasuk = n.related_type === 'bimbingan_masuk';
                        const isBimbingan = n.related_type === 'bimbingan_status' || n.related_type === 'consultation' || isBimbinganMasuk;
                        const isThesisNotif = (n.related_type === 'thesis_title' || n.related_type === 'thesis_title_revised' || Boolean(n.action_url))
                          && !isInactivityNotif && !isSiapSidangNotif && !isSimilarityNotif && !isBimbingan;
                        const isApproved = n.status === 'disetujui' || n.jenis_revisi === 'Diterima';
                        const isMayor = n.jenis_revisi === 'Mayor';
                        const isDitolak = n.status === 'ditolak' || n.jenis_revisi === 'Ditolak';

                        let displayTitle = n.title;
                        let displayMessage = n.message || '';

                        if (isBimbinganMasuk) {
                          displayTitle = 'Pengajuan Bimbingan Baru';
                          displayMessage = displayMessage
                            .replace(/mengajukan sesi bimbingan baru ke/i, 'mengajukan bimbingan baru ke')
                            .replace(/:\s*".*$/s, '.')
                            .replace(/\.\s*\.$/, '.');
                        } else if (userRole === 'dosen' && (isThesisNotif || isSimilarityNotif || n.related_type === 'thesis_title' || n.related_type === 'thesis_title_revised')) {
                          const isRevised = n.related_type === 'thesis_title_revised' || /pembaruan|revisi/i.test(n.title || '');
                          displayTitle = isRevised ? 'Pembaruan Judul Mahasiswa' : 'Pengajuan Judul Mahasiswa';
                          
                          // Ambil nama dan NIM mahasiswa dari properti atau teks pesan
                          let mhsNama = n.student_name || '';
                          let mhsNim = n.student_nim || '';
                          if (!mhsNama || !mhsNim) {
                            const match = (n.message || '').match(/Mahasiswa(?:\s+bimbingan\s+Anda,)?\s+([^()]+?)\s*\(([^)]+)\)/i);
                            if (match) {
                              mhsNama = match[1].trim();
                              mhsNim = match[2].trim();
                            }
                          }

                          if (mhsNama && mhsNim) {
                            displayMessage = isRevised
                              ? `Mahasiswa bimbingan Anda, ${mhsNama} (${mhsNim}) telah melakukan perubahan usulan pada judul tugas akhir.`
                              : `Mahasiswa bimbingan Anda, ${mhsNama} (${mhsNim}) telah melakukan pengajuan usulan pada judul tugas akhir.`;
                          } else {
                            displayMessage = isRevised
                              ? 'Mahasiswa bimbingan Anda telah melakukan perubahan usulan pada judul tugas akhir.'
                              : 'Mahasiswa bimbingan Anda telah melakukan pengajuan usulan pada judul tugas akhir.';
                          }
                        }

                        // Bersihkan tanda koma setelah kurung NIM bila ada
                        displayMessage = (displayMessage || '').replace(/\(([0-9]+)\),\s*telah/i, '($1) telah');

                        // Warna border samping & latar belakang hanya untuk notifikasi paling baru (isNewest)
                        let borderClass = '';
                        if (isNewest) {
                          if (isInactivityNotif) borderClass = 'border-l-4 border-l-amber-500 bg-amber-50/20';
                          else if (isSimilarityNotif) borderClass = 'border-l-4 border-l-rose-500 bg-rose-50/20';
                          else if (isSiapSidangNotif) borderClass = 'border-l-4 border-l-emerald-500 bg-emerald-50/20';
                          else if (isBimbinganMasuk) borderClass = 'border-l-3 border-l-indigo-600 bg-indigo-50/20';
                        }

                        return (
                          <div 
                            key={n.id} 
                            onClick={() => handleNotificationItemClick(n)}
                            className={`p-2.5 sm:p-3 hover:bg-slate-50 transition-colors cursor-pointer group ${borderClass} ${isNewest && !n.is_read ? 'bg-slate-50/70' : 'bg-white'}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                                {/* Titik indikator berwarna HANYA untuk notifikasi paling baru (isNewest) yang belum dibaca */}
                                {isNewest && !n.is_read && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" title="Notifikasi terbaru"></span>
                                )}
                                {isNewest && isInactivityNotif && (
                                  <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                )}
                                {isNewest && isSiapSidangNotif && (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                )}
                                {/* Judul selalu hitam biasa (text-slate-900), tidak berwarna biru */}
                                <p className="text-[11px] font-bold text-slate-900 transition-colors truncate">
                                  {displayTitle}
                                </p>
                              </div>
                              <div className="flex items-center space-x-1 shrink-0 mt-0.5">
                                {isInactivityNotif && (
                                  <span className="px-1.5 py-0.5 rounded text-[8.5px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                                    {n.badge_label || '>14 Hari Pasif'}
                                  </span>
                                )}
                                {isSiapSidangNotif && (
                                  <span className="px-1.5 py-0.5 rounded text-[8.5px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                    {n.badge_label || 'Siap Sidang'}
                                  </span>
                                )}
                                {isSimilarityNotif && (
                                  <span className="px-1.5 py-0.5 rounded text-[8.5px] font-extrabold bg-rose-100 text-rose-900 border border-rose-300">
                                    {n.badge_label || 'Similarity'}
                                  </span>
                                )}
                                {isThesisNotif && userRole !== 'dosen' && (
                                  <span className="px-1.5 py-0.5 rounded text-[8.5px] font-extrabold bg-blue-100 text-blue-900 border border-blue-300">
                                    {n.badge_label || 'Judul TA'}
                                  </span>
                                )}
                                {isBimbinganMasuk ? null : isBimbingan ? (
                                  <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-extrabold ${
                                    isApproved ? 'bg-emerald-100 text-emerald-800' :
                                    isMayor || isDitolak ? 'bg-rose-100 text-rose-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {isApproved ? 'ACC' : n.jenis_revisi ? `Revisi ${n.jenis_revisi}` : 'Respon Dospem'}
                                  </span>
                                ) : null}

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (n.id && markNotificationAsRead) {
                                      markNotificationAsRead(n.id);
                                    }
                                  }}
                                  className="p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1 shrink-0"
                                  title="Tandai sudah dibaca & hapus"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <p className="text-[10px] sm:text-[10.5px] text-slate-600 mt-0.5 leading-relaxed">
                              {displayMessage}
                            </p>
                            
                            {/* Email notification confirmation pill for Mahasiswa */}
                            {userRole === 'mahasiswa' && (
                              <div className="mt-1.5 flex items-center space-x-1 text-[9px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-200/60 rounded px-1.5 py-0.5 w-fit">
                                <Mail className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                <span>Salinan otomatis terkirim ke email ({n.email_to || currentUser?.email || '09010182428002@student.unsri.ac.id'})</span>
                              </div>
                            )}

                            {/* Kaprodi quick action button for Inactivity alert */}
                            {(userRole === 'kaprodi' || userRole === 'admin') && isInactivityNotif && (
                              <div className="mt-1.5 flex items-center justify-between pt-1">
                                <span className="inline-flex items-center space-x-1 text-[9.5px] font-bold text-amber-900 bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-300">
                                  <AlertTriangle className="w-2.5 h-2.5 text-amber-700" />
                                  <span>Hubungi Dospem di Monitoring</span>
                                </span>
                                <span className="text-[9.5px] font-semibold text-amber-700 group-hover:underline flex items-center space-x-0.5">
                                  <span>Buka Monitoring</span>
                                  <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
                                </span>
                              </div>
                            )}

                            {/* Kaprodi quick action button for thesis title */}
                            {(userRole === 'kaprodi' || userRole === 'admin') && (isThesisNotif || isSimilarityNotif) && (
                              <div className="mt-1.5 flex items-center justify-between pt-1">
                                <span className="inline-flex items-center space-x-1 text-[9.5px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/70">
                                  <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                                  <span>Tinjau Judul TA</span>
                                </span>
                                <span className="text-[9.5px] font-semibold text-blue-600 group-hover:underline flex items-center space-x-0.5">
                                  <span>Buka halaman tinjauan</span>
                                  <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                                </span>
                              </div>
                            )}

                            {/* Kaprodi quick action button for siap sidang */}
                            {(userRole === 'kaprodi' || userRole === 'admin') && isSiapSidangNotif && (
                              <div className="mt-1.5 flex items-center justify-between pt-1">
                                <span className="inline-flex items-center space-x-1 text-[9.5px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded border border-emerald-300">
                                  <GraduationCap className="w-2.5 h-2.5 text-emerald-700" />
                                  <span>Siap Verifikasi Sidang</span>
                                </span>
                                <span className="text-[9.5px] font-semibold text-emerald-700 group-hover:underline flex items-center space-x-0.5">
                                  <span>Lihat Progres</span>
                                  <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
                                </span>
                              </div>
                            )}

                            <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-400">
                              <span className="flex items-center space-x-1">
                                <Clock className="w-2.5 h-2.5 text-slate-400" />
                                <span>{formatRelativeTime(n.created_at, currentTime)}</span>
                              </span>
                              {isBimbingan && !isBimbinganMasuk && (
                                <span className="text-indigo-600 font-semibold flex items-center space-x-0.5 hover:underline text-[9.5px]">
                                  <span>Lihat bimbingan</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Capsule */}
            {currentUser ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center overflow-hidden border border-slate-200 shadow-2xs shrink-0">
                  {currentUser.avatar_url && !avatarError ? (
                    <img 
                      src={currentUser.avatar_url} 
                      alt={currentUser.nama} 
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{currentUser.nama?.charAt(0) || 'U'}</span>
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-slate-900 leading-tight">{currentUser.nama}</div>
                  <div className="text-xs font-mono text-slate-400 font-medium">{currentUser.nim || currentUser.email}</div>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                <span>Masuk Portal</span>
              </Link>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
