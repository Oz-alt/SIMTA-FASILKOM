-- ============================================================
-- SIMTA - Migrasi tabel thesis_titles agar terhubung ke data riil
-- Jalankan di: https://supabase.com/dashboard/project/jdubhdapcvjxzmngqyty/sql/new
--
-- Kenapa perlu: tabel thesis_titles hanya punya kolom dasar
-- (judul, deskripsi, status, skor_kemiripan_terakhir) dan RLS-nya
-- hanya mengizinkan pemilik baris / kaprodi login Supabase Auth.
-- Aplikasi login kaprodi tanpa Supabase Auth (anon key), sehingga
-- SELECT mengembalikan 0 baris dan INSERT ditolak (401).
-- ============================================================

-- 1. Kolom identitas mahasiswa (snapshot saat pengajuan)
ALTER TABLE public.thesis_titles ADD COLUMN IF NOT EXISTS mhs_nim   TEXT;
ALTER TABLE public.thesis_titles ADD COLUMN IF NOT EXISTS mhs_nama  TEXT;
ALTER TABLE public.thesis_titles ADD COLUMN IF NOT EXISTS mhs_kelas TEXT;
ALTER TABLE public.thesis_titles ADD COLUMN IF NOT EXISTS prodi     TEXT DEFAULT 'D3 Manajemen Informatika';
ALTER TABLE public.thesis_titles ADD COLUMN IF NOT EXISTS angkatan  TEXT;
ALTER TABLE public.thesis_titles ADD COLUMN IF NOT EXISTS abstrak   TEXT;

-- 2. Dosen pembimbing (snapshot pembimbing usulan/definitif)
ALTER TABLE public.thesis_titles ADD COLUMN IF NOT EXISTS pembimbing_1_nip  TEXT;
ALTER TABLE public.thesis_titles ADD COLUMN IF NOT EXISTS pembimbing_1_nama TEXT;
ALTER TABLE public.thesis_titles ADD COLUMN IF NOT EXISTS pembimbing_2_nip  TEXT;
ALTER TABLE public.thesis_titles ADD COLUMN IF NOT EXISTS pembimbing_2_nama TEXT;
ALTER TABLE public.thesis_titles ADD COLUMN IF NOT EXISTS dospem_confirmed    BOOLEAN DEFAULT false;
ALTER TABLE public.thesis_titles ADD COLUMN IF NOT EXISTS dospem_confirmed_at TIMESTAMPTZ;

-- 3. Catatan & rekomendasi
ALTER TABLE public.thesis_titles ADD COLUMN IF NOT EXISTS catatan_kaprodi           TEXT DEFAULT '';
ALTER TABLE public.thesis_titles ADD COLUMN IF NOT EXISTS catatan_dospem            TEXT DEFAULT '';
ALTER TABLE public.thesis_titles ADD COLUMN IF NOT EXISTS rekomendasi_dospem_status TEXT;
ALTER TABLE public.thesis_titles ADD COLUMN IF NOT EXISTS rekomendasi_oleh          TEXT;
ALTER TABLE public.thesis_titles ADD COLUMN IF NOT EXISTS riwayat_revisi            JSONB DEFAULT '[]'::jsonb;

-- 3b. Riwayat pengingat Prodi ke dosen pembimbing
ALTER TABLE public.thesis_titles ADD COLUMN IF NOT EXISTS terakhir_diingatkan_prodi TIMESTAMPTZ;
ALTER TABLE public.thesis_titles ADD COLUMN IF NOT EXISTS jumlah_diingatkan         INTEGER DEFAULT 0;
ALTER TABLE public.thesis_titles ADD COLUMN IF NOT EXISTS riwayat_pengingat_prodi   JSONB DEFAULT '[]'::jsonb;

