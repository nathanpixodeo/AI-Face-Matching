import { Schema, model, Document, Types } from 'mongoose';

export interface IWorkspace extends Document {
  _id: Types.ObjectId;
  teamId: Types.ObjectId;
  name: string;
  notes?: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const workspaceSchema = new Schema<IWorkspace>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    name: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    status: { type: Boolean, default: true },
  },
  { timestamps: true },
);

workspaceSchema.index({ teamId: 1, name: 1 });

export const Workspace = model<IWorkspace>('Workspace', workspaceSchema);
