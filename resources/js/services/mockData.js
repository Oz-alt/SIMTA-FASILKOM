/**
 * SIMTA Mock Initial State & Sample Historical Records
 * D3 Manajemen Informatika UNSRI Dataset
 */

export const MOCK_USERS = [
  {
    id: 'user-mhs-1',
    nim: '09031182328001',
    nama: 'Ahmad Rizky Pratama',
    role: 'mahasiswa',
    kelas: 'MI 5A',
    email: 'rizky.mhs@unsri.ac.id',
    no_hp: '081278901234',
    department_id: 'dept-mi-1'
  },
  {
    id: 'user-mhs-2',
    nim: '09031182328002',
    nama: 'Siti Sarah Rahmawati',
    role: 'mahasiswa',
    kelas: 'MI 5B',
    email: 'sarah.mhs@unsri.ac.id',
    no_hp: '081367891200',
    department_id: 'dept-mi-1'
  },
  {
    id: 'user-kaprodi',
    nim: '197805122005011002',
    nama: 'Dr. Ir. Hendra Kusuma, M.T.',
    role: 'kaprodi',
    email: 'kaprodi.mi@unsri.ac.id',
    department_id: 'dept-mi-1'
  },
  {
    id: 'user-admin-sarana',
    nim: '198509152010121004',
    nama: 'Budi Santoso, S.Kom. (Admin Ruang)',
    role: 'admin_sarana',
    email: 'sarana.fasilkom@unsri.ac.id',
    department_id: 'dept-mi-1'
  },
  {
    id: 'user-dosen',
    nim: '198001012010011001',
    nip: '198001012010011001',
    nama: 'Dr. Budi Dosen, M.Kom.',
    role: 'dosen',
    email: 'dosen.pembimbing@unsri.ac.id',
    department_id: 'dept-mi-1'
  },
  {
    id: 'user-admin-simta',
    nim: '199203142018011001',
    nip: '199203142018011001',
    nama: 'Rina Agustina, S.Kom. (Admin SIMTA)',
    role: 'admin',
    email: 'admin.simta@unsri.ac.id',
    no_hp: '081234567899',
    department_id: 'dept-mi-1'
  }
];

export const MOCK_DEPARTMENTS = [
  { id: 'dept-mi-1', name: 'D3 Manajemen Informatika', code: 'MI' },
  { id: 'dept-ti-1', name: 'S1 Teknik Informatika', code: 'TI' }
];

export const MOCK_BUILDINGS = [
  { id: 'bld-1', code: 'DIPKOM', name: 'Gedung Diploma Komputer (DIPKOM)', description: 'Gedung Utama D3 MI Kampus Palembang' },
  { id: 'bld-2', code: 'DIKLAT', name: 'Gedung Diklat Fasilkom', description: 'Gedung Ruang Sidang Utama Fasilkom' }
];

export const MOCK_ROOMS = [
  {
    id: 'room-1',
    building_id: 'bld-1',
    name: 'Ruang Sidang Utama DIPKOM',
    code: 'RS-DIPKOM-01',
    capacity: 25,
    facilities: ['AC', 'Proyektor Ultra HD', 'Sound System', 'Whiteboard', 'Meja Penguji Oval'],
    status: 'aktif'
  },
  {
    id: 'room-2',
    building_id: 'bld-1',
    name: 'Ruang Seminar DIPKOM Lt. 2',
    code: 'RS-DIPKOM-02',
    capacity: 35,
    facilities: ['AC', 'Proyektor', 'Whiteboard', 'Podium'],
    status: 'aktif'
  },
  {
    id: 'room-3',
    building_id: 'bld-2',
    name: 'Ruang Sidang Diklat A',
    code: 'RS-DIKLAT-A',
    capacity: 30,
    facilities: ['AC', 'Smart TV 75 inch', 'Sound System', 'Whiteboard'],
    status: 'aktif'
  },
  {
    id: 'room-4',
    building_id: 'bld-2',
    name: 'Ruang Sidang Diklat B',
    code: 'RS-DIKLAT-B',
    capacity: 20,
    facilities: ['AC', 'Proyektor'],
    status: 'maintenance'
  }
];

export const MOCK_ROOM_PRIORITIES = [
  // Seminar Proposal Priorities for MI
  { id: 'prio-1', department_id: 'dept-mi-1', room_id: 'room-1', stage_type: 'seminar_proposal', priority_order: 1 },
  { id: 'prio-2', department_id: 'dept-mi-1', room_id: 'room-2', stage_type: 'seminar_proposal', priority_order: 2 },
  { id: 'prio-3', department_id: 'dept-mi-1', room_id: 'room-3', stage_type: 'seminar_proposal', priority_order: 3 },
  // Sidang Akhir Priorities for MI
  { id: 'prio-4', department_id: 'dept-mi-1', room_id: 'room-1', stage_type: 'sidang_akhir', priority_order: 1 },
  { id: 'prio-5', department_id: 'dept-mi-1', room_id: 'room-3', stage_type: 'sidang_akhir', priority_order: 2 }
];

