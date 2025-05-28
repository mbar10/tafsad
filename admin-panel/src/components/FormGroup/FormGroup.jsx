import React from 'react';
import { formatDateTime, truncateText } from '../../utils/transform';
import "./FormGroup.css";
import { useAuth } from '../../contexts/AuthContext';

export const FormGroup = ({
    selectedGroup,
    setSelectedGroup,
    onUpdatePunishment,
    handleDeleteGroup,
    selectItem,
}) => {
    const { forms, setFormGroups, removeFormFromGroup } = useAuth();
    if (!selectedGroup) return null;

    return (
        <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button
                className="modal-close"
                onClick={() => {
                    onUpdatePunishment(selectedGroup.id, selectedGroup.punishment);
                    setSelectedGroup(null);
                }}
            >
                ×
            </button>

            <div className="modal-header">
                <h2>פרטי קבוצת טפסים</h2>
            </div>

            <div className="form-details">
                <div className="original-form-section">
                    <h3>{selectedGroup.title}</h3>
                    <p className="form-detail">{selectedGroup.description}</p>
                    <p className="form-detail-date">{formatDateTime(selectedGroup.createdAt)}</p>
                </div>

                <div className="punishment-section">
                    <h3>עונש קבוצתי</h3>
                    <textarea
                        value={selectedGroup.punishment || ''}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setSelectedGroup(prev => ({
                                ...prev,
                                punishment: newValue
                            }));
                        }}
                        placeholder="הכנס עונש קבוצתי..."
                        className="form-textarea"
                    />
                </div>

                {
                    selectedGroup.forms.map(f1 => forms.find(f2 => f1 === f2.id)).map(form => <div
                        className="form-card"
                        onClick={() => selectItem(form, true)}
                    >
                        <button
                            className="remove-from-group"
                            onClick={async (e) => {
                                e.stopPropagation();
                                setSelectedGroup(prev => ({
                                    ...prev,
                                    forms: prev.forms.filter(f => f.id !== form.id)
                                }
                                ))                                
                                await removeFormFromGroup(selectedGroup.id, form.id)
                            }}
                        >
                            ×
                        </button>
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
                    </div>)
                }

                <div className="delete-form-section">
                    <button
                        className="delete-form-btn"
                        onClick={() => {
                            handleDeleteGroup(selectedGroup.id);
                            setSelectedGroup(null);
                        }}
                    >
                        מחק קבוצה
                    </button>
                </div>
            </div>
        </div>
    );
};
