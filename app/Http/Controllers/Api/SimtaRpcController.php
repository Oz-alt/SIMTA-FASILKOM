<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class SimtaRpcController extends Controller
{
    /**
     * Dispatch SIMONITA RPC actions backed securely by Laravel + MySQL/SQLite.
     */
    public function handle(Request $request, string $function): JsonResponse
    {
        return match ($function) {
            'get_student_credential' => $this->getStudentCredential($request),
            'save_student_credential' => $this->saveStudentCredential($request),
            'verify_student_password' => $this->verifyStudentPassword($request),
            'check_title_similarity' => $this->checkTitleSimilarity($request),
            default => response()->json([
                'data' => null,
                'error' => ['code' => 'PGRST202', 'message' => "RPC function [{$function}] not found."],
            ], 404),
        };
    }

    /**
     * Return student verification status and profile metadata without exposing password hashes.
     */
    private function getStudentCredential(Request $request): JsonResponse
    {
        $nim = trim((string) $request->input('p_nim', ''));

        if ($nim === '' || ! Schema::hasTable('student_credentials')) {
            return response()->json(['data' => [], 'error' => null]);
        }

        $row = Schema::hasTable('student_credentials')
            ? DB::table('student_credentials')->where('nim', $nim)->first()
            : null;

        if (! $row) {
            return response()->json(['data' => [], 'error' => null]);
        }

        return response()->json([
            'data' => [[
                'nim' => $row->nim,
                'has_password' => (bool) ($row->has_password || ! empty($row->password_hash)),
                'is_profile_completed' => (bool) $row->is_profile_completed,
                'nama' => $row->nama,
                'no_hp' => $row->no_hp,
                'kelas' => $row->kelas,
                'prodi' => $row->prodi,
            ]],
            'error' => null,
        ]);
    }

    /**
     * Create or update student password hash and profile completion flag securely using bcrypt.
     */
    private function saveStudentCredential(Request $request): JsonResponse
    {
        if (! Schema::hasTable('student_credentials')) {
            return response()->json([
                'data' => false,
                'error' => ['message' => 'Tabel student_credentials belum dimigrasi.'],
            ]);
        }

        $validated = $request->validate([
            'p_nim' => ['required', 'string', 'max:64'],
            'p_password' => ['nullable', 'string', 'max:255'],
            'p_is_profile_completed' => ['nullable', 'boolean'],
        ]);

        $nim = trim($validated['p_nim']);
        $plainPassword = isset($validated['p_password']) ? trim((string) $validated['p_password']) : '';
        $existing = DB::table('student_credentials')->where('nim', $nim)->first();
        $nowUtc = now()->utc()->format('Y-m-d H:i:s');

        $advisorMeta = DB::table('student_advisors')->where('student_nim', $nim)->first();

        $record = [
            'nim' => $nim,
            'password_hash' => $plainPassword !== ''
                ? Hash::make($plainPassword)
                : ($existing?->password_hash ?? null),
            'has_password' => $plainPassword !== ''
                ? true
                : (bool) ($existing?->has_password ?? false),
            'is_profile_completed' => array_key_exists('p_is_profile_completed', $validated) && $validated['p_is_profile_completed'] !== null
                ? (bool) $validated['p_is_profile_completed']
                : (bool) ($existing?->is_profile_completed ?? false),
            'nama' => $existing?->nama ?? $advisorMeta?->student_nama ?? null,
            'no_hp' => $existing?->no_hp ?? $advisorMeta?->no_hp ?? null,
            'kelas' => $existing?->kelas ?? $advisorMeta?->kelas ?? null,
            'prodi' => $existing?->prodi ?? $advisorMeta?->prodi ?? null,
            'created_at' => $existing?->created_at ?? $nowUtc,
            'updated_at' => $nowUtc,
        ];

        DB::table('student_credentials')->upsert(
            [$record],
            ['nim'],
            ['password_hash', 'has_password', 'is_profile_completed', 'nama', 'no_hp', 'kelas', 'prodi', 'updated_at']
        );

        return response()->json(['data' => true, 'error' => null]);
    }

    /**
     * Verify student password using bcrypt when customized, or default NIM match prior to setup.
     */
    private function verifyStudentPassword(Request $request): JsonResponse
    {
        $nim = trim((string) $request->input('p_nim', ''));
        $plainPassword = (string) $request->input('p_password', '');

        if ($nim === '' || $plainPassword === '') {
            return response()->json(['data' => false, 'error' => null]);
        }

        $row = Schema::hasTable('student_credentials')
            ? DB::table('student_credentials')->where('nim', $nim)->first()
            : null;

        if ($row && $row->has_password && ! empty($row->password_hash)) {
            return response()->json([
                'data' => Hash::check($plainPassword, $row->password_hash),
                'error' => null,
            ]);
        }

        return response()->json([
            'data' => strcasecmp(trim($plainPassword), $nim) === 0,
            'error' => null,
        ]);
    }

    /**
     * Compute basic server-side keyword Jaccard similarity against active thesis_titles records.
     */
    private function checkTitleSimilarity(Request $request): JsonResponse
    {
        if (! Schema::hasTable('thesis_titles')) {
            return response()->json(['data' => [], 'error' => null]);
        }

        $inputTitle = trim((string) $request->input('input_title', ''));

        if ($inputTitle === '') {
            return response()->json(['data' => [], 'error' => null]);
        }

        $inputTokens = $this->tokenizeTitle($inputTitle);

        if (count($inputTokens) === 0) {
            return response()->json(['data' => [], 'error' => null]);
        }

        $titles = DB::table('thesis_titles')
            ->select(['id', 'judul', 'mhs_nim', 'mhs_nama', 'status'])
            ->whereNotNull('judul')
            ->get();

        $matches = [];

        foreach ($titles as $row) {
            $targetTokens = $this->tokenizeTitle((string) $row->judul);
            if (count($targetTokens) === 0) {
                continue;
            }

            $intersection = count(array_intersect($inputTokens, $targetTokens));
            $union = count(array_unique(array_merge($inputTokens, $targetTokens)));
            $score = $union > 0 ? (int) round(($intersection / $union) * 100) : 0;

            if ($score > 0) {
                $matches[] = [
                    'id' => $row->id,
                    'matched_title' => $row->judul,
                    'skor_gabungan' => $score,
                    'status' => $row->status,
                ];
            }
        }

        usort($matches, static fn (array $a, array $b): int => $b['skor_gabungan'] <=> $a['skor_gabungan']);

        return response()->json([
            'data' => array_slice($matches, 0, 10),
            'error' => null,
        ]);
    }

    /**
     * Extract unique normalized alphanumeric tokens for similarity comparison.
     *
     * @return array<int, string>
     */
    private function tokenizeTitle(string $title): array
    {
        $normalized = preg_replace('/[^a-z0-9\s]/', ' ', mb_strtolower($title));
        $parts = preg_split('/\s+/', trim((string) $normalized)) ?: [];

        return array_values(array_unique(array_filter(
            $parts,
            static fn (string $token): bool => mb_strlen($token) >= 2
        )));
    }
}