export const MOCK_HISTORICAL_TITLES = [
  {
    id: 'hist-1',
    judul: 'Sistem Informasi Pendataan Alumni Berbasis Web pada D3 Manajemen Informatika UNSRI',
    judul_processed: 'pendataan alumni',
    tahun_angkatan: '2023',
    penulis: 'Rizky Kurniawan'
  },
  {
    id: 'hist-2',
    judul: 'Rancang Bangun Aplikasi Peminjaman Inventaris Laboratorium Komputer Berbasis Mobile',
    judul_processed: 'peminjaman inventaris laboratorium komputer',
    tahun_angkatan: '2024',
    penulis: 'Dian Permata'
  },
  {
    id: 'hist-3',
    judul: 'Sistem Informasi Pengolahan Data Nilai Mahasiswa Berbasis Web dengan Framework Laravel',
    judul_processed: 'pengolahan nilai mahasiswa framework laravel',
    tahun_angkatan: '2023',
    penulis: 'Fajar Nugraha'
  },
  {
    id: 'hist-4',
    judul: 'Pengembangan Portal Tugas Akhir dan Penjadwalan Ruang Sidang Fasilkom',
    judul_processed: 'portal tugas akhir penjadwalan ruang sidang fasilkom',
    tahun_angkatan: '2024',
    penulis: 'Bagus Setyo'
  },
  {
    id: 'hist-5',
    judul: 'Aplikasi Absensi Perkuliahan Menggunakan QR Code Berbasis Android',
    judul_processed: 'absensi perkuliahan qr code android',
    tahun_angkatan: '2022',
    penulis: 'Bambang Tri'
  }
];

export const MOCK_THESIS_TITLES = [
  {
    id: 'title-101',
    profile_id: 'user-mhs-1',
    judul: 'Sistem Informasi Manajemen Tugas Akhir dan Peminjaman Ruang Sidang Terpadu (SIMTA)',
    deskripsi: 'Aplikasi portal terpadu untuk pengajuan judul TA dengan similarity check engine serta penjadwalan otomatis ruang sidang berdasarkan prioritas jurusan.',
    judul_processed: 'penjadwalan ruang sidang',
    status: 'disetujui',
    skor_kemiripan_terakhir: 28.5,
    created_at: '2026-08-15T09:00:00Z',
    updated_at: '2026-08-16T14:30:00Z',
    mhs_nama: 'Ahmad Rizky Pratama',
    mhs_nim: '09031182328001',
    mhs_kelas: 'MI 5A',
    pembimbing_1_nip: '197805122005011002',
    pembimbing_1_nama: 'Dr. Ir. Hendra Kusuma, M.T.',
    pembimbing_2_nip: '198804102015042001',
    pembimbing_2_nama: 'Siti Nurhaliza, S.Kom., M.Kom.',
    pembimbing_1: 'Dr. Ir. Hendra Kusuma, M.T.',
    pembimbing_2: 'Siti Nurhaliza, S.Kom., M.Kom.',
    rekomendasi_dospem_status: 'direkomendasikan',
    catatan_dospem: 'Topik inovatif dan arsitektur sistem sudah matang.',
    rekomendasi_oleh: 'Dr. Ir. Hendra Kusuma, M.T.',
    catatan_kaprodi: 'Judul disetujui. Silakan persiapkan proposal.'
  },
  {
    id: 'title-102',
    profile_id: 'user-mhs-2',
    judul: 'Rancang Bangun Sistem Informasi Pendataan Alumni dan Tracert Study D3 MI',
    deskripsi: 'Sistem web portal untuk melacak jejak alumni dan survei kepuasan penggunan lulusan.',
    judul_processed: 'pendataan alumni tracert study',
    status: 'diajukan',
    skor_kemiripan_terakhir: 58.0,
    created_at: '2026-09-01T10:15:00Z',
    updated_at: '2026-09-01T10:15:00Z',
    mhs_nama: 'Siti Sarah Rahmawati',
    mhs_nim: '09031182328002',
    mhs_kelas: 'MI 5B',
    pembimbing_1_nip: '198804102015042001',
    pembimbing_1_nama: 'Siti Nurhaliza, S.Kom., M.Kom.',
    pembimbing_2_nip: '198509152010121004',
    pembimbing_2_nama: 'Prof. Dr. Ir. Ahmad Zaki, M.Sc.',
    pembimbing_1: 'Siti Nurhaliza, S.Kom., M.Kom.',
    pembimbing_2: 'Prof. Dr. Ir. Ahmad Zaki, M.Sc.',
    rekomendasi_dospem_status: 'direkomendasikan',
    catatan_dospem: 'Usulan topik relevan dengan kebutuhan prodi. Direkomendasikan untuk persetujuan Kaprodi.',
    rekomendasi_oleh: 'Siti Nurhaliza, S.Kom., M.Kom.',
    catatan_kaprodi: ''
  },
  {
    id: 'title-103',
    profile_id: 'user-mhs-3',
    judul: 'Implementasi Algoritma Clustering Untuk Pengelompokan Minat Penelitian Mahasiswa',
    deskripsi: 'Sistem pemetaan minat penelitian mahasiswa menggunakan algoritma K-Means.',
    judul_processed: 'clustering minat penelitian mahasiswa',
    status: 'diajukan',
    skor_kemiripan_terakhir: 22.0,
    created_at: '2026-09-12T14:00:00Z',
    updated_at: '2026-09-12T14:00:00Z',
    mhs_nama: 'Bagus Tri Handoko',
    mhs_nim: '09031182328003',
    mhs_kelas: 'MI 5A',
    pembimbing_1_nip: '198001012010011001',
    pembimbing_1_nama: 'Dr. Budi Dosen, M.Kom.',
    pembimbing_2_nip: '199001152019032015',
    pembimbing_2_nama: 'Rina Wijaya, M.T.',
    pembimbing_1: 'Dr. Budi Dosen, M.Kom.',
    pembimbing_2: 'Rina Wijaya, M.T.',
    rekomendasi_dospem_status: 'menunggu_validasi',
    catatan_dospem: '',
    rekomendasi_oleh: '',
    catatan_kaprodi: ''
  }
];

