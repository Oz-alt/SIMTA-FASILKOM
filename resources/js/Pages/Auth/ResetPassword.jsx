import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, router, Head } from '@inertiajs/react';
import { useAuth } from '../../context/AuthContext.jsx';
import AuthLayout from '../../Layouts/AuthLayout.jsx';
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
  ShieldCheck,
  Check,
  X
} from 'lucide-react';

export default function ResetPassword({ token, email }) {
  const { confirmPasswordReset, verifyPasswordResetToken } = useAuth();

  // Ambil query params dari URL browser
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
  const [tokenStatus, setTokenStatus] = useState({ checked: false, valid: true, error: '', user: null });

  const formPanelRef = useRef(null);
  const leftContentRef = useRef(null);

  // Verifikasi keabsahan token & masa berlaku 24 jam saat halaman dibuka (Section C.1 & C.3)
  useEffect(() => {
    if (verifyPasswordResetToken && (resetToken || userEmail)) {
      const res = verifyPasswordResetToken(resetToken, userEmail);
      if (!res.valid) {
        setTokenStatus({ checked: true, valid: false, error: res.error, user: null });
      } else {
        setTokenStatus({ checked: true, valid: true, error: '', user: res.user });
        if (res.user?.email && !userEmail) {
          setUserEmail(res.user.email);
        }
      }
    } else {
      setTokenStatus({ 
        checked: true, 
        valid: false, 
        error: 'Tautan reset kata sandi tidak valid atau token verifikasi tidak ditemukan.', 
        user: null 
      });
    }
  }, [resetToken, userEmail, verifyPasswordResetToken]);

  // Evaluasi kekuatan kata sandi
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: 'Kosong', color: 'bg-slate-200', text: 'text-slate-400' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) {
      return { score: 33, label: 'Lemah', color: 'bg-rose-500', text: 'text-rose-600' };
    } else if (score <= 4) {
      return { score: 66, label: 'Cukup', color: 'bg-amber-500', text: 'text-amber-600' };
    } else {
      return { score: 100, label: 'Kuat', color: 'bg-emerald-500', text: 'text-emerald-600' };
    }
  }, [password]);

  // Validasi kriteria
  const hasMinLength = password.length >= 6;
  const hasLetterAndNumber = /[A-Za-z]/.test(password) && /[0-9]/.test(password);
  const passwordsMatch = password && password === passwordConfirmation;
  const userIdentifier = String(tokenStatus.user?.nim || tokenStatus.user?.nip || tokenStatus.user?.identifier || '').trim().toLowerCase();
  const isNotSameAsId = !userIdentifier || (password.toLowerCase() !== userIdentifier);

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

    // Validasi Keamanan (Section B.3): Password tidak boleh sama dengan NIM atau NIP
    if (!isNotSameAsId) {
      setErrorMessage('Kata sandi baru tidak boleh sama dengan NIM atau NIP akun Anda demi alasan keamanan.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      await confirmPasswordReset({
        emailOrToken: resetToken || userEmail,
        newPassword: password
      });

      setIsLoading(false);
      setIsSuccess(true);

      // Pengalihan ke halaman Login dengan notifikasi sukses (Section D.2)
      setTimeout(() => {
        router.visit('/login?status=reset_success');
      }, 1500);

    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Gagal mengatur ulang kata sandi. Silakan coba kembali.');
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-white text-slate-900 font-sans select-none overflow-x-hidden">
      <Head title="Perbarui Password Akun - SIMONITA FASILKOM" />

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
            Perbarui Kata Sandi Akun
          </h1>

          <p className="text-sm text-blue-100/90 leading-relaxed font-normal">
            Pastikan kata sandi baru Anda kuat, aman, dan mudah diingat untuk mengakses portal SIMONITA FASILKOM UNSRI.
          </p>

          {/* Security Recommendations */}
          <div className="space-y-3 pt-4 text-xs font-medium text-blue-100">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Gunakan kombinasi minimal 6 karakter</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Kombinasikan huruf besar, huruf kecil, dan angka</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Tautan aman hanya berlaku 24 jam dan sekali pakai</span>
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
        <div ref={formPanelRef} className="my-auto max-w-md w-full mx-auto space-y-6 py-4">

          {/* Header Title (Section B.1) */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-md border border-blue-100 inline-block">
              Keamanan Akun
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight pt-1">
              Perbarui Password Akun Anda
            </h2>
            <p className="text-xs text-slate-500">
              Masukkan kata sandi baru untuk mengamankan kembali akun SIMONITA Anda.
            </p>
          </div>

          {/* Token Invalid / Expired Warning (Section C.3: Jangan tampilkan form jika token kedaluwarsa) */}
          {tokenStatus.checked && !tokenStatus.valid ? (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-4 animate-in fade-in">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-sm text-rose-950">
                  Tautan Reset Password Tidak Berlaku
                </h3>
                <p className="text-xs text-rose-700 leading-relaxed">
                  {tokenStatus.error || 'Tautan reset password sudah tidak berlaku atau telah kedaluwarsa (melebihi batas 24 jam atau telah digunakan).'}
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/forgot-password"
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all text-center block shadow-md shadow-blue-600/20"
                >
                  Minta Tautan Baru
                </Link>
                <Link
                  href="/login"
                  className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all text-center block"
                >
                  Kembali ke Halaman Login
                </Link>
              </div>
            </div>
          ) : isSuccess ? (
            /* Success Feedback (Section D.2) */
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-emerald-950">Password Berhasil Diperbarui!</h3>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Password baru Anda telah berhasil disimpan dengan aman (hashing SHA-256). Mengalihkan Anda ke halaman login...
                </p>
              </div>
              <Link
                href="/login?status=reset_success"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
              >
                Masuk Sekarang
              </Link>
            </div>
          ) : (
            <>
              {/* Account details badge if verified */}
              {tokenStatus.user && (
                <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs space-y-1">
                  <div className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Pemilik Akun Terverifikasi</div>
                  <div className="font-bold text-slate-900">{tokenStatus.user.nama}</div>
                  <div className="text-[11px] text-slate-600 font-mono">
                    NIM / NIP: {tokenStatus.user.nim || tokenStatus.user.nip || tokenStatus.user.identifier} • {tokenStatus.user.email}
                  </div>
                </div>
              )}

              {/* Error Message Alert */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Reset Password Form (Section B.2) */}
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Email / Identifier (Read-only for safety) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Alamat Email Akun
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={userEmail || tokenStatus.user?.email || ''}
                      placeholder="Email Akun"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-600 bg-slate-50 font-medium cursor-not-allowed outline-none"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* New Password Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Password Baru *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password baru (min. 6 karakter)..."
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

                  {/* Password Strength Meter */}
                  {password && (
                    <div className="pt-1 space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 font-medium">Kekuatan Sandi:</span>
                        <span className={`font-bold ${passwordStrength.text}`}>{passwordStrength.label}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${passwordStrength.color}`}
                          style={{ width: `${passwordStrength.score}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm New Password Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Konfirmasi Password Baru *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      placeholder="Ketik ulang password baru..."
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

                {/* Checklist Kriteria Validasi Keamanan (Section B.3) */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1.5 font-medium">
                  <div className="flex items-center space-x-2">
                    {hasMinLength ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className={hasMinLength ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                      Minimal 6 karakter
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {passwordsMatch ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className={passwordsMatch ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                      Konfirmasi password cocok
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isNotSameAsId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    )}
                    <span className={isNotSameAsId ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-bold'}>
                      Tidak sama dengan NIM / NIP akun
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !hasMinLength || !passwordsMatch || !isNotSameAsId}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Menyimpan Password Baru...</span>
                    </>
                  ) : (
                    <span>Simpan Password Baru</span>
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

// Lepaskan halaman Buat Password Baru dari Admin / Dashboard layout
ResetPassword.layout = (page) => <AuthLayout>{page}</AuthLayout>;
