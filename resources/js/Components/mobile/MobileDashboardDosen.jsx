import React, { useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import {
  Users,
  ClipboardCheck,
  CalendarDays,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  ChevronRight,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import StudentWhatsAppLink from '../common/StudentWhatsAppLink.jsx';

export default function MobileDashboardDosen({
  currentUser,
  myStudents = [],
  monitoredStudents = [],
  pendingTitles = [],
  under24List = [],
  overdueList = [],
  overdue60List = [],
  pendingValidationsList = [],
  minTotalDefense = 24,
}) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase().trim();
    return monitoredStudents.filter((student) => {
      const matchSearch =
        !q ||
        String(student.student_nama || '').toLowerCase().includes(q) ||
        String(student.student_nim || '').toLowerCase().includes(q) ||
        String(student.thesisTitle || '').toLowerCase().includes(q);

      let matchTab = true;
      if (activeFilter === 'validasi') matchTab = student.isPending;
      else if (activeFilter === 'belum_target') matchTab = student.isUnder24;
      else if (activeFilter === 'overdue') matchTab = student.isOverdue;
      else if (activeFilter === 'siap') matchTab = student.isReadyForDefense;

      return matchSearch && matchTab;
    });
  }, [monitoredStudents, search, activeFilter]);

  const filterChips = [
    { key: 'all', label: `Semua (${monitoredStudents.length})` },
    { key: 'validasi', label: `Validasi (${monitoredStudents.filter((s) => s.isPending).length})` },
    { key: 'belum_target', label: `Belum ${minTotalDefense}x (${under24List.length})` },
    { key: 'overdue', label: `>30h (${overdueList.length})` },
    { key: 'siap', label: `Siap (${monitoredStudents.filter((s) => s.isReadyForDefense).length})` },
  ];

  return (
    <div className="space-y-4">
      {/* Compact Lecturer Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 text-white p-5 shadow-md space-y-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-[11px] font-bold text-indigo-100">
          <Sparkles className="w-3 h-3 text-amber-300" />
          Portal Dosen Pembimbing
        </span>
        <div className="space-y-1">
          <h1 className="text-base font-extrabold leading-snug break-words">
            {currentUser?.nama || currentUser?.name || 'Dosen Pembimbing'}
          </h1>
          <p className="text-xs text-blue-100/85">
            NIP {currentUser?.nip || '-'} &bull; {myStudents.length} Mahasiswa Bimbingan Aktif
          </p>
        </div>

        <div className="pt-1 grid grid-cols-3 gap-2">
          <Link
            href="/dosen/mahasiswa"
            className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-2xl bg-white/10 hover:bg-white/20 text-[10px] font-bold border border-white/10"
          >
            <Users className="w-4 h-4 text-blue-200" />
            <span>Mahasiswa</span>
          </Link>
          <Link
            href="/dosen/rekap"
            className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-2xl bg-white/10 hover:bg-white/20 text-[10px] font-bold border border-white/10"
          >
            <ClipboardCheck className="w-4 h-4 text-emerald-300" />
            <span>Evaluasi</span>
          </Link>
          <Link
            href="/dosen/jadwal-sidang"
            className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-2xl bg-white/10 hover:bg-white/20 text-[10px] font-bold border border-white/10"
          >
            <CalendarDays className="w-4 h-4 text-amber-300" />
            <span>Sidang</span>
          </Link>
        </div>
      </div>

      {/* 2x2 KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
          <div className="text-[10px] font-bold uppercase text-slate-400">Menunggu Validasi</div>
          <div className="text-2xl font-extrabold text-indigo-600 mt-1">
            {pendingValidationsList.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Sesi perlu ditanggapi</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
          <div className="text-[10px] font-bold uppercase text-slate-400">Belum {minTotalDefense}x</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{under24List.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Belum memenuhi target</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
          <div className="text-[10px] font-bold uppercase text-slate-400">Inaktif &gt;30 Hari</div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">{overdueList.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {overdue60List.length} kritis &gt;60 hari
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
          <div className="text-[10px] font-bold uppercase text-slate-400">Judul Baru</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{pendingTitles.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Menunggu tinjauan</div>
        </div>
      </div>

      {/* Pending Consultation Queue Preview */}
      {pendingValidationsList.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Antrean Evaluasi Bimbingan</span>
            </div>
            <Link href="/dosen/rekap" className="text-[11px] font-bold text-indigo-700">
              Lihat Semua →
            </Link>
          </div>
          <div className="space-y-1.5">
            {pendingValidationsList.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="bg-white/90 rounded-xl px-3 py-2 border border-amber-200/70 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{item.studentNama}</div>
                  <div className="text-[10px] text-slate-500 truncate">{item.topic}</div>
                </div>
                <span className="shrink-0 text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  {item.dateFormatted}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monitored Students Mobile List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
            Progres Mahasiswa Bimbingan
          </h2>
          <Link href="/dosen/mahasiswa" className="text-[11px] font-bold text-indigo-600">
            Detail →
          </Link>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, NIM, atau judul TA..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
        </div>

        {/* Scrollable Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {filterChips.map((chip) => {
            const active = activeFilter === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setActiveFilter(chip.key)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${
                  active
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Touch-friendly Student Cards */}
        <div className="space-y-2.5">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Tidak ada mahasiswa pada filter ini.
            </div>
          ) : (
            filteredStudents.map((student) => (
              <div
                key={student.student_nim}
                className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <StudentWhatsAppLink
                      student={student}
                      nim={student.student_nim}
                      nama={student.student_nama}
                      showIcon
                      className="text-xs font-extrabold text-slate-900 hover:text-emerald-700"
                    />
                    <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                      NIM {student.student_nim} • {student.currentStage}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      student.isReadyForDefense
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {student.totalConsultations}/{minTotalDefense} Sesi
                  </span>
                </div>

                {student.thesisTitle && student.thesisTitle !== '-' && (
                  <p className="text-[11px] text-slate-600 line-clamp-2 flex items-start gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{student.thesisTitle}</span>
                  </p>
                )}

                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/70 text-[10px]">
                  <div className="flex items-center gap-2">
                    {student.isPending && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-bold">
                        {student.pendingCount} Menunggu
                      </span>
                    )}
                    {student.isOverdue ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 font-bold">
                        <AlertTriangle className="w-3 h-3" />
                        {student.daysInactive > 300 ? 'Belum Pernah' : `${student.daysInactive}h inaktif`}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Terakhir: {student.lastDateFormatted}
                      </span>
                    )}
                  </div>
                  <Link
                    href="/dosen/mahasiswa"
                    className="inline-flex items-center gap-0.5 font-bold text-indigo-600"
                  >
                    <span>Kelola</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

