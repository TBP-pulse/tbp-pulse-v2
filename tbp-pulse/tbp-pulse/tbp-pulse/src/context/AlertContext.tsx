import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export type Severity = 'critical' | 'warning' | 'info';

export interface Alert {
  id: string;
  title: string;
  description: string;
  client: string;
  assignee: string;
  assigneeInitials: string;
  assigneeColor: string;
  createdAt: string;
  errorCode: string;
  severity: Severity;
  isResolved: boolean;
  resolvedAt?: string;
  resolutionNote?: string;
  readAt?: string;
  archivedAt?: string;
}

interface AlertContextType {
  alerts: Alert[];
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt' | 'isResolved'>) => Promise<void>;
  resolveAlert: (id: string, note?: string) => Promise<void>;
  archiveAlert: (id: string) => Promise<void>;
  isLoading: boolean;
}

const AlertContext = createContext<AlertContextType | null>(null);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('tbp_alerts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tbp_alerts' }, () => {
        fetchAlerts();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('tbp_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
          console.warn('Tabelul tbp_alerts lipsește din Supabase. Rulează full_migration.sql.');
          setAlerts([]);
          return;
        }
        throw error;
      }

      if (data) {
        const formattedAlerts: Alert[] = data.map(item => ({
          id: item.id.toString(),
          title: item.title,
          description: item.description,
          client: item.client,
          assignee: item.assignee,
          assigneeInitials: item.assignee_initials,
          assigneeColor: item.assignee_color,
          createdAt: item.created_at,
          errorCode: item.error_code,
          severity: item.severity as Severity,
          isResolved: item.is_resolved,
          resolvedAt: item.resolved_at,
          resolutionNote: item.resolution_note,
          readAt: item.read_at || (item.is_resolved ? item.resolved_at : null),
          archivedAt: item.archived_at
        }));
        setAlerts(formattedAlerts);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addAlert = async (newAlertData: Omit<Alert, 'id' | 'createdAt' | 'isResolved'>) => {
    try {
      const { error } = await supabase.from('tbp_alerts').insert([{
        title: newAlertData.title,
        description: newAlertData.description,
        client: newAlertData.client,
        assignee: newAlertData.assignee,
        assignee_initials: newAlertData.assigneeInitials,
        assignee_color: newAlertData.assigneeColor,
        error_code: newAlertData.errorCode,
        severity: newAlertData.severity,
        is_resolved: false
      }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error adding alert:', error);
    }
  };

  const resolveAlert = async (id: string, note?: string) => {
    try {
      const { error } = await supabase
        .from('tbp_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          read_at: new Date().toISOString(),
          resolution_note: note || null
        })
        .eq('id', parseInt(id));

      if (error) throw error;
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const archiveAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tbp_alerts')
        .update({
          archived_at: new Date().toISOString()
        })
        .eq('id', parseInt(id));

      if (error) throw error;
    } catch (error) {
      console.error('Error archiving alert:', error);
    }
  };

  return (
    <AlertContext.Provider value={{ alerts, addAlert, resolveAlert, archiveAlert, isLoading }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlerts must be used within AlertProvider');
  return context;
};