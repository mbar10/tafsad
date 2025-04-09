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

      // Drop and recreate pending_forms table
      this.db.run('DROP TABLE IF EXISTS pending_forms');
      this.db.run(`CREATE TABLE pending_forms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        eventDescription TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
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

  // Pending Forms operations
  async createPendingForm(data: { name: string; eventDescription: string }): Promise<{ id: string; name: string; eventDescription: string; status: string; createdAt: string; updatedAt: string }> {
    const now = new Date().toISOString();
    const id = Date.now().toString();
    const status = 'pending';

    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO pending_forms (id, name, eventDescription, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [id, data.name, data.eventDescription, status, now, now],
        (err: Error | null) => {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            id,
            name: data.name,
            eventDescription: data.eventDescription,
            status,
            createdAt: now,
            updatedAt: now
          });
        }
      );
    });
  }

  async getPendingForms(): Promise<Array<{ id: string; name: string; eventDescription: string; status: string; createdAt: string; updatedAt: string }>> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM pending_forms ORDER BY created_at DESC`,
        (err: Error | null, rows: any[]) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows.map(row => ({
            id: row.id,
            name: row.name,
            eventDescription: row.eventDescription,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          })));
        }
      );
    });
  }

  async getPendingForm(id: string): Promise<{ id: string; name: string; eventDescription: string; status: string; createdAt: string; updatedAt: string } | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM pending_forms WHERE id = ?`,
        [id],
        (err: Error | null, row: any) => {
          if (err) {
            reject(err);
            return;
          }
          if (!row) {
            resolve(null);
            return;
          }
          resolve({
            id: row.id,
            name: row.name,
            eventDescription: row.eventDescription,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          });
        }
      );
    });
  }

  async updatePendingFormStatus(id: string, status: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE pending_forms SET status = ?, updated_at = ? WHERE id = ?',
        [status, new Date().toISOString(), id],
        function(this: RunResult, err: Error | null) {
          if (err) {
            reject(err);
            return;
          }
          if (this.changes === 0) {
            reject(new Error('Pending form not found'));
            return;
          }
          resolve();
        }
      );
    });
  }

  async deletePendingForm(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM pending_forms WHERE id = ?',
        [id],
        function(this: RunResult, err: Error | null) {
          if (err) {
            reject(err);
            return;
          }
          if (this.changes === 0) {
            reject(new Error('Pending form not found'));
            return;
          }
          resolve();
        }
      );
    });
  }
}

export const database = new Database(); 