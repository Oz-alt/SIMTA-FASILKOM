/**
 * SIMTA Consultation Utility & Business Rules Engine
 * 
 * Rules:
 * 1. Sesi Bimbingan baru TERHITUNG jika statusnya telah berubah dari 'Menunggu' ke 'Revisi Mayor', 'Revisi Minor', atau 'Diterima'.
 * 2. Status 'Diterima' (ACC Bimbingan) BARU TERSEDIA jika mahasiswa telah menyelesaikan minimal 12 sesi bimbingan dengan pembimbing yang bersangkutan.
 * 3. Kelayakan Sidang tercapai jika minimal 12x bimbingan dengan Pembimbing 1 dan minimal 12x dengan Pembimbing 2 (Total target 24 sesi).
 */

export const MIN_SESSIONS_PER_ADVISOR = 12;
export const MIN_TOTAL_SESSIONS_DEFENSE = 24;

/**
 * Comparator kronologis untuk sesi bimbingan: terlama di atas.
 * Dipakai bersama oleh halaman dosen dan kartu bimbingan mahasiswa supaya
 * nomor "Pertemuan" konsisten dengan urutan tanggal.
 *
 * Urutan prioritas: tanggal (YYYY-MM-DD) -> waktu (HH:MM) -> created_at -> id.
 *
 * @param {Object} a sesi bimbingan
 * @param {Object} b sesi bimbingan
 * @returns {number}
 */
export function compareConsultationChronologically(a, b) {
  const dateA = String(a?.tanggal || '');
  const dateB = String(b?.tanggal || '');
  if (dateA !== dateB) {
    return dateA.localeCompare(dateB);
  }

  const waktuA = String(a?.waktu || '');
  const waktuB = String(b?.waktu || '');
  if (waktuA !== waktuB) {
    return waktuA.localeCompare(waktuB);
  }

  const createdA = a?.created_at ? new Date(a.created_at).getTime() : 0;
  const createdB = b?.created_at ? new Date(b.created_at).getTime() : 0;
  if (createdA !== 0 && createdB !== 0 && createdA !== createdB) {
    return createdA - createdB;
  }

  const numericId = (value) => {
    const match = String(value ?? '').match(/\d+/);
    return match ? Number(match[0]) : 0;
  };
  const numA = numericId(a?.id);
  const numB = numericId(b?.id);
  if (numA !== 0 && numB !== 0 && numA !== numB) {
    return numA - numB;
  }

  return String(a?.id ?? '').localeCompare(String(b?.id ?? ''));
}

/**
 * Urutkan sesi bimbingan secara kronologis (terlama ke terbaru).
 * @param {Array} consultations
 * @returns {Array}
 */
export function sortConsultationsChronologically(consultations = []) {
  return [...(consultations || [])].sort(compareConsultationChronologically);
}

/**
 * Memeriksa apakah suatu sesi bimbingan telah dievaluasi oleh dosen
 * (berubah dari 'Menunggu' menjadi 'Revisi Mayor', 'Revisi Minor', atau 'Diterima')
 * @param {Object} consultation 
 * @returns {boolean}
 */
export function isConsultationEvaluated(consultation) {
  if (!consultation) return false;

  const status = String(consultation.status || '').toLowerCase().trim();
  const jenis = String(consultation.jenis_revisi || '').toLowerCase().trim();
  const notes = String(consultation.masukan_dosen || '').trim();

  // Jika status masih dalam antrean menunggu tanggapan, sesi BELUM terhitung
  if (
    status === 'menunggu' ||
    status === 'menunggu_tanggapan' ||
    status === 'menunggu_validasi' ||
    status === 'pending' ||
    jenis === 'menunggu'
  ) {
    return false;
  }

  // Jika status sudah berubah ke Mayor, Minor, atau Diterima/Disetujui -> Terhitung SAH
  if (
    status === 'disetujui' ||
    status === 'perlu_revisi' ||
    jenis === 'mayor' ||
    jenis === 'minor' ||
    jenis === 'diterima'
  ) {
    return true;
  }

  // Jika terdapat timestamp review atau catatan masukan dari dosen
  if (consultation.reviewed_at || notes.length > 0) {
    return true;
  }

  return false;
}

