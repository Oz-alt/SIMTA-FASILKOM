import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Photo assets
import diklatImg from '../assets/photo/diklat.jpg';
import computerLabImg from '../assets/photo/computer_lab.jpg';
import serverRoomImg from '../assets/photo/server_room.jpg';

import {
  GraduationCap,
  ShieldCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BookOpen,
  FileText,
  Briefcase,
  UserCheck,
  Clock
} from 'lucide-react';

export default function BerandaPage() {
  const [activeSlide, setActiveSlide] = useState(0);

  // GSAP Refs
  const heroBgRef = useRef(null);
  const titleTextRef = useRef(null);
  const heroSectionRef = useRef(null);
  const workflowGridRef = useRef(null);
  const featureCardsRef = useRef(null);

  const slides = [
    {
      title: 'SIMTA FASILKOM UNSRI',
      image: diklatImg
    },
    {
      title: 'Real-Time Similarity Check Engine',
      image: computerLabImg
    },
    {
      title: 'Peminjaman Ruang Sidang Terpadu',
      image: serverRoomImg
    }
  ];

  // GSAP ScrollTrigger Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Hero Section loads immediately on top
      if (heroSectionRef.current) {
        gsap.fromTo(
          heroSectionRef.current,
          { opacity: 0, y: 20, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' }
        );
      }

      // 2. Workflow Grid Section (animates smoothly on scroll into view)
      if (workflowGridRef.current) {
        gsap.fromTo(
          workflowGridRef.current.children,
          { opacity: 0, y: 25 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.12,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
            scrollTrigger: {
              trigger: workflowGridRef.current,
              start: 'top 88%',
              toggleActions: 'play none none none'
            }
          }
        );
      }

      // 3. Feature Cards Section (animates smoothly on scroll into view)
      if (featureCardsRef.current) {
        gsap.fromTo(
          featureCardsRef.current.children,
          { opacity: 0, y: 25 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.12,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
            scrollTrigger: {
              trigger: featureCardsRef.current,
              start: 'top 88%',
              toggleActions: 'play none none none'
            }
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  // Auto carousel slide timer (resets 6s timer whenever activeSlide changes, including manual user clicks!)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeSlide, slides.length]);

  const handleDotClick = (idx) => {
    if (idx !== activeSlide) {
      setActiveSlide(idx);
    }
  };

  return (
    <div className="w-full space-y-12 pb-16">

      {/* 100% Full-Width Edge-to-Edge Hero Banner Section */}
      <section ref={heroSectionRef} className="w-full relative h-[420px] sm:h-[480px] flex flex-col items-center justify-center text-center text-white overflow-hidden shadow-md select-none bg-blue-950">

        {/* Multi-layer Unified Slides (Foto + Overlay + Tulisan 1 Paket SIMLAB Style) */}
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className="absolute inset-0 flex flex-col items-center justify-center text-center text-white"
            style={{
              opacity: activeSlide === idx ? 1 : 0,
              zIndex: activeSlide === idx ? 10 : 0,
              transition: 'opacity 1000ms cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: activeSlide === idx ? 'auto' : 'none'
            }}
          >
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${slide.image})` }}
            />

            {/* Semi-transparent Blue Theme Overlay */}
            <div className="absolute inset-0 bg-blue-950/75 backdrop-blur-[2px]"></div>

            {/* Centered Title Text (Satu paket dengan foto) */}
            <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[90px] sm:min-h-[110px] pb-10">
              <h1 className="text-2xl sm:text-4xl lg:text-[46px] font-bold tracking-tight text-white max-w-5xl leading-snug drop-shadow-md whitespace-pre-line">
                {slide.title}
              </h1>
            </div>
          </div>
        ))}

        {/* SIMLAB Carousel Dots Indicator (Fixed at Bottom Layer) */}
        <div className="absolute bottom-6 left-0 right-0 z-30 flex items-center justify-center space-x-2.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleDotClick(idx)}
              aria-label={`Lihat slide ${idx + 1}`}
              className={`h-2.5 rounded-full transition-all duration-500 cursor-pointer ${
                activeSlide === idx ? 'w-8 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        {/* Workflow Steps Section */}
        <section className="bg-white border border-blue-100 rounded-3xl p-8 sm:p-10 shadow-xs space-y-8">
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-flex items-center text-xs font-bold text-blue-700 uppercase tracking-widest bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200 shadow-2xs">
              Alur Pelayanan Terpadu
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 pt-1">
              Bagaimana SIMTA Membantu Perjalanan TA Mahasiswa?
            </h2>
            <p className="text-xs text-slate-500">
              4 langkah terintegrasi mulai dari verifikasi judul hingga pelaksanaan sidang tanpa penginputan data ulang.
            </p>
          </div>

          <div ref={workflowGridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 text-center relative group hover:border-blue-300 hover:bg-blue-50/30 transition-colors duration-200 flex flex-col items-center hover:-translate-y-1">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white font-bold text-base flex items-center justify-center shadow-md shadow-blue-600/20">
                01
              </div>
              <h3 className="text-sm font-bold text-slate-900">Similarity Check Judul</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mahasiswa memasukkan draft judul. Engine langsung menghitung skor kemiripan real-time terhadap arsip historis.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 text-center relative group hover:border-blue-300 hover:bg-blue-50/30 transition-colors duration-200 flex flex-col items-center hover:-translate-y-1">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white font-bold text-base flex items-center justify-center shadow-md shadow-blue-600/20">
                02
              </div>
              <h3 className="text-sm font-bold text-slate-900">Persetujuan Kaprodi</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kaprodi meninjau judul beserta skor similarity dan memberikan persetujuan resmi (ACC).
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 text-center relative group hover:border-blue-300 hover:bg-blue-50/30 transition-colors duration-200 flex flex-col items-center hover:-translate-y-1">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white font-bold text-base flex items-center justify-center shadow-md shadow-blue-600/20">
                03
              </div>
              <h3 className="text-sm font-bold text-slate-900">Peminjaman Ruang Sidang</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Form peminjaman ruangan terisi otomatis dari profil & judul yang disetujui untuk Sempro, Semhas, dan Sidang.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 text-center relative group hover:border-blue-300 hover:bg-blue-50/30 transition-colors duration-200 flex flex-col items-center hover:-translate-y-1">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white font-bold text-base flex items-center justify-center shadow-md shadow-blue-600/20">
                04
              </div>
              <h3 className="text-sm font-bold text-slate-900">Verifikasi Admin & Sidang</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Admin Sarana menyetujui ruangan berbasis prioritas jurusan & anti-bentrok. Histori sidang tersimpan permanen.
              </p>
            </div>

          </div>
        </section>

        {/* Feature Highlights Static Cards Grid */}
        <section id="fitur" className="space-y-6">
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-flex items-center text-xs font-bold text-blue-700 uppercase tracking-widest bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200 shadow-2xs">
              Modul & Kapabilitas Platform
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 pt-1">
              Fitur Utama Sistem Informasi SIMTA
            </h2>
            <p className="text-xs text-slate-500">
              Seluruh modul terintegrasi untuk mendukung penyelesaian Tugas Akhir & Kerja Praktik mahasiswa D3 MI.
            </p>
          </div>

          <div ref={featureCardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Card 1: Similarity Engine */}
            <div className="bg-white border border-blue-100 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Similarity Check Engine Real-Time</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mencegah duplikasi judul tugas akhir menggunakan algoritma gabungan Full-Text Search (FTS) dan Trigram Similarity. Toleran terhadap sinonim, variasi kata, dan typo penulisan.
              </p>

              <div className="space-y-2.5 pt-1 text-xs font-medium text-slate-700">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Threshold 0-40%: Aman (Langsung Diajukan)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Threshold 41-70%: Peringatan (Perlu Catatan Kebaruan)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Threshold &gt;70%: Blokir Merah (Wajib Revisi Judul)</span>
                </div>
              </div>
            </div>

            {/* Card 2: Room Scheduling */}
            <div className="bg-white border border-blue-100 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
                <CalendarDays className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Manajemen Ruangan & Timeline Sidang</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sistem menampilkan ketersediaan ruangan berbasis timeline visual (SIMLAB Concept) dan memberikan rekomendasi ruangan terbaik berdasarkan prioritas jurusan D3 Manajemen Informatika.
              </p>

              <div className="space-y-2.5 pt-1 text-xs font-medium text-slate-700">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Rekomendasi Ruangan Otomatis Berbasis Prioritas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Validasi Anti-Bentrok Jadwal 100% Real-Time</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Pra-terisi Otomatis Data Judul TA</span>
                </div>
              </div>
            </div>

            {/* Card 3: Tracking Progres KP Mahasiswa */}
            <div className="bg-white border border-blue-100 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Tracking Progres KP (Kerja Praktik)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pemantauan terpadu status pengajuan tempat magang, pengunggahan logbook laporan mingguan Kerja Praktik, serta rekapitulasi penilaian dari dosen pembimbing lapangan.
              </p>

              <div className="space-y-2.5 pt-1 text-xs font-medium text-slate-700">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Verifikasi Surat Pengantar Magang & Perusahaan</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Logbook Digital Laporan Mingguan KP</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Rekapitulasi Penilaian Dosen Pembimbing</span>
                </div>
              </div>
            </div>

            {/* Card 4: Manajemen Jadwal Bimbingan Terintegrasi */}
            <div className="bg-white border border-blue-100 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Manajemen Jadwal Bimbingan Terintegrasi</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Penjadwalan sesi bimbingan konsultasi antara mahasiswa dan dosen pembimbing TA/KP, pencatatan logbook catatan revisi, serta notifikasi pengingat sesi bimbingan.
              </p>

              <div className="space-y-2.5 pt-1 text-xs font-medium text-slate-700">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Booking Slot Jam Konsultasi Dosen</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Logbook Catatan Revisi & Feedback Pembimbing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Notifikasi Pengingat Sesi Konsultasi</span>
                </div>
              </div>
            </div>

          </div>
        </section>

      </div>

    </div>
  );
}
