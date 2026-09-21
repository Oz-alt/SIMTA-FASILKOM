import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link } from '@inertiajs/react';
import {
  FileStack,
  LayoutGrid,
  FileText,
  Clock,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

export default function DashboardAdminSimta() {
  const { adminDocuments, adminCmsContents, adminTemplates } = useAuth();

  const totalDokumen   = adminDocuments.length;
  const dokumenAktif   = adminDocuments.filter(d => d.status === 'aktif').length;
  const totalCms       = adminCmsContents.length;
  const cmsPublikasi   = adminCmsContents.filter(c => c.status === 'publikasi').length;
  const totalTemplate  = adminTemplates.length;
  const templateAktif  = adminTemplates.filter(t => t.status === 'aktif').length;

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
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold backdrop-blur-sm mb-3 border border-indigo-400/20">
          <span>Portal Akses Admin SIMTA</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Dashboard Manajemen Konten SIMTA</h1>
        <p className="text-sm text-indigo-100/90 mt-1 max-w-2xl leading-relaxed">
          Kelola dokumen/surat, konten CMS, dan template yang ditampilkan pada Sistem Informasi Manajemen Tugas Akhir Fasilkom UNSRI.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin-simta/documents"
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-1 hover:border-blue-300 hover:shadow-md transition-all group block">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dokumen / Surat</div>
          <div className="text-2xl font-extrabold text-blue-600 flex items-center justify-between">
            <span>{totalDokumen} Dokumen</span>
            <FileStack className="w-6 h-6 text-blue-400/40 group-hover:text-blue-400 transition-colors" />
          </div>
          <p className="text-[11px] text-slate-500">
            <span className="text-emerald-600 font-semibold">{dokumenAktif} aktif</span> · {totalDokumen - dokumenAktif} nonaktif
          </p>
        </Link>

        <Link href="/admin-simta/cms"
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-1 hover:border-purple-300 hover:shadow-md transition-all group block">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Konten CMS</div>
          <div className="text-2xl font-extrabold text-purple-600 flex items-center justify-between">
            <span>{totalCms} Konten</span>
            <LayoutGrid className="w-6 h-6 text-purple-400/40 group-hover:text-purple-400 transition-colors" />
          </div>
          <p className="text-[11px] text-slate-500">
            <span className="text-emerald-600 font-semibold">{cmsPublikasi} publikasi</span> · {totalCms - cmsPublikasi} draf
          </p>
        </Link>

        <Link href="/admin-simta/templates"
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-1 hover:border-emerald-300 hover:shadow-md transition-all group block">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Template</div>
          <div className="text-2xl font-extrabold text-emerald-600 flex items-center justify-between">
            <span>{totalTemplate} Template</span>
            <FileText className="w-6 h-6 text-emerald-400/40 group-hover:text-emerald-400 transition-colors" />
          </div>
          <p className="text-[11px] text-slate-500">
            <span className="text-emerald-600 font-semibold">{templateAktif} aktif</span> · {totalTemplate - templateAktif} nonaktif
          </p>
        </Link>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/60 border border-indigo-200 rounded-xl p-5 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center justify-between">
            <span>Total Item Dikelola</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-900">{totalDokumen + totalCms + totalTemplate}</div>
          <p className="text-[11px] text-indigo-600/80 font-medium">Dokumen · CMS · Template</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/admin-simta/documents', Icon: FileStack, color: 'blue', title: 'Kelola Dokumen', sub: 'Upload, edit, hapus dokumen' },
          { href: '/admin-simta/cms',       Icon: LayoutGrid, color: 'purple', title: 'Kelola CMS',     sub: 'Tambah & edit konten' },
          { href: '/admin-simta/templates', Icon: FileText,   color: 'emerald', title: 'Kelola Template', sub: 'Tambah & aktifkan template' }
        ].map(({ href, Icon, color, title, sub }) => (
          <Link key={href} href={href}
            className={`flex items-center justify-between bg-white border border-slate-200 rounded-xl px-5 py-4 hover:border-${color}-400 hover:shadow-md transition-all group`}>
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-lg bg-${color}-50 flex items-center justify-center group-hover:bg-${color}-100 transition-colors`}>
                <Icon className={`w-4 h-4 text-${color}-600`} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">{title}</div>
                <div className="text-[10px] text-slate-500">{sub}</div>
              </div>
            </div>
            <ArrowRight className={`w-4 h-4 text-slate-400 group-hover:text-${color}-600 group-hover:translate-x-1 transition-all`} />
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
