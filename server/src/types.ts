import { Request } from 'express';

export interface Form {
  id: string;
  name: string;
  commander: string;
  eventDescription: string;
  occurrence: string;
  damage: string;
  prevention: string;
  date: string;
  requestDateTime: string;
  columnId: string;
  punishment: string;
  comments: Comment[];
  connectedPendingForm?: PendingForm
}

export interface PendingForm {
  name: string;
  commander: string;
  eventDescription: string; 
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
}

export interface AdminUser {
  username: string;
  password: string;
}

export interface AuthRequest extends Request {
  user?: any;
}

export interface ColumnUpdateRequest extends Request {
  params: {
    id: string;
  };
  body: {
    columnId: string;
  };
}

export interface PunishmentUpdateRequest extends Request {
  params: {
    id: string;
  };
  body: {
    punishment: string;
  };
}

export interface CommentCreateRequest extends Request {
  params: {
    id: string;
  };
  body: {
    text: string;
  };
}

export interface CommentUpdateRequest extends Request {
  params: {
    formId: string;
    commentId: string;
  };
  body: {
    text: string;
  };
} 

export interface FormGroup {
  id: string;
  title: string;
  description: string;
  punishment: string;
  columnId: String;
  forms: string[]; // list of Form ids
  comments: Comment[];
  createdAt: string;
}