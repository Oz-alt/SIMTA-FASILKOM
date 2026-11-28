<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations to create SIMONITA tables compatible with Supabase exports.
     */
    public function up(): void
    {
        if (! Schema::hasTable('profiles')) {
            Schema::create('profiles', function (Blueprint $table): void {
                $table->string('id', 191)->primary();
                $table->string('department_id', 191)->nullable();
                $table->string('nama', 255)->nullable();
                $table->string('email', 191)->nullable();
                $table->string('nim', 64)->nullable();
                $table->string('nip', 64)->nullable();
                $table->string('role', 50)->nullable()->default('mahasiswa');
                $table->string('kelas', 100)->nullable();
                $table->string('prodi', 150)->nullable();
                $table->string('no_hp', 64)->nullable();
                $table->text('link_wa_group')->nullable();
                $table->string('jabatan_fungsional', 150)->nullable();
                $table->longText('avatar_url')->nullable();
                $table->boolean('is_profile_completed')->nullable()->default(false);
                $table->boolean('requires_password_change')->nullable()->default(false);
                $table->timestamp('created_at')->nullable();
                $table->timestamp('updated_at')->nullable();

                $table->index('nim');
                $table->index('nip');
                $table->index('role');
            });
        }

        if (! Schema::hasTable('advisors')) {
            Schema::create('advisors', function (Blueprint $table): void {
                $table->string('nip', 64)->primary();
                $table->string('id', 191)->nullable();
                $table->string('nama', 255)->nullable();
                $table->string('email', 191)->nullable();
                $table->string('prodi', 150)->nullable();
                $table->string('no_hp', 64)->nullable();
                $table->text('link_wa_group')->nullable();
                $table->string('jabatan_fungsional', 150)->nullable();
                $table->json('keahlian')->nullable();
                $table->integer('kuota_dospem1')->nullable();
                $table->integer('kuota_dospem2')->nullable();
                $table->integer('kuota_bimbingan')->nullable();
                $table->string('status', 50)->nullable()->default('Aktif');
                $table->timestamp('created_at')->nullable();
                $table->timestamp('updated_at')->nullable();

                $table->index('id');
            });
        }

        if (! Schema::hasTable('student_advisors')) {
            Schema::create('student_advisors', function (Blueprint $table): void {
                $table->string('student_nim', 64)->primary();
                $table->string('id', 191)->nullable();
                $table->string('student_nama', 255)->nullable();
                $table->string('kelas', 100)->nullable();
                $table->string('prodi', 150)->nullable();
                $table->string('no_hp', 64)->nullable();
                $table->string('dospem1_nip', 64)->nullable();
                $table->string('dospem2_nip', 64)->nullable();
                $table->text('judul_ta')->nullable();
                $table->string('status_pembagian', 50)->nullable()->default('Ditetapkan');
                $table->boolean('is_verified')->nullable()->default(false);
                $table->timestamp('created_at')->nullable();
                $table->timestamp('updated_at')->nullable();

                $table->index('dospem1_nip');
                $table->index('dospem2_nip');
            });
        }

        if (! Schema::hasTable('thesis_titles')) {
            Schema::create('thesis_titles', function (Blueprint $table): void {
                $table->string('id', 191)->primary();
                $table->string('profile_id', 191)->nullable();
                $table->string('mhs_nim', 64)->nullable();
                $table->string('mhs_nama', 255)->nullable();
                $table->string('mhs_kelas', 100)->nullable();
                $table->string('prodi', 150)->nullable();
                $table->string('angkatan', 20)->nullable();
                $table->text('judul')->nullable();
                $table->text('judul_processed')->nullable();
                $table->longText('deskripsi')->nullable();
                $table->longText('abstrak')->nullable();
                $table->string('status', 50)->nullable()->default('Menunggu Review');
                $table->integer('skor_kemiripan_terakhir')->nullable()->default(0);
                $table->string('pembimbing_1_nip', 64)->nullable();
                $table->string('pembimbing_1_nama', 255)->nullable();
                $table->string('pembimbing_2_nip', 64)->nullable();
                $table->string('pembimbing_2_nama', 255)->nullable();
                $table->boolean('dospem_confirmed')->nullable()->default(false);
                $table->timestamp('dospem_confirmed_at')->nullable();
                $table->text('catatan_kaprodi')->nullable();
                $table->text('catatan_dospem')->nullable();
                $table->string('rekomendasi_dospem_status', 100)->nullable();
                $table->string('rekomendasi_oleh', 255)->nullable();
                $table->json('riwayat_revisi')->nullable();
                $table->timestamp('terakhir_diingatkan_prodi')->nullable();
                $table->integer('jumlah_diingatkan')->nullable()->default(0);
                $table->json('riwayat_pengingat_prodi')->nullable();
                $table->string('status_kelulusan', 50)->nullable();
                $table->string('status_sidang', 50)->nullable();
                $table->string('nilai_sidang', 20)->nullable();
                $table->date('tanggal_lulus')->nullable();
                $table->string('no_sk_lulus', 100)->nullable();
                $table->json('jadwal_sidang')->nullable();
                $table->timestamp('created_at')->nullable();
                $table->timestamp('updated_at')->nullable();

                $table->index('mhs_nim');
                $table->index('status');
                $table->index('created_at');
            });
        }

        if (! Schema::hasTable('thesis_consultations')) {
            Schema::create('thesis_consultations', function (Blueprint $table): void {
                $table->string('id', 191)->primary();
                $table->string('mhs_nim', 64)->nullable();
                $table->string('mhs_nama', 255)->nullable();
                $table->integer('pembimbing')->nullable();
                $table->string('dosen_nama', 255)->nullable();
                $table->string('dosen_nip', 64)->nullable();
                $table->string('metode', 50)->nullable()->default('Offline');
                $table->date('tanggal')->nullable();
                $table->string('waktu', 30)->nullable();
                $table->text('bab_topik')->nullable();
                $table->longText('catatan_mahasiswa')->nullable();
                $table->longText('masukan_dosen')->nullable();
                $table->text('file_revisi_url')->nullable();
                $table->string('status', 50)->nullable()->default('Menunggu Review');
                $table->string('jenis_revisi', 100)->nullable();
                $table->timestamp('reviewed_at')->nullable();
                $table->timestamp('created_at')->nullable();
                $table->timestamp('updated_at')->nullable();

                $table->index('mhs_nim');
                $table->index('dosen_nip');
                $table->index('tanggal');
                $table->index('status');
            });
        }

        if (! Schema::hasTable('thesis_repositories')) {
            Schema::create('thesis_repositories', function (Blueprint $table): void {
                $table->string('id', 191)->primary();
                $table->string('mhs_nim', 64)->nullable();
                $table->string('mhs_nama', 255)->nullable();
                $table->string('prodi', 150)->nullable();
                $table->string('angkatan', 20)->nullable();
                $table->text('judul')->nullable();
                $table->longText('abstrak')->nullable();
                $table->json('kata_kunci')->nullable();
                $table->string('pembimbing_1', 255)->nullable();
                $table->string('pembimbing_2', 255)->nullable();
                $table->string('tahun', 10)->nullable();
                $table->longText('file_url')->nullable();
                $table->longText('pdf_url')->nullable();
                $table->string('file_name', 255)->nullable();
                $table->string('status', 50)->nullable()->default('Pending');
                $table->text('catatan_kaprodi')->nullable();
                $table->timestamp('created_at')->nullable();
                $table->timestamp('updated_at')->nullable();

                $table->index('mhs_nim');
                $table->index('status');
            });
        }

        if (! Schema::hasTable('bookings')) {
            Schema::create('bookings', function (Blueprint $table): void {
                $table->string('id', 191)->primary();
                $table->string('mhs_nim', 64)->nullable();
                $table->string('mhs_nama', 255)->nullable();
                $table->string('ruangan', 150)->nullable();
                $table->date('tanggal')->nullable();
                $table->string('waktu_mulai', 30)->nullable();
                $table->string('waktu_selesai', 30)->nullable();
                $table->string('tahap', 100)->nullable();
                $table->text('keperluan')->nullable();
                $table->string('status', 50)->nullable()->default('Menunggu');
                $table->text('catatan_admin')->nullable();
                $table->timestamp('created_at')->nullable();
                $table->timestamp('updated_at')->nullable();

                $table->index('mhs_nim');
                $table->index('tanggal');
            });
        }

        if (! Schema::hasTable('admin_cms')) {
            Schema::create('admin_cms', function (Blueprint $table): void {
                $table->string('id', 191)->primary();
                $table->text('judul')->nullable();
                $table->string('kategori', 100)->nullable();
                $table->longText('isi')->nullable();
                $table->string('status', 50)->nullable()->default('Published');
                $table->string('penulis', 255)->nullable();
                $table->timestamp('created_at')->nullable();
                $table->timestamp('updated_at')->nullable();

                $table->index('kategori');
            });
        }

        if (! Schema::hasTable('admin_documents')) {
            Schema::create('admin_documents', function (Blueprint $table): void {
                $table->string('id', 191)->primary();
                $table->string('nama', 255)->nullable();
                $table->string('jenis', 100)->nullable();
                $table->text('deskripsi')->nullable();
                $table->string('file_name', 255)->nullable();
                $table->longText('file_url')->nullable();
                $table->date('tanggal_upload')->nullable();
                $table->string('status', 50)->nullable()->default('Aktif');
                $table->string('uploader', 255)->nullable();
                $table->timestamp('created_at')->nullable();
                $table->timestamp('updated_at')->nullable();
            });
        }

        if (! Schema::hasTable('admin_templates')) {
            Schema::create('admin_templates', function (Blueprint $table): void {
                $table->string('id', 191)->primary();
                $table->string('nama', 255)->nullable();
                $table->string('jenis', 100)->nullable();
                $table->text('deskripsi')->nullable();
                $table->string('file_name', 255)->nullable();
                $table->longText('file_url')->nullable();
                $table->string('ukuran', 50)->nullable();
                $table->string('status', 50)->nullable()->default('Aktif');
                $table->timestamp('created_at')->nullable();
                $table->timestamp('updated_at')->nullable();
            });
        }

        if (! Schema::hasTable('student_credentials')) {
            Schema::create('student_credentials', function (Blueprint $table): void {
                $table->string('nim', 64)->primary();
                $table->string('password_hash', 255)->nullable();
                $table->boolean('is_profile_completed')->nullable()->default(false);
                $table->boolean('has_password')->nullable()->default(false);
                $table->string('nama', 255)->nullable();
                $table->string('no_hp', 64)->nullable();
                $table->string('kelas', 100)->nullable();
                $table->string('prodi', 150)->nullable();
                $table->timestamp('created_at')->nullable();
                $table->timestamp('updated_at')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'student_credentials',
            'admin_templates',
            'admin_documents',
            'admin_cms',
            'bookings',
            'thesis_repositories',
            'thesis_consultations',
            'thesis_titles',
            'student_advisors',
            'advisors',
            'profiles',
        ];

        foreach ($tables as $tableName) {
            Schema::dropIfExists($tableName);
        }
    }
};
