import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./PendingFormEditor.css"

export const PendingFormsEditor = (initialData = {
  name: '',
  commander: '',
  eventDescription: ''
}) => {
  const { AddPendingForm } = useAuth();

  const [newPendingForm, setNewPendingForm] = useState(initialData);

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

  return <div className="pending-form-editor">
    <h3>טופס ממתין להגשה</h3>
    <div className="form-group">
      <input
        type="text"
        value={newPendingForm.name}
        onChange={(e) => setNewPendingForm(prev => ({ ...prev, name: e.target.value }))}
        placeholder="שם חניך..."
        onKeyDown={(e) => e.key === 'Enter' && handleAddPendingForm()}
      />
    </div>
    <div className="form-group">
      <input
        type="text"
        value={newPendingForm.commander}
        onChange={(e) => setNewPendingForm(prev => ({ ...prev, commander: e.target.value }))}
        placeholder="שם מפקד..."
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
}