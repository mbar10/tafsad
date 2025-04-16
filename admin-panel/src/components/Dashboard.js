import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Select from "react-select"
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';
import { getConfig } from '../config';

const Dashboard = ({
  onLogout,
  onSort,
  onUpdateColumn,
  onUpdatePunishment,
}) => {
  const { forms, pendingForms, AddPendingForm, handleDeletePendingForm, handleMergePendingForm } = useAuth();
  const [columns, setColumns] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [newComment, setNewComment] = useState('');
  const [newPendingForm, setNewPendingForm] = useState({
    name: '',
    commander: '',
    eventDescription: ''
  });

  useEffect(() => {
    const fetchColumns = async () => {
      try {
        const { serverUrl } = getConfig();
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${serverUrl}/api/columns`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setColumns(data);
        }
      } catch (error) {
        console.error('Error fetching columns:', error);
      }
    };

    fetchColumns();
  }, []);

  const handleMergeWithPending = async (selectedOption) => {
    const newforms = await handleMergePendingForm(selectedForm.id, selectedOption.value)
    setSelectedForm(prev => newforms.find(item => item.id === prev.id))
  }

  const handleAddPendingForm = async () => {
    if (!newPendingForm.name.trim()
      || !newPendingForm.commander.trim()
      || !newPendingForm.eventDescription.trim()) return;
    try {
      await AddPendingForm(newPendingForm);
      setNewPendingForm({ name: '', eventDescription: '', commander: '' });
    } catch (error) {
      console.error('Error adding pending form:', error);
    }
  }

  const handleSortChange = (newSortBy, newSortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    onSort(newSortBy, newSortOrder);
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    await onUpdateColumn(draggableId, destination.droppableId);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportToCSV = () => {
    const headers = ['שם', 'מפקד', 'תיאור אירוע', 'תאריך', 'עמודה', 'עונש'];
    const csvContent = [
      headers.join(','),
      ...forms.map(form => [
        form.name,
        form.commander,
        form.eventDescription,
        formatDateTime(form.date),
        columns.find(col => col.id === form.columnId)?.title || '',
        form.punishment || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    // Add BOM for Hebrew characters
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'forms.csv';
    link.click();
  };

  const handleAddComment = async () => {
    if (!selectedForm || !newComment.trim()) return;

    try {
      const { serverUrl } = getConfig();
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${serverUrl}/api/forms/${selectedForm.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: newComment })
      });

      if (response.ok) {
        const comment = await response.json();
        setSelectedForm(prev => ({
          ...prev,
          comments: [...(prev.comments || []), comment]
        }));
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };


  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>לוח בקרה</h1>
        <div className="dashboard-actions">
          <button className="export-btn" onClick={exportToCSV}>ייצוא ל-CSV</button>
          <button className="logout-btn" onClick={onLogout}>התנתק</button>
        </div>
      </div>

      <div className="sort-controls">
        <button
          className={`sort-btn ${sortBy === 'date' ? 'active' : ''}`}
          onClick={() => handleSortChange('date', sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          מיון לפי תאריך {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
        <button
          className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
          onClick={() => handleSortChange('name', sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          מיון לפי שם {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          <div className="kanban-column pending-column">
            <h2 className="column-title">ממתין להגשה</h2>
            <div className="pending-forms-list">
              <div className="add-pending-form">
                <div className="form-group">
                  <input
                    type="text"
                    value={newPendingForm.name}
                    onChange={(e) => setNewPendingForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="שם..."
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPendingForm()}
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    value={newPendingForm.commander}
                    onChange={(e) => setNewPendingForm(prev => ({ ...prev, commander: e.target.value }))}
                    placeholder="מפקד..."
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPendingForm()}
                  />
                </div>

                <div className="form-group">
                  <textarea
                    value={newPendingForm.eventDescription}
                    onChange={(e) => setNewPendingForm(prev => ({ ...prev, eventDescription: e.target.value }))}
                    placeholder="תיאור האירוע..."
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAddPendingForm())}
                  />
                </div>
                <button onClick={handleAddPendingForm}>הוסף</button>
              </div>
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
                    {forms
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
                              <h3>ממלא: {form.connectedPendingForm.name || form.name}</h3>
                              <p className="commander">מפקד: {form.connectedPendingForm.commander || form.commander}</p>
                              <p className="event-description">אירוע: {form.connectedPendingForm.eventDescription || form.occurrence}</p>
                              <p className="form-date">{formatDateTime(form.date)}</p>
                              {form.punishment && (
                                <p className="punishment-preview">{form.punishment}</p>
                              )}
                              {form.comments && form.comments.length > 0 && (
                                <div className="comment-count">{form.comments.length}</div>
                              )}
                              <div className="commander-tag">{form.commander}</div>
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
            <h2>פרטי טופס</h2>
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
              <div className="comments-section">
                <h3>הערות</h3>
                {selectedForm.comments && selectedForm.comments.length > 0 && (
                  <div className="comments-list">
                    {selectedForm.comments.map((comment) => (
                      <div key={comment.id} className="comment">
                        <p>{comment.text}</p>
                        <small>{formatDateTime(comment.createdAt)}</small>
                      </div>
                    ))}
                  </div>
                )}
                <div className="add-comment">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="הוסף הערה חדשה..."
                  />
                  <button onClick={handleAddComment}>הוסף הערה</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 