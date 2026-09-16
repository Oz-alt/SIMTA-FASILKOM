import React, { useState, useEffect, useRef } from 'react';
import { Link, router } from '@inertiajs/react';
import { useAuth } from '../context/AuthContext.jsx';
import gsap from 'gsap';
import unsriLogo from '../assets/photo/unsri logo.png';
import diklatImg from '../assets/photo/diklat.jpg';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  GraduationCap,
  CreditCard,
  BookOpen
} from 'lucide-react';

export default function RegisterPage() {
  const navigate = (url) => router.visit(url);
  const { registerStudent, departments } = useAuth();

  const [formData, setFormData] = useState({
    nama: '',
    nim: '',
    email: '',
    noHp: '',
    prodi: departments?.[0]?.name || 'D3 Manajemen Informatika',
    kelas: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Basic empty field validation
    if (!formData.nama.trim() || !formData.nim.trim() || !formData.email.trim() || !formData.noHp.trim() || !formData.kelas.trim() || !formData.password || !formData.confirmPassword) {
      setErrorMessage('Semua kolom pendaftaran wajib diisi.');
      return;
    }

    // 2. Email Domain Validation: MUST end with @student.unsri.ac.id
    const cleanEmail = formData.email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@student.unsri.ac.id')) {
      setErrorMessage('Email harus menggunakan domain resmi mahasiswa UNSRI (@student.unsri.ac.id).');
      return;
    }

    // 3. Password Length Validation
    if (formData.password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    // 4. Confirm Password Match Validation
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await registerStudent({
        nama: formData.nama.trim(),
        nim: formData.nim.trim(),
        email: cleanEmail,
        noHp: formData.noHp.trim(),
        prodi: formData.prodi,
        kelas: formData.kelas.trim(),
        password: formData.password
      });

      setIsLoading(false);

      if (result && result.success) {
        setSuccessMessage('Registrasi berhasil! Mengalihkan ke Dashboard TA...');
        setTimeout(() => {
          navigate(result.redirectPath || '/dashboard');
        }, 1000);
      } else {
        setErrorMessage((result && result.message) || 'Gagal mendaftar. Silakan coba lagi.');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Gagal mendaftar. Silakan coba lagi.');
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
            Bergabung ke Portal SIMTA FASILKOM UNSRI
          </h1>

          <p className="text-sm text-blue-100/90 leading-relaxed font-normal">
            Daftarkan diri Anda untuk mengelola pengajuan judul Tugas Akhir dengan Similarity Check Engine serta reservasi ruang sidang secara terpadu.
          </p>

          {/* Feature Bullets */}
          <div className="space-y-3 pt-4 text-xs font-medium text-blue-100">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Verifikasi Email Mahasiswa Resmi (@student.unsri.ac.id)</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Similarity Check Engine Real-Time Anti-Duplikasi Judul</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Alur Persetujuan Kaprodi &amp; Peminjaman Ruang Sidang</span>
            </div>
          </div>
        </div>

        {/* Bottom Left Footer */}
        <div className="relative z-10 text-xs text-blue-300/80 font-medium">
          © 2026 FASILKOM UNSRI.
        </div>

      </div>

      {/* RIGHT COLUMN: 50% / 5 Cols - Clean White Registration Form Panel */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 sm:p-8 xl:p-12 bg-white min-h-screen">
        
        {/* Mobile Header (Shows only on small screens) */}
        <div className="lg:hidden flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
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
        <div ref={formPanelRef} className="my-auto max-w-md w-full mx-auto space-y-6 py-2">
          
          {/* Header Title */}
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200 inline-block">
              Pendaftaran Mahasiswa
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight pt-1">
              Buat Akun Mahasiswa
            </h2>
            <p className="text-xs text-slate-500">
              Isi data diri Anda menggunakan email student UNSRI resmi.
            </p>
          </div>

          {/* Alert Notification Messages */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {/* 1. Nama Lengkap Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap Anda..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm text-slate-900 bg-white transition-all outline-none font-medium"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* 2. NIM Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                NIM (Nomor Induk Mahasiswa) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="nim"
                  value={formData.nim}
                  onChange={handleChange}
                  placeholder="Contoh: 09031182328001"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm text-slate-900 bg-white transition-all outline-none font-medium"
                />
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* 3. Email Input (@student.unsri.ac.id mandatory) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Email Student UNSRI <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  @student.unsri.ac.id
                </span>
              </div>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="nama.mhs@student.unsri.ac.id"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm text-slate-900 bg-white transition-all outline-none font-medium"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* 4. Program Studi (Prodi) & Kelas Inputs */}
            <div className="space-y-3">
              
              {/* Program Studi (Prodi) Dropdown */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Program Studi (Prodi) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="prodi"
                    value={formData.prodi}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm text-slate-900 bg-white transition-all outline-none font-semibold cursor-pointer"
                  >
                    {departments && departments.map(d => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                  <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* No HP & Kelas Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    No. Telepon / WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="noHp"
                      value={formData.noHp}
                      onChange={handleChange}
                      placeholder="Contoh: 081278901234"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm text-slate-900 bg-white transition-all outline-none font-medium"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Kelas Mahasiswa Typed Text Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Kelas Mahasiswa <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="kelas"
                      value={formData.kelas}
                      onChange={handleChange}
                      placeholder="Contoh: MI 5A, TI 3B"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm text-slate-900 bg-white transition-all outline-none font-medium"
                    />
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

            </div>

            {/* 5. Password & Confirm Password Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              
              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Kata Sandi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 6 karakter..."
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs text-slate-900 bg-white transition-all outline-none font-medium"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Konfirmasi Sandi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Ulangi kata sandi..."
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs text-slate-900 bg-white transition-all outline-none font-medium"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Mendaftarkan Akun...</span>
                  </>
                ) : (
                  <span>Daftar Akun Mahasiswa</span>
                )}
              </button>
            </div>

          </form>

          {/* Already have an account link */}
          <div className="text-center text-xs text-slate-600 pt-2 border-t border-slate-100">
            Sudah memiliki akun?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-800 font-bold transition-colors">
              Masuk di Sini
            </Link>
          </div>

        </div>

        {/* Right Footer Copyright */}
        <div className="pt-4 text-center text-[11px] text-slate-400 font-medium border-t border-slate-100">
          Fakultas Ilmu Komputer UNSRI
        </div>

      </div>

    </div>
  );
}


