/**
 * SIMTA Backend Service - Thesis Title Management, Stemming (Kata Dasar),
 * Bilingual Pre-processing (ID <-> EN) & Similarity Logic
 */

export const INDONESIAN_STOPWORDS = new Set([
  // Kata sambung & kata depan umum
  'dan', 'atau', 'di', 'ke', 'dari', 'pada', 'dalam', 'untuk', 'dengan', 'sebagai',
  'secara', 'yang', 'adalah', 'ialah', 'merupakan', 'ini', 'itu', 'tersebut', 'oleh',
  'atas', 'tentang', 'terhadap', 'bagi', 'demi', 'guna', 'agar', 'supaya', 'sehingga',
  'karena', 'sebab', 'namun', 'tetapi', 'akan', 'dapat', 'bisa', 'harus', 'perlu',
  'belum', 'sudah', 'telah', 'sedang', 'masih', 'saat', 'ketika', 'hingga', 'sampai',
  'antara', 'melalui', 'tanpa', 'serta', 'maupun', 'juga', 'hanya', 'sangat', 'lebih',
  'kurang', 'paling', 'semua', 'seluruh', 'setiap', 'beberapa', 'sebuah', 'suatu',
  'para', 'hal', 'cara', 'banyak', 'besar', 'kecil', 'tinggi', 'rendah', 'baru', 'lama',

  // Kosakata boilerplate akademik / judul / abstrak Fasilkom
  'sistem', 'informasi', 'aplikasi', 'rancang', 'bangun', 'perancangan', 'pembuatan',
  'pengembangan', 'perkembangan', 'kembang', 'implementasi', 'analisis', 'desain', 'berbasis', 'web', 'website',
  'mobile', 'menggunakan', 'guna', 'studi', 'kasus', 'metode', 'pendekatan', 'penelitian', 'teliti',
  'penulis', 'penulisan', 'skripsi', 'tugas', 'akhir', 'proyek', 'bertujuan', 'tujuan', 'tuju',
  'membahas', 'bahas', 'meneliti', 'dilakukan', 'melakukan', 'laku', 'membuat', 'buat', 'membangun', 'merancang',
  'mengembangkan', 'menerapkan', 'terap', 'membantu', 'bantu', 'mempermudah', 'memudahkan', 'mudah', 'mendukung', 'dukung',
  'meningkatkan', 'tingkat', 'mempercepat', 'cepat', 'mengurangi', 'meminimalkan', 'mengatasi', 'menyediakan',
  'menghasilkan', 'menunjukkan', 'diharapkan', 'harap', 'terpadu', 'terintegrasi', 'optimal',
  'efektif', 'efektivitas', 'efisien', 'efisiensi', 'akurat', 'tepat', 'baik',
  'kendala', 'masalah', 'permasalahan', 'solusi', 'kondisi', 'proses', 'menuntut', 'tuntut',
  'sektor', 'konsep', 'berkonsep', 'menjadi', 'jadi', 'memberikan', 'beri',
  'tahap', 'tahapan', 'fase', 'langkah', 'fitur', 'fungsi', 'berfungsi', 'sesuai',
  'kebutuhan', 'butuh', 'pengumpulan', 'observasi', 'wawancara', 'dokumentasi', 'pustaka',
  'literatur', 'kuesioner', 'angket', 'hasil', 'kesimpulan', 'saran', 'kata', 'kunci',
  'manual', 'konvensional', 'komputerisasi', 'terkomputerisasi', 'sederhana', 'kompleks',
  'jumlah', 'kualitas', 'kinerja', 'media', 'sarana', 'upaya', 'tinjauan',
  'manajemen', 'pengolahan', 'pendataan', 'pengujian', 'uji', 'coba', 'data', 'basis',
  'online', 'offline', 'platform', 'teknologi',

  // Nama lokasi, institusi & jenis instansi generik
  'unsri', 'universitas', 'sriwijaya', 'fakultas', 'ilmu', 'komputer', 'fasilkom',
  'jurusan', 'prodi', 'program', 'diploma', 'informatika', 'negeri', 'kota', 'kabupaten',
  'provinsi', 'palembang', 'indralaya', 'prabumulih', 'muara', 'enim', 'baturaja',
  'lahat', 'oki', 'sumatera', 'selatan', 'indonesia', 'pt', 'cv', 'ud', 'tb', 'toko',
  'kantor', 'badan', 'dinas', 'unit', 'instansi', 'lembaga', 'yayasan', 'perusahaan'
]);

export const ENGLISH_STOPWORDS = new Set([
  // English function words
  'the', 'a', 'an', 'and', 'or', 'but', 'nor', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'as', 'into', 'onto', 'upon', 'out', 'over', 'under', 'between',
  'among', 'through', 'during', 'within', 'without', 'before', 'after', 'since', 'until',
  'about', 'above', 'below', 'across', 'against', 'along', 'around', 'is', 'are', 'was',
  'were', 'be', 'been', 'being', 'am', 'has', 'have', 'had', 'having', 'do', 'does',
  'did', 'doing', 'done', 'will', 'would', 'shall', 'should', 'can', 'could', 'may',
  'might', 'must', 'this', 'that', 'these', 'those', 'it', 'its', 'they', 'their',
  'them', 'we', 'our', 'you', 'your', 'he', 'she', 'his', 'her', 'which', 'who',
  'whom', 'whose', 'what', 'where', 'when', 'why', 'how', 'while', 'whereas', 'if',
  'then', 'else', 'than', 'so', 'such', 'because', 'therefore', 'however', 'moreover',
  'furthermore', 'additionally', 'addition', 'also', 'both', 'each', 'every', 'all',
  'any', 'some', 'many', 'much', 'more', 'most', 'less', 'least', 'few', 'several',
  'other', 'another', 'same', 'different', 'various', 'only', 'just', 'even', 'very',
  'still', 'yet', 'already', 'currently', 'previously', 'previously', 'far', 'often',
  'usually', 'generally', 'especially', 'namely', 'including', 'include', 'includes',
  'etc', 'one', 'two', 'three', 'first', 'second', 'third', 'well', 'there', 'here',

  // Academic abstract & software thesis boilerplate (EN)
  'study', 'research', 'paper', 'thesis', 'final', 'project', 'author', 'authors',
  'abstract', 'keywords', 'keyword', 'aim', 'aims', 'aimed', 'objective', 'objectives',
  'purpose', 'purposes', 'intended', 'system', 'systems', 'application', 'applications',
  'app', 'software', 'website', 'web', 'based', 'online', 'mobile', 'information',
  'technology', 'technological', 'computer', 'computerized', 'program', 'programming',
  'language', 'coding', 'code', 'develop', 'develops', 'developed', 'developing',
  'development', 'design', 'designs', 'designed', 'designing', 'build', 'builds',
  'built', 'building', 'create', 'creates', 'created', 'creating', 'make', 'makes',
  'making', 'made', 'implement', 'implements', 'implemented', 'implementing',
  'implementation', 'use', 'uses', 'used', 'using', 'utilize', 'utilizes', 'utilizing',
  'conduct', 'conducted', 'carry', 'carries', 'carried', 'carrying', 'collect',
  'collected', 'obtain', 'obtained', 'provide', 'provides', 'providing', 'consist',
  'consists', 'consisting', 'support', 'supports', 'supporting', 'assist', 'assists',
  'assisting', 'help', 'helps', 'helping', 'facilitate', 'facilitates', 'facilitating',
  'simplify', 'simplifies', 'improving', 'improve', 'improves', 'improved', 'improvement',
  'increase', 'increases', 'increasing', 'reduce', 'reduces', 'reducing', 'enable',
  'enables', 'enabling', 'able', 'allow', 'allows', 'allowing', 'need', 'needs',
  'needed', 'require', 'requires', 'required', 'requiring', 'requirement', 'requirements',
  'result', 'results', 'resulting', 'show', 'shows', 'showed', 'shown', 'indicate',
  'indicates', 'indicated', 'conclude', 'concluded', 'expect', 'expected', 'method',
  'methods', 'methodology', 'approach', 'stage', 'stages', 'phase', 'phases', 'step',
  'steps', 'process', 'processes', 'processing', 'feature', 'features', 'function',
  'functions', 'functioning', 'properly', 'accordance', 'according', 'manner', 'way',
  'problem', 'problems', 'issue', 'issues', 'condition', 'conditions', 'situation',
  'cause', 'causes', 'causing', 'error', 'errors', 'mistake', 'mistakes', 'loss',
  'damage', 'prone', 'delay', 'delays', 'lack', 'difficulty', 'difficult', 'difficulties',
  'manual', 'manually', 'conventional', 'conventionally', 'ineffective', 'effective',
  'effectively', 'effectiveness', 'efficient', 'efficiently', 'efficiency', 'optimal',
  'optimally', 'optimize', 'structured', 'organized', 'integrated', 'systematic',
  'systematically', 'accurate', 'accurately', 'accuracy', 'fast', 'faster', 'quick',
  'quickly', 'easy', 'easier', 'easily', 'convenience', 'convenient', 'benefit',
  'benefits', 'beneficial', 'useful', 'time', 'long', 'good', 'better', 'best',
  'new', 'old', 'still', 'observation', 'observations', 'interview', 'interviews',
  'documentation', 'literature', 'field', 'area', 'work', 'worked', 'running', 'takes',
  'take', 'taking', 'directly', 'direct', 'data', 'database', 'management', 'managing',
  'manage', 'platform', 'solution',

  // Institutional & geographic boilerplate (EN)
  'university', 'sriwijaya', 'faculty', 'department', 'informatics', 'science',
  'palembang', 'prabumulih', 'indralaya', 'south', 'sumatra', 'indonesia', 'city',
  'regency', 'province', 'district', 'public', 'state', 'company', 'office', 'engaged'
]);

