import React, { useState, useEffect, useRef } from 'react';
import { Link, router, Head } from '@inertiajs/react';
import { useAuth } from '../../context/AuthContext.jsx';
import gsap from 'gsap';
import unsriLogo from '../../assets/photo/unsri logo.png';
import diklatImg from '../../assets/photo/diklat.jpg';
import {
  Lock,
  User,
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  KeyRound,
  ArrowRight
} from 'lucide-react';

export default function ForgotPassword({ status }) {
  const { requestPasswordReset } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resetResult, setResetResult] = useState(null);

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
      setErrorMessage('Silakan masukkan NIM, NIP, atau Email Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await requestPasswordReset(identifier);
      setResetResult(res);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Akun tidak ditemukan. Silakan periksa kembali identitas Anda.');
    }
  };

  const handleProceedToReset = () => {
    if (!resetResult) return;
    const url = `/reset-password?email=${encodeURIComponent(resetResult.email)}&token=${encodeURIComponent(resetResult.token)}`;
    router.visit(url);
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-white text-slate-900 font-sans select-none overflow-x-hidden">
      <Head title="Lupa Kata Sandi - SIMTA FASILKOM" />

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
            Pemulihan Akses Akun SIMTA
          </h1>

          <p className="text-sm text-blue-100/90 leading-relaxed font-normal">
            Layanan resmi pemulihan kata sandi akun Mahasiswa, Dosen Pembimbing, Kaprodi, dan Administrator Fakultas Ilmu Komputer UNSRI.
          </p>

          {/* Verification Steps Helper */}
          <div className="space-y-3 pt-4 text-xs font-medium text-blue-100">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Masukkan NIM / NIP atau Email Resmi UNSRI</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sistem memverifikasi akun Anda secara otomatis</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Buat kata sandi baru dan login kembali ke portal</span>
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
              Pemulihan Sandi
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight pt-1">
              Lupa Kata Sandi?
            </h2>
            <p className="text-xs text-slate-500">
              Masukkan NIM, NIP, atau alamat email resmi akun Anda untuk mereset kata sandi.
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Status Alert from Backend */}
          {status && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{status}</span>
            </div>
          )}

          {/* If verification succeeded */}
          {resetResult ? (
            <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Akun Terverifikasi!</h3>
                  <p className="text-[11px] text-slate-600">{resetResult.nama || resetResult.user?.nama}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-blue-100 text-xs space-y-1.5 font-medium">
                <div className="flex justify-between text-slate-600">
                  <span>NIM / NIP:</span>
                  <span className="font-bold text-slate-900 font-mono">{resetResult.user?.nim || resetResult.user?.nip || identifier}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Email Terdaftar:</span>
                  <span className="font-bold text-slate-900">{resetResult.email}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Role:</span>
                  <span className="font-bold text-blue-600 uppercase text-[10px]">{resetResult.user?.role || 'Pengguna'}</span>
                </div>
              </div>

              <p className="text-xs text-blue-900 leading-relaxed">
                Tautan verifikasi reset kata sandi telah aktif. Silakan lanjutkan untuk memasukkan kata sandi baru.
              </p>

              <button
                type="button"
                onClick={handleProceedToReset}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Lanjutkan ke Reset Kata Sandi</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setResetResult(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                >
                  Gunakan akun lain
                </button>
              </div>
            </div>
          ) : (
            /* Forgot Password Form */
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* NIM / NIP / Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  NIM / NIP / Email Akun *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Contoh: 09010182428002 atau email@unsri.ac.id"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm text-slate-900 bg-white transition-all outline-none font-medium"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-slate-500">
                  Masukkan identitas nomor induk atau email resmi yang Anda gunakan saat login.
                </p>
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
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <span>Kirim Permintaan Reset</span>
                )}
              </button>

            </form>
          )}

          {/* Back to Login Link */}
          <div className="text-center text-xs text-slate-600 pt-2 border-t border-slate-100">
            Sudah ingat kata sandi Anda?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-800 font-bold transition-colors">
              Kembali ke Login
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
