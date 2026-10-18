import mongoose, { Document, Schema } from 'mongoose';

export interface IFileItem extends Document {
  name: string;
  originalName: string;
  hdfsPath: string;
  size: number; // In bytes
  mimeType: string;
  extension: string;
  folderId: mongoose.Types.ObjectId | null;
  owner: mongoose.Types.ObjectId;
  isFolder: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FileItemSchema = new Schema<IFileItem>(
  {
    name: { type: String, required: true, trim: true },
    originalName: { type: String, required: true },
    hdfsPath: { type: String, required: true },
    size: { type: Number, required: true, default: 0 },
    mimeType: { type: String, default: 'application/octet-stream' },
    extension: { type: String, default: '' },
    folderId: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    isFolder: { type: Boolean, default: false },
  },
  { timestamps: true }
);

FileItemSchema.index({ owner: 1, folderId: 1, name: 1 });

export const FileItem = mongoose.model<IFileItem>('FileItem', FileItemSchema);
