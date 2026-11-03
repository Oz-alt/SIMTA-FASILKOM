-- ============================================================
-- SIMTA - Kredensial & Aktivasi Profil Mahasiswa (Lintas Browser/Perangkat)
-- + Script Reset Bersih Seluruh Akun, Pengajuan Judul, & Bimbingan Mahasiswa (Siap Deploy)
--
-- CARA PAKAI:
--   1. Buka https://supabase.com/dashboard/project/jdubhdapcvjxzmngqyty/sql/new
--   2. Ctrl+A lalu Delete supaya editor benar-benar kosong
--   3. Buka file add.sql ini di VS Code, Ctrl+A, Ctrl+C
--   4. Paste ke editor Supabase, klik Run (Ctrl+Enter)
-- ============================================================


-- ------------------------------------------------------------
-- 1. Ekstensi kriptografi untuk bcrypt
-- ------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;


-- ------------------------------------------------------------
-- 2. Tabel penyimpanan kredensial & profil aktivasi mahasiswa
-- ------------------------------------------------------------
create table if not exists public.student_credentials (
    nim                  varchar(30) primary key,
    password_hash        text not null default '',
    is_profile_completed boolean not null default false,
    nama                 text,
    no_hp                text,
    kelas                text,
    prodi                text,
    verified_at          timestamptz,
    created_at           timestamptz not null default now(),
    updated_at           timestamptz not null default now()
);

alter table public.student_credentials add column if not exists nama text;
alter table public.student_credentials add column if not exists no_hp text;
alter table public.student_credentials add column if not exists kelas text;
alter table public.student_credentials add column if not exists prodi text;


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
-- 4. Fungsi simpan kredensial & profil aktivasi mahasiswa
--    p_password null / kosong       = jangan ubah kata sandi yang sudah ada
--    p_is_profile_completed null    = jangan ubah status profil
-- ------------------------------------------------------------
drop function if exists public.save_student_credential(text, text, boolean);
drop function if exists public.save_student_credential(text, text, boolean, text, text, text, text);

create or replace function public.save_student_credential(
    p_nim text,
    p_password text default null,
    p_is_profile_completed boolean default null,
    p_nama text default null,
    p_no_hp text default null,
    p_kelas text default null,
    p_prodi text default null
)
returns boolean
language sql
security definer
set search_path = public, extensions
as $fn$
insert into public.student_credentials as sc (
    nim, password_hash, is_profile_completed, nama, no_hp, kelas, prodi, verified_at, updated_at
)
values (
    trim(p_nim),
    case
        when p_password is not null and trim(p_password) <> ''
            then crypt(trim(p_password), gen_salt('bf'))
        else ''
    end,
    coalesce(p_is_profile_completed, false),
    nullif(trim(coalesce(p_nama, '')), ''),
    nullif(trim(coalesce(p_no_hp, '')), ''),
    nullif(trim(coalesce(p_kelas, '')), ''),
    nullif(trim(coalesce(p_prodi, '')), ''),
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
    nama = coalesce(nullif(trim(coalesce(p_nama, '')), ''), sc.nama),
    no_hp = coalesce(nullif(trim(coalesce(p_no_hp, '')), ''), sc.no_hp),
    kelas = coalesce(nullif(trim(coalesce(p_kelas, '')), ''), sc.kelas),
    prodi = coalesce(nullif(trim(coalesce(p_prodi, '')), ''), sc.prodi),
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
-- 6. Fungsi status kredensial & profil mahasiswa
--    0 baris = NIM belum pernah diverifikasi (pakai aturan default NIM)
-- ------------------------------------------------------------
drop function if exists public.get_student_credential(text);

create or replace function public.get_student_credential(p_nim text)
returns table (
    has_password boolean,
    is_profile_completed boolean,
    nama text,
    no_hp text,
    kelas text,
    prodi text
)
language sql
security definer
set search_path = public, extensions
as $fn$
select coalesce(length(sc.password_hash) > 0, false),
       coalesce(sc.is_profile_completed, false),
       sc.nama,
       sc.no_hp,
       sc.kelas,
       sc.prodi
from public.student_credentials sc
where sc.nim = trim(p_nim)
$fn$;


-- ------------------------------------------------------------
-- 7. Izin eksekusi: hanya lewat fungsi, bukan tabel
-- ------------------------------------------------------------
revoke all on function public.save_student_credential(text, text, boolean, text, text, text, text) from public;
revoke all on function public.verify_student_password(text, text) from public;
revoke all on function public.get_student_credential(text) from public;

grant execute on function public.save_student_credential(text, text, boolean, text, text, text, text) to anon, authenticated;
grant execute on function public.verify_student_password(text, text) to anon, authenticated;
grant execute on function public.get_student_credential(text) to anon, authenticated;

create index if not exists idx_student_credentials_completed
    on public.student_credentials (is_profile_completed);


-- ============================================================
-- 8. RESET BERSIH SELURUH AKUN & AKTIVITAS MAHASISWA (SIAP DEPLOY)
--    - Semua kata sandi mahasiswa kembali ke NIM & wajib aktivasi (first_login=true)
--    - Semua pengajuan judul TA (thesis_titles) dikosongkan
--    - Semua entry & riwayat bimbingan (thesis_consultations) dikosongkan
--    - Semua jadwal/peminjaman sidang, tahapan, & notifikasi pengujian dikosongkan
--    - Alokasi Dosen Pembimbing (student_advisors) tetap utuh, hanya judul_ta dikosongkan
-- ============================================================
truncate table public.student_credentials;

do $$
begin
    -- 1. Kosongkan seluruh pengajuan judul Tugas Akhir mahasiswa
    if to_regclass('public.thesis_titles') is not null then
        execute 'truncate table public.thesis_titles restart identity cascade';
    end if;

    -- 2. Kosongkan seluruh entry & riwayat bimbingan Tugas Akhir mahasiswa
    if to_regclass('public.thesis_consultations') is not null then
        execute 'truncate table public.thesis_consultations restart identity cascade';
    end if;

    -- 3. Kosongkan tahapan TA, peminjaman ruang sidang, jadwal sidang, dan notifikasi jika tabel ada
    if to_regclass('public.thesis_stages') is not null then
        execute 'truncate table public.thesis_stages restart identity cascade';
    end if;

    if to_regclass('public.bookings') is not null then
        execute 'truncate table public.bookings restart identity cascade';
    end if;

    if to_regclass('public.defense_schedules') is not null then
        execute 'truncate table public.defense_schedules restart identity cascade';
    end if;

    if to_regclass('public.notifications') is not null then
        execute 'truncate table public.notifications restart identity cascade';
    end if;

    -- 4. Bersihkan nomor HP mahasiswa di tabel profiles
    if to_regclass('public.profiles') is not null then
        execute 'update public.profiles set no_hp = null where role = ''mahasiswa''';
    end if;

    -- 5. Bersihkan kolom judul_ta pada student_advisors bila kolom tersebut ada (alokasi dospem tetap aman)
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'student_advisors'
          and column_name = 'judul_ta'
    ) then
        execute 'update public.student_advisors set judul_ta = '''' where judul_ta is not null and judul_ta <> ''''';
    end if;
end $$;


-- ------------------------------------------------------------
-- 9. Cek hasil akhir (semua angka aktivitas mahasiswa harus 0)
-- ------------------------------------------------------------
select
    (select count(*) from public.student_credentials) as akun_mahasiswa_teraktivasi,
    (select count(*) from public.thesis_titles) as jumlah_pengajuan_judul,
    (select count(*) from public.thesis_consultations) as jumlah_entry_bimbingan;
