import axios, { AxiosProgressEvent } from 'axios';
import { DashboardStats, FileItem, Folder, HealthInfo, User } from '../types.js';

// Dynamic API URL determination for seamless LAN support
const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // If running in browser, connect to backend on port 5000 of same host/IP
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname || 'localhost';
    return `http://${hostname}:5000/api`;
  }
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Interceptor for attaching auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nexus_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for 401 response handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if invalid or expired
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('nexus_token');
        localStorage.removeItem('nexus_user');
      }
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  async register(name: string, email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await api.post('/auth/register', { name, email, password });
    return res.data;
  },

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  async getMe(): Promise<{ user: User }> {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

// File Service
export const fileService = {
  async listFiles(folderId?: string | null, search?: string): Promise<{ files: FileItem[]; folders: Folder[] }> {
    const params: Record<string, string> = {};
    if (folderId && folderId !== 'root') {
      params.folderId = folderId;
    }
    if (search && search.trim()) {
      params.search = search.trim();
    }
    const res = await api.get('/files', { params });
    return res.data;
  },

  async uploadFile(
    file: File,
    folderId?: string | null,
    onProgress?: (progress: number) => void
  ): Promise<{ file: FileItem; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId && folderId !== 'root') {
      formData.append('folderId', folderId);
    }

    const res = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    return res.data;
  },

  async downloadFile(fileId: string, filename: string): Promise<void> {
    const res = await api.get(`/files/${fileId}/download`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async renameFile(fileId: string, name: string): Promise<{ file: FileItem }> {
    const res = await api.patch(`/files/${fileId}`, { name });
    return res.data;
  },

  async deleteFile(fileId: string): Promise<void> {
    await api.delete(`/files/${fileId}`);
  },
};

// Folder Service
export const folderService = {
  async listFolders(parentId?: string | null): Promise<{ folders: Folder[] }> {
    const params = parentId && parentId !== 'root' ? { parentId } : {};
    const res = await api.get('/folders', { params });
    return res.data;
  },

  async createFolder(name: string, parentFolderId?: string | null): Promise<{ folder: Folder }> {
    const res = await api.post('/folders', {
      name,
      parentFolderId: parentFolderId && parentFolderId !== 'root' ? parentFolderId : null,
    });
    return res.data;
  },

  async deleteFolder(id: string): Promise<void> {
    await api.delete(`/folders/${id}`);
  },
};

// Dashboard Service
export const dashboardService = {
  async getStats(): Promise<{ stats: DashboardStats }> {
    const res = await api.get('/dashboard/stats');
    return res.data;
  },
};

// Health Service
export const healthService = {
  async getSystemHealth(): Promise<HealthInfo> {
    const res = await api.get('/health');
    return res.data;
  },

  async getStorageHealth(): Promise<{ hdfs: any; troubleshooting: string }> {
    const res = await api.get('/health/storage');
    return res.data;
  },
};
