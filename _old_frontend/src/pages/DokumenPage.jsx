import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { 
  FileText, 
  Search, 
  ArrowLeft, 
  Download, 
  Eye, 
  X, 
  CheckCircle2, 
  FileSpreadsheet, 
  BookOpen, 
  Filter,
  GraduationCap
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DokumenPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('semua');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(null);

  const headerRef = useRef(null);
  const cardsGridRef = useRef(null);

  // GSAP Entrance Animation on mount / load
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (headerRef.current) {
        tl.fromTo(
          headerRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 }
        );
      }

      if (cardsGridRef.current) {
        tl.fromTo(
          cardsGridRef.current.children,
          { opacity: 0, y: 25 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            clearProps: 'transform,opacity'
          },
          '-=0.3'
        );
      }
    });

    return () => ctx.revert();
  }, []);

  const initialDocuments = [
    {
      id: 1,
      title: 'BUKU PANDUAN PENULISAN TUGAS AKHIR PRODI D3 MANAJEMEN INFORMATIKA',
      description: 'Buku pedoman tata cara penyusunan, struktur penulisan, aturan format tata letak, dan mekanisme sidang tugas akhir mahasiswa D3 MI Fasilkom UNSRI.',
      category: 'Panduan TA',
      prodi: 'D3 Manajemen Informatika',
      fileSize: '3.04 MB',
      updatedAt: '13 May 2026',
      downloads: 1420,
      fileType: 'PDF'
    },
    {
      id: 2,
      title: 'SOP PEMINJAMAN RUANG SIDANG & SEMINAR KAMPUS BUKIT',
      description: 'Prosedur operasional standar tata cara reservasi, syarat administrasi, dan peminjaman ruang sidang DIPKOM dan Diklat Fasilkom UNSRI.',
      category: 'SOP Sidang & Ruangan',
      prodi: 'Semua Prodi',
      fileSize: '1.18 MB',
      updatedAt: '12 May 2026',
      downloads: 980,
      fileType: 'PDF'
    },
    {
      id: 3,
      title: 'PEDOMAN PELAKSANAAN & LOGBOOK KERJA PRAKTIK (KP) FASILKOM',
      description: 'Panduan pelaksanaan magang/kerja praktik, format logbook mingguan, tata cara permohonan surat pengantar, dan lembar penilaian dosen pembimbing.',
      category: 'Panduan KP / Magang',
      prodi: 'D3 MI & S1 Sistem Informasi',
      fileSize: '2.45 MB',
      updatedAt: '10 Apr 2026',
      downloads: 1150,
      fileType: 'PDF'
    },
    {
      id: 4,
      title: 'TEMPLATE FORMAT COVER & LEMBAR PENGESAHAN SKRIPSI / TA',
      description: 'File template resmi format baku penulisan sampul depan, lembar pengesahan, abstrak 2 bahasa, dan halaman pernyataan keaslian karya.',
      category: 'Template Format',
      prodi: 'Semua Prodi',
      fileSize: '850 KB',
      updatedAt: '28 Mar 2026',
      downloads: 2310,
      fileType: 'DOCX / PDF'
    },
    {
      id: 5,
      title: 'BUKU PANDUAN SIMILARITY CHECK Engine & VERIFIKASI KEBARUAN JUDUL',
      description: 'Panduan teknis penggunaan fitur Similarity Engine SIMTA berbasis FTS & Trigram untuk menghitung persentase kemiripan judul TA.',
      category: 'Panduan TA',
      prodi: 'Semua Prodi',
      fileSize: '1.72 MB',
      updatedAt: '15 Feb 2026',
      downloads: 870,
      fileType: 'PDF'
    },
    {
      id: 6,
      title: 'SYARAT & ALUR PROSEDUR SURAT BEBAS LABORATORIUM FASILKOM',
      description: 'Prosedur permohonan penerbitan surat keterangan bebas pinjam alat dan bebas laboratorium sebagai syarat mendaftar yudisium.',
      category: 'SOP Sidang & Ruangan',
      prodi: 'Semua Prodi',
      fileSize: '920 KB',
      updatedAt: '02 Jan 2026',
      downloads: 740,
      fileType: 'PDF'
    }
  ];

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return initialDocuments.filter(doc => {
      const matchesSearch = 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.prodi.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = 
        selectedCategory === 'semua' || 
        doc.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleDownload = (doc) => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 }
    });

    setDownloadSuccess(`Mengunduh file: ${doc.title}`);
    setTimeout(() => {
      setDownloadSuccess(null);
    }, 4000);
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-16 font-sans">
      
      {/* Header Container */}
      <div ref={headerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        
        {/* Top Header Row with Title & Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Dokumen
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Cari, pratinjau, dan unduh dokumen yang tersedia untuk umum
            </p>
          </div>

          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-all border border-slate-200 shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Download Success Banner Notification */}
        {downloadSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
            <button onClick={() => setDownloadSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Search & Category Filter Card Container */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Search Input Box (8 cols) */}
            <div className="md:col-span-8 space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Cari</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari dokumen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 bg-white transition-all outline-none"
                />
                {searchQuery ? (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                )}
              </div>
            </div>

            {/* Category Dropdown (4 cols) */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Kategori</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 bg-white transition-all outline-none cursor-pointer"
              >
                <option value="semua">Semua Kategori</option>
                <option value="Panduan TA">Panduan TA</option>
                <option value="SOP Sidang & Ruangan">SOP Sidang & Ruangan</option>
                <option value="Panduan KP / Magang">Panduan KP / Magang</option>
                <option value="Template Format">Template Format</option>
              </select>
            </div>

          </div>
        </div>

        {/* Counter Info Text */}
        <div className="text-xs text-slate-500 font-medium pb-4">
          Menampilkan 1-{filteredDocuments.length} dari {filteredDocuments.length} dokumen
        </div>

        {/* Documents Cards Grid (2 Columns matching SIMLAB screenshot) */}
        {filteredDocuments.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Tidak ada dokumen ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Coba kata kunci lain atau ubah filter kategori untuk menemukan dokumen panduan yang Anda cari.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('semua'); }}
              className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 transition-colors cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div ref={cardsGridRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredDocuments.map((doc) => (
              <div 
                key={doc.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-blue-200 transition-colors duration-200 flex flex-col justify-between space-y-4 group"
              >
                
                {/* Upper Content Row */}
                <div className="flex items-start space-x-4">
                  {/* PDF Icon Badge (Soft Red background) */}
                  <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex flex-col items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                    <span className="text-[9px] font-extrabold uppercase mt-0.5 tracking-wider">PDF</span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {doc.description}
                    </p>
                  </div>
                </div>

                {/* Category & File Size Pill */}
                <div className="flex items-center space-x-2 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                    {doc.category}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {doc.fileSize}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-300">•</span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {doc.prodi}
                  </span>
                </div>

                {/* Card Footer Action Bar (Date, Preview, Download) */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>{doc.updatedAt}</span>

                  <div className="flex items-center space-x-4">
                    {/* Preview Button */}
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-semibold cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    {/* Download Button */}
                    <button
                      onClick={() => handleDownload(doc)}
                      className="inline-flex items-center space-x-1 text-emerald-600 hover:text-emerald-800 font-semibold cursor-pointer transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* Document Detail Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center font-bold text-xs">
                  PDF
                </div>
                <div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 uppercase">
                    {selectedDoc.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1 leading-snug">
                    {selectedDoc.title}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDoc(null)} 
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Summary */}
            <div className="space-y-4 text-xs text-slate-600">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 text-xs">Ringkasan Dokumen:</h4>
                <p className="leading-relaxed">{selectedDoc.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Program Studi</span>
                  <span className="font-semibold text-slate-800">{selectedDoc.prodi}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Ukuran File</span>
                  <span className="font-semibold text-slate-800">{selectedDoc.fileSize}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Terakhir Diperbarui</span>
                  <span className="font-semibold text-slate-800">{selectedDoc.updatedAt}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Unduhan</span>
                  <span className="font-semibold text-slate-800">{selectedDoc.downloads}x diunduh</span>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Tutup Pratinjau
              </button>
              <button
                onClick={() => { handleDownload(selectedDoc); setSelectedDoc(null); }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 inline-flex items-center space-x-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Dokumen ({selectedDoc.fileSize})</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
