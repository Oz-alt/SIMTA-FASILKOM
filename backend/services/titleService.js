/**
 * SIMTA Backend Service - Thesis Title Management & Pre-processing Logic
 */

export const INDONESIAN_STOPWORDS = new Set([
  'sistem', 'informasi', 'aplikasi', 'rancang', 'bangun', 'berbasis', 'web', 'mobile',
  'menggunakan', 'untuk', 'pada', 'studi', 'kasus', 'dan', 'di', 'yang', 'dengan', 'ke',
  'dari', 'secara', 'terpadu', 'manajemen', 'pengolahan', 'data', 'implementasi', 'analisis',
  'desain', 'pembuatan', 'pengembangan', 'unsri', 'universitas', 'sriwijaya'
]);

/**
 * Pre-processes title string:
 * 1. Lowercase
 * 2. Remove punctuation and numbers
 * 3. Filter out Indonesian stop-words
 * 4. Trim whitespace
 */
export function preProcessTitle(title, customStopwords = null) {
  if (!title) return '';
  
  const stopwords = customStopwords ? new Set([...INDONESIAN_STOPWORDS, ...customStopwords]) : INDONESIAN_STOPWORDS;

  let cleaned = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = cleaned.split(' ').filter(token => token.length > 1 && !stopwords.has(token));
  
  return tokens.join(' ');
}

/**
 * Evaluates similarity threshold according to PRD Rules:
 * - 0% to 40%: Aman (Green) -> Direct submit allowed
 * - 41% to 70%: Peringatan Kuning (Yellow) -> Submit allowed with warning modal
 * - >70%: Blokir Merah (Red) -> Submit locked, title revision required
 */
export function getSimilarityThreshold(score) {
  if (score <= 40) {
    return {
      status: 'aman',
      color: 'emerald',
      bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badgeText: 'Aman',
      allowSubmit: true,
      message: 'Judul Anda memiliki tingkat kemiripan rendah. Pengajuan dapat dilanjutkan.'
    };
  } else if (score <= 70) {
    return {
      status: 'peringatan',
      color: 'amber',
      bgClass: 'bg-amber-50 text-amber-700 border-amber-200',
      badgeText: 'Peringatan Kuning',
      allowSubmit: true,
      message: 'Ditemukan beberapa judul yang cukup mirip. Pastikan kebaruan (novelty) topik Anda.'
    };
  } else {
    return {
      status: 'blokir',
      color: 'red',
      bgClass: 'bg-red-50 text-red-700 border-red-200',
      badgeText: 'Blokir Merah',
      allowSubmit: false,
      message: 'Skor kemiripan melebihi 70%. Tombol Submit dikunci dan Anda wajib merombak judul.'
    };
  }
}
