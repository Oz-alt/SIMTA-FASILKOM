import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link } from '@inertiajs/react';
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
  Globe
} from 'lucide-react';

export default function DashboardAdminSimta() {
  const { 
    adminDocuments, 
    adminCmsContents, 
    adminTemplates,
    thesisArchives = [],
    getAllMahasiswaAccounts,
    getAllDosenAccounts
  } = useAuth();

  const allMahasiswa = getAllMahasiswaAccounts ? getAllMahasiswaAccounts() : [];
  const allDosen = getAllDosenAccounts ? getAllDosenAccounts() : [];

  const totalMahasiswa = allMahasiswa.length;
  const mahasiswaAktif = allMahasiswa.filter(m => m.status === 'aktif').length;

  const totalDosen = allDosen.length;
  const dosenAktif = allDosen.filter(d => d.status === 'aktif').length;

  const totalDokumen   = adminDocuments.length;
  const dokumenAktif   = adminDocuments.filter(d => d.status === 'aktif').length;
  const totalCms       = adminCmsContents.length;
  const cmsPublikasi   = adminCmsContents.filter(c => c.status === 'publikasi').length;
  const totalTemplate  = adminTemplates.length;
  const templateAktif  = adminTemplates.filter(t => t.status === 'aktif').length;
  const totalRepo      = thesisArchives.length;
  const repoPublish    = thesisArchives.filter(a => (a.status || 'dipublikasikan') === 'dipublikasikan').length;

  const recentActivity = [
    ...adminDocuments.map(d => ({
      id: d.id, label: d.nama, kategori: 'Dokumen', status: d.status,
      tanggal: d.tanggal_upload, icon: FileStack, color: 'text-blue-600', bg: 'bg-blue-50'
    })),
    ...adminCmsContents.map(c => ({
      id: c.id, label: c.judul, kategori: 'CMS', status: c.status,
      tanggal: c.updated_at?.split('T')[0], icon: LayoutGrid, color: 'text-purple-600', bg: 'bg-purple-50'
    })),
    ...adminTemplates.map(t => ({
      id: t.id, label: t.nama, kategori: 'Template', status: t.status,
      tanggal: t.updated_at, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50'
    }))
  ].sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || '')).slice(0, 8);

  const statusBadge = (status) => {
    if (status === 'aktif' || status === 'publikasi')
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">{status}</span>;
    if (status === 'draf')
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">{status}</span>;
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{status}</span>;
  };

  return (
    <div className="space-y-6 select-none">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold backdrop-blur-sm mb-3 border border-indigo-400/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Portal Akses Admin SIMTA</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Dashboard Admin SIMTA FASILKOM</h1>
        <p className="text-sm text-indigo-100/90 mt-1 max-w-2xl leading-relaxed">
          Kelola resource akun mahasiswa &amp; dosen, dokumen/surat resmi, konten CMS, serta template pada Sistem Informasi Manajemen Tugas Akhir Fasilkom UNSRI.
        </p>
      </div>

      {/* Account & Repository Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        
        {/* Akun Mahasiswa */}
        <Link href="/admin-simta/accounts/mahasiswa"
          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1 hover:border-blue-300 hover:shadow-md transition-all group block">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Akun Mahasiswa</div>
          <div className="text-xl font-extrabold text-blue-600 flex items-center justify-between">
            <span>{totalMahasiswa}</span>
            <GraduationCap className="w-5 h-5 text-blue-400/50 group-hover:text-blue-600 transition-colors" />
          </div>
          <p className="text-[10px] text-slate-500">
            <span className="text-emerald-600 font-bold">{mahasiswaAktif} aktif</span> · {totalMahasiswa - mahasiswaAktif} nonaktif
          </p>
        </Link>

        {/* Akun Dosen */}
        <Link href="/admin-simta/accounts/dosen"
          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1 hover:border-indigo-300 hover:shadow-md transition-all group block">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Akun Dosen</div>
          <div className="text-xl font-extrabold text-indigo-600 flex items-center justify-between">
            <span>{totalDosen}</span>
            <UserCheck className="w-5 h-5 text-indigo-400/50 group-hover:text-indigo-600 transition-colors" />
          </div>
          <p className="text-[10px] text-slate-500">
            <span className="text-emerald-600 font-bold">{dosenAktif} aktif</span> · {totalDosen - dosenAktif} cuti
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

      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { href: '/admin-simta/accounts/mahasiswa', Icon: GraduationCap, color: 'blue', title: 'Kelola Mahasiswa', sub: 'Status & data' },
          { href: '/admin-simta/accounts/dosen',     Icon: UserCheck,     color: 'indigo', title: 'Kelola Dosen',     sub: 'Jabatan & kuota' },
          { href: '/admin-simta/repository',         Icon: Database,      color: 'amber',  title: 'Manajemen Repo',   sub: 'Scraper UNSRI' },
          { href: '/admin-simta/documents',          Icon: FileStack,     color: 'cyan',   title: 'Kelola Dokumen',   sub: 'Upload surat' },
          { href: '/admin-simta/cms',                Icon: LayoutGrid,    color: 'purple', title: 'Kelola CMS',       sub: 'Berita & info' },
          { href: '/admin-simta/templates',          Icon: FileText,      color: 'emerald',title: 'Kelola Template',  sub: 'Pedoman TA' }
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

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Aktivitas Terbaru</span>
          </h3>
          <span className="text-[11px] text-slate-400">8 item terakhir diperbarui</span>
        </div>
        <div className="space-y-2.5">
          {recentActivity.map((item) => {
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
          })}
        </div>
      </div>
    </div>
  );
}
