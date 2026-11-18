import {
  LayoutDashboard,
  FilePlus2,
  ClipboardCheck,
  FileCheck2,
  Archive,
  CalendarDays,
  Users,
  UserCheck,
  BookOpen,
  BarChart3,
  Building2,
  ShieldAlert,
  KeyRound,
  FolderOpen,
  LayoutTemplate,
  Database,
  Globe,
  ClipboardList,
  GraduationCap,
} from 'lucide-react';

/**
 * Determine whether a navigation target matches the current Inertia URL path.
 */
export function isNavPathActive(currentUrl = '', targetPath = '', extraMatches = []) {
  const cleanCurrent = String(currentUrl || '').split('?')[0].replace(/\/+$/, '') || '/';
  const cleanTarget = String(targetPath || '').split('?')[0].replace(/\/+$/, '') || '/';

  if (cleanCurrent === cleanTarget) {
    return true;
  }

  for (const extra of extraMatches) {
    const cleanExtra = String(extra || '').split('?')[0].replace(/\/+$/, '');
    if (cleanExtra && (cleanCurrent === cleanExtra || cleanCurrent.startsWith(`${cleanExtra}/`))) {
      return true;
    }
  }

  return false;
}

/**
 * Full navigation groups per role matching desktop Sidebar routes.
 */
export function getRoleMenuGroups(role) {
  switch (role) {
    case 'mahasiswa':
      return [
        {
          id: 'main',
          label: 'Menu Utama Mahasiswa',
          items: [
            { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, lockable: true },
            {
              label: 'Ajukan Tugas Akhir',
              to: '/thesis/submit',
              icon: FilePlus2,
              extraMatches: ['/thesis/status'],
              lockable: true,
            },
            { label: 'Entry Bimbingan', to: '/thesis/consultations', icon: ClipboardList, lockable: true },
            { label: 'Kartu Bimbingan Digital', to: '/thesis/consultations/card', icon: FileCheck2, lockable: true },
            { label: 'Arsip Tugas Akhir', to: '/thesis/archive', icon: Archive, lockable: true },
          ],
        },
      ];

    case 'kaprodi':
      return [
        {
          id: 'dashboard',
          label: 'Ringkasan',
          items: [{ label: 'Dashboard', to: '/kaprodi/dashboard', icon: LayoutDashboard }],
        },
        {
          id: 'ta',
          label: 'Tugas Akhir',
          items: [
            { label: 'Monitoring Judul', to: '/kaprodi/titles', icon: BookOpen },
            { label: 'Manajemen Jadwal Sidang', to: '/kaprodi/defense-schedules', icon: CalendarDays },
          ],
        },
        {
          id: 'bimbingan',
          label: 'Bimbingan',
          items: [
            { label: 'Monitoring Mahasiswa', to: '/kaprodi/monitoring-mahasiswa', icon: Users },
            { label: 'Rekap Bimbingan', to: '/kaprodi/rekap-bimbingan', icon: ClipboardCheck },
          ],
        },
        {
          id: 'master',
          label: 'Data Master',
          items: [
            { label: 'Data Mahasiswa', to: '/kaprodi/master-data/mahasiswa', icon: GraduationCap },
            { label: 'Data Dosen', to: '/kaprodi/master-data/dosen', icon: UserCheck },
          ],
        },
        {
          id: 'database',
          label: 'Database & Analitik',
          items: [
            { label: 'Arsip Tugas Akhir', to: '/thesis/archive', icon: Archive },
            { label: 'Analitik & Tren Topik', to: '/kaprodi/analytics', icon: BarChart3 },
          ],
        },
      ];

    case 'dosen':
      return [
        {
          id: 'dashboard',
          label: 'Ringkasan',
          items: [{ label: 'Dashboard', to: '/dosen/dashboard', icon: LayoutDashboard }],
        },
        {
          id: 'bimbingan',
          label: 'Manajemen Bimbingan',
          items: [
            { label: 'Progres Mahasiswa', to: '/dosen/mahasiswa', icon: Users },
            { label: 'Evaluasi Bimbingan', to: '/dosen/rekap', icon: ClipboardCheck },
          ],
        },
        {
          id: 'sidang',
          label: 'Jadwal',
          items: [{ label: 'Jadwal Sidang', to: '/dosen/jadwal-sidang', icon: CalendarDays }],
        },
      ];

    case 'admin':
      return [
        {
          id: 'dashboard',
          label: 'Ringkasan',
          items: [{ label: 'Dashboard', to: '/admin-simta/dashboard', icon: LayoutDashboard }],
        },
        {
          id: 'sarana',
          label: 'Ruangan & Sarana',
          items: [
            { label: 'Persetujuan Ruangan', to: '/admin/bookings', icon: ClipboardCheck },
            { label: 'Kelola Ruang & Gedung', to: '/admin/rooms', icon: Building2 },
            { label: 'Prioritas Ruangan', to: '/admin/priorities', icon: ShieldAlert },
            { label: 'Jadwal Ruang Sidang', to: '/schedule', icon: CalendarDays },
          ],
        },
        {
          id: 'master',
          label: 'Data Master',
          items: [
            { label: 'Data Mahasiswa', to: '/admin-simta/master/mahasiswa', icon: GraduationCap },
            { label: 'Data Dosen', to: '/admin-simta/master/dosen', icon: UserCheck },
          ],
        },
        {
          id: 'ta',
          label: 'Tugas Akhir',
          items: [{ label: 'Manajemen Tugas Akhir', to: '/admin-simta/thesis-management', icon: BookOpen }],
        },
        {
          id: 'akun',
          label: 'Manajemen Akun',
          items: [
            { label: 'Akun Mahasiswa', to: '/admin-simta/accounts/mahasiswa', icon: Users },
            { label: 'Akun Dosen', to: '/admin-simta/accounts/dosen', icon: UserCheck },
            { label: 'Permintaan Reset Sandi', to: '/admin-simta/accounts/password-resets', icon: KeyRound },
          ],
        },
        {
          id: 'konten',
          label: 'Konten & Dokumen',
          items: [
            { label: 'Dokumen / Surat', to: '/admin-simta/documents', icon: FolderOpen },
            { label: 'CMS', to: '/admin-simta/cms', icon: LayoutTemplate },
            { label: 'Template', to: '/admin-simta/templates', icon: FileCheck2 },
          ],
        },
        {
          id: 'repo',
          label: 'Database & Repositori',
          items: [
            { label: 'Manajemen Repositori', to: '/admin-simta/repository', icon: Database },
            { label: 'Arsip Tugas Akhir', to: '/thesis/archive', icon: Archive },
            { label: 'Publikasi Repositori Global', to: '/admin/repository/publish', icon: Globe },
          ],
        },
      ];

    default:
      return [];
  }
}

