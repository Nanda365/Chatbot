import { Schema, model, Document } from 'mongoose';

export interface IFAQ extends Document {
  question: string;
  answer: string;
  tags?: string[];
  createdAt: Date;
}

const FAQSchema = new Schema<IFAQ>({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  tags: [{ type: String }],
}, { timestamps: true });

export default model<IFAQ>('FAQ', FAQSchema);