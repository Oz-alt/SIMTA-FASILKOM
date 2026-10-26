import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import Papa from 'papaparse';
import { 
  GraduationCap, 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  CheckCircle2, 
  Mail, 
  Phone, 
  BookOpen, 
  Users,
  Building2,
  RefreshCw,
  Check,
  Download,
  FileSpreadsheet,
  Upload,
  AlertCircle,
  UserCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';
import { getStudentSemester, AVAILABLE_SEMESTERS } from '../../lib/academicUtils.js';

export default function MasterMahasiswaPage() {
  const { 
    getAllRegisteredStudents, 
    addStudentUser, 
    updateStudentUser, 
    deleteStudentUser,
    advisors = [],
    studentAdvisors = [],
    assignStudentAdvisors
  } = useAuth();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('Semua Semester');

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);

  // Export & Import States
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const [importError, setImportError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const importFileRef = useRef(null);
  const exportDropdownRef = useRef(null);

  // Form State
  const [studentForm, setStudentForm] = useState({
    nim: '',
    nama: '',
    email: '',
    no_hp: '',
    prodi: 'D3 Manajemen Informatika',
    kelas: 'MI 5A',
    status: 'aktif',
    dospem1_nip: '',
    dospem2_nip: ''
  });

  // Toast Notification
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Close export dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setIsExportDropdownOpen(false);
      }
    };
    if (isExportDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExportDropdownOpen]);

  // Registered Students List
  const registeredStudents = useMemo(() => {
    return getAllRegisteredStudents();
  }, [getAllRegisteredStudents]);

  // Map of advisors by NIP
  const advisorByNip = useMemo(() => {
    const map = new Map();
    (advisors || []).forEach(a => {
      if (a.nip) map.set(String(a.nip).trim(), a);
    });
    return map;
  }, [advisors]);

  // Map of advisors by Name (lowercase)
  const advisorByName = useMemo(() => {
    const map = new Map();
    (advisors || []).forEach(a => {
      if (a.nama) map.set(String(a.nama).trim().toLowerCase(), a);
    });
    return map;
  }, [advisors]);

  // Map of student advisors assignment by NIM
  const studentAdvisorMap = useMemo(() => {
    const map = new Map();
    (studentAdvisors || []).forEach(sa => {
      if (sa.student_nim) map.set(String(sa.student_nim).trim(), sa);
    });
    return map;
  }, [studentAdvisors]);

  // Helper to resolve Dospem 1 & 2 for any student
  const getStudentAdvisors = (std) => {
    const cleanNim = String(std.nim || '').trim();
    const sa = studentAdvisorMap.get(cleanNim);

    // Dospem 1
    const d1Nip = String(sa?.dospem1_nip || std.pembimbing_1_nip || '').trim();
    const adv1 = d1Nip ? advisorByNip.get(d1Nip) : (sa?.dospem1_nama ? advisorByName.get(String(sa.dospem1_nama).trim().toLowerCase()) : null);
    const d1Nama = adv1?.nama || sa?.dospem1_nama || std.pembimbing_1_nama || std.pembimbing_1 || (d1Nip ? `NIP. ${d1Nip}` : '');

    // Dospem 2
    const d2Nip = String(sa?.dospem2_nip || std.pembimbing_2_nip || '').trim();
    const adv2 = d2Nip ? advisorByNip.get(d2Nip) : (sa?.dospem2_nama ? advisorByName.get(String(sa.dospem2_nama).trim().toLowerCase()) : null);
    const d2Nama = adv2?.nama || sa?.dospem2_nama || std.pembimbing_2_nama || std.pembimbing_2 || (d2Nip ? `NIP. ${d2Nip}` : '');

    return {
      dospem1: {
        nip: d1Nip || adv1?.nip || '',
        nama: d1Nama,
        advisor: adv1
      },
      dospem2: {
        nip: d2Nip || adv2?.nip || '',
        nama: d2Nama,
        advisor: adv2
      }
    };
  };

  // Unique Classes list for filter
  const availableClasses = useMemo(() => {
    const classes = new Set(registeredStudents.map(s => s.kelas).filter(Boolean));
    return ['ALL', ...Array.from(classes).sort()];
  }, [registeredStudents]);

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    return registeredStudents.filter(std => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        std.nim?.toLowerCase().includes(q) ||
        std.nama?.toLowerCase().includes(q) ||
        std.email?.toLowerCase().includes(q) ||
        std.no_hp?.toLowerCase().includes(q);

      const matchClass = classFilter === 'ALL' || std.kelas === classFilter;
      const matchSemester = semesterFilter === 'Semua Semester' || getStudentSemester(std) === semesterFilter;
      return matchQuery && matchClass && matchSemester;
    });
  }, [registeredStudents, searchQuery, classFilter, semesterFilter]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, classFilter, semesterFilter]);

  // Paginated Students
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredStudents.length);
  const paginatedStudents = useMemo(() => {
    return filteredStudents.slice(startIndex, startIndex + pageSize);
  }, [filteredStudents, startIndex, pageSize]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    if (window.lenis && typeof window.lenis.resize === 'function') {
      window.lenis.resize();
    }
  };

  // Export All / Filtered Students to Excel CSV
  const handleExportDataExcel = () => {
    const headers = [
      'No',
      'NIM',
      'Nama Mahasiswa',
      'Email',
      'No HP',
      'Program Studi',
      'Kelas',
      'Semester',
      'Pembimbing 1 (Nama)',
      'Pembimbing 1 (NIP)',
      'Pembimbing 2 (Nama)',
      'Pembimbing 2 (NIP)',
      'Status Mahasiswa'
    ];

    const escape = (str) => `"${String(str || '').replace(/"/g, '""').trim()}"`;

    const rows = filteredStudents.map((std, idx) => {
      const advs = getStudentAdvisors(std);
      return [
        idx + 1,
        `'${std.nim}`,
        escape(std.nama),
        escape(std.email || '-'),
        std.no_hp ? `'${std.no_hp}` : '-',
        escape(std.prodi || 'D3 Manajemen Informatika'),
        escape(std.kelas || 'MI 5A'),
        escape(getStudentSemester(std)),
        escape(advs.dospem1.nama || '-'),
        advs.dospem1.nip ? `'${advs.dospem1.nip}` : '-',
        escape(advs.dospem2.nama || '-'),
        advs.dospem2.nip ? `'${advs.dospem2.nip}` : '-',
        escape(std.status || 'aktif')
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `data_mahasiswa_simta_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExportDropdownOpen(false);
    showToast('Data master mahasiswa berhasil diekspor ke format Excel/CSV.');
  };

  // Download Template Excel for adding new students
  const handleDownloadTemplate = () => {
    const headers = [
      'NIM',
      'Nama',
      'Email',
      'No_HP',
      'Prodi',
      'Kelas',
      'NIP_Pembimbing_1',
      'NIP_Pembimbing_2',
      'Status'
    ].join(',');

    // Example rows using real advisor NIPs so users have a clear working template
    const sampleRows = [
      '09010582428099,"RAFFI AHMAD PRATAMA",09010582428099@student.unsri.ac.id,0812781001,"D3 Manajemen Informatika","MI 5A",198803052019031010,198303182023212034,aktif',
      '09010582428100,"NADIA ZAHRA",09010582428100@student.unsri.ac.id,0812781002,"D3 Manajemen Informatika","MI 5B",198410012009121005,198710092024211001,aktif',
      '09010582428101,"DIMAS SETIAWAN",09010582428101@student.unsri.ac.id,0812781003,"D3 Manajemen Informatika","MI 5A",,,aktif'
    ].join('\n');

    const csvContent = '\uFEFF' + `${headers}\n${sampleRows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template_tambah_mahasiswa_baru.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExportDropdownOpen(false);
    showToast('Template Excel untuk tambah mahasiswa baru berhasil diunduh.');
  };

  // Handle Import file upload
  const handleImportFile = (file) => {
    setImportError('');
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          setImportError('File kosong atau tidak ada data yang bisa dibaca.');
          return;
        }

        const normalized = results.data.map(row => {
          const r = {};
          Object.keys(row).forEach(k => {
            r[k.toLowerCase().trim().replace(/[\s-]+/g, '_')] = row[k];
          });

          const nim = String(r['nim'] || r['student_nim'] || r['nomor_induk'] || '').trim().replace(/^'/, '');
          const nama = String(r['nama'] || r['nama_mahasiswa'] || r['nama_lengkap'] || '').trim();
          const email = String(r['email'] || (nim ? `${nim}@student.unsri.ac.id` : '')).trim();
          const no_hp = String(r['no_hp'] || r['nohp'] || r['telepon'] || r['whatsapp'] || '').trim().replace(/^'/, '');
          const prodi = String(r['prodi'] || r['program_studi'] || 'D3 Manajemen Informatika').trim();
          const kelas = String(r['kelas'] || 'MI 5A').trim();
          const dospem1_nip = String(r['nip_pembimbing_1'] || r['pembimbing_1_nip'] || r['dospem1_nip'] || r['pembimbing_1'] || '').trim().replace(/^'/, '');
          const dospem2_nip = String(r['nip_pembimbing_2'] || r['pembimbing_2_nip'] || r['dospem2_nip'] || r['pembimbing_2'] || '').trim().replace(/^'/, '');
          const status = String(r['status'] || 'aktif').trim();

          return {
            nim,
            nama,
            email,
            no_hp,
            prodi,
            kelas,
            dospem1_nip,
            dospem2_nip,
            status: status || 'aktif'
          };
        }).filter(r => r.nim && r.nama);

        if (normalized.length === 0) {
          setImportError('Tidak ada baris data valid. Pastikan kolom NIM dan Nama Mahasiswa terisi.');
          return;
        }

        setImportPreview(normalized);
      },
      error: () => setImportError('Gagal membaca file. Pastikan format file .CSV yang valid.')
    });
  };

  // Confirm Import
  const handleConfirmImport = async () => {
    let added = 0;
    for (const row of importPreview) {
      const exists = registeredStudents.find(s => String(s.nim).trim() === String(row.nim).trim());
      if (!exists) {
        await addStudentUser({
          nim: row.nim,
          nama: row.nama,
          email: row.email,
          no_hp: row.no_hp,
          prodi: row.prodi,
          kelas: row.kelas,
          status: row.status
        });
        if (assignStudentAdvisors && (row.dospem1_nip || row.dospem2_nip)) {
          await assignStudentAdvisors(row.nim, row.dospem1_nip, row.dospem2_nip, row.nama);
        }
        added++;
      }
    }
    showToast(`Berhasil menambahkan ${added} mahasiswa baru dari file Excel.`);
    setIsImportOpen(false);
    setImportPreview([]);
    setImportError('');
  };

  // Handle Save Student (Add / Edit)
  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!studentForm.nim || !studentForm.nama) {
      showToast('NIM dan Nama Mahasiswa wajib diisi!');
      return;
    }

    if (studentForm.dospem1_nip && studentForm.dospem2_nip && studentForm.dospem1_nip === studentForm.dospem2_nip) {
      showToast('Pembimbing 1 dan Pembimbing 2 tidak boleh dosen yang sama!');
      return;
    }

    if (editingStudent) {
      await updateStudentUser(editingStudent.id || editingStudent.nim, studentForm);
      if (assignStudentAdvisors) {
        await assignStudentAdvisors(studentForm.nim, studentForm.dospem1_nip, studentForm.dospem2_nip, studentForm.nama);
      }
      showToast(`Berhasil memperbarui data mahasiswa ${studentForm.nama}`);
      setEditingStudent(null);
    } else {
      await addStudentUser(studentForm);
      if (assignStudentAdvisors && (studentForm.dospem1_nip || studentForm.dospem2_nip)) {
        await assignStudentAdvisors(studentForm.nim, studentForm.dospem1_nip, studentForm.dospem2_nip, studentForm.nama);
      }
      showToast(`Berhasil menambahkan mahasiswa baru ${studentForm.nama}`);
      setIsAddOpen(false);
    }

    // Reset Form
    setStudentForm({
      nim: '',
      nama: '',
      email: '',
      no_hp: '',
      prodi: 'D3 Manajemen Informatika',
      kelas: 'MI 5A',
      status: 'aktif',
      dospem1_nip: '',
      dospem2_nip: ''
    });
  };

  // Handle Delete Student
  const handleDeleteStudent = async () => {
    if (!deletingStudent) return;
    await deleteStudentUser(deletingStudent.id || deletingStudent.nim);
    showToast(`Mahasiswa ${deletingStudent.nama} telah dihapus.`);
    setDeletingStudent(null);
  };

  // Open Edit Modal
  const openEditModal = (student) => {
    const advs = getStudentAdvisors(student);
    setEditingStudent(student);
    setStudentForm({
      nim: student.nim || '',
      nama: student.nama || '',
      email: student.email || '',
      no_hp: student.no_hp || '',
      prodi: student.prodi || 'D3 Manajemen Informatika',
      kelas: student.kelas || 'MI 5A',
      status: student.status || 'aktif',
      dospem1_nip: advs.dospem1.nip || '',
      dospem2_nip: advs.dospem2.nip || ''
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 select-none pb-12">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
            <GraduationCap className="w-4 h-4" />
            <span>Master Data Mahasiswa</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Kelola Master Data Mahasiswa
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Pusat pendataan akun dan profil seluruh mahasiswa FASILKOM UNSRI. Kelola data angkatan, alokasi dosen pembimbing 1 &amp; 2, serta ekspor format Excel penambahan mahasiswa baru.
          </p>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Total Mahasiswa</p>
            <p className="text-2xl font-black text-slate-900">{registeredStudents.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Mahasiswa Aktif</p>
            <p className="text-2xl font-black text-slate-900">
              {registeredStudents.filter(s => String(s.status || 'aktif').toLowerCase() === 'aktif').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Jumlah Kelas</p>
            <p className="text-2xl font-black text-slate-900">
              {availableClasses.filter(c => c !== 'ALL').length} Kelas
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Action Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Search Bar & Filters */}
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Cari NIM, Nama Mahasiswa, Email, No HP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="flex items-center space-x-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <select
                  value={semesterFilter}
                  onChange={(e) => setSemesterFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {AVAILABLE_SEMESTERS.map(sem => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-1.5">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">Semua Kelas</option>
                  {availableClasses.filter(c => c !== 'ALL').map(cls => (
                    <option key={cls} value={cls}>Kelas {cls}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons Group */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            
            {/* Export Excel Dropdown */}
            <div className="relative" ref={exportDropdownRef}>
              <button
                type="button"
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                className="inline-flex items-center justify-center space-x-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                title="Ekspor Data Mahasiswa atau Download Format Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Excel</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExportDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isExportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-40 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Opsi Ekspor Excel</p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleExportDataExcel}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-start space-x-2.5 transition-colors cursor-pointer group"
                  >
                    <Download className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Export Data Mahasiswa</p>
                      <p className="text-[11px] text-slate-500">Unduh seluruh data terdaftar beserta Dospem 1 &amp; 2 (.csv)</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-emerald-50/60 flex items-start space-x-2.5 transition-colors cursor-pointer group"
                  >
                    <FileText className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-xs font-bold text-indigo-900">Format Tambah Mahasiswa</p>
                      <p className="text-[11px] text-indigo-600/80">Template Excel resmi untuk penambahan mahasiswa baru</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Import Excel Button */}
            <button
              type="button"
              onClick={() => { setImportPreview([]); setImportError(''); setIsImportOpen(true); }}
              className="inline-flex items-center justify-center space-x-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer border border-slate-700"
              title="Import Data Mahasiswa Baru dari file Excel/CSV"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Import Excel</span>
            </button>

            {/* Manual Add Button */}
            <button
              type="button"
              onClick={() => {
                setStudentForm({
                  nim: '',
                  nama: '',
                  email: '',
                  no_hp: '',
                  prodi: 'D3 Manajemen Informatika',
                  kelas: 'MI 5A',
                  status: 'aktif',
                  dospem1_nip: '',
                  dospem2_nip: ''
                });
                setIsAddOpen(true);
              }}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Mahasiswa</span>
            </button>

          </div>

        </div>

        {/* Table View */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 whitespace-nowrap w-[130px]">NIM</th>
                <th className="py-3 px-3 min-w-[130px]">Nama Mahasiswa</th>
                <th className="py-3 px-3 max-w-[150px]">Kontak / Email</th>
                <th className="py-3 px-3 max-w-[140px]">Prodi &amp; Kelas</th>
                <th className="py-3 px-3 min-w-[170px]">Dosen Pembimbing</th>
                <th className="py-3 px-3 w-24 text-center">Status</th>
                <th className="py-3 px-3 text-right w-16">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map((std) => {
                  const advisorsData = getStudentAdvisors(std);
                  return (
                    <tr key={std.id || std.nim} className="hover:bg-slate-50/80 transition-colors">
                      {/* NIM */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap text-xs">
                        {std.nim}
                      </td>

                      {/* Nama Mahasiswa */}
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900 leading-snug line-clamp-2 text-xs" title={std.nama}>
                          {std.nama}
                        </p>
                      </td>

                      {/* Kontak / Email */}
                      <td className="py-3 px-3 space-y-0.5">
                        <div className="flex items-center space-x-1.5 text-slate-600" title={std.email}>
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[130px] text-[11px]">{std.email || '-'}</span>
                        </div>
                        {std.no_hp && (
                          <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{std.no_hp}</span>
                          </div>
                        )}
                      </td>

                      {/* Prodi & Kelas */}
                      <td className="py-3 px-3 space-y-0.5">
                        <div className="flex items-center space-x-1.5 font-semibold text-slate-800" title={std.prodi || 'D3 Manajemen Informatika'}>
                          <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate max-w-[120px] text-[11px]">{std.prodi || 'D3 Manajemen Informatika'}</span>
                        </div>
                        <span className="inline-block px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                          {std.kelas || 'MI 5A'}
                        </span>
                      </td>

                      {/* Dosen Pembimbing (1 & 2 dalam satu kolom) */}
                      <td className="py-3 px-3">
                        {(!advisorsData.dospem1.nama && !advisorsData.dospem2.nama) ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium text-slate-400 bg-slate-50 border border-slate-200">
                            Belum Ditetapkan
                          </span>
                        ) : (
                          <div className="space-y-1">
                            {/* Pembimbing 1 */}
                            <div>
                              <div className="flex items-center space-x-1.5 min-w-0">
                                <span className="w-3.5 h-3.5 rounded bg-indigo-50 text-indigo-700 font-black text-[9px] flex items-center justify-center shrink-0 border border-indigo-200">
                                  1
                                </span>
                                <span className="font-bold text-slate-900 text-xs truncate max-w-[160px] xl:max-w-[200px]" title={advisorsData.dospem1.nama || 'Belum Ditentukan'}>
                                  {advisorsData.dospem1.nama || <span className="text-slate-400 font-normal italic text-[11px]">Belum Ditentukan</span>}
                                </span>
                              </div>
                              {advisorsData.dospem1.nip && (
                                <p className="text-[10px] text-slate-400 font-mono pl-5">
                                  NIP. {advisorsData.dospem1.nip}
                                </p>
                              )}
                            </div>

                            {/* Pembimbing 2 */}
                            <div>
                              <div className="flex items-center space-x-1.5 min-w-0">
                                <span className="w-3.5 h-3.5 rounded bg-blue-50 text-blue-700 font-black text-[9px] flex items-center justify-center shrink-0 border border-blue-200">
                                  2
                                </span>
                                <span className="font-bold text-slate-900 text-xs truncate max-w-[160px] xl:max-w-[200px]" title={advisorsData.dospem2.nama || 'Belum Ditentukan'}>
                                  {advisorsData.dospem2.nama || <span className="text-slate-400 font-normal italic text-[11px]">Belum Ditentukan</span>}
                                </span>
                              </div>
                              {advisorsData.dospem2.nip && (
                                <p className="text-[10px] text-slate-400 font-mono pl-5">
                                  NIP. {advisorsData.dospem2.nip}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap text-center">
                        {(() => {
                          const s = String(std.status || 'aktif').toLowerCase().trim();
                          const isAktif = s === 'aktif';
                          const isUndur = s.includes('pengunduran') || s.includes('undur');
                          const isLulus = s === 'lulus';

                          const badgeColor = isAktif
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isUndur
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : isLulus
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200';

                          const dotColor = isAktif
                            ? 'bg-emerald-500'
                            : isUndur
                            ? 'bg-amber-500'
                            : isLulus
                            ? 'bg-blue-500'
                            : 'bg-rose-500';

                          return (
                            <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                              <span className="capitalize">{std.status || 'Aktif'}</span>
                            </span>
                          );
                        })()}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-0.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(std)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                            title="Edit Data Mahasiswa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingStudent(std)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Hapus Data Mahasiswa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <p className="text-sm font-semibold">Tidak ada data mahasiswa ditemukan.</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter kelas.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <span>Tampilkan</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={filteredStudents.length}>Semua ({filteredStudents.length})</option>
            </select>
            <span>dari <strong className="text-slate-900">{filteredStudents.length}</strong> mahasiswa</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 mr-2">
              Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                .map((page, idx, arr) => (
                  <React.Fragment key={page}>
                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                      <span className="px-1 text-slate-400">...</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handlePageChange(page)}
                      className={`min-w-[28px] h-7 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                        currentPage === page
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}
            </div>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Modal Tambah / Edit Mahasiswa */}
      {(isAddOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  {editingStudent ? 'Edit Data Mahasiswa' : 'Tambah Mahasiswa Baru'}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => { setIsAddOpen(false); setEditingStudent(null); }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">NIM Mahasiswa <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    disabled={!!editingStudent}
                    placeholder="Contoh: 09010182428002"
                    value={studentForm.nim}
                    onChange={(e) => setStudentForm({ ...studentForm, nim: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Kelas <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: MI 5A"
                    value={studentForm.kelas}
                    onChange={(e) => setStudentForm({ ...studentForm, kelas: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Lengkap Mahasiswa <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Aulia Azzahra"
                  value={studentForm.nama}
                  onChange={(e) => setStudentForm({ ...studentForm, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Student UNSRI</label>
                  <input
                    type="email"
                    placeholder="nim@student.unsri.ac.id"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">No HP / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={studentForm.no_hp}
                    onChange={(e) => setStudentForm({ ...studentForm, no_hp: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Dosen Pembimbing 1 & 2 */}
              <div className="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center space-x-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-indigo-100 text-indigo-700 font-black text-[9px] flex items-center justify-center">1</span>
                    <span>Pembimbing 1</span>
                  </label>
                  <select
                    value={studentForm.dospem1_nip}
                    onChange={(e) => setStudentForm({ ...studentForm, dospem1_nip: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 font-medium text-xs cursor-pointer"
                  >
                    <option value="">-- Belum Ditentukan --</option>
                    {advisors.map(adv => (
                      <option key={adv.nip || adv.id} value={adv.nip}>
                        {adv.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center space-x-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-blue-100 text-blue-700 font-black text-[9px] flex items-center justify-center">2</span>
                    <span>Pembimbing 2</span>
                  </label>
                  <select
                    value={studentForm.dospem2_nip}
                    onChange={(e) => setStudentForm({ ...studentForm, dospem2_nip: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 font-medium text-xs cursor-pointer"
                  >
                    <option value="">-- Belum Ditentukan --</option>
                    {advisors.map(adv => (
                      <option key={adv.nip || adv.id} value={adv.nip}>
                        {adv.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Program Studi</label>
                  <input
                    type="text"
                    disabled
                    value={studentForm.prodi}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 text-slate-600 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status Keaktifan</label>
                  <select
                    value={studentForm.status}
                    onChange={(e) => setStudentForm({ ...studentForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="non-aktif">Non-Aktif / Lulus</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsAddOpen(false); setEditingStudent(null); }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Data</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import Excel */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Import Mahasiswa Baru dari Excel / CSV</h3>
                  <p className="text-[11px] text-slate-500">Upload file CSV atau Excel dengan kolom: NIM, Nama, Email, No_HP, Prodi, Kelas, NIP_Pembimbing_1, NIP_Pembimbing_2</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsImportOpen(false); setImportPreview([]); setImportError(''); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

              {/* Download Template Banner */}
              <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-xs font-semibold text-indigo-900">Belum memiliki file? Unduh format template Excel untuk tambah mahasiswa baru.</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer shrink-0 ml-2"
                >
                  Download Template
                </button>
              </div>

              {/* Drag & Drop Zone */}
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  isDragOver
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/40 bg-slate-50'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleImportFile(file);
                }}
                onClick={() => importFileRef.current?.click()}
              >
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => { if (e.target.files[0]) handleImportFile(e.target.files[0]); }}
                />
                <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragOver ? 'text-emerald-500' : 'text-slate-400'}`} />
                <p className="text-sm font-bold text-slate-700">
                  {isDragOver ? 'Lepaskan file di sini' : 'Drag & drop file, atau klik untuk pilih'}
                </p>
                <p className="text-xs text-slate-400 mt-1">Mendukung format: .CSV, .XLSX, .XLS</p>
              </div>

              {/* Error Message */}
              {importError && (
                <div className="flex items-start space-x-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-rose-700">{importError}</p>
                </div>
              )}

              {/* Preview Table */}
              {importPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800">Preview Data ({importPreview.length} baris terbaca):</p>
                    <span className="text-[11px] text-slate-500">
                      {importPreview.filter(r => !registeredStudents.some(s => String(s.nim).trim() === String(r.nim).trim())).length} mahasiswa baru akan diimpor
                    </span>
                  </div>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                        <tr className="text-slate-600 font-extrabold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">NIM</th>
                          <th className="py-2.5 px-3">Nama</th>
                          <th className="py-2.5 px-3">Email</th>
                          <th className="py-2.5 px-3">Kelas</th>
                          <th className="py-2.5 px-3">Dospem 1</th>
                          <th className="py-2.5 px-3">Dospem 2</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importPreview.map((row, idx) => {
                          const isDuplicate = registeredStudents.some(s => String(s.nim).trim() === String(row.nim).trim());
                          const d1 = advisorByNip.get(row.dospem1_nip);
                          const d2 = advisorByNip.get(row.dospem2_nip);
                          return (
                            <tr key={idx} className={isDuplicate ? 'bg-amber-50/50' : 'hover:bg-slate-50'}>
                              <td className="py-2 px-3">
                                {isDuplicate ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                    Sudah Ada
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    Baru
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-slate-900">{row.nim}</td>
                              <td className="py-2 px-3 font-medium text-slate-800">{row.nama}</td>
                              <td className="py-2 px-3 text-slate-600">{row.email || '-'}</td>
                              <td className="py-2 px-3">{row.kelas}</td>
                              <td className="py-2 px-3 text-[11px] text-slate-700">
                                {d1?.nama || (row.dospem1_nip ? `NIP. ${row.dospem1_nip}` : '-')}
                              </td>
                              <td className="py-2 px-3 text-[11px] text-slate-700">
                                {d2?.nama || (row.dospem2_nip ? `NIP. ${row.dospem2_nip}` : '-')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-2 border-t border-slate-100 px-6 py-4 shrink-0 bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => { setIsImportOpen(false); setImportPreview([]); setImportError(''); }}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={importPreview.length === 0}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Konfirmasi Import ({importPreview.filter(r => !registeredStudents.some(s => String(s.nim).trim() === String(r.nim).trim())).length} Mahasiswa)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Mahasiswa */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Hapus Data Mahasiswa?</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              Apakah Anda yakin ingin menghapus mahasiswa <strong className="text-slate-900">{deletingStudent.nama}</strong> ({deletingStudent.nim})?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteStudent}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
