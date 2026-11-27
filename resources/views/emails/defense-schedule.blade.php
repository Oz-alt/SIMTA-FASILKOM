<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jadwal {{ $jenisSidang }} - SIMONITA FASILKOM UNSRI</title>
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
      background-color: #f1f5f9;
      padding: 32px 12px;
    }
    .main {
      background-color: #ffffff;
      margin: 0 auto;
      max-width: 620px;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.06);
    }
    .header {
      background: linear-gradient(135deg, #0b1f3a 0%, #173865 100%);
      padding: 28px 32px;
      text-align: center;
      border-bottom: 4px solid #facc15;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .header p {
      margin: 6px 0 0 0;
      color: #cbd5e1;
      font-size: 12px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }
    .content {
      padding: 32px;
    }
    .badge {
      display: inline-block;
      padding: 5px 12px;
      border-radius: 9999px;
      background-color: #e0e7ff;
      color: #3730a3;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 14px;
    }
    .greeting {
      font-size: 17px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 12px 0;
    }
    .lead {
      font-size: 14px;
      line-height: 1.6;
      color: #334155;
      margin: 0 0 22px 0;
    }
    .detail-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 22px;
      font-size: 13px;
    }
    .detail-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }
    .detail-table td.label {
      width: 36%;
      font-weight: 700;
      color: #475569;
      background-color: #f8fafc;
    }
    .detail-table td.value {
      color: #0f172a;
      font-weight: 600;
    }
    .note-box {
      background-color: #fffbeb;
      border: 1px solid #fde68a;
      border-left: 4px solid #d97706;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 22px;
      font-size: 13px;
      line-height: 1.55;
      color: #78350f;
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 18px 32px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main">
      <div class="header">
        <h1>SIMONITA FASILKOM UNSRI</h1>
        <p>{{ $isUpdate ? 'Pembaruan Jadwal Sidang Tugas Akhir' : 'Undangan & Jadwal Sidang Tugas Akhir' }}</p>
      </div>
      <div class="content">
        <span class="badge">{{ $jenisSidang }}</span>
        <p class="greeting">Halo, {{ $mhsNama }}</p>
        <p class="lead">
          Ketua Program Studi telah {{ $isUpdate ? 'memperbarui' : 'menetapkan' }} jadwal pelaksanaan <strong>{{ $jenisSidang }}</strong> Anda. Mohon perhatikan detail pelaksanaan berikut ini:
        </p>

        <table class="detail-table">
          <tr>
            <td class="label">Nama / NIM</td>
            <td class="value">{{ $mhsNama }} ({{ $mhsNim }})</td>
          </tr>
          <tr>
            <td class="label">Program Studi</td>
            <td class="value">{{ $prodi }}</td>
          </tr>
          <tr>
            <td class="label">Judul Tugas Akhir</td>
            <td class="value">{{ $judul }}</td>
          </tr>
          <tr>
            <td class="label">Tanggal Pelaksanaan</td>
            <td class="value">{{ $tanggal }}</td>
          </tr>
          <tr>
            <td class="label">Waktu</td>
            <td class="value">{{ $waktuMulai }} – {{ $waktuSelesai }} WIB</td>
          </tr>
          <tr>
            <td class="label">Ruangan</td>
            <td class="value">{{ $ruangan }}</td>
          </tr>
          @if(!empty($ketuaPenguji))
          <tr>
            <td class="label">Ketua Penguji</td>
            <td class="value">{{ $ketuaPenguji }}</td>
          </tr>
          @endif
          @if(!empty($sekretaris))
          <tr>
            <td class="label">Sekretaris / Pembimbing 1</td>
            <td class="value">{{ $sekretaris }}</td>
          </tr>
          @endif
          @if(!empty($penguji1))
          <tr>
            <td class="label">Penguji 1 / Pembimbing 2</td>
            <td class="value">{{ $penguji1 }}</td>
          </tr>
          @endif
          @if(!empty($penguji2))
          <tr>
            <td class="label">Penguji 2</td>
            <td class="value">{{ $penguji2 }}</td>
          </tr>
          @endif
          @if(!empty($linkBerkas))
          <tr>
            <td class="label">Tautan Berkas</td>
            <td class="value"><a href="{{ $linkBerkas }}" style="color:#1d4ed8;">{{ $linkBerkas }}</a></td>
          </tr>
          @endif
        </table>

        @if(!empty($catatan))
        <div class="note-box">
          <strong>Catatan dari Kaprodi:</strong><br>
          {{ $catatan }}
        </div>
        @endif

        <p class="lead" style="margin-bottom:0; font-size:13px; color:#475569;">
          Harap hadir minimal 15 menit sebelum jadwal dimulai dan persiapkan seluruh berkas yang dibutuhkan.
        </p>
      </div>
      <div class="footer">
        Email ini dikirim otomatis oleh Sistem Monitoring Tugas Akhir (SIMONITA) Fakultas Ilmu Komputer Universitas Sriwijaya.
      </div>
    </div>
  </div>
</body>
</html>

