import React, { useState, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
  X,
  ChevronRight,
  Lock,
  User,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getRoleMenuGroups, isNavPathActive } from '../../lib/navigationConfig.js';

const ROLE_LABELS = {
  mahasiswa: 'Mahasiswa',
  dosen: 'Dosen Pembimbing',
  kaprodi: 'Kaprodi',
  admin: 'Admin SIMTA',
};

export default function MobileMenuSheet({ isOpen, onClose }) {
  const { url } = usePage();
  const { currentUser, logout } = useAuth();
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [currentUser?.avatar_url]);

  if (!isOpen || !currentUser) {
    return null;
  }

  const menuGroups = getRoleMenuGroups(currentUser.role);
  const isProfileLocked = currentUser.role === 'mahasiswa' && !currentUser.is_profile_completed;
  const displayName = currentUser.nama || currentUser.name || 'Pengguna';
  const initials = String(displayName)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || '')
    .join('');

  const handleNavigate = (href) => {
    onClose();
    router.visit(href);
  };

  const handleLogout = () => {
    onClose();
    logout();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Menu Navigasi"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-50 rounded-t-3xl shadow-2xl border-t border-slate-200 flex flex-col max-h-[86vh] overflow-hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle & Top Bar */}
        <div className="bg-white px-5 pt-3 pb-4 border-b border-slate-200 shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold text-slate-900 tracking-tight">
              Menu Navigasi
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup menu"
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Drawer Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" data-lenis-prevent>
          {/* User Identity Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 shadow-sm">
              {currentUser.avatar_url && !avatarError ? (
                <img
                  src={currentUser.avatar_url}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initials || 'U'}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 leading-snug break-words">
                {displayName}
              </p>
              <p className="text-xs font-mono text-slate-500 mt-0.5 truncate">
                {currentUser.nim || currentUser.nip || currentUser.email || '-'}
              </p>
              <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
                {ROLE_LABELS[currentUser.role] || currentUser.role}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleNavigate('/profile')}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold shrink-0"
            >
              Profil
            </button>
          </div>

          {/* Incomplete Profile Warning for Mahasiswa */}
          {isProfileLocked && (
            <button
              type="button"
              onClick={() => handleNavigate('/profile?first_login=true')}
              className="w-full text-left bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 active:scale-[0.99] transition-transform"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-amber-900">Aktivasi Profil Diperlukan</p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  Lengkapi Nomor HP WhatsApp, Jenis Kelamin, dan kata sandi baru untuk membuka seluruh fitur.
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-600 shrink-0 mt-1" />
            </button>
          )}

          {/* Full Role Menu Groups */}
          {menuGroups.map((group) => (
            <div key={group.id} className="space-y-2">
              <h3 className="px-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                {group.label}
              </h3>
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const locked = Boolean(item.lockable && isProfileLocked);
                  const targetHref = locked ? '/profile?first_login=true' : item.to;
                  const active = !locked && isNavPathActive(url, item.to, item.extraMatches);

                  return (
                    <Link
                      key={item.to}
                      href={targetHref}
                      onClick={onClose}
                      className={`flex items-center justify-between px-4 py-3.5 min-h-[50px] transition-colors active:bg-slate-50 ${
                        active ? 'bg-indigo-50/70 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            active
                              ? 'bg-indigo-600 text-white'
                              : locked
                                ? 'bg-slate-100 text-slate-400'
                                : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`text-xs truncate ${active ? 'font-bold' : 'font-semibold'}`}>
                          {item.label}
                        </span>
                      </div>
                      {locked ? (
                        <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      ) : (
                        <ChevronRight className={`w-4 h-4 shrink-0 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sticky Bottom Account Actions */}
        <div className="bg-white border-t border-slate-200 px-4 py-3.5 grid grid-cols-2 gap-3 shrink-0">
          <Link
            href="/profile"
            onClick={onClose}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
          >
            <User className="w-4 h-4" />
            <span>Profil &amp; Sandi</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </div>
    </div>
  );
}
