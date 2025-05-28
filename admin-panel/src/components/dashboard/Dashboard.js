import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useAuth } from '../../contexts/AuthContext';
import './Dashboard.css';
import { useExportToCsv } from '../../hooks/useExportToCsv';
import { PendingFormsEditor } from '../pendingFormEditor/PendingFormEditor';
import { formatDateTime, truncateText } from '../../utils/transform';
import { FormFilterPopup } from '../FormFilterPopup/FormFilterPopup';
import { Form } from '../form/Form';
import { GroupCreator } from '../groupCreator/GroupCreator';

const Dashboard = ({
  onLogout,
}) => {
  const {
    forms,
    columns,
    pendingForms,
    handleFormDelete,
    handleAddComment,
    handleUnmergePendingForm,
    handleDeletePendingForm,
    handleMergePendingForm,
    handleUpdateColumn,
    handleUpdatePunishment,
    formGroups,
    handleUpdateGroupColumn,
    addFormToGroup
  } = useAuth();
  const [selectedForm, setSelectedForm] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isPendingFormEditor, setIsPendingFormEditor] = useState(true);
  const [filters, setFilters] = useState([]);
  const [isAscending, setIsAscending] = useState();
  const { exportToCSV } = useExportToCsv(forms, columns);

  const displayedItems = useMemo(() => {
    const groupedFormIds = formGroups.flatMap(g => g.formIds);
    const filteredTaggedForms = forms.filter(form =>
      !groupedFormIds.includes(form.id) &&
      filters.every(filter => {
        if (!filter.value) return true;
        if (filter.key === "timeFrom") return new Date(form.date) >= new Date(filter.value);
        if (filter.key === "timeTo") return new Date(form.date) <= new Date(filter.value);
        const formValue = form[filter.key] || "";
        return formValue.toLowerCase().includes(filter.value.toLowerCase());
      })
    ).map(form => ({ ...form, tag: "form" }));

    const filteredTaggedGroups = formGroups.filter(group =>
      filters.every(filter => {
        if (!filter.value) return true;
        if (filter.key === "timeFrom") return new Date(group.createdAt) >= new Date(filter.value);
        if (filter.key === "timeTo") return new Date(group.createdAt) <= new Date(filter.value);
        const formValue = group[filter.key] || "";
        return formValue.toLowerCase().includes(filter.value.toLowerCase());
      })
    ).map(group => ({ ...group, tag: "group" }));

    return [...filteredTaggedForms, ...filteredTaggedGroups].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return isAscending ? dateA - dateB : dateB - dateA;
    })
  })

  const selectItem = (item, isForm) => {
    if (isForm) {
      setSelectedForm(item);
      setSelectedGroup(null);
    } else {
      setSelectedGroup(item);
      setSelectedForm(null);
    }
  }

  const onUpdatePunishment = (id, punishment) => {
    handleUpdatePunishment(id, punishment);
    if (selectedForm.columnId === columns[1].id && punishment) {
      handleUpdateColumn(selectedForm.id, columns[2].id);
    }
  }

  const handleMergeWithPending = async (selectedOption) => {
    const newforms = await handleMergePendingForm(selectedForm.id, selectedOption.value)
    if (selectedForm.columnId === columns[0].id) {
      handleUpdateColumn(selectedForm.id, columns[1].id);
    }
    selectItem(prev => newforms.find(item => item.id === prev.id), true);
  }

  const handleUnMergeWithPending = async () => {
    await handleUnmergePendingForm(selectedForm.id);
    if (selectedForm.columnId === columns[1].id) {
      handleUpdateColumn(selectedForm.id, columns[0].id);
    }
    selectItem(prev => ({ ...prev, connectedPendingForm: null }), true)
  }

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;

    if (destination.droppableId.startsWith("group-")) {
      if (formGroups.find(group => group.id === draggableId)) {
        console.log("cant drag a group to group");
      } else {
        const groupId = destination.droppableId.replace("group-", "");
        await addFormToGroup(groupId, draggableId);
      }
    } else {
      if(formGroups.find(group => group.id === draggableId)){
        await handleUpdateGroupColumn(draggableId, destination.droppableId)
      }else{
        await handleUpdateColumn(draggableId, destination.droppableId);
      }
    }
  };

  const handleDeleteForm = async (formId) => {
    await handleFormDelete(formId)
    selectItem(null, true);
  };

  const createNewComment = async (comment) => {
    await handleAddComment(selectedForm.id, comment);
    selectItem(prev => ({
      ...prev,
      comments: [...(prev.comments || []), { text: comment, createdAt: Date.now() }]
    }), true);

  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>לוח בקרה</h1>
        <div className="dashboard-actions">
          <FormFilterPopup filters={filters} setFilters={setFilters} />
          <button className="header-button" onClick={() => setIsAscending(prev => !prev)}>
            {isAscending ? "ישן למעלה" : "חדש למעלה"}</button>
          <button className="header-button" onClick={exportToCSV}>ייצוא ל-CSV</button>
          <button className="header-button" onClick={onLogout}>התנתק</button>
        </div>

      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          <div className="kanban-column pending-column">
            <h2 className="column-title">ממתין להגשה</h2>
            <div className="pending-forms-list">
              <button onClick={() => setIsPendingFormEditor(!isPendingFormEditor)}>
                switch
              </button>
              {
                isPendingFormEditor
                  ? <PendingFormsEditor />
                  : <GroupCreator />
              }
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
                    {displayedItems
                      .filter(form => form.columnId === column.id)
                      .map((item, index) => {
                        if (item.tag === "form") {
                          const form = item;
                          return <Draggable key={form.id} draggableId={form.id} index={index}>
                            {(provided) => (
                              <div
                                className="form-card"
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => selectItem(form, true)}
                              >
                                <div className="commander-tag">{form?.connectedPendingForm?.commander || form.commander}</div>
                                <div className="hanich-tag">{form?.connectedPendingForm?.name || form.name}</div>
                                <div style={{ marginTop: "2rem" }}>
                                  <p className="event-description">אירוע: {truncateText(form?.connectedPendingForm?.eventDescription || form.occurrence, 15)}</p>
                                  <p className="form-date">תאריך האירוע: {formatDateTime(form.requestDateTime)}</p>
                                  <p className="form-date">תאריך הדיווח: {formatDateTime(form.date)}</p>
                                  {form.punishment && (
                                    <p className="punishment-preview">{truncateText(form.punishment, 7)}</p>
                                  )}
                                  {form.comments && form.comments.length > 0 && (
                                    <div className="comment-count">{form.comments.length}</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        } else {
                          const group = item;
                          return <Draggable key={group.id} draggableId={group.id} index={index}>
                            {(provided) => (
                              <div
                                className="group-card"
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => selectItem(group, false)}
                              >
                                <div style={{ marginTop: "2rem" }}>
                                  <p className="event-description">אירוע: {truncateText(group.description, 15)}</p>
                                  <p className="form-date">תאריך: {formatDateTime(group.date)}</p>
                                </div>

                                <Droppable droppableId={`group-${group.id}`}>
                                  {(dropProvided) => (
                                    <div
                                      ref={dropProvided.innerRef}
                                      {...dropProvided.droppableProps}
                                      className="group-inner-droppable"
                                    >
                                      {/* forms inside this group */}
                                      {displayedItems.filter(f => f.groupId === group.id).map((form, idx) => (
                                        <Draggable key={form.id} draggableId={form.id} index={idx}>
                                          {(provided) => (
                                            <div
                                              className="form-card"
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              {...provided.dragHandleProps}
                                              onClick={() => selectItem(form, true)}
                                            >
                                              <div>{form.name}</div>
                                            </div>
                                          )}
                                        </Draggable>
                                      ))}
                                      {dropProvided.placeholder}
                                    </div>
                                  )}
                                </Droppable>
                              </div>
                            )}
                          </Draggable>

                        }

                      })}
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
          selectItem(null, true);
        }}>
          <Form
            selectedForm={selectedForm}
            setSelectedForm={(form) => selectItem(form, true)}
            onUpdatePunishment={onUpdatePunishment}
            pendingForms={pendingForms}
            handleMergeWithPending={handleMergeWithPending}
            handleUnMergeWithPending={handleUnMergeWithPending}
            createNewComment={createNewComment}
            handleDeleteForm={handleDeleteForm}
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard; 