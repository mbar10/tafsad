import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConfig } from '../config';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [forms, setForms] = useState([]);
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
      fetchForms(token);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setForms([]);
    setLoginError('');
    // Force navigation to login page
    navigate('/', { replace: true });
  };

  const fetchForms = async (token) => {
    try {
      const { serverUrl }  = getConfig();
      const response = await fetch(`${serverUrl}/api/forms`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        const data = await response.json();
        const { serverUrl }  = getConfig();
        if (data.code === 'TOKEN_EXPIRED') {
          const refreshResponse = await fetch(`${serverUrl}/api/admin/refresh-token`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (refreshResponse.ok) {
            const { token: newToken } = await refreshResponse.json();
            localStorage.setItem('adminToken', newToken);
            // Retry the original request with new token
            return fetchForms(newToken);
          }
        }
        // If refresh failed or token is invalid, redirect to login
        handleLogout();
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setForms(data);
      } else {
        // Handle other error cases
        handleLogout();
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
      handleLogout();
    }
  };

  const handleLogin = async (username, password) => {
    try {
      setLoginError('');
      const { serverUrl }  = getConfig();
      const response = await fetch(`${serverUrl}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const { token } = await response.json();
        localStorage.setItem('adminToken', token);
        setIsAuthenticated(true);
        await fetchForms(token);
        navigate('/dashboard', { replace: true });
      } else {
        setLoginError('שם משתמש או סיסמה שגויים');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('אירעה שגיאה בהתחברות');
    }
  };

  const handleSort = (sortBy, sortOrder) => {
    const sortedForms = [...forms].sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'asc' 
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
    });
    setForms(sortedForms);
  };

  const handleUpdateColumn = async (formId, columnId) => {
    try {
      const { serverUrl }  = getConfig();
      const token = localStorage.getItem('adminToken');
      if (!token) {
        handleLogout();
        return;
      }

      const response = await fetch(`${serverUrl}/api/forms/${formId}/column`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ columnId })
      });

      if (response.status === 401) {
        const data = await response.json();
        const { serverUrl }  = getConfig();
        if (data.code === 'TOKEN_EXPIRED') {
          // Try to refresh the token
          const refreshResponse = await fetch(`${serverUrl}/api/admin/refresh-token`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (refreshResponse.ok) {
            const { token: newToken } = await refreshResponse.json();
            localStorage.setItem('adminToken', newToken);
            // Retry the original request with new token
            return handleUpdateColumn(formId, columnId);
          }
        }
        // If refresh failed or token is invalid, redirect to login
        handleLogout();
        return;
      }

      if (response.ok) {
        setForms(prevForms => 
          prevForms.map(form => 
            form.id === formId ? { ...form, columnId } : form
          )
        );
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error('Error updating column:', error);
      handleLogout();
    }
  };

  const handleUpdatePunishment = async (formId, punishment) => {
    try {
      const { serverUrl }  = getConfig();
      const token = localStorage.getItem('adminToken');
      if (!token) {
        handleLogout();
        return;
      }

      const response = await fetch(`${serverUrl}/api/forms/${formId}/punishment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ punishment })
      });

      if (response.status === 401) {
        const data = await response.json();
        if (data.code === 'TOKEN_EXPIRED') {
          // Try to refresh the token
          const refreshResponse = await fetch(`${serverUrl}/api/admin/refresh-token`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (refreshResponse.ok) {
            const { token: newToken } = await refreshResponse.json();
            localStorage.setItem('adminToken', newToken);
            // Retry the original request with new token
            return handleUpdatePunishment(formId, punishment);
          }
        }
        // If refresh failed or token is invalid, redirect to login
        handleLogout();
        return;
      }

      if (response.ok) {
        setForms(prevForms =>
          prevForms.map(form =>
            form.id === formId ? { ...form, punishment } : form
          )
        );
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error('Error updating punishment:', error);
      handleLogout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        forms,
        loginError,
        handleLogin,
        handleLogout,
        handleSort,
        handleUpdateColumn,
        handleUpdatePunishment
      }}
    >
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