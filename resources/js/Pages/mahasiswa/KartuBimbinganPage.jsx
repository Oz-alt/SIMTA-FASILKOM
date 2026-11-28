import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ArrowLeft, Printer } from 'lucide-react';
import { Link } from '@inertiajs/react';
import BimbinganReminderBanner from '../../Components/common/BimbinganReminderBanner.jsx';
import { calculateBimbinganReminder } from '../../lib/bimbinganReminder.js';
import { getMinTotalSessionsDefense, paginateConsultationRows } from '../../lib/consultationUtils.js';
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
      <div className="flex justify-center items-center">
        <a href={logVerifyUrl} target="_blank" rel="noopener noreferrer" title="Scan/Klik QR Verifikasi Bimbingan">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(logVerifyUrl)}`}
            alt={`QR Paraf ${roleLabel}`}
            className="w-12 h-12 object-contain inline-block border border-slate-300 p-0.5 rounded-sm shadow-2xs hover:scale-105 transition-transform print:border-slate-400"
          />
        </a>
      </div>
    );
  };

  // Pagination A4: maksimal 8 baris per lembar A4 agar format kop, tabel, dan tanda tangan konsisten di web maupun cetak
  const ROWS_PER_PAGE = 8;
  const targetRows = minSessionsRequirement?.minTotal || getMinTotalSessionsDefense();
  const ROWS_COUNT = Math.max(targetRows, studentConsultations.length);

  const pages = useMemo(() => {
    return paginateConsultationRows(studentConsultations, targetRows, ROWS_PER_PAGE);
  }, [studentConsultations, targetRows]);

  const formattedToday = useMemo(() => {
    return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }, []);

  const PAPER_WIDTH_PX = 794;
  const DEFAULT_PAPER_HEIGHT_PX = 1123;
  const scrollWrapRef = useRef(null);
  const sheetRefs = useRef([]);
  const [containerWidth, setContainerWidth] = useState(PAPER_WIDTH_PX);
  const [sheetHeights, setSheetHeights] = useState({});

  useEffect(() => {
    const updateMeasurements = () => {
      if (scrollWrapRef.current) {
        const w = scrollWrapRef.current.clientWidth;
        if (w > 0) setContainerWidth(w);
      }
      const nextHeights = {};
      pages.forEach((_, idx) => {
        const el = sheetRefs.current[idx];
        if (el) {
          const h = el.offsetHeight || el.scrollHeight;
          if (h > 0) nextHeights[idx] = h;
        }
      });
      setSheetHeights((prev) => {
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(nextHeights);
        if (
          prevKeys.length === nextKeys.length &&
          nextKeys.every((k) => prev[k] === nextHeights[k])
        ) {
          return prev;
        }
        return nextHeights;
      });
    };

    updateMeasurements();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateMeasurements) : null;
    if (ro) {
      if (scrollWrapRef.current) ro.observe(scrollWrapRef.current);
      pages.forEach((_, idx) => {
        if (sheetRefs.current[idx]) ro.observe(sheetRefs.current[idx]);
      });
    }
    window.addEventListener('resize', updateMeasurements);
    return () => {
      window.removeEventListener('resize', updateMeasurements);
      ro?.disconnect();
    };
  }, [ROWS_COUNT, pages]);

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
              {studentConsultations.length} Sesi Tercatat &bull; {pages.length} Lembar A4
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

      {/* Document Container (Auto-fit A4 multi-sheet format + Native Pinch-to-Zoom enabled) */}
      <div
        ref={scrollWrapRef}
        className="kartu-scroll-wrap w-full overflow-x-hidden pb-6 print:pb-0"
        style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
      >
        <div className="kartu-pages-list space-y-6 print:space-y-0">
          {pages.map((page, pageIndex) => {
            const isLastPage = pageIndex === pages.length - 1;
            const currentSheetHeight = sheetHeights[pageIndex] || DEFAULT_PAPER_HEIGHT_PX;

            return (
              <div key={page.pageNumber} className="kartu-sheet-slot space-y-2 print:space-y-0">
                {/* Web-only page badge */}
                <div
                  className="mx-auto flex items-center justify-between text-[11px] font-bold text-slate-500 px-1 print:hidden"
                  style={{ width: `${Math.round(PAPER_WIDTH_PX * activeScale)}px` }}
                >
                  <span>Halaman {page.pageNumber} dari {page.totalPages} (A4)</span>
                  <span>Pertemuan {page.startNumber} &ndash; {page.endNumber}</span>
                </div>

                <div
                  className="kartu-zoom-sizer mx-auto relative"
                  style={{
                    width: `${Math.round(PAPER_WIDTH_PX * activeScale)}px`,
                    height: `${Math.round(currentSheetHeight * activeScale)}px`,
                  }}
                >
                  {/* Printable A4 Sheet */}
                  <div
                    ref={(el) => {
                      sheetRefs.current[pageIndex] = el;
                    }}
                    className={`kartu-paper bg-white p-9 sm:p-10 shadow-sm border border-slate-200 flex flex-col justify-between print:shadow-none print:border-none print:m-0 ${
                      isLastPage ? 'kartu-paper-last' : ''
                    }`}
                    style={{
                      width: `${PAPER_WIDTH_PX}px`,
                      minHeight: '297mm',
                      transform: isScaledDown ? `scale(${activeScale})` : undefined,
                      transformOrigin: 'top left',
                    }}
                  >
                    <div>
                      {/* Kop Surat Resmi UNSRI - Fasilkom */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between gap-4">
                          <div className="shrink-0">
                            <img 
                              src={unsriLogo} 
                              alt="Logo Universitas Sriwijaya" 
                              className="w-20 h-20 object-contain"
                            />
                          </div>
                          <div className="flex-1 text-center text-black font-serif leading-tight">
                            <p className="text-xs font-semibold tracking-wide uppercase">
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
                            <p className="text-[10.5px] mt-1 text-slate-800 leading-normal print:text-black">
                              Kampus Unsri, Jalan Srijaya Negara Bukit Besar Palembang, Kode Pos: 30139<br />
                              Telepon (+62711)379249 Pos-el: <span className="text-blue-700 underline print:text-black print:no-underline">humas@ilkom.unsri.ac.id</span>
                            </p>
                          </div>
                          {/* Spacer placeholder agar teks di tengah tetap persis di tengah dokumen */}
                          <div className="w-20 shrink-0"></div>
                        </div>

                        {/* Garis Ganda Kop Surat Resmi (Tebal di atas, tipis di bawah) */}
                        <div className="w-full border-b-[3px] border-black mt-2.5 mb-0.5"></div>
                        <div className="w-full border-b-[1px] border-black mb-4"></div>
                      </div>

                      {/* Judul Dokumen */}
                      <div className="text-center mb-4">
                        <h1 className="text-sm sm:text-base font-extrabold uppercase text-black tracking-wider">
                          CATATAN KEGIATAN KONSULTASI AKADEMIK/PRIBADI
                        </h1>
                      </div>

                      {/* Info Mahasiswa - Dynamic from logged-in account */}
                      <div className="grid grid-cols-2 text-xs font-semibold text-black mb-4 gap-x-6 gap-y-1">
                        <div className="space-y-1">
                          <p><span className="w-28 inline-block font-bold">Nama</span>: {currentUser?.nama || '-'}</p>
                          <p><span className="w-28 inline-block font-bold">NIM</span>: {studentNim || '-'}</p>
                          <p><span className="w-28 inline-block font-bold">Program Studi</span>: {currentUser?.prodi || 'D3 Manajemen Informatika'}</p>
                        </div>
                        <div className="space-y-1">
                          <p><span className="w-28 inline-block font-bold">Pembimbing 1</span>: {dospem1Nama}</p>
                          <p><span className="w-28 inline-block font-bold">Pembimbing 2</span>: {dospem2Nama}</p>
                        </div>
                        <div className="col-span-2 pt-0.5">
                          <p className="flex items-start">
                            <span className="w-28 inline-block font-bold shrink-0">Judul TA</span>
                            <span className="mr-1.5">:</span>
                            <span className="flex-1 font-semibold leading-snug">{judulTa}</span>
                          </p>
                        </div>
                      </div>

                      {/* Tabel Bimbingan */}
                      <table className="w-full border-collapse border border-black text-xs text-black">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="border border-black py-1.5 px-1 text-center w-10">No</th>
                            <th className="border border-black py-1.5 px-2 text-center w-28">Tanggal<br/>Bimbingan</th>
                            <th className="border border-black py-1.5 px-3 text-center">Materi / Bab<br/>Konsultasi</th>
                            <th className="border border-black py-1.5 px-2 text-center w-24">Status</th>
                            <th className="border border-black py-1.5 px-2 text-center w-28 sm:w-32">Paraf<br/>Pembimbing 1</th>
                            <th className="border border-black py-1.5 px-2 text-center w-28 sm:w-32">Paraf<br/>Pembimbing 2</th>
                          </tr>
                        </thead>
                        <tbody>
                          {page.rows.map(({ rowNumber, data }) => (
                            <tr key={rowNumber} className="kartu-row">
                              <td className="border border-black py-1 px-1 text-center font-semibold align-middle h-[56px]">{rowNumber}</td>
                              <td className="border border-black py-1 px-2 text-center align-middle h-[56px]">{data ? data.tanggal : ''}</td>
                              <td className="border border-black py-1 px-3 text-left text-[11px] leading-snug font-medium align-middle h-[56px]">
                                {data ? data.bab_topik : ''}
                              </td>
                              <td className="border border-black p-1 text-center align-middle h-[56px]">
                                {data ? getStatusBadge(data) : ''}
                              </td>
                              <td className="border border-black p-1 text-center align-middle h-[56px]">
                                {renderParafCell(data, 'Pembimbing 1')}
                              </td>
                              <td className="border border-black p-1 text-center align-middle h-[56px]">
                                {renderParafCell(data, 'Pembimbing 2')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Tanda Tangan Kaprodi & Mahasiswa */}
                    <div className="kartu-signature-block mt-6">
                      <div className="flex justify-between items-end text-xs text-black">
                        <div className="w-72 text-center space-y-1">
                          <p className="font-semibold pb-16">
                            Koordinator Program Studi<br />
                            Manajemen Informatika,
                          </p>
                          <div className="border-b border-black w-full"></div>
                          <p className="font-bold pt-1">Dr. Abdiansah, S.Kom., M.Cs.</p>
                          <p className="font-mono text-[11px]">NIP: 198410012009121005</p>
                        </div>
                        
                        <div className="w-72 text-center space-y-1">
                          <p className="font-semibold">Palembang, {formattedToday}</p>
                          <p className="font-semibold pb-16">Mahasiswa Ybs,</p>
                          <div className="border-b border-black w-full"></div>
                          <p className="font-bold pt-1">{currentUser?.nama || '-'}</p>
                          <p className="font-mono text-[11px]">NIM: {studentNim || '-'}</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-600 print:text-black text-right mt-2 font-medium">
                        Halaman {page.pageNumber} dari {page.totalPages}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
          margin: 0;
        }
        @media print {
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
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
          }
          .kartu-scroll-wrap {
            overflow: visible !important;
            padding: 0 !important;
          }
          .kartu-pages-list {
            display: block !important;
          }
          .kartu-sheet-slot {
            margin: 0 !important;
            padding: 0 !important;
          }
          .kartu-zoom-sizer {
            width: auto !important;
            height: auto !important;
          }
          .kartu-paper {
            transform: none !important;
            width: 210mm !important;
            min-height: 294mm !important;
            margin: 0 auto !important;
            padding: 9mm 12mm !important;
            box-shadow: none !important;
            border: none !important;
            box-sizing: border-box !important;
            page-break-after: always;
            break-after: page;
          }
          .kartu-paper.kartu-paper-last {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .kartu-row,
          .kartu-signature-block {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}} />
    </div>
  );
}
