import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import {
  Smartphone,
  ShieldCheck,
  CalendarDays,
  Briefcase,
  UserCheck,
  LogIn,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import diklatImg from '../../assets/photo/diklat.jpg';
import computerLabImg from '../../assets/photo/computer_lab.jpg';
import serverRoomImg from '../../assets/photo/server_room.jpg';
import { useDevice } from '../../context/DeviceContext.jsx';

const SLIDES = [
  {
    tag: 'Portal Resmi Tugas Akhir',
    title: 'SIMONITA FASILKOM UNSRI',
    desc: 'Monitoring bimbingan, cek kemiripan judul, dan reservasi ruang sidang dalam genggaman.',
    image: diklatImg,
  },
  {
    tag: 'Anti-Plagiasi Judul',
    title: 'Similarity Check Engine',
    desc: 'Analisis kemiripan judul & abstrak bilingual secara real-time terhadap arsip UNSRI.',
    image: computerLabImg,
  },
  {
    tag: 'Jadwal Anti-Bentrok',
    title: 'Ruang Sidang Terpadu',
    desc: 'Pengajuan ruang Sempro, Semhas, & Sidang Akhir otomatis terintegrasi profil TA.',
    image: serverRoomImg,
  },
];

const WORKFLOW_STEPS = [
  {
    num: '01',
    title: 'Similarity Check Judul',
    desc: 'Masukkan draft judul dan abstrak. Engine menghitung skor kemiripan otomatis terhadap repositori historis.',
  },
  {
    num: '02',
    title: 'Persetujuan Kaprodi',
    desc: 'Kaprodi meninjau ajuan judul beserta skor kemiripan untuk memberikan keputusan ACC resmi.',
  },
  {
    num: '03',
    title: 'Bimbingan & Kartu Digital',
    desc: 'Catat sesi bimbingan dengan Pembimbing 1 & 2 serta pantau kelayakan syarat sidang secara live.',
  },
  {
    num: '04',
    title: 'Peminjaman Ruang & Sidang',
    desc: 'Booking ruang sidang tervalidasi anti-bentrok prioritas Prodi hingga arsip sidang tersimpan.',
  },
];

const FEATURE_CARDS = [
  {
    title: 'Similarity Check Engine',
    icon: ShieldCheck,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    points: ['0-40%: Aman diajukan', '41-70%: Catatan kebaruan', '>70%: Wajib revisi'],
  },
  {
    title: 'Manajemen Ruang Sidang',
    icon: CalendarDays,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    points: ['Rekomendasi prioritas Prodi', 'Anti-bentrok 100% real-time', 'Auto-isi data judul TA'],
  },
  {
    title: 'Logbook Bimbingan Digital',
    icon: UserCheck,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    points: ['Target P1 & P2 terukur', 'Catatan revisi mayor/minor', 'Kartu bimbingan cetak QR'],
  },
  {
    title: 'Tracking Progres & Arsip',
    icon: Briefcase,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    points: ['Tahapan Sempro - Sidang', 'Repositori tugas akhir', 'Dokumen SOP & template'],
  },
];

export default function MobileBerandaView() {
  const { os, osLabel } = useDevice();
  const [activeSlide, setActiveSlide] = useState(0);
  const [expandedStep, setExpandedStep] = useState('01');

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const currentSlide = SLIDES[activeSlide];

  return (
    <div className="w-full max-w-lg mx-auto px-3.5 py-4 space-y-5 pb-10">
      {/* App Hero Card */}
      <section className="relative rounded-3xl overflow-hidden shadow-lg bg-blue-950 text-white min-h-[260px] flex flex-col justify-between p-5">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${currentSlide.image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-blue-950/80 to-blue-900/60" />

        <div className="relative z-10 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[10px] font-bold tracking-wide">
            <Smartphone className="w-3 h-3 text-emerald-300" />
            <span>{os === 'desktop' ? 'Mobile App UI' : `Versi ${osLabel}`}</span>
          </span>
          <div className="flex items-center gap-1.5">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Slide ${idx + 1}`}
                onClick={() => setActiveSlide(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  activeSlide === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 space-y-2.5 pt-8">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-blue-200">
            <Sparkles className="w-3 h-3" />
            {currentSlide.tag}
          </span>
          <h1 className="text-xl font-extrabold tracking-tight leading-snug">
            {currentSlide.title}
          </h1>
          <p className="text-xs text-slate-200 leading-relaxed">
            {currentSlide.desc}
          </p>

          <div className="pt-2 grid grid-cols-2 gap-2.5">
            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-900/40 active:scale-[0.98] transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk Portal</span>
            </Link>
            <Link
              href="/documents"
              className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 text-white font-bold text-xs active:scale-[0.98] transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Dokumen TA</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Similarity Threshold Quick Legend */}
      <section className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
            Ambang Cek Kemiripan Judul
          </h2>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            Real-Time
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <div className="text-xs font-extrabold text-emerald-800">0-40%</div>
            <div className="text-[10px] text-emerald-700 font-medium">Aman</div>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-center">
            <AlertTriangle className="w-4 h-4 text-amber-600 mx-auto mb-1" />
            <div className="text-xs font-extrabold text-amber-800">41-70%</div>
            <div className="text-[10px] text-amber-700 font-medium">Waspada</div>
          </div>
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-center">
            <XCircle className="w-4 h-4 text-rose-600 mx-auto mb-1" />
            <div className="text-xs font-extrabold text-rose-800">&gt;70%</div>
            <div className="text-[10px] text-rose-700 font-medium">Revisi</div>
          </div>
        </div>
      </section>

      {/* Horizontal Feature Carousel */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
            Modul Platform Mobile
          </h2>
          <span className="text-[10px] text-slate-400 font-medium">Geser ke samping →</span>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory">
          {FEATURE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="snap-start shrink-0 w-[235px] bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2.5"
              >
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{card.title}</h3>
                <ul className="space-y-1.5">
                  {card.points.map((pt) => (
                    <li key={pt} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Accordion Alur Pelayanan Terpadu */}
      <section className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2.5">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600">
            Panduan Ringkas
          </span>
          <h2 className="text-sm font-extrabold text-slate-900">
            Alur Pelayanan Tugas Akhir
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
          {WORKFLOW_STEPS.map((step) => {
            const open = expandedStep === step.num;
            return (
              <div key={step.num} className="py-2.5 first:pt-1 last:pb-0">
                <button
                  type="button"
                  onClick={() => setExpandedStep(open ? '' : step.num)}
                  className="w-full flex items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                      {step.num}
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate">{step.title}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                      open ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>
                {open && (
                  <p className="text-xs text-slate-600 leading-relaxed mt-2 pl-9">
                    {step.desc}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <Link
          href="/login"
          className="mt-2 w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
        >
          <span>Mulai Masuk ke Akun Mahasiswa / Dosen</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
