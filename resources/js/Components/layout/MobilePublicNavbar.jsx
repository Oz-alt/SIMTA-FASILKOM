import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { FileText, LogIn } from 'lucide-react';
import unsriLogo from '../../assets/photo/unsri logo.png';

export default function MobilePublicNavbar() {
  const { url } = usePage();
  const isDocsActive = String(url || '').startsWith('/documents');

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 shadow-sm">
      <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <img
            src={unsriLogo}
            alt="Logo UNSRI"
            className="h-9 w-auto object-contain shrink-0"
          />
          <div className="min-w-0 leading-tight">
            <div className="font-extrabold text-sm tracking-tight text-slate-900 truncate">
              SIMONITA
            </div>
            <div className="text-[10px] font-semibold text-slate-500 truncate">
              FASILKOM UNSRI
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/documents"
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
