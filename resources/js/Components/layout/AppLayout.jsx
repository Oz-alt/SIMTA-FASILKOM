import React, { useEffect, useState } from 'react';
import { usePage, router } from '@inertiajs/react';
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
  const { isMobileMode } = useDevice();
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
      </div>
    );
  }

  if (isDokumenPage) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden">
        {isMobileMode ? <MobilePublicNavbar /> : <PublicNavbar />}
        <main className={`flex-1 w-full overflow-x-hidden ${isMobileMode ? 'max-w-lg mx-auto px-4 py-4' : ''}`}>
          {children}
        </main>
      </div>
    );
  }

  if (isMobileMode) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans overflow-x-hidden">
        <Navbar />
        <RealtimeBimbinganAlert />

        <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-4 pb-24 min-w-0 overflow-x-hidden">
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
      <RealtimeNotificationToast />
      <WhatsAppNotificationToast />
    </div>
  );
}
