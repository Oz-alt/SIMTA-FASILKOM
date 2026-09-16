import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Filter, 
  GraduationCap, 
  UserCheck, 
  FileText, 
  Download, 
  ExternalLink, 
  X, 
  Tag, 
  Calendar, 
  Building2, 
  UploadCloud,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Eye,
  FileSpreadsheet
} from 'lucide-react';

export default function ArsipTAPage() {
  const { thesisArchives, departments } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProdi, setSelectedProdi] = useState('ALL');
  const [selectedTahun, setSelectedTahun] = useState('ALL');
  const [selectedAngkatan, setSelectedAngkatan] = useState('ALL');
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [activeAbstrakTab, setActiveAbstrakTab] = useState('ID');

  // Dynamic filter values
  const availableYears = useMemo(() => {
    const years = new Set(thesisArchives.map(a => a.tahun_lulus).filter(Boolean));
    return ['ALL', ...Array.from(years).sort().reverse()];
  }, [thesisArchives]);

  const availableAngkatan = useMemo(() => {
    const angkatanSet = new Set(thesisArchives.map(a => a.tahun_angkatan).filter(Boolean));
    return ['ALL', ...Array.from(angkatanSet).sort().reverse()];
  }, [thesisArchives]);

  // Filtered Archives
  const filteredArchives = useMemo(() => {
    return thesisArchives.filter(item => {
      // 1. Search keyword match
      const query = searchTerm.toLowerCase().trim();
      const matchQuery = !query || 
        item.judul?.toLowerCase().includes(query) ||
        item.penulis_nama?.toLowerCase().includes(query) ||
        item.penulis_nim?.toLowerCase().includes(query) ||
        item.pembimbing_1?.toLowerCase().includes(query) ||
        item.pembimbing_2?.toLowerCase().includes(query) ||
        (Array.isArray(item.kata_kunci) && item.kata_kunci.some(k => k.toLowerCase().includes(query)));

      // 2. Prodi filter
      const matchProdi = selectedProdi === 'ALL' || item.prodi === selectedProdi;

      // 3. Year filter
      const matchTahun = selectedTahun === 'ALL' || item.tahun_lulus === selectedTahun;

      // 4. Angkatan filter
      const matchAngkatan = selectedAngkatan === 'ALL' || item.tahun_angkatan === selectedAngkatan;

      return matchQuery && matchProdi && matchTahun && matchAngkatan;
    });
  }, [thesisArchives, searchTerm, selectedProdi, selectedTahun, selectedAngkatan]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 select-none">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
            <BookOpen className="w-4 h-4" />
            <span>Arsip Resmi Tugas Akhir (Publikasi Digital)</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Arsip Tugas Akhir FASILKOM UNSRI
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            Jelajahi karya ilmiah dan laporan Tugas Akhir mahasiswa yang telah diselesaikan. Temukan referensi topik, dosen pembimbing, serta berkas publikasi ilmiah resmi.
          </p>
        </div>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Arsip TA</span>
          <div className="text-xl font-bold text-slate-900">{thesisArchives.length} Karya</div>
          <span className="text-[11px] text-emerald-600 font-medium flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Terverifikasi Digital</span>
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">D3 Manajemen Informatika</span>
          <div className="text-xl font-bold text-blue-700">
            {thesisArchives.filter(a => a.prodi?.includes('Manajemen Informatika')).length} Karya
          </div>
          <span className="text-[11px] text-slate-500">Program Diploma</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">S1 Teknik Informatika</span>
          <div className="text-xl font-bold text-indigo-700">
            {thesisArchives.filter(a => a.prodi?.includes('Teknik Informatika')).length} Karya
          </div>
          <span className="text-[11px] text-slate-500">Program Sarjana</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">File Laporan PDF</span>
          <div className="text-xl font-bold text-emerald-600">
            {thesisArchives.filter(a => a.file_pdf_url).length} Dokumen
          </div>
          <span className="text-[11px] text-slate-500">Siap Diunduh</span>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari berdasarkan judul TA, nama mahasiswa, NIM, dosen pembimbing, atau kata kunci..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm font-medium text-slate-900 bg-white transition-all outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Prodi Filter */}
            <div className="relative shrink-0">
              <select
                value={selectedProdi}
                onChange={(e) => setSelectedProdi(e.target.value)}
                className="pl-8 pr-8 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Program Studi</option>
                {departments && departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
              <GraduationCap className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Year Filter */}
            <div className="relative shrink-0">
              <select
                value={selectedTahun}
                onChange={(e) => setSelectedTahun(e.target.value)}
                className="pl-8 pr-8 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Tahun Lulus</option>
                {availableYears.filter(y => y !== 'ALL').map(y => (
                  <option key={y} value={y}>Lulus {y}</option>
                ))}
              </select>
              <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Angkatan Filter */}
            <div className="relative shrink-0">
              <select
                value={selectedAngkatan}
                onChange={(e) => setSelectedAngkatan(e.target.value)}
                className="pl-8 pr-8 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Angkatan</option>
                {availableAngkatan.filter(a => a !== 'ALL').map(a => (
                  <option key={a} value={a}>Angkatan {a}</option>
                ))}
              </select>
              <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

          </div>

        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Menampilkan <strong className="text-slate-900 font-bold">{filteredArchives.length}</strong> dari {thesisArchives.length} arsip tugas akhir</span>
          {(searchTerm || selectedProdi !== 'ALL' || selectedTahun !== 'ALL' || selectedAngkatan !== 'ALL') && (
            <button
              onClick={() => { setSearchTerm(''); setSelectedProdi('ALL'); setSelectedTahun('ALL'); setSelectedAngkatan('ALL'); }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      </div>

      {/* Archives Grid Cards */}
      {filteredArchives.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Tidak Ada Arsip Tugas Akhir Ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Coba ubah kata kunci pencarian atau sesuaikan filter Program Studi dan Tahun Lulus Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArchives.map((archive) => (
            <div 
              key={archive.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                
                {/* Header Meta: Prodi & Tahun */}
                <div className="flex items-center justify-between text-[11px] gap-2">
                  <span className="font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 truncate">
                    {archive.prodi}
                  </span>
                  <span className="font-semibold text-slate-400 shrink-0">
                    Lulus {archive.tahun_lulus || archive.tahun_angkatan}
                  </span>
                </div>

                {/* Judul TA */}
                <h3 className="text-sm font-bold text-slate-900 line-clamp-3 leading-snug group-hover:text-blue-600 transition-colors">
                  {archive.judul}
                </h3>

                {/* Penulis Info */}
                <div className="flex items-center space-x-2.5 text-xs text-slate-700 pt-1">
                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0 border border-slate-200">
                    {archive.penulis_nama?.charAt(0) || 'M'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate leading-tight">{archive.penulis_nama}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate">NIM: {archive.penulis_nim}</p>
                  </div>
                </div>

                {/* Dosen Pembimbing */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-1">
                  <div className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Tim Pembimbing</div>
                  <p className="text-slate-800 font-semibold truncate">1. {archive.pembimbing_1}</p>
                  {archive.pembimbing_2 && (
                    <p className="text-slate-600 truncate">2. {archive.pembimbing_2}</p>
                  )}
                </div>

                {/* Kata Kunci Tags */}
                {Array.isArray(archive.kata_kunci) && archive.kata_kunci.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {archive.kata_kunci.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        #{tag}
                      </span>
                    ))}
                    {archive.kata_kunci.length > 3 && (
                      <span className="text-[10px] font-semibold text-slate-400">+{archive.kata_kunci.length - 3}</span>
                    )}
                  </div>
                )}

              </div>

              {/* Card Action Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>PDF Laporan Ready</span>
                </span>

                <button
                  onClick={() => { setSelectedArchive(archive); setActiveAbstrakTab('ID'); }}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Detail &amp; PDF</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* DETAIL MODAL POPUP */}
      {selectedArchive && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    {selectedArchive.prodi}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Tahun Kelulusan {selectedArchive.tahun_lulus || selectedArchive.tahun_angkatan}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                  {selectedArchive.judul}
                </h2>
              </div>

              <button
                onClick={() => setSelectedArchive(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Author & Supervisor Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              {/* Data Penulis */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Penulis / Mahasiswa</span>
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-blue-900 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {selectedArchive.penulis_nama?.charAt(0) || 'M'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{selectedArchive.penulis_nama}</p>
                    <p className="text-xs text-slate-500 font-medium">NIM: {selectedArchive.penulis_nim}</p>
                    <p className="text-[11px] text-slate-400">Kelas: {selectedArchive.kelas || 'Reguler'}</p>
                  </div>
                </div>
              </div>

              {/* Tim Pembimbing & Penguji */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Dosen Pembimbing &amp; Penguji</span>
                <div className="space-y-1 font-semibold text-slate-800">
                  <p><span className="text-slate-400 font-normal">Pembimbing 1:</span> {selectedArchive.pembimbing_1}</p>
                  {selectedArchive.pembimbing_2 && (
                    <p><span className="text-slate-400 font-normal">Pembimbing 2:</span> {selectedArchive.pembimbing_2}</p>
                  )}
                  {selectedArchive.penguji_1 && (
                    <p className="text-slate-600 text-[11px]"><span className="text-slate-400 font-normal">Penguji:</span> {selectedArchive.penguji_1}</p>
                  )}
                </div>
              </div>

            </div>

            {/* Abstrak Dual Language Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Abstrak Tugas Akhir</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveAbstrakTab('ID')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeAbstrakTab === 'ID' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Bahasa Indonesia
                  </button>
                  <button
                    onClick={() => setActiveAbstrakTab('EN')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeAbstrakTab === 'EN' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed max-h-56 overflow-y-auto">
                {activeAbstrakTab === 'ID' ? (
                  <p>{selectedArchive.abstrak || 'Abstrak bahasa Indonesia belum diunggah.'}</p>
                ) : (
                  <p className="italic">{selectedArchive.abstrak_en || 'English abstract not provided.'}</p>
                )}
              </div>
            </div>

            {/* Keywords */}
            {Array.isArray(selectedArchive.kata_kunci) && selectedArchive.kata_kunci.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Kata Kunci / Subject Index</span>
                <div className="flex flex-wrap gap-2">
                  {selectedArchive.kata_kunci.map((tag, idx) => (
                    <span key={idx} className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* PDF File Actions */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-2xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Berkas Laporan Akhir TA (PDF)</p>
                  <p className="text-[11px] text-slate-500">Format PDF Resmi • FASILKOM UNSRI Digital Archive</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <a
                  href={selectedArchive.file_pdf_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh / Buka PDF</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
