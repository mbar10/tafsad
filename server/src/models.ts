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
  isConnectedWithForm: Boolean
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
  connectedPendingForm: { type: mongoose.Schema.Types.ObjectId, ref: 'PendingForm', default: null }
});

export const FormGroupSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: String,
  description: String,
  punishment: String,
  columnId: String,
  forms: [{ type: String }], // list of form IDs
  comments: [CommentSchema],
  createdAt: String
});


export const Form = mongoose.model('Form', FormSchema);
export const PendingForm = mongoose.model('PendingForm', PendingFormSchema);
export const FormGroup = mongoose.model('FormGroup', FormGroupSchema);
