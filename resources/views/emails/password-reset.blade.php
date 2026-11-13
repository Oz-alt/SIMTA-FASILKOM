<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pemulihan Kata Sandi Akun SIMONITA FASILKOM UNSRI</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f1f5f9;
      padding: 36px 12px;
    }
    .main {
      background-color: #ffffff;
      margin: 0 auto;
      max-width: 600px;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #0b1f3a 0%, #173865 100%);
      padding: 32px 36px;
      text-align: center;
      border-bottom: 4px solid #facc15;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .header p {
      margin: 6px 0 0 0;
      color: #cbd5e1;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .content {
      padding: 36px 36px 28px 36px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .lead-text {
      font-size: 14px;
      line-height: 1.65;
      color: #334155;
      margin-bottom: 24px;
    }
    .highlight-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #1e40af;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 28px;
    }
    .highlight-card p {
      margin: 0;
      font-size: 13px;
      line-height: 1.5;
      color: #475569;
    }
    .highlight-card p strong {
      color: #0f172a;
    }
    .cta-container {
      text-align: center;
      margin: 32px 0;
    }
    .btn-reset {
      display: inline-block;
      background-color: #1d4ed8;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      padding: 14px 32px;
      border-radius: 10px;
      box-shadow: 0 4px 14px rgba(29, 78, 216, 0.35);
      letter-spacing: 0.2px;
    }
    .btn-reset:hover {
      background-color: #1e40af;
    }
    .timer-badge {
      display: inline-block;
      margin-top: 12px;
      padding: 6px 14px;
      background-color: #fef3c7;
      border: 1px solid #fde68a;
      color: #92400e;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
    }
    .link-fallback {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px dashed #cbd5e1;
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
      word-break: break-all;
    }
    .link-fallback a {
      color: #1d4ed8;
      text-decoration: underline;
    }
    .warning-box {
      margin-top: 24px;
      background-color: #fffbeb;
      border: 1px solid #fef08a;
      border-radius: 8px;
      padding: 14px 18px;
      font-size: 12px;
      line-height: 1.5;
      color: #854d0e;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 36px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .footer strong {
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main">
      <!-- HEADER -->
      <div class="header">
        <h1>SIMONITA FASILKOM</h1>
        <p>Universitas Sriwijaya</p>
      </div>

      <!-- CONTENT -->
      <div class="content">
        <h2 class="greeting">Yth. {{ $name }},</h2>
        <p class="lead-text">
          Kami menerima permintaan resmi untuk mengatur ulang kata sandi akun <strong>SIMONITA (Sistem Monitoring Tugas Akhir)</strong> Anda sebagai <strong>{{ ucfirst($role) }}</strong>.
        </p>

        <div class="highlight-card">
          <p>
            Permintaan ini telah diverifikasi dan disetujui secara resmi oleh Administrator SIMTA Fakultas Ilmu Komputer UNSRI. Anda dapat melanjutkan pembaruan kata sandi menggunakan tombol di bawah ini.
          </p>
        </div>

        <!-- CTA BUTTON -->
        <div class="cta-container">
          <a href="{{ $resetUrl }}" target="_blank" rel="noopener noreferrer" class="btn-reset">
            Perbarui Kata Sandi Akun
          </a>
          <br>
          <div class="timer-badge">
            ⏱️ Tautan hanya berlaku selama 24 Jam
          </div>
        </div>

        <!-- FALLBACK URL -->
        <div class="link-fallback">
          Jika tombol di atas tidak dapat diklik, salin dan tempelkan tautan resmi berikut ke browser Anda:
          <br>
          <a href="{{ $resetUrl }}">{{ $resetUrl }}</a>
        </div>

        <!-- SECURITY NOTICE -->
        <div class="warning-box">
          <strong>Peringatan Keamanan:</strong>
          Jika Anda tidak merasa mengajukan permintaan pemulihan kata sandi ini, Anda dapat mengabaikan email ini dengan aman. Kata sandi akun Anda tidak akan berubah tanpa konfirmasi dari tautan di atas. Jangan bagikan tautan ini kepada siapa pun.
        </div>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        <strong>Fakultas Ilmu Komputer, Universitas Sriwijaya</strong><br>
        Jl. Raya Palembang - Prabumulih Km. 32 Indralaya, Ogan Ilir, Sumatera Selatan 30662<br>
        Email Resmi: <a href="mailto:simonita@unsri.ac.id" style="color: #64748b; text-decoration: underline;">simonita@unsri.ac.id</a> | Portal SIMTA SIMONITA
      </div>
    </div>
  </div>
</body>
</html>

