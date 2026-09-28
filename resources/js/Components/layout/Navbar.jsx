import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  GraduationCap, 
  Bell, 
  User, 
  ChevronDown, 
  CheckCircle2, 
  BookOpen, 
  Building2,
  Mail
} from 'lucide-react';

import unsriLogo from '../../assets/photo/unsri logo.png';

export default function Navbar() {
  const { currentUser, switchRole, notifications, markAllNotificationsAsRead } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  // Filter notifications relevant to the current active user
  const userNotifications = notifications.filter(n => {
    if (!currentUser) return true;
    if (currentUser.role === 'kaprodi' || currentUser.role === 'admin') return true;
    if (currentUser.role === 'mahasiswa') {
      return (
        !n.recipient_role || 
        n.recipient_role === 'mahasiswa' || 
        (currentUser.nim && n.recipient_nim === currentUser.nim) ||
        (n.profile_id && n.profile_id === currentUser.id)
      );
    }
    if (currentUser.role === 'dosen') {
      return (
        !n.recipient_role ||
        n.recipient_role === 'dosen' ||
        (currentUser.nip && n.recipient_nip === currentUser.nip) ||
        (currentUser.nim && n.recipient_nip === currentUser.nim)
      );
    }
    return true;
  });

  const unreadCount = userNotifications.filter(n => !n.is_read).length;

  const roleBadges = {
    mahasiswa: { label: 'Mahasiswa', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: GraduationCap },
    kaprodi: { label: 'Kaprodi', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: BookOpen },
    admin_sarana: { label: 'Admin Sarana', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Building2 }
  };

  const userRole = currentUser?.role || 'mahasiswa';
  const currentRoleBadge = roleBadges[userRole] || roleBadges.mahasiswa;
  const RoleIcon = currentRoleBadge.icon;

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
                <span className="font-extrabold text-xl tracking-tight text-slate-900">SIMTA</span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
                Sistem Informasi Manajemen Tugas Akhir &amp; Ruang Sidang
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
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white"></span>
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

                  {/* Email Sync Status Banner for Mahasiswa */}
                  {userRole === 'mahasiswa' && (
                    <div className="px-4 py-2 bg-indigo-50/90 border-b border-indigo-100 flex items-center justify-between text-[11px] text-indigo-950">
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
                      userNotifications.map(n => (
                        <div key={n.id} className={`p-3.5 hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-indigo-50/20' : ''}`}>
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-900">{n.title}</p>
                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                          
                          {/* Email notification confirmation pill */}
                          {userRole === 'mahasiswa' && (
                            <div className="mt-2 flex items-center space-x-1 text-[10px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-200/60 rounded px-1.5 py-0.5 w-fit">
                              <Mail className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>Salinan otomatis terkirim ke email ({n.email_to || currentUser?.email || '09010182428002@student.unsri.ac.id'})</span>
                            </div>
                          )}

                          <span className="text-[10px] text-slate-400 mt-1.5 block">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      ))
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
