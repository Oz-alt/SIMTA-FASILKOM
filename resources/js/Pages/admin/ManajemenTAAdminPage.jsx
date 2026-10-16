import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getStudentSemester, AVAILABLE_SEMESTERS } from '../../lib/academicUtils.js';
import StatusBadge from '../../Components/common/StatusBadge.jsx';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  GraduationCap, 
  UserCheck, 
  Users, 
  ShieldCheck, 
  AlertTriangle, 
  AlertCircle,
  Download, 
  Eye, 
  ChevronDown, 
  Calendar, 
  Building2, 
  Sparkles, 
  Check, 
  FileSpreadsheet,
  Layers,
  FileCheck2,
  FileText,
  FileClock,
  X,
  Printer,
  ExternalLink,
  Edit3
} from 'lucide-react';

const ADMIN_TA_STORAGE_KEY = 'simta_admin_ta_administrative_data';

export default function ManajemenTAAdminPage() {
  const { 
    thesisTitles = [], 
    advisors = [], 
    getAllMahasiswaAccounts,
    getAllRegisteredStudents 
  } = useAuth();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [submissionTab, setSubmissionTab] = useState('all'); // 'all' | 'sudah' | 'belum'
  const [academicStatusFilter, setAcademicStatusFilter] = useState('ALL');
  const [adminStatusFilter, setAdminStatusFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('Semua Semester');
  const [classFilter, setClassFilter] = useState('ALL');

  // Modal States
  const [viewingItem, setViewingItem] = useState(null);
  const [managingAdminItem, setManagingAdminItem] = useState(null);

  // Administrative form state for modal
  const [adminForm, setAdminForm] = useState({
    berkas_status: 'menunggu', // 'lengkap' | 'menunggu' | 'perlu_perbaikan'
    nomor_sk: '',
    catatan_admin: '',
    checklist: {
      form_pendaftaran: true,
      krs_berjalan: true,
      transkrip_nilai: false,
      bebas_pustaka: false
    }
  });

  // Persistent Administrative Data Map: key = nim
  const [administrativeRecords, setAdministrativeRecords] = useState(() => {
    try {
      const saved = localStorage.getItem(ADMIN_TA_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Toast Notification
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Lock background scroll when modal is open
  useEffect(() => {
    const isModalOpen = Boolean(viewingItem || managingAdminItem);
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [viewingItem, managingAdminItem]);

  // Save administrative records to localStorage
  const saveAdministrativeRecord = (nim, data) => {
    const updated = {
      ...administrativeRecords,
      [nim]: {
        ...administrativeRecords[nim],
        ...data,
        updated_at: new Date().toISOString()
      }
    };
    setAdministrativeRecords(updated);
    try {
      localStorage.setItem(ADMIN_TA_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save administrative record:', e);
    }
  };

  // Compile unified list of all D3 students: Submitted + Unsubmitted (matching Kaprodi structure)
  const allStudents = useMemo(() => {
    const registeredStudents = typeof getAllMahasiswaAccounts === 'function' 
      ? getAllMahasiswaAccounts() 
      : (typeof getAllRegisteredStudents === 'function' ? getAllRegisteredStudents() : []);

    const matchedNims = new Set();

    // 1. Mahasiswa yang sudah mengusulkan judul
    const submittedList = thesisTitles.map(t => {
      const cleanNim = String(t.mhs_nim || '').trim();
      if (cleanNim) matchedNims.add(cleanNim);
      const matchedProfile = registeredStudents.find(s => String(s.nim).trim() === cleanNim);
      const adminMeta = administrativeRecords[cleanNim] || {};

      return {
        id: t.id,
        mhs_nim: cleanNim,
        mhs_nama: t.mhs_nama || matchedProfile?.nama || 'Mahasiswa D3 MI',
        mhs_kelas: t.mhs_kelas || matchedProfile?.kelas || 'MI 5A',
        prodi: t.prodi || matchedProfile?.prodi || 'D3 Manajemen Informatika',
        semester: getStudentSemester(t),
        hasSubmitted: true,
        judul: t.judul,
        skor_kemiripan_terakhir: t.skor_kemiripan_terakhir,
        status_pengajuan: t.status || 'tinjauan', // 'tinjauan' | 'perlu_revisi' | 'disetujui' | 'judul_fix'
        pembimbing_1_nama: t.pembimbing_1_nama || t.pembimbing_1 || '',
        pembimbing_2_nama: t.pembimbing_2_nama || t.pembimbing_2 || '',
        pembimbing_1_nip: t.pembimbing_1_nip || '',
        pembimbing_2_nip: t.pembimbing_2_nip || '',
        dospem_confirmed: Boolean(t.dospem_confirmed),
        dospem_confirmed_at: t.dospem_confirmed_at,
        created_at: t.created_at,
        updated_at: t.updated_at,
        email: matchedProfile?.email || (cleanNim ? `${cleanNim}@student.unsri.ac.id` : 'student@unsri.ac.id'),
        no_hp: matchedProfile?.no_hp || '-',
        // Administrative metadata managed by Admin
        berkas_status: adminMeta.berkas_status || (t.status === 'judul_fix' || t.status === 'disetujui' ? 'lengkap' : 'menunggu'),
        nomor_sk: adminMeta.nomor_sk || '',
        catatan_admin: adminMeta.catatan_admin || '',
        checklist: adminMeta.checklist || {
          form_pendaftaran: true,
          krs_berjalan: true,
          transkrip_nilai: t.status === 'judul_fix' || t.status === 'disetujui',
          bebas_pustaka: t.status === 'judul_fix'
        },
        admin_verified_at: adminMeta.updated_at || null
      };
    });

    // 2. Mahasiswa yang belum mengusulkan judul
    const unsubmittedList = registeredStudents
      .filter(s => !matchedNims.has(String(s.nim).trim()))
      .map(s => {
        const cleanNim = String(s.nim).trim();
        const adminMeta = administrativeRecords[cleanNim] || {};

        return {
          id: `unsub-${cleanNim}`,
          mhs_nim: cleanNim,
          mhs_nama: s.nama,
          mhs_kelas: s.kelas || 'MI 5A',
          prodi: s.prodi || 'D3 Manajemen Informatika',
          semester: getStudentSemester(s),
          hasSubmitted: false,
          judul: null,
          skor_kemiripan_terakhir: null,
          status_pengajuan: 'belum_mengajukan',
          pembimbing_1_nama: '',
          pembimbing_2_nama: '',
          pembimbing_1_nip: '',
          pembimbing_2_nip: '',
          dospem_confirmed: false,
          dospem_confirmed_at: null,
          created_at: null,
          updated_at: null,
          email: s.email || `${cleanNim}@student.unsri.ac.id`,
          no_hp: s.no_hp || '-',
          berkas_status: adminMeta.berkas_status || 'menunggu',
          nomor_sk: adminMeta.nomor_sk || '',
          catatan_admin: adminMeta.catatan_admin || '',
          checklist: adminMeta.checklist || {
            form_pendaftaran: false,
            krs_berjalan: true,
            transkrip_nilai: false,
            bebas_pustaka: false
          },
          admin_verified_at: adminMeta.updated_at || null
        };
      });

    return [...submittedList, ...unsubmittedList];
  }, [thesisTitles, getAllMahasiswaAccounts, getAllRegisteredStudents, administrativeRecords]);

  // Unique Classes list for filter
  const availableClasses = useMemo(() => {
    const classes = new Set(allStudents.map(s => s.mhs_kelas).filter(Boolean));
    return ['ALL', ...Array.from(classes).sort()];
  }, [allStudents]);

  // Filtered List
  const filteredStudents = useMemo(() => {
    return allStudents.filter(item => {
      // 1. Tab Submission Filter
      if (submissionTab === 'sudah' && !item.hasSubmitted) return false;
      if (submissionTab === 'belum' && item.hasSubmitted) return false;

      // 2. Search Query (Judul, Nama Mhs, NIM, Nama Dospem)
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchTitle = item.judul && item.judul.toLowerCase().includes(q);
        const matchName = item.mhs_nama && item.mhs_nama.toLowerCase().includes(q);
        const matchNim = item.mhs_nim && String(item.mhs_nim).toLowerCase().includes(q);
        const matchP1 = item.pembimbing_1_nama && item.pembimbing_1_nama.toLowerCase().includes(q);
        const matchP2 = item.pembimbing_2_nama && item.pembimbing_2_nama.toLowerCase().includes(q);
        if (!matchTitle && !matchName && !matchNim && !matchP1 && !matchP2) return false;
      }

      // 3. Academic Status Filter
      if (academicStatusFilter !== 'ALL') {
        if (academicStatusFilter === 'disetujui') {
          if (item.status_pengajuan !== 'disetujui' && item.status_pengajuan !== 'judul_fix') return false;
        } else if (item.status_pengajuan !== academicStatusFilter) {
          return false;
        }
      }

      // 4. Admin Berkas Status Filter
      if (adminStatusFilter !== 'ALL' && item.berkas_status !== adminStatusFilter) {
        return false;
      }

      // 5. Semester Filter
      if (semesterFilter !== 'Semua Semester' && item.semester !== semesterFilter) {
        return false;
      }

      // 6. Class Filter
      if (classFilter !== 'ALL' && item.mhs_kelas !== classFilter) {
        return false;
      }

      return true;
    });
  }, [allStudents, submissionTab, searchQuery, academicStatusFilter, adminStatusFilter, semesterFilter, classFilter]);

  // Statistics Summary
  const totalMahasiswaTA = allStudents.length;
  const totalSubmitted = allStudents.filter(s => s.hasSubmitted).length;
  const totalUnsubmitted = allStudents.filter(s => !s.hasSubmitted).length;
  const totalDisetujui = allStudents.filter(s => s.status_pengajuan === 'disetujui' || s.status_pengajuan === 'judul_fix').length;
  const totalTinjauan = allStudents.filter(s => s.status_pengajuan === 'tinjauan').length;
  const totalBerkasLengkap = allStudents.filter(s => s.berkas_status === 'lengkap').length;

  // Open Manage Admin Modal
  const handleOpenManageAdmin = (item) => {
    setManagingAdminItem(item);
    setAdminForm({
      berkas_status: item.berkas_status || 'menunggu',
      nomor_sk: item.nomor_sk || '',
      catatan_admin: item.catatan_admin || '',
      checklist: item.checklist || {
        form_pendaftaran: true,
        krs_berjalan: true,
        transkrip_nilai: false,
        bebas_pustaka: false
      }
    });
  };

  // Save Manage Admin
  const handleSaveManageAdmin = (e) => {
    e.preventDefault();
    if (!managingAdminItem) return;

    saveAdministrativeRecord(managingAdminItem.mhs_nim, adminForm);
    showToast(`Data berkas administratif untuk ${managingAdminItem.mhs_nama} berhasil disimpan.`);
    setManagingAdminItem(null);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'NIM',
      'Nama Mahasiswa',
      'Program Studi',
      'Kelas',
      'Semester',
      'Status Usulan Judul',
      'Judul Tugas Akhir',
      'Pembimbing 1',
      'Pembimbing 2',
      'Status Akademik Kaprodi',
      'Status Berkas Administrasi',
      'Nomor SK Pembimbing',
      'Catatan Administrasi'
    ];

    const rows = filteredStudents.map(item => [
      `"${item.mhs_nim || ''}"`,
      `"${(item.mhs_nama || '').replace(/"/g, '""')}"`,
      `"${item.prodi || 'D3 Manajemen Informatika'}"`,
      `"${item.mhs_kelas || '-'}"`,
      `"${item.semester || '-'}"`,
      `"${item.hasSubmitted ? 'Sudah Mengajukan' : 'Belum Mengajukan'}"`,
      `"${(item.judul || '-').replace(/"/g, '""')}"`,
      `"${(item.pembimbing_1_nama || '-').replace(/"/g, '""')}"`,
      `"${(item.pembimbing_2_nama || '-').replace(/"/g, '""')}"`,
      `"${item.status_pengajuan || '-'}"`,
      `"${item.berkas_status || '-'}"`,
      `"${item.nomor_sk || '-'}"`,
      `"${(item.catatan_admin || '-').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekapitulasi_manajemen_ta_admin_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Rekapitulasi Tugas Akhir berhasil diekspor dalam format CSV.');
  };

  // Helper for Admin Berkas Badge
  const renderBerkasBadge = (status) => {
    switch (status) {
      case 'lengkap':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Berkas Lengkap</span>
          </span>
        );
      case 'perlu_perbaikan':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Perlu Perbaikan</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <FileClock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Menunggu Berkas</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center space-x-3 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 sm:p-7 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold backdrop-blur-sm mb-2 border border-indigo-400/20">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
              <span>Admin SIMTA • Administrasi Tugas Akhir</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Manajemen Tugas Akhir</h1>
            <p className="text-xs sm:text-sm text-indigo-100/90 mt-1 max-w-2xl leading-relaxed">
              Pantau rekapitulasi pengajuan judul, status pembimbingan, serta kelola verifikasi berkas administratif persyaratan Tugas Akhir mahasiswa Fasilkom UNSRI.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-300" />
              <span>Ekspor Rekapitulasi (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Boundary Reminder Notice */}
      <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-4 flex items-start space-x-3 text-xs text-blue-900 shadow-2xs">
        <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-blue-950 block">Informasi Batasan Kewenangan Administratif:</span>
          <p className="text-blue-800 leading-relaxed">
            Halaman ini memfasilitasi monitoring berkas administratif dan pencatatan nomor SK pembimbing oleh staf Admin. Keputusan akademik seperti persetujuan usulan topik, revisi judul, serta penetapan dosen pembimbing merupakan kewenangan penuh Ketua Program Studi (Kaprodi) dan Dosen Pembimbing.
          </p>
        </div>
      </div>

      {/* Stat Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Total Mahasiswa */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1 hover:border-indigo-300 transition-all">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Mahasiswa TA</div>
          <div className="text-xl font-extrabold text-slate-900 flex items-center justify-between">
            <span>{totalMahasiswaTA}</span>
            <Users className="w-5 h-5 text-indigo-500/40" />
          </div>
          <p className="text-[10px] text-slate-500">Tingkat akhir terdaftar</p>
        </div>

        {/* Judul Disetujui */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1 hover:border-emerald-300 transition-all">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Judul Disetujui / Fix</div>
          <div className="text-xl font-extrabold text-emerald-600 flex items-center justify-between">
            <span>{totalDisetujui}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500/40" />
          </div>
          <p className="text-[10px] text-emerald-600/80 font-medium">Topik resmi disetujui Kaprodi</p>
        </div>

        {/* Dalam Tinjauan */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1 hover:border-amber-300 transition-all">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dalam Tinjauan</div>
          <div className="text-xl font-extrabold text-amber-600 flex items-center justify-between">
            <span>{totalTinjauan}</span>
            <Clock className="w-5 h-5 text-amber-500/40" />
          </div>
          <p className="text-[10px] text-slate-500">Menunggu review Kaprodi</p>
        </div>

        {/* Belum Mengajukan */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1 hover:border-slate-300 transition-all">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Belum Mengajukan</div>
          <div className="text-xl font-extrabold text-slate-600 flex items-center justify-between">
            <span>{totalUnsubmitted}</span>
            <GraduationCap className="w-5 h-5 text-slate-400/40" />
          </div>
          <p className="text-[10px] text-slate-500">Belum input usulan judul</p>
        </div>

        {/* Berkas Lengkap */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1 hover:border-blue-300 transition-all">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Berkas Lengkap</div>
          <div className="text-xl font-extrabold text-blue-600 flex items-center justify-between">
            <span>{totalBerkasLengkap}</span>
            <FileCheck2 className="w-5 h-5 text-blue-500/40" />
          </div>
          <p className="text-[10px] text-blue-600 font-medium">Syarat administrasi valid</p>
        </div>

      </div>

      {/* Tabs & Filters Container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-4">
        
        {/* Top Tabs */}
        <div className="flex border-b border-slate-100 gap-6 text-xs font-bold pb-2">
          <button
            type="button"
            onClick={() => setSubmissionTab('all')}
            className={`pb-2 border-b-2 transition-all cursor-pointer ${
              submissionTab === 'all'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Semua Mahasiswa ({allStudents.length})
          </button>

          <button
            type="button"
            onClick={() => setSubmissionTab('sudah')}
            className={`pb-2 border-b-2 transition-all cursor-pointer ${
              submissionTab === 'sudah'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sudah Mengajukan Judul ({totalSubmitted})
          </button>

          <button
            type="button"
            onClick={() => setSubmissionTab('belum')}
            className={`pb-2 border-b-2 transition-all cursor-pointer ${
              submissionTab === 'belum'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Belum Mengajukan Judul ({totalUnsubmitted})
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col lg:flex-row gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan Judul TA, Nama Mahasiswa, NIM, atau Dosen Pembimbing..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Status Akademik Filter */}
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Status TA:</span>
              <select
                value={academicStatusFilter}
                onChange={(e) => setAcademicStatusFilter(e.target.value)}
                className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Semua Status Akademik</option>
                <option value="disetujui">Disetujui / Judul Fix</option>
                <option value="tinjauan">Dalam Tinjauan</option>
                <option value="perlu_revisi">Perlu Revisi</option>
                <option value="belum_mengajukan">Belum Mengajukan</option>
              </select>
            </div>

            {/* Status Berkas Filter */}
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Berkas:</span>
              <select
                value={adminStatusFilter}
                onChange={(e) => setAdminStatusFilter(e.target.value)}
                className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Semua Status Berkas</option>
                <option value="lengkap">Berkas Lengkap</option>
                <option value="menunggu">Menunggu Berkas</option>
                <option value="perlu_perbaikan">Perlu Perbaikan</option>
              </select>
            </div>

            {/* Semester Filter */}
            <div className="flex items-center space-x-1.5">
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {AVAILABLE_SEMESTERS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Class Filter */}
            <div className="flex items-center space-x-1.5">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Semua Kelas</option>
                {availableClasses.filter(c => c !== 'ALL').map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            {/* Reset Filter Button */}
            {(searchQuery || submissionTab !== 'all' || academicStatusFilter !== 'ALL' || adminStatusFilter !== 'ALL' || semesterFilter !== 'Semua Semester' || classFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSubmissionTab('all');
                  setAcademicStatusFilter('ALL');
                  setAdminStatusFilter('ALL');
                  setSemesterFilter('Semua Semester');
                  setClassFilter('ALL');
                }}
                className="px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                Reset Filter
              </button>
            )}

          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Mahasiswa</th>
                <th className="py-3.5 px-4 max-w-sm">Judul Tugas Akhir</th>
                <th className="py-3.5 px-4">Dosen Pembimbing</th>
                <th className="py-3.5 px-4">Status Akademik</th>
                <th className="py-3.5 px-4">Berkas Administrasi</th>
                <th className="py-3.5 px-4 text-center">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-sm text-slate-600">Tidak ada data Tugas Akhir yang sesuai kriteria</p>
                    <p className="text-xs text-slate-400 mt-0.5">Coba sesuaikan kata kunci pencarian atau reset filter di atas.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Mahasiswa Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                          {item.mhs_nama ? item.mhs_nama.charAt(0).toUpperCase() : 'M'}
                        </div>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setViewingItem(item)}
                            className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-left truncate block cursor-pointer"
                          >
                            {item.mhs_nama}
                          </button>
                          <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-mono mt-0.5">
                            <span>{item.mhs_nim}</span>
                            <span>•</span>
                            <span className="font-sans font-bold text-slate-600">{item.mhs_kelas}</span>
                            <span>•</span>
                            <span className="font-sans text-indigo-600 font-semibold">{item.semester}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Judul Tugas Akhir */}
                    <td className="py-3.5 px-4 max-w-sm">
                      {item.hasSubmitted ? (
                        <div className="space-y-1">
                          <p className="font-bold text-slate-800 line-clamp-2 leading-relaxed">
                            {item.judul}
                          </p>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                            {item.skor_kemiripan_terakhir != null && (
                              <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                                item.skor_kemiripan_terakhir > 30 
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                Similarity: {item.skor_kemiripan_terakhir}%
                              </span>
                            )}
                            {item.created_at && (
                              <span>Diajukan: {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="inline-flex items-center space-x-1.5 text-slate-400 italic text-[11px]">
                          <span>Belum mengajukan usulan judul</span>
                        </div>
                      )}
                    </td>

                    {/* Dosen Pembimbing */}
                    <td className="py-3.5 px-4">
                      {item.hasSubmitted && (item.pembimbing_1_nama || item.pembimbing_2_nama) ? (
                        <div className="space-y-1 text-[11px]">
                          {item.pembimbing_1_nama && (
                            <div className="flex items-start space-x-1 text-slate-700">
                              <span className="text-[10px] font-bold text-slate-400 mt-0.5">P1:</span>
                              <span className="font-medium line-clamp-1">{item.pembimbing_1_nama}</span>
                            </div>
                          )}
                          {item.pembimbing_2_nama && (
                            <div className="flex items-start space-x-1 text-slate-700">
                              <span className="text-[10px] font-bold text-slate-400 mt-0.5">P2:</span>
                              <span className="font-medium line-clamp-1">{item.pembimbing_2_nama}</span>
                            </div>
                          )}
                          <div className="pt-0.5">
                            <StatusBadge type="confirmation" status={item.dospem_confirmed} />
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">- Belum ada pembimbing -</span>
                      )}
                    </td>

                    {/* Status Akademik (Kaprodi) */}
                    <td className="py-3.5 px-4">
                      <StatusBadge type="thesis" status={item.status_pengajuan} />
                    </td>

                    {/* Status Berkas Administrasi (Admin) */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => handleOpenManageAdmin(item)}
                          className="cursor-pointer hover:opacity-80 transition-opacity text-left block"
                          title="Klik untuk kelola status berkas & catatan admin"
                        >
                          {renderBerkasBadge(item.berkas_status)}
                        </button>
                        {item.nomor_sk && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            SK: {item.nomor_sk}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        
                        {/* Detail Modal */}
                        <button
                          type="button"
                          onClick={() => setViewingItem(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Lihat Detail Tugas Akhir"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Kelola Berkas Administrasi */}
                        <button
                          type="button"
                          onClick={() => handleOpenManageAdmin(item)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                          title="Kelola Berkas & Administrasi"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Administrasi</span>
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            Menampilkan <span className="font-bold text-slate-800">{filteredStudents.length}</span> dari <span className="font-bold text-slate-800">{allStudents.length}</span> mahasiswa Tugas Akhir
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <span>Terintegrasi Status Usulan Kaprodi &amp; Arsip Berkas Admin</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: DETAIL LENGKAP TUGAS AKHIR */}
      {/* ============================================================== */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 relative space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md shadow-indigo-600/30">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Arsip Detail Tugas Akhir</span>
                    <span className="text-slate-300">•</span>
                    <StatusBadge type="thesis" status={viewingItem.status_pengajuan} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">{viewingItem.mhs_nama}</h3>
                  <div className="text-xs font-mono text-slate-500">{viewingItem.mhs_nim} • {viewingItem.mhs_kelas} • {viewingItem.semester}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Detail Content Sections */}
            <div className="space-y-4 text-xs">
              
              {/* Judul Tugas Akhir */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Usulan Judul Tugas Akhir</div>
                {viewingItem.hasSubmitted ? (
                  <div className="space-y-2">
                    <p className="font-bold text-sm text-slate-900 leading-relaxed">
                      "{viewingItem.judul}"
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-slate-500 pt-1 border-t border-slate-200/60">
                      {viewingItem.skor_kemiripan_terakhir != null && (
                        <span>Tingkat Kemiripan: <strong className="text-slate-800">{viewingItem.skor_kemiripan_terakhir}%</strong></span>
                      )}
                      {viewingItem.created_at && (
                        <span>Tanggal Pengajuan: <strong className="text-slate-800">{new Date(viewingItem.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">Mahasiswa belum mengusulkan judul Tugas Akhir pada sistem SIMTA.</p>
                )}
              </div>

              {/* Tim Pembimbing */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Dosen Pembimbing Akademik</span>
                  <StatusBadge type="confirmation" status={viewingItem.dospem_confirmed} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Pembimbing 1 (Utama)</span>
                    <span className="font-bold text-slate-900 text-xs block mt-0.5">
                      {viewingItem.pembimbing_1_nama || '- Belum Ditetapkan -'}
                    </span>
                    {viewingItem.pembimbing_1_nip && (
                      <span className="text-[10px] font-mono text-slate-500 block">NIP: {viewingItem.pembimbing_1_nip}</span>
                    )}
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Pembimbing 2 (Pendamping)</span>
                    <span className="font-bold text-slate-900 text-xs block mt-0.5">
                      {viewingItem.pembimbing_2_nama || '- Belum Ditetapkan -'}
                    </span>
                    {viewingItem.pembimbing_2_nip && (
                      <span className="text-[10px] font-mono text-slate-500 block">NIP: {viewingItem.pembimbing_2_nip}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Berkas & Administrasi */}
              <div className="bg-indigo-50/60 rounded-2xl p-4 border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700">Verifikasi Berkas Administratif (Admin)</span>
                  {renderBerkasBadge(viewingItem.berkas_status)}
                </div>

                <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-indigo-100">
                  <div className="flex items-center space-x-2">
                    <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                      viewingItem.checklist?.form_pendaftaran ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {viewingItem.checklist?.form_pendaftaran ? '✓' : '✗'}
                    </span>
                    <span className="text-[11px] text-slate-700">Formulir Pendaftaran TA</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                      viewingItem.checklist?.krs_berjalan ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {viewingItem.checklist?.krs_berjalan ? '✓' : '✗'}
                    </span>
                    <span className="text-[11px] text-slate-700">Bukti KRS Semester Aktif</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                      viewingItem.checklist?.transkrip_nilai ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {viewingItem.checklist?.transkrip_nilai ? '✓' : '✗'}
                    </span>
                    <span className="text-[11px] text-slate-700">Transkrip Nilai Akademik</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                      viewingItem.checklist?.bebas_pustaka ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {viewingItem.checklist?.bebas_pustaka ? '✓' : '✗'}
                    </span>
                    <span className="text-[11px] text-slate-700">Surat Bebas Pustaka / Lab</span>
                  </div>
                </div>

                {viewingItem.nomor_sk && (
                  <div className="text-slate-700">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Nomor SK Pembimbing:</span>
                    <span className="font-mono font-bold text-slate-900">{viewingItem.nomor_sk}</span>
                  </div>
                )}

                {viewingItem.catatan_admin ? (
                  <div className="text-slate-700 bg-white p-3 rounded-xl border border-indigo-100">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase mb-1">Catatan Staf Admin:</span>
                    <p className="italic text-slate-800">{viewingItem.catatan_admin}</p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">Belum ada catatan administratif khusus untuk mahasiswa ini.</p>
                )}
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const itm = viewingItem;
                  setViewingItem(null);
                  handleOpenManageAdmin(itm);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all cursor-pointer shadow-sm flex items-center space-x-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Kelola Berkas &amp; Administrasi</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: KELOLA BERKAS ADMINISTRASI & CATATAN ADMIN */}
      {/* ============================================================== */}
      {managingAdminItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Kelola Berkas Administrasi TA</h3>
                  <p className="text-[11px] text-slate-500">{managingAdminItem.mhs_nama} ({managingAdminItem.mhs_nim})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManagingAdminItem(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManageAdmin} className="space-y-4 text-xs">
              
              {/* Status Berkas Selector */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Status Kelengkapan Berkas:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'lengkap', label: 'Lengkap', color: 'text-emerald-700 border-emerald-300 bg-emerald-50' },
                    { id: 'menunggu', label: 'Menunggu', color: 'text-amber-700 border-amber-300 bg-amber-50' },
                    { id: 'perlu_perbaikan', label: 'Perlu Revisi', color: 'text-rose-700 border-rose-300 bg-rose-50' }
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setAdminForm({ ...adminForm, berkas_status: st.id })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        adminForm.berkas_status === st.id
                          ? `${st.color} ring-2 ring-indigo-500/20 shadow-xs font-extrabold`
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checklist Persyaratan Berkas */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                <span className="block text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                  Checklist Dokumen Persyaratan
                </span>
                
                <div className="space-y-2">
                  {[
                    { key: 'form_pendaftaran', label: 'Formulir Pendaftaran Usulan Judul TA' },
                    { key: 'krs_berjalan', label: 'Bukti KRS Semester Berjalan (Mencantumkan TA)' },
                    { key: 'transkrip_nilai', label: 'Transkrip Nilai Akademik Sementara (Min. 100 SKS)' },
                    { key: 'bebas_pustaka', label: 'Surat Keterangan Bebas Pustaka / Lab' }
                  ].map(doc => (
                    <label key={doc.key} className="flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={Boolean(adminForm.checklist?.[doc.key])}
                        onChange={(e) => setAdminForm({
                          ...adminForm,
                          checklist: {
                            ...adminForm.checklist,
                            [doc.key]: e.target.checked
                          }
                        })}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="text-slate-700 font-medium">{doc.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Nomor SK Pembimbing */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nomor SK Pembimbing / Disposisi (Opsional)
                </label>
                <input
                  type="text"
                  value={adminForm.nomor_sk}
                  onChange={(e) => setAdminForm({ ...adminForm, nomor_sk: e.target.value })}
                  placeholder="Contoh: 0142/UN9.1.8/AK.TA/2026"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Catatan Administrasi */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Catatan Administrasi Staf
                </label>
                <textarea
                  rows={3}
                  value={adminForm.catatan_admin}
                  onChange={(e) => setAdminForm({ ...adminForm, catatan_admin: e.target.value })}
                  placeholder="Tuliskan catatan kelengkapan dokumen, kendala administrasi, atau tanggal penyerahan berkas fisik..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setManagingAdminItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/30"
                >
                  Simpan Status Administrasi
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
