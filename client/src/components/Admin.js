import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FormList from './FormList';
import './Admin.css';

function Admin({ forms }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e) => {
    const { serverUrl }  = getConfig();
    e.preventDefault();
    try {
      const response = await fetch(`${serverUrl}/api/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const { token } = await response.json();
        localStorage.setItem('adminToken', token);
        setIsAuthenticated(true);
        setError('');
      } else {
        setError('סיסמה שגויה');
      }
    } catch (error) {
      setError('שגיאה בהתחברות');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    navigate('/');
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <h2>כניסה למערכת ניהול</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="password">סיסמה:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit">כניסה</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>פאנל ניהול</h2>
        <button 
          className="logout-button"
          onClick={handleLogout}
        >
          התנתק
        </button>
      </div>
      <FormList forms={forms} />
    </div>
  );
}

export default Admin; 