/**
 * SIMTA - Kaprodi Bimbingan Dashboard Analytics Data Engine
 * Menyediakan agregasi metrik ringkasan kondisi bimbingan seluruh prodi D3 Manajemen Informatika
 */

export const MONTH_NAMES = [
  { key: '2026-01', name: 'Januari 2026', short: 'Jan', labelMMYYYY: '01/2026' },
  { key: '2026-02', name: 'Februari 2026', short: 'Feb', labelMMYYYY: '02/2026' },
  { key: '2026-03', name: 'Maret 2026', short: 'Mar', labelMMYYYY: '03/2026' },
  { key: '2026-04', name: 'April 2026', short: 'Apr', labelMMYYYY: '04/2026' },
  { key: '2026-05', name: 'Mei 2026', short: 'Mei', labelMMYYYY: '05/2026' },
  { key: '2026-06', name: 'Juni 2026', short: 'Jun', labelMMYYYY: '06/2026' },
  { key: '2026-07', name: 'Juli 2026', short: 'Jul', labelMMYYYY: '07/2026' },
  { key: '2026-08', name: 'Agustus 2026', short: 'Ags', labelMMYYYY: '08/2026' },
  { key: '2026-09', name: 'September 2026', short: 'Sep', labelMMYYYY: '09/2026' },
  { key: '2026-10', name: 'Oktober 2026', short: 'Okt', labelMMYYYY: '10/2026' },
];

// Sample realistic topics for consultations
const SAMPLE_TOPICS = [
  'Bab 1 - Latar Belakang & Batasan Masalah',
  'Bab 1 - Perumusan Masalah & Tujuan Penelitian',
  'Bab 2 - Kajian Pustaka & State-of-the-Art',
  'Bab 2 - Landasan Teori Algoritma & Arsitektur',
  'Bab 3 - Metodologi, Flowchart & Use Case',
  'Bab 3 - Perancangan Basis Data (ERD & DFD)',
  'Bab 3 - Desain Antarmuka Pengguna (UI/UX Mockup)',
  'Bab 4 - Implementasi Backend API & Frontend',
  'Bab 4 - Pengujian Fungsional Black Box Testing',
  'Bab 4 - Analisis Kecepatan & Pengujian UAT',
  'Bab 5 - Kesimpulan, Saran & Draf Laporan Akhir'
];

const SAMPLE_FEEDBACK = [
  'Format penulisan sudah sesuai panduan TA. Lanjutkan bab berikutnya.',
  'Perjelas batasan masalah sistem pada sub-bab 1.2.',
  'Tambahkan referensi jurnal terindeks 3 tahun terakhir.',
  'Perbaiki relasi ERD pada entitas transaksi dan relasi many-to-many.',
  'Desain antarmuka sudah clean dan responsif. Siapkan draf pengujian.',
  'Perbaiki tabel pengujian black box dan sertakan screenshot error handling.',
  'Hasil UAT memuaskan. Lengkapi abstrak bahasa Indonesia dan Inggris.',
  'Perlu perbaikan struktur kalimat pada Bab 4.3.',
  'Revisi minor pada diagram alur data telah diverifikasi.',
  'Draf laporan akhir telah disetujui untuk pendaftaran sidang.'
];

/**
 * Deterministic PRNG to generate consistent, realistic data based on seed
 */
function pseudoRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generate comprehensive monthly consultation log records
 */
