import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  Printer, 
  ShieldCheck, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function KartuBimbinganPage() {
  const { currentUser, consultations } = useAuth();

  // Filter consultations for current student
  const studentConsultations = useMemo(() => {
    return consultations.filter(c => !currentUser?.nim || c.mhs_nim === currentUser.nim);
  }, [consultations, currentUser]);

  const totalApproved = studentConsultations.filter(c => c.status === 'disetujui').length;
  const minRequired = 8;
  const isEligibleForDefense = totalApproved >= minRequired;

  return (
    <div className="max-w-7xl mx-auto space-y-6 select-none">
      
      {/* Back Link & Page Title Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/thesis/consultations"
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Form Bimbingan</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-md space-y-6">
        
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200 mb-1">
              <Printer className="w-3 h-3" />
              <span>Dokumen Kendali Resmi</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Kartu Bimbingan Tugas Akhir Digital
            </h1>
            <p className="text-xs text-slate-500">Lembar kontrol bimbingan terverifikasi digital FASILKOM UNSRI</p>
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Kartu Bimbingan</span>
          </button>
        </div>

        {/* Format Cetak Kartu Bimbingan */}
        <div className="border border-slate-300 rounded-xl p-6 sm:p-8 space-y-6 bg-slate-50/30">
          
          {/* Header Instansi */}
          <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 uppercase tracking-wide">FAKULTAS ILMU KOMPUTER - UNIVERSITAS SRIWIJAYA</h3>
            <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider">LEMBAR KONTROL &amp; KARTU BIMBINGAN TUGAS AKHIR</h4>
            <p className="text-xs text-slate-600">Kampus Palembang / Indralaya • SIMTA Integrated System</p>
          </div>

          {/* Student Metadata Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-800">
            <div className="space-y-1.5">
              <p><span className="text-slate-500 font-normal">Nama Mahasiswa:</span> {currentUser?.nama || 'Aulia Azzahra'}</p>
              <p><span className="text-slate-500 font-normal">NIM:</span> {currentUser?.nim || '09010182428002'}</p>
              <p><span className="text-slate-500 font-normal">Program Studi:</span> {currentUser?.prodi || 'D3 Manajemen Informatika'}</p>
              <p><span className="text-slate-500 font-normal">Kelas:</span> {currentUser?.kelas || 'MI 5A'}</p>
            </div>
            <div className="space-y-1.5">
              <p><span className="text-slate-500 font-normal">Pembimbing 1:</span> Dr. Ir. Hendra Kusuma, M.T.</p>
              <p><span className="text-slate-500 font-normal">Pembimbing 2:</span> Siti Nurhaliza, S.Kom., M.Kom.</p>
              <p><span className="text-slate-500 font-normal">Total Sesi Disetujui:</span> {totalApproved} Sesi</p>
              <p><span className="text-slate-500 font-normal">Status Kelayakan Sidang:</span> <strong className={isEligibleForDefense ? 'text-emerald-700' : 'text-amber-700'}>{isEligibleForDefense ? 'MEMENUHI SYARAT (MIN. 8 SESI)' : 'BELUM MEMENUHI SYARAT'}</strong></p>
            </div>
          </div>

          {/* Rekapitulasi Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-200 text-slate-900 font-bold uppercase text-[10px]">
                  <th className="border border-slate-300 p-2 text-center">No</th>
                  <th className="border border-slate-300 p-2">Tanggal &amp; Waktu</th>
                  <th className="border border-slate-300 p-2">Pembimbing</th>
                  <th className="border border-slate-300 p-2">Bab / Materi Konsultasi</th>
                  <th className="border border-slate-300 p-2">Masukan Pembimbing</th>
                  <th className="border border-slate-300 p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {studentConsultations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-slate-400">Belum ada data bimbingan</td>
                  </tr>
                ) : (
                  studentConsultations.map((c, idx) => (
                    <tr key={c.id} className="bg-white">
                      <td className="border border-slate-300 p-2 text-center font-bold">{idx + 1}</td>
                      <td className="border border-slate-300 p-2 font-medium">{c.tanggal} ({c.waktu})</td>
                      <td className="border border-slate-300 p-2 font-semibold">{c.pembimbing}</td>
                      <td className="border border-slate-300 p-2 font-medium">{c.bab_topik}</td>
                      <td className="border border-slate-300 p-2 italic">{c.masukan_dosen || '-'}</td>
                      <td className="border border-slate-300 p-2 text-center font-bold uppercase text-[10px]">
                        {c.status === 'disetujui' ? (
                          <span className="text-emerald-700">Valid</span>
                        ) : c.status === 'perlu_revisi' ? (
                          <span className="text-amber-700">Revisi</span>
                        ) : (
                          <span className="text-blue-700">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Signature Validation Seal */}
          <div className="flex items-end justify-between pt-6 border-t border-slate-200 text-xs flex-wrap gap-4">
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Verifikasi Sistem SIMTA:</span>
              <p className="text-emerald-700 font-bold flex items-center space-x-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Terverifikasi Digital FASILKOM UNSRI</span>
              </p>
            </div>

            <div className="text-center space-y-12 shrink-0">
              <p className="font-semibold text-slate-800">Mengetahui, Ketua Program Studi</p>
              <p className="font-extrabold text-slate-900 border-b border-slate-900 pb-0.5">Dr. Ir. Hendra Kusuma, M.T.</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
