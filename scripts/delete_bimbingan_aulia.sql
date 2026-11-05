-- ==============================================================================
-- SIMTA - Hapus Data Entry Bimbingan Mahasiswa: AULIA AZZAHRA (09010182428002)
-- ==============================================================================
-- CARA PENGGUNAAN:
-- 1. Buka Supabase Dashboard > SQL Editor:
--    https://supabase.com/dashboard/project/jdubhdapcvjxzmngqyty/sql/new
-- 2. Salin (copy) dan tempel (paste) script di bawah ini ke editor.
-- 3. Klik tombol "RUN" (atau tekan Ctrl + Enter).
-- ==============================================================================

-- LANGKAH 1: Cek & lihat data bimbingan yang akan dihapus
SELECT 
    id, 
    mhs_nim, 
    mhs_nama, 
    tanggal, 
    waktu, 
    pembimbing, 
    dosen_nama, 
    catatan_mahasiswa, 
    status,
    created_at
FROM public.thesis_consultations
WHERE mhs_nim = '09010182428002';


-- LANGKAH 2: Hapus data entry bimbingan tersebut dari Supabase
DELETE FROM public.thesis_consultations
WHERE mhs_nim = '09010182428002';


-- LANGKAH 3: Verifikasi bahwa data sudah berhasil terhapus (hasil harus 0)
SELECT 
    COUNT(*) AS sisa_bimbingan_aulia
FROM public.thesis_consultations
WHERE mhs_nim = '09010182428002';

