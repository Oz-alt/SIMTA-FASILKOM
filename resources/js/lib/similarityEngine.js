/**
 * SIMTA Similarity Check Engine
 * Dual-Layer Hybrid Architecture:
 * 1. Layer Judul (Title): Trigram Jaccard + Weighted Token Overlap (Indonesian D3 MI/Fasilkom Domain)
 * 2. Layer Abstrak (Abstract): Bilingual (ID <-> EN) Concept & Keyphrase Thesaurus + Token Overlap
 * 3. Benchmark Dataset: Real Historical Archives linked to UNSRI Repository (http://repository.unsri.ac.id/)
 */

import {
  preProcessTitle,
  preProcessAbstract,
  extractKeyConcepts,
  getSimilarityThreshold
} from '../services/titleService.js';

/**
 * Generates character trigrams set from a string.
 * @param {string} str
 * @returns {Set<string>}
 */
export function getTrigrams(str) {
  const trigrams = new Set();
  const clean = `  ${String(str || '').toLowerCase()}  `;
  for (let i = 0; i < clean.length - 2; i++) {
    trigrams.add(clean.substring(i, i + 3));
  }
  return trigrams;
}

/**
 * Calculates Trigram similarity ratio between two strings (0.0 to 1.0)
 * Uses Jaccard similarity index on character 3-grams.
 */
export function calculateTrigramSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1.0;

  const t1 = getTrigrams(str1);
  const t2 = getTrigrams(str2);

  if (t1.size === 0 || t2.size === 0) return 0;

  let intersectionCount = 0;
  for (const tri of t1) {
    if (t2.has(tri)) {
      intersectionCount++;
    }
  }

  const unionCount = new Set([...t1, ...t2]).size;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * Calculates Token / Word Overlap ratio with Containment & Jaccard
 */
export function calculateTokenOverlap(str1, str2) {
  const tokens1 = new Set(String(str1 || '').split(' ').filter(t => t.length > 0));
  const tokens2 = new Set(String(str2 || '').split(' ').filter(t => t.length > 0));

  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let common = 0;
  for (const t of tokens1) {
    if (tokens2.has(t)) {
      common++;
    }
  }

  const minLen = Math.min(tokens1.size, tokens2.size);
  const maxLen = Math.max(tokens1.size, tokens2.size);
  const unionLen = new Set([...tokens1, ...tokens2]).size;

  // Blended score: 60% containment (how much shorter text is in longer text) + 40% Jaccard
  const containment = common / minLen;
  const jaccard = unionLen === 0 ? 0 : common / unionLen;

  return (0.6 * containment) + (0.4 * jaccard);
}

/**
 * Calculates Title Similarity between two titles (0.0 to 1.0)
 * Weights: 55% Token Overlap (after removing domain noise) + 45% Character Trigram
 */
export function calculateTitleSimilarity(title1, title2) {
  const p1 = preProcessTitle(title1);
  const p2 = preProcessTitle(title2);

  if (!p1 || !p2) return 0;
  if (p1 === p2) return 1.0;

  const fts = calculateTokenOverlap(p1, p2);
  const trigram = calculateTrigramSimilarity(p1, p2);

  return Math.min(1.0, (0.55 * fts) + (0.45 * trigram));
}

/**
 * Calculates Abstract Similarity with Bilingual Concept & Keyword Extraction (0.0 to 1.0)
 * Overcomes language differences (Indonesian input vs English repo abstract, or vice versa)
 */
