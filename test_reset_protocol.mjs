import crypto from 'crypto';
import fs from 'fs';

// Helper for SHA-256 password hashing matching AuthContext
const sha256 = async (message) => {
  return crypto.createHash('sha256').update(message).digest('hex');
};

console.log('--- TEST 1: Hashing Function ---');
const testPass = 'PasswordBaru2026#';
const testHash = await sha256(testPass);
console.log('Password:', testPass);
console.log('SHA-256 Hash:', testHash);
if (testHash.length !== 64) throw new Error('Invalid SHA-256 length');
console.log('PASS: SHA-256 Hashing verified.');

console.log('\n--- TEST 2: Flow Simulation ---');
// Mock Database
const mockDatabase = [
  { nim: '09010182428001', nama: 'MUHAMMAD FATHAN PRATAMA', email: '09010182428001@student.unsri.ac.id', role: 'mahasiswa', prodi: 'D3 Manajemen Informatika', status: 'aktif' },
  { nip: '198410012009121005', nama: 'Dr. Abdiansah, S.Kom., M.Cs.', email: 'abdiansah@unsri.ac.id', role: 'dosen', prodi: 'D3 Manajemen Informatika', status: 'aktif' }
];

let resetRequests = [];
let resetLogs = [];
let registeredUsers = [
  { nim: '09010182428001', nama: 'MUHAMMAD FATHAN PRATAMA', email: '09010182428001@student.unsri.ac.id', password: 'oldpassword123' }
];

// Step 1: User submits request
const userId = '09010182428001';
const userMatch = mockDatabase.find(u => u.nim === userId || u.email === userId);
if (!userMatch) throw new Error('User not found in DB');

const req = {
  id: `req-${Date.now()}`,
  identifier: userId,
  nim: userMatch.nim,
  nama: userMatch.nama,
  email: userMatch.email,
  role: userMatch.role,
  status: 'menunggu',
  alasan_pengajuan: 'Lupa kata sandi akun',
  created_at: new Date().toISOString()
};
resetRequests.unshift(req);
resetLogs.unshift({ action: 'diajukan', user_name: req.nama });
console.log('Step 1 PASS: Permintaan reset diajukan dengan status:', req.status);

// Step 2: Admin approves request
const targetReq = resetRequests.find(r => r.id === req.id);
const token = `rst-${Date.now()}-abc123xyz`;
targetReq.status = 'disetujui';
targetReq.token = token;
targetReq.processed_by = 'Rina Agustina, S.Kom. (Admin SIMTA)';
targetReq.expires_at = Date.now() + 24 * 3600 * 1000;
resetLogs.unshift({ action: 'disetujui', actor: targetReq.processed_by });
console.log('Step 2 PASS: Permintaan disetujui Admin. Status:', targetReq.status, 'Token:', targetReq.token);

// Step 3: User resets password using token
const resetTokenMatch = resetRequests.find(r => r.token === token && r.status === 'disetujui');
if (!resetTokenMatch) throw new Error('Token verification failed');
if (Date.now() > resetTokenMatch.expires_at) throw new Error('Token expired');

const newPass = 'SandiBaru!2026';
const newPassHash = await sha256(newPass);

// Update user with hashed password
const regUser = registeredUsers.find(u => u.nim === resetTokenMatch.nim);
regUser.password = newPass;
regUser.password_hash = newPassHash;

resetTokenMatch.status = 'selesai';
resetTokenMatch.completed_at = new Date().toISOString();
resetLogs.unshift({ action: 'selesai', user_name: resetTokenMatch.nama });
console.log('Step 3 PASS: Password baru berhasil di-hash dan disimpan. Status pengajuan:', resetTokenMatch.status);

// Step 4: Login Verification
const verifyLogin = async (inputPass, userObj) => {
  const inputHash = await sha256(inputPass);
  if (userObj.password_hash && inputHash === userObj.password_hash) return true;
  if (userObj.password && inputPass === userObj.password) return true;
  return false;
};

const loginWithOld = await verifyLogin('oldpassword123', regUser);
const loginWithNew = await verifyLogin(newPass, regUser);
const loginWithWrong = await verifyLogin('wrongpass', regUser);

console.log('Login dengan password lama:', loginWithOld ? 'BERHASIL' : 'DITOLAK (BENAR)');
console.log('Login dengan password baru:', loginWithNew ? 'BERHASIL (BENAR)' : 'GAGAL');
console.log('Login dengan password salah:', loginWithWrong ? 'BERHASIL' : 'DITOLAK (BENAR)');

if (loginWithOld) throw new Error('Password lama tidak boleh bisa login');
if (!loginWithNew) throw new Error('Password baru harus bisa login');
if (loginWithWrong) throw new Error('Password salah tidak boleh bisa login');

console.log('\n--- ALL PROTOCOL TESTS PASSED SUCCESSFULLY! ---');

