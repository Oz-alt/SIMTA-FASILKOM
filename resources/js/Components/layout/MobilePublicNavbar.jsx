import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { FileText, LogIn, Monitor, Smartphone } from 'lucide-react';
import unsriLogo from '../../assets/photo/unsri logo.png';
import { useDevice } from '../../context/DeviceContext.jsx';

export default function MobilePublicNavbar() {
  const { url } = usePage();
  const { os, osLabel, setViewPreference } = useDevice();
  const isDocsActive = String(url || '').startsWith('/documents');

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 shadow-2xs">
      <div className="max-w-lg mx-auto px-3.5 h-14 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <img
            src={unsriLogo}
            alt="Logo UNSRI"
            className="h-8 w-auto object-contain shrink-0"
          />
          <div className="min-w-0 leading-tight">
            <div className="font-extrabold text-sm tracking-tight text-slate-900 truncate">
              SIMONITA
            </div>
            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600">
              <Smartphone className="w-2.5 h-2.5" />
              <span>{os === 'desktop' ? 'Mobile UI' : `${osLabel} UI`}</span>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setViewPreference('desktop')}
            title="Beralih ke Tampilan Desktop"
            aria-label="Beralih ke Tampilan Desktop"
            className="w-8 h-8 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>

          <Link
            href="/documents"
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-colors ${
              isDocsActive
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Dokumen</span>
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-xs transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
