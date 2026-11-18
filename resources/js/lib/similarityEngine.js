/**
 * SIMTA Similarity Check Engine
 * Dual-Layer Hybrid Architecture with Bilingual Root Stemming (Kata Dasar ID <-> EN):
 * 1. Layer Judul (Title): Stemmed Root Token Overlap + Canonical Bilingual Overlap + Character Trigram
 * 2. Layer Abstrak (Abstract): Pemecahan Kata Dasar (ID/EN Stemming) -> Bilingual Canonical Root Alignment
 *    + Concept Thesaurus + Trigram Similarity
 * 3. Benchmark Dataset: Real Historical Archives linked to UNSRI Repository (http://repository.unsri.ac.id/)
 */

import {
  preProcessTitle,
  preProcessAbstract,
  extractTitleRoots,
  extractAbstractRoots,
  extractKeyConcepts,
  getSimilarityThreshold
} from '../services/titleService.js';

const ROOT_CACHE_LIMIT = 1500;
const abstractRootCache = new Map();
const titleRootCache = new Map();
const conceptCache = new Map();

function getCachedAbstractRoots(text) {
  const key = String(text || '');
  if (abstractRootCache.has(key)) return abstractRootCache.get(key);
  const val = extractAbstractRoots(key);
  if (abstractRootCache.size >= ROOT_CACHE_LIMIT) abstractRootCache.clear();
  abstractRootCache.set(key, val);
  return val;
}

function getCachedTitleRoots(text) {
  const key = String(text || '');
  if (titleRootCache.has(key)) return titleRootCache.get(key);
  const val = extractTitleRoots(key);
  if (titleRootCache.size >= ROOT_CACHE_LIMIT) titleRootCache.clear();
  titleRootCache.set(key, val);
  return val;
}

function getCachedConcepts(text) {
  const key = String(text || '');
  if (conceptCache.has(key)) return conceptCache.get(key);
  const val = extractKeyConcepts(key);
  if (conceptCache.size >= ROOT_CACHE_LIMIT) conceptCache.clear();
  conceptCache.set(key, val);
  return val;
}

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

  const unionCount = t1.size + t2.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * Calculates Token / Root Word Overlap ratio with Smoothed Containment, Dice & Jaccard.
 * Returns numeric ratio (0.0 - 1.0) for backward compatibility, or detailed info via helper.
 */
export function calculateRootOverlapDetails(tokensArr1, tokensArr2, minDenominator = 8) {
  const set1 = new Set(Array.isArray(tokensArr1) ? tokensArr1 : String(tokensArr1 || '').split(' ').filter(Boolean));
  const set2 = new Set(Array.isArray(tokensArr2) ? tokensArr2 : String(tokensArr2 || '').split(' ').filter(Boolean));

  if (set1.size === 0 || set2.size === 0) {
    return { score: 0, matchedRoots: [] };
  }

  const matchedRoots = [];
  for (const t of set1) {
    if (set2.has(t)) {
      matchedRoots.push(t);
    }
  }

  const common = matchedRoots.length;
  if (common === 0) return { score: 0, matchedRoots: [] };

  const minLen = Math.min(set1.size, set2.size);
  const smoothedMin = Math.max(minDenominator, minLen);
  const unionLen = set1.size + set2.size - common;

  // Smoothed containment + Sorensen-Dice + Jaccard prevents short abstracts from artificially inflating scores
  const containment = common / smoothedMin;
  const dice = (2 * common) / (set1.size + set2.size);
  const jaccard = unionLen === 0 ? 0 : common / unionLen;

  const score = (0.45 * containment) + (0.40 * dice) + (0.15 * jaccard);
  return {
    score: Math.min(1.0, score),
    matchedRoots
  };
}

/**
 * Calculates Token / Word Overlap ratio with Containment & Jaccard
 */
export function calculateTokenOverlap(str1, str2, minDenominator = 3) {
  return calculateRootOverlapDetails(str1, str2, minDenominator).score;
}

