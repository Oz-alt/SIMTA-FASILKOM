<?php

namespace App\Http\Controllers;

use App\Mail\DefenseScheduleMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class DefenseScheduleNotificationController extends Controller
{
    /**
     * Kirim notifikasi jadwal sidang dari Kaprodi ke email aktif mahasiswa via SMTP.
     */
    public function sendScheduleEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'mhs_nama' => ['required', 'string', 'max:255'],
            'mhs_nim' => ['required', 'string', 'max:50'],
            'prodi' => ['nullable', 'string', 'max:255'],
            'judul' => ['nullable', 'string', 'max:1000'],
            'jenis_sidang' => ['required', 'string', 'max:100'],
            'tanggal' => ['required', 'string', 'max:50'],
            'waktu_mulai' => ['required', 'string', 'max:20'],
            'waktu_selesai' => ['required', 'string', 'max:20'],
            'ruangan' => ['required', 'string', 'max:255'],
            'ketua_penguji_nama' => ['nullable', 'string', 'max:255'],
            'sekretaris_nama' => ['nullable', 'string', 'max:255'],
            'penguji1_nama' => ['nullable', 'string', 'max:255'],
            'penguji2_nama' => ['nullable', 'string', 'max:255'],
            'catatan' => ['nullable', 'string', 'max:2000'],
            'link_berkas' => ['nullable', 'string', 'max:1000'],
            'is_update' => ['nullable', 'boolean'],
        ]);

        $email = trim($validated['email']);

        if (preg_match('/@student\.unsri\.ac\.id$/i', $email)) {
            return response()->json([
                'success' => false,
                'status' => 'invalid_domain',
                'message' => 'Email @student.unsri.ac.id tidak dapat menerima notifikasi sistem. Minta mahasiswa mengisi email aktif (misal Gmail) di halaman Profil.',
                'email' => $email,
            ], 200);
        }

        try {
            $mailer = config('mail.default');
            $smtpHost = config('mail.mailers.smtp.host');
            $smtpUser = config('mail.mailers.smtp.username');

            if ($mailer === 'smtp' && (empty($smtpHost) || empty($smtpUser) || $smtpHost === '127.0.0.1')) {
                throw new \Exception('Server SMTP belum dikonfigurasi di file .env (MAIL_HOST / MAIL_USERNAME masih kosong atau 127.0.0.1).');
            }

            Mail::to($email)->send(new DefenseScheduleMail(
                mhsNama: trim($validated['mhs_nama']),
                mhsNim: trim($validated['mhs_nim']),
                prodi: trim($validated['prodi'] ?? 'D3 Manajemen Informatika'),
                judul: trim($validated['judul'] ?? '-'),
                jenisSidang: trim($validated['jenis_sidang']),
                tanggal: trim($validated['tanggal']),
                waktuMulai: trim($validated['waktu_mulai']),
                waktuSelesai: trim($validated['waktu_selesai']),
                ruangan: trim($validated['ruangan']),
                ketuaPenguji: trim($validated['ketua_penguji_nama'] ?? ''),
                sekretaris: trim($validated['sekretaris_nama'] ?? ''),
                penguji1: trim($validated['penguji1_nama'] ?? ''),
                penguji2: trim($validated['penguji2_nama'] ?? ''),
                catatan: trim($validated['catatan'] ?? ''),
                linkBerkas: trim($validated['link_berkas'] ?? ''),
                isUpdate: (bool) ($validated['is_update'] ?? false),
            ));

            Log::info("Email jadwal sidang berhasil dikirim ke {$email} untuk mahasiswa {$validated['mhs_nama']} ({$validated['mhs_nim']}).");

            return response()->json([
                'success' => true,
                'status' => 'sent',
                'message' => "Undangan jadwal sidang berhasil dikirim ke {$email}.",
                'email' => $email,
                'sent_at' => now()->toIso8601String(),
            ]);
        } catch (\Throwable $e) {
            Log::warning("Gagal mengirim email jadwal sidang ke {$email}: ".$e->getMessage());

            return response()->json([
                'success' => false,
                'status' => 'failed',
                'message' => 'Gagal mengirim email jadwal sidang: '.$e->getMessage(),
                'email' => $email,
                'error_detail' => $e->getMessage(),
            ], 200);
        }
    }
}

