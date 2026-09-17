import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jdubhdapcvjxzmngqyty.supabase.co'
const supabaseKey = 'sb_publishable_ZJ0moT-bPUy1slWmSngWVA_KPhyMNMg'
const supabase = createClient(supabaseUrl, supabaseKey)

async function createDosen() {
  console.log('Creating Dosen account in Supabase...');
  
  const nip = '198001012010011001';
  const email = 'dosen.pembimbing@unsri.ac.id';
  const password = 'Dosen123!';
  const nama = 'Dr. Budi Dosen, M.Kom.';
  
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        nama: nama,
        nip: nip,
        nim: nip, // Fallback for some frontend logic
        role: 'dosen',
        prodi: 'D3 Manajemen Informatika',
        kelas: 'Dosen Pembimbing'
      }
    }
  });

  if (error) {
    console.error('Error creating user:', error.message);
    if (error.message.includes('User already registered')) {
        console.log('User already exists in Supabase. Proceeding to update public profile...');
    } else {
        return;
    }
  } else {
    console.log('User created successfully in Auth!', data.user?.id);
  }

  // Also ensure profile exists
  // Since RLS might block insert if not authenticated, we will just login and update it
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (loginError) {
      console.log('Error logging in to set profile:', loginError.message);
      return;
  }
  
  const userId = loginData.user.id;
  
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    nama: nama,
    email: email,
    nip: nip,
    nim: nip,
    role: 'dosen',
    prodi: 'D3 Manajemen Informatika',
    kelas: 'Dosen Pembimbing'
  });
  
  if (profileError) {
      console.error('Error updating profile:', profileError.message);
  } else {
      console.log('Profile successfully synced to Supabase database!');
  }
}

createDosen();
