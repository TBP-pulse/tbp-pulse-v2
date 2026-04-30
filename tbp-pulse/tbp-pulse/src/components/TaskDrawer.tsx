import React, { useState } from 'react';
import { 
  X, Clock, User, CheckCircle2, AlertCircle, Play, 
  Send, Lock, CheckCircle, ArrowLeft, Paperclip, MessageSquare,
  FileText, Download, Calendar, Archive, Trash2, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAlerts } from '../context/AlertContext';
import { Task, TaskStatus } from '../types';

interface TaskDrawerProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onUpdate: () => void;
}

const getStatusLabel = (status: TaskStatus) => {
  switch (status) {
    case 'todo': return 'De Făcut';
    case 'in_progress': return 'În Lucru';
    case 'review': return 'În Review';
    case 'needs_changes': return 'De Ajustat';
    case 'done': return 'Finalizat';
    case 'blocked': return 'Blocat';
    case 'archived': return 'Arhivat';
    default: return status;
  }
};

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case 'todo': return 'bg-gray-100 text-gray-600';
    case 'in_progress': return 'bg-blue-50 text-blue-600 border border-blue-100';
    case 'review': return 'bg-amber-50 text-amber-600 border border-amber-100';
    case 'needs_changes': return 'bg-rose-50 text-rose-600 border border-rose-100';
    case 'done': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    case 'blocked': return 'bg-red-50 text-red-600 border border-red-100';
    case 'archived': return 'bg-gray-100 text-gray-500 border border-gray-200';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Urgent': return 'bg-red-600 text-white shadow-sm';
    case 'High': return 'bg-orange-500 text-white';
    case 'Medium': return 'bg-blue-500 text-white';
    case 'Low': return 'bg-gray-400 text-white';
    default: return 'bg-blue-500 text-white';
  }
};

