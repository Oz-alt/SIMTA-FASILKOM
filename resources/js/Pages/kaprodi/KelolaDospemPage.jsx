import React, { useState, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  Users,
  UserCheck,
  UserPlus,
  Upload,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit2,
  Trash2,
  X,
  Sparkles,
  Phone,
  Mail,
  GraduationCap,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Check,
  HelpCircle,
  Hash,
  Info,
  ChevronDown,
  ChevronUp,
  Copy,
  CalendarDays
} from 'lucide-react';

export default function KelolaDospemPage() {
  const {
    advisors,
    studentAdvisors,
    addAdvisor,
    updateAdvisor,
    deleteAdvisor,
    bulkImportAdvisors,
    assignStudentAdvisors,
    bulkAssignStudentAdvisors,
    getAllRegisteredStudents,
    thesisTitles
  } = useAuth();

  const [activeTab, setActiveTab] = useState('pendataan'); // 'pendataan' | 'pembagian'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAdvisor, setEditingAdvisor] = useState(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isAssignCsvModalOpen, setIsAssignCsvModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // CSV Import State for Dospem Data
  const [csvText, setCsvText] = useState('');
  const [parsedCsvRows, setParsedCsvRows] = useState([]);
  const [csvFileName, setCsvFileName] = useState('');

  // CSV Import State for Pembagian Dospem
  const [assignCsvFileName, setAssignCsvFileName] = useState('');
  const [assignParsedRows, setAssignParsedRows] = useState([]);

  // Combine student list with their assignment status and thesis title
  const registeredStudents = useMemo(() => {
    const allStds = getAllRegisteredStudents();
    return allStds.map(std => {
      const assignment = studentAdvisors.find(sa => sa.student_nim === std.nim) || {
        dospem1_nip: '',
        dospem2_nip: '',
        status_pembagian: 'belum'
      };

      // Find approved or submitted thesis title
      const titleObj = thesisTitles.find(t => t.mhs_nim === std.nim || t.profile_id === std.id);

      return {
        id: std.id,
        nim: std.nim,
        nama: std.nama,
        prodi: std.prodi || 'D3 Manajemen Informatika',
        kelas: std.kelas || 'MI 5A',
        judul: titleObj?.judul || 'Rancang Bangun Sistem Informasi Manajemen Tugas Akhir & Peminjaman Ruang Sidang',
        dospem1_nip: assignment.dospem1_nip,
        dospem2_nip: assignment.dospem2_nip,
        status_pembagian: assignment.status_pembagian || 'belum'
      };
    });
  }, [getAllRegisteredStudents, studentAdvisors, thesisTitles]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalAdvisors = advisors.length;
    const totalStudents = registeredStudents.length;
    const completedAssignments = registeredStudents.filter(s => s.status_pembagian === 'lengkap').length;
    const unassignedStudents = registeredStudents.filter(s => s.status_pembagian === 'belum').length;

    // Calculate total quota load
    let totalCapacityDospem1 = 0;
    let usedCapacityDospem1 = 0;
    advisors.forEach(a => {
      totalCapacityDospem1 += a.kuota_dospem1 || 8;
      const count = studentAdvisors.filter(sa => sa.dospem1_nip === a.nip).length;
      usedCapacityDospem1 += count;
    });

    return {
      totalAdvisors,
      totalStudents,
      completedAssignments,
      unassignedStudents,
      totalCapacityDospem1,
      usedCapacityDospem1
    };
  }, [advisors, registeredStudents, studentAdvisors]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Open Edit Modal
  const handleEditClick = (advisor) => {
    setEditingAdvisor(advisor);
    setFormData({
      nip: advisor.nip || '',
      nama: advisor.nama || '',
      email: advisor.email || '',
      no_hp: advisor.no_hp || '',
      prodi: advisor.prodi || 'D3 Manajemen Informatika',
      keahlian: Array.isArray(advisor.keahlian) ? advisor.keahlian.join(', ') : (advisor.keahlian || ''),
      kuota_dospem1: advisor.kuota_dospem1 || 8,
      kuota_dospem2: advisor.kuota_dospem2 || 8,
      status: advisor.status || 'aktif'
    });
    setIsAddModalOpen(true);
  };

  // Reset & Open Add Modal
  const handleAddClick = () => {
    setEditingAdvisor(null);
    setFormData({
      nip: '',
      nama: '',
      email: '',
      no_hp: '',
      prodi: 'D3 Manajemen Informatika',
      keahlian: '',
      kuota_dospem1: 8,
      kuota_dospem2: 8,
      status: 'aktif'
    });
    setIsAddModalOpen(true);
  };

  // Handle Form Submit for Add/Edit Advisor
  const handleSaveAdvisor = (e) => {
    e.preventDefault();
    if (!formData.nip.trim() || !formData.nama.trim()) {
      alert('NIP dan Nama Dosen wajib diisi!');
      return;
    }

    if (editingAdvisor) {
      updateAdvisor(editingAdvisor.id, {
        ...formData,
        keahlian: formData.keahlian.split(',').map(s => s.trim()).filter(Boolean)
      });
      showToast(`Data Dosen ${formData.nama} berhasil diperbarui.`);
    } else {
      addAdvisor(formData);
      showToast(`Dosen Pembimbing baru ${formData.nama} berhasil ditambahkan.`);
    }
    setIsAddModalOpen(false);
  };

  // Handle Delete Advisor
  const handleDeleteClick = (advisor) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data Dosen ${advisor.nama}?`)) {
      deleteAdvisor(advisor.id);
      showToast(`Data Dosen ${advisor.nama} telah dihapus.`);
    }
  };

  // CSV Template Downloader
  const downloadCsvTemplate = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'NIP,Nama,Email,NoHP,Prodi,Keahlian,KuotaDospem1,KuotaDospem2\n' +
      '198001012005011001,Dr. Ahmad Fauzi, S.Kom., M.T.,fauzi@unsri.ac.id,081234567890,D3 Manajemen Informatika,"Sistem Informasi, Machine Learning",8,8\n' +
      '198502022010122002,Nurul Hidayah, M.Kom.,nurul@unsri.ac.id,081398765432,D3 Manajemen Informatika,"UI/UX Design, Web Engineering",8,8';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'template_pendataan_dospem_simta.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle File Select for CSV Upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      setCsvText(text);

      // Simple CSV Parser
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 1) {
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
          if (cols.length >= 2) {
            rows.push({
              nip: cols[0] || `1990${i}12345`,
              nama: cols[1] || 'Dosen Pembimbing',
              email: cols[2] || '',
              no_hp: cols[3] || '',
              prodi: cols[4] || 'D3 Manajemen Informatika',
              keahlian: cols[5] || 'Sistem Informasi',
              kuota_dospem1: Number(cols[6]) || 8,
              kuota_dospem2: Number(cols[7]) || 8
            });
          }
        }
        setParsedCsvRows(rows);
      }
    };
    reader.readAsText(file);
  };

  // Confirm Import CSV
  const handleConfirmCsvImport = () => {
    if (parsedCsvRows.length === 0) {
      alert('Tidak ada baris data CSV yang valid untuk di-import.');
      return;
    }
    const count = bulkImportAdvisors(parsedCsvRows);
    showToast(`Berhasil meng-import ${count} data Dosen Pembimbing baru.`);
    setIsCsvModalOpen(false);
    setParsedCsvRows([]);
    setCsvText('');
    setCsvFileName('');
  };

  // Assign Student Advisors
  const handleStudentAdvisorChange = (student, type, nipValue) => {
    const newDospem1 = type === 'dospem1' ? nipValue : student.dospem1_nip;
    const newDospem2 = type === 'dospem2' ? nipValue : student.dospem2_nip;

    if (newDospem1 && newDospem2 && newDospem1 === newDospem2) {
      alert('Dospem 1 dan Dospem 2 tidak boleh dosen yang sama!');
      return;
    }

    assignStudentAdvisors(student.nim, newDospem1, newDospem2, student.nama, student.judul);
    showToast(`Pembagian Dospem untuk ${student.nama} berhasil diperbarui.`);
  };

  // Helper to extract clean numeric digits (Number) and handle Excel scientific notation
  const extractNumericValue = (val) => {
    if (!val) return '';
    let str = String(val).trim().replace(/^"|"$/g, '');
    // Handle Excel scientific notation if large number was formatted by Excel (e.g. 1.98001E+17)
    if (/^[0-9]+(\.[0-9]+)?[eE]\+[0-9]+$/.test(str)) {
      try {
        str = BigInt(Math.round(Number(str))).toString();
      } catch {}
    }
    return str.replace(/\D/g, '');
  };

  // Download CSV template for pembagian dospem (Kosongan)
  const downloadAssignCsvTemplate = () => {
    const header = 'NIM,Nama Mahasiswa,NIP Dospem 1,NIP Dospem 2\n';
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + header;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'template_pembagian_dospem_kosong.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle File Upload for Pembagian Dospem (Validasi NIM & NIP bertipe Number murni)
  const handleAssignFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAssignCsvFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        const rows = [];
        for (let i = 0; i < lines.length; i++) {
          const rawLine = lines[i];
          // Lewati komentar panduan
          if (rawLine.startsWith('#')) continue;

          const cols = rawLine.split(',').map(c => c.replace(/^"|"$/g, '').trim());
          const rawNim = cols[0] || '';
          const rawNama = cols[1] || '';
          const rawD1 = cols[2] || '';
          const rawD2 = cols[3] || '';

          // Ekstraksi angka (Number) murni untuk NIM dan NIP
          const cleanNim = extractNumericValue(rawNim);
          const cleanD1Nip = extractNumericValue(rawD1);
          const cleanD2Nip = extractNumericValue(rawD2);

          // Jika baris adalah header (mengandung kata 'nim' atau tidak memiliki angka sama sekali), lewati
          if (rawNim.toLowerCase().includes('nim') || !cleanNim) {
            continue;
          }

          // Pencocokan data mahasiswa berdasarkan kesamaan angka NIM
          const matchedStudent = registeredStudents.find(
            s => extractNumericValue(s.nim) === cleanNim || String(s.nim).trim() === rawNim
          );

          // Pencocokan data dosen berdasarkan kesamaan angka NIP
          const adv1 = advisors.find(
            a => extractNumericValue(a.nip) === cleanD1Nip || String(a.nip).trim() === rawD1
          );
          const adv2 = advisors.find(
            a => extractNumericValue(a.nip) === cleanD2Nip || String(a.nip).trim() === rawD2
          );

          const isDuplicate = adv1 && adv2 && adv1.nip === adv2.nip;

          rows.push({
            nim: cleanNim,
            rawNim,
            nama: rawNama || matchedStudent?.nama || 'Mahasiswa',
            judul: matchedStudent?.judul || 'Judul Tugas Akhir',
            dospem1_nip: adv1 ? adv1.nip : cleanD1Nip,
            dospem1_nama: adv1 ? adv1.nama : (cleanD1Nip ? `NIP: ${cleanD1Nip} (Tidak Terdaftar)` : '-'),
            dospem2_nip: adv2 ? adv2.nip : cleanD2Nip,
            dospem2_nama: adv2 ? adv2.nama : (cleanD2Nip ? `NIP: ${cleanD2Nip} (Tidak Terdaftar)` : '-'),
            hasStudentMatch: !!matchedStudent,
            hasD1Match: !cleanD1Nip || !!adv1,
            hasD2Match: !cleanD2Nip || !!adv2,
            isDuplicate
          });
        }
        setAssignParsedRows(rows);
      }
    };
    reader.readAsText(file);
  };

  // Confirm Import Pembagian Dospem
  const handleConfirmAssignCsvImport = () => {
    if (assignParsedRows.length === 0) {
      alert('Tidak ada baris data CSV / Excel yang valid untuk diterapkan.');
      return;
    }

    const payload = assignParsedRows.map(row => ({
      student_nim: row.nim,
      student_nama: row.nama,
      judul_ta: row.judul,
      dospem1_nip: row.dospem1_nip,
      dospem2_nip: row.dospem2_nip
    }));

    bulkAssignStudentAdvisors(payload);
    showToast(`Berhasil menerapkan pembagian Dospem untuk ${payload.length} mahasiswa.`);
    setIsAssignCsvModalOpen(false);
    setAssignParsedRows([]);
    setAssignCsvFileName('');
  };

  // Filtered Advisors for Tab 1
  const filteredAdvisors = useMemo(() => {
    return advisors.filter(a => {
      const matchText = (a.nama + ' ' + a.nip + ' ' + (Array.isArray(a.keahlian) ? a.keahlian.join(' ') : a.keahlian)).toLowerCase();
      return matchText.includes(searchTerm.toLowerCase());
    });
  }, [advisors, searchTerm]);

  // Filtered Students for Tab 2
  const filteredStudents = useMemo(() => {
    return registeredStudents.filter(std => {
      const matchText = (std.nama + ' ' + std.nim + ' ' + std.judul).toLowerCase();
      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'lengkap'
          ? std.status_pembagian === 'lengkap'
          : statusFilter === 'partial'
          ? std.status_pembagian === 'partial'
          : std.status_pembagian === 'belum';

      return matchText.includes(searchTerm.toLowerCase()) && matchStatus;
    });
  }, [registeredStudents, searchTerm, statusFilter]);

  return (
    <div className="space-y-8 pb-16 font-sans">

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs sm:text-sm font-semibold border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 overflow-hidden shadow-xl border border-blue-800/40">
        <div className="absolute right-0 top-0 opacity-15 translate-x-10 -translate-y-10 pointer-events-none">
          <UserCheck className="w-96 h-96 text-white" />
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Portal Kaprodi FASILKOM UNSRI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Pendataan &amp; Pembagian Dosen Pembimbing TA
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal">
            Kelola kuota &amp; kepakaran dosen pembimbing, serta distribusikan Dospem 1 dan Dospem 2 secara berimbang untuk mahasiswa Tugas Akhir.
          </p>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Dospem</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats.totalAdvisors}</div>
          <p className="text-[11px] text-slate-500">Dosen terdaftar di prodi</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Mahasiswa Terbagi</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats.completedAssignments} / {stats.totalStudents}</div>
          <p className="text-[11px] text-emerald-600 font-semibold">Sudah dapat Dospem 1 &amp; 2</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Belum Ada Dospem</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats.unassignedStudents}</div>
          <p className="text-[11px] text-amber-600 font-semibold">Perlu alokasi dospem</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Beban Kuota Dospem 1</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats.usedCapacityDospem1} / {stats.totalCapacityDospem1}</div>
          <p className="text-[11px] text-blue-600 font-semibold">Kapasitas slot terpakai</p>
        </div>
      </div>

      {/* Tab Navigation Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-2 bg-slate-100/80 p-1.5 rounded-2xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('pendataan')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'pendataan'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Pendataan Dosen Pembimbing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pembagian')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'pembagian'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Pembagian Dosen Pembimbing</span>
            {stats.unassignedStudents > 0 && (
              <span className="ml-1.5 px-2 py-0.5 text-[10px] rounded-full bg-amber-500 text-white font-extrabold">
                {stats.unassignedStudents}
              </span>
            )}
          </button>
        </div>

        {/* Action Buttons for Tab 1 & Tab 2 */}
        {activeTab === 'pendataan' ? (
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setIsCsvModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>Upload CSV / Excel</span>
            </button>

            <button
              type="button"
              onClick={handleAddClick}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tambah Dosen</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setIsAssignCsvModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Upload Excel / CSV Pembagian</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: PENDATAAN DOSEN PEMBIMBING */}
      {activeTab === 'pendataan' && (
        <div className="space-y-6">

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama dosen, NIP, atau kepakaran..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm outline-none transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <div className="text-xs text-slate-500 font-medium self-end sm:self-center">
              Menampilkan <span className="font-bold text-slate-900">{filteredAdvisors.length}</span> dari {advisors.length} Dosen Pembimbing
            </div>
          </div>

          {/* Advisor Table (Compact - No Horizontal Scroll) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                  <th className="py-2.5 px-2 text-center w-8">No</th>
                  <th className="py-2.5 px-3">Dosen &amp; NIP</th>
                  <th className="py-2.5 px-3">Bidang Kepakaran</th>
                  <th className="py-2.5 px-2.5">Kontak</th>
                  <th className="py-2.5 px-3 w-40">Beban Bimbingan</th>
                  <th className="py-2.5 px-2 text-center w-16">Status</th>
                  <th className="py-2.5 px-2 text-center w-16">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredAdvisors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada data dosen pembimbing yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredAdvisors.map((advisor, index) => {
                    const assignedD1 = studentAdvisors.filter(sa => sa.dospem1_nip === advisor.nip).length;
                    const assignedD2 = studentAdvisors.filter(sa => sa.dospem2_nip === advisor.nip).length;
                    const maxD1 = advisor.kuota_dospem1 || 8;
                    const maxD2 = advisor.kuota_dospem2 || 8;
                    const percentD1 = Math.min(100, Math.round((assignedD1 / maxD1) * 100));
                    const percentD2 = Math.min(100, Math.round((assignedD2 / maxD2) * 100));

                    return (
                      <tr key={advisor.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-2 text-center text-[11px] text-slate-400 font-semibold align-middle">
                          {index + 1}
                        </td>
                        <td className="py-2.5 px-3 align-middle">
                          <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {advisor.nama.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 leading-snug truncate max-w-[200px]" title={advisor.nama}>
                                {advisor.nama}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                NIP. {advisor.nip}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 align-middle">
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {Array.isArray(advisor.keahlian) ? (
                              advisor.keahlian.map((tag, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200/50">
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                                {advisor.keahlian || 'Umum'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-2.5 align-middle">
                          <div className="space-y-0.5 text-[11px] text-slate-600">
                            <div className="flex items-center space-x-1">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{advisor.no_hp || '-'}</span>
                            </div>
                            <div className="flex items-center space-x-1" title={advisor.email}>
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[130px]">{advisor.email || '-'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 align-middle">
                          <div className="space-y-1.5 w-36">
                            <div>
                              <div className="flex justify-between text-[10px] font-bold mb-0.5">
                                <span className="text-indigo-700">D1: {assignedD1}/{maxD1}</span>
                                <span className="text-slate-400">{percentD1}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    percentD1 >= 100 ? 'bg-rose-500' : percentD1 >= 75 ? 'bg-amber-500' : 'bg-indigo-600'
                                  }`}
                                  style={{ width: `${percentD1}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-[10px] font-bold mb-0.5">
                                <span className="text-purple-700">D2: {assignedD2}/{maxD2}</span>
                                <span className="text-slate-400">{percentD2}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    percentD2 >= 100 ? 'bg-rose-500' : percentD2 >= 75 ? 'bg-amber-500' : 'bg-purple-600'
                                  }`}
                                  style={{ width: `${percentD2}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 align-middle text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            advisor.status === 'aktif' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {advisor.status || 'aktif'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 align-middle text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleEditClick(advisor)}
                              title="Edit Data Dosen"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(advisor)}
                              title="Hapus Dosen"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 2: PEMBAGIAN DOSPEM 1 & DOSPEM 2 */}
      {activeTab === 'pembagian' && (
        <div className="space-y-6">

          {/* Search & Filter Header */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative w-full md:w-80">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama mahasiswa, NIM, atau judul..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm outline-none transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none focus:border-indigo-600 cursor-pointer"
              >
                <option value="all">Semua Status Pembagian</option>
                <option value="belum">Belum Ada Dospem ({registeredStudents.filter(s => s.status_pembagian === 'belum').length})</option>
                <option value="partial">Baru 1 Dospem ({registeredStudents.filter(s => s.status_pembagian === 'partial').length})</option>
                <option value="lengkap">Sudah Lengkap (Dospem 1 &amp; 2) ({registeredStudents.filter(s => s.status_pembagian === 'lengkap').length})</option>
              </select>

              <button
                type="button"
                onClick={() => setIsAssignCsvModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>Upload Excel</span>
              </button>
            </div>
          </div>

          {/* Student Assignment Table (Compact - No Horizontal Scroll) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                  <th className="py-2.5 px-3 w-1/4">Mahasiswa &amp; NIM</th>
                  <th className="py-2.5 px-3 w-1/3">Judul Tugas Akhir</th>
                  <th className="py-2.5 px-2.5 w-1/5">Dosen Pembimbing 1</th>
                  <th className="py-2.5 px-2.5 w-1/5">Dosen Pembimbing 2</th>
                  <th className="py-2.5 px-2 text-center w-24">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Tidak ada data mahasiswa yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((std) => {
                    const isSameAdvisor = std.dospem1_nip && std.dospem2_nip && std.dospem1_nip === std.dospem2_nip;

                    return (
                      <tr key={std.id} className="hover:bg-slate-50/70 transition-colors">
                        
                        {/* Student Info */}
                        <td className="py-2.5 px-3 align-top">
                          <div className="font-bold text-slate-900 leading-snug">{std.nama}</div>
                          <div className="text-[10px] text-slate-500 font-mono">NIM. {std.nim}</div>
                          <div className="text-[10px] text-indigo-600 font-semibold">{std.prodi} ({std.kelas})</div>
                        </td>

                        {/* Thesis Title */}
                        <td className="py-2.5 px-3 align-top">
                          <p className="text-[11px] text-slate-800 font-medium leading-relaxed italic line-clamp-2" title={std.judul}>
                            "{std.judul}"
                          </p>
                        </td>

                        {/* Dospem 1 Select */}
                        <td className="py-2.5 px-2.5 align-top">
                          <div className="space-y-0.5">
                            <select
                              value={std.dospem1_nip || ''}
                              onChange={(e) => handleStudentAdvisorChange(std, 'dospem1', e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-300 focus:border-indigo-600 text-[11px] font-semibold text-slate-800 bg-white transition-all outline-none cursor-pointer"
                            >
                              <option value="">-- Pilih Dospem 1 --</option>
                              {advisors.map(adv => {
                                const count = studentAdvisors.filter(sa => sa.dospem1_nip === adv.nip).length;
                                return (
                                  <option key={adv.id} value={adv.nip}>
                                    {adv.nama} ({count}/{adv.kuota_dospem1 || 8})
                                  </option>
                                );
                              })}
                            </select>
                            {std.dospem1_nip && (
                              <div className="text-[10px] text-indigo-600 font-semibold flex items-center space-x-1">
                                <Check className="w-3 h-3" />
                                <span>Terkonfirmasi D1</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Dospem 2 Select */}
                        <td className="py-2.5 px-2.5 align-top">
                          <div className="space-y-0.5">
                            <select
                              value={std.dospem2_nip || ''}
                              onChange={(e) => handleStudentAdvisorChange(std, 'dospem2', e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-300 focus:border-indigo-600 text-[11px] font-semibold text-slate-800 bg-white transition-all outline-none cursor-pointer"
                            >
                              <option value="">-- Pilih Dospem 2 --</option>
                              {advisors.map(adv => {
                                const count = studentAdvisors.filter(sa => sa.dospem2_nip === adv.nip).length;
                                return (
                                  <option key={adv.id} value={adv.nip}>
                                    {adv.nama} ({count}/{adv.kuota_dospem2 || 8})
                                  </option>
                                );
                              })}
                            </select>
                            {std.dospem2_nip && (
                              <div className="text-[10px] text-purple-600 font-semibold flex items-center space-x-1">
                                <Check className="w-3 h-3" />
                                <span>Terkonfirmasi D2</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-2.5 px-2 align-top text-center">
                          {isSameAdvisor ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 inline-block">
                              Dospem Sama
                            </span>
                          ) : std.status_pembagian === 'lengkap' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Lengkap</span>
                            </span>
                          ) : std.status_pembagian === 'partial' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-800 border border-purple-300 inline-flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-purple-600" />
                              <span>Baru 1</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center space-x-1">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              <span>Belum Ada</span>
                            </span>
                          )}
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* MODAL ADD / EDIT DOSEN */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingAdvisor ? 'Edit Data Dosen Pembimbing' : 'Tambah Dosen Pembimbing Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lengkapi data kredensial, kepakaran, dan kuota bimbingan dosen.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdvisor} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">NIP Dosen *</label>
                  <input
                    type="text"
                    required
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    placeholder="Contoh: 198001012005011001"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nama Lengkap &amp; Gelar *</label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Dr. Ir. Hendra Kusuma, M.T."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Email Resmi UNSRI</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="dosen@unsri.ac.id"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    value={formData.no_hp}
                    onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                    placeholder="081278901234"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Bidang Kepakaran / Keahlian (Pisahkan dengan koma)</label>
                <input
                  type="text"
                  value={formData.keahlian}
                  onChange={(e) => setFormData({ ...formData, keahlian: e.target.value })}
                  placeholder="Sistem Informasi, Web Engineering, Machine Learning"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Kuota Max Dospem 1</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formData.kuota_dospem1}
                    onChange={(e) => setFormData({ ...formData, kuota_dospem1: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Kuota Max Dospem 2</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formData.kuota_dospem2}
                    onChange={(e) => setFormData({ ...formData, kuota_dospem2: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs sm:text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  Simpan Data Dosen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL UPLOAD CSV DOSPEM */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Upload CSV / Excel Pendataan Dospem
                  </h3>
                  <p className="text-xs text-slate-500">
                    Import data dosen pembimbing dalam jumlah banyak secara otomatis.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Template Downloader Button */}
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <HelpCircle className="w-5 h-5 text-blue-600 shrink-0" />
                  <span className="text-xs text-blue-900 font-medium">
                    Unduh format file CSV sampel untuk memastikan kolom data sesuai.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={downloadCsvTemplate}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Template CSV</span>
                </button>
              </div>

              {/* Upload Drop Zone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50/50 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">
                  {csvFileName ? `File Terpilih: ${csvFileName}` : 'Klik atau seret file CSV di sini'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Format file .csv (pisahkan dengan koma)</p>
              </div>

              {/* Parsed Preview Table */}
              {parsedCsvRows.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Pratinjau Data CSV ({parsedCsvRows.length} Baris)</span>
                    <span className="text-emerald-600 text-[11px] font-bold">Siap di-import</span>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 sticky top-0 font-bold">
                        <tr>
                          <th className="p-2">NIP</th>
                          <th className="p-2">Nama Dosen</th>
                          <th className="p-2">Keahlian</th>
                          <th className="p-2 text-center">Kuota D1/D2</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedCsvRows.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-mono">{r.nip}</td>
                            <td className="p-2 font-semibold">{r.nama}</td>
                            <td className="p-2">{r.keahlian}</td>
                            <td className="p-2 text-center font-bold">{r.kuota_dospem1}/{r.kuota_dospem2}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={parsedCsvRows.length === 0}
                onClick={handleConfirmCsvImport}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                Proses Import ({parsedCsvRows.length} Data)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL UPLOAD EXCEL / CSV PEMBAGIAN DOSPEM */}
      {isAssignCsvModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Upload Excel / CSV Pembagian Dospem
                  </h3>
                  <p className="text-xs text-slate-500">
                    Alokasikan Dosen Pembimbing 1 dan 2 untuk banyak mahasiswa sekaligus via file spreadsheet.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignCsvModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Template Downloader */}
              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-indigo-900">
                      Download File Template
                    </div>
                    <div className="text-[11px] text-indigo-700/80">
                      Template kosongan siap diisi (kolom NIM, Nama, NIP Dospem 1, NIP Dospem 2)
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={downloadAssignCsvTemplate}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template</span>
                </button>
              </div>

              {/* Upload Zone */}
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-emerald-500 transition-colors bg-slate-50/50">
                <input
                  type="file"
                  id="assign-csv-upload"
                  accept=".csv, .txt"
                  onChange={handleAssignFileUpload}
                  className="hidden"
                />
                <label htmlFor="assign-csv-upload" className="cursor-pointer block space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-700">
                    {assignCsvFileName ? assignCsvFileName : 'Klik atau drag & drop file CSV / Excel pembagian'}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Pastikan kolom <span className="font-mono font-bold text-slate-700">NIM</span> dan <span className="font-mono font-bold text-slate-700">NIP</span> berformat angka (Number murni)
                  </p>
                </label>
              </div>

              {/* Preview Parsed Rows */}
              {assignParsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Pratinjau Data ({assignParsedRows.length} Mahasiswa)</span>
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Data berhasil diparsing</span>
                    </span>
                  </div>
                  <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 sticky top-0">
                        <tr>
                          <th className="p-2">NIM &amp; Nama (Number)</th>
                          <th className="p-2">Dospem 1 (NIP Number)</th>
                          <th className="p-2">Dospem 2 (NIP Number)</th>
                          <th className="p-2 text-center">Status Validasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {assignParsedRows.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2">
                              <div className="font-bold text-slate-800">{r.nama}</div>
                              <div className="text-[10px] text-indigo-700 font-mono font-bold flex items-center space-x-1">
                                <Hash className="w-3 h-3 text-slate-400" />
                                <span>{r.nim}</span>
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="font-semibold text-slate-800">{r.dospem1_nama}</div>
                              {r.dospem1_nip && (
                                <div className="text-[10px] text-emerald-700 font-mono font-bold flex items-center space-x-1">
                                  <Hash className="w-3 h-3 text-emerald-500" />
                                  <span>{r.dospem1_nip}</span>
                                </div>
                              )}
                            </td>
                            <td className="p-2">
                              <div className="font-semibold text-slate-800">{r.dospem2_nama}</div>
                              {r.dospem2_nip && (
                                <div className="text-[10px] text-purple-700 font-mono font-bold flex items-center space-x-1">
                                  <Hash className="w-3 h-3 text-purple-500" />
                                  <span>{r.dospem2_nip}</span>
                                </div>
                              )}
                            </td>
                            <td className="p-2 text-center">
                              {r.isDuplicate ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                                  Dospem Sama
                                </span>
                              ) : !r.hasD1Match && r.dospem1_nip ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                                  NIP D1 Salah
                                </span>
                              ) : !r.hasD2Match && r.dospem2_nip ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                                  NIP D2 Salah
                                </span>
                              ) : !r.hasStudentMatch ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                                  NIM Baru
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                  Valid (Number)
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAssignCsvModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={assignParsedRows.length === 0}
                onClick={handleConfirmAssignCsvImport}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                Terapkan Pembagian ({assignParsedRows.length} Mahasiswa)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
