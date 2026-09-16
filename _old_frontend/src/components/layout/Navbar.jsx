import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  GraduationCap, 
  Bell, 
  User, 
  ChevronDown, 
  CheckCircle2, 
  BookOpen, 
  Building2 
} from 'lucide-react';

import unsriLogo from '../../assets/photo/unsri logo.png';

export default function Navbar() {
  const { currentUser, switchRole, notifications } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
          <Link to="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
            <img 
              src={unsriLogo} 
              alt="Logo UNSRI" 
              className="h-10 w-auto object-contain" 
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">SIMTA</span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
                Sistem Informasi Manajemen Tugas Akhir & Ruang Sidang
              </p>
            </div>
          </Link>

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
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">Notifikasi System</span>
                    <span className="text-xs text-indigo-600 font-medium">{unreadCount} baru</span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">Tidak ada notifikasi</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors">
                          <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                to="/login"
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