/**
 * Menghitung rekapitulasi progres bimbingan mahasiswa terhadap syarat kelayakan sidang (24 sesi: 12x Pembimbing 1, 12x Pembimbing 2)
 * @param {Array} consultations - Seluruh daftar bimbingan atau bimbingan mahasiswa bersangkutan
 * @param {string} studentNim - NIM mahasiswa (opsional jika array sudah difilter)
 */
export function calculateBimbinganEligibility(consultations = [], studentNim = '') {
  let list = consultations || [];
  if (studentNim) {
    list = list.filter(c => String(c.mhs_nim || '').trim() === String(studentNim).trim());
  }

  // Sesi yang terhitung (status sudah dievaluasi: Mayor, Minor, Diterima)
  const evaluatedSessions = list.filter(isConsultationEvaluated);

  const isPemb1 = (c) => {
    const p = String(c.pembimbing || '').toLowerCase().trim();
    return p === 'pembimbing 1' || p === 'pembimbing_1' || p === '1';
  };

  const isPemb2 = (c) => {
    const p = String(c.pembimbing || '').toLowerCase().trim();
    return p === 'pembimbing 2' || p === 'pembimbing_2' || p === '2';
  };

  const countPemb1 = evaluatedSessions.filter(isPemb1).length;
  const countPemb2 = evaluatedSessions.filter(isPemb2).length;
  const totalEvaluated = countPemb1 + countPemb2;

  const approvedPemb1 = Math.min(countPemb1, MIN_SESSIONS_PER_ADVISOR);
  const approvedPemb2 = Math.min(countPemb2, MIN_SESSIONS_PER_ADVISOR);
  const progressPercent = Math.min(100, Math.round(((approvedPemb1 + approvedPemb2) / MIN_TOTAL_SESSIONS_DEFENSE) * 100));

  const isEligibleForDefense = countPemb1 >= MIN_SESSIONS_PER_ADVISOR && countPemb2 >= MIN_SESSIONS_PER_ADVISOR;

  // Cek apakah masing-masing pembimbing sudah pernah memberikan status ACC 'Diterima'
  const hasAccPemb1 = evaluatedSessions.some(c => isPemb1(c) && (c.status === 'disetujui' || String(c.jenis_revisi || '').toLowerCase() === 'diterima'));
  const hasAccPemb2 = evaluatedSessions.some(c => isPemb2(c) && (c.status === 'disetujui' || String(c.jenis_revisi || '').toLowerCase() === 'diterima'));

  return {
    countPemb1,
    countPemb2,
    totalEvaluated,
    totalConsultations: list.length,
    minPerPembimbing: MIN_SESSIONS_PER_ADVISOR,
    minRequired: MIN_TOTAL_SESSIONS_DEFENSE,
    progressPercent,
    isEligibleForDefense,
    hasAccPemb1,
    hasAccPemb2
  };
}

/**
 * Memeriksa apakah opsi status 'Diterima' (ACC Bimbingan) boleh dipilih oleh dosen
 * Aturan: Hanya boleh dipilih jika mahasiswa telah menyelesaikan minimal 12 sesi bimbingan dengan pembimbing ini
 * @param {Array} studentConsultationsWithAdvisor - Daftar bimbingan mahasiswa bersama dosen pembimbing ini
 * @returns {{ canAccept: boolean, sessionCount: number, minRequired: number, remainingSessions: number }}
 */
export function checkCanAdvisorAccept(studentConsultationsWithAdvisor = []) {
  const sessionCount = (studentConsultationsWithAdvisor || []).length;
  const canAccept = sessionCount >= MIN_SESSIONS_PER_ADVISOR;
  const remainingSessions = Math.max(0, MIN_SESSIONS_PER_ADVISOR - sessionCount);

  return {
    canAccept,
    sessionCount,
    minRequired: MIN_SESSIONS_PER_ADVISOR,
    remainingSessions
  };
}