export function calculateAbstractSimilarity(abstract1, abstract2) {
  if (!abstract1 || !abstract2) return 0;

  // 1. Concept matching via Bilingual Thesaurus (ID <-> EN)
  const concepts1 = extractKeyConcepts(abstract1);
  const concepts2 = extractKeyConcepts(abstract2);

  let conceptScore = 0;
  const matchedConcepts = [];

  if (concepts1.length > 0 && concepts2.length > 0) {
    const keys2 = new Set(concepts2.map(c => c.key));
    let commonConcepts = 0;

    for (const c1 of concepts1) {
      if (keys2.has(c1.key)) {
        commonConcepts++;
        matchedConcepts.push(c1.label);
      }
    }

    const minConcepts = Math.min(concepts1.length, concepts2.length);
    const unionConcepts = new Set([...concepts1.map(c => c.key), ...concepts2.map(c => c.key)]).size;

    conceptScore = minConcepts === 0 ? 0 : (0.7 * (commonConcepts / minConcepts)) + (0.3 * (commonConcepts / unionConcepts));
  }

  // 2. Pre-processed token overlap (removes stop-words in both ID & EN)
  const p1 = preProcessAbstract(abstract1);
  const p2 = preProcessAbstract(abstract2);
  const tokenScore = calculateTokenOverlap(p1, p2);

  // 3. Trigram similarity on core token string
  const trigramScore = calculateTrigramSimilarity(p1, p2);

  // If concept matches exist, weigh them heavily (concept 50%, tokens 30%, trigram 20%)
  // If no predefined concepts extracted, rely on token & trigram
  let finalScore = 0;
  if (concepts1.length > 0 && concepts2.length > 0) {
    finalScore = (0.50 * conceptScore) + (0.30 * tokenScore) + (0.20 * trigramScore);
  } else {
    finalScore = (0.60 * tokenScore) + (0.40 * trigramScore);
  }

  return {
    score: Math.min(1.0, finalScore),
    matchedConcepts
  };
}

/**
 * Calculates Multi-Field Similarity for a single candidate against input Title & Abstract
 */
export function calculateThesisSimilarity(inputTitle, inputAbstract, candidateTitle, candidateAbstract) {
  const titleScore = calculateTitleSimilarity(inputTitle, candidateTitle);

  // Determine if abstract comparison is active
  const hasInputAbstract = inputAbstract && inputAbstract.trim().length >= 30;
  const hasCandAbstract = candidateAbstract && candidateAbstract.trim().length >= 30;

  let abstractScore = 0;
  let matchedConcepts = [];

  if (hasInputAbstract && hasCandAbstract) {
    const absResult = calculateAbstractSimilarity(inputAbstract, candidateAbstract);
    abstractScore = absResult.score;
    matchedConcepts = absResult.matchedConcepts;
  } else if (hasInputAbstract && !hasCandAbstract) {
    // Fallback: match input abstract concepts against candidate title
    const absResult = calculateAbstractSimilarity(inputAbstract, candidateTitle);
    abstractScore = absResult.score * 0.7; // slight discount for title-only
    matchedConcepts = absResult.matchedConcepts;
  } else {
    // No abstract provided by user: abstract score equals title score
    abstractScore = titleScore;
  }

  // Also extract concept matches between titles
  const titleConcepts1 = extractKeyConcepts(inputTitle);
  const titleConcepts2 = extractKeyConcepts(candidateTitle);
  const titleKeys2 = new Set(titleConcepts2.map(c => c.key));
  for (const c of titleConcepts1) {
    if (titleKeys2.has(c.key) && !matchedConcepts.includes(c.label)) {
      matchedConcepts.push(c.label);
    }
  }

  // Calculate composite weighted score
  // If abstract provided: 50% Judul + 50% Abstrak
  // If abstract not provided: 100% Judul
  let compositeScore = 0;
  if (hasInputAbstract) {
    compositeScore = (0.50 * titleScore) + (0.50 * abstractScore);
  } else {
    compositeScore = titleScore;
  }

  const titleScorePercent = Math.min(100, Math.round(titleScore * 100));
  const abstractScorePercent = Math.min(100, Math.round(abstractScore * 100));
  const compositePercent = Math.min(100, Math.round(compositeScore * 100));

  return {
    skor_judul: titleScorePercent,
    skor_abstrak: abstractScorePercent,
    skor_gabungan: compositePercent,
    matched_keywords: matchedConcepts
  };
}

/**
 * Main Multi-Field Similarity Checker against both Database Titles and UNSRI Thesis Archives
 * @param {string} inputTitle - Mahasiswa proposed title
 * @param {string} inputAbstract - Mahasiswa proposed abstract (Indonesian or English)
 * @param {Array} databaseTitles - Active student thesis titles / historical titles
 * @param {Array} databaseArchives - MOCK_THESIS_ARCHIVES linked to UNSRI Repository
 * @param {Object} options - { limit: 8, thresholdMin: 10 }
 */
