import { createContext, useContext, useState } from 'react';
import apiClient from '../services/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  async function login(email, password) {
    const { data } = await apiClient.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.usuario);
    return data.usuario;
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
