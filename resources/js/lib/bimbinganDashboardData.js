/**
 * SIMTA - Kaprodi Bimbingan Dashboard Analytics Data Engine
 *
 * Semua angka dihitung dari data riil tabel Supabase:
 * student_advisors, advisors, thesis_consultations, thesis_titles.
 * Tidak ada angka dummy / generator acak / fallback karangan.
 */

const MONTH_SHORT_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTH_FULL_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const CHART_MONTH_WINDOW = 10;

/** 10 bulan terakhir s.d. bulan berjalan, dihitung dari tanggal sistem. */
export function buildMonthRange(referenceDate = new Date(), windowSize = CHART_MONTH_WINDOW) {
  const months = [];
  for (let i = windowSize - 1; i >= 0; i--) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
    const year = d.getFullYear();
    const monthIdx = d.getMonth();
    months.push({
      key: `${year}-${String(monthIdx + 1).padStart(2, '0')}`,
      name: `${MONTH_FULL_ID[monthIdx]} ${year}`,
      short: MONTH_SHORT_ID[monthIdx],
      year,
      labelMMYYYY: `${String(monthIdx + 1).padStart(2, '0')}/${year}`
    });
  }
  return months;
}

export const MONTH_NAMES = buildMonthRange();

/** Ambil kunci bulan (YYYY-MM) dari sebuah tanggal. */
const monthKeyOf = (value) => {
  if (!value) return '';
  const raw = String(value);
  const iso = /^(\d{4})-(\d{2})/.exec(raw);
  if (iso) return `${iso[1]}-${iso[2]}`;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
};

/** Status konsultasi Supabase → 4 kategori dasbor: Revisi Mayor, Revisi Minor, Menunggu, Diterima. */
export const normalizeConsultationStatus = (consultation) => {
  const raw = String(consultation?.status || '').toLowerCase().trim();
  const jenis = String(consultation?.jenis_revisi || '').toLowerCase().trim();

  // Status Menunggu: belum ditanggapi/divalidasi dospem
  if (
    raw === 'menunggu' ||
    raw === 'menunggu_validasi' ||
    raw === 'menunggu_tanggapan' ||
    raw === 'pending' ||
    jenis === 'menunggu' ||
    (!raw && !jenis)
  ) {
    return 'menunggu';
  }

  // Status Diterima: disetujui / diterima / ACC
  if (raw === 'disetujui' || raw === 'diterima' || raw === 'acc' || jenis === 'diterima' || jenis === 'acc') {
    return 'disetujui';
  }

  // Status Revisi Mayor:
  if (raw === 'revisi_mayor' || raw === 'mayor' || jenis === 'mayor' || raw === 'ditolak' || jenis === 'ditolak') {
    return 'revisi_mayor';
  }

  // Status Revisi Minor:
  if (raw === 'revisi_minor' || raw === 'minor' || jenis === 'minor') {
    return 'revisi_minor';
  }

  if (raw === 'perlu_revisi' || raw === 'revisi') {
    return jenis === 'mayor' ? 'revisi_mayor' : 'revisi_minor';
  }

  return 'menunggu';
};

/** Mengecek apakah sesi bimbingan sah dihitung (Kecuali status Menunggu) */
export const isConsultationCounted = (consultation) => {
  return normalizeConsultationStatus(consultation) !== 'menunggu';
};

/** Metode bimbingan; kosong berarti belum dicatat (bukan asumsi Luring). */
export const normalizeConsultationMetode = (consultation) => {
  const raw = String(consultation?.metode || '').trim().toLowerCase();
  if (raw === 'daring' || raw === 'online') return 'Daring';
  if (raw === 'luring' || raw === 'offline' || raw === 'tatap muka') return 'Luring';
  return 'Belum Dicatat';
};

