<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\SimtaTableSchema;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SimtaQueryController extends Controller
{
    /**
     * Handle PostgREST-compatible CRUD queries safely against whitelisted SIMTA tables.
     */
    public function handle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'table' => ['required', 'string', 'max:64'],
            'action' => ['required', 'in:select,insert,update,upsert,delete'],
            'columns' => ['nullable', 'string', 'max:500'],
            'filters' => ['nullable', 'array'],
            'order' => ['nullable', 'array'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:2000'],
            'single' => ['nullable', 'boolean'],
            'maybeSingle' => ['nullable', 'boolean'],
            'payload' => ['nullable'],
            'onConflict' => ['nullable', 'string', 'max:64'],
            'returning' => ['nullable', 'boolean'],
        ]);

        $table = $validated['table'];

        if (! in_array($table, SimtaTableSchema::QUERYABLE_TABLES, true)) {
            return response()->json([
                'data' => null,
                'error' => ['message' => "Table [{$table}] is not accessible via query API."],
            ], 403);
        }

        $tableColumns = SimtaTableSchema::columnsFor($table);

        if (count($tableColumns) === 0) {
            return response()->json([
                'data' => null,
                'error' => ['message' => "Table [{$table}] does not exist in database."],
            ], 500);
        }

        $action = $validated['action'];
        $filters = is_array($validated['filters'] ?? null) ? $validated['filters'] : [];
        $orders = is_array($validated['order'] ?? null) ? $validated['order'] : [];
        $returning = (bool) ($validated['returning'] ?? ($action === 'select'));
        $single = (bool) ($validated['single'] ?? false);
        $maybeSingle = (bool) ($validated['maybeSingle'] ?? false);

        try {
            return match ($action) {
                'select' => $this->handleSelect(
                    $table,
                    $tableColumns,
                    $validated['columns'] ?? '*',
                    $filters,
                    $orders,
                    $validated['limit'] ?? null,
                    $single,
                    $maybeSingle
                ),
                'insert' => $this->handleInsert(
                    $table,
                    $tableColumns,
                    $validated['payload'] ?? [],
                    $returning,
                    $single,
                    $maybeSingle
                ),
                'upsert' => $this->handleUpsert(
                    $table,
                    $tableColumns,
                    $validated['payload'] ?? [],
                    $validated['onConflict'] ?? null,
                    $returning,
                    $single,
                    $maybeSingle
                ),
                'update' => $this->handleUpdate(
                    $table,
                    $tableColumns,
                    $validated['payload'] ?? [],
                    $filters,
                    $returning,
                    $single,
                    $maybeSingle
                ),
                'delete' => $this->handleDelete($table, $tableColumns, $filters),
            };
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'data' => null,
                'error' => ['message' => $e->getMessage()],
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'data' => null,
                'error' => ['message' => $e->getMessage()],
            ], 500);
        }
    }

    /**
     * Execute filtered SELECT query with column selection, ordering, and row formatting.
     *
     * @param  array<int, string>  $tableColumns
     * @param  array<int, mixed>  $filters
     * @param  array<int, mixed>  $orders
     */
    private function handleSelect(
        string $table,
        array $tableColumns,
        string $columnsParam,
        array $filters,
        array $orders,
        ?int $limit,
        bool $single,
        bool $maybeSingle
    ): JsonResponse {
        $selectColumns = $this->resolveSelectColumns($columnsParam, $tableColumns);
        $query = DB::table($table)->select($selectColumns);

        $this->applyFilters($query, $filters, $tableColumns);
        $this->applyOrders($query, $orders, $tableColumns);

        if ($limit !== null) {
            $query->limit($limit);
        }

        $rows = $query->get()
            ->map(static fn (object $row): array => SimtaTableSchema::formatRowForResponse($row))
            ->values()
            ->all();

        return $this->formatReadResponse($rows, $single, $maybeSingle);
    }

    /**
     * Insert one or more rows inside a transaction and optionally return formatted rows.
     *
     * @param  array<int, string>  $tableColumns
     */
    private function handleInsert(
        string $table,
        array $tableColumns,
        mixed $payload,
        bool $returning,
        bool $single,
        bool $maybeSingle
    ): JsonResponse {
        $rows = $this->normalizeBatchPayload($payload);

        if (count($rows) === 0) {
            return $this->formatReadResponse([], $single, $maybeSingle);
        }

        $primaryKey = SimtaTableSchema::primaryKeyFor($table);
        $nowUtc = now()->utc()->format('Y-m-d H:i:s');

        $prepared = [];
        $insertedIds = [];

        foreach ($rows as $rawRow) {
            $row = SimtaTableSchema::normalizeRowForStorage($table, $rawRow, $tableColumns);

            if ($primaryKey === 'id' && in_array('id', $tableColumns, true) && empty($row['id'])) {
                $row['id'] = (string) Str::uuid();
            }

            if (in_array('created_at', $tableColumns, true) && empty($row['created_at'])) {
                $row['created_at'] = $nowUtc;
            }

            if (in_array('updated_at', $tableColumns, true) && empty($row['updated_at'])) {
                $row['updated_at'] = $nowUtc;
            }

            if (isset($row[$primaryKey])) {
                $insertedIds[] = $row[$primaryKey];
            }

            $prepared[] = $row;
        }

        $uniform = $this->alignBatchColumns($prepared);

        DB::transaction(static function () use ($table, $uniform): void {
            foreach (array_chunk($uniform, 100) as $chunk) {
                DB::table($table)->insert($chunk);
            }
        });

        if (! $returning) {
            return response()->json(['data' => null, 'error' => null]);
        }

        $resultRows = count($insertedIds) > 0
            ? DB::table($table)->whereIn($primaryKey, $insertedIds)->get()
                ->map(static fn (object $row): array => SimtaTableSchema::formatRowForResponse($row))
                ->values()
                ->all()
            : array_map(static fn (array $r): array => SimtaTableSchema::formatRowForResponse($r), $uniform);

        return $this->formatReadResponse($resultRows, $single, $maybeSingle);
    }

    /**
     * Upsert one or more rows while keeping absent columns untouched on existing rows.
     *
     * @param  array<int, string>  $tableColumns
     */
    private function handleUpsert(
        string $table,
        array $tableColumns,
        mixed $payload,
        ?string $onConflict,
        bool $returning,
        bool $single,
        bool $maybeSingle
    ): JsonResponse {
        $rows = $this->normalizeBatchPayload($payload);

        if (count($rows) === 0) {
            return $this->formatReadResponse([], $single, $maybeSingle);
        }

        $primaryKey = SimtaTableSchema::primaryKeyFor($table);
        $conflictKey = $onConflict !== null && in_array($onConflict, $tableColumns, true)
            ? $onConflict
            : $primaryKey;
        $nowUtc = now()->utc()->format('Y-m-d H:i:s');

        $prepared = [];
        $conflictValues = [];

        foreach ($rows as $rawRow) {
            $row = SimtaTableSchema::normalizeRowForStorage($table, $rawRow, $tableColumns);

            if ($primaryKey === 'id' && in_array('id', $tableColumns, true) && empty($row['id'])) {
                $row['id'] = (string) Str::uuid();
            }

            if (in_array('updated_at', $tableColumns, true) && empty($row['updated_at'])) {
                $row['updated_at'] = $nowUtc;
            }

            if (isset($row[$conflictKey])) {
                $conflictValues[] = $row[$conflictKey];
            }

            $prepared[] = $row;
        }

        $uniform = $this->alignBatchColumns($prepared);
        $allKeys = array_keys($uniform[0]);
        $updateColumns = array_values(array_filter(
            $allKeys,
            static fn (string $col): bool => $col !== $conflictKey && $col !== 'created_at'
        ));

        DB::transaction(static function () use ($table, $uniform, $conflictKey, $updateColumns): void {
            $targetUpdates = count($updateColumns) > 0 ? $updateColumns : [$conflictKey];

            foreach (array_chunk($uniform, 100) as $chunk) {
                DB::table($table)->upsert($chunk, [$conflictKey], $targetUpdates);
            }
        });

        if (! $returning) {
            return response()->json(['data' => null, 'error' => null]);
        }

        $resultRows = count($conflictValues) > 0
            ? DB::table($table)->whereIn($conflictKey, $conflictValues)->get()
                ->map(static fn (object $row): array => SimtaTableSchema::formatRowForResponse($row))
                ->values()
                ->all()
            : array_map(static fn (array $r): array => SimtaTableSchema::formatRowForResponse($r), $uniform);

        return $this->formatReadResponse($resultRows, $single, $maybeSingle);
    }

    /**
     * Update filtered rows safely and optionally return updated records.
     *
     * @param  array<int, string>  $tableColumns
     * @param  array<int, mixed>  $filters
     */
    private function handleUpdate(
        string $table,
        array $tableColumns,
        mixed $payload,
        array $filters,
        bool $returning,
        bool $single,
        bool $maybeSingle
    ): JsonResponse {
        if (! is_array($payload)) {
            throw new \InvalidArgumentException('Update payload must be an object.');
        }

        if (count($filters) === 0) {
            throw new \InvalidArgumentException('Update requires at least one filter condition.');
        }

        $primaryKey = SimtaTableSchema::primaryKeyFor($table);
        $normalized = SimtaTableSchema::normalizeRowForStorage($table, $payload, $tableColumns);

        if (in_array('updated_at', $tableColumns, true) && ! array_key_exists('updated_at', $normalized)) {
            $normalized['updated_at'] = now()->utc()->format('Y-m-d H:i:s');
        }

        if (count($normalized) === 0) {
            return $this->formatReadResponse([], $single, $maybeSingle);
        }

        $matchingIds = DB::transaction(function () use ($table, $tableColumns, $filters, $primaryKey, $normalized): array {
            $idQuery = DB::table($table)->select($primaryKey);
            $this->applyFilters($idQuery, $filters, $tableColumns);
            $ids = $idQuery->pluck($primaryKey)->all();

            if (count($ids) === 0) {
                return [];
            }

            $updateQuery = DB::table($table);
            $this->applyFilters($updateQuery, $filters, $tableColumns);
            $updateQuery->update($normalized);

            return $ids;
        });

        if (! $returning) {
            return response()->json(['data' => null, 'error' => null]);
        }

        $rows = count($matchingIds) > 0
            ? DB::table($table)->whereIn($primaryKey, $matchingIds)->get()
                ->map(static fn (object $row): array => SimtaTableSchema::formatRowForResponse($row))
                ->values()
                ->all()
            : [];

        return $this->formatReadResponse($rows, $single, $maybeSingle);
    }

    /**
     * Delete filtered rows safely.
     *
     * @param  array<int, string>  $tableColumns
     * @param  array<int, mixed>  $filters
     */
    private function handleDelete(string $table, array $tableColumns, array $filters): JsonResponse
    {
        if (count($filters) === 0) {
            throw new \InvalidArgumentException('Delete requires at least one filter condition.');
        }

        $query = DB::table($table);
        $this->applyFilters($query, $filters, $tableColumns);
        $query->delete();

        return response()->json(['data' => [], 'error' => null]);
    }

    /**
     * Parse select projection into safe schema columns.
     *
     * @param  array<int, string>  $tableColumns
     * @return array<int, string>
     */
    private function resolveSelectColumns(string $columnsParam, array $tableColumns): array
    {
        $trimmed = trim($columnsParam);

        if ($trimmed === '' || $trimmed === '*') {
            return ['*'];
        }

        $requested = array_values(array_filter(array_map('trim', explode(',', $trimmed))));
        $valid = array_values(array_intersect($requested, $tableColumns));

        return count($valid) > 0 ? $valid : ['*'];
    }

    /**
     * Apply whitelisted equality, list, or PostgREST-style OR expressions.
     *
     * @param  array<int, mixed>  $filters
     * @param  array<int, string>  $tableColumns
     */
    private function applyFilters(Builder $query, array $filters, array $tableColumns): void
    {
        foreach ($filters as $filter) {
            if (! is_array($filter)) {
                continue;
            }

            $type = $filter['type'] ?? '';

            if ($type === 'eq') {
                $col = $this->assertValidColumn((string) ($filter['column'] ?? ''), $tableColumns);
                $query->where($col, '=', $filter['value'] ?? null);

                continue;
            }

            if ($type === 'in') {
                $col = $this->assertValidColumn((string) ($filter['column'] ?? ''), $tableColumns);
                $values = is_array($filter['value'] ?? null) ? array_values($filter['value']) : [];
                if (count($values) === 0) {
                    $query->whereRaw('1 = 0');
                } else {
                    $query->whereIn($col, $values);
                }

                continue;
            }

            if ($type === 'or') {
                $expression = trim((string) ($filter['expression'] ?? ''));
                $this->applyOrExpression($query, $expression, $tableColumns);
            }
        }
    }

    /**
     * Parse PostgREST `col1.eq.val1,col2.eq.val2` expressions safely using column whitelisting.
     *
     * @param  array<int, string>  $tableColumns
     */
    private function applyOrExpression(Builder $query, string $expression, array $tableColumns): void
    {
        if ($expression === '') {
            return;
        }

        $parts = explode(',', $expression);
        $clauses = [];

        foreach ($parts as $part) {
            $trimmed = trim($part);
            if ($trimmed === '') {
                continue;
            }

            if (! preg_match('/^([a-zA-Z0-9_]+)\.(eq|neq|ilike|like)\.(.*)$/', $trimmed, $matches)) {
                throw new \InvalidArgumentException("Unsupported OR filter clause [{$trimmed}].");
            }

            $column = $this->assertValidColumn($matches[1], $tableColumns);
            $operator = $matches[2];
            $value = trim($matches[3], "\"'");

            $clauses[] = ['column' => $column, 'operator' => $operator, 'value' => $value];
        }

        if (count($clauses) === 0) {
            return;
        }

        $query->where(function (Builder $sub) use ($clauses): void {
            foreach ($clauses as $index => $clause) {
                $method = $index === 0 ? 'where' : 'orWhere';

                if ($clause['operator'] === 'eq') {
                    $sub->{$method}($clause['column'], '=', $clause['value']);
                } elseif ($clause['operator'] === 'neq') {
                    $sub->{$method}($clause['column'], '!=', $clause['value']);
                } else {
                    $pattern = str_replace('*', '%', $clause['value']);
                    $sub->{$method}($clause['column'], 'like', $pattern);
                }
            }
        });
    }

    /**
     * Apply whitelisted ORDER BY clauses.
     *
     * @param  array<int, mixed>  $orders
     * @param  array<int, string>  $tableColumns
     */
    private function applyOrders(Builder $query, array $orders, array $tableColumns): void
    {
        foreach ($orders as $order) {
            if (! is_array($order)) {
                continue;
            }

            $col = (string) ($order['column'] ?? '');
            if (! in_array($col, $tableColumns, true)) {
                continue;
            }

            $direction = ($order['ascending'] ?? true) ? 'asc' : 'desc';
            $query->orderBy($col, $direction);
        }
    }

    /**
     * Validate filter/order column names against actual table schema.
     *
     * @param  array<int, string>  $tableColumns
     */
    private function assertValidColumn(string $column, array $tableColumns): string
    {
        if (! in_array($column, $tableColumns, true)) {
            throw new \InvalidArgumentException("Invalid column [{$column}] for query.");
        }

        return $column;
    }

    /**
     * Normalize single-object or array-of-objects write payloads into a non-associative row list.
     *
     * @return array<int, array<string, mixed>>
     */
    private function normalizeBatchPayload(mixed $payload): array
    {
        if (! is_array($payload) || count($payload) === 0) {
            return [];
        }

        if (array_is_list($payload)) {
            return array_values(array_filter($payload, static fn (mixed $item): bool => is_array($item)));
        }

        return [$payload];
    }

    /**
     * Ensure every row in a multi-row insert/upsert batch shares identical keys.
     *
     * @param  array<int, array<string, mixed>>  $rows
     * @return array<int, array<string, mixed>>
     */
    private function alignBatchColumns(array $rows): array
    {
        $allKeys = [];

        foreach ($rows as $row) {
            foreach (array_keys($row) as $key) {
                $allKeys[$key] = true;
            }
        }

        $columnOrder = array_keys($allKeys);
        $aligned = [];

        foreach ($rows as $row) {
            $record = [];
            foreach ($columnOrder as $col) {
                $record[$col] = $row[$col] ?? null;
            }
            $aligned[] = $record;
        }

        return $aligned;
    }

    /**
     * Format rows consistently with PostgREST single / maybeSingle semantics.
     *
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function formatReadResponse(array $rows, bool $single, bool $maybeSingle): JsonResponse
    {
        if ($single) {
            if (count($rows) !== 1) {
                return response()->json([
                    'data' => null,
                    'error' => ['code' => 'PGRST116', 'message' => 'Expected single row, found '.count($rows).'.'],
                ]);
            }

            return response()->json(['data' => $rows[0], 'error' => null]);
        }

        if ($maybeSingle) {
            return response()->json(['data' => $rows[0] ?? null, 'error' => null]);
        }

        return response()->json(['data' => $rows, 'error' => null]);
    }
}
