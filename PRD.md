# Product Requirements Document (PRD)

## SITA-RS — Sistem Informasi Tugas Akhir & Ruang Sidang (Terpadu)
### *Integrasi SIM-TA (Manajemen Judul) + Sistem Peminjaman Ruang Sidang*

| Item | Detail |
|---|---|
| **Nama Proyek** | SITA-RS (Sistem Informasi Tugas Akhir & Ruang Sidang) |
| **Nama Sebelumnya** | Penggabungan dari **SIM-TA** (manajemen judul & similarity check) dan **Sistem Manajemen Jadwal & Peminjaman Ruang Sidang** |
| **Target Implementasi** | Program Studi D3 Manajemen Informatika — Fakultas Ilmu Komputer, Universitas Sriwijaya |
| **Versi Dokumen** | 2.0 (Penggabungan & Pengembangan) |
| **Status** | Draft — Siap untuk Review Pembimbing |
| **Jenis Dokumen** | PRD (Product Requirements Document) untuk Tugas Akhir |
| **Riwayat Versi** | v1.0 SIM-TA & v1.0 Ruang Sidang disusun terpisah → v2.0 digabung menjadi satu platform tunggal dengan sejumlah fitur baru hasil pengembangan |

---

## 1. Ringkasan Eksekutif (Executive Summary)

Selama ini Program Studi D3 Manajemen Informatika mengelola dua proses akademik yang sebenarnya **berada dalam satu perjalanan yang sama** — perjalanan seorang mahasiswa menyelesaikan Tugas Akhir — tetapi ditangani oleh dua sistem manual yang terpisah:

1. **Pengajuan & tinjauan judul TA**, yang rawan duplikasi karena arsip judul historis tidak lengkap dan proses tinjauan kemiripan dilakukan manual oleh Kaprodi.
2. **Peminjaman ruang sidang/seminar**, yang juga manual — mahasiswa harus menghubungi beberapa admin untuk mengecek ketersediaan ruangan setiap kali akan seminar proposal, seminar hasil, maupun sidang akhir.

Kedua proses ini sebenarnya **saling bergantung secara alur**: judul TA yang disetujui akan bermuara pada rangkaian kegiatan yang masing-masing membutuhkan ruangan (seminar proposal → seminar hasil → sidang akhir). Selama ini keterkaitan itu tidak pernah direpresentasikan dalam satu sistem, sehingga data mahasiswa, judul, dan riwayat ruangan tersebar dan harus diinput ulang berkali-kali.

**SITA-RS** menggabungkan kedua kebutuhan tersebut menjadi **satu platform terpadu** dengan satu identitas mahasiswa (NIM), satu basis data, dan satu alur kerja end-to-end: mulai dari pengajuan judul dengan *Similarity Check Engine*, hingga penjadwalan ruang dan (opsional) penguji untuk setiap tahapan sidang, lengkap dengan dashboard analitik bagi Kaprodi dan Admin Sarana.

Dengan penggabungan ini, sejumlah fitur baru menjadi mungkin dan sengaja dikembangkan lebih lanjut pada versi ini, di antaranya: **pra-pengisian otomatis form peminjaman ruangan dari data judul TA yang sudah disetujui**, **penjadwalan yang mempertimbangkan ketersediaan ruangan sekaligus dosen penguji**, **dashboard analitik gabungan** (tren topik vs. tingkat keterpakaian ruangan), serta **ekspor laporan untuk kebutuhan akreditasi**.

---

## 2. Latar Belakang Masalah (Gabungan)

### 2.1 Dari sisi manajemen judul TA
1. **Keterbatasan cakupan data historis** — arsip judul akademik yang tersedia (mis. SIMAK UNSRI) hanya mencakup dua angkatan terakhir, sehingga judul dari angkatan lebih lama tidak dapat dijadikan pembanding.
2. **Risiko duplikasi judul** — tanpa arsip lengkap, mahasiswa berpotensi mengajukan topik yang secara substansi sudah pernah dikerjakan.
3. **Tinjauan manual dan tidak transparan** — Kaprodi memeriksa kemiripan judul secara manual; mahasiswa tidak punya visibilitas atas status pengajuannya.

### 2.2 Dari sisi peminjaman ruang sidang
4. **Informasi ketersediaan ruangan tidak terpusat** — mahasiswa harus menghubungi beberapa admin berbeda untuk mengecek ruangan kosong.
5. **Proses persetujuan tidak terintegrasi** — status pengajuan peminjaman tidak dapat dipantau mahasiswa secara langsung.
6. **Potensi bentrok jadwal** — pengecekan ketersediaan dilakukan manual sehingga rawan human error.
7. **Belum ada mekanisme rekomendasi ruangan berbasis prioritas jurusan.**

### 2.3 Masalah baru yang muncul akibat kedua proses berjalan terpisah (alasan penggabungan)
8. **Duplikasi entri data** — mahasiswa yang sudah mengisi data diri saat mengajukan judul harus mengisi ulang data yang sama (nama, NIM, jurusan) saat meminjam ruangan untuk seminar/sidang.
9. **Tidak ada jejak keterkaitan** antara status judul TA dan histori pemakaian ruangan seorang mahasiswa — Kaprodi tidak bisa melihat dalam satu layar apakah mahasiswa dengan judul "Disetujui" sudah menjadwalkan seminar proposalnya.
10. **Dua sistem = dua kredensial, dua alur approval, dua sumber laporan** — menyulitkan penyusunan laporan akreditasi yang membutuhkan data judul TA sekaligus bukti pelaksanaan sidang.

---

## 3. Solusi yang Diusulkan

Membangun **satu portal Tugas Akhir tingkat Program Studi** yang menyatukan dua kapabilitas inti:

