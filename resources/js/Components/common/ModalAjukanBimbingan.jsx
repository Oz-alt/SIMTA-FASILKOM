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
  const { currentUser, studentAdvisors, advisors, consultations, addConsultation } = useAuth();

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

  // Sesi bimbingan terakhir
  const lastBimbingan = useMemo(() => {
    if (studentConsultations.length === 0) return null;
    return studentConsultations[studentConsultations.length - 1];
  }, [studentConsultations]);

  const lastBimbinganDate = lastBimbingan?.tanggal || null;

  // Tanggal minimal yang diizinkan adalah tanggal bimbingan terakhir (boleh sama)
  const minAllowedDate = lastBimbinganDate || '';

  // Sesi bimbingan pada tanggal terakhir (untuk info helper)
  const consOnLastDate = useMemo(() => {
    if (!lastBimbinganDate || studentConsultations.length === 0) return [];
    return studentConsultations.filter(c => c.tanggal === lastBimbinganDate);
  }, [studentConsultations, lastBimbinganDate]);

  const firstConsOnLastDate = consOnLastDate.length > 0 ? consOnLastDate[0] : null;

  // Dynamic Dospem 1 & 2 assigned for current logged-in student
  const sa = useMemo(() => {
    return studentAdvisors?.find(s => currentUser?.nim && String(s.student_nim).trim() === String(currentUser.nim).trim());
  }, [studentAdvisors, currentUser]);

  const dospem1 = useMemo(() => sa ? advisors?.find(a => a.nip === sa.dospem1_nip) : null, [advisors, sa]);
  const dospem2 = useMemo(() => sa ? advisors?.find(a => a.nip === sa.dospem2_nip) : null, [advisors, sa]);

  const dospem1Nama = dospem1?.nama || 'Dosen Pembimbing 1';
  const dospem2Nama = dospem2?.nama || 'Dosen Pembimbing 2';

  const [formData, setFormData] = useState({
    pembimbing: 'Pembimbing 1',
    dosen_nama: dospem1Nama,
    metode: 'luring',
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '09:00',
    bab_topik: '',
    catatan_mahasiswa: '',
    file_revisi_url: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Cek apakah mahasiswa memiliki sesi bimbingan yang masih berstatus menunggu tanggapan
  const pendingConsultation = useMemo(() => {
    return studentConsultations.find(c => 
      c.status === 'menunggu_tanggapan' || c.status === 'menunggu' || c.status === 'menunggu_validasi'
    );
  }, [studentConsultations]);

  const hasPendingConsultation = Boolean(pendingConsultation);

  // Sesi bimbingan yang sudah ada pada tanggal yang dipilih
  const existingConsOnSelectedDate = useMemo(() => {
    if (!formData.tanggal || studentConsultations.length === 0) return [];
    return studentConsultations.filter(c => c.tanggal === formData.tanggal);
  }, [studentConsultations, formData.tanggal]);

  const firstConsOnDate = existingConsOnSelectedDate.length > 0 ? existingConsOnSelectedDate[0] : null;
  const latestConsOnDate = existingConsOnSelectedDate.length > 0 
    ? existingConsOnSelectedDate[existingConsOnSelectedDate.length - 1] 
    : null;

  // Validasi tanggal & waktu bimbingan
  const validateDateTime = (tanggal, waktu) => {
    if (!tanggal) {
      return 'Tanggal bimbingan wajib diisi.';
    }

    if (lastBimbinganDate && tanggal < lastBimbinganDate) {
      return `Tanggal bimbingan tidak boleh lebih awal dari tanggal bimbingan terakhir (${formatIndoDate(lastBimbinganDate)}).`;
    }

    // Jika pada tanggal yang dipilih sudah ada sesi bimbingan sebelumnya
    const consOnDate = studentConsultations.filter(c => c.tanggal === tanggal);
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
        return `Untuk tanggal yang sama (${formatIndoDate(tanggal)}), jam bimbingan harus lebih besar dari bimbingan pertama (${firstSession.waktu}).`;
      }

      if (consOnDate.length > 1 && selectedMinutes <= lastMinutes) {
        return `Untuk tanggal yang sama (${formatIndoDate(tanggal)}), jam bimbingan harus lebih besar dari bimbingan sebelumnya (${lastSession.waktu}).`;
      }
    }

    return '';
  };

  // Sinkronisasi tanggal & waktu awal saat modal dibuka:
  // Tanggal boleh sama dengan bimbingan terakhir, dan jam otomatis disesuaikan > bimbingan yang ada
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      let initialDate = today;
      if (lastBimbinganDate && today < lastBimbinganDate) {
        initialDate = lastBimbinganDate;
      }

      let initialWaktu = '09:00';
      const consOnInitialDate = (studentConsultations || []).filter(c => c.tanggal === initialDate);
      if (consOnInitialDate.length > 0) {
        const lastSession = consOnInitialDate[consOnInitialDate.length - 1];
        initialWaktu = getSuggestedNextTime(lastSession.waktu);
      }

      setFormData(prev => ({
        ...prev,
        tanggal: initialDate,
        waktu: initialWaktu,
        catatan_mahasiswa: '',
        file_revisi_url: ''
      }));
      setErrorMsg('');
    }
  }, [isOpen, lastBimbinganDate, studentConsultations]);

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
      setFormData(prev => ({
        ...prev,
        pembimbing: value,
        dosen_nama: isPemb2 ? dospem2Nama : dospem1Nama
      }));
    } else {
      setFormData(prev => {
        const next = { ...prev, [name]: value };
        if (name === 'tanggal' || name === 'waktu') {
          const err = validateDateTime(next.tanggal, next.waktu);
          setErrorMsg(err);
        }
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (hasPendingConsultation) {
      setErrorMsg(`Tidak dapat mencatat sesi baru karena sesi tanggal ${pendingConsultation?.tanggal} masih menunggu tanggapan dosen.`);
      return;
    }

    if (!formData.catatan_mahasiswa.trim()) {
      setErrorMsg('Catatan konsultasi & poin progres wajib diisi.');
      return;
    }

    const dateTimeError = validateDateTime(formData.tanggal, formData.waktu);
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
                <option value="Pembimbing 1">Pembimbing 1 (Utama)</option>
                <option value="Pembimbing 2">Pembimbing 2 (Pendamping)</option>
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
              disabled={isSubmitting || hasPendingConsultation}
              className={`px-5 py-2 rounded-xl font-bold flex items-center space-x-2 transition-all ${
                hasPendingConsultation
                  ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 cursor-pointer disabled:opacity-75'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Menyimpan...</span>
                </>
              ) : hasPendingConsultation ? (
                <>
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Menunggu Tanggapan Dosen</span>
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
