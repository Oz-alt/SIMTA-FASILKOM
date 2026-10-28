import React, { useState, useEffect } from 'react';
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
  AlertTriangle
} from 'lucide-react';

import unsriLogo from '../../assets/photo/unsri logo.png';

/**
 * Format waktu relatif yang diperbarui secara otomatis:
 * Contoh: "5 detik yang lalu", "5 menit yang lalu", "2 jam yang lalu", 
 * "3 hari yang lalu", "2 minggu yang lalu", "1 bulan yang lalu", "1 tahun yang lalu"
 */
export function formatRelativeTime(dateInput, now = new Date()) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.max(0, Math.floor(diffInMs / 1000));

  if (diffInSeconds < 60) {
    if (diffInSeconds < 10) return 'baru saja';
    return `${diffInSeconds} detik yang lalu`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} menit yang lalu`;
  }

  const diffInHours = Math.floor(diffInSeconds / 60);
  if (diffInHours < 24) {
    return `${diffInHours} jam yang lalu`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} hari yang lalu`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} minggu yang lalu`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} bulan yang lalu`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} tahun yang lalu`;
}

export default function Navbar() {
  const { 
    currentUser, 
    switchRole, 
    notifications, 
    markAllNotificationsAsRead, 
    markNotificationAsRead 
  } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // Interval pembaruan waktu otomatis tanpa memuat ulang halaman
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Filter notifications relevant to the current active user
  const userNotifications = notifications.filter(n => {
    if (!currentUser) return false;

    // Bersihkan notifikasi mock dummy lama
    if (n.id === 'notif-1' || n.id === 'notif-2' || n.is_mock) return false;
    if (n.title === 'Judul TA Disetujui!' || n.title === 'Peminjaman Ruangan Disetujui') return false;

    if (currentUser.role === 'admin') {
      // Admin only sees notifications specifically targeted to the admin
      return (
        n.recipient_role === 'admin' ||
        n.target_role === 'admin' ||
        String(n.profile_id) === String(currentUser.id) ||
        String(n.recipient_id) === String(currentUser.id)
      );
    }

    if (currentUser.role === 'kaprodi') {
      // 1. Kaprodi akun pusat: JANGAN PERNAH izinkan notifikasi tanggapan bimbingan dosen-ke-mahasiswa
      if (n.recipient_role === 'mahasiswa' || n.recipient_role === 'dosen') return false;
      if (n.related_type === 'bimbingan_status' || n.related_type === 'consultation' || n.related_type === 'bimbingan_reminder') {
        return false;
      }
      // 2. Hanya izinkan notifikasi koordinasi pusat Kaprodi
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
      if (n.recipient_role && n.recipient_role !== 'mahasiswa' && n.recipient_role !== 'all') return false;
      if (n.recipient_nim && currentUser.nim) {
        return String(n.recipient_nim).trim() === String(currentUser.nim).trim();
      }
      if (n.profile_id && (String(n.profile_id) === String(currentUser.id) || String(n.profile_id) === String(currentUser.nim))) {
        return true;
      }
      return !n.recipient_role || n.recipient_role === 'mahasiswa';
    }

    if (currentUser.role === 'dosen') {
      if (n.recipient_role === 'mahasiswa' || n.recipient_role === 'kaprodi') return false;
      const cleanNip = String(currentUser.nip || currentUser.nim || '').trim();
      const cleanNama = (currentUser.nama || '').toLowerCase().replace(/dr\.|ir\.|prof\.|s\.kom\.|m\.cs\.|m\.t\.|m\.kom\.|ph\.d\.|st\.|s\.t\./gi, '').trim();

      // 1. Cocokkan NIP jika ada
      if (n.recipient_nip && cleanNip && String(n.recipient_nip).trim() === cleanNip) {
        return true;
      }
      // 2. Cocokkan Nama Dosen jika ada
      if (n.dosen_nama && cleanNama) {
        const cleanNotifNama = n.dosen_nama.toLowerCase().replace(/dr\.|ir\.|prof\.|s\.kom\.|m\.cs\.|m\.t\.|m\.kom\.|ph\.d\.|st\.|s\.t\./gi, '').trim();
        if (cleanNotifNama.includes(cleanNama) || cleanNama.includes(cleanNotifNama)) {
          return true;
        }
      }
      // 3. Notifikasi jadwal sidang atau bimbingan umum bertarget dosen
      if (n.recipient_role === 'dosen') {
        return !n.recipient_nip || (cleanNip && String(n.recipient_nip).trim() === cleanNip);
      }
      return false;
    }

    return false;
  });

  const unreadCount = userNotifications.filter(n => !n.is_read).length;

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
      router.visit(`/kaprodi/titles/${n.related_id}`);
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
            <div className="relative">
              <button 
                onClick={() => setShowNotif(!showNotif)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Notifikasi"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white font-bold text-[10px] shadow-sm leading-none flex items-center justify-center pointer-events-none">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in">
                  <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-slate-800">Notifikasi</span>
                      {unreadCount > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-[10px] border border-indigo-200">
                          {unreadCount} belum dibaca
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllNotificationsAsRead}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer transition-colors"
                      >
                        Tandai dibaca
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {userNotifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">Tidak ada notifikasi baru</div>
                    ) : (
                      userNotifications.map(n => {
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

                        let borderClass = '';
                        if (isInactivityNotif) borderClass = 'border-l-4 border-l-amber-500 bg-amber-50/20';
                        else if (isSimilarityNotif) borderClass = 'border-l-4 border-l-rose-500 bg-rose-50/20';
                        else if (isSiapSidangNotif) borderClass = 'border-l-4 border-l-emerald-500 bg-emerald-50/20';
                        else if (isThesisNotif) borderClass = 'border-l-4 border-l-blue-500 bg-blue-50/20';
                        else if (isBimbingan) {
                          borderClass = isBimbinganMasuk
                            ? 'border-l-3 border-l-indigo-600'
                            : isApproved ? 'border-l-3 border-l-emerald-500' : isMayor || isDitolak ? 'border-l-3 border-l-rose-500' : 'border-l-3 border-l-blue-500';
                        }

                        return (
                          <div 
                            key={n.id} 
                            onClick={() => handleNotificationClick(n)}
                            className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer group ${borderClass} ${!n.is_read ? 'bg-indigo-50/30' : ''}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                                {isInactivityNotif && (
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                )}
                                {isThesisNotif && (
                                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                                )}
                                {isSiapSidangNotif && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                )}
                                {isSimilarityNotif && (
                                  <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0"></span>
                                )}
                                <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                  {n.title}
                                </p>
                              </div>
                              <div className="flex items-center space-x-1 shrink-0 mt-0.5">
                                {isInactivityNotif && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                                    {n.badge_label || '>14 Hari Pasif'}
                                  </span>
                                )}
                                {isSiapSidangNotif && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                    {n.badge_label || 'Siap Sidang'}
                                  </span>
                                )}
                                {isSimilarityNotif && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-100 text-rose-900 border border-rose-300">
                                    {n.badge_label || 'Similarity'}
                                  </span>
                                )}
                                {isThesisNotif && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-100 text-blue-900 border border-blue-300">
                                    {n.badge_label || 'Judul TA'}
                                  </span>
                                )}
                                {isBimbinganMasuk ? (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                    {n.pembimbing ? `Pengajuan ${n.pembimbing}` : 'Bimbingan Baru'}
                                  </span>
                                ) : isBimbingan ? (
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                                    isApproved ? 'bg-emerald-100 text-emerald-800' :
                                    isMayor || isDitolak ? 'bg-rose-100 text-rose-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {isApproved ? 'ACC' : n.jenis_revisi ? `Revisi ${n.jenis_revisi}` : 'Respon Dospem'}
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                              {n.message}
                            </p>
                            
                            {/* Email notification confirmation pill for Mahasiswa */}
                            {userRole === 'mahasiswa' && (
                              <div className="mt-2 flex items-center space-x-1 text-[10px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-200/60 rounded px-1.5 py-0.5 w-fit">
                                <Mail className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Salinan otomatis terkirim ke email ({n.email_to || currentUser?.email || '09010182428002@student.unsri.ac.id'})</span>
                              </div>
                            )}

                            {/* Dosen quick action button for new bimbingan */}
                            {isBimbinganMasuk && (
                              <div className="mt-2 flex items-center justify-between pt-1">
                                <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/70">
                                  <BookOpen className="w-3 h-3 text-indigo-600" />
                                  <span>Validasi Sesi Bimbingan</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowNotif(false);
                                    if (n.id && markNotificationAsRead) markNotificationAsRead(n.id);
                                    router.visit('/dosen/monitoring');
                                  }}
                                  className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center space-x-0.5 cursor-pointer"
                                  title="Buka Progres Monitoring Mahasiswa Bimbingan"
                                >
                                  <span>Progres Monitoring</span>
                                  <ExternalLink className="w-3 h-3 ml-0.5" />
                                </button>
                              </div>
                            )}

                            {/* Kaprodi quick action button for Inactivity alert */}
                            {(userRole === 'kaprodi' || userRole === 'admin') && isInactivityNotif && (
                              <div className="mt-2 flex items-center justify-between pt-1">
                                <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300">
                                  <AlertTriangle className="w-3 h-3 text-amber-700" />
                                  <span>Hubungi Dospem di Monitoring</span>
                                </span>
                                <span className="text-[10px] font-semibold text-amber-700 group-hover:underline flex items-center space-x-0.5">
                                  <span>Buka Monitoring</span>
                                  <ArrowRight className="w-3 h-3 ml-0.5" />
                                </span>
                              </div>
                            )}

                            {/* Kaprodi quick action button for thesis title */}
                            {(userRole === 'kaprodi' || userRole === 'admin') && (isThesisNotif || isSimilarityNotif) && (
                              <div className="mt-2 flex items-center justify-between pt-1">
                                <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/70">
                                  <Sparkles className="w-3 h-3 text-blue-600" />
                                  <span>Tinjau Judul TA</span>
                                </span>
                                <span className="text-[10px] font-semibold text-blue-600 group-hover:underline flex items-center space-x-0.5">
                                  <span>Buka halaman tinjauan</span>
                                  <ExternalLink className="w-3 h-3 ml-0.5" />
                                </span>
                              </div>
                            )}

                            {/* Kaprodi quick action button for siap sidang */}
                            {(userRole === 'kaprodi' || userRole === 'admin') && isSiapSidangNotif && (
                              <div className="mt-2 flex items-center justify-between pt-1">
                                <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300">
                                  <GraduationCap className="w-3 h-3 text-emerald-700" />
                                  <span>Siap Verifikasi Sidang</span>
                                </span>
                                <span className="text-[10px] font-semibold text-emerald-700 group-hover:underline flex items-center space-x-0.5">
                                  <span>Lihat Progres</span>
                                  <ArrowRight className="w-3 h-3 ml-0.5" />
                                </span>
                              </div>
                            )}

                            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                              <span>
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              </span>
                              {isBimbingan && (
                                <span className="text-indigo-600 font-semibold flex items-center space-x-0.5 hover:underline">
                                  <span>{isBimbinganMasuk ? 'Validasi sekarang' : 'Lihat bimbingan'}</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1 font-normal select-none">
                              {formatRelativeTime(n.created_at, currentTime)}
                            </p>
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
                  {currentUser.avatar_url ? (
                    <img 
                      src={currentUser.avatar_url} 
                      alt={currentUser.nama} 
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