- **Modul Judul TA** — mesin pendeteksi kemiripan judul otomatis (*Similarity Check Engine*) yang berjalan real-time sebelum judul diajukan, toleran terhadap sinonim, variasi kata, dan typo.
- **Modul Ruang & Jadwal Sidang** — pengecekan ketersediaan ruangan real-time berbasis timeline, dengan rekomendasi ruangan berbasis prioritas jurusan, yang **terhubung langsung** ke data judul TA mahasiswa yang bersangkutan.

Kedua modul berbagi satu basis data mahasiswa dan satu status perjalanan TA (*thesis journey*), sehingga status "judul disetujui" dapat otomatis membuka opsi "ajukan ruang seminar proposal" tanpa mahasiswa mengisi ulang data.

### 3.1 Tujuan Utama (Gabungan)

| # | Tujuan | Indikator Keberhasilan |
|---|---|---|
| T1 | Mencegah duplikasi judul TA | Kasus duplikasi judul terverifikasi Kaprodi mendekati 0% setelah sistem berjalan |
| T2 | Menyediakan arsip digital lokal Prodi (judul & pemakaian ruangan) | 100% judul TA dan histori ruangan terdata dalam satu database terpusat |
| T3 | Mempercepat proses tinjauan Kaprodi & Admin Sarana | Waktu rata-rata tinjauan per pengajuan turun signifikan dibanding proses manual |
| T4 | Meningkatkan transparansi proses bagi mahasiswa | Mahasiswa dapat melacak status judul **dan** status peminjaman ruangan dalam satu dashboard |
| T5 | Menghilangkan duplikasi input data mahasiswa | Data diri & jurusan otomatis terisi ulang di form peminjaman ruangan dari profil TA |
| T6 | Mencegah bentrok jadwal ruangan | Validasi otomatis 100% sebelum pengajuan peminjaman disetujui sistem |
| T7 | Memberikan rekomendasi ruangan berbasis prioritas jurusan | Sistem memeriksa ruangan sesuai urutan prioritas hingga menemukan slot tersedia |
| T8 | Menyediakan data terpadu untuk pelaporan akreditasi | Laporan judul TA & histori sidang dapat diekspor dalam satu klik (PDF/Excel) |

---

## 4. Ruang Lingkup Proyek

Karena sistem gabungan ini jauh lebih kompleks dari masing-masing sistem asal, ruang lingkup dipecah menjadi **fase pengembangan** agar tetap dapat diselesaikan sebagai proyek Tugas Akhir dalam waktu yang realistis, sambil tetap menunjukkan arsitektur akhir yang terintegrasi.

### 4.1 Fase 1 — MVP Inti (Wajib, dalam lingkup TA ini)

**Autentikasi & Profil**
- Autentikasi berbasis role: Mahasiswa (login NIM), Kaprodi, Admin Sarana (admin ruangan). *(Perubahan dari PRD ruang sidang versi awal: mahasiswa kini **memiliki akun**, karena data mahasiswa dipakai bersama oleh kedua modul.)*
- Satu profil mahasiswa berisi data diri, jurusan/kelas, dan riwayat TA.

**Modul Judul TA**
- Form pengajuan judul dengan pengecekan kemiripan real-time (FTS + trigram, skor gabungan).
- Dashboard status pengajuan judul untuk mahasiswa (Draft → Diajukan → Ditinjau → Disetujui/Ditolak).
- Dashboard tinjauan & ACC/Tolak untuk Kaprodi, lengkap skor kemiripan & daftar judul pembanding.
- Bulk import data judul historis (Excel/CSV) dengan validasi & preview.
- Riwayat & log pengajuan per mahasiswa (termasuk revisi setelah ditolak).

**Modul Ruang & Jadwal Sidang**
- Halaman jadwal ruangan berbasis timeline (referensi konsep SIMLAB), filter tanggal/gedung/ruangan/status.
- Form pengajuan peminjaman ruangan — **pra-terisi otomatis** dari profil mahasiswa & data judul TA yang berstatus Disetujui (nama, NIM, jurusan, judul TA, pembimbing jika ada).
- Sistem rekomendasi ruangan berbasis prioritas jurusan (dikelola dinamis oleh Admin Sarana, bukan hard-coded).
- Validasi anti-bentrok jadwal otomatis sebelum pengajuan diterima.
- Dashboard tinjauan & Approve/Reject untuk Admin Sarana, dengan kolom alasan penolakan wajib.
- Manajemen ruangan (tambah/ubah/nonaktifkan/maintenance) oleh Admin Sarana.

**Integrasi Dua Modul (fitur baru hasil penggabungan)**
- **Thesis Journey / Tahapan TA**: setelah judul *Disetujui*, mahasiswa dapat mengajukan ruangan untuk tiga tahapan berurutan — *Seminar Proposal → Seminar Hasil → Sidang Akhir* — masing-masing tercatat sebagai satu `thesis_stage` terhubung ke judul TA yang sama.
- Kaprodi dan Admin Sarana melihat **satu dashboard gabungan**: status judul + status tahapan sidang + status ruangan dalam satu tampilan per mahasiswa.
- Notifikasi in-app terpadu untuk kedua modul (perubahan status judul maupun status peminjaman).
- Audit trail terpadu: setiap perubahan status (judul maupun ruangan) tercatat dengan timestamp dan aktor.

### 4.2 Fase 2 — Pengembangan Lanjutan (disiapkan arsitekturnya di Fase 1, diimplementasikan jika waktu memungkinkan)

- Modul **Dosen Pembimbing**: validasi awal judul sebelum ke Kaprodi; melihat daftar mahasiswa bimbingan.
- Modul **Dosen Penguji & Penjadwalan Penguji**: penjadwalan ruangan yang mempertimbangkan juga ketersediaan dosen penguji (bukan hanya ruangan), dengan deteksi bentrok jadwal dosen.
- Notifikasi email/WhatsApp (integrasi mis. Resend/Fonnte) selain notifikasi in-app.
- Dashboard analitik lanjutan: tren topik pengajuan **dikorelasikan** dengan tingkat keterpakaian ruangan per periode.
- Ekspor laporan PDF/Excel untuk kebutuhan borang akreditasi (daftar judul TA & rekap penggunaan ruang sidang per semester).
- Reschedule / pembatalan mandiri oleh mahasiswa dalam batas waktu kebijakan tertentu.
- Kalender ekspor (iCal) untuk dosen pembimbing/penguji.

