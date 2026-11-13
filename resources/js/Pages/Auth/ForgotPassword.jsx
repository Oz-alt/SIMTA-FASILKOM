import React, { useState, useEffect, useRef } from 'react';
import { Link, router, Head } from '@inertiajs/react';
import { useAuth } from '../../context/AuthContext.jsx';
import AuthLayout from '../../Layouts/AuthLayout.jsx';
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
  ArrowRight,
  RefreshCw
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
      <Head title="Lupa Kata Sandi - SIMONITA FASILKOM" />

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
                SIMONITA FASILKOM
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
            Pemulihan Akses Akun SIMONITA
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
            <span className="font-extrabold text-lg text-slate-900 uppercase">SIMONITA</span>
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

          {/* If verification succeeded / Request status */}
          {resetResult ? (
            <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              {resetResult.status === 'neutral' ? (
                <>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">Permintaan Pemulihan Diproses</h3>
                      <p className="text-[11px] text-slate-600">Verifikasi Keamanan Sistem</p>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-blue-100 text-xs leading-relaxed text-slate-700 space-y-2">
                    <p>
                      Jika identitas nomor induk atau email <strong className="font-mono text-slate-900">{identifier}</strong> terdaftar dalam basis data SIMONITA, permintaan pemulihan kata sandi telah diproses.
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Demi keamanan akun, instruksi resmi pemulihan kata sandi hanya akan dikirimkan ke email terdaftar. Jika Anda membutuhkan bantuan segera, silakan hubungi Administrator SIMTA Fakultas Ilmu Komputer.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setResetResult(null)}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all text-center cursor-pointer shadow-sm"
                    >
                      Coba Identitas Lain
                    </button>
                    <Link
                      href="/login"
                      className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all text-center block"
                    >
                      Kembali ke Login
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold shadow-md ${
                      resetResult.status === 'disetujui' 
                        ? 'bg-emerald-500 shadow-emerald-500/20' 
                        : resetResult.status === 'ditolak'
                        ? 'bg-rose-500 shadow-rose-500/20'
                        : 'bg-amber-500 shadow-amber-500/20'
                    }`}>
                      {resetResult.status === 'disetujui' ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : resetResult.status === 'ditolak' ? (
                        <AlertCircle className="w-6 h-6" />
                      ) : (
                        <ShieldCheck className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        {resetResult.status === 'disetujui' 
                          ? 'Permintaan Disetujui Admin!' 
                          : resetResult.status === 'ditolak'
                          ? 'Permintaan Ditolak Admin'
                          : 'Permintaan Dalam Antrean Admin'}
                      </h3>
                      <p className="text-[11px] text-slate-600">{resetResult.nama || resetResult.user?.nama}</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-blue-100 text-xs space-y-2 font-medium">
                    <div className="flex justify-between text-slate-600">
                      <span>NIM / NIP:</span>
                      <span className="font-bold text-slate-900 font-mono">{resetResult.user?.nim || resetResult.user?.nip || identifier}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Email Terdaftar:</span>
                      <span className="font-bold text-slate-900">{resetResult.email}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Role Akun:</span>
                      <span className="font-bold text-blue-600 uppercase text-[10px]">{resetResult.user?.role || 'Pengguna'}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-100">
                      <span>Status Verifikasi:</span>
                      <span className={`font-bold px-2 py-0.5 rounded-md text-[10px] uppercase ${
                        resetResult.status === 'disetujui'
                          ? 'bg-emerald-100 text-emerald-800'
                          : resetResult.status === 'ditolak'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {resetResult.status === 'disetujui' ? 'Disetujui' : resetResult.status === 'ditolak' ? 'Ditolak' : 'Menunggu Persetujuan Admin'}
                      </span>
                    </div>
                  </div>

                  {resetResult.status === 'disetujui' ? (
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs leading-relaxed space-y-2">
                        <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                          <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Tautan Reset Dikirim ke Email Anda!</span>
                        </div>
                        <p className="text-[12px] text-emerald-800">
                          Admin telah menyetujui pemulihan kata sandi akun Anda. Sistem telah mengirimkan tautan resmi pembaruan kata sandi ke email Anda:
                          <strong className="block mt-1 font-mono text-slate-900">{resetResult.email}</strong>
                        </p>
                        <p className="text-[11px] text-emerald-700">
                          ⏱️ Tautan resmi di dalam email hanya berlaku selama <strong>24 Jam</strong>. Silakan periksa Inbox atau folder Spam email Anda.
                        </p>
                      </div>

                      <Link
                        href="/login"
                        className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Kembali ke Halaman Login</span>
                      </Link>
                    </div>
                  ) : resetResult.status === 'ditolak' ? (
                    <>
                      <p className="text-xs text-rose-700 leading-relaxed bg-rose-50 p-3 rounded-xl border border-rose-200">
                        <span className="font-bold block mb-1">Catatan Admin:</span>
                        {resetResult.request?.catatan_admin || 'Identitas tidak dapat diverifikasi oleh Admin SIMTA.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setResetResult(null)}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <span>Ajukan Permintaan Baru</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-1">
                        <span className="font-bold block">Menunggu Verifikasi Admin SIMTA:</span>
                        <p className="text-[11px] text-amber-800">
                          Permintaan pemulihan sandi Anda telah masuk ke antrean verifikasi Admin SIMTA. Demi keamanan akun, Admin akan memverifikasi identitas Anda terlebih dahulu, kemudian sistem akan mengirimkan tautan reset otomatis ke email Anda.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        className="w-full py-2.5 px-4 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 font-bold text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Periksa Status Persetujuan Admin</span>
                      </button>
                    </>
                  )}

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setResetResult(null)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                    >
                      Gunakan akun lain
                    </button>
                  </div>
                </>
              )}
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

// Lepaskan halaman Lupa Kata Sandi dari Admin / Dashboard layout
ForgotPassword.layout = (page) => <AuthLayout>{page}</AuthLayout>;

