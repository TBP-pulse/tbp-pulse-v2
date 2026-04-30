import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, X, AlertCircle, Clock, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useActivity } from '../context/ActivityContext';
import { useAlerts } from '../context/AlertContext';
import { supabase } from '../lib/supabase';

export default function NewUpdate() {
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addAlert } = useAlerts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [status, setStatus] = useState<'on-track' | 'warning' | 'blocked'>('on-track');
  const [notifyOwner, setNotifyOwner] = useState(false);
  const [clients, setClients] = useState<string[]>([]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('client')
          .order('client', { ascending: true });
        
        if (error) throw error;
        if (data) {
          // Extract unique clients
          const uniqueClients = Array.from(new Set(data.map(p => p.client)));
          setClients(uniqueClients);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };

    fetchClients();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    
    const client = (form.elements.namedItem('client') as HTMLSelectElement).value;
    const completed = (form.elements.namedItem('completed') as HTMLTextAreaElement).value;

    // Dacă e bifată notificarea pentru owner, creăm și o alertă
    if (notifyOwner) {
      addAlert({
        title: `Update important: ${client}`,
        description: completed,
        client: client,
        assignee: user?.full_name || 'User',
        assigneeInitials: user?.initials || 'U',
        assigneeColor: user?.color || 'bg-gray-100 text-gray-700',
        errorCode: `UPD_${Date.now().toString().slice(-4)}`,
        severity: 'warning' // Default la warning pentru update-uri escalate
      });
    }

    setIsSubmitting(true);
    
    // Simulam trimiterea datelor către server
    setTimeout(() => {
      // Adăugăm activitatea în state-ul global
      addActivity({
        title: `Update: ${status === 'on-track' ? 'On Track' : status === 'warning' ? 'Atenție' : 'Blocat'}${notifyOwner ? ' 🔔 (Atenție Owner)' : ''}`,
        desc: `${completed.substring(0, 50)}${completed.length > 50 ? '...' : ''} (${client})`,
        user: user?.initials || 'TBP',
        color: status === 'on-track' ? 'bg-status-green-bg text-status-green' : 
               status === 'warning' ? 'bg-status-yellow-bg text-status-yellow' : 
               'bg-status-red-bg text-status-red',
      });

      setIsSubmitting(false);
      setIsSuccess(true);
      form.reset();
      setStatus('on-track');
      setNotifyOwner(false);
      
      setTimeout(() => setIsSuccess(false), 5000);
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto pb-20 animate-fade-in">
      <div className="mb-10">
        <h1 className="text-4xl font-display tracking-wide text-tbp-dark uppercase mb-2">
          Nou <span className="text-tbp-orange">Update</span>
        </h1>
        <p className="text-gray-500 text-lg">Completează statusul pentru un client. Sub 2 minute.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10 section-reveal">
        <form onSubmit={handleSubmit} className="space-y-10">
          
          {/* Client Selection */}
          <div className="space-y-3">
            <label htmlFor="client" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
              Client <span className="text-tbp-orange">*</span>
            </label>
            <select
              id="client"
              name="client"
              required
              className="w-full bg-surface border-0 rounded-2xl px-5 py-4 text-tbp-dark focus:ring-2 focus:ring-tbp-orange/20 transition-all appearance-none font-medium"
            >
              <option value="">Alege clientul...</option>
              {clients.map(client => (
                <option key={client} value={client}>{client}</option>
              ))}
            </select>
          </div>

          {/* Status Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
              Status General <span className="text-tbp-orange">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setStatus('on-track')}
                className={`py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                  status === 'on-track' 
                    ? 'bg-status-green text-white shadow-lg shadow-status-green/30' 
                    : 'bg-surface text-gray-500 hover:bg-gray-100'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                On Track
              </button>
              <button
                type="button"
                onClick={() => setStatus('warning')}
                className={`py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                  status === 'warning' 
                    ? 'bg-status-yellow text-white shadow-lg shadow-status-yellow/30' 
                    : 'bg-surface text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Clock className="w-5 h-5" />
                Atenție
              </button>
              <button
                type="button"
                onClick={() => setStatus('blocked')}
                className={`py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                  status === 'blocked' 
                    ? 'bg-status-red text-white shadow-lg shadow-status-red/30' 
                    : 'bg-surface text-gray-500 hover:bg-gray-100'
                }`}
              >
                <AlertCircle className="w-5 h-5" />
                Blocat
              </button>
            </div>
          </div>

          {/* What was completed */}
          <div className="space-y-3">
            <label htmlFor="completed" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
              Ce s-a realizat / completat <span className="text-tbp-orange">*</span>
            </label>
            <textarea
              id="completed"
              name="completed"
              required
              rows={4}
              placeholder="Ex: Calendar editorial finalizat, producție carusele, setare campanii Ads..."
              className="w-full bg-surface border-0 rounded-2xl px-5 py-4 text-tbp-dark focus:ring-2 focus:ring-tbp-orange/20 transition-all resize-none"
            ></textarea>
          </div>

          {/* Next steps & Blockers (Combined for simplicity) */}
          <div className="space-y-3">
            <label htmlFor="nextSteps" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
              Următorii pași & De ce ai nevoie (Opțional)
            </label>
            <textarea
              id="nextSteps"
              name="nextSteps"
              rows={3}
              placeholder="Ex: Săptămâna viitoare lansăm campania. Am nevoie de aprobare pe buget de la client."
              className="w-full bg-surface border-0 rounded-2xl px-5 py-4 text-tbp-dark focus:ring-2 focus:ring-tbp-orange/20 transition-all resize-none"
            ></textarea>
          </div>

          {/* Notify Owner Toggle */}
          <div className="flex items-center gap-3 p-4 bg-orange-50/50 border border-orange-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setNotifyOwner(!notifyOwner)}
              className={`w-12 h-6 rounded-full transition-colors relative ${notifyOwner ? 'bg-tbp-orange' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${notifyOwner ? 'left-7' : 'left-1'}`} />
            </button>
            <div>
              <h4 className="text-sm font-bold text-tbp-dark flex items-center gap-2">
                Notifică Owner-ul <Bell className={`w-4 h-4 ${notifyOwner ? 'text-tbp-orange' : 'text-gray-400'}`} />
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">Bifează dacă ai nevoie de aprobare sau intervenție urgentă.</p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">Acest update va fi vizibil pe Dashboard.</p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-tbp-orange hover:bg-tbp-orange-hover text-white px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-glow-orange"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              {isSubmitting ? 'Se trimite...' : 'Salvează Update'}
            </button>
          </div>
        </form>
      </div>

      {/* Persistent Toast Notification */}
      {isSuccess && (
        <div className="fixed bottom-8 right-8 bg-tbp-dark text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-slide-up z-50">
          <div className="w-10 h-10 bg-status-green/20 rounded-full flex items-center justify-center text-status-green shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Update trimis cu succes!</h4>
            <p className="text-xs text-gray-400">Echipa a fost notificată.</p>
          </div>
          <button 
            onClick={() => setIsSuccess(false)}
            className="ml-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
