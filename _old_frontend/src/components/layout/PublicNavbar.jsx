import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import unsriLogo from '../../assets/photo/unsri logo.png';

export default function PublicNavbar() {
  const headerRef = useRef(null);

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -15 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      );
    }
  }, []);

  return (
    <header ref={headerRef} className="sticky top-0 z-50 bg-white border-b border-slate-200 text-slate-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img 
              src={unsriLogo} 
              alt="Logo UNSRI" 
              className="h-10 w-auto object-contain group-hover:scale-105 transition-transform" 
            />
            <span className="font-extrabold text-xl tracking-tight text-slate-900 uppercase">
              SIMTA FASILKOM
            </span>
          </Link>

          {/* Right Action Links */}
          <div className="flex items-center space-x-6 sm:space-x-8 text-sm font-semibold text-slate-700">
            <Link to="/documents" className="hover:text-blue-600 transition-colors">
              Dokumen
            </Link>
            
            <Link
              to="/login"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/30 transition-all"
            >
              Masuk
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
}
