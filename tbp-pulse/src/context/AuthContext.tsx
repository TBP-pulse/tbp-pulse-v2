import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type User = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  initials: string;
  color: string;
};

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('Session error:', error.message);
        supabase.auth.signOut().catch(() => {});
        setIsLoading(false);
        return;
      }
      if (session?.user) {
        handleUserSession(session.user);
      } else {
        setIsLoading(false);
      }
    }).catch(err => {
      console.warn('Session error catch:', err);
      supabase.auth.signOut().catch(() => {});
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleUserSession(session.user);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserSession = (supabaseUser: any) => {
    const email = supabaseUser.email || '';
    
    // Mock user profile data based on email for now, 
    // ideally this would come from a 'profiles' table in Supabase
    const users: Record<string, any> = {
      'rozalia@thebigpixel.ro': { full_name: 'Rozalia Marinescu', role: 'owner', initials: 'RM', color: 'bg-orange-100 text-orange-700' },
      'rozalia.marinescu@thebigpixel.ro': { full_name: 'Rozalia Marinescu', role: 'owner', initials: 'RM', color: 'bg-orange-100 text-orange-700' },
      'rozaliamarinescu33@gmail.com': { full_name: 'Rozalia Marinescu', role: 'owner', initials: 'RM', color: 'bg-orange-100 text-orange-700' },
      'andreea@thebigpixel.ro': { full_name: 'Andreea Sîrbu', role: 'member', initials: 'AS', color: 'bg-pink-100 text-pink-700' },
      'aurora@thebigpixel.ro': { full_name: 'Aurora Roventa', role: 'member', initials: 'AR', color: 'bg-purple-100 text-purple-700' },
      'gabi@thebigpixel.ro': { full_name: 'Gabi Buliga', role: 'member', initials: 'GB', color: 'bg-blue-100 text-blue-700' },
      'radu@thebigpixel.ro': { full_name: 'Radu Podaru', role: 'member', initials: 'RP', color: 'bg-emerald-100 text-emerald-700' },
    };
    
    const defaultProfile = { 
      full_name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1), 
      role: 'member', 
      initials: email.substring(0, 2).toUpperCase(), 
      color: 'bg-gray-100 text-gray-700' 
    };
    
    const profile = users[email.toLowerCase()] || defaultProfile;

    setUser({
      id: supabaseUser.id,
      email: email,
      ...profile
    });
    setIsLoading(false);
  };

  const login = async (email: string, password?: string) => {
    if (password) {
      // Login cu parolă
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } else {
      // Fallback la Magic Link dacă nu e parolă
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
    } else {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
