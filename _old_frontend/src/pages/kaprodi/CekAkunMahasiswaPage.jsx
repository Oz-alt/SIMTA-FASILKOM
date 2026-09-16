import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import Papa from 'papaparse';
import { 
  UserCheck, 
  UploadCloud, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Download, 
  Copy, 
  Check, 
  AlertTriangle,
  RefreshCw,
  Users,
  ClipboardList,
  Filter
} from 'lucide-react';

export default function CekAkunMahasiswaPage() {
  const { getAllRegisteredStudents } = useAuth();

  // Tab State: 'file' | 'paste'
  const [inputTab, setInputTab] = useState('file');
  
  // File & Input state
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [rawText, setRawText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Extracted rows from file/paste
  // Structure: Array of { rawNim: string, cleanNim: string, nama: string, source: string }
  const [extractedRows, setExtractedRows] = useState([]);

  // Result filter state: 'all' | 'unregistered' | 'registered'
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get all registered student accounts from AuthContext
  const registeredStudents = useMemo(() => {
    return getAllRegisteredStudents();
  }, [getAllRegisteredStudents]);

  // Create a quick Lookup Map of NIM -> User
  const registeredNimMap = useMemo(() => {
    const map = new Map();
    registeredStudents.forEach(st => {
      if (st.nim) {
        const clean = String(st.nim).replace(/\D/g, '').trim();
        if (clean) {
          map.set(clean, st);
        }
      }
    });
    return map;
  }, [registeredStudents]);

  // Helper to extract NIM and Name from raw lines or CSV object
  const parseRowsFromText = (text) => {
    const lines = text.split('\n');
    const result = [];
    const seenNim = new Set();

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Extract all digit sequences of length 10 to 18 (UNSRI NIM format, e.g., 09031182328001)
      const matches = trimmed.match(/\b\d{10,18}\b/g);
      if (matches) {
        matches.forEach((nimStr) => {
          if (!seenNim.has(nimStr)) {
            seenNim.add(nimStr);
            // Attempt to clean name from surrounding text (remove digits, commas, tabs)
            const remainingName = trimmed.replace(nimStr, '').replace(/[,;\t|\"']/g, ' ').replace(/\s+/g, ' ').trim();
            result.push({
              rawNim: nimStr,
              cleanNim: nimStr,
              nama: remainingName || 'Tanpa Nama (dari Berkas)',
              source: 'File/Text'
            });
          }
        });
      }
    });

    return result;
  };

  // Handle File Upload (CSV, Excel, PDF, TXT)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const ext = file.name.split('.').pop().toLowerCase();
    setFileType(ext);

    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = [];
          const seen = new Set();

          results.data.forEach((row) => {
            // Find NIM column flexibly
            const keys = Object.keys(row);
            const nimKey = keys.find(k => /nim|student_id|npm|id_mahasiswa/i.test(k));
            const namaKey = keys.find(k => /nama|name|mahasiswa/i.test(k));

            let nimVal = nimKey ? row[nimKey] : null;
            let namaVal = namaKey ? row[namaKey] : null;

            // Fallback: check all values in row for 10-18 digit NIM
            if (!nimVal) {
              const allValuesStr = Object.values(row).join(' ');
              const match = allValuesStr.match(/\b\d{10,18}\b/);
              if (match) nimVal = match[0];
            }

            if (nimVal) {
              const cleanNim = String(nimVal).replace(/\D/g, '').trim();
              if (cleanNim && !seen.has(cleanNim)) {
                seen.add(cleanNim);
                rows.push({
                  rawNim: String(nimVal).trim(),
                  cleanNim,
                  nama: namaVal ? String(namaVal).trim() : 'Mahasiswa',
                  source: file.name
                });
              }
            }
          });

          // Fallback if structured header didn't find NIMs
          if (rows.length === 0) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const textRows = parseRowsFromText(event.target.result);
              setExtractedRows(textRows);
              setIsProcessing(false);
            };
            reader.readAsText(file);
          } else {
            setExtractedRows(rows);
            setIsProcessing(false);
          }
        },
        error: () => {
          setIsProcessing(false);
        }
      });
    } else {
      // For TXT, PDF, Excel (.xlsx/.xls) reading as text stream / regex extraction
      const reader = new FileReader();
      reader.onload = (event) => {
        const textContent = event.target.result;
        const textRows = parseRowsFromText(String(textContent));
        setExtractedRows(textRows);
        setIsProcessing(false);
      };
      // Read as text
      reader.readAsText(file);
    }
  };

  // Handle Manual Paste Input
  const handlePasteProcess = () => {
    if (!rawText.trim()) return;
    setIsProcessing(true);
    setTimeout(() => {
      const rows = parseRowsFromText(rawText);
      setExtractedRows(rows);
      setIsProcessing(false);
    }, 200);
  };

  // Reset Data
  const handleReset = () => {
    setExtractedRows([]);
    setFileName('');
    setRawText('');
    setFilterStatus('all');
    setSearchQuery('');
  };

  // Process Matching & Verification
  const verificationResults = useMemo(() => {
    return extractedRows.map(item => {
      const matchedUser = registeredNimMap.get(item.cleanNim);
      const isRegistered = !!matchedUser;

      return {
        ...item,
        isRegistered,
        statusLabel: isRegistered ? 'Terdaftar' : 'Belum Terdaftar',
        matchedUser: matchedUser || null
      };
    });
  }, [extractedRows, registeredNimMap]);

  // Statistics Calculation
  const stats = useMemo(() => {
    const total = verificationResults.length;
    const registered = verificationResults.filter(r => r.isRegistered).length;
    const unregistered = total - registered;
    const regPercentage = total > 0 ? Math.round((registered / total) * 100) : 0;
    const unregPercentage = total > 0 ? Math.round((unregistered / total) * 100) : 0;

    return { total, registered, unregistered, regPercentage, unregPercentage };
  }, [verificationResults]);

  // Filtered & Searched Data
  const filteredData = useMemo(() => {
    return verificationResults.filter(row => {
      // Filter tab
      if (filterStatus === 'unregistered' && row.isRegistered) return false;
      if (filterStatus === 'registered' && !row.isRegistered) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNim = row.cleanNim.toLowerCase().includes(q);
        const matchNama = row.nama.toLowerCase().includes(q);
        const matchSysNama = row.matchedUser?.nama?.toLowerCase().includes(q) || false;
        return matchNim || matchNama || matchSysNama;
      }
      return true;
    });
  }, [verificationResults, filterStatus, searchQuery]);

  // Copy Unregistered NIMs to Clipboard (WhatsApp Format)
  const handleCopyUnregistered = () => {
    const unregisteredList = verificationResults.filter(r => !r.isRegistered);
    if (unregisteredList.length === 0) return;

    let text = `📌 *PEMBERITAHUAN PENDAFTARAN AKUN SIMTA UNSRI*\n`;
    text += `Daftar Mahasiswa yang *BELUM MENDAFTAR AKUN SIMTA* (${unregisteredList.length} orang):\n\n`;
    unregisteredList.forEach((r, idx) => {
      text += `${idx + 1}. NIM: ${r.cleanNim} ${r.nama && r.nama !== 'Tanpa Nama (dari Berkas)' ? `- ${r.nama}` : ''}\n`;
    });
    text += `\nMohon untuk segera melakukan registrasi akun di portal SIMTA UNSRI. Terima kasih.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Export Verification Results to CSV
  const handleExportCSV = () => {
    if (verificationResults.length === 0) return;

    const exportData = verificationResults.map((r, idx) => ({
      No: idx + 1,
      NIM: r.cleanNim,
      Nama_Berkas: r.nama,
      Status_Akun_SIMTA: r.statusLabel,
      Nama_Akun_Terdaftar: r.matchedUser?.nama || '-',
      Email_Terdaftar: r.matchedUser?.email || '-',
      Kelas: r.matchedUser?.kelas || '-'
    }));

    const csvStr = Papa.unparse(exportData);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Hasil_Cek_Akun_SIMTA_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Sample Template
  const handleDownloadSample = () => {
    const sampleData = [
      { NIM: '09031182328001', Nama: 'Ahmad Rizky Pratama', Kelas: 'MI 5A' },
      { NIM: '09031182328002', Nama: 'Siti Sarah Rahmawati', Kelas: 'MI 5B' },
      { NIM: '09010182428002', Nama: 'Aulia Azzahra', Kelas: 'MI 5A' },
      { NIM: '09031182328099', Nama: 'Budi Kurniawan (Contoh Belum Terdaftar)', Kelas: 'MI 5A' }
    ];
    const csvStr = Papa.unparse(sampleData);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Template_Pengecekan_Akun_Mahasiswa.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold backdrop-blur-sm mb-3 border border-indigo-400/20">
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Portal Verifikasi & Audit Kaprodi</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Pengecekan Status Akun Mahasiswa</h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Upload file Excel, CSV, PDF, atau paste daftar NIM mahasiswa untuk mencocokkan NIM secara otomatis dengan database registrasi akun SIMTA.
          </p>
        </div>

        <button
          onClick={handleDownloadSample}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4 text-indigo-300" />
          <span>Download Template Excel/CSV</span>
        </button>
      </div>

      {/* Input Selector Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
        
        {/* Toggle Input Mode */}
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
          <button
            onClick={() => setInputTab('file')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              inputTab === 'file'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Berkas (Excel / CSV / PDF / TXT)</span>
          </button>

          <button
            onClick={() => setInputTab('paste')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              inputTab === 'paste'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Salin / Tempel Teks NIM</span>
          </button>
        </div>

        {/* Tab 1: File Upload */}
        {inputTab === 'file' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-2xl p-8 text-center space-y-3 transition-colors">
              <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
                <FileSpreadsheet className="w-7 h-7" />
              </div>

              <div>
                <label className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all">
                  <span>Pilih Berkas Excel / CSV / PDF</span>
                  <input 
                    type="file" 
                    accept=".csv, .xlsx, .xls, .pdf, .txt" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-2">
                  Mendukung format <code>.xlsx</code>, <code>.xls</code>, <code>.csv</code>, <code>.pdf</code>, atau <code>.txt</code>
                </p>
              </div>

              {fileName && (
                <div className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-900 bg-indigo-100/80 px-4 py-2 rounded-xl">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>File terpilih: <strong>{fileName}</strong> ({extractedRows.length} NIM terdeteksi)</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Manual Paste NIM */}
        {inputTab === 'paste' && (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              Tempelkan (Paste) Daftar NIM atau Teks Terdampak di Sini:
            </label>
            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Contoh:&#10;09031182328001 Ahmad Rizky&#10;09031182328002 Siti Sarah&#10;09010182428002 Aulia Azzahra"
              className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-400">
                Sistem akan otomatis mengekstrak deretan 10-18 digit NIM dari teks yang ditempelkan.
              </span>
              <button
                onClick={handlePasteProcess}
                disabled={!rawText.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center space-x-2"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Proses Ekstraksi NIM</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Verification Summary & Results Table */}
      {extractedRows.length > 0 && (
        <div className="space-y-6">
          
          {/* Stats Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Total Checked */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Total NIM Diekstrak</span>
                <Users className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {stats.total} <span className="text-xs font-normal text-slate-400">NIM</span>
              </div>
              <p className="text-[11px] text-slate-500">Berhasil diproses dari {fileName || 'Input Teks'}</p>
            </div>

            {/* Registered Account Count */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 uppercase tracking-wider">
                <span>Akun Sudah Terdaftar</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-700 flex items-baseline space-x-2">
                <span>{stats.registered}</span>
                <span className="text-sm font-bold text-emerald-600">({stats.regPercentage}%)</span>
              </div>
              <p className="text-[11px] text-emerald-600/90 font-medium">Mahasiswa sudah memiliki akun aktif SIMTA</p>
            </div>

            {/* Unregistered Account Count */}
            <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-rose-700 uppercase tracking-wider">
                <span>Akun Belum Terdaftar</span>
                <XCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div className="text-3xl font-extrabold text-rose-700 flex items-baseline space-x-2">
                <span>{stats.unregistered}</span>
                <span className="text-sm font-bold text-rose-600">({stats.unregPercentage}%)</span>
              </div>
              <p className="text-[11px] text-rose-600/90 font-medium">Perlu dihimbau untuk membuat akun baru</p>
            </div>

          </div>

          {/* Table Toolbar & Filters */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-indigo-600" />
                  <span>Hasil Verifikasi Matrikulasi NIM</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar hasil perbandingan NIM dari berkas terhadap akun terdaftar di sistem.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                {stats.unregistered > 0 && (
                  <button
                    onClick={handleCopyUnregistered}
                    className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                      copied 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Tercopy ke Clipboard!' : 'Salin Belum Terdaftar (WA)'}</span>
                  </button>
                )}

                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-300" />
                  <span>Export Report CSV</span>
                </button>

                <button
                  onClick={handleReset}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  title="Reset Data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs & Search Input */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Filter Pills */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto text-xs font-bold">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterStatus === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({stats.total})
                </button>
                <button
                  onClick={() => setFilterStatus('unregistered')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterStatus === 'unregistered'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-rose-700'
                  }`}
                >
                  Belum Terdaftar ({stats.unregistered})
                </button>
                <button
                  onClick={() => setFilterStatus('registered')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterStatus === 'registered'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  Sudah Terdaftar ({stats.registered})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari NIM atau Nama..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                />
              </div>
            </div>

            {/* Table Display */}
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px]">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">NIM Mahasiswa</th>
                    <th className="py-3 px-4">Nama (Berkas/Input)</th>
                    <th className="py-3 px-4">Status Akun SIMTA</th>
                    <th className="py-3 px-4">Nama Terdaftar di SIMTA</th>
                    <th className="py-3 px-4">Email & Detail Akun</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                        Tidak ada data yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, idx) => (
                      <tr 
                        key={idx} 
                        className={`transition-colors ${
                          row.isRegistered ? 'hover:bg-slate-50/80' : 'bg-rose-50/20 hover:bg-rose-50/40'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.cleanNim}</td>
                        <td className="py-3 px-4 font-medium text-slate-700">{row.nama}</td>
                        
                        {/* Status Badge */}
                        <td className="py-3 px-4">
                          {row.isRegistered ? (
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Terdaftar</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-200">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Belum Terdaftar</span>
                            </span>
                          )}
                        </td>

                        {/* Matched System User Name */}
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {row.matchedUser ? row.matchedUser.nama : <span className="text-slate-400 italic">Belum buat akun</span>}
                        </td>

                        {/* Matched Email & Info */}
                        <td className="py-3 px-4 text-slate-600">
                          {row.matchedUser ? (
                            <div className="space-y-0.5">
                              <div className="font-mono text-[11px] text-slate-700">{row.matchedUser.email}</div>
                              <div className="text-[10px] text-slate-400">{row.matchedUser.kelas || 'MI'}</div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-rose-500 font-medium">Perlu Registrasi</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
