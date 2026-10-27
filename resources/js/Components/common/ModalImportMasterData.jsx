import React, { useState, useMemo, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  X, 
  Download, 
  RefreshCw, 
  Check, 
  Info, 
  FileUp, 
  Layers, 
  Sparkles,
  Users,
  GraduationCap
} from 'lucide-react';

/**
 * ModalImportMasterData
 * Reusable modal for importing Mahasiswa and Dosen master data via Excel (.xlsx, .xls) and CSV
 */
export default function ModalImportMasterData({
  isOpen,
  onClose,
  entityType = 'mahasiswa', // 'mahasiswa' | 'dosen'
  existingData = [],
  onImport,
  onSuccess
}) {
  const isMahasiswa = entityType === 'mahasiswa';
  const fileInputRef = useRef(null);

  // Steps: 'upload' -> 'preview' -> 'result'
  const [step, setStep] = useState('upload');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [parseError, setParseError] = useState('');

  // Parsed and validated rows
  const [parsedRows, setParsedRows] = useState([]);
  const [previewFilter, setPreviewFilter] = useState('ALL'); // 'ALL' | 'valid' | 'duplicate' | 'invalid'

  // Options
  const [duplicateMode, setDuplicateMode] = useState('skip'); // 'skip' | 'update'

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Reset state when opening/closing
  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setFileName('');
    setFileSize('');
    setParseError('');
    setParsedRows([]);
    setPreviewFilter('ALL');
    setDuplicateMode('skip');
    setIsProcessing(false);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  // Helper to normalize column header names
  const normalizeKey = (key) => {
    return String(key || '')
      .toLowerCase()
      .trim()
      .replace(/[\s\-_.]/g, '');
  };

  // Template definitions
  const getTemplateConfig = () => {
    if (isMahasiswa) {
      return {
        headers: [
          'NIM',
          'Nama Mahasiswa',
          'Email',
          'No HP',
          'Program Studi',
          'Kelas',
          'Status',
          'NIP Pembimbing 1',
          'NIP Pembimbing 2'
        ],
        sampleRows: [
          ['09010182428090', 'Budi Pratama', '09010182428090@student.unsri.ac.id', '081234567890', 'D3 Manajemen Informatika', 'MI 5A', 'aktif', '198910142023211013', '198710092024211001'],
          ['09010182428091', 'Siti Rahmawati', '09010182428091@student.unsri.ac.id', '081298765432', 'D3 Manajemen Informatika', 'MI 5B', 'aktif', '198303182023212034', '198810052023212046'],
          ['09010182428092', 'Ahmad Fadillah', '09010182428092@student.unsri.ac.id', '082155667788', 'D3 Manajemen Informatika', 'MI 5A', 'cuti', '', '']
        ],
        xlsxFilename: 'template_import_mahasiswa_simta.xlsx',
        csvFilename: 'template_import_mahasiswa_simta.csv'
      };
    } else {
      return {
        headers: [
          'NIP',
          'Nama Dosen',
          'Email',
          'No HP',
          'Program Studi',
          'Jabatan Fungsional',
          'Bidang Keahlian',
          'Kuota Dospem 1',
          'Kuota Dospem 2',
          'Status'
        ],
        sampleRows: [
          ['198501152012121001', 'Dr. Ahmad Fauzi, M.Kom.', 'ahmad.fauzi@unsri.ac.id', '081211223344', 'D3 Manajemen Informatika', 'Lektor', 'Sistem Informasi, Data Science', 8, 8, 'aktif'],
          ['198803202015042002', 'Dewi Sartika, S.Kom., M.T.', 'dewi.sartika@unsri.ac.id', '081255667788', 'D3 Manajemen Informatika', 'Asisten Ahli', 'Rekayasa Perangkat Lunak', 8, 8, 'aktif'],
          ['198410012009121005', 'Dr. Abdiansah, S.Kom., M.Cs.', 'abdiansah@unsri.ac.id', '081373556677', 'D3 Manajemen Informatika', 'Lektor Kepala', 'Artificial Intelligence, NLP', 10, 10, 'aktif']
        ],
        xlsxFilename: 'template_import_dosen_simta.xlsx',
        csvFilename: 'template_import_dosen_simta.csv'
      };
    }
  };

  // Download official Excel template (.xlsx)
  const handleDownloadTemplateExcel = () => {
    const { headers, sampleRows, xlsxFilename } = getTemplateConfig();

    const worksheetData = [headers, ...sampleRows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set auto column widths
    const colWidths = headers.map((h, colIdx) => {
      let maxLen = h.length;
      sampleRows.forEach(row => {
        const val = row[colIdx] ? String(row[colIdx]) : '';
        if (val.length > maxLen) maxLen = val.length;
      });
      return { wch: Math.min(Math.max(maxLen + 4, 14), 45) };
    });
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, isMahasiswa ? 'Data Mahasiswa' : 'Data Dosen');
    XLSX.writeFile(workbook, xlsxFilename);
  };

  // Download official CSV template (.csv)
  const handleDownloadTemplateCSV = () => {
    const { headers, sampleRows, csvFilename } = getTemplateConfig();

    const csvRows = [
      headers.join(','),
      ...sampleRows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    ];

    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', csvFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Map arbitrary parsed row object to standard SIMTA schema
  const mapRowFields = (rawRow) => {
    const mapped = {};
    Object.keys(rawRow).forEach(k => {
      const norm = normalizeKey(k);
      const val = String(rawRow[k] ?? '').trim();

      if (isMahasiswa) {
        if (norm === 'nim' || norm === 'nomorinduk' || norm === 'nimmahasiswa' || norm === 'studentnim') {
          mapped.nim = val;
        } else if (norm === 'nama' || norm === 'namamahasiswa' || norm === 'namalengkap' || norm === 'studentnama') {
          mapped.nama = val;
        } else if (norm === 'email' || norm === 'surel' || norm === 'emailmahasiswa') {
          mapped.email = val;
        } else if (norm === 'nohp' || norm === 'telepon' || norm === 'phone' || norm === 'whatsapp' || norm === 'hp' || norm === 'nomorhp') {
          mapped.no_hp = val;
        } else if (norm === 'prodi' || norm === 'programstudi' || norm === 'jurusan') {
          mapped.prodi = val;
        } else if (norm === 'kelas' || norm === 'rombel') {
          mapped.kelas = val;
        } else if (norm === 'status' || norm === 'statuskeaktifan' || norm === 'statusmahasiswa') {
          mapped.status = val.toLowerCase();
        } else if (
          norm === 'dospem1' || norm === 'pembimbing1' || norm === 'nipdospem1' || 
          norm === 'dospem1nip' || norm === 'nippembimbing1' || norm === 'pembimbing1nip' ||
          norm === 'dospemutama' || norm === 'pembimbingutama'
        ) {
          mapped.dospem1_nip = val;
        } else if (
          norm === 'dospem2' || norm === 'pembimbing2' || norm === 'nipdospem2' || 
          norm === 'dospem2nip' || norm === 'nippembimbing2' || norm === 'pembimbing2nip' ||
          norm === 'dospempendamping' || norm === 'pembimbingpendamping'
        ) {
          mapped.dospem2_nip = val;
        }
      } else {
        if (norm === 'nip' || norm === 'nomorindukpegawai' || norm === 'nipdosen' || norm === 'advisornip') {
          mapped.nip = val;
        } else if (norm === 'nama' || norm === 'namadosen' || norm === 'namalengkap' || norm === 'advisornama') {
          mapped.nama = val;
        } else if (norm === 'email' || norm === 'surel' || norm === 'emaildosen') {
          mapped.email = val;
        } else if (norm === 'nohp' || norm === 'telepon' || norm === 'phone' || norm === 'whatsapp' || norm === 'hp') {
          mapped.no_hp = val;
        } else if (norm === 'prodi' || norm === 'programstudi' || norm === 'jurusan') {
          mapped.prodi = val;
        } else if (norm === 'jabatan' || norm === 'jabatanfungsional' || norm === 'fungsional') {
          mapped.jabatan_fungsional = val;
        } else if (norm === 'keahlian' || norm === 'bidangkeahlian' || norm === 'bidangriset' || norm === 'topik') {
          mapped.keahlian = val;
        } else if (norm === 'kuotadospem1' || norm === 'kuota1' || norm === 'kuotautama') {
          mapped.kuota_dospem1 = Number(val) || 8;
        } else if (norm === 'kuotadospem2' || norm === 'kuota2' || norm === 'kuotapendamping') {
          mapped.kuota_dospem2 = Number(val) || 8;
        } else if (norm === 'status' || norm === 'statuskeaktifan' || norm === 'statusdosen') {
          mapped.status = val.toLowerCase();
        }
      }
    });

    return mapped;
  };

  // Common validator and preview generator
  const processRawRows = (rawRowsList) => {
    if (!rawRowsList || rawRowsList.length === 0) {
      setParseError('Berkas tidak memiliki baris data atau format kolom tidak terbaca.');
      return;
    }

    const firstRow = rawRowsList[0] || {};
    const headers = Object.keys(firstRow);
    const normalizedHeaders = headers.map(normalizeKey);

    // Verify mandatory identifier (NIM / NIP)
    const hasIdCol = normalizedHeaders.some(h => 
      isMahasiswa 
        ? (h === 'nim' || h === 'nomorinduk' || h === 'nimmahasiswa' || h === 'studentnim')
        : (h === 'nip' || h === 'nomorindukpegawai' || h === 'nipdosen' || h === 'advisornip')
    );

    // Verify mandatory name
    const hasNameCol = normalizedHeaders.some(h => 
      h === 'nama' || h === 'namalengkap' || h === 'namamahasiswa' || h === 'namadosen' || h === 'studentnama' || h === 'advisornama'
    );

    if (!hasIdCol || !hasNameCol) {
      const missingCols = [];
      if (!hasIdCol) missingCols.push(isMahasiswa ? 'NIM' : 'NIP');
      if (!hasNameCol) missingCols.push('Nama');
      setParseError(`Kolom wajib tidak ditemukan: [${missingCols.join(', ')}]. Pastikan baris pertama berisi judul kolom sesuai petunjuk atau unduh Template Excel / CSV.`);
      return;
    }

    // Build set of existing IDs in the database
    const existingIdSet = new Set(
      (existingData || []).map(item => String(isMahasiswa ? (item.nim || '') : (item.nip || '')).trim())
    );

    // Track seen IDs inside this file
    const seenInFile = new Set();

    const validatedList = rawRowsList.map((row, index) => {
      const mapped = mapRowFields(row);
      const idVal = String(isMahasiswa ? (mapped.nim || '') : (mapped.nip || '')).trim();
      const nameVal = String(mapped.nama || '').trim();

      let rowStatus = 'valid';
      let rowReason = 'Siap diimpor';

      if (!idVal) {
        rowStatus = 'invalid';
        rowReason = `${isMahasiswa ? 'NIM' : 'NIP'} kosong`;
      } else if (!nameVal) {
        rowStatus = 'invalid';
        rowReason = 'Nama tidak boleh kosong';
      } else if (seenInFile.has(idVal)) {
        rowStatus = 'duplicate';
        rowReason = `${isMahasiswa ? 'NIM' : 'NIP'} duplikat di dalam berkas impor`;
      } else if (existingIdSet.has(idVal)) {
        rowStatus = 'duplicate';
        rowReason = `${isMahasiswa ? 'NIM' : 'NIP'} sudah terdaftar di database SIMTA`;
      } else if (isMahasiswa && mapped.dospem1_nip && mapped.dospem2_nip && mapped.dospem1_nip === mapped.dospem2_nip) {
        rowStatus = 'invalid';
        rowReason = 'Pembimbing 1 dan Pembimbing 2 tidak boleh sama';
      }

      if (idVal) {
        seenInFile.add(idVal);
      }

      return {
        rowNumber: index + 2, // Excel row line number (header is row 1)
        raw: row,
        mapped,
        identifier: idVal,
        nama: nameVal,
        status: rowStatus,
        reason: rowReason
      };
    });

    setParsedRows(validatedList);
    setStep('preview');
  };

  // Process File through SheetJS for .xlsx / .xls or PapaParse for .csv
  const processUploadedFile = (selectedFile) => {
    if (!selectedFile) return;

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setFileSize((selectedFile.size / 1024).toFixed(1) + ' KB');
    setParseError('');

    // Check if empty file
    if (selectedFile.size === 0) {
      setParseError('Berkas kosong (0 byte). Pastikan Anda memilih berkas yang memiliki isi.');
      return;
    }

    const lowerName = selectedFile.name.toLowerCase();

    // 1. Excel files (.xlsx, .xls) processed via SheetJS
    if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target.result;
          const workbook = XLSX.read(buffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];

          if (!firstSheetName) {
            setParseError('Berkas Excel tidak memiliki sheet yang dapat dibaca.');
            return;
          }

          const worksheet = workbook.Sheets[firstSheetName];
          // Use raw: false so numbers like NIM / NIP are formatted as strings without exponent notation
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

          if (!jsonData || jsonData.length === 0) {
            setParseError('Berkas Excel kosong atau baris data tidak terdeteksi.');
            return;
          }

          processRawRows(jsonData);
        } catch (err) {
          setParseError(`Gagal membaca berkas Excel (.xlsx): ${err.message || 'Format tidak valid'}`);
        }
      };

      reader.onerror = () => {
        setParseError('Gagal membaca berkas dari perangkat Anda.');
      };

      reader.readAsArrayBuffer(selectedFile);
      return;
    }

    // 2. CSV files processed via PapaParse
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        processRawRows(results.data);
      },
      error: (err) => {
        setParseError(`Gagal membaca berkas CSV: ${err.message || 'Format tidak valid'}`);
      }
    });
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) processUploadedFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) processUploadedFile(dropped);
  };

  // Preview filtering stats
  const totalCount = parsedRows.length;
  const validCount = parsedRows.filter(r => r.status === 'valid').length;
  const duplicateCount = parsedRows.filter(r => r.status === 'duplicate').length;
  const invalidCount = parsedRows.filter(r => r.status === 'invalid').length;

  const filteredPreviewRows = useMemo(() => {
    if (previewFilter === 'ALL') return parsedRows;
    return parsedRows.filter(r => r.status === previewFilter);
  }, [parsedRows, previewFilter]);

  // Execute import process
  const handleConfirmImport = async () => {
    if (!onImport) return;

    // Filter which rows to process based on duplicate mode
    const rowsToProcess = parsedRows
      .filter(r => r.status === 'valid' || (r.status === 'duplicate' && duplicateMode === 'update'))
      .map(r => r.mapped);

    if (rowsToProcess.length === 0 && duplicateMode === 'skip') {
      alert('Tidak ada data baru yang valid untuk diimpor. Silakan periksa data duplikat atau aktifkan opsi perbarui data.');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await onImport(
        parsedRows.filter(r => r.status !== 'invalid').map(r => r.mapped),
        { handleDuplicates: duplicateMode }
      );

      setImportResult(result);
      setStep('result');
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      alert(`Terjadi kesalahan saat menyimpan ke database: ${err.message || 'Silakan coba lagi'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 text-[10px] font-bold border border-indigo-400/20 mb-0.5">
                <Sparkles className="w-3 h-3 text-indigo-300" />
                <span>Data Master SIMTA • Import Excel &amp; CSV</span>
              </div>
              <h2 className="text-lg font-extrabold tracking-tight">
                Import Data {isMahasiswa ? 'Mahasiswa' : 'Dosen'} (Excel .xlsx / CSV)
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Container with Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* STEP 1: UPLOAD SCREEN */}
          {step === 'upload' && (
            <div className="space-y-6">

              {/* Format Guidelines Card with Excel Template Buttons */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center space-x-2.5 text-indigo-900 font-bold text-sm">
                    <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Petunjuk Format Berkas &amp; Kolom Wajib</span>
                  </div>
                  
                  {/* Download Template Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleDownloadTemplateExcel}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                      title="Unduh template berformat Microsoft Excel (.xlsx)"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Unduh Template Excel (.xlsx)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadTemplateCSV}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                      title="Unduh template berformat CSV"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Template CSV</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-indigo-950/80 leading-relaxed">
                  Unggah berkas spreadsheet <strong>Microsoft Excel (.xlsx, .xls)</strong> atau <strong>CSV (.csv)</strong>. Baris pertama wajib memuat nama kolom sesuai standar SIMTA di bawah ini:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="bg-white/80 border border-indigo-100 rounded-xl p-3">
                    <div className="font-bold text-indigo-900 flex items-center space-x-1.5 mb-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>Kolom Wajib (Wajib Ada):</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      <li><code>{isMahasiswa ? 'NIM' : 'NIP'}</code>: Nomor identitas resmi (unik)</li>
                      <li><code>{isMahasiswa ? 'Nama Mahasiswa' : 'Nama Dosen'}</code>: Nama lengkap beserta gelar</li>
                    </ul>
                  </div>

                  <div className="bg-white/80 border border-indigo-100 rounded-xl p-3">
                    <div className="font-bold text-indigo-900 flex items-center space-x-1.5 mb-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Kolom Opsional / Terintegrasi:</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {isMahasiswa ? (
                        <span>
                          <code>Email</code>, <code>No HP</code>, <code>Program Studi</code>, <code>Kelas</code> (cth: MI 5A), <code>Status</code>, serta relasi <code>NIP Pembimbing 1</code> &amp; <code>NIP Pembimbing 2</code>.
                        </span>
                      ) : (
                        <span>
                          <code>Email</code>, <code>No HP</code>, <code>Jabatan Fungsional</code>, <code>Bidang Keahlian</code>, <code>Kuota Dospem 1</code>, <code>Kuota Dospem 2</code>, <code>Status</code>.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Drag and Drop Upload Area */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${
                  isDragOver 
                    ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]' 
                    : 'border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>

                <h3 className="text-base font-bold text-slate-800">
                  Tarik &amp; lepas berkas Excel / CSV ke sini, atau <span className="text-emerald-700 hover:underline">Pilih dari Komputer</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Mendukung format file <strong>.xlsx</strong> (Microsoft Excel Modern), <strong>.xls</strong>, dan <strong>.csv</strong> secara native.
                </p>

                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800 shadow-2xs">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Excel (.xlsx) Didukung</span>
                  </span>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-600 shadow-2xs">
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                    <span>Validasi Otomatis &amp; Preview</span>
                  </span>
                </div>
              </div>

              {/* Parse Error Alert */}
              {parseError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs space-y-1 text-red-900 animate-in fade-in duration-200 flex items-start space-x-3">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-red-950">Validasi Berkas Gagal</div>
                    <p className="text-red-800 leading-relaxed">{parseError}</p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* STEP 2: PREVIEW & VALIDATION SCREEN */}
          {step === 'preview' && (
            <div className="space-y-5">
              
              {/* File Info Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 truncate max-w-xs sm:max-w-md">
                      {fileName} {fileSize && <span className="font-normal text-slate-400">({fileSize})</span>}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Total <strong>{totalCount}</strong> baris data terbaca dari lembar Excel
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { setStep('upload'); setParsedRows([]); setFileName(''); }}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Pilih Berkas Lain</span>
                </button>
              </div>

              {/* Stat Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewFilter('ALL')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    previewFilter === 'ALL' 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-75">Semua Baris</div>
                  <div className="text-xl font-extrabold mt-0.5">{totalCount}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewFilter('valid')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    previewFilter === 'valid' 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' 
                      : 'bg-emerald-50/50 border-emerald-200 text-emerald-900 hover:border-emerald-400'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-75">Siap Diimpor</div>
                  <div className="text-xl font-extrabold mt-0.5 text-emerald-700">{validCount}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewFilter('duplicate')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    previewFilter === 'duplicate' 
                      ? 'bg-amber-600 text-white border-amber-600 shadow-md' 
                      : 'bg-amber-50/50 border-amber-200 text-amber-900 hover:border-amber-400'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-75">Duplikat</div>
                  <div className="text-xl font-extrabold mt-0.5 text-amber-700">{duplicateCount}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewFilter('invalid')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    previewFilter === 'invalid' 
                      ? 'bg-red-600 text-white border-red-600 shadow-md' 
                      : 'bg-red-50/50 border-red-200 text-red-900 hover:border-red-400'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-75">Tidak Valid</div>
                  <div className="text-xl font-extrabold mt-0.5 text-red-700">{invalidCount}</div>
                </button>
              </div>

              {/* Duplicate Handling Configuration */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Kebijakan Penanganan Data Duplikat ({isMahasiswa ? 'Berdasarkan Identitas NIM' : 'Berdasarkan NIP'}):</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    duplicateMode === 'skip' 
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-950 shadow-2xs' 
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}>
                    <input
                      type="radio"
                      name="dupMode"
                      value="skip"
                      checked={duplicateMode === 'skip'}
                      onChange={() => setDuplicateMode('skip')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold block">Lewati Data Duplikat (Rekomendasi)</span>
                      <span className="text-[11px] text-slate-500">
                        Data dengan {isMahasiswa ? 'NIM' : 'NIP'} yang telah ada di database SIMTA tidak akan ditimpa.
                      </span>
                    </div>
                  </label>

                  <label className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    duplicateMode === 'update' 
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-950 shadow-2xs' 
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}>
                    <input
                      type="radio"
                      name="dupMode"
                      value="update"
                      checked={duplicateMode === 'update'}
                      onChange={() => setDuplicateMode('update')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold block">Perbarui Data Yang Sudah Ada</span>
                      <span className="text-[11px] text-slate-500">
                        Data {isMahasiswa ? 'mahasiswa' : 'dosen'} di database akan diperbarui dengan data dari berkas Excel.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-700">
                    Pratinjau Data ({filteredPreviewRows.length} baris ditampilkan)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Periksa kebenaran data sebelum mengonfirmasi impor ke database
                  </div>
                </div>

                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 border-b border-slate-200 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Baris</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">{isMahasiswa ? 'NIM' : 'NIP'}</th>
                        <th className="py-2.5 px-3">Nama</th>
                        <th className="py-2.5 px-3">Email</th>
                        <th className="py-2.5 px-3">{isMahasiswa ? 'Kelas / Prodi' : 'Jabatan'}</th>
                        {isMahasiswa && <th className="py-2.5 px-3">Pembimbing 1 &amp; 2</th>}
                        <th className="py-2.5 px-3">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredPreviewRows.length === 0 ? (
                        <tr>
                          <td colSpan={isMahasiswa ? 8 : 7} className="py-8 text-center text-slate-400 text-xs">
                            Tidak ada data untuk filter "{previewFilter}".
                          </td>
                        </tr>
                      ) : (
                        filteredPreviewRows.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-400">
                              #{item.rowNumber}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              {item.status === 'valid' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Siap Impor</span>
                                </span>
                              )}
                              {item.status === 'duplicate' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  <span>Duplikat</span>
                                </span>
                              )}
                              {item.status === 'invalid' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                                  <AlertCircle className="w-3 h-3 text-red-600" />
                                  <span>Tidak Valid</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-mono font-semibold text-slate-900">
                              {item.identifier || <span className="text-red-500 italic">Kosong</span>}
                            </td>
                            <td className="py-2 px-3 font-medium text-slate-900">
                              {item.nama || <span className="text-red-500 italic">Kosong</span>}
                            </td>
                            <td className="py-2 px-3 text-slate-600 text-[11px]">
                              {item.mapped.email || `${item.identifier}@${isMahasiswa ? 'student.unsri.ac.id' : 'unsri.ac.id'}`}
                            </td>
                            <td className="py-2 px-3 text-slate-600 text-[11px]">
                              {isMahasiswa 
                                ? (item.mapped.kelas || item.mapped.prodi || 'MI 5A') 
                                : (item.mapped.jabatan_fungsional || 'Asisten Ahli')}
                            </td>
                            {isMahasiswa && (
                              <td className="py-2 px-3 text-slate-600 text-[11px]">
                                {item.mapped.dospem1_nip || item.mapped.dospem2_nip ? (
                                  <div className="font-mono text-[10px]">
                                    {item.mapped.dospem1_nip && <div>P1: {item.mapped.dospem1_nip}</div>}
                                    {item.mapped.dospem2_nip && <div>P2: {item.mapped.dospem2_nip}</div>}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">Belum diset</span>
                                )}
                              </td>
                            )}
                            <td className="py-2 px-3 text-[11px] text-slate-500 max-w-xs truncate">
                              {item.reason}
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

          {/* STEP 3: RESULT SUMMARY SCREEN */}
          {step === 'result' && importResult && (
            <div className="space-y-6 py-2">
              
              {/* Celebratory Banner */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/50 border border-emerald-200 rounded-3xl p-6 text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-emerald-950">
                  Proses Impor Data Master Selesai
                </h3>
                <p className="text-xs text-emerald-900 max-w-md mx-auto leading-relaxed">
                  Data telah berhasil disimpan dan disinkronkan ke basis data master SIMTA Fakultas Ilmu Komputer UNSRI.
                </p>
              </div>

              {/* Metric Result Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Diproses</div>
                  <div className="text-2xl font-black text-slate-900">{importResult.total}</div>
                  <div className="text-[11px] text-slate-500">Baris data dianalisis</div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-2xs space-y-1">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Berhasil Diimpor</div>
                  <div className="text-2xl font-black text-emerald-700">{importResult.imported}</div>
                  <div className="text-[11px] text-emerald-700/80">Data baru ditambahkan</div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-2xs space-y-1">
                  <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Diperbarui</div>
                  <div className="text-2xl font-black text-blue-700">{importResult.updated || 0}</div>
                  <div className="text-[11px] text-blue-700/80">Data berhasil diupdate</div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-2xs space-y-1">
                  <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Dilewati / Gagal</div>
                  <div className="text-2xl font-black text-amber-700">{(importResult.skipped || 0) + (importResult.failed || 0)}</div>
                  <div className="text-[11px] text-amber-700/80">Duplikat / tidak valid</div>
                </div>
              </div>

              {/* Error / Skipped Details Table if any */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs space-y-0">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Rincian Data Dilewati atau Gagal ({importResult.errors.length})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Keterangan alasan kegagalan / duplikasi
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-56">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Baris</th>
                          <th className="py-2 px-3">{isMahasiswa ? 'NIM' : 'NIP'}</th>
                          <th className="py-2 px-3">Nama</th>
                          <th className="py-2 px-3">Alasan / Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {importResult.errors.map((err, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono text-slate-400">#{err.row}</td>
                            <td className="py-2 px-3 font-mono font-semibold text-slate-800">{err.identifier}</td>
                            <td className="py-2 px-3 text-slate-700">{err.nama || '-'}</td>
                            <td className="py-2 px-3 text-slate-600 text-[11px]">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                String(err.reason || '').includes('dilewati') ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {err.reason}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <div>
            {step === 'preview' && (
              <span className="text-xs text-slate-500">
                Akan memproses <strong>{validCount + (duplicateMode === 'update' ? duplicateCount : 0)}</strong> dari <strong>{totalCount}</strong> baris data.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {step === 'upload' && (
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
            )}

            {step === 'preview' && (
              <>
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
                >
                  Kembali
                </button>

                <button
                  type="button"
                  disabled={isProcessing || (validCount === 0 && duplicateMode === 'skip')}
                  onClick={handleConfirmImport}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan ke Database...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Konfirmasi &amp; Simpan ke Database</span>
                    </>
                  )}
                </button>
              </>
            )}

            {step === 'result' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setStep('upload');
                    setParsedRows([]);
                    setFileName('');
                    setImportResult(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
                >
                  Impor Berkas Lain
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Selesai &amp; Tutup</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
