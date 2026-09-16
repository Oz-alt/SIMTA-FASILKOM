import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  FileCheck, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Search, 
  Download, 
  ExternalLink, 
  X, 
  UserCheck, 
  GraduationCap, 
  BookOpen, 
  Edit3,
  Sparkles,
  Info
} from 'lucide-react';

export default function TinjauRepositoryKaprodi() {
  const { thesisRepositories, reviewRepositoryKaprodi } = useAuth();
  const [activeTab, setActiveTab] = useState('menunggu_review_kaprodi');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Filter repositories by status & search term
  const filteredRepos = thesisRepositories.filter(repo => {
    const matchTab = activeTab === 'ALL' || repo.status === activeTab;
    const query = searchTerm.toLowerCase().trim();
    const matchQuery = !query || 
      repo.judul?.toLowerCase().includes(query) ||
      repo.penulis_nama?.toLowerCase().includes(query) ||
      repo.penulis_nim?.toLowerCase().includes(query);
    return matchTab && matchQuery;
  });

  const handleApprove = (repoId) => {
    reviewRepositoryKaprodi(repoId, 'disetujui_kaprodi', 'Dokumen repositori lengkap dan disetujui Kaprodi.');
    setToastMsg('Repositori berhasil disetujui! Siap untuk dipublikasikan oleh Admin Sarana.');
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleRequestRevision = (e) => {
    e.preventDefault();
    if (!selectedRepo) return;
    reviewRepositoryKaprodi(selectedRepo.id, 'perlu_revisi', revisionNote || 'Harap perbaiki abstrak atau dokumen PDF.');
    setSelectedRepo(null);
    setRevisionNote('');
    setToastMsg('Catatan revisi repositori berhasil dikirim ke mahasiswa.');
    setTimeout(() => setToastMsg(''), 4000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'menunggu_review_kaprodi':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">Menunggu Review Kaprodi</span>;
      case 'disetujui_kaprodi':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">Disetujui Kaprodi</span>;
      case 'perlu_revisi':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">Perlu Revisi</span>;
      case 'dipublikasikan':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">Dipublikasikan (Tayang)</span>;
      default:
        return null;
    }
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

      {/* Banner Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
            <FileCheck className="w-4 h-4" />
            <span>Panel Verifikasi Repositori KAPRODI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Tinjau Repositori Tugas Akhir</h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Periksa draf laporan akhir, abstrak ID/EN, serta kelengkapan dokumen mahasiswa. Setujui repositori yang telah memenuhi syarat agar dapat dipublikasikan Admin ke Arsip Global FASILKOM.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('menunggu_review_kaprodi')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'menunggu_review_kaprodi' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Menunggu Review ({thesisRepositories.filter(r => r.status === 'menunggu_review_kaprodi').length})
            </button>
            <button
              onClick={() => setActiveTab('disetujui_kaprodi')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'disetujui_kaprodi' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Disetujui Kaprodi ({thesisRepositories.filter(r => r.status === 'disetujui_kaprodi').length})
            </button>
            <button
              onClick={() => setActiveTab('perlu_revisi')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'perlu_revisi' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Perlu Revisi ({thesisRepositories.filter(r => r.status === 'perlu_revisi').length})
            </button>
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({thesisRepositories.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari judul / mahasiswa / NIM..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

        </div>

        {/* Repositories Cards List */}
        {filteredRepos.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs space-y-2">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <p>Tidak ada pengajuan repositori pada kategori ini.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRepos.map(repo => (
              <div 
                key={repo.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1 max-w-3xl">
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(repo.status)}
                      <span className="text-[11px] font-semibold text-slate-400">
                        Diunggah: {new Date(repo.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{repo.judul}</h3>
                  </div>

                  {/* Actions for Kaprodi */}
                  {repo.status === 'menunggu_review_kaprodi' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedRepo(repo)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Minta Revisi
                      </button>
                      <button
                        onClick={() => handleApprove(repo.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Setujui (ACC Kaprodi)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Author & Advisor Meta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl text-xs text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Mahasiswa Penulis</span>
                    <p className="font-bold text-slate-900 mt-0.5">{repo.penulis_nama}</p>
                    <p className="text-[11px] text-slate-500">NIM: {repo.penulis_nim}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Prodi &amp; Angkatan</span>
                    <p className="font-bold text-blue-700 mt-0.5">{repo.prodi}</p>
                    <p className="text-[11px] text-slate-500">Angkatan {repo.tahun_angkatan} (Lulus {repo.tahun_lulus})</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Dosen Pembimbing 1</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{repo.pembimbing_1}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Berkas Laporan</span>
                    {repo.file_pdf_url ? (
                      <a
                        href={repo.file_pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-bold mt-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">File tidak ada</span>
                    )}
                  </div>
                </div>

                {/* Abstract snippet */}
                <div className="text-xs text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-800 block mb-1">Abstrak Ringkas:</span>
                  <p className="line-clamp-2 leading-relaxed">{repo.abstrak}</p>
                </div>

                {repo.catatan_kaprodi && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <span className="font-bold">Catatan Kaprodi:</span> {repo.catatan_kaprodi}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Minta Revisi */}
      {selectedRepo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Catatan Revisi Repositori</h3>
              <button onClick={() => setSelectedRepo(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestRevision} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tuliskan Catatan Perbaikan bagi Mahasiswa
                </label>
                <textarea
                  rows="4"
                  required
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  placeholder="Contoh: Lampirkan file PDF laporan akhir yang sudah ditandatangani lembar pengesahannya..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRepo(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm"
                >
                  Kirim Revisi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
