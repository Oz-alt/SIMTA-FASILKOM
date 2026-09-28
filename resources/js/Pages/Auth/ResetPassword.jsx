import React, { useState, useEffect, useRef } from 'react';
import { Link, router, Head } from '@inertiajs/react';
import { useAuth } from '../../context/AuthContext.jsx';
import gsap from 'gsap';
import unsriLogo from '../../assets/photo/unsri logo.png';
import diklatImg from '../../assets/photo/diklat.jpg';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  ShieldCheck
} from 'lucide-react';

export default function ResetPassword({ token, email }) {
  const { confirmPasswordReset } = useAuth();

  // Read query params as fallback if not in props
  const getQueryParam = (name) => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get(name) || '';
  };

  const initialEmail = email || getQueryParam('email') || '';
  const initialToken = token || getQueryParam('token') || '';

  const [userEmail, setUserEmail] = useState(initialEmail);
  const [resetToken, setResetToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const formPanelRef = useRef(null);
  const leftContentRef = useRef(null);

  // GSAP Entrance Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (formPanelRef.current) {
        gsap.fromTo(
          formPanelRef.current,
          { opacity: 0, x: 20 },
          { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' }
        );
      }

      if (leftContentRef.current) {
        gsap.fromTo(
          leftContentRef.current,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.7, delay: 0.1, ease: 'power3.out' }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setErrorMessage('Silakan masukkan kata sandi baru.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal harus 6 karakter.');
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok dengan kata sandi baru.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      await confirmPasswordReset({
        emailOrToken: userEmail || resetToken,
        newPassword: password
      });

      setIsLoading(false);
      setIsSuccess(true);

      // Auto redirect to login after 2 seconds
      setTimeout(() => {
        router.visit('/login');
      }, 2000);

    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Gagal mengatur ulang kata sandi. Silakan coba kembali.');
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-white text-slate-900 font-sans select-none overflow-x-hidden">
      <Head title="Reset Kata Sandi - SIMTA FASILKOM" />

      {/* LEFT COLUMN: 50% / 7 Cols - Background Diklat Photo with UNSRI Blue Overlay */}
      <div className="lg:col-span-6 xl:col-span-7 relative hidden lg:flex flex-col justify-between p-10 xl:p-14 bg-blue-950 text-white overflow-hidden">

        {/* Background Image (Diklat.jpg) */}
        <div
          className="absolute inset-0 bg-cover bg-[70%_center] bg-no-repeat opacity-90"
          style={{ backgroundImage: `url(${diklatImg})` }}
        />

        {/* Semi-Transparent UNSRI Blue Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/80 via-blue-900/70 to-blue-950/85 backdrop-blur-[1px]"></div>

        {/* Top Header / Branding */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3.5 group">
            <img
              src={unsriLogo}
              alt="Logo UNSRI"
              className="h-11 w-auto object-contain group-hover:scale-105 transition-transform"
            />
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white uppercase block leading-none">
                SIMTA FASILKOM
              </span>
              <span className="text-[10px] text-blue-200 uppercase font-semibold tracking-wider block mt-1">
                Universitas Sriwijaya
              </span>
            </div>
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all border border-white/20 backdrop-blur-md cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-white/80" />
            <span>Kembali ke Login</span>
          </Link>
        </div>

        {/* Middle Main Banner Content */}
        <div ref={leftContentRef} className="relative z-10 max-w-xl my-auto pt-8 space-y-5">
          <h1 className="text-3xl xl:text-4xl font-bold tracking-tight text-white leading-tight">
            Perbarui Kata Sandi Akun
          </h1>

          <p className="text-sm text-blue-100/90 leading-relaxed font-normal">
            Pastikan kata sandi baru Anda kuat, aman, dan mudah diingat untuk mengakses portal SIMTA FASILKOM UNSRI.
          </p>

          {/* Security Recommendations */}
          <div className="space-y-3 pt-4 text-xs font-medium text-blue-100">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Gunakan kombinasi minimal 6 karakter</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Hindari menggunakan kata sandi yang mudah ditebak</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Kata sandi baru langsung aktif setelah konfirmasi</span>
            </div>
          </div>
        </div>

        {/* Bottom Left Footer */}
        <div className="relative z-10 text-xs text-blue-300/80 font-medium">
          © 2026 FASILKOM UNSRI.
        </div>

      </div>

      {/* RIGHT COLUMN: 50% / 5 Cols - Form Panel */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 xl:p-14 bg-white min-h-screen">

        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between pb-6 border-b border-slate-100">
          <Link href="/" className="flex items-center space-x-2.5">
            <img src={unsriLogo} alt="Logo UNSRI" className="h-9 w-auto object-contain" />
            <span className="font-extrabold text-lg text-slate-900 uppercase">SIMTA</span>
          </Link>
          <Link href="/login" className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center space-x-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Login</span>
          </Link>
        </div>

        {/* Center Form Container */}
        <div ref={formPanelRef} className="my-auto max-w-md w-full mx-auto space-y-7 py-4">

          {/* Header Title */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-md border border-blue-100 inline-block">
              Perbarui Kata Sandi
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight pt-1">
              Atur Ulang Kata Sandi
            </h2>
            <p className="text-xs text-slate-500">
              Buat kata sandi baru untuk akun Anda.
            </p>
          </div>

          {/* Success Banner */}
          {isSuccess ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-emerald-950">Kata Sandi Berhasil Diperbarui!</h3>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Kata sandi baru akun Anda telah berhasil disimpan. Mengalihkan Anda ke halaman login...
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
              >
                Masuk Sekarang
              </Link>
            </div>
          ) : (
            <>
              {/* Error Message Alert */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Reset Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Email / Identifier (Read-only or editable) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Alamat Email / NIM / NIP
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="Email atau NIM/NIP Akun"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm text-slate-900 bg-slate-50 transition-all outline-none font-medium"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Kata Sandi Baru *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi baru (min. 6 karakter)..."
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm text-slate-900 bg-white transition-all outline-none font-medium"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Konfirmasi Kata Sandi Baru *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      placeholder="Ketik ulang kata sandi baru..."
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm text-slate-900 bg-white transition-all outline-none font-medium"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Menyimpan Kata Sandi Baru...</span>
                    </>
                  ) : (
                    <span>Simpan Kata Sandi Baru</span>
                  )}
                </button>

              </form>
            </>
          )}

          {/* Back to Login Link */}
          <div className="text-center text-xs text-slate-600 pt-2 border-t border-slate-100">
            <Link href="/login" className="text-blue-600 hover:text-blue-800 font-bold transition-colors">
              Kembali ke Halaman Login
            </Link>
          </div>

        </div>

        {/* Right Footer Copyright */}
        <div className="pt-6 text-center text-xs text-slate-400 font-medium border-t border-slate-100">
          Fakultas Ilmu Komputer UNSRI
        </div>

      </div>

    </div>
  );
}
