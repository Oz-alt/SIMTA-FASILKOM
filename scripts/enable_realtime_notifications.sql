-- ============================================================
-- SIMTA - Aktifkan Realtime untuk tabel notifikasi
-- Jalankan di: https://supabase.com/dashboard/project/jdubhdapcvjxzmngqyty/sql/new
--
-- Kenapa perlu:
--   Aplikasi berlangganan postgres_changes pada thesis_consultations,
--   thesis_titles, dan student_advisors. Ketiga tabel itu belum terdaftar
--   pada publikasi supabase_realtime, sehingga server menolak langganan
--   dengan pesan "Unable to subscribe to changes with given parameters".
--   Akibatnya notifikasi hanya muncul di tab tempat aksi dilakukan dan
--   mahasiswa tidak menerima apa pun sampai reload.
--
-- Skrip ini idempotent: aman dijalankan berulang.
-- ============================================================

-- 1. Daftarkan tabel yang dipantau aplikasi ke publikasi realtime
DO $$
DECLARE
  target_table TEXT;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'thesis_consultations',
    'thesis_titles',
    'student_advisors',
    'thesis_stages',
    'bookings'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = target_table
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = target_table
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', target_table);
      RAISE NOTICE 'Realtime diaktifkan untuk public.%', target_table;
    ELSE
      RAISE NOTICE 'public.% sudah aktif atau tidak ada', target_table;
    END IF;
  END LOOP;
END $$;

-- 2. REPLICA IDENTITY FULL agar payload UPDATE/DELETE membawa seluruh kolom.
--    Tanpa ini `payload.old` hanya berisi primary key, sehingga filter
--    per-NIM pada event DELETE tidak bisa dijalankan di sisi klien.
ALTER TABLE public.thesis_consultations REPLICA IDENTITY FULL;
ALTER TABLE public.thesis_titles        REPLICA IDENTITY FULL;
ALTER TABLE public.student_advisors     REPLICA IDENTITY FULL;

-- 3. Verifikasi: tampilkan tabel yang sudah masuk publikasi realtime
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
ORDER BY tablename;
