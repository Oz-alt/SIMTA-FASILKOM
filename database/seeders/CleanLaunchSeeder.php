<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;

class CleanLaunchSeeder extends Seeder
{
    /**
     * Tables emptied completely during clean launch reset.
     *
     * @var array<int, string>
     */
    private const TABLES_TO_RESET = [
        'student_credentials',
        'thesis_titles',
        'thesis_consultations',
        'thesis_repositories',
        'bookings',
    ];

    /**
     * Run the clean-launch reset & master data import.
     */
    public function run(): void
    {
        $cleanPath = database_path('exports/supabase-clean-launch-snapshot.json');
        $fallbackPath = database_path('exports/supabase-snapshot.json');

        $targetPath = File::exists($cleanPath) ? $cleanPath : $fallbackPath;

        if (! File::exists($targetPath)) {
            $this->command?->warn(
                "No snapshot file found at [{$cleanPath}] or [{$fallbackPath}]. Run 'node scripts/export-supabase-backup.mjs' first."
            );

            return;
        }

        $counts = $this->seedCleanFromPath($targetPath);

        foreach ($counts as $table => $count) {
            $this->command?->info("Clean-launch [{$table}]: {$count} rows.");
        }
    }

    /**
     * Load either a clean-launch or full snapshot JSON, reset student/test tables, and seed master records.
     *
     * @return array<string, int>
     */
    public function seedCleanFromPath(string $snapshotPath): array
    {
        if (! File::exists($snapshotPath)) {
            return [];
        }

        $decoded = json_decode(File::get($snapshotPath), true);

        if (! is_array($decoded)) {
            throw new \RuntimeException("Invalid JSON snapshot file at [{$snapshotPath}].");
        }

        return $this->seedCleanFromPayload($decoded);
    }

    /**
     * Reset student testing data in the database and re-seed preserved master/staff records.
     *
     * @param  array<string, mixed>  $snapshot
     * @return array<string, int>
     */
    public function seedCleanFromPayload(array $snapshot): array
    {
        $cleanPayload = $this->filterCleanPayload($snapshot);

        foreach (self::TABLES_TO_RESET as $table) {
            if (Schema::hasTable($table)) {
                DB::table($table)->delete();
            }
        }

        if (Schema::hasTable('profiles')) {
            DB::table('profiles')->where('role', 'mahasiswa')->delete();
        }

        if (Schema::hasTable('admin_cms')) {
            DB::table('admin_cms')
                ->whereIn('kategori', ['student_profile_meta', 'notification_read_ids', 'system_activity_logs'])
                ->orWhere('id', 'like', 'student-profile-%')
                ->orWhere('id', 'like', 'simta_read_notif_ids_%')
                ->orWhere('id', '=', 'system-activity-logs')
                ->delete();

            // Clear student auth credentials stored in admin_cms while keeping advisor & admin accounts.
            $existingCreds = DB::table('admin_cms')
                ->where(function ($query): void {
                    $query->where('kategori', 'account_credential')
                        ->orWhere('id', 'like', 'auth-cred-%');
                })
                ->get(['id', 'judul']);

            $advisorNips = collect($cleanPayload['tables']['advisors'] ?? [])
                ->pluck('nip')
                ->filter()
                ->map(static fn (mixed $nip): string => trim((string) $nip))
                ->all();
            $staffNips = collect($cleanPayload['tables']['profiles'] ?? [])
                ->flatMap(static fn (array $profile): array => [$profile['nip'] ?? null, $profile['nim'] ?? null])
                ->filter()
                ->map(static fn (mixed $nip): string => trim((string) $nip))
                ->all();
            $studentNims = collect($cleanPayload['tables']['student_advisors'] ?? [])
                ->pluck('student_nim')
                ->filter()
                ->map(static fn (mixed $nim): string => trim((string) $nim))
                ->all();

            foreach ($existingCreds as $credRow) {
                $ident = trim((string) ($credRow->judul ?? preg_replace('/^auth-cred-/', '', (string) $credRow->id)));

                if (! $this->isStaffIdentifier($ident, $advisorNips, $staffNips, $studentNims)) {
                    DB::table('admin_cms')->where('id', $credRow->id)->delete();
                }
            }
        }

        $seeder = new SupabaseExportSeeder;

        return $seeder->seedFromPayload($cleanPayload);
    }

