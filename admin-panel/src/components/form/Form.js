import React from 'react';
import Select from 'react-select';
import { Comments } from '../comments/Comments';
import { formatDateTime } from '../../utils/transform';
import "./Form.css"

export const Form = ({
  selectedForm,
  setSelectedForm,
  onUpdatePunishment,
  pendingForms,
  handleMergeWithPending,
  handleUnMergeWithPending,
  createNewComment,
  handleDeleteForm
}) => {
  if (!selectedForm) return null;

  return (
    <div className="modal-content" onClick={e => e.stopPropagation()}>
      <button
        className="modal-close"
        onClick={() => {
          onUpdatePunishment(selectedForm.id, selectedForm.punishment);
          setSelectedForm(null);
        }}
      >
        ×
      </button>

      <div className="modal-header">
        <h2>פרטי טופס</h2>
      </div>

      <div className="form-details">
        <div className="original-form-section">
            <div className="names">
                <div className="hanich-tag form-details-tag">{selectedForm.name}</div>
                <div className="commander-tag form-details-tag">{selectedForm.commander}</div>
            </div>
            <p className="form-detail"><strong>אירוע: </strong> {selectedForm.eventDescription}</p>
            <p className="form-detail"><strong>נזק: </strong> {selectedForm.damage}</p>
            <p className="form-detail"><strong>מניעה: </strong> {selectedForm.prevention}</p>
            <p className="form-detail"><strong>תאריך שדווח: </strong> {formatDateTime(selectedForm.requestDateTime)}</p>
            <p className="form-detail-date"> {formatDateTime(selectedForm.date)}</p>
        </div>
        

        <div className="punishment-section">
          <h3>עונש</h3>
          <textarea
            value={selectedForm.punishment || ''}
            onChange={(e) => {
              const newValue = e.target.value;
              setSelectedForm(prev => ({
                ...prev,
                punishment: newValue
              }));
            }}
            placeholder="הכנס עונש..."
            className="form-textarea"
          />
        </div>

        <div className="pending-form-connection-section">
          <h3>התאמה ל"ממתין להגשה"</h3>
          {selectedForm.connectedPendingForm ? (
            <div key={selectedForm.connectedPendingForm.id} className="pending-form-card">
              <div className="pending-form-content">
                <div className="pending-form-name">{selectedForm.connectedPendingForm.name}</div>
                <div className="pending-form-commander">{selectedForm.connectedPendingForm.commander}</div>
                <div className="pending-form-event">{selectedForm.connectedPendingForm.eventDescription}</div>
                <div className="pending-form-time">{formatDateTime(selectedForm.connectedPendingForm.createdAt)}</div>
              </div>
              <button className="delete-btn" onClick={handleUnMergeWithPending}>
                ×
              </button>
            </div>
          ) : (
            <div className="pending-form-selection">
              <Select
                onChange={handleMergeWithPending}
                options={pendingForms.map(pendingForm => ({
                  value: pendingForm.id,
                  label: (
                    <div key={pendingForm.id} className="pending-form-card">
                      <div className="pending-form-content">
                        <div className="pending-form-name">{pendingForm.name}</div>
                        <div className="pending-form-commander">{pendingForm.commander}</div>
                        <div className="pending-form-event">{pendingForm.eventDescription}</div>
                        <div className="pending-form-time">{formatDateTime(pendingForm.createdAt)}</div>
                      </div>
                    </div>
                  )
                }))}
                formatOptionLabel={(option) => option.label}
              />
            </div>
          )}
        </div>

        <Comments comments={selectedForm.comments} createNewComment={createNewComment} />

        <div className="delete-form-section">
          <button
            className="delete-form-btn"
            onClick={() => {
              handleDeleteForm(selectedForm.id);
              setSelectedForm(null);
            }}
          >
            מחק טופס
          </button>
        </div>
      </div>
    </div>
  );
};
