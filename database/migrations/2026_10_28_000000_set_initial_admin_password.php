<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $adminInitialPassword = config('admin.initial_password');

        if (! is_string($adminInitialPassword) || $adminInitialPassword === '') {
            throw new RuntimeException('ADMIN_INITIAL_PASSWORD must be configured before migrating.');
        }

        DB::table('users')
            ->where('email', 'admin@unsri.ac.id')
            ->update([
                'password' => Hash::make($adminInitialPassword),
                'updated_at' => now(),
            ]);
    }

    /**
     * The previous password cannot be restored safely.
     */
    public function down(): void {}
};
