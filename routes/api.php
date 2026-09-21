
Route::get('/get-dosen', function () { return App\Models\User::where('role', 'dosen')->orWhere('role', 'pembimbing')->first(); });
