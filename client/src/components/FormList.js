import React from 'react';
import './FormList.css';

function FormList({ forms = [] }) {
  if (!Array.isArray(forms)) {
    return (
      <div className="form-list">
        <h2>טפסים שהוגשו</h2>
        <p>אין טפסים זמינים</p>
      </div>
    );
  }

  return (
    <div className="form-list">
      <h2>טפסים שהוגשו</h2>
      {forms.length === 0 ? (
        <p>אין טפסים שהוגשו עדיין</p>
      ) : (
        <div className="forms-grid">
          {forms.map((form) => (
            <div key={form._id} className="form-card">
              <h3>{form.name}</h3>
              <p><strong>תעודת זהות:</strong> {form.id}</p>
              <p><strong>תיאור האירוע:</strong> {form.occurrence}</p>
              <p><strong>תיאור הנזק:</strong> {form.damage}</p>
              <p><strong>אמצעי מניעה:</strong> {form.prevention}</p>
              <p className="form-date">
                {new Date(form.createdAt).toLocaleDateString('he-IL')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FormList; 