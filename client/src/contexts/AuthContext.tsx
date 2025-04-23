import React, { createContext, useState, useEffect, useContext } from 'react';
import axios, { AxiosResponse } from 'axios';
import { API_URL } from '../config';

interface User {
  _id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  theme?: 'light' | 'dark' | 'system';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AxiosResponse<any, any> | undefined>;
  register: (email: string, username: string, password: string) => Promise<AxiosResponse<any, any> | undefined>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => undefined,
  register: async () => undefined,
  logout: () => {},
  clearError: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Проверяем токен при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          // Настраиваем axios с токеном
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Получаем данные пользователя
          const response = await axios.get(`${API_URL}/api/auth/me`);
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Ошибка аутентификации:', error);
          // Если токен недействителен, удаляем его
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [token]);

  // Функция для входа
  const login = async (email: string, password: string): Promise<AxiosResponse<any, any> | undefined> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });
      
      const { token: newToken, user: userData } = response.data;
      
      // Сохраняем токен в localStorage
      localStorage.setItem('token', newToken);
      
      // Настраиваем axios с новым токеном
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
      return response;
    } catch (error: any) {
      console.error('Ошибка входа:', error);
      setError(error.response?.data?.error || 'Ошибка при входе');
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для регистрации
  const register = async (email: string, username: string, password: string): Promise<AxiosResponse<any, any> | undefined> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        username,
        password
      });
      
      const { token: newToken, user: userData } = response.data;
      
      // Сохраняем токен в localStorage
      localStorage.setItem('token', newToken);
      
      // Настраиваем axios с новым токеном
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
      return response;
    } catch (error: any) {
      console.error('Ошибка регистрации:', error);
      setError(error.response?.data?.error || 'Ошибка при регистрации');
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для выхода
  const logout = () => {
    // Удаляем токен из localStorage
    localStorage.removeItem('token');
    
    // Удаляем токен из заголовков axios
    delete axios.defaults.headers.common['Authorization'];
    
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // Функция для очистки ошибок
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 