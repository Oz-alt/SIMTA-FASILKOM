<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSimtaRole
{
    /**
     * Allowed canonical roles in SIMONITA.
     *
     * @var array<int, string>
     */
    private const VALID_ROLES = [
        'mahasiswa',
        'dosen',
        'kaprodi',
        'admin',
    ];

    /**
     * Handle an incoming request and enforce strict role-based route isolation.
     */
    public function handle(Request $request, Closure $next, string ...$allowedRoles): Response
    {
        $normalizedAllowed = array_values(array_filter(array_map(
            static fn (string $role): string => self::normalizeRole($role),
            $allowedRoles
        )));

        $simtaSession = $request->session()->get('simta_auth');
        $simtaRole = is_array($simtaSession)
            ? self::normalizeRole((string) ($simtaSession['role'] ?? ''))
            : '';

        $hasValidSimtaSession = is_array($simtaSession) && $simtaRole !== '';
        $hasLaravelUser = $request->user() !== null;

        // Unauthenticated requests are blocked before any protected Inertia component can render.
        if (! $hasValidSimtaSession && ! ($normalizedAllowed === [] && $hasLaravelUser)) {
            if (is_array($simtaSession) || $request->session()->has('simta_auth')) {
                $request->session()->forget('simta_auth');
            }

            if ($request->expectsJson() && ! $request->header('X-Inertia')) {
                return response()->json([
                    'message' => 'Sesi login tidak ditemukan atau telah berakhir.',
                ], 401);
            }

            return redirect('/login');
        }

        // Cross-role route isolation: never serve or leak routes owned by another role.
        if ($normalizedAllowed !== [] && ! in_array($simtaRole, $normalizedAllowed, true)) {
            if ($request->expectsJson() && ! $request->header('X-Inertia')) {
                return response()->json([
                    'message' => 'Akses ditolak untuk peran akun Anda.',
                ], 403);
            }

            return redirect(self::homePathForRole($simtaRole));
        }

        $response = $next($request);

        // Prevent browsers/proxies from caching role-restricted responses across logouts or switches.
        $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        $response->headers->set('Pragma', 'no-cache');

        return $response;
    }

    /**
     * Normalize role strings (including legacy aliases such as `admin_sarana`).
     */
    public static function normalizeRole(string $role): string
    {
        $clean = strtolower(trim($role));

        if ($clean === 'admin_sarana') {
            $clean = 'admin';
        }

        return in_array($clean, self::VALID_ROLES, true) ? $clean : '';
    }

    /**
     * Resolve the default landing dashboard path for a validated role.
     */
    public static function homePathForRole(string $role): string
    {
        return match (self::normalizeRole($role)) {
            'admin' => '/admin-simta/dashboard',
            'kaprodi' => '/kaprodi/dashboard',
            'dosen' => '/dosen/dashboard',
            'mahasiswa' => '/dashboard',
            default => '/login',
        };
    }
}
