import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  Printer
} from 'lucide-react';

export default function Sidebar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    navigate('/login');
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
                { to: '/thesis/consultations/card', label: 'Kartu Bimbingan Digital', icon: Printer },
                { to: '/thesis/consultations/schedule', label: 'Jadwal Bimbingan', icon: CalendarDays }
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
            },
            {
              id: 'ruangan',
              label: 'Ruangan',
              icon: Building2,
              items: [
                { to: '/schedule', label: 'Jadwal Ruang Sidang', icon: CalendarDays },
                { to: '/booking/apply/seminar_proposal', label: 'Ajukan Ruang Sidang', icon: FileCheck },
                { to: '/booking/status', label: 'Status Peminjaman', icon: CheckSquare }
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
                { to: '/kaprodi/advisors', label: 'Pendataan & Pembagian Dospem', icon: UserCheck }
              ]
            },
            {
              id: 'bimbingan',
              label: 'Bimbingan',
              icon: FileCheck,
              items: [
                { to: '/thesis/consultations', label: 'Bimbingan & Konsultasi', icon: FileCheck },
                { to: '/thesis/consultations/schedule', label: 'Jadwal Bimbingan', icon: CalendarDays }
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
                { to: '/thesis/consultations', label: 'Bimbingan & Konsultasi', icon: FileCheck },
                { to: '/thesis/consultations/schedule', label: 'Jadwal Bimbingan', icon: CalendarDays }
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

      default:
        return { dashboard: null, groups: [] };
    }
  };

  const menuData = getMenuGroups();

  // Auto expand group containing the active page route
  useEffect(() => {
    if (menuData.groups) {
      menuData.groups.forEach(group => {
        if (group.items.some(item => location.pathname === item.to || location.pathname.startsWith(item.to + '/'))) {
          setOpenGroups(prev => ({ ...prev, [group.id]: true }));
        }
      });
    }
  }, [location.pathname]);

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
            <NavLink
              to={menuData.dashboard.to}
              end={true}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600 shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <DashboardIcon className="w-4 h-4 text-indigo-600" />
              <span>{menuData.dashboard.label}</span>
            </NavLink>
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
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={true}
                          className={({ isActive }) =>
                            `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                              isActive
                                ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-4 border-indigo-600 shadow-2xs'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`
                          }
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{item.label}</span>
                        </NavLink>
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
            <NavLink
              to="/profile"
              end={true}
              onClick={() => setIsSettingsOpen(false)}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                }`
              }
            >
              <User className="w-4 h-4 text-slate-500" />
              <span>Profil Saya</span>
            </NavLink>

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
