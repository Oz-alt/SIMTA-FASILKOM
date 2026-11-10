import React from 'react';
import bannerDosenImg from '../../assets/photo/banner-dosen.png';

export default function DosenHeaderBanner({ 
  title, 
  subtitle = 'SISTEM MONITORING TUGAS AKHIR', 
  rightContent = null,
  className = ''
}) {
  return (
    <div 
      className={`relative overflow-hidden rounded-2xl text-white shadow-md bg-[#182b45] bg-cover bg-left sm:bg-[center_left] min-h-[110px] sm:min-h-[130px] md:min-h-[140px] flex items-center px-4 sm:px-8 py-5 sm:py-6 select-none ${className}`}
      style={{ backgroundImage: `url(${bannerDosenImg})` }}
    >
      {/* Konten Teks & Tombol Aksi: Diberi offset kiri agar tidak bertabrakan dengan elemen grafis 3D di sisi kiri */}
      <div className="relative z-10 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-28 sm:pl-36 md:pl-44 lg:pl-48 pr-2">
        <div>
          <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight text-white leading-snug drop-shadow-xs">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[10px] sm:text-xs font-semibold tracking-wider text-slate-200 uppercase mt-0.5 sm:mt-1 drop-shadow-2xs">
              {subtitle}
            </p>
          )}
        </div>

        {rightContent && (
          <div className="shrink-0 relative z-10">
            {rightContent}
          </div>
        )}
      </div>
    </div>
  );
}

