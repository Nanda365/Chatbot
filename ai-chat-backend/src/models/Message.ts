import { Schema, model, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  metadata?: Record<string, any>; // Flexible metadata field
  tokens?: number;
  createdAt: Date;
  status: 'sent' | 'received' | 'error'; // Example statuses
}

const MessageSchema = new Schema<IMessage>({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  text: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed }, // Allows flexible data structure
  tokens: { type: Number },
  status: { type: String, enum: ['sent', 'received', 'error'], default: 'sent' },
}, { timestamps: true });

export default model<IMessage>('Message', MessageSchema);