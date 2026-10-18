import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavTab } from './components/Sidebar.js';
import { Navbar } from './components/Navbar.js';
import { DashboardView } from './components/DashboardView.js';
import { FileManagerView } from './components/FileManagerView.js';
import { AnalyticsView } from './components/AnalyticsView.js';
import { SettingsView } from './components/SettingsView.js';
import { AuthView } from './components/AuthView.js';
import { UploadModal } from './components/UploadModal.js';
import { HdfsDiagnosticsModal } from './components/HdfsDiagnosticsModal.js';
import { ToastProvider, useToast } from './components/Toast.js';
import {
  authService,
  dashboardService,
  fileService,
  folderService,
  healthService,
} from './services/api.js';
import {
  DashboardStats,
  FileItem,
  Folder,
  HDFSStatus,
  HealthInfo,
  User,
} from './types.js';

const MainApp: React.FC = () => {
  // Authentication State
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('nexus_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('nexus_token'));

  // Navigation State
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Folder navigation state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: 'Root' },
  ]);

  // Data State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [healthInfo, setHealthInfo] = useState<HealthInfo | null>(null);
  const [hdfsStatus, setHdfsStatus] = useState<HDFSStatus | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isHdfsModalOpen, setIsHdfsModalOpen] = useState(false);

  const { success, error, info } = useToast();

  // Load Dashboard Data
  const loadDashboardData = useCallback(async () => {
    if (!token) return;
    setLoadingStats(true);
    try {
      const data = await dashboardService.getStats();
      setStats(data.stats);
      setHdfsStatus(data.stats.hdfsStatus);
    } catch (err: any) {
      console.warn('Dashboard stats error:', err);
    } finally {
      setLoadingStats(false);
    }
  }, [token]);

  // Load File Manager Data
  const loadFilesAndFolders = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fileService.listFiles(currentFolderId, searchQuery);
      setFiles(data.files || []);
      setFolders(data.folders || []);
    } catch (err: any) {
      console.warn('Files fetch error:', err);
    }
  }, [token, currentFolderId, searchQuery]);

  // Load System & LAN Health
  const loadHealthData = useCallback(async () => {
    try {
      const health = await healthService.getSystemHealth();
      setHealthInfo(health);
    } catch (err) {
      // Non-critical
    }
  }, []);

  // Initial and reactive effects
  useEffect(() => {
    if (token) {
      loadDashboardData();
      loadHealthData();
      // Periodically refresh HDFS health every 15 seconds
      const interval = setInterval(() => {
        loadDashboardData();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [token, loadDashboardData, loadHealthData]);

  useEffect(() => {
    if (token) {
      loadFilesAndFolders();
    }
  }, [token, currentFolderId, searchQuery, loadFilesAndFolders]);

  // Check login validity on load
  useEffect(() => {
    if (token && !user) {
      authService
        .getMe()
        .then((res) => setUser(res.user))
        .catch(() => {
          localStorage.removeItem('nexus_token');
          localStorage.removeItem('nexus_user');
          setToken(null);
          setUser(null);
        });
    }
  }, [token, user]);

  const handleAuthSuccess = (authenticatedUser: User, authToken: string) => {
    setUser(authenticatedUser);
    setToken(authToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
    setToken(null);
    setUser(null);
    info('Logged out', 'You have been signed out of Nexus Cloud.');
  };

  // Folder Navigation Handlers
  const handleNavigateFolder = (folderId: string | null, folderName?: string) => {
    setCurrentFolderId(folderId);
    if (folderId && folderName) {
      setFolderPath((prev) => [...prev, { id: folderId, name: folderName }]);
    } else {
      setFolderPath([{ id: null, name: 'Root' }]);
    }
  };

  const handleNavigateBreadcrumb = (index: number) => {
    const target = folderPath[index];
    setCurrentFolderId(target.id);
    setFolderPath(folderPath.slice(0, index + 1));
  };

  // File Operations
  const handleFileUpload = async (file: File) => {
    try {
      const result = await fileService.uploadFile(file, currentFolderId);
      success('File uploaded to HDFS', `${file.name} stored in Hadoop cluster blocks.`);
      await loadFilesAndFolders();
      await loadDashboardData();
      // Refresh user storage used
      const me = await authService.getMe();
      setUser(me.user);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'File upload failed';
      error('Upload Failed', msg);
      throw err;
    }
  };

  const handleFileDropFromDashboard = (droppedFiles: FileList) => {
    if (droppedFiles.length > 0) {
      handleFileUpload(droppedFiles[0]);
    }
  };

  const handleDownloadFile = async (file: FileItem) => {
    try {
      info('Initiating download', `Fetching block stream from HDFS for ${file.name}...`);
      await fileService.downloadFile(file._id, file.name);
      success('Download completed', `${file.name} saved to local device.`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to download from HDFS';
      error('Download Failed', msg);
    }
  };

  const handleRenameFile = async (file: FileItem, newName: string) => {
    try {
      await fileService.renameFile(file._id, newName);
      success('File renamed', `Renamed to ${newName}`);
      await loadFilesAndFolders();
      await loadDashboardData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to rename file';
      error('Rename Failed', msg);
    }
  };

  const handleDeleteFile = async (file: FileItem) => {
    try {
      await fileService.deleteFile(file._id);
      success('File deleted', `Removed ${file.name} from HDFS and metadata.`);
      await loadFilesAndFolders();
      await loadDashboardData();
      // Refresh user quota
      const me = await authService.getMe();
      setUser(me.user);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete file';
      error('Delete Failed', msg);
    }
  };

  const handleCreateFolder = async (folderName: string) => {
    try {
      await folderService.createFolder(folderName, currentFolderId);
      success('Folder created', `Created folder "${folderName}".`);
      await loadFilesAndFolders();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create folder';
      error('Folder Error', msg);
    }
  };

  const handleDeleteFolder = async (folder: Folder) => {
    try {
      await folderService.deleteFolder(folder._id);
      success('Folder deleted', `Deleted folder "${folder.name}" and contents.`);
      await loadFilesAndFolders();
      await loadDashboardData();
      const me = await authService.getMe();
      setUser(me.user);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete folder';
      error('Delete Folder Error', msg);
    }
  };

  // If not logged in, show Auth View
  if (!token || !user) {
    return <AuthView onAuthSuccess={handleAuthSuccess} />;
  }

  const currentFolderName = folderPath[folderPath.length - 1]?.name || 'Root';

  return (
    <div className="flex h-screen bg-[#171816] text-[#F4F0E8] overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          setSearchQuery('');
        }}
        user={user}
        hdfsStatus={hdfsStatus}
        onLogout={handleLogout}
        onOpenHdfsDiagnostics={() => setIsHdfsModalOpen(true)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gradient-to-b from-[#171816] to-[#1c1d1a]">
        {/* Top Navbar */}
        <Navbar
          user={user}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (currentTab !== 'files' && q.trim()) {
              setCurrentTab('files');
            }
          }}
          onTriggerUpload={() => setIsUploadModalOpen(true)}
          lanIp={healthInfo?.recommendedHostIp || ''}
        />

        {/* Dynamic Views */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              loading={loadingStats}
              onRefresh={loadDashboardData}
              onNavigateToFiles={() => setCurrentTab('files')}
              onTriggerUpload={() => setIsUploadModalOpen(true)}
              onDownloadFile={handleDownloadFile}
              onDeleteFile={handleDeleteFile}
              onOpenHdfsDiagnostics={() => setIsHdfsModalOpen(true)}
              onFileDrop={handleFileDropFromDashboard}
            />
          )}

          {currentTab === 'files' && (
            <FileManagerView
              files={files}
              folders={folders}
              currentFolderId={currentFolderId}
              folderPath={folderPath}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onNavigateFolder={handleNavigateFolder}
              onNavigateBreadcrumb={handleNavigateBreadcrumb}
              onTriggerUpload={() => setIsUploadModalOpen(true)}
              onCreateFolder={handleCreateFolder}
              onDownloadFile={handleDownloadFile}
              onRenameFile={handleRenameFile}
              onDeleteFile={handleDeleteFile}
              onDeleteFolder={handleDeleteFolder}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView stats={stats} />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              user={user}
              hdfsStatus={hdfsStatus}
              healthInfo={healthInfo}
              onRefreshHdfs={loadDashboardData}
              onOpenHdfsDiagnostics={() => setIsHdfsModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleFileUpload}
        targetFolderName={currentFolderName}
        isHdfsConnected={Boolean(hdfsStatus?.connected)}
      />

      {/* HDFS Cluster Diagnostics Modal */}
      {isHdfsModalOpen && (
        <HdfsDiagnosticsModal
          hdfsStatus={hdfsStatus}
          onClose={() => setIsHdfsModalOpen(false)}
          onRefresh={loadDashboardData}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
};

export default App;
