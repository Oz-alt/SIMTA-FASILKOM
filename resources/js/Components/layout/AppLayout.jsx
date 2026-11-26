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

  const getRoleHomePath = (role) => {
    if (role === 'admin') return '/admin-simta/dashboard';
    if (role === 'kaprodi') return '/kaprodi/dashboard';
    if (role === 'dosen') return '/dosen/dashboard';
    return '/dashboard';
  };

  const cleanPath = (url || '/').split('?')[0].split('#')[0] || '/';
  const isPublicPath = cleanPath === '/' || cleanPath === '/documents' || cleanPath.startsWith('/documents/') || isAuthRoute(cleanPath);

  useEffect(() => {
    // Abaikan seluruh rute publik (Beranda, Dokumen, Login/Reset/Verify)
    if (isPublicPath) {
      return;
    }

    // 1. Wajib login untuk seluruh rute non-publik (BUG-01)
    if (!currentUser) {
      router.visit('/login');
      return;
    }

    const role = currentUser.role;
    const isAdminRoute = cleanPath.startsWith('/admin-simta') || cleanPath.startsWith('/admin');
    const isKaprodiRoute = cleanPath.startsWith('/kaprodi');
    const isDosenRoute = cleanPath.startsWith('/dosen');
    const isSharedAuthenticatedRoute =
      cleanPath.startsWith('/profile') ||
      cleanPath === '/thesis/archive' ||
      cleanPath.startsWith('/thesis/archive/') ||
      cleanPath === '/schedule' ||
      cleanPath.startsWith('/schedule/');
    const isMahasiswaExclusiveRoute =
      cleanPath === '/dashboard' ||
      cleanPath.startsWith('/booking') ||
      (cleanPath.startsWith('/thesis') && !cleanPath.startsWith('/thesis/archive'));

    // 2. Isolasi ketat rute per Role (BUG-02 & BUG-03)
    if (isAdminRoute && role !== 'admin') {
      router.visit(getRoleHomePath(role));
      return;
    }
    if (isKaprodiRoute && role !== 'kaprodi') {
      router.visit(getRoleHomePath(role));
      return;
    }
    if (isDosenRoute && role !== 'dosen') {
      router.visit(getRoleHomePath(role));
      return;
    }
    if (isMahasiswaExclusiveRoute && role !== 'mahasiswa') {
      router.visit(getRoleHomePath(role));
      return;
    }

    // 3. Kunci aktivasi profil pertama kali login khusus Mahasiswa
    if (
      role === 'mahasiswa' &&
      !currentUser.is_profile_completed &&
      !cleanPath.startsWith('/profile') &&
      !isSharedAuthenticatedRoute
    ) {
      router.visit('/profile?first_login=true');
    } else if (
      role === 'mahasiswa' &&
      !currentUser.is_profile_completed &&
      !cleanPath.startsWith('/profile')
    ) {
      router.visit('/profile?first_login=true');
    }
  }, [currentUser, currentUser?.role, currentUser?.is_profile_completed, cleanPath, isPublicPath]);

  const isHomePage = cleanPath === '/';
  const isDokumenPage = cleanPath === '/documents' || cleanPath.startsWith('/documents/');
  const isAuthPage = isAuthRoute(cleanPath);

  if (!currentUser && !isPublicPath) {
    return null;
  }

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
