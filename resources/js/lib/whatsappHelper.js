/**
 * SIMTA WhatsApp Integration Helper
 * Menyediakan utilitas normalisasi nomor, pencarian profil mahasiswa, dan pembukaan chat WhatsApp.
 */

// Tidak menggunakan nomor WhatsApp dummy; hanya nomor asli yang telah diisi/diverifikasi mahasiswa
export const DEFAULT_STUDENT_WHATSAPP_PROFILES = {};

// Daftar nomor dummy lama yang harus diabaikan jika masih tersimpan di cache lama
const LEGACY_DUMMY_PHONES = new Set([
  '081271234003',
  '081271234002',
  '081373456099',
  '081373456041',
  '081278901042',
  '081379876009',
  '081273344011',
  '081372233031',
  '081278899017',
  '081371122013',
  '081276677021',
  '081375566012',
  '081274455094',
  '081378899029',
  '081273322095',
  '081376655096',
  '081279988019',
  '081275544091',
  '081374433092',
  '081273322093'
]);

const isValidNonDummyPhone = (phone) => {
  if (!phone || phone === '-') return false;
  const trimmed = String(phone).trim();
  if (!trimmed) return false;
  const digits = trimmed.replace(/\D/g, '');
  const normalizedZero = digits.startsWith('62') ? '0' + digits.slice(2) : digits;
  if (LEGACY_DUMMY_PHONES.has(trimmed) || LEGACY_DUMMY_PHONES.has(normalizedZero)) {
    return false;
  }
  return true;
};

/**
 * Normalisasi dan validasi nomor telepon WhatsApp ke format internasional standar (628xxxxxxxxxx)
 * @param {string|number} rawPhone
 * @returns {{ isValid: boolean, cleanNumber: string, raw: string, reason?: string }}
 */
export function normalizeWhatsAppNumber(rawPhone) {
  if (!isValidNonDummyPhone(rawPhone)) {
    return {
      isValid: false,
      cleanNumber: '',
      raw: '',
      reason: 'Nomor WhatsApp belum diisi atau mahasiswa belum melakukan aktivasi profil.'
    };
  }

  const rawStr = String(rawPhone).trim();
  // Buang semua karakter selain angka
  let clean = rawStr.replace(/\D/g, '');

  if (!clean) {
    return {
      isValid: false,
      cleanNumber: '',
      raw: rawStr,
      reason: 'Nomor WhatsApp tidak memuat digit angka yang valid.'
    };
  }

  // Format awalan Indonesia
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (clean.startsWith('8')) {
    clean = '62' + clean;
  } else if (!clean.startsWith('62')) {
    clean = '62' + clean;
  }

  // Validasi panjang nomor internasional (Indonesia normalnya 11 - 15 digit angka termasuk 62)
  if (clean.length < 10) {
    return {
      isValid: false,
      cleanNumber: clean,
      raw: rawStr,
      reason: 'Nomor WhatsApp terlalu pendek (minimal 10 digit).'
    };
  }

  if (clean.length > 16) {
    return {
      isValid: false,
      cleanNumber: clean,
      raw: rawStr,
      reason: 'Nomor WhatsApp terlalu panjang (maksimal 16 digit).'
    };
  }

  // Pastikan setelah 62 adalah prefix nomor seluler (umumnya 8)
  if (!clean.startsWith('628')) {
    return {
      isValid: false,
      cleanNumber: clean,
      raw: rawStr,
      reason: 'Format nomor tidak sesuai standar nomor seluler Indonesia (08...)'
    };
  }

  return {
    isValid: true,
    cleanNumber: clean,
    raw: rawStr
  };
}

/**
 * Mencari nomor WhatsApp asli mahasiswa dari data profil yang sudah terverifikasi
 * @param {string|object} studentOrNim - Objek mahasiswa atau string NIM / Nama
 * @param {object} [context] - Opsi data tambahan dari useAuth() jika ada
 * @returns {{ nim: string, nama: string, phone: string, isFromProfile: boolean }}
 */
