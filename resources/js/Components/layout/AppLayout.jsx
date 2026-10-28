import React, { useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { useAuth } from '../../context/AuthContext.jsx';
import Navbar from './Navbar.jsx';
import PublicNavbar from './PublicNavbar.jsx';
import Sidebar from './Sidebar.jsx';
import Footer from './Footer.jsx';
import RealtimeNotificationToast from '../common/RealtimeNotificationToast.jsx';
import RealtimeBimbinganAlert from '../common/RealtimeBimbinganAlert.jsx';
import { WhatsAppNotificationToast } from '../common/StudentWhatsAppLink.jsx';

export default function AppLayout({ children }) {
  const { url } = usePage();
  const { currentUser } = useAuth();

  useEffect(() => {
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
      !url.startsWith('/login') &&
      !url.startsWith('/register') &&
      !url.startsWith('/verify') &&
      url !== '/' &&
      url !== '/documents'
    ) {
      router.visit('/profile?first_login=true');
    }
  }, [currentUser?.role, currentUser?.is_profile_completed, url]);
  const isHomePage = url === '/';
  const isDokumenPage = url === '/documents';
  const isAuthPage = url === '/login' || url === '/register';
  const isVerifyPage = url.startsWith('/verify');

  if (isAuthPage || isVerifyPage) {
    return (
      <div className="min-h-screen bg-slate-900 font-sans">
        {children}
      </div>
    );
  }

  if (isHomePage) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <PublicNavbar />
        {/* Full width main container without outer margins for edge-to-edge Hero */}
        <main className="flex-1 w-full">
          {children}
        </main>
        <Footer />
      </div>
    );
  }

  if (isDokumenPage) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <PublicNavbar />
        <main className="flex-1 w-full">
          {children}
        </main>
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