/** Kelompokkan konsultasi riil per bulan (YYYY-MM). */
export function bucketConsultationsByMonth(liveConsultations = [], months = MONTH_NAMES) {
  const logsByMonth = {};
  months.forEach(m => { logsByMonth[m.key] = []; });

  (Array.isArray(liveConsultations) ? liveConsultations : []).forEach(c => {
    const key = monthKeyOf(c.tanggal || c.created_at);
    if (!key) return;
    if (!logsByMonth[key]) logsByMonth[key] = [];
    logsByMonth[key].push(c);
  });

  Object.keys(logsByMonth).forEach(key => {
    logsByMonth[key].sort((a, b) => {
      const da = new Date(a.tanggal || a.created_at || 0).getTime();
      const db = new Date(b.tanggal || b.created_at || 0).getTime();
      return db - da;
    });
  });

  return logsByMonth;
}

/** Peta NIM -> identitas & status akademik mahasiswa. */
const buildStudentInfoMap = (thesisTitles = [], registeredUsers = []) => {
  const map = new Map();

  (Array.isArray(registeredUsers) ? registeredUsers : []).forEach(u => {
    const nim = String(u.nim || u.nip || '').trim();
    if (!nim) return;
    map.set(nim, { nama: u.nama || '', kelas: u.kelas || '', prodi: u.prodi || '' });
  });

  (Array.isArray(thesisTitles) ? thesisTitles : []).forEach(t => {
    const nim = String(t.mhs_nim || '').trim();
    if (!nim) return;
    const existing = map.get(nim) || {};
    map.set(nim, {
      ...existing,
      nama: existing.nama || t.mhs_nama || '',
      kelas: t.mhs_kelas || existing.kelas || '',
      prodi: t.prodi || existing.prodi || '',
      judul: t.judul || existing.judul || '',
      status_kelulusan: t.status_kelulusan || existing.status_kelulusan || '',
      status_sidang: t.status_sidang || existing.status_sidang || ''
    });
  });

  return map;
};

/**
 * Calculates all summary stats for Kaprodi Dashboard
 */
