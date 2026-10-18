export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  storageQuota: number;
  storageUsed: number;
  createdAt?: string;
}

export interface FileItem {
  _id: string;
  name: string;
  originalName: string;
  hdfsPath: string;
  size: number;
  mimeType: string;
  extension: string;
  folderId: string | null;
  owner: string;
  isFolder: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  _id: string;
  name: string;
  parentFolderId: string | null;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export interface HDFSStatus {
  connected: boolean;
  namenodeUrl: string;
  latencyMs: number;
  clusterStatus?: string;
  error?: string | null;
  totalCapacityBytes?: number;
  usedCapacityBytes?: number;
  freeCapacityBytes?: number;
  checkedAt: string;
}

export interface CategoryStat {
  name: string;
  count: number;
  bytes: number;
  color: string;
}

export interface ActivityStat {
  date: string;
  count: number;
  bytes: number;
  label: string;
}

export interface DashboardStats {
  totalFiles: number;
  storageUsed: number;
  storageQuota: number;
  availableQuota: number;
  recentFiles: FileItem[];
  fileTypeDistribution: CategoryStat[];
  uploadActivity: ActivityStat[];
  hdfsStatus: HDFSStatus;
}

export interface HealthInfo {
  service: string;
  status: string;
  timestamp: string;
  uptimeSeconds: number;
  lanIps: { name: string; address: string; family: string }[];
  recommendedHostIp: string;
  mongodb: {
    status: string;
    database: string;
  };
  system: {
    platform: string;
    arch: string;
    hostname: string;
    nodeVersion: string;
  };
}
