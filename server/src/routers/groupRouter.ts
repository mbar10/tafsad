import { Router, Request, Response } from "express";
import { authenticateToken } from "../server";
import { Database } from "../db";
import { ColumnUpdateRequest } from "../types";

export function groupRouter(database: Database) {
    const router = Router();

    // Get all groups
    router.get('/api/groups', authenticateToken, async (req: Request, res: Response) => {
        try {
            const groups = await database.getAllFormGroups();
            res.json(groups);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching groups', error: (error as Error).message });
        }
    });

    // Create a group
    router.post('/api/groups', authenticateToken, async (req: Request, res: Response) => {
        try {
            const { title, description, punishment } = req.body;
            if (!title || !description || !punishment) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            const newGroup = await database.createFormGroup({ title, description, punishment });
            res.status(201).json(newGroup);
        } catch (error) {
            res.status(500).json({ message: 'Error creating group', error: (error as Error).message });
        }
    });

    // Update group details (title / description / punishment)
    router.patch('/api/groups/:id', authenticateToken, async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { title, description, punishment } = req.body;

            if (!title && !description && !punishment) {
                return res.status(400).json({ message: 'No fields provided to update' });
            }

            await database.updateFormGroupDetails(id, { title, description, punishment });
            res.status(200).json({ id, updated: { title, description, punishment } });
        } catch (error) {
            if ((error as Error).message === 'Group not found') {
                res.status(404).json({ message: 'Group not found' });
            } else {
                res.status(500).json({ message: 'Error updating group', error: (error as Error).message });
            }
        }
    });

    // Delete a group
    router.delete('/api/groups/:id', authenticateToken, async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await database.deleteFormGroup(id);
            res.status(204).send();
        } catch (error) {
            if ((error as Error).message === 'Group not found') {
                res.status(404).json({ message: 'Group not found' });
            } else {
                res.status(500).json({ message: 'Error deleting group', error: (error as Error).message });
            }
        }
    });

    // Add a form to a group
    router.post('/api/groups/:groupId/forms/:formId', authenticateToken, async (req: Request, res: Response) => {
        try {
            const { groupId, formId } = req.params;
            await database.addFormToGroup(groupId, formId);
            res.status(200).json({ message: `Form ${formId} added to group ${groupId}` });
        } catch (error) {
            if ((error as Error).message === 'Group not found') {
                res.status(404).json({ message: 'Group not found' });
            } else {
                res.status(500).json({ message: 'Error adding form to group', error: (error as Error).message });
            }
        }
    });

    // Remove a form from a group
    router.delete('/api/groups/:groupId/forms/:formId', authenticateToken, async (req: Request, res: Response) => {
        try {
            const { groupId, formId } = req.params;
            await database.removeFormFromGroup(groupId, formId);
            res.status(200).json({ message: `Form ${formId} removed from group ${groupId}` });
        } catch (error) {
            if ((error as Error).message.includes('Group not found')) {
                res.status(404).json({ message: "Group not found" });
            } else {
                res.status(500).json({ message: 'Error removing form from group', error: (error as Error).message });
            }
        }
    });

    router.patch('/api/groups/:id/column', authenticateToken, async (req: ColumnUpdateRequest, res: Response) => {
            try {
                const { id } = req.params;
                const { columnId } = req.body;
                await database.updateFormGroupColumn(id, columnId);
                res.json({ id, columnId });
            } catch (error) {
                if ((error as Error).message === 'Form group not found') {
                    res.status(404).json({ message: 'Form group not found' });
                } else {
                    res.status(500).json({ message: 'Error updating form group column', error: (error as Error).message });
                }
            }
        });

    return router;

}