export const MOCK_THESIS_STAGES = [
  {
    id: 'stage-1',
    thesis_title_id: 'title-101',
    stage_type: 'seminar_proposal',
    status: 'disetujui',
    urutan: 1
  },
  {
    id: 'stage-2',
    thesis_title_id: 'title-101',
    stage_type: 'seminar_hasil',
    status: 'menunggu_jadwal',
    urutan: 2
  },
  {
    id: 'stage-3',
    thesis_title_id: 'title-101',
    stage_type: 'sidang_akhir',
    status: 'belum_diajukan',
    urutan: 3
  }
];

export const MOCK_BOOKINGS = [
  {
    id: 'book-1',
    booking_code: 'BK-2026-0901',
    thesis_stage_id: 'stage-1',
    room_id: 'room-1',
    booking_date: '2026-09-12',
    start_time: '09:00',
    end_time: '11:00',
    purpose: 'Seminar Proposal - Ahmad Rizky Pratama',
    status: 'disetujui',
    rejection_reason: null,
    approved_by: 'Budi Santoso, S.Kom.',
    room_name: 'Ruang Sidang Utama DIPKOM',
    building_code: 'DIPKOM',
    mhs_nama: 'Ahmad Rizky Pratama',
    mhs_nim: '09031182328001',
    judul_ta: 'Sistem Informasi Manajemen Tugas Akhir dan Peminjaman Ruang Sidang Terpadu (SIMTA)',
    stage_label: 'Seminar Proposal'
  }
];

export const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-1',
    profile_id: 'user-mhs-1',
    related_type: 'thesis_title',
    title: 'Judul TA Disetujui!',
    message: 'Selamat! Judul TA Anda telah disetujui Kaprodi. Tombol Pengajuan Ruang Seminar Proposal kini sudah aktif.',
    is_read: false,
    created_at: '2026-08-16T14:30:00Z'
  },
  {
    id: 'notif-2',
    profile_id: 'user-mhs-1',
    related_type: 'booking',
    title: 'Peminjaman Ruangan Disetujui',
    message: 'Peminjaman Ruang Sidang Utama DIPKOM untuk Seminar Proposal pada 12 Sep 2026 (09:00 - 11:00) telah disetujui Admin Sarana.',
    is_read: true,
    created_at: '2026-09-02T11:00:00Z'
  }
];

