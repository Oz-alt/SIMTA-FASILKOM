<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SimtaApiEndpointsTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Ensure query endpoint blocks restricted tables and unfiltered mutations.
     */
    public function test_query_api_blocks_sensitive_tables_and_unfiltered_mutations(): void
    {
        $this->postJson('/api/simta/query', [
            'table' => 'student_credentials',
            'action' => 'select',
        ])->assertStatus(403);

        $this->postJson('/api/simta/query', [
            'table' => 'users',
            'action' => 'select',
        ])->assertStatus(403);

        $this->postJson('/api/simta/query', [
            'table' => 'thesis_titles',
            'action' => 'update',
            'payload' => ['status' => 'disetujui'],
            'filters' => [],
        ])->assertStatus(422);

        $this->postJson('/api/simta/query', [
            'table' => 'thesis_titles',
            'action' => 'delete',
            'filters' => [],
        ])->assertStatus(422);
    }

    /**
     * Ensure query API supports insert, upsert, select with OR filters, update returning, and delete cleanly.
     */
    public function test_query_api_supports_crud_upsert_and_json_roundtrip(): void
    {
        $insertRes = $this->postJson('/api/simta/query', [
            'table' => 'advisors',
            'action' => 'upsert',
            'onConflict' => 'nip',
            'returning' => true,
            'payload' => [[
                'id' => 'adv-test-1',
                'nip' => '198410012009121005',
                'nama' => 'Dr. Abdiansah',
                'keahlian' => ['AI', 'NLP'],
                'kuota_dospem1' => 10,
                'status' => 'Aktif',
            ]],
        ]);

        $insertRes->assertOk();
        $this->assertSame(['AI', 'NLP'], $insertRes->json('data.0.keahlian'));
        $this->assertSame(10, $insertRes->json('data.0.kuota_dospem1'));

        $this->postJson('/api/simta/query', [
            'table' => 'profiles',
            'action' => 'insert',
            'payload' => [
                'id' => 'prof-1',
                'nim' => '09010282428031',
                'nip' => '09010282428031',
                'nama' => 'Mahasiswa Uji',
                'role' => 'mahasiswa',
            ],
        ])->assertOk();

        $orRes = $this->postJson('/api/simta/query', [
            'table' => 'profiles',
            'action' => 'select',
            'columns' => 'id,nim,nama',
            'filters' => [
                ['type' => 'or', 'expression' => 'nim.eq.09010282428031,nip.eq.09010282428031'],
            ],
            'maybeSingle' => true,
        ]);

        $orRes->assertOk();
        $this->assertSame('prof-1', $orRes->json('data.id'));

        $this->postJson('/api/simta/query', [
            'table' => 'thesis_consultations',
            'action' => 'insert',
            'payload' => [
                'id' => 'cons-1',
                'mhs_nim' => '09010282428031',
                'pembimbing' => 'Pembimbing 1',
                'bab_topik' => 'Bab 1 Pendahuluan',
                'status' => 'menunggu_tanggapan',
            ],
        ])->assertOk();

        $updateRes = $this->postJson('/api/simta/query', [
            'table' => 'thesis_consultations',
            'action' => 'update',
            'columns' => 'id',
            'returning' => true,
            'filters' => [
                ['type' => 'eq', 'column' => 'id', 'value' => 'cons-1'],
            ],
            'payload' => [
                'status' => 'disetujui',
                'jenis_revisi' => 'Diterima',
            ],
        ]);

        $updateRes->assertOk();
        $this->assertSame('cons-1', $updateRes->json('data.0.id'));
        $this->assertSame('Pembimbing 1', DB::table('thesis_consultations')->where('id', 'cons-1')->value('pembimbing'));
    }

    /**
     * Ensure RPC endpoints hash/verify student passwords securely without leaking password_hash.
     */
    public function test_rpc_endpoints_manage_student_credentials_and_similarity_securely(): void
    {
        $defaultCheck = $this->postJson('/api/simta/rpc/verify_student_password', [
            'p_nim' => '09010282428031',
            'p_password' => '09010282428031',
        ]);
        $defaultCheck->assertOk();
        $this->assertTrue($defaultCheck->json('data'));

        $this->postJson('/api/simta/rpc/save_student_credential', [
            'p_nim' => '09010282428031',
            'p_password' => 'Rahasia2026!',
            'p_is_profile_completed' => true,
        ])->assertOk();

        $statusRes = $this->postJson('/api/simta/rpc/get_student_credential', [
            'p_nim' => '09010282428031',
        ]);
        $statusRes->assertOk();
        $this->assertTrue($statusRes->json('data.0.has_password'));
        $this->assertTrue($statusRes->json('data.0.is_profile_completed'));
        $this->assertArrayNotHasKey('password_hash', $statusRes->json('data.0'));

        $rejectDefault = $this->postJson('/api/simta/rpc/verify_student_password', [
            'p_nim' => '09010282428031',
            'p_password' => '09010282428031',
        ]);
        $rejectDefault->assertOk();
        $this->assertFalse($rejectDefault->json('data'));

        $acceptCustom = $this->postJson('/api/simta/rpc/verify_student_password', [
            'p_nim' => '09010282428031',
            'p_password' => 'Rahasia2026!',
        ]);
        $acceptCustom->assertOk();
        $this->assertTrue($acceptCustom->json('data'));

        DB::table('thesis_titles')->insert([
            'id' => 'title-sim-1',
            'judul' => 'Implementasi Sistem Monitoring Bimbingan Tugas Akhir',
            'status' => 'disetujui',
        ]);

        $simRes = $this->postJson('/api/simta/rpc/check_title_similarity', [
            'input_title' => 'Sistem Monitoring Bimbingan Tugas Akhir',
        ]);
        $simRes->assertOk();
        $this->assertGreaterThan(50, $simRes->json('data.0.skor_gabungan'));
    }

    /**
     * Ensure storage API uploads and serves repository PDFs while rejecting path traversal.
     */
    public function test_storage_api_uploads_and_serves_files_safely(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->create('laporan.pdf', 128, 'application/pdf');

        $uploadRes = $this->post('/api/simta/storage/upload', [
            'bucket' => 'repository-docs',
            'path' => 'laporan-akhir/laporan-09010282428031.pdf',
            'file' => $file,
        ]);

        $uploadRes->assertOk();
        $publicUrl = $uploadRes->json('data.publicUrl');
        $this->assertSame('/api/simta/storage/repository-docs/laporan-akhir/laporan-09010282428031.pdf', $publicUrl);
        Storage::disk('public')->assertExists('repository-docs/laporan-akhir/laporan-09010282428031.pdf');

        $this->get($publicUrl)->assertOk();

        $this->postJson('/api/simta/storage/upload', [
            'bucket' => 'repository-docs',
            'path' => '../.env',
            'file' => $file,
        ])->assertStatus(422);
    }

    /**
     * Ensure realtime polling endpoint tracks cursors and avoids duplicate replay on mount.
     */
    public function test_realtime_api_broadcasts_and_polls_incrementally(): void
    {
        $this->postJson('/api/simta/realtime/broadcast', [
            'id' => 'evt-1',
            'type' => 'THESIS_TITLE_SUBMITTED',
            'payload' => ['title' => 'Judul Pertama'],
        ])->assertOk();

        $cursorRes = $this->getJson('/api/simta/realtime/events?cursor_only=1');
        $cursorRes->assertOk();
        $cursorId = $cursorRes->json('latest_id');
        $this->assertGreaterThan(0, $cursorId);
        $this->assertSame([], $cursorRes->json('events'));

        $this->postJson('/api/simta/realtime/broadcast', [
            'id' => 'evt-2',
            'type' => 'BIMBINGAN_ENTRY_SUBMITTED',
            'payload' => ['bab_topik' => 'Bab 2'],
        ])->assertOk();

        $pollRes = $this->getJson("/api/simta/realtime/events?after_id={$cursorId}");
        $pollRes->assertOk();
        $this->assertCount(1, $pollRes->json('events'));
        $this->assertSame('evt-2', $pollRes->json('events.0.id'));
    }
}
