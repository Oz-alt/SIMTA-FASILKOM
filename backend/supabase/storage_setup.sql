-- ====================================================================
-- SIMTA (Sistem Informasi Manajemen Tugas Akhir & Ruang Sidang)
-- Supabase Storage & Profile Avatar Setup Script
-- ====================================================================

-- 1. Ensure avatar_url column exists in public.profiles table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- 2. Create the 'avatars' storage bucket if it does not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars', 
    'avatars', 
    true, 
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Row Level Security Policies for storage.objects (avatars bucket)

-- Enable RLS on storage.objects (usually enabled by default in Supabase)
-- ALLOW PUBLIC SELECT READ ACCESS FOR AVATARS
DROP POLICY IF EXISTS "Public Avatar Access" ON storage.objects;
CREATE POLICY "Public Avatar Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- ALLOW AUTHENTICATED OR ANON USERS TO UPLOAD AVATARS
DROP POLICY IF EXISTS "Avatar Upload Access" ON storage.objects;
CREATE POLICY "Avatar Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

-- ALLOW USERS TO UPDATE THEIR OWN AVATARS
DROP POLICY IF EXISTS "Avatar Update Access" ON storage.objects;
CREATE POLICY "Avatar Update Access"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars');

-- ALLOW USERS TO DELETE THEIR OWN AVATARS
DROP POLICY IF EXISTS "Avatar Delete Access" ON storage.objects;
CREATE POLICY "Avatar Delete Access"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars');

-- 4. Create the 'repository-docs' storage bucket for PDF final reports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'repository-docs', 
    'repository-docs', 
    true, 
    15728640, -- 15MB limit
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policies for repository-docs bucket
DROP POLICY IF EXISTS "Public Repository PDF Access" ON storage.objects;
CREATE POLICY "Public Repository PDF Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'repository-docs');

DROP POLICY IF EXISTS "Repository PDF Upload Access" ON storage.objects;
CREATE POLICY "Repository PDF Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'repository-docs');

-- 5. Create the 'bimbingan-docs' storage bucket for revision files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'bimbingan-docs', 
    'bimbingan-docs', 
    true, 
    15728640, -- 15MB limit
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policies for bimbingan-docs bucket
DROP POLICY IF EXISTS "Public Bimbingan PDF Access" ON storage.objects;
CREATE POLICY "Public Bimbingan PDF Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'bimbingan-docs');

DROP POLICY IF EXISTS "Bimbingan PDF Upload Access" ON storage.objects;
CREATE POLICY "Bimbingan PDF Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bimbingan-docs');


