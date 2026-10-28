import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  openStudentWhatsAppChat, 
  resolveStudentContact, 
  normalizeWhatsAppNumber 
} from '../../lib/whatsappHelper.js';
import { MessageCircle, AlertTriangle, CheckCircle2, X } from 'lucide-react';

/**
 * Komponen Global Floating Toast untuk Notifikasi WhatsApp Mahasiswa
 */
export function WhatsAppNotificationToast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handleToast = (e) => {
      if (e.detail) {
        setToast(e.detail);
      }
    };

    window.addEventListener('simta-whatsapp-toast', handleToast);
    return () => window.removeEventListener('simta-whatsapp-toast', handleToast);
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 5500);

    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  const isError = toast.type === 'error' || toast.type === 'warning';

  return (
    <div 
      className="fixed bottom-6 right-6 z-[9999] max-w-sm sm:max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
      role="alert"
    >
      <div 
        className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-md flex items-start space-x-3.5 transition-all ${
          isError 
            ? 'bg-rose-900/95 text-white border-rose-700/80 shadow-rose-950/40' 
            : 'bg-emerald-900/95 text-white border-emerald-700/80 shadow-emerald-950/40'
        }`}
      >
        <div className={`p-2 rounded-xl shrink-0 ${isError ? 'bg-rose-800 text-rose-200' : 'bg-emerald-800 text-emerald-200'}`}>
          {isError ? (
            <AlertTriangle className="w-5 h-5 text-amber-300 animate-pulse" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          )}
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-rose-200 mb-0.5">
            {isError ? 'Pemberitahuan WhatsApp Mahasiswa' : 'Mengarahkan ke WhatsApp'}
          </h4>
          <p className="text-xs font-medium leading-relaxed text-slate-100">
            {toast.message}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setToast(null)}
          className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          aria-label="Tutup notifikasi"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Komponen Tautan Nama Mahasiswa ke WhatsApp
 * Mengubah nama mahasiswa menjadi tautan interaktif yang langsung membuka chat WhatsApp mahasiswa yang bersangkutan.
 */
export default function StudentWhatsAppLink({
  student,
  nim,
  nama,
  children,
  className = '',
  showIcon = false,
  iconPosition = 'right',
  iconClassName = '',
  customMessage,
  onNotify
}) {
  const auth = useAuth() || {};
  const currentUser = auth.currentUser;

  // Dapatkan info kontak mahasiswa
  const studentData = student || { nim, nama };
  const contact = resolveStudentContact(studentData, {
    registeredStudents: typeof auth.getAllRegisteredStudents === 'function' ? auth.getAllRegisteredStudents() : [],
    dbProfiles: auth.dbProfiles || [],
    studentAdvisors: auth.studentAdvisors || []
  });

  const displayName = children || contact.nama || nama || student?.student_nama || student?.mhs_nama || student?.nama || 'Mahasiswa';
  const targetNim = contact.nim || nim || student?.student_nim || student?.mhs_nim || student?.nim || '';
  const validation = normalizeWhatsAppNumber(contact.phone);

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();

    openStudentWhatsAppChat({
      student: {
        ...studentData,
        nim: targetNim,
        nama: typeof displayName === 'string' ? displayName : contact.nama,
        no_hp: contact.phone
      },
      currentUser,
      context: {
        registeredStudents: typeof auth.getAllRegisteredStudents === 'function' ? auth.getAllRegisteredStudents() : [],
        dbProfiles: auth.dbProfiles || [],
        studentAdvisors: auth.studentAdvisors || []
      },
      customMessage,
      onNotify
    });
  };

  const tooltipTitle = validation.isValid
    ? `Klik untuk chat WhatsApp ${displayName} (${validation.cleanNumber})`
    : `Klik untuk chat WhatsApp ${displayName} (Nomor belum lengkap)`;

  return (
    <button
      type="button"
      onClick={handleClick}
      title={tooltipTitle}
      className={`group inline-flex items-center gap-1.5 text-left transition-all duration-200 cursor-pointer hover:underline underline-offset-2 decoration-emerald-500/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 rounded-sm font-inherit text-inherit ${className}`}
    >
      {showIcon && iconPosition === 'left' && (
        <span 
          className={`inline-flex items-center justify-center shrink-0 w-3.5 h-3.5 text-emerald-600 group-hover:text-emerald-700 group-hover:scale-110 transition-transform ${iconClassName}`}
          aria-hidden="true"
        >
          <MessageCircle className="w-3.5 h-3.5 fill-emerald-500/20" />
        </span>
      )}

      <span className="group-hover:text-emerald-700 transition-colors">
        {displayName}
      </span>

      {showIcon && iconPosition === 'right' && (
        <span 
          className={`inline-flex items-center justify-center shrink-0 w-3.5 h-3.5 text-emerald-600 group-hover:text-emerald-700 group-hover:scale-110 transition-transform ${iconClassName}`}
          aria-hidden="true"
        >
          <MessageCircle className="w-3.5 h-3.5 fill-emerald-500/20" />
        </span>
      )}
    </button>
  );
}