### 4.3 Di Luar Lingkup (Out-of-Scope — tidak direncanakan pada horizon proyek ini)

- Integrasi langsung/otomatis dengan SIMAK UNSRI (hanya import manual).
- Modul bimbingan TA penuh (logbook bimbingan per-pertemuan, penilaian akhir).
- Deteksi plagiarisme isi dokumen (BAB I–V) — sistem hanya mendeteksi kemiripan **judul & deskripsi singkat**.
- Sistem pembayaran/sewa ruangan.
- Sistem absensi kehadiran fisik & integrasi perangkat IoT untuk membuka pintu ruangan.
- Pengelolaan inventaris ruangan secara detail (barang per ruangan, jadwal servis AC, dsb).
- Aplikasi mobile native Android/iOS (MVP web-responsive saja).
- Multi-prodi / multi-fakultas pada versi awal (struktur data dirancang agar siap diperluas, lihat §12.4).

---

## 5. Pengguna Sistem (Role-Based Access Control)

| Role | Cakupan Akses | Catatan Perubahan dari PRD Asal |
|---|---|---|
| **Mahasiswa** | Ajukan judul TA, pantau status; ajukan ruangan untuk tiap tahapan sidang setelah judul disetujui; pantau status peminjaman; lihat riwayat lengkap TA-nya | Sebelumnya modul ruang sidang **tidak mensyaratkan login**; pada sistem gabungan mahasiswa **wajib login** karena kedua modul berbagi satu profil. Trade-off ini dibahas di §13 (Risiko). |
| **Kaprodi** | Tinjau & ACC/Tolak judul TA (dengan skor kemiripan); bulk import judul historis; lihat dashboard gabungan status tahapan TA seluruh mahasiswa; lihat statistik tren topik | Peran murni akademik — tidak mengelola ruangan secara operasional |
| **Admin Sarana** *(peran baru, pemisahan dari "Admin" generik di PRD ruang sidang)* | Kelola data ruangan & gedung; kelola prioritas ruangan per jurusan; tinjau & Approve/Reject pengajuan peminjaman ruangan; kelola jadwal ruangan | Dipisah dari Kaprodi agar tanggung jawab akademik (judul) dan tanggung jawab operasional (ruangan) tidak tercampur pada satu akun |
| **Dosen Pembimbing** *(opsional, Fase 2)* | Validasi awal judul mahasiswa bimbingan; lihat status tahapan sidang mahasiswa bimbingan | — |
| **Dosen Penguji** *(opsional, Fase 2)* | Lihat jadwal sidang yang melibatkan dirinya; konfirmasi ketersediaan | Baru — hasil pengembangan lanjutan dari fitur penjadwalan ruangan |
| **Super Admin** *(opsional)* | Mengelola akun seluruh role di atas | Diturunkan dari peran "Admin" pengelola pengguna pada SIM-TA versi awal |

---

## 6. Alur Perjalanan Mahasiswa End-to-End (User Journey Gabungan)

```
Mahasiswa Login (NIM)
      │
      ▼
Isi/Lengkapi Profil (data diri, jurusan, kelas — sekali saja, dipakai ulang di seluruh modul)
      │
      ▼
┌───────────────────────── MODUL JUDUL TA ─────────────────────────┐
│  Isi Form Judul + Deskripsi                                      │
│       │                                                          │
│       ▼                                                          │
│  Similarity Check real-time (FTS + trigram, skor gabungan)       │
│       ├── 0–40%   → Submit aktif, tanpa peringatan                │
│       ├── 41–70%  → Peringatan kuning + daftar judul mirip        │
│       └── >70%    → Submit terkunci, wajib revisi judul           │
│       │                                                          │
│       ▼                                                          │
│  Submit → Status "Diajukan" → notifikasi ke Kaprodi               │
│       │                                                          │
│       ▼                                                          │
│  Kaprodi meninjau → ACC / Tolak (+catatan)                        │
└───────────────────────────┬──────────────────────────────────────┘
                             │ (jika ACC)
                             ▼
┌────────────────────── MODUL RUANG & JADWAL SIDANG (per tahapan) ─┐
│  Status judul "Disetujui" → tombol "Ajukan Ruang Seminar Proposal"│
│  aktif; form peminjaman PRA-TERISI dari profil & data judul TA    │
│       │                                                          │
│       ▼                                                          │
│  Pilih tanggal & jam → Sistem cek ketersediaan + prioritas jurusan│
│       │                                                          │
│       ▼                                                          │
│  Tampilkan jadwal timeline & rekomendasi ruangan → pilih ruangan  │
│       │                                                          │
│       ▼                                                          │
│  Konfirmasi → Ajukan → Status "Menunggu Persetujuan"              │
│       │                                                          │
│       ▼                                                          │
│  Admin Sarana meninjau → Setujui / Tolak (+alasan)                │
│       │                                                          │
│       ▼                                                          │
│  Notifikasi ke mahasiswa → Tahapan "Seminar Proposal" selesai     │
│  → tahapan berikutnya (Seminar Hasil) terbuka, ulangi alur di atas│
│  → lalu tahapan terakhir (Sidang Akhir), ulangi alur di atas      │
└────────────────────────────────────────────────────────────────┘
                             │
                             ▼
                 Seluruh tahapan selesai → Status TA: "Selesai"
                 (riwayat lengkap judul + 3 tahapan ruangan tersimpan)
```

---

## 7. Functional Requirements (Gabungan & Diperluas)

### 7.1 Modul Judul TA

