import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  BellRing, 
  GraduationCap, 
  ArrowRight, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Clock,
  ShieldCheck
} from 'lucide-react';

export default function RealtimeNotificationToast() {
  const { 
    currentUser, 
    latestRealtimeNotif, 
    dismissRealtimeNotif, 
    markNotificationAsRead 
  } = useAuth();

  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-dismiss countdown timer (10 seconds)
  useEffect(() => {
    if (!latestRealtimeNotif) {
      setProgress(100);
      return;
    }

    setProgress(100);
    const duration = 10000; // 10s
    const stepTime = 100;
    const decrement = (stepTime / duration) * 100;

    const timer = setInterval(() => {
      if (!isPaused) {
        setProgress(prev => {
          if (prev <= decrement) {
            clearInterval(timer);
            dismissRealtimeNotif();
            return 0;
          }
          return prev - decrement;
        });
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [latestRealtimeNotif, isPaused, dismissRealtimeNotif]);

  // Only show if there is an active realtime notification
  if (!latestRealtimeNotif) return null;

  // Notification is primarily for Kaprodi / Admin
  const isKaprodiOrAdmin = !currentUser || currentUser.role === 'kaprodi' || currentUser.role === 'admin';
  if (!isKaprodiOrAdmin) return null;

  const notif = latestRealtimeNotif;
  const targetUrl = notif.action_url || (notif.related_id ? `/kaprodi/titles/${notif.related_id}` : '/kaprodi/titles');

  const handleReviewNow = () => {
    if (notif.id) {
      markNotificationAsRead(notif.id);
    }
    dismissRealtimeNotif();
    router.visit(targetUrl);
  };

  const handleDismiss = () => {
    if (notif.id) {
      markNotificationAsRead(notif.id);
    }
    dismissRealtimeNotif();
  };

  return (
    <aside
      aria-label="Notifikasi Real-Time"
      className="fixed top-20 right-4 sm:right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative rounded-3xl bg-white/95 backdrop-blur-xl border border-blue-200 shadow-[0_20px_50px_rgba(30,58,138,0.2)] overflow-hidden ring-4 ring-blue-500/10">
        
        {/* Top Header Pill Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-5 py-3 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-extrabold tracking-wider uppercase text-blue-200">
              Real-Time Notifikasi Kaprodi
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-blue-200/80 flex items-center space-x-1">
              <Clock className="w-3 h-3 text-blue-300" />
              <span>Baru saja</span>
            </span>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg text-blue-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Tutup Notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3.5">
          <div className="flex items-start space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                  Judul TA Baru Disimpan
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 truncate">
                {notif.student_name || 'Mahasiswa'}
              </h4>
              <p className="text-[11px] text-slate-500 font-mono">
                {notif.student_nim ? `NIM: ${notif.student_nim}` : 'Mahasiswa FASILKOM UNSRI'}
              </p>
            </div>
          </div>

          {/* Thesis Title Box */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 leading-relaxed font-medium">
            <p className="italic text-slate-700 line-clamp-2">
              "{notif.thesis_title || notif.message}"
            </p>
          </div>

          {/* Status Note */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <div className="flex items-center space-x-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Masuk Tahap Tinjauan Rapat Prodi</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Nanti Saja
            </button>
            <button
              type="button"
              onClick={handleReviewNow}
              className="w-full px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center space-x-1.5 transition-all cursor-pointer group"
            >
              <span>Tinjau Judul</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Bottom Auto-Dismiss Progress Bar */}
        <div className="w-full bg-slate-100 h-1">
          <div 
            className="h-1 bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

      </div>
    </aside>
  );
}
