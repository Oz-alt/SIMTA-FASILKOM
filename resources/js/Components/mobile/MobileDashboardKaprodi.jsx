import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import {
  BarChart3,
  Users,
  UserCheck,
  FileCheck,
  Award,
  Sliders,
  CalendarDays,
  BookOpen,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export default function MobileDashboardKaprodi({
  dashboardStats,
  availableAngkatans = [],
  selectedAngkatan = 'all',
  setSelectedAngkatan,
  sortedWorkloads = [],
  filteredAdvisorRankings = [],
  filteredTopStudents = [],
  onOpenSettings,
  onSelectMonth,
}) {
  const [activeTab, setActiveTab] = useState('ringkasan'); // 'ringkasan' | 'beban' | 'bulanan' | 'peringkat'
  const [rankingSubTab, setRankingSubTab] = useState('dosen'); // 'dosen' | 'mahasiswa'

  const summary = dashboardStats?.summary || {};
  const studentStatus = dashboardStats?.studentStatus || {};
  const statusMethods = dashboardStats?.statusAndMethodStats || {};
  const monthlyData = dashboardStats?.monthlyChartData || [];
  const maxMonthly = Math.max(summary.maxMonthlyTotal || 1, 1);
  const maxWorkloadBar = Math.max(
    dashboardStats?.advisorWorkloadSummary?.kapasitasMaksBeban || 1,
    1
  );

  const tabs = [
    { key: 'ringkasan', label: 'Ringkasan' },
    { key: 'beban', label: 'Beban P1/P2' },
    { key: 'bulanan', label: 'Bulanan' },
    { key: 'peringkat', label: 'Keaktifan' },
  ];

  return (
    <div className="space-y-4">
      {/* Hero Banner Kaprodi */}
      <div className="rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-5 shadow-md space-y-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-[11px] font-bold text-blue-100">
              <BarChart3 className="w-3 h-3 text-blue-300" />
              Portal Kaprodi D3 MI
            </span>
            <h1 className="text-base font-extrabold mt-2 leading-snug">
              Analitik Bimbingan Prodi
            </h1>
            <p className="text-xs text-blue-100/85 mt-0.5">
              {dashboardStats?.academicPeriod?.full || 'Tahun Akademik Aktif'}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-[11px] font-bold"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-300" />
            <span>Target {summary.targetMinTotal || 24}x</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link
            href="/kaprodi/titles"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-[11px] font-bold"
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-200" />
              Monitoring Judul
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/kaprodi/defense-schedules"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-[11px] font-bold"
          >
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-emerald-300" />
              Jadwal Sidang
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Horizontal Angkatan Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <button
          type="button"
          onClick={() => setSelectedAngkatan('all')}
          className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border ${
            selectedAngkatan === 'all'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-slate-600 border-slate-200'
          }`}
        >
          Semua Angkatan
        </button>
        {availableAngkatans.map((a) => (
          <button
            key={a.year}
            type="button"
            onClick={() => setSelectedAngkatan(a.year)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border ${
              selectedAngkatan === a.year
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {a.year} ({a.count})
          </button>
        ))}
      </div>

      {/* 2x2 Summary KPI Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-400">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Mahasiswa TA</span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">
            {summary.totalMahasiswa || 0}
          </div>
          <div className="text-[10px] text-slate-500">Rata-rata {summary.rataRataPerMahasiswa || 0} sesi</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-400">
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dosen Aktif</span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">
            {summary.totalDosen || 0}
          </div>
          <div className="text-[10px] text-slate-500">
            {dashboardStats?.advisorWorkloadSummary?.totalTimpang || 0} timpang tinggi
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-400">
            <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Total Bimbingan</span>
          </div>
          <div className="text-xl font-extrabold text-emerald-700 mt-1">
            {Number(summary.totalBimbingan || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-slate-500">Sesi tervalidasi dosen</div>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          className="text-left bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm"
        >
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-400">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>Syarat ≥{summary.targetMinTotal || 24}x</span>
          </div>
          <div className="text-xl font-extrabold text-indigo-700 mt-1">
            {summary.persenMemenuhiTarget24 || 0}%
          </div>
          <div className="text-[10px] text-slate-500">
            {summary.memenuhiTarget24Count || 0} memenuhi target
          </div>
        </button>
      </div>

      {/* Segmented Section Switcher */}
      <div className="grid grid-cols-4 gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
        {tabs.map((t) => {
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`py-2 px-1.5 rounded-xl text-[11px] font-bold transition-all ${
                active ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: RINGKASAN STATUS */}
      {activeTab === 'ringkasan' && (
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Distribusi Mahasiswa ({studentStatus.total || 0})
            </h2>
            {[
              { label: 'Aktif Mengerjakan TA', count: studentStatus.aktif || 0, pct: studentStatus.persenAktif || 0, bar: 'bg-blue-600' },
              { label: 'Sudah Lulus / Selesai', count: studentStatus.lulus || 0, pct: studentStatus.persenLulus || 0, bar: 'bg-emerald-500' },
              { label: 'Belum Mengajukan Judul', count: studentStatus.belumMengajukan || 0, pct: studentStatus.persenBelumMengajukan || 0, bar: 'bg-amber-500' },
              { label: 'Tidak Aktif', count: studentStatus.tidakAktif || 0, pct: studentStatus.persenTidakAktif || 0, bar: 'bg-rose-500' },
            ].map((row) => (
              <div key={row.label} className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-slate-700">{row.label}</span>
                  <span className="text-slate-900 font-bold">
                    {row.count} ({row.pct}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${row.bar}`} style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Status &amp; Metode Sesi Bimbingan
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(statusMethods.status || {}).map((st) => (
                <div key={st.label} className={`p-2.5 rounded-xl border ${st.badgeClass}`}>
                  <div className="text-[10px] font-bold">{st.label}</div>
                  <div className="text-lg font-extrabold mt-0.5">{st.count}</div>
                  <div className="text-[10px] opacity-80">{st.percentage}%</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              {Object.values(statusMethods.metode || {}).map((m) => (
                <div key={m.label} className={`p-2.5 rounded-xl border ${m.badgeClass}`}>
                  <div className="text-[10px] font-bold">{m.label}</div>
                  <div className="text-base font-extrabold mt-0.5">{m.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BEBAN DOSEN */}
      {activeTab === 'beban' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Beban Dosen (P1 vs P2)
            </h2>
            <span className="text-[10px] text-slate-400">Maks {maxWorkloadBar} mhs</span>
          </div>
          <div className="space-y-2.5">
            {sortedWorkloads.map((adv) => {
              const p1Width = Math.min(100, Math.round((adv.p1Count / maxWorkloadBar) * 100));
              const p2Width = Math.min(100, Math.round((adv.p2Count / maxWorkloadBar) * 100));
              return (
                <div
                  key={adv.nip}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{adv.nama}</div>
                      <div className="text-[10px] text-slate-500">Total {adv.totalBeban} bimbingan</div>
                    </div>
                    <span className={`shrink-0 whitespace-nowrap text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${adv.badgeClass}`}>
                      {adv.ketimpanganLabel}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <div className="flex justify-between font-bold text-blue-700 mb-0.5">
                        <span>P1</span>
                        <span>{adv.p1Count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${p1Width}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-bold text-orange-600 mb-0.5">
                        <span>P2</span>
                        <span>{adv.p2Count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${p2Width}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: BULANAN */}
      {activeTab === 'bulanan' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Bimbingan Per Bulan
            </h2>
            <span className="text-[10px] text-emerald-700 font-bold">Ketuk bulan untuk rincian</span>
          </div>
          <div className="space-y-2">
            {[...monthlyData].reverse().map((m) => {
              const width = Math.min(100, Math.round((m.total / maxMonthly) * 100));
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => onSelectMonth?.(m)}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 space-y-1.5 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-900">{m.name}</span>
                    <span className="text-emerald-700">{m.total} sesi</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>
                      Daring {m.daringCount} • Luring {m.luringCount}
                    </span>
                    <span>{m.uniqueStudentsCount} mhs</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: PERINGKAT KEAKTIFAN */}
      {activeTab === 'peringkat' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setRankingSubTab('dosen')}
              className={`py-1.5 rounded-lg text-[11px] font-bold ${
                rankingSubTab === 'dosen' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              Keaktifan Dosen
            </button>
            <button
              type="button"
              onClick={() => setRankingSubTab('mahasiswa')}
              className={`py-1.5 rounded-lg text-[11px] font-bold ${
                rankingSubTab === 'mahasiswa' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              Top 10 Mahasiswa
            </button>
          </div>

          {rankingSubTab === 'dosen' ? (
            <div className="space-y-2">
              {filteredAdvisorRankings.slice(0, 10).map((item) => (
                <div
                  key={item.nip}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-[11px] font-extrabold flex items-center justify-center shrink-0">
                      #{item.rank}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{item.nama}</div>
                      <div className="text-[10px] text-slate-500">
                        {item.totalBimbingan} sesi • {item.totalMahasiswa} mhs
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-extrabold text-indigo-700 flex items-center gap-0.5 justify-end">
                      <TrendingUp className="w-3 h-3" />
                      <span>{item.rasioFormatted}x</span>
                    </div>
                    <div className="text-[10px] text-slate-500">rasio</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTopStudents.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  Belum ada data mahasiswa aktif.
                </div>
              ) : (
                filteredTopStudents.map((st) => (
                  <div
                    key={st.mhs_nim}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 text-[11px] font-extrabold flex items-center justify-center shrink-0">
                        #{st.rank}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{st.mhs_nama}</div>
                        <div className="text-[10px] text-slate-500">
                          NIM {st.mhs_nim} • Bulan ini {st.bimbinganBulanIni}x
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 whitespace-nowrap text-[11px] font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                      {st.totalBimbingan} Total
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