| ID | Requirement | Prioritas |
|---|---|---|
| FR-01 | Sistem menyediakan autentikasi berbasis role (Mahasiswa/Kaprodi/Admin Sarana) | Must Have |
| FR-02 | Mahasiswa dapat membuat, menyimpan draft, dan mengajukan judul TA | Must Have |
| FR-03 | Sistem menghitung skor kemiripan judul secara real-time sebelum submit | Must Have |
| FR-04 | Sistem menampilkan daftar judul pembanding beserta skor kemiripannya | Must Have |
| FR-05 | Sistem menerapkan aturan threshold (aman/peringatan/blokir) sesuai skor | Must Have |
| FR-06 | Kaprodi dapat melakukan ACC/Tolak judul beserta catatan | Must Have |
| FR-07 | Kaprodi dapat melakukan bulk import judul historis via Excel/CSV dengan preview & validasi | Must Have |
| FR-08 | Mahasiswa dapat melacak status pengajuan judulnya | Must Have |
| FR-09 | Sistem mencatat log setiap perubahan status judul (audit trail) | Should Have |
| FR-10 | Dosen Pembimbing dapat memberi catatan validasi awal sebelum ke Kaprodi | Could Have (Fase 2) |
| FR-11 | Kaprodi dapat melihat dashboard tren topik pengajuan | Could Have |

### 7.2 Modul Ruang & Jadwal Sidang

| ID | Requirement | Prioritas |
|---|---|---|
| FR-12 | Sistem menampilkan jadwal ruangan berbasis timeline sesuai tanggal & waktu | Must Have |
| FR-13 | Sistem menampilkan status ketersediaan ruangan (Tersedia/Terpakai/Menunggu/Maintenance) | Must Have |
| FR-14 | Mahasiswa dapat memfilter jadwal berdasarkan tanggal, gedung, ruangan, dan status | Must Have |
| FR-15 | Sistem memberikan rekomendasi ruangan berdasarkan urutan prioritas jurusan yang dikonfigurasi dinamis | Must Have |
| FR-16 | Mahasiswa dapat mengajukan peminjaman ruangan untuk tahapan sidang tertentu | Must Have |
| FR-17 | Sistem melakukan validasi anti-bentrok sebelum pengajuan diterima | Must Have |
| FR-18 | Admin Sarana dapat melihat seluruh pengajuan peminjaman & melakukan Approve/Reject | Must Have |
| FR-19 | Admin Sarana wajib mengisi alasan saat menolak pengajuan | Must Have |
| FR-20 | Admin Sarana dapat mengelola data ruangan (tambah/ubah/status Aktif/Tidak Aktif/Maintenance) | Must Have |
| FR-21 | Admin Sarana dapat mengelola prioritas ruangan per jurusan | Must Have |
| FR-22 | Mahasiswa dapat melihat status peminjaman ruangannya | Must Have |
| FR-23 | Sistem memberi kode unik untuk setiap pengajuan peminjaman | Should Have |
| FR-24 | Admin Sarana dapat melihat statistik keterpakaian ruangan di dashboard | Should Have |
| FR-25 | Mahasiswa dapat mengajukan pembatalan/reschedule dalam batas waktu kebijakan | Could Have (Fase 2) |

### 7.3 Modul Integrasi (Fitur Baru Hasil Penggabungan)

| ID | Requirement | Prioritas |
|---|---|---|
| FR-26 | Form peminjaman ruangan terisi otomatis dari profil mahasiswa & data judul TA yang sudah disetujui (nama, NIM, jurusan, judul) | Must Have |
| FR-27 | Sistem hanya mengizinkan pengajuan ruangan untuk tahapan sidang bila judul TA berstatus "Disetujui" | Must Have |
| FR-28 | Sistem mencatat setiap pengajuan ruangan sebagai satu `thesis_stage` (Seminar Proposal / Seminar Hasil / Sidang Akhir) yang terhubung ke judul TA terkait | Must Have |
| FR-29 | Tahapan berikutnya baru dapat diajukan setelah tahapan sebelumnya berstatus "Disetujui" dan/atau "Selesai" (urutan dapat dikonfigurasi Kaprodi) | Must Have |
| FR-30 | Kaprodi & Admin Sarana melihat dashboard gabungan: status judul + status seluruh tahapan sidang per mahasiswa dalam satu tampilan | Must Have |
| FR-31 | Sistem mengirim notifikasi in-app terpadu untuk perubahan status di kedua modul | Should Have |
| FR-32 | Sistem mencatat audit trail terpadu (siapa mengubah apa, kapan) lintas modul | Should Have |
| FR-33 | Sistem dapat mengekspor laporan gabungan (judul TA + rekap penggunaan ruang) dalam format PDF/Excel | Could Have (Fase 2) |
| FR-34 | Penjadwalan ruangan mempertimbangkan ketersediaan dosen penguji, bukan hanya ruangan (deteksi bentrok jadwal dosen) | Could Have (Fase 2) |
| FR-35 | Sistem menyediakan ekspor kalender (iCal) untuk dosen pembimbing/penguji | Could Have (Fase 2) |
| FR-36 | Dashboard analitik menampilkan korelasi tren topik pengajuan dengan tingkat keterpakaian ruangan per periode | Could Have (Fase 2) |

---

## 8. Arsitektur Kemiripan Judul (Similarity Engine) — Dipertahankan dari SIM-TA

Algoritma **tidak** menggunakan pencocokan string biasa (`exact match` / `LIKE %...%`), melainkan pipeline pemrosesan bertahap agar hasil deteksi akurat dan toleran terhadap variasi bahasa.

### 8.1 Fase 1 — Text Pre-Processing (Frontend)

1. **Case Folding** — mengonversi seluruh huruf menjadi lowercase.
2. **Punctuation & Number Removal** — menghapus tanda baca, simbol, dan angka yang tidak relevan.
3. **Stop-word Removal** — menghapus kata umum yang dominan muncul di judul TA Manajemen Informatika, mis. *"sistem", "informasi", "aplikasi", "rancang", "bangun", "berbasis", "web", "mobile", "menggunakan", "untuk", "pada", "studi kasus"*. Daftar stop-word disimpan sebagai **konfigurasi dinamis** di database, bukan hard-coded, sehingga Kaprodi dapat menambah/mengurangi tanpa deploy ulang.
4. **Tokenization** — memecah judul menjadi token/kata kunci inti.

