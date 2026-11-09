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

const isValidStudentPhone = (val) => {
    const s = String(val ?? '').trim();
    if (!s || s === '-') return false;
    if (s.startsWith('08123000') || s.startsWith('08123456') || s === '0812999999') return false;
    return true;
};

/** Bersihkan URL avatar yang rusak/terkunci (seperti link Google Drive privat lama). */
export const sanitizeStudentAvatarUrl = (val) => {
    const s = String(val ?? '').trim();
    if (!s || s === '-') return '';
    if (s.includes('1gcriQMAWb7tlHZwvH2UXHuvL_WlpPwsz')) return '';
    return s;
};

/** Normalisasi nilai angkatan/kelas agar konsisten mengikuti input profil mahasiswa (mis. "MI 2024" -> "2024"). */
export const normalizeStudentAngkatan = (value) => {
    const raw = String(value ?? '').trim();
    if (!raw || raw === '-' || raw === 'MI 5A' || raw === 'MI 5B') return '';
    if (/^0901\d{8,}$/.test(raw)) {
        const yr = raw.slice(6, 8);
        return yr && /^\d{2}$/.test(yr) ? `20${yr}` : '2024';
    }
    return raw.replace(/^MI\s+/i, '').trim();
};

/**
 * Cari cadangan data profil mahasiswa (no_hp, avatar_url, kelas, nama, prodi)
 * dari seluruh key localStorage yang mungkin masih menyimpannya di browser ini.
 */
