import React from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ExternalLink, 
  Globe 
} from 'lucide-react';
import unsriLogo from '../../assets/photo/unsri logo.png';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white pt-14 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Main Footer Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Column 1: Brand & Bio (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center space-x-3">
              <img 
                src={unsriLogo} 
                alt="Logo UNSRI" 
                className="h-12 w-auto object-contain bg-white/10 p-1.5 rounded-xl border border-white/10" 
              />
              <div>
                <h3 className="font-extrabold text-lg tracking-tight text-white uppercase">
                  SIMTA FASILKOM
                </h3>
                <p className="text-xs text-white/80 font-semibold">
                  Universitas Sriwijaya
                </p>
              </div>
            </div>

            <p className="text-xs text-white/90 leading-relaxed pt-1">
              Sistem Informasi Manajemen Tugas Akhir & Ruang Sidang terintegrasi untuk mahasiswa, dosen pembimbing, dan pengelola sarana prasarana Fakultas Ilmu Komputer UNSRI Kampus Bukit Besar.
            </p>

            <div className="pt-2 flex items-center space-x-3 text-xs text-white">
              <a 
                href="https://fasilkom.unsri.ac.id" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-700"
              >
                <Globe className="w-3.5 h-3.5 text-white" />
                <span>fasilkom.unsri.ac.id</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>

          {/* Column 2: Contact Info FASILKOM Bukit (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-2">
              Kontak & Lokasi Kampus
            </h4>

            <ul className="space-y-3 text-xs text-white">
              <li className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <span className="text-white">
                  <strong className="text-white">Kampus Bukit Besar:</strong><br />
                  Jl. Srijaya Negara, Bukit Besar, Kec. Ilir Barat I, Kota Palembang, Sumatera Selatan 30139
                </span>
              </li>

              <li className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-white shrink-0" />
                <span className="text-white">(0711) 354222 / (0711) 379249</span>
              </li>

              <li className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-white shrink-0" />
                <span className="text-white">fasilkom@unsri.ac.id</span>
              </li>

              <li className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-white shrink-0" />
                <span className="text-white">Senin - Jumat, 08:00 - 16:00 WIB</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Interactive Google Maps Embed (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                Peta UNSRI Bukit
              </h4>
              <a 
                href="https://maps.google.com/?q=Fakultas+Ilmu+Komputer+Universitas+Sriwijaya+Bukit+Besar+Palembang" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-white/90 hover:text-white flex items-center space-x-1 underline"
              >
                <span>Buka Google Maps</span>
                <ExternalLink className="w-3 h-3 text-white" />
              </a>
            </div>

            {/* Responsive Full-Color Google Maps Iframe */}
            <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-700 shadow-md relative bg-slate-800">
              <iframe
                title="Peta Fakultas Ilmu Komputer UNSRI Bukit Besar Palembang"
                src="https://maps.google.com/maps?q=Fakultas+Ilmu+Komputer+Universitas+Sriwijaya+Bukit+Besar+Palembang&t=&z=16&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full border-0 transition-all duration-300"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <p className="text-[11px] text-white/90 text-center">
              Fakultas Ilmu Komputer UNSRI Kampus Bukit Besar Palembang
            </p>
          </div>

        </div>

        {/* Bottom Bar Copyright */}
        <div className="pt-8 border-t border-slate-800 text-center text-xs text-white/90">
          © 2026 <strong className="text-white font-bold">Fakultas Ilmu Komputer Universitas Sriwijaya</strong>. All Rights Reserved.
        </div>

      </div>
    </footer>
  );
}
