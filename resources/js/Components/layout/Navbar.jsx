import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
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
  ShieldAlert,
  Calendar,
  FileStack,
  Users,
  Inbox
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabase.js';

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
    defenseSchedules = [],
    thesisRepositories = [],
    getAllMahasiswaAccounts,
    markAllNotificationsAsRead, 
    markNotificationAsRead 
  } = useAuth();
  const { url } = usePage();
  const [showNotif, setShowNotif] = useState(false);
  const [notifFilter, setNotifFilter] = useState('all'); // 'all' | 'unread'
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
      const saved = localStorage.getItem('simta_read_notif_ids') || localStorage.getItem('simta_read_notification_ids');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch {
      return new Set();
    }
  });

  const saveReadNotifIds = (newSet) => {
    setReadNotifIds(newSet);
    const arr = Array.from(newSet);
    try {
      localStorage.setItem('simta_read_notif_ids', JSON.stringify(arr));
      localStorage.setItem('simta_read_notification_ids', JSON.stringify(arr));
    } catch {}

    if (isSupabaseConfigured && supabase && currentUser) {
      const docId = `simta_read_notif_ids_${currentUser.id || currentUser.role || 'admin'}`;
      supabase.from('admin_cms').upsert([{
        id: docId,
        judul: `Notification Read IDs (${currentUser.nama || currentUser.role})`,
        kategori: 'notification_read_ids',
        isi: JSON.stringify(arr),
        updated_at: new Date().toISOString()
      }], { onConflict: 'id' }).catch(() => {});
    }
  };

  // Sinkronkan status baca dari Supabase saat awal mount
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !currentUser) return;
    const docId = `simta_read_notif_ids_${currentUser.id || currentUser.role || 'admin'}`;
    supabase.from('admin_cms')
      .select('isi')
      .eq('id', docId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.isi) {
          try {
            const parsed = typeof data.isi === 'string' ? JSON.parse(data.isi) : data.isi;
            if (Array.isArray(parsed) && parsed.length > 0) {
              setReadNotifIds(prev => {
                const merged = new Set([...prev, ...parsed]);
                try {
                  localStorage.setItem('simta_read_notif_ids', JSON.stringify(Array.from(merged)));
                  localStorage.setItem('simta_read_notification_ids', JSON.stringify(Array.from(merged)));
                } catch {}
                return merged;
              });
            }
          } catch {}
        }
      }).catch(() => {});
  }, [currentUser?.id, currentUser?.role]);

  // Sinkronkan status baca notifikasi antar-komponen secara real-time
  useEffect(() => {
    const syncReadIds = () => {
      try {
        const saved = localStorage.getItem('simta_read_notif_ids') || localStorage.getItem('simta_read_notification_ids');
        if (saved) {
          setReadNotifIds(new Set(JSON.parse(saved)));
        }
      } catch {}
    };
    window.addEventListener('storage', syncReadIds);
    window.addEventListener('simta_notifications_updated', syncReadIds);
    return () => {
      window.removeEventListener('storage', syncReadIds);
      window.removeEventListener('simta_notifications_updated', syncReadIds);
    };
  }, []);

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
      // 1. Permintaan Reset Password (Menunggu verifikasi & Aktif disetujui)
      const resetNotifs = (passwordResetRequests || [])
        .filter(r => r && (r.status === 'menunggu' || r.status === 'disetujui'))
        .map(r => {
          const isPending = r.status === 'menunggu';
          const roleLabel = r.role === 'dosen' ? 'Dosen' : 'Mahasiswa';
          const idNum = r.nim || r.nip || '';
          const userStr = `${r.nama || 'Pengguna'}${idNum ? ` (${idNum})` : ''}`;
          return {
            id: `notif-reset-${r.id}`,
            source_type: 'password_reset',
            raw_data: r,
            title: isPending ? 'Permintaan Reset Password' : 'Tautan Reset Password Aktif',
            message: isPending
              ? `${roleLabel} atas nama ${userStr} mengajukan reset password dan menunggu verifikasi Admin.`
              : `Tautan reset sandi untuk ${userStr} telah disetujui dan dikirimkan ke email resmi pemohon.`,
            created_at: r.created_at || r.tanggal_pengajuan || new Date().toISOString(),
            action_url: '/admin-simta/accounts/password-resets',
            action_label: isPending ? 'Verifikasi Reset' : 'Lihat Permintaan',
            badge_label: isPending ? 'Reset Sandi' : 'Tautan Aktif',
            badge_color: isPending 
              ? 'bg-amber-100 text-amber-900 border-amber-300' 
              : 'bg-emerald-100 text-emerald-900 border-emerald-300',
            icon_type: 'key',
            recipient_role: 'admin',
            is_read: Boolean(readNotifIds.has(`notif-reset-${r.id}`))
          };
        });

      // 2. Pengajuan Peminjaman Ruang Sidang (Menunggu & Disetujui)
      const bookingNotifs = (bookings || [])
        .filter(b => b && (b.status === 'menunggu_persetujuan' || b.status === 'diajukan' || b.status === 'disetujui'))
        .map(b => {
          const isPending = b.status === 'menunggu_persetujuan' || b.status === 'diajukan';
          return {
            id: `notif-booking-${b.id}`,
            source_type: 'booking',
            raw_data: b,
            title: isPending ? 'Pengajuan Peminjaman Ruang' : 'Peminjaman Ruangan Disetujui',
            message: isPending
              ? `Pengajuan peminjaman ${b.room_name || 'Ruang Sidang'} oleh ${b.mhs_nama || b.mhs_nim || 'Mahasiswa'} (${b.booking_date || 'Terjadwal'}) menunggu persetujuan Admin.`
              : `Peminjaman ${b.room_name || 'Ruang Sidang'} untuk ${b.mhs_nama || b.mhs_nim || 'Mahasiswa'} telah disetujui.`,
            created_at: b.created_at || new Date().toISOString(),
            action_url: '/admin/bookings',
            action_label: isPending ? 'Persetujuan Ruangan' : 'Lihat Ruangan',
            badge_label: isPending ? 'Peminjaman Ruang' : 'Ruang Disetujui',
            badge_color: isPending 
              ? 'bg-indigo-100 text-indigo-900 border-indigo-300' 
              : 'bg-emerald-100 text-emerald-900 border-emerald-300',
            icon_type: 'building',
            recipient_role: 'admin',
            is_read: Boolean(readNotifIds.has(`notif-booking-${b.id}`))
          };
        });

      // 3. Penjadwalan Sidang Tugas Akhir
      const defenseNotifs = (defenseSchedules || [])
        .filter(s => s && s.id && (s.status === 'diajukan' || s.ruangan || s.jenis_sidang))
        .map(s => ({
          id: `notif-defense-${s.id}`,
          source_type: 'defense_schedule',
          raw_data: s,
          title: 'Penjadwalan Sidang Tugas Akhir',
          message: `Jadwal sidang ${s.jenis_sidang || 'Tugas Akhir'} untuk ${s.mhs_nama || 'Mahasiswa'} (${s.prodi || 'FASILKOM'}) telah diajukan dan membutuhkan koordinasi ruangan.`,
          created_at: s.created_at || s.updated_at || new Date().toISOString(),
          action_url: '/admin/bookings',
          action_label: 'Jadwal Ruang Sidang',
          badge_label: 'Jadwal Sidang',
          badge_color: 'bg-purple-100 text-purple-900 border-purple-300',
          icon_type: 'calendar',
          recipient_role: 'admin',
          is_read: Boolean(readNotifIds.has(`notif-defense-${s.id}`))
        }));

      // 4. Pengajuan Repositori Tugas Akhir (Review Publikasi Admin)
      const repoNotifs = (thesisRepositories || [])
        .filter(repo => repo && repo.id && (repo.status === 'menunggu_publikasi' || repo.status === 'draft' || repo.status === 'diajukan'))
        .map(repo => ({
          id: `notif-repo-${repo.id}`,
          source_type: 'repository',
          raw_data: repo,
          title: 'Pengajuan Repositori Baru',
          message: `Naskah tugas akhir "${repo.judul || 'Karya Ilmiah'}" oleh ${repo.penulis || 'Mahasiswa'} menunggu verifikasi publikasi Admin.`,
          created_at: repo.created_at || repo.tanggal || new Date().toISOString(),
          action_url: '/admin-simta/repository',
          action_label: 'Publikasi Repositori',
          badge_label: 'Repositori TA',
          badge_color: 'bg-sky-100 text-sky-900 border-sky-300',
          icon_type: 'file',
          recipient_role: 'admin',
          is_read: Boolean(readNotifIds.has(`notif-repo-${repo.id}`))
        }));

      // 5. Verifikasi Akun Baru / Akun Mahasiswa
      let studentAccountNotifs = [];
      try {
        const allStudents = typeof getAllMahasiswaAccounts === 'function' ? getAllMahasiswaAccounts() : [];
        const nonActiveStudents = (allStudents || []).filter(s => s && ((s.status || '').toLowerCase() === 'nonaktif' || (s.status || '').toLowerCase() === 'menunggu'));
        if (nonActiveStudents.length > 0) {
          studentAccountNotifs.push({
            id: 'notif-admin-student-accounts-pending',
            source_type: 'student_accounts',
            title: 'Verifikasi Akun Mahasiswa',
            message: `Terdapat ${nonActiveStudents.length} akun mahasiswa dengan status nonaktif yang membutuhkan verifikasi atau aktivasi status oleh Admin.`,
            created_at: nonActiveStudents[0]?.created_at || new Date().toISOString(),
            action_url: '/admin-simta/accounts/mahasiswa',
            action_label: 'Buka Data Mahasiswa',
            badge_label: 'Verifikasi Akun',
            badge_color: 'bg-blue-100 text-blue-900 border-blue-300',
            icon_type: 'users',
            recipient_role: 'admin',
            is_read: Boolean(readNotifIds.has('notif-admin-student-accounts-pending'))
          });
        }
      } catch {}

      // 6. Notifikasi Sistem Eksisting Bertarget Admin
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

      // Deduplikasi & Pengurutan Waktu Terkini (Seluruh notifikasi tetap tersimpan dalam riwayat)
      const seen = new Set();
      return [
        ...resetNotifs, 
        ...bookingNotifs, 
        ...defenseNotifs, 
        ...repoNotifs, 
        ...studentAccountNotifs, 
        ...existingAdminNotifs
      ]
        .filter(n => {
          if (!n || !n.id) return false;
          if (seen.has(String(n.id))) return false;
          seen.add(String(n.id));
          return true;
        })
        .map(n => ({
          ...n,
          is_read: Boolean(n.is_read || readNotifIds.has(String(n.id)))
        }))
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }

    // ============================================================
    // ROLE KAPRODI, MAHASISWA, & DOSEN
    // ============================================================
    return (notifications || []).filter(n => {
      if (!n) return false;
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
    }).map(n => ({
      ...n,
      is_read: Boolean(n.is_read || readNotifIds.has(String(n.id)))
    })).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [
    currentUser, 
    notifications, 
    passwordResetRequests, 
    bookings, 
    defenseSchedules, 
    thesisRepositories, 
    getAllMahasiswaAccounts, 
    readNotifIds
  ]);

  // Pisahkan notifikasi yang belum dibaca untuk badge dan filter
  const unreadNotifications = useMemo(() => {
    return userNotifications.filter(n => !n.is_read);
  }, [userNotifications]);

  const unreadCount = unreadNotifications.length;

  const displayedNotifications = useMemo(() => {
    if (notifFilter === 'unread') {
      return unreadNotifications;
    }
    return userNotifications;
  }, [notifFilter, unreadNotifications, userNotifications]);

  // Helper render ikon dinamis kategori notifikasi
  const renderNotifIcon = (iconType, isRead) => {
    if (iconType === 'key') {
      return (
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
          isRead ? 'bg-amber-50 text-amber-600 border border-amber-200/60' : 'bg-amber-100 text-amber-700 border border-amber-300 shadow-2xs'
        }`}>
          <KeyRound className="w-4 h-4" />
        </div>
      );
    }
    if (iconType === 'building') {
      return (
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
          isRead ? 'bg-indigo-50 text-indigo-600 border border-indigo-200/60' : 'bg-indigo-100 text-indigo-700 border border-indigo-300 shadow-2xs'
        }`}>
          <Building2 className="w-4 h-4" />
        </div>
      );
    }
    if (iconType === 'calendar') {
      return (
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
          isRead ? 'bg-purple-50 text-purple-600 border border-purple-200/60' : 'bg-purple-100 text-purple-700 border border-purple-300 shadow-2xs'
        }`}>
          <Calendar className="w-4 h-4" />
        </div>
      );
    }
    if (iconType === 'file') {
      return (
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
          isRead ? 'bg-sky-50 text-sky-600 border border-sky-200/60' : 'bg-sky-100 text-sky-700 border border-sky-300 shadow-2xs'
        }`}>
          <FileStack className="w-4 h-4" />
        </div>
      );
    }
    if (iconType === 'users') {
      return (
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
          isRead ? 'bg-blue-50 text-blue-600 border border-blue-200/60' : 'bg-blue-100 text-blue-700 border border-blue-300 shadow-2xs'
        }`}>
          <Users className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
        isRead ? 'bg-slate-100 text-slate-500 border border-slate-200/60' : 'bg-rose-100 text-rose-700 border border-rose-300 shadow-2xs'
      }`}>
        <Bell className="w-4 h-4" />
      </div>
    );
  };

  const handleMarkSingleAsRead = (id, notifObj = null) => {
    if (id && markNotificationAsRead) {
      markNotificationAsRead(id);
    }
    const next = new Set(readNotifIds);
    next.add(String(id));
    saveReadNotifIds(next);

    // Jika notifikasi berkaitan dengan bimbingan mahasiswa, tandai mahasiswa & konsultasi sebagai sudah dilihat
    const studentNim = notifObj?.mhs_nim || notifObj?.student_nim || (notifObj?.message ? notifObj.message.match(/\((\d{8,})\)/)?.[1] : null);
    if (studentNim) {
      try {
        const seenMap = JSON.parse(localStorage.getItem('simta_seen_student_bimbingan') || '{}');
        seenMap[String(studentNim).trim()] = Date.now();
        localStorage.setItem('simta_seen_student_bimbingan', JSON.stringify(seenMap));
      } catch {}
    }
    if (notifObj?.consultation_id) {
      try {
        const seenIds = new Set(JSON.parse(localStorage.getItem('simta_seen_consultation_ids') || '[]'));
        seenIds.add(String(notifObj.consultation_id));
        localStorage.setItem('simta_seen_consultation_ids', JSON.stringify(Array.from(seenIds)));
      } catch {}
    }

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('simta_notifications_updated'));
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
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('simta_notifications_updated'));
  };

  // Otomatis tandai notifikasi titik merah sebagai sudah dibaca saat pengguna membuka halaman yang bersangkutan
  useEffect(() => {
    if (!url || !userNotifications.length) return;

    const toMark = [];
    const nextReadIds = new Set(readNotifIds);
    let changed = false;

    userNotifications.forEach(n => {
      if (n.is_read || nextReadIds.has(String(n.id))) return;

      let isMatch = false;

      // 1. Validasi bimbingan per mahasiswa (/dosen/validasi?nim=...)
      if (url.includes('/dosen/validasi') || url.includes('/dosen/bimbingan')) {
        const urlParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
        const currentNim = urlParams.get('nim');
        if (currentNim) {
          if (
            String(n.mhs_nim || '').trim() === currentNim ||
            String(n.student_nim || '').trim() === currentNim ||
            String(n.recipient_nim || '').trim() === currentNim ||
            (n.message && n.message.includes(currentNim)) ||
            (n.action_url && n.action_url.includes(currentNim))
          ) {
            isMatch = true;
          }
        } else {
          if (n.related_type === 'bimbingan_masuk' || n.related_type === 'consultation') {
            isMatch = true;
          }
        }
      }
      // 2. Validasi judul (/dosen/validasi-judul atau /kaprodi/titles)
      else if (url.includes('/dosen/validasi-judul') || url.includes('/kaprodi/titles')) {
        if (n.related_type === 'thesis_title' || n.related_type === 'thesis_title_revised' || (n.action_url && (n.action_url.includes('/dosen/validasi-judul') || n.action_url.includes('/kaprodi/titles')))) {
          isMatch = true;
        }
      }
      // 3. Jadwal sidang
      else if (url.includes('/dosen/jadwal-sidang') || url.includes('/kaprodi/defense-schedules')) {
        if (n.related_type === 'defense_schedule' || n.related_type === 'defense' || (n.action_url && (n.action_url.includes('jadwal-sidang') || n.action_url.includes('defense-schedules')))) {
          isMatch = true;
        }
      }
      // 4. Reset password admin
      else if (url.includes('/admin-simta/accounts/password-resets')) {
        if (n.source_type === 'password_reset' || (n.action_url && n.action_url.includes('password-resets'))) {
          isMatch = true;
        }
      }
      // 5. Peminjaman ruangan admin & mahasiswa
      else if (url.includes('/admin/bookings') || url.includes('/booking/status')) {
        if (n.source_type === 'booking' || n.related_type === 'booking' || (n.action_url && (n.action_url.includes('bookings') || n.action_url.includes('booking/status')))) {
          isMatch = true;
        }
      }
      // 6. Konsultasi mahasiswa
      else if (url.includes('/thesis/consultations')) {
        if (n.related_type === 'consultation' || n.related_type === 'bimbingan_status' || (n.action_url && n.action_url.includes('thesis/consultations'))) {
          isMatch = true;
        }
      }
      // 7. General URL match
      if (!isMatch && n.action_url) {
        const cleanUrl = url.split('#')[0].split('?')[0];
        const cleanAction = n.action_url.split('#')[0].split('?')[0];
        if (cleanUrl === cleanAction && cleanUrl !== '/' && cleanUrl !== '') {
          isMatch = true;
        }
      }

      if (isMatch) {
        toMark.push(n.id);
        nextReadIds.add(String(n.id));
        changed = true;
      }
    });

    if (changed) {
      saveReadNotifIds(nextReadIds);
      toMark.forEach(id => {
        if (markNotificationAsRead) markNotificationAsRead(id);
      });
      window.dispatchEvent(new Event('simta_notifications_updated'));
    }
  }, [url, userNotifications, readNotifIds, markNotificationAsRead]);

  const handleNotificationItemClick = (n) => {
    handleMarkSingleAsRead(n.id, n);
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
    handleMarkSingleAsRead(n.id, n);

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
                <div className="absolute right-0 mt-2 w-80 sm:w-[420px] rounded-2xl bg-white shadow-2xl border border-slate-200/90 py-0 z-50 animate-in fade-in overflow-hidden">
                  
                  {/* Dropdown Header */}
                  <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                          <span>{userRole === 'admin' ? 'Notifikasi Admin' : 'Notifikasi'}</span>
                          {unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                              {unreadCount} Baru
                            </span>
                          )}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Seluruh notifikasi telah dibaca'}
                        </p>
                      </div>
                    </div>

                    {unreadCount > 0 ? (
                      <button 
                        type="button"
                        onClick={handleMarkAllAsRead}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10.5px] text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 font-bold cursor-pointer transition-colors border border-indigo-100 shadow-2xs"
                        title="Tandai seluruh notifikasi sebagai sudah dibaca"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Tandai Semua Dibaca</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Semua Dibaca</span>
                      </span>
                    )}
                  </div>

                  {/* Filter Tab Switcher (Semua vs Belum Dibaca) */}
                  <div className="flex items-center px-3 py-1.5 gap-1.5 border-b border-slate-100 bg-slate-50/70">
                    <button
                      type="button"
                      onClick={() => setNotifFilter('all')}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        notifFilter === 'all'
                          ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      Semua ({userNotifications.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotifFilter('unread')}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                        notifFilter === 'unread'
                          ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      <span>Belum Dibaca</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 min-w-[16px] h-4 rounded-full bg-rose-600 text-white text-[9px] font-extrabold flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Scrollable Notification List */}
                  <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                    {displayedNotifications.length === 0 ? (
                      notifFilter === 'unread' ? (
                        <div className="py-9 px-4 text-center">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 border border-emerald-100">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-bold text-slate-800">Semua Notifikasi Telah Dibaca</p>
                          <p className="text-[10.5px] text-slate-500 mt-1 max-w-[260px] mx-auto leading-relaxed">
                            Tidak ada notifikasi baru yang belum dibaca. Seluruh riwayat aktivitas tersimpan aman.
                          </p>
                          <button
                            type="button"
                            onClick={() => setNotifFilter('all')}
                            className="mt-3 inline-flex items-center space-x-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                          >
                            <span>Lihat Semua Riwayat ({userNotifications.length})</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="py-9 px-4 text-center">
                          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                            <Inbox className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-bold text-slate-700">Belum Ada Riwayat Notifikasi</p>
                          <p className="text-[10.5px] text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">
                            Pemberitahuan aktivitas sistem akan muncul di sini secara otomatis.
                          </p>
                        </div>
                      )
                    ) : (
                      displayedNotifications.map((n, index) => {
                        const isNewest = index === 0;

                        // ==========================================
                        // RENDER KHUSUS NOTIFIKASI ROLE ADMIN
                        // ==========================================
                        if (userRole === 'admin') {
                          return (
                            <div 
                              key={n.id} 
                              onClick={() => handleNotificationItemClick(n)}
                              className={`p-3 hover:bg-slate-50/90 transition-all cursor-pointer group relative ${
                                !n.is_read 
                                  ? (n.source_type === 'password_reset' 
                                      ? 'border-l-4 border-l-amber-500 bg-amber-50/30' 
                                      : n.source_type === 'booking'
                                        ? 'border-l-4 border-l-indigo-600 bg-indigo-50/30'
                                        : n.source_type === 'defense_schedule'
                                          ? 'border-l-4 border-l-purple-600 bg-purple-50/30'
                                          : n.source_type === 'repository'
                                            ? 'border-l-4 border-l-sky-600 bg-sky-50/30'
                                            : 'border-l-4 border-l-blue-600 bg-blue-50/30')
                                  : 'border-l-4 border-l-transparent bg-white hover:bg-slate-50/80 opacity-80'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {/* Category Icon Capsule */}
                                {renderNotifIcon(n.icon_type, n.is_read)}

                                {/* Body Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1.5">
                                    <div className="flex items-center space-x-1.5 min-w-0">
                                      {!n.is_read && (
                                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-pulse" title="Belum dibaca" />
                                      )}
                                      <h4 className={`text-[11.5px] truncate ${!n.is_read ? 'font-bold text-slate-900 group-hover:text-indigo-600' : 'font-semibold text-slate-700'}`}>
                                        {n.title}
                                      </h4>
                                    </div>

                                    <div className="flex items-center space-x-1 shrink-0">
                                      <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold border ${n.badge_color || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                        {n.badge_label || 'Pemberitahuan'}
                                      </span>
                                      {!n.is_read ? (
                                        <span className="px-1.5 py-0.5 rounded text-[8.5px] font-black bg-rose-100 text-rose-700 uppercase tracking-wider">
                                          Baru
                                        </span>
                                      ) : (
                                        <span className="px-1.5 py-0.5 rounded text-[8.5px] font-semibold bg-slate-100 text-slate-500 flex items-center space-x-0.5">
                                          <Check className="w-2.5 h-2.5 text-slate-400" />
                                          <span>Dibaca</span>
                                        </span>
                                      )}
                                      {!n.is_read && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleMarkSingleAsRead(n.id);
                                          }}
                                          className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors ml-0.5"
                                          title="Tandai sudah dibaca"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <p className={`text-[10.5px] mt-1 leading-relaxed ${!n.is_read ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                                    {n.message}
                                  </p>

                                  {/* Footer: Clock relative time & Action Button */}
                                  <div className="mt-2.5 flex items-center justify-between text-[9.5px] text-slate-400 pt-1.5 border-t border-slate-100">
                                    <span className="flex items-center space-x-1">
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      <span>{formatRelativeTime(n.created_at, currentTime)}</span>
                                    </span>

                                    <span className={`font-bold inline-flex items-center space-x-1 group-hover:translate-x-0.5 transition-transform text-[10px] ${
                                      !n.is_read ? 'text-indigo-600' : 'text-slate-500'
                                    }`}>
                                      <span>{n.action_label || 'Lihat Detail'}</span>
                                      <ArrowRight className="w-3 h-3" />
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

                        displayMessage = (displayMessage || '').replace(/\(([0-9]+)\),\s*telah/i, '($1) telah');

                        let borderClass = '';
                        if (!n.is_read) {
                          if (isInactivityNotif) borderClass = 'border-l-4 border-l-amber-500 bg-amber-50/25';
                          else if (isSimilarityNotif) borderClass = 'border-l-4 border-l-rose-500 bg-rose-50/25';
                          else if (isSiapSidangNotif) borderClass = 'border-l-4 border-l-emerald-500 bg-emerald-50/25';
                          else if (isBimbinganMasuk) borderClass = 'border-l-4 border-l-indigo-600 bg-indigo-50/25';
                          else borderClass = 'border-l-4 border-l-slate-400 bg-slate-50/30';
                        } else {
                          borderClass = 'border-l-4 border-l-transparent bg-white opacity-85';
                        }

                        return (
                          <div 
                            key={n.id} 
                            onClick={() => handleNotificationItemClick(n)}
                            className={`p-3 hover:bg-slate-50 transition-colors cursor-pointer group ${borderClass}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                                {!n.is_read && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" title="Belum dibaca"></span>
                                )}
                                {isInactivityNotif && (
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                )}
                                {isSiapSidangNotif && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                )}
                                <p className={`text-[11px] transition-colors truncate ${!n.is_read ? 'font-bold text-slate-900 group-hover:text-indigo-600' : 'font-medium text-slate-700'}`}>
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

                                {!n.is_read ? (
                                  <span className="px-1.5 py-0.5 rounded text-[8.5px] font-black bg-rose-100 text-rose-700 uppercase tracking-wider">
                                    Baru
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[8.5px] font-semibold bg-slate-100 text-slate-500 flex items-center space-x-0.5">
                                    <Check className="w-2.5 h-2.5 text-slate-400" />
                                    <span>Dibaca</span>
                                  </span>
                                )}

                                {!n.is_read && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkSingleAsRead(n.id, n);
                                    }}
                                    className="p-0.5 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors ml-1 shrink-0"
                                    title="Tandai sudah dibaca"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <p className="text-[10px] sm:text-[10.5px] text-slate-600 mt-1 leading-relaxed">
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

                            <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-100">
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

                  {/* Dropdown Footer */}
                  <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span>Sistem Monitoring Real-Time SIMONITA</span>
                    <span className="flex items-center space-x-1.5 text-emerald-700 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Sinkron</span>
                    </span>
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
