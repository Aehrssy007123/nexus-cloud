import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { FileItem } from '../models/FileItem.js';
import { User } from '../models/User.js';
import { hdfsService } from '../storage/webhdfs.js';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Fetch user profile for quota info
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // Fetch all user files for real aggregation
    const allFiles = await FileItem.find({ owner: userId }).sort({ createdAt: -1 });

    const totalFiles = allFiles.length;
    const storageUsed = user.storageUsed;
    const storageQuota = user.storageQuota;
    const availableQuota = Math.max(0, storageQuota - storageUsed);

    // Recent 5 files
    const recentFiles = allFiles.slice(0, 5);

    // Distribution by file category
    // Palette compliant colors:
    // Documents: #D97736 (Burnt Orange)
    // Images: #E9A65A (Warm Amber)
    // Code: #8EA58A (Muted Sage)
    // Archives: #AAA69B (Muted Stone)
    // Media: #B87333 (Copper Bronze)
    // Other: #5C574F (Deep Umber)
    const categoryDefinitions: Record<string, { extensions: string[]; color: string }> = {
      Documents: {
        extensions: ['pdf', 'doc', 'docx', 'txt', 'md', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'rtf'],
        color: '#D97736',
      },
      Images: {
        extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'tiff', 'ico'],
        color: '#E9A65A',
      },
      Code: {
        extensions: ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'html', 'css', 'json', 'sql', 'sh', 'xml', 'yaml', 'yml'],
        color: '#8EA58A',
      },
      Archives: {
        extensions: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso'],
        color: '#AAA69B',
      },
      Media: {
        extensions: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'mp3', 'wav', 'flac', 'aac', 'ogg'],
        color: '#C48243',
      },
    };

    const categoryStats: Record<string, { name: string; count: number; bytes: number; color: string }> = {};

    // Initialize categories
    for (const [catName, def] of Object.entries(categoryDefinitions)) {
      categoryStats[catName] = { name: catName, count: 0, bytes: 0, color: def.color };
    }
    categoryStats['Other'] = { name: 'Other', count: 0, bytes: 0, color: '#6A675F' };

    for (const file of allFiles) {
      const ext = (file.extension || '').toLowerCase();
      let matched = false;
      for (const [catName, def] of Object.entries(categoryDefinitions)) {
        if (def.extensions.includes(ext)) {
          categoryStats[catName].count += 1;
          categoryStats[catName].bytes += file.size;
          matched = true;
          break;
        }
      }
      if (!matched) {
        categoryStats['Other'].count += 1;
        categoryStats['Other'].bytes += file.size;
      }
    }

    const fileTypeDistribution = Object.values(categoryStats).filter((c) => c.count > 0 || c.bytes > 0);

    // Recent 7 days upload activity
    const now = new Date();
    const activityMap: Record<string, { date: string; count: number; bytes: number; label: string }> = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      activityMap[key] = { date: key, count: 0, bytes: 0, label };
    }

    for (const file of allFiles) {
      const fileDate = new Date(file.createdAt).toISOString().split('T')[0];
      if (activityMap[fileDate]) {
        activityMap[fileDate].count += 1;
        activityMap[fileDate].bytes += file.size;
      }
    }

    const uploadActivity = Object.values(activityMap);

    // Live HDFS Health Status
    const hdfsHealth = await hdfsService.checkHealth();

    res.status(200).json({
      success: true,
      stats: {
        totalFiles,
        storageUsed,
        storageQuota,
        availableQuota,
        recentFiles,
        fileTypeDistribution,
        uploadActivity,
        hdfsStatus: {
          connected: hdfsHealth.connected,
          namenodeUrl: hdfsHealth.namenodeUrl,
          latencyMs: hdfsHealth.latencyMs || 0,
          clusterStatus: hdfsHealth.clusterStatus,
          error: hdfsHealth.error || null,
          totalCapacityBytes: hdfsHealth.totalCapacityBytes || 0,
          usedCapacityBytes: hdfsHealth.usedCapacityBytes || 0,
          freeCapacityBytes: hdfsHealth.freeCapacityBytes || 0,
          checkedAt: hdfsHealth.checkedAt,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to aggregate dashboard stats.', error: error.message });
  }
};