const scanLocalStudentFallback = (nim) => {
    const key = normalizeNim(nim);
    if (typeof window === 'undefined' || !key) return {};
    const result = {
        nama: null,
        noHp: null,
        kelas: null,
        prodi: null,
        avatar_url: null,
        isProfileCompleted: false,
        hasPassword: false,
    };
    try {
        // 1. Cek simta_active_user
        const rawActive = localStorage.getItem('simta_active_user');
        if (rawActive) {
            const active = JSON.parse(rawActive);
            if (active && normalizeNim(active.nim || active.nip) === key) {
                if (isValidStudentPhone(active.no_hp || active.noHp)) result.noHp = String(active.no_hp || active.noHp).trim();
                const av = sanitizeStudentAvatarUrl(active.avatar_url || active.avatarUrl);
                if (av) result.avatar_url = av;
                const k = normalizeStudentAngkatan(active.kelas);
                if (k) result.kelas = k;
                if (active.nama) result.nama = active.nama;
                if (active.prodi) result.prodi = active.prodi;
                if (active.is_profile_completed) result.isProfileCompleted = true;
            }
        }
    } catch {}
    try {
        // 2. Cek simta_registered_users
        const rawReg = localStorage.getItem('simta_registered_users');
        if (rawReg) {
            const list = JSON.parse(rawReg);
            if (Array.isArray(list)) {
                list.forEach((u) => {
                    if (!u || normalizeNim(u.nim || u.nip) !== key) return;
                    if (!result.noHp && isValidStudentPhone(u.no_hp || u.noHp)) result.noHp = String(u.no_hp || u.noHp).trim();
                    const av = sanitizeStudentAvatarUrl(u.avatar_url || u.avatarUrl);
                    if (!result.avatar_url && av) result.avatar_url = av;
                    const k = normalizeStudentAngkatan(u.kelas);
                    if (!result.kelas && k) result.kelas = k;
                    if (!result.nama && u.nama) result.nama = u.nama;
                    if (!result.prodi && u.prodi) result.prodi = u.prodi;
                    if (u.is_profile_completed) result.isProfileCompleted = true;
                    if (u.password_hash && String(u.password_hash).trim().toLowerCase() !== key.toLowerCase()) {
                        result.hasPassword = true;
                    }
                });
            }
        }
    } catch {}
    try {
        // 3. Cek simta_student_advisors
        const rawAdv = localStorage.getItem('simta_student_advisors');
        if (rawAdv) {
            const advList = JSON.parse(rawAdv);
            if (Array.isArray(advList)) {
                const foundAdv = advList.find((a) => a && normalizeNim(a.student_nim) === key);
                if (foundAdv) {
                    if (!result.noHp && isValidStudentPhone(foundAdv.no_hp || foundAdv.noHp)) {
                        result.noHp = String(foundAdv.no_hp || foundAdv.noHp).trim();
                    }
                    const k = normalizeStudentAngkatan(foundAdv.kelas);
                    if (!result.kelas && k) result.kelas = k;
                    if (!result.nama && foundAdv.student_nama) result.nama = foundAdv.student_nama;
                }
            }
        }
    } catch {}
    return result;
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
            const incomingAvatar = status.avatar_url !== undefined ? status.avatar_url : status.avatarUrl;
            const cleanAvatar = incomingAvatar !== undefined
                ? (sanitizeStudentAvatarUrl(incomingAvatar) || null)
                : (sanitizeStudentAvatarUrl(prev.avatar_url || prev.avatarUrl) || null);
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
                avatar_url: cleanAvatar,
                avatarUrl: cleanAvatar,
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
            const incomingAvatar = parsed?.avatar_url !== undefined ? parsed.avatar_url : parsed?.avatarUrl;
            const cleanRemoteAvatar = sanitizeStudentAvatarUrl(incomingAvatar);
            const resolvedAvatar = cleanRemoteAvatar || sanitizeStudentAvatarUrl(prev.avatar_url || prev.avatarUrl) || null;
            const merged = {
                exists: true,
                hasPassword: Boolean(prev.hasPassword ?? true),
                isProfileCompleted: parsed?.isProfileCompleted !== undefined ? Boolean(parsed.isProfileCompleted) : Boolean(prev.isProfileCompleted ?? true),
                nama: parsed?.nama || prev.nama || null,
                noHp: parsed?.noHp || parsed?.no_hp || prev.noHp || prev.no_hp || null,
                no_hp: parsed?.noHp || parsed?.no_hp || prev.noHp || prev.no_hp || null,
                kelas: cleanKelas || null,
                prodi: parsed?.prodi || prev.prodi || null,
                avatar_url: resolvedAvatar,
                avatarUrl: resolvedAvatar,
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
        let credEntry = null;
        try {
            const raw = localStorage.getItem(LOCAL_CRED_STORAGE_KEY);
            if (raw) {
                const map = JSON.parse(raw);
                if (map && typeof map === 'object' && map[key]) {
                    credEntry = map[key];
                }
            }
        } catch { }
        const localFallback = scanLocalStudentFallback(key);
        if (credEntry || localFallback.noHp || localFallback.avatar_url || localFallback.isProfileCompleted) {
            const base = credEntry || {};
            const resolvedPhone = (isValidStudentPhone(base.noHp || base.no_hp) ? (base.noHp || base.no_hp) : null) || localFallback.noHp || null;
            const resolvedAvatar = (base.avatar_url !== undefined ? base.avatar_url : base.avatarUrl) || localFallback.avatar_url || null;
            return {
                ...base,
                exists: Boolean(base.exists || resolvedPhone || localFallback.isProfileCompleted),
                hasPassword: Boolean(base.hasPassword || localFallback.hasPassword),
                isProfileCompleted: Boolean(base.isProfileCompleted || localFallback.isProfileCompleted || resolvedPhone),
                nama: base.nama || localFallback.nama || null,
                noHp: resolvedPhone,
                no_hp: resolvedPhone,
                kelas: normalizeStudentAngkatan(base.kelas || localFallback.kelas) || null,
                prodi: base.prodi || localFallback.prodi || null,
                avatar_url: resolvedAvatar,
                avatarUrl: resolvedAvatar,
            };
        }
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

            // 2. Periksa thesis_titles untuk fallback nama, kelas/angkatan, dan prodi
            let ttNama = null;
            let ttKelas = null;
            let ttProdi = null;
            try {
                const { data: ttRows } = await supabase
                    .from('thesis_titles')
                    .select('mhs_nama, mhs_kelas, angkatan, prodi')
                    .eq('mhs_nim', key)
                    .limit(1);
                const ttRow = Array.isArray(ttRows) ? ttRows[0] : ttRows;
                if (ttRow) {
                    if (ttRow.mhs_nama) ttNama = ttRow.mhs_nama;
                    if (ttRow.angkatan || ttRow.mhs_kelas) ttKelas = ttRow.angkatan || ttRow.mhs_kelas;
                    if (ttRow.prodi) ttProdi = ttRow.prodi;
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

            const localFallback = scanLocalStudentFallback(key);
            const resolvedNama = row?.nama || remoteMeta?.nama || ttNama || profNama || prev.nama || localFallback.nama || null;
            const rawPhone = (isValidStudentPhone(row?.no_hp) ? row.no_hp : null)
                || (isValidStudentPhone(remoteMeta?.noHp || remoteMeta?.no_hp) ? (remoteMeta.noHp || remoteMeta.no_hp) : null)
                || (isValidStudentPhone(profPhone) ? profPhone : null)
                || (isValidStudentPhone(prev.noHp || prev.no_hp) ? (prev.noHp || prev.no_hp) : null)
                || localFallback.noHp
                || null;
            const resolvedNoHp = (rawPhone && rawPhone !== '-') ? String(rawPhone).trim() : null;
            const resolvedKelas = normalizeStudentAngkatan(
                row?.kelas || remoteMeta?.kelas || ttKelas || profKelas || prev.kelas || localFallback.kelas
            ) || null;
            const resolvedProdi = row?.prodi || remoteMeta?.prodi || ttProdi || prev.prodi || localFallback.prodi || null;
            const remoteAvatar = sanitizeStudentAvatarUrl(remoteMeta?.avatar_url !== undefined ? remoteMeta.avatar_url : remoteMeta?.avatarUrl);
            const localAvatar = sanitizeStudentAvatarUrl(prev.avatar_url || prev.avatarUrl || localFallback.avatar_url);
            const resolvedAvatar = remoteAvatar || localAvatar || null;

            // Indikasi profil telah selesai/lengkap:
            // - row.is_profile_completed dari student_credentials
            // - remoteMeta.isProfileCompleted dari admin_cms
            // - Ada nomor HP valid yang tersimpan di server / lokal
            // - prev.isProfileCompleted / localFallback.isProfileCompleted sebelumnya
            const hasPhone = Boolean(resolvedNoHp);
            const isCompleted = Boolean(
                row?.is_profile_completed === true ||
                remoteMeta?.isProfileCompleted === true ||
                hasPhone ||
                prev.isProfileCompleted === true ||
                localFallback.isProfileCompleted === true
            );

            // Auto-Heal ke admin_cms jika browser ini punya no_hp atau avatar_url yang belum ada di remoteMeta
            const remoteHasPhone = isValidStudentPhone(remoteMeta?.noHp || remoteMeta?.no_hp);
            const remoteHasAvatar = Boolean(remoteAvatar);
            const needsAdminCmsHeal = (resolvedNoHp && !remoteHasPhone) || (resolvedAvatar && !remoteHasAvatar);
            if (needsAdminCmsHeal) {
                supabase.from('admin_cms').upsert([{
                    id: `${PROFILE_META_PREFIX}${key}`,
                    judul: key,
                    kategori: PROFILE_META_CATEGORY,
                    isi: JSON.stringify({
                        ...(remoteMeta || {}),
                        nim: key,
                        nama: resolvedNama,
                        noHp: resolvedNoHp,
                        no_hp: resolvedNoHp,
                        kelas: resolvedKelas || '2024',
                        prodi: resolvedProdi || 'D3 Manajemen Informatika',
                        avatar_url: resolvedAvatar || '',
                        avatarUrl: resolvedAvatar || '',
                        isProfileCompleted: isCompleted,
                        updated_at: new Date().toISOString(),
                    }),
                    status: 'aktif',
                    penulis: 'Student Profile Auto-Heal',
                    updated_at: new Date().toISOString(),
                }], { onConflict: 'id' }).then(() => {}).catch(() => {});
            }

            const existsOnServer = Boolean(row || remoteMeta || profPhone || ttNama);

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
                    avatar_url: null,
                    avatarUrl: null,
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
                avatar_url: resolvedAvatar,
                avatarUrl: resolvedAvatar,
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
 * @param {{ nim: string, password?: string, isProfileCompleted?: boolean, nama?: string, noHp?: string, kelas?: string, prodi?: string, avatarUrl?: string, avatar_url?: string }} params
 * @returns {Promise<{ success: boolean, tableMissing?: boolean, message?: string }>}
 */
export const saveStudentCredential = async ({ nim, password, isProfileCompleted, nama, noHp, kelas, prodi, avatarUrl, avatar_url }) => {
    const key = normalizeNim(nim);
    if (!key) {
        return { success: false, message: 'NIM tidak valid.' };
    }
    if (!isReady()) {
        return { success: false, message: 'Supabase belum dikonfigurasi.' };
    }

    const plainPassword = typeof password === 'string' && password.trim() ? password.trim() : null;
    const cleanNama = typeof nama === 'string' && nama.trim() ? nama.trim() : null;
    const cleanNoHp = typeof noHp === 'string' && noHp.trim() && noHp.trim() !== '-' ? noHp.trim() : null;
    const cleanKelas = typeof kelas === 'string' && kelas.trim() ? kelas.trim() : null;
    const cleanProdi = typeof prodi === 'string' && prodi.trim() ? prodi.trim() : null;
    const hasAvatarUpdate = avatar_url !== undefined || avatarUrl !== undefined;
    const cleanAvatar = sanitizeStudentAvatarUrl(avatar_url !== undefined ? avatar_url : avatarUrl);

    if (!plainPassword && typeof isProfileCompleted !== 'boolean' && !cleanNama && !cleanNoHp && !cleanKelas && !hasAvatarUpdate) {
        return { success: true };
    }

    try {
        let error = null;
        if (plainPassword || typeof isProfileCompleted === 'boolean') {
            const rpcRes = await supabase.rpc('save_student_credential', {
                p_nim: key,
                p_password: plainPassword,
                p_is_profile_completed: typeof isProfileCompleted === 'boolean' ? isProfileCompleted : null,
            });
            error = rpcRes.error;
        }

        // Ambil metadata yang sudah ada di admin_cms terlebih dahulu agar update parsial
        // (misal ganti foto atau ganti password dari perangkat lain) TIDAK PERNAH menghapus noHp / avatar_url yang sudah ada
        let existingRemote = {};
        try {
            const { data: existingRow } = await supabase
                .from('admin_cms')
                .select('isi')
                .eq('id', `${PROFILE_META_PREFIX}${key}`)
                .maybeSingle();
            if (existingRow?.isi) {
                existingRemote = typeof existingRow.isi === 'string' ? JSON.parse(existingRow.isi) : existingRow.isi;
            }
        } catch {}

        // Simpan selalu metadata profil (nama, noHp, kelas/angkatan, prodi, avatar_url) ke Supabase admin_cms
        // agar lintas perangkat/browser selalu sinkron tanpa bergantung pada status RPC
        const prev = cache.get(key) || getCachedStudentCredential(key) || { hasPassword: false, isProfileCompleted: false };
        const normalizedKelas = normalizeStudentAngkatan(cleanKelas || existingRemote?.kelas || prev.kelas) || null;
        const mergedNoHp = cleanNoHp || existingRemote?.noHp || existingRemote?.no_hp || prev.noHp || prev.no_hp || null;
        const mergedAvatar = hasAvatarUpdate
            ? (cleanAvatar || '')
            : (sanitizeStudentAvatarUrl(existingRemote?.avatar_url ?? existingRemote?.avatarUrl ?? prev.avatar_url ?? prev.avatarUrl) || null);
        const mergedCompleted = typeof isProfileCompleted === 'boolean'
            ? isProfileCompleted
            : Boolean(existingRemote?.isProfileCompleted || prev.isProfileCompleted || mergedNoHp);

        const nextStatus = {
            exists: true,
            hasPassword: prev.hasPassword || Boolean(plainPassword),
            isProfileCompleted: mergedCompleted,
            nama: cleanNama || existingRemote?.nama || prev.nama || null,
            noHp: mergedNoHp,
            no_hp: mergedNoHp,
            kelas: normalizedKelas,
            prodi: cleanProdi || existingRemote?.prodi || prev.prodi || null,
            avatar_url: mergedAvatar,
            avatarUrl: mergedAvatar,
            fromServer: true,
        };
        cache.set(key, nextStatus);
        cacheLoadedAt = Date.now();
        persistLocalCred(key, nextStatus);

        if (nextStatus.nama || nextStatus.noHp || nextStatus.kelas || nextStatus.prodi || hasAvatarUpdate || typeof isProfileCompleted === 'boolean') {
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
                        avatar_url: nextStatus.avatar_url,
                        avatarUrl: nextStatus.avatarUrl,
                        isProfileCompleted: nextStatus.isProfileCompleted,
                        updated_at: new Date().toISOString(),
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
