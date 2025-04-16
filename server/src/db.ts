import mongoose from 'mongoose';
import { Form, PendingForm } from "./models";
import {Form as FormType} from "./types" 

export class Database {
  private uri: string;

  constructor(uri: string) {
    this.uri = uri;
  }

  async connect(): Promise<void> {
    try {
      await mongoose.connect(this.uri);
      console.log('✅ Connected to MongoDB');
    } catch (err) {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    }
  }

  async disconnect(): Promise<void> {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }

  async createForm(data: FormType): Promise<void> {
    const newForm = new Form(data);
    await newForm.save();
  }

  async getAllForms(): Promise<FormType[]> {
    return Form.find().lean();
  }

  async updateFormColumn(id: string, columnId: string): Promise<void> {
    const result = await Form.updateOne({ id }, { columnId });
    if (result.modifiedCount === 0) throw new Error('Form not found');
  }

  async updateFormPunishment(id: string, punishment: string): Promise<void> {
    const result = await Form.updateOne({ id }, { punishment });
  }


  async addComment(formId: string, text: string): Promise<any> {
    const form = await Form.findOne({ id: formId });
    if (!form) throw new Error('Form not found');

    const newComment = {
      id: Date.now().toString(),
      text,
      createdAt: new Date().toISOString()
    };

    form.comments.push(newComment);
    await form.save();
    return newComment;
  }

  async updateComment(formId: string, commentId: string, text: string): Promise<any> {
    const form = await Form.findOne({ id: formId });
    if (!form) throw new Error('Form not found');

    const comment = form.comments.find(c => c.id === commentId);
    if (!comment) throw new Error('Comment not found');

    comment.text = text;
    await form.save();
    return comment;
  }

  async deleteComment(formId: string, commentId: string): Promise<void> {
    const form = await Form.findOne({ id: formId });
    if (!form) throw new Error('Form not found');
  
    form.comments.pull({ id: commentId });
    await form.save();
  }
  
  async createPendingForm(data: { name: string; eventDescription: string }) {
    const now = new Date().toISOString();
    const id = Date.now().toString();

    const pendingForm = new PendingForm({
      id,
      name: data.name,
      eventDescription: data.eventDescription,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    });

    await pendingForm.save();
    return pendingForm.toObject();
  }

  async getPendingForms() {
    const rows = await PendingForm.find().sort({ createdAt: -1 }).lean();
    return rows;
  }

  async getPendingForm(id: string) {
    const form = await PendingForm.findOne({ id }).lean();
    return form || null;
  }

  async updatePendingFormStatus(id: string, status: string): Promise<void> {
    const result = await PendingForm.updateOne({ id }, { status, updatedAt: new Date().toISOString() });
    if (result.modifiedCount === 0) throw new Error('Pending form not found');
  }

  async deletePendingForm(id: string): Promise<void> {
    const result = await PendingForm.deleteOne({ id });
    if (result.deletedCount === 0) throw new Error('Pending form not found');
  }
}