### 8.2 Fase 2 — Pencocokan Database (Supabase/PostgreSQL)

- **Full-Text Search (FTS)** — `tsvector`/`tsquery` dengan konfigurasi bahasa Indonesia untuk mencocokkan akar kata (*stemming*) dan variasi/sinonim.
- **pg_trgm (Trigram Similarity)** — memecah kata menjadi potongan 3 karakter untuk mendeteksi kemiripan meski ada typo. Contoh: `"pnedataan"` tetap terdeteksi mirip dengan `"pendataan"`.

### 8.3 Fase 3 — Skor Gabungan (Composite Similarity Score)

```
Skor Akhir (%) = (W1 × Skor_FTS) + (W2 × Skor_Trigram)

Rekomendasi bobot awal:
  W1 (FTS)     = 0.6   → menangkap kemiripan konsep/makna
  W2 (Trigram) = 0.4   → menangkap kemiripan penulisan/typo
```

Bobot dapat dikalibrasi ulang (*tunable*) setelah pengujian dengan data judul riil Prodi.

### 8.4 Aturan Threshold

| Rentang Skor | Status | Perilaku Sistem |
|---|---|---|
| 0% – 40% | 🟢 Aman | Judul diizinkan diajukan tanpa peringatan |
| 41% – 70% | 🟡 Peringatan Kuning | Pop-up peringatan + daftar judul mirip; pengajuan tetap dapat dilanjutkan |
| > 70% | 🔴 Blokir Merah | Tombol Submit dinonaktifkan; mahasiswa wajib merombak judul |

### 8.5 Edge Case yang Perlu Ditangani

- **Judul terlalu pendek** (< 5 kata setelah stop-word removal) → validasi minimum panjang judul.
- **Database kosong/baru** → skor otomatis 0%, sistem tetap berjalan normal.
- **Bulk import format tidak konsisten** → validasi & preview sebelum data historis masuk database.
- **Query berat saat data historis besar** → indexing `GIN` untuk `pg_trgm` dan `tsvector`.

---

## 9. Sistem Rekomendasi & Prioritas Ruangan — Dipertahankan & Diperluas dari Sistem Ruang Sidang

Sistem menentukan rekomendasi ruangan berdasarkan **urutan prioritas per jurusan**, yang disimpan di database (bukan hard-coded) agar dapat diubah Admin Sarana kapan saja.

| Urutan | Contoh untuk Manajemen Informatika |
|---|---|
| 1 | Ruang Sidang DIPKOM |
| 2 | Ruang Sidang Diklat |
| 3 | Ruang Kelas DIPKOM |
| 4 | Ruang Kelas Diklat |

Sistem memeriksa ruangan sesuai urutan prioritas hingga menemukan slot tersedia pada rentang tanggal/jam yang diminta.

### 9.1 Pengembangan Baru — Pencocokan Berdasarkan Jenis Tahapan Sidang

Karena sistem kini mengenal `thesis_stage` (Seminar Proposal/Seminar Hasil/Sidang Akhir), prioritas ruangan dapat **dikombinasikan dengan kebutuhan kapasitas & fasilitas per jenis tahapan** — misalnya sidang akhir mensyaratkan ruangan dengan proyektor dan kapasitas minimum untuk dosen penguji, sedangkan seminar proposal dapat memakai ruang kelas biasa. Aturan ini dikonfigurasi Admin Sarana per jenis tahapan, bukan hanya per jurusan.

### 9.2 Pengembangan Baru (Fase 2) — Ketersediaan Dosen Penguji

Selain memeriksa ketersediaan ruangan, sistem pada Fase 2 dapat memeriksa jadwal ketersediaan dosen penguji yang ditugaskan, dan hanya menampilkan slot yang cocok untuk **ruangan dan seluruh penguji secara bersamaan** — mengurangi kasus jadwal sidang harus diubah ulang karena bentrok dengan jadwal mengajar dosen.

---

## 10. Validasi & Business Rules (Gabungan)

**Judul TA**
- Judul minimal 5 kata setelah stop-word removal.
- Deskripsi/abstrak ± 150–300 kata.
- Tidak dapat submit ulang jika skor kemiripan > 70% tanpa revisi.

**Peminjaman Ruangan**
- Tanggal & jam valid; jam selesai lebih besar dari jam mulai.
- Ruangan berstatus Aktif dan tidak sedang Maintenance.
- Tidak ada peminjaman lain yang bentrok pada ruangan & rentang waktu yang sama.
- Data mahasiswa & keperluan lengkap.
- **(Baru)** Judul TA terkait harus berstatus "Disetujui" sebelum tahapan pertama (Seminar Proposal) dapat diajukan.
- **(Baru)** Tahapan sidang diajukan berurutan — tidak dapat mengajukan Sidang Akhir sebelum Seminar Hasil berstatus Disetujui/Selesai (dapat dikonfigurasi jika Kaprodi ingin fleksibilitas).

---

## 11. Non-Functional Requirements (Gabungan)

