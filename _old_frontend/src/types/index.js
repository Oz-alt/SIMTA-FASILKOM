/**
 * SIMTA System Constants & Type Definitions
 */

export const ROLES = {
  MAHASISWA: 'mahasiswa',
  KAPRODI: 'kaprodi',
  ADMIN_SARANA: 'admin_sarana',
  DOSEN: 'dosen'
};

export const THESIS_STATUS = {
  DRAFT: 'draft',
  DIAJUKAN: 'diajukan',
  DISETUJUI: 'disetujui',
  DITOLAK: 'ditolak'
};

export const STAGE_TYPES = {
  SEMINAR_PROPOSAL: 'seminar_proposal',
  SEMINAR_HASIL: 'seminar_hasil',
  SIDANG_AKHIR: 'sidang_akhir'
};

export const STAGE_STATUS = {
  BELUM_DIAJUKAN: 'belum_diajukan',
  MENUNGGU_JADWAL: 'menunggu_jadwal',
  DISETUJUI: 'disetujui',
  SELESAI: 'selesai',
  DITOLAK: 'ditolak'
};

export const BOOKING_STATUS = {
  MENUNGGU: 'menunggu_persetujuan',
  DISETUJUI: 'disetujui',
  DITOLAK: 'ditolak',
  DIBATALKAN: 'dibatalkan'
};

export const ROOM_STATUS = {
  AKTIF: 'aktif',
  NONAKTIF: 'nonaktif',
  MAINTENANCE: 'maintenance'
};
