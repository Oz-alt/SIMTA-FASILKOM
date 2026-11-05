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
const PROFILE_META_PREFIX = 'student-profile-';
const PROFILE_META_CATEGORY = 'student_profile_meta';

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

/** Normalisasi nilai angkatan/kelas agar konsisten mengikuti input profil mahasiswa (mis. "MI 2024" -> "2024"). */
export const normalizeStudentAngkatan = (value) => {
    const raw = String(value ?? '').trim();
    if (!raw || raw === '-' || raw === 'MI 5A' || raw === 'MI 5B') return '';
    return raw.replace(/^MI\s+/i, '').trim();
};

const persistLocalCred = (nim, status) => {
    if (typeof window === 'undefined' || !nim || !status) return;
    try {
        const raw = localStorage.getItem(LOCAL_CRED_STORAGE_KEY);
        const map = raw ? JSON.parse(raw) : {};
        if (map && typeof map === 'object') {
            const cleanKelas = normalizeStudentAngkatan(status.kelas);
            const prev = map[nim] || {};
            const incomingPhone = status.noHp || status.no_hp || null;
            const cleanPhone = (incomingPhone && incomingPhone !== '-') ? incomingPhone : (prev.noHp || prev.no_hp || null);
            const isCompleted = status.isProfileCompleted !== undefined
                ? Boolean(status.isProfileCompleted)
                : Boolean(prev.isProfileCompleted || cleanPhone);
            map[nim] = {
                exists: Boolean(status.exists !== undefined ? status.exists : prev.exists),
                hasPassword: Boolean(status.hasPassword !== undefined ? status.hasPassword : prev.hasPassword),
                isProfileCompleted: isCompleted,
                nama: status.nama || prev.nama || null,
                noHp: cleanPhone,
                no_hp: cleanPhone,
                kelas: cleanKelas || prev.kelas || null,
                prodi: status.prodi || prev.prodi || null,
                updatedAt: Date.now(),
            };
            localStorage.setItem(LOCAL_CRED_STORAGE_KEY, JSON.stringify(map));
        }
    } catch { }
};

/**
 * Hidrasi cache profil mahasiswa terverifikasi dari baris metadata Supabase (`admin_cms`).
 * Dipanggil otomatis saat aplikasi memuat data awal sehingga seluruh halaman (Kaprodi/Dosen/Mahasiswa)
 * langsung memiliki nomor WhatsApp dan Angkatan terbaru lintas perangkat.
 */
