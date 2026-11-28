<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run schema fixes for strict MySQL compatibility and create cross-device polling events table.
     */
    public function up(): void
    {
        if (Schema::hasTable('thesis_consultations') && Schema::hasColumn('thesis_consultations', 'pembimbing')) {
            Schema::table('thesis_consultations', function (Blueprint $table): void {
                $table->string('pembimbing', 50)->nullable()->change();
            });
        }

        if (Schema::hasTable('thesis_repositories')) {
            Schema::table('thesis_repositories', function (Blueprint $table): void {
                if (! Schema::hasColumn('thesis_repositories', 'abstrak_en')) {
                    $table->longText('abstrak_en')->nullable()->after('abstrak');
                }
                if (! Schema::hasColumn('thesis_repositories', 'penulis_nama')) {
                    $table->string('penulis_nama', 255)->nullable()->after('mhs_nama');
                }
                if (! Schema::hasColumn('thesis_repositories', 'penulis_nim')) {
                    $table->string('penulis_nim', 64)->nullable()->after('mhs_nim');
                }
                if (! Schema::hasColumn('thesis_repositories', 'kelas')) {
                    $table->string('kelas', 100)->nullable()->after('prodi');
                }
                if (! Schema::hasColumn('thesis_repositories', 'tahun_angkatan')) {
                    $table->string('tahun_angkatan', 20)->nullable()->after('angkatan');
                }
                if (! Schema::hasColumn('thesis_repositories', 'tahun_lulus')) {
                    $table->string('tahun_lulus', 20)->nullable()->after('tahun');
                }
                if (! Schema::hasColumn('thesis_repositories', 'penguji_1')) {
                    $table->string('penguji_1', 255)->nullable()->after('pembimbing_2');
                }
                if (! Schema::hasColumn('thesis_repositories', 'penguji_2')) {
                    $table->string('penguji_2', 255)->nullable()->after('penguji_1');
                }
                if (! Schema::hasColumn('thesis_repositories', 'file_pdf_url')) {
                    $table->longText('file_pdf_url')->nullable()->after('pdf_url');
                }
                if (! Schema::hasColumn('thesis_repositories', 'approved_by_kaprodi')) {
                    $table->string('approved_by_kaprodi', 255)->nullable()->after('catatan_kaprodi');
                }
            });
        }

        if (Schema::hasTable('bookings')) {
            Schema::table('bookings', function (Blueprint $table): void {
                if (! Schema::hasColumn('bookings', 'booking_code')) {
                    $table->string('booking_code', 64)->nullable()->after('id');
                }
                if (! Schema::hasColumn('bookings', 'room_id')) {
                    $table->string('room_id', 191)->nullable()->after('ruangan');
                }
                if (! Schema::hasColumn('bookings', 'thesis_stage_id')) {
                    $table->string('thesis_stage_id', 191)->nullable()->after('tahap');
                }
                if (! Schema::hasColumn('bookings', 'booking_date')) {
                    $table->date('booking_date')->nullable()->after('tanggal');
                }
                if (! Schema::hasColumn('bookings', 'start_time')) {
                    $table->string('start_time', 30)->nullable()->after('waktu_mulai');
                }
                if (! Schema::hasColumn('bookings', 'end_time')) {
                    $table->string('end_time', 30)->nullable()->after('waktu_selesai');
                }
                if (! Schema::hasColumn('bookings', 'rejection_reason')) {
                    $table->text('rejection_reason')->nullable()->after('catatan_admin');
                }
            });
        }

        if (! Schema::hasTable('simta_realtime_events')) {
            Schema::create('simta_realtime_events', function (Blueprint $table): void {
                $table->id();
                $table->string('event_id', 100)->unique();
                $table->string('type', 100)->index();
                $table->json('payload')->nullable();
                $table->bigInteger('created_at_ms')->index();
                $table->timestamp('created_at')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('simta_realtime_events');
    }
};
