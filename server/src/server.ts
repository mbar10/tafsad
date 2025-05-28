import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { AuthRequest, CommentCreateRequest } from './types';
import { Database } from './db';
import { pendingFormRouter } from './routers/pendingFormRouter';
import { CommentsRouter } from './routers/commentsRouter';
import { formRouter } from './routers/formRouter';
import { ADMIN_USER, COLUMNS } from './constants';
import { mergeRouter } from './routers/mergeRouter';
import { groupRouter } from './routers/groupRouter';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const database = new Database(process.env.MONGO_URI || 'mongodb://localhost:27017/forms');

database.connect()

app.use((req, res, next) => {
  console.log(`recived: ${req.url}`)
  next()
})

app.use(cors());


app.use(express.json());

app.use(pendingFormRouter(database));
app.use(CommentsRouter(database));
app.use(formRouter(database, COLUMNS));
app.use(mergeRouter(database));
app.use(groupRouter(database));

// Base route handler
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Server is running' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});


// Middleware to verify JWT token
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
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

  if (username === ADMIN_USER.username && password === ADMIN_USER.password) {
    const token = jwt.sign({ username }, JWT_SECRET);
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Get all columns
app.get('/api/columns', async (req: Request, res: Response) => {
  
  res.json(COLUMNS);
  
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 