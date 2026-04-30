import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CopyButton from '../components/CopyButton';
import { AlertOctagon, AlertTriangle, Info, Clock, CheckCircle2, ShieldCheck, MessageSquare, ArrowUpRight } from 'lucide-react';
import { useAlerts, Severity } from '../context/AlertContext';

export default function Alerts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { alerts, resolveAlert } = useAlerts();
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const handleResolve = (id: string) => {
    resolveAlert(id, resolutionNote);
    setResolvingId(null);
    setResolutionNote('');
  };

  const userAlerts = user?.role === 'owner' ? alerts : alerts.filter(a => a.assigneeInitials === user?.initials || a.assigneeInitials === 'All' || a.assignee === user?.full_name);
  const systemAlerts = userAlerts.filter(a => a.errorCode !== 'DM');
  
  const filteredAlerts = systemAlerts.filter(a => activeTab === 'active' ? !a.isResolved : a.isResolved);
  const activeCount = systemAlerts.filter(a => !a.isResolved).length;

  const getSeverityStyles = (severity: Severity) => {
    switch (severity) {
      case 'critical': return { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-600', icon: AlertOctagon, badge: 'bg-red-100 text-red-700' };
      case 'warning': return { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600', icon: AlertTriangle, badge: 'bg-amber-100 text-amber-700' };
      case 'info': return { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', icon: Info, badge: 'bg-blue-100 text-blue-700' };
    }
  };

  const handleAction = (alert: any) => {
    if (alert.errorCode.startsWith('TASK:')) {
      navigate('/tasks'); // For now navigate to all tasks, but ideally it could deep link
    } else if (alert.errorCode === 'DM') {
      navigate('/messages');
    }
  };

  const isOwner = user?.role === 'owner';

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-display tracking-wide text-tbp-dark">{isOwner ? 'Alerte Sistem' : 'Notificări'}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isOwner ? 'Gestionează notificările sistemului și activitatea generală.' : 'Aici vezi tot ce este nou și important pentru tine.'}
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex p-1 bg-white rounded-xl shadow-sm border border-gray-100">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'active' 
                ? 'bg-tbp-dark text-white shadow-md' 
                : 'text-gray-500 hover:text-tbp-dark hover:bg-gray-50'
            }`}
          >
            Active
            {activeCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'active' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'}`}>
                {activeCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'resolved' 
                ? 'bg-tbp-dark text-white shadow-md' 
                : 'text-gray-500 hover:text-tbp-dark hover:bg-gray-50'
            }`}
          >
            Rezolvate
          </button>
        </div>
      </header>

      <div className="space-y-4">
        {filteredAlerts.map((alert, idx) => {
          const styles = getSeverityStyles(alert.severity);
          const Icon = styles.icon;

          return (
            <div 
              key={alert.id} 
              className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 section-reveal relative overflow-hidden group transition-all duration-300 hover:shadow-md`} 
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              {/* Left color accent */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${styles.bg} group-hover:w-2 transition-all`}></div>

              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pl-2">
                <div className="flex items-start gap-5">
                  <div className={`p-3.5 rounded-2xl shrink-0 ${styles.bg} ${styles.border} border`}>
                    <Icon className={`w-6 h-6 ${styles.text}`} />
                  </div>
                  
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-tbp-dark">{alert.title}</h3>
                      <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-tbp-dark text-[10px] font-bold uppercase tracking-wider">
                        {alert.client}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${styles.badge}`}>
                        {alert.severity}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 max-w-2xl leading-relaxed">{alert.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4">
                      {alert.errorCode && !alert.isResolved && (
                        <button 
                          onClick={() => handleAction(alert)}
                          className="flex items-center gap-1.5 text-xs font-bold text-tbp-orange hover:text-orange-600 transition-colors"
                        >
                          Vezi Detalii <ArrowUpRight className="w-3 h-3" />
                        </button>
                      )}

                      <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                        <span># {alert.errorCode}</span>
                        <CopyButton text={alert.errorCode} />
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>
                          {new Date(alert.createdAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {alert.isResolved && alert.resolvedAt && (
                        <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1.5 rounded-lg">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            Rezolvat la: {new Date(alert.resolvedAt).toLocaleDateString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Resolution Note Display */}
                    {alert.isResolved && alert.resolutionNote && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
                        <MessageSquare className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Notă Rezolvare</span>
                          <p className="text-sm text-gray-700 italic">"{alert.resolutionNote}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end justify-between gap-4 shrink-0">
                  {/* Assignee */}
                  <div className="flex items-center gap-2" title={`Responsabil: ${alert.assignee}`}>
                    <span className="text-xs font-semibold text-gray-400">Responsabil</span>
                    <div className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold shadow-sm ${alert.assigneeColor}`}>
                      {alert.assigneeInitials}
                    </div>
                  </div>

                  {/* Action Button */}
                  {!alert.isResolved && (
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {resolvingId === alert.id ? (
                        <div className="w-full min-w-[240px] space-y-2 animate-fade-in">
                          <textarea
                            autoFocus
                            placeholder="Adaugă o notă (opțional)..."
                            value={resolutionNote}
                            onChange={(e) => setResolutionNote(e.target.value)}
                            className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-tbp-orange resize-none h-16"
                          />
                          <div className="flex gap-2 w-full">
                            <button 
                              onClick={() => setResolvingId(null)}
                              className="flex-1 py-1.5 px-3 text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                              Anulează
                            </button>
                            <button 
                              onClick={() => handleResolve(alert.id)}
                              className="flex-1 py-1.5 px-3 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors"
                            >
                              Confirmă
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setResolvingId(alert.id)}
                          className="flex items-center justify-center gap-2 text-sm font-bold text-white bg-tbp-dark hover:bg-tbp-orange px-6 py-2.5 rounded-xl transition-colors shadow-sm whitespace-nowrap"
                        >
                          Marchează Rezolvat
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredAlerts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm section-reveal">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-display text-tbp-dark mb-2">
              {activeTab === 'active' 
                ? (isOwner ? 'Nicio alertă de sistem' : 'Nu ai notificări noi') 
                : (isOwner ? 'Nicio alertă rezolvată' : 'Istoric gol')}
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              {activeTab === 'active' 
                ? (isOwner ? 'Excelent! Toate sistemele funcționează normal.' : 'Ești la zi cu totul. Savurează o cafea! ☕') 
                : 'Nu ai elemente rezolvate sau arhivate în istoric.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
