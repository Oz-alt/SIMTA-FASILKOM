import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ArrowLeft, Printer } from 'lucide-react';
import { Link } from '@inertiajs/react';

export default function KartuBimbinganPage() {
  const { currentUser, consultations } = useAuth();

  // Filter consultations for current student, only approved ones
  const studentConsultations = useMemo(() => {
    const list = consultations.filter(c => !currentUser?.nim || c.mhs_nim === currentUser.nim);
    return list.filter(c => c.status === 'disetujui').reverse();
  }, [consultations, currentUser]);

  const ROWS_COUNT = 25;

  return (
    <div className="max-w-4xl mx-auto space-y-6 select-none bg-slate-50 p-6 min-h-screen">
      
      {/* Top Action Bar (Not printed) */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/thesis/consultations"
          className="inline-flex items-center space-x-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </Link>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center space-x-2 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Kartu Bimbingan</span>
        </button>
      </div>

      {/* Printable Area */}
      <div className="bg-white p-10 sm:p-12 shadow-sm border border-slate-200 print:p-0 print:shadow-none print:border-none print:m-0 mx-auto" style={{ width: '100%', maxWidth: '210mm', minHeight: '297mm' }}>
        
        <h1 className="text-center text-lg sm:text-xl font-bold uppercase text-black mb-8 tracking-wide">
          CATATAN KEGIATAN KONSULTASI AKADEMIK/PRIBADI
        </h1>

        <table className="w-full border-collapse border border-black text-xs sm:text-sm text-black">
          <thead>
            <tr>
              <th className="border border-black py-2 px-1 text-center w-12">No</th>
              <th className="border border-black py-2 px-3 text-center w-32">Tanggal<br/>Pertemuan</th>
              <th className="border border-black py-2 px-3 text-center">Materi<br/>Konsultasi</th>
              <th className="border border-black py-2 px-2 text-center w-24">Paraf<br/>Mahasiswa</th>
              <th className="border border-black py-2 px-2 text-center w-24">Paraf<br/>Pembimbing<br/>1</th>
              <th className="border border-black py-2 px-2 text-center w-24">Paraf<br/>Pembimbing<br/>2</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS_COUNT }).map((_, index) => {
              const data = studentConsultations[index];
              return (
                <tr key={index} className="h-8">
                  <td className="border border-black py-1 px-1 text-center font-semibold">{index + 1}</td>
                  <td className="border border-black py-1 px-2 text-center">{data ? data.tanggal : ''}</td>
                  <td className="border border-black py-1 px-3 text-left">{data ? data.bab_topik : ''}</td>
                  <td className="border border-black py-1 px-2 text-center">
                    {data ? <span className="text-gray-400 italic text-[10px]">Ttd.</span> : ''}
                  </td>
                  <td className="border border-black py-1 px-2 text-center">
                    {data && data.pembimbing === 'Pembimbing 1' ? <span className="text-gray-400 italic text-[10px]">Ttd.</span> : ''}
                  </td>
                  <td className="border border-black py-1 px-2 text-center">
                    {data && data.pembimbing === 'Pembimbing 2' ? <span className="text-gray-400 italic text-[10px]">Ttd.</span> : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-16 flex justify-between items-end text-sm text-black">
          <div className="w-64">
            <p className="mb-2 font-medium">Dosen Pembimbing Akademik,</p>
            <div className="flex justify-center mb-2">
               {/* QR Code for Verification */}
               <img 
                 src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.origin + '/verify/bimbingan/' + (currentUser?.nim || '09010182428002'))}`}
                 alt="QR Code Verifikasi" 
                 className="w-20 h-20"
               />
            </div>
            <div className="border-b border-dotted border-black w-full mb-1"></div>
            <p className="font-medium">NIP</p>
          </div>
          
          <div className="w-64">
            <p className="mb-1 font-medium">Palembang,</p>
            <p className="mb-16 font-medium">Mahasiswa Ybs,</p>
            <div className="border-b border-dotted border-black w-full mb-1"></div>
            <p className="font-medium">NIM {currentUser?.nim || ''}</p>
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
