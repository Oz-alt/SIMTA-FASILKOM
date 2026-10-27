import React, { useState, useMemo, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  ClipboardList, 
  Search, 
  RotateCcw, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  Calendar, 
  Clock, 
  User, 
  GraduationCap, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  HelpCircle, 
  SlidersHorizontal, 
  ArrowUpDown, 
  ShieldAlert, 
  Loader2, 
  Inbox, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Video,
  Users
} from 'lucide-react';

/**
 * Helper to normalize and canonicalize bimbingan status into:
 * 'Menunggu Validasi' | 'Revisi Mayor' | 'Revisi Minor' | 'Valid'
 */
const normalizeStatusBimbingan = (rawStatus) => {
  if (!rawStatus) return 'Menunggu Validasi';
  const s = String(rawStatus).toLowerCase().trim();
  
  if (s === 'valid' || s === 'disetujui' || s === 'acc' || s === 'setuju') {
    return 'Valid';
  }
  if (s === 'revisi mayor' || s === 'revisi_mayor' || s === 'tolak' || s === 'ditolak') {
    return 'Revisi Mayor';
  }
  if (s === 'revisi minor' || s === 'revisi_minor' || s === 'perlu_revisi' || s === 'revisi') {
    return 'Revisi Minor';
  }
  if (s === 'menunggu validasi' || s === 'menunggu_validasi' || s === 'menunggu_tanggapan' || s === 'pending') {
    return 'Menunggu Validasi';
  }
  
  return 'Menunggu Validasi';
};

/**
 * Helper to extract student's angkatan from student object or NIM
 */
const extractAngkatan = (nim, studentObj) => {
  if (studentObj?.angkatan) return String(studentObj.angkatan).trim();
  if (studentObj?.tahun_angkatan) return String(studentObj.tahun_angkatan).trim();
  
  const cleanNim = String(nim || '').trim();
  // UNSRI NIM pattern: 09010182428002 -> 24 at indices 6-8 -> 2024
  if (cleanNim.length >= 8) {
    const code = cleanNim.substring(6, 8);
    if (/^\d{2}$/.test(code) && Number(code) >= 15 && Number(code) <= 35) {
      return `20${code}`;
    }
  }
  return '';
};

/**
 * Helper to extract student's status: 'Aktif' | 'Lulus' | 'Tidak Aktif'
 */
const extractStatusMhs = (studentObj) => {
  if (!studentObj) return 'Aktif';
  const st = String(studentObj.status || '').toLowerCase().trim();
  if (st.includes('lulus') || st.includes('alumni')) return 'Lulus';
  if (st.includes('tidak') || st.includes('non') || st.includes('cuti') || st.includes('drop') || st.includes('keluar')) return 'Tidak Aktif';
  return 'Aktif';
};

/**
 * Helper to format date and time string: '15/10/2026 11:07-11:13'
 */
const formatTanggalWaktu = (c) => {
  let dateFormatted = c.tanggal || '-';
  if (c.tanggal && c.tanggal.includes('-')) {
    const parts = c.tanggal.split('-');
    if (parts.length === 3) {
      dateFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
    }
  }

  let timeStr = '';
  if (c.jam_mulai && c.jam_selesai) {
    timeStr = `${c.jam_mulai}-${c.jam_selesai}`;
  } else if (c.jam_mulai) {
    timeStr = c.jam_mulai;
  } else if (c.waktu) {
    const cleanWaktu = String(c.waktu).trim();
    if (cleanWaktu.includes('-')) {
      timeStr = cleanWaktu.replace(/\s+/g, '');
    } else {
      timeStr = `${cleanWaktu}`;
    }
  } else if (c.created_at) {
    const d = new Date(c.created_at);
    if (!isNaN(d.getTime())) {
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      timeStr = `${hh}:${mm}`;
    }
  }

  return timeStr ? `${dateFormatted} ${timeStr}` : dateFormatted;
};

