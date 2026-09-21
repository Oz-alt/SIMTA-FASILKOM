import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import SmoothScroll from './components/common/SmoothScroll.jsx';

// Pages
import BerandaPage from './pages/BerandaPage.jsx';
import DokumenPage from './pages/DokumenPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

// Pages
import DashboardMahasiswa from './pages/mahasiswa/DashboardMahasiswa.jsx';
import AjukanJudulPage from './pages/mahasiswa/AjukanJudulPage.jsx';
import StatusJudulPage from './pages/mahasiswa/StatusJudulPage.jsx';
import JadwalRuangPage from './pages/mahasiswa/JadwalRuangPage.jsx';
import AjukanRuangPage from './pages/mahasiswa/AjukanRuangPage.jsx';
import StatusPeminjamanPage from './pages/mahasiswa/StatusPeminjamanPage.jsx';

import DashboardKaprodi from './pages/kaprodi/DashboardKaprodi.jsx';
import TinjauJudulPage from './pages/kaprodi/TinjauJudulPage.jsx';
import KelolaDospemPage from './pages/kaprodi/KelolaDospemPage.jsx';
import KelolaJadwalSidangPage from './pages/kaprodi/KelolaJadwalSidangPage.jsx';
import TinjauRepositoryKaprodi from './pages/kaprodi/TinjauRepositoryKaprodi.jsx';
import BulkImportPage from './pages/kaprodi/BulkImportPage.jsx';
import AnalitikPage from './pages/kaprodi/AnalitikPage.jsx';
import CekAkunMahasiswaPage from './pages/kaprodi/CekAkunMahasiswaPage.jsx';

import DashboardAdmin from './pages/admin/DashboardAdmin.jsx';
import KelolaPeminjamanPage from './pages/admin/KelolaPeminjamanPage.jsx';
import KelolaRuanganPage from './pages/admin/KelolaRuanganPage.jsx';
import PrioritasRuangPage from './pages/admin/PrioritasRuangPage.jsx';
import PublikasiRepositoryAdmin from './pages/admin/PublikasiRepositoryAdmin.jsx';

import ProfilePage from './pages/ProfilePage.jsx';
import ArsipTAPage from './pages/ArsipTAPage.jsx';
import UploadRepositoryPage from './pages/UploadRepositoryPage.jsx';
import BimbinganTAPage from './pages/mahasiswa/BimbinganTAPage.jsx';
import KartuBimbinganPage from './pages/mahasiswa/KartuBimbinganPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SmoothScroll>
          <AppLayout>
            <Routes>
              {/* Beranda & Public Routes */}
              <Route path="/" element={<BerandaPage />} />
              <Route path="/documents" element={<DokumenPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/profile" element={<ProfilePage />} />

              {/* Mahasiswa & Common Archive Routes */}
              <Route path="/dashboard" element={<DashboardMahasiswa />} />
              <Route path="/thesis/submit" element={<AjukanJudulPage />} />
              <Route path="/thesis/status" element={<StatusJudulPage />} />
              <Route path="/thesis/consultations" element={<BimbinganTAPage />} />
              <Route path="/thesis/consultations/card" element={<KartuBimbinganPage />} />
              <Route path="/thesis/archive" element={<ArsipTAPage />} />
              <Route path="/thesis/repository/upload" element={<UploadRepositoryPage />} />
              <Route path="/schedule" element={<JadwalRuangPage />} />
              <Route path="/booking/apply/:stage" element={<AjukanRuangPage />} />
              <Route path="/booking/status" element={<StatusPeminjamanPage />} />

              {/* Kaprodi Routes */}
              <Route path="/kaprodi/dashboard" element={<DashboardKaprodi />} />
              <Route path="/kaprodi/titles" element={<TinjauJudulPage />} />
              <Route path="/kaprodi/advisors" element={<KelolaDospemPage />} />
              <Route path="/kaprodi/defense-schedules" element={<KelolaJadwalSidangPage />} />
              <Route path="/kaprodi/repository/review" element={<TinjauRepositoryKaprodi />} />
              <Route path="/kaprodi/import" element={<BulkImportPage />} />
              <Route path="/kaprodi/check-accounts" element={<CekAkunMahasiswaPage />} />
              <Route path="/kaprodi/analytics" element={<AnalitikPage />} />

              {/* Admin Sarana Routes */}
              <Route path="/admin/dashboard" element={<DashboardAdmin />} />
              <Route path="/admin/bookings" element={<KelolaPeminjamanPage />} />
              <Route path="/admin/rooms" element={<KelolaRuanganPage />} />
              <Route path="/admin/priorities" element={<PrioritasRuangPage />} />
              <Route path="/admin/repository/publish" element={<PublikasiRepositoryAdmin />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        </SmoothScroll>
      </BrowserRouter>
    </AuthProvider>
  );
}


