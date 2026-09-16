import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import Papa from 'papaparse';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function BulkImportPage() {
  const { historicalTitles, bulkImportHistorical } = useAuth();
  const [parsedData, setParsedData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParsedData(results.data);
      }
    });
  };

  const handleImport = () => {
    if (parsedData.length === 0) return;
    bulkImportHistorical(parsedData);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setParsedData([]);
      setFileName('');
    }, 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <UploadCloud className="w-5 h-5 text-indigo-600" />
          <span>Bulk Import Data Judul Historis (Excel / CSV)</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Unggah berkas arsip judul TA terdahulu untuk memperkaya dataset Similarity Check Engine.
        </p>
      </div>

      {/* Upload Box */}
      <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-4 hover:border-indigo-400 transition-colors">
        <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <FileSpreadsheet className="w-6 h-6" />
        </div>

        <div>
          <label className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer">
            <span>Pilih Berkas CSV / Excel</span>
            <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} className="hidden" />
          </label>
          <p className="text-[11px] text-slate-400 mt-1">Format kolom minimal: <code>judul</code>, <code>tahun_angkatan</code>, <code>penulis</code></p>
        </div>

        {fileName && (
          <div className="text-xs font-semibold text-slate-800 bg-slate-100 py-1.5 px-3 rounded-lg inline-block">
            Terpilih: {fileName} ({parsedData.length} baris terdeteksi)
          </div>
        )}
      </div>

      {/* Import Success Alert */}
      {isSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Berhasil mengimpor {parsedData.length} judul historis baru ke database!</span>
        </div>
      )}

      {/* Preview Table */}
      {parsedData.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Preview Data Hasil Import</h3>
            <button
              onClick={handleImport}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Proses Impor Ke Database
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px]">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Judul TA</th>
                  <th className="py-2.5 px-3">Penulis</th>
                  <th className="py-2.5 px-3">Tahun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedData.slice(0, 10).map((row, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{row.judul}</td>
                    <td className="py-2.5 px-3 text-slate-600">{row.penulis || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-600">{row.tahun_angkatan || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Existing Historical Database */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Daftar Arsip Judul Historis Terdaftar ({historicalTitles.length})
        </h3>

        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {historicalTitles.map(h => (
            <div key={h.id} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-slate-900">{h.judul}</div>
                <div className="text-[11px] text-slate-500">{h.penulis} • Angkatan {h.tahun_angkatan}</div>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                Verified
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
