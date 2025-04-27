import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Select from "react-select"
import { useAuth } from '../../contexts/AuthContext';
import './Dashboard.css';
import { useExportToCsv } from '../../hooks/useExportToCsv';
import { PendingFormsEditor } from '../pendingFormEditor/PendingFormEditor';
import { formatDateTime, truncateText } from '../../utils/transform';
import { Comments } from '../comments/Comments';
import { FormFilterPopup } from '../FormFilterPopup/FormFilterPopup';

const Dashboard = ({
  onLogout,
  onUpdateColumn,
  onUpdatePunishment,
}) => {
  const { forms, columns, pendingForms, handleFormDelete, handleAddComment, handleUnmergePendingForm, handleDeletePendingForm, handleMergePendingForm } = useAuth();
  const [selectedForm, setSelectedForm] = useState(null);
  const [displayedForms, setDisplayedForms] = useState(forms);
  const [filters, setFilters] = useState([]);
  const {exportToCSV} = useExportToCsv(forms, columns);

  function getFilteredForms(forms) {
    return forms.filter(form =>
      filters.every(filter => form[filter.key] === filter.value)
    )
  }

  const filter = () => {
    const filteredForms = getFilteredForms(forms);
    setDisplayedForms(filteredForms)
  }

  useEffect(() => {
    filter()
  }, [forms, filters, filter])

  const handleMergeWithPending = async (selectedOption) => {
    const newforms = await handleMergePendingForm(selectedForm.id, selectedOption.value)
    setSelectedForm(prev => newforms.find(item => item.id === prev.id))
  }

  const handleUnMergeWithPending = async () => {
    await handleUnmergePendingForm(selectedForm.id);
    setSelectedForm(prev => ({ ...prev, connectedPendingForm: null }))
  }

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    await onUpdateColumn(draggableId, destination.droppableId);
  };

  const handleDeleteForm = async (formId) => {
      await handleFormDelete(formId)
      setSelectedForm(null);
  };

  const createNewComment = async (comment) => {
    await handleAddComment(selectedForm.id, comment);
    setSelectedForm(prev => ({
      ...prev,
      comments: [...(prev.comments || []), {text: comment, createdAt: Date.now()}]
    }));
    
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>לוח בקרה</h1>
        <div className="dashboard-actions">
        <FormFilterPopup filters={filters} setFilters={setFilters}/>
          <button className="header-button" onClick={exportToCSV}>ייצוא ל-CSV</button>
          <button className="header-button" onClick={onLogout}>התנתק</button>
        </div>

      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          <div className="kanban-column pending-column">
            <h2 className="column-title">ממתין להגשה</h2>
            <div className="pending-forms-list">
              <PendingFormsEditor/>
              {pendingForms.map(form => (
                <div key={form.id} className="pending-form-card">
                  <div className="pending-form-content">
                    <div className="pending-form-name">{form.name}</div>
                    <div className="pending-form-commander">{form.commander}</div>
                    <div className="pending-form-event">{form.eventDescription}</div>
                    <div className="pending-form-time">{formatDateTime(form.createdAt)}</div>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeletePendingForm(form.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
          {columns.map(column => (
            <div key={column.id} className="kanban-column">
              <h2 className="column-title">{column.title}</h2>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    className="column-content"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {displayedForms
                      .filter(form => form.columnId === column.id)
                      .map((form, index) => (
                        <Draggable key={form.id} draggableId={form.id} index={index}>
                          {(provided) => (
                            <div
                              className="form-card"
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setSelectedForm(form)}
                            >
                              <div className="commander-tag">{form?.connectedPendingForm?.commander || form.commander}</div>
                              <div className="hanich-tag">{form?.connectedPendingForm?.name || form.name}</div>
                              <div style={{ marginTop: "2rem" }}>
                                <p className="event-description">אירוע: {truncateText(form?.connectedPendingForm?.eventDescription || form.occurrence, 15)}</p>
                                <p className="form-date">תאריך האירוע: {formatDateTime(form.requestDateTime)}</p>
                                <p className="form-date">תאריך הדיווח: {formatDateTime(form.date)}</p>
                                {form.punishment && (
                                  <p className="punishment-preview">{form.punishment}</p>
                                )}
                                {form.comments && form.comments.length > 0 && (
                                  <div className="comment-count">{form.comments.length}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {selectedForm && (
        <div className="modal-overlay" onClick={() => {
          onUpdatePunishment(selectedForm.id, selectedForm.punishment);
          setSelectedForm(null);
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => {
              onUpdatePunishment(selectedForm.id, selectedForm.punishment);
              setSelectedForm(null);
            }}>×</button>
            <div className="modal-header">
              <h2>פרטי טופס</h2>
            </div>
            <div className="form-details">
              <p><strong>שם מלא:</strong> {selectedForm.name}</p>
              <p><strong>תיאור אירוע:</strong> {selectedForm.occurrence}</p>
              <p><strong>תאריך:</strong> {formatDateTime(selectedForm.date)}</p>
              <p><strong>מתי התבקשת להגיש טופס דיווח:</strong> {formatDateTime(selectedForm.requestDateTime)}</p>
              <p><strong>עמודה:</strong> {columns.find(col => col.id === selectedForm.columnId)?.title}</p>
              <p><strong>הנזק/ פוטנציאל הנזק:</strong> {selectedForm.damage}</p>
              <p><strong>איך ניתן להמנע מהמקרה להבא:</strong> {selectedForm.prevention}</p>
              <p><strong>מפקד:</strong> {selectedForm.commander}</p>
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
              <div className='pending-form-connection-section'>
                <h3>התאמה ל"ממתין להגשה"</h3>
                {
                  selectedForm.connectedPendingForm
                    ? <div key={selectedForm.connectedPendingForm.id} className="pending-form-card">
                      <div className="pending-form-content">
                        <div className="pending-form-name">{selectedForm.connectedPendingForm.name}</div>
                        <div className="pending-form-commander">{selectedForm.connectedPendingForm.commander}</div>
                        <div className="pending-form-event">{selectedForm.connectedPendingForm.eventDescription}</div>
                        <div className="pending-form-time">{formatDateTime(selectedForm.connectedPendingForm.createdAt)}</div>
                      </div>
                      <button
                        className="delete-btn"
                        onClick={() => handleUnMergeWithPending()}
                      >
                        ×
                      </button>
                    </div>
                    : <div className='pending-form-selection'>
                      <Select onChange={handleMergeWithPending} options={pendingForms.map(pendingForm => ({
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
                      })
                      )}
                        formatOptionLabel={(option) => option.label} />
                    </div>
                }
              </div>
              <Comments comments={selectedForm.comments} createNewComment={createNewComment}/>
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
        </div>
      )}
    </div>
  );
};

export default Dashboard; 