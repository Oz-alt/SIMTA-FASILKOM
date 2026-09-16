<?php

use App\Http\Controllers\ProfileController;
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

Route::get('/thesis/consultations/schedule', function () {
    return Inertia::render('JadwalBimbinganPage');
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

Route::get('/kaprodi/repository/review', function () {
    return Inertia::render('kaprodi/TinjauRepositoryKaprodi');
});

Route::get('/kaprodi/import', function () {
    return Inertia::render('kaprodi/BulkImportPage');
});

Route::get('/kaprodi/check-accounts', function () {
    return Inertia::render('kaprodi/CekAkunMahasiswaPage');
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
// LARAVEL AUTH (Breeze)
// ============================================================

require __DIR__.'/auth.php';