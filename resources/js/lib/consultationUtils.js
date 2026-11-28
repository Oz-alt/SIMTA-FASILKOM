/**
 * SIMTA Consultation Utility & Business Rules Engine
 * 
 * Rules:
 * 1. Sesi Bimbingan baru TERHITUNG jika statusnya telah berubah dari 'Menunggu' ke 'Revisi Mayor', 'Revisi Minor', atau 'Diterima'.
 * 2. Status 'Diterima' (ACC Bimbingan) BARU TERSEDIA jika mahasiswa telah menyelesaikan minimal 12 sesi bimbingan dengan pembimbing yang bersangkutan.
 * 3. Kelayakan Sidang tercapai jika minimal 12x bimbingan dengan Pembimbing 1 dan minimal 12x dengan Pembimbing 2 (Total target 24 sesi).
 */

export const DEFAULT_MIN_SESSIONS_PER_ADVISOR = 12;
export const DEFAULT_MIN_TOTAL_SESSIONS_DEFENSE = 24;

let memoryMinPerAdvisor = DEFAULT_MIN_SESSIONS_PER_ADVISOR;
let memoryMinTotal = DEFAULT_MIN_TOTAL_SESSIONS_DEFENSE;

export function getMinSessionsPerAdvisor() {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('simta_min_bimbingan_setting');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Number(parsed?.minPerAdvisor) > 0) {
          return Number(parsed.minPerAdvisor);
        }
      }
    } catch {}
  }
  return memoryMinPerAdvisor;
}

export function getMinTotalSessionsDefense() {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('simta_min_bimbingan_setting');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Number(parsed?.minTotal) > 0) {
          return Number(parsed.minTotal);
        }
        if (Number(parsed?.minPerAdvisor) > 0) {
          return Number(parsed.minPerAdvisor) * 2;
        }
      }
    } catch {}
  }
  return memoryMinTotal;
}

export function setMinSessionsRequirement(perAdvisor, total) {
  const numAdvisor = Number(perAdvisor) > 0 ? Number(perAdvisor) : DEFAULT_MIN_SESSIONS_PER_ADVISOR;
  const numTotal = Number(total) > 0 ? Number(total) : numAdvisor * 2;
  memoryMinPerAdvisor = numAdvisor;
  memoryMinTotal = numTotal;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('simta_min_bimbingan_setting', JSON.stringify({
        minPerAdvisor: numAdvisor,
        minTotal: numTotal,
        updated_at: new Date().toISOString()
      }));
      window.dispatchEvent(new CustomEvent('simta_min_bimbingan_updated', {
        detail: { minPerAdvisor: numAdvisor, minTotal: numTotal }
      }));
    } catch {}
  }
  return { minPerAdvisor: numAdvisor, minTotal: numTotal };
}

export const MIN_SESSIONS_PER_ADVISOR = DEFAULT_MIN_SESSIONS_PER_ADVISOR;
export const MIN_TOTAL_SESSIONS_DEFENSE = DEFAULT_MIN_TOTAL_SESSIONS_DEFENSE;

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
 * Menghitung rekapitulasi progres bimbingan mahasiswa terhadap syarat kelayakan sidang (dinamis: default 24 sesi, 12x per pembimbing)
 * @param {Array} consultations - Seluruh daftar bimbingan atau bimbingan mahasiswa bersangkutan
 * @param {string} studentNim - NIM mahasiswa (opsional jika array sudah difilter)
 * @param {Object} [options] - Opsi konfigurasi syarat bimbingan dinamis
 * @param {number} [options.minPerAdvisor] - Minimal sesi per pembimbing
 * @param {number} [options.minTotal] - Total minimal sesi kelayakan sidang
 */
