import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import {
  ShieldCheck,
  KeyRound,
  Building2,
  Users,
  BookOpen,
  FileText,
  Database,
  ChevronRight,
  Clock,
  GraduationCap,
  UserCheck,
} from 'lucide-react';

export default function MobileDashboardAdmin({
  pendingResetRequests = 0,
  pendingBookings = [],
  approvedBookings = [],
  activeRooms = [],
  totalMahasiswa = 0,
  mahasiswaAktif = 0,
  totalDosen = 0,
  dosenAktif = 0,
  totalDokumen = 0,
  dokumenAktif = 0,
  totalTemplate = 0,
  templateAktif = 0,
  totalSop = 0,
  sopAktif = 0,
  totalRepo = 0,
  repoPublish = 0,
  recentActivity = [],
}) {
  const [activeTab, setActiveTab] = useState('sarana'); // 'sarana' | 'konten' | 'aktivitas'

  const quickActions = [
    {
      label: 'Persetujuan Ruang',
      count: `${pendingBookings.length} Antre`,
      href: '/admin/bookings',
      icon: Building2,
      tone: 'bg-blue-600 text-white',
    },
    {
      label: 'Reset Password',
      count: `${pendingResetRequests} Antre`,
      href: '/admin-simta/accounts/password-resets',
      icon: KeyRound,
      tone: 'bg-amber-600 text-white',
    },
    {
      label: 'Akun Mahasiswa',
      count: `${mahasiswaAktif}/${totalMahasiswa} Aktif`,
      href: '/admin-simta/accounts/mahasiswa',
      icon: GraduationCap,
      tone: 'bg-indigo-600 text-white',
    },
    {
      label: 'Manajemen TA',
      count: 'Kelola Data',
      href: '/admin-simta/thesis-management',
      icon: BookOpen,
      tone: 'bg-emerald-600 text-white',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Compact Admin Header Card */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-900 text-white p-5 shadow-md space-y-2.5">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/25 border border-indigo-400/25 text-[11px] font-bold text-indigo-100">
          <ShieldCheck className="w-3 h-3 text-emerald-300" />
          Administrator SIMONITA
        </span>
        <h1 className="text-base font-extrabold tracking-tight leading-snug">
          Kendali Operasional SIMONITA
        </h1>
        <p className="text-xs text-indigo-100/85 leading-relaxed">
          Kelola ruang sidang, verifikasi reset kata sandi, master data akun, dan repositori tugas akhir.
        </p>
      </div>

      {/* Priority Alerts */}
      {pendingResetRequests > 0 && (
        <Link
          href="/admin-simta/accounts/password-resets"
          className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 shadow-sm"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-extrabold truncate">
                {pendingResetRequests} Permintaan Reset Sandi
              </div>
              <div className="text-[10px] text-amber-800 truncate">
                Ketuk untuk memverifikasi antrean akun
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-700 shrink-0" />
        </Link>
      )}

      {/* 2x2 Quick Admin Ops */}
      <div className="grid grid-cols-2 gap-2.5">
        {quickActions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.label}
              href={act.href}
              className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm flex items-center gap-2.5 active:scale-[0.98] transition-transform"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${act.tone}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-slate-900 truncate">{act.label}</div>
                <div className="text-[10px] text-slate-500 truncate">{act.count}</div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Segmented Section Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
        {[
          { key: 'sarana', label: 'Sarana & Akun' },
          { key: 'konten', label: 'Dokumen & Repo' },
          { key: 'aktivitas', label: 'Aktivitas' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-colors ${
              activeTab === tab.key ? 'bg-indigo-600 text-white' : 'text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: SARANA & AKUN */}
      {activeTab === 'sarana' && (
        <div className="space-y-2.5">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center">
              <div className="text-[10px] font-bold text-slate-400">Antre Ruang</div>
              <div className="text-xl font-extrabold text-amber-600 mt-0.5">
                {pendingBookings.length}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center">
              <div className="text-[10px] font-bold text-slate-400">Disetujui</div>
              <div className="text-xl font-extrabold text-emerald-600 mt-0.5">
                {approvedBookings.length}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center">
              <div className="text-[10px] font-bold text-slate-400">Ruang Aktif</div>
              <div className="text-xl font-extrabold text-indigo-600 mt-0.5">
                {activeRooms.length}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Total Akun Terdaftar</span>
              </div>
              <Link href="/admin-simta/accounts/dosen" className="text-[11px] font-bold text-indigo-600">
                Kelola Dosen →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold">Mahasiswa</div>
                <div className="text-lg font-extrabold text-slate-900">
                  {mahasiswaAktif} <span className="text-[11px] font-normal text-slate-400">/ {totalMahasiswa}</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-emerald-600" />
                  <span>Dosen</span>
                </div>
                <div className="text-lg font-extrabold text-slate-900">
                  {dosenAktif} <span className="text-[11px] font-normal text-slate-400">/ {totalDosen}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DOKUMEN & REPO */}
      {activeTab === 'konten' && (
        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
          {[
            { label: 'Dokumen / Surat Resmi', val: `${dokumenAktif} aktif / ${totalDokumen}`, href: '/admin-simta/documents', icon: FileText },
            { label: 'Template Dokumen TA', val: `${templateAktif} aktif / ${totalTemplate}`, href: '/admin-simta/templates', icon: FileText },
            { label: 'SOP Prosedur SIMONITA', val: `${sopAktif} aktif / ${totalSop}`, href: '/admin-simta/cms', icon: ShieldCheck },
            { label: 'Repositori & Arsip TA', val: `${repoPublish} terbit / ${totalRepo}`, href: '/admin-simta/repository', icon: Database },
          ].map((row) => {
            const Icon = row.icon;
            return (
              <Link
                key={row.label}
                href={row.href}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{row.label}</div>
                    <div className="text-[10px] text-slate-500">{row.val}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </Link>
            );
          })}
        </div>
      )}

      {/* TAB 3: AKTIVITAS TERBARU */}
      {activeTab === 'aktivitas' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5">
          {recentActivity.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              Belum ada aktivitas konten terbaru.
            </div>
          ) : (
            recentActivity.map((act) => (
              <div
                key={`${act.kategori}-${act.id}`}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{act.label}</div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{act.kategori} • {act.tanggal || '-'}</span>
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 capitalize">
                  {act.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

