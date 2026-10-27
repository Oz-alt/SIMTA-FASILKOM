import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  GraduationCap, 
  Bell, 
  User, 
  ChevronDown, 
  CheckCircle2, 
  BookOpen, 
  Building2,
  Mail,
  ArrowRight,
  Sparkles,
  Volume2,
  VolumeX
} from 'lucide-react';

import unsriLogo from '../../assets/photo/unsri logo.png';

export default function Navbar() {
  const { 
    currentUser, 
    switchRole, 
    notifications, 
    markAllNotificationsAsRead,
    soundEnabled,
    setSoundEnabled,
    realtimeNotifEnabled
  } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  // Filter notifications relevant to the current active user
  const userNotifications = notifications.filter(n => {
    if (!currentUser) return true;
    if (currentUser.role === 'kaprodi' || currentUser.role === 'admin') return true;
    if (currentUser.role === 'mahasiswa') {
      if (n.recipient_nim && currentUser.nim) {
        return String(n.recipient_nim).trim() === String(currentUser.nim).trim();
      }
      if (n.profile_id && (String(n.profile_id) === String(currentUser.id) || String(n.profile_id) === String(currentUser.nim))) {
        return true;
      }
      return !n.recipient_role || n.recipient_role === 'mahasiswa';
    }
    if (currentUser.role === 'dosen') {
      const cleanNip = String(currentUser.nip || currentUser.nim || '').trim();
      if (n.recipient_nip && cleanNip) {
        return String(n.recipient_nip).trim() === cleanNip;
      }
      return !n.recipient_role || n.recipient_role === 'dosen';
    }
    return true;
  });

  const unreadCount = userNotifications.filter(n => !n.is_read).length;

  const roleBadges = {
    mahasiswa: { label: 'Mahasiswa', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: GraduationCap },
    kaprodi: { label: 'Kaprodi', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: BookOpen },
    dosen: { label: 'Dosen Pembimbing', color: 'bg-teal-100 text-teal-800 border-teal-300', icon: BookOpen },
    admin_sarana: { label: 'Admin Sarana', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Building2 },
    admin: { label: 'Admin SIMONITA', color: 'bg-rose-100 text-rose-800 border-rose-300', icon: Building2 }
  };

  const userRole = currentUser?.role || 'mahasiswa';
  const currentRoleBadge = roleBadges[userRole] || roleBadges.mahasiswa;
  const RoleIcon = currentRoleBadge.icon;

  const handleNotificationClick = (n) => {
    setShowNotif(false);
    if (n.related_type === 'bimbingan_status' || n.related_type === 'consultation' || n.related_type === 'bimbingan_reminder') {
      router.visit('/thesis/consultations');
    } else if (n.related_type === 'booking') {
      router.visit('/booking/status');
    } else if (n.related_type === 'thesis_title') {
      router.visit('/dashboard');
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
                  <>
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-ping"></span>
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white"></span>
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-rose-600 text-white font-black text-[9px] shadow-sm leading-none">
                      {unreadCount}
                    </span>
                  </>
                )}
              </button>

              {showNotif && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in">
                  <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-slate-800">Notifikasi</span>
                      {unreadCount > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-[10px] border border-indigo-200">
                          {unreadCount} baru
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

                  {/* Realtime Status Indicator Banner */}
                  <div className="px-4 py-2 bg-emerald-50/90 border-b border-emerald-100 flex items-center justify-between text-[11px] text-emerald-950">
                    <div className="flex items-center space-x-1.5 font-bold">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-emerald-800">Real-time Notifikasi: ON</span>
                    </div>
                    <button 
                      onClick={() => setSoundEnabled && setSoundEnabled(!soundEnabled)}
                      className="hover:underline flex items-center space-x-1 font-semibold text-emerald-700 cursor-pointer"
                      title="Nyalakan/matikan suara chime"
                    >
                      {soundEnabled ? (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Audio ON</span>
                        </>
                      ) : (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-500">Mute</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Email Sync Status Banner for Mahasiswa */}
                  {userRole === 'mahasiswa' && (
                    <div className="px-4 py-1.5 bg-indigo-50/90 border-b border-indigo-100 flex items-center justify-between text-[11px] text-indigo-950">
                      <div className="flex items-center space-x-1.5 font-medium truncate mr-2">
                        <Mail className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate">Email Terintegrasi: <strong className="font-semibold text-indigo-700">{currentUser?.email || '09010182428002@student.unsri.ac.id'}</strong></span>
                      </div>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 shrink-0">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                        Auto-Email
                      </span>
                    </div>
                  )}

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {userNotifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">Tidak ada notifikasi baru</div>
                    ) : (
                      userNotifications.map(n => {
                        const isBimbingan = n.related_type === 'bimbingan_status' || n.related_type === 'consultation';
                        const isApproved = n.status === 'disetujui' || n.jenis_revisi === 'Diterima';
                        const isMayor = n.jenis_revisi === 'Mayor';
                        const isDitolak = n.status === 'ditolak' || n.jenis_revisi === 'Ditolak';

                        return (
                          <div 
                            key={n.id} 
                            onClick={() => handleNotificationClick(n)}
                            className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                              isBimbingan 
                                ? (isApproved ? 'border-l-3 border-l-emerald-500' : isMayor || isDitolak ? 'border-l-3 border-l-rose-500' : 'border-l-3 border-l-blue-500') 
                                : ''
                            } ${!n.is_read ? 'bg-indigo-50/20' : ''}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center space-x-1.5">
                                <p className="text-xs font-bold text-slate-900">{n.title}</p>
                              </div>
                              <div className="flex items-center space-x-1 shrink-0">
                                {isBimbingan && (
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                                    isApproved ? 'bg-emerald-100 text-emerald-800' :
                                    isMayor || isDitolak ? 'bg-rose-100 text-rose-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {isApproved ? 'ACC' : n.jenis_revisi ? `Revisi ${n.jenis_revisi}` : 'Respon Dospem'}
                                  </span>
                                )}
                                {!n.is_read && (
                                  <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span>
                                )}
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                            
                            {/* Email notification confirmation pill */}
                            {userRole === 'mahasiswa' && (
                              <div className="mt-2 flex items-center space-x-1 text-[10px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-200/60 rounded px-1.5 py-0.5 w-fit">
                                <Mail className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Salinan otomatis terkirim ke email ({n.email_to || currentUser?.email || '09010182428002@student.unsri.ac.id'})</span>
                              </div>
                            )}

                            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                              <span>
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              </span>
                              {isBimbingan && (
                                <span className="text-indigo-600 font-semibold flex items-center space-x-0.5 hover:underline">
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
                  <div className="text-xs font-bold text-slate-900 leading-tight">{currentUser.nama}</div>
                  <div className="text-[10px] text-slate-500">{currentUser.nim || currentUser.email}</div>
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
