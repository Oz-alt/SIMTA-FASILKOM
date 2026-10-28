import React, { useEffect, useRef } from 'react';
import { getSimilarityThreshold } from '../../services/titleService.js';
import { ShieldCheck, AlertTriangle, XCircle, Info, HelpCircle, BookOpen, Layers } from 'lucide-react';
import gsap from 'gsap';

export default function SimilarityGauge({
  score = 0,
  titleScore = null,
  abstractScore = null,
  hasAbstract = false,
  isChecking = false,
  hasChecked = true
}) {
  const threshold = getSimilarityThreshold(score);
  const barRef = useRef(null);

  useEffect(() => {
    if (barRef.current) {
      gsap.to(barRef.current, {
        width: hasChecked ? `${Math.min(100, Math.max(0, score))}%` : '0%',
        duration: 0.8,
        ease: 'power2.out'
      });
    }
  }, [score, hasChecked]);

  const getIcon = () => {
    if (!hasChecked) return <HelpCircle className="w-5 h-5 text-slate-500" />;
    if (threshold.status === 'aman') return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
    if (threshold.status === 'peringatan') return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      !hasChecked
        ? 'bg-slate-50/80 text-slate-700 border-slate-200'
        : threshold.bgClass
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getIcon()}
          <span className="text-xs font-bold uppercase tracking-wider">
            Similarity Check Engine
          </span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border shadow-2xs ${
          !hasChecked
            ? 'bg-slate-200/80 text-slate-600 border-slate-300'
            : 'bg-white/80 border-current'
        }`}>
          {!hasChecked ? 'Belum Diperiksa' : threshold.badgeText}
        </span>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold tracking-tight">
            {isChecking ? '...' : (!hasChecked ? '- %' : `${score}%`)}
          </span>
          <span className="text-xs text-slate-600 font-medium">
            {hasAbstract ? 'skor gabungan (Judul 50% + Abstrak 50%)' : 'skor kemiripan judul'}
          </span>
        </div>

        {/* Repositori UNSRI benchmark pill */}
        <span className="text-[10px] text-slate-500 bg-white/70 px-2 py-0.5 rounded-md border border-slate-200/60 font-medium hidden sm:inline-flex items-center gap-1">
          <BookOpen className="w-3 h-3 text-indigo-500" />
          <span>Repo UNSRI Archive</span>
        </span>
      </div>

      {/* Breakdown Pill for Judul & Abstrak */}
      {hasChecked && hasAbstract && titleScore !== null && abstractScore !== null && (
        <div className="mt-2.5 flex items-center gap-2 text-[11px] font-medium">
          <div className="flex items-center gap-1 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-slate-500">Skor Judul:</span>
            <strong className="text-slate-800">{titleScore}%</strong>
          </div>
          <div className="flex items-center gap-1 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-slate-500">Skor Abstrak:</span>
            <strong className="text-slate-800">{abstractScore}%</strong>
            <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded font-semibold ml-0.5">Bilingual</span>
          </div>
        </div>
      )}

      {/* Progress Meter Bar (GSAP Animated Width) */}
      <div className="mt-2.5 w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
        <div 
          ref={barRef}
          className={`h-full ${
            !hasChecked
              ? 'bg-slate-400'
              : threshold.status === 'aman' 
              ? 'bg-emerald-500' 
              : threshold.status === 'peringatan'
              ? 'bg-amber-500'
              : 'bg-red-500'
          }`}
          style={{ width: '0%' }}
        />
      </div>

      <p className="mt-2.5 text-xs font-medium leading-relaxed opacity-90 flex items-start space-x-1.5">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          {!hasChecked
            ? 'Masukkan judul & abstrak tugas akhir Anda lalu klik tombol "Cek Similarity" untuk memeriksa kemiripan terhadap arsip Repositori UNSRI.'
            : threshold.message}
        </span>
      </p>
    </div>
  );
}

