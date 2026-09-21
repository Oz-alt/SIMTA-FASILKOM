import React, { createContext, useContext, useState, useEffect } from 'react';
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
  MOCK_ADVISOR_SCHEDULES,
  MOCK_ADVISORS,
  MOCK_STUDENT_ADVISORS,
  MOCK_ADMIN_DOCUMENTS,
  MOCK_ADMIN_CMS,
  MOCK_ADMIN_TEMPLATES
} from '../services/mockData.js';

const AuthContext = createContext();

import { supabase, isSupabaseConfigured } from '../services/supabase.js';

export function AuthProvider({ children }) {
  // Helper to sanitize profile names to guarantee full name and correct role are used
  const sanitizeProfile = (user) => {
    if (!user) return null;
    let cleanNama = user.nama;

    if (user.role === 'kaprodi') {
      if (!cleanNama || cleanNama === 'Mahasiswa UNSRI' || cleanNama === 'Pengguna SIMTA' || cleanNama === 'Aulia Azzahra' || /^\d+$/.test(cleanNama)) {
        cleanNama = 'Dr. Ir. Hendra Kusuma, M.T.';
      }
      return {
        ...user,
        nama: cleanNama,
        role: 'kaprodi',
        nip: user.nip || user.nim || '197805122005011002',
        nim: user.nip || user.nim || '197805122005011002',
        kelas: 'Dosen / Kaprodi'
      };
    }

    if (user.role === 'admin_sarana') {
      if (!cleanNama || cleanNama === 'Mahasiswa UNSRI' || cleanNama === 'Pengguna SIMTA' || cleanNama === 'Aulia Azzahra' || /^\d+$/.test(cleanNama)) {
        cleanNama = 'Budi Santoso, S.Kom. (Admin Ruang)';
      }
      return {
        ...user,
        nama: cleanNama,
        role: 'admin_sarana',
        kelas: 'Admin Sarana'
      };
    }

    if (user.role === 'admin') {
      if (!cleanNama || cleanNama === 'Mahasiswa UNSRI' || cleanNama === 'Pengguna SIMTA' || cleanNama === 'Aulia Azzahra' || /^\d+$/.test(cleanNama)) {
        cleanNama = 'Rina Agustina, S.Kom. (Admin SIMTA)';
      }
      return {
        ...user,
        nama: cleanNama,
        role: 'admin',
        kelas: 'Admin SIMTA'
      };
    }

    // Default for Mahasiswa
    if (!cleanNama || cleanNama === 'Mahasiswa UNSRI' || cleanNama === 'Pengguna SIMTA' || cleanNama === 'Dr. Ir. Hendra Kusuma, M.T.' || /^\d+$/.test(cleanNama)) {
      cleanNama = 'Aulia Azzahra';
    }

    let cleanNim = user.nim || '09010182428002';
    if (cleanNim === '090108148002') {
      cleanNim = '09010182428002';
    }

    return { ...user, nama: cleanNama, nim: cleanNim };
  };

  // Helper to read all registered user accounts from localStorage
  const getRegisteredUsers = () => {
    try {
      const saved = localStorage.getItem('simta_registered_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitizedList = parsed.map(u => sanitizeProfile(u));
          
          // Deduplicate entries by role + name
          const uniqueMap = new Map();
          sanitizedList.forEach(u => {
            if (u && u.nama) {
              const key = u.role === 'mahasiswa' ? `mhs-${u.nama.toLowerCase()}` : (u.id || u.email || u.nip);
              if (!uniqueMap.has(key) || u.nim === '09010182428002') {
                uniqueMap.set(key, u);
              }
            }
          });

          const deduplicated = Array.from(uniqueMap.values());
          localStorage.setItem('simta_registered_users', JSON.stringify(deduplicated));
          return deduplicated;
        }
      }
    } catch {}
    
    const defaultRegistered = [
      {
        id: 'user-mhs-aulia',
        nama: 'Aulia Azzahra',
        nim: '09010182428002',
        email: '09010182428001@student.unsri.ac.id',
        no_hp: '121920129102933',
        role: 'mahasiswa',
        kelas: 'MI 5A'
      }
    ];
    try {
      localStorage.setItem('simta_registered_users', JSON.stringify(defaultRegistered));
    } catch {}
    return defaultRegistered;
  };

  // Helper to read initial user from localStorage
  const getSavedUser = () => {
    try {
      const saved = localStorage.getItem('simta_active_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        const clean = sanitizeProfile(parsed);
        if (clean) {
          localStorage.setItem('simta_active_user', JSON.stringify(clean));
          return clean;
        }
      }
    } catch {}
    
    const registered = getRegisteredUsers();
    return registered[0] || null;
  };

  // Helper to store a new registered user in localStorage
  const saveRegisteredUser = (user) => {
    try {
      const users = getRegisteredUsers();
      const existingIdx = users.findIndex(u => u.id === user.id || u.email === user.email || (u.nim && u.nim === user.nim));
      if (existingIdx >= 0) {
        users[existingIdx] = { ...users[existingIdx], ...user };
      } else {
        users.unshift(user);
      }
      localStorage.setItem('simta_registered_users', JSON.stringify(users));
    } catch (e) {
      console.warn('Failed to save registered user locally:', e);
    }
  };

  // Current active user & auth state
  const [currentUser, setCurrentUserState] = useState(getSavedUser);
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getSavedUser());
  
  // Setter helper that syncs state with localStorage
  const setCurrentUser = (user) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem('simta_active_user', JSON.stringify(user));
      saveRegisteredUser(user);
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('simta_active_user');
      setIsAuthenticated(false);
    }
  };

  // Update active user profile fields and sync locally & with Supabase
  const updateUserProfile = async (updatedFields) => {
    if (!currentUser) return;
    const merged = { ...currentUser, ...updatedFields };
    setCurrentUser(merged);

    if (isSupabaseConfigured && supabase && currentUser.id) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update(updatedFields)
          .eq('id', currentUser.id);
        if (error) {
          console.warn('Supabase profile update warning:', error.message);
        }
      } catch (err) {
        console.warn('Failed to sync profile update to Supabase:', err);
      }
    }
  };

  // Reactive state databases
  const [thesisTitles, setThesisTitles] = useState(MOCK_THESIS_TITLES);
  const [historicalTitles, setHistoricalTitles] = useState(MOCK_HISTORICAL_TITLES);
  const [thesisStages, setThesisStages] = useState(MOCK_THESIS_STAGES);
  const [bookings, setBookings] = useState(MOCK_BOOKINGS);
  const [rooms, setRooms] = useState(MOCK_ROOMS);
  const [buildings, setBuildings] = useState(MOCK_BUILDINGS);
  const [roomPriorities, setRoomPriorities] = useState(MOCK_ROOM_PRIORITIES);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  // ── Admin SIMTA: Dokumen, CMS, Template ─────────────────────────────────
  // State diinisialisasi dari mock; Supabase di-fetch on mount (lihat useEffect)
  const [adminDocuments, setAdminDocuments] = useState(MOCK_ADMIN_DOCUMENTS);

  const addAdminDocument = async (data) => {
    const doc = {
      id: `doc-${Date.now()}`,
      ...data,
      tanggal_upload: new Date().toISOString().split('T')[0],
      uploader: 'Admin SIMTA',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setAdminDocuments(prev => [doc, ...prev]);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('admin_documents').insert([doc]);
      if (error) console.warn('Supabase admin_documents insert warning:', error.message);
    }
    return doc;
  };

  const updateAdminDocument = async (id, fields) => {
    const updated_at = new Date().toISOString();
    setAdminDocuments(prev => prev.map(d => d.id === id ? { ...d, ...fields, updated_at } : d));
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('admin_documents').update({ ...fields, updated_at }).eq('id', id);
      if (error) console.warn('Supabase admin_documents update warning:', error.message);
    }
  };

  const deleteAdminDocument = async (id) => {
    setAdminDocuments(prev => prev.filter(d => d.id !== id));
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('admin_documents').delete().eq('id', id);
      if (error) console.warn('Supabase admin_documents delete warning:', error.message);
    }
  };

  const [adminCmsContents, setAdminCmsContents] = useState(MOCK_ADMIN_CMS);

  const addAdminCms = async (data) => {
    const item = {
      id: `cms-${Date.now()}`,
      ...data,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      penulis: 'Admin SIMTA'
    };
    setAdminCmsContents(prev => [item, ...prev]);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('admin_cms').insert([item]);
      if (error) console.warn('Supabase admin_cms insert warning:', error.message);
    }
    return item;
  };

  const updateAdminCms = async (id, fields) => {
    const updated_at = new Date().toISOString();
    setAdminCmsContents(prev => prev.map(c => c.id === id ? { ...c, ...fields, updated_at } : c));
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('admin_cms').update({ ...fields, updated_at }).eq('id', id);
      if (error) console.warn('Supabase admin_cms update warning:', error.message);
    }
  };

  const deleteAdminCms = async (id) => {
    setAdminCmsContents(prev => prev.filter(c => c.id !== id));
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('admin_cms').delete().eq('id', id);
      if (error) console.warn('Supabase admin_cms delete warning:', error.message);
    }
  };

  const [adminTemplates, setAdminTemplates] = useState(MOCK_ADMIN_TEMPLATES);

  const addAdminTemplate = async (data) => {
    const tpl = {
      id: `tpl-${Date.now()}`,
      ...data,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    setAdminTemplates(prev => [tpl, ...prev]);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('admin_templates').insert([tpl]);
      if (error) console.warn('Supabase admin_templates insert warning:', error.message);
    }
    return tpl;
  };

  const updateAdminTemplate = async (id, fields) => {
    const updated_at = new Date().toISOString();
    setAdminTemplates(prev => prev.map(t => t.id === id ? { ...t, ...fields, updated_at } : t));
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('admin_templates').update({ ...fields, updated_at }).eq('id', id);
      if (error) console.warn('Supabase admin_templates update warning:', error.message);
    }
  };

  const deleteAdminTemplate = async (id) => {
    setAdminTemplates(prev => prev.filter(t => t.id !== id));
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('admin_templates').delete().eq('id', id);
      if (error) console.warn('Supabase admin_templates delete warning:', error.message);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  // Published Thesis Archives (Public Library)
  const [thesisArchives, setThesisArchives] = useState(() => {
    try {
      const saved = localStorage.getItem('simta_thesis_archives');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return MOCK_THESIS_ARCHIVES;
  });

  // Student Repository Submissions (Pending Kaprodi & Admin Verification)
  const [thesisRepositories, setThesisRepositories] = useState(() => {
    try {
      const saved = localStorage.getItem('simta_thesis_repositories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return MOCK_THESIS_REPOSITORIES;
  });

  // Thesis Consultation Sessions state with local persistence
  const [consultations, setConsultations] = useState(() => {
    try {
      const saved = localStorage.getItem('simta_consultations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return MOCK_CONSULTATIONS;
  });

  // Advisor Offline Consultation Schedules & WA Link state with local persistence
  const [advisorSchedules, setAdvisorSchedules] = useState(() => {
    try {
      const saved = localStorage.getItem('simta_advisor_schedules');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return MOCK_ADVISOR_SCHEDULES;
  });

  // Dosen Pembimbing (Advisors) master dataset with local persistence
  const [advisors, setAdvisors] = useState(() => {
    try {
      const saved = localStorage.getItem('simta_advisors');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return MOCK_ADVISORS;
  });

  // Student Advisor Assignments state with local persistence
  const [studentAdvisors, setStudentAdvisors] = useState(() => {
    try {
      const saved = localStorage.getItem('simta_student_advisors');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return MOCK_STUDENT_ADVISORS;
  });

  // Helper actions for Dosen Pembimbing management
  const addAdvisor = (advisorData) => {
    const newAdvisor = {
      id: `adv-${Date.now()}`,
      nip: (advisorData.nip || '').trim(),
      nama: (advisorData.nama || '').trim(),
      email: (advisorData.email || '').trim(),
      no_hp: (advisorData.no_hp || '').trim(),
      prodi: advisorData.prodi || 'D3 Manajemen Informatika',
      keahlian: Array.isArray(advisorData.keahlian) 
        ? advisorData.keahlian 
        : (advisorData.keahlian || '').split(',').map(s => s.trim()).filter(Boolean),
      kuota_dospem1: Number(advisorData.kuota_dospem1) || 8,
      kuota_dospem2: Number(advisorData.kuota_dospem2) || 8,
      status: advisorData.status || 'aktif'
    };
    setAdvisors(prev => {
      const updated = [newAdvisor, ...prev];
      try { localStorage.setItem('simta_advisors', JSON.stringify(updated)); } catch {}
      return updated;
    });
    return newAdvisor;
  };

  const updateAdvisor = (advisorId, updatedFields) => {
    setAdvisors(prev => {
      const updated = prev.map(a => a.id === advisorId ? { ...a, ...updatedFields } : a);
      try { localStorage.setItem('simta_advisors', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const deleteAdvisor = (advisorId) => {
    setAdvisors(prev => {
      const updated = prev.filter(a => a.id !== advisorId);
      try { localStorage.setItem('simta_advisors', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const bulkImportAdvisors = (importedList) => {
    const formatted = importedList.map((item, idx) => ({
      id: `adv-import-${Date.now()}-${idx}`,
      nip: String(item.nip || `1990${idx}123456`).trim(),
      nama: String(item.nama || 'Dosen Pembimbing').trim(),
      email: String(item.email || '').trim(),
      no_hp: String(item.no_hp || '').trim(),
      prodi: item.prodi || 'D3 Manajemen Informatika',
      keahlian: Array.isArray(item.keahlian) 
        ? item.keahlian 
        : (item.keahlian || 'Umum').split(',').map(s => s.trim()).filter(Boolean),
      kuota_dospem1: Number(item.kuota_dospem1) || 8,
      kuota_dospem2: Number(item.kuota_dospem2) || 8,
      status: 'aktif'
    }));

    setAdvisors(prev => {
      const mapByNip = new Map();
      [...formatted, ...prev].forEach(a => mapByNip.set(a.nip, a));
      const merged = Array.from(mapByNip.values());
      try { localStorage.setItem('simta_advisors', JSON.stringify(merged)); } catch {}
      return merged;
    });
    return formatted.length;
  };

  const assignStudentAdvisors = (studentNim, dospem1Nip, dospem2Nip, studentNama = '', judulTa = '') => {
    setStudentAdvisors(prev => {
      const existingIdx = prev.findIndex(sa => sa.student_nim === studentNim);
      let statusPembagian = 'belum';
      if (dospem1Nip && dospem2Nip) statusPembagian = 'lengkap';
      else if (dospem1Nip || dospem2Nip) statusPembagian = 'partial';

      const updatedRecord = {
        id: existingIdx >= 0 ? prev[existingIdx].id : `std-adv-${Date.now()}`,
        student_nim: studentNim,
        student_nama: studentNama || (existingIdx >= 0 ? prev[existingIdx].student_nama : 'Mahasiswa'),
        prodi: 'D3 Manajemen Informatika',
        judul_ta: judulTa || (existingIdx >= 0 ? prev[existingIdx].judul_ta : 'Judul Tugas Akhir'),
        dospem1_nip: dospem1Nip || '',
        dospem2_nip: dospem2Nip || '',
        status_pembagian: statusPembagian,
        updated_at: new Date().toISOString()
      };

      let updatedList;
      if (existingIdx >= 0) {
        updatedList = [...prev];
        updatedList[existingIdx] = updatedRecord;
      } else {
        updatedList = [updatedRecord, ...prev];
      }
      try { localStorage.setItem('simta_student_advisors', JSON.stringify(updatedList)); } catch {}
      return updatedList;
    });
  };

  const getStudentAdvisors = (studentNim) => {
    const record = studentAdvisors.find(sa => sa.student_nim === studentNim);
    if (!record) return { dospem1: null, dospem2: null, record: null };

    const dospem1 = advisors.find(a => a.nip === record.dospem1_nip) || null;
    const dospem2 = advisors.find(a => a.nip === record.dospem2_nip) || null;
    return { dospem1, dospem2, record };
  };

  // Departments (Program Studi) database state with dynamic local persistence
  const [departments, setDepartments] = useState(() => {
    try {
      const saved = localStorage.getItem('simta_departments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(d => d.code === 'TI' && d.name === 'Teknik Informatika' ? { ...d, name: 'S1 Teknik Informatika' } : d);
        }
      }
    } catch {}
    return MOCK_DEPARTMENTS;
  });

  const addDepartment = (newDept) => {
    const deptObj = {
      id: `dept-${Date.now()}`,
      code: (newDept.code || '').toUpperCase().trim(),
      name: (newDept.name || '').trim()
    };
    setDepartments(prev => {
      const updated = [...prev, deptObj];
      try { localStorage.setItem('simta_departments', JSON.stringify(updated)); } catch {}
      return updated;
    });
    return deptObj;
  };

  // Restore Supabase Auth session on mount and preserve local active session on refresh
  useEffect(() => {
    // 1. Always ensure active user is populated from localStorage / registered users
    const saved = getSavedUser();
    if (saved && (!currentUser || currentUser.nama === 'Mahasiswa UNSRI')) {
      setCurrentUser(saved);
    }

    // 2. Sync with Supabase Auth if configured
    if (isSupabaseConfigured && supabase) {

      // 2a. Fetch Admin SIMTA data from Supabase on mount
      supabase.from('admin_documents').select('*').order('tanggal_upload', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            setAdminDocuments(data);
          }
        });
      supabase.from('admin_cms').select('*').order('updated_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            setAdminCmsContents(data);
          }
        });
      supabase.from('admin_templates').select('*').order('updated_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            setAdminTemplates(data);
          }
        });

      // 2b. Supabase Auth session restore
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const registered = getRegisteredUsers();
          const matchedReg = registered.find(r => r.email === session.user.email || r.id === session.user.id) || registered[0];

          supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => {
            if (data && data.nama && data.nama !== 'Mahasiswa UNSRI') {
              setCurrentUser(sanitizeProfile(data));
            } else if (session.user.user_metadata) {
              const meta = session.user.user_metadata;
              const resolvedUser = sanitizeProfile({
                id: session.user.id,
                nama: meta.nama || meta.full_name || matchedReg?.nama || 'Aulia Azzahra',
                email: session.user.email,
                nim: meta.nim || matchedReg?.nim || '09010182428002',
                no_hp: meta.no_hp || matchedReg?.no_hp || '121920129102933',
                role: meta.role || matchedReg?.role || 'mahasiswa',
                kelas: meta.kelas || matchedReg?.kelas || 'MI 5A'
              });
              setCurrentUser(resolvedUser);
            }
          });
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('simta_active_user');
          setCurrentUserState(null);
          setIsAuthenticated(false);
        } else if (session?.user) {
          supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => {
            if (data && data.nama) {
              setCurrentUser(sanitizeProfile(data));
            }
          });
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // Authenticate user strictly by NIM or NIP credential & password
  const login = async (credential = '', password = '') => {
    const term = String(credential).trim();

    // 1. Check local registered users list FIRST by NIM, NIP, or ID
    const registered = getRegisteredUsers();
    const localFound = registered.find(u => 
      (u.nim && u.nim === term) || 
      (u.nip && u.nip === term) || 
      (u.id && u.id === term)
    );

    if (localFound) {
      setCurrentUser(localFound);
      if (localFound.role === 'kaprodi') return '/kaprodi/dashboard';
      if (localFound.role === 'admin_sarana') return '/admin/dashboard';
      if (localFound.role === 'admin') return '/admin-simta/dashboard';
      if (localFound.role === 'dosen') return '/dosen/dashboard';
      return '/dashboard';
    }

    // 2. Try Real Supabase Auth if configured & password provided
    if (isSupabaseConfigured && supabase && password) {
      let emailToUse = '';
      const { data: prof } = await supabase.from('profiles').select('email').or(`nim.eq.${term},nip.eq.${term}`).single();
      if (prof && prof.email) {
        emailToUse = prof.email;
      }

      if (emailToUse) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password: password
        });

        if (!authError && authData.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
          const matchedReg = registered.find(r => r.email === authData.user.email || r.id === authData.user.id) || registered[0];
          const activeProfile = profile || {
            id: authData.user.id,
            nama: authData.user.user_metadata?.nama || authData.user.user_metadata?.full_name || matchedReg?.nama || 'Aulia Azzahra',
            email: authData.user.email,
            nim: term,
            no_hp: authData.user.user_metadata?.no_hp || matchedReg?.no_hp || '121920129102933',
            role: authData.user.user_metadata?.role || matchedReg?.role || 'mahasiswa',
            kelas: authData.user.user_metadata?.kelas || matchedReg?.kelas || 'MI 5A'
          };

          setCurrentUser(activeProfile);

          if (activeProfile.role === 'kaprodi') return '/kaprodi/dashboard';
          if (activeProfile.role === 'admin_sarana') return '/admin/dashboard';
          if (activeProfile.role === 'admin') return '/admin-simta/dashboard';
          if (activeProfile.role === 'dosen') return '/dosen/dashboard';
          return '/dashboard';
        }
      }
    }

    // 3. Fallback to Mock Dataset Matching by NIM / NIP
    const foundUser = MOCK_USERS.find(u => 
      u.nim === term || 
      u.nip === term ||
      u.role === term
    );

    if (foundUser) {
      setCurrentUser(foundUser);
      if (foundUser.role === 'kaprodi') return '/kaprodi/dashboard';
      if (foundUser.role === 'admin_sarana') return '/admin/dashboard';
      if (foundUser.role === 'admin') return '/admin-simta/dashboard';
      if (foundUser.role === 'dosen') return '/dosen/dashboard';
      return '/dashboard';
    }

    // 4. If no match found in registered users, Supabase, or mock users, throw invalid credential error
    throw new Error('NIM / NIP atau kata sandi yang Anda masukkan tidak terdaftar dalam sistem.');
  };

  // Register new account (Mahasiswa / Kaprodi)
  const registerStudent = async ({ nama, nim, email, noHp, prodi, kelas, password, role = 'mahasiswa' }) => {
    const cleanEmail = email.toLowerCase().trim();
    if (role === 'mahasiswa' && !cleanEmail.endsWith('@student.unsri.ac.id')) {
      return { success: false, message: 'Email mahasiswa harus menggunakan domain resmi UNSRI (@student.unsri.ac.id).' };
    }
    if (role === 'kaprodi' && !cleanEmail.endsWith('@unsri.ac.id')) {
      return { success: false, message: 'Email Kaprodi harus menggunakan domain resmi UNSRI (@unsri.ac.id).' };
    }

    const redirectPath = role === 'kaprodi' ? '/kaprodi/dashboard' : '/dashboard';

    const newStudentUser = {
      id: `user-${role}-${Date.now()}`,
      nim: nim,
      nip: nim,
      nama: nama,
      email: cleanEmail,
      no_hp: noHp,
      prodi: prodi || 'D3 Manajemen Informatika',
      kelas: kelas || (role === 'kaprodi' ? 'Dosen / Kaprodi' : 'MI 5A'),
      role: role
    };

    saveRegisteredUser(newStudentUser);

    // 1. Try Real Supabase Auth Signup if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              nama,
              nim,
              nip: nim,
              no_hp: noHp,
              prodi: prodi || 'D3 Manajemen Informatika',
              kelas: kelas || (role === 'kaprodi' ? 'Dosen / Kaprodi' : 'MI 5A'),
              role: role
            }
          }
        });

        if (error) {
          return { success: false, message: error.message };
        }

        if (data.user) {
          newStudentUser.id = data.user.id;
          saveRegisteredUser(newStudentUser);
          const { error: profileError } = await supabase.from('profiles').upsert(newStudentUser, { onConflict: 'id' });
          if (profileError) {
            console.warn('Supabase profile upsert warning:', profileError.message);
          }

          setCurrentUser(newStudentUser);
          return { success: true, redirectPath };
        }
      } catch (err) {
        return { success: false, message: err.message || 'Gagal mendaftar ke Supabase.' };
      }
    }

    // 2. Fallback to Local State
    MOCK_USERS.unshift(newStudentUser);
    setCurrentUser(newStudentUser);

    return { success: true, redirectPath };
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('simta_active_user');
    setCurrentUserState(null);
    setIsAuthenticated(false);
  };

  const switchRole = (roleName) => {
    const foundUser = MOCK_USERS.find(u => u.role === roleName);
    if (foundUser) {
      setCurrentUser(foundUser);
    }
  };

  // Add new Title Submission
  const addThesisTitle = (newTitleData) => {
    const newId = `title-${Date.now()}`;
    const createdTitle = {
      id: newId,
      profile_id: currentUser?.id || 'user-mhs-aulia',
      mhs_nama: currentUser?.nama || 'Aulia Azzahra',
      mhs_nim: currentUser?.nim || '09010182428002',
      mhs_kelas: currentUser?.kelas || 'MI 5A',
      ...newTitleData,
      status: 'diajukan',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setThesisTitles(prev => [createdTitle, ...prev]);

    // Push notification to Kaprodi
    const kaprodiUser = MOCK_USERS.find(u => u.role === 'kaprodi');
    if (kaprodiUser) {
      const newNotif = {
        id: `notif-${Date.now()}`,
        profile_id: kaprodiUser.id,
        related_type: 'thesis_title',
        title: 'Pengajuan Judul Baru',
        message: `${currentUser?.nama || 'Mahasiswa'} (${currentUser?.nim || ''}) mengajukan judul: "${newTitleData.judul}"`,
        is_read: false,
        created_at: new Date().toISOString()
      };
      setNotifications(prev => [newNotif, ...prev]);
    }

    return createdTitle;
  };

  // Review Title (Kaprodi ACC / Reject)
  const reviewThesisTitle = (titleId, status, catatan) => {
    setThesisTitles(prev => prev.map(t => {
      if (t.id === titleId) {
        return { ...t, status, catatan_kaprodi: catatan, updated_at: new Date().toISOString() };
      }
      return t;
    }));

    const targetTitle = thesisTitles.find(t => t.id === titleId);
    if (targetTitle && status === 'disetujui') {
      // Auto-create Thesis Stages (Sempro, Semhas, Sidang)
      const stages = [
        { id: `stage-prop-${Date.now()}`, thesis_title_id: titleId, stage_type: 'seminar_proposal', status: 'menunggu_jadwal', urutan: 1 },
        { id: `stage-has-${Date.now()}`, thesis_title_id: titleId, stage_type: 'seminar_hasil', status: 'belum_diajukan', urutan: 2 },
        { id: `stage-sdg-${Date.now()}`, thesis_title_id: titleId, stage_type: 'sidang_akhir', status: 'belum_diajukan', urutan: 3 }
      ];
      setThesisStages(prev => [...stages, ...prev]);

      // Add student notification
      const notif = {
        id: `notif-${Date.now()}`,
        profile_id: targetTitle.profile_id,
        related_type: 'thesis_title',
        title: 'Judul TA Disetujui!',
        message: `Selamat! Judul "${targetTitle.judul}" telah disetujui Kaprodi. Anda sekarang dapat mengajukan ruang untuk Seminar Proposal.`,
        is_read: false,
        created_at: new Date().toISOString()
      };
      setNotifications(prev => [notif, ...prev]);
    }
  };

  // Bulk Import Historical Titles (Kaprodi)
  const bulkImportHistorical = (newRecords) => {
    const formatted = newRecords.map((rec, idx) => ({
      id: `hist-import-${Date.now()}-${idx}`,
      judul: rec.judul,
      judul_processed: rec.judul.toLowerCase(),
      tahun_angkatan: rec.tahun_angkatan || '2025',
      penulis: rec.penulis || 'Imported Student'
    }));
    setHistoricalTitles(prev => [...formatted, ...prev]);
  };

  // Submit Room Defense Booking
  const addBooking = (bookingData) => {
    const newBooking = {
      id: `book-${Date.now()}`,
      booking_code: `BK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'menunggu_persetujuan',
      created_at: new Date().toISOString(),
      ...bookingData
    };
    setBookings(prev => [newBooking, ...prev]);

    // Update Thesis Stage status to 'menunggu_jadwal'
    setThesisStages(prev => prev.map(s => {
      if (s.id === bookingData.thesis_stage_id) {
        return { ...s, status: 'menunggu_jadwal' };
      }
      return s;
    }));

    return newBooking;
  };

  // Approve / Reject Room Booking (Admin Sarana)
  const reviewBooking = (bookingId, status, rejectionReason = '') => {
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          status,
          rejection_reason: rejectionReason,
          approved_by: currentUser?.nama,
          updated_at: new Date().toISOString()
        };
      }
      return b;
    }));
  };

  // Upload new Thesis Repository Report (Submitted by Mahasiswa with status 'menunggu_review_kaprodi')
  const uploadThesisRepository = async (repoData) => {
    const newRepoItem = {
      id: `repo-${Date.now()}`,
      judul: repoData.judul,
      abstrak: repoData.abstrak,
      abstrak_en: repoData.abstrak_en || '',
      penulis_nama: currentUser?.nama || 'Aulia Azzahra',
      penulis_nim: currentUser?.nim || '09010182428002',
      prodi: currentUser?.prodi || 'D3 Manajemen Informatika',
      kelas: currentUser?.kelas || 'MI 5A',
      tahun_angkatan: repoData.tahun_angkatan || '2022',
      tahun_lulus: repoData.tahun_lulus || new Date().getFullYear().toString(),
      pembimbing_1: repoData.pembimbing_1,
      pembimbing_2: repoData.pembimbing_2,
      penguji_1: repoData.penguji_1 || 'Dr. Ir. Hendra Kusuma, M.T.',
      penguji_2: repoData.penguji_2 || 'Siti Nurhaliza, S.Kom., M.Kom.',
      kata_kunci: Array.isArray(repoData.kata_kunci) ? repoData.kata_kunci : (repoData.kata_kunci || '').split(',').map(k => k.trim()).filter(Boolean),
      file_pdf_url: repoData.file_pdf_url,
      status: 'menunggu_review_kaprodi',
      catatan_kaprodi: '',
      created_at: new Date().toISOString()
    };

    setThesisRepositories(prev => {
      const updated = [newRepoItem, ...prev];
      try { localStorage.setItem('simta_thesis_repositories', JSON.stringify(updated)); } catch {}
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('thesis_repositories').insert([newRepoItem]);
        if (error) console.warn('Supabase repository insert warning:', error.message);
      } catch (err) {
        console.warn('Failed to insert repository to Supabase:', err);
      }
    }

    return newRepoItem;
  };

  // Review Repository Submission (Kaprodi ACC or Reject for Revision)
  const reviewRepositoryKaprodi = (repoId, status, catatan) => {
    setThesisRepositories(prev => {
      const updated = prev.map(r => {
        if (r.id === repoId) {
          return {
            ...r,
            status,
            catatan_kaprodi: catatan || r.catatan_kaprodi,
            approved_by_kaprodi: currentUser?.nama || 'Kaprodi',
            updated_at: new Date().toISOString()
          };
        }
        return r;
      });
      try { localStorage.setItem('simta_thesis_repositories', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  // Publish Repository Submission to Public Archives (Admin Sarana / Admin Akademik)
  const publishRepositoryAdmin = (repoId) => {
    const repoItem = thesisRepositories.find(r => r.id === repoId);
    if (!repoItem) return;

    const publishedArchiveItem = {
      ...repoItem,
      status: 'dipublikasikan',
      published_by_admin: currentUser?.nama || 'Admin Sarana',
      published_at: new Date().toISOString()
    };

    // Update status in repositories list
    setThesisRepositories(prev => {
      const updated = prev.map(r => r.id === repoId ? publishedArchiveItem : r);
      try { localStorage.setItem('simta_thesis_repositories', JSON.stringify(updated)); } catch {}
      return updated;
    });

    // Push into public thesis Archives list
    setThesisArchives(prev => {
      const exists = prev.some(a => a.id === repoId || a.judul === repoItem.judul);
      if (exists) return prev;
      const updatedArchives = [publishedArchiveItem, ...prev];
      try { localStorage.setItem('simta_thesis_archives', JSON.stringify(updatedArchives)); } catch {}
      return updatedArchives;
    });
  };

  // Add new consultation / revision submission (Mahasiswa)
  const addConsultation = async (consData) => {
    const newEntry = {
      id: `cons-${Date.now()}`,
      mhs_nim: currentUser?.nim || '09010182428002',
      mhs_nama: currentUser?.nama || 'Aulia Azzahra',
      pembimbing: consData.pembimbing || 'Pembimbing 1',
      dosen_nama: consData.dosen_nama || 'Dr. Ir. Hendra Kusuma, M.T.',
      tanggal: consData.tanggal || new Date().toISOString().split('T')[0],
      waktu: consData.waktu || '10:00',
      bab_topik: consData.bab_topik,
      catatan_mahasiswa: consData.catatan_mahasiswa,
      masukan_dosen: '',
      file_revisi_url: consData.file_revisi_url || '',
      status: 'menunggu_tanggapan',
      created_at: new Date().toISOString()
    };

    setConsultations(prev => {
      const updated = [newEntry, ...prev];
      try { localStorage.setItem('simta_consultations', JSON.stringify(updated)); } catch {}
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('thesis_consultations').insert([newEntry]);
        if (error) console.warn('Supabase consultation insert warning:', error.message);
      } catch (err) {
        console.warn('Failed to insert consultation to Supabase:', err);
      }
    }

    return newEntry;
  };

  // Review consultation / feedback (Dosen / Kaprodi)
  const reviewConsultation = (consultationId, status, feedbackNotes) => {
    setConsultations(prev => {
      const updated = prev.map(c => {
        if (c.id === consultationId) {
          return {
            ...c,
            status: status,
            masukan_dosen: feedbackNotes || c.masukan_dosen
          };
        }
        return c;
      });
      try { localStorage.setItem('simta_consultations', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  // Update or Add Advisor Offline Schedule & Link WA (Dosen / Kaprodi)
  const updateAdvisorSchedule = async (scheduleData) => {
    const updatedObj = {
      id: scheduleData.id || `adv-sch-${Date.now()}`,
      dosen_nip: scheduleData.dosen_nip || currentUser?.nip || '197805122005011002',
      dosen_nama: scheduleData.dosen_nama || currentUser?.nama || 'Dr. Ir. Hendra Kusuma, M.T.',
      peran: scheduleData.peran || 'Dosen Pembimbing',
      hari_bimbingan: scheduleData.hari_bimbingan || 'Senin & Rabu',
      jam_bimbingan: scheduleData.jam_bimbingan || '09:00 - 12:00 WIB',
      lokasi: scheduleData.lokasi || 'Ruang Dosen Gedung DIPKOM Lt. 2',
      link_wa_group: scheduleData.link_wa_group || '',
      no_hp_wa: scheduleData.no_hp_wa || '',
      catatan: scheduleData.catatan || ''
    };

    setAdvisorSchedules(prev => {
      const existingIdx = prev.findIndex(s => s.id === updatedObj.id || s.dosen_nip === updatedObj.dosen_nip || s.dosen_nama === updatedObj.dosen_nama);
      let nextState;
      if (existingIdx >= 0) {
        nextState = [...prev];
        nextState[existingIdx] = updatedObj;
      } else {
        nextState = [updatedObj, ...prev];
      }
      try { localStorage.setItem('simta_advisor_schedules', JSON.stringify(nextState)); } catch {}
      return nextState;
    });

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('advisor_schedules').upsert(updatedObj, { onConflict: 'dosen_nip' });
        if (error) console.warn('Supabase advisor_schedules upsert warning:', error.message);
      } catch (err) {
        console.warn('Failed to sync advisor schedule to Supabase:', err);
      }
    }

    return updatedObj;
  };

  const getAllRegisteredStudents = () => {
    const localReg = getRegisteredUsers().filter(u => u.role === 'mahasiswa');
    const mockMhs = MOCK_USERS.filter(u => u.role === 'mahasiswa');
    const mapByName = new Map();
    [...mockMhs, ...localReg].forEach(u => {
      if (u && u.nim && u.role === 'mahasiswa') {
        const cleanNim = String(u.nim).trim() === '090108148002' ? '09010182428002' : String(u.nim).trim();
        const cleanNama = String(u.nama || '').trim();
        if (cleanNim && cleanNama && !cleanNama.includes('Hendra Kusuma') && !cleanNama.includes('Budi Santoso')) {
          const normKey = cleanNama.toLowerCase();
          const obj = { ...u, nim: cleanNim };
          if (!mapByName.has(normKey) || cleanNim === '09010182428002') {
            mapByName.set(normKey, obj);
          }
        }
      }
    });
    return Array.from(mapByName.values());
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      setCurrentUser,
      updateUserProfile,
      isAuthenticated,
      login,
      logout,
      registerStudent,
      switchRole,
      getAllRegisteredStudents,
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
      thesisRepositories,
      uploadThesisRepository,
      reviewRepositoryKaprodi,
      publishRepositoryAdmin,
      consultations,
      addConsultation,
      reviewConsultation,
      advisorSchedules,
      updateAdvisorSchedule,
      advisors,
      studentAdvisors,
      addAdvisor,
      updateAdvisor,
      deleteAdvisor,
      bulkImportAdvisors,
      assignStudentAdvisors,
      getStudentAdvisors,
      addThesisTitle,
      reviewThesisTitle,
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
      deleteAdminTemplate
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
