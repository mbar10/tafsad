export interface FormData {
  name: string;
  id: string;
  commander: string;
  occurrence: string;
  damage: string;
  prevention: string;
  date: string;
}

export interface FormResponse {
  _id: string;
  name: string;
  id: string;
  commander: string;
  occurrence: string;
  damage: string;
  prevention: string;
  date: string;
  columnId: string;
  punishment: string;
  comments: Comment[];
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
} 