import React, { createContext, useContext, useState, useEffect } from "react";
import {
  MOCK_USERS,
  MOCK_THESIS_TITLES,
  MOCK_THESIS_STAGES,
  MOCK_BOOKINGS,
  MOCK_HISTORICAL_TITLES,
  MOCK_BUILDINGS,
  MOCK_ROOMS,
  MOCK_ROOM_PRIORITIES,
  MOCK_NOTIFICATIONS,
  MOCK_DEPARTMENTS,
  MOCK_THESIS_ARCHIVES,
  MOCK_THESIS_REPOSITORIES,
  MOCK_CONSULTATIONS,
  MOCK_ADVISORS,
  MOCK_STUDENT_ADVISORS,
  MOCK_ADMIN_DOCUMENTS,
  MOCK_ADMIN_CMS,
  MOCK_ADMIN_TEMPLATES,
  MOCK_DEFENSE_SCHEDULES,
  MOCK_BIMBINGAN_REMINDER_LOGS
} from "../services/mockData.js";
import { calculateBimbinganReminder } from "../lib/bimbinganReminder.js";
const AuthContext = createContext();
const runLegacyPhoneMigration = () => {
  const FLAG = "simta_phone_defaults_cleared_v1";
  try {
    if (localStorage.getItem(FLAG)) return;
    const clearList = (raw) => {
      if (!raw) return raw;
      try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return raw;
        return JSON.stringify(parsed.map((u) => u && u.no_hp ? { ...u, no_hp: "" } : u));
      } catch {
        return raw;
      }
    };
    const regKey = "simta_registered_users";
    const regRaw = localStorage.getItem(regKey);
    if (regRaw) localStorage.setItem(regKey, clearList(regRaw));
    const activeKey = "simta_active_user";
    const activeRaw = localStorage.getItem(activeKey);
    if (activeRaw) {
      try {
        const parsedActive = JSON.parse(activeRaw);
        if (parsedActive && parsedActive.no_hp) {
          localStorage.setItem(activeKey, JSON.stringify({ ...parsedActive, no_hp: "" }));
        }
      } catch {
      }
    }
    localStorage.setItem(FLAG, "1");
  } catch {
  }
};
runLegacyPhoneMigration();
import { supabase, isSupabaseConfigured } from "../services/supabase.js";
const generateRowId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `title-${Date.now()}`;
};
const normalizeThesisTitleRecord = (row) => {
  if (!row) return row;
  const score = row.skor_kemiripan_terakhir ?? row.skor_similarity ?? 0;
  const d1Nama = row.pembimbing_1_nama || row.pembimbing_1 || "";
  const d2Nama = row.pembimbing_2_nama || row.pembimbing_2 || "";
  return {
    ...row,
    judul: row.judul || "",
    deskripsi: row.deskripsi || "",
    abstrak: row.abstrak || row.deskripsi || "",
    judul_processed: row.judul_processed || "",
    status: row.status || "tinjauan",
    skor_kemiripan_terakhir: Number(score) || 0,
    mhs_nim: row.mhs_nim || "",
    mhs_nama: row.mhs_nama || "",
    mhs_kelas: row.mhs_kelas || "",
    prodi: row.prodi || "D3 Manajemen Informatika",
    angkatan: row.angkatan || "",
    pembimbing_1_nip: row.pembimbing_1_nip || "",
    pembimbing_2_nip: row.pembimbing_2_nip || "",
    pembimbing_1_nama: d1Nama,
    pembimbing_2_nama: d2Nama,
    pembimbing_1: d1Nama,
    pembimbing_2: d2Nama,
    dospem_confirmed: Boolean(row.dospem_confirmed),
    catatan_kaprodi: row.catatan_kaprodi || "",
    catatan_dospem: row.catatan_dospem || "",
    rekomendasi_dospem_status: row.rekomendasi_dospem_status || "menunggu_validasi",
    riwayat_revisi: Array.isArray(row.riwayat_revisi) ? row.riwayat_revisi : [],
    status_kelulusan: row.status_kelulusan || "aktif_proses",
    status_sidang: row.status_sidang || "bimbingan",
    jadwal_sidang: row.jadwal_sidang || null,
    created_at: row.created_at || (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: row.updated_at || row.created_at || (/* @__PURE__ */ new Date()).toISOString()
  };
};
const enrichThesisTitleRecord = (title, profiles = [], advisorRows = []) => {
  if (!title) return title;
  if (title.mhs_nama && title.mhs_kelas) return title;
  const profile = (profiles || []).find(
    (p) => title.profile_id && String(p.id) === String(title.profile_id) || title.mhs_nim && String(p.nim || p.nip || "") === String(title.mhs_nim)
  );
  const advisorRow = (advisorRows || []).find(
    (sa) => title.mhs_nim && String(sa.student_nim || "").trim() === String(title.mhs_nim).trim()
  );
  const mhsNama = title.mhs_nama || profile?.nama || advisorRow?.student_nama || "";
  const mhsNim = title.mhs_nim || profile?.nim || profile?.nip || advisorRow?.student_nim || "";
  if (!mhsNama && !mhsNim) return title;
  return {
    ...title,
    mhs_nama: mhsNama,
    mhs_nim: mhsNim,
    mhs_kelas: title.mhs_kelas || profile?.kelas || advisorRow?.kelas || "",
    prodi: title.prodi || profile?.prodi || advisorRow?.prodi || "D3 Manajemen Informatika"
  };
};
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const toProfileUuid = (value) => value && UUID_PATTERN.test(String(value)) ? String(value) : null;
const buildMinimalThesisTitlePayload = (title) => ({
  id: title.id,
  profile_id: toProfileUuid(title.profile_id),
  judul: title.judul || "",
  deskripsi: title.deskripsi || "",
  judul_processed: title.judul_processed || "",
  status: title.status || "tinjauan",
  skor_kemiripan_terakhir: Number(title.skor_kemiripan_terakhir) || 0,
  updated_at: (/* @__PURE__ */ new Date()).toISOString()
});
const isMissingColumnError = (error) => {
  if (!error) return false;
  const code = String(error.code || "");
  const message = String(error.message || "");
  return code === "42703" || code === "PGRST204" || message.includes("does not exist") || message.includes("Could not find the");
};
const buildThesisTitlePayload = (title) => ({
  id: title.id,
  profile_id: toProfileUuid(title.profile_id),
  judul: title.judul || "",
  deskripsi: title.deskripsi || "",
  abstrak: title.abstrak || title.deskripsi || "",
  judul_processed: title.judul_processed || "",
  status: title.status || "tinjauan",
  skor_kemiripan_terakhir: Number(title.skor_kemiripan_terakhir) || 0,
  mhs_nim: title.mhs_nim || null,
  mhs_nama: title.mhs_nama || null,
  mhs_kelas: title.mhs_kelas || null,
  prodi: title.prodi || "D3 Manajemen Informatika",
  angkatan: title.angkatan || null,
  pembimbing_1_nip: title.pembimbing_1_nip || null,
  pembimbing_1_nama: title.pembimbing_1_nama || title.pembimbing_1 || null,
  pembimbing_2_nip: title.pembimbing_2_nip || null,
  pembimbing_2_nama: title.pembimbing_2_nama || title.pembimbing_2 || null,
  dospem_confirmed: Boolean(title.dospem_confirmed),
  dospem_confirmed_at: title.dospem_confirmed_at || null,
  catatan_kaprodi: title.catatan_kaprodi || "",
  catatan_dospem: title.catatan_dospem || "",
  rekomendasi_dospem_status: title.rekomendasi_dospem_status || null,
  rekomendasi_oleh: title.rekomendasi_oleh || null,
  riwayat_revisi: Array.isArray(title.riwayat_revisi) ? title.riwayat_revisi : [],
  status_kelulusan: title.status_kelulusan || "aktif_proses",
  status_sidang: title.status_sidang || "bimbingan",
  nilai_sidang: title.nilai_sidang || null,
  tanggal_lulus: title.tanggal_lulus || null,
  no_sk_lulus: title.no_sk_lulus || null,
  jadwal_sidang: title.jadwal_sidang || null,
  updated_at: (/* @__PURE__ */ new Date()).toISOString()
});
export function AuthProvider({ children }) {
  const sanitizeProfile = (user) => {
    if (!user) return null;
    let cleanNama = user.nama;
    if (user.role === "kaprodi" || user.id === "user-kaprodi-abdiansah" || user.username && user.username.toLowerCase() === "koprodi") {
      let waLink = user.link_wa_group;
      if (!waLink) {
        try {
          const advs = JSON.parse(localStorage.getItem("simta_advisors") || "[]");
          const matched = advs.find((a) => String(a.nip) === "198410012009121005");
          waLink = matched?.link_wa_group || "https://chat.whatsapp.com/BimbinganTA-DrAbdiansah";
        } catch {
          waLink = "https://chat.whatsapp.com/BimbinganTA-DrAbdiansah";
        }
      }
      return {
        ...user,
        id: "user-kaprodi-abdiansah",
        username: "Koprodi",
        nama: "Dr. Abdiansah, S.Kom., M.Cs.",
        role: "kaprodi",
        email: user.email || "koprodi@unsri.ac.id",
        nip: "198410012009121005",
        nim: "198410012009121005",
        kelas: "Dosen / Kaprodi",
        prodi: "D3 Manajemen Informatika",
        link_wa_group: waLink
      };
    }
    if (user.role === "dosen") {
      const isAbdiansah = user.nip === "198410012009121005" || user.nim === "198410012009121005" || user.email && user.email.toLowerCase() === "abdiansah@unsri.ac.id" || user.id === "user-dosen-abdiansah";
      if (isAbdiansah) {
        let waLink2 = user.link_wa_group;
        if (!waLink2) {
          try {
            const advs = JSON.parse(localStorage.getItem("simta_advisors") || "[]");
            const matched = advs.find((a) => String(a.nip) === "198410012009121005");
            waLink2 = matched?.link_wa_group || "https://chat.whatsapp.com/BimbinganTA-DrAbdiansah";
          } catch {
            waLink2 = "https://chat.whatsapp.com/BimbinganTA-DrAbdiansah";
          }
        }
        return {
          ...user,
          id: "user-dosen-abdiansah",
          nama: "Dr. Abdiansah, S.Kom., M.Cs.",
          role: "dosen",
          email: "abdiansah@unsri.ac.id",
          nip: "198410012009121005",
          nim: "198410012009121005",
          kelas: "Dosen Pembimbing",
          prodi: "D3 Manajemen Informatika",
          link_wa_group: waLink2
        };
      }
      const uNip = user.nip || user.nim;
      let waLink = user.link_wa_group;
      if (waLink === void 0 && uNip) {
        try {
          const advs = JSON.parse(localStorage.getItem("simta_advisors") || "[]");
          const matched = advs.find((a) => String(a.nip) === String(uNip));
          waLink = matched?.link_wa_group || "";
        } catch {
        }
      }
      return {
        ...user,
        nama: cleanNama || "Dosen Pembimbing",
        role: "dosen",
        email: user.email || `${uNip}@unsri.ac.id`,
        nip: uNip,
        nim: uNip,
        kelas: "Dosen Pembimbing",
        link_wa_group: waLink !== void 0 ? waLink : ""
      };
    }
    if (user.role === "admin_sarana") {
      if (!cleanNama || cleanNama === "Mahasiswa UNSRI" || cleanNama === "Pengguna SIMTA" || cleanNama === "Aulia Azzahra" || /^\d+$/.test(cleanNama)) {
        cleanNama = "Budi Santoso, S.Kom. (Admin Ruang)";
      }
      return {
        ...user,
        nama: cleanNama,
        role: "admin_sarana",
        kelas: "Admin Sarana"
      };
    }
    if (user.role === "admin") {
      if (!cleanNama || cleanNama === "Mahasiswa UNSRI" || cleanNama === "Pengguna SIMTA" || cleanNama === "Aulia Azzahra" || /^\d+$/.test(cleanNama)) {
        cleanNama = "Rina Agustina, S.Kom. (Admin SIMTA)";
      }
      return {
        ...user,
        nama: cleanNama,
        role: "admin",
        kelas: "Admin SIMTA"
      };
    }
    if (!cleanNama || cleanNama === "Mahasiswa UNSRI" || cleanNama === "Pengguna SIMTA" || cleanNama === "Dr. Abdiansah, S.Kom., M.Cs." || /^\d+$/.test(cleanNama)) {
      cleanNama = "AULIA AZZAHRA";
    }
    let cleanNim = user.nim || "09010182428002";
    if (cleanNim === "090108148002") {
      cleanNim = "09010182428002";
    }
    let cleanEmail = user.email;
    if (user.role === "mahasiswa" || !user.role) {
      if (!cleanEmail || cleanEmail.includes("@student.unsri.ac.id")) {
        cleanEmail = `${cleanNim}@student.unsri.ac.id`;
      }
    }
    const isProfileCompleted = user.is_profile_completed === true;
    return {
      ...user,
      nama: cleanNama,
      nim: cleanNim,
      email: cleanEmail,
      is_profile_completed: isProfileCompleted
    };
  };
  const getRegisteredUsers = () => {
    try {
      const saved = localStorage.getItem("simta_registered_users");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.filter(
            (u) => u && u.id !== "user-kaprodi-hendra" && !String(u.nama || "").includes("Hendra Kusuma") && String(u.nip || "") !== "197805122005011002" && String(u.email || "") !== "kaprodi.mi@unsri.ac.id"
          );
          const kaprodiIdx = cleaned.findIndex((u) => u.role === "kaprodi");
          const kaprodiObj = {
            id: "user-kaprodi-abdiansah",
            username: "Koprodi",
            nama: "Dr. Abdiansah, S.Kom., M.Cs.",
            nim: "198410012009121005",
            nip: "198410012009121005",
            email: "koprodi@unsri.ac.id",
            password: "Koprodi123",
            role: "kaprodi",
            kelas: "Dosen / Kaprodi",
            prodi: "D3 Manajemen Informatika"
          };
          if (kaprodiIdx >= 0) {
            cleaned[kaprodiIdx] = { ...cleaned[kaprodiIdx], ...kaprodiObj };
          } else {
            cleaned.unshift(kaprodiObj);
          }
          const dosenAbdiansahIdx = cleaned.findIndex((u) => u.role === "dosen" && String(u.nip) === "198410012009121005");
          const dosenAbdiansahObj = {
            id: "user-dosen-abdiansah",
            nama: "Dr. Abdiansah, S.Kom., M.Cs.",
            nim: "198410012009121005",
            nip: "198410012009121005",
            email: "abdiansah@unsri.ac.id",
            password: "198410012009121005",
            role: "dosen",
            kelas: "Dosen Pembimbing",
            prodi: "D3 Manajemen Informatika"
          };
          if (dosenAbdiansahIdx >= 0) {
            cleaned[dosenAbdiansahIdx] = { ...cleaned[dosenAbdiansahIdx], ...dosenAbdiansahObj };
          } else {
            cleaned.push(dosenAbdiansahObj);
          }
          const adminSimtaIdx = cleaned.findIndex((u) => u.role === "admin" || u.id === "user-admin-simta");
          if (adminSimtaIdx >= 0) {
            cleaned[adminSimtaIdx] = { ...cleaned[adminSimtaIdx], username: cleaned[adminSimtaIdx].username || "admin" };
          }
          const adminSaranaIdx = cleaned.findIndex((u) => u.role === "admin_sarana" || u.id === "user-admin-sarana");
          if (adminSaranaIdx >= 0) {
            cleaned[adminSaranaIdx] = { ...cleaned[adminSaranaIdx], username: cleaned[adminSaranaIdx].username || "admin_sarana" };
          }
          const sanitizedList = cleaned.map((u) => sanitizeProfile);
          const uniqueMap = /* @__PURE__ */ new Map();
          sanitizedList.forEach((u) => {
            if (u && u.nama) {
              const key = u.role === "mahasiswa" ? `mhs-${u.nim || u.nama}` : u.id || `${u.role}-${u.nip}`;
              uniqueMap.set(key, u);
            }
          });
          const deduplicated = Array.from(uniqueMap.values());
          localStorage.setItem("simta_registered_users", JSON.stringify(deduplicated));
          return deduplicated;
        }
      }
    } catch {
    }
    const defaultRegistered = [
      {
        id: "user-kaprodi-abdiansah",
        username: "Koprodi",
        nama: "Dr. Abdiansah, S.Kom., M.Cs.",
        nim: "198410012009121005",
        nip: "198410012009121005",
        email: "koprodi@unsri.ac.id",
        password: "Koprodi123",
        role: "kaprodi",
        kelas: "Dosen / Kaprodi",
        prodi: "D3 Manajemen Informatika"
      },
      {
        id: "user-dosen-abdiansah",
        nama: "Dr. Abdiansah, S.Kom., M.Cs.",
        nim: "198410012009121005",
        nip: "198410012009121005",
        email: "abdiansah@unsri.ac.id",
        password: "198410012009121005",
        role: "dosen",
        kelas: "Dosen Pembimbing",
        prodi: "D3 Manajemen Informatika"
      },
      {
        id: "user-admin-simta",
        username: "admin",
        nama: "Rina Agustina, S.Kom. (Admin SIMTA)",
        nim: "198503152010122001",
        nip: "198503152010122001",
        email: "admin.simta@unsri.ac.id",
        password: "198503152010122001",
        role: "admin",
        kelas: "Admin SIMTA"
      },
      {
        id: "user-admin-sarana",
        username: "admin_sarana",
        nama: "Budi Santoso, S.Kom. (Admin Ruang)",
        nim: "198204102008121003",
        nip: "198204102008121003",
        email: "admin.sarana@unsri.ac.id",
        password: "198204102008121003",
        role: "admin_sarana",
        kelas: "Admin Sarana"
      },
      {
        id: "user-mhs-aulia",
        nama: "AULIA AZZAHRA",
        nim: "09010182428002",
        email: "09010182428002@student.unsri.ac.id",
        password: "09010182428002",
        role: "mahasiswa",
        kelas: "MI 2024",
        no_hp: "",
        is_profile_completed: false
      }
    ];
    try {
      localStorage.setItem("simta_registered_users", JSON.stringify(defaultRegistered));
    } catch {
    }
    return defaultRegistered;
  };
  const getSavedUser = () => {
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    let requiredRole = null;
    if (path.startsWith("/kaprodi")) requiredRole = "kaprodi";
    else if (path.startsWith("/admin-simta")) requiredRole = "admin";
    else if (path.startsWith("/admin-sarana") || path === "/admin/dashboard" || path.startsWith("/admin/")) requiredRole = "admin_sarana";
    else if (path.startsWith("/dosen")) requiredRole = "dosen";
    try {
      const saved = localStorage.getItem("simta_active_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.id === "user-kaprodi-hendra" || String(parsed.nama || "").includes("Hendra Kusuma") || String(parsed.nip || "") === "197805122005011002") {
          localStorage.removeItem("simta_active_user");
        } else {
          const clean = sanitizeProfile(parsed);
          if (clean) {
            if (!requiredRole || clean.role === requiredRole) {
              localStorage.setItem("simta_active_user", JSON.stringify(clean));
              return clean;
            }
          }
        }
      }
    } catch {
    }
    const registered = getRegisteredUsers();
    if (requiredRole) {
      return registered.find((u) => u.role === requiredRole) || registered[0] || null;
    }
    return registered[0] || null;
  };
  const saveRegisteredUser = (user) => {
    try {
      const users = getRegisteredUsers();
      const existingIdx = users.findIndex(
        (u) => u.id === user.id || u.role === user.role && (u.username && user.username && u.username.toLowerCase() === user.username.toLowerCase() || u.email === user.email || u.nim && u.nim === user.nim)
      );
      if (existingIdx >= 0) {
        users[existingIdx] = { ...users[existingIdx], ...user };
      } else {
        users.unshift(user);
      }
      localStorage.setItem("simta_registered_users", JSON.stringify(users));
    } catch (e) {
      console.warn("Failed to save registered user locally:", e);
    }
  };
  const [currentUser, setCurrentUserState] = useState(getSavedUser);
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getSavedUser());
  const setCurrentUser = (user) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem("simta_active_user", JSON.stringify(user));
      saveRegisteredUser(user);
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem("simta_active_user");
      setIsAuthenticated(false);
    }
  };
  const updateUserProfile = async (updatedFields) => {
    if (!currentUser) return;
    const merged = { ...currentUser, ...updatedFields };
    setCurrentUser(merged);
    const userNip = merged.nip || merged.nim;
    if (userNip && (merged.role === "dosen" || merged.role === "kaprodi")) {
      setAdvisors((prev) => {
        const updated = prev.map((adv) => {
          if (String(adv.nip).trim() === String(userNip).trim()) {
            return { ...adv, ...updatedFields };
          }
          return adv;
        });
        try {
          localStorage.setItem("simta_advisors", JSON.stringify(updated));
        } catch {
        }
        return updated;
      });
    }
    if (merged.role === "mahasiswa") {
      const userNim = String(merged.nim || merged.id || "").trim();
      setDbProfiles((prev) => prev.map((p) => {
        if (String(p.id) === userNim || String(p.nim) === userNim || String(p.id) === String(merged.id)) {
          return { ...p, ...updatedFields };
        }
        return p;
      }));
    }
    if (isSupabaseConfigured && supabase) {
      try {
        const { password, is_profile_completed, ...safeFields } = updatedFields;
        if (currentUser.id && Object.keys(safeFields).length > 0) {
          const { error } = await supabase.from("profiles").update(safeFields).eq("id", currentUser.id);
          if (error) {
            console.warn("Supabase profile update warning:", error.message);
          }
        }
        if (password) {
          try {
            await supabase.auth.updateUser({ password });
          } catch (passErr) {
            console.warn("Supabase auth password update warning:", passErr);
          }
        }
        if (userNip && (merged.role === "dosen" || merged.role === "kaprodi")) {
          const { error: advError } = await supabase.from("advisors").update(safeFields).eq("nip", userNip);
          if (advError) {
            console.warn("Supabase advisor update warning:", advError.message);
          }
        }
      } catch (err) {
        console.warn("Failed to sync profile update to Supabase:", err);
      }
    }
  };
  const [thesisTitles, setThesisTitles] = useState(() => {
    if (isSupabaseConfigured) return [];
    try {
      const saved = localStorage.getItem("simta_thesis_titles");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((p) => p.id));
          const missingMocks = MOCK_THESIS_TITLES.filter((m) => !existingIds.has(m.id));
          const hydrated = parsed.map((item) => {
            const mock = MOCK_THESIS_TITLES.find((m) => m.id === item.id);
            if (!mock) return item;
            return {
              ...mock,
              ...item,
              prodi: item.prodi || mock.prodi || "D3 Manajemen Informatika",
              angkatan: item.angkatan || mock.angkatan || "2023",
              status_kelulusan: item.status_kelulusan || mock.status_kelulusan || (item.status === "disetujui" && (item.id === "title-101" || item.id === "title-107" || item.id === "title-108") ? "lulus" : "aktif_proses"),
              status_sidang: item.status_sidang || mock.status_sidang || (item.id === "title-101" || item.id === "title-107" || item.id === "title-108" ? "selesai" : item.id === "title-106" ? "terjadwal" : item.id === "title-104" ? "siap_daftar" : "bimbingan"),
              nilai_sidang: item.nilai_sidang !== void 0 ? item.nilai_sidang : mock.nilai_sidang,
              tanggal_lulus: item.tanggal_lulus !== void 0 ? item.tanggal_lulus : mock.tanggal_lulus,
              no_sk_lulus: item.no_sk_lulus !== void 0 ? item.no_sk_lulus : mock.no_sk_lulus,
              jadwal_sidang: item.jadwal_sidang || mock.jadwal_sidang
            };
          });
          return [...hydrated, ...missingMocks];
        }
      }
    } catch {
    }
    return MOCK_THESIS_TITLES;
  });
  useEffect(() => {
    if (isSupabaseConfigured) return;
    try {
      localStorage.setItem("simta_thesis_titles", JSON.stringify(thesisTitles));
    } catch {
    }
  }, [thesisTitles]);
  const persistThesisTitle = async (record) => {
    if (!isSupabaseConfigured || !supabase || !record) return;
    try {
      const { error } = await supabase.from("thesis_titles").upsert(buildThesisTitlePayload(record), { onConflict: "id" });
      if (isMissingColumnError(error)) {
        const { error: minimalError } = await supabase.from("thesis_titles").upsert(buildMinimalThesisTitlePayload(record), { onConflict: "id" });
        if (minimalError) {
          console.warn("Gagal menyimpan thesis_titles (mode minimal):", minimalError.message);
        } else {
          console.warn("thesis_titles tersimpan dengan kolom inti saja. Jalankan scripts/thesis_titles_realtime.sql agar data lengkap tersimpan.");
        }
        return;
      }
      if (error) {
        console.warn("Gagal menyimpan thesis_titles ke Supabase:", error.message, error.details || "");
      }
    } catch (err) {
      console.warn("Gagal menyimpan thesis_titles ke Supabase:", err);
    }
  };
  const persistThesisTitles = async (records) => {
    if (!isSupabaseConfigured || !supabase || !Array.isArray(records) || records.length === 0) return;
    try {
      const { error } = await supabase.from("thesis_titles").upsert(records.map(buildThesisTitlePayload), { onConflict: "id" });
      if (isMissingColumnError(error)) {
        const { error: minimalError } = await supabase.from("thesis_titles").upsert(records.map(buildMinimalThesisTitlePayload), { onConflict: "id" });
        if (minimalError) {
          console.warn("Gagal menyimpan thesis_titles (mode minimal):", minimalError.message);
        }
        return;
      }
      if (error) {
        console.warn("Gagal menyimpan thesis_titles ke Supabase:", error.message, error.details || "");
      }
    } catch (err) {
      console.warn("Gagal menyimpan thesis_titles ke Supabase:", err);
    }
  };
  const deleteThesisTitleRecord = async (titleId) => {
    if (!isSupabaseConfigured || !supabase || !titleId) return;
    try {
      const { error } = await supabase.from("thesis_titles").delete().eq("id", titleId);
      if (error) {
        console.warn("Gagal menghapus thesis_titles dari Supabase:", error.message);
      }
    } catch (err) {
      console.warn("Gagal menghapus thesis_titles dari Supabase:", err);
    }
  };
  const [historicalTitles, setHistoricalTitles] = useState(MOCK_HISTORICAL_TITLES);
  const [thesisStages, setThesisStages] = useState(MOCK_THESIS_STAGES);
  const [bookings, setBookings] = useState(MOCK_BOOKINGS);
  const [rooms, setRooms] = useState(MOCK_ROOMS);
  const [buildings, setBuildings] = useState(MOCK_BUILDINGS);
  const [roomPriorities, setRoomPriorities] = useState(MOCK_ROOM_PRIORITIES);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [bimbinganReminderLogs, setBimbinganReminderLogs] = useState(() => {
    try {
      const saved = localStorage.getItem("simta_bimbingan_reminders");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
    }
    return MOCK_BIMBINGAN_REMINDER_LOGS || [];
  });
  useEffect(() => {
    try {
      localStorage.setItem("simta_bimbingan_reminders", JSON.stringify(bimbinganReminderLogs));
    } catch {
    }
  }, [bimbinganReminderLogs]);
  const [submissionBroadcastLogs, setSubmissionBroadcastLogs] = useState(() => {
    try {
      const saved = localStorage.getItem("simta_submission_broadcast_logs");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
    }
    return [];
  });
  useEffect(() => {
    try {
      localStorage.setItem("simta_submission_broadcast_logs", JSON.stringify(submissionBroadcastLogs));
    } catch {
    }
  }, [submissionBroadcastLogs]);
  const [defenseSchedules, setDefenseSchedules] = useState(() => {
    try {
      const saved = localStorage.getItem("simta_defense_schedules");
      if (saved) return JSON.parse(saved);
    } catch {
    }
    return MOCK_DEFENSE_SCHEDULES;
  });
  const addDefenseSchedule = (data) => {
    const newSchedule = {
      id: `sch-${Date.now()}`,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      status: data.status || "terjadwal",
      ...data
    };
    setDefenseSchedules((prev) => {
      const updated = [newSchedule, ...prev];
      try {
        localStorage.setItem("simta_defense_schedules", JSON.stringify(updated));
      } catch {
      }
      return updated;
    });
    return newSchedule;
  };
  const updateDefenseSchedule = (id, fields) => {
    setDefenseSchedules((prev) => {
      const updated = prev.map((s) => s.id === id ? { ...s, ...fields, updated_at: (/* @__PURE__ */ new Date()).toISOString() } : s);
      try {
        localStorage.setItem("simta_defense_schedules", JSON.stringify(updated));
      } catch {
      }
      return updated;
    });
  };
  const deleteDefenseSchedule = (id) => {
    setDefenseSchedules((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem("simta_defense_schedules", JSON.stringify(updated));
      } catch {
      }
      return updated;
    });
  };
  const [adminDocuments, setAdminDocuments] = useState(MOCK_ADMIN_DOCUMENTS);
  const addAdminDocument = async (data) => {
    const doc = {
      id: `doc-${Date.now()}`,
      ...data,
      tanggal_upload: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      uploader: "Admin SIMTA",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    setAdminDocuments((prev) => [doc, ...prev]);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("admin_documents").insert([doc]);
      if (error) console.warn("Supabase admin_documents insert warning:", error.message);
    }
    return doc;
  };
  const updateAdminDocument = async (id, fields) => {
    const updated_at = (/* @__PURE__ */ new Date()).toISOString();
    setAdminDocuments((prev) => prev.map((d) => d.id === id ? { ...d, ...fields, updated_at } : d));
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("admin_documents").update({ ...fields, updated_at }).eq("id", id);
      if (error) console.warn("Supabase admin_documents update warning:", error.message);
    }
  };
  const deleteAdminDocument = async (id) => {
    setAdminDocuments((prev) => prev.filter((d) => d.id !== id));
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("admin_documents").delete().eq("id", id);
      if (error) console.warn("Supabase admin_documents delete warning:", error.message);
    }
  };
  const [adminCmsContents, setAdminCmsContents] = useState(MOCK_ADMIN_CMS);
  const addAdminCms = async (data) => {
    const item = {
      id: `cms-${Date.now()}`,
      ...data,
      updated_at: (/* @__PURE__ */ new Date()).toISOString(),
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      penulis: "Admin SIMTA"
    };
    setAdminCmsContents((prev) => [item, ...prev]);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("admin_cms").insert([item]);
      if (error) console.warn("Supabase admin_cms insert warning:", error.message);
    }
    return item;
  };
  const updateAdminCms = async (id, fields) => {
    const updated_at = (/* @__PURE__ */ new Date()).toISOString();
    setAdminCmsContents((prev) => prev.map((c) => c.id === id ? { ...c, ...fields, updated_at } : c));
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("admin_cms").update({ ...fields, updated_at }).eq("id", id);
      if (error) console.warn("Supabase admin_cms update warning:", error.message);
    }
  };
  const deleteAdminCms = async (id) => {
    setAdminCmsContents((prev) => prev.filter((c) => c.id !== id));
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("admin_cms").delete().eq("id", id);
      if (error) console.warn("Supabase admin_cms delete warning:", error.message);
    }
  };
  const [adminTemplates, setAdminTemplates] = useState(MOCK_ADMIN_TEMPLATES);
  const addAdminTemplate = async (data) => {
    const tpl = {
      id: `tpl-${Date.now()}`,
      ...data,
      updated_at: (/* @__PURE__ */ new Date()).toISOString(),
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    setAdminTemplates((prev) => [tpl, ...prev]);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("admin_templates").insert([tpl]);
      if (error) console.warn("Supabase admin_templates insert warning:", error.message);
    }
    return tpl;
  };
  const updateAdminTemplate = async (id, fields) => {
    const updated_at = (/* @__PURE__ */ new Date()).toISOString();
    setAdminTemplates((prev) => prev.map((t) => t.id === id ? { ...t, ...fields, updated_at } : t));
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("admin_templates").update({ ...fields, updated_at }).eq("id", id);
      if (error) console.warn("Supabase admin_templates update warning:", error.message);
    }
  };
  const deleteAdminTemplate = async (id) => {
    setAdminTemplates((prev) => prev.filter((t) => t.id !== id));
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("admin_templates").delete().eq("id", id);
      if (error) console.warn("Supabase admin_templates delete warning:", error.message);
    }
  };
  const [thesisArchives, setThesisArchives] = useState(() => {
    try {
      const saved = localStorage.getItem("simta_thesis_archives_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 300) return parsed;
      }
    } catch {
    }
    return MOCK_THESIS_ARCHIVES;
  });
  const [thesisRepositories, setThesisRepositories] = useState(() => {
    try {
      const saved = localStorage.getItem("simta_thesis_repositories");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
    }
    return MOCK_THESIS_REPOSITORIES;
  });
  const parseConsultationItem = (c) => {
    let parsedJenis = c.jenis_revisi;
    const note = c.masukan_dosen || "";
    if (note.includes("[Revisi Mayor]") || note.includes("[Mayor]")) {
      parsedJenis = "Mayor";
    } else if (note.includes("[Revisi Minor]") || note.includes("[Minor]")) {
      parsedJenis = "Minor";
    } else if (note.includes("[Diterima]") || note.includes("[Disetujui]")) {
      parsedJenis = "Diterima";
    } else if (note.includes("[Menunggu]")) {
      parsedJenis = "Menunggu";
    }
    if (!parsedJenis) {
      parsedJenis = c.status === "disetujui" ? "Diterima" : c.status === "ditolak" ? "Ditolak" : c.status === "perlu_revisi" ? "Minor" : "Menunggu";
    }
    return { ...c, jenis_revisi: parsedJenis };
  };
  const [consultations, setConsultations] = useState(() => {
    if (isSupabaseConfigured) return [];
    try {
      const saved = localStorage.getItem("simta_consultations");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(parseConsultationItem);
        }
      }
    } catch {
    }
    return (MOCK_CONSULTATIONS || []).map(parseConsultationItem);
  });
  const [advisors, setAdvisors] = useState(() => {
    try {
      const saved = localStorage.getItem("simta_advisors");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((adv) => {
            if (adv.pendidikan) return adv;
            const mock = MOCK_ADVISORS.find((m) => m.nip === adv.nip);
            if (mock?.pendidikan) return { ...adv, pendidikan: mock.pendidikan };
            const n = adv.nama || "";
            const isDoktor = /\bDr\.\s/i.test(n) || /Ph\.D/i.test(n);
            return { ...adv, pendidikan: isDoktor ? "S3 (Doktor)" : "S2 (Magister)" };
          });
        }
      }
    } catch {
    }
    return MOCK_ADVISORS;
  });
  const [studentAdvisors, setStudentAdvisors] = useState(() => {
    try {
      const saved = localStorage.getItem("simta_student_advisors");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item) => ({
            ...item,
            judul_ta: item.judul_ta === "Judul Tugas Akhir" || item.judul_ta === "Rancang Bangun Sistem Informasi Manajemen Tugas Akhir & Peminjaman Ruang Sidang" ? "" : item.judul_ta || ""
          }));
        }
      }
    } catch {
    }
    return MOCK_STUDENT_ADVISORS;
  });
  const addAdvisor = (advisorData) => {
    const newAdvisor = {
      id: `adv-${Date.now()}`,
      nip: (advisorData.nip || "").trim(),
      nama: (advisorData.nama || "").trim(),
      email: (advisorData.email || "").trim(),
      no_hp: (advisorData.no_hp || "").trim(),
      prodi: advisorData.prodi || "D3 Manajemen Informatika",
      jabatan_fungsional: advisorData.jabatan_fungsional || "Asisten Ahli",
      keahlian: Array.isArray(advisorData.keahlian) ? advisorData.keahlian : (advisorData.keahlian || "").split(",").map((s) => s.trim()).filter(Boolean),
      kuota_dospem1: Number(advisorData.kuota_dospem1) || 8,
      kuota_dospem2: Number(advisorData.kuota_dospem2) || 8,
      status: advisorData.status || "aktif"
    };
    setAdvisors((prev) => {
      const updated = [newAdvisor, ...prev];
      try {
        localStorage.setItem("simta_advisors", JSON.stringify(updated));
      } catch {
      }
      return updated;
    });
    return newAdvisor;
  };
  const updateAdvisor = (advisorId, updatedFields) => {
    setAdvisors((prev) => {
      const updated = prev.map((a) => a.id === advisorId ? { ...a, ...updatedFields } : a);
      try {
        localStorage.setItem("simta_advisors", JSON.stringify(updated));
      } catch {
      }
      return updated;
    });
  };
  const deleteAdvisor = (advisorId) => {
    setAdvisors((prev) => {
      const updated = prev.filter((a) => a.id !== advisorId);
      try {
        localStorage.setItem("simta_advisors", JSON.stringify(updated));
      } catch {
      }
      return updated;
    });
  };
  const bulkImportAdvisors = (importedList) => {
    const formatted = importedList.map((item, idx) => ({
      id: `adv-import-${Date.now()}-${idx}`,
      nip: String(item.nip || `1990${idx}123456`).trim(),
      nama: String(item.nama || "Dosen Pembimbing").trim(),
      email: String(item.email || "").trim(),
      no_hp: String(item.no_hp || "").trim(),
      prodi: item.prodi || "D3 Manajemen Informatika",
      keahlian: Array.isArray(item.keahlian) ? item.keahlian : (item.keahlian || "Umum").split(",").map((s) => s.trim()).filter(Boolean),
      kuota_dospem1: Number(item.kuota_dospem1) || 8,
      kuota_dospem2: Number(item.kuota_dospem2) || 8,
      status: "aktif"
    }));
    setAdvisors((prev) => {
      const mapByNip = /* @__PURE__ */ new Map();
      [...formatted, ...prev].forEach((a) => mapByNip.set(a.nip, a));
      const merged = Array.from(mapByNip.values());
      try {
        localStorage.setItem("simta_advisors", JSON.stringify(merged));
      } catch {
      }
      return merged;
    });
    return formatted.length;
  };
  const assignStudentAdvisors = async (studentNim, dospem1Nip, dospem2Nip, studentNama = "", judulTa = "") => {
    let updatedRecord = null;
    const cleanNim = String(studentNim || "").trim();
    const d1 = advisors.find((a) => a.nip === dospem1Nip);
    const d2 = advisors.find((a) => a.nip === dospem2Nip);
    const d1Nama = d1?.nama || "";
    const d2Nama = d2?.nama || "";
    setStudentAdvisors((prev) => {
      const existingIdx = prev.findIndex((sa) => String(sa.student_nim || "").trim() === cleanNim);
      let statusPembagian = "belum";
      if (dospem1Nip && dospem2Nip) statusPembagian = "lengkap";
      else if (dospem1Nip || dospem2Nip) statusPembagian = "partial";
      const existingJudul = existingIdx >= 0 && prev[existingIdx].judul_ta && prev[existingIdx].judul_ta !== "Judul Tugas Akhir" && prev[existingIdx].judul_ta !== "Rancang Bangun Sistem Informasi Manajemen Tugas Akhir & Peminjaman Ruang Sidang" ? prev[existingIdx].judul_ta : "";
      updatedRecord = {
        id: existingIdx >= 0 ? prev[existingIdx].id : `std-adv-${Date.now()}`,
        student_nim: cleanNim,
        student_nama: studentNama || (existingIdx >= 0 ? prev[existingIdx].student_nama : "Mahasiswa"),
        prodi: "D3 Manajemen Informatika",
        judul_ta: judulTa || existingJudul || "",
        dospem1_nip: dospem1Nip || null,
        dospem2_nip: dospem2Nip || null,
        status_pembagian: statusPembagian,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      let updatedList;
      if (existingIdx >= 0) {
        updatedList = [...prev];
        updatedList[existingIdx] = updatedRecord;
      } else {
        updatedList = [updatedRecord, ...prev];
      }
      try {
        localStorage.setItem("simta_student_advisors", JSON.stringify(updatedList));
      } catch {
      }
      return updatedList;
    });
    let syncedTitle = null;
    setThesisTitles((prev) => {
      let matched = false;
      const updated = prev.map((t) => {
        if (String(t.mhs_nim || "").trim() === cleanNim) {
          matched = true;
          syncedTitle = {
            ...t,
            pembimbing_1_nip: dospem1Nip || "",
            pembimbing_1_nama: d1Nama,
            pembimbing_1: d1Nama,
            pembimbing_2_nip: dospem2Nip || "",
            pembimbing_2_nama: d2Nama,
            pembimbing_2: d2Nama,
            dospem_confirmed: true,
            // Langsung aktif & terkonfirmasi
            dospem_confirmed_at: (/* @__PURE__ */ new Date()).toISOString(),
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          };
          return syncedTitle;
        }
        return t;
      });
      if (matched) {
        try {
          localStorage.setItem("simta_thesis_titles", JSON.stringify(updated));
        } catch {
        }
      }
      return updated;
    });
    if (syncedTitle) {
      persistThesisTitle(syncedTitle);
    }
    if (isSupabaseConfigured && supabase && updatedRecord) {
      try {
        const payload = {
          student_nim: cleanNim,
          student_nama: updatedRecord.student_nama,
          dospem1_nip: dospem1Nip || null,
          dospem2_nip: dospem2Nip || null,
          status_pembagian: updatedRecord.status_pembagian,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        await supabase.from("student_advisors").upsert(payload, { onConflict: "student_nim" });
      } catch (err) {
        console.warn("Failed to persist student advisor assignment to Supabase:", err);
      }
    }
  };
  const bulkAssignStudentAdvisors = async (assignments) => {
    setStudentAdvisors((prev) => {
      const map = new Map(prev.map((sa) => [String(sa.student_nim || "").trim(), { ...sa }]));
      assignments.forEach((item) => {
        const studentNim = String(item.student_nim || "").trim();
        if (!studentNim) return;
        const dospem1Nip = String(item.dospem1_nip || "").trim();
        const dospem2Nip = String(item.dospem2_nip || "").trim();
        let statusPembagian = "belum";
        if (dospem1Nip && dospem2Nip) statusPembagian = "lengkap";
        else if (dospem1Nip || dospem2Nip) statusPembagian = "partial";
        const existing = map.get(studentNim);
        const existingJudul = existing && existing.judul_ta && existing.judul_ta !== "Judul Tugas Akhir" && existing.judul_ta !== "Rancang Bangun Sistem Informasi Manajemen Tugas Akhir & Peminjaman Ruang Sidang" ? existing.judul_ta : "";
        map.set(studentNim, {
          id: existing ? existing.id : `std-adv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          student_nim: studentNim,
          student_nama: item.student_nama || (existing ? existing.student_nama : "Mahasiswa"),
          prodi: existing?.prodi || "D3 Manajemen Informatika",
          judul_ta: item.judul_ta || existingJudul || "",
          dospem1_nip: dospem1Nip || null,
          dospem2_nip: dospem2Nip || null,
          status_pembagian: statusPembagian,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        });
      });
      const updatedList = Array.from(map.values());
      try {
        localStorage.setItem("simta_student_advisors", JSON.stringify(updatedList));
      } catch {
      }
      return updatedList;
    });
    const bulkSyncedTitles = [];
    setThesisTitles((prev) => {
      const assignmentMap = /* @__PURE__ */ new Map();
      assignments.forEach((a) => {
        if (a.student_nim) assignmentMap.set(String(a.student_nim).trim(), a);
      });
      let hasChanges = false;
      const updated = prev.map((t) => {
        const cleanNim = String(t.mhs_nim || "").trim();
        const item = assignmentMap.get(cleanNim);
        if (!item) return t;
        hasChanges = true;
        const d1 = advisors.find((adv) => adv.nip === item.dospem1_nip);
        const d2 = advisors.find((adv) => adv.nip === item.dospem2_nip);
        const d1Nama = d1?.nama || "";
        const d2Nama = d2?.nama || "";
        const synced = {
          ...t,
          pembimbing_1_nip: item.dospem1_nip || "",
          pembimbing_1_nama: d1Nama,
          pembimbing_1: d1Nama,
          pembimbing_2_nip: item.dospem2_nip || "",
          pembimbing_2_nama: d2Nama,
          pembimbing_2: d2Nama,
          dospem_confirmed: true,
          dospem_confirmed_at: (/* @__PURE__ */ new Date()).toISOString(),
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        bulkSyncedTitles.push(synced);
        return synced;
      });
      if (hasChanges) {
        try {
          localStorage.setItem("simta_thesis_titles", JSON.stringify(updated));
        } catch {
        }
      }
      return updated;
    });
    if (bulkSyncedTitles.length > 0) {
      persistThesisTitles(bulkSyncedTitles);
    }
    if (isSupabaseConfigured && supabase && assignments.length > 0) {
      try {
        const payload = assignments.map((a) => ({
          student_nim: String(a.student_nim).trim(),
          dospem1_nip: a.dospem1_nip ? String(a.dospem1_nip).trim() : null,
          dospem2_nip: a.dospem2_nip ? String(a.dospem2_nip).trim() : null,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }));
        await supabase.from("student_advisors").upsert(payload, { onConflict: "student_nim" });
      } catch (err) {
        console.warn("Failed to bulk upsert student advisors to Supabase:", err);
      }
    }
    return assignments.length;
  };
  const getStudentAdvisors = (studentNim) => {
    const record = studentAdvisors.find((sa) => sa.student_nim === studentNim);
    if (!record) return { dospem1: null, dospem2: null, record: null };
    const dospem1 = advisors.find((a) => a.nip === record.dospem1_nip) || null;
    const dospem2 = advisors.find((a) => a.nip === record.dospem2_nip) || null;
    return { dospem1, dospem2, record };
  };
  const [departments, setDepartments] = useState(() => {
    try {
      const saved = localStorage.getItem("simta_departments");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((d) => d.code === "TI" && d.name === "Teknik Informatika" ? { ...d, name: "S1 Teknik Informatika" } : d);
        }
      }
    } catch {
    }
    return MOCK_DEPARTMENTS;
  });
  const addDepartment = (newDept) => {
    const deptObj = {
      id: `dept-${Date.now()}`,
      code: (newDept.code || "").toUpperCase().trim(),
      name: (newDept.name || "").trim()
    };
    setDepartments((prev) => {
      const updated = [...prev, deptObj];
      try {
        localStorage.setItem("simta_departments", JSON.stringify(updated));
      } catch {
      }
      return updated;
    });
    return deptObj;
  };
  useEffect(() => {
    const saved = getSavedUser();
    if (saved && (!currentUser || currentUser.nama === "Mahasiswa UNSRI")) {
      setCurrentUser(saved);
    }
    if (isSupabaseConfigured && supabase) {
      supabase.from("profiles").select("*").then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const cleaned = data.filter((p) => {
            const nameLower = String(p.nama || "").toLowerCase();
            const nip = String(p.nip || "");
            const id = String(p.id || "");
            return id !== "5ccb09e6-7a1e-4ada-8b08-5df0d406bd40" && id !== "user-kaprodi-hendra" && nip !== "197805122005011002" && !nameLower.includes("hendra kusuma") && !nameLower.includes("indra") && !nameLower.includes("budi dosen") && !nameLower.includes("ahmad zaki") && !nameLower.includes("ahmad dahlan");
          });
          setDbProfiles(cleaned);
        }
      });
      supabase.from("advisors").select("*").order("nama", { ascending: true }).then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const cleanedAdvisors = data.filter((adv) => {
            const nameLower = String(adv.nama || "").toLowerCase();
            const nip = String(adv.nip || "");
            const id = String(adv.id || "");
            return id !== "5ccb09e6-7a1e-4ada-8b08-5df0d406bd40" && id !== "user-kaprodi-hendra" && nip !== "197805122005011002" && !nameLower.includes("hendra kusuma") && !nameLower.includes("indra") && !nameLower.includes("budi dosen") && !nameLower.includes("ahmad zaki") && !nameLower.includes("ahmad dahlan");
          });
          setAdvisors(cleanedAdvisors);
        }
      });
      supabase.from("student_advisors").select("*").then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setStudentAdvisors((prev) => {
            const localMap = new Map(prev.map((item) => [String(item.student_nim).trim(), item]));
            const merged = data.map((remoteItem) => {
              const nim = String(remoteItem.student_nim).trim();
              const local = localMap.get(nim);
              const d1 = remoteItem.dospem1_nip || local?.dospem1_nip || null;
              const d2 = remoteItem.dospem2_nip || local?.dospem2_nip || null;
              let st = "belum";
              if (d1 && d2) st = "lengkap";
              else if (d1 || d2) st = "partial";
              return {
                ...remoteItem,
                dospem1_nip: d1,
                dospem2_nip: d2,
                status_pembagian: st
              };
            });
            localMap.forEach((localItem, nim) => {
              if (!data.some((r) => String(r.student_nim).trim() === nim)) {
                merged.push(localItem);
              }
            });
            try {
              localStorage.setItem("simta_student_advisors", JSON.stringify(merged));
            } catch {
            }
            return merged;
          });
        }
      });
      supabase.from("thesis_consultations").select("*").then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setConsultations((prev) => {
            const localMap = new Map(prev.map((c) => [String(c.id), c]));
            data.forEach((remoteItem) => {
              const existing = localMap.get(String(remoteItem.id));
              const parsed = parseConsultationItem({ ...existing, ...remoteItem });
              localMap.set(String(remoteItem.id), parsed);
            });
            const merged = Array.from(localMap.values());
            try {
              localStorage.setItem("simta_consultations", JSON.stringify(merged));
            } catch {
            }
            return merged;
          });
        }
      });
      let consultationsChannel = null;
      let studentAdvisorsChannel = null;
      let thesisTitlesChannel = null;
      try {
        if (typeof supabase.getChannels === "function") {
          const activeChannels = supabase.getChannels() || [];
          activeChannels.forEach((ch) => {
            if (ch.topic && ch.topic.includes("schema-db-changes")) {
              try {
                supabase.removeChannel(ch);
              } catch {
              }
            }
          });
        }
        consultationsChannel = supabase.channel(`schema-db-changes-consultations-${Date.now()}`).on(
          "postgres_changes",
          { event: "*", schema: "public", table: "thesis_consultations" },
          (payload) => {
            if (payload.eventType === "INSERT" && payload.new) {
              setConsultations((prev) => {
                const exists = prev.some((c) => String(c.id) === String(payload.new.id));
                if (exists) return prev;
                const item = parseConsultationItem(payload.new);
                const updated = [item, ...prev];
                try {
                  localStorage.setItem("simta_consultations", JSON.stringify(updated));
                } catch {
                }
                return updated;
              });
            } else if (payload.eventType === "UPDATE" && payload.new) {
              setConsultations((prev) => {
                const updated = prev.map((c) => {
                  if (String(c.id) === String(payload.new.id)) {
                    return parseConsultationItem({ ...c, ...payload.new });
                  }
                  return c;
                });
                try {
                  localStorage.setItem("simta_consultations", JSON.stringify(updated));
                } catch {
                }
                return updated;
              });
            } else if (payload.eventType === "DELETE" && payload.old) {
              setConsultations((prev) => {
                const updated = prev.filter((c) => String(c.id) !== String(payload.old.id));
                try {
                  localStorage.setItem("simta_consultations", JSON.stringify(updated));
                } catch {
                }
                return updated;
              });
            }
          }
        ).subscribe();
        studentAdvisorsChannel = supabase.channel(`schema-db-changes-student-advisors-${Date.now()}`).on(
          "postgres_changes",
          { event: "*", schema: "public", table: "student_advisors" },
          (payload) => {
            if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
              if (payload.new) {
                setStudentAdvisors((prev) => {
                  const nim = String(payload.new.student_nim).trim();
                  const existsIdx = prev.findIndex((sa) => String(sa.student_nim).trim() === nim);
                  const d1 = payload.new.dospem1_nip || null;
                  const d2 = payload.new.dospem2_nip || null;
                  let st = "belum";
                  if (d1 && d2) st = "lengkap";
                  else if (d1 || d2) st = "partial";
                  const updatedItem = {
                    ...existsIdx >= 0 ? prev[existsIdx] : {},
                    ...payload.new,
                    dospem1_nip: d1,
                    dospem2_nip: d2,
                    status_pembagian: st
                  };
                  let updatedList;
                  if (existsIdx >= 0) {
                    updatedList = [...prev];
                    updatedList[existsIdx] = updatedItem;
                  } else {
                    updatedList = [updatedItem, ...prev];
                  }
                  try {
                    localStorage.setItem("simta_student_advisors", JSON.stringify(updatedList));
                  } catch {
                  }
                  return updatedList;
                });
              }
            } else if (payload.eventType === "DELETE" && payload.old) {
              setStudentAdvisors((prev) => {
                const updated = prev.filter((sa) => String(sa.student_nim).trim() !== String(payload.old.student_nim).trim());
                try {
                  localStorage.setItem("simta_student_advisors", JSON.stringify(updated));
                } catch {
                }
                return updated;
              });
            }
          }
        ).subscribe();
        thesisTitlesChannel = supabase.channel(`schema-db-changes-thesis-titles-${Date.now()}`).on(
          "postgres_changes",
          { event: "*", schema: "public", table: "thesis_titles" },
          (payload) => {
            if ((payload.eventType === "INSERT" || payload.eventType === "UPDATE") && payload.new) {
              const incoming = normalizeThesisTitleRecord(payload.new);
              setThesisTitles((prev) => {
                const idx = prev.findIndex((t) => String(t.id) === String(incoming.id));
                const existing = idx >= 0 ? prev[idx] : null;
                const merged = {
                  ...existing || {},
                  ...incoming,
                  mhs_nama: incoming.mhs_nama || existing?.mhs_nama || "",
                  mhs_nim: incoming.mhs_nim || existing?.mhs_nim || "",
                  mhs_kelas: incoming.mhs_kelas || existing?.mhs_kelas || ""
                };
                if (idx >= 0) {
                  const next = [...prev];
                  next[idx] = merged;
                  return next;
                }
                return [merged, ...prev];
              });
            } else if (payload.eventType === "DELETE" && payload.old) {
              setThesisTitles((prev) => prev.filter((t) => String(t.id) !== String(payload.old.id)));
            }
          }
        ).subscribe();
      } catch (realtimeErr) {
        console.warn("Realtime subscription error handled safely:", realtimeErr);
      }
      supabase.from("thesis_titles").select("*").order("created_at", { ascending: false }).then(async ({ data, error }) => {
        if (error) {
          console.warn("Gagal memuat thesis_titles dari Supabase:", error.message);
          return;
        }
        const rows = (data || []).map(normalizeThesisTitleRecord);
        if (rows.length === 0) {
          setThesisTitles([]);
          return;
        }
        const [{ data: profileRows }, { data: advisorRows }] = await Promise.all([
          supabase.from("profiles").select("id,nim,nip,nama,kelas,prodi"),
          supabase.from("student_advisors").select("student_nim,student_nama,prodi")
        ]);
        setThesisTitles(rows.map((row) => enrichThesisTitleRecord(row, profileRows || [], advisorRows || [])));
      });
      supabase.from("bookings").select("*").then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setBookings(data);
        }
      });
      supabase.from("admin_documents").select("*").order("tanggal_upload", { ascending: false }).then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setAdminDocuments(data);
        }
      });
      supabase.from("admin_cms").select("*").order("updated_at", { ascending: false }).then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setAdminCmsContents(data);
        }
      });
      supabase.from("admin_templates").select("*").order("updated_at", { ascending: false }).then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setAdminTemplates(data);
        }
      });
      supabase.from("thesis_repositories").select("*").then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setThesisArchives(data);
          setThesisRepositories(data);
        }
      });
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const registered = getRegisteredUsers();
          const matchedReg = registered.find((r) => r.email === session.user.email || r.id === session.user.id) || registered[0];
          supabase.from("profiles").select("*").eq("id", session.user.id).single().then(({ data }) => {
            if (data && data.nama && data.nama !== "Mahasiswa UNSRI") {
              setCurrentUser(sanitizeProfile(data));
            } else if (session.user.user_metadata) {
              const meta = session.user.user_metadata;
              const resolvedUser = sanitizeProfile({
                id: session.user.id,
                nama: meta.nama || meta.full_name || matchedReg?.nama || "Mahasiswa",
                email: session.user.email,
                nim: meta.nim || matchedReg?.nim || "",
                no_hp: meta.no_hp || matchedReg?.no_hp || "",
                role: meta.role || matchedReg?.role || "mahasiswa",
                kelas: meta.kelas || matchedReg?.kelas || "MI 5A"
              });
              setCurrentUser(resolvedUser);
            }
          });
        }
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT") {
          localStorage.removeItem("simta_active_user");
          setCurrentUserState(null);
          setIsAuthenticated(false);
        } else if (session?.user) {
          supabase.from("profiles").select("*").eq("id", session.user.id).single().then(({ data }) => {
            if (data && data.nama) {
              setCurrentUser(sanitizeProfile(data));
            }
          });
        }
      });
      return () => {
        try {
          subscription.unsubscribe();
        } catch {
        }
        if (consultationsChannel) {
          try {
            supabase.removeChannel(consultationsChannel);
          } catch {
          }
        }
        if (studentAdvisorsChannel) {
          try {
            supabase.removeChannel(studentAdvisorsChannel);
          } catch {
          }
        }
        if (thesisTitlesChannel) {
          try {
            supabase.removeChannel(thesisTitlesChannel);
          } catch {
          }
        }
      };
    }
  }, []);
  useEffect(() => {
    if (isSupabaseConfigured) return;
    const handleStorageChange = (e) => {
      if (e.key === "simta_consultations" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setConsultations(parsed.map(parseConsultationItem));
          }
        } catch {
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);
  useEffect(() => {
    if (currentUser?.role === "mahasiswa" && currentUser?.nim) {
      const reminder = calculateBimbinganReminder(consultations, currentUser.nim, 2);
      if (reminder.isReminderActive && (reminder.severity === "critical" || reminder.severity === "warning")) {
        const studentEmail = currentUser.email || `${currentUser.nim}@student.unsri.ac.id`;
        setNotifications((prev) => {
          const alreadyNotified = prev.some((n) => n.related_type === "bimbingan_reminder" && String(n.profile_id) === String(currentUser.id));
          if (alreadyNotified) return prev;
          const notif = {
            id: `notif-reminder-${Date.now()}`,
            profile_id: currentUser.id,
            related_type: "bimbingan_reminder",
            title: reminder.severity === "critical" ? "Peringatan Kritis: Bimbingan Terhenti > 1 Bulan" : "Pengingat: Jadwal Bimbingan Rutin (Min. 2x/Bulan)",
            message: `${reminder.message}. ${reminder.subMessage}`,
            is_read: false,
            is_email_sent: true,
            email_to: studentEmail,
            email_sent_at: (/* @__PURE__ */ new Date()).toISOString(),
            created_at: (/* @__PURE__ */ new Date()).toISOString()
          };
          sendEmailNotification(studentEmail, notif.title, notif.message);
          return [notif, ...prev];
        });
      }
    }
  }, [currentUser, consultations]);
  const login = async (credential = "", password = "") => {
    const term = String(credential).trim();
    const termLower = term.toLowerCase();
    const inputPass = String(password).trim();
    if (!term) {
      throw new Error("NIM / NIP atau Username wajib diisi.");
    }
    if (!inputPass) {
      throw new Error("Kata sandi wajib diisi.");
    }
    const isEmail = term.includes("@");
    const isNumeric = /^[0-9]+$/.test(term);
    const isUsername = !isEmail && !isNumeric;
    const isValidPassword = (user) => {
      if (!inputPass) return false;
      const pass = inputPass.toLowerCase();
      const userPass = String(user.password || "").trim().toLowerCase();
      const userNim = String(user.nim || "").trim().toLowerCase();
      const userNip = String(user.nip || "").trim().toLowerCase();
      if (userPass && pass === userPass) {
        return true;
      }
      const passwordStillDefault = !userPass || userPass === userNim || userPass === userNip;
      if (passwordStillDefault && (userNim && pass === userNim || userNip && pass === userNip)) {
        return true;
      }
      return false;
    };
    if (termLower === "koprodi" || termLower === "kaprodi") {
      if (inputPass !== "Koprodi123") {
        throw new Error("Kata sandi salah.");
      }
      let savedWa = "https://chat.whatsapp.com/BimbinganTA-DrAbdiansah";
      try {
        const advs = JSON.parse(localStorage.getItem("simta_advisors") || "[]");
        const matchedAdv = advs.find((a) => String(a.nip) === "198410012009121005");
        if (matchedAdv?.link_wa_group) savedWa = matchedAdv.link_wa_group;
      } catch {
      }
      const kaprodiUser = {
        id: "user-kaprodi-abdiansah",
        username: "Koprodi",
        nama: "Dr. Abdiansah, S.Kom., M.Cs.",
        nip: "198410012009121005",
        nim: "198410012009121005",
        email: "koprodi@unsri.ac.id",
        role: "kaprodi",
        kelas: "Dosen / Kaprodi",
        prodi: "D3 Manajemen Informatika",
        link_wa_group: savedWa
      };
      setCurrentUser(kaprodiUser);
      return "/kaprodi/dashboard";
    }
    if (termLower === "admin" || termLower === "admin_simta" || termLower === "adminsimta" || term === "198503152010122001" || termLower === "admin.simta@unsri.ac.id") {
      if (inputPass !== "198503152010122001" && inputPass !== "admin") {
        throw new Error("Kata sandi salah.");
      }
      const adminUser = {
        id: "user-admin-simta",
        username: "admin",
        nama: "Rina Agustina, S.Kom. (Admin SIMTA)",
        nip: "198503152010122001",
        nim: "198503152010122001",
        email: "admin.simta@unsri.ac.id",
        role: "admin",
        kelas: "Admin SIMTA"
      };
      setCurrentUser(adminUser);
      return "/admin-simta/dashboard";
    }
    if (termLower === "admin_sarana" || termLower === "adminsarana" || term === "198204102008121003" || termLower === "admin.sarana@unsri.ac.id") {
      if (inputPass !== "198204102008121003" && inputPass !== "admin") {
        throw new Error("Kata sandi salah.");
      }
      const adminSaranaUser = {
        id: "user-admin-sarana",
        username: "admin_sarana",
        nama: "Budi Santoso, S.Kom. (Admin Ruang)",
        nip: "198204102008121003",
        nim: "198204102008121003",
        email: "admin.sarana@unsri.ac.id",
        role: "admin_sarana",
        kelas: "Admin Sarana"
      };
      setCurrentUser(adminSaranaUser);
      return "/admin/dashboard";
    }
    if (isUsername) {
      const registered2 = getRegisteredUsers();
      const customAdmin = registered2.find(
        (u) => (u.role === "admin" || u.role === "admin_sarana" || u.role === "kaprodi") && u.username && String(u.username).toLowerCase() === termLower
      );
      if (customAdmin) {
        if (!isValidPassword(customAdmin)) {
          throw new Error("Kata sandi salah.");
        }
        setCurrentUser(customAdmin);
        if (customAdmin.role === "kaprodi") return "/kaprodi/dashboard";
        if (customAdmin.role === "admin_sarana") return "/admin/dashboard";
        return "/admin-simta/dashboard";
      }
      throw new Error("Username salah.");
    }
    if (term === "198410012009121005" || termLower === "abdiansah@unsri.ac.id") {
      if (inputPass !== "198410012009121005") {
        throw new Error("Kata sandi salah.");
      }
      let savedWa = "https://chat.whatsapp.com/BimbinganTA-DrAbdiansah";
      try {
        const advs = JSON.parse(localStorage.getItem("simta_advisors") || "[]");
        const matchedAdv = advs.find((a) => String(a.nip) === "198410012009121005");
        if (matchedAdv?.link_wa_group) savedWa = matchedAdv.link_wa_group;
      } catch {
      }
      const dosenUser = {
        id: "user-dosen-abdiansah",
        nama: "Dr. Abdiansah, S.Kom., M.Cs.",
        nip: "198410012009121005",
        nim: "198410012009121005",
        email: "abdiansah@unsri.ac.id",
        role: "dosen",
        kelas: "Dosen Pembimbing",
        prodi: "D3 Manajemen Informatika",
        link_wa_group: savedWa
      };
      setCurrentUser(dosenUser);
      return "/dosen/dashboard";
    }
    const registered = getRegisteredUsers();
    const localFound = registered.find(
      (u) => u.nim && u.nim.toLowerCase() === termLower || u.nip && u.nip.toLowerCase() === termLower || u.email && u.email.toLowerCase() === termLower
    );
    if (localFound) {
      if (!isValidPassword(localFound)) {
        throw new Error("Kata sandi salah.");
      }
      setCurrentUser(localFound);
      if (localFound.role === "kaprodi") return "/kaprodi/dashboard";
      if (localFound.role === "admin_sarana") return "/admin/dashboard";
      if (localFound.role === "admin") return "/admin-simta/dashboard";
      if (localFound.role === "dosen") return "/dosen/dashboard";
      if (localFound.role === "mahasiswa") {
        return !localFound.is_profile_completed ? "/profile?first_login=true" : "/dashboard";
      }
      return "/dashboard";
    }
    if (isSupabaseConfigured && supabase && password) {
      let emailToUse = termLower.includes("@") ? termLower : "";
      if (!emailToUse) {
        const { data: prof } = await supabase.from("profiles").select("email").or(`nim.eq.${term},nip.eq.${term}`).single();
        if (prof && prof.email) {
          emailToUse = prof.email;
        }
      }
      if (emailToUse) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password
        });
        if (!authError && authData.user) {
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", authData.user.id).single();
          const matchedReg = registered.find((r) => r.email === authData.user.email || r.id === authData.user.id) || registered[0];
          const activeProfile = profile || {
            id: authData.user.id,
            nama: authData.user.user_metadata?.nama || authData.user.user_metadata?.full_name || matchedReg?.nama || "AULIA AZZAHRA",
            email: authData.user.email,
            nim: term,
            no_hp: authData.user.user_metadata?.no_hp || matchedReg?.no_hp || "",
            role: authData.user.user_metadata?.role || matchedReg?.role || "mahasiswa",
            kelas: authData.user.user_metadata?.kelas || matchedReg?.kelas || "MI 2024"
          };
          setCurrentUser(activeProfile);
          if (activeProfile.role === "kaprodi") return "/kaprodi/dashboard";
          if (activeProfile.role === "admin_sarana") return "/admin/dashboard";
          if (activeProfile.role === "admin") return "/admin-simta/dashboard";
          if (activeProfile.role === "dosen") return "/dosen/dashboard";
          if (activeProfile.role === "mahasiswa") {
            return !activeProfile.is_profile_completed ? "/profile?first_login=true" : "/dashboard";
          }
          return "/dashboard";
        }
      }
    }
    let foundUser = MOCK_USERS.find(
      (u) => u.nim && u.nim.toLowerCase() === termLower || u.nip && u.nip.toLowerCase() === termLower || u.email && u.email.toLowerCase() === termLower
    );
    if (!foundUser) {
      const advMatch = advisors.find(
        (a) => a.nip && String(a.nip).toLowerCase() === termLower || a.email && String(a.email).toLowerCase() === termLower
      );
      if (advMatch) {
        foundUser = {
          id: `user-dosen-${advMatch.nip}`,
          nim: advMatch.nip,
          nip: advMatch.nip,
          nama: advMatch.nama,
          email: advMatch.email,
          password: advMatch.nip,
          role: "dosen",
          prodi: advMatch.prodi || "D3 Manajemen Informatika"
        };
      }
    }
    if (foundUser) {
      if (!isValidPassword(foundUser)) {
        throw new Error("Kata sandi salah.");
      }
      setCurrentUser(foundUser);
      if (foundUser.role === "kaprodi") return "/kaprodi/dashboard";
      if (foundUser.role === "admin_sarana") return "/admin/dashboard";
      if (foundUser.role === "admin") return "/admin-simta/dashboard";
      if (foundUser.role === "dosen") return "/dosen/dashboard";
      if (foundUser.role === "mahasiswa") {
        return !foundUser.is_profile_completed ? "/profile?first_login=true" : "/dashboard";
      }
      return "/dashboard";
    }
    if (isEmail) {
      throw new Error("Email tidak terdaftar.");
    }
    throw new Error("NIM / NIP tidak terdaftar.");
  };
  const registerStudent = async ({ nama, nim, email, noHp, prodi, kelas, password, role = "mahasiswa" }) => {
    const cleanEmail = email.toLowerCase().trim();
    if (role === "mahasiswa" && !cleanEmail.endsWith("@student.unsri.ac.id")) {
      return { success: false, message: "Email mahasiswa harus menggunakan domain resmi UNSRI (@student.unsri.ac.id)." };
    }
    if (role === "kaprodi" && !cleanEmail.endsWith("@unsri.ac.id")) {
      return { success: false, message: "Email Kaprodi harus menggunakan domain resmi UNSRI (@unsri.ac.id)." };
    }
    const redirectPath = role === "kaprodi" ? "/kaprodi/dashboard" : "/dashboard";
    const newStudentUser = {
      id: `user-${role}-${Date.now()}`,
      nim,
      nip: nim,
      nama,
      email: cleanEmail,
      no_hp: noHp,
      prodi: prodi || "D3 Manajemen Informatika",
      kelas: kelas || (role === "kaprodi" ? "Dosen / Kaprodi" : "MI 5A"),
      role
    };
    saveRegisteredUser(newStudentUser);
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              nama,
              nim,
              nip: nim,
              no_hp: noHp,
              prodi: prodi || "D3 Manajemen Informatika",
              kelas: kelas || (role === "kaprodi" ? "Dosen / Kaprodi" : "MI 5A"),
              role
            }
          }
        });
        if (error) {
          return { success: false, message: error.message };
        }
        if (data.user) {
          newStudentUser.id = data.user.id;
          saveRegisteredUser(newStudentUser);
          const { error: profileError } = await supabase.from("profiles").upsert(newStudentUser, { onConflict: "id" });
          if (profileError) {
            console.warn("Supabase profile upsert warning:", profileError.message);
          }
          setCurrentUser(newStudentUser);
          return { success: true, redirectPath };
        }
      } catch (err) {
        return { success: false, message: err.message || "Gagal mendaftar ke Supabase." };
      }
    }
    MOCK_USERS.unshift(newStudentUser);
    setCurrentUser(newStudentUser);
    return { success: true, redirectPath };
  };
  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem("simta_active_user");
    setCurrentUserState(null);
    setIsAuthenticated(false);
  };
  const switchRole = (roleName) => {
    const foundUser = MOCK_USERS.find((u) => u.role === roleName);
    if (foundUser) {
      setCurrentUser(foundUser);
    }
  };
  const addThesisTitle = async (newTitleData) => {
    const newId = generateRowId();
    const d1Nip = newTitleData.pembimbing_1_nip || "";
    const d2Nip = newTitleData.pembimbing_2_nip || "";
    const d1Obj = advisors.find((a) => a.nip === d1Nip);
    const d2Obj = advisors.find((a) => a.nip === d2Nip);
    const d1Nama = newTitleData.pembimbing_1_nama || d1Obj?.nama || newTitleData.pembimbing_1 || "";
    const d2Nama = newTitleData.pembimbing_2_nama || d2Obj?.nama || newTitleData.pembimbing_2 || "";
    const initialRevisionLog = {
      id: `rev-${Date.now()}-init`,
      tanggal: (/* @__PURE__ */ new Date()).toISOString(),
      tipe: "pengajuan_awal",
      judul: newTitleData.judul,
      skor_similarity: newTitleData.skor_kemiripan_terakhir || 0,
      catatan: "Pengajuan usulan judul tugas akhir. Otomatis masuk ke tahap peninjauan rapat Prodi.",
      oleh: currentUser?.nama || "Mahasiswa"
    };
    const createdTitle = {
      id: newId,
      profile_id: currentUser?.id || "user-mhs-aulia",
      mhs_nama: currentUser?.nama || "Aulia Azzahra",
      mhs_nim: currentUser?.nim || "09010182428002",
      mhs_kelas: currentUser?.kelas || "MI 5A",
      pembimbing_1_nip: d1Nip,
      pembimbing_1_nama: d1Nama,
      pembimbing_2_nip: d2Nip,
      pembimbing_2_nama: d2Nama,
      pembimbing_1: d1Nama,
      pembimbing_2: d2Nama,
      rekomendasi_dospem_status: "menunggu_validasi",
      // 'menunggu_validasi' | 'direkomendasikan' | 'perlu_revisi'
      catatan_dospem: "",
      rekomendasi_oleh: "",
      catatan_kaprodi: "",
      ...newTitleData,
      status: "tinjauan",
      // Pengajuan otomatis masuk tahap tinjauan tanpa perlu ACC satu per satu
      riwayat_revisi: [initialRevisionLog],
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    setThesisTitles((prev) => [createdTitle, ...prev]);
    await persistThesisTitle(createdTitle);
    const newNotifs = [];
    const kaprodiUser = MOCK_USERS.find((u) => u.role === "kaprodi");
    const kaprodiId = kaprodiUser?.id || "user-kaprodi-abdiansah";
    newNotifs.push({
      id: `notif-${Date.now()}-kaprodi`,
      profile_id: kaprodiId,
      recipient_role: "kaprodi",
      related_type: "thesis_title",
      title: "Pengajuan Judul Baru Masuk Tahap Tinjauan",
      message: `${currentUser?.nama || "Mahasiswa"} (${currentUser?.nim || ""}) mengajukan judul: "${newTitleData.judul}". Otomatis masuk tahap peninjauan rapat Prodi.`,
      is_read: false,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    sendEmailNotification(kaprodiUser?.email || "koprodi@unsri.ac.id", "Pengajuan Judul Tugas Akhir Baru", `Mahasiswa ${currentUser?.nama} mengajukan judul: "${newTitleData.judul}".`);
    if (d1Nip || d1Nama) {
      newNotifs.push({
        id: `notif-${Date.now()}-dospem1`,
        profile_id: d1Obj?.id || d1Nip,
        recipient_nip: d1Nip,
        recipient_role: "dosen",
        related_type: "thesis_title",
        title: "Usulan Pembimbing 1: Pengajuan Judul Baru",
        message: `Mahasiswa ${currentUser?.nama || "Mahasiswa"} (${currentUser?.nim || ""}) mengusulkan Anda sebagai Pembimbing 1 untuk judul: "${newTitleData.judul}". Silakan tinjau & berikan validasi akademik.`,
        is_read: false,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      if (d1Obj?.email) {
        sendEmailNotification(d1Obj.email, "Usulan Pembimbing 1 Tugas Akhir", `Mahasiswa ${currentUser?.nama} mengusulkan Anda sebagai Pembimbing 1.`);
      }
    }
    if (d2Nip || d2Nama) {
      newNotifs.push({
        id: `notif-${Date.now()}-dospem2`,
        profile_id: d2Obj?.id || d2Nip,
        recipient_nip: d2Nip,
        recipient_role: "dosen",
        related_type: "thesis_title",
        title: "Usulan Pembimbing 2: Pengajuan Judul Baru",
        message: `Mahasiswa ${currentUser?.nama || "Mahasiswa"} (${currentUser?.nim || ""}) mengusulkan Anda sebagai Pembimbing 2 untuk judul: "${newTitleData.judul}". Silakan tinjau & berikan validasi akademik.`,
        is_read: false,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      if (d2Obj?.email) {
        sendEmailNotification(d2Obj.email, "Usulan Pembimbing 2 Tugas Akhir", `Mahasiswa ${currentUser?.nama} mengusulkan Anda sebagai Pembimbing 2.`);
      }
    }
    if (newNotifs.length > 0) {
      setNotifications((prev) => [...newNotifs, ...prev]);
    }
    return createdTitle;
  };
  const sendEmailNotification = (toEmail, subject, content) => {
    console.info(`[SIMTA EMAIL GATEWAY] \u{1F4E7} Notifikasi email otomatis berhasil dikirim ke: ${toEmail} | Subjek: "${subject}"`);
  };
  const validateThesisTitleDosen = (titleId, statusRekomendasi, catatanDosen = "") => {
    let affectedTitle = null;
    setThesisTitles((prev) => {
      const updated = prev.map((t) => {
        if (t.id === titleId) {
          affectedTitle = {
            ...t,
            status: statusRekomendasi === "direkomendasikan" ? "disetujui" : statusRekomendasi === "perlu_revisi" ? "perlu_revisi" : t.status,
            rekomendasi_dospem_status: statusRekomendasi,
            // 'direkomendasikan' | 'perlu_revisi'
            catatan_dospem: catatanDosen,
            rekomendasi_oleh: currentUser?.nama || "Dosen Pembimbing",
            rekomendasi_at: (/* @__PURE__ */ new Date()).toISOString(),
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          };
          return affectedTitle;
        }
        return t;
      });
      try {
        localStorage.setItem("simta_thesis_titles", JSON.stringify(updated));
      } catch {
      }
      return updated;
    });
    if (affectedTitle) {
      persistThesisTitle(affectedTitle);
      const studentUser = MOCK_USERS.find((u) => u.nim === affectedTitle.mhs_nim);
      const studentEmail = studentUser?.email || (affectedTitle.mhs_nim ? `${affectedTitle.mhs_nim}@student.unsri.ac.id` : "09010182428002@student.unsri.ac.id");
      const notifTitle = statusRekomendasi === "direkomendasikan" ? "Usulan Judul Disetujui (ACC) Dosen" : "Catatan Revisi Judul dari Dosen";
      const notifMessage = statusRekomendasi === "direkomendasikan" ? `${currentUser?.nama || "Dosen Pembimbing"} telah menyetujui (ACC) usulan judul tugas akhir Anda.` : `${currentUser?.nama || "Dosen Pembimbing"} memberikan catatan revisi pada usulan judul: "${catatanDosen}"`;
      const notifMhs = {
        id: `notif-${Date.now()}-mhs`,
        profile_id: affectedTitle.profile_id,
        related_type: "thesis_title",
        title: notifTitle,
        message: notifMessage,
        is_read: false,
        is_email_sent: true,
        email_to: studentEmail,
        email_sent_at: (/* @__PURE__ */ new Date()).toISOString(),
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      setNotifications((prev) => [notifMhs, ...prev]);
      sendEmailNotification(studentEmail, notifTitle, notifMessage);
    }
  };
  const addProdiRevisionNote = (titleId, catatan, targetOleh = "Prodi (Rapat Pembahasan)") => {
    let affectedTitle = null;
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    setThesisTitles((prev) => prev.map((t) => {
      if (t.id === titleId) {
        const newLog = {
          id: `rev-${Date.now()}`,
          tanggal: nowIso,
          tipe: "catatan_prodi",
          judul: t.judul,
          skor_similarity: t.skor_kemiripan_terakhir || 0,
          catatan: catatan.trim(),
          oleh: targetOleh
        };
        const existingLogs = Array.isArray(t.riwayat_revisi) ? t.riwayat_revisi : [];
        affectedTitle = {
          ...t,
          status: "perlu_revisi",
          // Status kuning: Perlu Revisi
          catatan_kaprodi: catatan.trim(),
          riwayat_revisi: [newLog, ...existingLogs],
          updated_at: nowIso
        };
        return affectedTitle;
      }
      return t;
    }));
    if (affectedTitle) {
      persistThesisTitle(affectedTitle);
      const studentUser = MOCK_USERS.find((u) => u.nim === affectedTitle.mhs_nim);
      const studentEmail = studentUser?.email || (affectedTitle.mhs_nim ? `${affectedTitle.mhs_nim}@student.unsri.ac.id` : "09010182428002@student.unsri.ac.id");
      const notifTitle = "Catatan Revisi Pengajuan Judul dari Rapat Prodi";
      const notifMessage = `Terdapat catatan hasil rapat pembahasan Prodi untuk judul TA Anda ("${affectedTitle.judul}"): "${catatan.trim()}". Status saat ini adalah "Perlu Revisi". Silakan berkonsultasi dengan Dosen Pembimbing untuk perbaikan judul.`;
      const notifMhs = {
        id: `notif-${Date.now()}-mhs-rev`,
        profile_id: affectedTitle.profile_id,
        related_type: "thesis_title_revision",
        title: notifTitle,
        message: notifMessage,
        is_read: false,
        is_email_sent: true,
        email_to: studentEmail,
        email_sent_at: nowIso,
        created_at: nowIso
      };
      setNotifications((prev) => [notifMhs, ...prev]);
      sendEmailNotification(studentEmail, notifTitle, notifMessage);
    }
  };
  const reviseThesisTitle = (titleId, newJudul, newDeskripsi, newSimilarityScore, catatanRevisiMhs = "") => {
    let affectedTitle = null;
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    setThesisTitles((prev) => prev.map((t) => {
      if (t.id === titleId) {
        const newLog = {
          id: `rev-${Date.now()}`,
          tanggal: nowIso,
          tipe: "revisi_mahasiswa",
          judul_lama: t.judul,
          judul: newJudul.trim(),
          skor_similarity: newSimilarityScore,
          catatan: catatanRevisiMhs.trim() || "Perbaikan judul hasil konsultasi bersama dosen pembimbing.",
          oleh: t.mhs_nama || currentUser?.nama || "Mahasiswa"
        };
        const existingLogs = Array.isArray(t.riwayat_revisi) ? t.riwayat_revisi : [];
        affectedTitle = {
          ...t,
          judul: newJudul.trim(),
          deskripsi: newDeskripsi !== void 0 ? newDeskripsi : t.deskripsi,
          skor_kemiripan_terakhir: newSimilarityScore,
          status: "tinjauan",
          // Kembali otomatis ke status Dalam Tinjauan
          riwayat_revisi: [newLog, ...existingLogs],
          updated_at: nowIso
        };
        return affectedTitle;
      }
      return t;
    }));
    if (affectedTitle) {
      persistThesisTitle(affectedTitle);
      const kaprodiUser = MOCK_USERS.find((u) => u.role === "kaprodi");
      if (kaprodiUser) {
        const notifKaprodi = {
          id: `notif-${Date.now()}-kaprodi-rev`,
          profile_id: kaprodiUser.id,
          related_type: "thesis_title_revised",
          title: "Mahasiswa Memperbarui Judul Revisi",
          message: `${affectedTitle.mhs_nama} (${affectedTitle.mhs_nim}) telah memperbarui usulan judul menjadi: "${newJudul.trim()}" (Similarity: ${newSimilarityScore}%). Judul kembali masuk tahap tinjauan Prodi.`,
          is_read: false,
          created_at: nowIso
        };
        setNotifications((prev) => [notifKaprodi, ...prev]);
      }
    }
  };
  const cancelThesisTitle = async (titleId) => {
    const targetTitle = thesisTitles.find((t) => t.id === titleId);
    setThesisTitles((prev) => prev.filter((t) => t.id !== titleId));
    await deleteThesisTitleRecord(titleId);
    if (targetTitle) {
      const kaprodiUser = MOCK_USERS.find((u) => u.role === "kaprodi");
      if (kaprodiUser) {
        const notifKaprodi = {
          id: `notif-${Date.now()}-cancel`,
          profile_id: kaprodiUser.id,
          recipient_role: "kaprodi",
          related_type: "thesis_title_cancelled",
          title: "Pengajuan Tugas Akhir Dibatalkan",
          message: `Mahasiswa ${targetTitle.mhs_nama} (${targetTitle.mhs_nim}) telah membatalkan usulan judul: "${targetTitle.judul}".`,
          is_read: false,
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        setNotifications((prev) => [notifKaprodi, ...prev]);
      }
    }
  };
  const setThesisTitleFix = (titleId, confirmedDospem1Nip, confirmedDospem2Nip, catatanFix = "") => {
    const targetTitle = thesisTitles.find((t) => t.id === titleId);
    if (!targetTitle) return;
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const d1Nip = confirmedDospem1Nip !== void 0 && confirmedDospem1Nip !== null ? confirmedDospem1Nip : targetTitle.pembimbing_1_nip;
    const d2Nip = confirmedDospem2Nip !== void 0 && confirmedDospem2Nip !== null ? confirmedDospem2Nip : targetTitle.pembimbing_2_nip;
    const d1 = advisors.find((a) => a.nip === d1Nip);
    const d2 = advisors.find((a) => a.nip === d2Nip);
    const d1Nama = d1?.nama || targetTitle.pembimbing_1_nama || targetTitle.pembimbing_1 || "";
    const d2Nama = d2?.nama || targetTitle.pembimbing_2_nama || targetTitle.pembimbing_2 || "";
    let updatedTitle = null;
    setThesisTitles((prev) => prev.map((t) => {
      if (t.id === titleId) {
        const fixLog = {
          id: `rev-${Date.now()}`,
          tanggal: nowIso,
          tipe: "judul_fix",
          judul: t.judul,
          skor_similarity: t.skor_kemiripan_terakhir || 0,
          catatan: catatanFix.trim() || "Judul telah disetujui resmi sebagai JUDUL FIX dalam rapat Prodi.",
          oleh: "Dr. Abdiansah, S.Kom., M.Cs. (Kaprodi)"
        };
        const existingLogs = Array.isArray(t.riwayat_revisi) ? t.riwayat_revisi : [];
        updatedTitle = {
          ...t,
          status: "disetujui",
          // Status Judul Fix (disetujui)
          catatan_kaprodi: catatanFix.trim() || "Judul resmi disetujui FIX oleh Kaprodi.",
          pembimbing_1_nip: d1Nip || "",
          pembimbing_1_nama: d1Nama,
          pembimbing_2_nip: d2Nip || "",
          pembimbing_2_nama: d2Nama,
          pembimbing_1: d1Nama,
          pembimbing_2: d2Nama,
          dospem_confirmed: false,
          riwayat_revisi: [fixLog, ...existingLogs],
          updated_at: nowIso
        };
        return updatedTitle;
      }
      return t;
    }));
    if (updatedTitle) {
      persistThesisTitle(updatedTitle);
      assignStudentAdvisors(
        updatedTitle.mhs_nim,
        updatedTitle.pembimbing_1_nip,
        updatedTitle.pembimbing_2_nip,
        updatedTitle.mhs_nama,
        updatedTitle.judul
      );
      const stages = [
        { id: `stage-prop-${Date.now()}`, thesis_title_id: titleId, stage_type: "seminar_proposal", status: "menunggu_jadwal", urutan: 1 },
        { id: `stage-has-${Date.now()}`, thesis_title_id: titleId, stage_type: "seminar_hasil", status: "belum_diajukan", urutan: 2 },
        { id: `stage-sdg-${Date.now()}`, thesis_title_id: titleId, stage_type: "sidang_akhir", status: "belum_diajukan", urutan: 3 }
      ];
      setThesisStages((prev) => [...stages, ...prev]);
      const studentUser = MOCK_USERS.find((u) => u.nim === updatedTitle.mhs_nim);
      const studentEmail = studentUser?.email || (updatedTitle.mhs_nim ? `${updatedTitle.mhs_nim}@student.unsri.ac.id` : "09010182428002@student.unsri.ac.id");
      const notifTitle = "Judul Tugas Akhir Resmi Ditetapkan JUDUL FIX!";
      const notifMessage = `Selamat! Pengajuan judul "${updatedTitle.judul}" telah resmi berstatus JUDUL FIX oleh Kaprodi. Dospem yang diajukan: ${updatedTitle.pembimbing_1_nama || "-"} & ${updatedTitle.pembimbing_2_nama || "-"}. Silakan persiapkan proposal Tugas Akhir Anda.`;
      const notif = {
        id: `notif-${Date.now()}-fix`,
        profile_id: updatedTitle.profile_id,
        recipient_nim: updatedTitle.mhs_nim,
        recipient_name: updatedTitle.mhs_nama,
        recipient_role: "mahasiswa",
        related_type: "thesis_title",
        title: notifTitle,
        message: notifMessage,
        is_read: false,
        is_email_sent: true,
        email_to: studentEmail,
        email_sent_at: nowIso,
        created_at: nowIso
      };
      setNotifications((prev) => [notif, ...prev]);
      sendEmailNotification(studentEmail, notifTitle, notifMessage);
    }
  };
  const remindAdvisorAboutThesis = ({
    thesisId,
    dospemNip,
    dospemNama,
    studentNama,
    studentNim,
    judul,
    similarity,
    pesan,
    channels = ["simta", "email"]
  }) => {
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    let affectedTitle = null;
    setThesisTitles((prev) => prev.map((t) => {
      if (t.id === thesisId) {
        const reminderItem = {
          id: `remind-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          tanggal: nowIso,
          dospem_nip: dospemNip,
          dospem_nama: dospemNama,
          pesan,
          similarity,
          channels
        };
        const prevReminders = Array.isArray(t.riwayat_pengingat_prodi) ? t.riwayat_pengingat_prodi : [];
        affectedTitle = {
          ...t,
          terakhir_diingatkan_prodi: nowIso,
          jumlah_diingatkan: (t.jumlah_diingatkan || 0) + 1,
          riwayat_pengingat_prodi: [reminderItem, ...prevReminders]
        };
        return affectedTitle;
      }
      return t;
    }));
    const advisorProfile = dbProfiles.find((p) => p.nip === dospemNip) || MOCK_USERS.find((u) => u.nip === dospemNip);
    const advisorEmail = advisorProfile?.email || (dospemNip ? `${dospemNip}@unsri.ac.id` : "dosen@unsri.ac.id");
    const notifTitle = `Pengingat Pembimbingan TA: Mahasiswa ${studentNama} (Similarity ${similarity}%)`;
    const notifMessage = pesan || `Yth. Bapak/Ibu ${dospemNama}, judul mahasiswa bimbingan Anda (${studentNama} - ${studentNim}): "${judul}" saat ini memiliki tingkat similarity ${similarity}%. Mohon kesediaan Bapak/Ibu untuk memberikan arahan pembimbingan intensif agar mahasiswa dapat merevisi formulasi judul/studi kasus.`;
    const newNotif = {
      id: `notif-${Date.now()}-remind-adv`,
      profile_id: advisorProfile?.id || `adv-${dospemNip}`,
      related_type: "thesis_advisor_reminder",
      title: notifTitle,
      message: notifMessage,
      is_read: false,
      is_email_sent: true,
      email_to: advisorEmail,
      email_sent_at: nowIso,
      created_at: nowIso
    };
    setNotifications((prev) => [newNotif, ...prev]);
    sendEmailNotification(advisorEmail, notifTitle, notifMessage);
    return affectedTitle;
  };
  const updateThesisAcademicStatus = (titleId, statusData) => {
    let updatedTitle = null;
    setThesisTitles((prev) => prev.map((t) => {
      if (t.id === titleId) {
        updatedTitle = {
          ...t,
          ...statusData,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        return updatedTitle;
      }
      return t;
    }));
    if (updatedTitle) {
      persistThesisTitle(updatedTitle);
    }
  };
  const sendBimbinganCadenceReminder = ({
    studentNim,
    target = "both",
    // 'mahasiswa' | 'dospem' | 'both'
    customMessage = "",
    customSubject = ""
  }) => {
    const title = thesisTitles.find((t) => String(t.mhs_nim).trim() === String(studentNim).trim());
    const reminderCadence = calculateBimbinganReminder(consultations, studentNim, 2);
    const studentUser = MOCK_USERS.find((u) => u.nim === studentNim);
    const studentEmail = studentUser?.email || `${studentNim}@student.unsri.ac.id`;
    const studentNama = title?.mhs_nama || studentUser?.nama || "Mahasiswa TA";
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const d1Nip = title?.pembimbing_1_nip;
    const d1Nama = title?.pembimbing_1_nama || title?.pembimbing_1 || "Dosen Pembimbing 1";
    const d1Profile = dbProfiles.find((p) => p.nip === d1Nip) || MOCK_USERS.find((u) => u.nip === d1Nip);
    const d1Email = d1Profile?.email || (d1Nip ? `${d1Nip}@unsri.ac.id` : "dospem1@unsri.ac.id");
    const d2Nip = title?.pembimbing_2_nip;
    const d2Nama = title?.pembimbing_2_nama || title?.pembimbing_2 || "Dosen Pembimbing 2";
    const d2Profile = dbProfiles.find((p) => p.nip === d2Nip) || MOCK_USERS.find((u) => u.nip === d2Nip);
    const d2Email = d2Profile?.email || (d2Nip ? `${d2Nip}@unsri.ac.id` : "dospem2@unsri.ac.id");
    const recipientEmails = [];
    if (target === "mahasiswa" || target === "both") recipientEmails.push(studentEmail);
    if (target === "dospem" || target === "both") {
      if (d1Email) recipientEmails.push(d1Email);
      if (d2Email) recipientEmails.push(d2Email);
    }
    const defaultSubject = reminderCadence.severity === "critical" ? `[Peringatan Kritis Prodi D3 MI] Keterlambatan Bimbingan TA (${studentNama} - ${studentNim})` : `[Pengingat Rutin Prodi D3 MI] Kewajiban Bimbingan Minimal 2x/Bulan (${studentNama})`;
    const subject = customSubject || defaultSubject;
    const defaultMessage = customMessage || (reminderCadence.daysSinceLast !== null ? `Berdasarkan pantauan sistem SIMTA Prodi D3 Manajemen Informatika, mahasiswa ${studentNama} (${studentNim}) belum melakukan bimbingan selama ${reminderCadence.daysSinceLast} hari (terakhir: ${reminderCadence.latestDateFormatted || "-"}). Sesuai ketentuan akademik, mahasiswa diwajibkan bimbingan minimal 2 kali dalam sebulan. Mohon agar mahasiswa dan dosen pembimbing segera menjadwalkan konsultasi.` : `Mahasiswa ${studentNama} (${studentNim}) belum memiliki riwayat bimbingan yang tercatat di SIMTA. Mohon agar mahasiswa segera berkonsultasi dengan Dosen Pembimbing untuk memulai proses bimbingan minimal 2 kali sebulan.`);
    recipientEmails.forEach((email) => {
      sendEmailNotification(email, subject, defaultMessage);
    });
    if (target === "mahasiswa" || target === "both") {
      const notifMhs = {
        id: `notif-cadence-${Date.now()}-mhs`,
        profile_id: studentUser?.id || `user-${studentNim}`,
        related_type: "bimbingan_cadence_reminder",
        title: subject,
        message: defaultMessage,
        is_read: false,
        is_email_sent: true,
        email_to: studentEmail,
        email_sent_at: nowIso,
        created_at: nowIso
      };
      setNotifications((prev) => [notifMhs, ...prev]);
    }
    if (target === "dospem" || target === "both") {
      [d1Profile, d2Profile].forEach((prof) => {
        if (prof) {
          const notifDospem = {
            id: `notif-cadence-${Date.now()}-dospem-${prof.nip || prof.id}`,
            profile_id: prof.id,
            related_type: "bimbingan_cadence_reminder",
            title: subject,
            message: defaultMessage,
            is_read: false,
            is_email_sent: true,
            email_to: prof.email || `${prof.nip}@unsri.ac.id`,
            email_sent_at: nowIso,
            created_at: nowIso
          };
          setNotifications((prev) => [notifDospem, ...prev]);
        }
      });
    }
    const logEntry = {
      id: `rem-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tanggal_kirim: nowIso,
      student_nim: studentNim,
      student_nama: studentNama,
      student_email: studentEmail,
      student_kelas: title?.mhs_kelas || "MI 5A",
      judul_ta: title?.judul || "Tugas Akhir D3 Manajemen Informatika",
      dospem_1_nip: d1Nip || "-",
      dospem_1_nama: d1Nama,
      dospem_1_email: d1Email,
      dospem_2_nip: d2Nip || "-",
      dospem_2_nama: d2Nama,
      dospem_2_email: d2Email,
      target_penerima: target,
      recipients_emails: recipientEmails,
      status_kepatuhan: reminderCadence.severity || "warning",
      hari_sejak_terakhir: reminderCadence.daysSinceLast || 0,
      jumlah_bimbingan_bulan_ini: reminderCadence.consultationsInLastMonth || 0,
      subjek_email: subject,
      isi_pesan: defaultMessage,
      status_pengiriman: "terkirim",
      channel: "Gmail & Notifikasi SIMTA",
      pengirim_nama: "Sistem Otomatis SIMTA (Auto-Scheduler)",
      pengirim_role: "Engine Pengingat Otomatis Sistem Prodi D3 MI"
    };
    setBimbinganReminderLogs((prev) => [logEntry, ...prev]);
    return logEntry;
  };
  const triggerSystemAutoReminders = (target = "both") => {
    const sentLogs = [];
    thesisTitles.forEach((t) => {
      const rem = calculateBimbinganReminder(consultations, t.mhs_nim, 2);
      if (rem.isReminderActive && (rem.severity === "critical" || rem.severity === "warning" || rem.severity === "empty")) {
        const log = sendBimbinganCadenceReminder({
          studentNim: t.mhs_nim,
          target
        });
        if (log) sentLogs.push(log);
      }
    });
    return sentLogs;
  };
  const sendBatchBimbinganCadenceReminders = triggerSystemAutoReminders;
  useEffect(() => {
    if (!thesisTitles || thesisTitles.length === 0 || !consultations) return;
    thesisTitles.forEach((t) => {
      const isActiveThesis = t.status === "disetujui" || t.status === "judul_fix";
      if (!isActiveThesis) return;
      const rem = calculateBimbinganReminder(consultations, t.mhs_nim, 2);
      if (rem.isReminderActive && (rem.severity === "critical" || rem.severity === "warning" || rem.severity === "empty")) {
        const key = `simta_auto_rem_sent_${t.mhs_nim}`;
        const lastSentStr = typeof window !== "undefined" ? localStorage.getItem(key) : null;
        const lastSent = lastSentStr ? Number(lastSentStr) : 0;
        const now = Date.now();
        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1e3;
        if (now - lastSent > SEVEN_DAYS) {
          try {
            if (typeof window !== "undefined") localStorage.setItem(key, String(now));
          } catch {
          }
          sendBimbinganCadenceReminder({
            studentNim: t.mhs_nim,
            target: "both"
          });
        }
      }
    });
  }, [thesisTitles?.length, consultations?.length]);
  const sendBroadcastSubmissionReminder = ({
    targetStudents = [],
    customSubject = "",
    customMessage = ""
  }) => {
    if (!targetStudents || targetStudents.length === 0) return null;
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const subject = customSubject || "[Pemberitahuan Prodi D3 MI] Pengingat Batas Pengajuan Usulan Judul Tugas Akhir";
    const defaultBody = (nama, nim) => customMessage || `Yth. ${nama} (${nim}),

Berdasarkan pantauan sistem SIMTA Program Studi D3 Manajemen Informatika FASILKOM UNSRI, Anda tercatat belum mengusulkan judul Tugas Akhir untuk semester ini.

Sesuai kalender akademik, seluruh mahasiswa tingkat akhir diwajibkan segera mengajukan usulan judul melalui sistem SIMTA untuk peninjauan topik dan penetapan dosen pembimbing. Mohon segera melengkapi judul proposal Anda melalui akun SIMTA.

Terima kasih,
Ketua Program Studi D3 Manajemen Informatika
Fakultas Ilmu Komputer, Universitas Sriwijaya`;
    const newNotifs = [];
    const recipientsSummary = [];
    targetStudents.forEach((std) => {
      const stdEmail = std.email || `${std.nim}@student.unsri.ac.id`;
      const msg = defaultBody(std.nama, std.nim);
      recipientsSummary.push({
        nim: std.nim,
        nama: std.nama,
        kelas: std.kelas || "MI 5A",
        email: stdEmail
      });
      newNotifs.push({
        id: `notif-broadcast-${Date.now()}-${std.nim}`,
        profile_id: std.id || `user-${std.nim}`,
        recipient_nim: std.nim,
        recipient_name: std.nama,
        recipient_role: "mahasiswa",
        related_type: "submission_reminder_broadcast",
        title: subject,
        message: msg,
        is_read: false,
        is_email_sent: true,
        email_to: stdEmail,
        email_sent_at: nowIso,
        created_at: nowIso
      });
      sendEmailNotification(stdEmail, subject, msg);
    });
    if (newNotifs.length > 0) {
      setNotifications((prev) => [...newNotifs, ...prev]);
    }
    const broadcastLog = {
      id: `bcast-${Date.now()}`,
      tanggal_kirim: nowIso,
      total_recipients: targetStudents.length,
      recipients: recipientsSummary,
      subjek: subject,
      pesan: customMessage || "Pengingat serentak pengajuan usulan judul TA D3 Manajemen Informatika",
      pengirim: currentUser?.nama || "Ketua Program Studi D3 Manajemen Informatika",
      channel: "Notifikasi SIMTA & Email (@student.unsri.ac.id)"
    };
    setSubmissionBroadcastLogs((prev) => [broadcastLog, ...prev]);
    return broadcastLog;
  };
  const reviewThesisTitle = (titleId, status, catatan, confirmedDospem1Nip, confirmedDospem2Nip) => {
    if (status === "disetujui" || status === "judul_fix") {
      setThesisTitleFix(titleId, confirmedDospem1Nip, confirmedDospem2Nip, catatan);
    } else {
      addProdiRevisionNote(titleId, catatan || "Terdapat catatan revisi dari rapat pembahasan Prodi.");
    }
  };
  const updateThesisTitleAdvisors = (titleId, d1Nip, d2Nip) => {
    let updatedTitle = null;
    const d1 = advisors.find((a) => a.nip === d1Nip);
    const d2 = advisors.find((a) => a.nip === d2Nip);
    const d1Nama = d1?.nama || "";
    const d2Nama = d2?.nama || "";
    setThesisTitles((prev) => {
      const updated = prev.map((t) => {
        if (t.id === titleId) {
          updatedTitle = {
            ...t,
            pembimbing_1_nip: d1Nip || "",
            pembimbing_1_nama: d1Nama,
            pembimbing_2_nip: d2Nip || "",
            pembimbing_2_nama: d2Nama,
            pembimbing_1: d1Nama,
            pembimbing_2: d2Nama,
            dospem_confirmed: true,
            // Langsung aktif diperbarui (Point 25)
            dospem_confirmed_at: (/* @__PURE__ */ new Date()).toISOString(),
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          };
          return updatedTitle;
        }
        return t;
      });
      try {
        localStorage.setItem("simta_thesis_titles", JSON.stringify(updated));
      } catch {
      }
      return updated;
    });
    if (updatedTitle) {
      persistThesisTitle(updatedTitle);
      assignStudentAdvisors(
        updatedTitle.mhs_nim,
        d1Nip,
        d2Nip,
        updatedTitle.mhs_nama,
        updatedTitle.judul
      );
    }
  };
  const confirmThesisAdvisors = (titleId) => {
    let target = thesisTitles.find((t) => t.id === titleId);
    if (!target) return;
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    target = {
      ...target,
      dospem_confirmed: true,
      dospem_confirmed_at: nowIso
    };
    setThesisTitles((prev) => {
      const updated = prev.map((t) => t.id === titleId ? target : t);
      try {
        localStorage.setItem("simta_thesis_titles", JSON.stringify(updated));
      } catch {
      }
      return updated;
    });
    persistThesisTitle(target);
    const notifMhs = {
      id: `notif-mhs-${Date.now()}`,
      profile_id: target.profile_id,
      recipient_nim: target.mhs_nim,
      recipient_name: target.mhs_nama,
      recipient_role: "mahasiswa",
      related_type: "thesis_advisor_confirmed",
      title: "Penetapan Dosen Pembimbing TA Aktif",
      message: `Dosen Pembimbing Tugas Akhir Anda untuk judul "${target.judul}" telah aktif: Pembimbing 1: ${target.pembimbing_1_nama || target.pembimbing_1 || "-"} | Pembimbing 2: ${target.pembimbing_2_nama || target.pembimbing_2 || "-"}.`,
      is_read: false,
      created_at: nowIso
    };
    setNotifications((prev) => [notifMhs, ...prev]);
  };
  const confirmAllThesisAdvisors = (titleIds = []) => {
    if (!titleIds.length) return;
    const idSet = new Set(titleIds);
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const confirmedTitles = [];
    setThesisTitles((prev) => {
      const updated = prev.map((t, idx) => {
        if (!idSet.has(t.id) || t.dospem_confirmed) return t;
        const next = {
          ...t,
          dospem_confirmed: true,
          dospem_confirmed_at: nowIso
        };
        confirmedTitles.push(next);
        return next;
      });
      try {
        localStorage.setItem("simta_thesis_titles", JSON.stringify(updated));
      } catch {
      }
      return updated;
    });
    if (confirmedTitles.length > 0) {
      persistThesisTitles(confirmedTitles);
    }
  };
  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };
  const bulkImportHistorical = (newRecords) => {
    const formatted = newRecords.map((rec, idx) => ({
      id: `hist-import-${Date.now()}-${idx}`,
      judul: rec.judul,
      judul_processed: rec.judul.toLowerCase(),
      tahun_angkatan: rec.tahun_angkatan || "2025",
      penulis: rec.penulis || "Imported Student"
    }));
    setHistoricalTitles((prev) => [...formatted, ...prev]);
  };
  const addBooking = (bookingData) => {
    const newBooking = {
      id: `book-${Date.now()}`,
      booking_code: `BK-2026-${Math.floor(1e3 + Math.random() * 9e3)}`,
      status: "menunggu_persetujuan",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      ...bookingData
    };
    setBookings((prev) => [newBooking, ...prev]);
    setThesisStages((prev) => prev.map((s) => {
      if (s.id === bookingData.thesis_stage_id) {
        return { ...s, status: "menunggu_jadwal" };
      }
      return s;
    }));
    return newBooking;
  };
  const reviewBooking = (bookingId, status, rejectionReason = "") => {
    let targetBooking = null;
    setBookings((prev) => prev.map((b) => {
      if (b.id === bookingId) {
        targetBooking = {
          ...b,
          status,
          rejection_reason: rejectionReason,
          approved_by: currentUser?.nama,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        return targetBooking;
      }
      return b;
    }));
    if (targetBooking) {
      const studentUser = MOCK_USERS.find((u) => u.nim === targetBooking.mhs_nim);
      const studentEmail = studentUser?.email || (targetBooking.mhs_nim ? `${targetBooking.mhs_nim}@student.unsri.ac.id` : "09010182428002@student.unsri.ac.id");
      const notifTitle = status === "disetujui" ? "Peminjaman Ruang Sidang Disetujui" : "Peminjaman Ruang Ditolak";
      const notifMessage = status === "disetujui" ? `Peminjaman ruang ${targetBooking.room_name} untuk ${targetBooking.stage_label || "Sidang"} pada ${targetBooking.booking_date} (${targetBooking.start_time} - ${targetBooking.end_time}) telah disetujui Admin Sarana.` : `Peminjaman ruang ${targetBooking.room_name} tidak disetujui. Alasan: ${rejectionReason || "Jadwal bentrok atau ruang tidak tersedia."}`;
      const notif = {
        id: `notif-${Date.now()}-booking`,
        profile_id: targetBooking.profile_id || studentUser?.id || "user-mhs-aulia",
        related_type: "booking",
        title: notifTitle,
        message: notifMessage,
        is_read: false,
        is_email_sent: true,
        email_to: studentEmail,
        email_sent_at: (/* @__PURE__ */ new Date()).toISOString(),
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      setNotifications((prev) => [notif, ...prev]);
      sendEmailNotification(studentEmail, notifTitle, notifMessage);
    }
  };
  const uploadThesisRepository = async (repoData) => {
    const newRepoItem = {
      id: `repo-${Date.now()}`,
      judul: repoData.judul,
      abstrak: repoData.abstrak,
      abstrak_en: repoData.abstrak_en || "",
      penulis_nama: currentUser?.nama || "Aulia Azzahra",
      penulis_nim: currentUser?.nim || "09010182428002",
      prodi: currentUser?.prodi || "D3 Manajemen Informatika",
      kelas: currentUser?.kelas || "MI 5A",
      tahun_angkatan: repoData.tahun_angkatan || "2022",
      tahun_lulus: repoData.tahun_lulus || (/* @__PURE__ */ new Date()).getFullYear().toString(),
      pembimbing_1: repoData.pembimbing_1,
      pembimbing_2: repoData.pembimbing_2,
      penguji_1: repoData.penguji_1 || "Dr. Abdiansah, S.Kom., M.Cs.",
      penguji_2: repoData.penguji_2 || "Anna Dwi Marjusalinah, S.Kom., M.Kom.",
      kata_kunci: Array.isArray(repoData.kata_kunci) ? repoData.kata_kunci : (repoData.kata_kunci || "").split(",").map((k) => k.trim()).filter(Boolean),
      file_pdf_url: repoData.file_pdf_url,
      status: "menunggu_review_kaprodi",
      catatan_kaprodi: "",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    setThesisRepositories((prev) => {
      const updated = [newRepoItem, ...prev];
      try {
        localStorage.setItem("simta_thesis_repositories", JSON.stringify(updated));
      } catch {
      }
      return updated;
    });
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from("thesis_repositories").insert([newRepoItem]);
        if (error) console.warn("Supabase repository insert warning:", error.message);
      } catch (err) {
        console.warn("Failed to insert repository to Supabase:", err);
      }
    }
    return newRepoItem;
  };
  const reviewRepositoryKaprodi = (repoId, status, catatan) => {
    setThesisRepositories((prev) => {
      const updated = prev.map((r) => {
        if (r.id === repoId) {
          return {
            ...r,
            status,
            catatan_kaprodi: catatan || r.catatan_kaprodi,
            approved_by_kaprodi: currentUser?.nama || "Kaprodi",
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          };
        }
        return r;
      });
      try {
        localStorage.setItem("simta_thesis_repositories", JSON.stringify(updated));
      } catch {
      }
      return updated;
    });
  };
  const publishRepositoryAdmin = (repoId) => {
    const repoItem = thesisRepositories.find((r) => r.id === repoId);
    if (!repoItem) return;
    const publishedArchiveItem = {
      ...repoItem,
      status: "dipublikasikan",
      published_by_admin: currentUser?.nama || "Admin Sarana",
      published_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    setThesisRepositories((prev) => {
      const updated = prev.map((r) => r.id === repoId ? publishedArchiveItem : r);
      try {
        localStorage.setItem("simta_thesis_repositories", JSON.stringify(updated));
      } catch {
      }
      return updated;
    });
    setThesisArchives((prev) => {
      const exists = prev.some((a) => a.id === repoId || a.judul === repoItem.judul);
      if (exists) return prev;
      const updatedArchives = [publishedArchiveItem, ...prev];
      try {
        localStorage.setItem("simta_thesis_archives_v2", JSON.stringify(updatedArchives));
      } catch {
      }
      return updatedArchives;
    });
  };
  const addRepositoryArchive = (item) => {
    const newItem = {
      id: item.id || `arc-${Date.now()}`,
      no: item.no || thesisArchives.length + 1,
      judul: item.judul || "",
      abstrak: item.abstrak || "",
      penulis_nama: item.penulis_nama || "",
      penulis_nim: item.penulis_nim || "",
      dosen_pa: item.dosen_pa || "",
      pembimbing_1: item.pembimbing_1 || "",
      pembimbing_2: item.pembimbing_2 || "",
      penguji_1: item.penguji_1 || "",
      penguji_2: item.penguji_2 || "",
      penguji_3: item.penguji_3 || "",
      prodi: item.prodi || "D3 Manajemen Informatika",
      tahun_ta: String(item.tahun_ta || item.year || (/* @__PURE__ */ new Date()).getFullYear()),
      tahun_lulus: String(item.tahun_lulus || item.tahun_ta || item.year || (/* @__PURE__ */ new Date()).getFullYear()),
      tahun_angkatan: String(item.tahun_angkatan || ""),
      link_repo_unsri: item.link_repo_unsri || "",
      file_pdf_url: item.file_pdf_url || item.link_repo_unsri || "",
      keywords: item.keywords || "",
      status: item.status || "dipublikasikan",
      created_at: item.created_at || (/* @__PURE__ */ new Date()).toISOString()
    };
    setThesisArchives((prev) => {
      const updated = [newItem, ...prev];
      try {
        localStorage.setItem("simta_thesis_archives_v2", JSON.stringify(updated));
      } catch {
      }
      return updated;
    });
    return newItem;
  };
  const updateRepositoryArchive = (id, updatedFields) => {
    setThesisArchives((prev) => {
      const updated = prev.map((item) => item.id === id ? { ...item, ...updatedFields, updated_at: (/* @__PURE__ */ new Date()).toISOString() } : item);
      try {
        localStorage.setItem("simta_thesis_archives_v2", JSON.stringify(updated));
      } catch {
      }
      return updated;
    });
  };
  const deleteRepositoryArchive = (id) => {
    setThesisArchives((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem("simta_thesis_archives_v2", JSON.stringify(updated));
      } catch {
      }
      return updated;
    });
  };
  const batchImportRepositoryArchives = (items) => {
    if (!Array.isArray(items) || items.length === 0) return 0;
    let importedCount = 0;
    setThesisArchives((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const existingLinks = new Set(prev.map((p) => p.link_repo_unsri).filter(Boolean));
      const newValidItems = [];
      items.forEach((item, idx) => {
        const itemLink = item.link_repo_unsri || item.url || item.link || "";
        const itemId = item.id || `arc-scraped-${Date.now()}-${idx}`;
        if (item.id && existingIds.has(item.id)) return;
        if (itemLink && existingLinks.has(itemLink)) return;
        newValidItems.push({
          id: itemId,
          no: prev.length + newValidItems.length + 1,
          judul: item.judul || item.title || "Tanpa Judul",
          abstrak: item.abstrak || item.abstract || "",
          penulis_nama: item.penulis_nama || item.author || item.nama || "",
          penulis_nim: item.penulis_nim || item.nim || "",
          dosen_pa: item.dosen_pa || item.pa || "",
          pembimbing_1: item.pembimbing_1 || item.pembimbing || item.advisor || "",
          pembimbing_2: item.pembimbing_2 || item.advisor_2 || "",
          penguji_1: item.penguji_1 || item.examiner_1 || "",
          penguji_2: item.penguji_2 || item.examiner_2 || "",
          penguji_3: item.penguji_3 || item.examiner_3 || "",
          prodi: item.prodi || item.department || "D3 Manajemen Informatika",
          tahun_ta: String(item.tahun_ta || item.year || item.tahun || (/* @__PURE__ */ new Date()).getFullYear()),
          tahun_lulus: String(item.tahun_lulus || item.tahun_ta || item.year || (/* @__PURE__ */ new Date()).getFullYear()),
          tahun_angkatan: String(item.tahun_angkatan || ""),
          link_repo_unsri: itemLink,
          file_pdf_url: item.file_pdf_url || item.pdf_url || itemLink,
          keywords: item.keywords || item.kata_kunci || "",
          status: item.status || "dipublikasikan",
          created_at: item.created_at || (/* @__PURE__ */ new Date()).toISOString()
        });
        importedCount++;
      });
      const merged = [...newValidItems, ...prev];
      try {
        localStorage.setItem("simta_thesis_archives_v2", JSON.stringify(merged));
      } catch {
      }
      return merged;
    });
    return importedCount;
  };
  const generateUUID = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
  };
  const addConsultation = async (consData) => {
    const newEntry = {
      id: generateUUID(),
      mhs_nim: currentUser?.nim || "09010182428002",
      mhs_nama: currentUser?.nama || "Aulia Azzahra",
      pembimbing: consData.pembimbing || "Pembimbing 1",
      dosen_nama: consData.dosen_nama || "Dr. Abdiansah, S.Kom., M.Cs.",
      dosen_nip: consData.dosen_nip || "",
      metode: consData.metode || "luring",
      tanggal: consData.tanggal || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      waktu: consData.waktu || "10:00",
      bab_topik: consData.bab_topik,
      catatan_mahasiswa: consData.catatan_mahasiswa,
      masukan_dosen: "",
      file_revisi_url: consData.file_revisi_url || "",
      status: "menunggu_tanggapan",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    setConsultations((prev) => {
      const updated = [newEntry, ...prev];
      try {
        localStorage.setItem("simta_consultations", JSON.stringify(updated));
      } catch {
      }
      return updated;
    });
    if (isSupabaseConfigured && supabase) {
      try {
        const fullPayload = {
          id: newEntry.id,
          mhs_nim: newEntry.mhs_nim,
          mhs_nama: newEntry.mhs_nama,
          pembimbing: newEntry.pembimbing,
          dosen_nama: newEntry.dosen_nama,
          dosen_nip: newEntry.dosen_nip,
          metode: newEntry.metode,
          tanggal: newEntry.tanggal,
          waktu: newEntry.waktu,
          bab_topik: newEntry.bab_topik,
          catatan_mahasiswa: newEntry.catatan_mahasiswa,
          masukan_dosen: newEntry.masukan_dosen,
          file_revisi_url: newEntry.file_revisi_url,
          status: newEntry.status,
          created_at: newEntry.created_at
        };
        let { error } = await supabase.from("thesis_consultations").insert([fullPayload]);
        if (error && (error.code === "42703" || error.code === "PGRST204" || String(error.message || "").includes("does not exist") || String(error.message || "").includes("Could not find"))) {
          const { dosen_nip, metode, ...minimalPayload } = fullPayload;
          const retry = await supabase.from("thesis_consultations").insert([minimalPayload]);
          error = retry.error;
          if (error) {
            console.warn("Supabase consultation insert warning:", error.message);
          } else {
            console.warn("Konsultasi tersimpan tanpa kolom metode/dosen_nip. Jalankan scripts/thesis_titles_realtime.sql agar grafik metode & peringkat dosen terisi.");
          }
        } else if (error) {
          console.warn("Supabase consultation insert warning:", error.message);
        }
      } catch (err) {
        console.warn("Failed to insert consultation to Supabase:", err);
      }
    }
    return newEntry;
  };
  const reviewConsultation = async (consultationId, status, feedbackNotes, jenisRevisi) => {
    let targetCons = null;
    const resolvedJenisRevisi = jenisRevisi || (status === "disetujui" ? "Diterima" : status === "ditolak" ? "Ditolak" : status === "perlu_revisi" ? "Minor" : "Minor");
    let noteWithTag = feedbackNotes || "";
    if (resolvedJenisRevisi) {
      const cleanNote = noteWithTag.replace(/^\[(Revisi Mayor|Revisi Minor|Mayor|Minor|Menunggu|Diterima|Disetujui|Ditolak)\]\s*/i, "");
      const tagLabel = resolvedJenisRevisi === "Mayor" ? "Revisi Mayor" : resolvedJenisRevisi === "Minor" ? "Revisi Minor" : resolvedJenisRevisi;
      noteWithTag = `[${tagLabel}] ${cleanNote}`.trim();
    }
    setConsultations((prev) => {
      const updated = prev.map((c) => {
        if (String(c.id) === String(consultationId)) {
          targetCons = {
            ...c,
            status,
            jenis_revisi: resolvedJenisRevisi,
            masukan_dosen: noteWithTag,
            reviewed_at: (/* @__PURE__ */ new Date()).toISOString()
          };
          return targetCons;
        }
        return c;
      });
      try {
        localStorage.setItem("simta_consultations", JSON.stringify(updated));
      } catch {
      }
      return updated;
    });
    if (targetCons) {
      const studentUser = MOCK_USERS.find((u) => u.nim === targetCons.mhs_nim);
      const studentEmail = studentUser?.email || (targetCons.mhs_nim ? `${targetCons.mhs_nim}@student.unsri.ac.id` : "09010182428002@student.unsri.ac.id");
      const notifTitle = status === "disetujui" ? `Bimbingan Disetujui (${resolvedJenisRevisi})` : `Tanggapan Bimbingan: Revisi ${resolvedJenisRevisi}`;
      const notifMessage = `${currentUser?.nama || targetCons.dosen_nama || "Dosen Pembimbing"} telah memvalidasi bimbingan dengan kategori "${resolvedJenisRevisi}": "${feedbackNotes || "Silakan periksa catatan dan kartu bimbingan Anda."}"`;
      const notif = {
        id: `notif-${Date.now()}-cons`,
        profile_id: studentUser?.id || "user-mhs-aulia",
        related_type: "consultation",
        title: notifTitle,
        message: notifMessage,
        is_read: false,
        is_email_sent: true,
        email_to: studentEmail,
        email_sent_at: (/* @__PURE__ */ new Date()).toISOString(),
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      setNotifications((prev) => [notif, ...prev]);
      sendEmailNotification(studentEmail, notifTitle, notifMessage);
    }
    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          status,
          masukan_dosen: noteWithTag
        };
        const { error } = await supabase.from("thesis_consultations").update(payload).eq("id", consultationId);
        if (error) console.warn("Supabase consultation review warning:", error.message);
      } catch (err) {
        console.warn("Failed to review consultation in Supabase:", err);
      }
    }
  };
  const updateConsultation = async (consultationId, updatedFields) => {
    let finalItem = null;
    setConsultations((prev) => {
      const updated = prev.map((c) => {
        if (c.id === consultationId) {
          finalItem = {
            ...c,
            ...updatedFields,
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          };
          return finalItem;
        }
        return c;
      });
      try {
        localStorage.setItem("simta_consultations", JSON.stringify(updated));
      } catch {
      }
      return updated;
    });
    if (isSupabaseConfigured && supabase) {
      try {
        const { dosen_nip, metode, ...safeFields } = updatedFields;
        const { error } = await supabase.from("thesis_consultations").update({
          ...safeFields,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }).eq("id", consultationId);
        if (error) console.warn("Supabase consultation update warning:", error.message);
      } catch (err) {
        console.warn("Failed to update consultation in Supabase:", err);
      }
    }
    return finalItem;
  };
  const [dbProfiles, setDbProfiles] = useState([]);
  const getAllMahasiswaAccounts = () => {
    const localReg = getRegisteredUsers().filter((u) => u.role === "mahasiswa");
    const mockMhs = MOCK_USERS.filter((u) => u.role === "mahasiswa");
    const remoteProfiles = dbProfiles.filter((p) => p.role === "mahasiswa");
    const accountMap = /* @__PURE__ */ new Map();
    studentAdvisors.forEach((sa) => {
      const nim = String(sa.student_nim || "").trim();
      if (nim) {
        accountMap.set(nim, {
          id: `mhs-${nim}`,
          nim,
          nip: nim,
          nama: sa.student_nama || "Mahasiswa SIMTA",
          email: `${nim}@student.unsri.ac.id`,
          no_hp: sa.no_hp || "-",
          prodi: sa.prodi || "D3 Manajemen Informatika",
          kelas: sa.kelas || "MI 5A",
          role: "mahasiswa",
          status: sa.status || "aktif",
          judul_ta: sa.judul_ta || "",
          created_at: sa.created_at || "2026-09-01T08:00:00.000Z"
        });
      }
    });
    mockMhs.forEach((u) => {
      const nim = String(u.nim || "").trim();
      if (nim) {
        const existing = accountMap.get(nim);
        accountMap.set(nim, {
          id: u.id || existing?.id || `mhs-${nim}`,
          nim,
          nip: nim,
          nama: u.nama || existing?.nama || "Mahasiswa",
          email: u.email || existing?.email || `${nim}@student.unsri.ac.id`,
          no_hp: u.no_hp || existing?.no_hp || "-",
          prodi: u.prodi || existing?.prodi || "D3 Manajemen Informatika",
          kelas: u.kelas || existing?.kelas || "MI 5A",
          role: "mahasiswa",
          status: u.status || existing?.status || "aktif",
          created_at: u.created_at || existing?.created_at || "2026-09-01T08:00:00.000Z"
        });
      }
    });
    remoteProfiles.forEach((p) => {
      const nim = String(p.nim || p.nip || "").trim();
      if (nim) {
        const existing = accountMap.get(nim);
        accountMap.set(nim, {
          id: p.id || existing?.id || `mhs-${nim}`,
          nim,
          nip: nim,
          nama: p.nama || existing?.nama || "Mahasiswa",
          email: p.email || existing?.email || `${nim}@student.unsri.ac.id`,
          no_hp: p.no_hp || existing?.no_hp || "-",
          prodi: p.prodi || existing?.prodi || "D3 Manajemen Informatika",
          kelas: p.kelas || existing?.kelas || "MI 5A",
          role: "mahasiswa",
          status: p.status || existing?.status || "aktif",
          created_at: p.created_at || existing?.created_at || (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    });
    localReg.forEach((u) => {
      const nim = String(u.nim || u.nip || "").trim();
      if (nim) {
        const existing = accountMap.get(nim);
        accountMap.set(nim, {
          id: u.id || existing?.id || `mhs-${nim}`,
          nim,
          nip: nim,
          nama: u.nama || existing?.nama || "Mahasiswa",
          email: u.email || existing?.email || `${nim}@student.unsri.ac.id`,
          no_hp: u.no_hp || existing?.no_hp || "-",
          prodi: u.prodi || existing?.prodi || "D3 Manajemen Informatika",
          kelas: u.kelas || existing?.kelas || "MI 5A",
          role: "mahasiswa",
          status: u.status || existing?.status || "aktif",
          created_at: u.created_at || existing?.created_at || (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    });
    return Array.from(accountMap.values());
  };
  const getAllDosenAccounts = () => {
    const mockDosen = MOCK_USERS.filter((u) => u.role === "dosen" || u.role === "kaprodi");
    const remoteDosenProfiles = dbProfiles.filter((p) => p.role === "dosen" || p.role === "kaprodi");
    const accountMap = /* @__PURE__ */ new Map();
    advisors.forEach((adv) => {
      const nip = String(adv.nip || "").trim();
      if (nip) {
        accountMap.set(nip, {
          id: adv.id || `adv-${nip}`,
          nip,
          nim: nip,
          nama: adv.nama || "Dosen Pembimbing",
          email: adv.email || `${nip}@unsri.ac.id`,
          no_hp: adv.no_hp || "-",
          prodi: adv.prodi || "D3 Manajemen Informatika",
          jabatan_fungsional: adv.jabatan_fungsional || "Asisten Ahli",
          keahlian: Array.isArray(adv.keahlian) ? adv.keahlian : (adv.keahlian || "").split(",").map((s) => s.trim()).filter(Boolean),
          kuota_dospem1: Number(adv.kuota_dospem1) || 8,
          kuota_dospem2: Number(adv.kuota_dospem2) || 8,
          role: nip === "198410012009121005" ? "kaprodi" : "dosen",
          status: adv.status || "aktif",
          created_at: adv.created_at || "2026-09-01T08:00:00.000Z"
        });
      }
    });
    mockDosen.forEach((u) => {
      const nip = String(u.nip || u.nim || "").trim();
      if (nip) {
        const existing = accountMap.get(nip);
        accountMap.set(nip, {
          id: u.id || existing?.id || `adv-${nip}`,
          nip,
          nim: nip,
          nama: u.nama || existing?.nama || "Dosen",
          email: u.email || existing?.email || `${nip}@unsri.ac.id`,
          no_hp: u.no_hp || existing?.no_hp || "-",
          prodi: u.prodi || existing?.prodi || "D3 Manajemen Informatika",
          jabatan_fungsional: u.jabatan_fungsional || existing?.jabatan_fungsional || "Asisten Ahli",
          keahlian: existing?.keahlian || ["Sistem Informasi", "Rekayasa Perangkat Lunak"],
          kuota_dospem1: existing?.kuota_dospem1 || 8,
          kuota_dospem2: existing?.kuota_dospem2 || 8,
          role: u.role || existing?.role || "dosen",
          status: u.status || existing?.status || "aktif",
          created_at: u.created_at || existing?.created_at || "2026-09-01T08:00:00.000Z"
        });
      }
    });
    remoteDosenProfiles.forEach((p) => {
      const nip = String(p.nip || p.nim || "").trim();
      if (nip) {
        const existing = accountMap.get(nip);
        accountMap.set(nip, {
          id: p.id || existing?.id || `adv-${nip}`,
          nip,
          nim: nip,
          nama: p.nama || existing?.nama || "Dosen",
          email: p.email || existing?.email || `${nip}@unsri.ac.id`,
          no_hp: p.no_hp || existing?.no_hp || "-",
          prodi: p.prodi || existing?.prodi || "D3 Manajemen Informatika",
          jabatan_fungsional: p.jabatan_fungsional || existing?.jabatan_fungsional || "Asisten Ahli",
          keahlian: existing?.keahlian || ["Sistem Informasi"],
          kuota_dospem1: existing?.kuota_dospem1 || 8,
          kuota_dospem2: existing?.kuota_dospem2 || 8,
          role: p.role || existing?.role || "dosen",
          status: p.status || existing?.status || "aktif",
          created_at: p.created_at || existing?.created_at || (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    });
    return Array.from(accountMap.values()).filter((d) => {
      const nip = String(d.nip || d.nim || "");
      const nama = String(d.nama || "").toLowerCase();
      const id = String(d.id || "");
      return id !== "user-kaprodi-hendra" && id !== "5ccb09e6-7a1e-4ada-8b08-5df0d406bd40" && nip !== "197805122005011002" && !nama.includes("hendra kusuma") && !nama.includes("indra") && !nama.includes("budi dosen") && !nama.includes("ahmad zaki") && !nama.includes("ahmad dahlan");
    });
  };
  const addMahasiswaAccount = async (accountData) => {
    const cleanNim = String(accountData.nim || "").trim();
    const cleanEmail = (accountData.email || `${cleanNim}@student.unsri.ac.id`).toLowerCase().trim();
    const newStudent = {
      id: `user-mhs-${cleanNim}`,
      nim: cleanNim,
      nip: cleanNim,
      nama: (accountData.nama || "").trim(),
      email: cleanEmail,
      no_hp: (accountData.no_hp || "").trim(),
      prodi: accountData.prodi || "D3 Manajemen Informatika",
      kelas: accountData.kelas || "MI 5A",
      role: "mahasiswa",
      status: accountData.status || "aktif",
      password: accountData.password || cleanNim,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    saveRegisteredUser(newStudent);
    setDbProfiles((prev) => [newStudent, ...prev]);
    if (isSupabaseConfigured && supabase) {
      try {
        const { status, password, ...supabasePayload } = newStudent;
        await supabase.from("profiles").upsert(supabasePayload, { onConflict: "id" });
      } catch (e) {
        console.warn("Supabase profile upsert error:", e);
      }
    }
    return newStudent;
  };
  const updateMahasiswaAccount = async (idOrNim, updatedFields) => {
    const cleanKey = String(idOrNim).trim();
    try {
      const users = getRegisteredUsers();
      const idx = users.findIndex((u) => u.id === cleanKey || u.nim === cleanKey || u.email === cleanKey);
      if (idx >= 0) {
        users[idx] = { ...users[idx], ...updatedFields, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
        localStorage.setItem("simta_registered_users", JSON.stringify(users));
      } else {
        users.unshift({ id: cleanKey, nim: cleanKey, ...updatedFields, updated_at: (/* @__PURE__ */ new Date()).toISOString() });
        localStorage.setItem("simta_registered_users", JSON.stringify(users));
      }
    } catch (e) {
    }
    setDbProfiles((prev) => {
      const exists = prev.some((p) => p.id === cleanKey || p.nim === cleanKey);
      if (exists) {
        return prev.map((p) => p.id === cleanKey || p.nim === cleanKey ? { ...p, ...updatedFields } : p);
      }
      return [{ id: cleanKey, nim: cleanKey, ...updatedFields }, ...prev];
    });
    if (isSupabaseConfigured && supabase) {
      try {
        const { status, password, ...supabasePayload } = updatedFields;
        if (Object.keys(supabasePayload).length > 0) {
          await supabase.from("profiles").update(supabasePayload).or(`id.eq.${cleanKey},nim.eq.${cleanKey}`);
        }
      } catch (err) {
        console.warn("Supabase update student profile error:", err);
      }
    }
  };
  const deleteMahasiswaAccount = async (idOrNim) => {
    const cleanKey = String(idOrNim).trim();
    try {
      const users = getRegisteredUsers();
      const updated = users.filter((u) => u.id !== cleanKey && u.nim !== cleanKey && u.email !== cleanKey);
      localStorage.setItem("simta_registered_users", JSON.stringify(updated));
    } catch (e) {
    }
    setDbProfiles((prev) => prev.filter((p) => p.id !== cleanKey && p.nim !== cleanKey));
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("profiles").delete().or(`id.eq.${cleanKey},nim.eq.${cleanKey}`);
      } catch (err) {
        console.warn("Supabase delete student error:", err);
      }
    }
  };
  const resetMahasiswaPassword = async (idOrNim, newPassword) => {
    const cleanKey = String(idOrNim).trim();
    const finalPass = newPassword || cleanKey;
    try {
      const users = getRegisteredUsers();
      const idx = users.findIndex((u) => u.id === cleanKey || u.nim === cleanKey || u.email === cleanKey);
      if (idx >= 0) {
        users[idx].password = finalPass;
        localStorage.setItem("simta_registered_users", JSON.stringify(users));
      } else {
        users.unshift({ id: cleanKey, nim: cleanKey, password: finalPass });
        localStorage.setItem("simta_registered_users", JSON.stringify(users));
      }
    } catch (e) {
    }
    return true;
  };
  const addDosenAccount = async (dosenData) => {
    const cleanNip = String(dosenData.nip || "").trim();
    const cleanEmail = (dosenData.email || `${cleanNip}@unsri.ac.id`).toLowerCase().trim();
    const newAdv = {
      id: `adv-${cleanNip}`,
      nip: cleanNip,
      nim: cleanNip,
      nama: (dosenData.nama || "").trim(),
      email: cleanEmail,
      no_hp: (dosenData.no_hp || "").trim(),
      prodi: dosenData.prodi || "D3 Manajemen Informatika",
      jabatan_fungsional: dosenData.jabatan_fungsional || "Asisten Ahli",
      keahlian: Array.isArray(dosenData.keahlian) ? dosenData.keahlian : (dosenData.keahlian || "").split(",").map((s) => s.trim()).filter(Boolean),
      kuota_dospem1: Number(dosenData.kuota_dospem1) || 8,
      kuota_dospem2: Number(dosenData.kuota_dospem2) || 8,
      role: dosenData.role || "dosen",
      status: dosenData.status || "aktif",
      password: dosenData.password || cleanNip,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    addAdvisor(newAdv);
    saveRegisteredUser(newAdv);
    if (isSupabaseConfigured && supabase) {
      try {
        const { password, role, ...advisorPayload } = newAdv;
        await supabase.from("advisors").upsert(advisorPayload, { onConflict: "nip" });
        const { status, keahlian, kuota_dospem1, kuota_dospem2, jabatan_fungsional, ...profilePayload } = newAdv;
        await supabase.from("profiles").upsert(profilePayload, { onConflict: "id" });
      } catch (err) {
        console.warn("Supabase dosen sync error:", err);
      }
    }
    return newAdv;
  };
  const updateDosenAccount = async (idOrNip, updatedFields) => {
    const cleanKey = String(idOrNip).trim();
    const adv = advisors.find((a) => a.id === cleanKey || a.nip === cleanKey);
    if (adv) {
      updateAdvisor(adv.id, updatedFields);
    }
    try {
      const users = getRegisteredUsers();
      const idx = users.findIndex((u) => u.id === cleanKey || u.nip === cleanKey || u.email === cleanKey);
      if (idx >= 0) {
        users[idx] = { ...users[idx], ...updatedFields };
        localStorage.setItem("simta_registered_users", JSON.stringify(users));
      }
    } catch (e) {
    }
    if (isSupabaseConfigured && supabase) {
      try {
        const { password, role, ...advPayload } = updatedFields;
        if (Object.keys(advPayload).length > 0) {
          await supabase.from("advisors").update(advPayload).or(`id.eq.${cleanKey},nip.eq.${cleanKey}`);
        }
      } catch (err) {
        console.warn("Supabase update dosen error:", err);
      }
    }
  };
  const deleteDosenAccount = async (idOrNip) => {
    const cleanKey = String(idOrNip).trim();
    const adv = advisors.find((a) => a.id === cleanKey || a.nip === cleanKey);
    if (adv) {
      deleteAdvisor(adv.id);
    }
    try {
      const users = getRegisteredUsers();
      const updated = users.filter((u) => u.id !== cleanKey && u.nip !== cleanKey && u.email !== cleanKey);
      localStorage.setItem("simta_registered_users", JSON.stringify(updated));
    } catch (e) {
    }
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("advisors").delete().or(`id.eq.${cleanKey},nip.eq.${cleanKey}`);
        await supabase.from("profiles").delete().or(`id.eq.${cleanKey},nip.eq.${cleanKey}`);
      } catch (err) {
        console.warn("Supabase delete dosen error:", err);
      }
    }
  };
  const resetDosenPassword = async (idOrNip, newPassword) => {
    const cleanKey = String(idOrNip).trim();
    const finalPass = newPassword || cleanKey;
    try {
      const users = getRegisteredUsers();
      const idx = users.findIndex((u) => u.id === cleanKey || u.nip === cleanKey || u.email === cleanKey);
      if (idx >= 0) {
        users[idx].password = finalPass;
        localStorage.setItem("simta_registered_users", JSON.stringify(users));
      } else {
        users.unshift({ id: cleanKey, nip: cleanKey, password: finalPass });
        localStorage.setItem("simta_registered_users", JSON.stringify(users));
      }
    } catch (e) {
    }
    return true;
  };
  const requestPasswordReset = async (identifier) => {
    const term = String(identifier || "").trim().toLowerCase();
    if (!term) {
      throw new Error("Masukkan NIM, NIP, atau Email Anda.");
    }
    const registered = getRegisteredUsers();
    const allStudents = getAllMahasiswaAccounts();
    const allDosen = getAllDosenAccounts();
    const allAccounts = [...registered, ...allStudents, ...allDosen, ...MOCK_USERS];
    const matched = allAccounts.find(
      (u) => u.nim && String(u.nim).toLowerCase() === term || u.nip && String(u.nip).toLowerCase() === term || u.email && String(u.email).toLowerCase() === term || u.id && String(u.id).toLowerCase() === term
    );
    if (!matched) {
      throw new Error("Akun dengan NIM / NIP atau Email tersebut tidak ditemukan dalam sistem SIMTA.");
    }
    const token = Math.floor(1e5 + Math.random() * 9e5).toString();
    const resetEntry = {
      token,
      email: matched.email,
      identifier: matched.nim || matched.nip || matched.email,
      nama: matched.nama,
      role: matched.role,
      expires_at: Date.now() + 30 * 60 * 1e3
      // 30 minutes
    };
    try {
      const activeResets = JSON.parse(localStorage.getItem("simta_reset_tokens") || "[]");
      const filtered = activeResets.filter((r) => r.email !== matched.email);
      filtered.push(resetEntry);
      localStorage.setItem("simta_reset_tokens", JSON.stringify(filtered));
    } catch (e) {
    }
    if (isSupabaseConfigured && supabase && matched.email && matched.email.includes("@")) {
      try {
        await supabase.auth.resetPasswordForEmail(matched.email, {
          redirectTo: `${window.location.origin}/reset-password`
        });
      } catch (err) {
        console.warn("Supabase password reset warning:", err);
      }
    }
    return {
      success: true,
      token,
      email: matched.email,
      user: matched,
      message: `Tautan verifikasi reset kata sandi telah disiapkan untuk ${matched.email}`
    };
  };
  const confirmPasswordReset = async ({ emailOrToken, newPassword }) => {
    const key = String(emailOrToken || "").trim().toLowerCase();
    const pass = String(newPassword || "").trim();
    if (!pass || pass.length < 6) {
      throw new Error("Kata sandi baru minimal harus 6 karakter.");
    }
    let targetEmail = key;
    try {
      const activeResets = JSON.parse(localStorage.getItem("simta_reset_tokens") || "[]");
      const foundReset = activeResets.find(
        (r) => r.token === key || r.email.toLowerCase() === key || r.identifier && r.identifier.toLowerCase() === key
      );
      if (foundReset) {
        targetEmail = foundReset.email.toLowerCase();
      }
    } catch (e) {
    }
    const registered = getRegisteredUsers();
    let updated = false;
    const nextUsers = registered.map((u) => {
      if (u.email && u.email.toLowerCase() === targetEmail || u.nim && u.nim.toLowerCase() === key || u.nip && u.nip.toLowerCase() === key || u.id && u.id.toLowerCase() === key) {
        updated = true;
        return { ...u, password: pass };
      }
      return u;
    });
    if (!updated) {
      nextUsers.unshift({
        id: `user-reset-${Date.now()}`,
        email: targetEmail,
        password: pass
      });
    }
    localStorage.setItem("simta_registered_users", JSON.stringify(nextUsers));
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.updateUser({ password: pass });
      } catch (err) {
        console.warn("Supabase updateUser password error:", err);
      }
    }
    return {
      success: true,
      message: "Kata sandi akun Anda berhasil diperbarui. Silakan login kembali."
    };
  };
  const getAllRegisteredStudents = () => {
    return getAllMahasiswaAccounts();
  };
  const addStudentUser = async (studentData) => {
    return addMahasiswaAccount(studentData);
  };
  const updateStudentUser = async (id, updatedFields) => {
    return updateMahasiswaAccount(id, updatedFields);
  };
  const deleteStudentUser = async (id) => {
    return deleteMahasiswaAccount(id);
  };
  return /* @__PURE__ */ React.createElement(AuthContext.Provider, { value: {
    currentUser,
    setCurrentUser,
    updateUserProfile,
    isAuthenticated,
    login,
    logout,
    registerStudent,
    switchRole,
    dbProfiles,
    getAllMahasiswaAccounts,
    getAllDosenAccounts,
    addMahasiswaAccount,
    updateMahasiswaAccount,
    deleteMahasiswaAccount,
    resetMahasiswaPassword,
    addDosenAccount,
    updateDosenAccount,
    deleteDosenAccount,
    resetDosenPassword,
    requestPasswordReset,
    confirmPasswordReset,
    getAllRegisteredStudents,
    addStudentUser,
    updateStudentUser,
    deleteStudentUser,
    thesisTitles,
    historicalTitles,
    thesisStages,
    bookings,
    rooms,
    setRooms,
    buildings,
    roomPriorities,
    setRoomPriorities,
    notifications,
    departments,
    addDepartment,
    thesisArchives,
    addRepositoryArchive,
    updateRepositoryArchive,
    deleteRepositoryArchive,
    batchImportRepositoryArchives,
    thesisRepositories,
    uploadThesisRepository,
    reviewRepositoryKaprodi,
    publishRepositoryAdmin,
    consultations,
    addConsultation,
    updateConsultation,
    reviewConsultation,
    advisors,
    studentAdvisors,
    addAdvisor,
    updateAdvisor,
    deleteAdvisor,
    bulkImportAdvisors,
    assignStudentAdvisors,
    bulkAssignStudentAdvisors,
    getStudentAdvisors,
    addThesisTitle,
    cancelThesisTitle,
    validateThesisTitleDosen,
    reviewThesisTitle,
    addProdiRevisionNote,
    reviseThesisTitle,
    setThesisTitleFix,
    remindAdvisorAboutThesis,
    updateThesisAcademicStatus,
    updateThesisTitleAdvisors,
    confirmThesisAdvisors,
    confirmAllThesisAdvisors,
    markAllNotificationsAsRead,
    bulkImportHistorical,
    addBooking,
    reviewBooking,
    adminDocuments,
    addAdminDocument,
    updateAdminDocument,
    deleteAdminDocument,
    adminCmsContents,
    addAdminCms,
    updateAdminCms,
    deleteAdminCms,
    adminTemplates,
    addAdminTemplate,
    updateAdminTemplate,
    deleteAdminTemplate,
    defenseSchedules,
    addDefenseSchedule,
    updateDefenseSchedule,
    deleteDefenseSchedule,
    bimbinganReminderLogs,
    sendBimbinganCadenceReminder,
    sendBatchBimbinganCadenceReminders,
    triggerSystemAutoReminders,
    submissionBroadcastLogs,
    sendBroadcastSubmissionReminder
  } }, children);
}
export const useAuth = () => useContext(AuthContext);
