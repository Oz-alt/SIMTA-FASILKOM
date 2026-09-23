import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Head } from '@inertiajs/react';

export default function VerifyBimbinganPage({ nim }) {
  const { getAllRegisteredStudents, studentAdvisors, advisors } = useAuth();

  // Find the student
  const allStudents = getAllRegisteredStudents();
  const student = allStudents.find(s => s.nim === nim);

  // Find advisors
  const sa = studentAdvisors.find(s => s.student_nim === nim);
  let dospemName = "Belum diatur";
  let dospemNIP = "-";
  if (sa) {
    const dospem1 = advisors.find(a => a.nip === sa.dospem1_nip);
    if (dospem1) {
      dospemName = dospem1.nama;
      dospemNIP = dospem1.nip;
    }
  }

  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <>
      <Head title="Verifikasi Dokumen Digital" />
      <div className="min-h-screen bg-slate-800/80 backdrop-blur-sm flex items-center justify-center p-4">
        
        {/* Modal Container */}
        <div className="bg-white rounded-md shadow-2xl p-6 sm:p-8 w-full max-w-md mx-auto relative overflow-hidden">
          
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/0/00/Lambang_Universitas_Sriwijaya.png" 
              alt="Logo UNSRI" 
              className="w-24 h-auto"
            />
          </div>

          {student ? (
            <div className="border border-slate-200">
              <table className="w-full text-xs text-left">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 px-3 w-1/3 text-slate-500 font-medium">Nama</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      : {student.nama}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 px-3 text-slate-500 font-medium">NIM</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      : {student.nim}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 px-3 text-slate-500 font-medium">Tempat, Tanggal Lahir</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      : PALEMBANG, 10 JANUARI 2000
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 px-3 text-slate-500 font-medium align-top">Dokumen</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 uppercase">
                      : KARTU BIMBINGAN TUGAS AKHIR DIGITAL ({student.prodi || 'D3 MANAJEMEN INFORMATIKA'})
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 px-3 text-slate-500 font-medium align-top">Jabatan Penanda Tangan</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      : Dosen Pembimbing Akademik
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 px-3 text-slate-500 font-medium">Penanda Tangan</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      : {dospemName}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 px-3 text-slate-500 font-medium">NIP Penanda Tangan</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      : {dospemNIP}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 px-3 text-slate-500 font-medium">Tanggal Penanda Tangan</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      : {currentDate}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 text-slate-500 font-medium">No Surat</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      : -
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-red-500 font-bold mb-2">Data tidak ditemukan!</p>
              <p className="text-slate-500 text-sm">QR Code tidak valid atau dokumen tidak terdaftar.</p>
            </div>
          )}

          {/* Valid seal indicator */}
          <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
            <div className="absolute transform rotate-45 bg-emerald-500 text-white text-[9px] font-bold py-1 right-[-35px] top-[32px] w-[170px] text-center shadow-md">
              VERIFIED
            </div>
          </div>
          
        </div>

      </div>
    </>
  );
}
