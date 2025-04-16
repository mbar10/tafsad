import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: String, required: true },
}, { _id: false });

const PendingFormSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  commander: String,
  eventDescription: String,
  createdAt: String,
  updatedAt: String,
});

const FormSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  commander: String,
  eventDescription: String,
  occurrence: String,
  damage: String,
  prevention: String,
  date: String,
  requestDateTime: String,
  columnId: String,
  punishment: String,
  comments: { type: [CommentSchema], default: [] },
  connectedPendingForm: { type: PendingFormSchema, default: null }
});

const ColumnSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: String,
  order: Number,
});

export const Form = mongoose.model('Form', FormSchema);
export const Column = mongoose.model('Column', ColumnSchema);
export const PendingForm = mongoose.model('PendingForm', PendingFormSchema);
