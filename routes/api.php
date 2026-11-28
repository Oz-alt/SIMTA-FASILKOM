<?php

use App\Http\Controllers\Api\SimtaQueryController;
use App\Http\Controllers\Api\SimtaRealtimeController;
use App\Http\Controllers\Api\SimtaRpcController;
use App\Http\Controllers\Api\SimtaStorageController;
use App\Http\Controllers\DefenseScheduleNotificationController;
use App\Http\Controllers\PasswordResetProtocolController;
use App\Models\User;
use Illuminate\Support\Facades\Route;

Route::get('/get-dosen', function () {
    return User::where('role', 'dosen')->orWhere('role', 'pembimbing')->first();
});

// SIMONITA Password Reset Protocol Endpoints
Route::post('/password-reset/send-email', [PasswordResetProtocolController::class, 'sendResetEmail']);
Route::post('/password-reset/complete', [PasswordResetProtocolController::class, 'completeReset']);

// SIMONITA Defense Schedule Email Notification Endpoint
Route::post('/defense-schedules/send-email', [DefenseScheduleNotificationController::class, 'sendScheduleEmail']);

// SIMONITA MySQL/Laravel Backend API (Menggantikan Supabase PostgREST, RPC, Storage & Realtime)
Route::prefix('simta')->group(function (): void {
    Route::post('/query', [SimtaQueryController::class, 'handle']);
    Route::post('/rpc/{function}', [SimtaRpcController::class, 'handle']);
    Route::post('/storage/upload', [SimtaStorageController::class, 'upload']);
    Route::get('/storage/{bucket}/{path}', [SimtaStorageController::class, 'show'])->where('path', '.*');
    Route::post('/realtime/broadcast', [SimtaRealtimeController::class, 'broadcast']);
    Route::get('/realtime/events', [SimtaRealtimeController::class, 'events']);
});
