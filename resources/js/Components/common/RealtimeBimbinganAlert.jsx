import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  XCircle, 
  X, 
  BookOpen, 
  MessageSquare, 
  ExternalLink, 
  Bell,
  ArrowRight,
  GraduationCap
} from 'lucide-react';

export default function RealtimeBimbinganAlert() {
  const { activeRealtimeAlert, dismissRealtimeAlert, currentUser } = useAuth();
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  const durationMs = 8000; // 8 seconds display

  useEffect(() => {
    if (!activeRealtimeAlert) {
      setProgress(100);
      return;
    }

    setProgress(100);
    const intervalMs = 100;
    const decrement = (intervalMs / durationMs) * 100;

    const timer = setInterval(() => {
      if (!isPaused) {
        setProgress(prev => {
          if (prev <= decrement) {
            clearInterval(timer);
            dismissRealtimeAlert();
            return 0;
          }
          return prev - decrement;
        });
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [activeRealtimeAlert, isPaused, dismissRealtimeAlert]);

  if (!activeRealtimeAlert) return null;

  const {
    title,
    message,
    dosen_nama,
    status,
    jenis_revisi,
    bab_topik,
    isDosenAlert,
    mhs_nama,
    mhs_nim,
    pembimbing,
    action_url
  } = activeRealtimeAlert;

  const isDosenView = Boolean(isDosenAlert || (currentUser?.role === 'dosen' && mhs_nama));

  const isApproved = status === 'disetujui' || jenis_revisi === 'Diterima';
  const isMayor = jenis_revisi === 'Mayor';
  const isMinor = jenis_revisi === 'Minor';
  const isDitolak = status === 'ditolak' || jenis_revisi === 'Ditolak';

  const handleOpenAction = () => {
    dismissRealtimeAlert();
    if (isDosenView) {
      router.visit(action_url || '/dosen/bimbingan');
    } else {
      router.visit('/thesis/consultations');
    }
  };

  const handleOpenSecondary = () => {
    dismissRealtimeAlert();
    if (isDosenView) {
      router.visit('/dosen/mahasiswa');
    } else {
      router.visit('/thesis/consultations/card');
    }
  };

  return (
    <aside 
      aria-label="Notifikasi Real-time Bimbingan"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm sm:max-w-md w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 transition-all select-none"
    >
      {/* Top Beacon Bar */}
      <div className={`px-4 py-2 border-b flex items-center justify-between text-xs font-bold ${
        isDosenView
          ? 'bg-indigo-50 text-indigo-900 border-indigo-100'
          : isApproved 
          ? 'bg-emerald-50 text-emerald-900 border-emerald-100' 
          : isMayor || isDitolak
          ? 'bg-rose-50 text-rose-900 border-rose-100'
          : 'bg-amber-50 text-amber-900 border-amber-100'
      }`}>
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isDosenView
                ? 'bg-indigo-400'
                : isApproved ? 'bg-emerald-400' : isMayor || isDitolak ? 'bg-rose-400' : 'bg-amber-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              isDosenView
                ? 'bg-indigo-600'
                : isApproved ? 'bg-emerald-600' : isMayor || isDitolak ? 'bg-rose-600' : 'bg-amber-600'
            }`}></span>
          </span>
          <span className="tracking-wide uppercase text-[10px] font-extrabold flex items-center space-x-1">
            <Bell className="w-3 h-3" />
            <span>{isDosenView ? 'Notifikasi Real-time Dosen Pembimbing' : 'Real-time Update Bimbingan'}</span>
          </span>
        </div>

        <button
          onClick={dismissRealtimeAlert}
          className="text-slate-400 hover:text-slate-700 p-0.5 rounded-lg transition-colors cursor-pointer"
          title="Tutup notifikasi"
          aria-label="Tutup notifikasi"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Alert Content */}
      <div className="p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              {isDosenView ? (
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300 font-extrabold text-[10px] flex items-center space-x-1 shadow-2xs">
                  <BookOpen className="w-3 h-3 text-indigo-600" />
                  <span>Pengajuan {pembimbing || 'Bimbingan Baru'}</span>
                </span>
              ) : isApproved ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[10px] flex items-center space-x-1 shadow-2xs">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Status: Disetujui (ACC)</span>
                </span>
              ) : isMinor ? (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 font-extrabold text-[10px] flex items-center space-x-1 shadow-2xs">
                  <AlertCircle className="w-3 h-3 text-blue-600" />
                  <span>Status: Revisi Minor</span>
                </span>
              ) : isMayor ? (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-extrabold text-[10px] flex items-center space-x-1 shadow-2xs">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  <span>Status: Revisi Mayor</span>
                </span>
              ) : isDitolak ? (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-extrabold text-[10px] flex items-center space-x-1 shadow-2xs">
                  <XCircle className="w-3 h-3 text-rose-600" />
                  <span>Status: Ditolak</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300 font-extrabold text-[10px] flex items-center space-x-1 shadow-2xs">
                  <MessageSquare className="w-3 h-3 text-indigo-600" />
                  <span>Status: Direspon</span>
                </span>
              )}
            </div>

            <h2 className="text-sm font-extrabold text-slate-900 leading-snug">
              {title || (isDosenView ? 'Pengajuan Sesi Bimbingan Baru' : 'Tanggapan Bimbingan Baru')}
            </h2>
          </div>
        </div>

        {/* Advisor / Student & Topic Information */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1.5 text-xs">
          {isDosenView ? (
            <>
              <div className="flex items-center space-x-1.5 text-slate-700 font-semibold">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="text-slate-400 font-normal">Mahasiswa:</span>
                <span className="text-slate-900 font-bold">{mhs_nama || 'Mahasiswa'}</span>
                {mhs_nim && <span className="text-slate-500 font-normal font-mono text-[11px]">({mhs_nim})</span>}
              </div>
              {pembimbing && (
                <div className="flex items-center space-x-1.5 text-slate-600 text-[11px]">
                  <span className="text-slate-400 font-normal">Tujuan:</span>
                  <span className="font-semibold text-indigo-700">{pembimbing}</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center space-x-1.5 text-slate-700 font-semibold">
              <span className="text-slate-400 font-normal">Pembimbing:</span>
              <span className="text-slate-900 font-bold">{dosen_nama || 'Dosen Pembimbing'}</span>
            </div>
          )}

          {bab_topik && (
            <div className="flex items-center space-x-1.5 text-slate-700">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="font-medium text-slate-800 truncate">{bab_topik}</span>
            </div>
          )}
          {message && (
            <div className="pt-1.5 mt-1.5 border-t border-slate-200/60 text-slate-600 leading-relaxed text-[11px]">
              {message}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 pt-1">
          <button
            onClick={handleOpenAction}
            className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <span>{isDosenView ? 'Tinjau & Validasi Bimbingan' : 'Buka Log Bimbingan'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleOpenSecondary}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <span>{isDosenView ? 'Mahasiswa Bimbingan' : 'Kartu Bimbingan'}</span>
          </button>
        </div>
      </div>

      {/* Shrinking Progress Bar */}
      <div className="w-full bg-slate-100 h-1">
        <div 
          className={`h-full transition-all duration-100 ease-linear ${
            isDosenView
              ? 'bg-indigo-500'
              : isApproved ? 'bg-emerald-500' : isMayor || isDitolak ? 'bg-rose-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </aside>
  );
}
