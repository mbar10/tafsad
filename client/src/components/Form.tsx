import React, { useState } from 'react';
import { FormData } from '../types';
import './Form.css';

const Form: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    id: '',
    commander: '',
    occurrence: '',
    damage: '',
    prevention: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('http://localhost:5000/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          id: '',
          commander: '',
          occurrence: '',
          damage: '',
          prevention: '',
          date: new Date().toISOString().split('T')[0]
        });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="form">
        <h2>טופס דיווח אירוע</h2>
        {submitStatus === 'success' && (
          <div className="success-message">הטופס נשלח בהצלחה!</div>
        )}
        {submitStatus === 'error' && (
          <div className="error-message">אירעה שגיאה בשליחת הטופס. אנא נסה שוב.</div>
        )}
        <div className="form-group">
          <label htmlFor="name">שם:</label>
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
          <label htmlFor="commander">מפקד שביקש:</label>
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
          <label htmlFor="occurrence">תיאור האירוע:</label>
          <textarea
            id="occurrence"
            name="occurrence"
            value={formData.occurrence}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="damage">תיאור הנזק:</label>
          <textarea
            id="damage"
            name="damage"
            value={formData.damage}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="prevention">אמצעי מניעה:</label>
          <textarea
            id="prevention"
            name="prevention"
            value={formData.prevention}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="date">תאריך:</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'שולח...' : 'שלח'}
        </button>
      </form>
    </div>
  );
};

export default Form; 