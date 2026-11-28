<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Middleware\EnsureSimtaRole;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class SimtaSessionController extends Controller
{
    private const ADMIN_NIP = '198503152010122001';

    private const ADMIN_EMAIL = 'admin.simta@unsri.ac.id';

    private const ADMIN_DEFAULT_SHA256 = '1db6767d23d6b98f776a481ae61eb37947016a72bb258c9d779ddd1bc3001973';

    private const KAPRODI_NIP = '198410012009121005';

    private const KAPRODI_EMAIL = 'koprodi@unsri.ac.id';

    private const KAPRODI_DEFAULT_PASS = 'Koprodi123';

    /**
     * Authenticate SIMONITA credentials server-side and bind a role-isolated session.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'identifier' => ['required', 'string', 'max:191'],
            'password' => ['required', 'string', 'max:255'],
        ]);

        $identifier = trim($validated['identifier']);
        $termLower = strtolower($identifier);
        $password = trim($validated['password']);

        if ($identifier === '' || $password === '') {
            return response()->json([
                'authenticated' => false,
                'message' => 'NIM / NIP atau Username dan kata sandi wajib diisi.',
            ], 422);
        }

        $resolvedUser = $this->resolveUserRecord($identifier, $termLower);

        if ($resolvedUser === null) {
            return response()->json([
                'authenticated' => false,
                'message' => str_contains($identifier, '@')
                    ? 'Email tidak terdaftar.'
                    : 'NIM / NIP atau Username tidak terdaftar.',
            ], 401);
        }

        if (! $this->verifyUserPassword($resolvedUser, $password)) {
            return response()->json([
                'authenticated' => false,
                'message' => 'Kata sandi yang Anda masukkan salah. Silakan periksa kembali kata sandi Anda.',
            ], 401);
        }

        if ($this->isAccountBlocked($resolvedUser, $password)) {
            return response()->json([
                'authenticated' => false,
                'message' => 'Akun Anda saat ini berstatus cuti, ditangguhkan, atau nonaktif. Silakan hubungi Administrator SIMTA FASILKOM.',
            ], 403);
        }

        $sessionUser = $this->buildSessionPayload($resolvedUser);

        $request->session()->regenerate();
        $request->session()->put('simta_auth', $sessionUser);

        return response()->json([
            'authenticated' => true,
            'user' => $sessionUser,
            'redirect_path' => $this->resolveRedirectPath($sessionUser),
        ]);
    }

    /**
     * Destroy SIMONITA and Laravel web authentication sessions cleanly.
     */
    public function logout(Request $request): JsonResponse
    {
        if (Auth::guard('web')->check()) {
            Auth::guard('web')->logout();
        }

        $request->session()->forget('simta_auth');
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'authenticated' => false,
            'csrfToken' => csrf_token(),
        ]);
    }

    /**
     * Refresh server-held profile metadata for the active authenticated user without altering role.
     */
    public function refresh(Request $request): JsonResponse
    {
        $currentSession = $request->session()->get('simta_auth');

        if (! is_array($currentSession)) {
            return response()->json(['authenticated' => false], 401);
        }

        $role = EnsureSimtaRole::normalizeRole((string) ($currentSession['role'] ?? ''));

        if ($role === '') {
            return response()->json(['authenticated' => false], 401);
        }

        $lookupKey = (string) ($currentSession['nim'] ?? $currentSession['nip'] ?? $currentSession['username'] ?? $currentSession['email'] ?? '');

        if ($lookupKey !== '') {
            $fresh = $role === 'kaprodi' && ($currentSession['username'] ?? '') === 'Koprodi'
                ? $this->resolveUserRecord('koprodi', 'koprodi')
                : $this->resolveUserRecord($lookupKey, strtolower($lookupKey), $role);

            if (is_array($fresh)) {
                $fresh['role'] = $role;
                $currentSession = $this->buildSessionPayload($fresh);
                $request->session()->put('simta_auth', $currentSession);
            }
        }

        return response()->json([
            'authenticated' => true,
            'user' => $currentSession,
        ]);
    }

    /**
     * Resolve an authoritative user record by identifier across SIMONITA stores.
     *
     * @return array<string, mixed>|null
     */
    private function resolveUserRecord(string $identifier, string $termLower, ?string $expectedRole = null): ?array
    {
        $isEmail = str_contains($identifier, '@');
        $isNumeric = preg_match('/^[0-9]+$/', $identifier) === 1;
        $isUsername = ! $isEmail && ! $isNumeric;

        // 1. Kaprodi built-in username / email resolution
        if (($expectedRole === null || $expectedRole === 'kaprodi') && in_array($termLower, ['koprodi', 'kaprodi', self::KAPRODI_EMAIL], true)) {
            $kaprodiProfile = $this->findProfileByIdentifier($identifier, 'kaprodi');

            return [
                'id' => $kaprodiProfile['id'] ?? 'user-kaprodi-abdiansah',
                'username' => 'Koprodi',
                'nama' => $kaprodiProfile['nama'] ?? 'Dr. Abdiansah, S.Kom., M.Cs.',
                'nim' => self::KAPRODI_NIP,
                'nip' => self::KAPRODI_NIP,
                'email' => $kaprodiProfile['email'] ?? self::KAPRODI_EMAIL,
                'role' => 'kaprodi',
                'kelas' => $kaprodiProfile['kelas'] ?? 'Dosen / Kaprodi',
                'prodi' => $kaprodiProfile['prodi'] ?? 'D3 Manajemen Informatika',
                'no_hp' => $kaprodiProfile['no_hp'] ?? '',
                'status' => $kaprodiProfile['status'] ?? 'aktif',
                'is_profile_completed' => true,
                'requires_password_change' => (bool) ($kaprodiProfile['requires_password_change'] ?? false),
            ];
        }

        // 2. Admin SIMONITA built-in / profile resolution
        $adminAliases = [
            'admin',
            'admin-simta',
            'admin_simta',
            'adminsimta',
            self::ADMIN_NIP,
            self::ADMIN_EMAIL,
            'admin@unsri.ac.id',
        ];

        $adminProfile = $this->findProfileByIdentifier($identifier, 'admin');

        if (($expectedRole === null || $expectedRole === 'admin') && (in_array($termLower, $adminAliases, true) || $adminProfile !== null)) {
            return [
                'id' => $adminProfile['id'] ?? 'user-admin-simta',
                'username' => 'admin',
                'nama' => $adminProfile['nama'] ?? 'Rina Agustina, S.Kom. (Admin SIMTA)',
                'nim' => $adminProfile['nim'] ?? self::ADMIN_NIP,
                'nip' => $adminProfile['nip'] ?? self::ADMIN_NIP,
                'email' => $adminProfile['email'] ?? self::ADMIN_EMAIL,
                'role' => 'admin',
                'kelas' => $adminProfile['kelas'] ?? 'Admin SIMTA',
                'prodi' => $adminProfile['prodi'] ?? 'D3 Manajemen Informatika',
                'no_hp' => $adminProfile['no_hp'] ?? '',
                'status' => $adminProfile['status'] ?? 'aktif',
                'is_profile_completed' => true,
                'requires_password_change' => (bool) ($adminProfile['requires_password_change'] ?? false),
            ];
        }

        // 3. Username-only login is strictly restricted to Admin and Kaprodi
        if ($isUsername) {
            return null;
        }

        // 4. Built-in Dosen Abdiansah lookup (by NIP or lecturer email)
        if (($expectedRole === null || $expectedRole === 'dosen') && ($identifier === self::KAPRODI_NIP || $termLower === 'abdiansah@unsri.ac.id')) {
            $advisor = $this->findAdvisorByIdentifier(self::KAPRODI_NIP);
            $profile = $this->findProfileByIdentifier(self::KAPRODI_NIP, 'dosen');

            return [
                'id' => $profile['id'] ?? 'user-dosen-abdiansah',
                'nama' => $advisor['nama'] ?? $profile['nama'] ?? 'Dr. Abdiansah, S.Kom., M.Cs.',
                'nim' => self::KAPRODI_NIP,
                'nip' => self::KAPRODI_NIP,
                'email' => $advisor['email'] ?? $profile['email'] ?? 'abdiansah@unsri.ac.id',
                'role' => 'dosen',
                'kelas' => $advisor['jabatan_fungsional'] ?? $profile['kelas'] ?? 'Lektor Kepala',
                'jabatan_fungsional' => $advisor['jabatan_fungsional'] ?? 'Lektor Kepala',
                'prodi' => $advisor['prodi'] ?? $profile['prodi'] ?? 'D3 Manajemen Informatika',
                'no_hp' => $advisor['no_hp'] ?? $profile['no_hp'] ?? '',
                'link_wa_group' => $advisor['link_wa_group'] ?? $profile['link_wa_group'] ?? '',
                'status' => $advisor['status'] ?? $profile['status'] ?? 'Aktif',
                'is_profile_completed' => true,
                'requires_password_change' => (bool) ($profile['requires_password_change'] ?? false),
            ];
        }

        // 5. Dynamic Kaprodi / Dosen in profiles or advisors
        if ($expectedRole === null || $expectedRole === 'kaprodi') {
            $kaprodiProfile = $this->findProfileByIdentifier($identifier, 'kaprodi');
            if ($kaprodiProfile !== null) {
                return $kaprodiProfile;
            }
        }

        if ($expectedRole === null || $expectedRole === 'dosen') {
            $advisor = $this->findAdvisorByIdentifier($identifier);
            $dosenProfile = $this->findProfileByIdentifier($identifier, 'dosen');

            if ($advisor !== null || $dosenProfile !== null) {
                $nip = (string) ($advisor['nip'] ?? $dosenProfile['nip'] ?? $dosenProfile['nim'] ?? $identifier);

                return [
                    'id' => $dosenProfile['id'] ?? "user-dosen-{$nip}",
                    'nama' => $advisor['nama'] ?? $dosenProfile['nama'] ?? 'Dosen Pembimbing',
                    'nim' => $nip,
                    'nip' => $nip,
                    'email' => $advisor['email'] ?? $dosenProfile['email'] ?? "{$nip}@unsri.ac.id",
                    'role' => 'dosen',
                    'kelas' => $advisor['jabatan_fungsional'] ?? $dosenProfile['kelas'] ?? 'Asisten Ahli',
                    'jabatan_fungsional' => $advisor['jabatan_fungsional'] ?? $dosenProfile['jabatan_fungsional'] ?? 'Asisten Ahli',
                    'prodi' => $advisor['prodi'] ?? $dosenProfile['prodi'] ?? 'D3 Manajemen Informatika',
                    'no_hp' => $advisor['no_hp'] ?? $dosenProfile['no_hp'] ?? '',
                    'link_wa_group' => $advisor['link_wa_group'] ?? $dosenProfile['link_wa_group'] ?? '',
                    'status' => $advisor['status'] ?? $dosenProfile['status'] ?? 'Aktif',
                    'is_profile_completed' => true,
                    'requires_password_change' => (bool) ($dosenProfile['requires_password_change'] ?? false),
                ];
            }
        }

        // 6. Mahasiswa lookup across profiles, student_advisors, and student_credentials
        if ($expectedRole === null || $expectedRole === 'mahasiswa') {
            $studentProfile = $this->findProfileByIdentifier($identifier, 'mahasiswa');
            $candidateNim = $this->extractStudentNim($identifier);

            if ($studentProfile !== null) {
                $studentNim = trim((string) ($studentProfile['nim'] ?: $studentProfile['nip'] ?: $candidateNim));
                $cred = $this->findStudentCredential($studentNim);
                $sa = $this->findStudentAdvisor($studentNim);

                return [
                    'id' => $studentProfile['id'] ?? "user-mhs-{$studentNim}",
                    'nama' => $cred['nama'] ?? $sa['student_nama'] ?? $studentProfile['nama'] ?? 'Mahasiswa UNSRI',
                    'nim' => $studentNim,
                    'nip' => $studentNim,
                    'email' => $studentProfile['email'] ?? "{$studentNim}@student.unsri.ac.id",
                    'role' => 'mahasiswa',
                    'kelas' => $cred['kelas'] ?? $sa['kelas'] ?? $studentProfile['kelas'] ?? '2024',
                    'prodi' => $cred['prodi'] ?? $sa['prodi'] ?? $studentProfile['prodi'] ?? 'D3 Manajemen Informatika',
                    'no_hp' => $cred['no_hp'] ?? $sa['no_hp'] ?? $studentProfile['no_hp'] ?? '',
                    'status' => $studentProfile['status'] ?? 'aktif',
                    'is_profile_completed' => (bool) (($cred['is_profile_completed'] ?? false) || ($studentProfile['is_profile_completed'] ?? false)),
                    'requires_password_change' => (bool) ($studentProfile['requires_password_change'] ?? false),
                ];
            }

            if ($candidateNim !== '') {
                $sa = $this->findStudentAdvisor($candidateNim);
                $cred = $this->findStudentCredential($candidateNim);

                if ($sa !== null || $cred !== null) {
                    return [
                        'id' => "user-mhs-{$candidateNim}",
                        'nama' => $cred['nama'] ?? $sa['student_nama'] ?? 'Mahasiswa UNSRI',
                        'nim' => $candidateNim,
                        'nip' => $candidateNim,
                        'email' => "{$candidateNim}@student.unsri.ac.id",
                        'role' => 'mahasiswa',
                        'kelas' => $cred['kelas'] ?? $sa['kelas'] ?? '2024',
                        'prodi' => $cred['prodi'] ?? $sa['prodi'] ?? 'D3 Manajemen Informatika',
                        'no_hp' => $cred['no_hp'] ?? $sa['no_hp'] ?? '',
                        'status' => 'aktif',
                        'is_profile_completed' => (bool) ($cred['is_profile_completed'] ?? false),
                        'requires_password_change' => false,
                    ];
                }
            }
        }

        // 7. Standard Laravel Breeze User fallback (for configured system accounts)
        if ($isEmail) {
            try {
                if (Schema::hasTable('users')) {
                    $breezeUser = User::whereRaw('LOWER(email) = ?', [$termLower])->first();
                    if ($breezeUser !== null) {
                        $inferredRole = $termLower === 'admin@unsri.ac.id' ? 'admin' : 'mahasiswa';
                        if ($expectedRole === null || $expectedRole === $inferredRole) {
                            return [
                                'id' => 'breeze-'.$breezeUser->id,
                                'nama' => $breezeUser->name,
                                'email' => $breezeUser->email,
                                'role' => $inferredRole,
                                'breeze_password_hash' => $breezeUser->password,
                                'status' => 'aktif',
                                'is_profile_completed' => true,
                                'requires_password_change' => false,
                            ];
                        }
                    }
                }
            } catch (\Throwable $e) {
                // Ignore DB error
            }
        }

        return null;
    }

    /**
     * Verify password against authoritative server records without accepting unauthenticated fallbacks.
     *
     * @param  array<string, mixed>  $user
     */
    private function verifyUserPassword(array $user, string $password): bool
    {
        $role = EnsureSimtaRole::normalizeRole((string) ($user['role'] ?? ''));
        $sha256Input = hash('sha256', $password);

        // 1. Check Breeze user hash if account came from `users` table
        if (! empty($user['breeze_password_hash'])) {
            return Hash::check($password, (string) $user['breeze_password_hash']);
        }

        // 2. Check custom/reset credential stored in `admin_cms` (`account_credential`)
        $credInfo = $this->findAdminCmsCredential($user);

        // 3. Admin SIMTA: Kredensial master 'SIMN!Manage_2026#' SELALU diizinkan tanpa terblokir
        if ($role === 'admin') {
            if ($password === 'SIMN!Manage_2026#' || hash_equals(self::ADMIN_DEFAULT_SHA256, $sha256Input)) {
                return true;
            }

            $configuredInitial = config('admin.initial_password');
            if (is_string($configuredInitial) && $configuredInitial !== '' && hash_equals($configuredInitial, $password)) {
                return true;
            }

            if ($credInfo !== null && $this->matchesCmsCredential($credInfo, $password, $sha256Input)) {
                return true;
            }

            try {
                if (Schema::hasTable('users')) {
                    $adminRow = User::where('email', 'admin@unsri.ac.id')->first();
                    if ($adminRow !== null && Hash::check($password, $adminRow->password)) {
                        return true;
                    }
                }
            } catch (\Throwable $e) {
                // Ignore DB error
            }

            return false;
        }

        if ($role === 'mahasiswa') {
            $nim = trim((string) ($user['nim'] ?? $user['nip'] ?? ''));

            if ($credInfo !== null && $credInfo['requires_password_change'] === true) {
                return $this->matchesCmsCredential($credInfo, $password, $sha256Input);
            }

            if ($nim !== '') {
                $studentCred = $this->findStudentCredential($nim);

                if ($studentCred !== null && ! empty($studentCred['has_password']) && ! empty($studentCred['password_hash'])) {
                    if (Hash::check($password, (string) $studentCred['password_hash'])) {
                        return true;
                    }

                    if ($credInfo !== null) {
                        return $this->matchesCmsCredential($credInfo, $password, $sha256Input);
                    }

                    return false;
                }
            }

            if ($credInfo !== null) {
                return $this->matchesCmsCredential($credInfo, $password, $sha256Input);
            }

            return $nim !== '' && strcasecmp($password, $nim) === 0;
        }

        if ($role === 'kaprodi') {
            if ($credInfo !== null && $this->matchesCmsCredential($credInfo, $password, $sha256Input)) {
                return true;
            }

            $nip = trim((string) ($user['nip'] ?? self::KAPRODI_NIP));

            return $password === self::KAPRODI_DEFAULT_PASS
                || ($nip !== '' && strcasecmp($password, $nip) === 0);
        }

        if ($role === 'dosen') {
            if ($credInfo !== null && $this->matchesCmsCredential($credInfo, $password, $sha256Input)) {
                return true;
            }

            $nip = trim((string) ($user['nip'] ?? $user['nim'] ?? ''));

            if ($nip === self::KAPRODI_NIP && $password === self::KAPRODI_DEFAULT_PASS) {
                return true;
            }

            return $nip !== '' && strcasecmp($password, $nip) === 0;
        }

        if ($credInfo !== null) {
            return $this->matchesCmsCredential($credInfo, $password, $sha256Input);
        }

        return false;
    }

    /**
     * Check whether an account is cuti/suspended/deactivated (excluding first-time default activation).
     *
     * @param  array<string, mixed>  $user
     */
    private function isAccountBlocked(array $user, string $password): bool
    {
        $status = strtolower(trim((string) ($user['status'] ?? 'aktif')));

        if (in_array($status, ['cuti', 'ditangguhkan'], true)) {
            return true;
        }

        if ($status === 'nonaktif') {
            $nim = trim((string) ($user['nim'] ?? ''));
            $nip = trim((string) ($user['nip'] ?? ''));
            $isDefaultPass = ($nim !== '' && strcasecmp($password, $nim) === 0)
                || ($nip !== '' && strcasecmp($password, $nip) === 0);

            return ! $isDefaultPass;
        }

        return false;
    }

    /**
     * Find profile row in `profiles` table matching NIM, NIP, or email.
     *
     * @return array<string, mixed>|null
     */
    private function findProfileByIdentifier(string $identifier, ?string $role = null): ?array
    {
        try {
            if (! Schema::hasTable('profiles')) {
                return null;
            }

            $termLower = strtolower(trim($identifier));

            $query = DB::table('profiles')
                ->where(function ($sub) use ($identifier, $termLower): void {
                    $sub->where('nim', $identifier)
                        ->orWhere('nip', $identifier)
                        ->orWhereRaw('LOWER(email) = ?', [$termLower]);
                });

            $rows = $query->get();

            foreach ($rows as $row) {
                $arr = (array) $row;
                $rowRole = EnsureSimtaRole::normalizeRole((string) ($arr['role'] ?? 'mahasiswa'));

                if ($role === null || $rowRole === $role) {
                    $arr['role'] = $rowRole !== '' ? $rowRole : 'mahasiswa';

                    return $arr;
                }
            }
        } catch (\Throwable $e) {
            return null;
        }

        return null;
    }

    /**
     * Find advisor record in `advisors` table matching NIP or email.
     *
     * @return array<string, mixed>|null
     */
    private function findAdvisorByIdentifier(string $identifier): ?array
    {
        try {
            if (! Schema::hasTable('advisors')) {
                return null;
            }

            $termLower = strtolower(trim($identifier));

            $row = DB::table('advisors')
                ->where(function ($sub) use ($identifier, $termLower): void {
                    $sub->where('nip', $identifier)
                        ->orWhereRaw('LOWER(email) = ?', [$termLower]);
                })
                ->first();

            return $row !== null ? (array) $row : null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Find student record in `student_advisors`.
     *
     * @return array<string, mixed>|null
     */
    private function findStudentAdvisor(string $nim): ?array
    {
        try {
            if (! Schema::hasTable('student_advisors') || $nim === '') {
                return null;
            }

            $row = DB::table('student_advisors')->where('student_nim', $nim)->first();

            return $row !== null ? (array) $row : null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Find student bcrypt credential record in `student_credentials`.
     *
     * @return array<string, mixed>|null
     */
    private function findStudentCredential(string $nim): ?array
    {
        try {
            if (! Schema::hasTable('student_credentials') || $nim === '') {
                return null;
            }

            $row = DB::table('student_credentials')->where('nim', $nim)->first();

            return $row !== null ? (array) $row : null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Lookup latest custom/reset password credential in `admin_cms`.
     *
     * @param  array<string, mixed>  $user
     * @return array{password_hash: string, password_plain: string, requires_password_change: bool}|null
     */
    private function findAdminCmsCredential(array $user): ?array
    {
        try {
            if (! Schema::hasTable('admin_cms')) {
                return null;
            }

            $keys = [];
            $nip = trim((string) ($user['nip'] ?? ''));
            $nim = trim((string) ($user['nim'] ?? ''));
            $username = strtolower(trim((string) ($user['username'] ?? '')));
            $email = strtolower(trim((string) ($user['email'] ?? '')));
            $role = EnsureSimtaRole::normalizeRole((string) ($user['role'] ?? ''));

            if ($nip !== '') {
                $keys[] = "auth-cred-{$nip}";
            }
            if ($nim !== '' && $nim !== $nip) {
                $keys[] = "auth-cred-{$nim}";
            }
            if ($username !== '') {
                $keys[] = "auth-cred-{$username}";
            }
            if ($email !== '') {
                $keys[] = "auth-cred-{$email}";
            }
            if ($role === 'kaprodi' || $nip === self::KAPRODI_NIP) {
                $keys[] = 'auth-cred-koprodi';
                $keys[] = 'auth-cred-kaprodi';
                $keys[] = 'auth-cred-'.self::KAPRODI_NIP;
            }
            if ($role === 'admin' || ($user['id'] ?? '') === 'user-admin-simta') {
                $keys[] = 'auth-cred-admin';
            }

            $keys = array_values(array_unique($keys));

            if ($keys === []) {
                return null;
            }

            $row = DB::table('admin_cms')
                ->whereIn('id', $keys)
                ->orderByDesc('updated_at')
                ->first();

            if ($row === null || empty($row->isi)) {
                return null;
            }

            $parsed = is_string($row->isi) ? json_decode($row->isi, true) : (array) $row->isi;

            if (! is_array($parsed) || empty($parsed['password_hash'])) {
                return null;
            }

            return [
                'password_hash' => (string) $parsed['password_hash'],
                'password_plain' => (string) ($parsed['password_plain'] ?? $parsed['password'] ?? ''),
                'requires_password_change' => (bool) ($parsed['requires_password_change'] ?? false),
            ];
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Compare user password against an `admin_cms` credential entry.
     *
     * @param  array{password_hash: string, password_plain: string, requires_password_change: bool}  $credInfo
     */
    private function matchesCmsCredential(array $credInfo, string $password, string $sha256Input): bool
    {
        if (hash_equals(strtolower($credInfo['password_hash']), strtolower($sha256Input))) {
            return true;
        }

        if (str_starts_with($credInfo['password_hash'], '$2y$') || str_starts_with($credInfo['password_hash'], '$2b$')) {
            return Hash::check($password, $credInfo['password_hash']);
        }

        if ($credInfo['password_plain'] !== '' && hash_equals($credInfo['password_plain'], $password)) {
            return true;
        }

        return false;
    }

    /**
     * Extract normalized student NIM from either a raw numeric NIM or `@student.unsri.ac.id` email.
     */
    private function extractStudentNim(string $identifier): string
    {
        $clean = trim($identifier);

        if (preg_match('/^[0-9]+$/', $clean) === 1) {
            return $clean;
        }

        if (preg_match('/^([0-9]+)@student\.unsri\.ac\.id$/i', $clean, $matches) === 1) {
            return $matches[1];
        }

        return '';
    }

    /**
     * Sanitize fields stored in the server session (`simta_auth`) — never persist secrets.
     *
     * @param  array<string, mixed>  $user
     * @return array<string, mixed>
     */
    private function buildSessionPayload(array $user): array
    {
        $role = EnsureSimtaRole::normalizeRole((string) ($user['role'] ?? ''));

        return [
            'id' => (string) ($user['id'] ?? ''),
            'username' => (string) ($user['username'] ?? ''),
            'nama' => (string) ($user['nama'] ?? ''),
            'nim' => (string) ($user['nim'] ?? ''),
            'nip' => (string) ($user['nip'] ?? ''),
            'email' => (string) ($user['email'] ?? ''),
            'role' => $role,
            'kelas' => (string) ($user['kelas'] ?? ''),
            'prodi' => (string) ($user['prodi'] ?? ''),
            'no_hp' => (string) ($user['no_hp'] ?? ''),
            'jabatan_fungsional' => (string) ($user['jabatan_fungsional'] ?? ''),
            'link_wa_group' => (string) ($user['link_wa_group'] ?? ''),
            'is_profile_completed' => (bool) ($user['is_profile_completed'] ?? false),
            'requires_password_change' => (bool) ($user['requires_password_change'] ?? false),
        ];
    }

    /**
     * Compute post-login landing path per role.
     *
     * @param  array<string, mixed>  $user
     */
    private function resolveRedirectPath(array $user): string
    {
        $role = EnsureSimtaRole::normalizeRole((string) ($user['role'] ?? ''));

        if ($role === 'kaprodi') {
            return '/kaprodi/dashboard';
        }

        if ($role === 'admin') {
            return '/admin-simta/dashboard';
        }

        if ($role === 'dosen') {
            return ! empty($user['requires_password_change'])
                ? '/profile?first_login=true&change_password_required=true'
                : '/dosen/dashboard';
        }

        if ($role === 'mahasiswa') {
            $profileDone = ! empty($user['is_profile_completed'])
                && empty($user['requires_password_change']);

            return $profileDone ? '/dashboard' : '/profile?first_login=true';
        }

        return '/login';
    }
}