/**
 * Memeriksa kelayakan mahasiswa masuk daftar jadwal sidang tugas akhir.
 * 
 * Persyaratan:
 * 1. Sudah memiliki judul Tugas Akhir (tidak kosong).
 * 2. Sudah bimbingan minimal 12 kali di Pembimbing 1 (countPemb1 >= 12).
 * 3. Sudah bimbingan minimal 12 kali di Pembimbing 2 (countPemb2 >= 12).
 * 4. Pembimbing 1 sudah memberikan status 'Diterima' (ACC) pada sesi bimbingan.
 * 5. Pembimbing 2 sudah memberikan status 'Diterima' (ACC) pada sesi bimbingan.
 * (Wajib kedua dosen pembimbing memberikan status menerima; jika salah satu belum menerima, tidak boleh masuk list).
 * 
 * @param {Object} params
 * @param {string} params.studentNim - NIM mahasiswa
 * @param {Array} params.consultations - Daftar seluruh bimbingan
 * @param {Array} params.thesisTitles - Daftar judul TA
 * @param {Array} params.studentAdvisors - Daftar alokasi dospem mahasiswa
 * @returns {{ isEligible: boolean, reason: string, judul: string, stats: Object }}
 */
export function checkStudentDefenseEligibility({
  studentNim,
  consultations = [],
  thesisTitles = [],
  studentAdvisors = []
}) {
  const nim = String(studentNim || '').trim();
  if (!nim) {
    return { isEligible: false, reason: 'NIM mahasiswa tidak valid.', judul: '', stats: null };
  }

  // Syarat 1: Mahasiswa sudah memiliki judul Tugas Akhir
  const titleObj = (thesisTitles || []).find(t => String(t.mhs_nim || '').trim() === nim);
  const advRec = (studentAdvisors || []).find(sa => String(sa.student_nim || '').trim() === nim);
  const judul = (titleObj?.judul || advRec?.judul_ta || '').trim();

  const isPlaceholderJudul = !judul ||
    judul === 'Judul Tugas Akhir' ||
    judul === 'Rancang Bangun Sistem Informasi Manajemen Tugas Akhir & Peminjaman Ruang Sidang FASILKOM UNSRI' && !titleObj;

  if (!judul || isPlaceholderJudul) {
    return {
      isEligible: false,
      reason: 'Mahasiswa belum memiliki judul Tugas Akhir yang sah.',
      judul: '',
      stats: null
    };
  }

  // Syarat 2: Bimbingan minimal 12 kali di masing-masing dospem (12 di dospem 1 & 12 di dospem 2)
  const stats = calculateBimbinganEligibility(consultations, nim);
  const { countPemb1, countPemb2, hasAccPemb1, hasAccPemb2 } = stats;

  const passedCount1 = countPemb1 >= MIN_SESSIONS_PER_ADVISOR;
  const passedCount2 = countPemb2 >= MIN_SESSIONS_PER_ADVISOR;

  if (!passedCount1 || !passedCount2) {
    return {
      isEligible: false,
      reason: `Jumlah bimbingan belum memenuhi target (Pembimbing 1: ${countPemb1}/${MIN_SESSIONS_PER_ADVISOR}, Pembimbing 2: ${countPemb2}/${MIN_SESSIONS_PER_ADVISOR}).`,
      judul,
      stats
    };
  }

  // Syarat 3: Semua dospem di bimbingan sudah menerima di entry bimbingannya (kedua pihak)
  if (!hasAccPemb1 || !hasAccPemb2) {
    const unaccepted = [];
    if (!hasAccPemb1) unaccepted.push('Pembimbing 1');
    if (!hasAccPemb2) unaccepted.push('Pembimbing 2');
    return {
      isEligible: false,
      reason: `Belum mendapatkan konfirmasi status 'Diterima' dari ${unaccepted.join(' dan ')}.`,
      judul,
      stats
    };
  }

  return {
    isEligible: true,
    reason: 'Memenuhi seluruh persyaratan bimbingan dan judul Tugas Akhir.',
    judul,
    stats
  };
}
