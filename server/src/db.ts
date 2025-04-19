import mongoose from 'mongoose';
import { Form, PendingForm } from "./models";
import {Form as FormType, PendingForm as PendingFormType} from "./types" 

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
    const form = await Form.findOne({ id }).lean();
    if (!form) throw new Error('Form not found');
    
    // If the form is already in the requested column, return without updating
    if (form.columnId === columnId) return;
    
    // Otherwise, update the column
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
  
  async createPendingForm(data: PendingFormType) {
    const now = new Date().toISOString();
    const id = Date.now().toString();

    const pendingForm = new PendingForm({
      id,
      name: data.name,
      commander: data.commander,
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

  async deletePendingForm(id: string): Promise<void> {
    const result = await PendingForm.deleteOne({ id });
    if (result.deletedCount === 0) throw new Error('Pending form not found');
  }

  async mergePendingFormWithForm(pendingFormId: string, formId: string) {
    const pendingForm = await PendingForm.findOne({ id: pendingFormId });
    if (!pendingForm) throw new Error('Pending form not found');
  
    const form = await Form.findOne({ id: formId });
    if (!form) throw new Error('Form not found');
  
    form.connectedPendingForm = pendingForm;
    await form.save();
    await PendingForm.deleteOne({ id: pendingFormId });
    return form;
  }

  async deleteForm(id: string): Promise<void> {
    const result = await Form.deleteOne({ id });
    if (result.deletedCount === 0) throw new Error('Form not found');
  }
}
