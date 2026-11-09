import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  X, 
  Calendar, 
  Clock, 
  BookOpen, 
  Link2, 
  AlertCircle, 
  Loader2, 
  CheckCircle2,
  ExternalLink,
  Building2,
  Video,
  Info
} from 'lucide-react';

function timeToMinutes(t) {
  if (!t) return 0;
  const clean = String(t).replace('.', ':').trim();
  const [h, m] = clean.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function getSuggestedNextTime(timeStr) {
  if (!timeStr) return '10:00';
  const clean = String(timeStr).replace('.', ':').trim();
  const [h, m] = clean.split(':').map(Number);
  const nextHour = (h || 9) + 1;
  const clampedHour = Math.min(nextHour, 23);
  return `${String(clampedHour).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
}

function formatIndoDate(dateStr) {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export default function ModalAjukanBimbingan({ isOpen, onClose }) {
  const { currentUser, studentAdvisors, advisors, thesisTitles, getStudentAdvisors, consultations, addConsultation } = useAuth();

  const studentNim = String(currentUser?.nim || '').trim();

  // Daftar riwayat konsultasi mahasiswa saat ini yang valid (tidak ditolak), diurutkan kronologis
  const studentConsultations = useMemo(() => {
    if (!studentNim) return [];
    return (consultations || [])
      .filter(c => {
        const matchNim = String(c.mhs_nim || '').trim() === studentNim;
        const notDitolak = c.status !== 'ditolak';
        return matchNim && notDitolak;
      })
      .sort((a, b) => {
        const dateDiff = (a.tanggal || '').localeCompare(b.tanggal || '');
        if (dateDiff !== 0) return dateDiff;
        return timeToMinutes(a.waktu) - timeToMinutes(b.waktu);
      });
  }, [consultations, studentNim]);

  // Dynamic Dospem 1 & 2 assigned for current logged-in student
  const sa = useMemo(() => {
    return studentAdvisors?.find(s => currentUser?.nim && String(s.student_nim).trim() === String(currentUser.nim).trim());
  }, [studentAdvisors, currentUser]);

  const resolvedAdvisors = useMemo(() => {
    if (typeof getStudentAdvisors === 'function' && studentNim) {
      return getStudentAdvisors(studentNim);
    }
    return { dospem1: null, dospem2: null };
  }, [getStudentAdvisors, studentNim, studentAdvisors, advisors, thesisTitles]);

  const dospem1 = useMemo(() => {
    if (resolvedAdvisors?.dospem1) return resolvedAdvisors.dospem1;
    return sa ? advisors?.find(a => String(a.nip || '').trim() === String(sa.dospem1_nip || '').trim()) : null;
  }, [resolvedAdvisors, advisors, sa]);

  const dospem2 = useMemo(() => {
    if (resolvedAdvisors?.dospem2) return resolvedAdvisors.dospem2;
    return sa ? advisors?.find(a => String(a.nip || '').trim() === String(sa.dospem2_nip || '').trim()) : null;
  }, [resolvedAdvisors, advisors, sa]);

  const dospem1Nama = dospem1?.nama || sa?.dospem1_nama || 'Dosen Pembimbing 1';
  const dospem2Nama = dospem2?.nama || sa?.dospem2_nama || 'Dosen Pembimbing 2';

  // Cek sesi bimbingan yang masih berstatus menunggu tanggapan per pembimbing
  const pendingPemb1 = useMemo(() => {
    return (studentConsultations || []).find(c => {
      const isPemb1 = !String(c.pembimbing || '').includes('2');
      const isPending = c.status === 'menunggu_tanggapan' || c.status === 'menunggu' || c.status === 'menunggu_validasi';
      const hasFeedback = Boolean(c.masukan_dosen && c.masukan_dosen.trim() && !c.masukan_dosen.includes('[Menunggu]'));
      return isPemb1 && isPending && !hasFeedback;
    });
  }, [studentConsultations]);

  const pendingPemb2 = useMemo(() => {
    return (studentConsultations || []).find(c => {
      const isPemb2 = String(c.pembimbing || '').includes('2');
      const isPending = c.status === 'menunggu_tanggapan' || c.status === 'menunggu' || c.status === 'menunggu_validasi';
      const hasFeedback = Boolean(c.masukan_dosen && c.masukan_dosen.trim() && !c.masukan_dosen.includes('[Menunggu]'));
      return isPemb2 && isPending && !hasFeedback;
    });
  }, [studentConsultations]);

  const isBothPending = Boolean(pendingPemb1 && pendingPemb2);

  // Inisialisasi awal form: Jika Pembimbing 1 pending respon dosen, otomatis arahkan ke Pembimbing 2
  const initialPembimbingChoice = (pendingPemb1 && !pendingPemb2) ? 'Pembimbing 2' : 'Pembimbing 1';
  const initialDosenChoice = initialPembimbingChoice === 'Pembimbing 2' ? dospem2Nama : dospem1Nama;

  const [formData, setFormData] = useState({
    pembimbing: initialPembimbingChoice,
    dosen_nama: initialDosenChoice,
    metode: 'luring',
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '09:00',
    bab_topik: '',
    catatan_mahasiswa: '',
    file_revisi_url: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Cek apakah pembimbing yang sedang dipilih saat ini sedang menunggu tanggapan
  const isSelectedPembimbingPending = useMemo(() => {
    if (formData.pembimbing === 'Pembimbing 2') return Boolean(pendingPemb2);
    return Boolean(pendingPemb1);
  }, [formData.pembimbing, pendingPemb1, pendingPemb2]);

  // Sesi bimbingan terakhir khusus pembimbing yang sedang dipilih
  const lastBimbingan = useMemo(() => {
    const isTargetPemb2 = formData.pembimbing === 'Pembimbing 2';
    const forPemb = studentConsultations.filter(c => {
      const isC2 = String(c.pembimbing || '').includes('2');
      return isTargetPemb2 ? isC2 : !isC2;
    });
    if (forPemb.length === 0) return null;
    return forPemb[forPemb.length - 1];
  }, [studentConsultations, formData.pembimbing]);

  const lastBimbinganDate = lastBimbingan?.tanggal || null;

  // Tanggal minimal yang diizinkan adalah tanggal bimbingan terakhir pembimbing ini (boleh sama)
  const minAllowedDate = lastBimbinganDate || '';

  // Sesi bimbingan pada tanggal terakhir untuk pembimbing ini (untuk info helper)
  const consOnLastDate = useMemo(() => {
    if (!lastBimbinganDate || studentConsultations.length === 0) return [];
    const isTargetPemb2 = formData.pembimbing === 'Pembimbing 2';
    return studentConsultations.filter(c => {
      const isC2 = String(c.pembimbing || '').includes('2');
      const matchPemb = isTargetPemb2 ? isC2 : !isC2;
      return matchPemb && c.tanggal === lastBimbinganDate;
    });
  }, [studentConsultations, lastBimbinganDate, formData.pembimbing]);

  const firstConsOnLastDate = consOnLastDate.length > 0 ? consOnLastDate[0] : null;

  // Sesi bimbingan yang sudah ada pada tanggal yang dipilih untuk pembimbing terpilih
  const existingConsOnSelectedDate = useMemo(() => {
    if (!formData.tanggal || studentConsultations.length === 0) return [];
    const isTargetPemb2 = formData.pembimbing === 'Pembimbing 2';
    return studentConsultations.filter(c => {
      const isC2 = String(c.pembimbing || '').includes('2');
      const matchPemb = isTargetPemb2 ? isC2 : !isC2;
      return matchPemb && c.tanggal === formData.tanggal;
    });
  }, [studentConsultations, formData.tanggal, formData.pembimbing]);

  const firstConsOnDate = existingConsOnSelectedDate.length > 0 ? existingConsOnSelectedDate[0] : null;

  // Validasi tanggal & waktu bimbingan untuk pembimbing spesifik
  const validateDateTime = (tanggal, waktu, pembimbing = formData.pembimbing) => {
    if (!tanggal) {
      return 'Tanggal bimbingan wajib diisi.';
    }

    const isTargetPemb2 = pembimbing === 'Pembimbing 2';
    const forPemb = studentConsultations.filter(c => {
      const isC2 = String(c.pembimbing || '').includes('2');
      return isTargetPemb2 ? isC2 : !isC2;
    });
    const lastForPemb = forPemb.length > 0 ? forPemb[forPemb.length - 1] : null;
    const lastDateForPemb = lastForPemb?.tanggal || null;

    if (lastDateForPemb && tanggal < lastDateForPemb) {
      return `Tanggal bimbingan tidak boleh lebih awal dari bimbingan terakhir dengan ${pembimbing} (${formatIndoDate(lastDateForPemb)}).`;
    }

    // Jika pada tanggal yang dipilih sudah ada sesi bimbingan sebelumnya dengan pembimbing yang sama
    const consOnDate = forPemb.filter(c => c.tanggal === tanggal);
    if (consOnDate.length > 0) {
      const firstSession = consOnDate[0];
      const lastSession = consOnDate[consOnDate.length - 1];
      const selectedMinutes = timeToMinutes(waktu);
      const firstMinutes = timeToMinutes(firstSession.waktu);
      const lastMinutes = timeToMinutes(lastSession.waktu);

      if (!waktu) {
        return 'Waktu bimbingan wajib diisi.';
      }

      // Jam harus lebih besar dari yang pertama kali bimbingan pada hari tersebut
      if (selectedMinutes <= firstMinutes) {
        return `Untuk tanggal yang sama (${formatIndoDate(tanggal)}), jam bimbingan harus lebih besar dari sesi pertama (${firstSession.waktu}).`;
      }

      if (consOnDate.length > 1 && selectedMinutes <= lastMinutes) {
        return `Untuk tanggal yang sama (${formatIndoDate(tanggal)}), jam bimbingan harus lebih besar dari sesi sebelumnya (${lastSession.waktu}).`;
      }
    }

    return '';
  };

  // Sinkronisasi tanggal & waktu awal saat modal dibuka:
  // Jika Pembimbing 1 pending respon, otomatis pilih Pembimbing 2
  useEffect(() => {
    if (isOpen) {
      let initialPemb = 'Pembimbing 1';
      let initialDosenNama = dospem1Nama;
      if (pendingPemb1 && !pendingPemb2) {
        initialPemb = 'Pembimbing 2';
        initialDosenNama = dospem2Nama;
      } else if (pendingPemb2 && !pendingPemb1) {
        initialPemb = 'Pembimbing 1';
        initialDosenNama = dospem1Nama;
      }

      const isTargetPemb2 = initialPemb === 'Pembimbing 2';
      const forPemb = (studentConsultations || []).filter(c => {
        const isC2 = String(c.pembimbing || '').includes('2');
        return isTargetPemb2 ? isC2 : !isC2;
      });
      const lastForPemb = forPemb.length > 0 ? forPemb[forPemb.length - 1] : null;
      const lastDate = lastForPemb?.tanggal || null;

      const today = new Date().toISOString().split('T')[0];
      let initialDate = today;
      if (lastDate && today < lastDate) {
        initialDate = lastDate;
      }

      let initialWaktu = '09:00';
      const consOnInitialDate = forPemb.filter(c => c.tanggal === initialDate);
      if (consOnInitialDate.length > 0) {
        const lastSession = consOnInitialDate[consOnInitialDate.length - 1];
        initialWaktu = getSuggestedNextTime(lastSession.waktu);
      }

      setFormData(prev => ({
        ...prev,
        pembimbing: initialPemb,
        dosen_nama: initialDosenNama,
        tanggal: initialDate,
        waktu: initialWaktu,
        catatan_mahasiswa: '',
        file_revisi_url: ''
      }));
      setErrorMsg('');
    }
  }, [isOpen, pendingPemb1, pendingPemb2, dospem1Nama, dospem2Nama, studentConsultations]);

  // Synchronize dynamic advisor names when student changes selection or state updates
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      dosen_nama: prev.pembimbing === 'Pembimbing 2' ? dospem2Nama : dospem1Nama
    }));
  }, [dospem1Nama, dospem2Nama]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'pembimbing') {
      const isPemb2 = value === 'Pembimbing 2';
      const newDosenNama = isPemb2 ? dospem2Nama : dospem1Nama;
      const isBlocked = (isPemb2 && pendingPemb2) || (!isPemb2 && pendingPemb1);
      
      setFormData(prev => {
        const next = {
          ...prev,
          pembimbing: value,
          dosen_nama: newDosenNama
        };
        const err = isBlocked 
          ? `Sesi bimbingan untuk ${value} masih menunggu tanggapan dosen.` 
          : validateDateTime(next.tanggal, next.waktu, value);
        setErrorMsg(err);
        return next;
      });
    } else {
      setFormData(prev => {
        const next = { ...prev, [name]: value };
        if (name === 'tanggal' || name === 'waktu') {
          const isBlocked = (next.pembimbing === 'Pembimbing 2' && pendingPemb2) || (next.pembimbing === 'Pembimbing 1' && pendingPemb1);
          const err = isBlocked 
            ? `Sesi bimbingan untuk ${next.pembimbing} masih menunggu tanggapan dosen.` 
            : validateDateTime(next.tanggal, next.waktu, next.pembimbing);
          setErrorMsg(err);
        }
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.pembimbing === 'Pembimbing 1' && pendingPemb1) {
      setErrorMsg(`Tidak dapat mencatat sesi ke Pembimbing 1 karena sesi tanggal ${pendingPemb1.tanggal} masih menunggu tanggapan dosen. Silakan pilih Pembimbing 2.`);
      return;
    }

    if (formData.pembimbing === 'Pembimbing 2' && pendingPemb2) {
      setErrorMsg(`Tidak dapat mencatat sesi ke Pembimbing 2 karena sesi tanggal ${pendingPemb2.tanggal} masih menunggu tanggapan dosen. Silakan pilih Pembimbing 1.`);
      return;
    }

    if (!formData.catatan_mahasiswa.trim()) {
      setErrorMsg('Catatan konsultasi & poin progres wajib diisi.');
      return;
    }

    const dateTimeError = validateDateTime(formData.tanggal, formData.waktu, formData.pembimbing);
    if (dateTimeError) {
      setErrorMsg(dateTimeError);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const isPemb2 = formData.pembimbing === 'Pembimbing 2';
      const selectedDosenNip = isPemb2 ? (dospem2?.nip || sa?.dospem2_nip || '') : (dospem1?.nip || sa?.dospem1_nip || '');
      const selectedDosenNama = isPemb2 ? (dospem2Nama || dospem2?.nama || formData.dosen_nama) : (dospem1Nama || dospem1?.nama || formData.dosen_nama);
      const catatanTrimmed = formData.catatan_mahasiswa.trim();
      const babTopikVal = catatanTrimmed.split('\n')[0].trim().slice(0, 100) || catatanTrimmed;

      await addConsultation({
        pembimbing: formData.pembimbing,
        dosen_nama: selectedDosenNama,
        dosen_nip: selectedDosenNip,
        metode: formData.metode || 'luring',
        tanggal: formData.tanggal,
        waktu: formData.waktu,
        bab_topik: babTopikVal,
        catatan_mahasiswa: catatanTrimmed,
        file_revisi_url: formData.file_revisi_url.trim()
      });

      setIsSubmitting(false);
      onClose();

    } catch (err) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Gagal mengajukan bimbingan.');
    }
  };

  return (
    <div 
      data-lenis-prevent
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto overscroll-contain animate-in fade-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        data-lenis-prevent
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200">
              <BookOpen className="w-3 h-3" />
              <span>Sesi Bimbingan Baru</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Catat Sesi Bimbingan &amp; Tautan Dokumen
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Info jika salah satu pembimbing sedang menunggu respon */}
        {!isBothPending && (pendingPemb1 || pendingPemb2) && (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start space-x-2.5 animate-in fade-in">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <span className="font-bold block">
                {pendingPemb1 ? 'Sesi Pembimbing 1 Menunggu Tanggapan' : 'Sesi Pembimbing 2 Menunggu Tanggapan'}
              </span>
              <p className="text-[11px] text-blue-800">
                {pendingPemb1 
                  ? `Sesi bimbingan ke Pembimbing 1 (${pendingPemb1.dosen_nama}) tanggal ${pendingPemb1.tanggal} masih menunggu respon dosen. Opsi Pembimbing 1 dikunci sementara, Anda dapat mengajukan sesi ke Pembimbing 2.`
                  : `Sesi bimbingan ke Pembimbing 2 (${pendingPemb2.dosen_nama}) tanggal ${pendingPemb2.tanggal} masih menunggu respon dosen. Opsi Pembimbing 2 dikunci sementara, Anda dapat mengajukan sesi ke Pembimbing 1.`
                }
              </p>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* 1. Pilih Pembimbing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Pilih Pembimbing *</label>
              <select
                name="pembimbing"
                value={formData.pembimbing}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-white"
              >
                <option value="Pembimbing 1" disabled={Boolean(pendingPemb1)}>
                  Pembimbing 1 (Utama){pendingPemb1 ? ' — Menunggu Respon (Terkunci)' : ''}
                </option>
                <option value="Pembimbing 2" disabled={Boolean(pendingPemb2)}>
                  Pembimbing 2 (Pendamping){pendingPemb2 ? ' — Menunggu Respon (Terkunci)' : ''}
                </option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Nama Dosen Pembimbing</label>
              <input
                type="text"
                readOnly
                value={formData.dosen_nama}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-700 bg-slate-50"
              />
            </div>
          </div>

          {/* 2. Tanggal & Waktu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Tanggal Bimbingan *</label>
              <div className="relative">
                <input
                  type="date"
                  name="tanggal"
                  value={formData.tanggal}
                  onChange={handleChange}
                  min={minAllowedDate || undefined}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl border font-semibold text-slate-900 bg-white ${
                    lastBimbinganDate && formData.tanggal && formData.tanggal < lastBimbinganDate
                      ? 'border-rose-400 ring-2 ring-rose-200'
                      : 'border-slate-300'
                  }`}
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              {lastBimbinganDate && (
                <div className="flex items-start space-x-1.5 text-[11px] text-slate-500 pt-0.5">
                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <span>
                    Bimbingan terakhir: <strong className="text-slate-700">{formatIndoDate(lastBimbinganDate)}</strong>
                    {firstConsOnLastDate?.waktu && (
                      <> (jam <strong className="text-slate-700">{firstConsOnLastDate.waktu}</strong>)</>
                    )}. Tanggal boleh sama dengan jam lebih besar.
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Waktu Bimbingan *</label>
              <div className="relative">
                <input
                  type="time"
                  name="waktu"
                  value={formData.waktu}
                  onChange={handleChange}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl border font-semibold text-slate-900 bg-white ${
                    existingConsOnSelectedDate.length > 0 &&
                    timeToMinutes(formData.waktu) <= timeToMinutes(firstConsOnDate?.waktu)
                      ? 'border-rose-400 ring-2 ring-rose-200'
                      : 'border-slate-300'
                  }`}
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              {firstConsOnDate && (
                <div className="flex items-start space-x-1.5 text-[11px] text-blue-600 pt-0.5">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    Sesi pertama di tanggal ini: jam <strong>{firstConsOnDate.waktu}</strong> (jam baru harus &gt; {firstConsOnDate.waktu}).
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Metode Bimbingan (Daring / Luring) */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span>Metode Bimbingan <span className="text-rose-500">*</span></span>
              <span className="text-[11px] font-normal text-slate-400">Pilih opsi pelaksanaan konsultasi</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, metode: 'luring' }))}
                className={`flex items-center space-x-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  formData.metode === 'luring'
                    ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 text-blue-900 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  formData.metode === 'luring' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs flex items-center space-x-1.5">
                    <span>Luring (Tatap Muka)</span>
                    {formData.metode === 'luring' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">Di Kampus / Ruang Dosen</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, metode: 'daring' }))}
                className={`flex items-center space-x-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  formData.metode === 'daring'
                    ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-900 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  formData.metode === 'daring' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Video className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs flex items-center space-x-1.5">
                    <span>Daring (Online)</span>
                    {formData.metode === 'daring' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">Zoom / Meet / WhatsApp</div>
                </div>
              </button>
            </div>
          </div>

          {/* 3. Catatan Konsultasi & Poin Progres */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">
              Catatan Konsultasi &amp; Poin Progres <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="catatan_mahasiswa"
              value={formData.catatan_mahasiswa}
              onChange={handleChange}
              rows={4}
              placeholder="Tuliskan bab/topik pembahasan, poin-poin yang dikonsultasikan, atau pertanyaan untuk pembimbing..."
              className="w-full p-3 rounded-xl border border-slate-300 font-medium text-slate-900 bg-white leading-relaxed focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          {/* 5. Link Google Drive / Dokumen Draf */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700">
                Link Dokumen Draf / Google Drive (Opsional)
              </label>
              <span className="text-[11px] text-slate-400">Google Drive, Docs, dsb.</span>
            </div>

            <div className="relative">
              <input
                type="url"
                name="file_revisi_url"
                value={formData.file_revisi_url}
                onChange={handleChange}
                placeholder="https://drive.google.com/... atau https://docs.google.com/..."
                className="w-full pl-9 pr-12 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-900 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
              />
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              
              {formData.file_revisi_url && (
                <a
                  href={formData.file_revisi_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-colors"
                  title="Uji buka link"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Cek</span>
                </a>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              💡 Pastikan akses link Google Drive telah diset ke <em>"Anyone with the link / Siapa saja yang memiliki link"</em> agar dosen pembimbing dapat membukanya.
            </p>
          </div>

          {/* Form Controls */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isSelectedPembimbingPending || isBothPending}
              className={`px-5 py-2 rounded-xl font-bold flex items-center space-x-2 transition-all ${
                isSelectedPembimbingPending || isBothPending
                  ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 cursor-pointer disabled:opacity-75'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Menyimpan...</span>
                </>
              ) : (isSelectedPembimbingPending || isBothPending) ? (
                <>
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Menunggu Tanggapan {formData.pembimbing}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Sesi Bimbingan</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
