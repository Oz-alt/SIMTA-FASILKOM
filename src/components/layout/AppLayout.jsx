import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import PublicNavbar from './PublicNavbar.jsx';
import Sidebar from './Sidebar.jsx';
import Footer from './Footer.jsx';

export default function AppLayout({ children }) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isDokumenPage = location.pathname === '/documents';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
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