export default function TaskDrawer({ task, isOpen, onClose, currentUser, onUpdate }: TaskDrawerProps) {
  const { addAlert } = useAlerts();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showBlockerModal, setShowBlockerModal] = useState(false);
  const [blockerReason, setBlockerReason] = useState('Așteptăm Feedback Client');
  const [blockerNote, setBlockerNote] = useState('');
  const [feedbackNote, setFeedbackNote] = useState('');
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [taskDocuments, setTaskDocuments] = useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // Identity logic
  const isOwner = currentUser?.role === 'owner';
  const isAssignee = currentUser?.initials === task?.assignee;
  
  // Transition logic
  const canMoveToInProgress = isAssignee || isOwner;
  const canMoveToReview = isAssignee || isOwner;
  const canMoveToDone = isOwner;
  const canMoveToNeedsChanges = isOwner;
  const canBlock = isAssignee || isOwner;

  React.useEffect(() => {
    if (task && isOpen) {
      fetchTaskDocuments();
    }
  }, [task, isOpen]);

  const fetchTaskDocuments = async () => {
    if (!task) return;
    setIsLoadingDocs(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .like('name', `[TASK-${task.id}]%`)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Eroare la aducerea fisierelor:', error);
      } else {
        setTaskDocuments(data || []);
      }
    } catch (err) {
      console.error('Fetch docs error:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const updateTaskStatus = async (newStatus: TaskStatus, extraFields: any = {}) => {
    if (!task) return;
    setIsUpdating(true);
    try {
      const updatePayload: any = { 
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...extraFields
      };

      if (newStatus === 'done') {
        updatePayload.completed_at = new Date().toISOString();
      }
      if (newStatus === 'review') {
        updatePayload.moved_to_review_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', task.id);

      if (error) throw error;

      // Automated Alerts
      if (newStatus === 'review') {
        await addAlert({
          title: 'Review Necesar 👀',
          description: `${currentUser.full_name} a finalizat task-ul "${task.title}". Verifică și aprobă lucrarea.`,
          client: task.client || 'General',
          assignee: 'Rozalia Marinescu',
          assigneeInitials: 'RM',
          assigneeColor: 'bg-amber-100 text-amber-700',
          errorCode: `REV-${task.id}`,
          severity: 'warning'
        });
      } else if (newStatus === 'needs_changes') {
        await addAlert({
          title: 'Modificări Necesare 🛠️',
          description: `Task-ul "${task.title}" a fost trimis înapoi. Verifică notele de la Rozalia.`,
          client: task.client || 'General',
          assignee: task.assignee,
          assigneeInitials: task.assignee,
          assigneeColor: 'bg-rose-100 text-rose-700',
          errorCode: `CHG-${task.id}`,
          severity: 'critical'
        });
      } else if (newStatus === 'done') {
         await addAlert({
            title: 'Task Aprobat! ✅',
            description: `Task-ul "${task.title}" a fost aprobat de Rozalia. Excelentă treabă!`,
            client: task.client || 'General',
            assignee: task.assignee,
            assigneeInitials: task.assignee,
            assigneeColor: 'bg-emerald-100 text-emerald-700',
            errorCode: `DONE-${task.id}`,
            severity: 'info'
          });
      }

      onUpdate();
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        if (newStatus === 'done' || newStatus === 'archived') onClose();
      }, 1500);
      
    } catch (err: any) {
      console.error('Error updating task status:', err);
      // Removed addAlert
    } finally {
      setIsUpdating(false);
      setShowBlockerModal(false);
      setShowFeedbackInput(false);
    }
  };

  const handleBlockTask = () => {
    updateTaskStatus('blocked', { block_reason: `${blockerReason}: ${blockerNote}` });
  };

  const handleSendBack = () => {
    if (!showFeedbackInput) {
      setShowFeedbackInput(true);
    } else if (feedbackNote.trim()) {
      updateTaskStatus('needs_changes', { instructions: `[FEEDBACK ${new Date().toLocaleDateString()}]: ${feedbackNote}\n\n${task?.instructions || ''}` });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !task) return;
    
    setIsUploadingFile(true);
    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `tasks/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);
        
      if (uploadError) {
        console.error('Eroare la încărcare storage:', uploadError);
        throw new Error('Storage upload failed');
      }
      
      const { data } = supabase.storage.from('attachments').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;
      
      const { error: docError } = await supabase.from('documents').insert([{
        client: task.client || 'General',
        name: `[TASK-${task.id}] ${file.name}`,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        url: publicUrl,
        uploader: currentUser?.initials || 'Sistem',
        created_at: new Date().toISOString()
      }]);
        
      if (docError) {
        console.error('Eroare la inserare document:', docError);
        throw new Error('Database insert failed');
      }
      
      await fetchTaskDocuments();
      onUpdate();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err: any) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploadingFile(false);
      // reset file input
      e.target.value = '';
    }
  };

  if (!task) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-tbp-dark/30 backdrop-blur-[4px] z-[60]"
          />

          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 w-full md:w-[600px] h-full bg-white shadow-2xl z-[70] flex flex-col border-l border-gray-100 shadow-tbp-dark/20"
          >
            {/* Header / Info Bar */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-4">
                <button 
                  onClick={onClose}
                  className="p-2.5 hover:bg-white rounded-2xl transition-all text-gray-400 hover:text-tbp-dark border border-transparent hover:border-gray-100 shadow-sm"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Specificații Task</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className="text-xs font-bold text-gray-400">/</span>
                    <span className="text-xs font-bold text-tbp-dark uppercase tracking-wider">{task.task_type}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`px-4 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider shadow-sm ${getStatusColor(task.status)}`}>
                  {getStatusLabel(task.status)}
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-10 py-10 space-y-12 custom-scrollbar">
              
              {/* Title & Client */}
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] font-black text-tbp-orange uppercase tracking-[0.15em] bg-orange-50 px-3 py-1 rounded-lg border border-orange-100">
                    {task.client || 'General / Internal'}
                  </span>
                </div>
                <h1 className="text-3xl font-black text-tbp-dark leading-[1.1] tracking-tight">
                  {task.title.replace('[VIDEO] ', '')}
                </h1>
              </div>

              {/* Roles & Deadline Grid */}
              <div className="grid grid-cols-3 gap-8 pb-8 border-b border-gray-50">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Responsabil</label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm border border-indigo-100 shadow-sm">
                      {task.assignee}
                    </div>
                    <div className="text-xs font-bold text-tbp-dark">
                      {task.assignee === 'RM' ? 'Rozalia' : task.assignee === 'AS' ? 'Andreea' : task.assignee === 'AR' ? 'Aurora' : task.assignee === 'GB' ? 'Gabi' : task.assignee}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Reviewer</label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm border border-emerald-100 shadow-sm">
                      {task.reviewer}
                    </div>
                    <div className="text-xs font-bold text-tbp-dark">Rozalia M.</div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Termen Limită</label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange-50 text-tbp-orange flex items-center justify-center border border-orange-100 shadow-sm">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-tbp-dark">
                      {new Date(task.deadline).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })}
                      <span className="block text-[10px] text-gray-400 font-medium">Data Finalizare</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions / Brief */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-6 bg-tbp-dark rounded-full" />
                   <h3 className="text-sm font-black text-tbp-dark uppercase tracking-widest">Instrucțiuni & Obiective</h3>
                </div>
                <div className="bg-surface p-8 rounded-3xl border border-gray-100 shadow-inner min-h-[160px] relative">
                   <FileText className="w-12 h-12 text-gray-100 absolute top-6 right-6" />
                   <p className="text-sm text-tbp-dark leading-relaxed whitespace-pre-wrap font-medium relative z-10">
                     {task.instructions || 'Nu există instrucțiuni specifice adăugate pentru acest task.'}
                   </p>
                </div>
              </div>

              {/* Attachments Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="w-2 h-6 bg-tbp-orange rounded-full" />
                     <h3 className="text-sm font-black text-tbp-dark uppercase tracking-widest">Atașamente Task</h3>
                   </div>
                   <label className="cursor-pointer bg-white border border-gray-200 hover:border-tbp-orange hover:text-tbp-orange px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2">
                      <Paperclip className="w-3 h-3" />
                      Adaugă Fișier
                      <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploadingFile} />
                   </label>
                </div>

                {isLoadingDocs ? (
                  <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-gray-400 py-6">
                     <Clock className="w-3 h-3 animate-spin" /> SE ÎNCARCĂ ATAȘAMENTELE...
                  </div>
                ) : taskDocuments && taskDocuments.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {taskDocuments.map((doc, i) => {
                      const url = doc.url;
                      const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)/i);
                      const rawFileName = doc.name.replace(`[TASK-${task.id}] `, '');
                      
                      return (
                        <div key={doc.id || i} className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                          {isImage ? (
                            <div className="aspect-video w-full bg-gray-50 flex items-center justify-center overflow-hidden">
                              <img src={url} alt="Attachment" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                          ) : (
                            <div className="aspect-video w-full bg-indigo-50 flex flex-col items-center justify-center text-indigo-400">
                              <FileText className="w-8 h-8 mb-2" />
                            </div>
                          )}
                          <div className="p-3 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-500 truncate max-w-[120px]" title={rawFileName}>{rawFileName}</span>
                            <a href={url} target="_blank" rel="noreferrer" className="p-1.5 text-gray-400 hover:text-tbp-blue hover:bg-blue-50 rounded-lg transition-all">
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                    <Paperclip className="w-8 h-8 text-gray-200 mb-3" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Niciun fișier atașat</p>
                  </div>
                )}
                {isUploadingFile && (
                   <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-tbp-orange animate-pulse">
                     <Clock className="w-3 h-3" /> SE ÎNCARCĂ...
                   </div>
                )}
              </div>

              {/* Notes & Status Logs (Point 11: Audit Trail) */}
              <div className="space-y-6">
                 <div className="flex items-center gap-3">
                   <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                   <h3 className="text-sm font-black text-tbp-dark uppercase tracking-widest">Istoric & Note Lucru</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
                    <History className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="space-y-3 flex-1">
                       <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-gray-400">
                         <span>Cronologie activitate</span>
                         <span>Sistem</span>
                       </div>
                       <div className="space-y-2">
                          <p className="text-xs font-bold text-tbp-dark flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Creat de {task.created_by || 'Owner'} pe {new Date(task.created_at).toLocaleDateString()}
                          </p>
                          {task.moved_to_review_at && (
                             <p className="text-xs font-bold text-tbp-dark flex items-center gap-2">
                               <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                               Trimis la Review pe {new Date(task.moved_to_review_at).toLocaleDateString()}
                             </p>
                          )}
                          {task.completed_at && (
                             <p className="text-xs font-bold text-emerald-600 flex items-center gap-2">
                               <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                               Finalizat și Aprobat pe {new Date(task.completed_at).toLocaleDateString()}
                             </p>
                          )}
                       </div>
                    </div>
                  </div>
                  
                  <div className="p-8 border border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-center opacity-40 grayscale">
                     <MessageSquare className="w-10 h-10 text-gray-300 mb-3" />
                     <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Momentan nu există note sau feedback.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions (Point 6: Status Flow) */}
            <div className="px-10 py-8 border-t border-gray-100 bg-white/80 backdrop-blur-md">
              {showSuccess && (
                <div className="bg-emerald-600 text-white p-4 rounded-2xl mb-6 flex items-center justify-center gap-3 animate-slide-up font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-200">
                  <CheckCircle2 className="w-5 h-5" />
                  Operațiune Reușită!
                </div>
              )}

              <div className="flex flex-col gap-4">
                {/* ACTIONS - Collaborator Flow */}
                {(isAssignee && !isOwner) && task.status === 'review' && (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center shadow-sm">
                    <p className="text-sm font-bold text-amber-700">Taskul a fost trimis la review și așteaptă feedback de la Rozalia.</p>
                  </div>
                )}

                {(isAssignee || isOwner) && (
                  <div className="space-y-4">
                    {task.status === 'todo' && (
                      <div className="flex gap-4">
                        <button
                          onClick={() => updateTaskStatus('in_progress')}
                          disabled={isUpdating}
                          className="flex-1 bg-tbp-dark text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-tbp-orange transition-all shadow-xl shadow-tbp-dark/10 group"
                        >
                          <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                          Pornește Taskul
                        </button>
                        <button
                          onClick={() => setShowBlockerModal(true)}
                          disabled={isUpdating}
                          className="px-8 py-5 bg-white border-2 border-gray-100 text-gray-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:border-red-200 hover:text-red-500 transition-all"
                        >
                          Marchează Blocat
                        </button>
                      </div>
                    )}

                    {task.status === 'in_progress' && (
                      <div className="flex gap-4">
                        <button
                          onClick={() => updateTaskStatus('review')}
                          disabled={isUpdating}
                          className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 group"
                        >
                          <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                          Trimite la Review
                        </button>
                        <button
                          onClick={() => setShowBlockerModal(true)}
                          disabled={isUpdating}
                          className="px-8 py-5 bg-white border-2 border-gray-100 text-gray-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:border-red-200 hover:text-red-500 transition-all font-black"
                        >
                          Marchează Blocat
                        </button>
                      </div>
                    )}

                    {task.status === 'needs_changes' && (
                       <div className="flex gap-4">
                         <button
                            onClick={() => updateTaskStatus('in_progress')}
                            disabled={isUpdating}
                            className="flex-1 bg-tbp-orange text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-orange-600 transition-all shadow-xl shadow-orange-100 group"
                          >
                            <History className="w-4 h-4" />
                            Reia Taskul
                          </button>
                          <button
                            onClick={() => setShowBlockerModal(true)}
                            disabled={isUpdating}
                            className="px-8 py-5 bg-white border-2 border-gray-100 text-gray-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:border-red-200 hover:text-red-500 transition-all font-black"
                          >
                            Marchează Blocat
                          </button>
                       </div>
                    )}

                    {task.status === 'blocked' && (
                      <button
                        onClick={() => updateTaskStatus('in_progress')}
                        disabled={isUpdating}
                        className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100"
                      >
                        <Play className="w-4 h-4" />
                        Reia Taskul
                      </button>
                    )}
                  </div>
                )}

                {/* OWNER ONLY - Review Approval */}
                {isOwner && task.status === 'review' && (
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    {showFeedbackInput && (
                      <div className="animate-fade-in">
                        <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-2">Note pt. Modificări</label>
                        <textarea 
                          autoFocus
                          value={feedbackNote}
                          onChange={(e) => setFeedbackNote(e.target.value)}
                          placeholder="Ex: Te rog să schimbi culoarea butonului în portocaliu..."
                          className="w-full p-5 bg-rose-50/30 border border-rose-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all mb-4 h-28 resize-none shadow-inner"
                        />
                      </div>
                    )}
                    <div className="flex gap-4">
                      <button
                        onClick={() => updateTaskStatus('done')}
                        disabled={isUpdating}
                        className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Aprobă & Finalizează
                      </button>
                      <button
                        onClick={handleSendBack}
                        disabled={isUpdating}
                        className={`flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all border-2 ${showFeedbackInput ? 'bg-rose-600 border-rose-600 text-white shadow-xl shadow-rose-100' : 'bg-white border-rose-100 text-rose-600 hover:bg-rose-50'}`}
                      >
                        <AlertCircle className="w-5 h-5" />
                        {showFeedbackInput ? 'Confirmă Trimite' : 'Cere Modificări'}
                      </button>
                    </div>
                  </div>
                )}

                {/* ARCHIVE - Owner Only */}
                {isOwner && task.status === 'done' && (
                  <button 
                    onClick={() => updateTaskStatus('archived')}
                    className="w-full py-4 text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] hover:text-gray-500 transition-all flex items-center justify-center gap-2"
                  >
                    <Archive className="w-4 h-4" />
                    Arhivează Task Finalizat
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* BLOCKER MODAL */}
          <AnimatePresence>
            {showBlockerModal && (
              <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setShowBlockerModal(false)}
                  className="fixed inset-0 bg-tbp-dark/50 backdrop-blur-md"
                />
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-3xl p-10 w-full max-w-lg relative z-10 shadow-2xl space-y-8 border border-gray-100"
                >
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
                      <Lock className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-tbp-dark">Blocare Task</h3>
                    <p className="text-sm text-gray-400 font-medium tracking-tight">Comunică clar motivul pentru care nu se poate avansa.</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Motiv Principal</label>
                      <select 
                        value={blockerReason}
                        onChange={(e) => setBlockerReason(e.target.value)}
                        className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-tbp-orange/20 appearance-none"
                      >
                        <option>Așteptăm Feedback Client</option>
                        <option>Așteptăm Rozalia (Owner)</option>
                        <option>Lipsă Resurse / Materiale</option>
                        <option>Problemă Tehnică</option>
                        <option>Alt Motiv</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Detalii Suplimentare (Necesar pentru deblocare)</label>
                      <textarea
                        value={blockerNote}
                        onChange={(e) => setBlockerNote(e.target.value)}
                        placeholder="Ex: Clientul nu ne-a trimis parola pentru Ads..."
                        rows={4}
                        className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-tbp-orange/20 resize-none font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleBlockTask}
                      className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-red-200 hover:bg-red-700 transition-all"
                    >
                      Confirmă Blocaj
                    </button>
                    <button
                      onClick={() => setShowBlockerModal(false)}
                      className="w-full py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-all"
                    >
                      Nu, anulează
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
