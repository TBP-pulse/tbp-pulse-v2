import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import { LayoutDashboard, Target, Bell, Settings, Users, PlusCircle, LogOut, Calendar, FileText, Layers, MessageSquare, Inbox, Wallet } from 'lucide-react';
import BrandLogo from './BrandLogo';

const ownerNav = [
  { href: '/alerts', label: 'Alerte', icon: Bell, hasCount: true },
  { href: '/settings', label: 'Setări', icon: Settings },
];

export default function Sidebar({ user }: { user: any }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { alerts } = useAlerts();
  
  const myAlerts = user?.role === 'owner' ? alerts : alerts.filter(a => a.assigneeInitials === user?.initials || a.assigneeInitials === 'All' || a.assignee === user?.full_name);
  
  const alertCount = myAlerts.filter(a => !a.isResolved && a.errorCode !== 'DM').length;
  
  const [hasNewUpdates, setHasNewUpdates] = useState(true);

  const isOwner = user?.role === 'owner';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(href);
  };

  const mainNav = isOwner ? [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/tasks', label: 'Toate Task-urile', icon: Calendar },
    { href: '/docs', label: 'Documente & Notițe', icon: FileText },
    { href: '/activities', label: 'Activitate Dashboard', icon: Target },
    { href: '/team', label: 'Echipa', icon: Users },
  ] : [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/tasks', label: 'Task-urile Mele', icon: Calendar },
    { href: '/docs', label: user?.initials === 'GB' ? 'Resurse & Materiale' : 'Documente & Notițe', icon: user?.initials === 'GB' ? Layers : FileText },
    { href: '/activities', label: 'Progresul Meu', icon: Target },
  ];

  const renderNavItem = (item: any) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    
    // Dacă dăm click pe Nou Update, putem ascunde punctul roșu
    const handleClick = () => {
      if (item.href === '/updates/new') {
        setHasNewUpdates(false);
      }
    };

    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={handleClick}
        className={`group flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all relative ${
          active
            ? 'bg-tbp-orange/10 text-tbp-orange'
            : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
        }`}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-tbp-orange rounded-r-full" />
        )}
        <Icon
          className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
            active ? 'text-tbp-orange' : 'text-white/30 group-hover:text-white/50'
          }`}
          strokeWidth={active ? 2 : 1.5}
        />
        <span className="flex-1">{item.label}</span>
        
        {/* Punct roșu pentru notificări noi */}
        {item.hasDot && hasNewUpdates && (
          <span className="w-2 h-2 rounded-full bg-status-red status-pulse mr-1"></span>
        )}

        {/* Badge cu număr pentru alerte custom */}
        {item.count !== undefined && item.count > 0 && (
          <span
            className={`text-[10px] font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5 ${
              item.count > 3 ? 'bg-status-red text-white urgency-ring' : 'bg-status-red/20 text-status-red'
            }`}
          >
            {item.count}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className="w-[240px] bg-tbp-dark min-h-screen flex flex-col flex-shrink-0 sticky top-0 h-screen border-r border-white/[0.04]">
      <div className="px-6 pt-6 pb-8">
        <Link to="/dashboard" className="flex items-center h-10">
          <BrandLogo variant="light" className="h-full" />
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        <div className="mb-1 px-4">
          <span className="text-[9px] font-semibold text-white/15 tracking-[0.15em] uppercase">Principal</span>
        </div>
        {mainNav.map(renderNavItem)}

        <div className="pt-6 pb-1 px-4">
          <span className="text-[9px] font-semibold text-white/15 tracking-[0.15em] uppercase">Notification Center</span>
        </div>
        {renderNavItem({ href: '/alerts', label: isOwner ? 'Alerte Sistem' : 'Notificări', icon: Bell, count: alertCount })}
        
        <div className="pt-6 pb-1 px-4">
          <span className="text-[9px] font-semibold text-white/15 tracking-[0.15em] uppercase">Cont & Setări</span>
        </div>
        {renderNavItem({ href: '/settings', label: 'Setări', icon: Settings })}
      </nav>

      <div className="mx-3 mb-4">
        <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm ${user?.color || 'bg-gradient-to-br from-tbp-orange to-tbp-orange-hover text-white'}`}>
              {user?.initials || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-white font-semibold truncate">{user?.full_name || 'User'}</p>
              <p className="text-[10px] text-white/25 font-mono truncate">
                {user?.role === 'owner' ? 'Owner' : 'Colaborator'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-[11px] text-white/25 hover:text-white/50 text-left transition-colors flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            Deconectare
          </button>
        </div>
      </div>
    </aside>
  );
}

