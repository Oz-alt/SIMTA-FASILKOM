# SIMTA FASILKOM (Laravel 11 + React Inertia)

Proyek ini menggunakan arsitektur **Laravel 11** sebagai Backend dan **React (Inertia.js)** sebagai Frontend. Mengingat database menggunakan **Supabase**, kita tidak memerlukan instalasi MySQL lokal.

## 🚀 Cara Setup Project di Laptop Baru / Anggota Tim Lain

Jika anggota tim lain baru saja melakukan `git clone` atau `git pull` project ini ke laptop mereka, ikuti langkah-langkah wajib berikut secara berurutan:

### 1. Persiapan (Install jika belum ada)
Pastikan laptop sudah terinstall:
- **PHP** (minimal versi 8.2)
- **Composer** (Package manager untuk PHP)
- **Node.js & NPM** (Package manager untuk React/JS)

### 2. Install Dependency (Wajib)
Buka terminal di dalam folder project ini, lalu jalankan dua perintah berikut:

```bash
# 1. Install semua package PHP/Laravel
composer install

# 2. Install semua package JavaScript/React (WAJIB!)
npm install
```

### 3. Konfigurasi Environment (.env)
Project hasil clone TIDAK akan membawa file `.env` (karena alasan keamanan). Kalian harus membuatnya secara manual:
1. Copy file `.env.example` dan ubah namanya menjadi `.env`.
   *(Atau jalankan perintah ini di terminal: `cp .env.example .env`)*
2. Buka file `.env` tersebut.
3. Tambahkan kunci rahasia **Supabase** milik tim kalian di bagian paling bawah:
   ```env
   VITE_SUPABASE_URL="isi_dengan_url_supabase_kalian"
   VITE_SUPABASE_ANON_KEY="isi_dengan_anon_key_supabase_kalian"
   ```

### 4. Generate App Key Laravel
Jalankan perintah ini untuk membuat kunci enkripsi aplikasi:
```bash
php artisan key:generate
```

### 5. Jalankan Aplikasi
Karena ini memadukan backend dan frontend, kalian harus membuka **DUA TERMINAL** yang berbeda.

**Terminal 1 (Menjalankan server PHP Laravel):**
```bash
php artisan serve
```

**Terminal 2 (Menjalankan server Vite React):**
```bash
npm run dev
```

Aplikasi siap diakses di: `http://localhost:8000`