| Kategori | Requirement |
|---|---|
| **Performa** | Hasil similarity check tampil < 1 detik untuk database hingga ±2000 judul; halaman jadwal ruangan tampil dengan waktu respons wajar (< 2 detik) |
| **Keamanan** | Autentikasi wajib untuk seluruh role; Row Level Security (RLS) di Supabase agar mahasiswa hanya melihat data miliknya sendiri; halaman Kaprodi/Admin Sarana dilindungi otorisasi berbasis role |
| **Skalabilitas** | Struktur database mendukung penambahan Prodi/Fakultas lain serta penambahan gedung/ruangan tanpa migrasi besar |
| **Usability** | UI responsif (desktop, tablet, smartphone); feedback visual jelas untuk status kemiripan (hijau/kuning/merah) dan status ruangan (Tersedia/Terpakai/Menunggu/Maintenance) |
| **Reliabilitas** | Data pengajuan (judul maupun ruangan) tidak boleh hilang meski koneksi terputus saat submit (autosave draft) |
| **Data Integrity** | Sistem tidak boleh menghasilkan dua peminjaman ruangan yang bentrok pada slot waktu sama |
| **Auditability** | Setiap perubahan status (ACC/Tolak judul, Approve/Reject ruangan) tercatat dengan timestamp dan aktor |
| **Maintainability** | Struktur modul terpisah (judul vs. ruangan) namun berbagi skema identitas, memudahkan pengembangan independen tiap modul |
| **Availability** | Sistem dapat diakses selama layanan hosting/Supabase tersedia |

---

## 12. Spesifikasi Teknis (Tech Stack Terpadu)

| Layer | Teknologi | Catatan |
|---|---|---|
| **Frontend** | React.js + Vite + Tailwind CSS | UI/UX responsif; pre-processing teks similarity dijalankan di sisi client |
| **Backend & Database** | Supabase (PostgreSQL) | Ekstensi `pg_trgm` dan `tsvector`/`tsquery` bawaan PostgreSQL |
| **Autentikasi** | Supabase Auth | Role-based access via tabel `profiles` + RLS policy untuk seluruh role (Mahasiswa, Kaprodi, Admin Sarana, Dosen) |
| **Hosting Frontend** | Vercel / Netlify | Deploy otomatis dari repository |
| **File Import** | `xlsx` / `papaparse` di Frontend, atau Supabase Edge Function | Untuk parsing bulk import Excel/CSV judul historis |
| **Notifikasi (Fase 2)** | Supabase Realtime (in-app) + Resend/Fonnte (email/WhatsApp, opsional) | In-app notification wajib di MVP; kanal eksternal adalah pengembangan lanjutan |
| **Kalender (Fase 2)** | `ics` (npm) untuk ekspor iCal | Untuk dosen pembimbing/penguji |
| **Version Control** | Git + GitHub | — |

### 12.1 Alasan Penyatuan Stack

PRD asal SIM-TA dan PRD ruang sidang sama-sama merekomendasikan React+Vite+Tailwind dan Supabase/PostgreSQL, sehingga penggabungan tidak memerlukan migrasi teknologi — hanya penyatuan skema data dan RBAC.

---

## 13. Rancangan Struktur Data (High-Level, Skema Gabungan)

| Tabel | Fungsi | Sumber Asal |
|---|---|---|
| `profiles` (via Supabase Auth) | id, nim, nama, role (`mahasiswa`/`kaprodi`/`admin_sarana`/`dosen`), jurusan_id, kelas, no_hp, email, created_at | Gabungan `users` (SIM-TA) + `students` (Ruang Sidang) — **disatukan menjadi satu tabel identitas** |
| `departments` | id, name, code | Ruang Sidang, dipakai bersama |
| `thesis_titles` | id, profile_id, judul, deskripsi, judul_processed, status (`draft`/`diajukan`/`disetujui`/`ditolak`), skor_kemiripan_terakhir, created_at, updated_at | SIM-TA |
| `similarity_logs` | id, thesis_title_id, matched_title_id, skor_fts, skor_trigram, skor_gabungan, created_at | SIM-TA |
| `review_notes` | id, thesis_title_id, reviewer_id, role_reviewer, catatan, keputusan, created_at | SIM-TA |
| `historical_imports` | id, judul, tahun_angkatan, sumber_import, imported_by, created_at | SIM-TA |
| `buildings` | id, name, description | Ruang Sidang |
| `rooms` | id, building_id, name, code, type, capacity, facilities, status | Ruang Sidang |
| `room_priorities` | id, department_id, room_id, priority_order, stage_type *(baru)* | Ruang Sidang, diperluas dengan `stage_type` agar prioritas dapat berbeda per jenis tahapan |
| `thesis_stages` **(baru)** | id, thesis_title_id, stage_type (`seminar_proposal`/`seminar_hasil`/`sidang_akhir`), booking_id, status, urutan, created_at | Hasil integrasi — jembatan antara judul TA dan peminjaman ruangan |
| `bookings` | id, thesis_stage_id *(baru, menggantikan referensi bebas ke mahasiswa)*, room_id, booking_date, start_time, end_time, purpose, status, rejection_reason, approved_by, created_at, updated_at | Ruang Sidang, disesuaikan agar terhubung ke `thesis_stages` |
| `examiners` **(Fase 2)** | id, profile_id, spesialisasi | Baru |
| `examiner_assignments` **(Fase 2)** | id, thesis_stage_id, examiner_id, status_konfirmasi | Baru |
| `notifications` | id, profile_id, related_type (`thesis_title`/`booking`), related_id, title, message, status, created_at | Gabungan, digeneralisasi agar menampung notifikasi dari kedua modul |
| `audit_logs` **(baru)** | id, actor_id, action, entity_type, entity_id, created_at | Baru — audit trail lintas modul |

### 13.1 Relasi Kunci

`profiles` 1—N `thesis_titles` · `thesis_titles` 1—N `thesis_stages` · `thesis_stages` 1—1 `bookings` · `rooms` N—1 `buildings` · `room_priorities` menghubungkan `departments` ↔ `rooms` (dengan `stage_type` opsional) · `thesis_stages` N—N `examiners` melalui `examiner_assignments` (Fase 2).

> Skema di atas adalah rancangan awal (level konsep) untuk memudahkan penyusunan ERD di dokumen teknis TA; detail tipe data, constraint, dan foreign key perlu dituangkan lebih lanjut di dokumen desain database (DDL).

### 13.2 Kesiapan Multi-Prodi