export const MOCK_THESIS_ARCHIVES = [
  {
    id: 'arc-2025-001',
    judul: 'Rancang Bangun Sistem Informasi Monitoring Presensi Mahasiswa Berbasis Geolocation dan QR-Code Dynamic pada FASILKOM UNSRI',
    abstrak: 'Penelitian ini bertujuan untuk mengembangkan sistem informasi monitoring presensi mahasiswa berbasis lokasi geofencing dan kode QR dinamis untuk mencegah kecurangan absensi pada perkuliahan FASILKOM UNSRI. Sistem dibangun menggunakan arsitektur web modern dengan teknologi Supabase backend dan React JS.',
    abstrak_en: 'This research aims to develop a student attendance monitoring information system based on geofencing location and dynamic QR codes to prevent attendance fraud in FASILKOM UNSRI lectures. The system was built using a modern web architecture with Supabase backend and React JS.',
    penulis_nama: 'Muhammad Farhan',
    penulis_nim: '09011282126044',
    prodi: 'S1 Teknik Informatika',
    kelas: 'TI 5A',
    tahun_angkatan: '2021',
    tahun_lulus: '2025',
    pembimbing_1: 'Dr. Ir. Hendra Kusuma, M.T. (NIP. 197805122005011002)',
    pembimbing_2: 'Siti Nurhaliza, S.Kom., M.Kom. (NIP. 198804102015042001)',
    penguji_1: 'Prof. Dr. Ir. Ahmad Zaki, M.Sc.',
    penguji_2: 'Rina Kartika, S.T., M.T.',
    kata_kunci: ['Geolocation', 'QR Code', 'ReactJS', 'Supabase', 'Presensi'],
    file_pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    status: 'dipublikasikan',
    created_at: '2025-07-20T10:00:00Z'
  },
  {
    id: 'arc-2025-002',
    judul: 'Aplikasi Inventarisasi dan Reservasi Fasilitas Laboratorium Komputer Menggunakan Algoritma First-Come First-Served',
    abstrak: 'Tugas akhir ini memuat perancangan aplikasi inventarisasi sarana prasarana serta peminjaman fasilitas laboratorium berbasis web. Sistem mengimplementasikan alokasi jadwal peminjaman secara transparan untuk menghindari bentrok penggunaan laboratorium.',
    abstrak_en: 'This final project contains the design of an inventory application for infrastructure facilities and laboratory reservations based on the web. The system implements transparent scheduling to avoid collisions.',
    penulis_nama: 'Anisa Putri Maharani',
    penulis_nim: '09031182126012',
    prodi: 'D3 Manajemen Informatika',
    kelas: 'MI 5B',
    tahun_angkatan: '2022',
    tahun_lulus: '2025',
    pembimbing_1: 'Budi Santoso, S.Kom., M.Kom. (NIP. 198509152010121004)',
    pembimbing_2: 'Dr. Endang Sulastri, M.Si. (NIP. 198002152008012003)',
    penguji_1: 'Dr. Ir. Hendra Kusuma, M.T.',
    penguji_2: 'Bambang Irawan, S.Kom., M.T.',
    kata_kunci: ['Inventaris', 'Reservasi Lab', 'FCFS', 'Manajemen Informatika'],
    file_pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    status: 'dipublikasikan',
    created_at: '2025-08-15T09:30:00Z'
  },
  {
    id: 'arc-2024-003',
    judul: 'Implementasi Machine Learning untuk Pengelompokan Minat Topik Tugas Akhir Mahasiswa Menggunakan Algoritma K-Means Clustering',
    abstrak: 'Studi ini menerapkan algoritma K-Means Clustering untuk menganalisis tren minat topik tugas akhir mahasiswa FASILKOM UNSRI dari kumpulan judul karya ilmiah lima tahun terakhir.',
    abstrak_en: 'This study applies K-Means Clustering algorithm to analyze the trend of student final project topic interests in FASILKOM UNSRI from the last five years scientific publications.',
    penulis_nama: 'Rizky Pratama Wijaya',
    penulis_nim: '09011182025033',
    prodi: 'S1 Teknik Informatika',
    kelas: 'TI 7A',
    tahun_angkatan: '2020',
    tahun_lulus: '2024',
    pembimbing_1: 'Prof. Dr. Ir. Ahmad Zaki, M.Sc. (NIP. 197001011995031001)',
    pembimbing_2: 'Siti Nurhaliza, S.Kom., M.Kom. (NIP. 198804102015042001)',
    penguji_1: 'Dr. Ir. Hendra Kusuma, M.T.',
    penguji_2: 'Dr. Endang Sulastri, M.Si.',
    kata_kunci: ['Machine Learning', 'K-Means', 'Clustering', 'Teknik Informatika'],
    file_pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    status: 'dipublikasikan',
    created_at: '2024-12-10T14:15:00Z'
  }
];

