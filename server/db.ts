import sqlite3 from 'sqlite3';
import { Form, Comment, Column } from './types';

// Database types
interface DBForm extends Omit<Form, 'comments'> {
  comments: string;
}

interface DBColumn extends Column {
  column_order: number;
}

interface RunResult extends sqlite3.RunResult {
  changes: number;
}

class Database {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database('forms.db', (err: Error | null) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to SQLite database');
        this.initializeDatabase();
      }
    });
  }

  private initializeDatabase(): void {
    this.db.serialize(() => {
      // Create forms table
      this.db.run(`CREATE TABLE IF NOT EXISTS forms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        occurrence TEXT NOT NULL,
        commander TEXT NOT NULL,
        date TEXT NOT NULL,
        requestDateTime TEXT NOT NULL,
        damage TEXT NOT NULL,
        prevention TEXT NOT NULL,
        columnId TEXT NOT NULL,
        comments TEXT DEFAULT '[]',
        punishment TEXT DEFAULT ''
      )`);

      // Create columns table
      this.db.run(`CREATE TABLE IF NOT EXISTS columns (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        column_order INTEGER NOT NULL
      )`, (err: Error | null) => {
        if (err) {
          console.error('Error creating columns table:', err);
        } else {
          this.initializeDefaultColumns();
        }
      });
    });
  }

  private initializeDefaultColumns(): void {
    const defaultColumns = [
      { id: '1', title: 'ממתין לעונש', column_order: 0 },
      { id: '2', title: 'עונש נקבע', column_order: 1 },
      { id: '3', title: 'עונש בביצוע', column_order: 2 },
      { id: '4', title: 'עונש הושלם', column_order: 3 }
    ];

    defaultColumns.forEach(column => {
      this.db.run(
        'INSERT OR IGNORE INTO columns (id, title, column_order) VALUES (?, ?, ?)',
        [column.id, column.title, column.column_order]
      );
    });
  }

  // Forms operations
  async getAllForms(): Promise<Form[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM forms ORDER BY date DESC', (err: Error | null, rows: DBForm[]) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows.map(row => ({
          ...row,
          comments: JSON.parse(row.comments)
        })));
      });
    });
  }

  async createForm(form: Omit<Form, 'id' | 'comments'>): Promise<Form> {
    const newForm = {
      ...form,
      id: Date.now().toString(),
      comments: '[]'
    };

    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO forms (id, name, occurrence, commander, date, requestDateTime, damage, prevention, columnId, comments, punishment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newForm.id, newForm.name, newForm.occurrence, newForm.commander, newForm.date, newForm.requestDateTime, newForm.damage, newForm.prevention, newForm.columnId, newForm.comments, newForm.punishment],
        (err: Error | null) => {
          if (err) {
            reject(err);
            return;
          }
          resolve({ ...newForm, comments: [] });
        }
      );
    });
  }

  async updateFormColumn(id: string, columnId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE forms SET columnId = ? WHERE id = ?',
        [columnId, id],
        function(this: RunResult, err: Error | null) {
          if (err) {
            reject(err);
            return;
          }
          if (this.changes === 0) {
            reject(new Error('Form not found'));
            return;
          }
          resolve();
        }
      );
    });
  }

  async updateFormPunishment(id: string, punishment: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE forms SET punishment = ? WHERE id = ?',
        [punishment, id],
        function(this: RunResult, err: Error | null) {
          if (err) {
            reject(err);
            return;
          }
          if (this.changes === 0) {
            reject(new Error('Form not found'));
            return;
          }
          resolve();
        }
      );
    });
  }

  // Columns operations
  async getAllColumns(): Promise<Column[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT id, title, column_order as "order" FROM columns ORDER BY column_order', (err: Error | null, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  // Comments operations
  async addComment(formId: string, text: string): Promise<Comment> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT comments FROM forms WHERE id = ?', [formId], (err: Error | null, row: DBForm | undefined) => {
        if (err) {
          reject(err);
          return;
        }
        if (!row) {
          reject(new Error('Form not found'));
          return;
        }

        const comments = JSON.parse(row.comments);
        const newComment = {
          id: Date.now().toString(),
          text,
          createdAt: new Date().toISOString()
        };
        comments.push(newComment);

        this.db.run(
          'UPDATE forms SET comments = ? WHERE id = ?',
          [JSON.stringify(comments), formId],
          (err: Error | null) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(newComment);
          }
        );
      });
    });
  }

  async updateComment(formId: string, commentId: string, text: string): Promise<Comment> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT comments FROM forms WHERE id = ?', [formId], (err: Error | null, row: DBForm | undefined) => {
        if (err) {
          reject(err);
          return;
        }
        if (!row) {
          reject(new Error('Form not found'));
          return;
        }

        const comments = JSON.parse(row.comments);
        const commentIndex = comments.findIndex((c: Comment) => c.id === commentId);
        if (commentIndex === -1) {
          reject(new Error('Comment not found'));
          return;
        }

        comments[commentIndex] = { ...comments[commentIndex], text };

        this.db.run(
          'UPDATE forms SET comments = ? WHERE id = ?',
          [JSON.stringify(comments), formId],
          (err: Error | null) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(comments[commentIndex]);
          }
        );
      });
    });
  }

  async deleteComment(formId: string, commentId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT comments FROM forms WHERE id = ?', [formId], (err: Error | null, row: DBForm | undefined) => {
        if (err) {
          reject(err);
          return;
        }
        if (!row) {
          reject(new Error('Form not found'));
          return;
        }

        const comments = JSON.parse(row.comments);
        const updatedComments = comments.filter((c: Comment) => c.id !== commentId);

        this.db.run(
          'UPDATE forms SET comments = ? WHERE id = ?',
          [JSON.stringify(updatedComments), formId],
          (err: Error | null) => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          }
        );
      });
    });
  }
}

export const database = new Database(); 