import { Request, Response } from 'express';
import os from 'os';
import mongoose from 'mongoose';
import { hdfsService } from '../storage/webhdfs.js';

export const getHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const interfaces = os.networkInterfaces();
    const lanIps: { name: string; address: string; family: string }[] = [];

    for (const [ifaceName, addresses] of Object.entries(interfaces)) {
      if (!addresses) continue;
      for (const addr of addresses) {
        // Exclude internal 127.0.0.1
        if (!addr.internal && addr.family === 'IPv4') {
          lanIps.push({
            name: ifaceName,
            address: addr.address,
            family: addr.family,
          });
        }
      }
    }

    const mongoState = mongoose.connection.readyState;
    const mongoStatusMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    res.status(200).json({
      success: true,
      service: 'NEXUS CLOUD Controller',
      status: 'operational',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      lanIps,
      recommendedHostIp: lanIps.length > 0 ? lanIps[0].address : '127.0.0.1',
      mongodb: {
        status: mongoStatusMap[mongoState] || 'unknown',
        database: mongoose.connection.name || 'nexus_cloud',
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Health check failed.', error: error.message });
  }
};

export const getStorageHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = await hdfsService.checkHealth();
    res.status(200).json({
      success: true,
      storageService: 'Apache Hadoop WebHDFS',
      hdfs: status,
      troubleshooting: status.connected
        ? 'HDFS is connected and ready to accept file block streams.'
        : `To start Hadoop HDFS on this computer or LAN:
1. Ensure Hadoop is installed or run 'docker-compose up -d' from the project root.
2. Check that WebHDFS is enabled in hdfs-site.xml:
   <property>
     <name>dfs.webhdfs.enabled</name>
     <value>true</value>
   </property>
3. Verify NameNode is accessible at ${status.namenodeUrl}.
4. For quick testing without Docker, start the bundled WebHDFS daemon: 'node infrastructure/mock-webhdfs-daemon.js'.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Storage health check failed.', error: error.message });
  }
};
