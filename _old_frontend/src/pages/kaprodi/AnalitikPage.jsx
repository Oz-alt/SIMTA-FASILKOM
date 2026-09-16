import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { BarChart3, PieChart, TrendingUp, BookOpen, CheckCircle2 } from 'lucide-react';

export default function AnalitikPage() {
  const { thesisTitles, thesisStages } = useAuth();

  const topics = [
    { name: 'Sistem Informasi Management / Web', count: 4, percentage: '45%' },
    { name: 'Aplikasi Mobile (Android/iOS)', count: 3, percentage: '30%' },
    { name: 'Internet of Things / Smart System', count: 2, percentage: '15%' },
    { name: 'Data Mining & Decision Support', count: 1, percentage: '10%' }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          <span>Analitik Tren Topik & Keterpakaian Ruang</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Laporan sebaran topik tugas akhir dan efisiensi waktu perjalanan TA prodi D3 MI.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Topic Trends */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-indigo-600" />
            <span>Sebaran Tren Topik Tugas Akhir</span>
          </h3>

          <div className="space-y-3">
            {topics.map(t => (
              <div key={t.name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{t.name}</span>
                  <span className="text-indigo-600">{t.count} Judul ({t.percentage})</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all"
                    style={{ width: t.percentage }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Thesis Stages Progress Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Progres Kelulusan Tahapan Sidang</span>
          </h3>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex justify-between items-center">
              <div>
                <div className="font-bold text-emerald-900">Seminar Proposal</div>
                <div className="text-[11px] text-emerald-700">100% Mahasiswa Disetujui</div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex justify-between items-center">
              <div>
                <div className="font-bold text-blue-900">Seminar Hasil</div>
                <div className="text-[11px] text-blue-700">75% Dalam Proses Penjadwalan</div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-800">Sidang Akhir</div>
                <div className="text-[11px] text-slate-500">Persiapan Akhir</div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
