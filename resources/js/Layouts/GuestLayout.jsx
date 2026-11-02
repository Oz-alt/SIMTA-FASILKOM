import React from 'react';
import AuthLayout from './AuthLayout.jsx';

/**
 * GuestLayout: Wrapper alias untuk alur autentikasi publik SIMONITA FASILKOM.
 */
export default function GuestLayout({ children }) {
  return (
    <AuthLayout>
      {children}
    </AuthLayout>
  );
}
