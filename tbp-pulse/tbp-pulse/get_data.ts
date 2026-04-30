import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

let supabaseUrl = process.env.VITE_SUPABASE_URL || '';
supabaseUrl = supabaseUrl.trim().replace(/^"|"$/g, '').replace(/'/g, '');
supabaseUrl = supabaseUrl.replace(/\/+$/, "");
supabaseUrl = supabaseUrl.replace(/\/rest\/v1$/, "");
supabaseUrl = supabaseUrl.replace(/\/+$/, "");
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  if (!supabaseUrl.includes('.')) {
    supabaseUrl = `https://${supabaseUrl}.supabase.co`;
  } else {
    supabaseUrl = `https://${supabaseUrl}`;
  }
}

const supabaseKey = (process.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^"|"$/g, '').replace(/'/g, '');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data: users, error: usersErr } = await supabase.from('users').select('*');
  console.log('Users:', users?.length, usersErr?.message || usersErr);

  const { data: projects, error: projErr } = await supabase.from('projects').select('*');
  console.log('Projects:', projects?.length, projErr?.message || projErr);

  const { data: tasks, error: tasksErr } = await supabase.from('tasks').select('*');
  console.log('Tasks:', tasks?.length, tasksErr?.message || tasksErr);
}

checkData();
