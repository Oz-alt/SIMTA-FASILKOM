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

  const rawPath = url || (typeof window !== 'undefined' ? window.location?.pathname : '/') || '/';
  const cleanPath = (rawPath.split('?')[0].split('#')[0].replace(/\/+/g, '/').replace(/\/$/, '') || '/').toLowerCase();
  const isPublicPath = cleanPath === '/' || cleanPath === '/documents' || cleanPath.startsWith('/documents/') || isAuthRoute(cleanPath);

  const role = currentUser?.role || null;
  const isAdminRoute =
    cleanPath === '/admin' ||
    cleanPath.startsWith('/admin/') ||
    cleanPath === '/admin-simta' ||
    cleanPath.startsWith('/admin-simta/') ||
    cleanPath === '/schedule' ||
    cleanPath.startsWith('/schedule/');
  const isKaprodiRoute = cleanPath === '/kaprodi' || cleanPath.startsWith('/kaprodi/');
  const isDosenRoute = cleanPath === '/dosen' || cleanPath.startsWith('/dosen/');
  const isMahasiswaExclusiveRoute =
    cleanPath === '/dashboard' ||
    cleanPath === '/booking' ||
    cleanPath.startsWith('/booking/') ||
    (cleanPath.startsWith('/thesis') && !cleanPath.startsWith('/thesis/archive'));

  const isUnauthorizedRole = Boolean(
    currentUser &&
    !isPublicPath &&
    (
      (isAdminRoute && role !== 'admin') ||
      (isKaprodiRoute && role !== 'kaprodi') ||
      (isDosenRoute && role !== 'dosen') ||
      (isMahasiswaExclusiveRoute && role !== 'mahasiswa')
    )
  );

  const isPasswordChangeRequired = Boolean(
    currentUser &&
    !isPublicPath &&
    !isUnauthorizedRole &&
    currentUser.requires_password_change &&
    !cleanPath.startsWith('/profile')
  );

  const isProfileActivationRequired = Boolean(
    currentUser &&
    !isPublicPath &&
    !isUnauthorizedRole &&
    !isPasswordChangeRequired &&
    role === 'mahasiswa' &&
    !currentUser.is_profile_completed &&
    !cleanPath.startsWith('/profile')
  );

  useEffect(() => {
    // Abaikan seluruh rute publik (Beranda, Dokumen, Login/Reset/Verify)
    if (isPublicPath) {
      return;
    }

    // 1. Wajib login untuk seluruh rute non-publik
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }

    // 2. Isolasi ketat rute per Role (cegah akses lintas role via edit URL)
    if (isUnauthorizedRole) {
      router.visit(getRoleHomePath(role), { replace: true });
      return;
    }

    // 3. Wajib ganti kata sandi sementara (pasca reset password oleh Admin)
    if (isPasswordChangeRequired) {
      router.visit('/profile?change_password_required=true', { replace: true });
      return;
    }

    // 4. Kunci aktivasi profil pertama kali login khusus Mahasiswa
    if (isProfileActivationRequired) {
      router.visit('/profile?first_login=true', { replace: true });
    }
  }, [currentUser, role, isPublicPath, isUnauthorizedRole, isPasswordChangeRequired, isProfileActivationRequired, cleanPath]);

  const isHomePage = cleanPath === '/';
  const isDokumenPage = cleanPath === '/documents' || cleanPath.startsWith('/documents/');
  const isAuthPage = isAuthRoute(cleanPath);

  if (!currentUser && !isPublicPath) {
    return null;
  }

  // Blokir render halaman secara sinkron sebelum redirect agar halaman role lain tidak pernah bocor/tampil
  if (isUnauthorizedRole) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm space-y-2">
          <p className="text-sm font-bold text-rose-700">Akses Ditolak</p>
          <p className="text-xs text-slate-600">
            Anda tidak memiliki izin untuk membuka halaman ini. Mengalihkan kembali ke dashboard Anda...
          </p>
        </div>
      </div>
    );
  }

  if (isProfileActivationRequired || isPasswordChangeRequired) {
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
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans overflow-x-hidden print:bg-white print:min-h-0">
        <Navbar />
        <RealtimeBimbinganAlert />

        <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-4 pb-24 min-w-0 overflow-x-hidden print:max-w-none print:p-0 print:m-0 print:overflow-visible">
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans print:bg-white print:min-h-0">
      <Navbar />
      <RealtimeBimbinganAlert />
      <div className="flex-1 flex w-full print:block">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden print:p-0 print:m-0 print:overflow-visible">
          {children}
        </main>
      </div>
      <RealtimeNotificationToast />
      <WhatsAppNotificationToast />
    </div>
  );
}
