import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link, Head } from '@inertiajs/react';
import {
  FileStack,
  LayoutGrid,
  FileText,
  Clock,
  ArrowRight,
  TrendingUp,
  Users,
  GraduationCap,
  UserCheck,
  ShieldCheck,
  Database,
  Building2,
  CheckSquare,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function DashboardAdminSimta() {
  const {
    adminDocuments = [],
    adminCmsContents = [],
    adminTemplates = [],
    thesisArchives = [],
    bookings = [],
    rooms = [],
    getAllMahasiswaAccounts,
    getAllDosenAccounts
  } = useAuth();

  // Memoize account stats to ensure zero UI delay on renders
  const { totalMahasiswa, mahasiswaAktif, totalDosen, dosenAktif } = useMemo(() => {
    try {
      const allMhs = typeof getAllMahasiswaAccounts === 'function' ? getAllMahasiswaAccounts() : [];
      const allDsn = typeof getAllDosenAccounts === 'function' ? getAllDosenAccounts() : [];
      const safeMhs = Array.isArray(allMhs) ? allMhs : [];
      const safeDsn = Array.isArray(allDsn) ? allDsn : [];
      return {
        totalMahasiswa: safeMhs.length,
        mahasiswaAktif: safeMhs.filter(m => m && m.status === 'aktif').length,
        totalDosen: safeDsn.length,
        dosenAktif: safeDsn.filter(d => d && d.status === 'aktif').length
      };
    } catch (err) {
      console.warn('DashboardAdminSimta account stats fallback:', err);
      return { totalMahasiswa: 0, mahasiswaAktif: 0, totalDosen: 0, dosenAktif: 0 };
    }
  }, [getAllMahasiswaAccounts, getAllDosenAccounts]);

  // Memoize Sarana & Ruang Sidang metrics
  const { pendingBookings, approvedBookings, activeRooms } = useMemo(() => {
    const bList = Array.isArray(bookings) ? bookings : [];
    const rList = Array.isArray(rooms) ? rooms : [];
    return {
      pendingBookings: bList.filter(b => b && b.status === 'menunggu_persetujuan'),
      approvedBookings: bList.filter(b => b && b.status === 'disetujui'),
      activeRooms: rList.filter(r => r && r.status === 'aktif')
    };
  }, [bookings, rooms]);

  const docsList = Array.isArray(adminDocuments) ? adminDocuments : [];
  const cmsList = Array.isArray(adminCmsContents) ? adminCmsContents : [];
  const tplList = Array.isArray(adminTemplates) ? adminTemplates : [];
  const repoList = Array.isArray(thesisArchives) ? thesisArchives : [];

  const totalDokumen = docsList.length;
  const dokumenAktif = docsList.filter(d => d && d.status === 'aktif').length;
  const totalCms = cmsList.length;
  const cmsPublikasi = cmsList.filter(c => c && c.status === 'publikasi').length;
  const totalTemplate = tplList.length;
  const templateAktif = tplList.filter(t => t && t.status === 'aktif').length;
  const totalRepo = repoList.length;
  const repoPublish = repoList.filter(a => a && (a.status || 'dipublikasikan') === 'dipublikasikan').length;

  // Memoize recent activities
  const recentActivity = useMemo(() => {
    try {
      return [
        ...docsList.map(d => ({
          id: d.id, label: d.nama, kategori: 'Dokumen', status: d.status,
          tanggal: d.tanggal_upload, icon: FileStack, color: 'text-blue-600', bg: 'bg-blue-50'
        })),
        ...cmsList.map(c => ({
          id: c.id, label: c.judul, kategori: 'CMS', status: c.status,
          tanggal: c.updated_at ? String(c.updated_at).split('T')[0] : '', icon: LayoutGrid, color: 'text-purple-600', bg: 'bg-purple-50'
        })),
        ...tplList.map(t => ({
          id: t.id, label: t.nama, kategori: 'Template', status: t.status,
          tanggal: t.updated_at, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50'
        }))
      ].sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || '')).slice(0, 8);
    } catch {
      return [];
    }
  }, [docsList, cmsList, tplList]);

  const statusBadge = (status) => {
    if (status === 'aktif' || status === 'publikasi')
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">{status}</span>;
    if (status === 'draf')
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">{status}</span>;
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{status}</span>;
  };

  return (
    <div className="space-y-6 select-none">
      <Head title="Dashboard Admin SIMONITA" />

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold backdrop-blur-sm mb-3 border border-indigo-400/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Portal Akses Administrator Tunggal SIMONITA</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Dashboard Admin SIMONITA FASILKOM</h1>
        <p className="text-sm text-indigo-100/90 mt-1 max-w-3xl leading-relaxed">
          Pusat kendali terpadu untuk mengelola persetujuan ruangan sidang, sarana prasarana, master data akun &amp; tugas akhir, dokumen resmi, CMS, dan repositori SIMTA Fasilkom UNSRI.
        </p>
      </div>

      {/* Row 1: Operasional Sarana & Ruangan Sidang (Unified Feature) */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Operasional Sarana &amp; Ruang Sidang</span>
          </h2>
          <Link href="/admin/bookings" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1">
            <span>Buka Persetujuan Ruang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Antrean Persetujuan Ruangan */}
          <Link href="/admin/bookings"
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1 hover:border-amber-300 hover:shadow-md transition-all group block">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Antrean Persetujuan Ruangan</div>
            <div className="text-xl font-extrabold text-amber-600 flex items-center justify-between">
              <span>{pendingBookings.length} Pengajuan</span>
              <Clock className="w-5 h-5 text-amber-500/50 group-hover:text-amber-600 transition-colors" />
            </div>
            <p className="text-[10px] text-slate-500">
              {pendingBookings.length > 0 ? (
                <span className="text-amber-600 font-bold">Perlu diproses segera</span>
              ) : (
                <span className="text-emerald-600 font-bold">Semua pengajuan telah diproses</span>
              )}
            </p>
          </Link>

          {/* Peminjaman Disetujui */}
          <Link href="/admin/bookings"
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1 hover:border-emerald-300 hover:shadow-md transition-all group block">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peminjaman Ruangan Disetujui</div>
            <div className="text-xl font-extrabold text-emerald-600 flex items-center justify-between">
              <span>{approvedBookings.length} Terjadwal</span>
              <CheckSquare className="w-5 h-5 text-emerald-500/50 group-hover:text-emerald-600 transition-colors" />
            </div>
            <p className="text-[10px] text-slate-500">
              <span className="text-emerald-600 font-bold">{approvedBookings.length} sesi</span> ruang sidang aktif
            </p>
          </Link>

          {/* Ruangan Siap Pakai */}
          <Link href="/admin/rooms"
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1 hover:border-indigo-300 hover:shadow-md transition-all group block">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ruang Sidang Siap Pakai</div>
            <div className="text-xl font-extrabold text-indigo-600 flex items-center justify-between">
              <span>{activeRooms.length} / {rooms.length} Ruang</span>
              <Building2 className="w-5 h-5 text-indigo-400/50 group-hover:text-indigo-600 transition-colors" />
            </div>
            <p className="text-[10px] text-slate-500">
              Gedung DIPKOM &amp; DIKLAT Fasilkom
            </p>
          </Link>
        </div>
      </div>

      {/* Row 2: Data Master, Akun & Sumber Daya SIMTA */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center space-x-1.5">
          <Database className="w-3.5 h-3.5 text-blue-600" />
          <span>Master Data Akun &amp; Sumber Daya SIMTA</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">

          {/* Akun Mahasiswa */}
          <Link href="/admin-simta/master/mahasiswa"
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1 hover:border-blue-300 hover:shadow-md transition-all group block">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Mahasiswa</div>
            <div className="text-xl font-extrabold text-blue-600 flex items-center justify-between">
              <span>{totalMahasiswa}</span>
              <GraduationCap className="w-5 h-5 text-blue-400/50 group-hover:text-blue-600 transition-colors" />
            </div>
            <p className="text-[10px] text-slate-500">
              <span className="text-emerald-600 font-bold">{mahasiswaAktif} aktif</span> · {totalMahasiswa - mahasiswaAktif} lain
            </p>
          </Link>

          {/* Akun Dosen */}
          <Link href="/admin-simta/master/dosen"
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1 hover:border-indigo-300 hover:shadow-md transition-all group block">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Dosen</div>
            <div className="text-xl font-extrabold text-indigo-600 flex items-center justify-between">
              <span>{totalDosen}</span>
              <UserCheck className="w-5 h-5 text-indigo-400/50 group-hover:text-indigo-600 transition-colors" />
            </div>
            <p className="text-[10px] text-slate-500">
              <span className="text-emerald-600 font-bold">{dosenAktif} aktif</span> · Dosen Pembimbing
            </p>
          </Link>

          {/* Repositori UNSRI */}
          <Link href="/admin-simta/repository"
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1 hover:border-amber-300 hover:shadow-md transition-all group block">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Repositori UNSRI</div>
            <div className="text-xl font-extrabold text-amber-600 flex items-center justify-between">
              <span>{totalRepo}</span>
              <Database className="w-5 h-5 text-amber-400/50 group-hover:text-amber-600 transition-colors" />
            </div>
            <p className="text-[10px] text-slate-500">
              <span className="text-emerald-600 font-bold">{repoPublish} tayang</span> · Scraped
            </p>
          </Link>

          {/* Dokumen / Surat */}
          <Link href="/admin-simta/documents"
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1 hover:border-cyan-300 hover:shadow-md transition-all group block">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dokumen / Surat</div>
            <div className="text-xl font-extrabold text-cyan-600 flex items-center justify-between">
              <span>{totalDokumen}</span>
              <FileStack className="w-5 h-5 text-cyan-400/50 group-hover:text-cyan-600 transition-colors" />
            </div>
            <p className="text-[10px] text-slate-500">
              <span className="text-emerald-600 font-bold">{dokumenAktif} aktif</span>
            </p>
          </Link>

          {/* Konten CMS */}
          <Link href="/admin-simta/cms"
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1 hover:border-purple-300 hover:shadow-md transition-all group block">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Konten CMS</div>
            <div className="text-xl font-extrabold text-purple-600 flex items-center justify-between">
              <span>{totalCms}</span>
              <LayoutGrid className="w-5 h-5 text-purple-400/50 group-hover:text-purple-600 transition-colors" />
            </div>
            <p className="text-[10px] text-slate-500">
              <span className="text-emerald-600 font-bold">{cmsPublikasi} publikasi</span>
            </p>
          </Link>

          {/* Template */}
          <Link href="/admin-simta/templates"
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1 hover:border-emerald-300 hover:shadow-md transition-all group block">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Template</div>
            <div className="text-xl font-extrabold text-emerald-600 flex items-center justify-between">
              <span>{totalTemplate}</span>
              <FileText className="w-5 h-5 text-emerald-400/50 group-hover:text-emerald-600 transition-colors" />
            </div>
            <p className="text-[10px] text-slate-500">
              <span className="text-emerald-600 font-bold">{templateAktif} aktif</span>
            </p>
          </Link>

        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { href: '/admin/bookings', Icon: CheckSquare, color: 'amber', title: 'Persetujuan Ruang', sub: 'Peminjaman sidang' },
          { href: '/admin/rooms', Icon: Building2, color: 'indigo', title: 'Kelola Ruangan', sub: 'Fasilitas & gedung' },
          { href: '/admin-simta/master/mahasiswa', Icon: GraduationCap, color: 'blue', title: 'Data Mahasiswa', sub: 'Status & data' },
          { href: '/admin-simta/master/dosen', Icon: UserCheck, color: 'purple', title: 'Data Dosen', sub: 'Jabatan & kuota' },
          { href: '/admin-simta/documents', Icon: FileStack, color: 'cyan', title: 'Kelola Dokumen', sub: 'Upload surat resmi' },
          { href: '/admin-simta/templates', Icon: FileText, color: 'emerald', title: 'Kelola Template', sub: 'Pedoman & berkas' }
        ].map(({ href, Icon, color, title, sub }) => (
          <Link key={href} href={href}
            className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-4 py-3.5 hover:border-slate-300 hover:shadow-md transition-all group">
            <div className="flex items-center space-x-3 min-w-0">
              <div className={`w-8 h-8 rounded-xl bg-${color}-50 flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 text-${color}-600`} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">{title}</div>
                <div className="text-[10px] text-slate-500 truncate">{sub}</div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
          </Link>
        ))}
      </div>

      {/* Section: Antrean Peminjaman Ruangan Menunggu Persetujuan */}
      {pendingBookings.length > 0 && (
        <div className="bg-white border border-amber-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-amber-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Pengajuan Peminjaman Ruangan Menunggu Persetujuan ({pendingBookings.length})</span>
            </h3>
            <Link href="/admin/bookings" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1">
              <span>Buka Seluruh Pengajuan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {pendingBookings.slice(0, 4).map(b => (
              <div key={b.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors">
                <div>
                  <div className="font-bold text-slate-900">{b.stage_label || b.purpose || 'Sidang Tugas Akhir'}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {b.mhs_nama} ({b.mhs_nim}) • <span className="font-semibold text-slate-700">{b.room_name}</span> • {b.booking_date} ({b.start_time} - {b.end_time})
                  </div>
                </div>
                <Link href="/admin/bookings" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg self-start sm:self-auto transition-colors">
                  Proses Pengajuan
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section: Aktivitas Terbaru */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Aktivitas Terbaru Sistem</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">
            {recentActivity.length > 0 ? `${recentActivity.length} aktivitas terbaru` : 'Belum ada aktivitas'}
          </span>
        </div>
        <div className="space-y-2.5">
          {recentActivity.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Belum ada aktivitas terbaru yang tercatat di sistem.
            </div>
          ) : (
            recentActivity.map((item) => {
              const Icon = item.icon;
              return (
                <div key={`${item.kategori}-${item.id}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">{item.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.kategori} · {item.tanggal}</div>
                    </div>
                  </div>
                  <div className="shrink-0">{statusBadge(item.status)}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
