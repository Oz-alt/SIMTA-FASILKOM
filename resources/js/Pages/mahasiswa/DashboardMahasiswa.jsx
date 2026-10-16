import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link } from '@inertiajs/react';
import ThesisStepper from '../../Components/common/ThesisStepper.jsx';
import BimbinganReminderBanner from '../../Components/common/BimbinganReminderBanner.jsx';
import BimbinganTimeline from '../../Components/common/BimbinganTimeline.jsx';
import { calculateBimbinganReminder } from '../../lib/bimbinganReminder.js';
import { 
  FileText, 
  CalendarDays, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  PlusCircle,
  UserCheck,
  Mail,
  BookOpen,
  ExternalLink
} from 'lucide-react';

function WhatsAppIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function DashboardMahasiswa() {
  const { currentUser, thesisTitles, thesisStages, bookings, getStudentAdvisors, consultations } = useAuth();

  // Get current student's title dynamically
  const myTitle = thesisTitles.find(t => (currentUser?.id && t.profile_id === currentUser.id) || (currentUser?.nim && t.mhs_nim === currentUser.nim)) || null;
  const myStages = myTitle ? thesisStages.filter(s => s.thesis_title_id === myTitle.id) : [];
  const myBookings = bookings.filter(b => currentUser?.nim && b.mhs_nim === currentUser.nim);

  // Automated Bimbingan Reminder (Minimal 2x per bulan)
  const reminderStatus = useMemo(() => {
    if (!currentUser?.nim || !myTitle) return null;
    return calculateBimbinganReminder(consultations, currentUser.nim, 2);
  }, [consultations, currentUser?.nim, myTitle]);

  // Dynamic Dospem 1 & 2 assigned by Kaprodi
  const assigned = (getStudentAdvisors && currentUser?.nim) ? getStudentAdvisors(currentUser.nim) : {};
  const dospem1 = assigned?.dospem1;
  const dospem2 = assigned?.dospem2;
  const dospem1Nama = dospem1?.nama || myTitle?.pembimbing_1 || 'Belum ditentukan Kaprodi';
  const dospem2Nama = dospem2?.nama || myTitle?.pembimbing_2 || 'Belum ditentukan Kaprodi';

  // Resolusi Tautan Grup WhatsApp Bimbingan
  const getAdvisorWaGroupLink = (dospemObj, dospemNamaFallback, label) => {
    if (dospemObj?.link_wa_group) return dospemObj.link_wa_group;
    if (dospemObj?.wa_group_url) return dospemObj.wa_group_url;

    const rawName = dospemObj?.nama || dospemNamaFallback || '';
    const cleanName = rawName
      .toLowerCase()
      .replace(/dr\.|ir\.|prof\.|s\.kom\.|m\.cs\.|m\.t\.|m\.kom\.|ph\.d\.|st\.|s\.t\./gi, '')
      .replace(/[^a-z0-9]/gi, '')
      .trim();

    if (cleanName) {
      return `https://chat.whatsapp.com/BimbinganTA-${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)}`;
    }
    return `https://chat.whatsapp.com/BimbinganTA-${label}`;
  };

  const waLink1 = getAdvisorWaGroupLink(dospem1, dospem1Nama, 'Dospem1');
  const waLink2 = getAdvisorWaGroupLink(dospem2, dospem2Nama, 'Dospem2');

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-sm">
              Portal Mahasiswa
            </span>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold border border-emerald-400/30 backdrop-blur-sm">
              <Mail className="w-3.5 h-3.5 text-emerald-300" />
              <span>Notifikasi Terintegrasi Email: {currentUser?.email || '09010182428002@student.unsri.ac.id'}</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang, {currentUser?.nama || 'Mahasiswa'}!
          </h1>
          <p className="text-sm text-indigo-100/90 mt-1 max-w-2xl leading-relaxed">
            Kelola pengajuan judul Tugas Akhir dengan Similarity Check Engine serta ajukan ruang seminar &amp; sidang secara terpadu.
          </p>

          {/* Integrated Duo Dospem Assigned by Kaprodi with WhatsApp Group Buttons */}
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl text-xs">
            {/* Pembimbing 1 Card */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4 text-indigo-200" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Dosen Pembimbing 1 (Utama)</span>
                  <p className="font-bold text-white truncate text-xs sm:text-sm">{dospem1Nama}</p>
                </div>
              </div>

              {dospem1Nama !== 'Belum ditentukan Kaprodi' && (
                <a
                  href={waLink1}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm hover:shadow-md transition-all shrink-0 cursor-pointer"
                  title={`Gabung Grup WhatsApp Bimbingan ${dospem1Nama}`}
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 text-white" />
                  <span className="text-white">Grup WA</span>
                  <ExternalLink className="w-3 h-3 text-white/90" />
                </a>
              )}
            </div>

            {/* Pembimbing 2 Card */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-purple-500/30 border border-purple-400/40 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4 text-purple-200" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">Dosen Pembimbing 2 (Pendamping)</span>
                  <p className="font-bold text-white truncate text-xs sm:text-sm">{dospem2Nama}</p>
                </div>
              </div>

              {dospem2Nama !== 'Belum ditentukan Kaprodi' && (
                <a
                  href={waLink2}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm hover:shadow-md transition-all shrink-0 cursor-pointer"
                  title={`Gabung Grup WhatsApp Bimbingan ${dospem2Nama}`}
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 text-white" />
                  <span className="text-white">Grup WA</span>
                  <ExternalLink className="w-3 h-3 text-white/90" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Thesis Journey Stepper */}
      <ThesisStepper currentTitle={myTitle} stages={myStages} />

      {/* Automated Bimbingan Reminder Banner (Minimal 2x/Bulan) */}
      {reminderStatus && (
        <BimbinganReminderBanner 
          reminder={reminderStatus} 
          studentEmail={currentUser?.email}
          studentUser={currentUser}
          showAction={true}
        />
      )}

      {/* Linimasa Bimbingan Tugas Akhir */}
      <BimbinganTimeline 
        consultations={consultations} 
        currentUser={currentUser} 
      />

      {/* Status Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Active Title Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Judul TA Terdaftar</span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
              myTitle?.status === 'disetujui' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {myTitle?.status || 'Belum Ada'}
            </span>
          </div>

          {myTitle ? (
            <div>
              <h4 className="text-sm font-bold text-slate-900 leading-snug">{myTitle.judul}</h4>
              <p className="text-xs text-slate-500 mt-2 line-clamp-2">{myTitle.deskripsi}</p>
              
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">Similarity Score:</span>
                <span className="font-bold text-emerald-600">{myTitle.skor_kemiripan_terakhir}% (Aman)</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">
              Belum ada judul diajukan.
            </div>
          )}

          <div className="pt-2">
            <Link href="/thesis/status" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1">
              <span>Lihat Detail Audit & Status</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Room Defense Booking Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Ruang Sidang</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {myBookings.length} Pengajuan
            </span>
          </div>

          {myBookings.length > 0 ? (
            <div className="space-y-2">
              {myBookings.slice(0, 2).map(b => (
                <div key={b.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">{b.stage_label || b.purpose}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{b.room_name} • {b.booking_date} ({b.start_time}-{b.end_time})</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                    b.status === 'disetujui' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {b.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">
              Belum ada peminjaman ruangan diajukan.
            </div>
          )}

          <div className="pt-2">
            <Link href="/booking/status" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1">
              <span>Lihat Riwayat Peminjaman Ruang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