export function resolveStudentContact(studentOrNim, context = {}) {
  let nim = '';
  let nama = '';
  let explicitPhone = '';

  if (typeof studentOrNim === 'string') {
    nim = studentOrNim.trim();
    nama = studentOrNim.trim();
  } else if (studentOrNim && typeof studentOrNim === 'object') {
    nim = String(studentOrNim.student_nim || studentOrNim.mhs_nim || studentOrNim.nim || '').trim();
    nama = String(studentOrNim.student_nama || studentOrNim.mhs_nama || studentOrNim.nama || '').trim();
    explicitPhone = String(
      studentOrNim.no_hp ||
      studentOrNim.phone ||
      studentOrNim.noHp ||
      studentOrNim.no_wa ||
      studentOrNim.telepon ||
      ''
    ).trim();
  }

  // 1. Prioritaskan data terbaru dari dbProfiles (Supabase profiles)
  if (context?.dbProfiles && Array.isArray(context.dbProfiles)) {
    const found = context.dbProfiles.find(p =>
      (nim && String(p.nim || p.nip || p.id || '').trim() === nim) ||
      (nama && String(p.nama || '').toLowerCase().trim() === nama.toLowerCase())
    );
    if (found) {
      const p = found.no_hp || found.phone;
      if (isValidNonDummyPhone(p)) {
        return { nim: found.nim || nim, nama: found.nama || nama, phone: String(p).trim(), isFromProfile: true };
      }
    }
  }

  // 2. Cek di localStorage 'simta_student_credentials_v1' & 'simta_registered_users'
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const rawCreds = localStorage.getItem('simta_student_credentials_v1');
      if (rawCreds && nim) {
        const credsMap = JSON.parse(rawCreds);
        const cred = credsMap?.[nim];
        if (cred && isValidNonDummyPhone(cred.no_hp)) {
          return { nim, nama: cred.nama || nama, phone: String(cred.no_hp).trim(), isFromProfile: true };
        }
      }
    } catch {}

    try {
      const rawUsers = localStorage.getItem('simta_registered_users');
      if (rawUsers) {
        const users = JSON.parse(rawUsers);
        if (Array.isArray(users)) {
          const match = users.find(u =>
            (nim && String(u.nim || u.id || '').trim() === nim) ||
            (nama && String(u.nama || '').toLowerCase().trim() === nama.toLowerCase())
          );
          if (match) {
            const p = match.no_hp || match.phone;
            if (isValidNonDummyPhone(p)) {
              return { nim: match.nim || nim, nama: match.nama || nama, phone: String(p).trim(), isFromProfile: true };
            }
          }
        }
      }
    } catch {}
  }

  // 3. Cek di context registeredStudents
  if (context?.registeredStudents && Array.isArray(context.registeredStudents)) {
    const found = context.registeredStudents.find(s =>
      (nim && String(s.nim || s.student_nim || '').trim() === nim) ||
      (nama && String(s.nama || s.student_nama || '').toLowerCase().trim() === nama.toLowerCase())
    );
    if (found) {
      const p = found.no_hp || found.phone || found.no_wa;
      if (isValidNonDummyPhone(p)) {
        return { nim: found.nim || nim, nama: found.nama || nama, phone: String(p).trim(), isFromProfile: true };
      }
    }
  }

  // 4. Cek di context studentAdvisors
  if (context?.studentAdvisors && Array.isArray(context.studentAdvisors)) {
    const found = context.studentAdvisors.find(sa =>
      (nim && String(sa.student_nim || '').trim() === nim) ||
      (nama && String(sa.student_nama || '').toLowerCase().trim() === nama.toLowerCase())
    );
    if (found) {
      const p = found.no_hp || found.phone;
      if (isValidNonDummyPhone(p)) {
        return { nim: found.student_nim || nim, nama: found.student_nama || nama, phone: String(p).trim(), isFromProfile: true };
      }
    }
  }

  // 5. Terakhir cek explicitPhone dari objek jika valid & bukan nomor dummy
  if (isValidNonDummyPhone(explicitPhone)) {
    return { nim, nama, phone: explicitPhone, isFromProfile: true };
  }

  return { nim, nama, phone: '', isFromProfile: false };
}

/**
 * Menampilkan pesan toast sistem pemberitahuan WhatsApp
 * @param {string} message
 * @param {'error'|'warning'|'success'|'info'} type
 */
export function dispatchWhatsAppToast(message, type = 'error') {
  if (typeof window === 'undefined') return;

  const event = new CustomEvent('simta-whatsapp-toast', {
    detail: { message, type, timestamp: Date.now() }
  });
  window.dispatchEvent(event);
}

/**
 * Membuka ruang chat WhatsApp mahasiswa secara langsung jika nomor valid,
 * atau menampilkan notifikasi peringatan yang jelas jika mahasiswa belum mengisi/verifikasi nomor WA.
 */
export function openStudentWhatsAppChat({ student, currentUser, context = {}, onNotify, customMessage }) {
  const contact = resolveStudentContact(student, context);
  const studentNama = contact.nama || 'Mahasiswa';
  const studentNim = contact.nim || '';

  const validation = normalizeWhatsAppNumber(contact.phone);

  if (!validation.isValid) {
    const notifyMsg = contact.phone
      ? `Nomor WhatsApp untuk mahasiswa ${studentNama} (${studentNim || '-'}) tidak valid (${contact.phone}). Alasan: ${validation.reason || 'Format nomor tidak valid'}.`
      : `Nomor WhatsApp untuk mahasiswa ${studentNama} (${studentNim || '-'}) belum tersedia. Mahasiswa yang bersangkutan belum melakukan aktivasi akun / mengisi nomor WhatsApp pada profilnya.`;

    if (typeof onNotify === 'function') {
      onNotify({
        type: 'error',
        title: 'Nomor WhatsApp Belum Terdaftar',
        message: notifyMsg,
        studentNama,
        studentNim
      });
    } else {
      dispatchWhatsAppToast(notifyMsg, 'error');
    }
    return false;
  }

  // Susun teks pembuka yang sopan dan jelas
  const dosenNama = currentUser?.nama || 'Dosen Pembimbing';
  const greetingText = customMessage ||
    `Halo ${studentNama}, saya ${dosenNama} (Dosen Pembimbing Tugas Akhir Anda di SIMONITA FASILKOM UNSRI).`;

  const encodedText = encodeURIComponent(greetingText);
  const waUrl = `https://wa.me/${validation.cleanNumber}?text=${encodedText}`;

  if (typeof window !== 'undefined') {
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }

  return true;
}
