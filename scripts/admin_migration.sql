-- ============================================================
-- SIMTA Admin - SQL Migration
-- Jalankan di: https://supabase.com/dashboard/project/jdubhdapcvjxzmngqyty/sql/new
-- ============================================================

-- 1. Tabel Dokumen/Surat Admin
CREATE TABLE IF NOT EXISTS admin_documents (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nama            TEXT NOT NULL,
  jenis           TEXT NOT NULL DEFAULT 'Dokumen',
  deskripsi       TEXT DEFAULT '',
  file_name       TEXT DEFAULT '',
  file_url        TEXT DEFAULT '#',
  tanggal_upload  DATE DEFAULT CURRENT_DATE,
  status          TEXT DEFAULT 'aktif',
  uploader        TEXT DEFAULT 'Admin SIMTA',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Konten CMS
CREATE TABLE IF NOT EXISTS admin_cms (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  judul       TEXT NOT NULL,
  kategori    TEXT NOT NULL DEFAULT 'Informasi',
  isi         TEXT DEFAULT '',
  status      TEXT DEFAULT 'draf',
  penulis     TEXT DEFAULT 'Admin SIMTA',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Template Dokumen
CREATE TABLE IF NOT EXISTS admin_templates (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nama        TEXT NOT NULL,
  jenis       TEXT NOT NULL DEFAULT 'Dokumen',
  deskripsi   TEXT DEFAULT '',
  file_name   TEXT DEFAULT '',
  file_url    TEXT DEFAULT '#',
  ukuran      TEXT DEFAULT '',
  status      TEXT DEFAULT 'aktif',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security
ALTER TABLE admin_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_cms ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_templates ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (allow all untuk development)
DROP POLICY IF EXISTS "Allow all admin_documents" ON admin_documents;
DROP POLICY IF EXISTS "Allow all admin_cms" ON admin_cms;
DROP POLICY IF EXISTS "Allow all admin_templates" ON admin_templates;

CREATE POLICY "Allow all admin_documents" ON admin_documents
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all admin_cms" ON admin_cms
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all admin_templates" ON admin_templates
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Verifikasi: tampilkan tabel yang berhasil dibuat
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('admin_documents','admin_cms','admin_templates')
ORDER BY table_name;
