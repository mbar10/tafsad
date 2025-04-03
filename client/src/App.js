import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Form from './components/Form';

function App() {
  const [forms, setForms] = useState([]);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/forms', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch forms');
      }
      const data = await response.json();
      setForms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching forms:', error);
      setError('Failed to load forms');
      setForms([]);
    }
  };

  const showSuccessToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>מילוי טופס דיווח</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={
              <>
                <Form onFormSubmit={fetchForms} onSuccess={() => showSuccessToast('הטופס נשלח בהצלחה!')} />
                {showToast && (
                  <div className="toast">
                    {toastMessage}
                  </div>
                )}
              </>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 