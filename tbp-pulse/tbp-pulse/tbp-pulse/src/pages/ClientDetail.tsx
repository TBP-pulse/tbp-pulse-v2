import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckCircle2, Clock, FileText, MessageSquare, Paperclip, Plus, UploadCloud, X, Trash2, MoreHorizontal, Edit2, Search, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import EmptyState from '../components/EmptyState';
import { supabase } from '../lib/supabase';
import TaskModal from '../components/TaskModal';
import StatusBadge from '../components/StatusBadge';

import { Task, Project, TaskStatus } from '../types';
import TaskDrawer from '../components/TaskDrawer';

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addAlert } = useAlerts();
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);

  // Funcționalitate pentru campanii Ads și rapoarte
  const [googleCampaigns, setGoogleCampaigns] = useState<{id: string, name: string, status: string, color: string, budget?: string, duration?: string, notes?: string}[]>([]);
  const [metaCampaigns, setMetaCampaigns] = useState<{id: string, name: string, status: string, color: string, budget?: string, duration?: string, notes?: string}[]>([]);
  const [campaignLogs, setCampaignLogs] = useState<{id: string, date: string, author: string, text: string}[]>([]);
  
  const [googleForm, setGoogleForm] = useState({ active: false, name: '', budget: '', duration: '', notes: '' });
  const [metaForm, setMetaForm] = useState({ active: false, name: '', budget: '', duration: '', notes: '' });
  const [logForm, setLogForm] = useState({ active: false, text: '' });

  const [editingCampaign, setEditingCampaign] = useState<{id: string, type: 'google' | 'meta'} | null>(null);
  const [editCampForm, setEditCampForm] = useState({ name: '', status: '', color: '', budget: '', duration: '', notes: '' });

  const [isUploadingReport, setIsUploadingReport] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const reportUploadRef = React.useRef<HTMLInputElement>(null);

  // Funcționalitate pentru livrabile video / montaj
  const [videoForm, setVideoForm] = useState({ active: false, title: '', driveLink: '', extraLink: '', instructions: '' });
  const [editingVideo, setEditingVideo] = useState<string | null>(null);
  const [editVideoForm, setEditVideoForm] = useState({ title: '', status: '', driveLink: '', extraLink: '', finishedLink: '', instructions: '', color: '' });

  const [documents, setDocuments] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  useEffect(() => {
    if (project?.id) {
       const savedG = localStorage.getItem(`googleAds_${project.id}`);
       if (savedG) {
         setGoogleCampaigns(JSON.parse(savedG));
       } else {
         setGoogleCampaigns([{id: '1', name: 'Campanie Search - Brand', status: 'Activă • Buget: Setat', color: 'bg-green-500'}, {id: '2', name: 'Campanie PMax - Conversii', status: 'În optimizare', color: 'bg-amber-500'}]);
       }
       
       const savedM = localStorage.getItem(`metaAds_${project.id}`);
       if (savedM) {
         setMetaCampaigns(JSON.parse(savedM));
       } else {
         setMetaCampaigns([{id: '1', name: 'Retargeting Facebook', status: 'Activă • ROAS țintă', color: 'bg-green-500'}]);
       }

       const savedLogs = localStorage.getItem(`campaignLogs_${project.id}`);
       if (savedLogs) setCampaignLogs(JSON.parse(savedLogs));
    }
  }, [project?.id]);

  useEffect(() => {
    if (project?.id) localStorage.setItem(`googleAds_${project.id}`, JSON.stringify(googleCampaigns));
  }, [googleCampaigns, project?.id]);

  useEffect(() => {
    if (project?.id) localStorage.setItem(`metaAds_${project.id}`, JSON.stringify(metaCampaigns));
  }, [metaCampaigns, project?.id]);

  useEffect(() => {
    if (project?.id) localStorage.setItem(`campaignLogs_${project.id}`, JSON.stringify(campaignLogs));
  }, [campaignLogs, project?.id]);

  const submitLogForm = () => {
    if (!logForm.text.trim()) return;
    const newLog = {
      id: Math.random().toString(),
      date: new Date().toISOString(),
      author: user?.initials || 'AR',
      text: logForm.text.trim(),
    };
    setCampaignLogs([newLog, ...campaignLogs]);
    setLogForm({ active: false, text: '' });
  };

  const submitCampaignForm = (type: 'google' | 'meta') => {
    const form = type === 'google' ? googleForm : metaForm;
    if (!form.name.trim()) return;
    
    const newCamp = {
      id: Math.random().toString(),
      name: form.name.trim(),
      status: 'Setată',
      color: 'bg-indigo-500',
      budget: form.budget.trim() || undefined,
      duration: form.duration.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };
    
    if (type === 'google') {
      setGoogleCampaigns([...googleCampaigns, newCamp]);
      setGoogleForm({ active: false, name: '', budget: '', duration: '', notes: '' });
    } else {
      setMetaCampaigns([...metaCampaigns, newCamp]);
      setMetaForm({ active: false, name: '', budget: '', duration: '', notes: '' });
    }
  };

  const removeCampaign = (id: string, type: 'google' | 'meta') => {
    if (type === 'google') setGoogleCampaigns(prev => prev.filter(c => c.id !== id));
    else setMetaCampaigns(prev => prev.filter(c => c.id !== id));
  };

  const startEditingCampaign = (camp: any, type: 'google' | 'meta') => {
    setEditingCampaign({ id: camp.id, type });
    setEditCampForm({
      name: camp.name || '',
      status: camp.status || '',
      color: camp.color || 'bg-indigo-500',
      budget: camp.budget || '',
      duration: camp.duration || '',
      notes: camp.notes || ''
    });
  };

  const saveEditedCampaign = () => {
    if (!editingCampaign) return;
    const { id, type } = editingCampaign;
    
    if (type === 'google') {
      setGoogleCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...editCampForm } : c));
    } else {
      setMetaCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...editCampForm } : c));
    }
    setEditingCampaign(null);
  };

  // Derive videoTasks and regular tasks from all tasks fetched via Supabase
  const videoTasks = tasks
    .filter(t => t.title.startsWith('[VIDEO]'))
    .map(t => {
      let derivedStatus = 'De Montat';
      let derivedColor = 'bg-indigo-500';
      if (t.status === 'in_progress') {
        derivedStatus = 'În lucru / Review';
        derivedColor = 'bg-amber-500';
      } else if (t.status === 'done') {
        derivedStatus = 'Finalizat';
        derivedColor = 'bg-green-500';
      }

      return {
        id: t.id.toString(),
        title: t.title.replace('[VIDEO] ', ''),
        status: derivedStatus,
        color: derivedColor,
        drive_link: t.drive_link || '',
        extra_link: t.extra_link || '',
        finished_link: t.finished_link || '',
        instructions: t.instructions || t.description || ''
      };
    });

  const regularTasks = tasks.filter(t => !t.title.startsWith('[VIDEO]'));

  const submitVideoForm = async () => {
    if (!videoForm.title.trim()) return;
    
    try {
      const { data: insertedTask, error } = await supabase.from('tasks').insert([{
        title: `[VIDEO] ${videoForm.title.trim()}`,
        project_id: project?.id,
        deadline: new Date().toISOString(),
        status: 'pending',
        assignee: 'GB',
        drive_link: videoForm.driveLink.trim(),
        extra_link: videoForm.extraLink.trim(),
        instructions: videoForm.instructions.trim(),
        task_type: 'Video'
      }]).select().single();
      if (error) throw error;
      
      if (user?.role === 'owner') {
         await addAlert({
           title: 'Material Video Nou 🎬',
           description: `Gabi a primit materiale noi pentru montaj: "${videoForm.title.trim()}".`,
           client: project?.client || 'General',
           assignee: 'Gabi Buliga',
           assigneeInitials: 'GB',
           assigneeColor: 'bg-blue-100 text-blue-700',
           errorCode: `TASK:${insertedTask?.id}`,
           severity: 'info'
         });
      }
      
      setVideoForm({ active: false, title: '', driveLink: '', extraLink: '', instructions: '' });
      fetchProjectData(false); // Refresh
    } catch(err) {
      console.error('Failed to add video task', err);
    }
  };

  const removeVideoTask = async (id: string) => {
    try {
      await supabase.from('tasks').delete().eq('id', id);
      fetchProjectData(false);
    } catch(err) {
      console.error('Failed to delete video task', err);
    }
  };

  const startEditingVideo = (task: any) => {
    setEditingVideo(task.id);
    setEditVideoForm({
      title: task.title || '',
      status: task.status || '',
      color: task.color || 'bg-indigo-500',
      driveLink: task.drive_link || '',
      extraLink: task.extra_link || '',
      finishedLink: task.finished_link || '',
      instructions: task.instructions || ''
    });
  };

  const saveEditedVideo = async () => {
    if (!editingVideo) return;
    
    let mappedStatus: TaskStatus = 'todo';
    if (editVideoForm.color === 'bg-amber-500') mappedStatus = 'review';
    else if (editVideoForm.color === 'bg-green-500') mappedStatus = 'done';
    else if (editVideoForm.color === 'bg-indigo-500') mappedStatus = 'todo';

    try {
      const { error } = await supabase.from('tasks').update({
         title: `[VIDEO] ${editVideoForm.title}`,
         drive_link: editVideoForm.driveLink,
         extra_link: editVideoForm.extraLink,
         finished_link: editVideoForm.finishedLink,
         instructions: editVideoForm.instructions,
         status: mappedStatus,
         updated_at: new Date().toISOString()
      }).eq('id', Number(editingVideo));

      if (error) throw error;
      
      // Dispatch alert to Owner if a collaborator moved it to review
      const isReviewEvent = mappedStatus === 'review';
      if (isReviewEvent && user?.role !== 'owner') {
         const oldTask = tasks.find(t => t.id === Number(editingVideo));
         if (oldTask && oldTask.status !== 'review') {
           await addAlert({
             title: 'Revizuire Video Necesară 👀',
             description: `Gabi a finalizat montajul pentru "${editVideoForm.title || 'Fără titlu'}" și așteaptă feedback-ul tău.`,
             client: project?.client || 'General',
             assignee: 'Rozalia Marinescu',
             assigneeInitials: 'RM',
             assigneeColor: 'bg-amber-100 text-amber-700',
             errorCode: `TASK:${editingVideo}`,
             severity: 'info'
           });
         }
      }

      setEditingVideo(null);
      fetchProjectData(false);
    } catch(err) {
      console.error('Failed to update video task', err);
    }
  };

  const handleReportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project?.client) return;

    setIsUploadingReport(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${project.client}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from('attachments').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('attachments').getPublicUrl(filePath);
      
      await supabase.from('documents').insert([{
        client: project.client,
        name: `[Raport Lunar] ${file.name}`,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        url: data.publicUrl,
        uploader: user?.initials || 'U',
        created_at: new Date().toISOString()
      }]);
      
      await supabase.from('messages').insert([{
        client: project.client,
        content: `📈 Am generat și salvat noul Raport Lunar de Performanță. Poate fi vizualizat în secțiunea Documente.`,
        sender: user?.initials || 'U',
        sender_full: user?.full_name || 'Utilizator',
        created_at: new Date().toISOString()
      }]);

      if (user?.role !== 'owner') {
         await addAlert({
           title: 'Material Încărcat',
           description: `${user?.full_name || 'Utilizator'} a încărcat raportul "${file.name}".`,
           client: project.client || 'General',
           assignee: 'Rozalia', // Numele ownerului
           assigneeInitials: 'RM',
           assigneeColor: 'bg-indigo-100 text-indigo-700',
           errorCode: `DOC-UP-${new Date().getTime().toString().slice(-6)}`,
           severity: 'info'
         });
      } else {
         await addAlert({
           title: 'Material Adăugat',
           description: `Ai adăugat raportul "${file.name}" în cloud.`,
           client: project.client || 'General',
           assignee: 'Echipa',
           assigneeInitials: 'All',
           assigneeColor: 'bg-emerald-100 text-emerald-700',
           errorCode: `DOC-UP-${new Date().getTime().toString().slice(-6)}`,
           severity: 'info'
         });
      }

      fetchDocuments();
      fetchMessages();
    } catch (error: any) {
      console.error("Report upload failed", error);
    } finally {
      setIsUploadingReport(false);
      if (reportUploadRef.current) reportUploadRef.current.value = '';
    }
  };

  useEffect(() => {
    if (id) {
      fetchProjectData();
    }
  }, [id]);

  useEffect(() => {
    if (project?.client) {
      fetchDocuments();
      fetchMessages();
    }
  }, [project?.client]);

  useEffect(() => {
    if (id && project?.client) {
      const subscriptionTasks = supabase
        .channel(`client_detail_tasks_${id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
          fetchProjectData(false);
        })
        .subscribe();

      const subscriptionDocs = supabase
        .channel(`client_detail_docs_${id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => {
          fetchDocuments(false);
        })
        .subscribe();
        
      const subscriptionMessages = supabase
        .channel(`client_detail_msgs_${id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
          fetchMessages(false);
        })
        .subscribe();

      return () => {
        subscriptionTasks.unsubscribe();
        subscriptionDocs.unsubscribe();
        subscriptionMessages.unsubscribe();
      };
    }
  }, [id, project?.client]);

  const fetchDocuments = async (showLoading = false) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('client', project.client)
        .order('created_at', { ascending: false });

      if (error && error.code !== '42P01') throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchMessages = async (showLoading = false) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('client', project.client)
        .order('created_at', { ascending: true });

      if (error && error.code !== '42P01') throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project?.client) return;

    setIsUploadingDoc(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const safeClientName = project.client.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filePath = `${safeClientName}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('attachments').getPublicUrl(filePath);
      
      const { error: dbError } = await supabase.from('documents').insert([{
        client: project.client,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        url: data.publicUrl,
        uploader: user?.initials || 'U',
        created_at: new Date().toISOString()
      }]);

      if (dbError) throw dbError;
      
      // Dispatch alert to Owner if a collaborator uploads a file
      if (user?.role !== 'owner') {
         await addAlert({
           title: 'Document Nou Încărcat',
           description: `${user?.full_name || 'Un colaborator'} a încărcat fișierul "${file.name}".`,
           client: project.client,
           assignee: user?.full_name || user?.initials || 'Utilizator',
           assigneeInitials: user?.initials || 'U',
           assigneeColor: 'bg-blue-100 text-blue-700',
           errorCode: `DOC-${new Date().getTime().toString().slice(-6)}`,
           severity: 'info'
         });
      }

      fetchDocuments();
    } catch (error: any) {
      console.error("Upload failed", error);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const content = (form.elements.namedItem('messageContent') as HTMLTextAreaElement).value;

    if (!content.trim() || !project?.client) return;

    try {
      const { error } = await supabase.from('messages').insert([{
        client: project.client,
        content: content.trim(),
        sender: user?.initials || 'U',
        sender_full: user?.full_name || 'Utilizator',
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;
      
      // Dispatch alert to everyone when a message is added
      await addAlert({
        title: 'Mesaj Nou în Client',
        description: `${user?.full_name || 'Un coleg'} a lăsat un mesaj: "${content.trim().substring(0, 50)}..."`,
        client: project.client,
        assignee: 'Echipa',
        assigneeInitials: 'All', // 'All' makes it visible to everyone linked to the project in the UI
        assigneeColor: 'bg-green-100 text-green-700',
        errorCode: `MSG-${new Date().getTime().toString().slice(-6)}`,
        severity: 'info'
      });
      
      form.reset();
      fetchMessages();
    } catch (error: any) {
      console.error('Error sending message:', error);
    }
  };

  const updateProjectStatus = async (status: 'green' | 'yellow' | 'red') => {
    if (!project) return;
    try {
      setProject({ ...project, status });
      await supabase.from('projects').update({ status }).eq('id', project.id);
      addAlert({ title: 'Status Actualizat', description: `Starea clientului ${project.client} este acum ${status.toUpperCase()}.`, client: project.client, assignee: 'System', assigneeInitials: 'RM', assigneeColor: 'bg-emerald-100 text-emerald-700', errorCode: 'STATUS-UPD', severity: 'info' });
    } catch (err) {
      console.error('Error updating project status:', err);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDrawerOpen(true);
  };

  const fetchProjectData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (projectError) throw projectError;
      // Access check
      if (user?.initials === 'AR' && typeof projectData.client === 'string') {
        const cName = projectData.client.toLowerCase();
        if (cName.includes('atlantis')) {
          addAlert({ title: 'Eroare', description: 'Nu ai acces la acest proiect.', severity: 'critical', errorCode: 'AUTH-403', client: 'Sistem', assignee: 'Sistem', assigneeInitials: 'SYS', assigneeColor: 'bg-red-100 text-red-600' });
          return; // Block rendering/setting project
        }
      }

      setProject(projectData);

      // Fetch tasks for this project
      if (projectData) {
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('project_id', projectData.id)
          .order('deadline', { ascending: true });

        if (tasksError && tasksError.code !== '42P01') throw tasksError; 
        setTasks(tasksData || []);

        // We fetch messages & documents using the separate useEffect, but we can also trigger them here:
        // By setting the project state, the other useEffects should run. Wait, I should just map the tables correctly.
        // I will replace `tbp_messages` and `tbp_documents` to `messages` and `documents` but use `client`
        const { data: messagesData } = await supabase
          .from('messages')
          .select('*')
          .eq('client', projectData.client)
          .order('created_at', { ascending: true });
        setMessages(messagesData || []);

        const { data: docsData } = await supabase
          .from('documents')
          .select('*')
          .eq('client', projectData.client)
          .order('created_at', { ascending: false });
        setDocuments(docsData || []);
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const title = (form.elements.namedItem('title') as HTMLInputElement).value;
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
        const filePath = `${project?.client}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, attachmentFile);
          
        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          // Fallback just to keep name if storage fails initially
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
      const { error } = await supabase.from('tasks').insert([{
        title,
        project_id: project?.id, // Use the project's numerical ID to match int8 schema
        deadline: deadlineStr ? (isNaN(new Date(deadlineStr).getTime()) ? new Date().toISOString() : new Date(deadlineStr).toISOString()) : new Date().toISOString(),
        status: 'pending', // Trying pending to bypass tasks_status_check
        assignee: assigneeInitials,
        instructions: description || null,
        attachment: attachmentUrl,
        updated_at: new Date().toISOString()
      }]);

      if (error) throw error;
      
      // Dispatch alert if assigned to someone else
      if (assigneeInitials !== user?.initials) {
         await addAlert({
           title: 'Task Nou Alocat',
           description: `${user?.full_name || 'Owner-ul'} ți-a delegat task-ul "${title}".`,
           client: project?.client || 'General',
           assignee: assignee, // We send it to the assignee
           assigneeInitials: assigneeInitials,
           assigneeColor: 'bg-blue-100 text-blue-700',
           errorCode: `TASK-${new Date().getTime().toString().slice(-6)}`,
           severity: 'info'
         });
      }

      setIsTaskModalOpen(false);
      fetchProjectData();
    } catch (error: any) {
      console.error('Error adding task:', error);
    }
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskToDelete);
      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== taskToDelete));
    } catch (err) {
      console.error('Eroare la ștergerea task-ului:', err);
    } finally {
      setTaskToDelete(null);
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
    const currentTask = tasks.find(t => t.id === taskId);
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
      
      // Update local state directly
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, title: editingTitle } : t));
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

  const filteredTasks = tasks.filter(t => {
    const isAssignedToUser = user?.role === 'owner' || t.assignee === user?.initials;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : t.status === statusFilter;
    const isVideo = t.title.startsWith('[VIDEO]');
    return matchesSearch && matchesStatus && !isVideo && t.project_id === Number(id) && isAssignedToUser;
  });

  const filteredDocuments = documents.filter(doc => {
    if (user?.role === 'owner') return true;
    
    // Check if the document belongs to a specific task
    const match = doc.name.match(/\[TASK-(\d+)\]/);
    if (match) {
      const taskId = Number(match[1]);
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        // Only show if the task is assigned to the current user
        return task.assignee === user?.initials;
      }
    }
    
    // If it's a general document and the user is non-owner, we hide it to keep the space clean
    // based on "vreau să ștergem ... documente care nu sunt relevante"
    return false;
  });

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Se încarcă datele clientului...</div>;
  }

  if (!project) {
    return <div className="p-8 text-center text-red-500">Clientul nu a fost găsit.</div>;
  }

  // --- MODULE CONFIGURATION ---
  const getClientConfig = (clientName: string) => {
    const normalizedName = clientName.toUpperCase();
    
    const SM_ONLY = ['INFINITY FOREST', 'WEST EXCLUSIVE', 'CABANA SOVEJA', 'ASJR', 'CNPG', 'TUCANO COFFEE MADAGASCAR', 'TUCANO', 'BOON'];
    const ADS_ONLY = ['ATLANTIS DIGITAL LAB', 'AVL'];
    const HYBRID = ['INES', 'CLINICA32'];
    
    if (SM_ONLY.includes(normalizedName)) {
      return { socialMediaEnabled: true, marketingEnabled: false, videoEnabled: true }; // Video defaults to optional/true 
    }
    if (ADS_ONLY.includes(normalizedName)) {
      return { socialMediaEnabled: false, marketingEnabled: true, videoEnabled: true };
    }
    if (HYBRID.includes(normalizedName)) {
      return { socialMediaEnabled: true, marketingEnabled: true, videoEnabled: true }; // SM is optional, SM role handles it
    }
    
    // Default fallback
    return {
      socialMediaEnabled: true,
      marketingEnabled: false,
      videoEnabled: true
    };
  };

  const clientConfig = getClientConfig(project.client);
  
  // Roles assigned by initials or role string:
  // RM / owner = Rozalia (sees all)
  // AS = Andreea (social media)
  // AR = Aurora (marketing)
  // GB = Gabi (video)
  const isOwner = user?.role === 'owner' || user?.initials === 'RM';
  const isSocialMediaRole = isOwner || user?.initials === 'AS';
  const isMarketingRole = isOwner || user?.initials === 'AR';
  const isVideoRole = isOwner || user?.initials === 'GB';

  // Final rendering conditions per module
  const showMarketingModule = clientConfig.marketingEnabled && isMarketingRole;
  
  // For Video: visible to video role & owner. Marketing role also needs to see videos to download the final assets for Ads!
  const hasVideoTasks = videoTasks.length > 0;
  const showVideoModule = clientConfig.videoEnabled && (isVideoRole || isOwner);

  // Global "Strategy/Reports" (Documents), "Messages" and "Tasks" are visible if user has ANY valid role for this client
  const hasAccessToClient = showMarketingModule || isSocialMediaRole || showVideoModule || isOwner;
  const showTasksModule = hasAccessToClient;
  const showStrategyModule = hasAccessToClient;
  const showMessagesModule = hasAccessToClient;
  // --- END MODULE CONFIGURATION ---

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-tbp-dark">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-display tracking-wide text-tbp-dark">{project.client}</h1>
              {user?.role === 'owner' ? (
                <div className="flex items-center gap-2">
                  <select 
                    value={project.status || 'green'}
                    onChange={(e) => updateProjectStatus(e.target.value as any)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border-0 cursor-pointer focus:ring-2 focus:ring-offset-2 transition-all shadow-sm ${
                      project.status === 'red' ? 'bg-red-100 text-red-700 focus:ring-red-500' :
                      project.status === 'yellow' ? 'bg-amber-100 text-amber-700 focus:ring-amber-500' :
                      'bg-emerald-100 text-emerald-700 focus:ring-emerald-500'
                    }`}
                  >
                    <option value="green">Sănătos (Green)</option>
                    <option value="yellow">Atenție (Yellow)</option>
                    <option value="red">Critic (Red)</option>
                  </select>
                </div>
              ) : (
                <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                  project.status === 'red' ? 'bg-red-100 text-red-600' :
                  project.status === 'yellow' ? 'bg-amber-100 text-amber-600' :
                  'bg-emerald-100 text-emerald-600'
                }`}>
                  {project.status === 'red' ? 'Critic' : project.status === 'yellow' ? 'Atenție' : 'Activ'}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">Spațiul de lucru al clientului. Task-uri, fișiere și comunicare.</p>
          </div>
        </div>
        
        {user?.role === 'owner' && (
          <button 
            onClick={() => setIsTaskModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-tbp-dark text-white rounded-xl text-sm font-bold hover:bg-tbp-orange transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Adaugă Task Nou
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Tasks */}
        <div className="xl:col-span-2 space-y-6 section-reveal">
          
          {/* Monitorizare Campanii Ads - For Aurora and Owner */}
          {showMarketingModule && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-indigo-100 relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-100 pb-4 gap-4">
                <div>
                  <h2 className="text-lg font-display text-tbp-dark flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                    </div>
                    Ads & Performance Workspace
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">Gestionează campaniile în lucru și urmărește KPIs.</p>
                </div>
                {user?.initials === 'AR' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsTaskModalOpen(true)}
                      className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Cere Creative
                    </button>
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={reportUploadRef} 
                      onChange={handleReportUpload}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                    />
                    <button 
                      onClick={() => reportUploadRef.current?.click()}
                      disabled={isUploadingReport}
                      className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white ${isUploadingReport ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} px-4 py-2 rounded-xl transition-colors shadow-sm`}
                    >
                      {isUploadingReport ? (
                         <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                         <UploadCloud className="w-4 h-4" />
                      )}
                      {isUploadingReport ? 'Se trimite...' : 'Trimite Raport'}
                    </button>
                  </div>
                )}
              </div>

              <div className={`grid grid-cols-1 ${project?.client === 'INES' ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-6`}>
                
                {/* Google Ads */}
                <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100">
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                       <img src="https://www.gstatic.com/images/branding/product/1x/ads_24dp.png" alt="Google Ads" className="w-5 h-5 opacity-80 grayscale" />
                       Google Ads
                     </h3>
                     <button className="text-gray-400 hover:text-indigo-600 transition-colors"><Plus className="w-4 h-4"/></button>
                   </div>
                    <div className="space-y-2">
                      {googleCampaigns.map(camp => (
                        editingCampaign?.id === camp.id && editingCampaign?.type === 'google' ? (
                          <div key={camp.id} className="p-3 bg-gray-50 border border-indigo-200 rounded-xl shadow-sm text-xs animate-in fade-in zoom-in-95">
                            <input 
                              autoFocus
                              value={editCampForm.name}
                              onChange={(e) => setEditCampForm({...editCampForm, name: e.target.value})}
                              placeholder="Nume campanie"
                              className="w-full font-bold bg-white border border-gray-200 rounded-lg p-2 mb-2 focus:outline-none focus:border-indigo-400 text-gray-700"
                            />
                            <input 
                              value={editCampForm.status}
                              onChange={(e) => setEditCampForm({...editCampForm, status: e.target.value})}
                              placeholder="Status / Etichetă (ex: Activă, În optimizare)"
                              className="w-full bg-white border border-gray-200 rounded-lg p-2 mb-2 focus:outline-none focus:border-indigo-400 text-gray-700"
                            />
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <input 
                                value={editCampForm.budget}
                                onChange={(e) => setEditCampForm({...editCampForm, budget: e.target.value})}
                                placeholder="Buget (ex: 1000 RON)"
                                className="bg-white border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-400 text-gray-700"
                              />
                              <input 
                                value={editCampForm.duration}
                                onChange={(e) => setEditCampForm({...editCampForm, duration: e.target.value})}
                                placeholder="Deadline / Perioadă"
                                className="bg-white border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-400 text-gray-700"
                              />
                            </div>
                            <textarea
                              value={editCampForm.notes || ''}
                              onChange={(e) => setEditCampForm({...editCampForm, notes: e.target.value})}
                              placeholder="Notițe, idei, KPIs sau observații..."
                              rows={2}
                              className="w-full bg-white border border-gray-200 rounded-lg p-2 mb-2 focus:outline-none focus:border-indigo-400 text-gray-700 resize-none"
                            />
                            <div className="flex justify-between items-center mt-1">
                              <div className="flex gap-2">
                                <button onClick={() => setEditCampForm({...editCampForm, color: 'bg-green-500'})} className={`w-4 h-4 rounded-full bg-green-500 hover:scale-110 transition-transform ${editCampForm.color === 'bg-green-500' ? 'ring-2 ring-offset-2 ring-green-500' : ''}`} title="Activă / Funcțională"></button>
                                <button onClick={() => setEditCampForm({...editCampForm, color: 'bg-amber-500'})} className={`w-4 h-4 rounded-full bg-amber-500 hover:scale-110 transition-transform ${editCampForm.color === 'bg-amber-500' ? 'ring-2 ring-offset-2 ring-amber-500' : ''}`} title="În optimizare / Pauză"></button>
                                <button onClick={() => setEditCampForm({...editCampForm, color: 'bg-indigo-500'})} className={`w-4 h-4 rounded-full bg-indigo-500 hover:scale-110 transition-transform ${editCampForm.color === 'bg-indigo-500' ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`} title="Nouă / Setată"></button>
                                <button onClick={() => setEditCampForm({...editCampForm, color: 'bg-red-500'})} className={`w-4 h-4 rounded-full bg-red-500 hover:scale-110 transition-transform ${editCampForm.color === 'bg-red-500' ? 'ring-2 ring-offset-2 ring-red-500' : ''}`} title="Oprită / Problemă"></button>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => setEditingCampaign(null)} className="text-gray-500 hover:text-gray-700 font-medium">Anulează</button>
                                <button onClick={saveEditedCampaign} className="bg-indigo-600 text-white px-3 py-1 rounded shadow-sm hover:bg-indigo-700 font-bold">Salvează</button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div key={camp.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm group relative">
                            <div className={`w-2 h-2 rounded-full ${camp.color} flex-shrink-0`}></div>
                            <div className="flex-1 min-w-0 pr-10">
                              <h4 className="text-xs font-bold text-gray-700 truncate">{camp.name}</h4>
                              <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                                {camp.status}
                                {camp.duration && <span className="ml-1 text-indigo-500 font-medium whitespace-nowrap">• {camp.duration}</span>}
                                {camp.budget && <span className="ml-1 text-green-600 font-medium whitespace-nowrap">• {camp.budget}</span>}
                              </p>
                              {camp.notes && (
                                <p className="text-xs mt-2 text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100 italic line-clamp-2" title={camp.notes}>
                                  {camp.notes}
                                </p>
                              )}
                            </div>
                            {(user?.initials === 'AR' || user?.role === 'owner') && (
                              <div className="absolute right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-white via-white to-transparent pl-4">
                                <button onClick={() => startEditingCampaign(camp, 'google')} className="text-gray-400 hover:text-indigo-600 transition-colors bg-white/80 p-1 rounded" title="Actualizează Status / Comentarii">
                                  <Edit2 className="w-3.5 h-3.5"/>
                                </button>
                                <button onClick={() => removeCampaign(camp.id, 'google')} className="text-gray-400 hover:text-red-500 transition-colors bg-white/80 p-1 rounded" title="Șterge">
                                  <Trash2 className="w-3.5 h-3.5"/>
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      ))}
                    </div>
                    {(user?.initials === 'AR' || user?.role === 'owner') && (
                     <div className="mt-4">
                       {googleForm.active ? (
                         <div className="bg-white border border-indigo-200 rounded-xl p-3 shadow-sm text-xs animate-in slide-in-from-top-2">
                           <input 
                             autoFocus
                             className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 mb-2 focus:outline-none focus:border-indigo-400 text-gray-700 placeholder:text-gray-400 font-medium"
                             placeholder="Nume campanie (ex: Search - Oferte Mai)"
                             value={googleForm.name}
                             onChange={e => setGoogleForm({...googleForm, name: e.target.value})}
                           />
                           <div className="grid grid-cols-2 gap-2 mb-2">
                             <input 
                               className="bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-400 text-gray-700 placeholder:text-gray-400"
                               placeholder="Buget (ex: 500€)"
                               value={googleForm.budget}
                               onChange={e => setGoogleForm({...googleForm, budget: e.target.value})}
                             />
                             <input 
                               className="bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-400 text-gray-700 placeholder:text-gray-400"
                               placeholder="Deadline (ex: 15 Mai)"
                               value={googleForm.duration}
                               onChange={e => setGoogleForm({...googleForm, duration: e.target.value})}
                             />
                           </div>
                           <textarea
                             className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 mb-3 focus:outline-none focus:border-indigo-400 text-gray-700 placeholder:text-gray-400 resize-none"
                             placeholder="Notițe, idei, KPIs sau observații..."
                             rows={2}
                             value={googleForm.notes}
                             onChange={e => setGoogleForm({...googleForm, notes: e.target.value})}
                           />
                           <div className="flex justify-end items-center gap-2">
                             <button 
                               onClick={() => setGoogleForm({active: false, name: '', budget: '', duration: '', notes: ''})}
                               className="px-3 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg font-bold transition-colors"
                             >Anulează</button>
                             <button 
                               onClick={() => submitCampaignForm('google')}
                               disabled={!googleForm.name.trim()}
                               className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                             >Adaugă</button>
                           </div>
                         </div>
                       ) : (
                         <button 
                           onClick={() => setGoogleForm({...googleForm, active: true})}
                           className="w-full text-left text-xs bg-transparent border border-dashed border-gray-300 rounded-lg p-2.5 hover:border-indigo-400 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50 font-medium transition-all"
                         >
                           + Detaliază campanie nouă...
                         </button>
                       )}
                     </div>
                   )}
                </div>

                {/* Meta Ads (Hidden for INES) */}
                {project?.client !== 'INES' && (
                  <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100">
                     <div className="flex items-center justify-between mb-4">
                       <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                         <svg viewBox="0 0 36 36" className="w-5 h-5 text-blue-600 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M20.1479 17.9947L22.0238 5.7876H10.1585L8.28259 17.9947H20.1479Z" fill="#1877F2"/><path d="M22.0238 5.7876L23.8647 17.9947H35.7301L33.8542 5.7876H22.0238Z" fill="#38A1F3"/><path d="M10.1585 5.7876H22.0238L20.1479 17.9947H8.28259L10.1585 5.7876Z" fill="#1877F2"/><path d="M10.1585 30.2018H22.0238L23.8647 17.9947H12.0343L10.1585 30.2018Z" fill="#1877F2"/><path d="M22.0238 30.2018L23.8647 17.9947L35.7301 17.9947L33.8542 30.2018H22.0238Z" fill="#3B5998"/><path d="M12.0343 17.9947L10.1585 30.2018L-1.7068 30.2018L0.1691 17.9947H12.0343Z" fill="#3B5998"/></svg>
                         Meta Ads
                       </h3>
                       <button className="text-gray-400 hover:text-indigo-600 transition-colors"><Plus className="w-4 h-4"/></button>
                     </div>
                     <div className="space-y-2">
                       {metaCampaigns.map(camp => (
                         editingCampaign?.id === camp.id && editingCampaign?.type === 'meta' ? (
                           <div key={camp.id} className="p-3 bg-gray-50 border border-indigo-200 rounded-xl shadow-sm text-xs animate-in fade-in zoom-in-95">
                             <input 
                               autoFocus
                               value={editCampForm.name}
                               onChange={(e) => setEditCampForm({...editCampForm, name: e.target.value})}
                               placeholder="Nume campanie"
                               className="w-full font-bold bg-white border border-gray-200 rounded-lg p-2 mb-2 focus:outline-none focus:border-indigo-400 text-gray-700"
                             />
                             <input 
                               value={editCampForm.status}
                               onChange={(e) => setEditCampForm({...editCampForm, status: e.target.value})}
                               placeholder="Status / Etichetă (ex: Activă, În optimizare)"
                               className="w-full bg-white border border-gray-200 rounded-lg p-2 mb-2 focus:outline-none focus:border-indigo-400 text-gray-700"
                             />
                             <div className="grid grid-cols-2 gap-2 mb-2">
                               <input 
                                 value={editCampForm.budget}
                                 onChange={(e) => setEditCampForm({...editCampForm, budget: e.target.value})}
                                 placeholder="Buget (ex: 1000 RON)"
                                 className="bg-white border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-400 text-gray-700"
                               />
                               <input 
                                 value={editCampForm.duration}
                                 onChange={(e) => setEditCampForm({...editCampForm, duration: e.target.value})}
                                 placeholder="Deadline / Perioadă"
                                 className="bg-white border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-400 text-gray-700"
                               />
                             </div>
                             <textarea
                               value={editCampForm.notes || ''}
                               onChange={(e) => setEditCampForm({...editCampForm, notes: e.target.value})}
                               placeholder="Notițe, idei, KPIs sau observații..."
                               rows={2}
                               className="w-full bg-white border border-gray-200 rounded-lg p-2 mb-2 focus:outline-none focus:border-indigo-400 text-gray-700 resize-none"
                             />
                             <div className="flex justify-between items-center mt-1">
                               <div className="flex gap-2">
                                 <button onClick={() => setEditCampForm({...editCampForm, color: 'bg-green-500'})} className={`w-4 h-4 rounded-full bg-green-500 hover:scale-110 transition-transform ${editCampForm.color === 'bg-green-500' ? 'ring-2 ring-offset-2 ring-green-500' : ''}`} title="Activă / Funcțională"></button>
                                 <button onClick={() => setEditCampForm({...editCampForm, color: 'bg-amber-500'})} className={`w-4 h-4 rounded-full bg-amber-500 hover:scale-110 transition-transform ${editCampForm.color === 'bg-amber-500' ? 'ring-2 ring-offset-2 ring-amber-500' : ''}`} title="În optimizare / Pauză"></button>
                                 <button onClick={() => setEditCampForm({...editCampForm, color: 'bg-indigo-500'})} className={`w-4 h-4 rounded-full bg-indigo-500 hover:scale-110 transition-transform ${editCampForm.color === 'bg-indigo-500' ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`} title="Nouă / Setată"></button>
                                 <button onClick={() => setEditCampForm({...editCampForm, color: 'bg-red-500'})} className={`w-4 h-4 rounded-full bg-red-500 hover:scale-110 transition-transform ${editCampForm.color === 'bg-red-500' ? 'ring-2 ring-offset-2 ring-red-500' : ''}`} title="Oprită / Problemă"></button>
                               </div>
                               <div className="flex items-center gap-2">
                                 <button onClick={() => setEditingCampaign(null)} className="text-gray-500 hover:text-gray-700 font-medium">Anulează</button>
                                 <button onClick={saveEditedCampaign} className="bg-indigo-600 text-white px-3 py-1 rounded shadow-sm hover:bg-indigo-700 font-bold">Salvează</button>
                               </div>
                             </div>
                           </div>
                         ) : (
                           <div key={camp.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm group relative">
                             <div className={`w-2 h-2 rounded-full ${camp.color} flex-shrink-0`}></div>
                             <div className="flex-1 min-w-0 pr-10">
                               <h4 className="text-xs font-bold text-gray-700 truncate">{camp.name}</h4>
                               <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                                 {camp.status}
                                 {camp.duration && <span className="ml-1 text-indigo-500 font-medium whitespace-nowrap">• {camp.duration}</span>}
                                 {camp.budget && <span className="ml-1 text-green-600 font-medium whitespace-nowrap">• {camp.budget}</span>}
                               </p>
                               {camp.notes && (
                                 <p className="text-xs mt-2 text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100 italic line-clamp-2" title={camp.notes}>
                                   {camp.notes}
                                 </p>
                               )}
                             </div>
                             {(user?.initials === 'AR' || user?.role === 'owner') && (
                               <div className="absolute right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-white via-white to-transparent pl-4">
                                 <button onClick={() => startEditingCampaign(camp, 'meta')} className="text-gray-400 hover:text-indigo-600 transition-colors bg-white/80 p-1 rounded" title="Actualizează Status / Comentarii">
                                   <Edit2 className="w-3.5 h-3.5"/>
                                 </button>
                                 <button onClick={() => removeCampaign(camp.id, 'meta')} className="text-gray-400 hover:text-red-500 transition-colors bg-white/80 p-1 rounded" title="Șterge">
                                   <Trash2 className="w-3.5 h-3.5"/>
                                 </button>
                               </div>
                             )}
                           </div>
                         )
                       ))}
                     </div>
                     {(user?.initials === 'AR' || user?.role === 'owner') && (
                       <div className="mt-4">
                         {metaForm.active ? (
                           <div className="bg-white border border-indigo-200 rounded-xl p-3 shadow-sm text-xs animate-in slide-in-from-top-2">
                             <input 
                               autoFocus
                               className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 mb-2 focus:outline-none focus:border-indigo-400 text-gray-700 placeholder:text-gray-400 font-medium"
                               placeholder="Nume campanie (ex: Conversii - Oferte Mai)"
                               value={metaForm.name}
                               onChange={e => setMetaForm({...metaForm, name: e.target.value})}
                             />
                             <div className="grid grid-cols-2 gap-2 mb-3">
                               <input 
                                 className="bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-400 text-gray-700 placeholder:text-gray-400"
                                 placeholder="Buget (ex: 1000 RON)"
                                 value={metaForm.budget}
                                 onChange={e => setMetaForm({...metaForm, budget: e.target.value})}
                               />
                               <input 
                                 className="bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-400 text-gray-700 placeholder:text-gray-400"
                                 placeholder="Deadline (ex: 30 Mai)"
                                 value={metaForm.duration}
                                 onChange={e => setMetaForm({...metaForm, duration: e.target.value})}
                               />
                             </div>
                             <textarea
                               className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 mb-3 focus:outline-none focus:border-indigo-400 text-gray-700 placeholder:text-gray-400 resize-none"
                               placeholder="Notițe, idei, KPIs sau observații..."
                               rows={2}
                               value={metaForm.notes}
                               onChange={e => setMetaForm({...metaForm, notes: e.target.value})}
                             />
                             <div className="flex justify-end items-center gap-2">
                               <button 
                                 onClick={() => setMetaForm({active: false, name: '', budget: '', duration: '', notes: ''})}
                                 className="px-3 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg font-bold transition-colors"
                               >Anulează</button>
                               <button 
                                 onClick={() => submitCampaignForm('meta')}
                                 disabled={!metaForm.name.trim()}
                                 className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                               >Adaugă</button>
                             </div>
                           </div>
                         ) : (
                           <button 
                             onClick={() => setMetaForm({...metaForm, active: true})}
                             className="w-full text-left text-xs bg-transparent border border-dashed border-gray-300 rounded-lg p-2.5 hover:border-indigo-400 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50 font-medium transition-all"
                           >
                             + Detaliază campanie nouă...
                           </button>
                         )}
                       </div>
                     )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Secțiune Video / Montaj (Gabi & Owner) */}
          {showVideoModule && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mt-6 mb-6">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-display text-tbp-dark flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-indigo-500" />
                  Materiale Video / Editor
                </h2>
                <div className="text-xs font-bold text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100 uppercase tracking-wider">
                  FLUX MONTAJ
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {videoTasks.map(task => (
                    editingVideo === task.id ? (
                      <div key={task.id} className="p-4 bg-gray-50 border border-indigo-200 rounded-2xl shadow-sm animate-in fade-in zoom-in-95">
                        <input 
                          autoFocus
                          value={editVideoForm.title}
                          onChange={(e) => setEditVideoForm({...editVideoForm, title: e.target.value})}
                          placeholder="Titlu material (ex: Reel lansare produs)"
                          className="w-full font-bold bg-white border border-gray-200 rounded-xl p-3 mb-3 focus:outline-none focus:border-indigo-400 text-gray-700"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <input 
                            value={editVideoForm.driveLink}
                            onChange={(e) => setEditVideoForm({...editVideoForm, driveLink: e.target.value})}
                            placeholder="Link Google Drive (Brut)"
                            className="bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-indigo-400 text-gray-700"
                          />
                          <input 
                            value={editVideoForm.extraLink}
                            onChange={(e) => setEditVideoForm({...editVideoForm, extraLink: e.target.value})}
                            placeholder="Extra (Audio / Grafică - Opțional)"
                            className="bg-white border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-indigo-400 text-gray-700"
                          />
                        </div>
                        {user?.initials === 'GB' && (
                          <input 
                            value={editVideoForm.finishedLink}
                            onChange={(e) => setEditVideoForm({...editVideoForm, finishedLink: e.target.value})}
                            placeholder="Link Material Finalizat (Drive / TransferTBP)"
                            className="w-full bg-indigo-50/50 border border-indigo-200 rounded-xl p-3 mb-3 focus:outline-none focus:border-indigo-400 focus:bg-white text-indigo-900 placeholder:text-indigo-300"
                          />
                        )}
                        <input 
                          value={editVideoForm.status}
                          onChange={(e) => setEditVideoForm({...editVideoForm, status: e.target.value})}
                          placeholder="Status (ex: De Montat, În lucru, Finalizat)"
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 mb-3 focus:outline-none focus:border-indigo-400 text-gray-700"
                        />
                        <textarea
                          value={editVideoForm.instructions || ''}
                          onChange={(e) => setEditVideoForm({...editVideoForm, instructions: e.target.value})}
                          placeholder="Instrucțiuni, viziune, idei de cadre..."
                          rows={3}
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 mb-3 focus:outline-none focus:border-indigo-400 text-gray-700 resize-none"
                        />
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex gap-2">
                            <button onClick={() => setEditVideoForm({...editVideoForm, color: 'bg-green-500'})} className={`w-5 h-5 rounded-full bg-green-500 hover:scale-110 transition-transform ${editVideoForm.color === 'bg-green-500' ? 'ring-2 ring-offset-2 ring-green-500' : ''}`} title="Finalizat"></button>
                            <button onClick={() => setEditVideoForm({...editVideoForm, color: 'bg-indigo-500'})} className={`w-5 h-5 rounded-full bg-indigo-500 hover:scale-110 transition-transform ${editVideoForm.color === 'bg-indigo-500' ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`} title="De Montat"></button>
                            <button onClick={() => setEditVideoForm({...editVideoForm, color: 'bg-amber-500'})} className={`w-5 h-5 rounded-full bg-amber-500 hover:scale-110 transition-transform ${editVideoForm.color === 'bg-amber-500' ? 'ring-2 ring-offset-2 ring-amber-500' : ''}`} title="Review"></button>
                          </div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => setEditingVideo(null)} className="text-gray-500 hover:text-gray-700 font-medium">Anulează</button>
                            <button onClick={saveEditedVideo} className="bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-sm hover:bg-indigo-700 font-bold transition-colors">Salvează</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div key={task.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm group relative flex flex-col md:flex-row gap-4 md:items-start transition-all hover:border-indigo-100">
                        <div className={`w-3 h-3 rounded-full mt-1.5 ${task.color} flex-shrink-0`}></div>
                        <div className="flex-1 min-w-0 pr-12">
                          <h4 className="text-sm font-bold text-gray-800">{task.title}</h4>
                          <span className="inline-block mt-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 rounded-full">{task.status}</span>
                          
                          <div className="mt-3 flex flex-wrap gap-2">
                            {task.drive_link && (
                              <a href={task.drive_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition-colors">
                                <UploadCloud className="w-3.5 h-3.5" />
                                Video Brut (Drive)
                              </a>
                            )}
                            {task.extra_link && (
                              <a href={task.extra_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-medium transition-colors">
                                <FileText className="w-3.5 h-3.5" />
                                Extra Assets
                              </a>
                            )}
                            {task.finished_link && (
                              <a href={task.finished_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg font-bold transition-colors">
                                <UploadCloud className="w-3.5 h-3.5" />
                                Descarcă / Vezi Final
                              </a>
                            )}
                          </div>

                          {task.instructions && (
                            <div className="mt-4 text-xs text-gray-600 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                              <span className="block font-bold text-gray-500 mb-1 uppercase tracking-wider text-[10px]">Instrucțiuni Strategice</span>
                              <p className="whitespace-pre-wrap">{task.instructions}</p>
                            </div>
                          )}
                        </div>

                        {(user?.initials === 'GB' || user?.role === 'owner') && (
                            <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 p-1 rounded-lg">
                              <button onClick={() => startEditingVideo(task)} className="text-gray-400 hover:text-indigo-600 transition-colors p-1" title="Actualizează">
                                <Edit2 className="w-4 h-4"/>
                              </button>
                              <button onClick={() => removeVideoTask(task.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Șterge">
                                <Trash2 className="w-4 h-4"/>
                              </button>
                            </div>
                        )}
                      </div>
                    )
                  ))}

                  {videoForm.active ? (
                    <div className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-2xl">
                      <input 
                        autoFocus
                        className="w-full font-bold bg-white border border-indigo-100 rounded-xl p-3 mb-3 focus:outline-none focus:border-indigo-400 text-gray-700 placeholder:text-gray-400"
                        placeholder="Titlu material (ex: Reel lansare + Teaser)"
                        value={videoForm.title}
                        onChange={e => setVideoForm({...videoForm, title: e.target.value})}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <input 
                          className="bg-white border border-indigo-100 rounded-xl p-3 focus:outline-none focus:border-indigo-400 text-gray-700 placeholder:text-gray-400"
                          placeholder="Link Video Brut (Google Drive)"
                          value={videoForm.driveLink}
                          onChange={e => setVideoForm({...videoForm, driveLink: e.target.value})}
                        />
                        <input 
                          className="bg-white border border-indigo-100 rounded-xl p-3 focus:outline-none focus:border-indigo-400 text-gray-700 placeholder:text-gray-400"
                          placeholder="Extra Link (Muzică / Logo etc.)"
                          value={videoForm.extraLink}
                          onChange={e => setVideoForm({...videoForm, extraLink: e.target.value})}
                        />
                      </div>
                      <textarea
                        className="w-full bg-white border border-indigo-100 rounded-xl p-3 mb-4 focus:outline-none focus:border-indigo-400 text-gray-700 placeholder:text-gray-400 resize-none"
                        placeholder="Viziune montaj, decupaje necesare, text pe video..."
                        rows={3}
                        value={videoForm.instructions}
                        onChange={e => setVideoForm({...videoForm, instructions: e.target.value})}
                      />
                      <div className="flex justify-end items-center gap-3">
                        <button 
                          onClick={() => setVideoForm({active: false, title: '', driveLink: '', extraLink: '', instructions: ''})}
                          className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-xl font-bold transition-colors"
                        >Anulează</button>
                        <button 
                          onClick={submitVideoForm}
                          disabled={!videoForm.title.trim()}
                          className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >Adaugă Video</button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setVideoForm({...videoForm, active: true})}
                      className="w-full text-left text-sm bg-white border-2 border-dashed border-gray-200 rounded-2xl p-4 hover:border-indigo-400 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/20 font-bold transition-all flex items-center gap-3 justify-center"
                    >
                      <Plus className="w-5 h-5"/>
                      Adaugă Material Nou (Brief Montaj)
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {showTasksModule && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-display text-tbp-dark flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-tbp-orange" />
                  Sarcini & Task-uri ({filteredTasks.length})
                </h2>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Caută în task-uri..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-xs focus:outline-none focus:border-tbp-orange focus:ring-1 focus:ring-tbp-orange"
                    />
                  </div>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold text-gray-500 focus:outline-none"
                  >
                    <option value="all">Toate Statusurile</option>
                    <option value="todo">De Făcut</option>
                    <option value="in_progress">În Lucru</option>
                    <option value="review">În Review</option>
                    <option value="needs_changes">De Ajustat</option>
                    <option value="blocked">Blocat</option>
                    <option value="done">Finalizat</option>
                    <option value="archived">Arhivate (Istoric)</option>
                  </select>
                </div>
              </div>
            <div className="divide-y divide-gray-50">
              {filteredTasks.length > 0 ? (
                filteredTasks.map(task => (
                  <div 
                    key={task.id} 
                    onClick={() => handleTaskClick(task)}
                    className="p-5 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        <StatusBadge status={task.status} />
                      </div>
                      <div>
                        <h4 className={`font-bold text-sm ${task.status === 'done' ? 'text-gray-400 line-through' : 'text-tbp-dark'}`}>
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-2">
                           <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                             <Calendar className="w-3 h-3" />
                             {new Date(task.deadline).toLocaleDateString()}
                           </div>
                           <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${task.priority === 'Urgent' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                              {task.priority}
                           </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:ml-auto">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 border-2 border-white shadow-sm overflow-hidden">
                        {task.assignee}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState 
                  icon={<CheckCircle2 className="w-8 h-8" />}
                  title="Niciun task activ"
                  description="Nu există task-uri în desfășurare pentru acest client."
                />
              )}
            </div>
          </div>
          )}

          {hasAccessToClient && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6 p-6">
               <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
                 <h3 className="text-lg font-display text-gray-800 flex items-center gap-2">
                   <Activity className="w-5 h-5 text-indigo-500" />
                   Jurnal Activitate & Note Proiect
                 </h3>
               </div>
               
               <div className="space-y-3 mb-4">
                  {campaignLogs.length === 0 ? (
                    <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-xl text-center border border-dashed border-gray-200">
                      Nicio notă sau verificare înregistrată momentan.
                    </p>
                  ) : (
                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                      {campaignLogs.map(log => (
                        <div key={log.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm relative group">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[9px] font-bold">
                                {log.author}
                              </div>
                              <span className="text-xs font-bold text-gray-700">Notă / Log</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-md">
                              {new Date(log.date).toLocaleString('ro-RO', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                            {log.text}
                          </p>
                          {(log.author === user?.initials || user?.role === 'owner') && (
                            <button 
                              onClick={() => setCampaignLogs(campaignLogs.filter(l => l.id !== log.id))}
                              className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
               </div>

               <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                 {logForm.active ? (
                   <div className="animate-in slide-in-from-top-2">
                     <textarea
                       autoFocus
                       className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-400 text-gray-700 min-h-[100px] mb-3 resize-y"
                       placeholder="Scrie o notă, un log de verificare pe campanii / social sau update-uri despre proiect..."
                       value={logForm.text}
                       onChange={e => setLogForm({...logForm, text: e.target.value})}
                     />
                     <div className="flex justify-end items-center gap-2">
                       <button 
                         onClick={() => setLogForm({active: false, text: ''})}
                         className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg font-bold transition-colors text-xs"
                       >Anulează</button>
                       <button 
                         onClick={submitLogForm}
                         disabled={!logForm.text.trim()}
                         className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center gap-2"
                       >
                         <CheckCircle2 className="w-4 h-4" />
                         Salvează Nota
                       </button>
                     </div>
                   </div>
                 ) : (
                   <button 
                     onClick={() => setLogForm({...logForm, active: true})}
                     className="w-full bg-white border border-dashed border-gray-300 hover:border-indigo-400 text-gray-500 hover:text-indigo-600 rounded-xl p-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                   >
                     <Plus className="w-4 h-4" />
                     Lasă o notă / Log Nou
                   </button>
                 )}
               </div>
            </div>
          )}

          {!showTasksModule && !showMarketingModule && !showVideoModule && (
            <EmptyState 
              icon={<FileText className="w-8 h-8" />}
              title="Secțiune Restricționată"
              description="Nu ai module alocate pentru vizualizare pe acest workspace."
            />
          )}
        </div>

        {/* Right Column: Files & Chat */}
        {showStrategyModule && (
        <div className="space-y-6 section-reveal 2xl:col-span-1">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-display text-tbp-dark flex items-center gap-2">
                <FileText className="w-5 h-5 text-tbp-blue" />
                Rapoarte & Documente
              </h2>
              <div className="relative">
                <input 
                  type="file"
                  id="doc-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploadingDoc}
                />
                <label 
                  htmlFor="doc-upload"
                  className={`text-xs font-bold ${isUploadingDoc ? 'text-gray-400' : 'text-tbp-blue hover:text-tbp-blue-light'} flex items-center gap-1 cursor-pointer transition-colors`}
                >
                  <UploadCloud className="w-4 h-4" /> 
                  {isUploadingDoc ? 'Se încarcă...' : 'Încărcare'}
                </label>
              </div>
            </div>
            <div className="p-6">
              {filteredDocuments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredDocuments.map(doc => (
                    <a 
                      key={doc.id} 
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 rounded-2xl border border-gray-100 hover:border-tbp-blue/30 hover:shadow-sm transition-all flex items-start gap-4 group cursor-pointer"
                    >
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-tbp-dark truncate" title={doc.name}>{doc.name}</h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span>{doc.size}</span>
                          <span>•</span>
                          <span>{new Date(doc.created_at).toLocaleDateString('ro-RO')}</span>
                          <span>•</span>
                          <span>{doc.uploader}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  icon={<FileText className="w-8 h-8" />}
                  title="Niciun document"
                  description="Nu a fost încărcat niciun raport sau document."
                />
              )}
            </div>
          </div>

        {/* Right Column: Communication */}
        {showMessagesModule && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-display text-tbp-dark flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-500" />
                Mesaje & Notițe
              </h2>
              <p className="text-xs text-gray-500 mt-1">Lasă un mesaj pentru owner sau echipă.</p>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-6 flex flex-col">
              {messages.length > 0 ? (
                messages.map(msg => {
                  const isMe = msg.sender === user?.initials;
                  return (
                    <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm border border-white" title={msg.sender_full}>
                        {msg.sender}
                      </div>
                      <div className={`p-4 rounded-2xl max-w-[85%] relative group ${isMe ? 'bg-tbp-dark text-white rounded-tr-none' : 'bg-gray-50 text-tbp-dark rounded-tl-none border border-gray-100'}`}>
                        <p className="text-sm">{msg.content}</p>
                        <span className={`text-[9px] mt-2 block opacity-70 ${isMe ? 'text-gray-300' : 'text-gray-500'}`}>
                          {new Date(msg.created_at).toLocaleString('ro-RO')}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                  <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">Niciun mesaj. Scrie ceva...</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-white">
              <form onSubmit={handleSendMessage} className="relative">
                <textarea 
                  name="messageContent"
                  placeholder="Scrie un mesaj..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      const form = e.currentTarget.closest('form');
                      if (form) form.requestSubmit();
                    }
                  }} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-tbp-orange focus:ring-1 focus:ring-tbp-orange resize-none h-20"
                ></textarea>
                <div className="absolute right-2 bottom-2 flex items-center gap-2">
                  <button type="submit" className="px-4 py-2 bg-tbp-dark text-white text-xs font-bold rounded-xl hover:bg-tbp-orange transition-colors">
                    Trimite
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
        )}
      </div>

      <TaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        user={user} 
        projects={[project]} 
        defaultProjectId={project?.id}
        onTaskAdded={() => fetchProjectData(false)}
      />

      <TaskDrawer 
        task={selectedTask}
        isOpen={isTaskDrawerOpen}
        onClose={() => setIsTaskDrawerOpen(false)}
        currentUser={user}
        onUpdate={() => fetchProjectData(false)}
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
