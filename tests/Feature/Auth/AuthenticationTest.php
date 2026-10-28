<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_admin_can_only_authenticate_with_the_configured_initial_password(): void
    {
        $this->seed();

        $this->post('/login', [
            'email' => 'admin@unsri.ac.id',
            'password' => 'admin123',
        ]);

        $this->assertGuest();

        $response = $this->post('/login', [
            'email' => 'admin@unsri.ac.id',
            'password' => config('admin.initial_password'),
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_seeding_does_not_reset_an_admin_changed_password(): void
    {
        $this->seed();
        $admin = User::where('email', 'admin@unsri.ac.id')->firstOrFail();
        $admin->update(['password' => 'admin-changed-password']);

        $this->seed();

        $this->assertTrue(password_verify('admin-changed-password', $admin->refresh()->password));
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }
}