/**
 * Primary 4 bottom navigation tabs per role (5th tab is always "Menu").
 */
export function getMobileBottomTabs(role) {
  switch (role) {
    case 'mahasiswa':
      return [
        { label: 'Beranda', to: '/dashboard', icon: LayoutDashboard, lockable: true },
        {
          label: 'Judul TA',
          to: '/thesis/submit',
          icon: FilePlus2,
          extraMatches: ['/thesis/status'],
          lockable: true,
        },
        { label: 'Bimbingan', to: '/thesis/consultations', icon: ClipboardList, lockable: true },
        { label: 'Kartu', to: '/thesis/consultations/card', icon: FileCheck2, lockable: true },
      ];
    case 'dosen':
      return [
        { label: 'Beranda', to: '/dosen/dashboard', icon: LayoutDashboard },
        { label: 'Mahasiswa', to: '/dosen/mahasiswa', icon: Users },
        { label: 'Evaluasi', to: '/dosen/rekap', icon: ClipboardCheck },
        { label: 'Sidang', to: '/dosen/jadwal-sidang', icon: CalendarDays },
      ];
    case 'kaprodi':
      return [
        { label: 'Beranda', to: '/kaprodi/dashboard', icon: LayoutDashboard },
        { label: 'Judul TA', to: '/kaprodi/titles', icon: BookOpen },
        { label: 'Monitoring', to: '/kaprodi/monitoring-mahasiswa', icon: Users },
        { label: 'Analitik', to: '/kaprodi/analytics', icon: BarChart3 },
      ];
    case 'admin':
      return [
        { label: 'Beranda', to: '/admin-simta/dashboard', icon: LayoutDashboard },
        { label: 'Ruangan', to: '/admin/bookings', icon: Building2 },
        { label: 'Kelola TA', to: '/admin-simta/thesis-management', icon: BookOpen },
        { label: 'Reset PW', to: '/admin-simta/accounts/password-resets', icon: KeyRound },
      ];
    default:
      return [];
  }
}

export function getDefaultDashboardRoute(role) {
  switch (role) {
    case 'admin':
      return '/admin-simta/dashboard';
    case 'kaprodi':
      return '/kaprodi/dashboard';
    case 'dosen':
      return '/dosen/dashboard';
    default:
      return '/dashboard';
  }
}
