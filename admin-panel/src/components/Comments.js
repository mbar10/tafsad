import React, { useState } from 'react';
import './Comments.css';

const Comments = ({ formId, comments = [], onAddComment, onEditComment, onDeleteComment }) => {
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    onAddComment(formId, newComment.trim());
    setNewComment('');
  };

  const handleEdit = (comment) => {
    setEditingComment(comment);
    setNewComment(comment.text);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    onEditComment(formId, editingComment.id, newComment.trim());
    setEditingComment(null);
    setNewComment('');
  };

  const handleCancel = () => {
    setEditingComment(null);
    setNewComment('');
  };

  return (
    <div className="comments-section">
      <h3>הערות</h3>
      
      <form onSubmit={editingComment ? handleUpdate : handleSubmit} className="comment-form">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="הוסף הערה..."
          rows="3"
        />
        <div className="comment-form-actions">
          {editingComment && (
            <button type="button" onClick={handleCancel} className="cancel-btn">
              ביטול
            </button>
          )}
          <button type="submit" className="submit-btn">
            {editingComment ? 'עדכן' : 'הוסף'}
          </button>
        </div>
      </form>

      <div className="comments-list">
        {comments.map((comment) => (
          <div key={comment.id} className="comment">
            <div className="comment-header">
              <span className="comment-date">
                {new Date(comment.createdAt).toLocaleString('he-IL')}
              </span>
              <div className="comment-actions">
                <button
                  onClick={() => handleEdit(comment)}
                  className="edit-btn"
                >
                  ערוך
                </button>
                <button
                  onClick={() => onDeleteComment(formId, comment.id)}
                  className="delete-btn"
                >
                  מחק
                </button>
              </div>
            </div>
            <p className="comment-text">{comment.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Comments; 