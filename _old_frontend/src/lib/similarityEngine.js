/**
 * Client-Side Similarity Engine Simulation
 * Hybrid Trigram + Token Overlap Matcher
 */

import { preProcessTitle } from '@backend/services/titleService.js';

/**
 * Generates trigrams array from a string.
 */
function getTrigrams(str) {
  const trigrams = new Set();
  const clean = `  ${str}  `;
  for (let i = 0; i < clean.length - 2; i++) {
    trigrams.add(clean.substring(i, i + 3));
  }
  return trigrams;
}

/**
 * Calculates Trigram similarity ratio between two strings (0.0 to 1.0)
 */
export function calculateTrigramSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1.0;

  const t1 = getTrigrams(str1);
  const t2 = getTrigrams(str2);

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
 * Calculates Token / Word Overlap ratio (FTS estimation)
 */
export function calculateTokenOverlap(str1, str2) {
  const tokens1 = new Set(str1.split(' ').filter(t => t.length > 0));
  const tokens2 = new Set(str2.split(' ').filter(t => t.length > 0));

  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let common = 0;
  for (const t of tokens1) {
    if (tokens2.has(t)) {
      common++;
    }
  }

  const minLen = Math.min(tokens1.size, tokens2.size);
  return common / minLen;
}

/**
 * Performs client-side similarity check against database titles list
 */
export function checkClientSimilarity(inputTitle, databaseTitles, w1 = 0.6, w2 = 0.4) {
  const processedInput = preProcessTitle(inputTitle);
  if (!processedInput || processedInput.length < 3) {
    return {
      highestScore: 0,
      processedInput: '',
      matches: []
    };
  }

  const matches = databaseTitles.map(item => {
    const dbProcessed = item.judul_processed || preProcessTitle(item.judul);
    
    const ftsScore = calculateTokenOverlap(processedInput, dbProcessed);
    const trigramScore = calculateTrigramSimilarity(processedInput, dbProcessed);
    
    // Composite weighted score
    const compositeScore = Math.min(100, Math.round(((w1 * ftsScore) + (w2 * trigramScore)) * 100));

    return {
      id: item.id,
      judul: item.judul,
      penulis: item.penulis || item.mhs_nama || 'Alumni / Mahasiswa',
      tahun: item.tahun_angkatan || 'Historis',
      skor_fts: Math.round(ftsScore * 100),
      skor_trigram: Math.round(trigramScore * 100),
      skor_gabungan: compositeScore
    };
  });

  matches.sort((a, b) => b.skor_gabungan - a.skor_gabungan);
  
  const highestScore = matches.length > 0 ? matches[0].skor_gabungan : 0;

  return {
    highestScore,
    processedInput,
    matches: matches.filter(m => m.skor_gabungan > 10).slice(0, 5)
  };
}
