/**
 * SIMTA Backend Service - Thesis Title Management, Bilingual Pre-processing & Similarity Logic
 */

export const INDONESIAN_STOPWORDS = new Set([
  'sistem', 'informasi', 'aplikasi', 'rancang', 'bangun', 'berbasis', 'web', 'mobile',
  'menggunakan', 'untuk', 'pada', 'studi', 'kasus', 'dan', 'di', 'yang', 'dengan', 'ke',
  'dari', 'secara', 'terpadu', 'manajemen', 'pengolahan', 'data', 'implementasi', 'analisis',
  'desain', 'pembuatan', 'pengembangan', 'unsri', 'universitas', 'sriwijaya', 'fakultas',
  'ilmu', 'komputer', 'jurusan', 'prodi', 'dalam', 'sebagai', 'media', 'upaya', 'tinjauan',
  'kota', 'kabupaten', 'provinsi', 'pt', 'cv', 'toko', 'kantor', 'badan', 'dinas', 'unit',
  'adalah', 'ini', 'itu', 'oleh', 'atas', 'tentang', 'terhadap', 'bisa', 'dapat', 'akan'
]);

export const ENGLISH_STOPWORDS = new Set([
  'the', 'is', 'are', 'was', 'were', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'an', 'a', 'this', 'that', 'these', 'those', 'it', 'its', 'as',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'study', 'research',
  'aims', 'aim', 'aimed', 'system', 'application', 'based', 'using', 'used', 'developed',
  'development', 'design', 'designed', 'implementation', 'results', 'result', 'show',
  'shows', 'method', 'methods', 'data', 'process', 'processes', 'faculty', 'university',
  'sriwijaya', 'department', 'computer', 'science', 'management', 'order', 'can', 'help',
  'helps', 'helping', 'assist', 'assists', 'conducted', 'such', 'more', 'less', 'one'
]);

/**
 * Bilingual IT Concept Thesaurus for Fasilkom/D3 MI Theses:
 * Maps Indonesian keywords, English keywords, acronyms, and synonyms to canonical concept keys.
 */