export function checkClientMultiFieldSimilarity(
  inputTitle,
  inputAbstract = '',
  databaseTitles = [],
  databaseArchives = [],
  options = {}
) {
  const processedTitle = preProcessTitle(inputTitle);
  if (!processedTitle || processedTitle.length < 3) {
    return {
      highestScore: 0,
      highestTitleScore: 0,
      highestAbstractScore: 0,
      processedInput: '',
      hasAbstract: false,
      matches: []
    };
  }

  const limit = options.limit || 8;
  const thresholdMin = options.thresholdMin !== undefined ? options.thresholdMin : 10;
  const hasAbstract = Boolean(inputAbstract && inputAbstract.trim().length >= 30);

  // Combine and deduplicate candidates
  const candidatePool = [];
  const seenKeys = new Set();

  // 1. Ingest thesisArchives (Primary benchmark linked to UNSRI Repository)
  if (Array.isArray(databaseArchives)) {
    for (const arc of databaseArchives) {
      if (!arc || !arc.judul) continue;
      const key = (arc.link_repo_unsri || arc.id || arc.judul).toLowerCase().trim();
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        candidatePool.push({
          id: arc.id || `arc-${seenKeys.size}`,
          judul: arc.judul,
          abstrak: arc.abstrak || '',
          penulis: arc.penulis_nama || arc.penulis || 'Alumni / Peneliti UNSRI',
          tahun: arc.tahun_ta || arc.tahun_lulus || arc.tahun_angkatan || '2026',
          prodi: arc.prodi || 'D3 Manajemen Informatika',
          pembimbing: arc.pembimbing_1 || arc.pembimbing || '',
          link_repo_unsri: arc.link_repo_unsri || arc.file_pdf_url || '',
          source: 'repo_unsri'
        });
      }
    }
  }

  // 2. Ingest active database titles / other historical titles
  if (Array.isArray(databaseTitles)) {
    for (const item of databaseTitles) {
      if (!item || !item.judul) continue;
      const key = (item.id || item.judul).toLowerCase().trim();
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        candidatePool.push({
          id: item.id || `title-${seenKeys.size}`,
          judul: item.judul,
          abstrak: item.abstrak || item.deskripsi || '',
          penulis: item.mhs_nama || item.penulis || 'Mahasiswa Aktif',
          tahun: item.tahun_angkatan || item.angkatan || '2025/2026',
          prodi: item.prodi || 'D3 Manajemen Informatika',
          pembimbing: item.pembimbing_1_nama || item.pembimbing_1 || '',
          link_repo_unsri: item.link_repo_unsri || '',
          source: item.source_type || 'thesis_titles'
        });
      }
    }
  }

  // Score all candidates
  const scoredCandidates = candidatePool.map(candidate => {
    const sim = calculateThesisSimilarity(inputTitle, inputAbstract, candidate.judul, candidate.abstrak);

    // Generate abstract preview
    let abstrakPreview = '';
    if (candidate.abstrak) {
      abstrakPreview = candidate.abstrak.length > 170
        ? `${candidate.abstrak.substring(0, 170)}...`
        : candidate.abstrak;
    }

    return {
      ...candidate,
      skor_judul: sim.skor_judul,
      skor_abstrak: sim.skor_abstrak,
      skor_gabungan: sim.skor_gabungan,
      skor_fts: sim.skor_judul, // backward compatibility
      skor_trigram: sim.skor_judul, // backward compatibility
      matched_keywords: sim.matched_keywords,
      abstrak_preview: abstrakPreview
    };
  });

  // Sort descending by highest composite score
  scoredCandidates.sort((a, b) => b.skor_gabungan - a.skor_gabungan);

  const topMatch = scoredCandidates[0] || null;
  const highestScore = topMatch ? topMatch.skor_gabungan : 0;
  const highestTitleScore = topMatch ? topMatch.skor_judul : 0;
  const highestAbstractScore = topMatch ? topMatch.skor_abstrak : 0;

  const filteredMatches = scoredCandidates
    .filter(m => m.skor_gabungan >= thresholdMin)
    .slice(0, limit);

  return {
    highestScore,
    highestTitleScore,
    highestAbstractScore,
    hasAbstract,
    processedInput: processedTitle,
    extractedConcepts: extractKeyConcepts(`${inputTitle} ${inputAbstract}`),
    matches: filteredMatches
  };
}

/**
 * Backward-compatible single-call similarity check
 * Accepts either title-only or multi-field calls seamlessly.
 */
export function checkClientSimilarity(inputTitle, databaseTitles = [], w1 = 0.6, w2 = 0.4) {
  // If databaseTitles contains full archives with abstracts, use multi-field engine
  return checkClientMultiFieldSimilarity(inputTitle, '', databaseTitles, [], { limit: 5 });
}

