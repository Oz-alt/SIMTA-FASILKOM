/**
 * SIMTA Bimbingan Reminder Engine
 * Menghitung interval dan kepatuhan frekuensi bimbingan mahasiswa (Minimal 2x per bulan terhitung dari bimbingan terakhir)
 */

export function calculateBimbinganReminder(consultations = [], studentNim = '', targetPerMonth = 2, customNow = null) {
  const now = customNow ? new Date(customNow) : new Date();

  // Filter approved consultations for this student
  const approvedConsultations = (consultations || [])
    .filter(c => {
      if (!studentNim) return c.status === 'disetujui';
      return String(c.mhs_nim).trim() === String(studentNim).trim() && c.status === 'disetujui';
    })
    .sort((a, b) => {
      const dateA = new Date(a.tanggal ? `${a.tanggal}T00:00:00` : a.created_at || 0).getTime();
      const dateB = new Date(b.tanggal ? `${b.tanggal}T00:00:00` : b.created_at || 0).getTime();
      return dateA - dateB;
    });

  // If no approved consultations yet
  if (approvedConsultations.length === 0) {
    return {
      isReminderActive: true,
      severity: 'empty',
      latestConsultation: null,
      latestDateFormatted: null,
      daysSinceLast: null,
      consultationsInLastMonth: 0,
      targetPerMonth,
      message: 'Belum Ada Sesi Bimbingan Tercatat di Kartu Digital',
      subMessage: 'Segera lakukan dan catat sesi bimbingan pertama Anda. Target minimal adalah 2 kali dalam satu bulan.',
      deadlineNextBimbingan: null,
      statusBadge: {
        text: 'Belum Ada Bimbingan',
        color: 'text-amber-800',
        bgColor: 'bg-amber-100',
        borderColor: 'border-amber-200'
      }
    };
  }

  const latestConsultation = approvedConsultations[approvedConsultations.length - 1];
  const lastDate = new Date(latestConsultation.tanggal ? `${latestConsultation.tanggal}T00:00:00` : latestConsultation.created_at);
  
  // Calculate elapsed days
  const diffTime = Math.max(0, now.getTime() - lastDate.getTime());
  const daysSinceLast = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Count consultations in 30-day window
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const consultationsInLastMonth = approvedConsultations.filter(c => {
    const cDate = new Date(c.tanggal ? `${c.tanggal}T00:00:00` : c.created_at);
    return cDate >= thirtyDaysAgo;
  }).length;

  const latestDateFormatted = lastDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const nextTargetDate = new Date(lastDate.getTime() + 15 * 24 * 60 * 60 * 1000);
  const nextTargetFormatted = nextTargetDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Evaluation: 2 times per month means interval between bimbingan must be <= 15 days
  if (daysSinceLast >= 30) {
    return {
      isReminderActive: true,
      severity: 'critical',
      latestConsultation,
      latestDateFormatted,
      daysSinceLast,
      consultationsInLastMonth,
      targetPerMonth,
      message: `Peringatan Kritis: Anda belum bimbingan selama ${daysSinceLast} hari!`,
      subMessage: `Bimbingan terakhir tercatat pada ${latestDateFormatted}. Anda telah melewati batas waktu 1 bulan tanpa bimbingan (minimal 2x bimbingan per bulan).`,
      deadlineNextBimbingan: nextTargetFormatted,
      statusBadge: {
        text: `Terlambat ${daysSinceLast - 15} Hari`,
        color: 'text-rose-800',
        bgColor: 'bg-rose-100',
        borderColor: 'border-rose-200'
      }
    };
  }

  if (daysSinceLast >= 15 || consultationsInLastMonth < 2 && daysSinceLast >= 12) {
    return {
      isReminderActive: true,
      severity: 'warning',
      latestConsultation,
      latestDateFormatted,
      daysSinceLast,
      consultationsInLastMonth,
      targetPerMonth,
      message: `Peringatan Jadwal: Sudah ${daysSinceLast} hari sejak bimbingan terakhir Anda`,
      subMessage: `Terakhir bimbingan pada ${latestDateFormatted}. Sesuai syarat minimal 2 kali bimbingan per bulan (tiap 15 hari), harap segera konsultasi ke Dosen Pembimbing.`,
      deadlineNextBimbingan: nextTargetFormatted,
      statusBadge: {
        text: 'Waktunya Bimbingan',
        color: 'text-amber-800',
        bgColor: 'bg-amber-100',
        borderColor: 'border-amber-200'
      }
    };
  }

  return {
    isReminderActive: false,
    severity: 'good',
    latestConsultation,
    latestDateFormatted,
    daysSinceLast,
    consultationsInLastMonth,
    targetPerMonth,
    message: 'Jadwal Bimbingan Rutin Aktif & Sesuai Target',
    subMessage: `Bimbingan terakhir ${daysSinceLast === 0 ? 'hari ini' : `${daysSinceLast} hari lalu`} (${latestDateFormatted}). Total ${consultationsInLastMonth} sesi dalam 30 hari terakhir (Target: min. 2x/bulan).`,
    deadlineNextBimbingan: nextTargetFormatted,
    statusBadge: {
      text: 'Jadwal Aman (Aktif)',
      color: 'text-emerald-800',
      bgColor: 'bg-emerald-100',
      borderColor: 'border-emerald-200'
    }
  };
}
