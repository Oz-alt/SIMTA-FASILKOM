import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  BookOpen, 
  Search, 
  Filter, 
  GraduationCap, 
  UserCheck, 
  FileText, 
  ExternalLink, 
  X, 
  Calendar, 
  CheckCircle2,
  Eye,
  User,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

export default function ArsipTAPage() {
  const { thesisArchives, departments } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProdi, setSelectedProdi] = useState('ALL');
  const [selectedTahun, setSelectedTahun] = useState('ALL');
  const [selectedDosen, setSelectedDosen] = useState('ALL');
  const [selectedArchive, setSelectedArchive] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Dynamic filter values
  const availableYears = useMemo(() => {
    const years = new Set(thesisArchives.map(a => a.tahun_ta || a.tahun_lulus).filter(Boolean));
    return ['ALL', ...Array.from(years).sort().reverse()];
  }, [thesisArchives]);

  const availableDosens = useMemo(() => {
    const dosens = new Set(thesisArchives.map(a => a.dosen_pa || a.pembimbing_1).filter(Boolean));
    return ['ALL', ...Array.from(dosens).sort()];
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
        item.dosen_pa?.toLowerCase().includes(query) ||
        item.pembimbing_1?.toLowerCase().includes(query) ||
        item.abstrak?.toLowerCase().includes(query);

      // 2. Prodi filter
      const matchProdi = selectedProdi === 'ALL' || item.prodi === selectedProdi;

      // 3. Year filter
      const itemYear = item.tahun_ta || item.tahun_lulus;
      const matchTahun = selectedTahun === 'ALL' || itemYear === selectedTahun;

      // 4. Dosen P.A filter
      const itemDosen = item.dosen_pa || item.pembimbing_1;
      const matchDosen = selectedDosen === 'ALL' || itemDosen === selectedDosen;

      return matchQuery && matchProdi && matchTahun && matchDosen;
    });
  }, [thesisArchives, searchTerm, selectedProdi, selectedTahun, selectedDosen]);

  // Reset to page 1 whenever filters or itemsPerPage change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedProdi, selectedTahun, selectedDosen, itemsPerPage]);

  // Pagination Calculations
  const totalPages = Math.ceil(filteredArchives.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredArchives.length);

  const paginatedArchives = useMemo(() => {
    return filteredArchives.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredArchives, startIndex, itemsPerPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Smooth scroll to search bar container
      const container = document.getElementById('archive-search-container');
      if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Generate page numbers for smart pagination
  const getPageNumbers = () => {
    const delta = 1;
    const range = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    if (currentPage - delta > 2) range.unshift('...');
    if (currentPage + delta < totalPages - 1) range.push('...');
    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);
    return range;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 select-none">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
            <BookOpen className="w-4 h-4" />
            <span>Arsip Resmi Tugas Akhir (Publikasi Repository UNSRI)</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Arsip Tugas Akhir D3 Manajemen Informatika
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            Kumpulan 388 data real Tugas Akhir Mahasiswa D3 Manajemen Informatika FASILKOM UNSRI lengkap dengan NIM, Nama Mahasiswa, Judul TA, Dosen P.A, Abstrak, dan Link Direct ke Repository UNSRI.
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
            <span>Data Real Terverifikasi</span>
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Program Studi</span>
          <div className="text-xl font-bold text-blue-700">
            {thesisArchives.filter(a => a.prodi?.includes('Manajemen Informatika')).length} Karya
          </div>
          <span className="text-[11px] text-slate-500">D3 Manajemen Informatika</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dosen P.A Terdaftar</span>
          <div className="text-xl font-bold text-indigo-700">
            {availableDosens.filter(d => d !== 'ALL').length} Dosen
          </div>
          <span className="text-[11px] text-slate-500">Pembimbing Akademik</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Direct Repository UNSRI</span>
          <div className="text-xl font-bold text-emerald-600">
            {thesisArchives.filter(a => a.link_repo_unsri || a.file_pdf_url).length} Tautan
          </div>
          <span className="text-[11px] text-slate-500">Akses Langsung Web</span>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div id="archive-search-container" className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari judul TA, nama mahasiswa, NIM, Dosen P.A, atau abstrak..."
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
            
            {/* Year Filter */}
            <div className="relative shrink-0">
              <select
                value={selectedTahun}
                onChange={(e) => setSelectedTahun(e.target.value)}
                className="pl-8 pr-8 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Tahun TA</option>
                {availableYears.filter(y => y !== 'ALL').map(y => (
                  <option key={y} value={y}>Tahun {y}</option>
                ))}
              </select>
              <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Dosen P.A Filter */}
            <div className="relative shrink-0">
              <select
                value={selectedDosen}
                onChange={(e) => setSelectedDosen(e.target.value)}
                className="pl-8 pr-8 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer max-w-[200px] truncate"
              >
                <option value="ALL">Semua Dosen P.A</option>
                {availableDosens.filter(d => d !== 'ALL').map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Items Per Page Selector */}
            <div className="relative shrink-0">
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="pl-3 pr-7 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
                title="Jumlah karya per halaman"
              >
                <option value={9}>9</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </div>

          </div>

        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            {filteredArchives.length > 0 ? (
              <>Menampilkan <strong className="text-slate-900 font-bold">{startIndex + 1} - {endIndex}</strong> dari <strong className="text-slate-900 font-bold">{filteredArchives.length}</strong> karya</>
            ) : (
              <span>Tidak ada data karya</span>
            )}
          </span>
          {(searchTerm || selectedTahun !== 'ALL' || selectedDosen !== 'ALL' || selectedProdi !== 'ALL') && (
            <button
              onClick={() => { setSearchTerm(''); setSelectedTahun('ALL'); setSelectedDosen('ALL'); setSelectedProdi('ALL'); }}
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
            Coba ubah kata kunci pencarian atau sesuaikan filter Tahun TA dan Dosen P.A.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedArchives.map((archive) => (
            <div 
              key={archive.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                
                {/* Header Meta: Prodi & Tahun */}
                <div className="flex items-center justify-between text-[11px] gap-2">
                  <span className="font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 truncate">
                    {archive.prodi || 'D3 Manajemen Informatika'}
                  </span>
                  <span className="font-semibold text-slate-500 shrink-0 bg-slate-100 px-2 py-0.5 rounded">
                    Tahun {archive.tahun_ta || archive.tahun_lulus}
                  </span>
                </div>

                {/* Judul TA */}
                <h3 className="text-sm font-bold text-slate-900 line-clamp-3 leading-snug group-hover:text-blue-600 transition-colors">
                  {archive.judul}
                </h3>

                {/* Penulis Info: Nama & NIM */}
                <div className="flex items-center space-x-2.5 text-xs text-slate-700 pt-1">
                  <div className="w-8 h-8 rounded-full bg-blue-900 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0 border border-blue-800 shadow-xs">
                    {archive.penulis_nama?.charAt(0) || 'M'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate leading-tight uppercase">{archive.penulis_nama}</p>
                    <p className="text-[11px] text-slate-500 font-mono font-medium truncate">NIM: {archive.penulis_nim}</p>
                  </div>
                </div>

                {/* Dosen P.A */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-1">
                  <div className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Dosen P.A / Pembimbing</div>
                  <p className="text-slate-800 font-semibold truncate">{archive.dosen_pa || archive.pembimbing_1}</p>
                </div>

                {/* Abstrak Preview */}
                {archive.abstrak && (
                  <p className="text-[11px] text-slate-500 line-clamp-2 italic leading-relaxed pt-1">
                    "{archive.abstrak}"
                  </p>
                )}

              </div>

              {/* Card Action Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <a
                  href={archive.link_repo_unsri || archive.file_pdf_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] border border-emerald-200 transition-all flex items-center space-x-1 cursor-pointer truncate"
                  title="Buka Direct Repo UNSRI"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Repo UNSRI</span>
                </a>

                <button
                  onClick={() => setSelectedArchive(archive)}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Detail</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* PAGINATION CONTROLS */}
      {filteredArchives.length > 0 && totalPages > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          
          <div className="text-xs text-slate-600 font-medium">
            Halaman <strong className="text-slate-900 font-bold">{currentPage}</strong> dari <strong className="text-slate-900 font-bold">{totalPages}</strong> ({filteredArchives.length} total karya)
          </div>

          <div className="flex items-center space-x-1.5 text-xs font-semibold">
            
            {/* First Page */}
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                currentPage === 1 
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed' 
                  : 'border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`}
              title="Halaman Pertama"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Prev Page */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                currentPage === 1 
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed' 
                  : 'border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`}
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center space-x-1 px-1">
              {getPageNumbers().map((num, idx) => (
                typeof num === 'number' ? (
                  <button
                    key={idx}
                    onClick={() => handlePageChange(num)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentPage === num 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200'
                    }`}
                  >
                    {num}
                  </button>
                ) : (
                  <span key={idx} className="px-1 text-slate-400 font-bold">...</span>
                )
              ))}
            </div>

            {/* Next Page */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                currentPage === totalPages 
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed' 
                  : 'border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`}
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last Page */}
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                currentPage === totalPages 
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed' 
                  : 'border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`}
              title="Halaman Terakhir"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>

          </div>

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
                    {selectedArchive.prodi || 'D3 Manajemen Informatika'}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Tahun TA {selectedArchive.tahun_ta || selectedArchive.tahun_lulus}
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
              
              {/* Data Mahasiswa / Penulis */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Mahasiswa / Penulis</span>
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-blue-900 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {selectedArchive.penulis_nama?.charAt(0) || 'M'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm uppercase">{selectedArchive.penulis_nama}</p>
                    <p className="text-xs text-slate-600 font-mono font-medium">NIM: {selectedArchive.penulis_nim}</p>
                    <p className="text-[11px] text-slate-400">Prodi: {selectedArchive.prodi || 'D3 Manajemen Informatika'}</p>
                  </div>
                </div>
              </div>

              {/* Dosen P.A */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Dosen P.A / Pembimbing</span>
                <div className="space-y-1 font-semibold text-slate-800">
                  <p className="text-sm font-bold text-slate-900">{selectedArchive.dosen_pa || selectedArchive.pembimbing_1}</p>
                  <p className="text-xs text-slate-500 font-normal">Dosen Pembimbing Akademik D3 Manajemen Informatika</p>
                </div>
              </div>

            </div>

            {/* Abstrak Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Abstrak Tugas Akhir</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed max-h-60 overflow-y-auto font-normal">
                <p>{selectedArchive.abstrak || 'Abstrak tidak tersedia.'}</p>
              </div>
            </div>

            {/* Repository Link Actions */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-2xs shrink-0">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900">Direct Link Repository UNSRI</p>
                  <p className="text-[11px] text-blue-600 font-mono truncate underline">
                    {selectedArchive.link_repo_unsri || selectedArchive.file_pdf_url || '#'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <a
                  href={selectedArchive.link_repo_unsri || selectedArchive.file_pdf_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka Repository UNSRI</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
