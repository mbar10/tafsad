import { Router, Request, Response } from "express";
import { authenticateToken } from "../server";
import { Database } from "../db";
import { ColumnUpdateRequest, PunishmentUpdateRequest } from "../types";
import { randomUUID } from "crypto";

export function formRouter(database: Database, columns: { id: string; title: string; }[]) {
    const router = Router();

    router.get('/api/forms', authenticateToken, async (req: Request, res: Response) => {
        try {
            const forms = await database.getAllForms();
            res.json(forms);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching forms', error: (error as Error).message });
        }
    });

    router.post('/api/forms', async (req: Request, res: Response) => {
        try {
            console.log('Received form data:', req.body);

            const { name, occurrence, commander, requestDateTime, damage, prevention, columnId } = req.body;

            // Validate required fields
            if (!name || !occurrence || !commander || !requestDateTime || !damage || !prevention) {
                console.log('Missing required fields:', { name, occurrence, commander, requestDateTime, damage, prevention });
                return res.status(400).json({
                    message: 'Missing required fields',
                    details: {
                        name: !name,
                        occurrence: !occurrence,
                        commander: !commander,
                        requestDateTime: !requestDateTime,
                        damage: !damage,
                        prevention: !prevention
                    }
                });
            }

            // Parse dates
            const parseDate = (dateStr: string) => {
                try {
                    // Try parsing ISO format first
                    const isoDate = new Date(dateStr);
                    if (!isNaN(isoDate.getTime())) {
                        return isoDate.toISOString();
                    }

                    // Try parsing custom format (d.M.yyyy, HH:mm:ss)
                    const [datePart, timePart] = dateStr.split(', ');
                    if (datePart && timePart) {
                        const [day, month, year] = datePart.split('.');
                        const [hours, minutes, seconds] = timePart.split(':');
                        const customDate = new Date(
                            parseInt(year),
                            parseInt(month) - 1,
                            parseInt(day),
                            parseInt(hours),
                            parseInt(minutes),
                            parseInt(seconds)
                        );
                        if (!isNaN(customDate.getTime())) {
                            return customDate.toISOString();
                        }
                    }
                    throw new Error(`Invalid date format: ${dateStr}`);
                } catch (error) {
                    console.error('Date parsing error:', error);
                    throw error;
                }
            };

            const parsedRequestDateTime = parseDate(requestDateTime);
            const id = randomUUID();
            const newForm = await database.createForm({
                id,
                name,
                occurrence,
                commander,
                date: new Date().toISOString(),
                requestDateTime: parsedRequestDateTime,
                damage,
                prevention,
                columnId: columnId || columns[0].id,
                punishment: '',
                eventDescription: occurrence,
                comments: []
            });

            console.log('Created new form:', newForm);
            res.status(201).json(newForm);
        } catch (error) {
            console.error('Error creating form:', error);
            res.status(500).json({
                message: 'Error creating form',
                error: (error as Error).message,
                details: error
            });
        }
    });

    router.patch('/api/forms/:id/column', authenticateToken, async (req: ColumnUpdateRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { columnId } = req.body;
            await database.updateFormColumn(id, columnId);
            res.json({ id, columnId });
        } catch (error) {
            if ((error as Error).message === 'Form not found') {
                res.status(404).json({ message: 'Form not found' });
            } else {
                res.status(500).json({ message: 'Error updating form column', error: (error as Error).message });
            }
        }
    });

    router.patch('/api/forms/:id/punishment', authenticateToken, async (req: PunishmentUpdateRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { punishment } = req.body;
            await database.updateFormPunishment(id, punishment);
            res.json({ id, punishment });
        } catch (error) {
            if ((error as Error).message === 'Form not found') {
                res.status(404).json({ message: 'Form not found' });
            } else {
                res.status(500).json({ message: 'Error updating punishment', error: (error as Error).message });
            }
        }
    });

    router.delete('/api/forms/:id', authenticateToken, async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await database.deleteForm(id);
            res.status(204).send();
        } catch (error) {
            if ((error as Error).message === 'Form not found') {
                res.status(404).json({ message: 'Form not found' });
            } else {
                res.status(500).json({ message: 'Error deleting form', error: (error as Error).message });
            }
        }
    });

    return router;

}