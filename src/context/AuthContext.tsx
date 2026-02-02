// Auth Context - Global state management for logged-in user (Supabase-backed)
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export interface User {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  rescueArea?: string;
  experience?: string;
  role: 'volunteer' | 'admin';
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const buildUserFromProfile = (profile: any, email: string, id: string): User => {
    return {
      id,
      name: profile?.full_name || 'Volunteer',
      email,
      phone: profile?.phone || undefined,
      city: profile?.city || undefined,
      rescueArea: profile?.rescue_area || undefined,
      experience: profile?.experience || undefined,
      role: profile?.role === 'admin' ? 'admin' : 'volunteer',
    };
  };

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user;

      if (!sessionUser || !isMounted) return;

      const { data: profile } = await supabase
        .from('volunteers')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      if (isMounted) {
        setUser(buildUserFromProfile(profile, sessionUser.email || '', sessionUser.id));
      }
    };

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user;
      if (!sessionUser) {
        setUser(null);
        return;
      }

      const { data: profile } = await supabase
        .from('volunteers')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      setUser(buildUserFromProfile(profile, sessionUser.email || '', sessionUser.id));
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      throw new Error(error?.message || 'Login failed');
    }

    const { data: profile } = await supabase
      .from('volunteers')
      .select('*')
      .eq('id', data.user.id)
      .single();

    const newUser = buildUserFromProfile(profile, data.user.email || email, data.user.id);
    setUser(newUser);
    return newUser;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('volunteers')
      .update({
        full_name: updates.name ?? user.name,
        phone: updates.phone ?? user.phone,
        city: updates.city ?? user.city,
        rescue_area: updates.rescueArea ?? user.rescueArea,
        experience: updates.experience ?? user.experience,
      })
      .eq('id', user.id);

    if (error) {
      console.error('Profile update error:', error);
      throw error;
    }

    setUser({ ...user, ...updates });
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