export const hydrateStudentProfileMeta = (rows = []) => {
    if (!Array.isArray(rows)) return;
    rows.forEach((row) => {
        if (!row) return;
        const idStr = String(row.id || '');
        if (row.kategori !== PROFILE_META_CATEGORY && !idStr.startsWith(PROFILE_META_PREFIX)) {
            return;
        }
        try {
            const parsed = typeof row.isi === 'string' ? JSON.parse(row.isi) : row.isi;
            const nim = normalizeNim(parsed?.nim || row.judul || idStr.replace(PROFILE_META_PREFIX, ''));
            if (!nim) return;
            const prev = cache.get(nim) || getCachedStudentCredential(nim) || {};
            const cleanKelas = normalizeStudentAngkatan(parsed?.kelas || prev.kelas);
            const merged = {
                exists: true,
                hasPassword: Boolean(prev.hasPassword ?? true),
                isProfileCompleted: parsed?.isProfileCompleted !== undefined ? Boolean(parsed.isProfileCompleted) : Boolean(prev.isProfileCompleted ?? true),
                nama: parsed?.nama || prev.nama || null,
                noHp: parsed?.noHp || parsed?.no_hp || prev.noHp || prev.no_hp || null,
                no_hp: parsed?.noHp || parsed?.no_hp || prev.noHp || prev.no_hp || null,
                kelas: cleanKelas || null,
                prodi: parsed?.prodi || prev.prodi || null,
                fromServer: true,
            };
            cache.set(nim, merged);
            persistLocalCred(nim, merged);
        } catch {}
    });
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
        } catch { }
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
            let row = null;
            try {
                const { data, error } = await supabase.rpc('get_student_credential', { p_nim: key });
                if (!error && data) {
                    row = Array.isArray(data) ? data[0] : data;
                }
            } catch (rpcErr) {
                console.warn('RPC get_student_credential warning:', rpcErr);
            }

            const prev = cached || getCachedStudentCredential(key) || {};

            // 1. Periksa admin_cms (metadata profil mahasiswa yang disimpan permanen lintas perangkat)
            let remoteMeta = null;
            try {
                const { data: metaRow } = await supabase
                    .from('admin_cms')
                    .select('isi')
                    .eq('id', `${PROFILE_META_PREFIX}${key}`)
                    .maybeSingle();
                if (metaRow?.isi) {
                    remoteMeta = typeof metaRow.isi === 'string' ? JSON.parse(metaRow.isi) : metaRow.isi;
                }
            } catch {}

            // 2. Periksa student_advisors (sinkronisasi nomor HP pembimbingan mahasiswa)
            let saPhone = null;
            let saNama = null;
            let saKelas = null;
            try {
                const { data: saRow } = await supabase
                    .from('student_advisors')
                    .select('no_hp, student_nama, kelas')
                    .eq('student_nim', key)
                    .maybeSingle();
                if (saRow) {
                    if (saRow.no_hp && saRow.no_hp !== '-') saPhone = saRow.no_hp;
                    if (saRow.student_nama) saNama = saRow.student_nama;
                    if (saRow.kelas) saKelas = saRow.kelas;
                }
            } catch {}

            // 3. Periksa profiles (tabel profiles umum)
            let profPhone = null;
            let profNama = null;
            let profKelas = null;
            try {
                const { data: profRow } = await supabase
                    .from('profiles')
                    .select('no_hp, nama, kelas')
                    .or(`nim.eq.${key},nip.eq.${key}`)
                    .maybeSingle();
                if (profRow) {
                    if (profRow.no_hp && profRow.no_hp !== '-') profPhone = profRow.no_hp;
                    if (profRow.nama) profNama = profRow.nama;
                    if (profRow.kelas) profKelas = profRow.kelas;
                }
            } catch {}

            const resolvedNama = row?.nama || remoteMeta?.nama || saNama || profNama || prev.nama || null;
            const rawPhone = row?.no_hp || remoteMeta?.noHp || remoteMeta?.no_hp || saPhone || profPhone || prev.noHp || prev.no_hp || null;
            const resolvedNoHp = (rawPhone && rawPhone !== '-') ? String(rawPhone).trim() : null;
            const resolvedKelas = normalizeStudentAngkatan(
                row?.kelas || remoteMeta?.kelas || saKelas || profKelas || prev.kelas
            ) || null;
            const resolvedProdi = row?.prodi || remoteMeta?.prodi || prev.prodi || null;

            // Indikasi profil telah selesai/lengkap:
            // - row.is_profile_completed dari student_credentials
            // - remoteMeta.isProfileCompleted dari admin_cms
            // - Ada nomor HP valid yang tersimpan di server
            // - prev.isProfileCompleted sebelumnya
            const hasPhone = Boolean(resolvedNoHp);
            const isCompleted = Boolean(
                row?.is_profile_completed === true ||
                remoteMeta?.isProfileCompleted === true ||
                hasPhone ||
                prev.isProfileCompleted === true
            );

            const existsOnServer = Boolean(row || remoteMeta || saPhone || profPhone);

            if (!existsOnServer && !prev.exists) {
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
                hasPassword: row?.has_password === true || Boolean(prev.hasPassword),
                isProfileCompleted: isCompleted,
                nama: resolvedNama,
                noHp: resolvedNoHp,
                no_hp: resolvedNoHp,
                kelas: resolvedKelas,
                prodi: resolvedProdi,
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

        // Simpan selalu metadata profil (nama, noHp, kelas/angkatan, prodi) ke Supabase admin_cms
        // agar lintas perangkat/browser selalu sinkron tanpa bergantung pada status RPC
        const prev = cache.get(key) || getCachedStudentCredential(key) || { hasPassword: false, isProfileCompleted: false };
        const normalizedKelas = normalizeStudentAngkatan(cleanKelas || prev.kelas) || null;
        const nextStatus = {
            exists: true,
            hasPassword: prev.hasPassword || Boolean(plainPassword),
            isProfileCompleted: typeof isProfileCompleted === 'boolean' ? isProfileCompleted : prev.isProfileCompleted,
            nama: cleanNama || prev.nama || null,
            noHp: cleanNoHp || prev.noHp || prev.no_hp || null,
            no_hp: cleanNoHp || prev.noHp || prev.no_hp || null,
            kelas: normalizedKelas,
            prodi: cleanProdi || prev.prodi || null,
            fromServer: true,
        };
        cache.set(key, nextStatus);
        cacheLoadedAt = Date.now();
        persistLocalCred(key, nextStatus);

        if (nextStatus.nama || nextStatus.noHp || nextStatus.kelas || nextStatus.prodi || typeof isProfileCompleted === 'boolean') {
            try {
                await supabase.from('admin_cms').upsert([{
                    id: `${PROFILE_META_PREFIX}${key}`,
                    judul: key,
                    kategori: PROFILE_META_CATEGORY,
                    isi: JSON.stringify({
                        nim: key,
                        nama: nextStatus.nama,
                        noHp: nextStatus.noHp,
                        no_hp: nextStatus.no_hp,
                        kelas: nextStatus.kelas,
                        prodi: nextStatus.prodi,
                        isProfileCompleted: nextStatus.isProfileCompleted,
                    }),
                    status: 'aktif',
                    penulis: 'Student Profile Sync',
                    updated_at: new Date().toISOString(),
                }], { onConflict: 'id' });
            } catch (cmsErr) {
                console.warn('admin_cms metadata fallback upsert warning:', cmsErr);
            }
        }

        if (error) {
            return {
                success: false,
                tableMissing: isMissingSchemaError(error),
                message: error.message,
            };
        }

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