export const MOCK_THESIS_REPOSITORIES = [
  {
    id: 'repo-2026-001',
    judul: 'Sistem Informasi Manajemen Tugas Akhir dan Peminjaman Ruang Sidang Terpadu (SIMTA) FASILKOM UNSRI',
    abstrak: 'Aplikasi portal terpadu untuk pengajuan judul TA dengan similarity check engine, bimbingan online, serta penjadwalan otomatis ruang sidang berdasarkan prioritas jurusan.',
    abstrak_en: 'Integrated portal application for final thesis submission with similarity check engine and room booking.',
    penulis_nama: 'Aulia Azzahra',
    penulis_nim: '09010182428002',
    prodi: 'D3 Manajemen Informatika',
    kelas: 'MI 5A',
    tahun_angkatan: '2022',
    tahun_lulus: '2026',
    pembimbing_1: 'Dr. Ir. Hendra Kusuma, M.T.',
    pembimbing_2: 'Siti Nurhaliza, S.Kom., M.Kom.',
    penguji_1: 'Prof. Dr. Ir. Ahmad Zaki, M.Sc.',
    penguji_2: 'Budi Santoso, S.Kom., M.Kom.',
    kata_kunci: ['SIMTA', 'Tugas Akhir', 'Fasilkom UNSRI', 'ReactJS'],
    file_pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    status: 'menunggu_review_kaprodi',
    catatan_kaprodi: '',
    created_at: '2026-09-10T11:00:00Z'
  },
  {
    id: 'repo-2026-002',
    judul: 'Rancang Bangun Sistem Pendeteksi Kebocoran Gas Elpiji Berbasis IoT dan Telegram Bot Messenger',
    abstrak: 'Perancangan hardware sensor MQ-2 mikrokontroler ESP8266 untuk memberikan notifikasi dini kebocoran gas ke smartphone pengguna secara realtime.',
    abstrak_en: 'Design of MQ-2 gas leakage sensor with ESP8266 microcontroller for early warning alert via Telegram.',
    penulis_nama: 'Bagas Aditya',
    penulis_nim: '09031182227015',
    prodi: 'D3 Manajemen Informatika',
    kelas: 'MI 5B',
    tahun_angkatan: '2022',
    tahun_lulus: '2026',
    pembimbing_1: 'Siti Nurhaliza, S.Kom., M.Kom.',
    pembimbing_2: 'Dr. Ir. Hendra Kusuma, M.T.',
    penguji_1: 'Dr. Endang Sulastri, M.Si.',
    penguji_2: 'Bambang Irawan, S.Kom., M.T.',
    kata_kunci: ['IoT', 'MQ-2', 'ESP8266', 'Telegram Bot'],
    file_pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    status: 'disetujui_kaprodi',
    catatan_kaprodi: 'Dokumen lengkap dan memenuhi syarat publikasi.',
    created_at: '2026-09-08T09:30:00Z'
  }
];

export const MOCK_CONSULTATIONS = [
  {
    id: 'cons-1',
    mhs_nim: '09010182428002',
    mhs_nama: 'Aulia Azzahra',
    pembimbing: 'Pembimbing 1',
    dosen_nama: 'Dr. Ir. Hendra Kusuma, M.T.',
    tanggal: '2026-08-20',
    waktu: '10:00',
    bab_topik: 'Bab 1 - Pendahuluan & Latar Belakang',
    catatan_mahasiswa: 'Konsultasi perumusan masalah, batasan masalah, serta batasan teknologi sistem SIMTA.',
    masukan_dosen: 'Latar belakang sudah bagus. Perjelas urgensi pengintegrasian Similarity Check Engine pada Bab 1.3.',
    file_revisi_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    status: 'disetujui',
    created_at: '2026-08-20T10:00:00Z'
  },
  {
    id: 'cons-2',
    mhs_nim: '09010182428002',
    mhs_nama: 'Aulia Azzahra',
    pembimbing: 'Pembimbing 2',
    dosen_nama: 'Siti Nurhaliza, S.Kom., M.Kom.',
    tanggal: '2026-08-27',
    waktu: '13:30',
    bab_topik: 'Bab 2 - Landasan Teori & Kajian Pustaka',
    catatan_mahasiswa: 'Pengajuan kajian pustaka algoritma N-Gram dan Trigram Similarity.',
    masukan_dosen: 'Tambahkan referensi jurnal terindeks SINTA/Scopus 3 tahun terakhir pada bagian persamaan Trigram.',
    file_revisi_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    status: 'disetujui',
    created_at: '2026-08-27T13:30:00Z'
  },
  {
    id: 'cons-3',
    mhs_nim: '09010182428002',
    mhs_nama: 'Aulia Azzahra',
    pembimbing: 'Pembimbing 1',
    dosen_nama: 'Dr. Ir. Hendra Kusuma, M.T.',
    tanggal: '2026-09-05',
    waktu: '09:00',
    bab_topik: 'Bab 3 - Metodologi Penelitian & Perancangan Sistem',
    catatan_mahasiswa: 'Pengajuan diagram alur Use Case, ERD Database, dan Flowchart Algoritma Peminjaman Ruangan.',
    masukan_dosen: 'Desain ERD sudah lengkap. Lanjutkan ke tahap pengujian prototype web.',
    file_revisi_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    status: 'disetujui',
    created_at: '2026-09-05T09:00:00Z'
  },
  {
    id: 'cons-4',
    mhs_nim: '09010182428002',
    mhs_nama: 'Aulia Azzahra',
    pembimbing: 'Pembimbing 2',
    dosen_nama: 'Siti Nurhaliza, S.Kom., M.Kom.',
    tanggal: '2026-09-10',
    waktu: '14:00',
    bab_topik: 'Bab 4 - Hasil dan Pembahasan (Analisis Uji Coba)',
    catatan_mahasiswa: 'Mengunggah draf bab 4 berupa grafik performa kecepatan kalkulasi skor similarity.',
    masukan_dosen: 'Mohon rapikan tabel pengujian black-box dan lengkapi screenshot antarmuka.',
    file_revisi_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    status: 'perlu_revisi',
    created_at: '2026-09-10T14:00:00Z'
  }
];

