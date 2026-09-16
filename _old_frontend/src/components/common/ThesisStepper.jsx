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

  const steps = [
    {
      key: 'title',
      label: '1. Pengajuan Judul TA',
      isCompleted: currentTitle.status === 'disetujui',
      isPending: currentTitle.status === 'diajukan',
      statusText: currentTitle.status === 'disetujui' ? 'Judul Disetujui' : currentTitle.status === 'diajukan' ? 'Ditinjau Kaprodi' : 'Belum Disetujui'
    },
    {
      key: 'seminar_proposal',
      label: '2. Seminar Proposal',
      isCompleted: stages.some(s => s.stage_type === 'seminar_proposal' && (s.status === 'disetujui' || s.status === 'selesai')),
      isPending: stages.some(s => s.stage_type === 'seminar_proposal' && s.status === 'menunggu_jadwal'),
      statusText: stages.find(s => s.stage_type === 'seminar_proposal')?.status === 'selesai' ? 'Selesai' : 'Belum Selesai'
    },
    {
      key: 'seminar_hasil',
      label: '3. Seminar Hasil',
      isCompleted: stages.some(s => s.stage_type === 'seminar_hasil' && (s.status === 'disetujui' || s.status === 'selesai')),
      isPending: stages.some(s => s.stage_type === 'seminar_hasil' && s.status === 'menunggu_jadwal'),
      statusText: stages.find(s => s.stage_type === 'seminar_hasil')?.status === 'selesai' ? 'Selesai' : 'Belum Selesai'
    },
    {
      key: 'sidang_akhir',
      label: '4. Sidang Akhir',
      isCompleted: stages.some(s => s.stage_type === 'sidang_akhir' && (s.status === 'disetujui' || s.status === 'selesai')),
      isPending: stages.some(s => s.stage_type === 'sidang_akhir' && s.status === 'menunggu_jadwal'),
      statusText: stages.find(s => s.stage_type === 'sidang_akhir')?.status === 'selesai' ? 'Selesai' : 'Belum Selesai'
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Perjalanan Tugas Akhir Saya (Thesis Journey)</h3>
          <p className="text-xs text-slate-500 mt-0.5">Alur otomatis dari persetujuan judul hingga sidang akhir</p>
        </div>
        {currentUser?.prodi && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {currentUser.prodi}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
