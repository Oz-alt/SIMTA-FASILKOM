-- ====================================================================
-- SIMTA (Sistem Informasi Manajemen Tugas Akhir & Ruang Sidang)
-- Database DDL Schema for Supabase / PostgreSQL
-- ====================================================================

-- 1. Enable Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- 2. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Departments
INSERT INTO public.departments (name, code)
VALUES 
    ('D3 Manajemen Informatika', 'MI'),
    ('S1 Teknik Informatika', 'TI')
ON CONFLICT (code) DO NOTHING;

-- 3. User Profiles (Extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nim VARCHAR(30) UNIQUE,
    nip VARCHAR(30) UNIQUE,
    nama VARCHAR(150) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('mahasiswa', 'kaprodi', 'admin_sarana', 'dosen')),
    prodi VARCHAR(100),
    department_id UUID REFERENCES public.departments(id),
    kelas VARCHAR(20),
    no_hp VARCHAR(20),
    email VARCHAR(100) UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Thesis Titles Table
CREATE TABLE IF NOT EXISTS public.thesis_titles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    judul TEXT NOT NULL,
    deskripsi TEXT NOT NULL,
    judul_processed TEXT, -- Pre-processed title (lowercase, no stop-words, trimmed)
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'diajukan', 'disetujui', 'ditolak')),
    skor_kemiripan_terakhir NUMERIC(5, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Full Text Search Index & Trigram Index on thesis_titles
CREATE INDEX IF NOT EXISTS idx_thesis_titles_trgm ON public.thesis_titles USING gin (judul_processed gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_thesis_titles_fts ON public.thesis_titles USING gin (to_tsvector('indonesian', judul_processed));

-- 5. Similarity Logs
CREATE TABLE IF NOT EXISTS public.similarity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thesis_title_id UUID NOT NULL REFERENCES public.thesis_titles(id) ON DELETE CASCADE,
    matched_title_id UUID REFERENCES public.thesis_titles(id) ON DELETE SET NULL,
    matched_historical_title TEXT,
    skor_fts NUMERIC(5, 2) DEFAULT 0,
    skor_trigram NUMERIC(5, 2) DEFAULT 0,
    skor_gabungan NUMERIC(5, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Review Notes (Kaprodi / Reviewer notes)
CREATE TABLE IF NOT EXISTS public.review_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thesis_title_id UUID NOT NULL REFERENCES public.thesis_titles(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id),
    role_reviewer VARCHAR(30) NOT NULL,
    catatan TEXT NOT NULL,
    keputusan VARCHAR(30) NOT NULL CHECK (keputusan IN ('disetujui', 'ditolak', 'revisi')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Historical Title Imports (For Kaprodi Bulk Import)
CREATE TABLE IF NOT EXISTS public.historical_imports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judul TEXT NOT NULL,
    judul_processed TEXT NOT NULL,
    tahun_angkatan VARCHAR(10) NOT NULL,
    penulis VARCHAR(150),
    sumber_import VARCHAR(100) DEFAULT 'Excel/CSV Import',
    imported_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hist_titles_trgm ON public.historical_imports USING gin (judul_processed gin_trgm_ops);

-- 8. Buildings Table
CREATE TABLE IF NOT EXISTS public.buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Rooms Table
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) NOT NULL UNIQUE,
    capacity INT DEFAULT 30,
    facilities TEXT[], -- e.g., ARRAY['AC', 'Proyektor', 'Sound System', 'Whiteboard']
    status VARCHAR(30) NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif', 'maintenance')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Room Priorities per Department & Stage Type
CREATE TABLE IF NOT EXISTS public.room_priorities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    stage_type VARCHAR(50) NOT NULL CHECK (stage_type IN ('seminar_proposal', 'seminar_hasil', 'sidang_akhir')),
    priority_order INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(department_id, room_id, stage_type)
);

-- 11. Thesis Stages (Bridge between Thesis Title & Defense Bookings)
CREATE TABLE IF NOT EXISTS public.thesis_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thesis_title_id UUID NOT NULL REFERENCES public.thesis_titles(id) ON DELETE CASCADE,
    stage_type VARCHAR(50) NOT NULL CHECK (stage_type IN ('seminar_proposal', 'seminar_hasil', 'sidang_akhir')),
    status VARCHAR(30) NOT NULL DEFAULT 'belum_diajukan' CHECK (status IN ('belum_diajukan', 'menunggu_jadwal', 'disetujui', 'selesai', 'ditolak')),
    urutan INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Bookings Table (Room bookings for defense stages)
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_code VARCHAR(30) UNIQUE NOT NULL,
    thesis_stage_id UUID NOT NULL REFERENCES public.thesis_stages(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    purpose TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'menunggu_persetujuan' CHECK (status IN ('menunggu_persetujuan', 'disetujui', 'ditolak', 'dibatalkan')),
    rejection_reason TEXT,
    approved_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast collision checking
CREATE INDEX IF NOT EXISTS idx_bookings_conflict ON public.bookings (room_id, booking_date, start_time, end_time) WHERE status = 'disetujui';

-- 13. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    related_type VARCHAR(50) NOT NULL, -- 'thesis_title' or 'booking'
    related_id UUID,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Thesis Repositories & Public Archives Table
CREATE TABLE IF NOT EXISTS public.thesis_repositories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judul TEXT NOT NULL,
    abstrak TEXT NOT NULL,
    abstrak_en TEXT,
    penulis_nama VARCHAR(150) NOT NULL,
    penulis_nim VARCHAR(30) NOT NULL,
    prodi VARCHAR(100) NOT NULL,
    kelas VARCHAR(30),
    tahun_angkatan VARCHAR(10) NOT NULL,
    tahun_lulus VARCHAR(10) NOT NULL,
    pembimbing_1 VARCHAR(150) NOT NULL,
    pembimbing_2 VARCHAR(150),
    penguji_1 VARCHAR(150),
    penguji_2 VARCHAR(150),
    kata_kunci TEXT[],
    file_pdf_url TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'menunggu_review_kaprodi' CHECK (status IN ('menunggu_review_kaprodi', 'disetujui_kaprodi', 'perlu_revisi', 'dipublikasikan')),
    catatan_kaprodi TEXT,
    approved_by_kaprodi UUID REFERENCES public.profiles(id),
    published_by_admin UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public Thesis Archives Table (Published entries accessible in public digital library)
CREATE TABLE IF NOT EXISTS public.thesis_archives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID REFERENCES public.thesis_repositories(id) ON DELETE SET NULL,
    judul TEXT NOT NULL,
    abstrak TEXT NOT NULL,
    abstrak_en TEXT,
    penulis_nama VARCHAR(150) NOT NULL,
    penulis_nim VARCHAR(30) NOT NULL,
    prodi VARCHAR(100) NOT NULL,
    kelas VARCHAR(30),
    tahun_angkatan VARCHAR(10) NOT NULL,
    tahun_lulus VARCHAR(10) NOT NULL,
    pembimbing_1 VARCHAR(150) NOT NULL,
    pembimbing_2 VARCHAR(150),
    penguji_1 VARCHAR(150),
    penguji_2 VARCHAR(150),
    kata_kunci TEXT[],
    file_pdf_url TEXT NOT NULL,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    published_by UUID REFERENCES public.profiles(id)
);

-- 16. Thesis Consultations Log Table
CREATE TABLE IF NOT EXISTS public.thesis_consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mhs_nim VARCHAR(30) NOT NULL,
    mhs_nama VARCHAR(150) NOT NULL,
    pembimbing VARCHAR(30) NOT NULL,
    dosen_nama VARCHAR(150) NOT NULL,
    tanggal DATE NOT NULL,
    waktu TIME NOT NULL,
    bab_topik TEXT NOT NULL,
    catatan_mahasiswa TEXT NOT NULL,
    masukan_dosen TEXT,
    file_revisi_url TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'menunggu_tanggapan' CHECK (status IN ('menunggu_tanggapan', 'disetujui', 'perlu_revisi')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Advisor Offline Schedules & WhatsApp Group Links Table
CREATE TABLE IF NOT EXISTS public.advisor_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dosen_nip VARCHAR(50) UNIQUE NOT NULL,
    dosen_nama VARCHAR(255) NOT NULL,
    peran VARCHAR(100) DEFAULT 'Dosen Pembimbing',
    hari_bimbingan VARCHAR(100) NOT NULL,
    jam_bimbingan VARCHAR(100) NOT NULL,
    lokasi VARCHAR(255) NOT NULL,
    link_wa_group TEXT,
    no_hp_wa VARCHAR(30),
    catatan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- Enable Row Level Security (RLS)
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thesis_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thesis_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thesis_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thesis_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thesis_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_schedules ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Public profiles read access" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Mahasiswa can insert & read own title" ON public.thesis_titles 
    FOR ALL USING (auth.uid() = profile_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('kaprodi', 'admin_sarana')));

CREATE POLICY "Public read access for thesis repositories" ON public.thesis_repositories FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert thesis repositories" ON public.thesis_repositories FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access for thesis archives" ON public.thesis_archives FOR SELECT USING (true);
CREATE POLICY "Admins can insert thesis archives" ON public.thesis_archives FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access for consultations" ON public.thesis_consultations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert consultations" ON public.thesis_consultations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update consultations" ON public.thesis_consultations FOR UPDATE USING (true);

CREATE POLICY "Public read access for advisor_schedules" ON public.advisor_schedules FOR SELECT USING (true);
CREATE POLICY "Dosen and admins can insert and update advisor_schedules" ON public.advisor_schedules FOR ALL USING (true);

-- ====================================================================
-- SEED DATA FOR KAPRODI ACCOUNT (Safe insert/update avoiding ON CONFLICT email error)
-- ====================================================================
-- Ensure columns exist if table was created previously without nip or prodi
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nip VARCHAR(30);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS prodi VARCHAR(100);

DO $$
DECLARE
  kaprodi_email TEXT := 'kaprodi.mi@unsri.ac.id';
  kaprodi_password TEXT := 'Kaprodi123!';
  kaprodi_nama TEXT := 'Dr. Ir. Hendra Kusuma, M.T.';
  kaprodi_nip TEXT := '197805122005011002';
  kaprodi_prodi TEXT := 'D3 Manajemen Informatika';
  
  existing_user_id UUID;
  new_user_id UUID := gen_random_uuid();
BEGIN
  -- Cek apakah user dengan email tersebut sudah ada di auth.users
  SELECT id INTO existing_user_id 
  FROM auth.users 
  WHERE email = kaprodi_email;

  IF existing_user_id IS NOT NULL THEN
    -- Update password jika user sudah ada
    UPDATE auth.users
    SET encrypted_password = crypt(kaprodi_password, gen_salt('bf')),
        email_confirmed_at = NOW(),
        updated_at = NOW(),
        raw_user_meta_data = jsonb_build_object('nama', kaprodi_nama, 'role', 'kaprodi', 'nip', kaprodi_nip, 'prodi', kaprodi_prodi)
    WHERE id = existing_user_id;

    -- Upsert ke public.profiles
    INSERT INTO public.profiles (id, nama, email, nip, nim, role, prodi, kelas, no_hp)
    VALUES (existing_user_id, kaprodi_nama, kaprodi_email, kaprodi_nip, kaprodi_nip, 'kaprodi', kaprodi_prodi, 'Dosen / Kaprodi', '081234567890')
    ON CONFLICT (id) DO UPDATE
    SET nama = EXCLUDED.nama,
        email = EXCLUDED.email,
        nip = EXCLUDED.nip,
        nim = EXCLUDED.nim,
        role = EXCLUDED.role,
        prodi = EXCLUDED.prodi;
  ELSE
    -- Insert user baru ke auth.users jika belum ada
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      kaprodi_email,
      crypt(kaprodi_password, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('nama', kaprodi_nama, 'role', 'kaprodi', 'nip', kaprodi_nip, 'prodi', kaprodi_prodi),
      NOW(),
      NOW()
    );

    -- Insert ke public.profiles
    INSERT INTO public.profiles (id, nama, email, nip, nim, role, prodi, kelas, no_hp)
    VALUES (new_user_id, kaprodi_nama, kaprodi_email, kaprodi_nip, kaprodi_nip, 'kaprodi', kaprodi_prodi, 'Dosen / Kaprodi', '081234567890')
    ON CONFLICT (id) DO UPDATE
    SET nama = EXCLUDED.nama,
        email = EXCLUDED.email,
        nip = EXCLUDED.nip,
        nim = EXCLUDED.nim,
        role = EXCLUDED.role,
        prodi = EXCLUDED.prodi;
  END IF;
END $$;


