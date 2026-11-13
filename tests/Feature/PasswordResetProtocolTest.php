<?php

namespace Tests\Feature;

use App\Mail\PasswordResetMail;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PasswordResetProtocolTest extends TestCase
{
    /**
     * Test validasi input endpoint pengiriman email reset password.
     */
    public function test_send_reset_email_endpoint_validates_required_fields(): void
    {
        $response = $this->postJson('/api/password-reset/send-email', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email', 'name', 'token']);
    }

    /**
     * Test pengiriman email pemulihan kata sandi berhasil ketika Mail difake.
     */
    public function test_send_reset_email_dispatches_official_mailable(): void
    {
        Mail::fake();

        $payload = [
            'email' => '09010182428001@student.unsri.ac.id',
            'name' => 'Muhammad Fathan Pratama',
            'token' => 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
            'role' => 'mahasiswa',
            'identifier' => '09010182428001',
        ];

        $response = $this->postJson('/api/password-reset/send-email', $payload);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'status' => 'sent',
            'email' => '09010182428001@student.unsri.ac.id',
        ]);

        Mail::assertSent(PasswordResetMail::class, function ($mail) use ($payload) {
            return $mail->hasTo($payload['email']) &&
                $mail->name === $payload['name'] &&
                str_contains($mail->resetUrl, $payload['token']) &&
                $mail->role === $payload['role'];
        });
    }

    /**
     * Test validasi keamanan: password baru tidak boleh sama dengan NIM atau NIP.
     */
    public function test_complete_reset_rejects_password_identical_to_nim_or_nip(): void
    {
        $response = $this->postJson('/api/password-reset/complete', [
            'identifier' => '09010182428001',
            'email' => 'fathan@student.unsri.ac.id',
            'password' => '09010182428001',
            'password_confirmation' => '09010182428001',
        ]);

        $response->assertStatus(422);
        $response->assertJson([
            'success' => false,
        ]);
        $this->assertStringContainsString('NIM atau NIP', $response->json('message'));
    }

    /**
     * Test validasi keamanan: password dan konfirmasi password harus cocok.
     */
    public function test_complete_reset_requires_matching_confirmation(): void
    {
        $response = $this->postJson('/api/password-reset/complete', [
            'identifier' => '09010182428001',
            'email' => 'fathan@student.unsri.ac.id',
            'password' => 'RahasiaBaru2026!',
            'password_confirmation' => 'Berbeda123!',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password_confirmation']);
    }
}
