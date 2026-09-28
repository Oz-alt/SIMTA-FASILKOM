import React, { useState } from 'react';
import { 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Mail, 
  PlusCircle, 
  ArrowRight,
  Info,
  Eye,
  Send
} from 'lucide-react';
import ModalEmailPreview from './ModalEmailPreview.jsx';

export default function BimbinganReminderBanner({ reminder, studentEmail, studentUser, onAddBimbingan, showAction = true }) {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSentNotice, setEmailSentNotice] = useState('');

  if (!reminder) return null;

  const isCritical = reminder.severity === 'critical';
  const isWarning = reminder.severity === 'warning';
  const isEmpty = reminder.severity === 'empty';
  const isGood = reminder.severity === 'good';

  let containerStyles = 'bg-emerald-50 border-emerald-200 text-emerald-950';
  let badgeStyles = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  let iconComponent = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;

  if (isCritical) {
    containerStyles = 'bg-rose-50/90 border-rose-200 text-rose-950 shadow-xs';
    badgeStyles = 'bg-rose-100 text-rose-800 border-rose-300';
    iconComponent = <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 animate-pulse" />;
  } else if (isWarning || isEmpty) {
    containerStyles = 'bg-amber-50/90 border-amber-200 text-amber-950 shadow-xs';
    badgeStyles = 'bg-amber-100 text-amber-800 border-amber-300';
    iconComponent = <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
  }

  const handleResendEmail = () => {
    const targetEmail = studentEmail || studentUser?.email || '09010182428002@student.unsri.ac.id';
    setEmailSentNotice(`Salinan email pengingat bimbingan berhasil dikirim ulang ke ${targetEmail}`);
    setTimeout(() => setEmailSentNotice(''), 4500);
  };

  return (
    <>
      <div className={`p-4 sm:p-5 rounded-2xl border ${containerStyles} transition-all space-y-3`}>
        
        {/* Email Resend Toast Alert */}
        {emailSentNotice && (
          <div className="p-3 bg-emerald-600 text-white text-xs font-semibold rounded-xl flex items-center justify-between shadow-md animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>{emailSentNotice}</span>
            </div>
            <button onClick={() => setEmailSentNotice('')} className="text-white/80 hover:text-white font-bold text-xs">✕</button>
          </div>
        )}

        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            {iconComponent}
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h3 className="text-xs sm:text-sm font-extrabold tracking-tight">
                  {reminder.message}
                </h3>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${badgeStyles}`}>
                  {reminder.statusBadge.text}
                </span>
              </div>
              <p className="text-xs opacity-90 mt-0.5 leading-relaxed">
                {reminder.subMessage}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-center shrink-0">
            {/* View / Send Email Button */}
            <button
              type="button"
              onClick={() => setShowEmailModal(true)}
              className="px-3 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              <span>Lihat Salinan Email</span>
            </button>

            {showAction && onAddBimbingan && (
              <button
                type="button"
                onClick={onAddBimbingan}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Catat Bimbingan</span>
              </button>
            )}
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-black/5 text-xs">
          
          <div className="bg-white/70 backdrop-blur-xs border border-black/5 rounded-xl p-2.5 space-y-0.5">
            <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider block">Bimbingan Terakhir</span>
            <p className="font-bold text-slate-800 truncate">
              {reminder.latestDateFormatted || 'Belum Ada'}
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-xs border border-black/5 rounded-xl p-2.5 space-y-0.5">
            <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider block">Jeda Waktu</span>
            <p className="font-bold text-slate-800">
              {reminder.daysSinceLast !== null ? `${reminder.daysSinceLast} Hari Lalu` : '-'}
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-xs border border-black/5 rounded-xl p-2.5 space-y-0.5">
            <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider block">Sesi 30 Hari Terakhir</span>
            <p className="font-bold text-slate-800">
              {reminder.consultationsInLastMonth} dari Min. 2 Sesi
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-xs border border-black/5 rounded-xl p-2.5 space-y-0.5">
            <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider block">Syarat Minimal</span>
            <p className="font-bold text-indigo-700">
              2x / Bulan (Tiap 15 Hari)
            </p>
          </div>

        </div>

        {/* Footer Info & Auto-Email notice */}
        <div className="flex flex-wrap items-center justify-between text-[11px] opacity-80 pt-1">
          <div className="flex items-center space-x-1.5">
            <Mail className="w-3.5 h-3.5 text-indigo-600" />
            <span>
              Pengingat otomatis terhubung ke email: <strong className="font-semibold text-indigo-800">{studentEmail || studentUser?.email || '09010182428002@student.unsri.ac.id'}</strong>
            </span>
          </div>
          <button 
            type="button"
            onClick={() => setShowEmailModal(true)}
            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline flex items-center space-x-1 cursor-pointer"
          >
            <span>Buka Format Surat Notifikasi Email</span>
            <ArrowRight className="w-3 h-3 inline" />
          </button>
        </div>

      </div>

      {/* Modal Email Preview */}
      <ModalEmailPreview
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        reminder={reminder}
        student={studentUser || { email: studentEmail }}
        onResendEmail={handleResendEmail}
      />
    </>
  );
}
