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

const initialProjects = [
  { client: 'Infinity Forest', name: 'Infinity Forest', status: 'green', progress: 85, assignees: ['AS'], icon_name: 'Globe' },
  { client: 'West Exclusive', name: 'West Exclusive', status: 'green', progress: 90, assignees: ['AS'], icon_name: 'Briefcase' },
  { client: 'Cabana Soveja', name: 'Cabana Soveja', status: 'green', progress: 75, assignees: ['AS'], icon_name: 'Heart' },
  { client: 'ASJR', name: 'ASJR', status: 'yellow', progress: 45, assignees: ['RM'], icon_name: 'Briefcase' },
  { client: 'Clinica32', name: 'Clinica32', status: 'green', progress: 95, assignees: ['AR'], icon_name: 'Heart' },
];

const initialTasks = [
  { title: 'Update homepage copy', project_id: null, assignee: 'AS', status: 'todo', priority: 'high', deadline: new Date(Date.now() + 86400000).toISOString() },
  { title: 'Review SEO strategy', project_id: null, assignee: 'RM', status: 'in-progress', priority: 'medium', deadline: new Date(Date.now() + 172800000).toISOString() },
  { title: 'Prepare monthly report', project_id: null, assignee: 'AR', status: 'review', priority: 'high', deadline: new Date(Date.now() + 3600000).toISOString() }
];

async function seed() {
  console.log("Seeding projects...");
  const { data: projects, error: pErr } = await supabase.from('projects').insert(initialProjects).select();
  if (pErr) {
    console.error("Error seeding projects:", pErr);
    return;
  }
  console.log("Projects seeded:", projects.length);

  
  const tasksToInsert = initialTasks.map((t, i) => ({
    ...t,
    project_id: projects[i % projects.length].id
  }));
  
  console.log("Seeding tasks...");
  const { data: tasks, error: tErr } = await supabase.from('tasks').insert(tasksToInsert).select();
  if (tErr) {
    console.error("Error seeding tasks:", tErr);
  } else {
    console.log("Tasks seeded:", tasks.length);
  }
}

seed();