export const BILINGUAL_IT_CONCEPT_DICT = [
  // ── 1. Software Engineering & Development Methods ──
  {
    key: 'rad',
    label: 'RAD (Rapid Application Development)',
    category: 'metode_pengembangan',
    terms: ['rad', 'rapid application development', 'rapid application', 'pengembangan aplikasi cepat']
  },
  {
    key: 'waterfall',
    label: 'Waterfall Model',
    category: 'metode_pengembangan',
    terms: ['waterfall', 'metode waterfall', 'air terjun', 'classic life cycle', 'sdlc waterfall']
  },
  {
    key: 'agile_scrum',
    label: 'Agile / Scrum',
    category: 'metode_pengembangan',
    terms: ['agile', 'scrum', 'agile framework', 'sprint', 'scrum method', 'metode scrum', 'kerangka agile', 'product backlog', 'daily standup']
  },
  {
    key: 'prototyping',
    label: 'Prototyping Method',
    category: 'metode_pengembangan',
    terms: ['prototype', 'prototipe', 'prototyping', 'metode prototype', 'model prototipe']
  },
  {
    key: 'extreme_programming',
    label: 'Extreme Programming (XP)',
    category: 'metode_pengembangan',
    terms: ['extreme programming', 'xp', 'metode xp']
  },
  {
    key: 'kanban',
    label: 'Kanban',
    category: 'metode_pengembangan',
    terms: ['kanban', 'metode kanban', 'papan kanban', 'kanban board']
  },

  // ── 2. Testing & Evaluation Methods ──
  {
    key: 'black_box',
    label: 'Black Box Testing',
    category: 'pengujian',
    terms: ['black box', 'blackbox', 'black-box', 'black box testing', 'pengujian black box', 'kotak hitam', 'boundary value analysis', 'equivalence partitioning']
  },
  {
    key: 'white_box',
    label: 'White Box Testing',
    category: 'pengujian',
    terms: ['white box', 'whitebox', 'pengujian white box', 'basis path testing', 'cyclomatic complexity']
  },
  {
    key: 'uat_usability',
    label: 'UAT / Usability Testing',
    category: 'pengujian',
    terms: ['uat', 'user acceptance test', 'user acceptance testing', 'usability', 'usability testing', 'pengujian usability', 'sus', 'system usability scale', 'iso 25010', 'iso 9126']
  },

  // ── 3. Modeling & Software Architecture ──
  {
    key: 'uml_modeling',
    label: 'UML (Unified Modeling Language)',
    category: 'pemodelan',
    terms: ['uml', 'unified modeling language', 'use case', 'activity diagram', 'class diagram', 'sequence diagram', 'deployment diagram', 'pemodelan uml']
  },
  {
    key: 'mvc_architecture',
    label: 'MVC (Model-View-Controller)',
    category: 'arsitektur',
    terms: ['mvc', 'model view controller', 'pola mvc', 'arsitektur mvc']
  },
  {
    key: 'rest_api',
    label: 'RESTful API / Web Service',
    category: 'arsitektur',
    terms: ['rest api', 'restful api', 'api', 'web service', 'layanan web', 'endpoint', 'json api']
  },
  {
    key: 'microservice',
    label: 'Microservices Architecture',
    category: 'arsitektur',
    terms: ['microservice', 'microservices', 'arsitektur microservice', 'layanan mikro']
  },
  {
    key: 'sso_oauth',
    label: 'Single Sign-On (SSO) / OAuth',
    category: 'keamanan',
    terms: ['single sign on', 'single sign-on', 'sso', 'oauth', 'oauth 2 0', 'oauth2', 'rbac', 'role based access control', 'autentikasi terpusat']
  },

  // ── 4. Tech Stacks & Platforms ──
  {
    key: 'laravel_framework',
    label: 'Laravel Framework',
    category: 'teknologi',
    terms: ['laravel', 'framework laravel', 'laravel framework']
  },
  {
    key: 'php_mysql',
    label: 'PHP & MySQL Database',
    category: 'teknologi',
    terms: ['php', 'mysql', 'mariadb', 'basis data mysql', 'relational database', 'xampp']
  },
  {
    key: 'react_vue_frontend',
    label: 'React / Vue SPA',
    category: 'teknologi',
    terms: ['react', 'react js', 'reactjs', 'vue', 'vue js', 'vuejs', 'single page application', 'spa']
  },
  {
    key: 'mobile_android',
    label: 'Mobile / Android / Flutter',
    category: 'teknologi',
    terms: ['android', 'flutter', 'react native', 'mobile app', 'aplikasi mobile', 'aplikasi android', 'smartphone']
  },
  {
    key: 'qr_barcode_rfid',
    label: 'QR Code / Barcode / RFID',
    category: 'teknologi',
    terms: ['qr code', 'qrcode', 'kode qr', 'barcode', 'kode batang', 'rfid', 'kartu rfid', 'pemindai qr', 'scan qr']
  },
  {
    key: 'iot_embedded',
    label: 'Internet of Things (IoT) / Sensor',
    category: 'teknologi',
    terms: ['iot', 'internet of things', 'sensor', 'arduino', 'esp32', 'esp8266', 'mikrokontroler', 'node mcu']
  },

  // ── 5. Business Domain & Functional Modules ──
  {
    key: 'inpatient_hospital',
    label: 'Rawat Inap / Rekam Medis (Inpatient/Medical Records)',
    category: 'domain_bisnis',
    terms: ['rawat inap', 'inpatient', 'inpatient service', 'rekam medis', 'medical record', 'electronic medical record', 'emr', 'klinik', 'clinic', 'puskesmas', 'rumah sakit', 'hospital', 'pasien', 'patient', 'poliklinik']
  },
  {
    key: 'ordering_menu_resto',
    label: 'Pemesanan Menu / Kafe / Reservasi (Ordering/Booking)',
    category: 'domain_bisnis',
    terms: ['pemesanan', 'pemesanan menu', 'menu ordering', 'order menu', 'pesan menu', 'ordering process', 'reservasi', 'reservation', 'booking', 'kafe', 'cafe', 'restoran', 'restaurant']
  },
  {
    key: 'sales_pos_ecommerce',
    label: 'Penjualan / Kasir / E-Commerce (Sales/Point of Sale)',
    category: 'domain_bisnis',
    terms: ['penjualan', 'sales', 'selling', 'pos', 'point of sale', 'point of sales', 'kasir', 'cashier', 'e-commerce', 'ecommerce', 'toko online', 'pembelian', 'purchasing']
  },
  {
    key: 'inventory_warehouse',
    label: 'Persediaan Barang / Gudang (Inventory/Stock)',
    category: 'domain_bisnis',
    terms: ['persediaan', 'persediaan barang', 'inventory', 'stock', 'stok barang', 'pergudangan', 'warehouse', 'kartu stok', 'eoq', 'safety stock', 'fifo']
  },
  {
    key: 'hr_payroll_attendance',
    label: 'Kepegawaian / Penggajian / Presensi (HR & Payroll)',
    category: 'domain_bisnis',
    terms: ['kepegawaian', 'sdm', 'human resources', 'employee', 'karyawan', 'pegawai', 'penggajian', 'payroll', 'salary', 'gaji', 'absensi', 'presensi', 'attendance']
  },
  {
    key: 'alumni_tracer',
    label: 'Alumni & Tracer Study',
    category: 'domain_bisnis',
    terms: ['alumni', 'tracer study', 'data alumni', 'alumni tracking', 'alumni information system', 'karir alumni']
  },
  {
    key: 'internal_audit_risk',
    label: 'Pengawasan Internal & Manajemen Risiko (Audit & Risk)',
    category: 'domain_bisnis',
    terms: ['satuan pengawas internal', 'spi', 'internal audit', 'internal supervisory', 'rekomendasi audit', 'audit recommendation', 'manajemen risiko', 'risk management', 'pemeriksaan internal']
  },
  {
    key: 'correspondence_archive',
    label: 'Arsip / Surat Menyurat (Correspondence/Archiving)',
    category: 'domain_bisnis',
    terms: ['arsip', 'kearsipan', 'archive', 'archiving', 'surat', 'surat menyurat', 'disposisi', 'disposisi surat', 'agenda surat', 'mail management']
  },
  {
    key: 'queue_service',
    label: 'Antrean Pelayanan (Queuing System)',
    category: 'domain_bisnis',
    terms: ['antrean', 'antrian', 'queue', 'queuing', 'nomor antrean', 'antrean pasien', 'pelayanan', 'customer service', 'loket']
  },
  {
    key: 'complaint_ticketing',
    label: 'Pengaduan / Keluhan / Helpdesk (Ticketing)',
    category: 'domain_bisnis',
    terms: ['pengaduan', 'aspirasi', 'keluhan', 'complaint', 'helpdesk', 'ticketing', 'tiket aduan']
  },
  {
    key: 'dss_spk',
    label: 'SPK (Sistem Pendukung Keputusan / DSS)',
    category: 'metode_analisis',
    terms: ['spk', 'sistem pendukung keputusan', 'decision support system', 'dss', 'ahp', 'analytic hierarchy process', 'topsis', 'saw', 'simple additive weighting', 'smart', 'wp', 'weighted product', 'moora']
  },
  {
    key: 'expert_system',
    label: 'Sistem Pakar (Expert System)',
    category: 'metode_analisis',
    terms: ['sistem pakar', 'expert system', 'forward chaining', 'backward chaining', 'certainty factor', 'teorema bayes', 'diagnosa']
  },
  {
    key: 'machine_learning_ai',
    label: 'Machine Learning / Data Mining',
    category: 'metode_analisis',
    terms: ['machine learning', 'data mining', 'k-means', 'clustering', 'klaster', 'klasifikasi', 'naive bayes', 'svm', 'support vector machine', 'knn', 'k-nearest neighbor', 'decision tree', 'c4 5', 'nlp', 'text mining', 'sentiment analysis', 'analisis sentimen']
  }
];

