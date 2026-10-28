/**
 * SIMTA WhatsApp Integration Helper
 * Menyediakan utilitas normalisasi nomor, pencarian profil mahasiswa, dan pembukaan chat WhatsApp.
 */

// Format mapping nomor profil default untuk mahasiswa aktif bimbingan
export const DEFAULT_STUDENT_WHATSAPP_PROFILES = {
  '09010182428003': '081271234003', // AKHMAD LATIEF SRI BINTANG PAMUNGKAS
  '09010182428002': '081271234002', // AULIA AZZAHRA
  '09010582428099': '081373456099', // CINOIEY JULIEN RIZKY
  '09010282428041': '081373456041', // EGIR EXTRA APENA
  '09010282428042': '081278901042', // INTAN NURAINI
  '09010182428009': '081379876009', // MEDINA ZAHRAH
  '09010182428011': '081273344011', // MELVA OLIFIA
  '09010282428031': '081372233031', // MUHAMMAD RIZKY ELPARIZA
  '09010182428017': '081278899017', // MUHAMMAD RUSLI ANDIKA
  '09010182428013': '081371122013', // NAZWA KAMILA TABITA SARI
  '09010282428021': '081276677021', // NYIMAS AYU ASRI MUTH MAINNAH
  '09010182428012': '081375566012', // TESA ALIZIA PUTRI
  '09010582428094': '081274455094', // YUDA BAGASKARA SARIPUDIN
  '09010282428029': '081378899029', // ZAQILLA SAHIL
  '09010582428095': '081273322095', // ALDURRA HADI PRAMANTYO
  '09010582428096': '081376655096', // ALIEF RIDOVI PANJAITAN
  '09010182428019': '081279988019', // INDRIATI RAHMA
  '09010582428091': '081275544091', // RIFQI AL-FATIH
  '09010582428092': '081374433092', // SITI NURHALIZA
  '09010582428093': '081273322093', // MUHAMMAD FAJAR
};

/**
 * Normalisasi dan validasi nomor telepon WhatsApp ke format internasional standar (628xxxxxxxxxx)
 * @param {string|number} rawPhone
 * @returns {{ isValid: boolean, cleanNumber: string, raw: string, reason?: string }}
 */
