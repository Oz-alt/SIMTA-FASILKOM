import React, { useState, useEffect, useRef } from 'react';
import { Link, router } from '@inertiajs/react';
import { useAuth } from '../context/AuthContext.jsx';
import gsap from 'gsap';
import unsriLogo from '../assets/photo/unsri logo.png';
import diklatImg from '../assets/photo/diklat.jpg';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';


export default function LoginPage() {
  const navigate = (url) => router.visit(url);
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessLoading, setIsSuccessLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Memverifikasi Akses Akun...');
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
    if (!identifier.trim()) {
      setErrorMessage('NIM / NIP wajib diisi.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const redirectPath = await login(identifier, password);
      
      // Trigger realistic production skeleton loading transition
      setIsSuccessLoading(true);
      setLoadingText('Memverifikasi Hak Akses UNSRI...');

      setTimeout(() => {
        setLoadingText('Menyiapkan Modul & Data Dashboard...');
      }, 500);

      setTimeout(() => {
        setIsLoading(false);
        navigate(redirectPath);
      }, 1100);

    } catch (err) {
      setIsLoading(false);
      setIsSuccessLoading(false);
      setErrorMessage(err.message || 'Gagal masuk. Periksa kembali kredensial Anda.');
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-white text-slate-900 font-sans select-none overflow-x-hidden">

      {/* LEFT COLUMN: 50% / 7 Cols - Background Diklat Photo with UNSRI Blue Overlay */}
      <div className="lg:col-span-6 xl:col-span-7 relative hidden lg:flex flex-col justify-between p-10 xl:p-14 bg-blue-950 text-white overflow-hidden">

        {/* Background Image (Diklat.jpg) Perfectly Focused (70% Position) */}
        <div
          className="absolute inset-0 bg-cover bg-[70%_center] bg-no-repeat opacity-90"
          style={{ backgroundImage: `url(${diklatImg})` }}
        />

        {/* Elegant Semi-Transparent UNSRI Blue Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/75 via-blue-900/65 to-blue-950/80 backdrop-blur-[1px]"></div>

        {/* Top Header / Branding in Left Column */}
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
            href="/"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all border border-white/20 backdrop-blur-md cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-white/80" />
            <span>Beranda</span>
          </Link>
        </div>

        {/* Middle Main Banner Content */}
        <div ref={leftContentRef} className="relative z-10 max-w-xl my-auto pt-8 space-y-5">
          <h1 className="text-3xl xl:text-4xl font-bold tracking-tight text-white leading-tight">
            Manajemen Tugas Akhir &amp; Peminjaman Ruang Sidang
          </h1>

          <p className="text-sm text-blue-100/90 leading-relaxed font-normal">
            Portal terintegrasi untuk mahasiswa, dosen kaprodi, dan admin sarana Fakultas Ilmu Komputer UNSRI Kampus Palembang &amp; Indralaya.
          </p>

          {/* Feature Bullets */}
          <div className="space-y-3 pt-4 text-xs font-medium text-blue-100">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Real-Time Similarity Check Engine Berbasis Trigram &amp; FTS</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Validasi Anti-Bentrok Jadwal Ruang Sidang DIPKOM &amp; Diklat</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Persetujuan Judul &amp; Timeline Sidang Otomatis</span>
            </div>
          </div>
        </div>

        {/* Bottom Left Footer */}
        <div className="relative z-10 text-xs text-blue-300/80 font-medium">
          © 2026 FASILKOM UNSRI.
        </div>

      </div>

      {/* RIGHT COLUMN: 50% / 5 Cols - Clean White Login Form Panel */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 xl:p-14 bg-white min-h-screen">

        {/* Mobile Header (Shows only on small screens) */}
        <div className="lg:hidden flex items-center justify-between pb-6 border-b border-slate-100">
          <Link href="/" className="flex items-center space-x-2.5">
            <img src={unsriLogo} alt="Logo UNSRI" className="h-9 w-auto object-contain" />
            <span className="font-extrabold text-lg text-slate-900 uppercase">SIMTA</span>
          </Link>
          <Link href="/" className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center space-x-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Beranda</span>
          </Link>
        </div>

        {/* Center Form Container */}
        <div ref={formPanelRef} className="my-auto max-w-md w-full mx-auto space-y-7 py-4">

          {/* Header Title */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-md border border-blue-100 inline-block">
              Autentikasi Akun
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight pt-1">
              Masuk ke Portal
            </h2>
            <p className="text-xs text-slate-500">
              Silakan masukkan kredensial akun Anda untuk mengakses sistem.
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Real Form Input Fields */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* NIM / NIP Input Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                NIM / NIP (Nomor Induk)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Masukkan NIM atau NIP"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm text-slate-900 bg-white transition-all outline-none font-medium"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
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

            {/* Checkbox Remember & Forgot Link */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2 text-slate-600 cursor-pointer select-none font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Ingat Saya</span>
              </label>

              <button
                type="button"
                onClick={() => alert('Sistem reset password: Silakan hubungi Laboran / Admin ICT FASILKOM UNSRI.')}
                className="text-blue-600 hover:text-blue-800 font-semibold transition-colors cursor-pointer"
              >
                Lupa Kata Sandi?
              </button>
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
                  <span>Memverifikasi Akses...</span>
                </>
              ) : (
                <span>Masuk ke Portal SIMTA</span>
              )}
            </button>

          </form>

          {/* Register Link */}
          <div className="text-center text-xs text-slate-600 pt-2 border-t border-slate-100">
            Belum memiliki akun?{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-800 font-bold transition-colors">
              Daftar Akun Mahasiswa
            </Link>
          </div>

        </div>

        {/* Right Footer Copyright */}
        <div className="pt-6 text-center text-xs text-slate-400 font-medium border-t border-slate-100">
          Fakultas Ilmu Komputer UNSRI
        </div>

      </div>

      {/* Fullscreen Premium Skeleton Loading Overlay on Successful Login */}
      {isSuccessLoading && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-300">
          <div className="max-w-md w-full bg-white/10 border border-white/20 rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center space-y-6">
            
            {/* Animated Pulsing Logo */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-blue-500/30 blur-xl animate-pulse"></div>
              <img src={unsriLogo} alt="Logo UNSRI" className="h-16 w-auto relative z-10 animate-bounce" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white tracking-wide">Autentikasi Berhasil!</h3>
              <p className="text-xs text-blue-200 font-medium animate-pulse">{loadingText}</p>
            </div>

            {/* Skeleton Loading Card Preview */}
            <div className="w-full bg-slate-800/70 rounded-2xl p-4 border border-white/15 space-y-3 text-left shadow-inner">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 animate-pulse shrink-0"></div>
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-3/4 bg-white/20 rounded-md animate-pulse"></div>
                  <div className="h-2.5 w-1/2 bg-white/15 rounded-md animate-pulse"></div>
                </div>
              </div>
              <div className="h-14 w-full bg-white/10 rounded-xl animate-pulse"></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-12 bg-white/10 rounded-xl animate-pulse"></div>
                <div className="h-12 bg-white/10 rounded-xl animate-pulse"></div>
              </div>
            </div>

            {/* Spinner Progress */}
            <div className="flex items-center space-x-2 text-xs text-blue-300 font-semibold pt-1">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              <span>Menyiapkan Halaman Dashboard Portal...</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}


