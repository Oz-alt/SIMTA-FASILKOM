-- ============================================================
-- SIMTA - Kredensial Mahasiswa (hasil verifikasi awal profil)
--
-- CARA PAKAI:
--   1. Buka https://supabase.com/dashboard/project/jdubhdapcvjxzmngqyty/sql/new
--   2. Ctrl+A lalu Delete supaya editor benar-benar kosong
--   3. Buka file add.sql ini di VS Code, Ctrl+A, Ctrl+C
--   4. Paste ke editor Supabase, klik Run (Ctrl+Enter)
--
-- Aman dijalankan berulang kali. Kalau tidak sengaja dijalankan dua kali,
-- tidak ada data yang rusak atau hilang.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Ekstensi kriptografi untuk bcrypt
-- ------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;


-- ------------------------------------------------------------
-- 2. Tabel penyimpanan kredensial mahasiswa
-- ------------------------------------------------------------
create table if not exists public.student_credentials (
    nim                  varchar(30) primary key,
    password_hash        text not null default '',
    is_profile_completed boolean not null default false,
    verified_at          timestamptz,
    created_at           timestamptz not null default now(),
    updated_at           timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 3. Kunci tabel dari browser
--    RLS aktif tanpa policy + REVOKE: anon tidak bisa membaca hash.
-- ------------------------------------------------------------
alter table public.student_credentials enable row level security;

drop policy if exists "Student credentials are readable" on public.student_credentials;
drop policy if exists "Student credentials can be written" on public.student_credentials;
drop policy if exists "Student credentials can be updated" on public.student_credentials;

revoke all on table public.student_credentials from anon, authenticated;


-- ------------------------------------------------------------
-- 4. Fungsi simpan kredensial
--    p_password null / kosong  = jangan ubah kata sandi yang sudah ada
--    p_is_profile_completed null = jangan ubah status profil
-- ------------------------------------------------------------
drop function if exists public.save_student_credential(text, text, boolean);

create or replace function public.save_student_credential(
    p_nim text,
    p_password text default null,
    p_is_profile_completed boolean default null
)
returns boolean
language sql
security definer
set search_path = public, extensions
as $fn$
insert into public.student_credentials as sc (
    nim, password_hash, is_profile_completed, verified_at, updated_at
)
values (
    trim(p_nim),
    case
        when p_password is not null and trim(p_password) <> ''
            then crypt(trim(p_password), gen_salt('bf'))
        else ''
    end,
    coalesce(p_is_profile_completed, false),
    case when p_is_profile_completed then now() else null end,
    now()
)
on conflict (nim) do update set
    password_hash = case
        when p_password is not null and trim(p_password) <> ''
            then crypt(trim(p_password), gen_salt('bf'))
        else sc.password_hash
    end,
    is_profile_completed = coalesce(p_is_profile_completed, sc.is_profile_completed),
    verified_at = case
        when coalesce(p_is_profile_completed, sc.is_profile_completed)
            then coalesce(sc.verified_at, now())
        else sc.verified_at
    end,
    updated_at = now()
returning true
$fn$;


-- ------------------------------------------------------------
-- 5. Fungsi verifikasi kata sandi (perbandingan bcrypt di server)
-- ------------------------------------------------------------
drop function if exists public.verify_student_password(text, text);

create or replace function public.verify_student_password(
    p_nim text,
    p_password text
)
returns boolean
language sql
security definer
set search_path = public, extensions
as $fn$
select coalesce((
    select length(sc.password_hash) > 0
       and sc.password_hash = crypt(trim(p_password), sc.password_hash)
    from public.student_credentials sc
    where sc.nim = trim(p_nim)
), false)
$fn$;


-- ------------------------------------------------------------
-- 6. Fungsi status kredensial
--    0 baris = NIM belum pernah diverifikasi (pakai aturan default NIM)
-- ------------------------------------------------------------
drop function if exists public.get_student_credential(text);

create or replace function public.get_student_credential(p_nim text)
returns table (has_password boolean, is_profile_completed boolean)
language sql
security definer
set search_path = public, extensions
as $fn$
select coalesce(length(sc.password_hash) > 0, false),
       coalesce(sc.is_profile_completed, false)
from public.student_credentials sc
where sc.nim = trim(p_nim)
$fn$;


-- ------------------------------------------------------------
-- 7. Izin eksekusi: hanya lewat fungsi, bukan tabel
-- ------------------------------------------------------------
revoke all on function public.save_student_credential(text, text, boolean) from public;
revoke all on function public.verify_student_password(text, text) from public;
revoke all on function public.get_student_credential(text) from public;

grant execute on function public.save_student_credential(text, text, boolean) to anon, authenticated;
grant execute on function public.verify_student_password(text, text) to anon, authenticated;
grant execute on function public.get_student_credential(text) to anon, authenticated;

create index if not exists idx_student_credentials_completed
    on public.student_credentials (is_profile_completed);


-- ------------------------------------------------------------
-- 8. Cek hasil
--    Harus muncul 1 baris: policy_anon = 0 dan jumlah_fungsi = 3
-- ------------------------------------------------------------
select
    t.table_name,
    (select count(*) from pg_policies
      where schemaname = 'public' and tablename = 'student_credentials') as policy_anon,
    (select count(*) from pg_proc
      where proname in ('save_student_credential', 'verify_student_password', 'get_student_credential')
        and pronamespace = 'public'::regnamespace) as jumlah_fungsi
from information_schema.tables t
where t.table_schema = 'public' and t.table_name = 'student_credentials';
