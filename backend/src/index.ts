import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import os from 'os';
import authRoutes from './routes/authRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = '0.0.0.0'; // Bind to all interfaces for LAN access

// Middleware
app.use(cors({
  origin: true, // Allow LAN clients from any IP
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/health', healthRoutes);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({
    project: 'NEXUS CLOUD Controller',
    version: '1.0.0',
    description: 'Cloud Controller for SaaS over LAN using HDFS and MongoDB',
    endpoints: {
      health: '/api/health',
      storageHealth: '/api/health/storage',
      auth: '/api/auth',
      files: '/api/files',
      folders: '/api/folders',
      dashboard: '/api/dashboard/stats',
    },
  });
});

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.url}` });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[CLOUD CONTROLLER ERROR]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Cloud Controller Server Error',
  });
});

// Helper to get primary LAN IP
function getLanIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (iface) {
      for (const addr of iface) {
        if (!addr.internal && addr.family === 'IPv4') {
          return addr.address;
        }
      }
    }
  }
  return 'localhost';
}

// Database Connection & Server Initialization
async function startServer() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexus_cloud';

  try {
    console.log(`[Cloud Controller] Connecting to MongoDB at ${mongoUri}...`);
    // Attempt standard connection with 3s timeout
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('[Cloud Controller] MongoDB connected successfully.');
  } catch (err: any) {
    console.warn(`[Cloud Controller] Could not connect to external MongoDB: ${err.message}`);
    console.log('[Cloud Controller] Initializing MongoDB in-memory fallback for zero-friction demonstration...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create({
        instance: { dbName: 'nexus_cloud' },
      });
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log(`[Cloud Controller] In-memory MongoDB operational at ${uri}`);
    } catch (memErr: any) {
      console.error('[Cloud Controller] Fatal: Failed to initialize database:', memErr.message);
      process.exit(1);
    }
  }

  app.listen(PORT, HOST, () => {
    const lanIp = getLanIp();
    console.log('====================================================');
    console.log('   NEXUS CLOUD CONTROLLER (SaaS LAN Architecture)   ');
    console.log('====================================================');
    console.log(` Local Access:      http://localhost:${PORT}`);
    console.log(` LAN Network Access: http://${lanIp}:${PORT}`);
    console.log(` HDFS Target:       ${process.env.HDFS_URL || 'http://localhost:9870/webhdfs/v1'}`);
    console.log('====================================================');
  });
}

startServer();