export const MOCK_ADVISORS = [
  {
    id: 'adv-1',
    nip: '197805122005011002',
    nama: 'Dr. Ir. Hendra Kusuma, M.T.',
    email: 'hendra.kusuma@unsri.ac.id',
    no_hp: '081278901234',
    prodi: 'D3 Manajemen Informatika',
    keahlian: ['Sistem Informasi', 'Rekayasa Web', 'Manajemen Basis Data'],
    kuota_dospem1: 8,
    kuota_dospem2: 8,
    status: 'aktif'
  },
  {
    id: 'adv-2',
    nip: '198804102015042001',
    nama: 'Siti Nurhaliza, S.Kom., M.Kom.',
    email: 'siti.nurhaliza@unsri.ac.id',
    no_hp: '081367891200',
    prodi: 'D3 Manajemen Informatika',
    keahlian: ['UI/UX Design', 'Frontend Engineering', 'Mobile Development'],
    kuota_dospem1: 8,
    kuota_dospem2: 8,
    status: 'aktif'
  },
  {
    id: 'adv-3',
    nip: '198509152010121004',
    nama: 'Budi Santoso, S.Kom., M.Kom.',
    email: 'budi.santoso@unsri.ac.id',
    no_hp: '081298765432',
    prodi: 'D3 Manajemen Informatika',
    keahlian: ['Jaringan Komputer', 'Keamanan Siber', 'Cloud Computing'],
    kuota_dospem1: 6,
    kuota_dospem2: 6,
    status: 'aktif'
  },
  {
    id: 'adv-4',
    nip: '198203112008031003',
    nama: 'Prof. Dr. Ahmad Dahlan, S.T., M.Kom.',
    email: 'ahmad.dahlan@unsri.ac.id',
    no_hp: '081122334455',
    prodi: 'D3 Manajemen Informatika',
    keahlian: ['Artificial Intelligence', 'Data Science', 'Machine Learning'],
    kuota_dospem1: 5,
    kuota_dospem2: 5,
    status: 'aktif'
  },
  {
    id: 'adv-5',
    nip: '199001152019032015',
    nama: 'Rina Wijaya, M.T.',
    email: 'rina.wijaya@unsri.ac.id',
    no_hp: '085211223344',
    prodi: 'D3 Manajemen Informatika',
    keahlian: ['E-Business', 'ERP Systems', 'Analisis Proses Bisnis'],
    kuota_dospem1: 6,
    kuota_dospem2: 6,
    status: 'aktif'
  }
];

export const MOCK_STUDENT_ADVISORS = [
  {
    id: 'std-adv-1',
    student_nim: '09010182428002',
    student_nama: 'Aulia Azzahra',
    prodi: 'D3 Manajemen Informatika',
    judul_ta: 'Rancang Bangun Sistem Informasi Manajemen Tugas Akhir & Peminjaman Ruang Sidang Berbasis Web',
    dospem1_nip: '197805122005011002',
    dospem2_nip: '198804102015042001',
    status_pembagian: 'lengkap',
    updated_at: '2026-09-10T10:00:00Z'
  },
  {
    id: 'std-adv-2',
    student_nim: '09031182328001',
    student_nama: 'Ahmad Rizky Pratama',
    prodi: 'D3 Manajemen Informatika',
    judul_ta: 'Pengembangan Aplikasi Mobile Pemantauan Progres Bimbingan Tugas Akhir',
    dospem1_nip: '197805122005011002',
    dospem2_nip: '198509152010121004',
    status_pembagian: 'lengkap',
    updated_at: '2026-09-11T11:00:00Z'
  },
  {
    id: 'std-adv-3',
    student_nim: '09031182328002',
    student_nama: 'Siti Sarah Rahmawati',
    prodi: 'D3 Manajemen Informatika',
    judul_ta: 'Analisis Dan Perancangan UI/UX Portal Alumni Fakultas Ilmu Komputer UNSRI',
    dospem1_nip: '198804102015042001',
    dospem2_nip: '',
    status_pembagian: 'partial',
    updated_at: '2026-09-12T09:30:00Z'
  },
  {
    id: 'std-adv-4',
    student_nim: '09031182328003',
    student_nama: 'Bagus Tri Handoko',
    prodi: 'D3 Manajemen Informatika',
    judul_ta: 'Implementasi Algoritma Clustering Untuk Pengelompokan Minat Penelitian Mahasiswa',
    dospem1_nip: '',
    dospem2_nip: '',
    status_pembagian: 'belum',
    updated_at: '2026-09-12T14:00:00Z'
  },
  {
    id: 'std-adv-5',
    student_nim: '09031182328004',
    student_nama: 'Dina Lestari',
    prodi: 'D3 Manajemen Informatika',
    judul_ta: 'Sistem Informasi Inventaris Laboratorium Berbasis QR Code Pada Gedung DIPKOM',
    dospem1_nip: '',
    dospem2_nip: '',
    status_pembagian: 'belum',
    updated_at: '2026-09-13T08:15:00Z'
  }
];