/**
 * Multi-word domain phrases normalized before stemming so compound ID & EN concepts stay intact.
 */
export const PHRASE_NORMALIZATIONS = [
  [/\bqr[\s-]*codes?\b/gi, 'qrcode'],
  [/\bkode[\s-]*qr\b/gi, 'qrcode'],
  [/\bbar[\s-]*codes?\b/gi, 'barcode'],
  [/\bkode[\s-]*batang\b/gi, 'barcode'],
  [/\bpoint[\s-]+of[\s-]+sales?\b/gi, 'pos cashier'],
  [/\bsoftware[\s-]+as[\s-]+a[\s-]+service\b/gi, 'saas'],
  [/\bmulti[\s-]+tenant\b/gi, 'multitenant'],
  [/\busaha[\s-]+mikro[\s,]+kecil[\s,]+(dan[\s-]+)?menengah\b/gi, 'umkm'],
  [/\bmicro[\s,]+small[\s,]+(and[\s-]+)?medium[\s-]+enterprises?\b/gi, 'umkm'],
  [/\barus[\s-]+kas\b/gi, 'cashflow'],
  [/\bcash[\s-]*flows?\b/gi, 'cashflow'],
  [/\bblack[\s-]*box(\s+testing)?\b/gi, 'blackbox'],
  [/\bkotak[\s-]+hitam\b/gi, 'blackbox'],
  [/\bwhite[\s-]*box(\s+testing)?\b/gi, 'whitebox'],
  [/\brapid[\s-]+application[\s-]+development\b/gi, 'rad'],
  [/\buser[\s-]+acceptance[\s-]+test(ing)?\b/gi, 'uat'],
  [/\bsystem[\s-]+usability[\s-]+scale\b/gi, 'usability'],
  [/\bsingle[\s-]+sign[\s-]*on\b/gi, 'sso'],
  [/\brole[\s-]+based[\s-]+access[\s-]+control\b/gi, 'rbac'],
  [/\bmodel[\s-]+view[\s-]+controller\b/gi, 'mvc'],
  [/\bunified[\s-]+modeling[\s-]+language\b/gi, 'uml'],
  [/\buse[\s-]+case(\s+diagrams?)?\b/gi, 'uml usecase'],
  [/\bactivity[\s-]+diagrams?\b/gi, 'uml'],
  [/\bclass[\s-]+diagrams?\b/gi, 'uml'],
  [/\bsequence[\s-]+diagrams?\b/gi, 'uml'],
  [/\brawat[\s-]+inap\b/gi, 'inpatient'],
  [/\brawat[\s-]+jalan\b/gi, 'outpatient'],
  [/\brekam[\s-]+medis\b/gi, 'medical_record'],
  [/\bmedical[\s-]+records?\b/gi, 'medical_record'],
  [/\brumah[\s-]+sakit\b/gi, 'hospital'],
  [/\bsurat[\s-]+masuk\b/gi, 'incoming_mail mail'],
  [/\bincoming[\s-]+(mail|letter)s?\b/gi, 'incoming_mail mail'],
  [/\bsurat[\s-]+keluar\b/gi, 'outgoing_mail mail'],
  [/\boutgoing[\s-]+(mail|letter)s?\b/gi, 'outgoing_mail mail'],
  [/\bdisposisi[\s-]+surat\b/gi, 'disposition mail'],
  [/\bletter[\s-]+disposition\b/gi, 'disposition mail'],
  [/\btanda[\s-]+terima\b/gi, 'receipt'],
  [/\bsatuan[\s-]+pengawas(an)?[\s-]+internal\b/gi, 'internal_audit'],
  [/\binternal[\s-]+(supervisory|audit)[\s-]*(unit|board)?\b/gi, 'internal_audit'],
  [/\bmanajemen[\s-]+risiko\b/gi, 'risk_management'],
  [/\brisk[\s-]+management\b/gi, 'risk_management'],
  [/\bsistem[\s-]+pendukung[\s-]+keputusan\b/gi, 'dss'],
  [/\bdecision[\s-]+support[\s-]+systems?\b/gi, 'dss'],
  [/\bsistem[\s-]+pakar\b/gi, 'expert_system'],
  [/\bexpert[\s-]+systems?\b/gi, 'expert_system'],
  [/\bforward[\s-]+chaining\b/gi, 'forward_chaining'],
  [/\bbackward[\s-]+chaining\b/gi, 'backward_chaining'],
  [/\bcertainty[\s-]+factor\b/gi, 'certainty_factor'],
  [/\banalytic(al)?[\s-]+hierarchy[\s-]+process\b/gi, 'ahp'],
  [/\bsimple[\s-]+additive[\s-]+weighting\b/gi, 'saw'],
  [/\bweighted[\s-]+product\b/gi, 'wp'],
  [/\bnaive[\s-]+bayes\b/gi, 'naive_bayes'],
  [/\bsupport[\s-]+vector[\s-]+machines?\b/gi, 'svm'],
  [/\bdecision[\s-]+trees?\b/gi, 'decision_tree'],
  [/\bk[\s-]+nearest[\s-]+neighbors?\b/gi, 'knn'],
  [/\bk[\s-]+means\b/gi, 'kmeans'],
  [/\bdata[\s-]+mining\b/gi, 'data_mining'],
  [/\bmachine[\s-]+learning\b/gi, 'machine_learning'],
  [/\bdeep[\s-]+learning\b/gi, 'deep_learning'],
  [/\btext[\s-]+mining\b/gi, 'text_mining'],
  [/\bsentiment[\s-]+analysis\b/gi, 'sentiment_analysis'],
  [/\banalisis[\s-]+sentimen\b/gi, 'sentiment_analysis'],
  [/\binternet[\s-]+of[\s-]+things\b/gi, 'iot'],
  [/\bgeographic[\s-]+information[\s-]+systems?\b/gi, 'gis'],
  [/\bsistem[\s-]+informasi[\s-]+geografis\b/gi, 'gis'],
  [/\btoko[\s-]+online\b/gi, 'ecommerce'],
  [/\be[\s-]+commerce\b/gi, 'ecommerce'],
  [/\btracer[\s-]+study\b/gi, 'tracer_study'],
  [/\blearning[\s-]+management[\s-]+systems?\b/gi, 'lms'],
  [/\bsupply[\s-]+chain\b/gi, 'supply_chain'],
  [/\bsafety[\s-]+stock\b/gi, 'safety_stock'],
  [/\bgoogle[\s-]+maps?\b/gi, 'gps map'],
  [/\brias[\s-]+pengantin\b/gi, 'bridal makeup'],
  [/\bbridal[\s-]+makeup\b/gi, 'bridal makeup'],
  [/\bsumber[\s-]+daya[\s-]+manusia\b/gi, 'hr employee'],
  [/\bhuman[\s-]+resources?\b/gi, 'hr employee'],
  [/\bpraktek[\s-]+kerja[\s-]+industri\b/gi, 'internship'],
  [/\bindustrial[\s-]+work[\s-]+practices?\b/gi, 'internship'],
  [/\bdemam[\s-]+berdarah\b/gi, 'dengue'],
  [/\bdengue[\s-]+hemorrhagic[\s-]+fever\b/gi, 'dengue'],
  [/\bpayment[\s-]+gateway\b/gi, 'payment gateway'],
  [/\bextreme[\s-]+programming\b/gi, 'xp']
];

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
    key: 'saas_multitenant',
    label: 'SaaS / Multi-Tenant Cloud',
    category: 'arsitektur',
    terms: ['saas', 'software as a service', 'multi-tenant', 'multi tenant', 'multitenant', 'cloud platform', 'berlangganan', 'subscription']
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
  {
    key: 'gis_mapping',
    label: 'GIS / Pemetaan Lokasi',
    category: 'teknologi',
    terms: ['gis', 'geographic information system', 'sistem informasi geografis', 'pemetaan', 'google maps', 'leaflet', 'koordinat']
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
    label: 'Restoran / Kafe / Kuliner & Menu',
    category: 'domain_bisnis',
    terms: ['menu', 'pemesanan menu', 'menu ordering', 'order menu', 'pesan menu', 'pemesanan makanan', 'pemesanan meja', 'kafe', 'cafe', 'restoran', 'restaurant', 'kuliner', 'culinary', 'warung', 'angkringan', 'kedai', 'dishes']
  },
  {
    key: 'reservation_booking',
    label: 'Pemesanan / Reservasi / Booking',
    category: 'domain_bisnis',
    terms: ['pemesanan', 'pesan', 'ordering', 'order', 'orders', 'reservasi', 'reservation', 'booking']
  },
  {
    key: 'payment_gateway_cashflow',
    label: 'Pembayaran / Arus Kas / Keuangan',
    category: 'domain_bisnis',
    terms: ['pembayaran', 'payment', 'payments', 'payment gateway', 'qris', 'e-wallet', 'arus kas', 'cashflow', 'cash flow', 'tagihan', 'invoice', 'billing', 'keuangan']
  },
  {
    key: 'umkm_sme',
    label: 'UMKM / Usaha Mikro Kecil Menengah',
    category: 'domain_bisnis',
    terms: ['umkm', 'usaha mikro', 'usaha kecil', 'usaha menengah', 'sme', 'msme']
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
    terms: ['kepegawaian', 'sdm', 'human resources', 'employee', 'employees', 'karyawan', 'pegawai', 'penggajian', 'payroll', 'salary', 'gaji', 'absensi', 'presensi', 'attendance']
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
    terms: ['arsip', 'kearsipan', 'archive', 'archiving', 'archives', 'surat', 'surat menyurat', 'disposisi', 'disposisi surat', 'agenda surat', 'mail management', 'incoming letters', 'outgoing letters']
  },
  {
    key: 'library_borrowing',
    label: 'Perpustakaan & Peminjaman Buku',
    category: 'domain_bisnis',
    terms: ['perpustakaan', 'library', 'peminjaman buku', 'book borrowing', 'pengembalian buku', 'katalog buku']
  },
  {
    key: 'e_learning_academic',
    label: 'E-Learning / Akademik / Sekolah',
    category: 'domain_bisnis',
    terms: ['e-learning', 'elearning', 'lms', 'learning management system', 'pembelajaran', 'prakerin', 'rapor', 'siswa', 'kurikulum']
  },
  {
    key: 'queue_service',
    label: 'Antrean Pelayanan (Queuing System)',
    category: 'domain_bisnis',
    terms: ['antrean', 'antrian', 'queue', 'queuing', 'nomor antrean', 'antrean pasien', 'loket']
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
 * Protected Indonesian words & irregular stems that must NOT lose endings (-i/-an/-kan) or prefixes.
 */
const ID_IRREGULAR_AND_PROTECTED = {
  // Irregular/special morphological mappings
  efisiensi: 'efisien',
  efektivitas: 'efektif',
  digitalisasi: 'digital',
  terdigitalisasi: 'digital',
  mendigitalisasi: 'digital',
  inventarisasi: 'inventaris',
  otomatisasi: 'otomatis',
  optimalisasi: 'optimal',
  visualisasi: 'visual',
  aktualisasi: 'aktual',
  kebutuhan: 'butuh',
  kegiatan: 'giat',
  keuangan: 'uang',
  kehadiran: 'hadir',
  kemudahan: 'mudah',
  keamanan: 'aman',
  kecepatan: 'cepat',
  keputusan: 'putus',
  keluhan: 'keluh',
  kesehatan: 'sehat',
  kepegawaian: 'pegawai',
  kepatuhan: 'patuh',
  ketepatan: 'tepat',
  keterlambatan: 'lambat',
  kearsipan: 'arsip',
  perusahaan: 'usaha',
  perpustakaan: 'pustaka',
  pembelajaran: 'ajar',
  pelayanan: 'layan',
  pelanggan: 'pelanggan',
  pegawai: 'pegawai',
  karyawan: 'karyawan',
  pemasaran: 'pasar',
  pemesanan: 'pesan',
  pesanan: 'pesan',
  memesan: 'pesan',
  pemrosesan: 'proses',
  memproses: 'proses',
  pembayaran: 'bayar',
  membayar: 'bayar',
  pembelian: 'beli',
  membeli: 'beli',
  penjualan: 'jual',
  menjual: 'jual',
  pelacakan: 'lacak',
  melacak: 'lacak',
  pengelolaan: 'kelola',
  mengelola: 'kelola',
  dikelola: 'kelola',
  pengolahan: 'olah',
  mengolah: 'olah',
  pengiriman: 'kirim',
  mengirim: 'kirim',
  penerimaan: 'terima',
  menerima: 'terima',
  pendaftaran: 'daftar',
  mendaftar: 'daftar',
  pencatatan: 'catat',
  mencatat: 'catat',
  pencarian: 'cari',
  mencari: 'cari',
  penyimpanan: 'simpan',
  menyimpan: 'simpan',
  pelaporan: 'lapor',
  laporan: 'lapor',
  melapor: 'lapor',
  pemantauan: 'pantau',
  memantau: 'pantau',
  pengawasan: 'awas',
  pengawas: 'awas',
  penjadwalan: 'jadwal',
  menjadwal: 'jadwal',
  penilaian: 'nilai',
  menilai: 'nilai',
  peminjaman: 'pinjam',
  meminjam: 'pinjam',
  pengembalian: 'kembali',
  mengembalikan: 'kembali',
  persediaan: 'sedia',
  menyediakan: 'sedia',
  penggajian: 'gaji',
  pengguna: 'guna',
  penggunaan: 'guna',
  menggunakan: 'guna',
  pembuatan: 'buat',
  pengembangan: 'kembang',
  mengembangkan: 'kembang',
  perancangan: 'rancang',
  merancang: 'rancang',
  pengujian: 'uji',
  menguji: 'uji',
  pengaduan: 'adu',
  mengadu: 'adu',
  pengajuan: 'aju',
  mengajukan: 'aju',
  persetujuan: 'setuju',
  menyetujui: 'setuju',
  pemetaan: 'peta',
  memetakan: 'peta',
  penelusuran: 'telusur',
  pendapatan: 'dapat',
  pengeluaran: 'keluar',
  pemasukan: 'masuk',
  pemeliharaan: 'pelihara',
  perawatan: 'rawat',
  merawat: 'rawat',
  pemeriksaan: 'periksa',
  memeriksa: 'periksa',
  penanganan: 'tangan',
  pembukuan: 'buku',
  penerapan: 'terap',
  menerapkan: 'terap',
  penentuan: 'tentu',
  menentukan: 'tentu',
  pemilihan: 'pilih',
  memilih: 'pilih',
  pembagian: 'bagi',
  pengaturan: 'atur',
  mengatur: 'atur',
  perhitungan: 'hitung',
  menghitung: 'hitung',
  pendistribusian: 'distribusi',
  mengintegrasikan: 'integrasi',
  terintegrasi: 'integrasi',
  makanan: 'makan',
  minuman: 'minum',
  ruangan: 'ruang',
  tagihan: 'tagih',
  menagih: 'tagih',
  aspirasi: 'aspirasi',
  // Protected stems (must stay intact)
  aplikasi: 'aplikasi',
  informasi: 'informasi',
  teknologi: 'teknologi',
  transaksi: 'transaksi',
  integrasi: 'integrasi',
  validasi: 'validasi',
  verifikasi: 'verifikasi',
  rekomendasi: 'rekomendasi',
  klasifikasi: 'klasifikasi',
  notifikasi: 'notifikasi',
  dokumentasi: 'dokumentasi',
  publikasi: 'publikasi',
  evaluasi: 'evaluasi',
  operasi: 'operasi',
  operasional: 'operasi',
  komunikasi: 'komunikasi',
  registrasi: 'registrasi',
  administrasi: 'administrasi',
  reservasi: 'reservasi',
  observasi: 'observasi',
  inovasi: 'inovasi',
  lokasi: 'lokasi',
  navigasi: 'navigasi',
  akreditasi: 'akreditasi',
  donasi: 'donasi',
  mutasi: 'mutasi',
  distribusi: 'distribusi',
  institusi: 'institusi',
  produksi: 'produksi',
  edukasi: 'edukasi',
  simulasi: 'simulasi',
  presentasi: 'presentasi',
  konsultasi: 'konsultasi',
  disposisi: 'disposisi',
  diagnosa: 'diagnosa',
  diagnosis: 'diagnosa',
  inventaris: 'inventaris',
  dinamis: 'dinamis',
  statis: 'statis',
  medis: 'medis',
  klinis: 'klinis',
  teknis: 'teknis',
  bisnis: 'bisnis',
  gratis: 'gratis',
  absensi: 'absensi',
  presensi: 'presensi',
  akuntansi: 'akuntansi',
  koperasi: 'koperasi',
  asuransi: 'asuransi',
  garansi: 'garansi',
  instansi: 'instansi',
  frekuensi: 'frekuensi',
  potensi: 'potensi',
  kompetensi: 'kompetensi',
  kategori: 'kategori',
  materi: 'materi',
  industri: 'industri',
  energi: 'energi',
  gizi: 'gizi',
  cuti: 'cuti',
  kursi: 'kursi',
  kopi: 'kopi',
  roti: 'roti',
  tani: 'tani',
  seni: 'seni',
  alumni: 'alumni',
  kuliner: 'kuliner',
  restoran: 'restoran',
  kafe: 'kafe',
  menu: 'menu',
  meja: 'meja',
  digital: 'digital',
  terima: 'terima',
  kerja: 'kerja',
  kertas: 'kertas',
  kelola: 'kelola',
  pesan: 'pesan',
  kasir: 'kasir',
  paket: 'paket',
  tiket: 'tiket',
  klinik: 'klinik',
  pasien: 'pasien',
  dokter: 'dokter',
  guru: 'guru',
  siswa: 'siswa',
  mahasiswa: 'mahasiswa',
  dosen: 'dosen',
  surat: 'surat',
  arsip: 'arsip',
  barang: 'barang',
  produk: 'produk',
  gudang: 'gudang',
  kredit: 'kredit',
  parkir: 'parkir',
  wisata: 'wisata',
  hotel: 'hotel',
  masjid: 'masjid',
  pajak: 'pajak',
  zakat: 'zakat',
  umkm: 'umkm',
  salah: 'salah',
  kesalahan: 'salah',
  risiko: 'risiko',
  berisiko: 'risiko',
  perkembangan: 'kembang',
  perkebunan: 'kebun',
  penurunan: 'turun',
  serangan: 'serang',
  struk: 'struk',
  cetak: 'cetak',
  mencetak: 'cetak',
  pencetakan: 'cetak',
  formulir: 'formulir'
};

/**
 * Known English irregular & academic root mappings (word -> stem).
 */
const EN_IRREGULAR_AND_PROTECTED = {
  paid: 'pay',
  paying: 'pay',
  pays: 'pay',
  payment: 'pay',
  payments: 'pay',
  built: 'build',
  sold: 'sell',
  selling: 'sell',
  sales: 'sale',
  bought: 'buy',
  buying: 'buy',
  purchasing: 'purchase',
  purchased: 'purchase',
  sent: 'send',
  made: 'make',
  held: 'hold',
  kept: 'keep',
  found: 'find',
  wrote: 'write',
  written: 'write',
  driven: 'drive',
  children: 'child',
  people: 'person',
  cafes: 'cafe',
  café: 'cafe',
  cafés: 'cafe',
  dishes: 'dish',
  taxes: 'tax',
  boxes: 'box',
  classes: 'class',
  statuses: 'status',
  processes: 'process',
  addresses: 'address',
  analyses: 'analysis',
  diagnoses: 'diagnosis',
  criteria: 'criterion',
  menus: 'menu',
  tables: 'table',
  orders: 'order',
  ordered: 'order',
  ordering: 'order',
  booking: 'booking',
  booked: 'booking',
  bookings: 'booking',
  book: 'book',
  books: 'book',
  tracking: 'track',
  tracked: 'track',
  tracks: 'track',
  managing: 'manage',
  managed: 'manage',
  manages: 'manage',
  manager: 'manage',
  managers: 'manage',
  management: 'manage',
  customers: 'customer',
  clients: 'client',
  consumers: 'consumer',
  restaurants: 'restaurant',
  stores: 'store',
  shops: 'shop',
  warehouses: 'warehouse',
  inventories: 'inventory',
  inventory: 'inventory',
  transactions: 'transact',
  transaction: 'transact',
  transacting: 'transact',
  reporting: 'report',
  reported: 'report',
  reports: 'report',
  recording: 'record',
  recorded: 'record',
  records: 'record',
  monitoring: 'monitor',
  monitored: 'monitor',
  monitors: 'monitor',
  testing: 'test',
  tested: 'test',
  tests: 'test',
  archiving: 'archive',
  archived: 'archive',
  archives: 'archive',
  scheduling: 'schedule',
  scheduled: 'schedule',
  schedules: 'schedule',
  calculating: 'calculate',
  calculated: 'calculate',
  calculation: 'calculate',
  calculations: 'calculate',
  evaluating: 'evaluate',
  evaluated: 'evaluate',
  evaluation: 'evaluate',
  delivery: 'deliver',
  deliveries: 'deliver',
  delivering: 'deliver',
  delivered: 'deliver',
  receipts: 'receipt',
  receiving: 'receive',
  received: 'receive',
  receives: 'receive',
  employees: 'employee',
  salaries: 'salary',
  attendance: 'attend',
  attending: 'attend',
  attended: 'attend',
  patients: 'patient',
  clinics: 'clinic',
  hospitals: 'hospital',
  doctors: 'doctor',
  drugs: 'drug',
  medicines: 'medicine',
  medical: 'medic',
  libraries: 'library',
  borrowing: 'borrow',
  borrowed: 'borrow',
  returning: 'return',
  returned: 'return',
  students: 'student',
  lecturers: 'lecturer',
  teachers: 'teacher',
  schools: 'school',
  graduates: 'graduate',
  graduated: 'graduate',
  letters: 'letter',
  documents: 'document',
  files: 'file',
  notifications: 'notify',
  notification: 'notify',
  notifying: 'notify',
  notified: 'notify',
  verifying: 'verify',
  verified: 'verify',
  verification: 'verify',
  validating: 'validate',
  validated: 'validate',
  validation: 'validate',
  integrating: 'integrate',
  integrated: 'integrate',
  integration: 'integrate',
  operating: 'operate',
  operated: 'operate',
  operates: 'operate',
  operational: 'operate',
  operations: 'operate',
  operation: 'operate',
  centralized: 'central',
  centralization: 'central',
  digitization: 'digital',
  digitalization: 'digital',
  digitizing: 'digital',
  digitized: 'digital',
  digital: 'digital',
  services: 'service',
  reviews: 'review',
  reviewed: 'review',
  comments: 'comment',
  searching: 'search',
  searched: 'search',
  searches: 'search',
  storing: 'storage',
  stored: 'storage',
  storage: 'storage',
  goods: 'goods',
  products: 'product',
  items: 'item',
  users: 'user',
  admins: 'admin',
  administrators: 'admin',
  administration: 'admin',
  administrative: 'admin',
  recommendations: 'recommend',
  recommendation: 'recommend',
  recommended: 'recommend',
  classifications: 'classify',
  classification: 'classify',
  classified: 'classify',
  predictions: 'predict',
  prediction: 'predict',
  predicting: 'predict',
  predicted: 'predict',
  clustering: 'cluster',
  clustered: 'cluster',
  clusters: 'cluster',
  reservations: 'reserve',
  reservation: 'reserve',
  reserving: 'reserve',
  reserved: 'reserve',
  complaints: 'complaint',
  complaining: 'complaint',
  registrations: 'register',
  registration: 'register',
  registering: 'register',
  registered: 'register',
  audits: 'audit',
  auditing: 'audit',
  audited: 'audit',
  risks: 'risk',
  queues: 'queue',
  queuing: 'queue',
  queueing: 'queue',
  tourism: 'tourism',
  locations: 'locate',
  location: 'locate',
  mapping: 'map',
  mapped: 'map',
  maps: 'map',
  routes: 'route',
  routing: 'route',
  vehicles: 'vehicle',
  financial: 'finance',
  accounting: 'account',
  activities: 'activity',
  facilities: 'facility',
  enterprises: 'enterprise',
  businesses: 'business',
  business: 'business',
  culinary: 'culinary',
  dynamic: 'dynamic',
  dynamically: 'dynamic'
};

/**
 * Checks if a word looks distinctively English (so Indonesian prefix stripper won't corrupt it).
 */
function looksLikeEnglishWord(w) {
  if (EN_IRREGULAR_AND_PROTECTED[w]) return true;
  if (/(tion|sion|ment|ness|ship|able|ible|ious|eous|izing|ising|ized|ised|ings|ence|ance|ally|ful|less)$/.test(w)) return true;
  if (w.length > 5 && /(ing|ed|ly|ies|ied)$/.test(w) && !/[aiu]n$/.test(w)) return true;
  if (/^(th|wh|sh|ch|sc|sp|st|tr|pr|pl|cr|dr|gr|fr|fl|bl|br|str|shr)/.test(w) && w.length >= 4) {
    // Exclude Indonesian valid words starting with tr/pr/st like transaksi, proses, strategi, produk, struktur
    return !/^(transaksi|transpar|proses|produk|profil|prodi|program|proyek|strategi|struktur|standar|statistik|stunting|praktik|praktek|prestasi|pribadi)/.test(w);
  }
  return false;
}

/**
 * Stems an Indonesian word into its root word (kata dasar).
 * Uses direct academic lexicon first, then safe affix stripping with morphological guards.
 */
export function stemIndonesian(rawWord) {
  const w = String(rawWord || '').toLowerCase().trim();
  if (!w || w.length <= 3) return w;
  if (ID_IRREGULAR_AND_PROTECTED[w]) return ID_IRREGULAR_AND_PROTECTED[w];
  if (looksLikeEnglishWord(w)) return w;

  let cur = w;

  // 1. Strip particles (-lah, -kah, -tah, -pun) only for suffixed longer words
  if (cur.length > 6 && !/(salah|masalah|adalah|jumlah|sekolah|setelah|wilayah|kuliah|sejarah|perintah|langkah)$/.test(cur)) {
    cur = cur.replace(/(lah|kah|tah|pun)$/, '');
    if (ID_IRREGULAR_AND_PROTECTED[cur]) return ID_IRREGULAR_AND_PROTECTED[cur];
  }

  // 2. Strip possessive pronouns (-ku, -mu, -nya)
  if (cur.length > 5) {
    cur = cur.replace(/(ku|mu|nya)$/, '');
    if (ID_IRREGULAR_AND_PROTECTED[cur]) return ID_IRREGULAR_AND_PROTECTED[cur];
  }

  // Remember if it has an Indonesian prefix before stripping suffix
  const hasPrefix = /^(me|mem|men|meng|meny|pe|pem|pen|peng|peny|be|ber|te|ter|di|ke|se|per)/.test(cur);

  // Guard words with foreign consonant/vowel starts that mimic di-/se-/pe-/me-
  const blockedPrefix = /^(dis|div|dig|diag|dir|dim|din|def|dep|des|det|dem|den|dev|ser|sek|sem|sel|sen|sep|set|ses|sew|seg|per|pro|pre|pri|pra|pla|pos|por|pol|met|med|mek|men|mes|mem|mer|mod|mob|mon|mot|mik|min|ber|ter|teks|tema|tekn|tel|ten|tep|tet|tik|ting|tok|top|tot|tug|tuj|tul|tum|tur|tut)/.test(cur) &&
    !/^(mend|meng|meny|mem[bp]|men[dtcj]|pem[bp]|pen[dtcj]|peng|peny|ber|ter|per[aeiuo]|di(buat|kelola|olah|kirim|terima|pesan|bayar|jual|beli|lacak|catat|cari|simpan|lapor|pantau|uji|rancang|kembang|gunakan|lakukan|berikan|tampilkan|sediakan|input|simpan|hapus|ubah|edit|akses|unduh|unggah|cetak))/.test(cur);

  // 3. Safe derivational suffix stripping (-kan, -an, -i) only when stem remains >= 3 chars with vowel
  const tryStripSuffix = (str) => {
    if (str.endsWith('isasi') && str.length > 7) {
      const s = str.slice(0, -5);
      if (/[aeiou]/.test(s)) return s;
    }
    if (str.endsWith('kan') && str.length > 5) {
      const s = str.slice(0, -3);
      if (/[aeiou]/.test(s) && s.length >= 3) return s;
    }
    if (str.endsWith('an') && str.length > 5 && !/(aan$|wan$|man$|stan$)/.test(str)) {
      const s = str.slice(0, -2);
      if (/[aeiou]/.test(s) && s.length >= 3 && !/(asi|isi|osi|usi)$/.test(str)) return s;
    }
    return str;
  };

  if (hasPrefix && !blockedPrefix) {
    // Try nasal & standard prefix stripping
    let stemmed = cur;
    if (/^(meng|peng)/.test(stemmed) && stemmed.length > 6) {
      const rest = stemmed.slice(4);
      if (/^[aeiou]/.test(rest)) {
        // e.g., mengambil -> ambil, mengolah -> olah, menguji -> uji, menginput -> input
        const candK = `k${rest}`;
        const candClean = rest;
        const sK = tryStripSuffix(candK);
        const sClean = tryStripSuffix(candClean);
        if (ID_IRREGULAR_AND_PROTECTED[sK]) return ID_IRREGULAR_AND_PROTECTED[sK];
        if (ID_IRREGULAR_AND_PROTECTED[sClean]) return ID_IRREGULAR_AND_PROTECTED[sClean];
        // Heuristic: mengelola -> kelola, mengirimkan -> kirim, mengembangkan -> kembang
        return /^[aeiou]/.test(candClean) && sClean.length >= 4 ? sClean : sK;
      } else {
        stemmed = tryStripSuffix(rest);
      }
    } else if (/^(meny|peny)/.test(stemmed) && stemmed.length > 6) {
      const rest = `s${stemmed.slice(4)}`;
      stemmed = tryStripSuffix(rest);
    } else if (/^(mem|pem)/.test(stemmed) && stemmed.length > 6) {
      const after = stemmed.slice(3);
      if (/^[bfvp]/.test(after)) {
        stemmed = tryStripSuffix(after);
      } else if (/^[aeiou]/.test(after)) {
        const restP = `p${after}`;
        stemmed = tryStripSuffix(restP);
      } else {
        stemmed = tryStripSuffix(after);
      }
    } else if (/^(men|pen)/.test(stemmed) && stemmed.length > 6) {
      const after = stemmed.slice(3);
      if (/^[cdjz]/.test(after)) {
        stemmed = tryStripSuffix(after);
      } else if (/^[aeiou]/.test(after)) {
        const restT = `t${after}`;
        stemmed = tryStripSuffix(restT);
      } else {
        stemmed = tryStripSuffix(after);
      }
    } else if (/^(di|ke|se)/.test(stemmed) && stemmed.length > 5 && /^(di(rancang|kembang|bangun|kelola|olah|pesan|bayar|jual|beli|lacak|catat|cari|simpan|lapor|pantau|uji|akses|unduh|unggah|cetak|terima|kirim|proses|gunakan)|ke[a-z]+an$|se[a-z]+)/.test(stemmed)) {
      if (stemmed.startsWith('di')) {
        stemmed = tryStripSuffix(stemmed.slice(2));
      } else if (stemmed.startsWith('ke') && stemmed.endsWith('an') && stemmed.length > 6) {
        stemmed = stemmed.slice(2, -2);
      }
    } else if (/^(ber|ter)/.test(stemmed) && stemmed.length > 6) {
      const rest = stemmed.slice(3);
      if (rest.length >= 3 && /[aeiou]/.test(rest)) {
        // Guard "berisiko" -> "risiko" (where ber- dropped 'r' before 'i')
        const withR = `r${rest}`;
        if (stemmed.startsWith('ber') && ID_IRREGULAR_AND_PROTECTED[withR]) {
          stemmed = ID_IRREGULAR_AND_PROTECTED[withR];
        } else {
          stemmed = tryStripSuffix(rest);
        }
      }
    }

    if (ID_IRREGULAR_AND_PROTECTED[stemmed]) return ID_IRREGULAR_AND_PROTECTED[stemmed];
    if (stemmed.length >= 3 && /[aeiou]/.test(stemmed)) return stemmed;
  }

  // Fallback suffix strip for unprefixed nouns like "pesanan" -> "pesan", "makanan" -> "makan"
  const suffStripped = tryStripSuffix(cur);
  if (ID_IRREGULAR_AND_PROTECTED[suffStripped]) return ID_IRREGULAR_AND_PROTECTED[suffStripped];
  return suffStripped.length >= 3 ? suffStripped : cur;
}

/**
 * Stems an English word into its root word (kata dasar / lemma).
 */
export function stemEnglish(rawWord) {
  const w = String(rawWord || '').toLowerCase().trim();
  if (!w || w.length <= 3) return w;
  if (EN_IRREGULAR_AND_PROTECTED[w]) return EN_IRREGULAR_AND_PROTECTED[w];

  let cur = w;

  // 1. -ization / -isation / -izing / -ising -> -ize / root
  if (cur.endsWith('ization') && cur.length > 9) cur = cur.slice(0, -7);
  else if (cur.endsWith('isation') && cur.length > 9) cur = cur.slice(0, -7);
  else if (cur.endsWith('izing') && cur.length > 7) cur = cur.slice(0, -5);
  else if (cur.endsWith('ising') && cur.length > 7) cur = cur.slice(0, -5);
  else if (cur.endsWith('ized') && cur.length > 6) cur = cur.slice(0, -4);
  else if (cur.endsWith('ised') && cur.length > 6) cur = cur.slice(0, -4);
  // 2. -ies / -ied / -ying
  else if (cur.endsWith('ies') && cur.length > 4) cur = `${cur.slice(0, -3)}y`;
  else if (cur.endsWith('ied') && cur.length > 4) cur = `${cur.slice(0, -3)}y`;
  else if (cur.endsWith('ying') && cur.length > 5) cur = `${cur.slice(0, -4)}y`;
  // 3. -ment / -ness / -less
  else if (cur.endsWith('ment') && cur.length > 6) cur = cur.slice(0, -4);
  else if (cur.endsWith('ness') && cur.length > 6) cur = cur.slice(0, -4);
  // 4. -ational / -tional / -ation / -tion / -sion
  else if (cur.endsWith('ation') && cur.length > 7) cur = `${cur.slice(0, -5)}e`;
  else if (cur.endsWith('ing') && cur.length > 5) {
    let base = cur.slice(0, -3);
    // e.g. planning -> plan, mapping -> map, logging -> log, scanning -> scan
    if (/([bcdfghjklmnpqrstvwxz])\1$/.test(base) && !/(ll|ss|zz)$/.test(base)) {
      base = base.slice(0, -1);
    }
    cur = base;
  } else if (cur.endsWith('ed') && cur.length > 4) {
    let base = cur.slice(0, -2);
    if (/([bcdfghjklmnpqrstvwxz])\1$/.test(base) && !/(ll|ss|zz)$/.test(base)) {
      base = base.slice(0, -1);
    }
    cur = base;
  } else if (cur.endsWith('ly') && cur.length > 5) {
    cur = cur.slice(0, -2);
  } else if (cur.endsWith('es') && cur.length > 4 && /(ches|shes|sses|xes|zes|oes)$/.test(cur)) {
    cur = cur.slice(0, -2);
  } else if (cur.endsWith('s') && cur.length > 3 && !/(ss|us|is|as|os)$/.test(cur)) {
    cur = cur.slice(0, -1);
  }

  if (EN_IRREGULAR_AND_PROTECTED[cur]) return EN_IRREGULAR_AND_PROTECTED[cur];
  return cur;
}

/**
 * Unified Bilingual Canonical Root Dictionary:
 * Maps Indonesian root stems AND English root stems onto shared canonical concept tokens
 * so cross-language abstract matching (ID input <-> EN repo UNSRI) compares identical root words.
 */
export const CANONICAL_ROOT_MAP = {
  // Ordering / Booking / Reservation
  pesan: 'order',
  order: 'order',
  reserve: 'reserve',
  reservasi: 'reserve',
  booking: 'reserve',
  sewa: 'rent',
  rent: 'rent',
  rental: 'rent',

  // Payment / Finance / Cashflow / Accounting
  bayar: 'pay',
  pay: 'pay',
  tagih: 'bill',
  bill: 'bill',
  billing: 'bill',
  invoice: 'bill',
  receipt: 'receipt',
  kas: 'cash',
  cash: 'cash',
  cashflow: 'cashflow',
  uang: 'finance',
  finance: 'finance',
  budget: 'finance',
  anggaran: 'finance',
  account: 'account',
  akuntansi: 'account',
  transaksi: 'transact',
  transact: 'transact',
  kasir: 'cashier',
  cashier: 'cashier',
  pos: 'cashier',
  harga: 'price',
  price: 'price',
  diskon: 'discount',
  discount: 'discount',
  pajak: 'tax',
  tax: 'tax',
  laba: 'profit',
  profit: 'profit',
  pendapatan: 'revenue',
  revenue: 'revenue',

  // Food, Restaurant, Cafe, Culinary, Retail, Business
  restoran: 'restaurant',
  restaurant: 'restaurant',
  kafe: 'restaurant',
  cafe: 'restaurant',
  warung: 'restaurant',
  angkringan: 'restaurant',
  kedai: 'restaurant',
  bistro: 'restaurant',
  kuliner: 'culinary',
  culinary: 'culinary',
  menu: 'menu',
  makan: 'food',
  food: 'food',
  minum: 'beverage',
  beverage: 'beverage',
  drink: 'beverage',
  meja: 'table',
  table: 'table',
  kursi: 'seat',
  seat: 'seat',
  dapur: 'kitchen',
  kitchen: 'kitchen',
  hidang: 'dish',
  dish: 'dish',
  kopi: 'coffee',
  coffee: 'coffee',

  // Sales, Commerce, Inventory, Warehouse, Goods
  jual: 'sales',
  sale: 'sales',
  sell: 'sales',
  beli: 'purchase',
  buy: 'purchase',
  purchase: 'purchase',
  dagang: 'commerce',
  ecommerce: 'ecommerce',
  toko: 'shop',
  shop: 'shop',
  outlet: 'shop',
  store: 'store',
  retail: 'retail',
  storage: 'storage',
  pelanggan: 'customer',
  customer: 'customer',
  konsumen: 'customer',
  consumer: 'customer',
  klien: 'customer',
  client: 'customer',
  pembeli: 'customer',
  buyer: 'customer',
  tamu: 'guest',
  guest: 'guest',
  pengunjung: 'visitor',
  visitor: 'visitor',
  umkm: 'sme',
  sme: 'sme',
  usaha: 'business',
  business: 'business',
  bisnis: 'business',
  enterprise: 'business',
  barang: 'goods',
  goods: 'goods',
  produk: 'product',
  product: 'product',
  item: 'item',
  sedia: 'inventory',
  inventory: 'inventory',
  stok: 'inventory',
  stock: 'inventory',
  safety_stock: 'inventory',
  gudang: 'warehouse',
  warehouse: 'warehouse',
  supply: 'supply',
  supply_chain: 'supply_chain',
  pasok: 'supply',
  pemasok: 'supplier',
  supplier: 'supplier',

  // Core Operations & Tracking
  kelola: 'manage',
  manage: 'manage',
  lacak: 'track',
  track: 'track',
  pantau: 'monitor',
  monitor: 'monitor',
  cari: 'search',
  search: 'search',
  find: 'search',
  simpan: 'storage',
  catat: 'record',
  record: 'record',
  agenda: 'record',
  lapor: 'report',
  report: 'report',
  kirim: 'deliver',
  deliver: 'deliver',
  antar: 'deliver',
  kurir: 'courier',
  courier: 'courier',
  paket: 'package',
  package: 'package',
  parcel: 'package',
  ekspedisi: 'expedition',
  expedition: 'expedition',
  terima: 'receive',
  receive: 'receive',
  verif: 'verify',
  verifikasi: 'verify',
  verify: 'verify',
  validasi: 'validate',
  validate: 'validate',
  setuju: 'approve',
  approve: 'approve',
  izin: 'permit',
  permit: 'permit',
  daftar: 'register',
  register: 'register',
  jadwal: 'schedule',
  schedule: 'schedule',
  notifikasi: 'notify',
  notify: 'notify',
  ingat: 'remind',
  remind: 'remind',
  kendali: 'control',
  control: 'control',
  pusat: 'central',
  central: 'central',
  terpusat: 'central',
  integrasi: 'integrate',
  integrate: 'integrate',
  operasi: 'operate',
  operate: 'operate',
  otentik: 'auth',
  autentikasi: 'auth',
  auth: 'auth',
  login: 'login',
  akses: 'access',
  access: 'access',
  peran: 'role',
  role: 'role',
  keamanan: 'security',
  aman: 'security',
  security: 'security',
  enkripsi: 'encrypt',
  encrypt: 'encrypt',

  // Tech Architecture & Standards
  qrcode: 'qrcode',
  qr: 'qrcode',
  barcode: 'barcode',
  rfid: 'rfid',
  saas: 'saas',
  multitenant: 'multitenant',
  tenant: 'multitenant',
  cloud: 'cloud',
  blackbox: 'blackbox',
  whitebox: 'whitebox',
  usability: 'usability',
  uat: 'uat',
  rad: 'rad',
  agile: 'agile',
  scrum: 'scrum',
  waterfall: 'waterfall',
  prototype: 'prototype',
  prototipe: 'prototype',
  kanban: 'kanban',
  uml: 'uml',
  mvc: 'mvc',
  laravel: 'laravel',
  codeigniter: 'codeigniter',
  php: 'php',
  mysql: 'mysql',
  postgresql: 'postgresql',
  react: 'react',
  vue: 'vue',
  flutter: 'flutter',
  android: 'android',
  api: 'api',
  microservice: 'microservice',
  sso: 'sso',
  oauth: 'oauth',
  rbac: 'rbac',
  iot: 'iot',
  sensor: 'sensor',
  arduino: 'arduino',
  esp32: 'esp32',
  esp8266: 'esp8266',
  gis: 'gis',
  gps: 'gps',
  map: 'map',
  peta: 'map',
  rute: 'route',
  route: 'route',
  lokasi: 'locate',
  locate: 'locate',

  // HR & Payroll
  pegawai: 'employee',
  karyawan: 'employee',
  employee: 'employee',
  staf: 'employee',
  staff: 'employee',
  hr: 'hr',
  gaji: 'payroll',
  salary: 'payroll',
  payroll: 'payroll',
  absensi: 'attend',
  presensi: 'attend',
  hadir: 'attend',
  attend: 'attend',
  cuti: 'leave',
  leave: 'leave',
  lembur: 'overtime',
  overtime: 'overtime',
  evaluasi: 'evaluate',
  evaluate: 'evaluate',
  nilai: 'assess',
  assess: 'assess',
  rekrut: 'recruit',
  recruit: 'recruit',
  lamar: 'applicant',

  // Office, Mail, Archive & Audit
  surat: 'mail',
  mail: 'mail',
  letter: 'mail',
  incoming_mail: 'incoming_mail',
  outgoing_mail: 'outgoing_mail',
  disposisi: 'disposition',
  disposition: 'disposition',
  arsip: 'archive',
  archive: 'archive',
  dokumen: 'document',
  document: 'document',
  berkas: 'document',
  file: 'document',
  aset: 'asset',
  asset: 'asset',
  inventaris: 'asset',
  audit: 'audit',
  internal_audit: 'internal_audit',
  awas: 'supervise',
  supervise: 'supervise',
  risiko: 'risk',
  risk: 'risk',
  risk_management: 'risk_management',
  rekomendasi: 'recommend',
  recommend: 'recommend',
  patuh: 'comply',
  comply: 'comply',

  // Healthcare & Medical
  pasien: 'patient',
  patient: 'patient',
  inpatient: 'inpatient',
  outpatient: 'outpatient',
  rawat: 'care',
  care: 'care',
  medis: 'medic',
  medic: 'medic',
  medical_record: 'medical_record',
  klinik: 'clinic',
  clinic: 'clinic',
  puskesmas: 'clinic',
  hospital: 'hospital',
  dokter: 'doctor',
  doctor: 'doctor',
  perawat: 'nurse',
  nurse: 'nurse',
  obat: 'medicine',
  drug: 'medicine',
  medicine: 'medicine',
  farmasi: 'pharmacy',
  pharmacy: 'pharmacy',
  apotek: 'pharmacy',
  dispensary: 'pharmacy',
  penyakit: 'disease',
  disease: 'disease',
  diagnosa: 'diagnose',
  diagnose: 'diagnose',
  sehat: 'health',
  health: 'health',
  gizi: 'nutrition',
  nutrition: 'nutrition',
  stunting: 'stunting',
  hamil: 'pregnant',
  pregnant: 'pregnant',
  bayi: 'infant',
  infant: 'infant',
  balita: 'toddler',
  toddler: 'toddler',
  dengue: 'dengue',

  // Education, Library & Academic
  siswa: 'student',
  murid: 'student',
  mahasiswa: 'student',
  student: 'student',
  guru: 'teacher',
  teacher: 'teacher',
  dosen: 'lecturer',
  lecturer: 'lecturer',
  sekolah: 'school',
  school: 'school',
  kelas: 'class',
  class: 'class',
  ajar: 'learn',
  learn: 'learn',
  materi: 'material',
  material: 'material',
  kurikulum: 'curriculum',
  curriculum: 'curriculum',
  ujian: 'exam',
  exam: 'exam',
  rapor: 'gradebook',
  lms: 'lms',
  alumni: 'alumni',
  lulus: 'graduate',
  graduate: 'graduate',
  tracer_study: 'tracer_study',
  karir: 'career',
  career: 'career',
  pustaka: 'library',
  library: 'library',
  buku: 'book',
  book: 'book',
  pinjam: 'borrow',
  borrow: 'borrow',
  kembali: 'return',
  return: 'return',
  denda: 'fine',
  fine: 'fine',
  internship: 'internship',
  magang: 'internship',
  prakerin: 'internship',
  beasiswa: 'scholarship',
  scholarship: 'scholarship',

  // Queue, Complaint, Hospitality, Community, SPK/AI
  antre: 'queue',
  antri: 'queue',
  queue: 'queue',
  loket: 'counter',
  counter: 'counter',
  layan: 'service',
  service: 'service',
  adu: 'complaint',
  keluh: 'complaint',
  complaint: 'complaint',
  aspirasi: 'complaint',
  helpdesk: 'helpdesk',
  tiket: 'ticket',
  ticket: 'ticket',
  wisata: 'tourism',
  tourism: 'tourism',
  hotel: 'hotel',
  homestay: 'hotel',
  kamar: 'room',
  room: 'room',
  ruang: 'room',
  parkir: 'parking',
  parking: 'parking',
  bridal: 'bridal',
  salon: 'salon',
  makeup: 'makeup',
  pengantin: 'bridal',
  ulasan: 'review',
  review: 'review',
  komentar: 'comment',
  comment: 'comment',
  rating: 'rating',
  forum: 'forum',
  promosi: 'promote',
  promote: 'promote',
  pasar: 'market',
  market: 'market',
  berita: 'news',
  news: 'news',
  artikel: 'article',
  article: 'article',
  komunitas: 'community',
  community: 'community',
  donasi: 'donate',
  donate: 'donate',
  zakat: 'zakat',
  masjid: 'mosque',
  mosque: 'mosque',
  koperasi: 'cooperative',
  cooperative: 'cooperative',
  kredit: 'loan',
  loan: 'loan',
  tabung: 'saving',
  saving: 'saving',

  // Analytical Methods (SPK, Expert System, ML)
  dss: 'dss',
  spk: 'dss',
  ahp: 'ahp',
  topsis: 'topsis',
  saw: 'saw',
  smart: 'smart',
  moora: 'moora',
  wp: 'wp',
  expert_system: 'expert_system',
  forward_chaining: 'forward_chaining',
  backward_chaining: 'backward_chaining',
  certainty_factor: 'certainty_factor',
  naive_bayes: 'naive_bayes',
  svm: 'svm',
  knn: 'knn',
  kmeans: 'kmeans',
  decision_tree: 'decision_tree',
  data_mining: 'data_mining',
  machine_learning: 'machine_learning',
  deep_learning: 'deep_learning',
  text_mining: 'text_mining',
  sentiment_analysis: 'sentiment_analysis',
  klasifikasi: 'classify',
  classify: 'classify',
  klaster: 'cluster',
  cluster: 'cluster',
  prediksi: 'predict',
  predict: 'predict',
  ramal: 'forecast',
  forecast: 'forecast',
  deteksi: 'detect',
  detect: 'detect',
  citra: 'image',
  image: 'image',
  sentimen: 'sentiment',
  sentiment: 'sentiment',
  hitung: 'calculate',
  calculate: 'calculate',
  ukur: 'measure',
  measure: 'measure',
  putus: 'decision',
  decision: 'decision',
  struk: 'receipt',
  cetak: 'print',
  print: 'print',
  dinamis: 'dynamic',
  dynamic: 'dynamic',
  formulir: 'form',
  form: 'form',
  spreadsheet: 'spreadsheet',
  lowongan: 'job',
  pekerjaan: 'job',
  job: 'job',
  acara: 'event',
  event: 'event'
};

/**
 * Normalizes raw text with domain multi-word phrases and strips punctuation.
 */
function normalizeTextForTokenization(text) {
  let clean = String(text || '').toLowerCase();
  for (const [pattern, replacement] of PHRASE_NORMALIZATIONS) {
    clean = clean.replace(pattern, ` ${replacement} `);
  }
  return clean
    .replace(/[^a-z0-9_\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Converts a single token to its kata dasar (root word) and bilingual canonical token.
 * Checks stopwords BEFORE and AFTER stemming so affixed boilerplate (e.g. "dilakukan", "membantu", "developed", "purposes") is dropped cleanly.
 */
function processSingleAbstractToken(token) {
  if (!token || token.length < 2) return null;
  if (INDONESIAN_STOPWORDS.has(token) || ENGLISH_STOPWORDS.has(token)) return null;

  // Stem both paths or select appropriate language path
  let stem = token;
  if (token.includes('_')) {
    // Already a multi-word canonical phrase token (e.g. risk_management)
    stem = token;
  } else if (EN_IRREGULAR_AND_PROTECTED[token] || looksLikeEnglishWord(token)) {
    stem = stemEnglish(token);
  } else {
    stem = stemIndonesian(token);
  }

  // Re-check stopwords on stemmed form (e.g., "membantu" -> "bantu", "bertujuan" -> "tuju", "developing" -> "develop")
  if (!stem || stem.length < 2) return null;
  if (INDONESIAN_STOPWORDS.has(stem) || ENGLISH_STOPWORDS.has(stem)) return null;

  const canonical = CANONICAL_ROOT_MAP[stem] || CANONICAL_ROOT_MAP[token] || stem;
  if (!canonical || canonical.length < 2) return null;
  if (INDONESIAN_STOPWORDS.has(canonical) || ENGLISH_STOPWORDS.has(canonical)) return null;

  return { raw: token, stem, canonical };
}

/**
 * Extracts recognized technical domain concepts from given text (supports ID & EN)
 * @param {string} text - Title or abstract text
 * @returns {Array<{ key: string, label: string, category: string }>}
 */
export function extractKeyConcepts(text) {
  if (!text) return [];
  const clean = ` ${String(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ')} `;
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
 * Extracts stemmed Indonesian/English tokens for a Thesis Title (for UI display & title matching).
 */
export function extractTitleRoots(title, customStopwords = null) {
  if (!title) return { stems: [], canonicals: [], processedText: '' };

  const stopwords = customStopwords ? new Set([...INDONESIAN_STOPWORDS, ...customStopwords]) : INDONESIAN_STOPWORDS;
  const cleaned = normalizeTextForTokenization(title);

  const stems = [];
  const canonicals = [];
  const seenStems = new Set();
  const seenCanonicals = new Set();

  for (const token of cleaned.split(' ')) {
    if (!token || token.length <= 1) continue;
    if (stopwords.has(token) || ENGLISH_STOPWORDS.has(token)) continue;

    let stem = token;
    if (!token.includes('_')) {
      stem = (EN_IRREGULAR_AND_PROTECTED[token] || looksLikeEnglishWord(token))
        ? stemEnglish(token)
        : stemIndonesian(token);
    }

    if (!stem || stem.length <= 1 || stopwords.has(stem) || ENGLISH_STOPWORDS.has(stem)) continue;

    if (!seenStems.has(stem)) {
      seenStems.add(stem);
      stems.push(stem);
    }

    const canon = CANONICAL_ROOT_MAP[stem] || CANONICAL_ROOT_MAP[token] || stem;
    if (!seenCanonicals.has(canon)) {
      seenCanonicals.add(canon);
      canonicals.push(canon);
    }
  }

  return {
    stems,
    canonicals,
    processedText: stems.join(' ')
  };
}

/**
 * Pre-processes title string into core stemmed root tokens:
 * 1. Lowercase & phrase normalization
 * 2. Filter out Indonesian & English stop-words
 * 3. Stem words to root words (kata dasar)
 */
export function preProcessTitle(title, customStopwords = null) {
  return extractTitleRoots(title, customStopwords).processedText;
}

/**
 * Breaks an abstract (Indonesian, English, or Mixed) down into root words (kata dasar)
 * and aligns them into unified bilingual canonical roots for accurate similarity scoring.
 *
 * @param {string} abstractText
 * @returns {{
 *   roots: string[],
 *   rootString: string,
 *   tokenDetails: Array<{ raw: string, stem: string, canonical: string }>
 * }}
 */
export function extractAbstractRoots(abstractText) {
  if (!abstractText) {
    return { roots: [], rootString: '', tokenDetails: [] };
  }

  const cleaned = normalizeTextForTokenization(abstractText);
  const tokens = cleaned.split(' ').filter(Boolean);

  const roots = [];
  const seenCanonicals = new Set();
  const tokenDetails = [];
  const seenRaw = new Set();

  for (const token of tokens) {
    const processed = processSingleAbstractToken(token);
    if (!processed) continue;

    if (!seenCanonicals.has(processed.canonical)) {
      seenCanonicals.add(processed.canonical);
      roots.push(processed.canonical);
    }

    const pairKey = `${processed.raw}->${processed.canonical}`;
    if (!seenRaw.has(pairKey)) {
      seenRaw.add(pairKey);
      tokenDetails.push(processed);
    }
  }

  return {
    roots,
    rootString: roots.join(' '),
    tokenDetails
  };
}

/**
 * Pre-processes abstract string (handles Indonesian and English):
 * Normalizes phrases, strips stopwords/boilerplate, stems to kata dasar,
 * and returns bilingual canonical root tokens string.
 */
export function preProcessAbstract(abstractText) {
  return extractAbstractRoots(abstractText).rootString;
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
