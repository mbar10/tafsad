import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

  const fetchForms = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/api/forms', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setForms(data);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
    }
  };

  const handleLogin = async (username, password) => {
    try {
      setLoginError('');
      const response = await fetch('http://localhost:5000/api/admin/login', {
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
        navigate('/dashboard');
      } else {
        setLoginError('שם משתמש או סיסמה שגויים');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('אירעה שגיאה בהתחברות');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setForms([]);
    setLoginError('');
    navigate('/');
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
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/forms/${formId}/column`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ columnId })
      });

      if (response.ok) {
        setForms(prevForms => 
          prevForms.map(form => 
            form.id === formId ? { ...form, columnId } : form
          )
        );
      }
    } catch (error) {
      console.error('Error updating column:', error);
    }
  };

  const handleUpdatePunishment = async (formId, punishment) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/forms/${formId}/punishment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ punishment })
      });

      if (response.ok) {
        setForms(prevForms =>
          prevForms.map(form =>
            form.id === formId ? { ...form, punishment } : form
          )
        );
      }
    } catch (error) {
      console.error('Error updating punishment:', error);
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