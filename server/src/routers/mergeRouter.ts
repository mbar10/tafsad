import { Router, Request, Response } from "express";
import { authenticateToken } from "../server";
import { Database } from "../db";

export function mergeRouter(database: Database) {
    const router = Router();

    router.patch("/api/merge/form/:formId/pending/:pendingFormId", authenticateToken, async (req: Request, res: Response) => {
        try {
            const { formId, pendingFormId } = req.params;
            await database.mergePendingFormWithForm(pendingFormId, formId);
            res.status(200).json({ message: "success" })
        } catch (error) {
            if ((error as Error).message === 'Pending form not found') {
                res.status(404).json({ message: 'pending form not found' });
            } else if ((error as Error).message === 'Form not found') {
                res.status(404).json({ message: 'Form not found' });
            } else {
                res.status(500).json({ message: 'Error merging pending form', error: (error as Error).message });
            }
        }
    })

    router.patch("/api/unmerge/form/:formId", authenticateToken, async (req: Request, res: Response) => {
        try {
            const { formId } = req.params;
            const recreatedPendingForm = await database.unmergePendingFormFromForm(formId);
            res.status(200).json({ message: "success", pendingForm: recreatedPendingForm });
        } catch (error) {
            if ((error as Error).message === 'Form not found') {
                res.status(404).json({ message: 'Form not found' });
            } else if ((error as Error).message === 'No connected pending form to unmerge') {
                res.status(400).json({ message: 'No connected pending form to unmerge' });
            } else {
                res.status(500).json({ message: 'Error unmerging form', error: (error as Error).message });
            }
        }
    });

    return router
}