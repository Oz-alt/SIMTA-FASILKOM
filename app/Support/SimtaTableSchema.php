<?php

namespace App\Support;

use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;

class SimtaTableSchema
{
    /**
     * Primary keys per SIMTA table.
     *
     * @var array<string, string>
     */
    public const TABLE_PRIMARY_KEYS = [
        'profiles' => 'id',
        'advisors' => 'nip',
        'student_advisors' => 'student_nim',
        'thesis_titles' => 'id',
        'thesis_consultations' => 'id',
        'thesis_repositories' => 'id',
        'bookings' => 'id',
        'admin_cms' => 'id',
        'admin_documents' => 'id',
        'admin_templates' => 'id',
        'student_credentials' => 'nim',
    ];

    /**
     * Tables exposed through the general SIMTA CRUD query endpoint.
     * `student_credentials` is intentionally excluded and gated via RPC endpoints.
     *
     * @var array<int, string>
     */
    public const QUERYABLE_TABLES = [
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
    ];

    /**
     * Columns stored as JSON strings in SQL.
     *
     * @var array<int, string>
     */
    public const JSON_COLUMNS = [
        'keahlian',
        'riwayat_revisi',
        'riwayat_pengingat_prodi',
        'jadwal_sidang',
        'kata_kunci',
    ];

    /**
     * Columns stored as booleans.
     *
     * @var array<int, string>
     */
    public const BOOLEAN_COLUMNS = [
        'is_profile_completed',
        'requires_password_change',
        'is_verified',
        'dospem_confirmed',
        'has_password',
    ];

    /**
     * Columns stored as integers.
     *
     * @var array<int, string>
     */
    public const INTEGER_COLUMNS = [
        'kuota_dospem1',
        'kuota_dospem2',
        'kuota_bimbingan',
        'skor_kemiripan_terakhir',
        'jumlah_diingatkan',
    ];

    /**
     * Columns stored as Y-m-d dates.
     *
     * @var array<int, string>
     */
    public const DATE_COLUMNS = [
        'tanggal',
        'tanggal_lulus',
        'tanggal_upload',
        'booking_date',
    ];

    /**
     * Columns stored as UTC datetime/timestamps.
     *
     * @var array<int, string>
     */
    public const TIMESTAMP_COLUMNS = [
        'created_at',
        'updated_at',
        'dospem_confirmed_at',
        'terakhir_diingatkan_prodi',
        'reviewed_at',
    ];

    /**
     * Return primary key column for a SIMTA table.
     */
    public static function primaryKeyFor(string $table): string
    {
        return self::TABLE_PRIMARY_KEYS[$table] ?? 'id';
    }

    /**
     * Return cached column list for a SIMTA table.
     *
     * @return array<int, string>
     */
    public static function columnsFor(string $table): array
    {
        if (! Schema::hasTable($table)) {
            return [];
        }

        return Schema::getColumnListing($table);
    }

    /**
     * Normalize a single value before SQL insert/upsert/update.
     */
    public static function normalizeValueForStorage(string $column, mixed $value): mixed
    {
        if ($value === null) {
            return null;
        }

        if (in_array($column, self::JSON_COLUMNS, true)) {
            if (is_string($value)) {
                return $value;
            }

            return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }

        if (in_array($column, self::BOOLEAN_COLUMNS, true)) {
            return (bool) $value;
        }

        if (in_array($column, self::INTEGER_COLUMNS, true)) {
            return is_numeric($value) ? (int) $value : null;
        }

        if (in_array($column, self::DATE_COLUMNS, true)) {
            return self::formatTemporal($value, 'Y-m-d');
        }

        if (in_array($column, self::TIMESTAMP_COLUMNS, true)) {
            return self::formatTemporal($value, 'Y-m-d H:i:s');
        }

        if (is_array($value)) {
            return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }

        return $value;
    }

    /**
     * Filter an input associative array to valid table columns and normalize all values.
     *
     * @param  array<string, mixed>  $row
     * @param  array<int, string>|null  $allowedColumns
     * @return array<string, mixed>
     */
    public static function normalizeRowForStorage(string $table, array $row, ?array $allowedColumns = null): array
    {
        $columns = $allowedColumns ?? self::columnsFor($table);
        $filtered = [];

        foreach ($row as $key => $value) {
            if (! in_array($key, $columns, true)) {
                continue;
            }

            $filtered[$key] = self::normalizeValueForStorage($key, $value);
        }

        return $filtered;
    }

    /**
     * Convert raw database row fields back into API JSON types matching frontend expectations.
     *
     * @param  object|array<string, mixed>  $row
     * @return array<string, mixed>
     */
    public static function formatRowForResponse(object|array $row): array
    {
        $record = is_object($row) ? get_object_vars($row) : $row;

        foreach ($record as $column => $value) {
            if ($value === null) {
                continue;
            }

            if (in_array($column, self::JSON_COLUMNS, true) && is_string($value)) {
                $decoded = json_decode($value, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $record[$column] = $decoded;
                }

                continue;
            }

            if (in_array($column, self::BOOLEAN_COLUMNS, true)) {
                $record[$column] = (bool) $value;

                continue;
            }

            if (in_array($column, self::INTEGER_COLUMNS, true)) {
                $record[$column] = is_numeric($value) ? (int) $value : null;

                continue;
            }

            if (in_array($column, self::TIMESTAMP_COLUMNS, true)) {
                $iso = self::formatIsoTimestamp($value);
                if ($iso !== null) {
                    $record[$column] = $iso;
                }
            }
        }

        return $record;
    }

    /**
     * Parse ISO-8601 or SQL temporal strings cleanly in UTC.
     */
    private static function formatTemporal(mixed $value, string $format): ?string
    {
        if (is_string($value) && trim($value) === '') {
            return null;
        }

        try {
            return Carbon::parse((string) $value)->utc()->format($format);
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Format stored SQL datetime into ISO-8601 UTC string for JS browser compatibility.
     */
    private static function formatIsoTimestamp(mixed $value): ?string
    {
        if (is_string($value) && trim($value) === '') {
            return null;
        }

        try {
            return Carbon::parse((string) $value, 'UTC')->utc()->toIso8601String();
        } catch (\Throwable) {
            return null;
        }
    }
}