export function normalizeWhatsAppNumber(rawPhone) {
  if (!rawPhone || rawPhone === '-' || String(rawPhone).trim() === '') {
    return {
      isValid: false,
      cleanNumber: '',
      raw: String(rawPhone || ''),
      reason: 'Nomor WhatsApp belum diisi pada profil mahasiswa.'
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
    // Jika tidak diawali 62 atau 08
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
 * Mencari nomor WhatsApp mahasiswa dari data profil lokal, context, atau storage
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

  // 1. Jika objek sudah membawa nomor telepon non-kosong dan bukan '-'
  if (explicitPhone && explicitPhone !== '-') {
    return { nim, nama, phone: explicitPhone, isFromProfile: true };
  }

  // 2. Cek di context registered students / dbProfiles jika disediakan
  if (context?.registeredStudents && Array.isArray(context.registeredStudents)) {
    const found = context.registeredStudents.find(s => 
      (nim && String(s.nim || s.student_nim || '').trim() === nim) ||
      (nama && String(s.nama || s.student_nama || '').toLowerCase().trim() === nama.toLowerCase())
    );
    if (found) {
      const p = found.no_hp || found.phone || found.no_wa;
      if (p && p !== '-') {
        return { nim: found.nim || nim, nama: found.nama || nama, phone: p, isFromProfile: true };
      }
    }
  }

  if (context?.dbProfiles && Array.isArray(context.dbProfiles)) {
    const found = context.dbProfiles.find(p => 
      (nim && String(p.nim || p.id || '').trim() === nim) ||
      (nama && String(p.nama || '').toLowerCase().trim() === nama.toLowerCase())
    );
    if (found) {
      const p = found.no_hp || found.phone;
      if (p && p !== '-') {
        return { nim: found.nim || nim, nama: found.nama || nama, phone: p, isFromProfile: true };
      }
    }
  }

  if (context?.studentAdvisors && Array.isArray(context.studentAdvisors)) {
    const found = context.studentAdvisors.find(sa => 
      (nim && String(sa.student_nim || '').trim() === nim) ||
      (nama && String(sa.student_nama || '').toLowerCase().trim() === nama.toLowerCase())
    );
    if (found) {
      const p = found.no_hp || found.phone;
      if (p && p !== '-') {
        return { nim: found.student_nim || nim, nama: found.student_nama || nama, phone: p, isFromProfile: true };
      }
    }
  }

  // 3. Cek localStorage 'simta_registered_users' atau 'simta_student_advisors'
  if (typeof window !== 'undefined' && window.localStorage) {
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
            if (p && p !== '-') {
              return { nim: match.nim || nim, nama: match.nama || nama, phone: p, isFromProfile: true };
            }
          }
        }
      }
    } catch (e) {
      // Ignore JSON error
    }
  }

  // 4. Cek fallback profil default mahasiswa cohort SIMTA
  if (nim && DEFAULT_STUDENT_WHATSAPP_PROFILES[nim]) {
    return {
      nim,
      nama,
      phone: DEFAULT_STUDENT_WHATSAPP_PROFILES[nim],
      isFromProfile: true
    };
  }

  // Jika nama cocok dengan mahasiswa bimbingan yang terdata
  const cleanNamaLower = nama.toLowerCase().trim();
  if (cleanNamaLower) {
    for (const [keyNim, defaultPhone] of Object.entries(DEFAULT_STUDENT_WHATSAPP_PROFILES)) {
      if (cleanNamaLower.includes('latief') && keyNim === '09010182428003') {
        return { nim: keyNim, nama, phone: defaultPhone, isFromProfile: true };
      }
      if (cleanNamaLower.includes('aulia azzahra') && keyNim === '09010182428002') {
        return { nim: keyNim, nama, phone: defaultPhone, isFromProfile: true };
      }
      if (cleanNamaLower.includes('egir') && keyNim === '09010282428041') {
        return { nim: keyNim, nama, phone: defaultPhone, isFromProfile: true };
      }
      if (cleanNamaLower.includes('medina') && keyNim === '09010182428009') {
        return { nim: keyNim, nama, phone: defaultPhone, isFromProfile: true };
      }
      if (cleanNamaLower.includes('melva') && keyNim === '09010182428011') {
        return { nim: keyNim, nama, phone: defaultPhone, isFromProfile: true };
      }
      if (cleanNamaLower.includes('elpariza') && keyNim === '09010282428031') {
        return { nim: keyNim, nama, phone: defaultPhone, isFromProfile: true };
      }
      if (cleanNamaLower.includes('tesa') && keyNim === '09010182428012') {
        return { nim: keyNim, nama, phone: defaultPhone, isFromProfile: true };
      }
      if (cleanNamaLower.includes('cinoiey') && keyNim === '09010582428099') {
        return { nim: keyNim, nama, phone: defaultPhone, isFromProfile: true };
      }
    }
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
 * atau menampilkan notifikasi peringatan yang jelas jika nomor belum ada / tidak valid.
 * 
 * @param {object} options
 * @param {object|string} options.student - Data mahasiswa atau NIM
 * @param {object} [options.currentUser] - Data dosen pembimbing yang sedang login
 * @param {object} [options.context] - Data tambahan context
 * @param {function} [options.onNotify] - Callback opsional untuk custom notification
 * @param {string} [options.customMessage] - Pesan pembuka kustom opsional
 * @returns {boolean} - true jika berhasil diarahkan ke WhatsApp, false jika gagal/batal
 */
export function openStudentWhatsAppChat({ student, currentUser, context = {}, onNotify, customMessage }) {
  const contact = resolveStudentContact(student, context);
  const studentNama = contact.nama || 'Mahasiswa';
  const studentNim = contact.nim || '';

  const validation = normalizeWhatsAppNumber(contact.phone);

  if (!validation.isValid) {
    const notifyMsg = contact.phone
      ? `Nomor WhatsApp untuk mahasiswa ${studentNama} (${studentNim || '-'}) tidak valid (${contact.phone}). Alasan: ${validation.reason || 'Format nomor tidak valid'}.`
      : `Nomor WhatsApp untuk mahasiswa ${studentNama} (${studentNim || '-'}) belum tersedia di data profil. Mohon minta mahasiswa untuk melengkapi nomor WhatsApp pada profilnya.`;

    if (typeof onNotify === 'function') {
      onNotify({
        type: 'error',
        title: 'Nomor WhatsApp Tidak Tersedia',
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
    `Halo ${studentNama}, saya ${dosenNama} (Dosen Pembimbing Tugas Akhir Anda di SIMTA FASILKOM UNSRI).`;

  const waUrl = `https://wa.me/${validation.cleanNumber}?text=${encodeURIComponent(greetingText)}`;

  // Buka chat WhatsApp di tab baru secara aman
  window.open(waUrl, '_blank', 'noopener,noreferrer');

  if (typeof onNotify === 'function') {
    onNotify({
      type: 'success',
      title: 'Membuka WhatsApp',
      message: `Mengarahkan ke ruang chat WhatsApp ${studentNama} (${validation.cleanNumber})...`,
      studentNama,
      studentNim
    });
  } else {
    dispatchWhatsAppToast(`Mengarahkan ke WhatsApp ${studentNama} (${validation.cleanNumber})...`, 'success');
  }

  return true;
}
