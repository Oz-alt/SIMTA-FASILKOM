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
