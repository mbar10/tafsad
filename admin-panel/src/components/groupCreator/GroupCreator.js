import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./GroupCreator.css"

export const GroupCreator = (initialData = {
  title: '',
  description: '',
}) => {
  const { createGroup } = useAuth();

  const [newGroupData, setNewGroupData] = useState(initialData);

  const handleAddFormGroup = async () => {
    if (!newGroupData.title.trim()
      || !newGroupData.description.trim()) return;
    try {
      await createGroup(newGroupData);
      setNewGroupData({ title: '', description: '' });
    } catch (error) {
      console.error('Error adding form group:', error);
    }
  }

  return <div className="group-form-editor">
    <h3>יצירת קבוצת טפסים</h3>
    <div className="form-group">
      <input
        type="text"
        value={newGroupData.title}
        onChange={(e) => setNewGroupData(prev => ({ ...prev, title: e.target.value }))}
        placeholder="כותרת הקבוצה..."
        onKeyDown={(e) => e.key === 'Enter' && handleAddFormGroup()}
      />
    </div>
    <div className="form-group">
      <textarea
        value={newGroupData.description}
        onChange={(e) => setNewGroupData(prev => ({ ...prev, description: e.target.value }))}
        placeholder="תיאור הקבוצה..."
        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAddFormGroup())}
      />
    </div>
    <button onClick={handleAddFormGroup}>הוסף</button>
  </div>
}