// ============================================================
// ADMIN SIMTA MOCK DATA
// ============================================================

export const MOCK_ADMIN_DOCUMENTS = [
  {
    id: 'doc-1',
    nama: 'Surat Keterangan Aktif Kuliah',
    jenis: 'Surat Keterangan',
    deskripsi: 'Template surat keterangan aktif kuliah untuk mahasiswa aktif semester ini.',
    file_name: 'surat-keterangan-aktif.pdf',
    file_url: '#',
    tanggal_upload: '2026-09-01',
    status: 'aktif',
    uploader: 'Rina Agustina'
  },
  {
    id: 'doc-2',
    nama: 'Surat Pengajuan Judul TA',
    jenis: 'Surat Pengajuan',
    deskripsi: 'Formulir pengajuan judul tugas akhir untuk mahasiswa D3 Manajemen Informatika.',
    file_name: 'form-ajuan-judul-ta.docx',
    file_url: '#',
    tanggal_upload: '2026-09-03',
    status: 'aktif',
    uploader: 'Rina Agustina'
  },
  {
    id: 'doc-3',
    nama: 'Berita Acara Seminar Proposal',
    jenis: 'Berita Acara',
    deskripsi: 'Dokumen berita acara seminar proposal tugas akhir yang wajib ditandatangani penguji.',
    file_name: 'berita-acara-sempro.docx',
    file_url: '#',
    tanggal_upload: '2026-09-05',
    status: 'aktif',
    uploader: 'Rina Agustina'
  },
  {
    id: 'doc-4',
    nama: 'Surat Pengantar Penelitian',
    jenis: 'Surat Pengantar',
    deskripsi: 'Surat pengantar resmi dari fakultas untuk keperluan penelitian lapangan mahasiswa.',
    file_name: 'surat-pengantar-penelitian.pdf',
    file_url: '#',
    tanggal_upload: '2026-09-08',
    status: 'nonaktif',
    uploader: 'Rina Agustina'
  },
  {
    id: 'doc-5',
    nama: 'Lembar Persetujuan Pembimbing',
    jenis: 'Formulir',
    deskripsi: 'Lembar persetujuan dosen pembimbing 1 dan 2 untuk naskah tugas akhir.',
    file_name: 'lembar-persetujuan-pembimbing.docx',
    file_url: '#',
    tanggal_upload: '2026-09-10',
    status: 'aktif',
    uploader: 'Rina Agustina'
  },
  {
    id: 'doc-6',
    nama: 'Panduan Penulisan Tugas Akhir',
    jenis: 'Panduan',
    deskripsi: 'Buku panduan lengkap tata cara penulisan tugas akhir D3 Manajemen Informatika UNSRI.',
    file_name: 'panduan-penulisan-ta-2026.pdf',
    file_url: '#',
    tanggal_upload: '2026-09-12',
    status: 'aktif',
    uploader: 'Rina Agustina'
  }
];

