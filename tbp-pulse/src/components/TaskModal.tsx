import React, { useState } from 'react';
import { X, Search, Calendar, ChevronDown, Flag, User, Clock, CheckCircle2, Paperclip, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAlerts } from '../context/AlertContext';

import { Task, TaskStatus, TaskType, TaskPriority } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  projects: any[];
  defaultProjectId?: number;
  onTaskAdded?: () => void;
}

export default function TaskModal({ isOpen, onClose, user, projects, defaultProjectId, onTaskAdded }: TaskModalProps) {
  const { addAlert } = useAlerts();

  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState<number | ''>(defaultProjectId || '');
  const [assigneeInitials, setAssigneeInitials] = useState('');
  const [deadline, setDeadline] = useState('');
  const [instructions, setInstructions] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('Content');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [reviewer, setReviewer] = useState('RM');
  const [status, setStatus] = useState<TaskStatus>('todo');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState('');

  const teamMembers = [
    { initials: 'RM', name: 'Rozalia Marinescu', role: 'Owner' },
    { initials: 'AS', name: 'Andreea Sîrbu', role: 'Marketing Strategy' },
    { initials: 'AR', name: 'Aurora Roventa', role: 'Social Media' },
    { initials: 'GB', name: 'Gabi Buliga', role: 'Video Editor' },
    { initials: 'RP', name: 'Radu Podaru', role: 'Colaborator' },
  ];
  const taskTypes: TaskType[] = ['Content', 'Ads', 'Design', 'Video', 'Strategy', 'Audit', 'Review', 'Admin', 'General'];
  
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!title || !projectId || !assigneeInitials || !deadline || !taskType || !instructions) {
       setFormError('Toate câmpurile marcate cu * sunt obligatorii!');
       return;
    }

    setIsSubmitting(true);
    
    try {
      // 1. Insert task
      const taskClient = projects.find(p => p.id === projectId)?.client || 'General';
      const { data: insertedTask, error } = await supabase.from('tasks')
        .insert([{
          title,
          project_id: projectId,
          deadline: new Date(deadline).toISOString(),
          status: status,
          assignee: assigneeInitials,
          instructions: instructions,
          priority: priority,
          reviewer: reviewer,
          task_type: taskType,
          created_by: user?.email,
          updated_at: new Date().toISOString(),
          client: taskClient,
          attachments: [] // Do not use this field anymore, kept for backwards compat but empty
        }]).select().single();

      if (error) {
        console.error('Task insert err:', error);
        throw new Error('Task inseration failed');
      }

      // 2. Upload files and add to documents table
      if (selectedFiles.length > 0) {
        setIsUploading(true);
        for (const file of selectedFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `tasks/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(filePath, file);
            
          if (uploadError) {
             console.error('Storage error for file', file.name, uploadError);
             continue; // go to next file
          }
          
          const { data } = supabase.storage.from('attachments').getPublicUrl(filePath);
          
          const { error: docError } = await supabase.from('documents').insert([{
             client: taskClient,
             name: `[TASK-${insertedTask.id}] ${file.name}`,
             size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
             url: data.publicUrl,
             uploader: user?.initials || 'Sistem',
             created_at: new Date().toISOString()
          }]);
          
          if (docError) {
             console.error('DB Insert error for file', file.name, docError);
          }
        }
        setIsUploading(false);
      }

      // Dispatch alert to assignee
      if (assigneeInitials !== user?.initials) {
         const assignedUser = teamMembers.find(t => t.initials === assigneeInitials);
         const projectName = projects.find(p => p.id === projectId)?.client || 'Proiect';
         await addAlert({
           title: 'Task Nou Alocat 📋',
           description: `Ți-a fost alocat task-ul: "${title}". Deadline: ${new Date(deadline).toLocaleDateString('ro-RO')}.`,
           client: projectName,
           assignee: assignedUser?.name || assigneeInitials,
           assigneeInitials: assigneeInitials,
           assigneeColor: 'bg-indigo-100 text-indigo-700',
           errorCode: `NEW-${insertedTask?.id}`,
           severity: priority === 'Urgent' ? 'critical' : 'info'
         });
      }

      onTaskAdded?.();
      onClose();
    } catch (err: any) {
      console.error('Error creating task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-tbp-dark/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-display text-tbp-dark">Adaugă Task Nou</h2>
            <p className="text-xs text-gray-500 mt-1">Setați un task nou pentru echipă.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
             <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                   Titlu Task <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Scrie articol blog SEO..."
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-tbp-blue focus:ring-1 focus:ring-tbp-blue transition-all font-semibold"
                />
             </div>

             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Client / Proiect <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select 
                    value={projectId} 
                    onChange={e => setProjectId(Number(e.target.value))} 
                    className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-tbp-blue focus:ring-1 focus:ring-tbp-blue text-gray-700 font-medium"
                    required
                  >
                    <option value="" disabled>Selectează proiectul...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.client} {p.name ? `- ${p.name}` : ''}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
             </div>

             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Responsabil <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select 
                    value={assigneeInitials} 
                    onChange={e => setAssigneeInitials(e.target.value)} 
                    className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-tbp-blue focus:ring-1 focus:ring-tbp-blue text-gray-700 font-medium"
                    required
                  >
                    <option value="" disabled>Alege utilizator...</option>
                    {teamMembers.map(m => (
                      <option key={m.initials} value={m.initials}>{m.name} ({m.initials})</option>
                    ))}
                  </select>
                  <User className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
             </div>

             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Termen Limită (Deadline) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-tbp-blue focus:ring-1 focus:ring-tbp-blue text-gray-700 font-medium"
                  />
                  <Calendar className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
             </div>

             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tip Task <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select 
                    value={taskType} 
                    onChange={e => setTaskType(e.target.value as TaskType)} 
                    className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-tbp-blue focus:ring-1 focus:ring-tbp-blue text-gray-700 font-medium"
                  >
                    {taskTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
             </div>

             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Prioritate</label>
                <div className="flex gap-2">
                  {(['Low', 'Medium', 'High', 'Urgent'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all border ${
                        priority === p 
                        ? p === 'Urgent' ? 'bg-red-50 text-red-600 border-red-200' : p === 'High' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-gray-800 text-white border-gray-800'
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
             </div>

             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Aprobare (Reviewer)</label>
                <div className="relative">
                  <select 
                    value={reviewer} 
                    onChange={e => setReviewer(e.target.value)} 
                    className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-tbp-blue focus:ring-1 focus:ring-tbp-blue text-gray-700 font-medium"
                  >
                    {teamMembers.map(m => (
                      <option key={m.initials} value={m.initials}>{m.name} ({m.initials})</option>
                    ))}
                  </select>
                  <CheckCircle2 className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
             </div>
             
             <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Instrucțiuni / Descriere <span className="text-red-500">*</span></label>
                <textarea
                  required
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Oferă context pentru task..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-tbp-blue focus:ring-1 focus:ring-tbp-blue transition-all resize-none font-medium"
                />
             </div>

             <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Atașamente (Opțional)</label>
                <div className="border-2 border-dashed border-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center bg-gray-50/30">
                  <input
                    type="file"
                    multiple
                    id="task-file-upload"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                      }
                    }}
                  />
                  <label 
                    htmlFor="task-file-upload"
                    className="flex flex-col items-center cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-tbp-orange group-hover:shadow-md transition-all mb-2 border border-gray-50">
                      <Paperclip className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-gray-400">Click pentru a încărca fișiere</span>
                    <span className="text-[10px] text-gray-300 mt-1">Imagini, PDF, Documente (max 10MB)</span>
                  </label>

                  {selectedFiles.length > 0 && (
                    <div className="w-full mt-6 space-y-2">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-100 text-xs shadow-sm">
                          <span className="truncate max-w-[200px] font-medium text-gray-600">{file.name}</span>
                          <button 
                            type="button"
                            onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="text-gray-400 hover:text-red-500 p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
             </div>
          </div>
          
          {formError && (
             <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2 mb-4">
                <X className="w-4 h-4" /> {formError}
             </div>
          )}

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
              <Clock className="w-4 h-4" />
              <span>Status Implicit: <span className="text-gray-800 px-2 py-1 bg-gray-100 rounded-md ml-1">To Do</span></span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-gray-500 hover:text-tbp-dark hover:bg-gray-100 rounded-xl font-bold transition-colors text-sm"
              >
                Anulează
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isUploading || !title || !projectId}
                className="px-8 py-2.5 bg-tbp-dark text-white rounded-xl hover:bg-tbp-orange font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center min-w-[140px]"
              >
                {isUploading ? 'Se încarcă...' : isSubmitting ? 'Se Salvează...' : 'Adaugă Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
