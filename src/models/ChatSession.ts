import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface IChatSession extends Document {
  userEmail: string;
  sessionId: string;
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    id: { type: String, required: true },
    role: { type: String, required: true, enum: ['user', 'assistant', 'system'] },
    content: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { _id: false }
);

const ChatSessionSchema = new Schema<IChatSession>(
  {
    userEmail: { type: String, required: true, index: true, lowercase: true },
    sessionId: { type: String, required: true, unique: true },
    title: { type: String, required: true, default: 'New Conversation' },
    messages: { type: [MessageSchema], default: [] },
  },
  { timestamps: true }
);

const ChatSessionModel: Model<IChatSession> =
  mongoose.models.ChatSession || mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);

export default ChatSessionModel;