export default function RekapBimbinganKaprodiPage() {
  const { 
    currentUser, 
    consultations = [], 
    advisors = [], 
    studentAdvisors = [],
    getAllRegisteredStudents 
  } = useAuth();

  const [isLoading, setIsLoading] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDosen, setSelectedDosen] = useState('all');
  const [selectedAngkatan, setSelectedAngkatan] = useState('all');
  const [selectedStatusMhs, setSelectedStatusMhs] = useState('Aktif'); // Rule 2: Default "Aktif"
  const [selectedJenis, setSelectedJenis] = useState('all');
  const [selectedStatusBimbingan, setSelectedStatusBimbingan] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Registered students lookup map
  const allStudents = useMemo(() => {
    return typeof getAllRegisteredStudents === 'function' ? getAllRegisteredStudents() : [];
  }, [getAllRegisteredStudents]);

  const studentMap = useMemo(() => {
    const map = new Map();
    allStudents.forEach(std => {
      if (std.nim) {
        map.set(String(std.nim).trim(), std);
      }
    });
    return map;
  }, [allStudents]);

  // Lecturer lookup map by NIP or ID
  const advisorMap = useMemo(() => {
    const map = new Map();
    advisors.forEach(a => {
      if (a.nip) map.set(String(a.nip).trim(), a);
      if (a.id) map.set(String(a.id).trim(), a);
    });
    return map;
  }, [advisors]);

  // Dynamic Dosen list for Filter Dropdown
  const availableDosenList = useMemo(() => {
    const map = new Map();

    // From official advisors master
    advisors.forEach(a => {
      if (a.nama) {
        map.set(a.nama.trim(), {
          id: a.nip || a.id,
          nama: a.nama.trim(),
          nip: a.nip || ''
        });
      }
    });

    // Also from consultations if any
    consultations.forEach(c => {
      const nama = c.dosen_nama || (c.dosen_nip && advisorMap.get(String(c.dosen_nip).trim())?.nama);
      if (nama && !map.has(nama.trim())) {
        map.set(nama.trim(), {
          id: c.dosen_nip || c.id_dosen || nama.trim(),
          nama: nama.trim(),
          nip: c.dosen_nip || c.id_dosen || ''
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.nama.localeCompare(b.nama));
  }, [advisors, consultations, advisorMap]);

  // Dynamic Angkatan list for Filter Dropdown (Rule 1: Angkatan unik, urut menurun, dinamis)
  const availableAngkatans = useMemo(() => {
    const set = new Set();

    allStudents.forEach(std => {
      const ang = extractAngkatan(std.nim, std);
      if (ang) set.add(ang);
    });

    consultations.forEach(c => {
      const nim = c.nim || c.mhs_nim;
      const std = studentMap.get(String(nim).trim());
      const ang = extractAngkatan(nim, std);
      if (ang) set.add(ang);
    });

    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [allStudents, consultations, studentMap]);

  // Pre-calculate Urutan Bimbingan per Student
  // Group consultations by student NIM, sort chronologically ascending, and assign 1..N
  const urutanMap = useMemo(() => {
    const groups = new Map();
    consultations.forEach(c => {
      const nim = String(c.nim || c.mhs_nim || '').trim();
      if (!groups.has(nim)) {
        groups.set(nim, []);
      }
      groups.get(nim).push(c);
    });

    const map = new Map();
    groups.forEach((items, nim) => {
      // Sort oldest to newest
      const sorted = [...items].sort((a, b) => {
        const da = a.tanggal || '';
        const db = b.tanggal || '';
        if (da !== db) return da.localeCompare(db);
        const ca = a.created_at || a.dibuat_pada || '';
        const cb = b.created_at || b.dibuat_pada || '';
        return ca.localeCompare(cb);
      });

      sorted.forEach((item, idx) => {
        map.set(item.id, idx + 1);
      });
    });

    return map;
  }, [consultations]);

  // Process and Normalize all consultations
  const processedConsultations = useMemo(() => {
    return consultations.map(c => {
      const cleanNim = String(c.nim || c.mhs_nim || '').trim();
      const std = studentMap.get(cleanNim);
      const studentName = c.mhs_nama || std?.nama || `Mahasiswa (${cleanNim})`;
      const angkatan = extractAngkatan(cleanNim, std);
      const statusMhs = extractStatusMhs(std);

      // Dosen name with title
      let dosenNama = c.dosen_nama;
      if (!dosenNama && (c.id_dosen || c.dosen_nip)) {
        const adv = advisorMap.get(String(c.id_dosen || c.dosen_nip).trim());
        dosenNama = adv?.nama;
      }
      if (!dosenNama) dosenNama = 'Dosen Pembimbing';

      // Urutan Bimbingan
      const calculatedUrutan = urutanMap.get(c.id) || 1;
      const urutan = c.urutan_bimbingan || calculatedUrutan;

      // Jenis: Daring / Luring
      const jenisRaw = c.jenis || c.metode || 'Luring';
      const jenis = String(jenisRaw).toLowerCase().includes('daring') || String(jenisRaw).toLowerCase().includes('online')
        ? 'Daring'
        : 'Luring';

      // Status Bimbingan canonical
      const canonicalStatus = normalizeStatusBimbingan(c.status);

      // Student Note and Lecturer Feedback
      const catatanMhs = c.catatan || c.catatan_mahasiswa || c.bab_topik || '-';
      const tanggapanDosen = c.tanggapan_dosen || c.masukan_dosen || '';

      // Date & Time formatted
      const formattedDate = formatTanggalWaktu(c);

      return {
        ...c,
        clean_nim: cleanNim,
        mhs_nama: studentName,
        angkatan: angkatan,
        status_mahasiswa: statusMhs,
        dosen_nama: dosenNama,
        urutan_bimbingan: urutan,
        jenis: jenis,
        status_canonical: canonicalStatus,
        catatan: catatanMhs,
        tanggapan_dosen: tanggapanDosen,
        formatted_date_time: formattedDate
      };
    });
  }, [consultations, studentMap, advisorMap, urutanMap]);

  // Filter consultations based on all filter parameters (AND Rule 4)
  const filteredConsultations = useMemo(() => {
    return processedConsultations
      .filter(item => {
        // 1. Search query: nama / NIM / catatan
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchNama = item.mhs_nama.toLowerCase().includes(q);
          const matchNim = item.clean_nim.toLowerCase().includes(q);
          const matchCatatan = item.catatan.toLowerCase().includes(q);
          const matchDosen = item.dosen_nama.toLowerCase().includes(q);
          if (!matchNama && !matchNim && !matchCatatan && !matchDosen) {
            return false;
          }
        }

        // 2. Dropdown Dosen
        if (selectedDosen !== 'all') {
          const matchNama = item.dosen_nama.toLowerCase() === selectedDosen.toLowerCase();
          const matchId = (item.id_dosen && item.id_dosen === selectedDosen) || 
                          (item.dosen_nip && item.dosen_nip === selectedDosen);
          if (!matchNama && !matchId) {
            return false;
          }
        }

        // 3. Dropdown Angkatan
        if (selectedAngkatan !== 'all') {
          if (item.angkatan !== selectedAngkatan) {
            return false;
          }
        }

        // 4. Dropdown Status Mahasiswa (Default: 'Aktif')
        if (selectedStatusMhs !== 'all') {
          if (item.status_mahasiswa.toLowerCase() !== selectedStatusMhs.toLowerCase()) {
            return false;
          }
        }

        // 5. Dropdown Jenis: Daring / Luring
        if (selectedJenis !== 'all') {
          if (item.jenis.toLowerCase() !== selectedJenis.toLowerCase()) {
            return false;
          }
        }

        // 6. Dropdown Status Bimbingan
        if (selectedStatusBimbingan !== 'all') {
          if (item.status_canonical !== selectedStatusBimbingan) {
            return false;
          }
        }

        // 7. Tanggal dari
        if (dateFrom) {
          if ((item.tanggal || '') < dateFrom) {
            return false;
          }
        }

        // 8. Tanggal sampai
        if (dateTo) {
          if ((item.tanggal || '') > dateTo) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Sort newest date first (Terbaru di atas)
        const da = a.tanggal || '';
        const db = b.tanggal || '';
        if (da !== db) return db.localeCompare(da);
        
        const ca = a.created_at || a.dibuat_pada || '';
        const cb = b.created_at || b.dibuat_pada || '';
        if (ca !== cb) return cb.localeCompare(ca);

        return (b.urutan_bimbingan || 0) - (a.urutan_bimbingan || 0);
      });
  }, [
    processedConsultations, 
    searchQuery, 
    selectedDosen, 
    selectedAngkatan, 
    selectedStatusMhs, 
    selectedJenis, 
    selectedStatusBimbingan, 
    dateFrom, 
    dateTo
  ]);

  // Pagination calculation
  const totalItems = filteredConsultations.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDosen, selectedAngkatan, selectedStatusMhs, selectedJenis, selectedStatusBimbingan, dateFrom, dateTo]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredConsultations.slice(start, start + pageSize);
  }, [filteredConsultations, currentPage, pageSize]);

  // Reset Filter (Rule 3: semua filter kembali ke awal, status mahasiswa kembali "Aktif")
  const handleReset = () => {
    setSearchQuery('');
    setSelectedDosen('all');
    setSelectedAngkatan('all');
    setSelectedStatusMhs('Aktif'); // Rule 3: status mahasiswa kembali "Aktif"
    setSelectedJenis('all');
    setSelectedStatusBimbingan('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  // =========================================================================
  // EXPORT HANDLERS (CSV, EXCEL, PDF) - Rule 6
  // =========================================================================

  const getExportDataRows = () => {
    return filteredConsultations.map((item, idx) => ({
      no: idx + 1,
      tanggalWaktu: item.formatted_date_time,
      dosen: item.dosen_nama,
      mahasiswa: item.mhs_nama,
      nim: item.clean_nim,
      urutan: `#${item.urutan_bimbingan}`,
      angkatan: item.angkatan || '-',
      statusMhs: item.status_mahasiswa,
      jenis: item.jenis,
      catatan: item.catatan.replace(/"/g, '""'),
      tanggapanDosen: (item.tanggapan_dosen || '-').replace(/"/g, '""'),
      statusBimbingan: item.status_canonical
    }));
  };

  // 1. Export CSV (Hijau)
  const handleExportCSV = () => {
    if (filteredConsultations.length === 0) {
      alert('Tidak ada data untuk diekspor!');
      return;
    }

    const headers = [
      'No',
      'Tanggal & Waktu',
      'Dosen Pembimbing',
      'Nama Mahasiswa',
      'NIM',
      'Urutan Bimbingan',
      'Angkatan',
      'Status Mahasiswa',
      'Jenis',
      'Catatan Mahasiswa',
      'Tanggapan Dosen',
      'Status Bimbingan'
    ];

    const rows = getExportDataRows().map(r => [
      r.no,
      `"${r.tanggalWaktu}"`,
      `"${r.dosen}"`,
      `"${r.mahasiswa}"`,
      `'${r.nim}`,
      `"${r.urutan}"`,
      `"${r.angkatan}"`,
      `"${r.statusMhs}"`,
      `"${r.jenis}"`,
      `"${r.catatan}"`,
      `"${r.tanggapanDosen}"`,
      `"${r.statusBimbingan}"`
    ].join(','));

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rekap_seluruh_bimbingan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2. Export Excel (Hijau)
  const handleExportExcel = () => {
    if (filteredConsultations.length === 0) {
      alert('Tidak ada data untuk diekspor!');
      return;
    }

    const rowsHtml = getExportDataRows().map((r, i) => `
      <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${r.no}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px;">${r.tanggalWaktu}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px;">${r.dosen}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">${r.mahasiswa}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; mso-number-format:'\\@';">${r.nim}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${r.urutan}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${r.angkatan}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${r.statusMhs}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${r.jenis}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px;">${r.catatan}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; color: #1d4ed8;">${r.tanggapanDosen}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">${r.statusBimbingan}</td>
      </tr>
    `).join('');

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 11px; }
          th { background-color: #047857; color: #ffffff; border: 1px solid #065f46; padding: 8px; font-size: 12px; }
          .title { font-size: 16px; font-weight: bold; margin-bottom: 4px; color: #0f172a; }
          .subtitle { font-size: 12px; color: #475569; margin-bottom: 12px; }
        </style>
      </head>
      <body>
        <div class="title">REKAPITULASI SELURUH BIMBINGAN TUGAS AKHIR</div>
        <div class="subtitle">Program Studi D3 Manajemen Informatika - Fakultas Ilmu Komputer Universitas Sriwijaya | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}</div>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Tanggal & Waktu</th>
              <th>Dosen Pembimbing</th>
              <th>Mahasiswa</th>
              <th>NIM</th>
              <th>Urutan</th>
              <th>Angkatan</th>
              <th>Status Mhs</th>
              <th>Jenis</th>
              <th>Catatan Mahasiswa</th>
              <th>Tanggapan Dosen</th>
              <th>Status Bimbingan</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rekap_seluruh_bimbingan_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 3. Export PDF (Merah - Printable Official Letterhead)
  const handleExportPDF = () => {
    if (filteredConsultations.length === 0) {
      alert('Tidak ada data untuk diekspor!');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Silakan izinkan popup browser untuk mencetak PDF.');
      return;
    }

    const rowsHtml = getExportDataRows().map(r => `
      <tr>
        <td style="text-align: center;">${r.no}</td>
        <td>${r.tanggalWaktu}</td>
        <td>${r.dosen}</td>
        <td><strong>${r.mahasiswa}</strong><br><small style="color: #64748b;">${r.nim} (${r.urutan})</small></td>
        <td style="text-align: center;">${r.jenis}</td>
        <td>
          <div>${r.catatan}</div>
          ${r.tanggapanDosen !== '-' ? `<div style="color: #2563eb; font-size: 10px; margin-top: 3px;"><strong>Tanggapan:</strong> ${r.tanggapanDosen}</div>` : ''}
        </td>
        <td style="text-align: center;">
          <span style="font-size: 10px; font-weight: bold;">${r.statusBimbingan}</span>
        </td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rekap Seluruh Bimbingan TA - FASILKOM UNSRI</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10px; color: #1e293b; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
          .header h1 { font-size: 16px; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
          .header h2 { font-size: 12px; margin: 4px 0; font-weight: normal; }
          .header p { font-size: 10px; margin: 0; color: #64748b; }
          .meta { margin-bottom: 14px; font-size: 10px; display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; padding: 6px 4px; font-size: 10px; text-transform: uppercase; }
          td { border: 1px solid #cbd5e1; padding: 5px; vertical-align: top; }
          @media print {
            body { margin: 10mm; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>UNIVERSITAS SRIWIJAYA</h1>
          <h2>FAKULTAS ILMU KOMPUTER - PROGRAM STUDI D3 MANAJEMEN INFORMATIKA</h2>
          <p>Laporan Rekapitulasi Sesi Bimbingan Tugas Akhir Mahasiswa (Monitoring Kaprodi)</p>
        </div>
        <div class="meta">
          <div>
            <strong>Total Data:</strong> ${filteredConsultations.length} sesi bimbingan<br>
            <strong>Status Mahasiswa:</strong> ${selectedStatusMhs === 'all' ? 'Semua Status' : selectedStatusMhs}<br>
            <strong>Dosen:</strong> ${selectedDosen === 'all' ? 'Semua Dosen' : selectedDosen}
          </div>
          <div style="text-align: right;">
            <strong>Dicetak Pada:</strong> ${new Date().toLocaleString('id-ID')}<br>
            <strong>Oleh:</strong> ${currentUser?.nama || 'Ketua Program Studi'}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 30px;">No</th>
              <th style="width: 100px;">Tanggal</th>
              <th style="width: 140px;">Dosen</th>
              <th style="width: 140px;">Mahasiswa</th>
              <th style="width: 50px;">Jenis</th>
              <th>Catatan & Tanggapan</th>
              <th style="width: 90px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Status Badge UI Component
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Revisi Mayor':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 whitespace-nowrap">
            Revisi Mayor
          </span>
        );
      case 'Revisi Minor':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
            Revisi Minor
          </span>
        );
      case 'Menunggu Validasi':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 whitespace-nowrap">
            Menunggu Validasi
          </span>
        );
      case 'Valid':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
            Valid
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
            {status}
          </span>
        );
    }
  };

  // Access Control: Only Kaprodi and Admin
  const isAuthorized = currentUser?.role === 'kaprodi' || currentUser?.role === 'admin';

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600">Memuat data Rekap Bimbingan...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-lg mx-auto mt-12 shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Akses Terbatas</h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Halaman Rekap Seluruh Bimbingan hanya dapat diakses oleh Ketua Program Studi (Kaprodi) dan Administrator SIMTA.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 select-none">
        
        {/* ===================================================================
            1. JUDUL "Rekap Seluruh Bimbingan" (Blue Gradient Hero Banner)
            =================================================================== */}
        <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 shadow-xl border border-blue-700/40 overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Subtle background glow effect */}
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-[11px] font-bold border border-blue-400/30 backdrop-blur-xs">
              <ClipboardList className="w-3.5 h-3.5 text-blue-300" />
              <span>Monitoring Kaprodi &amp; Admin</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Rekap Seluruh Bimbingan
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal max-w-3xl">
              Pemantauan log dan riwayat bimbingan seluruh mahasiswa dan dosen pembimbing Program Studi D3 Manajemen Informatika. (Read-Only)
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-2">
            <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-white/15 text-right shadow-2xs">
              <span className="block text-[10px] font-bold text-blue-200 uppercase tracking-wider">Total Bimbingan</span>
              <span className="text-2xl font-black text-white font-mono leading-none">
                {consultations.length}
              </span>
            </div>
          </div>
        </div>

        {/* ===================================================================
            2. PANEL FILTER & ACTION TOOLBAR
               - Grid 4 kolom x 2 baris untuk 8 filter (rapi, lega, tidak terpotong)
               - Toolbar Aksi di bagian bawah kartu: Reset Filter + Tombol Ekspor (CSV, Excel, PDF) + Penghitung Data
            =================================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          
          {/* Header Panel Filter */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
              <Filter className="w-4 h-4 text-indigo-600" />
              <span>Filter Data Bimbingan</span>
              <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                Semua filter bekerja bersamaan (AND)
              </span>
            </div>

            {selectedStatusMhs === 'Aktif' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 text-[11px]">
                Filter Default: Mahasiswa Aktif
              </span>
            )}
          </div>

          {/* Grid Filter: 4 Kolom x 2 Baris yang Rapi dan Simetris */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* 1. Pencarian */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Pencarian</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Nama / NIM / Catatan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* 2. Dosen Pembimbing */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Dosen Pembimbing</label>
              <select
                value={selectedDosen}
                onChange={(e) => setSelectedDosen(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all text-slate-700 cursor-pointer"
              >
                <option value="all">Semua Dosen</option>
                {availableDosenList.map(d => (
                  <option key={d.id} value={d.nama}>
                    {d.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Angkatan */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Angkatan</label>
              <select
                value={selectedAngkatan}
                onChange={(e) => setSelectedAngkatan(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all text-slate-700 cursor-pointer"
              >
                <option value="all">Semua Angkatan</option>
                {availableAngkatans.map(ang => (
                  <option key={ang} value={ang}>
                    Angkatan {ang}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Status Mahasiswa */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Status Mahasiswa</label>
              <select
                value={selectedStatusMhs}
                onChange={(e) => setSelectedStatusMhs(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all text-slate-700 cursor-pointer font-semibold"
              >
                <option value="Aktif">Aktif</option>
                <option value="Lulus">Lulus</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
                <option value="all">Semua Status</option>
              </select>
            </div>

            {/* 5. Jenis Bimbingan */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Jenis Bimbingan</label>
              <select
                value={selectedJenis}
                onChange={(e) => setSelectedJenis(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all text-slate-700 cursor-pointer"
              >
                <option value="all">Semua Jenis</option>
                <option value="Daring">Daring</option>
                <option value="Luring">Luring</option>
              </select>
            </div>

            {/* 6. Status Bimbingan */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Status Bimbingan</label>
              <select
                value={selectedStatusBimbingan}
                onChange={(e) => setSelectedStatusBimbingan(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all text-slate-700 cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="Menunggu Validasi">Menunggu Validasi</option>
                <option value="Revisi Mayor">Revisi Mayor</option>
                <option value="Revisi Minor">Revisi Minor</option>
                <option value="Valid">Valid</option>
              </select>
            </div>

            {/* 7. Tanggal Dari */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Tanggal Dari</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-indigo-600 outline-none transition-all text-slate-700"
              />
            </div>

            {/* 8. Tanggal Sampai */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Tanggal Sampai</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-indigo-600 outline-none transition-all text-slate-700"
              />
            </div>

          </div>

          {/* Baris Tombol Aksi & Penghitung Terintegrasi */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            
            {/* Grup Kiri: Reset Filter & Tombol Ekspor */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                title="Kembalikan semua filter ke kondisi awal"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset Filter</span>
              </button>

              <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block"></div>

              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
                Ekspor:
              </span>

              {/* CSV (Hijau) */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition-colors cursor-pointer"
                title="Ekspor data aktif ke CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>

              {/* Excel (Teal/Hijau) */}
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-2xs transition-colors cursor-pointer"
                title="Ekspor data aktif ke Microsoft Excel (.xls)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>

              {/* PDF (Merah) */}
              <button
                type="button"
                onClick={handleExportPDF}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-2xs transition-colors cursor-pointer"
                title="Cetak atau simpan ke PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
            </div>

            {/* Grup Kanan: Penghitung Data */}
            <div className="flex items-center space-x-2 text-xs self-end sm:self-center">
              <span className="text-slate-500">
                Menampilkan <strong className="font-bold text-slate-900 font-mono">{filteredConsultations.length}</strong> dari {consultations.length} data
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold border border-indigo-200 font-mono text-xs">
                {filteredConsultations.length} data
              </span>
            </div>

          </div>

        </div>

        {/* ===================================================================
            3. TABEL LEBAR PENUH TANPA SCROLL HORIZONTAL
               Kolom: No, Tanggal & Waktu, Dosen, Mahasiswa, Jenis, Catatan & Tanggapan, Status
            =================================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              
              {/* Sticky Table Header */}
              <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs text-slate-700 uppercase tracking-wider text-[10.5px] font-extrabold border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-2 py-2.5 w-9 text-center">No</th>
                  <th scope="col" className="px-2.5 py-2.5 w-[115px]">Tanggal &amp; Waktu</th>
                  <th scope="col" className="px-2.5 py-2.5 w-[18%]">Dosen Pembimbing</th>
                  <th scope="col" className="px-2.5 py-2.5 w-[18%]">Mahasiswa</th>
                  <th scope="col" className="px-2 py-2.5 w-[70px] text-center">Jenis</th>
                  <th scope="col" className="px-2.5 py-2.5">Catatan &amp; Tanggapan</th>
                  <th scope="col" className="px-2 py-2.5 w-[110px] text-center">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                        <span className="text-xs font-semibold text-slate-500">Memuat data bimbingan...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  /* Rule 8: Tampilkan "Tidak ada data" bila kosong */
                  <tr>
                    <td colSpan="7" className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                          <Inbox className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">Tidak ada data bimbingan</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Tidak ditemukan data yang sesuai dengan kombinasi filter aktif saat ini. Silakan sesuaikan atau reset filter.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleReset}
                          className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          Reset Filter Sekarang
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, index) => {
                    const rowNumber = (currentPage - 1) * pageSize + index + 1;
                    return (
                      <tr 
                        key={item.id || index}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* No */}
                        <td className="px-2 py-2.5 text-center text-slate-400 font-mono text-[11px] align-top">
                          {rowNumber}
                        </td>

                        {/* Tanggal: tanggal + jam mulai-selesai (terbaru di atas) */}
                        <td className="px-2.5 py-2.5 align-top">
                          <div className="flex items-center space-x-1 text-slate-900 font-semibold text-[11px]">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="leading-tight">{item.formatted_date_time}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block pl-4 mt-0.5">
                            {item.pembimbing || 'Pembimbing 1'}
                          </span>
                        </td>

                        {/* Dosen: nama lengkap dengan gelar */}
                        <td className="px-2.5 py-2.5 align-top">
                          <div className="flex items-start space-x-1.5">
                            <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                              <User className="w-3 h-3" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block leading-tight text-[11.5px] break-words">
                                {item.dosen_nama}
                              </span>
                              {(item.dosen_nip || item.id_dosen) && (
                                <span className="text-[10px] text-slate-500 font-mono block truncate">
                                  NIP: {item.dosen_nip || item.id_dosen}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Mahasiswa: nama tebal, NIM, dan "#urutan bimbingan" */}
                        <td className="px-2.5 py-2.5 align-top">
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block text-[11.5px] leading-tight break-words">
                              {item.mhs_nama}
                            </span>
                            <div className="flex items-center flex-wrap gap-1 mt-0.5">
                              <span className="text-slate-500 font-mono text-[10.5px]">
                                {item.clean_nim}
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-extrabold text-[9.5px] border border-indigo-200/60 font-mono">
                                #{item.urutan_bimbingan}
                              </span>
                              {item.angkatan && (
                                <span className="text-[10px] text-slate-400">
                                  '{item.angkatan.slice(-2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Jenis: Daring / Luring */}
                        <td className="px-2 py-2.5 text-center align-top whitespace-nowrap">
                          {item.jenis === 'Daring' ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <Video className="w-2.5 h-2.5" />
                              <span>Daring</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              <Users className="w-2.5 h-2.5" />
                              <span>Luring</span>
                            </span>
                          )}
                        </td>

                        {/* Catatan: catatan mahasiswa; di bawahnya "Tanggapan: ..." dosen berwarna biru kecil */}
                        <td className="px-2.5 py-2.5 align-top">
                          <div className="space-y-1">
                            <p className="text-slate-700 text-[11px] leading-relaxed font-normal break-words">
                              {item.catatan}
                            </p>
                            
                            {item.tanggapan_dosen ? (
                              <div className="bg-blue-50/70 border border-blue-100 rounded-md p-1.5 text-[10.5px] text-blue-900 space-y-0.5">
                                <span className="font-bold text-blue-700 block text-[10px]">
                                  Tanggapan:
                                </span>
                                <p className="leading-relaxed break-words">
                                  {item.tanggapan_dosen}
                                </p>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic block">
                                Belum ada tanggapan dosen
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status: badge. Revisi Mayor merah, Revisi Minor kuning, Menunggu Validasi abu, Valid hijau */}
                        <td className="px-2 py-2.5 text-center align-top whitespace-nowrap">
                          {renderStatusBadge(item.status_canonical)}
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Pagination Controls */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <span>Baris per halaman:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-slate-400 pl-2">
                Halaman {currentPage} dari {totalPages}
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 2 + i;
                    if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                        currentPage === pageNum
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>
  );
}
