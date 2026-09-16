-- ====================================================================
-- SIMTA Similarity Engine Stored RPC Procedure
-- Calculates composite similarity score using FTS + Trigram
-- ====================================================================

CREATE OR REPLACE FUNCTION public.check_title_similarity(
    input_title TEXT,
    w1 NUMERIC DEFAULT 0.6,
    w2 NUMERIC DEFAULT 0.4
)
RETURNS TABLE (
    matched_id UUID,
    matched_title TEXT,
    matched_processed TEXT,
    source_type TEXT,
    skor_fts NUMERIC,
    skor_trigram NUMERIC,
    skor_gabungan NUMERIC
) 
LANGUAGE plpgsql
AS $$
DECLARE
    processed_input TEXT;
BEGIN
    -- 1. Pre-process input text (lowercase, strip symbols)
    processed_input := lower(regexp_replace(input_title, '[^a-zA-Z0-9\s]', '', 'g'));
    
    RETURN QUERY
    WITH combined_matches AS (
        -- Search in existing active thesis_titles
        SELECT 
            t.id AS matched_id,
            t.judul AS matched_title,
            t.judul_processed AS matched_processed,
            'thesis_titles'::TEXT AS source_type,
            COALESCE(ts_rank(to_tsvector('indonesian', t.judul_processed), plainto_tsquery('indonesian', processed_input)), 0)::NUMERIC AS raw_fts,
            COALESCE(similarity(t.judul_processed, processed_input), 0)::NUMERIC AS raw_trigram
        FROM public.thesis_titles t
        WHERE t.judul_processed IS NOT NULL AND t.status IN ('diajukan', 'disetujui')

        UNION ALL

        -- Search in historical imported titles
        SELECT 
            h.id AS matched_id,
            h.judul AS matched_title,
            h.judul_processed AS matched_processed,
            'historical_imports'::TEXT AS source_type,
            COALESCE(ts_rank(to_tsvector('indonesian', h.judul_processed), plainto_tsquery('indonesian', processed_input)), 0)::NUMERIC AS raw_fts,
            COALESCE(similarity(h.judul_processed, processed_input), 0)::NUMERIC AS raw_trigram
        FROM public.historical_imports h
        WHERE h.judul_processed IS NOT NULL
    )
    SELECT 
        cm.matched_id,
        cm.matched_title,
        cm.matched_processed,
        cm.source_type,
        ROUND((cm.raw_fts * 100)::NUMERIC, 2) AS skor_fts,
        ROUND((cm.raw_trigram * 100)::NUMERIC, 2) AS skor_trigram,
        LEAST(100.00, ROUND(((w1 * LEAST(cm.raw_fts, 1.0) + w2 * cm.raw_trigram) * 100)::NUMERIC, 2)) AS skor_gabungan
    FROM combined_matches cm
    WHERE cm.raw_trigram > 0.15 OR cm.raw_fts > 0.1
    ORDER BY skor_gabungan DESC
    LIMIT 10;
END;
$$;
