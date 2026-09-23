import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const url = 'https://jdubhdapcvjxzmngqyty.supabase.co';
const key = 'sb_publishable_ZJ0moT-bPUy1slWmSngWVA_KPhyMNMg';
const supabase = createClient(url, key);

const realDosenList = [
  {
    id: crypto.randomUUID(),
    nip: '198410012009121005',
    nama: 'Dr. Abdiansah, S.Kom., M.Cs.',
    email: 'abdiansah@unsri.ac.id',
    no_hp: '081278901001',
    prodi: 'D3 Manajemen Informatika',
    jabatan_fungsional: 'Lektor Kepala',
    keahlian: ['Kecerdasan Buatan', 'Pemrosesan Bahasa Alami'],
    kuota_dospem1: 8,
    kuota_dospem2: 8,
    status: 'aktif'
  },
  {
    id: crypto.randomUUID(),
    nip: '198810052023212046',
    nama: 'Anna Dwi Marjusalinah, S.Kom., M.Kom.',
    email: 'annadwimarjusalinah@unsri.ac.id',
    no_hp: '081278901002',
    prodi: 'D3 Manajemen Informatika',
    jabatan_fungsional: 'Asisten Ahli',
    keahlian: ['Rekayasa Perangkat Lunak', 'Sistem Informasi'],
    kuota_dospem1: 8,
    kuota_dospem2: 8,
    status: 'aktif'
  },
  {
    id: crypto.randomUUID(),
    nip: '198803052019031010',
    nama: 'Bayu Wijaya Putra, S.Kom., M.Kom.',
    email: 'bayuwisata@gmail.com',
    no_hp: '081278901003',
    prodi: 'D3 Manajemen Informatika',
    jabatan_fungsional: 'Lektor',
    keahlian: ['Sistem Informasi', 'Manajemen Basis Data'],
    kuota_dospem1: 8,
    kuota_dospem2: 8,
    status: 'aktif'
  },
  {
    id: crypto.randomUUID(),
    nip: '199012222024062001',
    nama: 'Dewi Sartika, S.Kom., M.Kom.',
    email: 'dewisartika@unsri.ac.id',
    no_hp: '081278901004',
    prodi: 'D3 Manajemen Informatika',
    jabatan_fungsional: 'Lektor',
    keahlian: ['Sistem Informasi', 'Pemrograman Web'],
    kuota_dospem1: 8,
    kuota_dospem2: 8,
    status: 'aktif'
  },
  {
    id: crypto.randomUUID(),
    nip: '198910142023211013',
    nama: 'Hasnan Afif, S.Kom., M.Kom.',
    email: 'hasnanafif@unsri.ac.id',
    no_hp: '081278901005',
    prodi: 'D3 Manajemen Informatika',
    jabatan_fungsional: 'Asisten Ahli',
    keahlian: ['Jaringan Komputer', 'Keamanan Siber'],
    kuota_dospem1: 8,
    kuota_dospem2: 8,
    status: 'aktif'
  },
  {
    id: crypto.randomUUID(),
    nip: '198303182023212034',
    nama: 'Iin Seprina, M.Kom.',
    email: 'iinseprina@unsri.ac.id',
    no_hp: '081278901006',
    prodi: 'D3 Manajemen Informatika',
    jabatan_fungsional: 'Lektor',
    keahlian: ['Sistem Informasi', 'Desain Interaksi UI/UX'],
    kuota_dospem1: 8,
    kuota_dospem2: 8,
    status: 'aktif'
  },
  {
    id: crypto.randomUUID(),
    nip: '198906262024212001',
    nama: 'Junia Kurniati, S.Kom., M.Kom.',
    email: 'niyaamnz@gmail.com',
    no_hp: '081278901007',
    prodi: 'D3 Manajemen Informatika',
    jabatan_fungsional: 'Asisten Ahli',
    keahlian: ['Rekayasa Perangkat Lunak', 'Sistem Informasi'],
    kuota_dospem1: 8,
    kuota_dospem2: 8,
    status: 'aktif'
  },
  {
    id: crypto.randomUUID(),
    nip: '198712032022031006',
    nama: 'M. Qurhanul Rizkie, Ph.D',
    email: 'qurhanul.rizqie@ilkom.unsri.ac.id',
    no_hp: '081278901008',
    prodi: 'D3 Manajemen Informatika',
    jabatan_fungsional: 'Lektor',
    keahlian: ['Data Science', 'Machine Learning'],
    kuota_dospem1: 8,
    kuota_dospem2: 8,
    status: 'aktif'
  },
  {
    id: crypto.randomUUID(),
    nip: '199206092019032025',
    nama: 'Purwita Sari, S.Si., M.Kom.',
    email: 'witasari92@gmail.com',
    no_hp: '081278901009',
    prodi: 'D3 Manajemen Informatika',
    jabatan_fungsional: 'Lektor',
    keahlian: ['Sains Data', 'Analisis Sistem Informasi'],
    kuota_dospem1: 8,
    kuota_dospem2: 8,
    status: 'aktif'
  },
  {
    id: crypto.randomUUID(),
    nip: '198201022024211001',
    nama: 'Rusdi Efendi, S.Pd., M.Kom.',
    email: 'rusdie@unsri.ac.id',
    no_hp: '081278901010',
    prodi: 'D3 Manajemen Informatika',
    jabatan_fungsional: 'Lektor',
    keahlian: ['Sistem Informasi', 'Teknologi Pembelajaran'],
    kuota_dospem1: 8,
    kuota_dospem2: 8,
    status: 'aktif'
  },
  {
    id: crypto.randomUUID(),
    nip: '198710092024211001',
    nama: 'Willy, S.Kom., M.Kom.',
    email: 'willy@unsri.ac.id',
    no_hp: '081278901011',
    prodi: 'D3 Manajemen Informatika',
    jabatan_fungsional: 'Asisten Ahli',
    keahlian: ['Pemrograman Aplikasi Mobile', 'Rekayasa Perangkat Lunak'],
    kuota_dospem1: 8,
    kuota_dospem2: 8,
    status: 'aktif'
  },
  {
    id: crypto.randomUUID(),
    nip: '199306042024062006',
    nama: 'Yesinta Florensia, S.Kom., M.Kom.',
    email: 'yesintaflorensia@unsri.ac.id',
    no_hp: '081278901012',
    prodi: 'D3 Manajemen Informatika',
    jabatan_fungsional: 'Asisten Ahli',
    keahlian: ['E-Business', 'Sistem Informasi Bisnis'],
    kuota_dospem1: 8,
    kuota_dospem2: 8,
    status: 'aktif'
  }
];

async function updateJabatanFungsional() {
  console.log('1. Clearing old rows in advisors table...');
  await supabase.from('advisors').delete().neq('nip', '0');

  console.log('2. Trying insert with jabatan_fungsional...');
  let { data, error } = await supabase.from('advisors').insert(realDosenList).select();
  if (error && error.message.includes('jabatan_fungsional')) {
    console.log('jabatan_fungsional column missing in Supabase DB schema. Omitting column for Supabase table insert...');
    const fallbackList = realDosenList.map(({ jabatan_fungsional, ...rest }) => rest);
    const result = await supabase.from('advisors').insert(fallbackList).select();
    if (result.error) {
      console.error('FALLBACK ERROR:', result.error.message);
    } else {
      console.log('SUCCESS! Seeded 12 real Dosen into Supabase advisors table:', result.data.length);
    }
  } else if (error) {
    console.error('INSERT ERROR:', error.message);
  } else {
    console.log('SUCCESS! Seeded 12 real Dosen into Supabase with jabatan_fungsional:', data.length);
  }
}

updateJabatanFungsional();