export function generateMonthlyConsultationLogs(advisors = [], studentAdvisors = []) {
  const logsByMonth = {};
  
  MONTH_NAMES.forEach(m => {
    logsByMonth[m.key] = [];
  });

  if (!studentAdvisors.length || !advisors.length) {
    return logsByMonth;
  }

  // Pre-index advisors by NIP
  const advisorMap = new Map();
  advisors.forEach(a => advisorMap.set(a.nip, a));

  let globalIdCounter = 1;
  const totalStudents = studentAdvisors.length;
  // Approximately 68% (e.g. 75 of 110) fulfill the >= 24 consultations criteria
  const targetCompletedCount = Math.round(totalStudents * 0.682);

  // Generate sessions per student based on their progress cohort
  studentAdvisors.forEach((student, studentIdx) => {
    const isCompleted = studentIdx < targetCompletedCount;
    // Students who met target have 24 - 31 sessions; in-progress students have 11 - 22 sessions
    const totalStudentSessions = isCompleted 
      ? 24 + (studentIdx % 8) 
      : 11 + (studentIdx % 12);

    const adv1 = advisorMap.get(student.dospem1_nip) || advisors[0];
    const adv2 = advisorMap.get(student.dospem2_nip) || advisors[1 % advisors.length];

    for (let s = 0; s < totalStudentSessions; s++) {
      // Map session index across the 10 months (Jan - Oct)
      const mIdx = Math.min(9, Math.floor((s / totalStudentSessions) * 10));
      const monthObj = MONTH_NAMES[mIdx];
      const yearMonth = monthObj.key;
      const daysInMonth = mIdx === 1 ? 28 : (mIdx === 3 || mIdx === 5 || mIdx === 8 ? 30 : 31);

      // Alternate between P1 and P2
      const isP1 = (s % 2 === 0);
      const adv = isP1 ? adv1 : adv2;
      const roleLabel = isP1 ? 'Pembimbing 1' : 'Pembimbing 2';

      const daySeed = pseudoRandom(studentIdx * 43 + s * 17);
      const day = Math.min(daysInMonth, Math.max(1, Math.floor(daySeed * daysInMonth) + 1));
      const dayFormatted = String(day).padStart(2, '0');
      const tanggal = `${yearMonth}-${dayFormatted}`;

      const hour = 8 + Math.floor(pseudoRandom(studentIdx * 29 + s * 13) * 8);
      const minute = pseudoRandom(studentIdx * 31 + s * 19) > 0.5 ? '30' : '00';
      const waktu = `${String(hour).padStart(2, '0')}:${minute} WIB`;

      // Status distribution: Menunggu Validasi (8%), Revisi Mayor (14%), Revisi Minor (23%), Disetujui (55%)
      const statusRand = pseudoRandom(studentIdx * 53 + s * 37);
      let status = 'disetujui';
      if (statusRand < 0.08) status = 'menunggu_validasi';
      else if (statusRand < 0.22) status = 'revisi_mayor';
      else if (statusRand < 0.45) status = 'revisi_minor';

      // Method: Daring (42%) vs Luring (58%)
      const metode = pseudoRandom(studentIdx * 19 + s * 23) < 0.42 ? 'Daring' : 'Luring';

      const topicIdx = Math.min(SAMPLE_TOPICS.length - 1, Math.floor((s / totalStudentSessions) * SAMPLE_TOPICS.length));
      const feedbackIdx = (studentIdx + s) % SAMPLE_FEEDBACK.length;

      logsByMonth[monthObj.key].push({
        id: `cons-auto-${globalIdCounter++}`,
        tanggal,
        waktu,
        mhs_nim: student.student_nim,
        mhs_nama: student.student_nama,
        mhs_kelas: (studentIdx % 3 === 0) ? 'MI 5A' : (studentIdx % 3 === 1 ? 'MI 5B' : 'MI 5C'),
        dosen_nip: adv.nip,
        dosen_nama: adv.nama,
        pembimbing: roleLabel,
        metode,
        status,
        bab_topik: SAMPLE_TOPICS[topicIdx],
        catatan_mahasiswa: `Konsultasi progres pengerjaan ${SAMPLE_TOPICS[topicIdx]} dan penyelarasan draf laporan tugas akhir.`,
        masukan_dosen: SAMPLE_FEEDBACK[feedbackIdx],
        created_at: `${tanggal}T${String(hour).padStart(2, '0')}:${minute}:00Z`
      });
    }
  });

  // Sort logs inside each month by date descending
  MONTH_NAMES.forEach(monthObj => {
    logsByMonth[monthObj.key].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  });

  return logsByMonth;
}

/**
 * Calculates all summary stats for Kaprodi Dashboard
 */
