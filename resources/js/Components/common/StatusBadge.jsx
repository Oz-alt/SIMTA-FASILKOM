import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle, 
  Send, 
  ShieldCheck, 
  Sparkles,
  Check
} from 'lucide-react';

/**
 * StatusBadge.jsx
 * Premium, modern status badge component for SIMTA.
 * Supports:
 * - type="confirmation" (Dospem confirmation status: confirmed vs unconfirmed)
 * - type="thesis" (Thesis title ACC status: disetujui, diajukan, ditolak, belum_mengajukan)
 * - type="recommendation" (Advisor recommendation: direkomendasikan, perlu_revisi, menunggu)
 */
export default function StatusBadge({ 
  type = 'thesis', 
  status, 
  size = 'md', // 'sm' | 'md' | 'lg'
  showSubtext = true,
  className = ''
}) {
  const normStatus = String(status || '').toLowerCase().trim();

  // 1. Dosen Pembimbing Confirmation Status (Used in Manajemen Tugas Akhir)
  if (type === 'confirmation') {
    const isConfirmed = normStatus === 'true' || normStatus === 'confirmed' || normStatus === 'dikonfirmasi' || status === true;

    if (isConfirmed) {
      return (
        <span 
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold tracking-tight shadow-xs whitespace-nowrap ${className}`}
          title="Dosen pembimbing telah resmi dikonfirmasi (Notifikasi telah terkirim)"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Dikonfirmasi</span>
        </span>
      );
    }

    // Unconfirmed / Pending Confirmation
    return (
      <span 
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold tracking-tight shadow-xs whitespace-nowrap ${className}`}
        title="Menunggu konfirmasi Kaprodi untuk mengirim notifikasi ke dosen dan mahasiswa"
      >
        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>Menunggu</span>
      </span>
    );
  }

  // 2. Thesis Submission Status (Judul Fix, Perlu Revisi, Dalam Tinjauan)
  if (type === 'thesis') {
    if (normStatus === 'disetujui' || normStatus === 'approved' || normStatus === 'judul_fix' || normStatus === 'fix') {
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold tracking-tight shadow-xs whitespace-nowrap ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Judul Fix</span>
        </span>
      );
    }

    if (normStatus === 'perlu_revisi' || normStatus === 'revisi') {
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-semibold tracking-tight shadow-xs whitespace-nowrap ${className}`}>
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Perlu Revisi</span>
        </span>
      );
    }

    if (normStatus === 'diajukan' || normStatus === 'tinjauan' || normStatus === 'dalam_tinjauan' || normStatus === 'pending') {
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-50 text-yellow-800 border border-yellow-300 text-[11px] font-semibold tracking-tight shadow-xs whitespace-nowrap ${className}`}>
          <Clock className="w-3.5 h-3.5 text-yellow-600 shrink-0" />
          <span>Dalam Tinjauan</span>
        </span>
      );
    }

    if (normStatus === 'ditolak' || normStatus === 'rejected') {
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-semibold tracking-tight shadow-xs whitespace-nowrap ${className}`}>
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Perlu Revisi</span>
        </span>
      );
    }

    // Default: Belum Mengajukan
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200 text-[11px] font-semibold tracking-tight shadow-xs whitespace-nowrap ${className}`}>
        <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>Belum Mengajukan</span>
      </span>
    );
  }

  // 3. Recommendation Status from Dospem
  if (type === 'recommendation') {
    if (normStatus === 'direkomendasikan') {
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-800 border border-emerald-500/30 whitespace-nowrap ${className}`}>
          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>Direkomendasikan Dospem</span>
        </span>
      );
    }

    if (normStatus === 'perlu_revisi') {
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-800 border border-rose-500/30 whitespace-nowrap ${className}`}>
          <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
          <span>Perlu Revisi Topik</span>
        </span>
      );
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap ${className}`}>
        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
        <span>Menunggu Validasi Dosen</span>
      </span>
    );
  }

  return null;
}
