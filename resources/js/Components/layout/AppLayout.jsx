import React, { useEffect, useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { Smartphone, Monitor, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDevice } from '../../context/DeviceContext.jsx';
import Navbar from './Navbar.jsx';
import PublicNavbar from './PublicNavbar.jsx';
import MobilePublicNavbar from './MobilePublicNavbar.jsx';
import Sidebar from './Sidebar.jsx';
import MobileBottomNav from './MobileBottomNav.jsx';
import MobileMenuSheet from './MobileMenuSheet.jsx';
import Footer from './Footer.jsx';
import RealtimeNotificationToast from '../common/RealtimeNotificationToast.jsx';
import RealtimeBimbinganAlert from '../common/RealtimeBimbinganAlert.jsx';
import { WhatsAppNotificationToast } from '../common/StudentWhatsAppLink.jsx';

export default function AppLayout({ children }) {
  const { url } = usePage();
  const { currentUser } = useAuth();
  const { isMobileMode, isPhysicalMobile, isNarrowViewport, os, osLabel, setViewPreference } = useDevice();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [url]);

  // Helper untuk mendeteksi rute publik autentikasi & verifikasi (Guest/Auth)
  const isAuthRoute = (path) => {
    if (!path) return false;
    return (
      path === '/login' ||
      path.startsWith('/login') ||
      path === '/register' ||
      path.startsWith('/register') ||
      path === '/forgot-password' ||
      path.startsWith('/forgot-password') ||
      path === '/reset-password' ||
      path.startsWith('/reset-password') ||
      path.startsWith('/verify')
    );
  };

  useEffect(() => {
    // Abaikan seluruh alur autentikasi publik & verifikasi dari guard dashboard
    if (isAuthRoute(url)) {
      return;
    }

    // 1. Guard Admin Routes: only users with role 'admin' can access /admin and /admin-simta
    const isAdminRoute = url.startsWith('/admin-simta') || url.startsWith('/admin');
    if (isAdminRoute) {
      if (!currentUser) {
        router.visit('/login');
        return;
      }
      if (currentUser.role !== 'admin') {
        if (currentUser.role === 'mahasiswa') router.visit('/dashboard');
        else if (currentUser.role === 'dosen') router.visit('/dosen/dashboard');
        else if (currentUser.role === 'kaprodi') router.visit('/kaprodi/dashboard');
        else router.visit('/login');
        return;
      }
    }

    // 2. Prevent Admin from straying into student/dosen/kaprodi workspaces
    if (currentUser?.role === 'admin' && (url === '/dashboard' || url.startsWith('/kaprodi') || url.startsWith('/dosen'))) {
      router.visit('/admin-simta/dashboard');
      return;
    }

    // 3. Role isolation between Dosen and Kaprodi
    if (currentUser?.role === 'dosen' && url.startsWith('/kaprodi')) {
      router.visit('/dosen/dashboard');
    } else if (currentUser?.role === 'kaprodi' && url.startsWith('/dosen')) {
      router.visit('/kaprodi/dashboard');
    } else if (
      currentUser?.role === 'mahasiswa' && 
      !currentUser?.is_profile_completed && 
      !url.startsWith('/profile') &&
      !isAuthRoute(url) &&
      url !== '/' &&
      url !== '/documents'
    ) {
      router.visit('/profile?first_login=true');
    }
  }, [currentUser?.role, currentUser?.is_profile_completed, url]);

  const isHomePage = url === '/';
  const isDokumenPage = url === '/documents';
  const isAuthPage = isAuthRoute(url);

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-slate-900 font-sans">
        {children}
      </div>
    );
  }

  if (isHomePage) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden">
        {isMobileMode ? <MobilePublicNavbar /> : <PublicNavbar />}
        {/* Full width main container without outer margins for edge-to-edge Hero */}
        <main className="flex-1 w-full overflow-x-hidden">
          {children}
        </main>
        <Footer />
        {!isMobileMode && (isPhysicalMobile || isNarrowViewport) && (
          <button
            type="button"
            onClick={() => setViewPreference('mobile')}
            className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg border border-indigo-400/40"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Tampilan HP</span>
          </button>
        )}
      </div>
    );
  }

  if (isDokumenPage) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden">
        {isMobileMode ? <MobilePublicNavbar /> : <PublicNavbar />}
        <main className={`flex-1 w-full overflow-x-hidden ${isMobileMode ? 'max-w-lg mx-auto px-3 py-3' : ''}`}>
          {children}
        </main>
        {!isMobileMode && (isPhysicalMobile || isNarrowViewport) && (
          <button
            type="button"
            onClick={() => setViewPreference('mobile')}
            className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg border border-indigo-400/40"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Tampilan HP</span>
          </button>
        )}
      </div>
    );
  }

  if (isMobileMode) {
    const osTag = os === 'desktop' ? 'Mode HP' : `${osLabel} Mobile`;
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans overflow-x-hidden">
        <Navbar />
        <RealtimeBimbinganAlert />

        {/* Mobile Device Status & Quick Switch Strip */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-slate-200 px-3.5 py-1.5">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[11px] font-bold text-slate-700 truncate">
                Tampilan HP ({osTag})
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setViewPreference('desktop')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold transition-colors"
              >
                <Monitor className="w-3 h-3" />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200/70 transition-colors"
              >
                <Menu className="w-3 h-3" />
                <span>Menu</span>
              </button>
            </div>
          </div>
        </div>

        <main className="flex-1 w-full max-w-lg mx-auto px-3.5 pt-3.5 pb-24 min-w-0 overflow-x-hidden">
          {children}
        </main>

        <MobileBottomNav isMenuOpen={mobileMenuOpen} onOpenMenu={() => setMobileMenuOpen(true)} />
        <MobileMenuSheet isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        <RealtimeNotificationToast />
        <WhatsAppNotificationToast />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <RealtimeBimbinganAlert />
      <div className="flex-1 flex w-full">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
      {(isPhysicalMobile || isNarrowViewport) && (
        <button
          type="button"
          onClick={() => setViewPreference('mobile')}
          className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg border border-indigo-400/40"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Mode HP</span>
        </button>
      )}
      <RealtimeNotificationToast />
      <WhatsAppNotificationToast />
    </div>
  );
}
