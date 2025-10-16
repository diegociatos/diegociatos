import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
      await fetchUserRoles(response.data.user.id);
    } catch (error) {
      console.error('Não autenticado:', error);
      setUser(null);
      setUserRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRoles = async (userId) => {
    try {
      const response = await api.get('/users/me/roles');
      console.log('Roles carregados:', response.data);
      setUserRoles(response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar roles:', error);
      setUserRoles([]);
      return [];
    }
  };

  const getUserRole = () => {
    console.log('getUserRole chamado, userRoles:', userRoles);
    if (userRoles.length === 0) return null;
    
    // Prioridade: admin > recruiter > client > candidate
    if (userRoles.some(r => r.role === 'admin')) return 'admin';
    if (userRoles.some(r => r.role === 'recruiter')) return 'recruiter';
    if (userRoles.some(r => r.role === 'client')) return 'client';
    if (userRoles.some(r => r.role === 'candidate')) return 'candidate';
    
    return userRoles[0]?.role || null;
  };

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('access_token', response.data.access_token);
    setUser(response.data.user);
    const roles = await fetchUserRoles(response.data.user.id);
    console.log('Login completo, roles:', roles);
    return response.data;
  };

  const signup = async (email, password, full_name) => {
    const response = await api.post('/auth/signup', { email, password, full_name });
    localStorage.setItem('access_token', response.data.access_token);
    setUser(response.data.user);
    await fetchUserRoles(response.data.user.id);
    return response.data;
  };

  const googleLogin = async (sessionId) => {
    const response = await api.post('/auth/google-session', { session_id: sessionId });
    setUser(response.data.user);
    await fetchUserRoles(response.data.user.id);
    return response.data;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('access_token');
    setUser(null);
    setUserRoles([]);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userRoles, 
      loading, 
      login, 
      signup, 
      googleLogin, 
      logout, 
      checkAuth,
      getUserRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
