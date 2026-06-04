import { createContext, useState, useEffect } from 'react';
import { getCurrentUser, logoutAPI } from '../apiCalls';

// Create Auth Context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    let cancelled = false;

    const bootstrapAuth = async () => {
      localStorage.removeItem('user');
      const storedUser = localStorage.getItem('adminUser');

      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          if (userData.role === 'admin') {
            setUser(userData);
          }
        } catch (error) {
          localStorage.removeItem('adminUser');
        }
      }

      try {
        const serverUser = await getCurrentUser();

        if (cancelled) return;

        if (serverUser.role === 'admin') {
          setUser(serverUser);
          setIsAuthenticated(true);
          localStorage.setItem('adminUser', JSON.stringify(serverUser));
        } else {
          localStorage.removeItem('adminUser');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        if (cancelled) return;

        localStorage.removeItem('adminUser');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    bootstrapAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  // Login function
  const login = (userData) => {
    if (userData.role !== 'admin') {
      throw new Error('Access denied. Administrator privileges required.');
    }
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('adminUser', JSON.stringify(userData));
  };

  // Logout function
  const logout = async () => {
    try {
      await logoutAPI();
    } catch (error) {
      console.warn('Server logout failed; clearing local session anyway');
    }

    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('adminUser');
  };

  // Update user function
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('adminUser', JSON.stringify(userData));
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