Karena `departments` dan `room_priorities` sudah dipisah sejak awal, penambahan Prodi/Fakultas lain di masa depan hanya memerlukan penambahan baris data, bukan migrasi struktur — memenuhi kebutuhan skalabilitas yang disebut di kedua PRD asal.

---

## 14. Struktur Halaman (Sitemap Gabungan)

### 14.1 Mahasiswa

| Halaman | Fungsi |
|---|---|
| `/login` | Login NIM (berlaku untuk kedua modul) |
| `/dashboard` | Ringkasan status judul TA + status tahapan sidang |
| `/thesis/submit` | Form pengajuan judul + similarity check real-time |
| `/thesis/status` | Status & riwayat pengajuan judul |
| `/schedule` | Jadwal & ketersediaan ruangan (timeline) |
| `/room/:id` | Detail ruangan |
| `/booking/apply/:stage` | Form pengajuan ruangan per tahapan (pra-terisi) |
| `/booking/confirmation` | Konfirmasi pengajuan |
| `/booking/status` | Status pengajuan ruangan |

### 14.2 Kaprodi

| Halaman | Fungsi |
|---|---|
| `/kaprodi/dashboard` | Dashboard gabungan: status judul + tahapan sidang seluruh mahasiswa |
| `/kaprodi/titles` | Tinjau & ACC/Tolak judul |
| `/kaprodi/import` | Bulk import judul historis |
| `/kaprodi/analytics` | Tren topik pengajuan (+ korelasi keterpakaian ruangan, Fase 2) |

### 14.3 Admin Sarana

| Halaman | Fungsi |
|---|---|
| `/admin/dashboard` | Ringkasan pengajuan menunggu, statistik keterpakaian ruangan |
| `/admin/bookings` | Kelola seluruh pengajuan (Semua/Menunggu/Disetujui/Ditolak) |
| `/admin/rooms` | Manajemen ruangan & gedung |
| `/admin/priorities` | Manajemen prioritas ruangan per jurusan/tahapan |
| `/admin/schedule` | Jadwal ruangan (timeline & tabel), filter gedung/ruangan/jurusan/status |

---

## 15. Konsep UI/UX

Konsep desain: **Modern Academic Workspace** — menyatukan nuansa visual kedua modul asal agar terasa sebagai satu produk, bukan dua aplikasi yang ditempel.

- Clean, minimalis, modern, dan profesional; tidak menggunakan template dashboard generik.
- Timeline jadwal ruangan sebagai elemen utama halaman jadwal (mengadopsi konsep referensi SIMLAB, disesuaikan).
- Status ruangan (Tersedia/Terpakai/Menunggu/Maintenance) dan status kemiripan judul (hijau/kuning/merah) memakai satu bahasa warna yang konsisten di seluruh aplikasi.
- Kartu ringkasan "Perjalanan TA Saya" pada dashboard mahasiswa menampilkan progres bertahap (Judul → Proposal → Hasil → Sidang Akhir) sebagai stepper visual.
- Rekomendasi ruangan sistem ditampilkan menonjol, bukan tersembunyi di daftar panjang.
- Responsive penuh di desktop, tablet, dan smartphone.

---

## 16. Milestone Pengerjaan (Estimasi Direvisi)

Karena cakupan proyek bertambah signifikan, estimasi waktu direvisi dari masing-masing ±1 semester menjadi rencana yang mengutamakan modul inti lebih dulu, dengan Fase 2 sebagai pengembangan lanjutan bila waktu memungkinkan.

| Fase | Aktivitas | Estimasi Waktu |
|---|---|---|
| 1 | Analisis kebutuhan gabungan, finalisasi PRD, desain ERD terpadu | 2 minggu |
| 2 | Desain UI/UX (wireframe & mockup Figma) untuk kedua modul dalam satu design system | 2 minggu |
| 3 | Setup project (Supabase, React+Vite), autentikasi & RBAC terpadu | 2 minggu |
| 4 | Implementasi Modul Judul TA: form + pre-processing + similarity engine (FTS + pg_trgm) | 3 minggu |
| 5 | Implementasi Modul Ruang & Jadwal: timeline, rekomendasi prioritas, validasi anti-bentrok | 3 minggu |
| 6 | Implementasi integrasi `thesis_stages` (penghubung judul ↔ ruangan) & dashboard gabungan | 2 minggu |
| 7 | Dashboard Kaprodi (tinjau judul, bulk import, analitik dasar) | 1–2 minggu |
| 8 | Dashboard Admin Sarana (kelola ruangan, prioritas, approve/reject) | 1–2 minggu |
| 9 | Notifikasi in-app terpadu & audit trail | 1 minggu |
| 10 | Testing (unit test skor kemiripan & validasi bentrok, UAT dengan data riil) | 2 minggu |
| 11 | Dokumentasi laporan TA & persiapan sidang | 2 minggu |
| — | *(Opsional, jika waktu tersisa)* Fase 2: modul dosen penguji, notifikasi eksternal, ekspor laporan | sesuai kapasitas |

---

