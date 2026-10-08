import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link } from '@inertiajs/react';
import { 
  Users, 
  BookOpen, 
  MessageSquare,
  Clock, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function DashboardDosen() {
  const { currentUser, studentAdvisors, thesisTitles, thesisStages } = useAuth();

  // Normalize current user identifiers
  const userNip = currentUser?.nip || currentUser?.nim || '';
  const userNama = currentUser?.nama || '';

  // Find students assigned to this dosen
  const myStudents = studentAdvisors.filter(sa => 
    sa.dospem1_nip === userNip || sa.dospem2_nip === userNip
  );

  // Find pending title proposals for this dosen (menunggu validasi)
  const pendingTitles = thesisTitles.filter(t => {
    const isProposed = (t.pembimbing_1_nip && t.pembimbing_1_nip === userNip) ||
                       (t.pembimbing_2_nip && t.pembimbing_2_nip === userNip) ||
                       (t.pembimbing_1 && t.pembimbing_1 === userNama) ||
                       (t.pembimbing_2 && t.pembimbing_2 === userNama);
    return isProposed && (!t.rekomendasi_dospem_status || t.rekomendasi_dospem_status === 'menunggu_validasi');
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 text-xs font-semibold backdrop-blur-sm mb-3 border border-teal-400/20">
          <span>Portal Dosen Pembimbing</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Selamat Datang, {currentUser?.nama}</h1>
        <p className="text-sm text-teal-100/90 mt-1 max-w-2xl leading-relaxed">
          Pantau progres mahasiswa bimbingan Anda, validasi usulan judul, dan kelola jadwal sidang Tugas Akhir secara terpadu.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mahasiswa Bimbingan</div>
          <div className="text-2xl font-extrabold text-blue-600 flex items-center justify-between">
            <span>{myStudents.length} Mahasiswa</span>
            <Users className="w-6 h-6 text-blue-500/30" />
          </div>
          <p className="text-[11px] text-slate-500">Total mahasiswa yang dibimbing</p>
        </div>

        <Link href="/dosen/validasi-judul" className="bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all rounded-xl p-5 shadow-2xs space-y-1 block group">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Tinjauan Judul Baru</span>
            <ArrowRight className="w-4 h-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 flex items-center justify-between">
            <span>{pendingTitles.length} Judul</span>
            <Clock className="w-6 h-6 text-amber-500/30" />
          </div>
          <p className="text-[11px] text-slate-500">Menunggu validasi Anda</p>
        </Link>

        <Link href="/dosen/jadwal-sidang" className="bg-gradient-to-br from-indigo-50 to-indigo-100/60 border border-indigo-200 rounded-xl p-5 shadow-2xs space-y-1 hover:border-indigo-400 hover:shadow-md transition-all group block sm:col-span-2 lg:col-span-2">
          <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center justify-between">
            <span>Jadwal & Notifikasi Sidang</span>
            <ArrowRight className="w-5 h-5 text-indigo-600 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="text-sm font-bold text-slate-900 pt-1">Agenda Sidang &amp; Ujian Mahasiswa</div>
          <p className="text-[11px] text-indigo-600/80 font-medium mt-1">
            Lihat jadwal pelaksanaan sidang akhir dan notifikasi pengujian mahasiswa bimbingan.
          </p>
        </Link>
      </div>

      {/* Quick Student List */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Mahasiswa Bimbingan Aktif</span>
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            Total {myStudents.length} Mahasiswa
          </span>
        </div>

        {myStudents.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            Belum ada mahasiswa bimbingan yang dialokasikan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px]">
                  <th className="py-3 px-3">Mahasiswa</th>
                  <th className="py-3 px-3">Judul TA</th>
                  <th className="py-3 px-3">Status Tahapan</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myStudents.map(student => {
                  const title = thesisTitles.find(t => t.mhs_nim === student.student_nim);
                  
                  // Determine highest stage
                  let currentStage = 'Pengajuan Judul';
                  if (title?.status === 'disetujui') currentStage = 'Penyusunan Proposal';
                  
                  const stages = thesisStages.filter(s => s.thesis_title_id === title?.id);
                  if (stages.length > 0) {
                     const semhas = stages.find(s => s.stage_type === 'seminar_hasil');
                     const sidang = stages.find(s => s.stage_type === 'sidang_akhir');
                     if (sidang?.status === 'disetujui' || sidang?.status === 'selesai') currentStage = 'Sidang Akhir';
                     else if (semhas?.status === 'disetujui' || semhas?.status === 'selesai') currentStage = 'Seminar Hasil';
                     else currentStage = 'Seminar Proposal';
                  }

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{student.student_nama}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{student.student_nim}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-800 font-medium max-w-[250px] truncate" title={title?.judul || student.judul_ta || 'Belum mengajukan'}>
                        {title?.judul || (student.judul_ta && student.judul_ta !== 'Judul Tugas Akhir' && student.judul_ta !== 'Rancang Bangun Sistem Informasi Manajemen Tugas Akhir & Peminjaman Ruang Sidang' ? student.judul_ta : 'Belum mengajukan')}
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold border border-blue-100">
                          {currentStage}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="inline-flex items-center space-x-1 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md text-[11px] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Aktif</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
