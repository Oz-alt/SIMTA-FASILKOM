import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link } from '@inertiajs/react';
import { 
  Users, 
  Search, 
  Filter, 
  BookOpen, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  ChevronRight,
  UserCheck,
  FileText,
  Phone,
  Calendar,
  Sparkles
} from 'lucide-react';

export default function MahasiswaBimbinganPage() {
  const { currentUser, studentAdvisors, thesisTitles, thesisStages, consultations } = useAuth();

  const userNip = currentUser?.nip || currentUser?.nim || '';
  const userNama = currentUser?.nama || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all'); // 'all' | 'dospem1' | 'dospem2'
  const [filterStage, setFilterStage] = useState('all');

  // Filter students assigned to this dosen
  const assignedStudents = useMemo(() => {
    return studentAdvisors.filter(sa => {
      const isDospem1 = sa.dospem1_nip === userNip || (userNama && sa.dospem1_nama?.toLowerCase().includes(userNama.toLowerCase()));
      const isDospem2 = sa.dospem2_nip === userNip || (userNama && sa.dospem2_nama?.toLowerCase().includes(userNama.toLowerCase()));
      return isDospem1 || isDospem2 || currentUser?.role === 'dosen';
    });
  }, [studentAdvisors, userNip, userNama, currentUser]);

  // Merge with thesis title and consultation stats
  const enrichedStudents = useMemo(() => {
    return assignedStudents.map(student => {
      const title = thesisTitles.find(t => t.mhs_nim === student.student_nim);
      const studentStages = thesisStages.filter(s => s.thesis_title_id === title?.id);
      
      let stageName = 'Pengajuan Judul';
      let stageColor = 'bg-slate-100 text-slate-700 border-slate-200';

      if (title?.status === 'disetujui') {
        stageName = 'Penyusunan Proposal';
        stageColor = 'bg-amber-50 text-amber-800 border-amber-200';
      }

      if (studentStages.length > 0) {
        const semhas = studentStages.find(s => s.stage_type === 'seminar_hasil');
        const sidang = studentStages.find(s => s.stage_type === 'sidang_akhir');
        const sempro = studentStages.find(s => s.stage_type === 'seminar_proposal');

        if (sidang && (sidang.status === 'disetujui' || sidang.status === 'selesai')) {
          stageName = 'Sidang Akhir';
          stageColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        } else if (semhas && (semhas.status === 'disetujui' || semhas.status === 'selesai')) {
          stageName = 'Seminar Hasil';
          stageColor = 'bg-purple-50 text-purple-800 border-purple-200';
        } else if (sempro && (sempro.status === 'disetujui' || sempro.status === 'selesai')) {
          stageName = 'Seminar Proposal';
          stageColor = 'bg-blue-50 text-blue-800 border-blue-200';
        }
      }

      // Count consultations
      const mhsConsultations = consultations.filter(c => c.mhs_nim === student.student_nim);
      const approvedConsultations = mhsConsultations.filter(c => c.status === 'disetujui');

      const isD1 = student.dospem1_nip === userNip || (userNama && student.dospem1_nama?.toLowerCase().includes(userNama.toLowerCase()));

      return {
        ...student,
        thesisTitle: title?.judul || (student.judul_ta && student.judul_ta !== 'Judul Tugas Akhir' ? student.judul_ta : 'Belum mengajukan judul'),
        currentStage: stageName,
        stageColor,
        totalConsultations: mhsConsultations.length,
        approvedConsultations: approvedConsultations.length,
        roleInStudent: isD1 ? 'Pembimbing 1' : 'Pembimbing 2',
        noHp: student.no_hp || '081234567890'
      };
    });
  }, [assignedStudents, thesisTitles, thesisStages, consultations, userNip, userNama]);

  // Filtered result
  const filteredStudents = useMemo(() => {
    return enrichedStudents.filter(s => {
      const matchSearch = 
        s.student_nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.student_nim.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.thesisTitle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole = 
        filterRole === 'all' || 
        (filterRole === 'dospem1' && s.roleInStudent === 'Pembimbing 1') ||
        (filterRole === 'dospem2' && s.roleInStudent === 'Pembimbing 2');

      const matchStage = 
        filterStage === 'all' || s.currentStage.toLowerCase().includes(filterStage.toLowerCase());

      return matchSearch && matchRole && matchStage;
    });
  }, [enrichedStudents, searchQuery, filterRole, filterStage]);

  const countDospem1 = enrichedStudents.filter(s => s.roleInStudent === 'Pembimbing 1').length;
  const countDospem2 = enrichedStudents.filter(s => s.roleInStudent === 'Pembimbing 2').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 text-xs font-semibold border border-teal-400/30">
            <Users className="w-3.5 h-3.5" />
            <span>Manajemen Bimbingan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Daftar Mahasiswa Bimbingan
          </h1>
          <p className="text-sm text-teal-100/90 max-w-2xl leading-relaxed">
            Daftar seluruh mahasiswa Tugas Akhir yang dibimbing secara langsung oleh <strong>{userNama || 'Dosen'}</strong>.
          </p>
        </div>
      </div>

      {/* Stats Counter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Bimbingan</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{enrichedStudents.length} Mahasiswa</div>
          <p className="text-[11px] text-slate-500 mt-1">Aktif dalam proses pengerjaan TA</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sebagai Pembimbing 1</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-600">{countDospem1} Mahasiswa</div>
          <p className="text-[11px] text-slate-500 mt-1">Pembimbing Utama subtansi Tugas Akhir</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sebagai Pembimbing 2</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-600">{countDospem2} Mahasiswa</div>
          <p className="text-[11px] text-slate-500 mt-1">Pembimbing Pendamping teknis / implementasi</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, NIM, atau judul..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-teal-500"
          >
            <option value="all">Semua Peran Dospem</option>
            <option value="dospem1">Pembimbing 1</option>
            <option value="dospem2">Pembimbing 2</option>
          </select>

          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-teal-500"
          >
            <option value="all">Semua Tahapan</option>
            <option value="Proposal">Proposal</option>
            <option value="Hasil">Seminar Hasil</option>
            <option value="Sidang">Sidang Akhir</option>
          </select>
        </div>
      </div>

      {/* Main Student Cards / Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700">Tidak ada mahasiswa yang sesuai</div>
            <p className="text-xs text-slate-400">Silakan ubah kata kunci pencarian atau filter Anda.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredStudents.map((student) => (
              <div key={student.id} className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Info Kolom Kiri */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                    <span className="font-bold text-sm text-slate-900">{student.student_nama}</span>
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{student.student_nim}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      student.roleInStudent === 'Pembimbing 1' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}>
                      {student.roleInStudent}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${student.stageColor}`}>
                      {student.currentStage}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                    <span className="text-slate-400 font-semibold mr-1">Judul:</span>
                    {student.thesisTitle}
                  </p>

                  <div className="flex items-center space-x-4 text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>{student.approvedConsultations} Bimbingan Tervalidasi</span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{student.noHp}</span>
                    </span>
                  </div>
                </div>

                {/* Tombol Aksi Kanan */}
                <div className="flex items-center space-x-2 shrink-0">
                  <Link
                    href="/dosen/validasi"
                    className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                    <span>Validasi Bimbingan</span>
                  </Link>

                  <Link
                    href="/dosen/validasi-judul"
                    className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                    <span>Usulan Judul</span>
                  </Link>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
