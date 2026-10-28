/**
 * Verifikasi tabel + fungsi student_credentials di Supabase memakai anon key.
 * Jalankan: node scripts/verify-student-credentials.mjs
 */
import fs from 'node:fs';

const env = {};
for (const line of fs.readFileSync(new URL('../.env', import.meta.url), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^"|"$/g, '');
}
const url = (env.VITE_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '');
const key = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const H = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

const PROBE_NIM = '__VERIFY_PROBE__';

const rpc = async (fn, body) => {
    const r = await fetch(`${url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: H, body: JSON.stringify(body) });
    const text = await r.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    return { status: r.status, ok: r.ok, data: parsed };
};

const results = [];
const record = (name, pass, detail) => {
    results.push({ name, pass, detail });
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' -> ' + detail : ''}`);
};

(async () => {
    console.log('Supabase:', url);
    console.log('');

    // 1) tabel harus tertutup untuk anon
    const direct = await fetch(`${url}/rest/v1/student_credentials?select=*&limit=1`, { headers: H });
    const directBody = await direct.text();
    const locked = direct.status === 401 || direct.status === 403 ||
        (direct.status === 200 && Array.isArray(JSON.parse(directBody || '[]')) && JSON.parse(directBody || '[]').length === 0);
    record('Tabel tertutup untuk anon (tidak bisa baca password_hash)', locked, `HTTP ${direct.status}`);

    // 2) fungsi save ada
    const save = await rpc('save_student_credential', {
        p_nim: PROBE_NIM, p_password: 'ProbeRahasia123', p_is_profile_completed: false,
    });
    record('rpc save_student_credential', save.ok, `HTTP ${save.status} ${JSON.stringify(save.data).slice(0, 90)}`);

    // 3) fungsi get ada + status terbaca
    const got = await rpc('get_student_credential', { p_nim: PROBE_NIM });
    const row = Array.isArray(got.data) ? got.data[0] : got.data;
    record('rpc get_student_credential', got.ok && row && row.has_password === true, JSON.stringify(got.data).slice(0, 110));

    // 4) verifikasi sandi benar
    const okPass = await rpc('verify_student_password', { p_nim: PROBE_NIM, p_password: 'ProbeRahasia123' });
    record('verify sandi benar -> true', okPass.ok && okPass.data === true, JSON.stringify(okPass.data));

    // 5) verifikasi sandi salah
    const badPass = await rpc('verify_student_password', { p_nim: PROBE_NIM, p_password: 'SalahBanget' });
    record('verify sandi salah -> false', badPass.ok && badPass.data === false, JSON.stringify(badPass.data));

    // 6) update status tanpa mengubah sandi
    const mark = await rpc('save_student_credential', {
        p_nim: PROBE_NIM, p_password: null, p_is_profile_completed: true,
    });
    const afterMark = await rpc('get_student_credential', { p_nim: PROBE_NIM });
    const rowAfter = Array.isArray(afterMark.data) ? afterMark.data[0] : afterMark.data;
    record('status profil bisa diubah tanpa menghapus sandi',
        mark.ok && rowAfter?.is_profile_completed === true && rowAfter?.has_password === true,
        JSON.stringify(afterMark.data));

    // 7) sandi masih valid setelah update status
    const stillValid = await rpc('verify_student_password', { p_nim: PROBE_NIM, p_password: 'ProbeRahasia123' });
    record('sandi tetap valid setelah update status', stillValid.ok && stillValid.data === true, JSON.stringify(stillValid.data));

    console.log('');
    const failed = results.filter(r => !r.pass);
    if (failed.length === 0) {
        console.log(`SEMUA ${results.length} CEK LULUS.`);
        console.log('Catatan: baris probe masih ada. Hapus dengan SQL:');
        console.log(`  delete from public.student_credentials where nim = '${PROBE_NIM}';`);
    } else {
        console.log(`${failed.length} dari ${results.length} cek GAGAL.`);
        process.exitCode = 1;
    }
})();
