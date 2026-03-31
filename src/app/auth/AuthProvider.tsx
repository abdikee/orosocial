import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { missingSupabaseEnvMessage, supabase } from '../lib/supabase';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (!supabase) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      signIn: async (email: string, password: string) => {
        if (!supabase) {
          throw new Error(missingSupabaseEnvMessage);
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          throw error;
        }
      },
      signUp: async (email: string, password: string, name: string) => {
        if (!supabase) {
          throw new Error(missingSupabaseEnvMessage);
        }
        const username = email.split('@')[0]?.toLowerCase() || `user_${crypto.randomUUID().slice(0, 8)}`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: name,
              username,
            },
          },
        });
        if (error) {
          throw error;
        }
      },
      signOut: async () => {
        if (!supabase) {
          throw new Error(missingSupabaseEnvMessage);
        }
        const { error } = await supabase.auth.signOut();
        if (error) {
          throw error;
        }
      },
    }),
    [loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
