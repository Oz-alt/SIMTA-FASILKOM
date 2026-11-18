import React from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
  X,
  Smartphone,
  Monitor,
  ChevronRight,
  Lock,
  User,
  LogOut,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDevice } from '../../context/DeviceContext.jsx';
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
  const { os, osLabel, viewPreference, setViewPreference } = useDevice();

  if (!isOpen || !currentUser) {
    return null;
  }

  const menuGroups = getRoleMenuGroups(currentUser.role);
  const isProfileLocked = currentUser.role === 'mahasiswa' && !currentUser.is_profile_completed;
  const initials = String(currentUser.name || 'U')
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

  const osBadgeTheme =
    os === 'ios'
      ? 'bg-sky-50 text-sky-700 border-sky-200'
      : os === 'android'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-indigo-50 text-indigo-700 border-indigo-200';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Menu Navigasi Mobile"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-50 rounded-t-3xl shadow-2xl border-t border-slate-200 flex flex-col max-h-[88vh] overflow-hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle & Top Bar */}
        <div className="bg-white px-5 pt-3 pb-3.5 border-b border-slate-200 shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-900 tracking-tight">Menu SIMONITA</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${osBadgeTheme}`}>
                <Smartphone className="w-3 h-3" />
                {os === 'desktop' ? 'Mode Mobile' : `${osLabel} App UI`}
              </span>
            </div>
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
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
              <p className="text-[11px] text-slate-500 truncate">
                {currentUser.nim || currentUser.nip || currentUser.email || '-'}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
                {ROLE_LABELS[currentUser.role] || currentUser.role}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleNavigate('/profile')}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold shrink-0"
            >
              Profil
            </button>
          </div>

          {/* Incomplete Profile Warning for Mahasiswa */}
          {isProfileLocked && (
            <button
              type="button"
              onClick={() => handleNavigate('/profile?first_login=true')}
              className="w-full text-left bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5 active:scale-[0.99] transition-transform"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-amber-900">Aktivasi Profil Diperlukan</p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-snug">
                  Lengkapi Nomor HP WhatsApp, Jenis Kelamin, dan kata sandi baru untuk membuka seluruh fitur.
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-600 shrink-0 mt-1" />
            </button>
          )}

          {/* UI Mode Switcher */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Mode Tampilan Layar
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Terdeteksi: {osLabel}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
              {[
                { key: 'auto', label: 'Otomatis', icon: Sparkles },
                { key: 'mobile', label: 'Mode HP', icon: Smartphone },
                { key: 'desktop', label: 'Desktop', icon: Monitor },
              ].map((option) => {
                const OptIcon = option.icon;
                const active = viewPreference === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      setViewPreference(option.key);
                      if (option.key === 'desktop') {
                        onClose();
                      }
                    }}
                    className={`flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-[11px] font-bold transition-all ${
                      active
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <OptIcon className="w-3.5 h-3.5" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full Role Menu Groups */}
          {menuGroups.map((group) => (
            <div key={group.id} className="space-y-1.5">
              <h3 className="px-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {group.label}
              </h3>
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
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
                      className={`flex items-center justify-between px-4 py-3 min-h-[48px] transition-colors active:bg-slate-50 ${
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
        <div className="bg-white border-t border-slate-200 px-4 py-3 grid grid-cols-2 gap-2.5 shrink-0">
          <Link
            href="/profile"
            onClick={onClose}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
          >
            <User className="w-4 h-4" />
            <span>Profil & Sandi</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </div>
    </div>
  );
}
