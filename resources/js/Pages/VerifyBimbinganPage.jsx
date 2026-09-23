import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Head } from '@inertiajs/react';
import unsriLogo from '../assets/photo/unsri logo.png';
import ruanganImg from '../assets/photo/ruangan.jpeg';

export default function VerifyBimbinganPage({ nim: propNim }) {
  const { getAllRegisteredStudents, studentAdvisors, advisors, consultations } = useAuth();

  // Determine NIM & Log ID from props or URL
  const { nim, logId } = useMemo(() => {
    let resolvedNim = propNim || '';
    let resolvedLog = '';

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      resolvedLog = urlParams.get('log') || '';

      if (!resolvedNim) {
        const parts = window.location.pathname.split('/');
        const last = parts[parts.length - 1];
        if (last && last !== 'bimbingan') {
          resolvedNim = last;
        }
      }
    }

    return {
      nim: resolvedNim || '',
      logId: resolvedLog
    };
  }, [propNim]);

  // Find the student profile dynamically
  const allStudents = getAllRegisteredStudents();
  const student = useMemo(() => {
    if (!nim) return null;
    return allStudents.find(s => String(s.nim).trim() === String(nim).trim()) || {
      nama: 'Mahasiswa',
      nim: nim
    };
  }, [allStudents, nim]);

  // Approved consultations for this student in chronological order
  const approvedConsultations = useMemo(() => {
    if (!nim) return [];
    return consultations
      .filter(c => String(c.mhs_nim).trim() === String(nim).trim() && c.status === 'disetujui')
      .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
  }, [consultations, nim]);

  // Specific target log session
  const targetLogIndex = useMemo(() => {
    if (!approvedConsultations.length) return -1;
    if (logId) {
      const idx = approvedConsultations.findIndex(c => String(c.id) === String(logId));
      if (idx >= 0) return idx;
    }
    return approvedConsultations.length - 1; // default to latest approved session
  }, [approvedConsultations, logId]);

  const targetLog = targetLogIndex >= 0 ? approvedConsultations[targetLogIndex] : null;
  const bimbinganKe = targetLogIndex >= 0 ? targetLogIndex + 1 : 1;

  // Find advisor info dynamically
  const sa = useMemo(() => {
    if (!nim) return null;
    return studentAdvisors.find(s => String(s.student_nim).trim() === String(nim).trim());
  }, [studentAdvisors, nim]);

  let dospemName = "-";
  let dospemNIP = "-";

  if (targetLog && targetLog.pembimbing === 'Pembimbing 2' && sa) {
    const dospem2 = advisors.find(a => a.nip === sa.dospem2_nip);
    if (dospem2) {
      dospemName = dospem2.nama;
      dospemNIP = dospem2.nip;
    }
  } else if (sa) {
    const dospem1 = advisors.find(a => a.nip === sa.dospem1_nip);
    if (dospem1) {
      dospemName = dospem1.nama;
      dospemNIP = dospem1.nip;
    }
  }

  return (
    <>
      <Head title={`Verifikasi Bimbingan - ${student?.nama || nim}`} />
      
      {/* Outer Container with Ruangan.jpeg Background & Overlay */}
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 sm:p-6 select-none font-sans relative"
        style={{ backgroundImage: `url(${ruanganImg})` }}
      >
        {/* Dark Overlay with Subtle Blur */}
        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs"></div>

        {/* Verification Card Modal Container */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md mx-auto relative z-10 overflow-hidden border border-slate-200/90 font-sans">
          
          {/* Top Yellow UNSRI Flower Emblem Logo */}
          <div className="flex flex-col items-center justify-center mb-6">
            <img 
              src={unsriLogo} 
              alt="Logo UNSRI" 
              className="w-24 h-auto drop-shadow-md object-contain"
            />
          </div>

          {targetLog ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs font-sans">
              <table className="w-full text-xs text-left border-collapse font-sans">
                <tbody className="divide-y divide-slate-100 font-sans">
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 w-2/5 text-slate-500 font-semibold border-r border-slate-100 bg-slate-50/60">NIM</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {student.nim}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-semibold border-r border-slate-100 bg-slate-50/60">Nama</td>
                    <td className="py-3 px-4 font-bold text-slate-900 uppercase">
                      {student.nama}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-semibold border-r border-slate-100 bg-slate-50/60">Tanggal Bimbingan</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {targetLog.tanggal}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-semibold border-r border-slate-100 bg-slate-50/60">Jam Bimbingan</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {targetLog.waktu || '10:00'} WIB
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-semibold border-r border-slate-100 bg-slate-50/60">Bimbingan Ke</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {bimbinganKe}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-semibold border-r border-slate-100 bg-slate-50/60">Dosen Pembimbing</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {dospemName}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-semibold border-r border-slate-100 bg-slate-50/60">NIP Dosen Pembimbing</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {dospemNIP}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 space-y-2 font-sans">
              <p className="text-rose-600 font-extrabold text-sm">Sesi Bimbingan Tidak Ditemukan</p>
              <p className="text-slate-500 text-xs">QR Code ini tidak terdaftar atau belum disetujui Dosen Pembimbing.</p>
            </div>
          )}

          {/* Official VERIFIED Ribbon Seal Indicator */}
          <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none overflow-hidden z-20">
            <div className="absolute transform rotate-45 bg-emerald-600 text-white text-[9px] font-extrabold py-1 right-[-35px] top-[24px] w-[150px] text-center shadow-md border-y border-emerald-400 tracking-wider uppercase font-sans">
              OFFICIAL VERIFIED
            </div>
          </div>
          
        </div>

      </div>
    </>
  );
}

// Standalone layout (No navbar, no sidebar)
VerifyBimbinganPage.layout = (page) => page;
