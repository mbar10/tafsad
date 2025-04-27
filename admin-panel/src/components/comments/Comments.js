import { useState } from "react"
import { formatDateTime } from "../../utils/transform";
import "./Comments.css"

export const Comments = ({comments, createNewComment}) => {
    const [newComment, setNewComment] = useState();
    console.log(comments)

    const handleCreateNewComment = async () => {
        await createNewComment(newComment);
        setNewComment('');
    }

    return <div className="comments-section">
    <h3>הערות</h3>
    {comments && comments.length > 0 && (
      <div className="comments-list">
        {comments.map((comment, index) => (
          <div className="comment" key={`comment_${index}`}>
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
      <button onClick={handleCreateNewComment}>הוסף הערה</button>
    </div>
  </div>
}