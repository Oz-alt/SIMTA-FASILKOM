import React, { useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { useAuth } from '../../context/AuthContext.jsx';
import Navbar from './Navbar.jsx';
import PublicNavbar from './PublicNavbar.jsx';
import Sidebar from './Sidebar.jsx';
import Footer from './Footer.jsx';

export default function AppLayout({ children }) {
  const { url } = usePage();
  const { currentUser } = useAuth();

  useEffect(() => {
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
      <div className="flex-1 flex w-full">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
