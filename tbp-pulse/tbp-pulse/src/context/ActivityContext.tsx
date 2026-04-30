import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface Activity {
  id: string;
  time: string;
  title: string;
  desc: string;
  user: string;
  color: string;
  timestamp: number;
}

interface ActivityContextType {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'time' | 'timestamp'>) => Promise<void>;
  isLoading: boolean;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivities();

    const subscription = supabase
      .channel('activities_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => {
        fetchActivities();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedActivities: Activity[] = data.map(item => {
          const date = new Date(item.created_at);
          const isToday = new Date().toDateString() === date.toDateString();
          const timeString = `${isToday ? 'Astăzi' : date.toLocaleDateString('ro-RO')}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
          
          return {
            id: item.id.toString(),
            time: timeString,
            title: item.title,
            desc: item.description,
            user: item.user_initials,
            color: item.color,
            timestamp: date.getTime()
          };
        });
        setActivities(formattedActivities);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addActivity = async (newActivity: Omit<Activity, 'id' | 'time' | 'timestamp'>) => {
    try {
      const { error } = await supabase.from('activities').insert([{
        title: newActivity.title,
        description: newActivity.desc,
        user_initials: newActivity.user,
        color: newActivity.color
      }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  return (
    <ActivityContext.Provider value={{ activities, addActivity, isLoading }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
}
