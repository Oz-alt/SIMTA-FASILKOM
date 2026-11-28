<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class SimtaStorageController extends Controller
{
    /**
     * Allowed storage buckets replacing Supabase Storage.
     *
     * @var array<int, string>
     */
    private const ALLOWED_BUCKETS = [
        'repository-docs',
        'avatars',
    ];

    /**
     * Upload a repository PDF or asset safely to local Laravel public disk storage.
     */
    public function upload(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'bucket' => ['required', 'string', 'in:'.implode(',', self::ALLOWED_BUCKETS)],
            'path' => ['required', 'string', 'max:255'],
            'file' => ['required', 'file', 'max:20480', 'mimes:pdf,doc,docx,png,jpg,jpeg,webp'],
        ]);

        $bucket = $validated['bucket'];
        $safePath = $this->sanitizeRelativePath($validated['path']);

        if ($safePath === null) {
            return response()->json([
                'data' => null,
                'error' => ['message' => 'Invalid storage file path.'],
            ], 422);
        }

        $storedFullPath = "{$bucket}/{$safePath}";
        $directory = pathinfo($storedFullPath, PATHINFO_DIRNAME);
        $filename = pathinfo($storedFullPath, PATHINFO_BASENAME);

        Storage::disk('public')->putFileAs($directory, $validated['file'], $filename);

        return response()->json([
            'data' => [
                'path' => $safePath,
                'publicUrl' => "/api/simta/storage/{$bucket}/{$safePath}",
            ],
            'error' => null,
        ]);
    }

    /**
     * Serve uploaded files directly through PHP so shared hosting works without storage symlinks.
     */
    public function show(string $bucket, string $path): Response
    {
        if (! in_array($bucket, self::ALLOWED_BUCKETS, true)) {
            abort(404);
        }

        $safePath = $this->sanitizeRelativePath($path);

        if ($safePath === null) {
            abort(404);
        }

        $diskPath = "{$bucket}/{$safePath}";

        if (! Storage::disk('public')->exists($diskPath)) {
            abort(404);
        }

        return Storage::disk('public')->response($diskPath);
    }

    /**
     * Reject traversal segments and normalize forward-slash relative storage paths.
     */
    private function sanitizeRelativePath(string $rawPath): ?string
    {
        $normalized = trim(str_replace('\\', '/', $rawPath), '/');

        if ($normalized === '' || str_contains($normalized, "\0")) {
            return null;
        }

        $segments = explode('/', $normalized);

        foreach ($segments as $segment) {
            if ($segment === '' || $segment === '.' || $segment === '..') {
                return null;
            }
            if (! preg_match('/^[a-zA-Z0-9._-]+$/', $segment)) {
                return null;
            }
        }

        return implode('/', $segments);
    }
}
