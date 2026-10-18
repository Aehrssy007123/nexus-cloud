import { Response } from 'express';
import path from 'path';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.js';
import { FileItem } from '../models/FileItem.js';
import { Folder } from '../models/Folder.js';
import { User } from '../models/User.js';
import { hdfsService } from '../storage/webhdfs.js';

export const listFiles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { folderId, search } = req.query;

    const query: any = { owner: userId };

    if (search && typeof search === 'string' && search.trim().length > 0) {
      query.name = { $regex: search.trim(), $options: 'i' };
    } else {
      if (folderId && folderId !== 'root' && mongoose.isValidObjectId(folderId)) {
        query.folderId = folderId;
      } else {
        query.folderId = null; // Root directory
      }
    }

    const files = await FileItem.find(query).sort({ updatedAt: -1 });

    // Also fetch folders if not performing a cross-cutting search
    let folders: any[] = [];
    if (!search) {
      const folderQuery: any = { owner: userId };
      if (folderId && folderId !== 'root' && mongoose.isValidObjectId(folderId)) {
        folderQuery.parentFolderId = folderId;
      } else {
        folderQuery.parentFolderId = null;
      }
      folders = await Folder.find(folderQuery).sort({ name: 1 });
    }

    res.status(200).json({
      success: true,
      files,
      folders,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to list files.', error: error.message });
  }
};

export const uploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const file = req.file;
    const folderId = req.body.folderId && req.body.folderId !== 'root' && req.body.folderId !== 'null'
      ? req.body.folderId
      : null;

    if (!file) {
      res.status(400).json({ success: false, message: 'No file provided in request.' });
      return;
    }

    // Check user and storage quota
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    if (user.storageUsed + file.size > user.storageQuota) {
      res.status(400).json({
        success: false,
        message: `Storage quota exceeded. Available: ${Math.max(0, user.storageQuota - user.storageUsed)} bytes, File size: ${file.size} bytes.`,
      });
      return;
    }

    // Check HDFS health before attempting upload
    const hdfsHealth = await hdfsService.checkHealth();
    if (!hdfsHealth.connected) {
      res.status(503).json({
        success: false,
        message: `HDFS Storage Cluster is offline or unreachable at ${hdfsService.getBaseUrl()}. File content cannot be safely stored in Hadoop HDFS.`,
        error: hdfsHealth.error,
        code: 'HDFS_OFFLINE',
      });
      return;
    }

    // Format HDFS target path
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const hdfsPath = `/nexus-cloud/users/${userId}/${timestamp}_${sanitizedName}`;

    // Upload content to HDFS
    try {
      await hdfsService.uploadFile(hdfsPath, file.buffer, file.mimetype);
    } catch (hdfsErr: any) {
      res.status(502).json({
        success: false,
        message: `HDFS upload operation failed: ${hdfsErr.message}`,
        error: hdfsErr.message,
      });
      return;
    }

    // Extract extension
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');

    // Record metadata in MongoDB
    const fileItem = await FileItem.create({
      name: file.originalname,
      originalName: file.originalname,
      hdfsPath,
      size: file.size,
      mimeType: file.mimetype || 'application/octet-stream',
      extension: ext,
      folderId: folderId ? new mongoose.Types.ObjectId(folderId) : null,
      owner: new mongoose.Types.ObjectId(userId),
      isFolder: false,
    });

    // Update user's used storage
    user.storageUsed += file.size;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'File uploaded and stored in HDFS successfully.',
      file: fileItem,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'File upload error.', error: error.message });
  }
};

export const downloadFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, message: 'Invalid file ID.' });
      return;
    }

    const file = await FileItem.findById(id);
    if (!file) {
      res.status(404).json({ success: false, message: 'File not found in metadata registry.' });
      return;
    }

    // Access control ownership check
    if (file.owner.toString() !== userId && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Access denied: You do not own this file.' });
      return;
    }

    // Fetch stream from HDFS
    try {
      const hdfsStream = await hdfsService.downloadFile(file.hdfsPath);

      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
      res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
      res.setHeader('Content-Length', file.size);

      hdfsStream.pipe(res);
    } catch (hdfsErr: any) {
      res.status(502).json({
        success: false,
        message: `Failed to retrieve file from HDFS cluster: ${hdfsErr.message}`,
        error: hdfsErr.message,
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Download error.', error: error.message });
  }
};

export const renameFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ success: false, message: 'A valid new name is required.' });
      return;
    }

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, message: 'Invalid file ID.' });
      return;
    }

    const file = await FileItem.findById(id);
    if (!file) {
      res.status(404).json({ success: false, message: 'File not found.' });
      return;
    }

    if (file.owner.toString() !== userId && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    file.name = name.trim();
    file.extension = path.extname(name.trim()).toLowerCase().replace('.', '');
    await file.save();

    res.status(200).json({
      success: true,
      message: 'File renamed successfully.',
      file,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to rename file.', error: error.message });
  }
};

export const deleteFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, message: 'Invalid file ID.' });
      return;
    }

    const file = await FileItem.findById(id);
    if (!file) {
      res.status(404).json({ success: false, message: 'File not found.' });
      return;
    }

    if (file.owner.toString() !== userId && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    // Delete raw file from HDFS
    try {
      await hdfsService.deleteFile(file.hdfsPath);
    } catch (hdfsErr: any) {
      console.warn(`HDFS delete warning for ${file.hdfsPath}:`, hdfsErr.message);
      // We continue with database deletion to prevent orphan metadata if HDFS file was already removed
    }

    // Delete metadata
    await FileItem.findByIdAndDelete(id);

    // Update user quota
    await User.findByIdAndUpdate(userId, {
      $inc: { storageUsed: -file.size },
    });

    res.status(200).json({
      success: true,
      message: 'File deleted successfully from HDFS and metadata index.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete file.', error: error.message });
  }
};
