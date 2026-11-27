import React from 'react';
import { CheckCircle2, Clock, Circle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ThesisStepper({ currentTitle, stages = [] }) {
  const { currentUser } = useAuth();

  if (!currentTitle) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs flex items-center justify-between">
        <span>Belum ada pengajuan judul Tugas Akhir. Silakan ajukan judul terlebih dahulu.</span>
      </div>
    );
  }

  const isGraduated = currentTitle.status_kelulusan === 'lulus' || currentTitle.status_sidang === 'selesai';
  const isTitleFix = currentTitle.status === 'disetujui' || currentTitle.status === 'judul_fix';
  const isReadyOrScheduled = currentTitle.status_sidang === 'siap_daftar' || currentTitle.status_sidang === 'terjadwal';

  const steps = [
    {
      key: 'title',
      label: '1. Usulan & Judul Fix',
      isCompleted: isTitleFix,
      isPending: currentTitle.status === 'tinjauan' || currentTitle.status === 'diajukan' || currentTitle.status === 'perlu_revisi',
      statusText: isTitleFix
        ? 'Judul Fix'
        : currentTitle.status === 'perlu_revisi'
        ? 'Perlu Revisi'
        : 'Dalam Tinjauan'
    },
    {
      key: 'pengerjaan_ta',
      label: '2. Pengerjaan Laporan TA',
      isCompleted: isReadyOrScheduled || isGraduated,
      isPending: isTitleFix && !isReadyOrScheduled && !isGraduated,
      statusText: (isReadyOrScheduled || isGraduated)
        ? 'Siap Sidang Akhir'
        : isTitleFix
        ? 'Dalam Penyusunan TA'
        : 'Menunggu Judul Fix'
    },
    {
      key: 'kelulusan',
      label: '3. Status Kelulusan',
      isCompleted: isGraduated,
      isPending: !isGraduated,
      statusText: isGraduated ? 'LULUS TA D3' : 'Aktif / Dalam Proses'
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 mb-4">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 leading-snug">
            Perjalanan Tugas Akhir D3 Manajemen Informatika
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Alur terfokus: Usulan Judul &rarr; Pengerjaan TA &rarr; Kelulusan (Jadwal sidang dikirim via Email)
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <span className="inline-flex items-center whitespace-nowrap text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Alur D3 Terpadu
            </span>
            {currentUser?.prodi && (
              <span className="inline-flex items-center whitespace-nowrap text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {currentUser.prodi}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step, idx) => (
          <div 
            key={step.key}
            className={`p-3.5 rounded-xl border transition-all ${
              step.isCompleted 
                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                : step.isPending
                ? 'bg-amber-50/50 border-amber-200 text-amber-900'
                : 'bg-slate-50/50 border-slate-200 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider">{step.label}</span>
              {step.isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : step.isPending ? (
                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
              ) : (
                <Circle className="w-4 h-4 text-slate-300" />
              )}
            </div>
            
            <div className="mt-2 text-xs font-semibold">
              {step.statusText}
            </div>

            {idx < steps.length - 1 && (
              <div className="hidden md:block mt-2">
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 ml-auto" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
