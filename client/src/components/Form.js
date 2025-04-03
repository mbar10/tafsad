import React, { useState } from 'react';
import './Form.css';

function Form({ onFormSubmit, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    id: '',
    commander: '',
    occurrence: '',
    damage: '',
    prevention: '',
    date: new Date().toISOString().split('T')[0],
    requestDateTime: new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })
      .replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2})/, '$3-$2-$1T$4:$5')
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setFormData({
          name: '',
          id: '',
          commander: '',
          occurrence: '',
          damage: '',
          prevention: '',
          date: new Date().toISOString().split('T')[0],
          requestDateTime: new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })
            .replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2})/, '$3-$2-$1T$4:$5')
        });
        onFormSubmit();
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="form-group">
        <label htmlFor="name">שם מלא:</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="id">תעודת זהות:</label>
        <input
          type="text"
          id="id"
          name="id"
          value={formData.id}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="commander">מי המפקד/ת שביקש/ה ממך להגיש טופס דיווח:</label>
        <input
          type="text"
          id="commander"
          name="commander"
          value={formData.commander}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="requestDateTime">מתי התבקשת להגיש טופס דיווח?</label>
        <input
          type="datetime-local"
          id="requestDateTime"
          name="requestDateTime"
          value={formData.requestDateTime}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="occurrence">תיאור האירוע (פרט/י והצמד/י לעובדות):</label>
        <textarea
          id="occurrence"
          name="occurrence"
          value={formData.occurrence}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="damage">הנזק/ פוטנציאל הנזק:</label>
        <textarea
          id="damage"
          name="damage"
          value={formData.damage}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="prevention">איך ניתן להמנע מהמקרה להבא:</label>
        <textarea
          id="prevention"
          name="prevention"
          value={formData.prevention}
          onChange={handleChange}
          required
        />
      </div>
      <button type="submit">שלח טופס</button>
    </form>
  );
}

export default Form; 