-- 4. Status akademik & kelulusan
ALTER TABLE public.thesis_titles ADD COLUMN IF NOT EXISTS status_kelulusan TEXT DEFAULT 'aktif_proses';
ALTER TABLE public.thesis_titles ADD COLUMN IF NOT EXISTS status_sidang     TEXT DEFAULT 'bimbingan';
ALTER TABLE public.thesis_titles ADD COLUMN IF NOT EXISTS nilai_sidang      TEXT;
ALTER TABLE public.thesis_titles ADD COLUMN IF NOT EXISTS tanggal_lulus     DATE;
ALTER TABLE public.thesis_titles ADD COLUMN IF NOT EXISTS no_sk_lulus       TEXT;
ALTER TABLE public.thesis_titles ADD COLUMN IF NOT EXISTS jadwal_sidang     JSONB;

-- 5. Status yang dipakai aplikasi: tinjauan, perlu_revisi, disetujui, judul_fix
ALTER TABLE public.thesis_titles DROP CONSTRAINT IF EXISTS thesis_titles_status_check;
UPDATE public.thesis_titles SET status = 'tinjauan' WHERE status = 'draft';
ALTER TABLE public.thesis_titles
  ADD CONSTRAINT thesis_titles_status_check
  CHECK (status IN ('draft', 'diajukan', 'tinjauan', 'perlu_revisi', 'disetujui', 'judul_fix', 'ditolak'));

-- 6. RLS: aplikasi memakai anon key (login kaprodi/dosen tidak lewat Supabase Auth),
--    jadi akses harus dibuka. Kalau nanti login sudah full Supabase Auth,
--    ganti policy tulis menjadi: auth.uid() = profile_id
ALTER TABLE public.thesis_titles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for thesis_titles" ON public.thesis_titles;
CREATE POLICY "Public read access for thesis_titles"
  ON public.thesis_titles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Mahasiswa can insert thesis_titles" ON public.thesis_titles;
CREATE POLICY "Mahasiswa can insert thesis_titles"
  ON public.thesis_titles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Kaprodi can update thesis_titles" ON public.thesis_titles;
CREATE POLICY "Kaprodi can update thesis_titles"
  ON public.thesis_titles FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Kaprodi can delete thesis_titles" ON public.thesis_titles;
CREATE POLICY "Kaprodi can delete thesis_titles"
  ON public.thesis_titles FOR DELETE USING (true);

-- 7. Realtime agar daftar tinjauan kaprodi ikut ter-update lintas perangkat
--    (idempotent: ADD TABLE gagal bila tabel sudah terdaftar di publikasi)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'thesis_titles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.thesis_titles;
  END IF;
END $$;

-- 8. Index bantu untuk daftar tinjauan
CREATE INDEX IF NOT EXISTS idx_thesis_titles_status      ON public.thesis_titles (status);
CREATE INDEX IF NOT EXISTS idx_thesis_titles_created_at  ON public.thesis_titles (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_thesis_titles_mhs_nim     ON public.thesis_titles (mhs_nim);

-- 9. Longgarkan kolom wajib: aplikasi menyimpan identitas mahasiswa sebagai snapshot
--    (mhs_nim/mhs_nama), sementara profile_id hanya diisi bila akun login punya
--    baris di public.profiles. Tanpa ini, INSERT ditolak (NOT NULL / FK).
ALTER TABLE public.thesis_titles ALTER COLUMN profile_id DROP NOT NULL;
ALTER TABLE public.thesis_titles ALTER COLUMN deskripsi  SET DEFAULT '';
ALTER TABLE public.thesis_titles ALTER COLUMN deskripsi  DROP NOT NULL;

-- 10. Kolom konsultasi yang dipakai grafik dasbor Kaprodi
--     (tanpa ini, grafik metode Daring/Luring dan peringkat dosen selalu kosong)
ALTER TABLE public.thesis_consultations ADD COLUMN IF NOT EXISTS metode      TEXT;
ALTER TABLE public.thesis_consultations ADD COLUMN IF NOT EXISTS dosen_nip   TEXT;
ALTER TABLE public.thesis_consultations ADD COLUMN IF NOT EXISTS jenis_revisi TEXT;

CREATE INDEX IF NOT EXISTS idx_consultations_tanggal   ON public.thesis_consultations (tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_mhs_nim   ON public.thesis_consultations (mhs_nim);
CREATE INDEX IF NOT EXISTS idx_consultations_dosen_nip ON public.thesis_consultations (dosen_nip);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'thesis_consultations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.thesis_consultations;
  END IF;
END $$;
