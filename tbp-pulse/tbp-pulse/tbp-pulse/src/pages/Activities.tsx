import { useActivity } from '../context/ActivityContext';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Clock, Plus, Target, CheckCircle2, TrendingUp, CheckSquare, Trash2, Edit3, ClipboardList, PieChart, Users, FileText, CheckCircle, Circle, Activity, Bot, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Activities() {
  const { activities } = useActivity();
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Todo / Notes stat for Owner
  const [notes, setNotes] = useState(() => localStorage.getItem('rox_notes') || '');
  const [todos, setTodos] = useState<{id: number, text: string, done: boolean}[]>(() => {
    const saved = localStorage.getItem('rox_todos');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTodo, setNewTodo] = useState('');

  // AI Brainstorming state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleSimulateAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsAiLoading(true);
    setAiResponse('');

    // Simulăm răspuns TBP
    setTimeout(() => {
      setAiResponse(`Iată 3 unghiuri TBP pentru "${aiPrompt}":\n\n1. **Contraintuitiv**: Să le spunem oamenilor de ce NU au nevoie de produs.\n\n2. **Adevăr Uman**: Focus pe frustrarea comună.\n\n3. **Mit Demontat**: Combate ceea ce 80% din audiență crede greșit.`);
      setIsAiLoading(false);
    }, 1500);
  };

  useEffect(() => {
    if (isOwner) {
      localStorage.setItem('rox_notes', notes);
    }
  }, [notes, isOwner]);

  useEffect(() => {
    if (isOwner) {
      localStorage.setItem('rox_todos', JSON.stringify(todos));
    }
  }, [todos, isOwner]);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    setTodos([{ id: Date.now(), text: newTodo, done: false }, ...todos]);
    setNewTodo('');
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  useEffect(() => {
    if (user?.role !== 'owner') {
      fetchUserTasks();
    } else {
      fetchAllTasks();
    }
  }, [user]);

  const fetchUserTasks = async () => {
    if (!user?.initials) return;
    try {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('assignee', user.initials);
      
      if (data) {
        setTasks(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTasks = async () => {
    try {
      const { data } = await supabase
        .from('tasks')
        .select('*');
      
      if (data) {
        setTasks(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOwner) {
    const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'done');
    const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'done');
    
    // Quick progress calculation
    const total = tasks.length;
    const progressPerc = total === 0 ? 0 : Math.round((completedTasks.length / total) * 100);

    return (
      <div className="max-w-5xl mx-auto pb-20 animate-fade-in relative z-10">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-tbp-blue/10 text-tbp-blue text-xs font-bold rounded-lg uppercase tracking-wider">Sumar</span>
          </div>
          <h1 className="text-4xl font-display tracking-wide text-tbp-dark mb-2">
            Evoluția <span className="text-tbp-blue">Ta</span>
          </h1>
          <p className="text-gray-500 text-lg">Un rezumat interactiv al performanței și task-urilor tale.</p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-tbp-blue/30 border-t-tbp-blue rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-8 section-reveal">
            {/* Progress Card */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-bl from-tbp-blue/5 to-transparent rounded-bl-full pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
              
              <div className="w-40 h-40 shrink-0 relative flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle cx="50" cy="50" r="40" className="stroke-gray-100" strokeWidth="8" fill="none" />
                  <circle 
                    cx="50" cy="50" r="40" 
                    className="stroke-tbp-blue transition-all duration-1000 ease-out drop-shadow-sm" 
                    strokeWidth="8" fill="none" 
                    strokeDasharray={`${progressPerc * 2.51} 251`} 
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-display text-tbp-dark">{progressPerc}%</span>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Finalizat</span>
                </div>
              </div>

              <div className="flex-1 space-y-6 w-full text-center md:text-left">
                <div>
                  <h3 className="text-2xl font-bold text-tbp-dark mb-1">
                    {progressPerc === 100 ? 'Incredibil! Ești la zi cu tot!' : progressPerc > 50 ? 'Ești pe drumul cel bun!' : 'Hai să creștem ritmul!'}
                  </h3>
                  <p className="text-sm text-gray-500">Ai finalizat cu succes {completedTasks.length} din {total} task-uri primite.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center md:items-start border border-gray-100">
                    <CheckCircle2 className="w-5 h-5 text-status-green mb-2" />
                    <span className="text-2xl font-display text-tbp-dark">{completedTasks.length}</span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Task-uri Gata</span>
                  </div>
                  <div className="bg-orange-50/50 rounded-2xl p-4 flex flex-col items-center md:items-start border border-orange-100">
                    <Target className="w-5 h-5 text-tbp-orange mb-2" />
                    <span className="text-2xl font-display text-tbp-dark">{pendingTasks.length}</span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">De Făcut</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Motivational message or Next Steps */}
            {pendingTasks.length > 0 && (
              <div className="bg-gradient-to-r from-tbp-dark to-[#2a2a2a] rounded-3xl p-8 shadow-sm text-white flex flex-col sm:flex-row justify-between items-center gap-6">
                <div>
                  <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-tbp-orange" />
                    Focus pe execuție!
                  </h3>
                  <p className="text-sm text-white/70">Ai {pendingTasks.length} {pendingTasks.length === 1 ? 'task ce așteaptă' : 'task-uri care așteaptă'} atenția ta. Rezolvă-le strategic.</p>
                </div>
                <Link to="/tasks" className="px-6 py-3 bg-white text-tbp-dark text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors whitespace-nowrap">
                  Vezi Task-urile Tale
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Setup for Owner
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'done').length;
  const inProgressTasks = totalTasks - completedTasks;

  const assigneesStats = tasks.reduce((acc, t) => {
    if (!t.assignee) return acc;
    if (!acc[t.assignee]) acc[t.assignee] = { total: 0, done: 0 };
    acc[t.assignee].total++;
    if (t.status === 'completed' || t.status === 'done') {
      acc[t.assignee].done++;
    }
    return acc;
  }, {} as Record<string, { total: number, done: number }>);

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in relative z-10">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-tbp-orange/10 text-tbp-orange text-xs font-bold rounded-lg uppercase tracking-wider">Dashboard Privat</span>
          </div>
          <h1 className="text-4xl font-display tracking-wide text-tbp-dark mb-2">
            Workspace <span className="text-tbp-orange">{user?.full_name?.split(' ')[0] || 'Tău'}</span>
          </h1>
          <p className="text-gray-500 text-lg">Vedere de ansamblu asupra eficienței agenției și notițele tale rapide.</p>
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 section-reveal">
        
        {/* Left Column: Agency Stats & Members */}
        <div className="lg:col-span-2 space-y-8">
          {/* Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-tbp-blue rounded-xl flex items-center justify-center shrink-0">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Task-uri</p>
                <p className="text-2xl font-display text-tbp-dark">{totalTasks}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 text-tbp-orange rounded-xl flex items-center justify-center shrink-0">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">În Lucru</p>
                <p className="text-2xl font-display text-tbp-dark">{inProgressTasks}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Finalizate</p>
                <p className="text-2xl font-display text-tbp-dark">{completedTasks}</p>
              </div>
            </div>
          </div>

          {/* Members Breakdown */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h3 className="text-lg font-display text-tbp-dark mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-400" />
              Încărcare Echipă
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries<{total: number, done: number}>(assigneesStats).map(([init, stat], idx) => {
                const progress = stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0;
                return (
                  <div key={idx} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-tbp-dark text-white flex items-center justify-center text-xs font-bold">
                      {init}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-bold text-tbp-dark">{stat.done} / {stat.total}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-tbp-blue rounded-full transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {Object.keys(assigneesStats).length === 0 && (
                <p className="text-sm text-gray-500">Nu am găsit task-uri atribuite.</p>
              )}
            </div>
          </div>

          {/* Recent Agency Activity */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h3 className="text-lg font-display text-tbp-dark mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-400" />
              Istoric Activitate
            </h3>
            {activities.length > 0 ? (
              <div className="relative border-l-2 border-gray-100 ml-3 space-y-6">
                {activities.slice(0, 5).map((activity, idx) => (
                  <div key={activity.id} className="relative pl-6">
                    <div className={`absolute -left-[13px] top-1 w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold shadow-sm border-2 border-white ${activity.color}`}>
                      {activity.user}
                    </div>
                    <div className="mb-1">
                      <h4 className="font-bold text-sm text-tbp-dark">{activity.title}</h4>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{activity.desc}</p>
                    <span className="text-[10px] text-gray-400 mt-1 block">{activity.time}</span>
                  </div>
                ))}
              </div>
            ) : (
               <p className="text-sm text-gray-500">Nicio activitate recentă.</p>
            )}
          </div>
        </div>

        {/* Right Column: Private Notes & Todo */}
        <div className="space-y-8">
          
          {/* Notes Widget */}
          <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-yellow-200 p-6 md:p-8 flex flex-col h-[300px]">
            <h3 className="text-lg font-display text-yellow-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-yellow-600" />
              Notițe Interne
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Scrie-ți ideile, insight-urile din ședințe sau gândurile aici..."
              className="flex-1 w-full bg-transparent resize-none focus:outline-none text-sm text-gray-700 placeholder:text-yellow-600/40"
            />
          </div>

          {/* Todo Widget */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 flex flex-col max-h-[500px]">
            <h3 className="text-lg font-display text-tbp-dark mb-4 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-tbp-orange" />
              To-Do Personal
            </h3>
            
            <form onSubmit={handleAddTodo} className="mb-4">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Adaugă un task rapid..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-tbp-orange/20 focus:border-tbp-orange/30 transition-all text-tbp-dark"
              />
            </form>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {todos.map(todo => (
                <div key={todo.id} className="flex gap-3 group items-start p-2 hover:bg-gray-50 rounded-lg">
                  <button 
                    onClick={() => toggleTodo(todo.id)}
                    className="mt-0.5 shrink-0 text-gray-400 hover:text-tbp-orange transition-colors"
                  >
                    {todo.done ? <CheckCircle className="w-5 h-5 text-status-green" /> : <Circle className="w-5 h-5" />}
                  </button>
                  <span className={`text-sm flex-1 ${todo.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    {todo.text}
                  </span>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {todos.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm">
                  Nu ai niciun task pe listă. Perfect! 🎉
                </div>
              )}
            </div>
          </div>
          
          {/* AI Hook Generator / Brainstorming Partner */}
          {user?.initials !== 'RM' && (
          <div className="bg-white rounded-3xl shadow-sm border border-indigo-100 p-6 md:p-8 flex flex-col relative overflow-hidden group">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 rounded-full blur-3xl group-hover:bg-indigo-100 transition-all duration-700 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-50 rounded-full blur-3xl transition-all duration-700 pointer-events-none"></div>
            
            <div className="flex items-start justify-between mb-5 relative z-10">
              <div>
                <h3 className="text-lg font-display text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-tbp-blue mb-1 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-indigo-500" />
                  Brainstorming Partner
                </h3>
                <p className="text-xs text-gray-400">Găsește rapid unghiuri noi și cârlige</p>
              </div>
              <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-bold uppercase tracking-wider rounded-lg border border-indigo-100 shadow-sm">
                AI Tool
              </span>
            </div>
            
            <form onSubmit={handleSimulateAI} className="relative z-10 mb-4">
              <div className="relative group/input">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="La ce ne gândim astăzi? Ex: Cum sa vinzi frica de dentist..."
                  className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl p-4 pr-14 text-sm text-tbp-dark placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none h-28"
                />
                <button 
                  type="submit"
                  disabled={isAiLoading || !aiPrompt.trim()}
                  className="absolute bottom-3 right-3 p-2.5 bg-gradient-to-br from-indigo-500 to-tbp-blue text-white rounded-xl hover:shadow-md hover:from-indigo-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 disabled:transform-none"
                >
                  {isAiLoading ? (
                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                     <Send className="w-4 h-4 ml-0.5" />
                  )}
                </button>
              </div>
            </form>

            {aiResponse && (
              <div className="relative z-10 flex-1 overflow-y-auto bg-indigo-50/30 rounded-2xl p-5 border border-indigo-100/50 animate-in fade-in slide-in-from-bottom-2 custom-scrollbar text-sm text-gray-700 shadow-inner">
                <div className="space-y-4">
                  {aiResponse.split('\n').map((line, i) => {
                    if (line.includes('**')) {
                       return (
                         <div key={i} className="font-bold text-indigo-900 mb-1 mt-4 first:mt-0 flex items-center gap-2">
                           <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                           <span dangerouslySetInnerHTML={{ __html: line.replace(/\*\*/g, '') }}></span>
                         </div>
                       );
                    }
                    if (!line.trim()) return null;
                    return <p key={i} className="leading-relaxed text-gray-600 pl-3.5 border-l-2 border-indigo-100">{line}</p>;
                  })}
                </div>
              </div>
            )}
          </div>
          )}

        </div>

      </div>
    </div>
  );
}
