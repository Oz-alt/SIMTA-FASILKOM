import React from 'react';

/**
 * AuthLayout: Layout autentikasi khusus & mandiri (Guest / Auth Layout).
 * Sepenuhnya independen dari dashboard role Admin, Mahasiswa, Dosen, maupun Kaprodi.
 * Menjamin seluruh halaman publik (Login, Lupa Sandi, Reset Sandi, Registrasi):
 * 1. Bebas dari Sidebar Admin dan Navbar Dashboard
 * 2. Bebas dari kebocoran data sesi / profil / role sebelumnya
 * 3. Menghadirkan kanvas autentikasi layar penuh (full-viewport) yang bersih dan konsisten
 */
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full bg-slate-900 font-sans antialiased text-slate-900 select-none overflow-x-hidden">
      {children}
    </div>
  );
}

