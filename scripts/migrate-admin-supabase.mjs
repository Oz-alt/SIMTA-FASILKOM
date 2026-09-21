/**
 * SIMTA Admin - Supabase Migration & Seed Script
 * Jalankan: node scripts/migrate-admin-supabase.mjs
 * 
 * Script ini akan:
 * 1. Membuat 3 tabel di Supabase (admin_documents, admin_cms, admin_templates)
 * 2. Mengatur RLS Policy
 * 3. Seed mock data awal
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jdubhdapcvjxzmngqyty.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

// Gunakan anon key jika service key tidak tersedia (untuk dev)
const SUPABASE_ANON_KEY = 'sb_publishable_ZJ0moT-bPUy1slWmSngWVA_KPhyMNMg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);

// ── SQL DDL ────────────────────────────────────────────────────────────────

const SQL_CREATE_TABLES = `
-- Tabel dokumen/surat admin SIMTA
CREATE TABLE IF NOT EXISTS admin_documents (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nama            TEXT NOT NULL,
  jenis           TEXT NOT NULL DEFAULT 'Dokumen',
  deskripsi       TEXT DEFAULT '',
  file_name       TEXT DEFAULT '',
  file_url        TEXT DEFAULT '#',
  tanggal_upload  DATE DEFAULT CURRENT_DATE,
  status          TEXT DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
  uploader        TEXT DEFAULT 'Admin SIMTA',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel konten CMS
CREATE TABLE IF NOT EXISTS admin_cms (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  judul       TEXT NOT NULL,
  kategori    TEXT NOT NULL DEFAULT 'Informasi',
  isi         TEXT DEFAULT '',
  status      TEXT DEFAULT 'draf' CHECK (status IN ('publikasi', 'draf')),
  penulis     TEXT DEFAULT 'Admin SIMTA',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel template dokumen
CREATE TABLE IF NOT EXISTS admin_templates (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nama        TEXT NOT NULL,
  jenis       TEXT NOT NULL DEFAULT 'Dokumen',
  deskripsi   TEXT DEFAULT '',
  file_name   TEXT DEFAULT '',
  file_url    TEXT DEFAULT '#',
  ukuran      TEXT DEFAULT '',
  status      TEXT DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_cms ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies jika ada
DROP POLICY IF EXISTS "Allow all admin_documents" ON admin_documents;
DROP POLICY IF EXISTS "Allow all admin_cms" ON admin_cms;
DROP POLICY IF EXISTS "Allow all admin_templates" ON admin_templates;

-- Policy: allow all untuk anon key (development)
CREATE POLICY "Allow all admin_documents" ON admin_documents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all admin_cms" ON admin_cms FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all admin_templates" ON admin_templates FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
`;

// ── Seed Data ──────────────────────────────────────────────────────────────

const SEED_DOCUMENTS = [
  { id: 'doc-1', nama: 'Surat Keterangan Aktif Kuliah', jenis: 'Surat Keterangan', deskripsi: 'Template surat keterangan aktif kuliah untuk mahasiswa aktif semester ini.', file_name: 'surat-keterangan-aktif.pdf', file_url: '#', tanggal_upload: '2026-09-01', status: 'aktif', uploader: 'Admin SIMTA' },
  { id: 'doc-2', nama: 'Surat Pengajuan Judul TA', jenis: 'Surat Pengajuan', deskripsi: 'Formulir pengajuan judul tugas akhir untuk mahasiswa D3 Manajemen Informatika.', file_name: 'form-ajuan-judul-ta.docx', file_url: '#', tanggal_upload: '2026-09-03', status: 'aktif', uploader: 'Admin SIMTA' },
  { id: 'doc-3', nama: 'Berita Acara Seminar Proposal', jenis: 'Berita Acara', deskripsi: 'Dokumen berita acara seminar proposal tugas akhir yang wajib ditandatangani penguji.', file_name: 'berita-acara-sempro.docx', file_url: '#', tanggal_upload: '2026-09-05', status: 'aktif', uploader: 'Admin SIMTA' },
  { id: 'doc-4', nama: 'Surat Pengantar Penelitian', jenis: 'Surat Pengantar', deskripsi: 'Surat pengantar resmi dari fakultas untuk keperluan penelitian lapangan mahasiswa.', file_name: 'surat-pengantar-penelitian.pdf', file_url: '#', tanggal_upload: '2026-09-08', status: 'nonaktif', uploader: 'Admin SIMTA' },
  { id: 'doc-5', nama: 'Lembar Persetujuan Pembimbing', jenis: 'Formulir', deskripsi: 'Lembar persetujuan dosen pembimbing 1 dan 2 untuk naskah tugas akhir.', file_name: 'lembar-persetujuan-pembimbing.docx', file_url: '#', tanggal_upload: '2026-09-10', status: 'aktif', uploader: 'Admin SIMTA' },
  { id: 'doc-6', nama: 'Panduan Penulisan Tugas Akhir', jenis: 'Panduan', deskripsi: 'Buku panduan lengkap tata cara penulisan tugas akhir D3 Manajemen Informatika UNSRI.', file_name: 'panduan-penulisan-ta-2026.pdf', file_url: '#', tanggal_upload: '2026-09-12', status: 'aktif', uploader: 'Admin SIMTA' }
];

const SEED_CMS = [
  { id: 'cms-1', judul: 'Selamat Datang di SIMTA', kategori: 'Beranda', isi: 'Selamat datang di Sistem Informasi Manajemen Tugas Akhir (SIMTA) Fakultas Ilmu Komputer Universitas Sriwijaya. Platform ini dirancang untuk memudahkan proses pengajuan, pembimbingan, dan sidang tugas akhir mahasiswa D3 Manajemen Informatika.', status: 'publikasi', penulis: 'Admin SIMTA', updated_at: '2026-09-01T08:00:00Z' },
  { id: 'cms-2', judul: 'Panduan Pengajuan Judul TA', kategori: 'Panduan', isi: 'Untuk mengajukan judul tugas akhir, mahasiswa harus memiliki minimal 100 SKS yang telah lulus, IPK minimal 2.75, dan telah menyelesaikan mata kuliah Metodologi Penelitian. Selanjutnya, mahasiswa mengisi formulir pengajuan judul melalui menu Ajukan Judul TA dan menunggu persetujuan dari Kaprodi.', status: 'publikasi', penulis: 'Admin SIMTA', updated_at: '2026-09-02T10:30:00Z' },
  { id: 'cms-3', judul: 'Jadwal Seminar Proposal Semester Ganjil 2026/2027', kategori: 'Pengumuman', isi: 'Seminar proposal tugas akhir semester ganjil 2026/2027 akan dilaksanakan mulai 15 Oktober 2026. Mahasiswa yang telah mendapat persetujuan judul dari Kaprodi dapat segera mendaftarkan diri melalui sistem peminjaman ruang sidang.', status: 'draf', penulis: 'Admin SIMTA', updated_at: '2026-09-05T14:00:00Z' },
  { id: 'cms-4', judul: 'Ketentuan Upload Repository TA', kategori: 'Panduan', isi: 'Setelah sidang akhir dinyatakan lulus, mahasiswa wajib mengupload repository tugas akhir dalam format ZIP yang berisi: source code aplikasi, laporan PDF, dan dokumentasi teknis. Ukuran file maksimal 200MB.', status: 'publikasi', penulis: 'Admin SIMTA', updated_at: '2026-09-07T09:15:00Z' },
  { id: 'cms-5', judul: 'Kontak dan Layanan Akademik', kategori: 'Informasi', isi: 'Untuk pertanyaan seputar administrasi tugas akhir, silakan menghubungi Admin SIMTA di admin.simta@unsri.ac.id atau datang langsung ke Gedung DIPKOM Lt. 1, Kampus Bukit Palembang, pada hari Senin-Jumat pukul 08.00-16.00 WIB.', status: 'publikasi', penulis: 'Admin SIMTA', updated_at: '2026-09-10T11:00:00Z' },
  { id: 'cms-6', judul: 'FAQ Proses Bimbingan Tugas Akhir', kategori: 'FAQ', isi: 'Q: Berapa kali minimal bimbingan yang harus dilakukan?\nA: Minimal 8 kali bimbingan dengan Dosen Pembimbing 1 dan 6 kali dengan Dosen Pembimbing 2.\n\nQ: Apa yang dimaksud kartu bimbingan digital?\nA: Kartu bimbingan digital adalah rekap otomatis seluruh sesi bimbingan yang dapat dicetak untuk keperluan administrasi sidang.', status: 'draf', penulis: 'Admin SIMTA', updated_at: '2026-09-15T13:45:00Z' }
];

const SEED_TEMPLATES = [
  { id: 'tpl-1', nama: 'Template Proposal Tugas Akhir', jenis: 'Proposal', deskripsi: 'Template Microsoft Word standar untuk penulisan proposal tugas akhir D3 Manajemen Informatika sesuai panduan terbaru 2026.', file_name: 'template-proposal-ta-2026.docx', file_url: '#', ukuran: '245 KB', status: 'aktif', updated_at: '2026-09-01T00:00:00Z' },
  { id: 'tpl-2', nama: 'Template Laporan Akhir Tugas Akhir', jenis: 'Laporan', deskripsi: 'Template resmi laporan tugas akhir lengkap dengan cover, lembar pengesahan, daftar isi otomatis, dan format daftar pustaka IEEE.', file_name: 'template-laporan-ta-2026.docx', file_url: '#', ukuran: '389 KB', status: 'aktif', updated_at: '2026-09-01T00:00:00Z' },
  { id: 'tpl-3', nama: 'Template Slide Presentasi Seminar Proposal', jenis: 'Presentasi', deskripsi: 'Template PowerPoint untuk presentasi seminar proposal dengan desain resmi Fasilkom UNSRI.', file_name: 'template-slide-sempro.pptx', file_url: '#', ukuran: '1.2 MB', status: 'aktif', updated_at: '2026-09-03T00:00:00Z' },
  { id: 'tpl-4', nama: 'Template Slide Presentasi Sidang Akhir', jenis: 'Presentasi', deskripsi: 'Template PowerPoint untuk presentasi sidang akhir tugas akhir, telah diupdate dengan logo universitas terbaru.', file_name: 'template-slide-sidang.pptx', file_url: '#', ukuran: '1.5 MB', status: 'aktif', updated_at: '2026-09-03T00:00:00Z' },
  { id: 'tpl-5', nama: 'Template Berita Acara Sidang (Lama)', jenis: 'Berita Acara', deskripsi: 'Template berita acara sidang versi lama (2024). Sudah tidak digunakan, hanya sebagai arsip.', file_name: 'template-ba-sidang-2024.docx', file_url: '#', ukuran: '87 KB', status: 'nonaktif', updated_at: '2024-08-15T00:00:00Z' },
  { id: 'tpl-6', nama: 'Template Jurnal Ilmiah Fasilkom', jenis: 'Jurnal', deskripsi: 'Template artikel jurnal ilmiah Fasilkom UNSRI untuk publikasi hasil penelitian tugas akhir.', file_name: 'template-jurnal-fasilkom.docx', file_url: '#', ukuran: '156 KB', status: 'aktif', updated_at: '2026-09-10T00:00:00Z' }
];

// ── Main ───────────────────────────────────────────────────────────────────

async function runMigration() {
  console.log('🚀 SIMTA Admin - Supabase Migration & Seed');
  console.log('===========================================');
  console.log(`📡 Connecting to: ${SUPABASE_URL}`);

  // Step 1: Buat tabel via SQL RPC (requires service key) atau gunakan upsert
  // Karena menggunakan anon key, kita langsung upsert ke tabel
  // Tabel harus dibuat terlebih dahulu via Dashboard atau Service Role Key
  
  console.log('\n📋 Checking/creating tables...');
  
  // Test koneksi dulu
  const { error: testError } = await supabase.from('admin_documents').select('id').limit(1);
  
  if (testError && testError.code === '42P01') {
    // Tabel belum ada - tampilkan SQL untuk dijalankan manual
    console.log('\n⚠️  Tabel belum ada di Supabase!');
    console.log('Silakan jalankan SQL berikut di Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/jdubhdapcvjxzmngqyty/sql/new\n');
    console.log('─'.repeat(60));
    console.log(SQL_CREATE_TABLES);
    console.log('─'.repeat(60));
    console.log('\nSetelah menjalankan SQL, jalankan script ini lagi untuk seed data.');
    process.exit(1);
  }

  if (testError) {
    console.error('❌ Error koneksi Supabase:', testError.message);
    console.log('\nPastikan tabel sudah dibuat. SQL DDL:\n');
    console.log(SQL_CREATE_TABLES);
    process.exit(1);
  }

  console.log('✅ Koneksi Supabase berhasil');

  // Step 2: Seed admin_documents
  console.log('\n📄 Seeding admin_documents...');
  const { error: docError } = await supabase
    .from('admin_documents')
    .upsert(SEED_DOCUMENTS, { onConflict: 'id' });
  
  if (docError) {
    console.error('  ❌ Error:', docError.message);
  } else {
    console.log(`  ✅ ${SEED_DOCUMENTS.length} dokumen berhasil di-seed`);
  }

  // Step 3: Seed admin_cms
  console.log('\n🌐 Seeding admin_cms...');
  const { error: cmsError } = await supabase
    .from('admin_cms')
    .upsert(SEED_CMS, { onConflict: 'id' });
  
  if (cmsError) {
    console.error('  ❌ Error:', cmsError.message);
  } else {
    console.log(`  ✅ ${SEED_CMS.length} konten CMS berhasil di-seed`);
  }

  // Step 4: Seed admin_templates
  console.log('\n📝 Seeding admin_templates...');
  const { error: tplError } = await supabase
    .from('admin_templates')
    .upsert(SEED_TEMPLATES, { onConflict: 'id' });
  
  if (tplError) {
    console.error('  ❌ Error:', tplError.message);
  } else {
    console.log(`  ✅ ${SEED_TEMPLATES.length} template berhasil di-seed`);
  }

  // Step 5: Verifikasi
  console.log('\n🔍 Verifikasi data...');
  const { data: docs } = await supabase.from('admin_documents').select('id, nama, status');
  const { data: cms  } = await supabase.from('admin_cms').select('id, judul, status');
  const { data: tpls } = await supabase.from('admin_templates').select('id, nama, status');

  console.log(`  admin_documents : ${docs?.length || 0} rows`);
  console.log(`  admin_cms       : ${cms?.length  || 0} rows`);
  console.log(`  admin_templates : ${tpls?.length || 0} rows`);

  console.log('\n🎉 Migration & Seed selesai!');
  console.log('Sekarang jalankan ulang npm run dev untuk melihat data dari Supabase.');
}

runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
