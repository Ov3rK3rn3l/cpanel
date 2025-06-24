import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(() => {
    // Recupera do sessionStorage se existir
    return sessionStorage.getItem('userRole') || null;
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserRole = useCallback(async (userId) => {
    if (!userId) return null;

    // Verifica se já está em cache
    const cachedRole = sessionStorage.getItem('userRole');
    if (cachedRole) return cachedRole;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Erro ao buscar role:", error.message);
        return null;
      }

      const role = data?.role || 'member';
      sessionStorage.setItem('userRole', role); // salva para uso futuro
      return role;

    } catch (e) {
      console.error("Exceção ao buscar role:", e.message);
      return null;
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const role = await fetchUserRole(currentUser.id);
          setUserRole(role);
        } else {
          setUserRole(null);
          sessionStorage.removeItem('userRole');
        }

        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [fetchUserRole]);

  const login = useCallback(async (email, password) => {
    const { error, data: loginData } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return loginData;
  }, []);

  const logout = useCallback(async (options = {}) => {
    const { silent = false } = options;
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        title: "Erro ao Sair",
        description: error.message,
        variant: "destructive",
      });
    } else {
      sessionStorage.removeItem('userRole'); // limpa cache local
      if (!silent) {
        toast({
          title: "Logout realizado",
          description: "Você foi desconectado com sucesso.",
        });
      }
    }

    setUser(null);
    setUserRole(null);
  }, [toast]);

  // Expulsar por inatividade
  useEffect(() => {
    let inactivityTimer;

    const handleInactivity = () => {
      toast({
        title: "Sessão Expirada",
        description: "Você foi desconectado por inatividade.",
        variant: "destructive"
      });
      logout({ silent: true });
    };

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      if (user) {
        inactivityTimer = setTimeout(handleInactivity, 15 * 60 * 1000); // 15 min
      }
    };

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll'];

    if (user) {
      activityEvents.forEach(event => window.addEventListener(event, resetTimer));
      resetTimer();
    }

    return () => {
      clearTimeout(inactivityTimer);
      activityEvents.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user, logout, toast]);

  const contextValue = {
    user,
    userRole,
    loading,
    login,
    logout,
    supabase,
    setUserRole, // ainda disponível se quiser sobrescrever manualmente
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
