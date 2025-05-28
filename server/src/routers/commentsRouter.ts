import { Router, Request, Response } from "express";
import { authenticateToken } from "../server";
import { Database } from "../db";
import { CommentCreateRequest, CommentUpdateRequest } from "../types";

export function CommentsRouter(database: Database) {
    const router = Router();

    router.post('/api/forms/:id/comments', authenticateToken, async (req: CommentCreateRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { text } = req.body;
            const newComment = await database.addComment(id, text);
            res.status(201).json(newComment);
        } catch (error) {
            if ((error as Error).message === 'Form not found') {
                res.status(404).json({ message: 'Form not found' });
            } else {
                res.status(500).json({ message: 'Error adding comment', error: (error as Error).message });
            }
        }
    });

    router.patch('/api/forms/:formId/comments/:commentId', authenticateToken, async (req: CommentUpdateRequest, res: Response) => {
        try {
            const { formId, commentId } = req.params;
            const { text } = req.body;
            const updatedComment = await database.updateComment(formId, commentId, text);
            res.json(updatedComment);
        } catch (error) {
            if ((error as Error).message === 'Form not found') {
                res.status(404).json({ message: 'Form not found' });
            } else if ((error as Error).message === 'Comment not found') {
                res.status(404).json({ message: 'Comment not found' });
            } else {
                res.status(500).json({ message: 'Error updating comment', error: (error as Error).message });
            }
        }
    });

    router.delete('/api/forms/:formId/comments/:commentId', authenticateToken, async (req: Request, res: Response) => {
        try {
            const { formId, commentId } = req.params;
            await database.deleteComment(formId, commentId);
            res.status(204).send();
        } catch (error) {
            if ((error as Error).message === 'Form not found') {
                res.status(404).json({ message: 'Form not found' });
            } else {
                res.status(500).json({ message: 'Error deleting comment', error: (error as Error).message });
            }
        }
    });

    return router;
}