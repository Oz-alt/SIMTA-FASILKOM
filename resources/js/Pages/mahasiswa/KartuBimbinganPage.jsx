import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ArrowLeft, Printer } from 'lucide-react';
import { Link } from '@inertiajs/react';

export default function KartuBimbinganPage() {
  const { currentUser, consultations, studentAdvisors, advisors } = useAuth();

  // Find advisor assignment for current student dynamically
  const studentNim = currentUser?.nim || '';
  const sa = useMemo(() => {
    if (!studentNim) return null;
    return studentAdvisors.find(s => String(s.student_nim).trim() === String(studentNim).trim());
  }, [studentAdvisors, studentNim]);

  const dospem1Nama = useMemo(() => {
    if (sa?.dospem1_nip) {
      const found = advisors.find(a => a.nip === sa.dospem1_nip);
      if (found) return found.nama;
    }
    const cons1 = consultations.find(c => String(c.mhs_nim).trim() === String(studentNim).trim() && c.pembimbing === 'Pembimbing 1');
    if (cons1?.dosen_nama) return cons1.dosen_nama;
    return '-';
  }, [advisors, sa, consultations, studentNim]);

  const dospem2Nama = useMemo(() => {
    if (sa?.dospem2_nip) {
      const found = advisors.find(a => a.nip === sa.dospem2_nip);
      if (found) return found.nama;
    }
    const cons2 = consultations.find(c => String(c.mhs_nim).trim() === String(studentNim).trim() && c.pembimbing === 'Pembimbing 2');
    if (cons2?.dosen_nama) return cons2.dosen_nama;
    return '-';
  }, [advisors, sa, consultations, studentNim]);

  // Filter consultations for current student, only approved ones in strict chronological order (oldest to newest: Bimbingan 1, 2, 3...)
  const studentConsultations = useMemo(() => {
    if (!studentNim) return [];
    
    const parseIdNum = (idStr) => {
      const match = String(idStr).match(/\d+/);
      return match ? Number(match[0]) : 0;
    };

    return consultations
      .filter(c => String(c.mhs_nim).trim() === String(studentNim).trim() && c.status === 'disetujui')
      .sort((a, b) => {
        // 1. Primary: Compare tanggal (YYYY-MM-DD)
        const dateA = a.tanggal || '';
        const dateB = b.tanggal || '';
        if (dateA !== dateB) {
          return dateA.localeCompare(dateB);
        }

        // 2. Secondary: Compare creation timestamp (created_at) for entries submitted on same day
        const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (createdA !== 0 && createdB !== 0 && createdA !== createdB) {
          return createdA - createdB;
        }

        // 3. Tertiary: Compare numeric ID timestamp (cons-1, cons-2, cons-174028...)
        const numA = parseIdNum(a.id);
        const numB = parseIdNum(b.id);
        if (numA !== 0 && numB !== 0 && numA !== numB) {
          return numA - numB;
        }

        // 4. Quaternary: Compare waktu (HH:MM)
        const waktuA = a.waktu || '';
        const waktuB = b.waktu || '';
        if (waktuA !== waktuB) {
          return waktuA.localeCompare(waktuB);
        }

        return String(a.id).localeCompare(String(b.id));
      });
  }, [consultations, studentNim]);

  const verifyUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/verify/bimbingan/${studentNim}`
    : `/verify/bimbingan/${studentNim}`;

  // Minimum 12 rows, dynamically grows if student has more consultations
  const ROWS_COUNT = Math.max(12, studentConsultations.length);

  return (
    <div className="max-w-4xl mx-auto space-y-6 select-none bg-slate-50 p-6 min-h-screen">
      
      {/* Top Action Bar (Not printed) */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/thesis/consultations"
          className="inline-flex items-center space-x-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Log Bimbingan</span>
        </Link>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Kartu Bimbingan</span>
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div className="bg-white p-8 sm:p-12 shadow-sm border border-slate-200 print:p-0 print:shadow-none print:border-none print:m-0 mx-auto" style={{ width: '100%', maxWidth: '210mm', minHeight: '297mm' }}>
        
        {/* Header Kartu */}
        <div className="text-center space-y-1 mb-8">
          <h1 className="text-base sm:text-lg font-extrabold uppercase text-black tracking-wide">
            CATATAN KEGIATAN KONSULTASI AKADEMIK/PRIBADI
          </h1>
          <p className="text-xs font-bold text-slate-700 uppercase">
            FAKULTAS ILMU KOMPUTER - UNIVERSITAS SRIWIJAYA
          </p>
          <div className="border-b-2 border-black w-full pt-2"></div>
        </div>

        {/* Info Mahasiswa - Dynamic from logged-in account */}
        <div className="grid grid-cols-2 text-xs font-semibold text-black mb-6 gap-x-6 gap-y-1.5">
          <div className="space-y-1">
            <p><span className="w-28 inline-block font-bold">Nama</span>: {currentUser?.nama || '-'}</p>
            <p><span className="w-28 inline-block font-bold">NIM</span>: {studentNim || '-'}</p>
            <p><span className="w-28 inline-block font-bold">Program Studi</span>: {currentUser?.prodi || 'D3 Manajemen Informatika'}</p>
          </div>
          <div className="space-y-1">
            <p><span className="w-24 inline-block font-bold">Dospem 1</span>: {dospem1Nama}</p>
            <p><span className="w-24 inline-block font-bold">Dospem 2</span>: {dospem2Nama}</p>
          </div>
        </div>

        {/* Tabel Pertemuan */}
        <table className="w-full border-collapse border border-black text-xs text-black">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-black py-2 px-1 text-center w-10">No</th>
              <th className="border border-black py-2 px-2 text-center w-28">Tanggal<br/>Pertemuan</th>
              <th className="border border-black py-2 px-3 text-center">Materi / Bab<br/>Konsultasi</th>
              <th className="border border-black py-2 px-2 text-center w-20">Paraf<br/>Mahasiswa</th>
              <th className="border border-black py-2 px-2 text-center w-28 sm:w-32">Paraf<br/>Pembimbing 1</th>
              <th className="border border-black py-2 px-2 text-center w-28 sm:w-32">Paraf<br/>Pembimbing 2</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS_COUNT }).map((_, index) => {
              const data = studentConsultations[index];
              return (
                <tr key={index} className="min-h-12">
                  <td className="border border-black py-2 px-1 text-center font-semibold align-middle">{index + 1}</td>
                  <td className="border border-black py-2 px-2 text-center align-middle">{data ? data.tanggal : ''}</td>
                  <td className="border border-black py-2 px-3 text-left font-medium align-middle">{data ? data.bab_topik : ''}</td>
                  <td className="border border-black p-2 text-center align-middle">
                    {/* Paraf Mahasiswa dikosongkan */}
                  </td>
                  <td className="border border-black p-1.5 text-center align-middle">
                    {data && (data.pembimbing === 'Pembimbing 1' || !data.pembimbing) ? (
                      <div className="flex justify-center items-center py-1">
                        <a href={`${verifyUrl}?log=${data.id}`} target="_blank" rel="noopener noreferrer" title="Scan/Klik QR Verifikasi Bimbingan">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${verifyUrl}?log=${data.id}`)}`}
                            alt="QR Paraf Dospem 1" 
                            className="w-14 h-14 sm:w-16 sm:h-16 object-contain inline-block border border-slate-300 p-1 rounded-sm shadow-2xs hover:scale-105 transition-transform"
                          />
                        </a>
                      </div>
                    ) : ''}
                  </td>
                  <td className="border border-black p-1.5 text-center align-middle">
                    {data && data.pembimbing === 'Pembimbing 2' ? (
                      <div className="flex justify-center items-center py-1">
                        <a href={`${verifyUrl}?log=${data.id}`} target="_blank" rel="noopener noreferrer" title="Scan/Klik QR Verifikasi Bimbingan">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${verifyUrl}?log=${data.id}`)}`}
                            alt="QR Paraf Dospem 2" 
                            className="w-14 h-14 sm:w-16 sm:h-16 object-contain inline-block border border-slate-300 p-1 rounded-sm shadow-2xs hover:scale-105 transition-transform"
                          />
                        </a>
                      </div>
                    ) : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Tanda Tangan Kaprodi & Mahasiswa */}
        <div className="mt-14 flex justify-between items-end text-xs text-black">
          <div className="w-72 text-center space-y-1">
            <p className="font-semibold pb-24">
              Koordinator Program Studi<br />
              Manajemen Informatika,
            </p>
            <div className="border-b border-black w-full"></div>
            <p className="font-bold pt-1.5">Dr. Abdiansah, S.Kom., M.Cs.</p>
            <p className="font-mono text-[11px]">NIP: 198410012009121005</p>
          </div>
          
          <div className="w-72 text-center space-y-1">
            <p className="font-semibold">Palembang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-semibold pb-24">Mahasiswa Ybs,</p>
            <div className="border-b border-black w-full"></div>
            <p className="font-bold pt-1.5">{currentUser?.nama || '-'}</p>
            <p className="font-mono text-[11px]">NIM: {studentNim || '-'}</p>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-none {
            border: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:m-0 {
            margin: 0 !important;
          }
          .max-w-4xl {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .bg-slate-50 {
            background-color: white !important;
          }
          .bg-white > * {
            visibility: visible;
          }
          .bg-white {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}} />
    </div>
  );
}
