
<?php

use App\Http\Controllers\PasswordResetProtocolController;
use App\Models\User;
use Illuminate\Support\Facades\Route;

Route::get('/get-dosen', function () {
    return User::where('role', 'dosen')->orWhere('role', 'pembimbing')->first();
});

// SIMONITA Password Reset Protocol Endpoints
Route::post('/password-reset/send-email', [PasswordResetProtocolController::class, 'sendResetEmail']);
Route::post('/password-reset/complete', [PasswordResetProtocolController::class, 'completeReset']);
