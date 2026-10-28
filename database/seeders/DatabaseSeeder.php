<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $adminInitialPassword = config('admin.initial_password');

        if (! is_string($adminInitialPassword) || $adminInitialPassword === '') {
            throw new \RuntimeException('ADMIN_INITIAL_PASSWORD must be configured before seeding.');
        }

        User::firstOrCreate(
            ['email' => 'admin@unsri.ac.id'],
            [
                'name' => 'Admin',
                'password' => Hash::make($adminInitialPassword),
            ]
        );

        // Kaprodi: Username "Koprodi", Password "Koprodi123"
        User::updateOrCreate(
            ['email' => 'koprodi@unsri.ac.id'],
            [
                'name' => 'Dr. Abdiansah, S.Kom., M.Cs.',
                'password' => bcrypt('Koprodi123'),
            ]
        );

        // Dosen: NIP / Login 198410012009121005
        User::updateOrCreate(
            ['email' => 'abdiansah@unsri.ac.id'],
            [
                'name' => 'Dr. Abdiansah, S.Kom., M.Cs.',
                'password' => bcrypt('198410012009121005'),
            ]
        );

    }
}
