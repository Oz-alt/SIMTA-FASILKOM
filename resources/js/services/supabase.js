import { laravelClient } from './laravelClient.js';

/**
 * Backend data client SIMONITA FASILKOM (Laravel + MySQL/SQLite via `/api/simta/*`).
 * Eksport `supabase` dan `isSupabaseConfigured` tetap dipertahankan sebagai alias kompatibel
 * agar seluruh modul layanan bekerja langsung tanpa koneksi ke layanan eksternal Supabase.
 */
export const isBackendConfigured = typeof window !== 'undefined';
export const backendDriver = 'laravel';

export const isSupabaseConfigured = isBackendConfigured;
export const supabase = laravelClient;
export const apiClient = laravelClient;
