/**
 * academicUtils.js
 * Utility functions for student semester determination and academic formatting.
 */

export const getStudentSemester = (std) => {
  if (!std) return 'Semester 5';

  // 1. Explicit semester property
  if (std.semester) {
    const s = String(std.semester).trim();
    if (s.toLowerCase().startsWith('semester')) return s;
    return `Semester ${s}`;
  }

  // 2. Derive from kelas name, e.g. "MI 5A", "MI 5B", "MI 6A", "5A", "Kelas 6B"
  const kelasStr = String(std.kelas || '').trim();
  const kelasMatch = kelasStr.match(/(?:MI\s*|Kelas\s*)?([1-8])[A-Za-z]?\b/);
  if (kelasMatch && kelasMatch[1]) {
    return `Semester ${kelasMatch[1]}`;
  }

  // 3. Derive from tahun_angkatan (assuming current academic year 2026/2027)
  const angkatanStr = String(std.tahun_angkatan || '').trim();
  if (angkatanStr === '2024' || angkatanStr === '24') {
    return 'Semester 5';
  }
  if (angkatanStr === '2023' || angkatanStr === '23') {
    return 'Semester 7';
  }
  if (angkatanStr === '2025' || angkatanStr === '25') {
    return 'Semester 3';
  }
  if (angkatanStr && Number(angkatanStr) <= 2022) {
    return 'Semester 8+';
  }

  // 4. Derive from UNSRI NIM digits (e.g. 09010182428019 -> '24' at index 7-8 or regex)
  const nimStr = String(std.nim || '').trim();
  const nimMatch = nimStr.match(/\d{6}(2[0-9])\d+/);
  if (nimMatch && nimMatch[1]) {
    const y = nimMatch[1];
    if (y === '24') return 'Semester 5';
    if (y === '23') return 'Semester 7';
    if (y === '25') return 'Semester 3';
    if (Number(y) <= 22) return 'Semester 8+';
  }

  // Default fallback for D3 MI tingkat akhir
  return 'Semester 5';
};

export const AVAILABLE_SEMESTERS = [
  'Semua Semester',
  'Semester 5',
  'Semester 6',
  'Semester 7',
  'Semester 8+'
];
