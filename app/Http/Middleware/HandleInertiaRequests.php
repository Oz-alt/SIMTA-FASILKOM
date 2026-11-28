<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Handle the incoming request.
     */
    public function handle(Request $request, \Closure $next)
    {
        $response = parent::handle($request, $next);

        // Ensure X-Inertia response header is present and exposed on Inertia responses
        if ($request->hasHeader('X-Inertia') || $request->header('X-Inertia')) {
            $response->headers->set('X-Inertia', 'true');
        }

        $content = $response->getContent();
        if (is_string($content) && str_starts_with(trim($content), '{') && str_contains($content, '"component"') && str_contains($content, '"props"')) {
            $response->headers->set('X-Inertia', 'true');
        }

        $response->headers->set('Access-Control-Expose-Headers', 'X-Inertia, X-Inertia-Version, X-Inertia-Location');

        return $response;
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $simtaSession = $request->session()->get('simta_auth');

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'simtaUser' => is_array($simtaSession) ? $simtaSession : null,
            ],
        ];
    }
}