/**
 * Calculates Title Similarity between two titles (0.0 to 1.0)
 * Stems title words to root words (kata dasar) and matches both local stems and bilingual canonical roots.
 */
export function calculateTitleSimilarity(title1, title2) {
  const r1 = getCachedTitleRoots(title1);
  const r2 = getCachedTitleRoots(title2);

  if (!r1.processedText || !r2.processedText) return 0;
  if (r1.processedText === r2.processedText) return 1.0;

  const stemOverlap = calculateTokenOverlap(r1.stems, r2.stems, 3);
  const canonicalOverlap = calculateTokenOverlap(r1.canonicals, r2.canonicals, 3);
  const effectiveTokenOverlap = Math.max(stemOverlap, 0.92 * canonicalOverlap);

  const trigram = Math.max(
    calculateTrigramSimilarity(r1.processedText, r2.processedText),
    0.92 * calculateTrigramSimilarity(r1.canonicals.join(' '), r2.canonicals.join(' '))
  );

  return Math.min(1.0, (0.58 * effectiveTokenOverlap) + (0.42 * trigram));
}

/**
 * Calculates Abstract Similarity by breaking both abstracts down into root words (kata dasar)
 * and aligning Indonesian <-> English stems via canonical root mapping + concept thesaurus.
 */
export function calculateAbstractSimilarity(abstract1, abstract2) {
  if (!abstract1 || !abstract2) {
    return { score: 0, matchedConcepts: [], matchedRoots: [] };
  }

  // 1. Break abstracts into stemmed kata dasar & bilingual canonical roots
  const abs1 = getCachedAbstractRoots(abstract1);
  const abs2 = getCachedAbstractRoots(abstract2);

  const rootOverlap = calculateRootOverlapDetails(abs1.roots, abs2.roots, 10);
  const rootTokenScore = rootOverlap.score;

  // 2. Bilingual IT Concept Thesaurus matching
  const concepts1 = getCachedConcepts(abstract1);
  const concepts2 = getCachedConcepts(abstract2);

  let conceptScore = 0;
  const matchedConcepts = [];

  if (concepts1.length > 0 && concepts2.length > 0) {
    const keys2 = new Set(concepts2.map(c => c.key));
    let commonConcepts = 0;
    let domainMatches = 0;

    for (const c1 of concepts1) {
      if (keys2.has(c1.key)) {
        commonConcepts++;
        matchedConcepts.push(c1.label);
        if (c1.category === 'domain_bisnis' || c1.category === 'metode_analisis') {
          domainMatches++;
        }
      }
    }

    if (commonConcepts > 0) {
      const unionConcepts = new Set([...concepts1.map(c => c.key), ...concepts2.map(c => c.key)]).size;
      // Laplace smoothing (+2) avoids single-concept matches (e.g. both merely mentioning Android/MySQL) inflated to 100%
      const smoothedDice = (2 * commonConcepts) / (concepts1.length + concepts2.length + 2);
      const smoothedJaccard = commonConcepts / (unionConcepts + 1);
      conceptScore = (0.60 * smoothedDice) + (0.40 * smoothedJaccard);

      // Sharing only generic tech/testing tags without business domain overlap should stay low
      if (domainMatches === 0 && rootOverlap.matchedRoots.length <= 2) {
        conceptScore *= 0.35;
      }
    }
  }

  // 3. Trigram similarity on canonicalized root token strings
  const sortedRootStr1 = [...abs1.roots].sort().join(' ');
  const sortedRootStr2 = [...abs2.roots].sort().join(' ');
  const trigramScore = calculateTrigramSimilarity(sortedRootStr1, sortedRootStr2);

  // Combine scores: Canonical root words take primary weight (55%), Concept Thesaurus (30%), Root Trigram (15%)
  let finalScore = 0;
  if (concepts1.length > 0 && concepts2.length > 0) {
    finalScore = (0.55 * rootTokenScore) + (0.30 * conceptScore) + (0.15 * trigramScore);
  } else {
    finalScore = (0.75 * rootTokenScore) + (0.25 * trigramScore);
  }

  return {
    score: Math.min(1.0, finalScore),
    matchedConcepts,
    matchedRoots: rootOverlap.matchedRoots
  };
}

