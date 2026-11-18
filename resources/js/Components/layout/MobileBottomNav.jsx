import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Menu, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getMobileBottomTabs, isNavPathActive } from '../../lib/navigationConfig.js';

export default function MobileBottomNav({ isMenuOpen, onOpenMenu }) {
  const { url } = usePage();
  const { currentUser } = useAuth();

  if (!currentUser) {
    return null;
  }

  const tabs = getMobileBottomTabs(currentUser.role);
  const isProfileLocked = currentUser.role === 'mahasiswa' && !currentUser.is_profile_completed;
  const isAnyBottomTabActive = tabs.some((tab) => isNavPathActive(url, tab.to, tab.extraMatches));

  return (
    <nav
      aria-label="Navigasi Utama Mobile"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-6px_24px_rgba(15,23,42,0.08)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="max-w-lg mx-auto grid grid-cols-5 h-16 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const locked = Boolean(tab.lockable && isProfileLocked);
          const targetHref = locked ? '/profile?first_login=true' : tab.to;
          const active = !isMenuOpen && !locked && isNavPathActive(url, tab.to, tab.extraMatches);

          return (
            <Link
              key={tab.to}
              href={targetHref}
              className={`relative flex flex-col items-center justify-center gap-0.5 px-1 transition-colors select-none active:scale-95 ${
                locked
                  ? 'text-slate-400'
                  : active
                    ? 'text-indigo-600'
                    : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {active && (
                <span className="absolute top-0 w-8 h-1 rounded-b-full bg-indigo-600" />
              )}
              <div
                className={`relative flex items-center justify-center w-9 h-7 rounded-full transition-colors ${
                  active ? 'bg-indigo-50' : ''
                }`}
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.4 : 2} />
                {locked && (
                  <Lock className="w-2.5 h-2.5 text-amber-500 absolute -top-0.5 -right-0.5 bg-white rounded-full" />
                )}
              </div>
              <span className={`text-[10px] leading-tight truncate max-w-full ${active ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onOpenMenu}
          className={`relative flex flex-col items-center justify-center gap-0.5 px-1 transition-colors select-none active:scale-95 ${
            isMenuOpen || !isAnyBottomTabActive
              ? 'text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {(isMenuOpen || !isAnyBottomTabActive) && (
            <span className="absolute top-0 w-8 h-1 rounded-b-full bg-indigo-600" />
          )}
          <div
            className={`flex items-center justify-center w-9 h-7 rounded-full transition-colors ${
              isMenuOpen || !isAnyBottomTabActive ? 'bg-indigo-50' : ''
            }`}
          >
            <Menu className="w-[18px] h-[18px]" strokeWidth={isMenuOpen || !isAnyBottomTabActive ? 2.4 : 2} />
          </div>
          <span className={`text-[10px] leading-tight ${isMenuOpen || !isAnyBottomTabActive ? 'font-bold' : 'font-medium'}`}>
            Menu
          </span>
        </button>
      </div>
    </nav>
  );
}
