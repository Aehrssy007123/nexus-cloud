import mongoose, { Document, Schema } from 'mongoose';

export interface IFolder extends Document {
  name: string;
  parentFolderId: mongoose.Types.ObjectId | null;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FolderSchema = new Schema<IFolder>(
  {
    name: { type: String, required: true, trim: true },
    parentFolderId: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

FolderSchema.index({ owner: 1, parentFolderId: 1, name: 1 }, { unique: true });

export const Folder = mongoose.model<IFolder>('Folder', FolderSchema);
