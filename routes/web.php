<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ============================================================
// PUBLIC & AUTH ROUTES
// ============================================================

Route::get('/', function () {
    return Inertia::render('BerandaPage', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/documents', function () {
    return Inertia::render('DokumenPage');
});

Route::get('/profile', function () {
    return Inertia::render('ProfilePage');
});

// ============================================================
// MAHASISWA ROUTES
// ============================================================

Route::get('/dashboard', function () {
    return Inertia::render('mahasiswa/DashboardMahasiswa');
})->name('dashboard');

Route::get('/thesis/submit', function () {
    return Inertia::render('mahasiswa/AjukanJudulPage');
});

Route::get('/thesis/status', function () {
    return Inertia::render('mahasiswa/StatusJudulPage');
});

Route::get('/thesis/consultations', function () {
    return Inertia::render('mahasiswa/BimbinganTAPage');
});

Route::get('/thesis/consultations/card', function () {
    return Inertia::render('mahasiswa/KartuBimbinganPage');
});

Route::get('/thesis/archive', function () {
    return Inertia::render('ArsipTAPage');
});

Route::get('/thesis/repository/upload', function () {
    return Inertia::render('UploadRepositoryPage');
});

Route::get('/schedule', function () {
    return Inertia::render('mahasiswa/JadwalRuangPage');
});

Route::get('/booking/apply/{stage}', function ($stage) {
    return Inertia::render('mahasiswa/AjukanRuangPage', [
        'stage' => $stage,
    ]);
});

Route::get('/booking/status', function () {
    return Inertia::render('mahasiswa/StatusPeminjamanPage');
});

// ============================================================
// KAPRODI ROUTES
// ============================================================

Route::get('/kaprodi/dashboard', function () {
    return Inertia::render('kaprodi/DashboardKaprodi');
});

Route::get('/kaprodi/titles', function () {
    return Inertia::render('kaprodi/TinjauJudulPage');
});

Route::get('/kaprodi/advisors', function () {
    return Inertia::render('kaprodi/KelolaDospemPage');
});

Route::get('/kaprodi/defense-schedules', function () {
    return Inertia::render('kaprodi/KelolaJadwalSidangPage');
});

Route::get('/kaprodi/repository/review', function () {
    return Inertia::render('kaprodi/TinjauRepositoryKaprodi');
});

Route::get('/kaprodi/import', function () {
    return Inertia::render('kaprodi/BulkImportPage');
});

Route::get('/kaprodi/check-accounts', function () {
    return Inertia::render('kaprodi/CekAkunMahasiswaPage');
});

Route::get('/kaprodi/master-data', function () {
    return Inertia::render('kaprodi/MasterDataKaprodi');
});

Route::get('/kaprodi/analytics', function () {
    return Inertia::render('kaprodi/AnalitikPage');
});

// ============================================================
// ADMIN SARANA ROUTES
// ============================================================

Route::get('/admin/dashboard', function () {
    return Inertia::render('admin/DashboardAdmin');
});

Route::get('/admin/bookings', function () {
    return Inertia::render('admin/KelolaPeminjamanPage');
});

Route::get('/admin/rooms', function () {
    return Inertia::render('admin/KelolaRuanganPage');
});

Route::get('/admin/priorities', function () {
    return Inertia::render('admin/PrioritasRuangPage');
});

Route::get('/admin/repository/publish', function () {
    return Inertia::render('admin/PublikasiRepositoryAdmin');
});

// ============================================================
// ADMIN SIMTA ROUTES (Dokumen, CMS, Template)
// ============================================================

Route::get('/admin-simta/dashboard', function () {
    return Inertia::render('admin/DashboardAdminSimta');
});

Route::get('/admin-simta/documents', function () {
    return Inertia::render('admin/DokumenAdminPage');
});

Route::get('/admin-simta/cms', function () {
    return Inertia::render('admin/CmsAdminPage');
});

Route::get('/admin-simta/templates', function () {
    return Inertia::render('admin/TemplateAdminPage');
});

// ============================================================
// DOSEN ROUTES
// ============================================================

Route::get('/dosen/dashboard', function () {
    return Inertia::render('dosen/DashboardDosen');
});

Route::get('/dosen/bimbingan', function () {
    return Inertia::render('dosen/BimbinganPage');
});

Route::get('/dosen/jadwal-sidang', function () {
    return Inertia::render('dosen/JadwalSidangDosenPage');
});

Route::get('/dosen/validasi-judul', function () {
    return Inertia::render('dosen/ValidasiJudulDosenPage');
});

// ============================================================
// VERIFICATION ROUTES (QR Code Scan)
// ============================================================

Route::get('/verify/bimbingan/{nim}', function ($nim) {
    return Inertia::render('VerifyBimbinganPage', [
        'nim' => $nim,
    ]);
});

// ============================================================
// LARAVEL AUTH (Breeze)
// ============================================================

require __DIR__.'/auth.php';
