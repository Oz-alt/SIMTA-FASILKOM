import { supabase, isSupabaseConfigured } from './supabase.js';

/**
 * Kredensial mahasiswa untuk hasil verifikasi awal (kata sandi + status profil).
 *
 * Kenapa modul ini ada:
 *   Tabel `profiles` tidak punya kolom kata sandi, dan policy UPDATE-nya hanya
 *   mengizinkan pemilik sesi (auth.uid() = id). Mahasiswa yang baru menyelesaikan
 *   verifikasi awal belum punya sesi Supabase Auth, sehingga kata sandi baru
 *   sebelumnya hanya tersimpan di localStorage: hilang saat cache dibersihkan
 *   atau dibuka dari perangkat lain, lalu NIM kembali berlaku sebagai default.
 *
 * Keamanan:
 *   Tabel `student_credentials` dikunci total (RLS aktif, tanpa policy, REVOKE dari
 *   anon). Browser tidak pernah bisa membaca `password_hash`. Semua akses lewat
 *   tiga fungsi SECURITY DEFINER, dan hashing memakai bcrypt di server
 *   (lihat scripts/student_credentials_v2.sql).
 */

const CACHE_TTL_MS = 60_000;

/**
 * @typedef {{ hasPassword: boolean, isProfileCompleted: boolean }} CredentialStatus
 */

/** @type {Map<string, CredentialStatus>} */
let cache = new Map();
let cacheLoadedAt = 0;

/** Normalisasi NIM agar konsisten sebagai kunci. */
export const normalizeNim = (value) => String(value ?? '').trim();

const isReady = () => Boolean(isSupabaseConfigured && supabase);

/** Deteksi error "fungsi/tabel belum ada" dari PostgREST. */
const isMissingSchemaError = (error) => {
    const code = String(error?.code || '');
    const message = String(error?.message || '');
    return (
        code === 'PGRST202' ||
        code === 'PGRST205' ||
        code === '42883' ||
        code === '42P01' ||
        /Could not find the function|Could not find the table|does not exist/i.test(message)
    );
};

/**
 * Ambil status kredensial dari server.
 * `null` berarti NIM belum pernah diverifikasi (belum ada baris).
 *
 * @param {string} nim
 * @param {{ fresh?: boolean }} [options]
 * @returns {Promise<CredentialStatus | null>}
 */
export const getStudentCredential = async (nim, options = {}) => {
    const key = normalizeNim(nim);
    if (!key) {
        return null;
    }

    const cached = cache.get(key);
    const cacheFresh = Date.now() - cacheLoadedAt < CACHE_TTL_MS;
    if (cached && cacheFresh && !options.fresh) {
        return cached;
    }

    if (!isReady()) {
        return cached ?? null;
    }

    try {
        const { data, error } = await supabase.rpc('get_student_credential', { p_nim: key });

        if (error) {
            return cached ?? null;
        }

        const row = Array.isArray(data) ? data[0] : data;
        if (!row) {
            cache.delete(key);
            return null;
        }

        const status = {
            hasPassword: row.has_password === true,
            isProfileCompleted: row.is_profile_completed === true,
        };
        cache.set(key, status);
        cacheLoadedAt = Date.now();
        return status;
    } catch {
        return cached ?? null;
    }
};

/**
 * Simpan kata sandi dan/atau status profil lengkap ke server.
 *
 * @param {{ nim: string, password?: string, isProfileCompleted?: boolean }} params
 * @returns {Promise<{ success: boolean, tableMissing?: boolean, message?: string }>}
 */
export const saveStudentCredential = async ({ nim, password, isProfileCompleted }) => {
    const key = normalizeNim(nim);
    if (!key) {
        return { success: false, message: 'NIM tidak valid.' };
    }
    if (!isReady()) {
        return { success: false, message: 'Supabase belum dikonfigurasi.' };
    }

    const plainPassword = typeof password === 'string' && password.trim() ? password.trim() : null;

    if (!plainPassword && typeof isProfileCompleted !== 'boolean') {
        return { success: true };
    }

    try {
        const { error } = await supabase.rpc('save_student_credential', {
            p_nim: key,
            p_password: plainPassword,
            p_is_profile_completed: typeof isProfileCompleted === 'boolean' ? isProfileCompleted : null,
        });

        if (error) {
            return {
                success: false,
                tableMissing: isMissingSchemaError(error),
                message: error.message,
            };
        }

        const prev = cache.get(key) || { hasPassword: false, isProfileCompleted: false };
        cache.set(key, {
            hasPassword: prev.hasPassword || Boolean(plainPassword),
            isProfileCompleted: typeof isProfileCompleted === 'boolean' ? isProfileCompleted : prev.isProfileCompleted,
        });
        cacheLoadedAt = Date.now();

        return { success: true };
    } catch (err) {
        return { success: false, message: err?.message || 'Gagal menyimpan kredensial.' };
    }
};

/**
 * Verifikasi kata sandi di server (bcrypt compare).
 * Mengembalikan `null` bila NIM belum punya kredensial tersimpan, agar pemanggil
 * bisa jatuh ke aturan default NIM.
 *
 * @param {string} nim
 * @param {string} password
 * @returns {Promise<boolean | null>}
 */
export const verifyStudentPassword = async (nim, password) => {
    const key = normalizeNim(nim);
    const plain = String(password ?? '');
    if (!key || !plain) {
        return null;
    }
    if (!isReady()) {
        return null;
    }

    try {
        const status = await getStudentCredential(key);
        if (!status || !status.hasPassword) {
            return null;
        }

        const { data, error } = await supabase.rpc('verify_student_password', {
            p_nim: key,
            p_password: plain,
        });

        if (error) {
            return null;
        }

        return data === true;
    } catch {
        return null;
    }
};

/** Kosongkan cache (dipakai setelah logout). */
export const resetCredentialCache = () => {
    cache = new Map();
    cacheLoadedAt = 0;
};
