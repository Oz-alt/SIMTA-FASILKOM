<?php

use App\Http\Controllers\Auth\SimtaSessionController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ============================================================
// PUBLIC & SESSION ROUTES
// ============================================================

Route::get('/', function () {
    return Inertia::render('BerandaPage', [
        'canLogin' => Route::has('login'),
        'canRegister' => false,
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/documents', function () {
    return Inertia::render('DokumenPage');
});

Route::get('/verify/bimbingan/{nim}', function (string $nim) {
    return Inertia::render('VerifyBimbinganPage', [
        'nim' => $nim,
    ]);
});

Route::post('/simta-session/login', [SimtaSessionController::class, 'login'])->name('simta.session.login');
Route::post('/simta-session/logout', [SimtaSessionController::class, 'logout'])->name('simta.session.logout');
Route::post('/simta-session/refresh', [SimtaSessionController::class, 'refresh'])
    ->middleware('simta.role')
    ->name('simta.session.refresh');

// ============================================================
// AUTHENTICATED SHARED ROUTES
// ============================================================

Route::middleware('simta.role')->group(function (): void {
    Route::get('/profile', function () {
        return Inertia::render('ProfilePage');
    });
});

Route::middleware('simta.role:mahasiswa,kaprodi,admin')->group(function (): void {
    Route::get('/thesis/archive', function () {
        return Inertia::render('ArsipTAPage');
    });
});

// ============================================================
// MAHASISWA ROUTES
// ============================================================

Route::middleware('simta.role:mahasiswa')->group(function (): void {
    Route::get('/dashboard', function () {
        return Inertia::render('mahasiswa/DashboardMahasiswa');
    })->name('dashboard');

    Route::get('/thesis/submit', function () {
        return Inertia::render('mahasiswa/AjukanJudulPage');
    });

    Route::get('/thesis/status', function () {
        return redirect('/dashboard');
    });

    Route::get('/thesis/consultations', function () {
        return Inertia::render('mahasiswa/BimbinganTAPage');
    });

    Route::get('/thesis/consultations/card', function () {
        return Inertia::render('mahasiswa/KartuBimbinganPage');
    });

    Route::get('/thesis/repository/upload', function () {
        return Inertia::render('UploadRepositoryPage');
    });

    Route::get('/booking/apply/{stage}', function (string $stage) {
        return Inertia::render('mahasiswa/AjukanRuangPage', [
            'stage' => $stage,
        ]);
    });

    Route::get('/booking/status', function () {
        return Inertia::render('mahasiswa/StatusPeminjamanPage');
    });
});

// ============================================================
// KAPRODI ROUTES
// ============================================================

Route::middleware('simta.role:kaprodi')->group(function (): void {
    Route::get('/kaprodi', function () {
        return redirect('/kaprodi/dashboard');
    });

    Route::get('/kaprodi/dashboard', function () {
        return Inertia::render('kaprodi/DashboardKaprodi');
    });

    Route::get('/kaprodi/monitoring-mahasiswa', function () {
        return Inertia::render('kaprodi/MonitoringMahasiswaPage');
    });

    Route::get('/kaprodi/rekap-bimbingan', function () {
        return Inertia::render('kaprodi/RekapBimbinganKaprodiPage');
    });

    Route::get('/kaprodi/titles', function () {
        return Inertia::render('kaprodi/TinjauJudulPage');
    });

    Route::get('/kaprodi/titles/{id}', function (string $id) {
        return Inertia::render('kaprodi/DetailTinjauJudulPage', [
            'titleId' => $id,
        ]);
    });

    Route::get('/kaprodi/thesis-management', function () {
        return Inertia::render('kaprodi/ManajemenTAPage');
    });

    Route::get('/kaprodi/submission-status', function () {
        return Inertia::render('kaprodi/PeninjauanPengajuanPage');
    });

    Route::get('/kaprodi/advisors', function () {
        return redirect('/kaprodi/dashboard');
    });

    Route::get('/kaprodi/defense-schedules', function () {
        return Inertia::render('kaprodi/KelolaJadwalSidangPage');
    });

    Route::get('/kaprodi/reminders', function () {
        return redirect('/kaprodi/monitoring-mahasiswa');
    });

    Route::get('/kaprodi/reminder-pembimbingan', function () {
        return redirect('/kaprodi/monitoring-mahasiswa');
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
        return Inertia::render('kaprodi/MasterMahasiswaPage');
    });

    Route::get('/kaprodi/master-data/mahasiswa', function () {
        return Inertia::render('kaprodi/MasterMahasiswaPage');
    });

    Route::get('/kaprodi/master-data/dosen', function () {
        return Inertia::render('kaprodi/MasterDosenPage');
    });

    Route::get('/kaprodi/analytics', function () {
        return Inertia::render('kaprodi/AnalitikPage');
    });
});

// ============================================================
// ADMIN ROUTES (Sarana & SIMONITA)
// ============================================================

Route::middleware('simta.role:admin')->group(function (): void {
    Route::get('/admin', function () {
        return redirect('/admin-simta/dashboard');
    });

    Route::get('/admin/dashboard', function () {
        return redirect('/admin-simta/dashboard');
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

    Route::get('/schedule', function () {
        return Inertia::render('mahasiswa/JadwalRuangPage');
    });

    Route::get('/admin-simta', function () {
        return redirect('/admin-simta/dashboard');
    });

    Route::get('/admin-simta/dashboard', function () {
        return Inertia::render('admin/DashboardAdminSimta');
    });

    Route::get('/admin-simta/rekap-bimbingan', function () {
        return Inertia::render('kaprodi/RekapBimbinganKaprodiPage');
    });

    Route::get('/admin-simta/accounts/mahasiswa', function () {
        return Inertia::render('admin/AkunMahasiswaAdminPage');
    });

    Route::get('/admin-simta/accounts/dosen', function () {
        return Inertia::render('admin/AkunDosenAdminPage');
    });

    Route::get('/admin-simta/accounts/password-resets', function () {
        return Inertia::render('admin/ResetPasswordRequestsAdminPage');
    });

    Route::get('/admin-simta/accounts/reset-requests', function () {
        return Inertia::render('admin/ResetPasswordRequestsAdminPage');
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

    Route::get('/admin-simta/master/mahasiswa', function () {
        return Inertia::render('admin/MasterMahasiswaAdminPage');
    });

    Route::get('/admin-simta/master-data/mahasiswa', function () {
        return Inertia::render('admin/MasterMahasiswaAdminPage');
    });

    Route::get('/admin-simta/master/dosen', function () {
        return Inertia::render('admin/MasterDosenAdminPage');
    });

    Route::get('/admin-simta/master-data/dosen', function () {
        return Inertia::render('admin/MasterDosenAdminPage');
    });

    Route::get('/admin-simta/thesis-management', function () {
        return Inertia::render('admin/ManajemenTAAdminPage');
    });

    Route::get('/admin-simta/manajemen-ta', function () {
        return Inertia::render('admin/ManajemenTAAdminPage');
    });

    Route::get('/admin-simta/repository', function () {
        return Inertia::render('admin/ManajemenRepositoryAdminPage');
    });
});

// ============================================================
// DOSEN ROUTES
// ============================================================

Route::middleware('simta.role:dosen')->group(function (): void {
    Route::get('/dosen', function () {
        return redirect('/dosen/dashboard');
    });

    Route::get('/dosen/dashboard', function () {
        return Inertia::render('dosen/DashboardDosen');
    });

    Route::get('/dosen/mahasiswa', function () {
        return Inertia::render('dosen/MahasiswaBimbinganPage');
    });

    Route::get('/dosen/validasi', function () {
        return Inertia::render('dosen/ValidasiBimbinganPage');
    });

    Route::get('/dosen/monitoring', function () {
        return Inertia::render('dosen/MahasiswaBimbinganPage');
    });

    Route::get('/dosen/rekap', function () {
        return Inertia::render('dosen/RekapBimbinganPage');
    });

    Route::get('/dosen/profil', function () {
        return Inertia::render('dosen/ProfilDosenPage');
    });

    Route::get('/dosen/bimbingan', function () {
        return Inertia::render('dosen/ValidasiBimbinganPage');
    });

    Route::get('/dosen/jadwal-sidang', function () {
        return Inertia::render('dosen/JadwalSidangDosenPage');
    });

    Route::get('/dosen/validasi-judul', function () {
        return redirect('/dosen/rekap');
    });
});

// ============================================================
// LARAVEL AUTH (Breeze)
// ============================================================

require __DIR__.'/auth.php';
