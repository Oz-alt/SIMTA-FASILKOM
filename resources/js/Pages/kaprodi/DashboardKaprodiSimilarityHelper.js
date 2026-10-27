/**
 * Utility to calculate color coding and risk level based on similarity score & dynamic threshold.
 */
export const getSimilarityColorMeta = (score, threshold = 30) => {
  const num = Number(score) || 0;
  if (num <= 20) {
    return {
      scoreText: 'text-emerald-700',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      progressBar: 'bg-emerald-500',
      statusLabel: 'Sangat Aman',
      isAboveThreshold: false,
      riskLevel: 'very_low',
      indicatorDot: 'bg-emerald-500'
    };
  }
  if (num <= threshold) {
    return {
      scoreText: 'text-teal-700',
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
      progressBar: 'bg-teal-500',
      statusLabel: 'Aman (Di Bawah Ambang)',
      isAboveThreshold: false,
      riskLevel: 'low',
      indicatorDot: 'bg-teal-500'
    };
  }
  if (num <= 50) {
    return {
      scoreText: 'text-amber-700',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      progressBar: 'bg-amber-500',
      statusLabel: 'Sedang (Perlu Perhatian)',
      isAboveThreshold: true,
      riskLevel: 'medium',
      indicatorDot: 'bg-amber-500'
    };
  }
  if (num <= 70) {
    return {
      scoreText: 'text-orange-700',
      badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
      progressBar: 'bg-orange-500',
      statusLabel: 'Tinggi (Perlu Revisi)',
      isAboveThreshold: true,
      riskLevel: 'high',
      indicatorDot: 'bg-orange-500'
    };
  }
  return {
    scoreText: 'text-rose-700',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    progressBar: 'bg-rose-600',
    statusLabel: 'Kritis (Sangat Tinggi)',
    isAboveThreshold: true,
    riskLevel: 'critical',
    indicatorDot: 'bg-rose-600'
  };
};
