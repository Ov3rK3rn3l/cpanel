import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

const AuthProviderContent = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const sessionChecked = useRef(false);

  const handleAuthError = useCallback((error, silent = false) => {
    if (error && error.message.toLowerCase().includes("invalid refresh token")) {
      if (!silent) {
        toast({
          title: "Sessão Expirada",
          description: "Sua sessão expirou. Por favor, faça login novamente.",
          variant: "destructive",
        });
      }
      supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
      if(window.location.pathname !== '/login') {
          navigate('/login', { replace: true });
      }
    }
  }, [toast, navigate]);

  const fetchUserRole = useCallback(async (userId) => {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data?.role || 'member';
    } catch (e) {
      console.error("Exception fetching user role:", e.message);
      handleAuthError(e);
      return 'member';
    }
  }, [handleAuthError]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      handleAuthError(error);
      setLoading(false);
      throw error;
    }
    
    if (data.user) {
        setUser(data.user);
        const role = await fetchUserRole(data.user.id);
        setUserRole(role);
    }
    setLoading(false);
    return data;
  }, [handleAuthError, fetchUserRole]);

  const logout = useCallback(async (options = {}) => {
    const { silent = false } = options;
    const { error } = await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    sessionChecked.current = false;
    
    if (error) {
      toast({
        title: "Erro ao Sair",
        description: error.message,
        variant: "destructive",
      });
    } else {
      if (!silent) {
        toast({
          title: "Logout realizado",
          description: "Você foi desconectado com sucesso.",
        });
      }
    }
    navigate('/', { replace: true });
  }, [toast, navigate]);

  useEffect(() => {
    const checkSession = async () => {
      if (sessionChecked.current) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        handleAuthError(error, true);
      } else if (session) {
        setUser(session.user);
        const role = await fetchUserRole(session.user.id);
        setUserRole(role);
      } else {
        setUser(null);
        setUserRole(null);
      }
      
      setLoading(false);
      sessionChecked.current = true;
    };

    checkSession();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
           setUser(null);
           setUserRole(null);
           sessionChecked.current = false;
           navigate('/login', { replace: true });
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
           if(session){
              setUser(session.user);
              if(user?.id !== session.user.id){
                const role = await fetchUserRole(session.user.id);
                setUserRole(role);
              }
           }
        }
      }
    );
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [fetchUserRole, handleAuthError, navigate, user]);

  const contextValue = {
    user,
    setUser,
    userRole,
    loading,
    login,
    logout,
    supabase,
    setUserRole
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider = ({ children }) => {
  return <AuthProviderContent>{children}</AuthProviderContent>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};