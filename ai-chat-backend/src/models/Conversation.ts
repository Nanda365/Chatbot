import { Schema, model, Document, Types } from 'mongoose';

export interface IConversation extends Document {
  userId: Types.ObjectId;
  title: string;
  llmModel?: string;        // renamed to avoid conflict with Document.model
  createdAt?: Date;
  updatedAt?: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    // Use a non-conflicting name for the model used by a conversation
    llmModel: { type: String, default: undefined },
  },
  {
    timestamps: true,
  }
);

export default model<IConversation>('Conversation', ConversationSchema);
