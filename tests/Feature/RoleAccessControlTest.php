<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RoleAccessControlTest extends TestCase
{
    use RefreshDatabase;

    private const ADMIN_PASSWORD = 'SIMN!Manage_2026#';

    private const KAPRODI_PASSWORD = 'Koprodi123';

    private const DOSEN_NIP = '198410012009121005';

    private const STUDENT_NIM = '09010182428031';

    /**
     * Ensure unauthenticated visitors can view public pages while all protected portals redirect to login.
     */
    public function test_unauthenticated_users_cannot_access_protected_role_routes(): void
    {
        $this->get('/')->assertOk();
        $this->get('/documents')->assertOk();
        $this->get('/verify/bimbingan/'.self::STUDENT_NIM)->assertOk();
        $this->get('/login')->assertOk();

        $protectedRoutes = [
            '/profile',
            '/dashboard',
            '/thesis/submit',
            '/thesis/consultations',
            '/thesis/consultations/card',
            '/thesis/archive',
            '/thesis/repository/upload',
            '/booking/status',
            '/schedule',
            '/kaprodi/dashboard',
            '/kaprodi/titles',
            '/kaprodi/defense-schedules',
            '/admin/dashboard',
            '/admin/bookings',
            '/admin/rooms',
            '/admin-simta/dashboard',
            '/admin-simta/accounts/mahasiswa',
            '/admin-simta/rekap-bimbingan',
            '/dosen/dashboard',
            '/dosen/mahasiswa',
            '/dosen/validasi',
        ];

        foreach ($protectedRoutes as $route) {
            $this->get($route)->assertRedirect('/login');
        }

        $this->getJson('/admin-simta/dashboard')->assertStatus(401);
    }

    /**
     * Ensure server-side login validates credentials strictly across all four roles.
     */
    public function test_session_login_rejects_invalid_credentials_and_blocked_accounts(): void
    {
        $this->seedMahasiswaFixture();

        $this->postJson('/simta-session/login', [
            'identifier' => 'admin',
            'password' => 'admin123',
        ])->assertStatus(401);

        $this->postJson('/simta-session/login', [
            'identifier' => 'koprodi',
            'password' => 'wrong-password',
        ])->assertStatus(401);

        $this->postJson('/simta-session/login', [
            'identifier' => self::DOSEN_NIP,
            'password' => 'wrong-password',
        ])->assertStatus(401);

        $this->postJson('/simta-session/login', [
            'identifier' => self::STUDENT_NIM,
            'password' => 'wrong-password',
        ])->assertStatus(401);

        DB::table('advisors')->insert([
            'nip' => '198901012020121099',
            'id' => 'adv-cuti',
            'nama' => 'Dosen Cuti',
            'email' => 'cuti@unsri.ac.id',
            'status' => 'cuti',
        ]);

        $this->postJson('/simta-session/login', [
            'identifier' => '198901012020121099',
            'password' => '198901012020121099',
        ])->assertStatus(403);
    }

    /**
     * Ensure an authenticated Mahasiswa is strictly isolated from Admin, Kaprodi, and Dosen routes.
     */
    public function test_mahasiswa_cannot_cross_into_admin_kaprodi_or_dosen_routes(): void
    {
        $this->seedMahasiswaFixture();

        $loginResponse = $this->postJson('/simta-session/login', [
            'identifier' => self::STUDENT_NIM,
            'password' => self::STUDENT_NIM,
        ]);

        $loginResponse->assertOk()
            ->assertJsonPath('authenticated', true)
            ->assertJsonPath('user.role', 'mahasiswa');

        $this->get('/dashboard')->assertOk();
        $this->get('/thesis/submit')->assertOk();
        $this->get('/thesis/archive')->assertOk();
        $this->get('/profile')->assertOk();

        $forbiddenForMahasiswa = [
            '/admin',
            '/admin/dashboard',
            '/admin/bookings',
            '/admin/rooms',
            '/admin-simta',
            '/admin-simta/dashboard',
            '/admin-simta/accounts/mahasiswa',
            '/admin-simta/rekap-bimbingan',
            '/schedule',
            '/kaprodi',
            '/kaprodi/dashboard',
            '/kaprodi/titles',
            '/kaprodi/defense-schedules',
            '/dosen',
            '/dosen/dashboard',
            '/dosen/mahasiswa',
            '/dosen/validasi',
        ];

        foreach ($forbiddenForMahasiswa as $route) {
            $this->get($route)->assertRedirect('/dashboard');
        }

        $this->getJson('/admin-simta/dashboard')->assertStatus(403);
    }

    /**
     * Ensure an authenticated Dosen is strictly isolated from Admin, Kaprodi, and Mahasiswa routes.
     */
    public function test_dosen_cannot_cross_into_admin_kaprodi_or_mahasiswa_routes(): void
    {
        $loginResponse = $this->postJson('/simta-session/login', [
            'identifier' => self::DOSEN_NIP,
            'password' => self::DOSEN_NIP,
        ]);

        $loginResponse->assertOk()
            ->assertJsonPath('authenticated', true)
            ->assertJsonPath('user.role', 'dosen');

        $this->get('/dosen/dashboard')->assertOk();
        $this->get('/dosen/mahasiswa')->assertOk();
        $this->get('/dosen/rekap')->assertOk();
        $this->get('/profile')->assertOk();

        $forbiddenForDosen = [
            '/dashboard',
            '/thesis/submit',
            '/thesis/archive',
            '/booking/status',
            '/admin/dashboard',
            '/admin/bookings',
            '/admin-simta/dashboard',
            '/schedule',
            '/kaprodi/dashboard',
            '/kaprodi/titles',
        ];

        foreach ($forbiddenForDosen as $route) {
            $this->get($route)->assertRedirect('/dosen/dashboard');
        }
    }

    /**
     * Ensure an authenticated Kaprodi is strictly isolated from Admin, Dosen, and Mahasiswa routes.
     */
    public function test_kaprodi_cannot_cross_into_admin_dosen_or_mahasiswa_routes(): void
    {
        $loginResponse = $this->postJson('/simta-session/login', [
            'identifier' => 'koprodi',
            'password' => self::KAPRODI_PASSWORD,
        ]);

        $loginResponse->assertOk()
            ->assertJsonPath('authenticated', true)
            ->assertJsonPath('user.role', 'kaprodi');

        $this->get('/kaprodi/dashboard')->assertOk();
        $this->get('/kaprodi/titles')->assertOk();
        $this->get('/thesis/archive')->assertOk();
        $this->get('/profile')->assertOk();

        $forbiddenForKaprodi = [
            '/dashboard',
            '/thesis/submit',
            '/booking/status',
            '/admin/dashboard',
            '/admin/bookings',
            '/admin-simta/dashboard',
            '/admin-simta/rekap-bimbingan',
            '/schedule',
            '/dosen/dashboard',
            '/dosen/mahasiswa',
        ];

        foreach ($forbiddenForKaprodi as $route) {
            $this->get($route)->assertRedirect('/kaprodi/dashboard');
        }
    }

    /**
     * Ensure an authenticated Admin is strictly isolated from Kaprodi, Dosen, and Mahasiswa exclusive routes.
     */
    public function test_admin_cannot_cross_into_kaprodi_dosen_or_mahasiswa_routes(): void
    {
        $loginResponse = $this->postJson('/simta-session/login', [
            'identifier' => 'admin',
            'password' => self::ADMIN_PASSWORD,
        ]);

        $loginResponse->assertOk()
            ->assertJsonPath('authenticated', true)
            ->assertJsonPath('user.role', 'admin');

        $this->get('/admin/dashboard')->assertRedirect('/admin-simta/dashboard');
        $this->get('/admin-simta/dashboard')->assertOk();
        $this->get('/admin/bookings')->assertOk();
        $this->get('/admin-simta/rekap-bimbingan')->assertOk();
        $this->get('/schedule')->assertOk();
        $this->get('/thesis/archive')->assertOk();
        $this->get('/profile')->assertOk();

        $forbiddenForAdmin = [
            '/dashboard',
            '/thesis/submit',
            '/thesis/consultations',
            '/booking/status',
            '/kaprodi/dashboard',
            '/kaprodi/titles',
            '/dosen/dashboard',
            '/dosen/mahasiswa',
        ];

        foreach ($forbiddenForAdmin as $route) {
            $this->get($route)->assertRedirect('/admin-simta/dashboard');
        }
    }

    /**
     * Ensure logout destroys server session completely and custom student/admin passwords override defaults.
     */
    public function test_logout_invalidates_session_and_custom_passwords_override_defaults(): void
    {
        $this->seedMahasiswaFixture('CustomMhs#2026');

        $this->postJson('/simta-session/login', [
            'identifier' => self::STUDENT_NIM,
            'password' => self::STUDENT_NIM,
        ])->assertStatus(401);

        $this->postJson('/simta-session/login', [
            'identifier' => self::STUDENT_NIM,
            'password' => 'CustomMhs#2026',
        ])->assertOk()
            ->assertJsonPath('user.role', 'mahasiswa');

        $this->postJson('/simta-session/logout')
            ->assertOk()
            ->assertJsonPath('authenticated', false);

        $this->get('/dashboard')->assertRedirect('/login');
        $this->get('/admin-simta/dashboard')->assertRedirect('/login');

        $newAdminPass = 'NewAdminSecret#99';
        DB::table('admin_cms')->insert([
            'id' => 'auth-cred-admin',
            'judul' => 'admin',
            'kategori' => 'account_credential',
            'isi' => json_encode([
                'identifier' => 'admin',
                'role' => 'admin',
                'password_hash' => hash('sha256', $newAdminPass),
                'password_changed' => true,
            ]),
            'status' => 'aktif',
            'updated_at' => now(),
        ]);

        $this->postJson('/simta-session/login', [
            'identifier' => 'admin',
            'password' => self::ADMIN_PASSWORD,
        ])->assertStatus(401);

        $this->postJson('/simta-session/login', [
            'identifier' => 'admin',
            'password' => $newAdminPass,
        ])->assertOk()
            ->assertJsonPath('user.role', 'admin');
    }

    /**
     * Seed a sample Mahasiswa record into student_advisors and optional custom password in student_credentials.
     */
    private function seedMahasiswaFixture(?string $customPassword = null): void
    {
        DB::table('student_advisors')->insert([
            'student_nim' => self::STUDENT_NIM,
            'id' => 'sa-'.self::STUDENT_NIM,
            'student_nama' => 'MUHAMMAD RIZKY ELPARIZA',
            'kelas' => '2024',
            'prodi' => 'D3 Manajemen Informatika',
            'status_pembagian' => 'Ditetapkan',
        ]);

        if ($customPassword !== null) {
            DB::table('student_credentials')->insert([
                'nim' => self::STUDENT_NIM,
                'password_hash' => Hash::make($customPassword),
                'has_password' => true,
                'is_profile_completed' => true,
                'nama' => 'MUHAMMAD RIZKY ELPARIZA',
            ]);
        }
    }
}