    /**
     * Filter a full snapshot array down to preserved master/staff records and cleared student test fields.
     *
     * @param  array<string, mixed>  $snapshot
     * @return array<string, mixed>
     */
    private function filterCleanPayload(array $snapshot): array
    {
        $tables = is_array($snapshot['tables'] ?? null) ? $snapshot['tables'] : [];

        $advisors = is_array($tables['advisors'] ?? null) ? $tables['advisors'] : [];
        $rawProfiles = is_array($tables['profiles'] ?? null) ? $tables['profiles'] : [];
        $rawStudentAdvisors = is_array($tables['student_advisors'] ?? null) ? $tables['student_advisors'] : [];
        $rawAdminCms = is_array($tables['admin_cms'] ?? null) ? $tables['admin_cms'] : [];

        $staffProfiles = array_values(array_filter(
            $rawProfiles,
            static fn (mixed $profile): bool => is_array($profile)
                && strtolower((string) ($profile['role'] ?? '')) !== 'mahasiswa'
        ));

        $advisorNips = array_values(array_filter(array_map(
            static fn (mixed $advisor): string => is_array($advisor) ? trim((string) ($advisor['nip'] ?? '')) : '',
            $advisors
        )));

        $staffNips = [];
        foreach ($staffProfiles as $profile) {
            foreach (['nip', 'nim'] as $field) {
                $val = trim((string) ($profile[$field] ?? ''));
                if ($val !== '') {
                    $staffNips[] = $val;
                }
            }
        }

        $studentNims = array_values(array_filter(array_map(
            static fn (mixed $sa): string => is_array($sa) ? trim((string) ($sa['student_nim'] ?? '')) : '',
            $rawStudentAdvisors
        )));

        $cleanStudentAdvisors = array_map(static function (mixed $sa): mixed {
            if (! is_array($sa)) {
                return $sa;
            }

            $sa['judul_ta'] = null;
            if (array_key_exists('is_verified', $sa)) {
                $sa['is_verified'] = false;
            }

            return $sa;
        }, $rawStudentAdvisors);

        $cleanAdminCms = array_values(array_filter(
            $rawAdminCms,
            function (mixed $row) use ($advisorNips, $staffNips, $studentNims): bool {
                if (! is_array($row)) {
                    return false;
                }

                $id = trim((string) ($row['id'] ?? ''));
                $kategori = trim((string) ($row['kategori'] ?? ''));

                if ($kategori === 'student_profile_meta' || str_starts_with($id, 'student-profile-')) {
                    return false;
                }

                if (
                    $kategori === 'notification_read_ids'
                    || str_starts_with($id, 'simta_read_notif_ids_')
                    || str_starts_with($id, 'notif-read-')
                ) {
                    return false;
                }

                if ($kategori === 'system_activity_logs' || $id === 'system-activity-logs') {
                    return false;
                }

                if ($kategori === 'account_credential' || str_starts_with($id, 'auth-cred-')) {
                    $ident = trim((string) ($row['judul'] ?? preg_replace('/^auth-cred-/', '', $id)));

                    return $this->isStaffIdentifier($ident, $advisorNips, $staffNips, $studentNims);
                }

                return true;
            }
        ));

        return [
            'exportedAt' => $snapshot['exportedAt'] ?? null,
            'supabaseUrl' => $snapshot['supabaseUrl'] ?? null,
            'tables' => [
                'profiles' => $staffProfiles,
                'advisors' => $advisors,
                'student_advisors' => $cleanStudentAdvisors,
                'thesis_titles' => [],
                'thesis_consultations' => [],
                'thesis_repositories' => [],
                'bookings' => [],
                'admin_cms' => $cleanAdminCms,
                'admin_documents' => is_array($tables['admin_documents'] ?? null) ? $tables['admin_documents'] : [],
                'admin_templates' => is_array($tables['admin_templates'] ?? null) ? $tables['admin_templates'] : [],
                'student_credentials' => [],
            ],
            'studentCredentialsRpcStatus' => [],
        ];
    }

    /**
     * Determine whether an account_credential identifier belongs to an admin or lecturer rather than a student.
     *
     * @param  array<int, string>  $advisorNips
     * @param  array<int, string>  $staffNips
     * @param  array<int, string>  $studentNims
     */
    private function isStaffIdentifier(string $ident, array $advisorNips, array $staffNips, array $studentNims): bool
    {
        if ($ident === '') {
            return false;
        }

        if (strtolower($ident) === 'admin') {
            return true;
        }

        if (in_array($ident, $advisorNips, true) || in_array($ident, $staffNips, true)) {
            return true;
        }

        if (in_array($ident, $studentNims, true)) {
            return false;
        }

        return preg_match('/^\d{18}$/', $ident) === 1;
    }
}
