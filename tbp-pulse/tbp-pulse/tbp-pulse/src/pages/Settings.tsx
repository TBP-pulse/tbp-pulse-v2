import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Bell, Palette, Shield, Save, CheckCircle2, Mail, Smartphone } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Mock state for toggles
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    emailUpdates: false,
    pushMentions: true,
    pushReports: true,
  });

  const handleSave = () => {
    setIsSaving(true);
    setSaved(false);
    // Simulăm o salvare în baza de date
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 800);
  };

  const tabs = [
    { id: 'profile', label: 'Profilul Meu', icon: User },
    { id: 'notifications', label: 'Notificări', icon: Bell },
    { id: 'appearance', label: 'Aspect & Temă', icon: Palette },
    ...(user?.role === 'owner' ? [{ id: 'security', label: 'Securitate & Admin', icon: Shield }] : []),
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-display tracking-wide text-tbp-dark">Setări</h1>
          <p className="text-sm text-gray-500 mt-1">Gestionează-ți profilul și preferințele aplicației.</p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
            saved 
              ? 'bg-status-green text-white' 
              : 'bg-tbp-dark text-white hover:bg-tbp-orange'
          }`}
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? 'Salvat cu succes!' : 'Salvează Modificările'}
        </button>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Setări */}
        <div className="w-full lg:w-64 shrink-0 space-y-2 section-reveal">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                  isActive 
                    ? 'bg-white text-tbp-dark shadow-sm border border-gray-100' 
                    : 'text-gray-500 hover:bg-white/50 hover:text-tbp-dark'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-tbp-orange' : 'text-gray-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Conținut Setări */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 p-8 section-reveal">
          
          {/* TAB: PROFIL */}
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl font-display text-tbp-dark mb-1">Informații Personale</h2>
                <p className="text-sm text-gray-500">Actualizează datele contului tău.</p>
              </div>

              <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-md ${user?.color || 'bg-gradient-to-br from-tbp-orange to-tbp-orange-hover text-white'}`}>
                  {user?.initials}
                </div>
                <div>
                  <button className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-tbp-dark text-sm font-bold rounded-xl transition-colors border border-gray-200">
                    Schimbă Avatarul
                  </button>
                  <p className="text-xs text-gray-400 mt-2">JPG, GIF sau PNG. Max 2MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nume Complet</label>
                  <input 
                    type="text" 
                    defaultValue={user?.full_name}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-tbp-orange focus:ring-2 focus:ring-tbp-orange/20 outline-none transition-all text-sm font-medium text-tbp-dark"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Adresă Email</label>
                  <input 
                    type="email" 
                    defaultValue={user?.email}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none text-sm font-medium text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Email-ul nu poate fi modificat.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rol</label>
                  <input 
                    type="text" 
                    defaultValue={user?.role === 'owner' ? 'Administrator (Owner)' : 'Colaborator'}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 outline-none text-sm font-medium text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: NOTIFICĂRI */}
          {activeTab === 'notifications' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl font-display text-tbp-dark mb-1">Preferințe Notificări</h2>
                <p className="text-sm text-gray-500">Alege cum și când vrei să fii contactat.</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start justify-between p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="flex gap-4">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-tbp-dark">Alerte Critice (Email)</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Primești email imediat când apare o alertă roșie pe proiectele tale.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={notifications.emailAlerts} onChange={() => setNotifications(p => ({...p, emailAlerts: !p.emailAlerts}))} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tbp-orange"></div>
                  </label>
                </div>

                <div className="flex items-start justify-between p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="flex gap-4">
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-tbp-dark">Mențiuni în Update-uri</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Notificare în aplicație când cineva te menționează într-un update.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={notifications.pushMentions} onChange={() => setNotifications(p => ({...p, pushMentions: !p.pushMentions}))} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tbp-orange"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ASPECT */}
          {activeTab === 'appearance' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl font-display text-tbp-dark mb-1">Aspect & Temă</h2>
                <p className="text-sm text-gray-500">Personalizează interfața TBP Pulse.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="p-4 rounded-2xl border-2 border-tbp-orange bg-orange-50/50 text-left transition-all">
                  <div className="w-full h-24 bg-white rounded-xl border border-gray-200 mb-3 shadow-sm flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">☀️</div>
                  </div>
                  <h4 className="text-sm font-bold text-tbp-dark">Luminos (Light)</h4>
                  <p className="text-xs text-gray-500 mt-1">Tema implicită.</p>
                </button>

                <button className="p-4 rounded-2xl border-2 border-transparent hover:border-gray-200 bg-gray-50 text-left transition-all opacity-50 cursor-not-allowed" title="În curând">
                  <div className="w-full h-24 bg-gray-900 rounded-xl border border-gray-800 mb-3 shadow-sm flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center">🌙</div>
                  </div>
                  <h4 className="text-sm font-bold text-gray-500">Întunecat (Dark)</h4>
                  <p className="text-xs text-gray-400 mt-1">În curând.</p>
                </button>
              </div>
            </div>
          )}

          {/* TAB: SECURITATE (Doar Owner) */}
          {activeTab === 'security' && user?.role === 'owner' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl font-display text-tbp-dark mb-1">Securitate & Administrare</h2>
                <p className="text-sm text-gray-500">Setări avansate pentru agenție.</p>
              </div>

              <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
                <h4 className="text-sm font-bold text-red-700 mb-2">Zonă Periculoasă</h4>
                <p className="text-xs text-red-600 mb-4">Acțiunile de aici sunt ireversibile și afectează întreaga agenție.</p>
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
                  Arhivează toate proiectele finalizate
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