export function calculateBimbinganDashboardStats(advisors = [], studentAdvisors = [], liveConsultations = [], thesisTitles = [], registeredUsers = []) {
  // 1. Dosen Count
  const totalDosen = advisors.length || 13;

  // 2. Mahasiswa Count
  const totalMahasiswa = studentAdvisors.length || 110;
  const totalMahasiswaProdi = registeredUsers.filter(u => u.role === 'mahasiswa').length || 223;

  // 3. Generate or merge consultation logs
  const monthlyLogs = generateMonthlyConsultationLogs(advisors, studentAdvisors);
  
  // Merge any live consultations from auth context into monthlyLogs
  if (Array.isArray(liveConsultations) && liveConsultations.length > 0) {
    liveConsultations.forEach(lc => {
      const dateStr = lc.tanggal || (lc.created_at ? lc.created_at.slice(0, 10) : '2026-10-15');
      const monthKey = dateStr.slice(0, 7);
      if (monthlyLogs[monthKey]) {
        // Prevent duplicate IDs
        if (!monthlyLogs[monthKey].some(item => item.id === lc.id)) {
          monthlyLogs[monthKey].unshift({
            id: lc.id,
            tanggal: dateStr,
            waktu: lc.waktu ? `${lc.waktu} WIB` : '10:00 WIB',
            mhs_nim: lc.mhs_nim,
            mhs_nama: lc.mhs_nama,
            mhs_kelas: 'MI 5A',
            dosen_nip: lc.dosen_nip || '197805122005011002',
            dosen_nama: lc.dosen_nama || 'Dr. Ir. Hendra Kusuma, M.T.',
            pembimbing: lc.pembimbing || 'Pembimbing 1',
            metode: lc.metode || 'Luring',
            status: lc.status || 'disetujui',
            bab_topik: lc.bab_topik || 'Bab 1 - Pendahuluan',
            catatan_mahasiswa: lc.catatan_mahasiswa || '-',
            masukan_dosen: lc.masukan_dosen || '-',
            created_at: lc.created_at || `${dateStr}T10:00:00Z`
          });
        }
      }
    });
  }

  // Flatten all consultations
  const allConsultations = Object.values(monthlyLogs).flat();
  const totalBimbingan = allConsultations.length;

  // Rata-rata bimbingan per mahasiswa
  const rataRataPerMahasiswa = totalMahasiswa > 0 ? (totalBimbingan / totalMahasiswa).toFixed(1) : '0';

  // Count consultations per student for requirement: "persentase mahasiswa yang sudah memenuhi ≥24 bimbingan"
  const studentConsultationCounts = new Map();
  studentAdvisors.forEach(sa => {
    studentConsultationCounts.set(sa.student_nim, 0);
  });

  allConsultations.forEach(c => {
    if (studentConsultationCounts.has(c.mhs_nim)) {
      studentConsultationCounts.set(c.mhs_nim, studentConsultationCounts.get(c.mhs_nim) + 1);
    } else {
      studentConsultationCounts.set(c.mhs_nim, 1);
    }
  });

  let memenuhiTarget24Count = 0;
  studentConsultationCounts.forEach(count => {
    if (count >= 24) memenuhiTarget24Count++;
  });

  const persenMemenuhiTarget24 = totalMahasiswa > 0 ? Math.round((memenuhiTarget24Count / totalMahasiswa) * 100) : 0;
  const belumMemenuhiCount = Math.max(0, totalMahasiswa - memenuhiTarget24Count);

  // 4. Status Mahasiswa (Aktif, Lulus, Tidak Aktif - Input via Excel)
  // Berdasarkan data master D3 MI
  const mhsAktifCount = 82;
  const mhsLulusCount = 21;
  const mhsTidakAktifCount = 7;
  const totalStatusMhs = mhsAktifCount + mhsLulusCount + mhsTidakAktifCount;

  const studentStatusStats = {
    aktif: mhsAktifCount,
    lulus: mhsLulusCount,
    tidakAktif: mhsTidakAktifCount,
    total: totalStatusMhs,
    persenAktif: Math.round((mhsAktifCount / totalStatusMhs) * 100),
    persenLulus: Math.round((mhsLulusCount / totalStatusMhs) * 100),
    persenTidakAktif: Math.round((mhsTidakAktifCount / totalStatusMhs) * 100),
    excelMeta: {
      fileName: 'Data_Master_Mahasiswa_TA_D3_MI_2026.xlsx',
      lastSync: '14 Oktober 2026, 09:45 WIB',
      totalRows: totalStatusMhs,
      importedBy: 'Kaprodi D3 Manajemen Informatika',
      keterangan: 'Data mahasiswa diinput dan disinkronkan oleh Prodi melalui berkas Excel master.'
    }
  };

  // 5. Beban Bimbingan per Dosen (P1 vs P2)
  const advisorWorkloads = advisors.map(adv => {
    const p1Count = studentAdvisors.filter(sa => sa.dospem1_nip === adv.nip).length;
    const p2Count = studentAdvisors.filter(sa => sa.dospem2_nip === adv.nip).length;
    const totalBeban = p1Count + p2Count;
    const selisih = Math.abs(p1Count - p2Count);

    let ketimpanganLevel = 'balanced';
    let ketimpanganLabel = 'Beban Seimbang';
    let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';

    if (selisih >= 8 || p1Count === 0 || p2Count === 0) {
      ketimpanganLevel = 'high';
      ketimpanganLabel = 'Timpang Tinggi';
      badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
    } else if (selisih >= 4) {
      ketimpanganLevel = 'medium';
      ketimpanganLabel = 'Cukup Timpang';
      badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
    }

    return {
      nip: adv.nip,
      nama: adv.nama,
      jabatan: adv.jabatan_fungsional,
      keahlian: Array.isArray(adv.keahlian) ? adv.keahlian : [adv.keahlian || 'Sistem Informasi'],
      p1Count,
      p2Count,
      totalBeban,
      selisih,
      ketimpanganLevel,
      ketimpanganLabel,
      badgeClass
    };
  });

  // Urutkan default berdasarkan total beban tertinggi
  advisorWorkloads.sort((a, b) => b.totalBeban - a.totalBeban);

  const totalTimpang = advisorWorkloads.filter(a => a.ketimpanganLevel === 'high').length;
  const totalSeimbang = advisorWorkloads.filter(a => a.ketimpanganLevel === 'balanced').length;

  // 6. Chart Bimbingan per Bulan
  const monthlyChartData = MONTH_NAMES.map(mObj => {
    const logs = monthlyLogs[mObj.key] || [];
    const daring = logs.filter(l => l.metode === 'Daring').length;
    const luring = logs.filter(l => l.metode === 'Luring').length;
    const uniqueStudents = new Set(logs.map(l => l.mhs_nim)).size;
    const uniqueAdvisors = new Set(logs.map(l => l.dosen_nip)).size;

    return {
      key: mObj.key,
      name: mObj.name,
      short: mObj.short,
      labelMMYYYY: mObj.labelMMYYYY || `${mObj.key.slice(5, 7)}/${mObj.key.slice(0, 4)}`,
      total: logs.length,
      daringCount: daring,
      luringCount: luring,
      uniqueStudentsCount: uniqueStudents,
      uniqueLecturersCount: uniqueAdvisors,
      consultations: logs
    };
  });

  // 7. Chart Status & Jenis Bimbingan
  const statusCounts = {
    menunggu_validasi: allConsultations.filter(c => c.status === 'menunggu_validasi').length,
    revisi_mayor: allConsultations.filter(c => c.status === 'revisi_mayor').length,
    revisi_minor: allConsultations.filter(c => c.status === 'revisi_minor').length,
    disetujui: allConsultations.filter(c => c.status === 'disetujui').length,
  };

  const totalStatusThree = statusCounts.menunggu_validasi + statusCounts.revisi_mayor + statusCounts.revisi_minor;
  const statusDonutItems = [
    {
      id: 'menunggu_validasi',
      label: 'Menunggu Validasi',
      count: statusCounts.menunggu_validasi,
      color: '#f59e0b', // Amber
      percentage: totalStatusThree > 0 ? ((statusCounts.menunggu_validasi / totalStatusThree) * 100).toFixed(1) : '0',
      totalPercentage: totalBimbingan > 0 ? ((statusCounts.menunggu_validasi / totalBimbingan) * 100).toFixed(1) : '0'
    },
    {
      id: 'revisi_mayor',
      label: 'Revisi Mayor',
      count: statusCounts.revisi_mayor,
      color: '#f43f5e', // Rose/Red
      percentage: totalStatusThree > 0 ? ((statusCounts.revisi_mayor / totalStatusThree) * 100).toFixed(1) : '0',
      totalPercentage: totalBimbingan > 0 ? ((statusCounts.revisi_mayor / totalBimbingan) * 100).toFixed(1) : '0'
    },
    {
      id: 'revisi_minor',
      label: 'Revisi Minor',
      count: statusCounts.revisi_minor,
      color: '#6366f1', // Indigo
      percentage: totalStatusThree > 0 ? ((statusCounts.revisi_minor / totalStatusThree) * 100).toFixed(1) : '0',
      totalPercentage: totalBimbingan > 0 ? ((statusCounts.revisi_minor / totalBimbingan) * 100).toFixed(1) : '0'
    }
  ];

  const totalDaring = allConsultations.filter(c => c.metode === 'Daring').length;
  const totalLuring = allConsultations.filter(c => c.metode === 'Luring').length;
  const totalMetode = totalDaring + totalLuring;
  const jenisDonutItems = [
    {
      id: 'daring',
      label: 'Daring',
      sublabel: 'Online via SIMTA / Zoom',
      count: totalDaring,
      color: '#3b82f6', // Blue
      percentage: totalMetode > 0 ? ((totalDaring / totalMetode) * 100).toFixed(1) : '0'
    },
    {
      id: 'luring',
      label: 'Luring',
      sublabel: 'Tatap Muka di Kampus',
      count: totalLuring,
      color: '#10b981', // Emerald/Teal
      percentage: totalMetode > 0 ? ((totalLuring / totalMetode) * 100).toFixed(1) : '0'
    }
  ];

  const statusAndMethodStats = {
    status: {
      menunggu_validasi: {
        label: 'Menunggu Validasi',
        count: statusCounts.menunggu_validasi,
        percentage: totalBimbingan > 0 ? ((statusCounts.menunggu_validasi / totalBimbingan) * 100).toFixed(1) : 0,
        color: '#f59e0b', // Amber
        bgClass: 'bg-amber-500',
        textClass: 'text-amber-700',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
      },
      revisi_mayor: {
        label: 'Revisi Mayor',
        count: statusCounts.revisi_mayor,
        percentage: totalBimbingan > 0 ? ((statusCounts.revisi_mayor / totalBimbingan) * 100).toFixed(1) : 0,
        color: '#e11d48', // Rose
        bgClass: 'bg-rose-500',
        textClass: 'text-rose-700',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200'
      },
      revisi_minor: {
        label: 'Revisi Minor',
        count: statusCounts.revisi_minor,
        percentage: totalBimbingan > 0 ? ((statusCounts.revisi_minor / totalBimbingan) * 100).toFixed(1) : 0,
        color: '#6366f1', // Indigo
        bgClass: 'bg-indigo-500',
        textClass: 'text-indigo-700',
        badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200'
      },
      disetujui: {
        label: 'Disetujui / Selesai',
        count: statusCounts.disetujui,
        percentage: totalBimbingan > 0 ? ((statusCounts.disetujui / totalBimbingan) * 100).toFixed(1) : 0,
        color: '#10b981', // Emerald
        bgClass: 'bg-emerald-500',
        textClass: 'text-emerald-700',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
      }
    },
    metode: {
      daring: {
        label: 'Daring (Online)',
        count: totalDaring,
        percentage: totalBimbingan > 0 ? ((totalDaring / totalBimbingan) * 100).toFixed(1) : 0,
        color: '#3b82f6', // Blue
        bgClass: 'bg-blue-600',
        textClass: 'text-blue-700',
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-200'
      },
      luring: {
        label: 'Luring (Tatap Muka)',
        count: totalLuring,
        percentage: totalBimbingan > 0 ? ((totalLuring / totalBimbingan) * 100).toFixed(1) : 0,
        color: '#0d9488', // Teal
        bgClass: 'bg-teal-600',
        textClass: 'text-teal-700',
        badgeClass: 'bg-teal-50 text-teal-800 border-teal-200'
      }
    },
    statusDonutItems,
    totalStatusThree,
    jenisDonutItems,
    totalMetode
  };

  // 8. Peringkat Keaktifan Dosen (Tabel Dosen, Jumlah Bimbingan, Jumlah Mahasiswa, Rasio)
  const advisorRankings = advisors.map(adv => {
    const dospemConsultations = allConsultations.filter(c => c.dosen_nip === adv.nip);
    const totalBimbinganDosen = dospemConsultations.length;
    const p1Count = studentAdvisors.filter(sa => sa.dospem1_nip === adv.nip).length;
    const p2Count = studentAdvisors.filter(sa => sa.dospem2_nip === adv.nip).length;
    const totalMhs = p1Count + p2Count;
    const rasio = totalMhs > 0 ? (totalBimbinganDosen / totalMhs).toFixed(1) : '0';

    let kategori = 'Cukup Aktif';
    let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';

    const numRasio = Number(rasio);
    if (numRasio >= 18) {
      kategori = 'Sangat Aktif';
      badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    } else if (numRasio >= 14) {
      kategori = 'Aktif';
      badgeClass = 'bg-blue-50 text-blue-800 border-blue-200';
    } else if (numRasio < 10) {
      kategori = 'Perlu Pendampingan';
      badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
    }

    return {
      nip: adv.nip,
      nama: adv.nama,
      jabatan: adv.jabatan_fungsional,
      keahlian: Array.isArray(adv.keahlian) ? adv.keahlian : [adv.keahlian || 'Sistem Informasi'],
      p1Count,
      p2Count,
      totalMahasiswa: totalMhs,
      totalBimbingan: totalBimbinganDosen,
      rasio: numRasio,
      rasioFormatted: rasio,
      kategori,
      badgeClass
    };
  });

  // Urutkan berdasarkan rasio & total bimbingan tertinggi
  advisorRankings.sort((a, b) => b.rasio - a.rasio || b.totalBimbingan - a.totalBimbingan);
  advisorRankings.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  // 9. Peringkat Keaktifan Mahasiswa (Tambahan: Top 10 mahasiswa yang paling sering bimbingan dalam sebulan)
  const currentMonthKey = '2026-10';
  const currentMonthLogs = monthlyLogs[currentMonthKey] || [];
  
  const currentMonthCounts = new Map();
  currentMonthLogs.forEach(log => {
    currentMonthCounts.set(log.mhs_nim, (currentMonthCounts.get(log.mhs_nim) || 0) + 1);
  });

  const studentTopList = studentAdvisors.map(sa => {
    const bimbinganBulanIni = currentMonthCounts.get(sa.student_nim) || Math.floor(pseudoRandom(parseInt(sa.student_nim.slice(-4)) || 1) * 7) + 2;
    const totalBimbinganStudent = studentConsultationCounts.get(sa.student_nim) || (bimbinganBulanIni + 16);
    const p1Adv = advisors.find(a => a.nip === sa.dospem1_nip);
    const p2Adv = advisors.find(a => a.nip === sa.dospem2_nip);

    const isMemenuhi24 = totalBimbinganStudent >= 24;

    return {
      mhs_nim: sa.student_nim,
      mhs_nama: sa.student_nama,
      mhs_kelas: 'MI 5A',
      bimbinganBulanIni,
      totalBimbingan: totalBimbinganStudent,
      isMemenuhi24,
      p1_nama: p1Adv?.nama || 'Dosen Pembimbing 1',
      p2_nama: p2Adv?.nama || 'Dosen Pembimbing 2',
      judul: sa.judul_ta || 'Sistem Informasi Manajemen Tugas Akhir',
      status: isMemenuhi24 ? 'Siap Daftar Sidang' : 'Aktif Konsisten'
    };
  });

  // Sort Top 10 by bimbingan bulan ini descending
  studentTopList.sort((a, b) => b.bimbinganBulanIni - a.bimbinganBulanIni || b.totalBimbingan - a.totalBimbingan);
  const top10ActiveStudents = studentTopList.slice(0, 10).map((st, idx) => ({
    ...st,
    rank: idx + 1
  }));

  return {
    summary: {
      totalMahasiswa,
      totalMahasiswaProdi,
      totalDosen,
      totalBimbingan,
      rataRataPerMahasiswa,
      memenuhiTarget24Count,
      persenMemenuhiTarget24,
      belumMemenuhiCount
    },
    studentStatus: studentStatusStats,
    advisorWorkloads,
    advisorWorkloadSummary: {
      totalTimpang,
      totalSeimbang,
      totalDosen,
      rataRataBeban: totalDosen > 0 ? (totalMahasiswa * 2 / totalDosen).toFixed(1) : '16'
    },
    monthlyChartData,
    statusAndMethodStats,
    advisorRankings,
    top10ActiveStudents
  };
}
