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
  Users,
  X,
  Eye,
  BookOpen
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

  // Detail Modal State
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);
  const [activeLogTab, setActiveLogTab] = useState('ALL');

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

  // Helper to resolve student advisors (Dospem 1 & 2)
  const getStudentAdvisors = (cleanNim, stdObj, studentConsultations = []) => {
    const assignment = (studentAdvisors || []).find(sa => 
      String(sa.nim || sa.student_nim || sa.mhs_nim || '').trim() === cleanNim
    );

    let p1Nip = assignment?.dospem1_nip || assignment?.pembimbing_1_nip || stdObj?.dospem1_nip || stdObj?.pembimbing_1_nip || '';
    let p2Nip = assignment?.dospem2_nip || assignment?.pembimbing_2_nip || stdObj?.dospem2_nip || stdObj?.pembimbing_2_nip || '';

    if (!p1Nip && studentConsultations.length > 0) {
      const c1 = studentConsultations.find(c => String(c.pembimbing || '').toLowerCase().includes('1'));
      if (c1) p1Nip = c1.dosen_nip || c1.id_dosen || '';
    }
    if (!p2Nip && studentConsultations.length > 0) {
      const c2 = studentConsultations.find(c => String(c.pembimbing || '').toLowerCase().includes('2'));
      if (c2) p2Nip = c2.dosen_nip || c2.id_dosen || '';
    }

    const p1Adv = p1Nip ? advisorMap.get(String(p1Nip).trim()) : null;
    const p2Adv = p2Nip ? advisorMap.get(String(p2Nip).trim()) : null;

    let p1Nama = p1Adv?.nama || assignment?.dospem1_nama || '';
    let p2Nama = p2Adv?.nama || assignment?.dospem2_nama || '';

    if (!p1Nama && studentConsultations.length > 0) {
      const c1 = studentConsultations.find(c => String(c.pembimbing || '').toLowerCase().includes('1'));
      if (c1?.dosen_nama) p1Nama = c1.dosen_nama;
    }
    if (!p2Nama && studentConsultations.length > 0) {
      const c2 = studentConsultations.find(c => String(c.pembimbing || '').toLowerCase().includes('2'));
      if (c2?.dosen_nama) p2Nama = c2.dosen_nama;
    }

    return {
      dospem1: {
        nama: p1Nama || '',
        nip: p1Nip || p1Adv?.nip || ''
      },
      dospem2: {
        nama: p2Nama || '',
        nip: p2Nip || p2Adv?.nip || ''
      }
    };
  };

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

  // Dynamic Angkatan list for Filter Dropdown (Angkatan unik, urut menurun, dinamis)
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

  // Group consultations by student NIM (Student-Based Recap)
  const studentRecapData = useMemo(() => {
    const groups = new Map();
    consultations.forEach(c => {
      const cleanNim = String(c.nim || c.mhs_nim || '').trim();
      if (!cleanNim) return;
      if (!groups.has(cleanNim)) {
        groups.set(cleanNim, []);
      }
      groups.get(cleanNim).push(c);
    });

    const result = [];

    groups.forEach((items, cleanNim) => {
      const std = studentMap.get(cleanNim);
      const studentName = std?.nama || items[0]?.mhs_nama || `Mahasiswa (${cleanNim})`;
      const angkatan = extractAngkatan(cleanNim, std);
      const statusMhs = extractStatusMhs(std);

      // Sort items chronologically: oldest to newest for urutan #1..#N
      const sortedAsc = [...items].sort((a, b) => {
        const da = a.tanggal || '';
        const db = b.tanggal || '';
        if (da !== db) return da.localeCompare(db);
        const ca = a.created_at || a.dibuat_pada || '';
        const cb = b.created_at || b.dibuat_pada || '';
        return ca.localeCompare(cb);
      });

      // Map with calculated urutan
      const consultationsWithUrutan = sortedAsc.map((item, idx) => {
        const urutan = item.urutan_bimbingan || (idx + 1);
        let dosenNama = item.dosen_nama;
        if (!dosenNama && (item.id_dosen || item.dosen_nip)) {
          const adv = advisorMap.get(String(item.id_dosen || item.dosen_nip).trim());
          dosenNama = adv?.nama;
        }
        if (!dosenNama) dosenNama = 'Dosen Pembimbing';

        const jenisRaw = item.jenis || item.metode || 'Luring';
        const jenis = String(jenisRaw).toLowerCase().includes('daring') || String(jenisRaw).toLowerCase().includes('online')
          ? 'Daring'
          : 'Luring';

        const canonicalStatus = normalizeStatusBimbingan(item.status);
        const catatanMhs = item.catatan || item.catatan_mahasiswa || item.bab_topik || '-';
        const tanggapanDosen = item.tanggapan_dosen || item.masukan_dosen || '';
        const formattedDate = formatTanggalWaktu(item);

        return {
          ...item,
          clean_nim: cleanNim,
          mhs_nama: studentName,
          dosen_nama: dosenNama,
          urutan_bimbingan: urutan,
          jenis: jenis,
          status_canonical: canonicalStatus,
          catatan: catatanMhs,
          tanggapan_dosen: tanggapanDosen,
          formatted_date_time: formattedDate
        };
      });

      // Sort newest to oldest for display inside modal
      const consultationsDesc = [...consultationsWithUrutan].reverse();
      const latestConsultation = consultationsDesc[0] || null;

      const totalSesi = consultationsWithUrutan.length;
      const validSesi = consultationsWithUrutan.filter(c => c.status_canonical === 'Valid').length;
      const revisiSesi = consultationsWithUrutan.filter(c => c.status_canonical.includes('Revisi')).length;
      const pendingSesi = consultationsWithUrutan.filter(c => c.status_canonical === 'Menunggu Validasi').length;

      const p1Sesi = consultationsWithUrutan.filter(c => 
        String(c.pembimbing || '').toLowerCase().includes('1')
      ).length;
      const p2Sesi = consultationsWithUrutan.filter(c => 
        String(c.pembimbing || '').toLowerCase().includes('2')
      ).length;

      const advisorsData = getStudentAdvisors(cleanNim, std, consultationsWithUrutan);

      result.push({
        id: cleanNim,
        clean_nim: cleanNim,
        mhs_nama: studentName,
        angkatan: angkatan,
        status_mahasiswa: statusMhs,
        prodi: std?.prodi || 'D3 Manajemen Informatika',
        dospem1: advisorsData.dospem1,
        dospem2: advisorsData.dospem2,
        total_bimbingan: totalSesi,
        valid_count: validSesi,
        revisi_count: revisiSesi,
        pending_count: pendingSesi,
        p1_count: p1Sesi,
        p2_count: p2Sesi,
        latest_consultation: latestConsultation,
        consultation_list: consultationsDesc
      });
    });

    // Sort students by latest consultation date descending
    return result.sort((a, b) => {
      const da = a.latest_consultation?.tanggal || '';
      const db = b.latest_consultation?.tanggal || '';
      if (da !== db) return db.localeCompare(da);
      return (b.total_bimbingan || 0) - (a.total_bimbingan || 0);
    });
  }, [consultations, studentMap, advisorMap, studentAdvisors]);

  // Filter students based on all filter parameters
  const filteredStudents = useMemo(() => {
    return studentRecapData.filter(student => {
      // 1. Search query: nama / NIM / catatan / dosen
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNama = student.mhs_nama.toLowerCase().includes(q);
        const matchNim = student.clean_nim.toLowerCase().includes(q);
        const matchP1 = student.dospem1.nama.toLowerCase().includes(q);
        const matchP2 = student.dospem2.nama.toLowerCase().includes(q);
        const matchNotes = student.consultation_list.some(c => 
          c.catatan.toLowerCase().includes(q) || 
          c.tanggapan_dosen.toLowerCase().includes(q) ||
          c.dosen_nama.toLowerCase().includes(q)
        );
        if (!matchNama && !matchNim && !matchP1 && !matchP2 && !matchNotes) {
          return false;
        }
      }

      // 2. Dropdown Dosen
      if (selectedDosen !== 'all') {
        const sel = selectedDosen.toLowerCase();
        const matchP1 = student.dospem1.nama.toLowerCase() === sel || student.dospem1.nip === selectedDosen;
        const matchP2 = student.dospem2.nama.toLowerCase() === sel || student.dospem2.nip === selectedDosen;
        const matchSessionDosen = student.consultation_list.some(c => 
          c.dosen_nama.toLowerCase() === sel || c.dosen_nip === selectedDosen || c.id_dosen === selectedDosen
        );
        if (!matchP1 && !matchP2 && !matchSessionDosen) {
          return false;
        }
      }

      // 3. Dropdown Angkatan
      if (selectedAngkatan !== 'all') {
        if (student.angkatan !== selectedAngkatan) {
          return false;
        }
      }

      // 4. Dropdown Status Mahasiswa
      if (selectedStatusMhs !== 'all') {
        if (student.status_mahasiswa.toLowerCase() !== selectedStatusMhs.toLowerCase()) {
          return false;
        }
      }

      // 5. Dropdown Jenis: Daring / Luring
      if (selectedJenis !== 'all') {
        const hasJenis = student.consultation_list.some(c => 
          c.jenis.toLowerCase() === selectedJenis.toLowerCase()
        );
        if (!hasJenis) return false;
      }

      // 6. Dropdown Status Bimbingan
      if (selectedStatusBimbingan !== 'all') {
        const hasStatus = student.consultation_list.some(c => 
          c.status_canonical === selectedStatusBimbingan
        );
        if (!hasStatus) return false;
      }

      // 7. Tanggal dari
      if (dateFrom) {
        const hasAfter = student.consultation_list.some(c => 
          (c.tanggal || '') >= dateFrom
        );
        if (!hasAfter) return false;
      }

      // 8. Tanggal sampai
      if (dateTo) {
        const hasBefore = student.consultation_list.some(c => 
          (c.tanggal || '') <= dateTo
        );
        if (!hasBefore) return false;
      }

      return true;
    });
  }, [
    studentRecapData,
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
  const totalItems = filteredStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDosen, selectedAngkatan, selectedStatusMhs, selectedJenis, selectedStatusBimbingan, dateFrom, dateTo]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Reset Filter
  const handleReset = () => {
    setSearchQuery('');
    setSelectedDosen('all');
    setSelectedAngkatan('all');
    setSelectedStatusMhs('Aktif');
    setSelectedJenis('all');
    setSelectedStatusBimbingan('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  // =========================================================================
  // EXPORT HANDLERS (CSV, EXCEL, PDF) - Student-Based Recap
  // =========================================================================

  const getExportDataRows = () => {
    return filteredStudents.map((s, idx) => ({
      no: idx + 1,
      nim: s.clean_nim,
      nama: s.mhs_nama,
      angkatan: s.angkatan || '-',
      statusMhs: s.status_mahasiswa,
      pembimbing1: s.dospem1.nama ? `${s.dospem1.nama} (NIP. ${s.dospem1.nip || '-'})` : '-',
      pembimbing2: s.dospem2.nama ? `${s.dospem2.nama} (NIP. ${s.dospem2.nip || '-'})` : '-',
      totalBimbingan: `${s.total_bimbingan} Sesi`,
      validCount: `${s.valid_count} Sesi`,
      revisiCount: `${s.revisi_count} Sesi`,
      terakhirBimbingan: s.latest_consultation?.formatted_date_time || '-',
      statusTerakhir: s.latest_consultation?.status_canonical || '-'
    }));
  };

  // 1. Export CSV (Hijau)
  const handleExportCSV = () => {
    if (filteredStudents.length === 0) {
      alert('Tidak ada data untuk diekspor!');
      return;
    }

    const headers = [
      'No',
      'NIM',
      'Nama Mahasiswa',
      'Angkatan',
      'Status Mahasiswa',
      'Pembimbing 1',
      'Pembimbing 2',
      'Total Bimbingan',
      'Valid (ACC)',
      'Perlu Revisi',
      'Bimbingan Terakhir',
      'Status Sesi Terakhir'
    ];

    const rows = getExportDataRows().map(r => [
      r.no,
      `'${r.nim}`,
      `"${r.nama}"`,
      `"${r.angkatan}"`,
      `"${r.statusMhs}"`,
      `"${r.pembimbing1}"`,
      `"${r.pembimbing2}"`,
      `"${r.totalBimbingan}"`,
      `"${r.validCount}"`,
      `"${r.revisiCount}"`,
      `"${r.terakhirBimbingan}"`,
      `"${r.statusTerakhir}"`
    ].join(','));

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rekap_bimbingan_mahasiswa_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2. Export Excel (Hijau)
  const handleExportExcel = () => {
    if (filteredStudents.length === 0) {
      alert('Tidak ada data untuk diekspor!');
      return;
    }

    const rowsHtml = getExportDataRows().map((r, i) => `
      <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${r.no}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold; mso-number-format:'\\@';">${r.nim}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">${r.nama}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${r.angkatan}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${r.statusMhs}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px;">${r.pembimbing1}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px;">${r.pembimbing2}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">${r.totalBimbingan}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${r.terakhirBimbingan}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">${r.statusTerakhir}</td>
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
        <div class="title">REKAPITULASI BIMBINGAN MAHASISWA TUGAS AKHIR</div>
        <div class="subtitle">Program Studi D3 Manajemen Informatika - Fakultas Ilmu Komputer Universitas Sriwijaya | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}</div>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>NIM</th>
              <th>Nama Mahasiswa</th>
              <th>Angkatan</th>
              <th>Status Mhs</th>
              <th>Pembimbing 1</th>
              <th>Pembimbing 2</th>
              <th>Total Bimbingan</th>
              <th>Bimbingan Terakhir</th>
              <th>Status Terakhir</th>
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
    link.setAttribute('download', `rekap_bimbingan_mahasiswa_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 3. Export PDF (Merah - Printable Official Letterhead)
  const handleExportPDF = () => {
    if (filteredStudents.length === 0) {
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
        <td><strong>${r.nama}</strong><br><small style="color: #64748b;">${r.nim} ('${String(r.angkatan).slice(-2)})</small></td>
        <td>1. ${r.pembimbing1}<br>2. ${r.pembimbing2}</td>
        <td style="text-align: center;"><strong>${r.totalBimbingan}</strong><br><small style="color: #16a34a;">(${r.validCount} Valid)</small></td>
        <td>${r.terakhirBimbingan}</td>
        <td style="text-align: center;"><strong>${r.statusTerakhir}</strong></td>
        <td style="text-align: center;">${r.statusMhs}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rekapitulasi Bimbingan Mahasiswa - FASILKOM UNSRI</title>
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
          <p>Laporan Rekapitulasi Progres Bimbingan Tugas Akhir Mahasiswa (Monitoring Kaprodi)</p>
        </div>
        <div class="meta">
          <div>
            <strong>Total Mahasiswa:</strong> ${filteredStudents.length} mahasiswa<br>
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
              <th style="width: 150px;">Mahasiswa</th>
              <th>Dosen Pembimbing</th>
              <th style="width: 90px; text-align: center;">Total Sesi</th>
              <th style="width: 110px;">Terakhir Bimbingan</th>
              <th style="width: 90px; text-align: center;">Status Terakhir</th>
              <th style="width: 70px; text-align: center;">Status Mhs</th>
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
                Menampilkan <strong className="font-bold text-slate-900 font-mono">{filteredStudents.length}</strong> dari {studentRecapData.length} mahasiswa
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold border border-indigo-200 font-mono text-xs">
                {filteredStudents.length} mahasiswa
              </span>
            </div>

          </div>

        </div>

        {/* ===================================================================
            3. TABEL REKAP BIMBINGAN BERBASIS MAHASISWA
               Kolom: No, Mahasiswa, Angkatan, Dosen Pembimbing, Total Bimbingan, Bimbingan Terakhir, Status Mahasiswa, Aksi
            =================================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              
              {/* Sticky Table Header */}
              <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs text-slate-700 uppercase tracking-wider text-[10.5px] font-extrabold border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-3 py-3 w-10 text-center">No</th>
                  <th scope="col" className="px-3 py-3 min-w-[170px]">Mahasiswa</th>
                  <th scope="col" className="px-3 py-3 w-24 text-center">Angkatan</th>
                  <th scope="col" className="px-3 py-3 min-w-[210px]">Dosen Pembimbing</th>
                  <th scope="col" className="px-3 py-3 w-32 text-center">Total Bimbingan</th>
                  <th scope="col" className="px-3 py-3 min-w-[160px]">Bimbingan Terakhir</th>
                  <th scope="col" className="px-3 py-3 w-28 text-center">Status</th>
                  <th scope="col" className="px-3 py-3 w-24 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                        <span className="text-xs font-semibold text-slate-500">Memuat data bimbingan...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                          <Inbox className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">Tidak ada data mahasiswa bimbingan</p>
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
                  paginatedData.map((student, index) => {
                    const rowNumber = (currentPage - 1) * pageSize + index + 1;
                    return (
                      <tr 
                        key={student.clean_nim || index}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* 1. No */}
                        <td className="px-3 py-3.5 text-center text-slate-400 font-mono text-xs align-middle">
                          {rowNumber}
                        </td>

                        {/* 2. Mahasiswa: Nama & NIM */}
                        <td className="px-3 py-3.5 align-middle">
                          <div className="min-w-0">
                            <span className="font-extrabold text-slate-900 block text-xs leading-snug break-words">
                              {student.mhs_nama}
                            </span>
                            <span className="text-slate-500 font-mono text-[11px] block mt-0.5">
                              {student.clean_nim}
                            </span>
                          </div>
                        </td>

                        {/* 3. Angkatan */}
                        <td className="px-3 py-3.5 text-center align-middle whitespace-nowrap">
                          <span className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-200/60">
                            {student.angkatan || '-'}
                          </span>
                        </td>

                        {/* 4. Dosen Pembimbing (1 & 2) */}
                        <td className="px-3 py-3.5 align-middle">
                          <div className="space-y-1">
                            {/* Pembimbing 1 */}
                            <div className="flex items-start space-x-1.5 min-w-0">
                              <span className="w-3.5 h-3.5 rounded bg-indigo-50 text-indigo-700 font-black text-[9px] flex items-center justify-center shrink-0 border border-indigo-200 mt-0.5">
                                1
                              </span>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 text-[11.5px] truncate max-w-[210px]" title={student.dospem1.nama || 'Belum Ditentukan'}>
                                  {student.dospem1.nama || <span className="text-slate-400 font-normal italic">Belum Ditentukan</span>}
                                </p>
                                {student.dospem1.nip && (
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    NIP. {student.dospem1.nip}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Pembimbing 2 */}
                            <div className="flex items-start space-x-1.5 min-w-0">
                              <span className="w-3.5 h-3.5 rounded bg-blue-50 text-blue-700 font-black text-[9px] flex items-center justify-center shrink-0 border border-blue-200 mt-0.5">
                                2
                              </span>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 text-[11.5px] truncate max-w-[210px]" title={student.dospem2.nama || 'Belum Ditentukan'}>
                                  {student.dospem2.nama || <span className="text-slate-400 font-normal italic">Belum Ditentukan</span>}
                                </p>
                                {student.dospem2.nip && (
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    NIP. {student.dospem2.nip}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 5. Total Bimbingan */}
                        <td className="px-3 py-3.5 text-center align-middle whitespace-nowrap">
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-black text-xs font-mono border border-indigo-200/80">
                              {student.total_bimbingan} Sesi
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium mt-1">
                              P1: {student.p1_count} • P2: {student.p2_count}
                            </span>
                          </div>
                        </td>

                        {/* 6. Bimbingan Terakhir */}
                        <td className="px-3 py-3.5 align-middle">
                          {student.latest_consultation ? (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1 text-slate-800 font-bold text-xs">
                                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{student.latest_consultation.formatted_date_time}</span>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono font-bold text-[9.5px]">
                                  #{student.latest_consultation.urutan_bimbingan}
                                </span>
                                {renderStatusBadge(student.latest_consultation.status_canonical)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">-</span>
                          )}
                        </td>

                        {/* 7. Status Mahasiswa */}
                        <td className="px-3 py-3.5 text-center align-middle whitespace-nowrap">
                          {(() => {
                            const s = String(student.status_mahasiswa || 'Aktif').toLowerCase();
                            const isAktif = s === 'aktif';
                            const isLulus = s === 'lulus';
                            return (
                              <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold border ${
                                isAktif
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : isLulus
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-300'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  isAktif ? 'bg-emerald-500' : isLulus ? 'bg-blue-500' : 'bg-slate-400'
                                }`} />
                                <span>{student.status_mahasiswa}</span>
                              </span>
                            );
                          })()}
                        </td>

                        {/* 8. Aksi: Button Detail */}
                        <td className="px-3 py-3.5 text-center align-middle whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentDetail(student);
                              setActiveLogTab('ALL');
                            }}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                            title="Buka Detail Log Bimbingan Mahasiswa"
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </button>
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

  
      {/* ===================================================================
          MODAL DETAIL LOG BIMBINGAN MAHASISWA
          =================================================================== */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0 bg-slate-50/60 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Detail Log Bimbingan Mahasiswa</h3>
                  <p className="text-xs text-slate-500">Riwayat sesi konsultasi, catatan materi bimbingan, arahan dosen, serta progres tugas akhir</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedStudentDetail(null); setActiveLogTab('ALL'); }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Scrollable */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              
              {/* Student Profile & Advisor Card */}
              <div className="bg-gradient-to-br from-slate-50 via-indigo-50/30 to-blue-50/40 rounded-2xl border border-indigo-100/80 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-indigo-600/20">
                      {selectedStudentDetail.mhs_nama.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-base leading-tight">
                        {selectedStudentDetail.mhs_nama}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="font-mono text-xs font-bold text-slate-600 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                          NIM: {selectedStudentDetail.clean_nim}
                        </span>
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md border border-indigo-200">
                          Angkatan {selectedStudentDetail.angkatan}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          {selectedStudentDetail.prodi}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Mahasiswa Pill */}
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                    selectedStudentDetail.status_mahasiswa === 'Aktif'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    <span className={`w-2 h-2 rounded-full mr-1.5 ${
                      selectedStudentDetail.status_mahasiswa === 'Aktif' ? 'bg-emerald-500' : 'bg-slate-400'
                    }`} />
                    Status: {selectedStudentDetail.status_mahasiswa}
                  </span>
                </div>

                {/* Dosen Pembimbing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-indigo-100/70">
                  {/* Pembimbing 1 */}
                  <div className="bg-white/90 rounded-xl p-3 border border-slate-200 shadow-2xs">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="w-4 h-4 rounded bg-indigo-50 text-indigo-700 font-black text-[10px] flex items-center justify-center border border-indigo-200">
                        1
                      </span>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                        Dosen Pembimbing 1
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 text-xs">
                      {selectedStudentDetail.dospem1.nama || <span className="text-slate-400 italic">Belum Ditentukan</span>}
                    </p>
                    {selectedStudentDetail.dospem1.nip && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        NIP. {selectedStudentDetail.dospem1.nip}
                      </p>
                    )}
                  </div>

                  {/* Pembimbing 2 */}
                  <div className="bg-white/90 rounded-xl p-3 border border-slate-200 shadow-2xs">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="w-4 h-4 rounded bg-blue-50 text-blue-700 font-black text-[10px] flex items-center justify-center border border-blue-200">
                        2
                      </span>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                        Dosen Pembimbing 2
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 text-xs">
                      {selectedStudentDetail.dospem2.nama || <span className="text-slate-400 italic">Belum Ditentukan</span>}
                    </p>
                    {selectedStudentDetail.dospem2.nip && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        NIP. {selectedStudentDetail.dospem2.nip}
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Stats Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div className="bg-white/90 rounded-xl p-2.5 border border-slate-200 text-center">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total Bimbingan</span>
                    <span className="text-base font-black text-slate-900 font-mono">{selectedStudentDetail.total_bimbingan} Sesi</span>
                  </div>
                  <div className="bg-white/90 rounded-xl p-2.5 border border-emerald-200 text-center">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-600 block">Valid (ACC)</span>
                    <span className="text-base font-black text-emerald-700 font-mono">{selectedStudentDetail.valid_count} Sesi</span>
                  </div>
                  <div className="bg-white/90 rounded-xl p-2.5 border border-amber-200 text-center">
                    <span className="text-[10px] font-extrabold uppercase text-amber-600 block">Perlu Revisi</span>
                    <span className="text-base font-black text-amber-700 font-mono">{selectedStudentDetail.revisi_count} Sesi</span>
                  </div>
                  <div className="bg-white/90 rounded-xl p-2.5 border border-blue-200 text-center">
                    <span className="text-[10px] font-extrabold uppercase text-blue-600 block">Terakhir Bimbingan</span>
                    <span className="text-xs font-bold text-slate-800 block mt-1 truncate">
                      {selectedStudentDetail.latest_consultation?.tanggal || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section: Log Bimbingan */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex items-center space-x-2">
                    <h5 className="font-extrabold text-slate-900 text-sm">
                      Log Riwayat Bimbingan
                    </h5>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-mono font-bold text-xs">
                      {selectedStudentDetail.consultation_list.length} sesi
                    </span>
                  </div>

                  {/* Filter Tabs inside modal */}
                  <div className="flex items-center space-x-1 overflow-x-auto text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveLogTab('ALL')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        activeLogTab === 'ALL'
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Semua ({selectedStudentDetail.consultation_list.length})
                    </button>
                    {selectedStudentDetail.p1_count > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveLogTab('P1')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          activeLogTab === 'P1'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Pembimbing 1 ({selectedStudentDetail.p1_count})
                      </button>
                    )}
                    {selectedStudentDetail.p2_count > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveLogTab('P2')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          activeLogTab === 'P2'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Pembimbing 2 ({selectedStudentDetail.p2_count})
                      </button>
                    )}
                  </div>
                </div>

                {/* Cards List of Consultations */}
                <div className="space-y-3">
                  {(() => {
                    let logs = selectedStudentDetail.consultation_list;
                    if (activeLogTab === 'P1') {
                      logs = logs.filter(c => String(c.pembimbing || '').toLowerCase().includes('1'));
                    } else if (activeLogTab === 'P2') {
                      logs = logs.filter(c => String(c.pembimbing || '').toLowerCase().includes('2'));
                    }

                    if (logs.length === 0) {
                      return (
                        <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <p className="text-xs font-semibold">Tidak ada sesi bimbingan pada filter ini.</p>
                        </div>
                      );
                    }

                    return logs.map((item, idx) => (
                      <div 
                        key={item.id || idx}
                        className="bg-white rounded-xl border border-slate-200 hover:border-indigo-200 p-4 space-y-3 shadow-2xs transition-all"
                      >
                        {/* Top Line: Session Order, Date, Method, Status */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-black text-xs font-mono border border-indigo-200">
                              Bimbingan #{item.urutan_bimbingan}
                            </span>
                            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{item.formatted_date_time}</span>
                            </div>
                            <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.jenis === 'Daring'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {item.jenis === 'Daring' ? <Video className="w-2.5 h-2.5" /> : <Users className="w-2.5 h-2.5" />}
                              <span>{item.jenis}</span>
                            </span>
                          </div>

                          <div>
                            {renderStatusBadge(item.status_canonical)}
                          </div>
                        </div>

                        {/* Lecturer Info */}
                        <div className="flex items-center space-x-2 text-xs">
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800">
                              {item.dosen_nama}
                            </span>
                            <span className="text-[11px] text-slate-400 ml-1.5 font-mono">
                              ({item.pembimbing || 'Dosen Pembimbing'})
                            </span>
                          </div>
                        </div>

                        {/* Notes & Feedback */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          {/* Student Note */}
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-slate-600 flex items-center space-x-1">
                              <FileText className="w-3.5 h-3.5 text-slate-400" />
                              <span>Catatan / Materi Mahasiswa:</span>
                            </span>
                            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-700 leading-relaxed min-h-[50px] whitespace-pre-wrap break-words">
                              {item.catatan || <span className="text-slate-400 italic">Tidak ada catatan</span>}
                            </div>
                          </div>

                          {/* Lecturer Feedback */}
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-blue-800 flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                              <span>Tanggapan / Arahan Dosen:</span>
                            </span>
                            <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl p-3 text-xs text-blue-950 font-medium leading-relaxed min-h-[50px] whitespace-pre-wrap break-words">
                              {item.tanggapan_dosen || <span className="text-slate-400 font-normal italic">Belum ada catatan tanggapan dari dosen</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 px-6 py-3.5 flex items-center justify-between bg-slate-50 rounded-b-2xl shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Total {selectedStudentDetail.consultation_list.length} catatan bimbingan tersimpan
              </span>
              <button
                type="button"
                onClick={() => { setSelectedStudentDetail(null); setActiveLogTab('ALL'); }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
