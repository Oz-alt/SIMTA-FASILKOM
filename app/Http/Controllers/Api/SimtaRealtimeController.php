<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SimtaRealtimeController extends Controller
{
    /**
     * Store a cross-device realtime event envelope so polling clients receive notifications without WebSockets.
     */
    public function broadcast(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => ['required', 'string', 'max:100'],
            'type' => ['required', 'string', 'max:100'],
            'payload' => ['nullable', 'array'],
            'timestamp' => ['nullable', 'integer'],
        ]);

        if (! Schema::hasTable('simta_realtime_events')) {
            return response()->json(['ok' => false]);
        }

        $nowMs = (int) floor(microtime(true) * 1000);
        $cutoffMs = $nowMs - (24 * 60 * 60 * 1000);

        DB::table('simta_realtime_events')->where('created_at_ms', '<', $cutoffMs)->delete();

        DB::table('simta_realtime_events')->insertOrIgnore([
            'event_id' => $validated['id'],
            'type' => $validated['type'],
            'payload' => json_encode($validated['payload'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'created_at_ms' => $validated['timestamp'] ?? $nowMs,
            'created_at' => now()->utc()->format('Y-m-d H:i:s'),
        ]);

        return response()->json(['ok' => true]);
    }

    /**
     * Poll newly published cross-device realtime events incrementally via after_id cursor.
     */
    public function events(Request $request): JsonResponse
    {
        if (! Schema::hasTable('simta_realtime_events')) {
            return response()->json([
                'latest_id' => 0,
                'events' => [],
            ]);
        }

        $cursorOnly = $request->boolean('cursor_only', false);
        $afterId = max(0, (int) $request->query('after_id', 0));
        $latestId = (int) (DB::table('simta_realtime_events')->max('id') ?? 0);

        if ($cursorOnly) {
            return response()->json([
                'latest_id' => $latestId,
                'events' => [],
            ]);
        }

        $rows = DB::table('simta_realtime_events')
            ->where('id', '>', $afterId)
            ->orderBy('id', 'asc')
            ->limit(50)
            ->get();

        $events = [];

        foreach ($rows as $row) {
            $decodedPayload = is_string($row->payload) ? json_decode($row->payload, true) : $row->payload;
            $events[] = [
                'cursor_id' => (int) $row->id,
                'id' => $row->event_id,
                'type' => $row->type,
                'payload' => is_array($decodedPayload) ? $decodedPayload : [],
                'timestamp' => (int) $row->created_at_ms,
            ];
            $latestId = max($latestId, (int) $row->id);
        }

        return response()->json([
            'latest_id' => $latestId,
            'events' => $events,
        ]);
    }
}
