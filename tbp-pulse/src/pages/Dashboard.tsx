import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import TeamCalendarWidget from '../components/TeamCalendarWidget';
import { 
  ArrowUpRight, Clock, Users, Activity, CheckCircle2, 
  Palette, X, Briefcase, Globe, Camera, Monitor, 
  Smartphone, ShoppingBag, Coffee, Heart, TrendingUp, Plus, Download,
  Cloud, FileText, Play, Pause, RotateCcw, Sparkles, Filter, LayoutGrid, List as ListIcon, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import { supabase } from '../lib/supabase';
import TaskModal from '../components/TaskModal';
import { Task, TaskStatus, Project } from '../types';
import TaskDrawer from '../components/TaskDrawer';

const iconMap: Record<string, any> = {
  Briefcase, Globe, Camera, Monitor, Smartphone, ShoppingBag, Coffee, Heart, Activity, Users
};

const getDailyGreeting = (name: string) => {
  const day = new Date().getDay();
  const greetings: Record<number, string> = {
    1: `Luni plină de energie, ${name}! Să avem o săptămână excelentă! ☕`,
    2: `O zi de marți productivă, ${name}! Să ne bucurăm de progres! 🚀`,
    3: `Miercuri, mijlocul săptămânii! Continuăm în forță, ${name}! 🌟`,
    4: `Joi cu inspirație, ${name}! Ne apropiem de weekend, să tragem tare! 🎯`,
    5: `Vineri minunată, ${name}! Încă puțin și ne bucurăm de weekend! 🎉`,
    6: `E sâmbătă, ${name}! Timpul tău să te relaxezi! 🌴`,
    0: `Duminică liniștită, ${name}! Să ne încărcăm bateriile! 🔋`
  };
  return greetings[day] || `Salut, ${name}! 👋`;
};

const initialProjects = [
  { client: 'Infinity Forest', name: 'Infinity Forest', status: 'green' as const, progress: 85, assignees: ['RM', 'AS'], icon_name: 'Globe' },
  { client: 'West Exclusive', name: 'West Exclusive', status: 'green' as const, progress: 90, assignees: ['RM', 'AS'], icon_name: 'Briefcase' },
  { client: 'Cabana Soveja', name: 'Cabana Soveja', status: 'green' as const, progress: 75, assignees: ['RM', 'AS'], icon_name: 'Heart' },
  { client: 'ASJR', name: 'ASJR', status: 'yellow' as const, progress: 45, assignees: ['RM', 'AS'], icon_name: 'Briefcase' },
  { client: 'CNPG', name: 'CNPG', status: 'green' as const, progress: 80, assignees: ['RM', 'AS'], icon_name: 'Globe' },
  { client: 'Tucano Coffee', name: 'Tucano Coffee', status: 'yellow' as const, progress: 60, assignees: ['RM', 'AS'], icon_name: 'Heart' },
  { client: 'BOON', name: 'BOON', status: 'green' as const, progress: 95, assignees: ['RM', 'AS'], icon_name: 'Briefcase' },
  { client: 'Atlantis Digital Lab', name: 'Atlantis Digital Lab', status: 'green' as const, progress: 50, assignees: ['RM', 'AR'], icon_name: 'Globe' },
  { client: 'Clinica32', name: 'CLINICA32', status: 'green' as const, progress: 95, assignees: ['RM', 'AR'], icon_name: 'Heart' },
  { client: 'iNES', name: 'iNES', status: 'green' as const, progress: 70, assignees: ['RM', 'AR'], icon_name: 'Globe' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { addAlert } = useAlerts();
  const [projects, setProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [editingProject, setEditingProject] = useState<number | null>(null);
  const [showAllProjects, setShowAllProjects] = useState(user?.role === 'owner');
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtering state
  const [taskFilter, setTaskFilter] = useState<TaskStatus | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'deadline'>('deadline');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);

  // Timer attributes
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalProjectId, setTaskModalProjectId] = useState<number | undefined>(undefined);
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [selectedDateForEvent, setSelectedDateForEvent] = useState<Date | null>(null);
  const [newEventForm, setNewEventForm] = useState({ title: '', client: '', time: '09:00', type: 'general', color: 'bg-indigo-100 text-indigo-700' });
  const [newVideoForm, setNewVideoForm] = useState({ title: '', projectId: '', deadline: '', type: 'Vertical', instructions: '', drive_link: '', extra_link: '' });
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ name: '', assignees: [] as string[] });

  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const availableColors = [
    'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 
    'bg-emerald-500', 'bg-tbp-dark', 'bg-indigo-500', 'bg-rose-500'
  ];

  const availableIcons = ['Briefcase', 'Globe', 'Camera', 'Monitor', 'Smartphone', 'ShoppingBag', 'Coffee', 'Heart', 'Activity', 'Users'];

  const fetchProjects = () => fetchData();

  useEffect(() => {
    fetchData();
    const tasksSub = supabase.channel('tasks_dashboard').on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchData()).subscribe();
    const projectsSub = supabase.channel('projects_dashboard').on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => fetchData()).subscribe();
    return () => { tasksSub.unsubscribe(); projectsSub.unsubscribe(); };
  }, []);

  const fetchData = async () => {
    try {
      const { data: pData } = await supabase.from('projects').select('*').order('client');
      const { data: tData } = await supabase.from('tasks').select('*, projects(client)').order('deadline', { ascending: true });
      
      const formattedTasks = (tData || []).map((t: any) => ({
        ...t,
        client: t.projects?.client || 'General'
      }));
      setAllTasks(formattedTasks);

      if (pData && pData.length > 0) {
        // Deduplicate pData by client name to handle potential double-seeding
        const uniqueProjects = pData.reduce((acc: any[], current: any) => {
          const x = acc.find(item => item.client === current.client);
          if (!x) {
            return acc.concat([current]);
          } else {
            return acc;
          }
        }, []);

        const projectsWithStatus = uniqueProjects.map((p: any) => ({
          ...p,
          activeTasksCount: formattedTasks.filter(t => t.project_id === p.id && t.status !== 'done' && t.status !== 'archived').length,
          activeTasksList: formattedTasks.filter(t => t.project_id === p.id && t.status !== 'done' && t.status !== 'archived')
        }));
        setProjects(projectsWithStatus);
      } else if (pData && pData.length === 0) {
        setProjects([]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTasks = allTasks.filter(t => {
    const roleMatch = user?.role === 'owner' || t.assignee === user?.initials;
    const statusMatch = taskFilter === 'all' ? (t.status !== 'done' && t.status !== 'archived') : t.status === taskFilter;
    return roleMatch && statusMatch;
  }).sort((a, b) => {
    if (sortOrder === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  const myActiveTasksCount = allTasks.filter(t => t.assignee === user?.initials && t.status !== 'done' && t.status !== 'archived').length;
  const reviewTasksCount = allTasks.filter(t => t.status === 'review').length;

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDrawerOpen(true);
  };

  const seedProjects = async () => {
    try {
      // Sterge posibilele resturi (proiecte demo vechi)
      const clientNames = initialProjects.map(p => p.client);
      await supabase.from('projects').delete().in('client', clientNames);
      
      const { data: inserted, error } = await supabase
        .from('projects')
        .insert(initialProjects)
        .select('id, client');
        
      if (error) {
        throw error;
      }

      // Check tasks
      const { data: existingTasks } = await supabase.from('tasks').delete().in('status', ['todo', 'in-progress', 'review']); // Just clean up sample tasks logic simply by inserting below

      // Seed some sample tasks unconditionally for the demo
      if (inserted && inserted.length >= 3) {
        const sampleTasks = [
          { title: 'Update homepage copy', project_id: inserted[0]?.id, assignee: 'AS', status: 'todo', priority: 'high', deadline: new Date(Date.now() + 86400000).toISOString() },
          { title: 'Review SEO strategy', project_id: inserted[1]?.id, assignee: 'RM', status: 'in-progress', priority: 'medium', deadline: new Date(Date.now() + 172800000).toISOString() },
          { title: 'Prepare monthly report', project_id: inserted[2]?.id, assignee: 'AR', status: 'review', priority: 'high', deadline: new Date(Date.now() + 3600000).toISOString() }
        ].filter(t => t.project_id);
        
        await supabase.from('tasks').insert(sampleTasks);
      }
      
      return true;
    } catch (error: any) {
      console.error('Error seeding projects:', error);
      return false;
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Client', 'Nume Proiect', 'Status', 'Progres (%)', 'Task-uri Active', 'Responsabili'];
    
    // Filtrează proiectele în funcție de ce vede utilizatorul acum sau arată-le pe toate, depinde.
    // De obicei e mai ok să le descarce pe toate dacă e owner
    const projectsToExport = user?.role === 'owner' ? projects : projects.filter(p => p.assignees.includes(user?.initials || ''));

    const rows = projectsToExport.map(p => [
      p.id,
      `"${p.client}"`,
      `"${p.name}"`,
      p.status === 'green' ? 'Excelentă' : p.status === 'yellow' ? 'Atenție' : 'Critică',
      p.progress,
      p.activeTasksCount || 0,
      `"${p.assignees.join(', ')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `raport_clienti_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientForm.name) return;
    
    try {
      const { error } = await supabase.from('projects').insert([{
        client: newClientForm.name,
        name: newClientForm.name,
        assignees: newClientForm.assignees,
        status: 'green',
        progress: 0,
        icon_name: 'Globe'
      }]);
      
      if (error) throw error;
      
      setShowAddClientModal(false);
      setNewClientForm({ name: '', assignees: [] });
      fetchData();
    } catch (err) {
      console.error('Eroare adăugare client:', err);
    }
  };

  const updateProject = async (id: number, updates: any) => {
    try {
      // Optimistic update
      setProjects(projects.map(p => p.id === id ? { ...p, ...updates } : p));
      
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating project:', error);
      fetchProjects(); // Revert on error
    }
  };

  const handleAddEventClick = (date: Date) => {
    setSelectedDateForEvent(date);
    setNewEventForm(prev => ({ ...prev, time: '09:00' }));
    setShowAddEventModal(true);
  };

  const handleCreateVideoTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoForm.projectId || !newVideoForm.title || !newVideoForm.deadline) return;

    try {
      const { error } = await supabase.from('tasks').insert([{
        project_id: parseInt(newVideoForm.projectId),
        title: `[Video ${newVideoForm.type}] ${newVideoForm.title}`,
        assignee: 'GB',
        reviewer: 'RM',
        deadline: newVideoForm.deadline,
        priority: 'Medium',
        task_type: 'Video',
        status: 'todo',
        created_by: user?.initials || 'RM'
      }]);

      if (error) throw error;
      addAlert({ 
        title: 'Sarcina Video Adăugată', 
        description: 'Gabi a fost notificat de noul task.', 
        client: projects.find(p => p.id === Number(newVideoForm.projectId))?.client || 'General',
        assignee: 'GB',
        assigneeInitials: 'GB',
        assigneeColor: 'bg-indigo-100 text-indigo-700',
        errorCode: `VID-${Date.now()}`,
        severity: 'info'
      });
      setShowAddVideoModal(false);
      setNewVideoForm({ title: '', projectId: '', deadline: '', type: 'Vertical', instructions: '', drive_link: '', extra_link: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating video task:', error);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventForm.title || !selectedDateForEvent) return;
    
    // In a real app we'd save this to a calendar table
    addAlert({ 
      title: 'Eveniment Adăugat', 
      description: `${newEventForm.title} programat pe ${selectedDateForEvent.toLocaleDateString()}.`, 
      client: 'Internal',
      assignee: user?.full_name || 'Owner',
      assigneeInitials: user?.initials || 'RM',
      assigneeColor: 'bg-indigo-100 text-indigo-700',
      errorCode: `EVT-${Date.now()}`,
      severity: 'info' 
    });
    setShowAddEventModal(false);
    setNewEventForm({ title: '', client: '', time: '09:00', type: 'general', color: 'bg-indigo-100 text-indigo-700' });
  };

  // Calculate operational dashboard metrics
  const reviewTasks = allTasks.filter(t => t.status === 'review');
  const blockedTasks = allTasks.filter(t => t.status === 'blocked');
  const allVideoTasks = allTasks.filter(t => t.task_type === 'Video');
  const overdueTasks = allTasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'done' && t.status !== 'archived');
  const myTasks = allTasks.filter(t => t.assignee === user?.initials && t.status !== 'done' && t.status !== 'archived');
  const myUrgentTasks = myTasks.filter(t => t.priority === 'Urgent');
  
  // Team Pulse for owner
  const teamInitialList = ['AS', 'AR', 'GB', 'RP'];
  const teamPulse = teamInitialList.map(initial => {
    const userTasks = allTasks.filter(t => t.assignee === initial);
    return {
      initials: initial,
      active: userTasks.filter(t => t.status !== 'done' && t.status !== 'review' && t.status !== 'blocked' && t.status !== 'archived').length,
      review: userTasks.filter(t => t.status === 'review').length,
      blocked: userTasks.filter(t => t.status === 'blocked').length
    };
  });

  const getAssigneeColor = (initials: string) => {
    switch (initials) {
      case 'AS': return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'AR': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'RM': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display tracking-wide text-tbp-dark">
            {getDailyGreeting(user?.full_name.split(' ')[0] || '')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {user?.role === 'owner' ? 'Iată o privire de ansamblu asupra proiectelor de astăzi.' : 'Suntem gata de acțiune. Iată proiectele în desfășurare.'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-status-green status-pulse"></div>
            <span className="text-xs font-bold text-tbp-dark uppercase tracking-wider">Toate sistemele funcționale</span>
          </div>
        </div>
      </header>

      {/* Custom Header Blocks for specific users/roles */}
      {user?.initials === 'AS' && (
        <div className="rounded-3xl p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-100 flex flex-col md:flex-row items-center justify-between gap-6 section-reveal">
          {/* ... existing AS block ... */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-display text-2xl shadow-sm relative">
              <Sparkles className="w-4 h-4 text-purple-400 absolute -top-1 -right-1" />
              AS
            </div>
            <div>
              <h2 className="text-2xl font-bold font-display text-purple-900">Spațiul tău creativ 🌸</h2>
              <p className="text-sm text-purple-700 mt-1">Fiecare idee prinde viață aici. Folosește timer-ul pentru a rămâne în ritm.</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-2 bg-white/60 p-4 rounded-2xl border border-purple-100 shadow-sm min-w-[200px]">
            <div className="text-3xl font-display text-purple-900 tracking-wider font-mono">
              {formatTimer(timerSeconds)}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsTimerRunning(!isTimerRunning)} 
                className="p-2 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-lg transition-colors"
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => { setIsTimerRunning(false); setTimerSeconds(0); }} 
                className="p-2 bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-600 rounded-lg border border-gray-200 transition-colors"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {user?.initials === 'AR' && (
        <div className="rounded-3xl p-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-6 section-reveal">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-display text-2xl shadow-sm relative">
              <Sparkles className="w-4 h-4 text-emerald-400 absolute -top-1 -right-1" />
              AR
            </div>
            <div>
              <h2 className="text-2xl font-bold font-display text-emerald-900">Oază de Productivitate 🌿</h2>
              <p className="text-sm text-emerald-700 mt-1">Gândirea clară aduce rezultate. Activează timer-ul atunci când intri în focus.</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-2 bg-white/60 p-4 rounded-2xl border border-emerald-100 shadow-sm min-w-[200px]">
            <div className="text-3xl font-display text-emerald-900 tracking-wider font-mono">
              {formatTimer(timerSeconds)}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsTimerRunning(!isTimerRunning)} 
                className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors"
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => { setIsTimerRunning(false); setTimerSeconds(0); }} 
                className="p-2 bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-600 rounded-lg border border-gray-200 transition-colors"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {user?.role === 'owner' && (user?.initials === 'RM') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 section-reveal">
          <div className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-red-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4" /> De Verificat / Blocat
              </h2>
              <div className="space-y-3">
                <Link to="/tasks" state={{ groupingMode: 'status' }} className="flex justify-between items-center text-sm p-1.5 -mx-1.5 rounded-lg hover:bg-red-100/50 transition-colors">
                  <span className="text-red-700 font-semibold cursor-pointer">Task-uri în Review</span>
                  <span className="bg-white px-2.5 py-1 rounded-lg text-red-700 font-bold shadow-sm">{reviewTasks.length}</span>
                </Link>
                <Link to="/tasks" state={{ ownerViewFilter: 'me' }} className="flex justify-between items-center text-sm p-1.5 -mx-1.5 rounded-lg hover:bg-red-100/50 transition-colors">
                  <span className="text-red-700 font-semibold cursor-pointer">Așteaptă acțiunea ta</span>
                  <span className="bg-white px-2.5 py-1 rounded-lg text-red-700 font-bold shadow-sm">{myTasks.length}</span>
                </Link>
                <Link to="/tasks" state={{ groupingMode: 'status' }} className="flex justify-between items-center text-sm p-1.5 -mx-1.5 rounded-lg hover:bg-red-100/50 transition-colors">
                  <span className="text-red-700 font-semibold cursor-pointer">Task-uri Blocate</span>
                  <span className="bg-white px-2.5 py-1 rounded-lg text-red-700 font-bold shadow-sm">{blockedTasks.length}</span>
                </Link>
              </div>
            </div>
            {overdueTasks.length > 0 && (
              <Link to="/tasks" state={{ filter: 'overdue' }} className="mt-4 pt-4 border-t border-red-200 text-xs text-red-600 font-bold hover:text-red-800 transition-colors flex items-center gap-1 cursor-pointer">
                <AlertCircle className="w-3.5 h-3.5" />
                {overdueTasks.length} task-uri overdue! Vezi detalii <ArrowUpRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Briefcase className="w-4 h-4" /> Clients at risk
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-amber-700 font-semibold">Status Atenție / Critic</span>
                  <span className="bg-white px-2.5 py-1 rounded-lg text-amber-700 font-bold shadow-sm">{projects.filter(p => ['yellow', 'red'].includes(p.status)).length}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-amber-700 font-semibold">Fără update de &gt;7 zile</span>
                  <span className="bg-white px-2.5 py-1 rounded-lg text-amber-700 font-bold shadow-sm">0</span>
                </div>
              </div>
            </div>
            <Link to="/tasks" className="mt-4 pt-4 border-t border-amber-100 text-xs text-amber-600 font-bold hover:text-amber-800 transition-colors flex items-center gap-1">Verifică task-uri <ArrowUpRight className="w-3 h-3" /></Link>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Users className="w-4 h-4" /> Team Pulse
              </h2>
              <div className="space-y-2">
                {teamPulse.map(member => (
                  <Link key={member.initials} to="/tasks" state={{ groupingMode: 'person' }} className="flex justify-between items-center text-xs hover:bg-indigo-100/50 p-1.5 -mx-1.5 rounded-lg transition-colors cursor-pointer">
                    <span className="text-indigo-700 font-bold w-6">{member.initials}</span>
                    <div className="flex gap-2 flex-1 justify-end">
                      <span className="text-indigo-600 bg-white px-2 py-0.5 rounded-lg border border-indigo-100 text-[10px]" title="Active">{member.active} active</span>
                      <span className="text-amber-600 bg-white px-2 py-0.5 rounded-lg border border-amber-100 text-[10px]" title="În Review">{member.review} rev</span>
                      <span className="text-red-500 bg-white px-2 py-0.5 rounded-lg border border-red-100 text-[10px]" title="Blocked">{member.blocked} blk</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {user?.role !== 'owner' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 section-reveal">
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Task-urile Mele</p>
            <h3 className="text-3xl font-display text-tbp-dark">{myTasks.length}</h3>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-3xl p-5 shadow-sm text-center">
            <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2 text-orange-600">Urgent</p>
            <h3 className="text-3xl font-display text-orange-700">{myUrgentTasks.length}</h3>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-3xl p-5 shadow-sm text-center">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Așteaptă Review</p>
            <h3 className="text-3xl font-display text-amber-700">{myTasks.filter(t => t.status === 'review').length}</h3>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-3xl p-5 shadow-sm text-center relative overflow-hidden group">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Blocate</p>
            <h3 className="text-3xl font-display text-red-700">{myTasks.filter(t => t.status === 'blocked').length}</h3>
          </div>
        </div>
      )}

      {/* Quick Access & Filters */}
      <section className="section-reveal">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-display tracking-wide text-tbp-dark">Sarcini Prioritare</h2>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <button 
              onClick={() => setTaskFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${taskFilter === 'all' ? 'bg-tbp-dark text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}
            >
              Toate Active
            </button>
            <button 
              onClick={() => setTaskFilter('todo')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${taskFilter === 'todo' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}
            >
              De Făcut
            </button>
            <button 
              onClick={() => setTaskFilter('review')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${taskFilter === 'review' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}
            >
              În Review
            </button>
            <button 
              onClick={() => setTaskFilter('blocked')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${taskFilter === 'blocked' ? 'bg-red-500 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}
            >
              Blocate
            </button>
            <button 
              onClick={() => setTaskFilter('done')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${taskFilter === 'done' ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}
            >
              Finalizate
            </button>
            
            <div className="w-px h-6 bg-gray-200 mx-2" />
            
            <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-xl border border-gray-100">
               <button 
                 onClick={() => setSortOrder('deadline')}
                 className={`p-1.5 rounded-lg transition-all ${sortOrder === 'deadline' ? 'bg-white text-tbp-dark shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                 title="Sortare după Deadline"
               >
                 <Clock className="w-4 h-4" />
               </button>
               <button 
                 onClick={() => setSortOrder('newest')}
                 className={`p-1.5 rounded-lg transition-all ${sortOrder === 'newest' ? 'bg-white text-tbp-dark shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                 title="Sortare după Cele mai Noi"
               >
                 <ListIcon className="w-4 h-4" />
               </button>
            </div>
          </div>
        </div>

        {filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.slice(0, 6).map(task => (
              <div 
                key={task.id} 
                onClick={() => handleTaskClick(task)}
                className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3">
                   <StatusBadge status={task.status} />
                </div>
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">{task.client}</p>
                <h3 className="font-display text-lg text-tbp-dark mb-4 group-hover:text-indigo-600 transition-colors line-clamp-1">{task.title}</h3>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className={new Date(task.deadline) < new Date() ? 'text-red-500' : ''}>
                      {new Date(task.deadline).toLocaleDateString('ro-RO')}
                    </span>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${getAssigneeColor(task.assignee)}`}>
                    {task.assignee}
                  </div>
                </div>
              </div>
            ))}
            {filteredTasks.length > 6 && (
              <Link 
                to="/tasks" 
                className="bg-gray-50 border border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center p-8 group hover:bg-white hover:border-indigo-200 transition-all"
              >
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 group-hover:text-indigo-500 transition-colors">Vezi restul de {filteredTasks.length - 6} task-uri</p>
                <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500" />
                </div>
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-gray-900 font-display text-lg mb-1">Nicio sarcină activă</h3>
            <p className="text-sm text-gray-500">Ești la zi cu totul. Savurează o cafea! ☕</p>
          </div>
        )}
      </section>

      {/* Main Content Area */}
      <div className="space-y-12">
        {/* Clients Grid Section */}
        <div className="section-reveal">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-xl font-display tracking-wide text-tbp-dark">Clienți Activi</h2>
            <div className="flex items-center gap-4">
              {user?.role === 'owner' && (
                <>
                  <button 
                    onClick={exportToCSV}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border bg-white text-gray-500 border-gray-200 hover:bg-gray-50 flex items-center gap-1.5"
                    title="Exportă lista de clienți (CSV)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                  <button 
                    onClick={() => setShowAllProjects(!showAllProjects)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border ${showAllProjects ? 'bg-tbp-dark text-white border-tbp-dark' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                  >
                    {showAllProjects ? 'Vezi doar proiectele mele' : 'Vezi toate proiectele agenției'}
                  </button>
                </>
              )}
              <button className="text-sm font-semibold text-tbp-blue hover:text-tbp-blue-light flex items-center gap-1 transition-colors">
                Vezi toate <ArrowUpRight className="w-4 h-4" />
              </button>
              {user?.role === 'owner' && (
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await seedProjects();
                      fetchData();
                    }}
                    className="bg-gray-100 text-gray-700 text-xs font-bold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset DB
                  </button>
                  <button
                    onClick={() => setShowAddClientModal(true)}
                    className="bg-tbp-orange text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Adaugă Client
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {projects.filter(p => showAllProjects ? true : p.assignees.includes(user?.initials || '')).length === 0 ? (
            <div className="text-center py-10 bg-white rounded-3xl border border-gray-100 shadow-sm border-dashed">
              <p className="text-sm text-gray-500 font-bold mb-3">Nu ești alocat momentan pe niciun proiect activ.</p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Proiectele la care ești adăugat de Owner vor apărea aici.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projects
                .filter(p => showAllProjects ? true : p.assignees.includes(user?.initials || ''))
                .map(project => {
              const ProjectIcon = iconMap[project.icon_name] || Briefcase;
              
              return (
                <div key={project.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm transition-all duration-300 flex flex-col group hover:-translate-y-1 hover:shadow-md hover:border-gray-200 relative min-h-[220px]">
                  {/* Link invizibil care acoperă tot cardul */}
                  <Link to={`/client/${project.id}`} className="absolute inset-0 z-0 rounded-3xl"></Link>
                  
                  <div className="flex justify-between items-start mb-4 relative z-10 pointer-events-none">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3 ${project.color}`}>
                        <ProjectIcon className="w-5 h-5" />
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${project.color} bg-opacity-20`}>
                        {project.client}
                      </span>
                    </div>
                    {/* Edit Button */}
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingProject(project.id);
                      }}
                      className="p-2 text-gray-400 hover:text-tbp-orange hover:bg-tbp-orange/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 pointer-events-auto"
                      title="Personalizează"
                    >
                      <Palette className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mb-4 relative z-10 pointer-events-none">
                    <h4 className="font-display text-lg text-tbp-dark mb-1 line-clamp-2 leading-snug" title={project.name}>{project.name}</h4>
                  </div>

                  <div className="flex flex-col gap-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100 mb-6 relative z-10 pointer-events-none flex-1">
                    <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      Task-uri Active ({project.activeTasksCount || 0})
                    </span>
                    {project.activeTasksList && project.activeTasksList.length > 0 ? (
                      <div className="space-y-1.5 flex-1 max-h-[120px] overflow-hidden">
                        {project.activeTasksList.slice(0, 5).map((task: any) => (
                          <div key={task.id} className="text-[11px] font-semibold text-tbp-dark line-clamp-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-tbp-blue shrink-0"></span>
                            <span className="line-clamp-1" title={task.title.replace(/\[.*?\]\s*/g, '')}>{task.title.replace(/\[.*?\]\s*/g, '')}</span>
                          </div>
                        ))}
                        {project.activeTasksList.length > 5 && (
                          <div className="text-[10px] font-bold text-gray-400 pt-1.5 pl-3">
                            + încă {project.activeTasksList.length - 5}
                          </div>
                        )}
                      </div>
                    ) : (
                       <span className="text-[11px] font-semibold text-gray-400 italic">Nu ai sarcini alocate.</span>
                    )}
                  </div>

                  <div className="relative z-10 pointer-events-none mt-auto">
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {project.assignees.map((init, i) => (
                            <div 
                              key={i} 
                              className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold shadow-sm ${getAssigneeColor(init)}`}
                              title={`Responsabil: ${init}`}
                            >
                              {init}
                            </div>
                          ))}
                        </div>
                        <StatusBadge status={project.status} size="sm" />
                      </div>
                      <div className="flex items-center gap-2 pointer-events-auto">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setTaskModalProjectId(project.id);
                            setIsTaskModalOpen(true);
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-tbp-orange hover:text-white transition-colors border border-gray-100 hover:border-tbp-orange"
                          title="Adaugă Task Nou"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>

        {(user?.initials === 'GB' || user?.role === 'owner') && (
          <div className="section-reveal">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-xl font-display tracking-wide text-tbp-dark">Video Hub (Sarcini Montaj)</h2>
              <div className="flex items-center gap-4">
                {user?.role === 'owner' && (
                  <button 
                    onClick={() => setShowAddVideoModal(true)}
                    className="text-xs font-bold px-4 py-2 bg-tbp-dark text-white rounded-xl hover:bg-tbp-orange transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Adaugă Sarcina Video
                  </button>
                )}
                <Link to="/tasks" className="text-sm font-semibold text-tbp-blue hover:text-tbp-blue-light flex items-center gap-1 transition-colors">
                  Vezi workflow video <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            
            {allVideoTasks.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 shadow-sm border-dashed">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
                  <Monitor className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 font-bold mb-2">Nicio sarcină video momentan.</p>
                <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed mb-4">
                  Deocamdată nu ai materiale de montat în așteptare. Relaxează-te sau verifică fluxul general pe Kanban.
                </p>
                {user?.role === 'owner' && (
                  <button onClick={() => setShowAddVideoModal(true)} className="inline-flex items-center gap-2 text-tbp-orange hover:bg-orange-50 bg-white border border-orange-200 px-4 py-2 rounded-xl font-bold text-sm transition-colors">
                    <Plus className="w-4 h-4" />
                    Adaugă prima sarcină video
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {allVideoTasks.map(task => {
                const projectName = projects.find(p => p.id === task.project_id)?.client || 'Proiect Necunoscut';
                let derivedStatus = 'De Montat';
                let statusColor = 'bg-indigo-100 text-indigo-700 border border-indigo-200';
                
                if (task.status === 'in_progress') {
                  derivedStatus = 'În lucru / Review';
                  statusColor = 'bg-amber-100 text-amber-700 border border-amber-200';
                } else if (task.status === 'done') {
                  derivedStatus = 'Finalizat';
                  statusColor = 'bg-emerald-100 text-emerald-700 border border-emerald-200';
                }

                return (
                  <div 
                    key={task.id} 
                    onClick={() => handleTaskClick(task)}
                    className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4 relative hover:shadow-md transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                          {projectName}
                        </span>
                        <h4 className="font-display text-lg text-tbp-dark leading-snug break-words">
                          {task.title.replace('[VIDEO] ', '')}
                        </h4>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusColor} whitespace-nowrap ml-2`}>
                        {derivedStatus}
                      </span>
                    </div>

                    {task.instructions && (
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {task.instructions}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 mt-auto pt-4 border-t border-gray-50">
                      {task.drive_link && (
                        <a href={task.drive_link} target="_blank" rel="noreferrer" className="text-sm font-semibold px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-2">
                          <Cloud className="w-4 h-4" /> Brut (Drive)
                        </a>
                      )}
                      
                      {task.extra_link && (
                        <a href={task.extra_link} target="_blank" rel="noreferrer" className="text-sm font-semibold px-4 py-2 bg-pink-50 text-pink-600 rounded-xl hover:bg-pink-100 transition-colors flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Extra
                        </a>
                      )}
                      
                      {task.finished_link ? (
                        <a href={task.finished_link} target="_blank" rel="noreferrer" className="text-sm font-semibold px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors flex items-center gap-2">
                          <Download className="w-4 h-4" /> Descarcă Final
                        </a>
                      ) : (
                         <div className="text-sm font-semibold px-4 py-2 bg-gray-50 text-gray-400 rounded-xl flex items-center gap-2 border border-gray-100 border-dashed">
                          <Clock className="w-4 h-4" /> Final în așteptare...
                        </div>
                      )}

                      <Link to={`/client/${task.project_id}`} className="text-sm font-semibold px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors ml-auto">
                        {user?.initials === 'GB' ? 'Setează Link Final' : 'Vezi Client / Editează'}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        )}

      {/* Team Calendar Widget */}
      {(user?.initials === 'AS' || user?.initials === 'AR' || user?.role === 'owner') && (
        <TeamCalendarWidget 
          events={allTasks.filter(t => t.title?.startsWith('[EVENT]')).map(t => {
            let payload: any = {};
            try { payload = JSON.parse(t.description || '{}'); } catch(e){}
            return {
              title: t.title,
              date: payload.date || t.deadline,
              color: payload.color || 'bg-indigo-100 text-indigo-700',
              assignee: t.assignee
            };
          })}
          onAddEvent={handleAddEventClick}
          userRole={user?.role}
          initials={user?.initials}
        />
      )}

      </div>

      {/* Modal Personalizare Client */}
      {editingProject !== null && (
        <div className="fixed inset-0 bg-tbp-dark/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-display text-xl text-tbp-dark">Personalizează Clientul</h3>
              <button onClick={() => setEditingProject(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Culoare */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Culoare Fundal</label>
                <div className="flex flex-wrap gap-3">
                  {availableColors.map(color => {
                    const isSelected = projects.find(p => p.id === editingProject)?.color === color;
                    return (
                      <button
                        key={color}
                        onClick={() => updateProject(editingProject, { color })}
                        className={`w-10 h-10 rounded-xl border-2 transition-all ${color} ${isSelected ? 'border-tbp-dark scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                        title="Alege culoarea"
                      />
                    );
                  })}
                </div>
              </div>

              {/* Iconiță */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Iconiță</label>
                <div className="flex flex-wrap gap-3">
                  {availableIcons.map(iconName => {
                    const IconComp = iconMap[iconName];
                    const isSelected = projects.find(p => p.id === editingProject)?.icon_name === iconName;
                    return (
                      <button
                        key={iconName}
                        onClick={() => updateProject(editingProject, { icon_name: iconName })}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-tbp-dark text-white shadow-md scale-110' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:scale-105'}`}
                        title={`Alege iconița ${iconName}`}
                      >
                        <IconComp className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button onClick={() => setEditingProject(null)} className="px-6 py-2.5 bg-tbp-dark text-white rounded-xl font-semibold text-sm hover:bg-tbp-darker transition-colors">
                Gata
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adăugare Sarcină Video */}
      {showAddVideoModal && (
        <div className="fixed inset-0 bg-tbp-dark/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-display text-xl text-tbp-dark">Adaugă Sarcină Video (Gabi)</h3>
              <button 
                onClick={() => setShowAddVideoModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleCreateVideoTask}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Client / Proiect</label>
                  <select 
                    required
                    value={newVideoForm.projectId}
                    onChange={(e) => setNewVideoForm({...newVideoForm, projectId: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-tbp-orange focus:ring-1 focus:ring-tbp-orange appearance-none"
                  >
                    <option value="" disabled>Alege clientul...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.client}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Titlu Material</label>
                  <input 
                    required
                    type="text"
                    value={newVideoForm.title}
                    onChange={(e) => setNewVideoForm({...newVideoForm, title: e.target.value})}
                    placeholder="Ex: Reel Lansare Produs"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-tbp-orange focus:ring-1 focus:ring-tbp-orange"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Link Brut (Drive)</label>
                      <input 
                        type="text"
                        value={newVideoForm.drive_link}
                        onChange={(e) => setNewVideoForm({...newVideoForm, drive_link: e.target.value})}
                        placeholder="Link folder..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-tbp-orange focus:ring-1 focus:ring-tbp-orange"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Link Extra (Opțional)</label>
                      <input 
                        type="text"
                        value={newVideoForm.extra_link}
                        onChange={(e) => setNewVideoForm({...newVideoForm, extra_link: e.target.value})}
                        placeholder="Grafică/Audio..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-tbp-orange focus:ring-1 focus:ring-tbp-orange"
                      />
                    </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Instrucțiuni Montaj</label>
                  <textarea 
                    value={newVideoForm.instructions}
                    onChange={(e) => setNewVideoForm({...newVideoForm, instructions: e.target.value})}
                    placeholder="Cum vrei să fie montat? Text pe video, feeling-ul general..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-tbp-orange focus:ring-1 focus:ring-tbp-orange resize-none h-24"
                  />
                </div>
              </div>
              
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddVideoModal(false)}
                  className="px-6 py-2.5 text-gray-500 font-semibold text-sm hover:text-tbp-dark transition-colors"
                >
                  Anulează
                </button>
                <button 
                  type="submit"
                  disabled={!newVideoForm.title || !newVideoForm.projectId}
                  className="px-6 py-2.5 bg-tbp-orange text-white rounded-xl font-semibold text-sm hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50"
                >
                  Adaugă Sarcina
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEventModal && selectedDateForEvent && (
        <div className="fixed inset-0 bg-tbp-dark/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-display text-tbp-dark">
                Adaugă Eveniment - {selectedDateForEvent.toLocaleDateString('ro-RO')}
              </h2>
              <button onClick={() => setShowAddEventModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateEvent}>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Denumire Eveniment</label>
                  <input 
                    type="text" 
                    value={newEventForm.title}
                    onChange={(e) => setNewEventForm({...newEventForm, title: e.target.value})}
                    placeholder="Concediu, Focus Day, Ședință foto..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Categorie Culoare</label>
                  <div className="flex gap-3">
                    {[
                      { val: 'bg-indigo-100 text-indigo-700', bg: 'bg-indigo-500' },
                      { val: 'bg-green-100 text-green-700', bg: 'bg-green-500' },
                      { val: 'bg-orange-100 text-orange-700', bg: 'bg-orange-500' },
                      { val: 'bg-pink-100 text-pink-700', bg: 'bg-pink-500' },
                      { val: 'bg-purple-100 text-purple-700', bg: 'bg-purple-500' },
                    ].map(c => (
                      <button 
                        key={c.val}
                        type="button"
                        onClick={() => setNewEventForm({...newEventForm, color: c.val})}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${newEventForm.color === c.val ? 'ring-2 ring-offset-2 ring-blue-500' : 'hover:scale-110'}`}
                      >
                        <div className={`w-8 h-8 rounded-full ${c.bg}`}></div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddEventModal(false)}
                  className="px-6 py-2.5 text-gray-500 font-semibold text-sm hover:text-tbp-dark transition-colors"
                >
                  Anulează
                </button>
                <button 
                  type="submit"
                  disabled={!newEventForm.title}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  Salvează Eveniment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal (For All Users via Client Cards) */}
      <TaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskModalProjectId(undefined);
        }} 
        user={user} 
        projects={projects} 
        defaultProjectId={taskModalProjectId}
        onTaskAdded={() => fetchProjects()}
      />

      <TaskDrawer 
        task={selectedTask}
        isOpen={isTaskDrawerOpen}
        onClose={() => {
          setIsTaskDrawerOpen(false);
          setSelectedTask(null);
        }}
        currentUser={user}
        onUpdate={() => fetchData()}
      />

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-xl text-tbp-dark">Adaugă Proiect / Client</h3>
              <button onClick={() => setShowAddClientModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nume Proiect / Client</label>
                <input 
                  type="text" 
                  autoFocus
                  value={newClientForm.name}
                  onChange={(e) => setNewClientForm({...newClientForm, name: e.target.value})}
                  className="w-full border-gray-200 rounded-xl focus:ring-tbp-orange focus:border-tbp-orange sm:text-sm bg-gray-50 border px-3 py-2"
                  placeholder="Ex: Infinity Forest"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Responsabili (Inițiale)</label>
                <input 
                  type="text" 
                  value={newClientForm.assignees.join(', ')}
                  onChange={(e) => setNewClientForm({...newClientForm, assignees: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                  className="w-full border-gray-200 rounded-xl focus:ring-tbp-orange focus:border-tbp-orange sm:text-sm bg-gray-50 border px-3 py-2"
                  placeholder="Ex: RM, AS, GB"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAddClientModal(false)}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                >
                  Anulează
                </button>
                <button 
                  type="submit"
                  disabled={!newClientForm.name}
                  className="px-6 py-2.5 bg-tbp-orange text-white rounded-xl font-semibold text-sm hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50"
                >
                  Salvează Proiectul
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
