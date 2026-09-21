import React, { useState, useEffect, useRef } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  LayoutDashboard, 
  FileText, 
  CheckSquare, 
  CalendarDays, 
  Building2, 
  UploadCloud, 
  BarChart3, 
  ListOrdered, 
  Clock, 
  FileCheck,
  BookOpen,
  GraduationCap,
  Database,
  Globe,
  Settings,
  User,
  UserCheck,
  LogOut,
  ChevronDown,
  Printer,
  FileStack,
  Layers,
  LayoutGrid
} from 'lucide-react';

export default function Sidebar() {
  const { currentUser, logout } = useAuth();
  const { url } = usePage();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  // Group accordion toggle state
  const [openGroups, setOpenGroups] = useState({
    tugas_akhir: true,
    bimbingan: true,
    database: true,
    ruangan: true
  });

  const handleLogout = async () => {
    await logout();
    router.visit('/');
  };

  // Close floating settings popover on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };
    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSettingsOpen]);


  const getMenuGroups = () => {
    switch (currentUser?.role) {
      case 'mahasiswa':
        return {
          dashboard: { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          groups: [
            {
              id: 'tugas_akhir',
              label: 'Tugas Akhir',
              icon: GraduationCap,
              items: [
                { to: '/thesis/submit', label: 'Ajukan Judul TA', icon: FileText },
                { to: '/thesis/status', label: 'Status Judul', icon: Clock }
              ]
            },
            {
              id: 'bimbingan',
              label: 'Bimbingan',
              icon: FileCheck,
              items: [
                { to: '/thesis/consultations', label: 'Bimbingan & Konsultasi', icon: FileCheck },
                { to: '/thesis/consultations/card', label: 'Kartu Bimbingan Digital', icon: Printer }
              ]
            },
            {
              id: 'database',
              label: 'Database',
              icon: Database,
              items: [
                { to: '/thesis/archive', label: 'Arsip Tugas Akhir', icon: BookOpen },
                { to: '/thesis/repository/upload', label: 'Upload Repository TA', icon: UploadCloud }
              ]
            }
          ]
        };

      case 'kaprodi':
        return {
          dashboard: { to: '/kaprodi/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          groups: [
            {
              id: 'tugas_akhir',
              label: 'Tugas Akhir',
              icon: GraduationCap,
              items: [
                { to: '/kaprodi/titles', label: 'Tinjau Judul TA', icon: CheckSquare },
                { to: '/kaprodi/advisors', label: 'Pendataan & Pembagian Dospem', icon: UserCheck },
                { to: '/kaprodi/defense-schedules', label: 'Manajemen Jadwal Sidang', icon: CalendarDays }
              ]
            },
            {
              id: 'bimbingan',
              label: 'Bimbingan',
              icon: FileCheck,
              items: [
                { to: '/thesis/consultations', label: 'Bimbingan & Konsultasi', icon: FileCheck }
              ]
            },
            {
              id: 'database',
              label: 'Database',
              icon: Database,
              items: [
                { to: '/thesis/archive', label: 'Arsip Tugas Akhir', icon: BookOpen },
                { to: '/kaprodi/check-accounts', label: 'Cek Akun Mahasiswa', icon: UserCheck },
                { to: '/kaprodi/repository/review', label: 'Verifikasi Repositori TA', icon: FileCheck },
                { to: '/kaprodi/import', label: 'Bulk Import Historis', icon: UploadCloud },
                { to: '/kaprodi/analytics', label: 'Analitik & Tren Topik', icon: BarChart3 }
              ]
            }
          ]
        };

      case 'admin_sarana':
        return {
          dashboard: { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          groups: [
            {
              id: 'bimbingan',
              label: 'Bimbingan',
              icon: FileCheck,
              items: [
                { to: '/thesis/consultations', label: 'Bimbingan & Konsultasi', icon: FileCheck }
              ]
            },
            {
              id: 'database',
              label: 'Database',
              icon: Database,
              items: [
                { to: '/thesis/archive', label: 'Arsip Tugas Akhir', icon: BookOpen },
                { to: '/admin/repository/publish', label: 'Publikasi Repositori Global', icon: Globe }
              ]
            },
            {
              id: 'ruangan',
              label: 'Ruangan',
              icon: Building2,
              items: [
                { to: '/admin/bookings', label: 'Persetujuan Ruangan', icon: CheckSquare },
                { to: '/admin/rooms', label: 'Kelola Ruang & Gedung', icon: Building2 },
                { to: '/admin/priorities', label: 'Prioritas Ruangan', icon: ListOrdered },
                { to: '/schedule', label: 'Master Schedule Grid', icon: CalendarDays }
              ]
            }
          ]
        };

      case 'dosen':
        return {
          dashboard: { to: '/dosen/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          groups: [
            {
              id: 'bimbingan',
              label: 'Bimbingan Mahasiswa',
              icon: FileCheck,
              items: [
                { to: '/dosen/bimbingan', label: 'Room Bimbingan', icon: FileCheck },
                { to: '/dosen/validasi-judul', label: 'Validasi Judul TA', icon: CheckSquare },
                { to: '/dosen/jadwal-sidang', label: 'Notifikasi & Jadwal', icon: CalendarDays }
              ]
            },
            {
              id: 'database',
              label: 'Database',
              icon: Database,
              items: [
                { to: '/thesis/archive', label: 'Arsip Tugas Akhir', icon: BookOpen }
              ]
            }
          ]
        };

      case 'admin':
        return {
          dashboard: { to: '/admin-simta/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          groups: [
            {
              id: 'konten',
              label: 'Konten & Dokumen',
              icon: Layers,
              items: [
                { to: '/admin-simta/documents', label: 'Dokumen / Surat', icon: FileStack },
                { to: '/admin-simta/cms', label: 'CMS', icon: LayoutGrid },
                { to: '/admin-simta/templates', label: 'Template', icon: FileText }
              ]
            }
          ]
        };

      default:
        return { dashboard: null, groups: [] };
    }
  };

  const menuData = getMenuGroups();

  const isRouteActive = (targetTo) => {
    if (!targetTo || !url) return false;
    const currentPath = url.split('?')[0].replace(/\/+$/, '') || '/';
    const targetPath = targetTo.split('?')[0].replace(/\/+$/, '') || '/';

    if (currentPath === targetPath) return true;

    // For nested subpaths (e.g. /booking/apply/proposal matching /booking/apply):
    // Only match prefix if no other item in the sidebar has an exact match or a longer prefix match.
    if (currentPath.startsWith(targetPath + '/')) {
      const allItems = [
        ...(menuData.dashboard ? [menuData.dashboard] : []),
        ...(menuData.groups?.flatMap(g => g.items) || [])
      ];
      const hasExactMatch = allItems.some(i => {
        const p = (i.to || '').split('?')[0].replace(/\/+$/, '') || '/';
        return p === currentPath;
      });
      if (hasExactMatch) return false;

      const hasMoreSpecificPrefix = allItems.some(i => {
        const p = (i.to || '').split('?')[0].replace(/\/+$/, '') || '/';
        return p !== targetPath && p.length > targetPath.length && currentPath.startsWith(p);
      });
      return !hasMoreSpecificPrefix;
    }

    return false;
  };

  // Auto expand group containing the active page route
  useEffect(() => {
    if (menuData.groups) {
      menuData.groups.forEach(group => {
        if (group.items.some(item => isRouteActive(item.to))) {
          setOpenGroups(prev => ({ ...prev, [group.id]: true }));
        }
      });
    }
  }, [url]);

  const toggleGroup = (groupId) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const DashboardIcon = menuData.dashboard?.icon || LayoutDashboard;

  return (
    <aside 
      data-lenis-prevent
      className="sticky top-16 h-[calc(100vh-4rem)] shrink-0 w-64 bg-white border-r border-slate-200 p-4 hidden md:flex flex-col justify-between select-none overflow-y-auto custom-sidebar-scroll"
    >
      
      {/* Top Navigation Items */}
      <div className="space-y-4 flex-1 pb-4">

        {/* Standalone Dashboard Item */}
        {menuData.dashboard && (
          <div>
            <Link
              href={menuData.dashboard.to}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isRouteActive(menuData.dashboard.to)
                  ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600 shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <DashboardIcon className="w-4 h-4 text-indigo-600" />
              <span>{menuData.dashboard.label}</span>
            </Link>
          </div>
        )}

        <div className="border-t border-slate-100 pt-2 space-y-3">
          {menuData.groups.map((group) => {
            const GroupIcon = group.icon;
            const isOpen = openGroups[group.id] ?? true;

            return (
              <div key={group.id} className="space-y-1">
                {/* Group Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100/70 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center space-x-2.5">
                    <GroupIcon className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                    <span className="tracking-wide uppercase text-[11px] text-slate-600 font-extrabold">{group.label}</span>
                  </div>
                  <ChevronDown 
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-slate-700' : ''
                    }`} 
                  />
                </button>

                {/* Collapsible Sub-items Container */}
                <div 
                  className={`grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
                    isOpen ? 'grid-rows-[1fr] opacity-100 my-1' : 'grid-rows-[0fr] opacity-0 my-0'
                  }`}
                >
                  <div className="min-h-0 pl-2 space-y-1 border-l-2 border-slate-100 ml-4">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = isRouteActive(item.to);
                      return (
                        <Link
                          key={item.to}
                          href={item.to}
                          className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-4 border-indigo-600 shadow-2xs'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Bottom Settings Floating Popover (Overlay above button - does NOT alter sidebar height) */}
      <div ref={settingsRef} className="pt-3 mt-4 border-t border-slate-200 shrink-0 relative">
        
        {/* Floating Popover Dropdown Card */}
        <div 
          className={`absolute bottom-full left-0 w-full mb-2 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 z-50 transition-all duration-200 ease-out origin-bottom ${
            isSettingsOpen 
              ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto shadow-indigo-100/50' 
              : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
          }`}
        >
          <div className="space-y-0.5">
            {/* 1. Profil Option */}
            <Link
              href="/profile"
              onClick={() => setIsSettingsOpen(false)}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                url === '/profile' || url.startsWith('/profile/')
                  ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                  : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4 text-slate-500" />
              <span>Profil Saya</span>
            </Link>

            {/* 2. Logout Option */}
            <button
              type="button"
              onClick={() => {
                setIsSettingsOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Keluar (Logout)</span>
            </button>
          </div>
        </div>

        {/* Toggle Button: Pengaturan */}
        <button
          type="button"
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            isSettingsOpen 
              ? 'bg-indigo-50/80 text-indigo-900 border border-indigo-200/80 shadow-2xs' 
              : 'text-slate-700 hover:bg-slate-100/70 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center space-x-3">
            <Settings className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isSettingsOpen ? 'rotate-90 text-indigo-600' : ''}`} />
            <span>Pengaturan</span>
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
              isSettingsOpen ? 'rotate-180 text-indigo-600' : ''
            }`} 
          />
        </button>

      </div>

    </aside>
  );
}
