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
const LOCAL_CRED_STORAGE_KEY = 'simta_student_credentials_v1';

/**
 * @typedef {{ exists?: boolean, hasPassword: boolean, isProfileCompleted: boolean, nama?: string|null, noHp?: string|null, no_hp?: string|null, kelas?: string|null, prodi?: string|null, fromServer?: boolean }} CredentialStatus
 */

/** @type {Map<string, CredentialStatus>} */
let cache = new Map();
/** @type {Map<string, Promise<CredentialStatus | null>>} */
let inFlight = new Map();
let cacheLoadedAt = 0;

/** Normalisasi NIM agar konsisten sebagai kunci. */
export const normalizeNim = (value) => String(value ?? '').trim();

const persistLocalCred = (nim, status) => {
    if (typeof window === 'undefined' || !nim || !status) return;
    try {
        const raw = localStorage.getItem(LOCAL_CRED_STORAGE_KEY);
        const map = raw ? JSON.parse(raw) : {};
        if (map && typeof map === 'object') {
            map[nim] = {
                exists: Boolean(status.exists),
                hasPassword: Boolean(status.hasPassword),
                isProfileCompleted: Boolean(status.isProfileCompleted),
                nama: status.nama || null,
                noHp: status.noHp || status.no_hp || null,
                no_hp: status.noHp || status.no_hp || null,
                kelas: status.kelas || null,
                prodi: status.prodi || null,
                updatedAt: Date.now(),
            };
            localStorage.setItem(LOCAL_CRED_STORAGE_KEY, JSON.stringify(map));
        }
    } catch {}
};

export const getCachedStudentCredential = (nim) => {
    const key = normalizeNim(nim);
    if (!key) return null;
    if (cache.has(key)) return cache.get(key);
    if (typeof window !== 'undefined') {
        try {
            const raw = localStorage.getItem(LOCAL_CRED_STORAGE_KEY);
            if (raw) {
                const map = JSON.parse(raw);
                if (map && typeof map === 'object' && map[key]) {
                    return map[key];
                }
            }
        } catch {}
    }
    return null;
};

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
        return cached ?? getCachedStudentCredential(key);
    }

    if (!options.fresh && inFlight.has(key)) {
        return inFlight.get(key);
    }

    const requestPromise = (async () => {
        try {
            const { data, error } = await supabase.rpc('get_student_credential', { p_nim: key });

            if (error) {
                return cached ?? getCachedStudentCredential(key);
            }

            const row = Array.isArray(data) ? data[0] : data;
            if (!row) {
                const emptyStatus = {
                    exists: false,
                    hasPassword: false,
                    isProfileCompleted: false,
                    nama: null,
                    noHp: null,
                    no_hp: null,
                    kelas: null,
                    prodi: null,
                    fromServer: true,
                };
                cache.set(key, emptyStatus);
                cacheLoadedAt = Date.now();
                persistLocalCred(key, emptyStatus);
                return emptyStatus;
            }

            const status = {
                exists: true,
                hasPassword: row.has_password === true,
                isProfileCompleted: row.is_profile_completed === true,
                nama: row.nama || null,
                noHp: row.no_hp || null,
                no_hp: row.no_hp || null,
                kelas: row.kelas || null,
                prodi: row.prodi || null,
                fromServer: true,
            };
            cache.set(key, status);
            cacheLoadedAt = Date.now();
            persistLocalCred(key, status);
            return status;
        } catch {
            return cached ?? getCachedStudentCredential(key);
        } finally {
            inFlight.delete(key);
        }
    })();

    inFlight.set(key, requestPromise);
    return requestPromise;
};

/**
 * Simpan kata sandi dan/atau status profil lengkap ke server.
 *
 * @param {{ nim: string, password?: string, isProfileCompleted?: boolean, nama?: string, noHp?: string, kelas?: string, prodi?: string }} params
 * @returns {Promise<{ success: boolean, tableMissing?: boolean, message?: string }>}
 */
export const saveStudentCredential = async ({ nim, password, isProfileCompleted, nama, noHp, kelas, prodi }) => {
    const key = normalizeNim(nim);
    if (!key) {
        return { success: false, message: 'NIM tidak valid.' };
    }
    if (!isReady()) {
        return { success: false, message: 'Supabase belum dikonfigurasi.' };
    }

    const plainPassword = typeof password === 'string' && password.trim() ? password.trim() : null;
    const cleanNama = typeof nama === 'string' && nama.trim() ? nama.trim() : null;
    const cleanNoHp = typeof noHp === 'string' && noHp.trim() ? noHp.trim() : null;
    const cleanKelas = typeof kelas === 'string' && kelas.trim() ? kelas.trim() : null;
    const cleanProdi = typeof prodi === 'string' && prodi.trim() ? prodi.trim() : null;

    if (!plainPassword && typeof isProfileCompleted !== 'boolean' && !cleanNama && !cleanNoHp && !cleanKelas) {
        return { success: true };
    }

    try {
        let { error } = await supabase.rpc('save_student_credential', {
            p_nim: key,
            p_password: plainPassword,
            p_is_profile_completed: typeof isProfileCompleted === 'boolean' ? isProfileCompleted : null,
            p_nama: cleanNama,
            p_no_hp: cleanNoHp,
            p_kelas: cleanKelas,
            p_prodi: cleanProdi,
        });

        // Fallback ke signature 3 argumen bila SQL versi terbaru belum dijalankan
        if (error && (String(error.code) === 'PGRST202' || String(error.code) === '42883')) {
            const retry = await supabase.rpc('save_student_credential', {
                p_nim: key,
                p_password: plainPassword,
                p_is_profile_completed: typeof isProfileCompleted === 'boolean' ? isProfileCompleted : null,
            });
            error = retry.error;
        }

        if (error) {
            return {
                success: false,
                tableMissing: isMissingSchemaError(error),
                message: error.message,
            };
        }

        const prev = cache.get(key) || getCachedStudentCredential(key) || { hasPassword: false, isProfileCompleted: false };
        const nextStatus = {
            exists: true,
            hasPassword: prev.hasPassword || Boolean(plainPassword),
            isProfileCompleted: typeof isProfileCompleted === 'boolean' ? isProfileCompleted : prev.isProfileCompleted,
            nama: cleanNama || prev.nama || null,
            noHp: cleanNoHp || prev.noHp || prev.no_hp || null,
            no_hp: cleanNoHp || prev.noHp || prev.no_hp || null,
            kelas: cleanKelas || prev.kelas || null,
            prodi: cleanProdi || prev.prodi || null,
            fromServer: true,
        };
        cache.set(key, nextStatus);
        cacheLoadedAt = Date.now();
        persistLocalCred(key, nextStatus);

        return { success: true };
    } catch (err) {
        return { success: false, message: err?.message || 'Gagal menyimpan kredensial.' };
    }
};

/**
 * Verifikasi kata sandi di server (bcrypt compare).
 * Mengembalikan `null` hanya bila server/fungsi RPC tidak dapat dihubungi.
 * Bila NIM di server belum punya kata sandi kustom (atau telah direset ke default),
 * hanya kata sandi default (NIM) yang dianggap valid (mengabaikan sisa cache localStorage).
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
        const status = await getStudentCredential(key, { fresh: true });
        if (!status) {
            return null;
        }

        if (!status.hasPassword) {
            return plain.trim().toLowerCase() === key.toLowerCase();
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