/**
 * Calculates Multi-Field Similarity for a single candidate against input Title & Abstract
 */
export function calculateThesisSimilarity(inputTitle, inputAbstract, candidateTitle, candidateAbstract) {
  const titleScore = calculateTitleSimilarity(inputTitle, candidateTitle);

  const hasInputAbstract = Boolean(inputAbstract && inputAbstract.trim().length >= 30);
  const hasCandAbstract = Boolean(candidateAbstract && candidateAbstract.trim().length >= 30);

  let abstractScore = 0;
  let matchedConcepts = [];
  let matchedRoots = [];

  if (hasInputAbstract && hasCandAbstract) {
    const absResult = calculateAbstractSimilarity(inputAbstract, candidateAbstract);
    abstractScore = absResult.score;
    matchedConcepts = absResult.matchedConcepts;
    matchedRoots = absResult.matchedRoots;
  } else if (hasInputAbstract && !hasCandAbstract) {
    // Fallback: match input abstract root words against candidate title
    const absResult = calculateAbstractSimilarity(inputAbstract, candidateTitle);
    abstractScore = absResult.score * 0.7;
    matchedConcepts = absResult.matchedConcepts;
    matchedRoots = absResult.matchedRoots;
  } else {
    // No abstract provided by user: abstract score equals title score
    abstractScore = titleScore;
  }

  // Also include concept matches found in titles
  const titleConcepts1 = getCachedConcepts(inputTitle);
  const titleConcepts2 = getCachedConcepts(candidateTitle);
  const titleKeys2 = new Set(titleConcepts2.map(c => c.key));
  for (const c of titleConcepts1) {
    if (titleKeys2.has(c.key) && !matchedConcepts.includes(c.label)) {
      matchedConcepts.push(c.label);
    }
  }

  // Composite weighted score: 50% Judul + 50% Abstrak when abstract exists
  const compositeScore = hasInputAbstract
    ? (0.50 * titleScore) + (0.50 * abstractScore)
    : titleScore;

  return {
    skor_judul: Math.min(100, Math.round(titleScore * 100)),
    skor_abstrak: Math.min(100, Math.round(abstractScore * 100)),
    skor_gabungan: Math.min(100, Math.round(compositeScore * 100)),
    matched_keywords: matchedConcepts,
    matched_roots: matchedRoots
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
      processedAbstractRoots: [],
      abstractTokenDetails: [],
      hasAbstract: false,
      extractedConcepts: [],
      matches: []
    };
  }

  const limit = options.limit || 8;
  const thresholdMin = options.thresholdMin !== undefined ? options.thresholdMin : 10;
  const hasAbstract = Boolean(inputAbstract && inputAbstract.trim().length >= 30);
  const inputAbsRoots = hasAbstract
    ? getCachedAbstractRoots(inputAbstract)
    : { roots: [], rootString: '', tokenDetails: [] };

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
      skor_fts: sim.skor_judul,
      skor_trigram: sim.skor_judul,
      matched_keywords: sim.matched_keywords,
      matched_roots: sim.matched_roots,
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
    processedAbstractRoots: inputAbsRoots.roots,
    abstractTokenDetails: inputAbsRoots.tokenDetails,
    extractedConcepts: extractKeyConcepts(`${inputTitle} ${inputAbstract}`),
    matches: filteredMatches
  };
}

/**
 * Backward-compatible single-call similarity check
 * Accepts either title-only or multi-field calls seamlessly.
 */
export function checkClientSimilarity(inputTitle, databaseTitles = [], w1 = 0.6, w2 = 0.4) {
  return checkClientMultiFieldSimilarity(inputTitle, '', databaseTitles, [], { limit: 5 });
}
