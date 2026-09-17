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

  // Find students assigned to this dosen
  const myStudents = studentAdvisors.filter(sa => 
    sa.dospem1_nip === currentUser.nip || sa.dospem2_nip === currentUser.nip
  );

  // Get their titles
  const myStudentTitles = thesisTitles.filter(t => 
    myStudents.some(sa => sa.student_nim === t.mhs_nim)
  );

  const pendingTitles = myStudentTitles.filter(t => t.status === 'diajukan');

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 text-xs font-semibold backdrop-blur-sm mb-3 border border-teal-400/20">
          <span>Portal Dosen Pembimbing</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Selamat Datang, {currentUser?.nama}</h1>
        <p className="text-sm text-teal-100/90 mt-1 max-w-2xl leading-relaxed">
          Pantau progres bimbingan mahasiswa Anda, tinjau pengajuan judul, dan jadwalkan sesi bimbingan secara efektif.
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

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tinjauan Judul Baru</div>
          <div className="text-2xl font-extrabold text-amber-600 flex items-center justify-between">
            <span>{pendingTitles.length} Judul</span>
            <Clock className="w-6 h-6 text-amber-500/30" />
          </div>
          <p className="text-[11px] text-slate-500">Menunggu validasi Anda</p>
        </div>

        <Link href="/dosen/bimbingan" className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 border border-emerald-200 rounded-xl p-5 shadow-2xs space-y-1 hover:border-emerald-400 hover:shadow-md transition-all group block sm:col-span-2 lg:col-span-2">
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center justify-between">
            <span>Progress Bimbingan</span>
            <ArrowRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="text-sm font-bold text-slate-900 pt-1">Buka Log Konsultasi Mahasiswa</div>
          <p className="text-[11px] text-emerald-600/80 font-medium mt-1">
            Berikan masukan, periksa revisi, dan ACC laporan untuk pendaftaran sidang.
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
          <Link href="/dosen/bimbingan" className="text-xs font-bold text-emerald-600 hover:text-emerald-800">
            Lihat Semua
          </Link>
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
                      <td className="py-3 px-3 text-slate-800 font-medium max-w-[250px] truncate" title={student.judul_ta}>
                        {student.judul_ta || 'Belum mengajukan'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold border border-blue-100">
                          {currentStage}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link href="/dosen/bimbingan" className="inline-flex items-center space-x-1 text-emerald-600 hover:text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Konsultasi</span>
                        </Link>
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
