import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  Globe, 
  CheckCircle2, 
  Search, 
  Download, 
  ExternalLink, 
  UserCheck, 
  GraduationCap, 
  BookOpen,
  Sparkles,
  Building2,
  FileCheck
} from 'lucide-react';

export default function PublikasiRepositoryAdmin() {
  const { thesisRepositories, publishRepositoryAdmin, thesisArchives } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Repositories approved by Kaprodi awaiting Admin publication
  const approvedRepos = thesisRepositories.filter(r => r.status === 'disetujui_kaprodi');
  const publishedRepos = thesisRepositories.filter(r => r.status === 'dipublikasikan');

  const filteredApproved = approvedRepos.filter(repo => {
    const query = searchTerm.toLowerCase().trim();
    return !query || 
      repo.judul?.toLowerCase().includes(query) ||
      repo.penulis_nama?.toLowerCase().includes(query) ||
      repo.penulis_nim?.toLowerCase().includes(query);
  });

  const handlePublish = (repoId) => {
    publishRepositoryAdmin(repoId);
    setToastMsg('Dokumen repositori berhasil dipublikasikan ke Arsip Tugas Akhir Global!');
    setTimeout(() => setToastMsg(''), 4000);
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center space-x-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-400/30">
            <Globe className="w-4 h-4" />
            <span>Panel Publikasi Arsip Global ADMIN</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Publikasi Repositori ke Arsip Global</h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Kelola repositori Tugas Akhir mahasiswa yang telah disetujui Kaprodi. Dipublikasikan secara resmi agar tayang di perpustakaan digital Arsip Tugas Akhir FASILKOM UNSRI.
          </p>
        </div>
      </div>

      {/* Quick Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Siap Dipublikasikan</span>
          <div className="text-2xl font-bold text-amber-600">{approvedRepos.length} Dokumen</div>
          <span className="text-[11px] text-slate-500">Telah Di-ACC Kaprodi</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Dipublikasikan</span>
          <div className="text-2xl font-bold text-emerald-600">{publishedRepos.length} Dokumen</div>
          <span className="text-[11px] text-slate-500">Tayang di Arsip Global</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Master Arsip Global</span>
          <div className="text-2xl font-bold text-blue-600">{thesisArchives.length} Karya</div>
          <span className="text-[11px] text-slate-500">Perpustakaan Digital</span>
        </div>
      </div>

      {/* Content Container */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Antrean Publikasi Repositori</h2>
            <p className="text-xs text-slate-500">Repositori mahasiswa yang telah memperoleh persetujuan Kaprodi</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari repositori..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {filteredApproved.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs space-y-2">
            <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
            <p>Tidak ada antrean repositori yang menunggu publikasi Admin saat ini.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApproved.map(repo => (
              <div 
                key={repo.id}
                className="bg-slate-50/70 rounded-xl border border-slate-200 p-5 hover:border-purple-300 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1 max-w-3xl">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                      Disetujui Kaprodi: {repo.approved_by_kaprodi || 'Dr. Ir. Hendra Kusuma, M.T.'}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{repo.judul}</h3>
                  </div>

                  <button
                    onClick={() => handlePublish(repo.id)}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center space-x-2"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Publikasikan ke Arsip Global</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-100 text-xs text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Mahasiswa Penulis</span>
                    <p className="font-bold text-slate-900 mt-0.5">{repo.penulis_nama}</p>
                    <p className="text-[11px] text-slate-500">NIM: {repo.penulis_nim}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Program Studi</span>
                    <p className="font-bold text-purple-700 mt-0.5">{repo.prodi}</p>
                    <p className="text-[11px] text-slate-500">Angkatan {repo.tahun_angkatan}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Dosen Pembimbing</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{repo.pembimbing_1}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Berkas Laporan PDF</span>
                    {repo.file_pdf_url ? (
                      <a
                        href={repo.file_pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-purple-600 hover:text-purple-800 font-bold mt-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Pratinjau PDF</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">File tidak ada</span>
                    )}
                  </div>
                </div>

                {repo.catatan_kaprodi && (
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                    <span className="font-bold">Catatan Persetujuan Kaprodi:</span> {repo.catatan_kaprodi}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
