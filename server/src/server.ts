import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { AdminUser, AuthRequest, ColumnUpdateRequest, PunishmentUpdateRequest, CommentCreateRequest, CommentUpdateRequest } from './types';
import { Database } from './db';
import { randomUUID } from 'crypto';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const COLUMNS = [{
  id: "new",
  title: "חדשים"
},
{
  id: "punishmentComing",
  title: "עונש בהורדה"
},
{
  id: "punishmentRunning",
  title: "עונש בריצה"
},
{
  id: "history",
  title: "היסטוריה"
}
];

const database = new Database(process.env.MONGO_URI || 'mongodb://localhost:27017/forms');

database.connect()

app.use((req, res, next) => {
  console.log(`recived: ${req.url}`)
  next()
})

app.use(cors());


app.use(express.json());

// Base route handler
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Server is running' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});


const adminUser: AdminUser = {
  username: 'admin',
  password: 'admin123'
};

// Middleware to verify JWT token
const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      res.status(403).json({ message: 'Invalid token' });
      return;
    }
    req.user = user;
    next();
  });
};

// Admin login
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (username === adminUser.username && password === adminUser.password) {
    const token = jwt.sign({ username }, JWT_SECRET);
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Get all forms
app.get('/api/forms', authenticateToken, async (req: Request, res: Response) => {
  try {
    const forms = await database.getAllForms();
    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching forms', error: (error as Error).message });
  }
});

// Create new form
app.post('/api/forms', async (req: Request, res: Response) => {
  try {
    console.log('Received form data:', req.body);
    
    const { name, occurrence, commander, date, requestDateTime, damage, prevention, columnId } = req.body;
    
    // Validate required fields
    if (!name || !occurrence || !commander || !date || !requestDateTime || !damage || !prevention) {
      console.log('Missing required fields:', { name, occurrence, commander, date, requestDateTime, damage, prevention });
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: {
          name: !name,
          occurrence: !occurrence,
          commander: !commander,
          date: !date,
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

    const parsedDate = parseDate(date);
    const parsedRequestDateTime = parseDate(requestDateTime);
    const id = randomUUID()
    const newForm = await database.createForm({
      id,
      name,
      occurrence,
      commander,
      date: parsedDate,
      requestDateTime: parsedRequestDateTime,
      damage,
      prevention,
      columnId: columnId || COLUMNS[0].id,
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

// Update form column
app.patch('/api/forms/:id/column', authenticateToken, async (req: ColumnUpdateRequest, res: Response) => {
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

// Update form punishment
app.patch('/api/forms/:id/punishment', authenticateToken, async (req: PunishmentUpdateRequest, res: Response) => {
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

// Get all columns
app.get('/api/columns', async (req: Request, res: Response) => {
  
  res.json(COLUMNS);
  
});

// Get pending forms (forms in the first column)
app.get('/api/pending-forms', authenticateToken, async (req: Request, res: Response) => {
  try {
    const pendingForms = await database.getPendingForms();
    res.json(pendingForms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending forms', error: (error as Error).message });
  }
});

// Get a specific pending form
app.get('/api/pending-forms/:id', async (req: Request, res: Response) => {
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
app.post('/api/pending-forms', authenticateToken, async (req: Request, res: Response) => {
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
app.delete('/api/pending-forms/:id', authenticateToken, async (req: Request, res: Response) => {
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

// Add comment to form
app.post('/api/forms/:id/comments', authenticateToken, async (req: CommentCreateRequest, res: Response) => {
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

// Update comment
app.patch('/api/forms/:formId/comments/:commentId', authenticateToken, async (req: CommentUpdateRequest, res: Response) => {
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

// Delete comment
app.delete('/api/forms/:formId/comments/:commentId', authenticateToken, async (req: Request, res: Response) => {
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

app.patch("/api/merge/form/:formId/pending/:pendingFormId", authenticateToken, async (req: Request, res: Response) => {
  try{
    const {formId, pendingFormId} = req.params;
    await database.mergePendingFormWithForm(pendingFormId, formId);
    res.status(200).json({message: "success"})
  }catch(error){
    if((error as Error).message === 'Pending form not found'){
      res.status(404).json({ message: 'pending form not found' });
    } else if ((error as Error).message === 'Form not found'){
      res.status(404).json({ message: 'Form not found' });
    } else{
      res.status(500).json({ message: 'Error merging pending form', error: (error as Error).message });
    }
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 