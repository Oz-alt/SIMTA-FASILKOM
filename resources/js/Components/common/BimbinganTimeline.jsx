import React, { useState, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  PlusCircle, 
  ArrowRight, 
  UserCheck, 
  ExternalLink, 
  FileCheck,
  MessageSquare,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Building2,
  Video
} from 'lucide-react';
import ModalAjukanBimbingan from './ModalAjukanBimbingan.jsx';

export default function BimbinganTimeline({ consultations = [], currentUser }) {
  const [filterAdvisor, setFilterAdvisor] = useState('all'); // 'all', 'Pembimbing 1', 'Pembimbing 2'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter consultations strictly for current student
  const studentConsultations = useMemo(() => {
    if (!currentUser?.nim) return [];
    return consultations
      .filter(c => String(c.mhs_nim).trim() === String(currentUser.nim).trim())
      .sort((a, b) => {
        // Sort descending (latest first for timeline display)
        const dateA = a.tanggal || '';
        const dateB = b.tanggal || '';
        if (dateA !== dateB) return dateB.localeCompare(dateA);

        const timeA = a.waktu || '';
        const timeB = b.waktu || '';
        if (timeA !== timeB) return timeB.localeCompare(timeA);

        return String(b.id || '').localeCompare(String(a.id || ''));
      });
  }, [consultations, currentUser?.nim]);

  // Chronological order for numbering each session (Bimbingan #1, #2, etc.)
  const sessionNumbersMap = useMemo(() => {
    const sortedOldest = [...studentConsultations].sort((a, b) => {
      const dateA = a.tanggal || '';
      const dateB = b.tanggal || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return String(a.id || '').localeCompare(String(b.id || ''));
    });
    const map = new Map();
    sortedOldest.forEach((c, idx) => {
      map.set(c.id, idx + 1);
    });
    return map;
  }, [studentConsultations]);

  // Recap statistics based on 24 session requirement (12 each advisor)
  const totalApproved = studentConsultations.filter(c => c.status === 'disetujui').length;
  const countPemb1 = studentConsultations.filter(c => c.pembimbing === 'Pembimbing 1' && c.status === 'disetujui').length;
  const countPemb2 = studentConsultations.filter(c => c.pembimbing === 'Pembimbing 2' && c.status === 'disetujui').length;
  
  const minPerPembimbing = 12;
  const minRequired = 24;
  const approvedPemb1 = Math.min(countPemb1, minPerPembimbing);
  const approvedPemb2 = Math.min(countPemb2, minPerPembimbing);
  const progressPercent = Math.min(100, Math.round(((approvedPemb1 + approvedPemb2) / minRequired) * 100));
  const isEligibleForDefense = countPemb1 >= minPerPembimbing && countPemb2 >= minPerPembimbing;

  // Filtered list for display
  const displayedConsultations = useMemo(() => {
    let list = studentConsultations;
    if (filterAdvisor === 'Pembimbing 1') {
      list = list.filter(c => c.pembimbing === 'Pembimbing 1');
    } else if (filterAdvisor === 'Pembimbing 2') {
      list = list.filter(c => c.pembimbing === 'Pembimbing 2');
    }
    return list;
  }, [studentConsultations, filterAdvisor]);

  const visibleList = isExpanded ? displayedConsultations : displayedConsultations.slice(0, 4);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const parts = String(dateStr).split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6">
      
      {/* Modal Ajukan Bimbingan Baru */}
      <ModalAjukanBimbingan 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      {/* Header Linimasa */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-200/60">
            <Clock className="w-3.5 h-3.5" />
            <span>Linimasa Konsultasi Mahasiswa</span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Linimasa Bimbingan Tugas Akhir</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {studentConsultations.length} Sesi
            </span>
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
            Pantau jejak riwayat konsultasi, masukan arahan dosen pembimbing, serta progres pemenuhan syarat 24 sesi sidang akhir.
          </p>
        </div>
      </div>

      {/* Target Progress Summary Card (24 Sesi: 12x Tiap Pembimbing) */}
      <div className="bg-gradient-to-br from-slate-50 via-indigo-50/25 to-slate-50 border border-slate-200/90 rounded-xl p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Progres Kelayakan Sidang</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isEligibleForDefense 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {isEligibleForDefense ? '✓ Layak Daftar Sidang' : 'Belum Memenuhi Syarat Sidang'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">
              Tercapai <span className="font-extrabold text-indigo-700">{totalApproved}</span> dari target <span className="font-extrabold text-slate-900">{minRequired} Sesi Disetujui</span> (12x masing-masing pembimbing)
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-2xl font-black text-slate-900">{progressPercent}%</span>
            <span className="text-[10px] block text-slate-500 font-medium">Kesiapan Berkas Sidang</span>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Dual Breakdown: Pembimbing 1 & Pembimbing 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
          {/* Pembimbing 1 */}
          <div className="bg-white/80 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="font-bold text-slate-700">Dosen Pembimbing 1 (Utama)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-indigo-700">{countPemb1}/{minPerPembimbing}</span>
              {countPemb1 >= minPerPembimbing ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <span className="text-[10px] text-amber-600 font-semibold">(Kurang {minPerPembimbing - countPemb1})</span>
              )}
            </div>
          </div>

          {/* Pembimbing 2 */}
          <div className="bg-white/80 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="font-bold text-slate-700">Dosen Pembimbing 2 (Pendamping)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-purple-700">{countPemb2}/{minPerPembimbing}</span>
              {countPemb2 >= minPerPembimbing ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <span className="text-[10px] text-amber-600 font-semibold">(Kurang {minPerPembimbing - countPemb2})</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs by Advisor */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterAdvisor('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterAdvisor === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Semua Pembimbing ({studentConsultations.length})
          </button>
          <button
            onClick={() => setFilterAdvisor('Pembimbing 1')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterAdvisor === 'Pembimbing 1'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
            }`}
          >
            Pembimbing 1 ({studentConsultations.filter(c => c.pembimbing === 'Pembimbing 1').length})
          </button>
          <button
            onClick={() => setFilterAdvisor('Pembimbing 2')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterAdvisor === 'Pembimbing 2'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-700'
            }`}
          >
            Pembimbing 2 ({studentConsultations.filter(c => c.pembimbing === 'Pembimbing 2').length})
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-medium">
          Menampilkan urutan sesi terbaru ke terlama
        </span>
      </div>

      {/* Vertical Timeline List */}
      {displayedConsultations.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">
            {filterAdvisor === 'all' 
              ? 'Belum Ada Sesi Bimbingan Dicatat' 
              : `Belum Ada Sesi Bimbingan dengan ${filterAdvisor}`}
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {filterAdvisor === 'all'
              ? 'Mulai catat sesi konsultasi Anda bersama Dosen Pembimbing 1 dan Dosen Pembimbing 2 untuk memantau kemajuan penulisan Tugas Akhir.'
              : `Catat pertemuan konsultasi Anda berikutnya bersama ${filterAdvisor}.`}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Catat Bimbingan Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {visibleList.map((item) => {
            const isApproved = item.status === 'disetujui';
            const isRevision = item.status === 'perlu_revisi';
            const isPending = !isApproved && !isRevision;
            const seqNumber = sessionNumbersMap.get(item.id);

            return (
              <div key={item.id} className="relative group">
                {/* Node Indicator on the line */}
                <span 
                  className={`absolute -left-[27px] sm:-left-[35px] top-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 border-white shadow-xs transition-transform group-hover:scale-110 ${
                    isApproved 
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-100' 
                      : isRevision 
                      ? 'bg-amber-500 text-white ring-4 ring-amber-100' 
                      : 'bg-blue-500 text-white ring-4 ring-blue-100'
                  }`}
                  title={isApproved ? 'Disetujui' : isRevision ? 'Perlu Revisi' : 'Menunggu Validasi'}
                >
                  {isApproved ? (
                    <CheckCircle2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  ) : isRevision ? (
                    <AlertCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  ) : (
                    <Clock className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  )}
                </span>

                {/* Timeline Card */}
                <div className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 sm:p-5 shadow-2xs hover:shadow-sm transition-all space-y-3">
                  {/* Top Meta Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {seqNumber && (
                        <span className="text-xs font-black text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md">
                          Sesi #{seqNumber}
                        </span>
                      )}
                      
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        item.pembimbing === 'Pembimbing 1'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {item.pembimbing || 'Pembimbing 1'}
                      </span>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center space-x-1 ${
                        item.metode === 'daring'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {item.metode === 'daring' ? (
                          <>
                            <Video className="w-3 h-3 text-emerald-600" />
                            <span>Daring</span>
                          </>
                        ) : (
                          <>
                            <Building2 className="w-3 h-3 text-blue-600" />
                            <span>Luring</span>
                          </>
                        )}
                      </span>

                      <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.dosen_nama || 'Dosen Pembimbing'}</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-400 font-medium flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(item.tanggal)}</span>
                        {item.waktu && <span className="font-mono text-[11px]">({item.waktu} WIB)</span>}
                      </span>

                      {/* Status Tag */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        isApproved 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : isRevision 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isApproved ? '✓ Disetujui' : isRevision ? 'Perlu Revisi' : 'Menunggu'}
                      </span>
                    </div>
                  </div>

                  {/* Bab & Topik Title */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {item.bab_topik || 'Topik Bimbingan'}
                    </h4>
                  </div>

                  {/* Catatan Mahasiswa */}
                  {item.catatan_mahasiswa && (
                    <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/60 p-3 rounded-lg border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-slate-400" />
                        <span>Catatan Mahasiswa:</span>
                      </span>
                      <p className="text-slate-700">{item.catatan_mahasiswa}</p>
                    </div>
                  )}

                  {/* Masukan Dosen Pembimbing (Highlight Box) */}
                  {item.masukan_dosen ? (
                    <div className="bg-gradient-to-r from-indigo-50/70 to-slate-50 border-l-4 border-indigo-500 rounded-r-lg p-3 text-xs space-y-1">
                      <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        <span>Arahan / Catatan Dosen:</span>
                      </span>
                      <p className="text-slate-800 italic leading-relaxed font-medium">
                        &ldquo;{item.masukan_dosen}&rdquo;
                      </p>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">
                      {isApproved ? 'Telah diverifikasi tanpa catatan revisi tambahan.' : 'Menunggu tinjauan masukan dari dosen pembimbing.'}
                    </div>
                  )}

                  {/* File revisi / attachment if present */}
                  {item.file_revisi_url && (
                    <div className="pt-1 flex items-center justify-between text-xs border-t border-slate-100">
                      <a
                        href={item.file_revisi_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Unduh Dokumen Revisi Mahasiswa</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expand / Collapse or View More Footer */}
      {displayedConsultations.length > 4 && (
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 text-xs font-semibold">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center space-x-1.5 text-indigo-600 hover:text-indigo-800 py-1 px-3 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>Tampilkan Lebih Sedikit (4 Terkini)</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>Tampilkan Seluruh {displayedConsultations.length} Sesi Linimasa</span>
              </>
            )}
          </button>

          <Link
            href="/thesis/consultations"
            className="text-slate-500 hover:text-blue-600 flex items-center space-x-1 transition-colors"
          >
            <span>Buka Halaman Entry Bimbingan Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

    </div>
  );
}