export const MOCK_ADMIN_CMS = [
  {
    id: 'cms-1',
    judul: 'Selamat Datang di SIMTA',
    kategori: 'Beranda',
    isi: 'Selamat datang di Sistem Informasi Manajemen Tugas Akhir (SIMTA) Fakultas Ilmu Komputer Universitas Sriwijaya. Platform ini dirancang untuk memudahkan proses pengajuan, pembimbingan, dan sidang tugas akhir mahasiswa D3 Manajemen Informatika.',
    status: 'publikasi',
    updated_at: '2026-09-01T08:00:00Z',
    penulis: 'Rina Agustina'
  },
  {
    id: 'cms-2',
    judul: 'Panduan Pengajuan Judul TA',
    kategori: 'Panduan',
    isi: 'Untuk mengajukan judul tugas akhir, mahasiswa harus memiliki minimal 100 SKS yang telah lulus, IPK minimal 2.75, dan telah menyelesaikan mata kuliah Metodologi Penelitian. Selanjutnya, mahasiswa mengisi formulir pengajuan judul melalui menu Ajukan Judul TA dan menunggu persetujuan dari Kaprodi.',
    status: 'publikasi',
    updated_at: '2026-09-02T10:30:00Z',
    penulis: 'Rina Agustina'
  },
  {
    id: 'cms-3',
    judul: 'Jadwal Seminar Proposal Semester Ganjil 2026/2027',
    kategori: 'Pengumuman',
    isi: 'Seminar proposal tugas akhir semester ganjil 2026/2027 akan dilaksanakan mulai 15 Oktober 2026. Mahasiswa yang telah mendapat persetujuan judul dari Kaprodi dapat segera mendaftarkan diri melalui sistem peminjaman ruang sidang.',
    status: 'draf',
    updated_at: '2026-09-05T14:00:00Z',
    penulis: 'Rina Agustina'
  },
  {
    id: 'cms-4',
    judul: 'Ketentuan Upload Repository TA',
    kategori: 'Panduan',
    isi: 'Setelah sidang akhir dinyatakan lulus, mahasiswa wajib mengupload repository tugas akhir dalam format ZIP yang berisi: source code aplikasi, laporan PDF, dan dokumentasi teknis. Ukuran file maksimal 200MB. Repository akan diverifikasi oleh Kaprodi sebelum dipublikasikan.',
    status: 'publikasi',
    updated_at: '2026-09-07T09:15:00Z',
    penulis: 'Rina Agustina'
  },
  {
    id: 'cms-5',
    judul: 'Kontak dan Layanan Akademik',
    kategori: 'Informasi',
    isi: 'Untuk pertanyaan seputar administrasi tugas akhir, silakan menghubungi Admin SIMTA di admin.simta@unsri.ac.id atau datang langsung ke Gedung DIPKOM Lt. 1, Kampus Bukit Palembang, pada hari Senin-Jumat pukul 08.00-16.00 WIB.',
    status: 'publikasi',
    updated_at: '2026-09-10T11:00:00Z',
    penulis: 'Rina Agustina'
  },
  {
    id: 'cms-6',
    judul: 'FAQ Proses Bimbingan Tugas Akhir',
    kategori: 'FAQ',
    isi: 'Q: Berapa kali minimal bimbingan yang harus dilakukan? A: Minimal 8 kali bimbingan dengan Dosen Pembimbing 1 dan 6 kali dengan Dosen Pembimbing 2. Q: Apa yang dimaksud kartu bimbingan digital? A: Kartu bimbingan digital adalah rekap otomatis seluruh sesi bimbingan yang dapat dicetak untuk keperluan administrasi sidang.',
    status: 'draf',
    updated_at: '2026-09-15T13:45:00Z',
    penulis: 'Rina Agustina'
  }
];

export const MOCK_ADMIN_TEMPLATES = [
  {
    id: 'tpl-1',
    nama: 'Template Proposal Tugas Akhir',
    jenis: 'Proposal',
    deskripsi: 'Template Microsoft Word standar untuk penulisan proposal tugas akhir D3 Manajemen Informatika sesuai panduan terbaru 2026.',
    file_name: 'template-proposal-ta-2026.docx',
    file_url: '#',
    status: 'aktif',
    updated_at: '2026-09-01',
    ukuran: '245 KB'
  },
  {
    id: 'tpl-2',
    nama: 'Template Laporan Akhir Tugas Akhir',
    jenis: 'Laporan',
    deskripsi: 'Template resmi laporan tugas akhir lengkap dengan cover, lembar pengesahan, daftar isi otomatis, dan format daftar pustaka IEEE.',
    file_name: 'template-laporan-ta-2026.docx',
    file_url: '#',
    status: 'aktif',
    updated_at: '2026-09-01',
    ukuran: '389 KB'
  },
  {
    id: 'tpl-3',
    nama: 'Template Slide Presentasi Seminar Proposal',
    jenis: 'Presentasi',
    deskripsi: 'Template PowerPoint untuk presentasi seminar proposal dengan desain resmi Fasilkom UNSRI.',
    file_name: 'template-slide-sempro.pptx',
    file_url: '#',
    status: 'aktif',
    updated_at: '2026-09-03',
    ukuran: '1.2 MB'
  },
  {
    id: 'tpl-4',
    nama: 'Template Slide Presentasi Sidang Akhir',
    jenis: 'Presentasi',
    deskripsi: 'Template PowerPoint untuk presentasi sidang akhir tugas akhir, telah diupdate dengan logo universitas terbaru.',
    file_name: 'template-slide-sidang.pptx',
    file_url: '#',
    status: 'aktif',
    updated_at: '2026-09-03',
    ukuran: '1.5 MB'
  },
  {
    id: 'tpl-5',
    nama: 'Template Berita Acara Sidang (Lama)',
    jenis: 'Berita Acara',
    deskripsi: 'Template berita acara sidang versi lama (2024). Sudah tidak digunakan, hanya sebagai arsip.',
    file_name: 'template-ba-sidang-2024.docx',
    file_url: '#',
    status: 'nonaktif',
    updated_at: '2024-08-15',
    ukuran: '87 KB'
  },
  {
    id: 'tpl-6',
    nama: 'Template Jurnal Ilmiah Fasilkom',
    jenis: 'Jurnal',
    deskripsi: 'Template artikel jurnal ilmiah Fasilkom UNSRI untuk publikasi hasil penelitian tugas akhir.',
    file_name: 'template-jurnal-fasilkom.docx',
    file_url: '#',
    status: 'aktif',
    updated_at: '2026-09-10',
    ukuran: '156 KB'
  }
];
