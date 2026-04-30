import React, { useState, useMemo, useEffect } from 'react';
import { Calendar as CalendarIcon, CheckCircle2, Clock, Filter, ChevronLeft, ChevronRight, LayoutList, CalendarDays, KanbanSquare, MoreHorizontal, Plus, X, Paperclip, Trash2, Cloud, FileText, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import EmptyState from '../components/EmptyState';
import { supabase } from '../lib/supabase';

import { Link, useLocation } from 'react-router-dom';
import TaskModal from '../components/TaskModal';
import TaskDrawer from '../components/TaskDrawer';

// Utility pentru description de Video Task si Task-uri Generale cu JSON metadata
const renderTaskDescription = (task: any, clampClass = "line-clamp-2") => {
  if (task.title?.startsWith('[VIDEO]')) {
    return (
      <div className="mt-2 space-y-1.5 text-[11px]">
        {task.drive_link && <a href={task.drive_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 flex items-center gap-1"><Cloud className="w-3.5 h-3.5"/> Video Brut (Drive)</a>}
        {task.extra_link && <a href={task.extra_link} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-600 flex items-center gap-1"><FileText className="w-3.5 h-3.5"/> Extra Assets</a>}
        {task.finished_link && <a href={task.finished_link} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-600 flex items-center gap-1 font-bold"><Cloud className="w-3.5 h-3.5"/> Video Final</a>}
        {(task.instructions || task.description) && <p className={`text-gray-500 italic bg-gray-50 p-1.5 rounded border border-gray-100 ${clampClass}`}>{task.instructions || task.description}</p>}
      </div>
    );
  }
  
  const hasMeta = task.task_type || task.priority || task.block_reason;

  if (hasMeta) {
     return (
       <div className="mt-2 space-y-1.5">
         {(task.task_type || task.priority) && (
           <div className="flex flex-wrap gap-1">
             {task.task_type && <span className="bg-gray-100 text-gray-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">{task.task_type}</span>}
             {task.priority && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${task.priority === 'Urgent' ? 'bg-red-100 text-red-700' : task.priority === 'Important' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{task.priority}</span>}
           </div>
         )}
         {task.block_reason && task.boardStatus === 'blocked' && (
           <div className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-1 rounded inline-block">
             Motiv blocaj: {task.block_reason}
           </div>
         )}
         {(task.instructions || task.description) && <p className={`text-xs text-gray-500 mt-1 leading-relaxed ${clampClass}`}>{task.instructions || task.description}</p>}
       </div>
     );
  }

  if (!task.description && !task.instructions) return null;
  return <p className={`text-xs text-gray-500 mt-2 leading-relaxed ${clampClass}`}>{task.instructions || task.description}</p>;
};

// Palette generală pentru culori dinamice
const colorPalette = [
  { bg: 'bg-emerald-100', text: 'text-emerald-700', strip: 'bg-emerald-500' },
  { bg: 'bg-blue-100', text: 'text-blue-700', strip: 'bg-blue-500' },
  { bg: 'bg-amber-100', text: 'text-amber-700', strip: 'bg-amber-500' },
  { bg: 'bg-purple-100', text: 'text-purple-700', strip: 'bg-purple-500' },
  { bg: 'bg-rose-100', text: 'text-rose-700', strip: 'bg-rose-500' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', strip: 'bg-indigo-500' },
  { bg: 'bg-pink-100', text: 'text-pink-700', strip: 'bg-pink-500' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700', strip: 'bg-cyan-500' },
  { bg: 'bg-teal-100', text: 'text-teal-700', strip: 'bg-teal-500' },
  { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', strip: 'bg-fuchsia-500' }
];

// Helper pentru culorile clienților
const getClientStyle = (clientName: string) => {
  if (!clientName) return { bg: 'bg-gray-100', text: 'text-gray-700', strip: 'bg-gray-400' };
  
  // Specific fallbacks
  if (clientName === 'INFINITY FOREST') return { bg: 'bg-emerald-100', text: 'text-emerald-700', strip: 'bg-emerald-500' };
  if (clientName === 'CLINICA32') return { bg: 'bg-blue-100', text: 'text-blue-700', strip: 'bg-blue-500' };
  
  const hash = clientName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colorPalette[hash % colorPalette.length];
};

const getAssigneeColor = (initials: string) => {
  if (!initials) return 'bg-gray-100 text-gray-700 border-gray-200';
  const nameToUse = initials.trim().toUpperCase();
  switch (nameToUse) {
    case 'AS': return 'bg-pink-100 text-pink-700 border-pink-200';
    case 'AR': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'RM': return 'bg-orange-100 text-orange-700 border-orange-200';
  }
  // Generăm o culoare dacă nu e în listă
  const hash = nameToUse.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const palette = [
    'bg-indigo-100 text-indigo-700 border-indigo-200',
    'bg-teal-100 text-teal-700 border-teal-200',
    'bg-rose-100 text-rose-700 border-rose-200',
    'bg-cyan-100 text-cyan-700 border-cyan-200',
    'bg-amber-100 text-amber-700 border-amber-200'
  ];
  return palette[hash % palette.length];
};

// Helper pentru formatarea datelor
const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export default function TasksCalendar() {
  const { user } = useAuth();
  const location = useLocation();
  const state = location.state as any;

  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'kanban'>('kanban');
  const [groupingMode, setGroupingMode] = useState<'status' | 'person' | 'client'>(state?.groupingMode || 'status');
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'archived' | 'overdue'>(state?.filter || 'all');
  const [ownerViewFilter, setOwnerViewFilter] = useState<'all' | 'me' | 'team'>(state?.ownerViewFilter || 'all');
  const [kanbanClientFilter, setKanbanClientFilter] = useState<string>('all');
  
  const teamMembersRaw = [
    { name: 'Rozalia Marinescu', initials: 'RM', role: 'Owner' },
    { name: 'Andreea Sîrbu', initials: 'AS', role: 'Social Media' },
    { name: 'Aurora Roventa', initials: 'AR', role: 'Marketing' },
    { name: 'Gabi Buliga', initials: 'GB', role: 'Video' }
  ];

  const getFullAssigneeName = (initials: string) => {
    return teamMembersRaw.find(t => t.initials === initials)?.name || initials;
  };

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [pendingStatusTask, setPendingStatusTask] = useState<{taskId: number, newBoardStatus: string, newDbStatus: string, task: any} | null>(null);
  
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);

  const [drawerTask, setDrawerTask] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = (task: any) => {
    setDrawerTask(task);
    setIsDrawerOpen(true);
  };
  
  useEffect(() => {
    if (isDrawerOpen && drawerTask && allTasks.length > 0) {
      const updatedTask = allTasks.find(t => t.id === drawerTask.id);
      if (updatedTask) {
        // Deep compare or just update if different
        if (JSON.stringify(updatedTask) !== JSON.stringify(drawerTask)) {
          setDrawerTask(updatedTask);
        }
      }
    }
  }, [allTasks, isDrawerOpen, drawerTask]);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const today = new Date();
  
  useEffect(() => {
    fetchTasks();
    fetchProjects();

    const subscription = supabase
      .channel('tasks_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase.from('projects').select('id, client').order('client', { ascending: true });
      if (!error && data) {
        setAllProjects(data);
      }
    } catch (e) {
      console.error('Error fetching projects:', e);
    }
  };

  const { addAlert } = useAlerts();

  const summaryData = useMemo(() => {
    if (user?.role !== 'owner') return null;
    
    const collaborators = teamMembersRaw.filter(m => m.initials !== 'RM');
    const todayCutoff = new Date();
    todayCutoff.setHours(23, 59, 59, 999);

    const personStats = collaborators.map(m => {
      const pTasks = allTasks.filter(t => t.assignee === m.initials && !t.isArchived);
      return {
        ...m,
        active: pTasks.filter(t => t.status !== 'completed').length,
        review: pTasks.filter(t => t.status === 'in_review').length,
        overdue: pTasks.filter(t => t.deadline < new Date() && t.status !== 'completed').length
      };
    });

    const waitingOnMe = allTasks.filter(t => t.boardStatus === 'review' && !t.isArchived).length;
    const totalOverdue = allTasks.filter(t => t.deadline < new Date() && t.status !== 'completed' && !t.isArchived).length;

    return { personStats, waitingOnMe, totalOverdue };
  }, [allTasks, user]);

  const kanbanColumns = useMemo(() => {
    if (groupingMode === 'status') {
      return [
        { id: 'todo', title: 'De Făcut', color: 'bg-gray-100 text-gray-400', border: 'border-gray-200', helper: 'Sarcini noi' },
        { id: 'in-progress', title: 'În Lucru', color: 'bg-blue-100 text-blue-600', border: 'border-blue-200', helper: 'Activ' },
        { id: 'review', title: 'În Review', color: 'bg-amber-100 text-amber-600', border: 'border-amber-200', helper: 'Verificare' },
        { id: 'needs-changes', title: 'De Ajustat', color: 'bg-pink-100 text-pink-600', border: 'border-pink-200', helper: 'Feedback' },
        { id: 'blocked', title: 'Blocat', color: 'bg-red-100 text-red-600', border: 'border-red-200', helper: 'Probleme' },
        { id: 'done', title: 'Finalizat', color: 'bg-emerald-100 text-emerald-600', border: 'border-emerald-200', helper: 'Gata' }
      ];
    } else if (groupingMode === 'person') {
       return teamMembersRaw.map(m => ({
          id: m.initials,
          title: m.name,
          color: getAssigneeColor(m.initials),
          border: 'border-gray-200',
          helper: m.role
       }));
    } else if (groupingMode === 'client') {
       // Filter clients that actually have tasks to avoid empty columns
       const activeClients = Array.from(new Set(allTasks.filter(t => !t.isArchived).map(t => t.client)))
         .filter(c => c !== 'Necunoscut'); // We handle unassigned separately or just hide them if empty
       
       const columns = activeClients.map(client => ({
          id: client,
          title: client,
          color: getClientStyle(client).bg + ' ' + getClientStyle(client).text,
          border: 'border-gray-200',
          helper: 'Proiect Active'
       }));

       // Add "Fără Proiect" column ONLY if there are tasks in it
       const hasUnassigned = allTasks.some(t => t.client === 'Necunoscut' && !t.isArchived);
       if (hasUnassigned) {
         columns.push({
           id: 'Necunoscut',
           title: 'Fără Proiect',
           color: 'bg-gray-100 text-gray-500',
           border: 'border-gray-200',
           helper: 'Sarcini nealocate'
         });
       }
       return columns;
    }
    return [];
  }, [groupingMode, allTasks]);

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData('taskId', taskId.toString());
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData('taskId');
    if (!taskIdStr) return;
    const taskId = parseInt(taskIdStr, 10);
    
    // Find previous task state
    const currentTask = allTasks.find(t => t.id === taskId);
    if (!currentTask) return;

    let updateFields: any = {};
    let newBoardStatus = currentTask.boardStatus;
    let newDbStatus = currentTask.status;

    if (groupingMode === 'status') {
      const getDbStatus = (boardState: string) => {
        if (boardState === 'todo') return 'pending';
        if (boardState === 'in-progress') return 'in_progress';
        if (boardState === 'review') return 'in_review';
        if (boardState === 'needs-changes') return 'needs_changes';
        if (boardState === 'blocked') return 'blocked';
        if (boardState === 'done') return 'completed';
        return boardState;
      };
      newBoardStatus = targetId;
      newDbStatus = getDbStatus(targetId);
      if (currentTask.boardStatus === targetId) return;

      if (targetId === 'review' || targetId === 'blocked') {
        setPendingStatusTask({ taskId, newBoardStatus: targetId, newDbStatus, task: currentTask });
        return;
      }
      updateFields.status = newDbStatus;
      updateFields.updated_at = new Date().toISOString();
      if (newDbStatus === 'in_review') updateFields.moved_to_review_at = new Date().toISOString();
      if (newDbStatus === 'completed') updateFields.completed_at = new Date().toISOString();
    } else if (groupingMode === 'person') {
      if (currentTask.assignee === targetId) return;
      updateFields.assignee = targetId;
    } else if (groupingMode === 'client') {
      const project = allProjects.find(p => p.client === targetId);
      if (!project || currentTask.project_id === project.id) return;
      updateFields.project_id = project.id;
    }

    // Direct optimistic UI update
    setAllTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updated = { ...t, ...updateFields };
        if (updateFields.status) updated.boardStatus = newBoardStatus;
        if (updateFields.project_id) {
          const p = allProjects.find(ap => ap.id === updateFields.project_id);
          updated.client = p?.client || t.client;
        }
        return updated;
      }
      return t;
    }));

    try {
      const { error } = await supabase
        .from('tasks')
        .update(updateFields)
        .eq('id', taskId);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to update task:', err);
      fetchTasks(); // rollback UI on fail
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Required to allow dropping
  };

  const handleStatusConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingStatusTask) return;
    
    const { taskId, newBoardStatus, newDbStatus, task } = pendingStatusTask;
    const form = e.target as HTMLFormElement;
    const notes = Array.from(form.elements).find((el: any) => el.name === 'notes') as HTMLTextAreaElement | undefined;
    const noteValue = notes?.value || '';

    // Extragere reason pentru block
    const reasonSelect = Array.from(form.elements).find((el: any) => el.name === 'reason') as HTMLSelectElement | undefined;
    const blockReason = reasonSelect ? reasonSelect.value : '';

    setAllTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, boardStatus: newBoardStatus, status: newDbStatus } 
        : t
    ));

    try {
      const updatePayload: any = { 
        status: newDbStatus,
        updated_at: new Date().toISOString()
      };
      
      if (newBoardStatus === 'blocked' && blockReason) {
        updatePayload.block_reason = `${blockReason}: ${noteValue}`;
      }
      
      if (newBoardStatus === 'review') {
        updatePayload.moved_to_review_at = new Date().toISOString();
        if (noteValue) updatePayload.description = noteValue; // Feedback/Review note stored in description
      }

      const { error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', taskId);

      if (error) {
        throw error;
      }
      
      if (newBoardStatus === 'review') {
         await addAlert({
           title: 'Task Pentru Verificare',
           description: `[${task.title}] - ${noteValue || 'Trimis în review de colaboratori.'}`,
           client: task.client || 'General',
           assignee: 'Rozalia', // default to Rozalia for Reviews
           assigneeInitials: 'RM',
           assigneeColor: 'bg-amber-100 text-amber-700',
           errorCode: `TASK:${taskId}`,
           severity: 'info'
         });
      } else if (newBoardStatus === 'blocked') {
         await addAlert({
           title: 'Task Blocat',
           description: `[${task.title}] stă blocat. Motiv: ${blockReason}. Notițe: ${noteValue}`,
           client: task.client || 'General',
           assignee: 'Rozalia', // Notificam owner
           assigneeInitials: 'RM',
           assigneeColor: 'bg-red-100 text-red-700',
           errorCode: `TASK:${taskId}`,
           severity: 'critical'
         });
      }
    } catch (err) {
      console.error('Failed to update task status with confirm:', err);
      fetchTasks(); // rollback UI on fail
    } finally {
      setPendingStatusTask(null);
    }
  };

  const handleQuickStatusUpdate = async (taskId: number, newStatus: string) => {
    const dbStatus = newStatus === 'done' ? 'completed' : newStatus === 'needs-changes' ? 'needs_changes' : newStatus;
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;

    // Optimistic update
    setAllTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, boardStatus: newStatus, status: dbStatus } : t
    ));

    try {
      const updatePayload: any = { 
        status: dbStatus, 
        updated_at: new Date().toISOString() 
      };
      if (dbStatus === 'completed') updatePayload.completed_at = new Date().toISOString();

      const { error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', taskId);
      
      if (error) throw error;

      // Notify assignee if owner changed it
      if (user?.role === 'owner') {
        const task = allTasks.find(t => t.id === taskId);
        if (task && task.assignee !== user.initials) {
          await addAlert({
            title: newStatus === 'done' ? 'Task Aprobat ✅' : 'Necesită Modificări ✍️',
            description: `Owner-ul a ${newStatus === 'done' ? 'aprobat' : 'cerut modificări pentru'} task-ul "${task.title}".`,
            client: task.client || 'General',
            assignee: task.assignee_full || task.assignee,
            assigneeInitials: task.assignee,
            assigneeColor: newStatus === 'done' ? 'bg-emerald-100 text-emerald-700' : 'bg-pink-100 text-pink-700',
            errorCode: `TASK:${taskId}`,
            severity: 'info'
          });
        }
      }
    } catch (err) {
      console.error('Quick status update failed:', err);
      fetchTasks();
    }
  };

  const handleTitleEditStart = (taskId: number, currentTitle: string) => {
    setEditingTaskId(taskId);
    setEditingTitle(currentTitle);
  };

  const handleTitleEditSave = async (taskId: number) => {
    if (!editingTitle.trim()) {
      setEditingTaskId(null);
      return;
    }
    
    // Prevent empty or unchanged update
    const currentTask = allTasks.find(t => t.id === taskId);
    if (currentTask && currentTask.title === editingTitle) {
      setEditingTaskId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ title: editingTitle })
        .eq('id', taskId);

      if (error) throw error;
      
      // Update local state directly to avoid waiting for real-time channel
      setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, title: editingTitle } : t));
    } catch (err) {
      console.error('Failed to update task title:', err);
    } finally {
      setEditingTaskId(null);
    }
  };

  const handleTitleEditKeyDown = (e: React.KeyboardEvent, taskId: number) => {
    if (e.key === 'Enter') {
      handleTitleEditSave(taskId);
    } else if (e.key === 'Escape') {
      setEditingTaskId(null);
    }
  };

  const fetchTasks = async () => {
    try {
      // 1. Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('deadline', { ascending: true });

      if (tasksError) throw tasksError;

      // 2. Fetch projects securely to map names
      const { data: projectsData, error: projError } = await supabase
        .from('projects')
        .select('id, client');
        
      if (projError) throw projError;

      if (tasksData && projectsData) {
        const pMap = new Map();
        projectsData.forEach(p => pMap.set(p.id, p.client));

        const getBoardStatus = (dbStatus: string) => {
          if (dbStatus === 'pending') return 'todo';
          if (dbStatus === 'in_progress') return 'in-progress';
          if (dbStatus === 'in_review' || dbStatus === 'review') return 'review';
          if (dbStatus === 'needs_changes') return 'needs-changes';
          if (dbStatus === 'blocked') return 'blocked';
          if (dbStatus === 'completed' || dbStatus === 'done') return 'done';
          // Fallback map
          if (dbStatus === 'in-progress') return 'in-progress';
          return dbStatus;
        };

        const formattedTasks = tasksData.map(t => {
          const completedAt = t.completed_at;
          const isActuallyArchived = (t.status === 'completed' || t.status === 'done') && completedAt && (
            Math.floor((Date.now() - new Date(completedAt).getTime()) / (1000 * 60 * 60 * 24)) > 7
          );

          return {
            ...t,
            client: pMap.get(t.project_id) || 'Necunoscut',
            deadline: new Date(t.deadline),
            boardStatus: getBoardStatus(t.status),
            time: '12:00',
            isArchived: isActuallyArchived || !!t.archived_at
          };
        });
        setAllTasks(formattedTasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const userTasks = useMemo(() => {
    let baseTasks = allTasks;
    
    // Filter out archived tasks unless we are specifically viewing them
    if (filter !== 'archived') {
      baseTasks = allTasks.filter(t => !t.isArchived);
    } else {
      baseTasks = allTasks.filter(t => t.isArchived);
    }
    
    if (user?.role === 'owner') {
      if (ownerViewFilter === 'me') {
        baseTasks = baseTasks.filter(t => t.assignee === user?.initials);
      } else if (ownerViewFilter === 'team') {
        baseTasks = baseTasks.filter(t => t.assignee !== user?.initials);
      }
    } else {
      baseTasks = baseTasks.filter(t => t.assignee === user?.initials);
    }
    
    return baseTasks;
  }, [allTasks, user, ownerViewFilter]);

  const uniqueClients = useMemo(() => {
    return Array.from(new Set(userTasks.map(t => t.client)));
  }, [userTasks]);

  // Funcții Calendar
  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskToDelete);
      if (error) throw error;
      setAllTasks(prev => prev.filter(t => t.id !== taskToDelete));
    } catch (err) {
      console.error('Eroare la ștergerea task-ului:', err);
    } finally {
      setTaskToDelete(null);
    }
  };

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startingDay = startOfMonth.getDay(); 
  const adjustedStartingDay = startingDay === 0 ? 6 : startingDay - 1; // Luni = 0
  const daysInMonth = endOfMonth.getDate();

  const days = [];
  for (let i = 0; i < adjustedStartingDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }

  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const monthNames = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const form = e.target as HTMLFormElement;
    const title = (form.elements.namedItem('title') as HTMLInputElement).value;
    const client = (form.elements.namedItem('client') as HTMLSelectElement).value;
    const deadlineStr = (form.elements.namedItem('deadline') as HTMLInputElement).value;
    const assignee = (form.elements.namedItem('assignee') as HTMLSelectElement).value;
    const description = (form.elements.namedItem('description') as HTMLTextAreaElement).value;
    const attachmentFile = (form.elements.namedItem('attachment') as HTMLInputElement).files?.[0];

    const assigneeInitials = assignee.split(' ').map(n => n[0]).join('');
    
    let attachmentUrl = null;
    
    if (attachmentFile) {
      try {
        const fileExt = attachmentFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${client}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, attachmentFile);
          
        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          // Fallback
          attachmentUrl = attachmentFile.name; 
        } else {
          const { data } = supabase.storage.from('attachments').getPublicUrl(filePath);
          attachmentUrl = data.publicUrl;
        }
      } catch (err) {
        console.error("Upload failed", err);
        attachmentUrl = attachmentFile.name;
      }
    }

    try {
      // Find the project_id for the selected client name
      const { data: projectData } = await supabase
        .from('projects')
        .select('id')
        .eq('client', client)
        .single();

      const { error } = await supabase.from('tasks').insert([{
        title,
        project_id: projectData?.id || null, // Map the client name to project_id integer
        deadline: deadlineStr ? (isNaN(new Date(deadlineStr).getTime()) ? new Date().toISOString() : new Date(deadlineStr).toISOString()) : new Date().toISOString(),
        status: 'pending', // Trying "pending" instead of "todo" to match possible DB constraint
        assignee: assigneeInitials,
        description: description || null,
        attachment: attachmentUrl
      }]);

      if (error) throw error;
      
      if (assigneeInitials !== user?.initials) {
         await addAlert({
           title: 'Task Nou Alocat',
           description: `${user?.full_name || 'Owner-ul'} ți-a delegat task-ul "${title}".`,
           client: client || 'General',
           assignee: assignee, // We send it to the full name
           assigneeInitials: assigneeInitials,
           assigneeColor: 'bg-blue-100 text-blue-700',
           errorCode: `TASK-${new Date().getTime().toString().slice(-6)}`,
           severity: 'info'
         });
      }

      setIsTaskModalOpen(false);
    } catch (error: any) {
      console.error('Error adding task:', error);
      setSubmitError(error?.message || "Eroare necunoscută la conectarea cu baza de date.");
    }
  };

  // Filtrare task-uri pentru afișare
  let displayedTasks = userTasks;
  if (viewMode === 'calendar') {
    displayedTasks = userTasks.filter(t => isSameDay(t.deadline, selectedDate));
  } else {
    if (filter === 'today') displayedTasks = userTasks.filter(t => isSameDay(t.deadline, today));
    if (filter === 'upcoming') displayedTasks = userTasks.filter(t => t.deadline >= today && !t.isArchived);
    if (filter === 'overdue') displayedTasks = userTasks.filter(t => t.deadline < today && t.status !== 'done' && !t.isArchived);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {user?.role === 'owner' && summaryData && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {summaryData.personStats.map((p, idx) => (
            <button 
              key={p.initials} 
              onClick={() => {
                setViewMode('kanban');
                setGroupingMode('person');
                setOwnerViewFilter('all');
                setKanbanClientFilter('all');
              }}
              className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm section-reveal text-left hover:border-tbp-orange/30 hover:shadow-md transition-all group" 
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${getAssigneeColor(p.initials)} group-hover:scale-110 transition-transform`}>
                  {p.initials}
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-tbp-dark leading-none">{p.name.split(' ')[0]}</h4>
                  <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">{p.role}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-center">
                  <p className="text-[10px] font-black text-tbp-dark">{p.active}</p>
                  <p className="text-[8px] text-gray-400 uppercase font-bold">Active</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-amber-600">{p.review}</p>
                  <p className="text-[8px] text-gray-400 uppercase font-bold">Review</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-red-500">{p.overdue}</p>
                  <p className="text-[8px] text-gray-400 uppercase font-bold">Întârziat</p>
                </div>
              </div>
            </button>
          ))}
          <button 
            onClick={() => {
              setViewMode('kanban');
              setGroupingMode('status');
              setOwnerViewFilter('all');
            }}
            className="bg-white p-4 rounded-3xl border border-tbp-orange/20 shadow-sm flex flex-col justify-center section-reveal text-left hover:border-tbp-orange/50 hover:shadow-md transition-all group" 
            style={{ animationDelay: '0.4s' }}
          >
             <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Așteaptă review</p>
                  <p className="text-xl font-black text-tbp-orange">{summaryData.waitingOnMe}</p>
                </div>
                <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                   <Clock className="w-5 h-5 text-tbp-orange" />
                </div>
             </div>
          </button>
          <button 
            onClick={() => {
              setViewMode('list');
              setFilter('overdue');
            }}
            className="bg-white p-4 rounded-3xl border border-red-100 shadow-sm flex flex-col justify-center section-reveal text-left hover:border-red-200 hover:shadow-md transition-all group" 
            style={{ animationDelay: '0.5s' }}
          >
             <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Total Întârzieri</p>
                  <p className="text-xl font-black text-status-red">{summaryData.totalOverdue}</p>
                </div>
                <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                   <Filter className="w-5 h-5 text-status-red" />
                </div>
             </div>
          </button>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-display tracking-wide text-tbp-dark">Task-urile Mele</h1>
          <p className="text-sm text-gray-500 mt-1">
            {user?.role === 'owner' 
              ? (ownerViewFilter === 'me' ? 'Task-urile tale personale de execuție.' : ownerViewFilter === 'team' ? 'Sarcini delegate către colaboratori.' : 'Toate task-urile agenției.') 
              : 'Task-urile asignate ție.'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Owner Role Filtering Tabs */}
          {user?.role === 'owner' && (
            <div className="flex p-1 bg-white rounded-xl shadow-sm border border-gray-100 mr-2">
              <button 
                onClick={() => setOwnerViewFilter('all')} 
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${ownerViewFilter === 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Puls Agenție
              </button>
              <button 
                onClick={() => setOwnerViewFilter('me')} 
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${ownerViewFilter === 'me' ? 'bg-orange-50 text-tbp-orange' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Task-urile Mele
              </button>
              <button 
                onClick={() => setOwnerViewFilter('team')} 
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${ownerViewFilter === 'team' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Delegați / Echipă
              </button>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex p-1 bg-white rounded-xl shadow-sm border border-gray-100">
            <button 
              onClick={() => setViewMode('kanban')} 
              className={`p-2 rounded-lg transition-all flex items-center gap-2 ${viewMode === 'kanban' ? 'bg-tbp-dark text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              title="Kanban Board"
            >
              <KanbanSquare className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-2 rounded-lg transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-tbp-dark text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              title="Listă"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('calendar')} 
              className={`p-2 rounded-lg transition-all flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-tbp-dark text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              title="Calendar"
            >
              <CalendarDays className="w-4 h-4" />
            </button>
          </div>

          {viewMode === 'kanban' && user?.role === 'owner' && (
             <div className="flex p-1 bg-white rounded-xl shadow-sm border border-gray-100">
               <button 
                 onClick={() => setGroupingMode('status')} 
                 className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${groupingMode === 'status' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-tbp-dark'}`}
               >
                 După Status
               </button>
               <button 
                 onClick={() => setGroupingMode('person')} 
                 className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${groupingMode === 'person' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-tbp-dark'}`}
               >
                 După Om
               </button>
               <button 
                 onClick={() => setGroupingMode('client')} 
                 className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${groupingMode === 'client' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-tbp-dark'}`}
               >
                 După Client
               </button>
             </div>
          )}

          {viewMode === 'list' && (
            <div className="flex p-1 bg-white rounded-xl shadow-sm border border-gray-100 hidden sm:flex">
              <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'all' ? 'bg-gray-100 text-tbp-dark' : 'text-gray-500 hover:bg-gray-50'}`}>Toate</button>
              <button onClick={() => setFilter('today')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'today' ? 'bg-gray-100 text-tbp-dark' : 'text-gray-500 hover:bg-gray-50'}`}>Astăzi</button>
              <button onClick={() => setFilter('upcoming')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'upcoming' ? 'bg-gray-100 text-tbp-dark' : 'text-gray-500 hover:bg-gray-50'}`}>Următoarele</button>
              <button onClick={() => setFilter('overdue')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'overdue' ? 'bg-red-50 text-red-600' : 'text-gray-500 hover:bg-gray-50'}`}>Întârziate</button>
              <button onClick={() => setFilter('archived')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'archived' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Arhivă</button>
            </div>
          )}

          {viewMode === 'kanban' && (
            <div className="relative hidden sm:block">
              <select 
                value={kanbanClientFilter}
                onChange={(e) => setKanbanClientFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-100 shadow-sm rounded-xl pl-4 pr-10 py-2 text-sm font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-tbp-orange/20 cursor-pointer"
              >
                <option value="all">Toți Clienții</option>
                {uniqueClients.map(client => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {user?.role === 'owner' && (
            <button 
              onClick={() => setIsTaskModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-tbp-dark text-white rounded-xl text-sm font-bold hover:bg-tbp-orange transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Adaugă Task</span>
            </button>
          )}
        </div>
      </header>

      {viewMode === 'kanban' ? (
        <div className="flex gap-6 overflow-x-auto pb-4 section-reveal min-h-[60vh]">
          {kanbanColumns.map(column => {
            const columnTasks = displayedTasks.filter(t => {
              if (groupingMode === 'status') return t.boardStatus === column.id;
              if (groupingMode === 'person') return t.assignee === column.id;
              if (groupingMode === 'client') return t.client === column.id;
              return false;
            });

            // Extra stats for person view
            let overdueInCol = 0;
            let nextDeadline: Date | null = null;
            if (groupingMode === 'person') {
               overdueInCol = columnTasks.filter(t => t.deadline < new Date() && t.status !== 'completed').length;
               const upcoming = columnTasks.filter(t => t.deadline >= new Date()).sort((a,b) => a.deadline.getTime() - b.deadline.getTime());
               if (upcoming.length > 0) nextDeadline = upcoming[0].deadline;
            }

            return (
              <div 
                key={column.id} 
                className={`flex-shrink-0 w-80 flex flex-col bg-gray-50/50 rounded-3xl border border-gray-100 p-4 transition-all ${groupingMode === 'person' ? 'border-t-4' : ''}`}
                style={groupingMode === 'person' ? { borderTopColor: getAssigneeColor(column.id).split(' ').pop()?.replace('border-', '') === 'orange-200' ? '#f97316' : '#cbd5e1' } : {}}
                onDrop={(e) => handleDrop(e, column.id)}
                onDragOver={handleDragOver}
              >
                <div className="flex items-center justify-between mb-2 px-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[13px] text-tbp-dark uppercase tracking-tight">{column.title}</h3>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${column.color}`}>
                      {columnTasks.length}
                    </span>
                  </div>
                </div>
                
                <div className="px-2 mb-4 flex flex-col gap-1">
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">{column.helper}</p>
                  {groupingMode === 'person' && columnTasks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {overdueInCol > 0 && <span className="text-[9px] font-bold text-red-500 uppercase tracking-tight">{overdueInCol} Întârziate</span>}
                      {nextDeadline && <span className="text-[9px] font-bold text-blue-500 uppercase tracking-tight">Next: {nextDeadline.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}</span>}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {columnTasks.map(task => (
                    <div 
                      key={task.id} 
                      draggable 
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => openDrawer(task)}
                      className="bg-white p-4 pl-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group relative overflow-hidden"
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getClientStyle(task.client).strip}`}></div>
                      
                      <div className="flex flex-col gap-2">
                        {/* 1. Title & Delete */}
                        <div className="flex items-start justify-between gap-2">
                          {editingTaskId === task.id ? (
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => handleTitleEditKeyDown(e, task.id)}
                              onBlur={() => handleTitleEditSave(task.id)}
                              autoFocus
                              className="w-full text-sm font-bold border-b-2 border-tbp-orange focus:outline-none bg-orange-50 px-1 py-0.5 text-tbp-dark"
                            />
                          ) : (
                            <div 
                              className={`block font-bold text-[13px] leading-snug hover:text-tbp-orange transition-colors ${task.boardStatus === 'done' ? 'text-gray-400 line-through' : 'text-tbp-dark'}`}
                            >
                              {task.title.replace('[VIDEO] ', '')}
                            </div>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setTaskToDelete(task.id);
                            }}
                            className="text-gray-300 hover:text-red-500 transition-colors p-1 -m-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* 2. Client & Assignee */}
                        <div className="flex items-center justify-between gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider truncate shrink-0 ${getClientStyle(task.client).bg} ${getClientStyle(task.client).text}`}>
                            {task.client === 'Necunoscut' ? 'Fără Proiect' : task.client}
                          </span>
                          
                          <div className={`px-2 py-0.5 rounded-lg flex items-center gap-1.5 text-[9px] font-bold border truncate ${getAssigneeColor(task.assignee)}`} title={task.assignee}>
                            <User className="w-2.5 h-2.5" />
                            <span className="truncate">{getFullAssigneeName(task.assignee)}</span>
                          </div>
                        </div>

                        {/* 3. Description (if any) */}
                        {renderTaskDescription(task)}

                        {/* 4. Deadline, Priority & Status */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-1">
                          <div className="flex items-center gap-2">
                            <div className={`flex items-center gap-1.5 text-[10px] font-bold ${isSameDay(task.deadline, today) && task.boardStatus !== 'done' ? 'text-status-red' : 'text-gray-400'}`}>
                              <Clock className="w-3.5 h-3.5" />
                              {isSameDay(task.deadline, today) ? 'Azi' : `${task.deadline.getDate()} ${monthNames[task.deadline.getMonth()].substring(0,3)}`}
                            </div>
                            {task.priority && (
                               <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${task.priority === 'Urgent' ? 'bg-red-50 text-red-500 border border-red-100' : task.priority === 'Important' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-500 border border-blue-100'}`}>
                                 {task.priority}
                               </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {task.attachment && (
                              <a 
                                href={task.attachment.startsWith('http') ? task.attachment : '#'} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-gray-300 hover:text-tbp-blue transition-colors p-1"
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {groupingMode !== 'status' ? (
                              <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                task.boardStatus === 'todo' ? 'bg-gray-100 text-gray-500' :
                                task.boardStatus === 'in-progress' ? 'bg-blue-100 text-blue-600' :
                                task.boardStatus === 'review' ? 'bg-amber-100 text-amber-600' :
                                task.boardStatus === 'needs-changes' ? 'bg-pink-100 text-pink-600' :
                                task.boardStatus === 'blocked' ? 'bg-red-100 text-red-600' :
                                'bg-emerald-100 text-emerald-600'
                              }`}>
                                {kanbanColumns.find(c => c.id === task.boardStatus)?.title || task.boardStatus}
                              </div>
                            ) : (
                               task.boardStatus === 'done' && <CheckCircle2 className="w-4 h-4 text-status-green" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-xs font-medium text-gray-400">
                      Niciun task
                    </div>
                  )}
                  {column.id === 'todo' && user?.role === 'owner' && (
                    <button 
                      onClick={() => setIsTaskModalOpen(true)}
                      className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-gray-400 hover:text-tbp-orange hover:border-tbp-orange/30 hover:bg-orange-50/50 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Adaugă Task
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 section-reveal">
          {/* Calendar View */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display text-tbp-dark">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h2>
              <div className="flex gap-2">
                <button onClick={prevMonth} className="p-2 rounded-xl border border-gray-100 hover:bg-gray-50 text-gray-600 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={nextMonth} className="p-2 rounded-xl border border-gray-100 hover:bg-gray-50 text-gray-600 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map((day, index) => (
                <div key={`${index}-${day}`} className="text-center text-xs font-bold text-gray-400 py-2">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {days.map((date, i) => {
                if (!date) return <div key={`empty-${i}`} className="h-24 rounded-2xl bg-gray-50/50 border border-transparent"></div>;
                
                const isSelected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, today);
                const dayTasks = userTasks.filter(t => isSameDay(t.deadline, date));
                
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`h-24 rounded-2xl p-2 flex flex-col items-start transition-all border ${
                      isSelected 
                        ? 'border-tbp-orange bg-orange-50/30 shadow-sm ring-1 ring-tbp-orange' 
                        : isToday
                          ? 'border-gray-200 bg-gray-50'
                          : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mb-1 ${
                      isToday ? 'bg-tbp-dark text-white' : isSelected ? 'text-tbp-orange' : 'text-gray-700'
                    }`}>
                      {date.getDate()}
                    </span>
                    
                    <div className="flex flex-col gap-1 w-full mt-auto">
                      {dayTasks.slice(0, 2).map(task => {
                        const style = getClientStyle(task.client);
                        return (
                          <div key={task.id} className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate w-full text-left ${
                            task.status === 'completed' ? 'bg-gray-100 text-gray-400 line-through' : `${style.bg} ${style.text}`
                          }`}>
                            {task.client}
                          </div>
                        );
                      })}
                      {dayTasks.length > 2 && (
                        <div className="text-[9px] font-bold text-gray-500 pl-1">+{dayTasks.length - 2}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Tasks */}
          <div className="bg-gray-50 rounded-3xl border border-gray-100 p-6 flex flex-col h-full">
            <h3 className="text-lg font-display text-tbp-dark mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-tbp-orange" />
              {isSameDay(selectedDate, today) ? 'Astăzi' : `${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]}`}
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-3">
              {displayedTasks.length > 0 ? (
                displayedTasks.map(task => (
                  <div key={task.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group">
                    <div className="flex items-start gap-3">
                      <button className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        task.status === 'completed' ? 'bg-status-green border-status-green text-white' : 'border-gray-300 hover:border-tbp-orange'
                      }`}>
                        {task.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        {editingTaskId === task.id ? (
                          <div className="mb-2">
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => handleTitleEditKeyDown(e, task.id)}
                              onBlur={() => handleTitleEditSave(task.id)}
                              autoFocus
                              className="w-full text-sm font-bold border-b-2 border-tbp-orange focus:outline-none bg-orange-50 px-1 py-0.5 text-tbp-dark"
                            />
                          </div>
                        ) : (
                          <div 
                            className={`block font-bold text-sm truncate cursor-text hover:text-tbp-orange transition-colors ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-tbp-dark'}`}
                            onClick={(e) => {
                              e.preventDefault();
                              handleTitleEditStart(task.id, task.title);
                            }}
                            title="Click pentru a edita denumirea"
                          >
                            {task.title.replace('[VIDEO] ', '')}
                          </div>
                        )}
                        
                        {renderTaskDescription(task)}
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider truncate max-w-[100px] ${getClientStyle(task.client).bg} ${getClientStyle(task.client).text}`}>
                              {task.client}
                            </span>
                            {task.attachment && (
                              <a 
                                href={task.attachment.startsWith('http') ? task.attachment : '#'} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-tbp-blue transition-colors"
                                title="Vezi atașament"
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                            <Clock className="w-3 h-3" />
                            {task.time}
                            <button onClick={() => setTaskToDelete(task.id)} className="text-gray-300 hover:text-red-500 transition-colors ml-1" title="Șterge task">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState 
                  icon={<CheckCircle2 className="w-8 h-8" />}
                  title="Niciun task pentru această zi"
                  description="Bucură-te de timpul liber sau selectează altă zi din calendar pentru a vedea task-urile programate."
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden section-reveal">
          <div className="divide-y divide-gray-50">
            {displayedTasks.length > 0 ? (
              displayedTasks.map(task => (
                <div 
                  key={task.id} 
                  onClick={() => openDrawer(task)}
                  className="relative p-5 pl-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4 group overflow-hidden cursor-pointer"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getClientStyle(task.client).strip}`}></div>
                  <div className="flex items-start gap-4">
                    <button className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      task.status === 'completed' ? 'bg-status-green border-status-green text-white' : 'border-gray-300 hover:border-tbp-orange'
                    }`}>
                      {task.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                    <div>
                      {editingTaskId === task.id ? (
                        <div className="mb-2">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => handleTitleEditKeyDown(e, task.id)}
                            onBlur={() => handleTitleEditSave(task.id)}
                            autoFocus
                            className="w-full text-sm font-bold border-b-2 border-tbp-orange focus:outline-none bg-orange-50 px-1 py-0.5 text-tbp-dark"
                          />
                        </div>
                      ) : (
                        <div 
                          className={`block font-bold text-sm cursor-text hover:text-tbp-orange transition-colors ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-tbp-dark'}`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleTitleEditStart(task.id, task.title);
                          }}
                          title="Click pentru a edita denumirea"
                        >
                          {task.title.replace('[VIDEO] ', '')}
                        </div>
                      )}
                      
                      {renderTaskDescription(task, "max-w-prose whitespace-pre-line")}
                      
                      <div className="flex flex-wrap items-center gap-4 mt-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${getClientStyle(task.client).bg} ${getClientStyle(task.client).text}`}>
                          {task.client}
                        </span>
                        <div className={`flex items-center gap-1 text-xs font-medium ${isSameDay(task.deadline, today) ? 'text-tbp-orange' : 'text-gray-500'}`}>
                          <Clock className="w-3.5 h-3.5" />
                          {isSameDay(task.deadline, today) ? 'Astăzi' : `${task.deadline.getDate()} ${monthNames[task.deadline.getMonth()]}`} • {task.time}
                        </div>
                        
                        {task.attachment && (
                          <a 
                            href={task.attachment.startsWith('http') ? task.attachment : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            Fișier Atașat
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:ml-auto pl-10 sm:pl-0">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Responsabil</span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm ${getAssigneeColor(task.assignee)}`} title={task.assignee}>
                        {task.assignee}
                      </div>
                      <button onClick={() => setTaskToDelete(task.id)} className="text-gray-400 hover:text-red-500 transition-colors bg-white border border-gray-200 rounded-full p-1.5 mt-2 shadow-sm" title="Șterge task">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState 
                icon={<CalendarIcon className="w-8 h-8" />}
                title="Niciun task găsit"
                description="Nu ai niciun task asignat care să corespundă filtrelor selectate. Ești la zi cu toate proiectele!"
              />
            )}
          </div>
        </div>
      )}

      {/* Pending Status Update Modal (Review/Block) */}
      {pendingStatusTask !== null && (
        <div className="fixed inset-0 bg-tbp-dark/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-display text-xl text-tbp-dark">
                 {pendingStatusTask.newBoardStatus === 'review' ? 'Gata pentru Review?' : 'Motiv Blocaj'}
              </h3>
              <button onClick={() => setPendingStatusTask(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleStatusConfirm}>
              <div className="p-6 space-y-4">
                {pendingStatusTask.newBoardStatus === 'blocked' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Din ce cauză e blocat?</label>
                    <select name="reason" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 appearance-none">
                      <option value="Waiting on Client">Waiting on Client</option>
                      <option value="Waiting on Rozalia">Waiting on Rozalia</option>
                      <option value="Waiting on Assets">Waiting on Assets</option>
                      <option value="Technical Issue">Technical Issue</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notițe (Ce s-a rezolvat / detalii decizie)</label>
                  <textarea 
                    name="notes" 
                    placeholder="Ce ai finalizat? / De ce este blocat task-ul?" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-tbp-orange focus:ring-1 focus:ring-tbp-orange resize-none h-24"
                    required
                  ></textarea>
                </div>
              </div>
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setPendingStatusTask(null)} className="px-6 py-2.5 text-gray-500 font-semibold text-sm hover:text-tbp-dark transition-colors">
                  Revocare
                </button>
                <button type="submit" className={`px-6 py-2.5 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm ${pendingStatusTask.newBoardStatus === 'review' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-500 hover:bg-red-600'}`}>
                  Confirmă
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <TaskDrawer 
        task={drawerTask}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentUser={user}
        onUpdate={fetchTasks}
      />

      {/* Modal Adaugare Task */}
      <TaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        user={user} 
        projects={allProjects}
        onTaskAdded={() => fetchTasks()}
      />

      {/* Modal Ștergere Task */}
      {taskToDelete && (
        <div className="fixed inset-0 bg-tbp-dark/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up p-6 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="font-display text-xl text-tbp-dark mb-2">Ești sigur?</h3>
            <p className="text-sm text-gray-500 mb-6">Această acțiune este ireversibilă. Task-ul va fi șters definitiv.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setTaskToDelete(null)} className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors">
                Anulează
              </button>
              <button onClick={confirmDeleteTask} className="px-6 py-2.5 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-colors shadow-sm">
                Da, Șterge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
