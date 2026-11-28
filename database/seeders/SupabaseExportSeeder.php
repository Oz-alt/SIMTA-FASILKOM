<?php

namespace Database\Seeders;

use App\Support\SimtaTableSchema;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;

class SupabaseExportSeeder extends Seeder
{
    /**
     * Run the seeder against the default gitignored Supabase snapshot file.
     */
    public function run(): void
    {
        $snapshotPath = database_path('exports/supabase-snapshot.json');

        if (! File::exists($snapshotPath)) {
            $this->command?->warn(
                "Snapshot file not found at [{$snapshotPath}]. Run 'node scripts/export-supabase-backup.mjs' first."
            );

            return;
        }

        $counts = $this->seedFromPath($snapshotPath);

        foreach ($counts as $table => $count) {
            $this->command?->info("Seeded [{$table}]: {$count} rows.");
        }
    }

    /**
     * Load a Supabase export JSON file from disk and seed all SIMTA tables.
     *
     * @return array<string, int>
     */
    public function seedFromPath(string $snapshotPath): array
    {
        if (! File::exists($snapshotPath)) {
            return [];
        }

        $decoded = json_decode(File::get($snapshotPath), true);

        if (! is_array($decoded)) {
            throw new \RuntimeException("Invalid JSON snapshot file at [{$snapshotPath}].");
        }

        return $this->seedFromPayload($decoded);
    }

    /**
     * Seed SIMTA tables idempotently from an exported Supabase snapshot array.
     *
     * @param  array<string, mixed>  $snapshot
     * @return array<string, int>
     */
    public function seedFromPayload(array $snapshot): array
    {
        $tablesPayload = is_array($snapshot['tables'] ?? null) ? $snapshot['tables'] : [];
        $rpcCredentials = is_array($snapshot['studentCredentialsRpcStatus'] ?? null)
            ? $snapshot['studentCredentialsRpcStatus']
            : [];

        $counts = [];

        foreach (SimtaTableSchema::TABLE_PRIMARY_KEYS as $table => $primaryKey) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            $rows = is_array($tablesPayload[$table] ?? null) ? $tablesPayload[$table] : [];

            if ($table === 'student_credentials' && count($rows) === 0 && count($rpcCredentials) > 0) {
                $rows = $this->mapRpcCredentialRows($rpcCredentials);
            }

            $counts[$table] = $this->upsertRows($table, $primaryKey, $rows);
        }

        return $counts;
    }

    /**
     * Convert RPC credential status objects into student_credentials rows without overwriting hashes.
     *
     * @param  array<int, mixed>  $rpcRows
     * @return array<int, array<string, mixed>>
     */
    private function mapRpcCredentialRows(array $rpcRows): array
    {
        $mapped = [];

        foreach ($rpcRows as $row) {
            if (! is_array($row)) {
                continue;
            }

            $nim = trim((string) ($row['nim'] ?? ''));

            if ($nim === '') {
                continue;
            }

            $mapped[] = [
                'nim' => $nim,
                'is_profile_completed' => (bool) ($row['is_profile_completed'] ?? false),
                'has_password' => (bool) ($row['has_password'] ?? false),
                'nama' => $row['nama'] ?? null,
                'no_hp' => $row['no_hp'] ?? null,
                'kelas' => $row['kelas'] ?? null,
                'prodi' => $row['prodi'] ?? null,
            ];
        }

        return $mapped;
    }

    /**
     * Normalize and upsert rows into a table in chunks while preserving absent columns.
     *
     * @param  array<int, mixed>  $rawRows
     */
    private function upsertRows(string $table, string $primaryKey, array $rawRows): int
    {
        $schemaColumns = Schema::getColumnListing($table);
        $validRows = array_values(array_filter($rawRows, static function (mixed $row) use ($primaryKey): bool {
            if (! is_array($row)) {
                return false;
            }

            $pkValue = $row[$primaryKey] ?? null;

            return $pkValue !== null && trim((string) $pkValue) !== '';
        }));

        if (count($validRows) === 0) {
            return 0;
        }

        $presentColumns = [];

        foreach ($schemaColumns as $column) {
            if ($column === $primaryKey) {
                $presentColumns[] = $column;

                continue;
            }

            foreach ($validRows as $row) {
                if (array_key_exists($column, $row)) {
                    $presentColumns[] = $column;

                    break;
                }
            }
        }

        $updateColumns = array_values(array_filter(
            $presentColumns,
            static fn (string $column): bool => $column !== $primaryKey
        ));

        $normalized = [];

        foreach ($validRows as $row) {
            $record = [];

            foreach ($presentColumns as $column) {
                $record[$column] = SimtaTableSchema::normalizeValueForStorage($column, $row[$column] ?? null);
            }

            $normalized[] = $record;
        }

        $targetUpdates = count($updateColumns) > 0 ? $updateColumns : [$primaryKey];

        foreach (array_chunk($normalized, 100) as $chunk) {
            DB::table($table)->upsert($chunk, [$primaryKey], $targetUpdates);
        }

        return count($normalized);
    }
}
