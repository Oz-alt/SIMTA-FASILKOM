import React, { useEffect, useRef } from 'react';
import { getSimilarityThreshold } from '@backend/services/titleService.js';
import { ShieldCheck, AlertTriangle, XCircle, Info } from 'lucide-react';
import gsap from 'gsap';

export default function SimilarityGauge({ score = 0, isChecking = false }) {
  const threshold = getSimilarityThreshold(score);
  const barRef = useRef(null);

  useEffect(() => {
    if (barRef.current) {
      gsap.to(barRef.current, {
        width: `${Math.min(100, Math.max(0, score))}%`,
        duration: 0.8,
        ease: 'power2.out'
      });
    }
  }, [score]);

  const getIcon = () => {
    if (threshold.status === 'aman') return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
    if (threshold.status === 'peringatan') return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  return (
    <div className={`p-4 rounded-xl border transition-all ${threshold.bgClass}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getIcon()}
          <span className="text-xs font-bold uppercase tracking-wider">
            Similarity Check Engine
          </span>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/80 border border-current shadow-2xs">
          {threshold.badgeText}
        </span>
      </div>

      <div className="mt-3 flex items-baseline space-x-2">
        <span className="text-3xl font-extrabold tracking-tight">
          {isChecking ? '...' : `${score}%`}
        </span>
        <span className="text-xs text-slate-600 font-medium">
          tingkat kemiripan gabungan (FTS + Trigram)
        </span>
      </div>

      {/* Progress Meter Bar (GSAP Animated Width) */}
      <div className="mt-2.5 w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
        <div 
          ref={barRef}
          className={`h-full ${
            threshold.status === 'aman' 
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
        <span>{threshold.message}</span>
      </p>
    </div>
  );
}