## 17. Risiko & Mitigasi (Gabungan & Baru)

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Data historis judul TA tidak lengkap/rapi saat bulk import | Akurasi similarity check menurun | Template Excel/CSV standar + validasi format sebelum import |
| Stop-word list kurang komprehensif | Skor kemiripan bias | Uji coba dengan sample judul riil; daftar stop-word iteratif & dapat dikonfigurasi |
| Performa query lambat saat data bertambah | UX real-time terganggu | Indexing GIN pada kolom trigram & tsvector sejak awal |
| Kaprodi mengabaikan hasil similarity dan tetap ACC judul mirip | Tujuan utama sistem tidak tercapai | Wajib isi catatan alasan bila ACC judul dengan skor kuning |
| Data jadwal ruangan tidak diperbarui admin | Informasi ketersediaan tidak akurat | Admin Sarana wajib memperbarui data; notifikasi pengingat |
| Admin terlambat memproses pengajuan ruangan | Mahasiswa menunggu lama, berisiko menunda tahapan sidang berikutnya | Dashboard menampilkan pengajuan menunggu secara menonjol + SLA internal |
| Bentrok jadwal ruangan | Dua mahasiswa memesan ruangan sama | Validasi otomatis sebelum submit |
| **(Baru)** Mahasiswa keberatan harus memiliki akun (perubahan dari versi "tanpa login" pada sistem ruang sidang asal) | Resistensi adopsi di awal peluncuran | Sosialisasi manfaat single sign-on (data tak perlu diisi ulang); proses registrasi dibuat sesederhana mungkin (NIM + email kampus) |
| **(Baru)** Kompleksitas penggabungan dua alur approval (Kaprodi untuk judul, Admin Sarana untuk ruangan) menyebabkan miskomunikasi peran | Pengajuan salah arah / terabaikan | RBAC tegas per modul + dashboard gabungan agar kedua pihak tetap punya visibilitas lintas modul |
| **(Baru)** Ketergantungan urutan tahapan (`thesis_stages`) terlalu kaku untuk kasus khusus (mis. mahasiswa mengulang tahapan) | Mahasiswa terhambat mengajukan ulang | Kaprodi dapat membuka kembali tahapan tertentu secara manual sebagai pengecualian terdokumentasi |
| Jumlah ruangan/gedung/Prodi bertambah di masa depan | Sistem sulit dikembangkan | Data ruangan, gedung, dan prioritas dibuat dinamis di database sejak awal (lihat §13.2) |

---

## 18. Kriteria Penerimaan (Acceptance Criteria) — Gabungan

### 18.1 Modul Judul TA
- [ ] Mahasiswa dapat login dan mengisi form judul dengan deskripsi.
- [ ] Skor kemiripan tampil real-time sebelum submit, sesuai threshold.
- [ ] Tombol submit otomatis nonaktif saat skor > 70%.
- [ ] Kaprodi dapat melihat daftar pengajuan beserta skor kemiripan dan judul pembanding.
- [ ] Kaprodi dapat melakukan ACC/Tolak dan status tersinkron ke akun mahasiswa.
- [ ] Bulk import Excel/CSV berhasil memasukkan data historis tanpa error.
- [ ] Mahasiswa dapat melihat riwayat status pengajuannya sendiri.

### 18.2 Modul Ruang & Jadwal Sidang
- [ ] Sistem menampilkan jadwal dan status ketersediaan ruangan secara real-time.
- [ ] Sistem memberikan rekomendasi ruangan berdasarkan prioritas jurusan.
- [ ] Sistem mencegah peminjaman pada ruangan yang sedang digunakan/bentrok.
- [ ] Sistem tidak merekomendasikan ruangan berstatus maintenance.
- [ ] Admin Sarana dapat menyetujui/menolak pengajuan dan wajib memberi alasan penolakan.
- [ ] Mahasiswa dapat melihat status pengajuan ruangannya.

### 18.3 Integrasi (Kriteria Baru)
- [ ] Form pengajuan ruangan terisi otomatis dari data judul TA yang sudah disetujui, tanpa input ulang manual.
- [ ] Mahasiswa tidak dapat mengajukan ruangan untuk tahapan sidang sebelum judul TA berstatus "Disetujui".
- [ ] Kaprodi dan Admin Sarana dapat melihat status gabungan (judul + seluruh tahapan sidang) untuk setiap mahasiswa dalam satu dashboard.
- [ ] Setiap perubahan status di kedua modul memicu notifikasi in-app dan tercatat di audit trail.

---

## 19. Roadmap Pengembangan Lanjutan (Di Luar MVP TA, untuk Referensi Masa Depan)

- Notifikasi WhatsApp/email otomatis via Fonnte/Resend.
- Penjadwalan otomatis mempertimbangkan ketersediaan dosen penguji sekaligus ruangan.
- Ekspor laporan akreditasi (PDF/Excel) berisi rekap judul TA & penggunaan ruang per semester.
- Reschedule/pembatalan mandiri oleh mahasiswa dengan kebijakan batas waktu.
- Dashboard analitik lanjutan: korelasi tren topik vs. keterpakaian ruangan.
- Ekspor kalender (iCal) untuk dosen pembimbing/penguji.
- Integrasi otomatis dengan SIMAK UNSRI (menggantikan bulk import manual).
- Perluasan ke multi-Prodi/multi-Fakultas.
- Aplikasi mobile native.

---

## 20. Lampiran — Glosarium

| Istilah | Penjelasan |
|---|---|
| **FTS (Full-Text Search)** | Metode pencarian teks di database yang memahami akar kata, bukan hanya pencocokan karakter persis |
| **pg_trgm** | Ekstensi PostgreSQL untuk mengukur kemiripan string berbasis potongan 3 karakter (trigram) |
| **Stop-word** | Kata umum yang diabaikan dalam analisis teks karena tidak signifikan secara makna |
| **RLS (Row Level Security)** | Fitur keamanan database yang membatasi akses baris data berdasarkan identitas pengguna |
| **Threshold** | Ambang batas skor yang menentukan tindakan sistem (aman/peringatan/blokir) |
| **Thesis Stage** | Satu tahapan dalam perjalanan TA mahasiswa (Seminar Proposal/Seminar Hasil/Sidang Akhir) yang masing-masing terhubung ke satu pengajuan ruangan |
| **Thesis Journey** | Rangkaian status end-to-end seorang mahasiswa mulai dari pengajuan judul hingga sidang akhir selesai |
| **Admin Sarana** | Peran baru hasil pemisahan tanggung jawab operasional ruangan dari peran akademik Kaprodi |

---

*Dokumen ini adalah dokumen hidup (living document) dan dapat direvisi seiring masukan dari dosen pembimbing, dosen penguji, dan hasil uji coba pengguna (UAT) dengan Kaprodi dan Admin Sarana Prodi terkait.*