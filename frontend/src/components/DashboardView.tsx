import React from 'react';
import {
  Files,
  HardDrive,
  Database,
  ArrowUpRight,
  Download,
  Trash2,
  UploadCloud,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileCode,
  Image as ImageIcon,
  Archive,
  Film,
  File,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import { DashboardStats, FileItem } from '../types.js';
import { formatBytes, formatDate, getFileCategory } from '../utils/formatters.js';

interface DashboardViewProps {
  stats: DashboardStats | null;
  loading: boolean;
  onRefresh: () => void;
  onNavigateToFiles: () => void;
  onTriggerUpload: () => void;
  onDownloadFile: (file: FileItem) => void;
  onDeleteFile: (file: FileItem) => void;
  onOpenHdfsDiagnostics: () => void;
  onFileDrop: (files: FileList) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  loading,
  onRefresh,
  onNavigateToFiles,
  onTriggerUpload,
  onDownloadFile,
  onDeleteFile,
  onOpenHdfsDiagnostics,
  onFileDrop,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileDrop(e.dataTransfer.files);
    }
  };

  const getIconForExtension = (ext: string) => {
    const category = getFileCategory(ext);
    switch (category) {
      case 'Document':
        return <FileText className="w-4 h-4 text-[#D97736]" />;
      case 'Image':
        return <ImageIcon className="w-4 h-4 text-[#E9A65A]" />;
      case 'Code':
        return <FileCode className="w-4 h-4 text-[#8EA58A]" />;
      case 'Archive':
        return <Archive className="w-4 h-4 text-[#AAA69B]" />;
      case 'Media':
        return <Film className="w-4 h-4 text-[#C48243]" />;
      default:
        return <File className="w-4 h-4 text-[#AAA69B]" />;
    }
  };

  const totalFiles = stats?.totalFiles || 0;
  const storageUsed = stats?.storageUsed || 0;
  const storageQuota = stats?.storageQuota || 1024 * 1024 * 1024;
  const availableQuota = Math.max(0, storageQuota - storageUsed);
  const percentUsed = Math.min(100, Math.round((storageUsed / storageQuota) * 100));
  const hdfsStatus = stats?.hdfsStatus;

  const distribution = stats?.fileTypeDistribution || [];
  const activityData = stats?.uploadActivity || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#F4F0E8] font-mono tracking-tight">
            SYSTEM DASHBOARD
          </h2>
          <p className="text-xs text-[#AAA69B] mt-0.5">
            Cloud Controller metrics and HDFS distributed block storage telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="nexus-btn-secondary text-xs py-1.5 px-3"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#E9A65A]' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={onTriggerUpload}
            className="nexus-btn-primary text-xs py-1.5 px-3"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload to HDFS</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Files Card */}
        <div className="nexus-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#AAA69B] uppercase font-mono tracking-wider">
              Total Files
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#22231F] border border-[#393A33] flex items-center justify-center">
              <Files className="w-4 h-4 text-[#E9A65A]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-[#F4F0E8]">{totalFiles}</span>
            <span className="text-xs text-[#AAA69B] ml-2">in metadata index</span>
          </div>
          <button
            onClick={onNavigateToFiles}
            className="mt-3 text-xs text-[#D97736] hover:text-[#E9A65A] flex items-center gap-1 font-medium transition-colors"
          >
            <span>Manage files</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* Storage Used Card */}
        <div className="nexus-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#AAA69B] uppercase font-mono tracking-wider">
              Storage Used
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#22231F] border border-[#393A33] flex items-center justify-center">
              <HardDrive className="w-4 h-4 text-[#D97736]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-[#F4F0E8]">
              {formatBytes(storageUsed)}
            </span>
            <span className="text-xs text-[#AAA69B] ml-2 font-mono">({percentUsed}%)</span>
          </div>
          <div className="mt-3 w-full bg-[#171816] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${percentUsed}%`,
                background: 'linear-gradient(90deg, #D97736, #E9A65A)',
              }}
            />
          </div>
        </div>

        {/* Available Storage Quota Card */}
        <div className="nexus-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#AAA69B] uppercase font-mono tracking-wider">
              Available Quota
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#22231F] border border-[#393A33] flex items-center justify-center">
              <Database className="w-4 h-4 text-[#8EA58A]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-[#F4F0E8]">
              {formatBytes(availableQuota)}
            </span>
            <span className="text-xs text-[#AAA69B] ml-2">free</span>
          </div>
          <p className="mt-3 text-[11px] text-[#AAA69B] font-mono">
            Limit: {formatBytes(storageQuota)}
          </p>
        </div>

        {/* HDFS Cluster Status Card */}
        <div
          onClick={onOpenHdfsDiagnostics}
          className="nexus-card p-4 flex flex-col justify-between cursor-pointer group hover:border-[#D97736]/60 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#AAA69B] uppercase font-mono tracking-wider">
              HDFS Status
            </span>
            <div
              className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                hdfsStatus?.connected
                  ? 'bg-[#8EA58A]/10 border-[#8EA58A]/30 text-[#8EA58A]'
                  : 'bg-[#D97736]/10 border-[#D97736]/30 text-[#D97736]'
              }`}
            >
              {hdfsStatus?.connected ? (
                <CheckCircle2 className="w-4 h-4 text-[#8EA58A]" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#D97736]" />
              )}
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  hdfsStatus?.connected
                    ? 'bg-[#8EA58A]'
                    : 'bg-[#D97736] animate-pulse-subtle'
                }`}
              />
              <span className="text-base font-bold text-[#F4F0E8] font-mono">
                {hdfsStatus?.connected ? 'Cluster Active' : 'Cluster Offline'}
              </span>
            </div>
            <p className="text-[11px] text-[#AAA69B] mt-1 font-mono truncate">
              {hdfsStatus?.connected ? `${hdfsStatus.namenodeUrl} (${hdfsStatus.latencyMs}ms)` : 'Click for setup & fix'}
            </p>
          </div>
          <span className="mt-3 text-xs text-[#E9A65A] flex items-center gap-1 font-medium group-hover:underline">
            <span>Diagnostics & Cluster Health</span>
            <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* Quick Upload Dropzone Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={onTriggerUpload}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-[#D97736] bg-[#D97736]/10'
            : 'border-[#393A33] hover:border-[#D97736]/60 bg-[#22231F]/60'
        }`}
      >
        <div className="w-12 h-12 mx-auto rounded-full bg-[#2B2C27] border border-[#393A33] flex items-center justify-center text-[#D97736] mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-[#F4F0E8]">
          Drag and drop files here, or click to upload
        </h3>
        <p className="text-xs text-[#AAA69B] mt-1">
          Files are automatically partitioned and streamed into Apache Hadoop HDFS raw block storage.
        </p>
      </div>

      {/* Analytics Preview Row (Donut & Activity Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Storage Distribution Donut Chart */}
        <div className="nexus-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#F4F0E8] font-mono">
                STORAGE DISTRIBUTION
              </h3>
              <p className="text-xs text-[#AAA69B]">Usage categorized by file formats</p>
            </div>
          </div>

          {distribution.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center p-4">
              <Files className="w-8 h-8 text-[#AAA69B]/40 mb-2" />
              <p className="text-xs text-[#AAA69B]">No files uploaded yet.</p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-48 h-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribution}
                      dataKey="bytes"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#22231F" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatBytes(Number(val)), 'Storage']}
                      contentStyle={{
                        backgroundColor: '#22231F',
                        borderColor: '#393A33',
                        borderRadius: '0.5rem',
                        fontSize: '12px',
                        color: '#F4F0E8',
                      }}
                      itemStyle={{ color: '#F4F0E8' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 space-y-2 w-full">
                {distribution.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-[#F4F0E8] font-medium">{cat.name}</span>
                      <span className="text-[#AAA69B] text-[10px]">({cat.count})</span>
                    </div>
                    <span className="font-mono text-[#AAA69B]">{formatBytes(cat.bytes)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 7-Day Upload Volume Bar Chart */}
        <div className="nexus-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#F4F0E8] font-mono">
                UPLOAD ACTIVITY (LAST 7 DAYS)
              </h3>
              <p className="text-xs text-[#AAA69B]">Daily file uploads into cluster</p>
            </div>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  stroke="#AAA69B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#393A33' }}
                />
                <YAxis
                  stroke="#AAA69B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#393A33' }}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(val: any) => [val, 'Files Uploaded']}
                  contentStyle={{
                    backgroundColor: '#22231F',
                    borderColor: '#393A33',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                    color: '#F4F0E8',
                  }}
                  itemStyle={{ color: '#E9A65A' }}
                />
                <Bar dataKey="count" fill="#D97736" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Files Table */}
      <div className="nexus-card overflow-hidden">
        <div className="p-4 border-b border-[#393A33] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#E9A65A]" />
            <h3 className="text-sm font-bold text-[#F4F0E8] font-mono">RECENT FILES</h3>
          </div>
          <button
            onClick={onNavigateToFiles}
            className="text-xs text-[#D97736] hover:text-[#E9A65A] font-medium flex items-center gap-1"
          >
            <span>View all files</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {(!stats?.recentFiles || stats.recentFiles.length === 0) ? (
          <div className="p-8 text-center">
            <p className="text-xs text-[#AAA69B]">No files uploaded yet.</p>
            <button
              onClick={onTriggerUpload}
              className="mt-3 nexus-btn-secondary text-xs"
            >
              Upload your first file
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#22231F] text-[#AAA69B] uppercase font-mono text-[11px] border-b border-[#393A33]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Filename</th>
                  <th className="py-2.5 px-4 font-medium">Size</th>
                  <th className="py-2.5 px-4 font-medium">Type</th>
                  <th className="py-2.5 px-4 font-medium">Uploaded</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#393A33]">
                {stats.recentFiles.map((file) => (
                  <tr key={file._id} className="hover:bg-[#22231F]/60 transition-colors group">
                    <td className="py-3 px-4 font-medium text-[#F4F0E8]">
                      <div className="flex items-center gap-2.5 max-w-xs truncate">
                        {getIconForExtension(file.extension)}
                        <span className="truncate" title={file.name}>
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#AAA69B] font-mono whitespace-nowrap">
                      {formatBytes(file.size)}
                    </td>
                    <td className="py-3 px-4 text-[#AAA69B] uppercase font-mono text-[10px] whitespace-nowrap">
                      {file.extension || 'FILE'}
                    </td>
                    <td className="py-3 px-4 text-[#AAA69B] whitespace-nowrap">
                      {formatDate(file.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onDownloadFile(file)}
                          className="p-1 rounded text-[#AAA69B] hover:text-[#8EA58A] hover:bg-[#353630] transition-colors"
                          title="Download from HDFS"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteFile(file)}
                          className="p-1 rounded text-[#AAA69B] hover:text-[#D97736] hover:bg-[#353630] transition-colors"
                          title="Delete from HDFS & metadata"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
