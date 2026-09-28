import React from 'react';
import { 
  Mail, 
  X, 
  CheckCircle2, 
  ExternalLink, 
  Calendar, 
  User, 
  AlertTriangle,
  Clock,
  Send
} from 'lucide-react';
import unsriLogo from '../../assets/photo/unsri logo.png';

export default function ModalEmailPreview({ isOpen, onClose, reminder, student, onResendEmail }) {
  if (!isOpen || !reminder) return null;

  const studentName = student?.nama || 'Aulia Azzahra';
  const studentNim = student?.nim || '09010182428002';
  const studentEmail = student?.email || `${studentNim}@student.unsri.ac.id`;
  const studentProdi = student?.prodi || 'D3 Manajemen Informatika';

  const isCritical = reminder.severity === 'critical';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <Mail className="w-4 h-4 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xs sm:text-sm font-bold">Salinan Notifikasi Email Mahasiswa</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Status: Terkirim
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Pesan ini telah diteruskan secara otomatis ke inbox email resmi Anda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Client Header Preview */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 text-xs text-slate-600 space-y-1.5 font-mono">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-400 w-16">Dari:</span>
            <span className="text-slate-800 font-semibold">SIMTA FASILKOM UNSRI &lt;no-reply@fasilkom.unsri.ac.id&gt;</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-400 w-16">Kepada:</span>
            <span className="text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
              {studentEmail}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-400 w-16">Subjek:</span>
            <span className="text-slate-900 font-bold">
              [PENTING] Pengingat Jadwal Bimbingan Tugas Akhir - {studentName} ({studentNim})
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <span className="font-bold text-slate-400 w-16">Waktu:</span>
            <span>{new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })} WIB</span>
          </div>
        </div>

        {/* Email Body Content (Rendered Letterhead) */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 text-xs sm:text-sm">
          
          {/* Institutional Letterhead */}
          <div className="border-b-2 border-indigo-900 pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={unsriLogo} alt="UNSRI" className="w-12 h-12 object-contain" />
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900 uppercase tracking-tight">
                  UNIVERSITAS SRIWIJAYA
                </h4>
                <p className="text-xs font-semibold text-slate-600">
                  FAKULTAS ILMU KOMPUTER - PROGRAM STUDI D3 MANAJEMEN INFORMATIKA
                </p>
                <p className="text-[10px] text-slate-400">
                  Sistem Informasi Manajemen Tugas Akhir (SIMTA) Terpadu
                </p>
              </div>
            </div>
          </div>

          {/* Salutation */}
          <div className="space-y-1">
            <p className="font-bold text-slate-900">
              Yth. Sdr/i {studentName},
            </p>
            <p className="text-xs text-slate-500">
              NIM: {studentNim} • Program Studi: {studentProdi}
            </p>
          </div>

          {/* Main Notice Box */}
          <div className={`p-4 rounded-xl border ${
            isCritical 
              ? 'bg-rose-50 border-rose-200 text-rose-900' 
              : 'bg-amber-50 border-amber-200 text-amber-900'
          } space-y-2`}>
            <div className="flex items-center space-x-2 font-bold text-xs sm:text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{reminder.message}</span>
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              {reminder.subMessage}
            </p>
          </div>

          {/* Consultation Cadence Breakdown */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
            <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
              Ringkasan Kepatuhan Bimbingan Digital:
            </span>
            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <div>
                <span className="text-slate-400 block text-[11px]">Bimbingan Terakhir:</span>
                <strong className="text-slate-900">{reminder.latestDateFormatted || 'Belum Ada'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Jeda Waktu:</span>
                <strong className="text-slate-900">{reminder.daysSinceLast !== null ? `${reminder.daysSinceLast} Hari Lalu` : '-'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Sesi 30 Hari Terakhir:</span>
                <strong className="text-slate-900">{reminder.consultationsInLastMonth} Sesi</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Standar Kelayakan:</span>
                <strong className="text-indigo-700">Minimal 2 Kali / Bulan</strong>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
            <p>
              Mahasiswa diwajibkan untuk aktif berkonsultasi dengan Dosen Pembimbing 1 dan Dosen Pembimbing 2 sekurang-kurangnya <strong>2 kali dalam sebulan</strong> untuk memastikan kelancaran penulisan naskah serta pemenuhan syarat kelayakan pendaftaran sidang (minimal 12 sesi bimbingan).
            </p>
            <p>
              Silakan akses portal SIMTA mahasiswa untuk mencatat sesi bimbingan atau mengunggah naskah revisi terbaru Anda.
            </p>
          </div>

          {/* Closing */}
          <div className="pt-2 text-xs text-slate-500">
            <p>Hormat kami,</p>
            <p className="font-bold text-slate-800 mt-1">Koordinator Tugas Akhir / Kaprodi D3 MI</p>
            <p>Fakultas Ilmu Komputer Universitas Sriwijaya</p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Email otomatis disinkronkan ke inbox mahasiswa</span>
          </div>

          <div className="flex items-center space-x-2">
            {onResendEmail && (
              <button
                onClick={onResendEmail}
                className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Ulang Email</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Tutup Preview
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
