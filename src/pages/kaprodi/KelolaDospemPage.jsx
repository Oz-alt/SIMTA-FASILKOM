import React, { useState, useMemo } from 'react';
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
  HelpCircle
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
  const [toastMessage, setToastMessage] = useState('');

  // Form State for Add / Edit Advisor
  const [formData, setFormData] = useState({
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

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [parsedCsvRows, setParsedCsvRows] = useState([]);
  const [csvFileName, setCsvFileName] = useState('');

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

        {/* Action Buttons for Tab 1 */}
        {activeTab === 'pendataan' && (
          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setIsCsvModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Upload CSV / Excel</span>
            </button>

            <button
              type="button"
              onClick={handleAddClick}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Dosen</span>
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

          {/* Advisor Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredAdvisors.map((advisor) => {
              // Count assigned students
              const assignedD1 = studentAdvisors.filter(sa => sa.dospem1_nip === advisor.nip).length;
              const assignedD2 = studentAdvisors.filter(sa => sa.dospem2_nip === advisor.nip).length;
              const maxD1 = advisor.kuota_dospem1 || 8;
              const maxD2 = advisor.kuota_dospem2 || 8;

              const percentD1 = Math.min(100, Math.round((assignedD1 / maxD1) * 100));
              const percentD2 = Math.min(100, Math.round((assignedD2 / maxD2) * 100));

              return (
                <div
                  key={advisor.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Header: Name & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base shrink-0 group-hover:scale-105 transition-transform">
                          {advisor.nama.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                            {advisor.nama}
                          </h3>
                          <span className="text-[11px] text-slate-500 font-mono block">
                            NIP. {advisor.nip}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        advisor.status === 'aktif' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {advisor.status}
                      </span>
                    </div>

                    {/* Expertise Badges */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bidang Kepakaran</span>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(advisor.keahlian) ? (
                          advisor.keahlian.map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200/60">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                            {advisor.keahlian || 'Umum'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{advisor.no_hp || '-'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{advisor.email || '-'}</span>
                      </div>
                    </div>

                    {/* Quota Progress Bars */}
                    <div className="space-y-2.5 pt-3 border-t border-slate-100">
                      <div>
                        <div className="flex justify-between text-[11px] font-bold mb-1">
                          <span className="text-indigo-700">Dospem 1: {assignedD1} / {maxD1} Mhs</span>
                          <span className="text-slate-500">{percentD1}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percentD1 >= 100 ? 'bg-rose-500' : percentD1 >= 75 ? 'bg-amber-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${percentD1}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] font-bold mb-1">
                          <span className="text-purple-700">Dospem 2: {assignedD2} / {maxD2} Mhs</span>
                          <span className="text-slate-500">{percentD2}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percentD2 >= 100 ? 'bg-rose-500' : percentD2 >= 75 ? 'bg-amber-500' : 'bg-purple-600'
                            }`}
                            style={{ width: `${percentD2}%` }}
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleEditClick(advisor)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-semibold transition-all flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(advisor)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-semibold transition-all flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              );
            })}
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
            </div>
          </div>

          {/* Student Assignment Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                    <th className="py-3.5 px-4">Mahasiswa &amp; NIM</th>
                    <th className="py-3.5 px-4 min-w-[240px]">Judul Tugas Akhir</th>
                    <th className="py-3.5 px-4 min-w-[200px]">Dosen Pembimbing 1</th>
                    <th className="py-3.5 px-4 min-w-[200px]">Dosen Pembimbing 2</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-medium text-slate-700">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        Tidak ada data mahasiswa yang cocok dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((std) => {
                      const isSameAdvisor = std.dospem1_nip && std.dospem2_nip && std.dospem1_nip === std.dospem2_nip;

                      return (
                        <tr key={std.id} className="hover:bg-slate-50/70 transition-colors">
                          
                          {/* Student Info */}
                          <td className="py-4 px-4 align-top">
                            <div className="font-extrabold text-slate-900">{std.nama}</div>
                            <div className="text-xs text-slate-500 font-mono">NIM. {std.nim}</div>
                            <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">{std.prodi} ({std.kelas})</div>
                          </td>

                          {/* Thesis Title */}
                          <td className="py-4 px-4 align-top">
                            <p className="text-xs text-slate-800 font-medium leading-relaxed italic">
                              "{std.judul}"
                            </p>
                          </td>

                          {/* Dospem 1 Select */}
                          <td className="py-4 px-4 align-top">
                            <div className="space-y-1">
                              <select
                                value={std.dospem1_nip || ''}
                                onChange={(e) => handleStudentAdvisorChange(std, 'dospem1', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs font-semibold text-slate-800 bg-white transition-all outline-none cursor-pointer"
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
                                <div className="text-[11px] text-indigo-600 font-semibold flex items-center space-x-1">
                                  <Check className="w-3 h-3" />
                                  <span>Terkonfirmasi Dospem 1</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Dospem 2 Select */}
                          <td className="py-4 px-4 align-top">
                            <div className="space-y-1">
                              <select
                                value={std.dospem2_nip || ''}
                                onChange={(e) => handleStudentAdvisorChange(std, 'dospem2', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs font-semibold text-slate-800 bg-white transition-all outline-none cursor-pointer"
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
                                <div className="text-[11px] text-purple-600 font-semibold flex items-center space-x-1">
                                  <Check className="w-3 h-3" />
                                  <span>Terkonfirmasi Dospem 2</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-4 px-4 align-top text-center">
                            {isSameAdvisor ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 inline-block">
                                Error: Dospem Sama
                              </span>
                            ) : std.status_pembagian === 'lengkap' ? (
                              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center space-x-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Lengkap</span>
                              </span>
                            ) : std.status_pembagian === 'partial' ? (
                              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-300 inline-flex items-center space-x-1">
                                <Clock className="w-3.5 h-3.5 text-purple-600" />
                                <span>Baru 1 Dospem</span>
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center space-x-1">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
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

    </div>
  );
}