export function calculateBimbinganDashboardStats(advisors = [], studentAdvisors = [], liveConsultations = [], thesisTitles = [], registeredUsers = []) {
  const safeAdvisors = Array.isArray(advisors) ? advisors : [];
  const safeStudents = Array.isArray(studentAdvisors) ? studentAdvisors : [];
  const safeConsultations = Array.isArray(liveConsultations) ? liveConsultations : [];
  const safeTitles = Array.isArray(thesisTitles) ? thesisTitles : [];

  // Peta NIM → identitas mahasiswa (harus diinisialisasi sebelum digunakan)
  const studentInfo = buildStudentInfoMap(safeTitles, Array.isArray(registeredUsers) ? registeredUsers : []);

  // 1. Jumlah dosen & mahasiswa (langsung dari tabel)
  const totalDosen = safeAdvisors.length;
  const totalMahasiswa = safeStudents.length;

  // 2. Konsultasi riil → bucket per bulan
  const months = buildMonthRange();
  const monthlyLogs = bucketConsultationsByMonth(safeConsultations, months);

  const allConsultations = safeConsultations.map(c => ({
    ...c,
    _statusNorm: normalizeConsultationStatus(c),
    _metodeNorm: normalizeConsultationMetode(c),
    _monthKey: monthKeyOf(c.tanggal || c.created_at)
  }));

  // Sesuai aturan: Status bimbingan adalah Revisi Mayor, Revisi Minor, Menunggu, Diterima.
  // Khusus Total Bimbingan terhitung dari status KECUALI MENUNGGU (status Menunggu tidak dihitung).
  const validConsultations = allConsultations.filter(c => c._statusNorm !== 'menunggu');
  const pendingConsultations = allConsultations.filter(c => c._statusNorm === 'menunggu');

  const totalBimbingan = validConsultations.length;
  const totalMenunggu = pendingConsultations.length;

  // Rata-rata bimbingan per mahasiswa (hanya dari bimbingan sah / tervalidasi)
  const rataRataPerMahasiswa = totalMahasiswa > 0 ? (totalBimbingan / totalMahasiswa).toFixed(1) : '0.0';

  // Count consultations per student for requirement: "persentase mahasiswa yang sudah memenuhi ≥24 bimbingan" (hanya sesi sah)
  const studentConsultationCounts = new Map();
  safeStudents.forEach(sa => {
    const nim = String(sa.student_nim || '').trim();
    if (nim) studentConsultationCounts.set(nim, 0);
  });

  validConsultations.forEach(c => {
    const nim = String(c.mhs_nim || '').trim();
    if (!nim) return;
    studentConsultationCounts.set(nim, (studentConsultationCounts.get(nim) || 0) + 1);
  });

  let memenuhiTarget24Count = 0;
  studentConsultationCounts.forEach(count => {
    if (count >= 24) memenuhiTarget24Count++;
  });

  const persenMemenuhiTarget24 = totalMahasiswa > 0 ? Math.round((memenuhiTarget24Count / totalMahasiswa) * 100) : 0;
  const belumMemenuhiCount = Math.max(0, totalMahasiswa - memenuhiTarget24Count);

  // 4. Status Mahasiswa Real-Time (Aktif, Lulus, Tidak Aktif, Belum Mengajukan Judul)
  const statusByNim = new Map();
  safeTitles.forEach(t => {
    const nim = String(t.mhs_nim || '').trim();
    if (!nim) return;
    statusByNim.set(nim, {
      has_title: Boolean(t.judul && t.judul.trim()),
      status_kelulusan: String(t.status_kelulusan || '').toLowerCase(),
      status_sidang: String(t.status_sidang || '').toLowerCase(),
      status_title: String(t.status || '').toLowerCase()
    });
  });

  // Sinkronisasi data mahasiswa yang sudah memiliki judul di student_advisors
  safeStudents.forEach(sa => {
    const nim = String(sa.student_nim || '').trim();
    if (!nim) return;
    const existing = statusByNim.get(nim);
    const hasJudul = Boolean(sa.judul_ta && sa.judul_ta.trim() && sa.judul_ta !== '-' && sa.judul_ta !== 'Belum ada');
    if (!existing && hasJudul) {
      statusByNim.set(nim, {
        has_title: true,
        status_kelulusan: 'aktif_proses',
        status_sidang: 'bimbingan'
      });
    }
  });

  // Mahasiswa yang sudah memiliki log bimbingan otomatis aktif berproses TA
  safeConsultations.forEach(c => {
    const nim = String(c.mhs_nim || '').trim();
    if (!nim) return;
    const existing = statusByNim.get(nim);
    if (!existing) {
      statusByNim.set(nim, {
        has_title: true,
        status_kelulusan: 'aktif_proses',
        status_sidang: 'bimbingan'
      });
    } else {
      existing.has_title = true;
    }
  });

  let mhsAktifCount = 0;
  let mhsLulusCount = 0;
  let mhsTidakAktifCount = 0;
  let mhsBelumMengajukanCount = 0;

  const nimSet = new Set(safeStudents.map(s => String(s.student_nim || '').trim()).filter(Boolean));
  const extraNims = new Set();
  safeTitles.forEach(t => {
    const nim = String(t.mhs_nim || '').trim();
    if (nim && !nimSet.has(nim)) extraNims.add(nim);
  });

  const countStatusFor = (nim) => {
    const info = statusByNim.get(nim);
    if (info) {
      if (info.status_kelulusan === 'lulus' || info.status_sidang === 'selesai') {
        mhsLulusCount++;
        return;
      }
      if (['tidak_aktif', 'drop_out', 'do', 'non_aktif', 'cuti'].includes(info.status_kelulusan)) {
        mhsTidakAktifCount++;
        return;
      }
      if (info.has_title) {
        mhsAktifCount++;
        return;
      }
    }
    mhsBelumMengajukanCount++;
  };

  nimSet.forEach(countStatusFor);
  extraNims.forEach(countStatusFor);

  const totalStatusMhs = mhsAktifCount + mhsLulusCount + mhsTidakAktifCount + mhsBelumMengajukanCount;
  const statusPctOf = (n) => (totalStatusMhs > 0 ? Math.round((n / totalStatusMhs) * 100) : 0);

  const latestStudentUpdate = safeStudents
    .map(s => s.updated_at)
    .filter(Boolean)
    .sort()
    .pop() || null;

  const studentStatusStats = {
    aktif: mhsAktifCount,
    lulus: mhsLulusCount,
    tidakAktif: mhsTidakAktifCount,
    belumMengajukan: mhsBelumMengajukanCount,
    total: totalStatusMhs,
    persenAktif: statusPctOf(mhsAktifCount),
    persenLulus: statusPctOf(mhsLulusCount),
    persenTidakAktif: statusPctOf(mhsTidakAktifCount),
    persenBelumMengajukan: statusPctOf(mhsBelumMengajukanCount),
    excelMeta: {
      fileName: 'public.student_advisors + public.thesis_titles',
      lastSync: latestStudentUpdate
        ? new Date(latestStudentUpdate).toLocaleString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
          }) + ' WIB'
        : 'Belum ada pembaruan',
      totalRows: totalStatusMhs,
      importedBy: 'Sinkronisasi database prodi',
      keterangan: 'Status aktif/lulus/tidak aktif dibaca langsung dari kolom status_kelulusan & status_sidang pada data Tugas Akhir mahasiswa.'
    }
  };

  // 5. Beban Bimbingan per Dosen (P1 vs P2)
  const advisorWorkloads = safeAdvisors.map(adv => {
    const p1Count = safeStudents.filter(sa => sa.dospem1_nip === adv.nip).length;
    const p2Count = safeStudents.filter(sa => sa.dospem2_nip === adv.nip).length;
    const totalBeban = p1Count + p2Count;
    const selisih = Math.abs(p1Count - p2Count);

    let ketimpanganLevel = 'balanced';
    let ketimpanganLabel = 'Beban Seimbang';
    let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';

    if (totalBeban === 0) {
      ketimpanganLevel = 'empty';
      ketimpanganLabel = 'Belum Ada Mahasiswa';
      badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
    } else if (selisih >= 8 || p1Count === 0 || p2Count === 0) {
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
      keahlian: Array.isArray(adv.keahlian) ? adv.keahlian : [adv.keahlian || 'Umum'],
      p1Count,
      p2Count,
      totalBeban,
      kuotaP1: Number(adv.kuota_dospem1) || 0,
      kuotaP2: Number(adv.kuota_dospem2) || 0,
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
  const advisorAktifCount = advisorWorkloads.filter(a => a.totalBeban > 0).length;

  // Kapasitas grafik = kuota terbesar yang benar-benar diset dosen (bukan angka tetap 16)
  const maxKuota = safeAdvisors.reduce(
    (max, adv) => Math.max(max, Number(adv.kuota_dospem1) || 0, Number(adv.kuota_dospem2) || 0),
    0
  );
  const maxBebanObserved = advisorWorkloads.reduce((max, a) => Math.max(max, a.p1Count, a.p2Count), 0);
  const kapasitasMaksBeban = Math.max(1, maxKuota || maxBebanObserved || 1);

  const advisorWorkloadSummary = {
    totalTimpang,
    totalSeimbang,
    totalDosen,
    advisorAktifCount,
    persenAdvisorAktif: totalDosen > 0 ? Math.round((advisorAktifCount / totalDosen) * 100) : 0,
    rataRataBeban: totalDosen > 0 ? (totalMahasiswa * 2 / totalDosen).toFixed(1) : '0.0',
    kapasitasMaksBeban
  };

  // 6. Chart Bimbingan per Bulan
  // Aturan: Total hanya menghitung sesi yang sudah direspon dospem (bukan Menunggu)
  const monthlyChartData = months.map(mObj => {
    const logs = (monthlyLogs[mObj.key] || []).map(l => ({
      ...l,
      _statusNorm: normalizeConsultationStatus(l),
      _metodeNorm: normalizeConsultationMetode(l)
    }));
    const validLogs = logs.filter(l => l._statusNorm !== 'menunggu');
    const pendingLogs = logs.filter(l => l._statusNorm === 'menunggu');

    return {
      key: mObj.key,
      name: mObj.name,
      short: mObj.short,
      year: mObj.year,
      labelMMYYYY: mObj.labelMMYYYY,
      // total hanya sesi tervalidasi (bukan menunggu)
      total: validLogs.length,
      totalSemua: logs.length,
      totalMenunggu: pendingLogs.length,
      daringCount: validLogs.filter(l => l._metodeNorm === 'Daring').length,
      luringCount: validLogs.filter(l => l._metodeNorm === 'Luring').length,
      belumDicatatCount: validLogs.filter(l => l._metodeNorm === 'Belum Dicatat').length,
      uniqueStudentsCount: new Set(validLogs.map(l => String(l.mhs_nim || ''))).size,
      uniqueLecturersCount: new Set(validLogs.map(l => String(l.dosen_nip || l.dosen_nama || ''))).size,
      consultations: logs
    };
  });

  const maxMonthlyTotal = monthlyChartData.reduce((max, m) => Math.max(max, m.total), 0);

  // 7. Chart Status & Jenis Bimbingan
  // Status di SIMTA: Diterima, Revisi Mayor, Revisi Minor, Menunggu
  // Menunggu = belum direspon dospem → TIDAK masuk Total Bimbingan
  const statusCounts = {
    menunggu: allConsultations.filter(c => c._statusNorm === 'menunggu').length,
    revisi_mayor: allConsultations.filter(c => c._statusNorm === 'revisi_mayor').length,
    revisi_minor: allConsultations.filter(c => c._statusNorm === 'revisi_minor').length,
    disetujui: allConsultations.filter(c => c._statusNorm === 'disetujui').length,
  };

  const totalSemuaKonsultasi = allConsultations.length; // termasuk menunggu, untuk donut semua status
  const totalStatusThree = totalSemuaKonsultasi; // compat alias dipakai di donut total
  const statusDonutItems = [
    {
      id: 'disetujui',
      label: 'Diterima',
      count: statusCounts.disetujui,
      color: '#10b981', // Emerald
      percentage: totalSemuaKonsultasi > 0 ? ((statusCounts.disetujui / totalSemuaKonsultasi) * 100).toFixed(1) : '0',
      totalPercentage: totalBimbingan > 0 ? ((statusCounts.disetujui / totalBimbingan) * 100).toFixed(1) : '0'
    },
    {
      id: 'revisi_minor',
      label: 'Revisi Minor',
      count: statusCounts.revisi_minor,
      color: '#6366f1', // Indigo
      percentage: totalSemuaKonsultasi > 0 ? ((statusCounts.revisi_minor / totalSemuaKonsultasi) * 100).toFixed(1) : '0',
      totalPercentage: totalBimbingan > 0 ? ((statusCounts.revisi_minor / totalBimbingan) * 100).toFixed(1) : '0'
    },
    {
      id: 'revisi_mayor',
      label: 'Revisi Mayor',
      count: statusCounts.revisi_mayor,
      color: '#f43f5e', // Rose/Red
      percentage: totalSemuaKonsultasi > 0 ? ((statusCounts.revisi_mayor / totalSemuaKonsultasi) * 100).toFixed(1) : '0',
      totalPercentage: totalBimbingan > 0 ? ((statusCounts.revisi_mayor / totalBimbingan) * 100).toFixed(1) : '0'
    },
    {
      id: 'menunggu',
      label: 'Menunggu',
      count: statusCounts.menunggu,
      color: '#f59e0b', // Amber
      percentage: totalSemuaKonsultasi > 0 ? ((statusCounts.menunggu / totalSemuaKonsultasi) * 100).toFixed(1) : '0',
      totalPercentage: '0' // Menunggu tidak termasuk Total Bimbingan
    }
  ];

  const totalDaring = allConsultations.filter(c => c._metodeNorm === 'Daring').length;
  const totalLuring = allConsultations.filter(c => c._metodeNorm === 'Luring').length;
  const totalBelumDicatat = allConsultations.filter(c => c._metodeNorm === 'Belum Dicatat').length;
  const totalMetode = totalDaring + totalLuring + totalBelumDicatat;
  const jenisDonutItems = [
    {
      id: 'daring',
      label: 'Daring',
      sublabel: 'Online via SIMTA / Zoom',
      count: totalDaring,
      color: '#3b82f6', // Blue
      percentage: totalMetode > 0 ? ((totalDaring / totalMetode) * 100).toFixed(1) : '0.0'
    },
    {
      id: 'luring',
      label: 'Luring',
      sublabel: 'Tatap Muka di Kampus',
      count: totalLuring,
      color: '#10b981', // Emerald/Teal
      percentage: totalMetode > 0 ? ((totalLuring / totalMetode) * 100).toFixed(1) : '0.0'
    },
    {
      id: 'belum_dicatat',
      label: 'Belum Dicatat',
      sublabel: 'Metode belum diisi saat konsultasi',
      count: totalBelumDicatat,
      color: '#94a3b8', // Slate
      percentage: totalMetode > 0 ? ((totalBelumDicatat / totalMetode) * 100).toFixed(1) : '0.0'
    }
  ];

  const statusAndMethodStats = {
    status: {
      menunggu: {
        label: 'Menunggu',
        count: statusCounts.menunggu,
        percentage: totalSemuaKonsultasi > 0 ? ((statusCounts.menunggu / totalSemuaKonsultasi) * 100).toFixed(1) : 0,
        color: '#f59e0b', // Amber
        bgClass: 'bg-amber-500',
        textClass: 'text-amber-700',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        note: 'Belum direspon dospem — tidak masuk Total Bimbingan'
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
        label: 'Diterima',
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
    totalStatusThree,       // alias: total semua konsultasi (termasuk menunggu)
    totalSemuaKonsultasi,
    totalMenunggu,
    jenisDonutItems,
    totalMetode
  };

  // 8. Peringkat Keaktifan Dosen (Tabel Dosen, Jumlah Bimbingan, Jumlah Mahasiswa, Rasio)
  // Aturan: hanya sesi tervalidasi (bukan Menunggu) yang dihitung untuk rasio dosen
  const advisorRankings = safeAdvisors.map(adv => {
    const dospemConsultations = validConsultations.filter(
      c => c.dosen_nip === adv.nip || (!c.dosen_nip && c.dosen_nama === adv.nama)
    );
    const totalBimbinganDosen = dospemConsultations.length;
    const p1Count = safeStudents.filter(sa => sa.dospem1_nip === adv.nip).length;
    const p2Count = safeStudents.filter(sa => sa.dospem2_nip === adv.nip).length;
    const totalMhs = p1Count + p2Count;
    const rasio = totalMhs > 0 ? (totalBimbinganDosen / totalMhs).toFixed(1) : '0.0';

    let kategori = 'Belum Ada Bimbingan';
    let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';

    const numRasio = Number(rasio);
    if (totalBimbinganDosen > 0) {
      if (numRasio >= 18) {
        kategori = 'Sangat Aktif';
        badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      } else if (numRasio >= 14) {
        kategori = 'Aktif';
        badgeClass = 'bg-blue-50 text-blue-800 border-blue-200';
      } else if (numRasio >= 10) {
        kategori = 'Cukup Aktif';
      } else {
        kategori = 'Perlu Pendampingan';
        badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
      }
    }

    return {
      nip: adv.nip,
      nama: adv.nama,
      jabatan: adv.jabatan_fungsional,
      keahlian: Array.isArray(adv.keahlian) ? adv.keahlian : [adv.keahlian || 'Umum'],
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

  // 9. Top 10 mahasiswa paling aktif pada bulan berjalan (riil, tanpa angka karangan)
  // Hanya sesi tervalidasi (bukan Menunggu) yang masuk hitungan bulan ini
  const currentMonthKey = monthKeyOf(new Date().toISOString());
  const currentMonthLogs = validConsultations.filter(c => c._monthKey === currentMonthKey);

  const currentMonthCounts = new Map();
  currentMonthLogs.forEach(log => {
    const nim = String(log.mhs_nim || '').trim();
    if (!nim) return;
    currentMonthCounts.set(nim, (currentMonthCounts.get(nim) || 0) + 1);
  });

  const studentTopList = safeStudents.map(sa => {
    const nim = String(sa.student_nim || '').trim();
    const info = studentInfo.get(nim) || {};
    const bimbinganBulanIni = currentMonthCounts.get(nim) || 0;
    const totalBimbinganStudent = studentConsultationCounts.get(nim) || 0;
    const p1Adv = safeAdvisors.find(a => a.nip === sa.dospem1_nip);
    const p2Adv = safeAdvisors.find(a => a.nip === sa.dospem2_nip);
    const isLulus = info.status_kelulusan === 'lulus' || info.status_sidang === 'selesai';
    const isMemenuhi24 = totalBimbinganStudent >= 24;

    let statusLabel = 'Belum Ada Bimbingan';
    if (isLulus) statusLabel = 'Lulus';
    else if (isMemenuhi24) statusLabel = 'Memenuhi Syarat ≥24';
    else if (totalBimbinganStudent > 0) statusLabel = 'Sedang Berproses';

    return {
      mhs_nim: nim,
      mhs_nama: sa.student_nama || info.nama || '-',
      mhs_kelas: info.kelas || '-',
      bimbinganBulanIni,
      totalBimbingan: totalBimbinganStudent,
      isMemenuhi24,
      p1_nama: p1Adv?.nama || 'Belum Ditetapkan',
      p2_nama: p2Adv?.nama || 'Belum Ditetapkan',
      judul: info.judul || sa.judul_ta || 'Belum mengajukan judul',
      status: statusLabel
    };
  });

  // Sort Top 10 by bimbingan bulan ini descending
  studentTopList.sort((a, b) => b.bimbinganBulanIni - a.bimbinganBulanIni || b.totalBimbingan - a.totalBimbingan);
  const top10ActiveStudents = studentTopList.slice(0, 10).map((st, idx) => ({
    ...st,
    rank: idx + 1
  }));

  // 10. Periode akademik berjalan (dihitung dari tanggal sistem)
  const now = new Date();
  const monthNow = now.getMonth() + 1;
  const isGanjil = monthNow >= 9 || monthNow <= 2;
  const academicStartYear = monthNow >= 9 ? now.getFullYear() : (monthNow <= 2 ? now.getFullYear() - 1 : now.getFullYear());
  const academicPeriod = {
    label: `${academicStartYear}/${academicStartYear + 1}`,
    semester: isGanjil ? 'Ganjil' : 'Genap'
  };
  academicPeriod.full = `Tahun Akademik ${academicPeriod.label} • Semester ${academicPeriod.semester}`;

  return {
    summary: {
      totalMahasiswa,
      totalMahasiswaProdi: totalMahasiswa,
      totalDosen,
      totalBimbingan,
      rataRataPerMahasiswa,
      memenuhiTarget24Count,
      persenMemenuhiTarget24,
      belumMemenuhiCount,
      maxMonthlyTotal,
      currentMonthKey
    },
    studentStatus: studentStatusStats,
    advisorWorkloads,
    advisorWorkloadSummary,
    monthlyChartData,
    statusAndMethodStats,
    advisorRankings,
    top10ActiveStudents,
    academicPeriod
  };
}
