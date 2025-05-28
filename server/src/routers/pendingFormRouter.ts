import { Router, Request, Response } from "express";
import { authenticateToken } from "../server";
import { Database } from "../db";

export function pendingFormRouter(database: Database) {
    const router = Router();

    // Get pending forms (forms in the first column)
    router.get('/api/pending-forms', authenticateToken, async (req: Request, res: Response) => {
        try {
            const pendingForms = await database.getPendingForms();
            res.json(pendingForms);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching pending forms', error: (error as Error).message });
        }
    });

    // Get a specific pending form
    router.get('/api/pending-forms/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const pendingForm = await database.getPendingForm(id);
            if (!pendingForm) {
                res.status(404).json({ message: 'Pending form not found' });
                return;
            }
            res.json(pendingForm);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching pending form', error: (error as Error).message });
        }
    });

    // Create a new pending form
    router.post('/api/pending-forms', authenticateToken, async (req: Request, res: Response) => {
        try {
            const { name, commander, eventDescription } = req.body;

            // Validate required fields
            if (!name || !eventDescription || !commander) {
                return res.status(400).json({
                    message: 'Missing required fields',
                    details: {
                        name: !name,
                        commander: !commander,
                        eventDescription: !eventDescription
                    }
                });
            }

            const pendingForm = await database.createPendingForm({ name, commander, eventDescription });
            res.status(201).json(pendingForm);
        } catch (error) {
            res.status(500).json({ message: 'Error creating pending form', error: (error as Error).message });
        }
    });

    // Delete pending form
    router.delete('/api/pending-forms/:id', authenticateToken, async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await database.deletePendingForm(id);
            res.status(204).send();
        } catch (error) {
            if ((error as Error).message === 'Pending form not found') {
                res.status(404).json({ message: 'Pending form not found' });
            } else {
                res.status(500).json({ message: 'Error deleting pending form', error: (error as Error).message });
            }
        }
    });
    return router
}

