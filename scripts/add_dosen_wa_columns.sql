-- ============================================================
-- SIMTA - Tambah Kolom & Sinkronkan Nomor WA & Tautan Grup WA
-- 
-- CARA PAKAI:
--   1. Buka tab Supabase SQL Editor yang sudah terbuka di browser Anda
--      (https://supabase.com/dashboard/project/jdubhdapcvjxzmngqyty/sql/new)
--   2. Salin dan tempel seluruh script SQL di bawah ini
--   3. Klik tombol "Run" (atau tekan Ctrl + Enter)
-- ============================================================

-- 1. Tambahkan kolom link_wa_group ke tabel advisors dan profiles jika belum ada
ALTER TABLE public.advisors ADD COLUMN IF NOT EXISTS link_wa_group TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS link_wa_group TEXT DEFAULT '';

-- 2. Update langsung data Dosen Dr. Abdiansah di tabel advisors dan profiles
UPDATE public.advisors 
SET 
  no_hp = '0895-3787-34847',
  link_wa_group = 'https://chat.whatsapp.com/E8JElpcoGjPOAwz4cRg6nl',
  updated_at = NOW()
WHERE nip = '198410012009121005';

UPDATE public.profiles 
SET 
  no_hp = '0895-3787-34847',
  link_wa_group = 'https://chat.whatsapp.com/E8JElpcoGjPOAwz4cRg6nl',
  updated_at = NOW()
WHERE nip = '198410012009121005' OR nim = '198410012009121005';

-- 3. Pastikan izin UPDATE terbuka untuk tabel advisors & profiles
ALTER TABLE public.advisors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all advisors" ON public.advisors;
CREATE POLICY "Allow all advisors" ON public.advisors FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update profiles for all" ON public.profiles;
CREATE POLICY "Allow update profiles for all" ON public.profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
