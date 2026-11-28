<?php

namespace Tests\Feature;

use Database\Seeders\SupabaseExportSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SimtaMigrationSeederTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Ensure migration creates every SIMTA table and expected dynamic column.
     */
    public function test_simta_migration_creates_all_expected_tables_and_columns(): void
    {
        $expectedTables = [
            'profiles' => ['id', 'department_id', 'nim', 'nip', 'role', 'link_wa_group'],
            'advisors' => ['nip', 'nama', 'keahlian', 'kuota_dospem1', 'kuota_dospem2'],
            'student_advisors' => ['student_nim', 'dospem1_nip', 'dospem2_nip', 'judul_ta'],
            'thesis_titles' => ['id', 'judul_processed', 'skor_kemiripan_terakhir', 'jadwal_sidang'],
            'thesis_consultations' => ['id', 'mhs_nim', 'dosen_nip', 'metode', 'jenis_revisi'],
            'thesis_repositories' => ['id', 'mhs_nim', 'kata_kunci', 'file_url', 'status'],
            'bookings' => ['id', 'mhs_nim', 'ruangan', 'tanggal', 'status'],
            'admin_cms' => ['id', 'kategori', 'isi', 'status'],
            'admin_documents' => ['id', 'nama', 'file_url', 'tanggal_upload'],
            'admin_templates' => ['id', 'nama', 'file_url', 'ukuran'],
            'student_credentials' => ['nim', 'password_hash', 'is_profile_completed', 'has_password'],
        ];

        foreach ($expectedTables as $table => $columns) {
            $this->assertTrue(Schema::hasTable($table), "Missing expected table [{$table}].");

            foreach ($columns as $column) {
                $this->assertTrue(
                    Schema::hasColumn($table, $column),
                    "Missing expected column [{$table}.{$column}]."
                );
            }
        }
    }

    /**
     * Ensure SupabaseExportSeeder imports snapshot rows idempotently without wiping existing hashes.
     */
    public function test_supabase_export_seeder_imports_snapshot_and_preserves_existing_hashes(): void
    {
        $tempPath = sys_get_temp_dir().DIRECTORY_SEPARATOR.'simta_snapshot_'.uniqid('', true).'.json';

        $payload = [
            'exportedAt' => '2026-11-28T12:00:00Z',
            'tables' => [
                'profiles' => [
                    [
                        'id' => 'profile-1',
                        'department_id' => 'dept-mi',
                        'nama' => 'Test Kaprodi',
                        'email' => 'kaprodi@example.test',
                        'nim' => '198410012009121005',
                        'nip' => '198410012009121005',
                        'role' => 'kaprodi',
                        'created_at' => '2026-10-20T04:06:03.123456+00:00',
                        'updated_at' => '2026-10-28T09:51:10Z',
                    ],
                ],
                'advisors' => [
                    [
                        'id' => 'adv-1',
                        'nip' => '198410012009121005',
                        'nama' => 'Dr. Abdiansah',
                        'keahlian' => ['AI', 'NLP'],
                        'kuota_dospem1' => 10,
                        'kuota_dospem2' => 12,
                        'status' => 'Aktif',
                    ],
                ],
                'thesis_titles' => [
                    [
                        'id' => 'title-1',
                        'mhs_nim' => '09010282428031',
                        'judul' => 'Rancang Bangun SIMONITA',
                        'judul_processed' => 'rancang bangun simonita',
                        'dospem_confirmed' => true,
                        'jadwal_sidang' => ['ruang' => 'A101', 'jam' => '09:00'],
                        'tanggal_lulus' => '2026-11-28T00:00:00Z',
                    ],
                ],
                'admin_cms' => [
                    [
                        'id' => 'cms-1',
                        'kategori' => 'system_settings',
                        'judul' => 'Maintenance',
                        'isi' => ['enabled' => false],
                        'status' => 'Published',
                    ],
                ],
            ],
            'studentCredentialsRpcStatus' => [
                [
                    'nim' => '09010282428031',
                    'has_password' => true,
                    'is_profile_completed' => true,
                    'nama' => 'Mahasiswa Uji',
                    'no_hp' => '08123456789',
                    'kelas' => 'MI 5A',
                    'prodi' => 'D3 Manajemen Informatika',
                ],
            ],
        ];

        File::put($tempPath, json_encode($payload, JSON_THROW_ON_ERROR));

        try {
            $seeder = new SupabaseExportSeeder;
            $counts = $seeder->seedFromPath($tempPath);

            $this->assertSame(1, $counts['profiles']);
            $this->assertSame(1, $counts['advisors']);
            $this->assertSame(1, $counts['thesis_titles']);
            $this->assertSame(1, $counts['admin_cms']);
            $this->assertSame(1, $counts['student_credentials']);

            $advisor = DB::table('advisors')->where('nip', '198410012009121005')->first();
            $this->assertNotNull($advisor);
            $this->assertSame('["AI","NLP"]', $advisor->keahlian);

            $title = DB::table('thesis_titles')->where('id', 'title-1')->first();
            $this->assertNotNull($title);
            $this->assertSame('2026-11-28', $title->tanggal_lulus);

            DB::table('student_credentials')
                ->where('nim', '09010282428031')
                ->update(['password_hash' => '$2y$10$preserved_hash']);

            $seeder->seedFromPath($tempPath);

            $credential = DB::table('student_credentials')->where('nim', '09010282428031')->first();
            $this->assertNotNull($credential);
            $this->assertSame('$2y$10$preserved_hash', $credential->password_hash);
            $this->assertSame(1, (int) $credential->has_password);
        } finally {
            File::delete($tempPath);
        }
    }

    /**
     * Ensure seeding skips cleanly without failing if no snapshot file exists yet.
     */
    public function test_supabase_export_seeder_handles_missing_snapshot_gracefully(): void
    {
        $seeder = new SupabaseExportSeeder;
        $result = $seeder->seedFromPath(sys_get_temp_dir().DIRECTORY_SEPARATOR.'nonexistent_simta_'.uniqid('', true).'.json');

        $this->assertSame([], $result);
    }
}
