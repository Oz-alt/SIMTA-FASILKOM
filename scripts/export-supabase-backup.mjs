/**
 * SIMTA FASILKOM — Full Supabase Backup & MySQL Export Script
 *
 * Mengekspor seluruh tabel publik, status kredensial mahasiswa (via RPC),
 * serta file PDF di bucket Storage `repository-docs` dari Supabase ke
 * folder `database/exports/` (gitignored), sekaligus menghasilkan paket
 * clean-launch MySQL (data master dosen & plot pembimbing tetap utuh,
 * sedangkan akun verifikasi mahasiswa, judul, dan bimbingan di-reset).
 *
 * Cara pakai:
 *   node scripts/export-supabase-backup.mjs
 *   node scripts/export-supabase-backup.mjs --from-snapshot
 *
 * Opsional (jika memakai service_role key agar bisa membaca RLS ketat seperti
 * tabel `student_credentials`):
 *   SUPABASE_SERVICE_KEY=... node scripts/export-supabase-backup.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ROOT_DIR = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const ENV_PATH = path.join(ROOT_DIR, '.env');
const EXPORT_DIR = path.join(ROOT_DIR, 'database', 'exports');
const STORAGE_EXPORT_DIR = path.join(EXPORT_DIR, 'storage', 'repository-docs');

function loadEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    let val = match[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[match[1]] = val;
  }
  return env;
}

const fileEnv = loadEnvFile(ENV_PATH);
const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  fileEnv.VITE_SUPABASE_URL ||
  ''
).replace(/\/rest\/v1\/?$/, '');

const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || fileEnv.SUPABASE_SERVICE_KEY || '';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  fileEnv.VITE_SUPABASE_ANON_KEY ||
  fileEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
  '';

const ACTIVE_KEY = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;
const FROM_SNAPSHOT_ONLY = process.argv.includes('--from-snapshot');

if (!FROM_SNAPSHOT_ONLY && (!SUPABASE_URL || !ACTIVE_KEY)) {
  console.error('ERROR: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY tidak ditemukan di .env');
  process.exit(1);
}

const supabase = SUPABASE_URL && ACTIVE_KEY
  ? createClient(SUPABASE_URL, ACTIVE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

const TABLES_TO_EXPORT = [
  'profiles',
  'advisors',
  'student_advisors',
  'thesis_titles',
  'thesis_consultations',
  'thesis_repositories',
  'bookings',
  'admin_cms',
  'admin_documents',
  'admin_templates',
  'departments',
  'thesis_stages',
  'defense_schedules',
  'student_credentials',
];

const MYSQL_SCHEMAS = {
  profiles: {
    primaryKey: 'id',
    columns: {
      id: 'VARCHAR(191) NOT NULL',
      nama: 'VARCHAR(255) NULL',
      email: 'VARCHAR(191) NULL',
      nim: 'VARCHAR(64) NULL',
      nip: 'VARCHAR(64) NULL',
      role: "VARCHAR(50) NULL DEFAULT 'mahasiswa'",
      kelas: 'VARCHAR(100) NULL',
      prodi: 'VARCHAR(150) NULL',
      no_hp: 'VARCHAR(64) NULL',
      link_wa_group: 'TEXT NULL',
      jabatan_fungsional: 'VARCHAR(150) NULL',
      avatar_url: 'LONGTEXT NULL',
      is_profile_completed: 'TINYINT(1) NULL DEFAULT 0',
      requires_password_change: 'TINYINT(1) NULL DEFAULT 0',
      created_at: 'DATETIME NULL',
      updated_at: 'DATETIME NULL',
    },
    indexes: ['INDEX idx_profiles_nim (nim)', 'INDEX idx_profiles_nip (nip)', 'INDEX idx_profiles_role (role)'],
  },
  advisors: {
    primaryKey: 'nip',
    columns: {
      id: 'VARCHAR(191) NULL',
      nip: 'VARCHAR(64) NOT NULL',
      nama: 'VARCHAR(255) NULL',
      email: 'VARCHAR(191) NULL',
      prodi: 'VARCHAR(150) NULL',
      no_hp: 'VARCHAR(64) NULL',
      link_wa_group: 'TEXT NULL',
      jabatan_fungsional: 'VARCHAR(150) NULL',
      kuota_bimbingan: 'INT NULL DEFAULT 10',
      status: "VARCHAR(50) NULL DEFAULT 'aktif'",
      created_at: 'DATETIME NULL',
      updated_at: 'DATETIME NULL',
    },
    indexes: ['INDEX idx_advisors_id (id)'],
  },
  student_advisors: {
    primaryKey: 'student_nim',
    columns: {
      id: 'VARCHAR(191) NULL',
      student_nim: 'VARCHAR(64) NOT NULL',
      student_nama: 'VARCHAR(255) NULL',
      kelas: 'VARCHAR(100) NULL',
      prodi: 'VARCHAR(150) NULL',
      no_hp: 'VARCHAR(64) NULL',
      dospem1_nip: 'VARCHAR(64) NULL',
      dospem2_nip: 'VARCHAR(64) NULL',
      judul_ta: 'TEXT NULL',
      status_pembagian: "VARCHAR(50) NULL DEFAULT 'belum'",
      is_verified: 'TINYINT(1) NULL DEFAULT 0',
      created_at: 'DATETIME NULL',
      updated_at: 'DATETIME NULL',
    },
    indexes: ['INDEX idx_sa_d1 (dospem1_nip)', 'INDEX idx_sa_d2 (dospem2_nip)'],
  },
  thesis_titles: {
    primaryKey: 'id',
    columns: {
      id: 'VARCHAR(191) NOT NULL',
      profile_id: 'VARCHAR(191) NULL',
      mhs_nim: 'VARCHAR(64) NULL',
      mhs_nama: 'VARCHAR(255) NULL',
      mhs_kelas: 'VARCHAR(100) NULL',
      prodi: "VARCHAR(150) NULL DEFAULT 'D3 Manajemen Informatika'",
      angkatan: 'VARCHAR(32) NULL',
      judul: 'TEXT NULL',
      deskripsi: 'LONGTEXT NULL',
      abstrak: 'LONGTEXT NULL',
      status: "VARCHAR(50) NULL DEFAULT 'tinjauan'",
      skor_kemiripan_terakhir: 'INT NULL DEFAULT 0',
      pembimbing_1_nip: 'VARCHAR(64) NULL',
      pembimbing_1_nama: 'VARCHAR(255) NULL',
      pembimbing_2_nip: 'VARCHAR(64) NULL',
      pembimbing_2_nama: 'VARCHAR(255) NULL',
      dospem_confirmed: 'TINYINT(1) NULL DEFAULT 0',
      dospem_confirmed_at: 'DATETIME NULL',
      catatan_kaprodi: 'TEXT NULL',
      catatan_dospem: 'TEXT NULL',
      rekomendasi_dospem_status: 'VARCHAR(64) NULL',
      rekomendasi_oleh: 'VARCHAR(255) NULL',
      riwayat_revisi: 'JSON NULL',
      terakhir_diingatkan_prodi: 'DATETIME NULL',
      jumlah_diingatkan: 'INT NULL DEFAULT 0',
      riwayat_pengingat_prodi: 'JSON NULL',
      status_kelulusan: "VARCHAR(50) NULL DEFAULT 'aktif_proses'",
      status_sidang: "VARCHAR(50) NULL DEFAULT 'bimbingan'",
      nilai_sidang: 'VARCHAR(50) NULL',
      tanggal_lulus: 'DATE NULL',
      no_sk_lulus: 'VARCHAR(100) NULL',
      jadwal_sidang: 'JSON NULL',
      created_at: 'DATETIME NULL',
      updated_at: 'DATETIME NULL',
    },
    indexes: ['INDEX idx_tt_nim (mhs_nim)', 'INDEX idx_tt_status (status)', 'INDEX idx_tt_created (created_at)'],
  },
  thesis_consultations: {
    primaryKey: 'id',
    columns: {
      id: 'VARCHAR(191) NOT NULL',
      mhs_nim: 'VARCHAR(64) NULL',
      mhs_nama: 'VARCHAR(255) NULL',
      pembimbing: 'VARCHAR(50) NULL',
      dosen_nama: 'VARCHAR(255) NULL',
      dosen_nip: 'VARCHAR(64) NULL',
      metode: 'VARCHAR(50) NULL',
      tanggal: 'DATE NULL',
      waktu: 'VARCHAR(32) NULL',
      bab_topik: 'TEXT NULL',
      catatan_mahasiswa: 'LONGTEXT NULL',
      masukan_dosen: 'LONGTEXT NULL',
      file_revisi_url: 'TEXT NULL',
      status: "VARCHAR(50) NULL DEFAULT 'menunggu_tanggapan'",
      jenis_revisi: 'VARCHAR(50) NULL',
      reviewed_at: 'DATETIME NULL',
      created_at: 'DATETIME NULL',
      updated_at: 'DATETIME NULL',
    },
    indexes: ['INDEX idx_tc_nim (mhs_nim)', 'INDEX idx_tc_dosen_nip (dosen_nip)', 'INDEX idx_tc_tanggal (tanggal)', 'INDEX idx_tc_status (status)'],
  },
  thesis_repositories: {
    primaryKey: 'id',
    columns: {
      id: 'VARCHAR(191) NOT NULL',
      mhs_nim: 'VARCHAR(64) NULL',
      mhs_nama: 'VARCHAR(255) NULL',
      prodi: 'VARCHAR(150) NULL',
      angkatan: 'VARCHAR(32) NULL',
      judul: 'TEXT NULL',
      abstrak: 'LONGTEXT NULL',
      kata_kunci: 'JSON NULL',
      pembimbing_1: 'VARCHAR(255) NULL',
      pembimbing_2: 'VARCHAR(255) NULL',
      tahun: 'VARCHAR(16) NULL',
      file_url: 'LONGTEXT NULL',
      pdf_url: 'LONGTEXT NULL',
      file_name: 'VARCHAR(255) NULL',
      status: "VARCHAR(50) NULL DEFAULT 'menunggu'",
      catatan_kaprodi: 'TEXT NULL',
      created_at: 'DATETIME NULL',
      updated_at: 'DATETIME NULL',
    },
    indexes: ['INDEX idx_repo_nim (mhs_nim)', 'INDEX idx_repo_status (status)'],
  },
  bookings: {
    primaryKey: 'id',
    columns: {
      id: 'VARCHAR(191) NOT NULL',
      mhs_nim: 'VARCHAR(64) NULL',
      mhs_nama: 'VARCHAR(255) NULL',
      ruangan: 'VARCHAR(150) NULL',
      tanggal: 'DATE NULL',
      waktu_mulai: 'VARCHAR(32) NULL',
      waktu_selesai: 'VARCHAR(32) NULL',
      tahap: 'VARCHAR(100) NULL',
      keperluan: 'TEXT NULL',
      status: "VARCHAR(50) NULL DEFAULT 'menunggu'",
      catatan_admin: 'TEXT NULL',
      created_at: 'DATETIME NULL',
      updated_at: 'DATETIME NULL',
    },
    indexes: ['INDEX idx_bookings_nim (mhs_nim)', 'INDEX idx_bookings_tanggal (tanggal)'],
  },
  admin_cms: {
    primaryKey: 'id',
    columns: {
      id: 'VARCHAR(191) NOT NULL',
      judul: 'TEXT NULL',
      kategori: "VARCHAR(100) NULL DEFAULT 'Informasi'",
      isi: 'LONGTEXT NULL',
      status: "VARCHAR(50) NULL DEFAULT 'draf'",
      penulis: "VARCHAR(150) NULL DEFAULT 'Admin SIMTA'",
      created_at: 'DATETIME NULL',
      updated_at: 'DATETIME NULL',
    },
    indexes: ['INDEX idx_cms_kategori (kategori)'],
  },
  admin_documents: {
    primaryKey: 'id',
    columns: {
      id: 'VARCHAR(191) NOT NULL',
      nama: 'VARCHAR(255) NULL',
      jenis: "VARCHAR(100) NULL DEFAULT 'Dokumen'",
      deskripsi: 'TEXT NULL',
      file_name: 'VARCHAR(255) NULL',
      file_url: 'LONGTEXT NULL',
      tanggal_upload: 'DATE NULL',
      status: "VARCHAR(50) NULL DEFAULT 'aktif'",
      uploader: "VARCHAR(150) NULL DEFAULT 'Admin SIMTA'",
      created_at: 'DATETIME NULL',
      updated_at: 'DATETIME NULL',
    },
    indexes: [],
  },
  admin_templates: {
    primaryKey: 'id',
    columns: {
      id: 'VARCHAR(191) NOT NULL',
      nama: 'VARCHAR(255) NULL',
      jenis: "VARCHAR(100) NULL DEFAULT 'Dokumen'",
      deskripsi: 'TEXT NULL',
      file_name: 'VARCHAR(255) NULL',
      file_url: 'LONGTEXT NULL',
      ukuran: 'VARCHAR(64) NULL',
      status: "VARCHAR(50) NULL DEFAULT 'aktif'",
      created_at: 'DATETIME NULL',
      updated_at: 'DATETIME NULL',
    },
    indexes: [],
  },
  student_credentials: {
    primaryKey: 'nim',
    columns: {
      nim: 'VARCHAR(64) NOT NULL',
      password_hash: 'VARCHAR(255) NULL',
      is_profile_completed: 'TINYINT(1) NULL DEFAULT 0',
      has_password: 'TINYINT(1) NULL DEFAULT 0',
      nama: 'VARCHAR(255) NULL',
      no_hp: 'VARCHAR(64) NULL',
      kelas: 'VARCHAR(100) NULL',
      prodi: 'VARCHAR(150) NULL',
      created_at: 'DATETIME NULL',
      updated_at: 'DATETIME NULL',
    },
    indexes: [],
  },
};

const DATETIME_COLS = new Set([
  'created_at',
  'updated_at',
  'reviewed_at',
  'dospem_confirmed_at',
  'terakhir_diingatkan_prodi',
]);
const DATE_COLS = new Set(['tanggal', 'tanggal_upload', 'tanggal_lulus']);
const BOOLEAN_COLS = new Set(['is_profile_completed', 'requires_password_change', 'dospem_confirmed', 'is_verified', 'has_password']);
const JSON_COLS = new Set(['riwayat_revisi', 'riwayat_pengingat_prodi', 'jadwal_sidang', 'kata_kunci']);

async function fetchAllRows(tableName) {
  const pageSize = 1000;
  const rows = [];
  let offset = 0;

  while (true) {
    const { data, error, status } = await supabase
      .from(tableName)
      .select('*')
      .range(offset, offset + pageSize - 1);

    if (error) {
      return { table: tableName, ok: false, status, error: error.message, code: error.code, rows: [] };
    }

    const batch = Array.isArray(data) ? data : [];
    rows.push(...batch);
    if (batch.length < pageSize) break;
    offset += pageSize;
  }

  return { table: tableName, ok: true, status: 200, error: null, code: null, rows };
}

function escapeMysqlString(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/\u0000/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z')
    .replace(/'/g, "\\'");
}

function toMysqlDatetime(val) {
  if (!val) return null;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val).slice(0, 19).replace('T', ' ');
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function toMysqlDate(val) {
  if (!val) return null;
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function formatMysqlValue(col, val) {
  if (val === null || val === undefined) return 'NULL';

  if (BOOLEAN_COLS.has(col) || typeof val === 'boolean') {
    return val ? '1' : '0';
  }

  if (DATETIME_COLS.has(col)) {
    const dt = toMysqlDatetime(val);
    return dt ? `'${escapeMysqlString(dt)}'` : 'NULL';
  }

  if (DATE_COLS.has(col)) {
    const dt = toMysqlDate(val);
    return dt ? `'${escapeMysqlString(dt)}'` : 'NULL';
  }

  if (JSON_COLS.has(col) || (typeof val === 'object' && val !== null)) {
    return `'${escapeMysqlString(JSON.stringify(val))}'`;
  }

  if (typeof val === 'number') {
    return Number.isFinite(val) ? String(val) : 'NULL';
  }

  return `'${escapeMysqlString(val)}'`;
}

function buildMysqlTableDdl(tableName, rows) {
  const base = MYSQL_SCHEMAS[tableName] || { primaryKey: 'id', columns: {}, indexes: [] };
  const cols = { ...base.columns };

  for (const row of rows) {
    for (const [k, v] of Object.entries(row || {})) {
      if (!cols[k]) {
        if (typeof v === 'boolean') cols[k] = 'TINYINT(1) NULL';
        else if (typeof v === 'number') cols[k] = Number.isInteger(v) ? 'INT NULL' : 'DOUBLE NULL';
        else if (typeof v === 'object' && v !== null) cols[k] = 'JSON NULL';
        else cols[k] = 'LONGTEXT NULL';
      }
    }
  }

  if (Object.keys(cols).length === 0) return '';

  const pk = cols[base.primaryKey] ? base.primaryKey : Object.keys(cols)[0];
  const lines = Object.entries(cols).map(([colName, colDef]) => `  \`${colName}\` ${colDef}`);
  lines.push(`  PRIMARY KEY (\`${pk}\`)`);
  for (const idx of base.indexes || []) {
    lines.push(`  ${idx}`);
  }

  return `CREATE TABLE IF NOT EXISTS \`${tableName}\` (\n${lines.join(',\n')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n`;
}

function buildMysqlInserts(tableName, rows) {
  if (!rows || rows.length === 0) return `-- (${tableName}: 0 baris)\n`;

  const knownCols = Object.keys(MYSQL_SCHEMAS[tableName]?.columns || {});
  const dynamicCols = new Set(knownCols);
  for (const row of rows) {
    for (const k of Object.keys(row || {})) {
      dynamicCols.add(k);
    }
  }
  const cols = Array.from(dynamicCols);
  const colListSql = cols.map((c) => `\`${c}\``).join(', ');
  const statements = [];

  for (const row of rows) {
    const valsSql = cols.map((c) => formatMysqlValue(c, row?.[c])).join(', ');
    statements.push(`INSERT IGNORE INTO \`${tableName}\` (${colListSql}) VALUES (${valsSql});`);
  }

  return `${statements.join('\n')}\n`;
}

async function listStorageFilesRecursively(bucketName, prefix = '') {
  const collected = [];
  const { data, error } = await supabase.storage.from(bucketName).list(prefix, {
    limit: 1000,
    sortBy: { column: 'name', order: 'asc' },
  });

  if (error) {
    return { ok: false, error: error.message, files: [] };
  }

  for (const item of data || []) {
    if (!item || !item.name || item.name === '.emptyFolderPlaceholder') continue;
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null) {
      const nested = await listStorageFilesRecursively(bucketName, fullPath);
      if (nested.ok) collected.push(...nested.files);
    } else {
      collected.push({ path: fullPath, metadata: item.metadata || null, updated_at: item.updated_at || null });
    }
  }

  return { ok: true, error: null, files: collected };
}

function isStaffAccountCredential(row, advisorNips, staffNips, studentNims) {
  const id = String(row?.id || '').trim();
  const ident = String(row?.judul || id.replace(/^auth-cred-/, '')).trim();
  if (!ident) return false;
  if (ident.toLowerCase() === 'admin') return true;
  if (advisorNips.has(ident) || staffNips.has(ident)) return true;
  if (studentNims.has(ident)) return false;
  return /^\d{18}$/.test(ident);
}

function buildCleanLaunchSnapshot(fullSnapshot) {
  const tables = fullSnapshot.tables || {};
  const advisors = Array.isArray(tables.advisors) ? tables.advisors : [];
  const rawProfiles = Array.isArray(tables.profiles) ? tables.profiles : [];
  const rawStudentAdvisors = Array.isArray(tables.student_advisors) ? tables.student_advisors : [];
  const rawAdminCms = Array.isArray(tables.admin_cms) ? tables.admin_cms : [];

  const advisorNips = new Set(advisors.map((a) => String(a?.nip || '').trim()).filter(Boolean));
  const staffProfiles = rawProfiles.filter((p) => String(p?.role || '').toLowerCase() !== 'mahasiswa');
  const staffNips = new Set(
    staffProfiles
      .flatMap((p) => [p?.nip, p?.nim])
      .map((v) => String(v || '').trim())
      .filter(Boolean)
  );
  const studentNims = new Set(
    rawStudentAdvisors.map((sa) => String(sa?.student_nim || '').trim()).filter(Boolean)
  );

  const cleanStudentAdvisors = rawStudentAdvisors.map((sa) => ({
    ...sa,
    judul_ta: null,
    ...(Object.prototype.hasOwnProperty.call(sa || {}, 'is_verified') ? { is_verified: false } : {}),
  }));

  const cleanAdminCms = rawAdminCms.filter((row) => {
    const id = String(row?.id || '').trim();
    const kat = String(row?.kategori || '').trim();
    if (kat === 'student_profile_meta' || id.startsWith('student-profile-')) return false;
    if (kat === 'notification_read_ids' || id.startsWith('simta_read_notif_ids_') || id.startsWith('notif-read-')) return false;
    if (kat === 'system_activity_logs' || id === 'system-activity-logs') return false;
    if (kat === 'account_credential' || id.startsWith('auth-cred-')) {
      return isStaffAccountCredential(row, advisorNips, staffNips, studentNims);
    }
    return true;
  });

  const cleanTables = {
    profiles: staffProfiles,
    advisors,
    student_advisors: cleanStudentAdvisors,
    thesis_titles: [],
    thesis_consultations: [],
    thesis_repositories: [],
    bookings: [],
    admin_cms: cleanAdminCms,
    admin_documents: Array.isArray(tables.admin_documents) ? tables.admin_documents : [],
    admin_templates: Array.isArray(tables.admin_templates) ? tables.admin_templates : [],
    departments: Array.isArray(tables.departments) ? tables.departments : [],
    thesis_stages: Array.isArray(tables.thesis_stages) ? tables.thesis_stages : [],
    student_credentials: [],
  };

  return {
    exportedAt: fullSnapshot.exportedAt,
    cleanLaunchAt: new Date().toISOString(),
    supabaseUrl: fullSnapshot.supabaseUrl,
    mode: 'clean_launch',
    preservedSummary: {
      staffProfiles: staffProfiles.length,
      advisors: advisors.length,
      studentAdvisors: cleanStudentAdvisors.length,
      adminCmsStaffAndSettings: cleanAdminCms.length,
    },
    tables: cleanTables,
    studentCredentialsRpcStatus: [],
  };
}

function writeMysqlDumpFile({
  filePath,
  bannerTitle,
  supabaseUrl,
  exportedAt,
  tables,
  tableStatus = {},
  rpcCredentials = [],
  clearTablesBeforeInsert = false,
}) {
  const sqlParts = [
    '-- ============================================================',
    `-- ${bannerTitle}`,
    `-- Sumber: ${supabaseUrl}`,
    `-- Waktu Ekspor: ${exportedAt}`,
    '-- ============================================================',
    'SET NAMES utf8mb4;',
    'SET FOREIGN_KEY_CHECKS = 0;',
    '',
  ];

  for (const [tableName, rows] of Object.entries(tables)) {
    const ddl = buildMysqlTableDdl(tableName, rows);
    if (!ddl) continue;
    sqlParts.push(`-- Tabel: ${tableName} (${rows.length} baris)`);
    sqlParts.push(ddl);
    if (clearTablesBeforeInsert) {
      sqlParts.push(`DELETE FROM \`${tableName}\`;`);
    }
    sqlParts.push(buildMysqlInserts(tableName, rows));
  }

  if (
    (!tableStatus.student_credentials?.ok || (tables.student_credentials || []).length === 0) &&
    rpcCredentials.length > 0 &&
    !Object.prototype.hasOwnProperty.call(tables, 'student_credentials')
  ) {
    sqlParts.push('-- Tabel: student_credentials (metadata dari RPC; password_hash butuh service_role key)');
    sqlParts.push(buildMysqlTableDdl('student_credentials', rpcCredentials));
    if (clearTablesBeforeInsert) {
      sqlParts.push('DELETE FROM `student_credentials`;');
    }
    sqlParts.push(buildMysqlInserts('student_credentials', rpcCredentials));
  }

  sqlParts.push('SET FOREIGN_KEY_CHECKS = 1;', '');
  fs.writeFileSync(filePath, sqlParts.join('\n'), 'utf8');
}

async function main() {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
  fs.mkdirSync(STORAGE_EXPORT_DIR, { recursive: true });

  const snapshotPath = path.join(EXPORT_DIR, 'supabase-snapshot.json');
  const mysqlSqlPath = path.join(EXPORT_DIR, 'supabase-data-mysql.sql');
  const cleanSnapshotPath = path.join(EXPORT_DIR, 'supabase-clean-launch-snapshot.json');
  const cleanMysqlSqlPath = path.join(EXPORT_DIR, 'supabase-clean-launch-mysql.sql');
  const summaryPath = path.join(EXPORT_DIR, 'export-summary.txt');

  if (FROM_SNAPSHOT_ONLY) {
    if (!fs.existsSync(snapshotPath)) {
      console.error(`ERROR: File snapshot tidak ditemukan di ${snapshotPath}`);
      process.exit(1);
    }
    const existingSnapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
    const cleanSnapshot = buildCleanLaunchSnapshot(existingSnapshot);
    fs.writeFileSync(cleanSnapshotPath, JSON.stringify(cleanSnapshot, null, 2), 'utf8');

    writeMysqlDumpFile({
      filePath: mysqlSqlPath,
      bannerTitle: 'SIMONITA FASILKOM - Export Supabase ke MySQL / MariaDB (Full Snapshot)',
      supabaseUrl: existingSnapshot.supabaseUrl || SUPABASE_URL,
      exportedAt: existingSnapshot.exportedAt || new Date().toISOString(),
      tables: existingSnapshot.tables || {},
      tableStatus: existingSnapshot.tableStatus || {},
      rpcCredentials: existingSnapshot.studentCredentialsRpcStatus || [],
      clearTablesBeforeInsert: false,
    });

    writeMysqlDumpFile({
      filePath: cleanMysqlSqlPath,
      bannerTitle: 'SIMONITA FASILKOM - Paket Clean Launch MySQL / MariaDB (Reset Data Uji Mahasiswa)',
      supabaseUrl: existingSnapshot.supabaseUrl || SUPABASE_URL,
      exportedAt: existingSnapshot.exportedAt || new Date().toISOString(),
      tables: cleanSnapshot.tables,
      clearTablesBeforeInsert: true,
    });

    console.log('Regenerasi SQL & Clean Launch selesai dari snapshot lokal:');
    console.log(`  - ${cleanSnapshotPath}`);
    console.log(`  - ${cleanMysqlSqlPath}`);
    console.log(`  - Preserved: ${JSON.stringify(cleanSnapshot.preservedSummary)}`);
    return;
  }

  console.log('=== Ekspor Supabase SIMONITA FASILKOM ===');
  console.log(`URL: ${SUPABASE_URL}`);
  console.log(`Mode Kunci: ${SUPABASE_SERVICE_KEY ? 'SERVICE_ROLE' : 'ANON / PUBLISHABLE'}\n`);

  const exportedAt = new Date().toISOString();
  const tableResults = {};
  const tableStatus = {};

  for (const table of TABLES_TO_EXPORT) {
    const res = await fetchAllRows(table);
    tableStatus[table] = {
      ok: res.ok,
      rowCount: res.rows.length,
      error: res.error,
      code: res.code,
      columns: res.rows.length > 0 ? Object.keys(res.rows[0]) : [],
    };
    if (res.ok) {
      tableResults[table] = res.rows;
      console.log(`[OK]   ${table.padEnd(22)} -> ${res.rows.length} baris`);
    } else {
      console.log(`[SKIP] ${table.padEnd(22)} -> ${res.error || 'tidak dapat diakses'}`);
    }
  }

  // Kumpulkan semua NIM mahasiswa yang dikenal lalu cek status kredensial via RPC
  const candidateNims = new Set();
  for (const p of tableResults.profiles || []) {
    if (p?.nim && (p?.role === 'mahasiswa' || !p?.role)) candidateNims.add(String(p.nim).trim());
  }
  for (const sa of tableResults.student_advisors || []) {
    if (sa?.student_nim) candidateNims.add(String(sa.student_nim).trim());
  }
  for (const tt of tableResults.thesis_titles || []) {
    if (tt?.mhs_nim) candidateNims.add(String(tt.mhs_nim).trim());
  }

  const rpcCredentials = [];
  if (!tableStatus.student_credentials?.ok || (tableResults.student_credentials || []).length === 0) {
    console.log(`\nMengecek status kredensial ${candidateNims.size} NIM via RPC get_student_credential...`);
    const nims = Array.from(candidateNims).sort();
    for (let i = 0; i < nims.length; i += 10) {
      const batch = nims.slice(i, i + 10);
      const batchResults = await Promise.all(
        batch.map(async (nim) => {
          try {
            const { data, error } = await supabase.rpc('get_student_credential', { p_nim: nim });
            if (error || !data) return null;
            const row = Array.isArray(data) ? data[0] : data;
            if (!row) return null;
            return { nim, ...row };
          } catch {
            return null;
          }
        })
      );
      for (const item of batchResults) {
        if (item) rpcCredentials.push(item);
      }
    }
    console.log(`[RPC]  student_credentials (metadata non-hash) -> ${rpcCredentials.length} NIM terverifikasi`);
  }

  // Breakdown isi admin_cms
  const adminCms = tableResults.admin_cms || [];
  const cmsBreakdown = {
    student_profile_meta: 0,
    user_profile_meta: 0,
    account_credential: 0,
    notification_read_ids: 0,
    system_activity_logs: 0,
    system_settings: 0,
    cms_articles: 0,
  };
  for (const row of adminCms) {
    const id = String(row?.id || '');
    const kat = String(row?.kategori || '');
    if (kat === 'student_profile_meta' || id.startsWith('student-profile-')) cmsBreakdown.student_profile_meta += 1;
    else if (kat === 'user_profile_meta' || id.startsWith('user-profile-')) cmsBreakdown.user_profile_meta += 1;
    else if (kat === 'account_credential' || id.startsWith('auth-cred-')) cmsBreakdown.account_credential += 1;
    else if (kat === 'notification_read_ids' || id.startsWith('simta_read_notif_ids_') || id.startsWith('notif-read-')) cmsBreakdown.notification_read_ids += 1;
    else if (kat === 'system_activity_logs' || id === 'system-activity-logs') cmsBreakdown.system_activity_logs += 1;
    else if (kat === 'system_settings_min_bimbingan' || id === 'settings_min_bimbingan') cmsBreakdown.system_settings += 1;
    else cmsBreakdown.cms_articles += 1;
  }

  // Storage bucket: repository-docs
  const storageReport = { bucket: 'repository-docs', ok: false, files: [], downloaded: [], errors: [] };
  const listRes = await listStorageFilesRecursively('repository-docs');
  if (listRes.ok) {
    storageReport.ok = true;
    storageReport.files = listRes.files;
    console.log(`\n[STORAGE] repository-docs -> ${listRes.files.length} file ditemukan`);
    for (const fileObj of listRes.files) {
      const { data: blob, error: dlErr } = await supabase.storage.from('repository-docs').download(fileObj.path);
      if (dlErr || !blob) {
        storageReport.errors.push({ path: fileObj.path, error: dlErr?.message || 'Download gagal' });
        console.log(`  [FAIL] ${fileObj.path}: ${dlErr?.message}`);
      } else {
        const destPath = path.join(STORAGE_EXPORT_DIR, ...fileObj.path.split('/'));
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        const arrayBuf = await blob.arrayBuffer();
        fs.writeFileSync(destPath, Buffer.from(arrayBuf));
        storageReport.downloaded.push({ path: fileObj.path, bytes: arrayBuf.byteLength, localPath: destPath });
        console.log(`  [SAVE] ${fileObj.path} (${arrayBuf.byteLength} bytes)`);
      }
    }
  } else {
    storageReport.errors.push({ path: '', error: listRes.error });
    console.log(`\n[STORAGE] repository-docs -> ${listRes.error}`);
  }

  // 1. Tulis snapshot JSON lengkap
  const snapshot = {
    exportedAt,
    supabaseUrl: SUPABASE_URL,
    keyMode: SUPABASE_SERVICE_KEY ? 'service_role' : 'anon',
    tableStatus,
    cmsBreakdown,
    tables: tableResults,
    studentCredentialsRpcStatus: rpcCredentials,
    storage: storageReport,
  };
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf8');

  // 2. Tulis dump MySQL lengkap + dump Clean Launch siap import
  writeMysqlDumpFile({
    filePath: mysqlSqlPath,
    bannerTitle: 'SIMONITA FASILKOM - Export Supabase ke MySQL / MariaDB (Full Snapshot)',
    supabaseUrl: SUPABASE_URL,
    exportedAt,
    tables: tableResults,
    tableStatus,
    rpcCredentials,
    clearTablesBeforeInsert: false,
  });

  const cleanSnapshot = buildCleanLaunchSnapshot(snapshot);
  fs.writeFileSync(cleanSnapshotPath, JSON.stringify(cleanSnapshot, null, 2), 'utf8');

  writeMysqlDumpFile({
    filePath: cleanMysqlSqlPath,
    bannerTitle: 'SIMONITA FASILKOM - Paket Clean Launch MySQL / MariaDB (Reset Data Uji Mahasiswa)',
    supabaseUrl: SUPABASE_URL,
    exportedAt,
    tables: cleanSnapshot.tables,
    clearTablesBeforeInsert: true,
  });

  // 3. Tulis ringkasan audit ekspor
  const summaryLines = [
    'RINGKASAN EKSPOR SUPABASE -> MYSQL',
    `Waktu Ekspor : ${exportedAt}`,
    `Sumber       : ${SUPABASE_URL}`,
    `Mode Kunci   : ${SUPABASE_SERVICE_KEY ? 'service_role' : 'anon/publishable'}`,
    '',
    '1. TABEL DATABASE:',
    ...Object.entries(tableStatus).map(([name, info]) =>
      info.ok
        ? `   - ${name}: ${info.rowCount} baris (kolom: ${info.columns.join(', ') || '-'})`
        : `   - ${name}: TIDAK TERAKSES (${info.error})`
    ),
    '',
    '2. RINCIAN ISI admin_cms:',
    ...Object.entries(cmsBreakdown).map(([k, v]) => `   - ${k}: ${v} baris`),
    '',
    '3. METADATA KREDENSIAL MAHASISWA (RPC get_student_credential):',
    `   - Total NIM tercek: ${candidateNims.size}, terdaftar di student_credentials: ${rpcCredentials.length}`,
    `   - Sudah ubah password (has_password=true): ${rpcCredentials.filter((r) => r.has_password).length}`,
    `   - Profil selesai (is_profile_completed=true): ${rpcCredentials.filter((r) => r.is_profile_completed).length}`,
    '',
    '4. PAKET CLEAN LAUNCH (RESET DATA UJI MAHASISWA):',
    `   - Staff / Kaprodi profiles : ${cleanSnapshot.preservedSummary.staffProfiles} baris`,
    `   - Master advisors          : ${cleanSnapshot.preservedSummary.advisors} baris`,
    `   - Mapping student_advisors : ${cleanSnapshot.preservedSummary.studentAdvisors} baris (judul_ta=NULL)`,
    `   - CMS Staff & Settings     : ${cleanSnapshot.preservedSummary.adminCmsStaffAndSettings} baris`,
    '   - Dikosongkan ke default   : student_credentials, profiles(mahasiswa), thesis_titles, thesis_consultations, log/notif uji',
    '',
    '5. STORAGE BUCKET (repository-docs):',
    `   - Status list: ${storageReport.ok ? 'OK' : 'ERROR'}`,
    `   - Total file terunduh: ${storageReport.downloaded.length}`,
    ...storageReport.downloaded.map((f) => `     * ${f.path} (${f.bytes} bytes)`),
    ...(storageReport.errors.length > 0 ? ['   - Error storage:', ...storageReport.errors.map((e) => `     * ${e.path || '-'}: ${e.error}`)] : []),
    '',
    '6. FILE HASIL EKSPOR (GITIGNORED):',
    `   - JSON Lengkap       : ${snapshotPath}`,
    `   - SQL MySQL Lengkap  : ${mysqlSqlPath}`,
    `   - JSON Clean Launch  : ${cleanSnapshotPath}`,
    `   - SQL Clean Launch   : ${cleanMysqlSqlPath}`,
    `   - File Storage       : ${STORAGE_EXPORT_DIR}`,
  ];
  fs.writeFileSync(summaryPath, summaryLines.join('\n'), 'utf8');

  console.log(`\nSelesai! Hasil tersimpan di:\n  - ${summaryPath}\n  - ${snapshotPath}\n  - ${mysqlSqlPath}\n  - ${cleanSnapshotPath}\n  - ${cleanMysqlSqlPath}`);
}

main().catch((err) => {
  console.error('Export gagal:', err);
  process.exit(1);
});
