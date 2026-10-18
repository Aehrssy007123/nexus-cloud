import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.js';
import { Folder } from '../models/Folder.js';
import { FileItem } from '../models/FileItem.js';
import { User } from '../models/User.js';
import { hdfsService } from '../storage/webhdfs.js';

export const listFolders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { parentId } = req.query;

    const query: any = { owner: userId };
    if (parentId && parentId !== 'root' && mongoose.isValidObjectId(parentId)) {
      query.parentFolderId = parentId;
    } else {
      query.parentFolderId = null;
    }

    const folders = await Folder.find(query).sort({ name: 1 });
    res.status(200).json({ success: true, folders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to list folders.', error: error.message });
  }
};

export const createFolder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, parentFolderId } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Folder name is required.' });
      return;
    }

    const cleanParentId = parentFolderId && parentFolderId !== 'root' && mongoose.isValidObjectId(parentFolderId)
      ? new mongoose.Types.ObjectId(parentFolderId)
      : null;

    // Check duplicate
    const existing = await Folder.findOne({
      owner: userId,
      parentFolderId: cleanParentId,
      name: name.trim(),
    });

    if (existing) {
      res.status(409).json({ success: false, message: 'A folder with this name already exists in this location.' });
      return;
    }

    const folder = await Folder.create({
      name: name.trim(),
      parentFolderId: cleanParentId,
      owner: new mongoose.Types.ObjectId(userId),
    });

    // Create HDFS folder as well if HDFS is running
    try {
      await hdfsService.createDirectory(`/nexus-cloud/users/${userId}/folders/${folder._id}`);
    } catch {
      // Non-blocking
    }

    res.status(201).json({ success: true, message: 'Folder created successfully.', folder });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create folder.', error: error.message });
  }
};

export const deleteFolder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, message: 'Invalid folder ID.' });
      return;
    }

    const folder = await Folder.findById(id);
    if (!folder) {
      res.status(404).json({ success: false, message: 'Folder not found.' });
      return;
    }

    if (folder.owner.toString() !== userId && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    // Find all files inside this folder to clean up HDFS and storage quotas
    const files = await FileItem.find({ folderId: folder._id });
    let totalBytesFreed = 0;

    for (const f of files) {
      totalBytesFreed += f.size;
      try {
        await hdfsService.deleteFile(f.hdfsPath);
      } catch {
        // Continue
      }
    }

    await FileItem.deleteMany({ folderId: folder._id });
    await Folder.findByIdAndDelete(id);

    // Also recursively clean child folders if any
    await Folder.deleteMany({ parentFolderId: folder._id });

    if (totalBytesFreed > 0) {
      await User.findByIdAndUpdate(userId, {
        $inc: { storageUsed: -totalBytesFreed },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Folder and contents deleted successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete folder.', error: error.message });
  }
};