/**
 * Extracts recognized technical domain concepts from given text (supports ID & EN)
 * @param {string} text - Title or abstract text
 * @returns {Array<{ key: string, label: string, category: string }>}
 */
export function extractKeyConcepts(text) {
  if (!text) return [];
  const clean = ` ${text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ')} `;
  const matched = [];

  for (const concept of BILINGUAL_IT_CONCEPT_DICT) {
    const isMatched = concept.terms.some(term => {
      const paddedTerm = ` ${term.trim()} `;
      return clean.includes(paddedTerm);
    });

    if (isMatched) {
      matched.push({
        key: concept.key,
        label: concept.label,
        category: concept.category
      });
    }
  }

  return matched;
}

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

  const cleaned = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = cleaned.split(' ').filter(token => token.length > 1 && !stopwords.has(token));
  
  return tokens.join(' ');
}

/**
 * Pre-processes abstract string (handles Indonesian and English):
 * 1. Lowercase & remove punctuation
 * 2. Filter out both Indonesian & English stop-words
 * 3. Return core technical & domain tokens
 */
export function preProcessAbstract(abstractText) {
  if (!abstractText) return '';

  const cleaned = abstractText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = cleaned.split(' ').filter(token => {
    return token.length > 2 && !INDONESIAN_STOPWORDS.has(token) && !ENGLISH_STOPWORDS.has(token);
  });

  return tokens.join(' ');
}

/**
 * Evaluates similarity threshold according to Academic & PRD Rules:
 * - 0% to 30%: Aman (Green) -> Novelty kuat, siap diproses
 * - 31% to 50%: Peringatan Kuning (Yellow) -> Kemiripan topik parsial, perlu verifikasi novelty
 * - >50%: Blokir / Berisiko Merah (Red) -> Kemiripan tinggi dengan arsip repo UNSRI, wajib revisi judul/objek
 */
export function getSimilarityThreshold(score) {
  if (score <= 30) {
    return {
      status: 'aman',
      color: 'emerald',
      bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badgeText: 'Aman (< 30%)',
      allowSubmit: true,
      message: 'Tingkat kemiripan rendah. Topik memiliki kebaruan (novelty) yang baik dan pengajuan dapat dilanjutkan.'
    };
  } else if (score <= 50) {
    return {
      status: 'peringatan',
      color: 'amber',
      bgClass: 'bg-amber-50 text-amber-700 border-amber-200',
      badgeText: 'Perlu Penyesuaian (31% - 50%)',
      allowSubmit: true,
      message: 'Ditemukan kemiripan parsial pada topik, metode, atau domain bisnis dengan arsip repositori. Pastikan kebaruan (novelty) Anda jelas.'
    };
  } else {
    return {
      status: 'blokir',
      color: 'red',
      bgClass: 'bg-red-50 text-red-700 border-red-200',
      badgeText: 'Berisiko Tinggi (> 50%)',
      allowSubmit: false,
      message: 'Skor kemiripan melebihi 50% terhadap arsip tugas akhir di Repositori UNSRI. Silakan modifikasi judul, objek studi, atau metodologi Anda.'
    };
  }
}

