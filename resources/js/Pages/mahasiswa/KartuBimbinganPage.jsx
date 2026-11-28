import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ArrowLeft, Printer } from 'lucide-react';
import { Link } from '@inertiajs/react';
import BimbinganReminderBanner from '../../Components/common/BimbinganReminderBanner.jsx';
import { calculateBimbinganReminder } from '../../lib/bimbinganReminder.js';
import { getMinTotalSessionsDefense } from '../../lib/consultationUtils.js';
import unsriLogo from '../../assets/photo/unsri logo.png';

export default function KartuBimbinganPage() {
  const { currentUser, consultations, studentAdvisors, advisors, thesisTitles = [], minSessionsRequirement } = useAuth();

  // Find advisor assignment for current student dynamically
  const studentNim = currentUser?.nim || '';
  const reminderStatus = useMemo(() => {
    return calculateBimbinganReminder(consultations, studentNim, 2);
  }, [consultations, studentNim]);

  // Dynamic thesis title for current student (strip '-' if not yet submitted)
  const judulTa = useMemo(() => {
    if (!currentUser) return '-';
    const cleanNim = String(studentNim || currentUser?.nim || '').trim();
    const cleanId = String(currentUser?.id || '').trim();
    const cleanNama = String(currentUser?.nama || '').trim().toLowerCase();

    if (Array.isArray(thesisTitles) && thesisTitles.length > 0) {
      const matched = thesisTitles.filter(t => {
        const matchNim = cleanNim && String(t.mhs_nim || '').trim() === cleanNim;
        const matchId = cleanId && String(t.profile_id || '').trim() === cleanId;
        const matchNama = cleanNama && String(t.mhs_nama || '').trim().toLowerCase() === cleanNama;
        return matchNim || matchId || matchNama;
      });

      if (matched.length > 0) {
        const approved = matched.find(t => t.status === 'disetujui' || t.status === 'judul_fix');
        if (approved?.judul) return approved.judul;
        if (matched[0]?.judul) return matched[0].judul;
      }
    }

    if (currentUser?.judul_ta) return currentUser.judul_ta;
    if (currentUser?.judul) return currentUser.judul;

    return '-';
  }, [thesisTitles, currentUser, studentNim]);
  const sa = useMemo(() => {
    if (!studentNim) return null;
    return studentAdvisors.find(s => String(s.student_nim).trim() === String(studentNim).trim());
  }, [studentAdvisors, studentNim]);

  const dospem1Nama = useMemo(() => {
    if (sa?.dospem1_nip) {
      const found = advisors.find(a => a.nip === sa.dospem1_nip);
      if (found) return found.nama;
    }
    const cons1 = consultations.find(c => String(c.mhs_nim).trim() === String(studentNim).trim() && c.pembimbing === 'Pembimbing 1');
    if (cons1?.dosen_nama) return cons1.dosen_nama;
    return '-';
  }, [advisors, sa, consultations, studentNim]);

  const dospem2Nama = useMemo(() => {
    if (sa?.dospem2_nip) {
      const found = advisors.find(a => a.nip === sa.dospem2_nip);
      if (found) return found.nama;
    }
    const cons2 = consultations.find(c => String(c.mhs_nim).trim() === String(studentNim).trim() && c.pembimbing === 'Pembimbing 2');
    if (cons2?.dosen_nama) return cons2.dosen_nama;
    return '-';
  }, [advisors, sa, consultations, studentNim]);

  // Helper render status bimbingan sesuai 4 respon dosen:
  // 1. Revisi Mayor -> Merah (Rose)
  // 2. Revisi Minor -> Biru (Blue)
  // 3. Menunggu -> Kuning (Amber)
  // 4. Diterima -> Hijau (Emerald)
  const getStatusBadge = (data) => {
    if (!data) return null;

    let jenis = data.jenis_revisi;
    const note = data.masukan_dosen || '';
    if (note.includes('[Revisi Mayor]') || note.includes('[Mayor]')) {
      jenis = 'Mayor';
    } else if (note.includes('[Revisi Minor]') || note.includes('[Minor]')) {
      jenis = 'Minor';
    } else if (note.includes('[Diterima]') || note.includes('[Disetujui]')) {
      jenis = 'Diterima';
    } else if (note.includes('[Menunggu]')) {
      jenis = 'Menunggu';
    }

    if (!jenis) {
      if (data.status === 'disetujui') {
        jenis = 'Diterima';
      } else if (data.status === 'menunggu_tanggapan') {
        jenis = 'Menunggu';
      } else if (data.status === 'perlu_revisi') {
        jenis = 'Minor';
      } else if (data.status === 'ditolak') {
        jenis = 'Ditolak';
      } else {
        jenis = 'Menunggu';
      }
    }

    const j = String(jenis).trim();

    if (j === 'Mayor' || j.toLowerCase() === 'revisi mayor') {
      return (
        <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded border border-rose-300 bg-rose-50 text-rose-700 uppercase tracking-wider print:border-black print:text-black print:bg-transparent">
          Revisi Mayor
        </span>
      );
    }

    if (j === 'Minor' || j.toLowerCase() === 'revisi minor') {
      return (
        <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded border border-blue-300 bg-blue-50 text-blue-700 uppercase tracking-wider print:border-black print:text-black print:bg-transparent">
          Revisi Minor
        </span>
      );
    }

    if (j === 'Menunggu' || j.toLowerCase() === 'menunggu tanggapan') {
      return (
        <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-700 uppercase tracking-wider print:border-black print:text-black print:bg-transparent">
          Menunggu
        </span>
      );
    }

    if (j === 'Diterima' || j.toLowerCase() === 'disetujui') {
      return (
        <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded border border-emerald-300 bg-emerald-50 text-emerald-700 uppercase tracking-wider print:border-black print:text-black print:bg-transparent">
          Diterima
        </span>
      );
    }

    if (j === 'Ditolak') {
      return (
        <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded border border-rose-300 bg-rose-50 text-rose-700 uppercase tracking-wider print:border-black print:text-black print:bg-transparent">
          Ditolak
        </span>
      );
    }

    return (
      <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded border border-slate-300 bg-slate-50 text-slate-700 uppercase tracking-wider print:border-black print:text-black print:bg-transparent">
        {j}
      </span>
    );
  };

  // Validasi Paraf Dosen: QR Paraf HANYA muncul jika status bimbingan BUKAN "Menunggu"
  const isConsultationValidated = (data) => {
    if (!data) return false;

    let jenis = data.jenis_revisi;
    const note = data.masukan_dosen || '';
    if (note.includes('[Revisi Mayor]') || note.includes('[Mayor]')) {
      jenis = 'Mayor';
    } else if (note.includes('[Revisi Minor]') || note.includes('[Minor]')) {
      jenis = 'Minor';
    } else if (note.includes('[Diterima]') || note.includes('[Disetujui]')) {
      jenis = 'Diterima';
    } else if (note.includes('[Menunggu]')) {
      jenis = 'Menunggu';
    }

    if (jenis === 'Menunggu') return false;
    if ((data.status === 'menunggu_tanggapan' || data.status === 'menunggu') && (!data.masukan_dosen || data.masukan_dosen.includes('[Menunggu]'))) return false;

    // Jika telah disetujui, perlu_revisi, atau memiliki kategori respon aktif (Diterima, Minor, Mayor)
    if (data.status === 'disetujui' || data.status === 'perlu_revisi' || jenis === 'Diterima' || jenis === 'Minor' || jenis === 'Mayor') {
      return true;
    }

    return false;
  };

  // Filter consultations for current student in strict chronological order (oldest to newest: Bimbingan 1, 2, 3...)
  const studentConsultations = useMemo(() => {
    if (!studentNim) return [];

    return consultations
      .filter(c => String(c.mhs_nim).trim() === String(studentNim).trim())
      .sort((a, b) => {
        // 1. Primary: Compare tanggal (YYYY-MM-DD)
        const dateA = a.tanggal || '';
        const dateB = b.tanggal || '';
        if (dateA !== dateB) {
          return dateA.localeCompare(dateB);
        }

        // 2. Secondary: Waktu input pembuatan (created_at kronologis) - yang diinput lebih dulu tampil di nomor urut lebih awal
        const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (createdA !== 0 && createdB !== 0 && createdA !== createdB) {
          return createdA - createdB;
        }

        // 3. Tertiary: Jika tanggal dan created_at sama/tidak membedakan, Pembimbing 1 (Utama) SELALU didahulukan sebelum Pembimbing 2 (Pendamping)
        const isPemb2A = String(a.pembimbing || '').includes('2');
        const isPemb2B = String(b.pembimbing || '').includes('2');
        if (isPemb2A !== isPemb2B) {
          return isPemb2A ? 1 : -1;
        }

        // 4. Quaternary: Compare waktu sesi (HH:MM)
        const waktuA = a.waktu || '';
        const waktuB = b.waktu || '';
        if (waktuA !== waktuB) {
          return waktuA.localeCompare(waktuB);
        }

        return String(a.id || '').localeCompare(String(b.id || ''));
      });
  }, [consultations, studentNim]);

  const verifyUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/verify/bimbingan/${studentNim}`
    : `/verify/bimbingan/${studentNim}`;

  const renderParafCell = (data, roleLabel) => {
    if (!data) return '';
    const isTargetAdvisor = roleLabel === 'Pembimbing 1'
      ? (data.pembimbing === 'Pembimbing 1' || !data.pembimbing)
      : data.pembimbing === 'Pembimbing 2';
    if (!isTargetAdvisor) return '';
    if (!isConsultationValidated(data)) {
      return <span className="text-slate-400 font-semibold text-xs print:text-black">-</span>;
    }
    const logVerifyUrl = `${verifyUrl}?log=${data.id}`;
    return (
      <div className="flex justify-center items-center py-1">
        <a href={logVerifyUrl} target="_blank" rel="noopener noreferrer" title="Scan/Klik QR Verifikasi Bimbingan">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(logVerifyUrl)}`}
            alt={`QR Paraf ${roleLabel}`}
            className="w-14 h-14 sm:w-16 sm:h-16 object-contain inline-block border border-slate-300 p-1 rounded-sm shadow-2xs hover:scale-105 transition-transform print:border-slate-400"
          />
        </a>
      </div>
    );
  };

  // Jumlah baris dinamis: minimal target prodi (24) dan otomatis bertambah bila sesi > 24
  const targetRows = minSessionsRequirement?.minTotal || getMinTotalSessionsDefense();
  const ROWS_COUNT = Math.max(targetRows, studentConsultations.length);

  const formattedToday = useMemo(() => {
    return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }, []);

  const PAPER_WIDTH_PX = 794;
  const scrollWrapRef = useRef(null);
  const paperRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(PAPER_WIDTH_PX);
  const [paperHeight, setPaperHeight] = useState(1123);

  useEffect(() => {
    const updateMeasurements = () => {
      if (scrollWrapRef.current) {
        const w = scrollWrapRef.current.clientWidth;
        if (w > 0) setContainerWidth(w);
      }
      if (paperRef.current) {
        const h = paperRef.current.offsetHeight || paperRef.current.scrollHeight;
        if (h > 0) setPaperHeight(h);
      }
    };

    updateMeasurements();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateMeasurements) : null;
    if (ro) {
      if (scrollWrapRef.current) ro.observe(scrollWrapRef.current);
      if (paperRef.current) ro.observe(paperRef.current);
    }
    window.addEventListener('resize', updateMeasurements);
    return () => {
      window.removeEventListener('resize', updateMeasurements);
      ro?.disconnect();
    };
  }, [ROWS_COUNT, studentConsultations.length]);

  const activeScale = useMemo(() => {
    return Math.min(1, Math.max(0.32, containerWidth / PAPER_WIDTH_PX));
  }, [containerWidth]);

  const isScaledDown = activeScale < 0.99;

  return (
    <div className="kartu-page-wrapper max-w-4xl mx-auto space-y-4 sm:space-y-6 select-none bg-slate-50 p-1 sm:p-6 min-h-screen print:bg-white print:p-0 print:m-0 print:min-h-0">
      
      {/* Top Action Bar (Not printed) */}
      <div className="space-y-2.5 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <Link
            href="/thesis/consultations"
            className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Kembali ke Entry Bimbingan</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-600 shadow-2xs">
              {studentConsultations.length} Sesi Tercatat
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>Cetak Kartu Bimbingan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Document Container (Auto-fit A4 width + Native Pinch-to-Zoom enabled) */}
      <div
        ref={scrollWrapRef}
        className="kartu-scroll-wrap w-full overflow-x-hidden pb-6 print:pb-0"
        style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
      >
        <div
          className="kartu-zoom-sizer mx-auto relative"
          style={{
            width: `${Math.round(PAPER_WIDTH_PX * activeScale)}px`,
            height: `${Math.round(paperHeight * activeScale)}px`,
          }}
        >
          {/* Continuous Printable Document (Kop sekali di atas, tabel mengalir antar halaman A4, TTD sekali di akhir) */}
          <div
            ref={paperRef}
            className="kartu-paper bg-white p-10 sm:p-12 shadow-sm border border-slate-200 print:p-0 print:shadow-none print:border-none print:m-0"
            style={{
              width: `${PAPER_WIDTH_PX}px`,
              minHeight: '297mm',
              transform: isScaledDown ? `scale(${activeScale})` : undefined,
              transformOrigin: 'top left',
            }}
          >
            <div className="kartu-header-block">
              {/* Kop Surat Resmi UNSRI - Fasilkom */}
              <div className="mb-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="shrink-0">
                    <img 
                      src={unsriLogo} 
                      alt="Logo Universitas Sriwijaya" 
                      className="w-24 h-24 object-contain"
                    />
                  </div>
                  <div className="flex-1 text-center text-black font-serif leading-tight">
                    <p className="text-sm font-semibold tracking-wide uppercase">
                      KEMENTERIAN PENDIDIKAN TINGGI,<br />SAINS DAN TEKNOLOGI
                    </p>
                    <h2 className="text-lg font-extrabold tracking-wide uppercase mt-0.5">
                      UNIVERSITAS SRIWIJAYA
                    </h2>
                    <h3 className="text-base font-bold tracking-wide uppercase">
                      FAKULTAS ILMU KOMPUTER
                    </h3>
                    <h4 className="text-sm font-bold tracking-wide uppercase">
                      PROGRAM STUDI MANAJEMEN INFORMATIKA
                    </h4>
                    <p className="text-[11px] mt-1 text-slate-800 leading-normal print:text-black">
                      Kampus Unsri, Jalan Srijaya Negara Bukit Besar Palembang, Kode Pos: 30139<br />
                      Telepon (+62711)379249 Pos-el: <span className="text-blue-700 underline print:text-black print:no-underline">humas@ilkom.unsri.ac.id</span>
                    </p>
                  </div>
                  {/* Spacer placeholder agar teks di tengah tetap persis di tengah dokumen */}
                  <div className="w-24 shrink-0"></div>
                </div>

                {/* Garis Ganda Kop Surat Resmi (Tebal di atas, tipis di bawah) */}
                <div className="w-full border-b-[3px] border-black mt-3 mb-0.5"></div>
                <div className="w-full border-b-[1px] border-black mb-5"></div>
              </div>

              {/* Judul Dokumen */}
              <div className="text-center mb-6">
                <h1 className="text-sm sm:text-base font-extrabold uppercase text-black tracking-wider">
                  CATATAN KEGIATAN KONSULTASI AKADEMIK/PRIBADI
                </h1>
              </div>

              {/* Info Mahasiswa - Dynamic from logged-in account */}
              <div className="grid grid-cols-2 text-xs font-semibold text-black mb-6 gap-x-6 gap-y-1.5">
                <div className="space-y-1">
                  <p><span className="w-28 inline-block font-bold">Nama</span>: {currentUser?.nama || '-'}</p>
                  <p><span className="w-28 inline-block font-bold">NIM</span>: {studentNim || '-'}</p>
                  <p><span className="w-28 inline-block font-bold">Program Studi</span>: {currentUser?.prodi || 'D3 Manajemen Informatika'}</p>
                </div>
                <div className="space-y-1">
                  <p><span className="w-28 inline-block font-bold">Pembimbing 1</span>: {dospem1Nama}</p>
                  <p><span className="w-28 inline-block font-bold">Pembimbing 2</span>: {dospem2Nama}</p>
                </div>
                <div className="col-span-2 pt-1">
                  <p className="flex items-start">
                    <span className="w-28 inline-block font-bold shrink-0">Judul TA</span>
                    <span className="mr-1.5">:</span>
                    <span className="flex-1 font-semibold leading-relaxed">{judulTa}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Tabel Bimbingan (mengalir rapi lintas halaman A4, header otomatis berulang saat cetak) */}
            <table className="kartu-table w-full border-collapse border border-black text-xs text-black">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-black py-2 px-1 text-center w-10">No</th>
                  <th className="border border-black py-2 px-2 text-center w-28">Tanggal<br/>Bimbingan</th>
                  <th className="border border-black py-2 px-3 text-center">Materi / Bab<br/>Konsultasi</th>
                  <th className="border border-black py-2 px-2 text-center w-24">Status</th>
                  <th className="border border-black py-2 px-2 text-center w-28 sm:w-32">Paraf<br/>Pembimbing 1</th>
                  <th className="border border-black py-2 px-2 text-center w-28 sm:w-32">Paraf<br/>Pembimbing 2</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: ROWS_COUNT }).map((_, index) => {
                  const data = studentConsultations[index];
                  return (
                    <tr key={index} className="kartu-row">
                      <td className="border border-black py-2 px-1 text-center font-semibold align-middle h-14">{index + 1}</td>
                      <td className="border border-black py-2 px-2 text-center align-middle h-14">{data ? data.tanggal : ''}</td>
                      <td className="border border-black py-2 px-3 text-left font-medium align-middle h-14">
                        {data ? data.bab_topik : ''}
                      </td>
                      <td className="border border-black p-1.5 text-center align-middle h-14">
                        {data ? getStatusBadge(data) : ''}
                      </td>
                      <td className="border border-black p-1.5 text-center align-middle h-14">
                        {renderParafCell(data, 'Pembimbing 1')}
                      </td>
                      <td className="border border-black p-1.5 text-center align-middle h-14">
                        {renderParafCell(data, 'Pembimbing 2')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Tanda Tangan Kaprodi & Mahasiswa (sekali saja di akhir dokumen, tidak pernah terpotong antar halaman) */}
            <div className="kartu-signature-block mt-12">
              <div className="flex justify-between items-end text-xs text-black">
                <div className="w-72 text-center space-y-1">
                  <p className="font-semibold pb-24">
                    Koordinator Program Studi<br />
                    Manajemen Informatika,
                  </p>
                  <div className="border-b border-black w-full"></div>
                  <p className="font-bold pt-1.5">Dr. Abdiansah, S.Kom., M.Cs.</p>
                  <p className="font-mono text-[11px]">NIP: 198410012009121005</p>
                </div>
                
                <div className="w-72 text-center space-y-1">
                  <p className="font-semibold">Palembang, {formattedToday}</p>
                  <p className="font-semibold pb-24">Mahasiswa Ybs,</p>
                  <div className="border-b border-black w-full"></div>
                  <p className="font-bold pt-1.5">{currentUser?.nama || '-'}</p>
                  <p className="font-mono text-[11px]">NIM: {studentNim || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .kartu-scroll-wrap::-webkit-scrollbar {
          height: 8px;
        }
        .kartu-scroll-wrap::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 9999px;
        }
        .kartu-scroll-wrap::-webkit-scrollbar-track {
          background: #e2e8f0;
          border-radius: 9999px;
        }
        @page {
          size: A4 portrait;
          margin: 12mm 14mm 15mm 14mm;
          @top-left { content: none; }
          @top-center { content: none; }
          @top-right { content: none; }
          @bottom-left { content: none; }
          @bottom-center { content: none; }
          @bottom-right {
            content: counter(page);
            font-family: 'Plus Jakarta Sans', 'Inter', Arial, sans-serif;
            font-size: 9pt;
            font-weight: 600;
            color: #000000;
          }
        }
        @media print {
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          header, nav, .print\\:hidden, .fixed {
            display: none !important;
          }
          .kartu-page-wrapper {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            min-height: 0 !important;
            display: block !important;
          }
          .kartu-scroll-wrap {
            overflow: visible !important;
            padding: 0 !important;
          }
          .kartu-zoom-sizer {
            width: 100% !important;
            height: auto !important;
          }
          .kartu-paper {
            display: block !important;
            transform: none !important;
            width: 100% !important;
            min-width: 0 !important;
            max-width: none !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .kartu-table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          .kartu-table thead {
            display: table-header-group;
          }
          .kartu-table tbody {
            display: table-row-group;
          }
          .kartu-row,
          .kartu-header-block,
          .kartu-signature-block {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}} />
    </div>
  );
}
