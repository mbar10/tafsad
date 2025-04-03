import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Form, Comment, Column, AdminUser, AuthRequest, ColumnUpdateRequest, PunishmentUpdateRequest, CommentCreateRequest, CommentUpdateRequest } from './types';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

app.use(cors());
app.use(express.json());

// In-memory storage
let forms: Form[] = [];
let columns: Column[] = [
  { id: '1', title: 'ממתין לעונש' },
  { id: '2', title: 'עונש נקבע' },
  { id: '3', title: 'עונש בביצוע' },
  { id: '4', title: 'עונש הושלם' }
];
const adminUser: AdminUser = {
  username: 'admin',
  password: 'admin123'
};

// Add this after the existing interfaces
interface PendingForm {
  id: string;
  name: string;
  eventDescription: string;
  date: string;
}

// Add this after the existing state variables
let pendingForms: PendingForm[] = [];

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
app.get('/api/forms', authenticateToken, (req: Request, res: Response) => {
  res.json(forms);
});

// Get all pending forms
app.get('/api/pending-forms', (req, res) => {
  res.json(pendingForms);
});

// Post a new pending form
app.post('/api/pending-forms', (req, res) => {
  const { name, eventDescription } = req.body;
  const newPendingForm: PendingForm = {
    id: Date.now().toString(),
    name,
    eventDescription,
    date: new Date().toISOString()
  };
  pendingForms.push(newPendingForm);
  res.json(newPendingForm);
});

// Delete a pending form
app.delete('/api/pending-forms/:id', (req, res) => {
  const { id } = req.params;
  pendingForms = pendingForms.filter(form => form.id !== id);
  res.json({ success: true });
});

// Create new form
app.post('/api/forms', (req, res) => {
  const { name, occurrence, commander, date, requestDateTime, damage, prevention, columnId } = req.body;
  
  // Remove the name from pending forms if it exists
  pendingForms = pendingForms.filter(form => form.name !== name);

  const newForm: Form = {
    id: Date.now().toString(),
    name,
    occurrence,
    commander,
    date,
    requestDateTime,
    damage,
    prevention,
    eventDescription: occurrence,
    columnId: columnId || columns[0].id,
    comments: [],
    punishment: ''
  };
  
  forms.push(newForm);
  res.json(newForm);
});

// Update form column
app.patch('/api/forms/:id/column', authenticateToken, (req: ColumnUpdateRequest, res: Response) => {
  const { id } = req.params;
  const { columnId } = req.body;

  const formIndex = forms.findIndex(f => f.id === id);
  if (formIndex === -1) {
    res.status(404).json({ message: 'Form not found' });
    return;
  }

  forms[formIndex] = { ...forms[formIndex], columnId };
  res.json(forms[formIndex]);
});

// Update form punishment
app.patch('/api/forms/:id/punishment', authenticateToken, (req: PunishmentUpdateRequest, res: Response) => {
  const { id } = req.params;
  const { punishment } = req.body;

  const formIndex = forms.findIndex(f => f.id === id);
  if (formIndex === -1) {
    res.status(404).json({ message: 'Form not found' });
    return;
  }

  forms[formIndex] = { ...forms[formIndex], punishment };
  res.json(forms[formIndex]);
});

// Get all columns
app.get('/api/columns', (req: Request, res: Response) => {
  res.json(columns);
});

// Add comment to form
app.post('/api/forms/:id/comments', authenticateToken, (req: CommentCreateRequest, res: Response) => {
  const { id } = req.params;
  const { text } = req.body;

  const formIndex = forms.findIndex(f => f.id === id);
  if (formIndex === -1) {
    res.status(404).json({ message: 'Form not found' });
    return;
  }

  const newComment: Comment = {
    id: Date.now().toString(),
    text,
    createdAt: new Date().toISOString()
  };

  forms[formIndex].comments = [...(forms[formIndex].comments || []), newComment];
  res.status(201).json(newComment);
});

// Update comment
app.patch('/api/forms/:formId/comments/:commentId', authenticateToken, (req: CommentUpdateRequest, res: Response) => {
  const { formId, commentId } = req.params;
  const { text } = req.body;

  const formIndex = forms.findIndex(f => f.id === formId);
  if (formIndex === -1) {
    res.status(404).json({ message: 'Form not found' });
    return;
  }

  const commentIndex = forms[formIndex].comments?.findIndex(c => c.id === commentId);
  if (commentIndex === -1 || commentIndex === undefined) {
    res.status(404).json({ message: 'Comment not found' });
    return;
  }

  forms[formIndex].comments![commentIndex] = {
    ...forms[formIndex].comments![commentIndex],
    text
  };

  res.json(forms[formIndex].comments![commentIndex]);
});

// Delete comment
app.delete('/api/forms/:formId/comments/:commentId', authenticateToken, (req: Request, res: Response) => {
  const { formId, commentId } = req.params;

  const formIndex = forms.findIndex(f => f.id === formId);
  if (formIndex === -1) {
    res.status(404).json({ message: 'Form not found' });
    return;
  }

  forms[formIndex].comments = forms[formIndex].comments?.filter(c => c.id !== commentId);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 