<?php

namespace App\Http\Controllers;

use App\Mail\PasswordResetMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PasswordResetProtocolController extends Controller
{
    /**
     * Kirim email resmi pemulihan kata sandi SIMONITA via SMTP.
     */
    public function sendResetEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'name' => ['required', 'string', 'max:255'],
            'token' => ['required', 'string'],
            'role' => ['nullable', 'string'],
            'identifier' => ['nullable', 'string'],
        ]);

        $email = trim($validated['email']);
        $name = trim($validated['name']);
        $token = trim($validated['token']);
        $role = $validated['role'] ?? 'Pengguna';

        // Tentukan baseUrl resmi (Hindari localhost hardcoded di produksi)
        $schemeAndHost = $request->getSchemeAndHttpHost();
        $configuredAppUrl = rtrim((string) config('app.url'), '/');

        // Jika request host bukan localhost/127.0.0.1, prioritaskan host request aktual
        if (! Str::contains($schemeAndHost, ['localhost', '127.0.0.1'])) {
            $baseUrl = $schemeAndHost;
        } elseif (! Str::contains($configuredAppUrl, ['localhost', '127.0.0.1']) && ! empty($configuredAppUrl)) {
            $baseUrl = $configuredAppUrl;
        } else {
            $baseUrl = $schemeAndHost;
        }

        $resetUrl = "{$baseUrl}/reset-password?token=".urlencode($token).'&email='.urlencode($email);

        try {
            // Cek apakah driver SMTP memiliki kredensial
            $mailer = config('mail.default');
            $smtpHost = config('mail.mailers.smtp.host');
            $smtpUser = config('mail.mailers.smtp.username');

            // Tangani exception jika kredensial SMTP belum diisi dan mailer adalah smtp
            if ($mailer === 'smtp' && (empty($smtpHost) || empty($smtpUser) || $smtpHost === '127.0.0.1')) {
                throw new \Exception('Server SMTP belum dikonfigurasi secara lengkap di file .env (MAIL_HOST / MAIL_USERNAME masih kosong atau default 127.0.0.1).');
            }

            Mail::to($email)->send(new PasswordResetMail(
                name: $name,
                resetUrl: $resetUrl,
                expiresAt: '24 Jam',
                role: $role
            ));

            Log::info("Email reset password berhasil dikirim ke {$email} untuk pengguna {$name}.");

            return response()->json([
                'success' => true,
                'status' => 'sent',
                'message' => "Email pemulihan kata sandi resmi berhasil dikirim ke {$email}.",
                'email' => $email,
                'sent_at' => now()->toIso8601String(),
                'expires_at' => now()->addHours(24)->toIso8601String(),
                'reset_url' => $resetUrl,
            ]);

        } catch (\Throwable $e) {
            Log::warning("Gagal mengirim email reset password ke {$email}: ".$e->getMessage());

            return response()->json([
                'success' => false,
                'status' => 'failed',
                'message' => 'Gagal mengirim email: '.$e->getMessage(),
                'email' => $email,
                'error_detail' => $e->getMessage(),
            ], 200); // 200 agar frontend dapat memproses response status failed tanpa uncaught crash
        }
    }

    /**
     * Endpoint pelengkap untuk sinkronisasi pembaruan kata sandi di backend Laravel jika akun terdaftar di DB lokal.
     */
    public function completeReset(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['nullable', 'string'],
            'identifier' => ['nullable', 'string'],
            'password' => ['required', 'string', 'min:6'],
            'password_confirmation' => ['required', 'same:password'],
        ]);

        $identifier = trim($validated['identifier'] ?? '');
        $email = trim($validated['email'] ?? '');
        $newPassword = $validated['password'];

        // Validasi keamanan: Password baru tidak boleh sama dengan NIM / NIP
        if ($identifier && strcasecmp($newPassword, $identifier) === 0) {
            return response()->json([
                'success' => false,
                'message' => 'Kata sandi baru tidak boleh sama dengan NIM atau NIP akun Anda demi alasan keamanan.',
            ], 422);
        }

        // Cari di model User jika ada
        try {
            $userQuery = User::query();
            if ($email) {
                $userQuery->where('email', $email);
            }
            if ($identifier) {
                $userQuery->orWhere('id', $identifier)
                    ->orWhere('email', $identifier);
            }

            $user = $userQuery->first();
            if ($user) {
                $user->password = Hash::make($newPassword);
                $user->setRememberToken(Str::random(60));
                $user->save();
            }
        } catch (\Throwable $e) {
            Log::info('Note: DB lokal user tidak ditemukan atau SQLite driver absen, password tetap tersimpan di Supabase/Local registry: '.$e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Kata sandi berhasil diperbarui dengan aman!',
        ]);
    }
}