export function calculateBimbinganEligibility(consultations = [], studentNim = '', options = {}) {
  let list = consultations || [];
  if (studentNim) {
    list = list.filter(c => String(c.mhs_nim || '').trim() === String(studentNim).trim());
  }

  const minPerPembimbing = Number(options?.minPerAdvisor) > 0 
    ? Number(options.minPerAdvisor) 
    : getMinSessionsPerAdvisor();
  const minRequired = Number(options?.minTotal) > 0 
    ? Number(options.minTotal) 
    : (Number(options?.minPerAdvisor) > 0 ? Number(options.minPerAdvisor) * 2 : getMinTotalSessionsDefense());

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

  const approvedPemb1 = Math.min(countPemb1, minPerPembimbing);
  const approvedPemb2 = Math.min(countPemb2, minPerPembimbing);
  const progressPercent = Math.min(100, Math.round(((approvedPemb1 + approvedPemb2) / minRequired) * 100));

  const isEligibleForDefense = countPemb1 >= minPerPembimbing && countPemb2 >= minPerPembimbing;

  // Cek apakah masing-masing pembimbing sudah pernah memberikan status ACC 'Diterima'
  const hasAccPemb1 = evaluatedSessions.some(c => isPemb1(c) && (c.status === 'disetujui' || String(c.jenis_revisi || '').toLowerCase() === 'diterima'));
  const hasAccPemb2 = evaluatedSessions.some(c => isPemb2(c) && (c.status === 'disetujui' || String(c.jenis_revisi || '').toLowerCase() === 'diterima'));

  return {
    countPemb1,
    countPemb2,
    totalEvaluated,
    totalConsultations: list.length,
    minPerPembimbing,
    minRequired,
    progressPercent,
    isEligibleForDefense,
    hasAccPemb1,
    hasAccPemb2
  };
}

/**
 * Memeriksa apakah opsi status 'Diterima' (ACC Bimbingan) boleh dipilih oleh dosen
 * Aturan: Hanya boleh dipilih jika mahasiswa telah menyelesaikan minimal target sesi bimbingan dengan pembimbing ini
 * @param {Array} studentConsultationsWithAdvisor - Daftar bimbingan mahasiswa bersama dosen pembimbing ini
 * @param {Object} [options] - Opsi konfigurasi syarat
 * @param {number} [options.minPerAdvisor] - Minimal sesi per pembimbing
 * @returns {{ canAccept: boolean, sessionCount: number, minRequired: number, remainingSessions: number }}
 */
export function checkCanAdvisorAccept(studentConsultationsWithAdvisor = [], options = {}) {
  const minRequired = Number(options?.minPerAdvisor) > 0 
    ? Number(options.minPerAdvisor) 
    : getMinSessionsPerAdvisor();
  const validList = (studentConsultationsWithAdvisor || []).filter(
    (c) => String(c?.status || '').toLowerCase().trim() !== 'ditolak'
  );
  const sessionCount = validList.length;
  const canAccept = sessionCount >= minRequired;
  const remainingSessions = Math.max(0, minRequired - sessionCount);

  return {
    canAccept,
    sessionCount,
    minRequired,
    remainingSessions
  };
}

/**
 * Memeriksa kelayakan mahasiswa masuk daftar jadwal sidang tugas akhir.
 * 
 * Persyaratan:
 * 1. Sudah memiliki judul Tugas Akhir (tidak kosong).
 * 2. Sudah bimbingan minimal target di Pembimbing 1 (countPemb1 >= minPerAdvisor).
 * 3. Sudah bimbingan minimal target di Pembimbing 2 (countPemb2 >= minPerAdvisor).
 * 4. Pembimbing 1 sudah memberikan status 'Diterima' (ACC) pada sesi bimbingan.
 * 5. Pembimbing 2 sudah memberikan status 'Diterima' (ACC) pada sesi bimbingan.
 * (Wajib kedua dosen pembimbing memberikan status menerima; jika salah satu belum menerima, tidak boleh masuk list).
 * 
 * @param {Object} params
 * @param {string} params.studentNim - NIM mahasiswa
 * @param {Array} params.consultations - Daftar seluruh bimbingan
 * @param {Array} params.thesisTitles - Daftar judul TA
 * @param {Array} params.studentAdvisors - Daftar alokasi dospem mahasiswa
 * @param {Object} [params.options] - Opsi konfigurasi syarat
 * @returns {{ isEligible: boolean, reason: string, judul: string, stats: Object }}
 */
export function checkStudentDefenseEligibility({
  studentNim,
  consultations = [],
  thesisTitles = [],
  studentAdvisors = [],
  options = {}
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

  // Syarat 2: Bimbingan minimal di masing-masing dospem
  const stats = calculateBimbinganEligibility(consultations, nim, options);
  const { countPemb1, countPemb2, hasAccPemb1, hasAccPemb2, minPerPembimbing } = stats;

  const passedCount1 = countPemb1 >= minPerPembimbing;
  const passedCount2 = countPemb2 >= minPerPembimbing;

  if (!passedCount1 || !passedCount2) {
    return {
      isEligible: false,
      reason: `Jumlah bimbingan belum memenuhi target (Pembimbing 1: ${countPemb1}/${minPerPembimbing}, Pembimbing 2: ${countPemb2}/${minPerPembimbing}).`,
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
