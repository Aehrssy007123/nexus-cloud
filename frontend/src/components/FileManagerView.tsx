import React, { useState } from 'react';
import {
  FolderPlus,
  Upload,
  Search,
  LayoutGrid,
  List,
  Folder as FolderIcon,
  ChevronRight,
  MoreVertical,
  Download,
  Edit2,
  Trash2,
  Info,
  FileText,
  FileCode,
  Image as ImageIcon,
  Archive,
  Film,
  File,
  X,
  Database,
  ArrowLeft,
} from 'lucide-react';
import { FileItem, Folder } from '../types.js';
import { formatBytes, formatDateTime, getFileCategory } from '../utils/formatters.js';

interface FileManagerViewProps {
  files: FileItem[];
  folders: Folder[];
  currentFolderId: string | null;
  folderPath: { id: string | null; name: string }[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNavigateFolder: (folderId: string | null, folderName?: string) => void;
  onNavigateBreadcrumb: (index: number) => void;
  onTriggerUpload: () => void;
  onCreateFolder: (name: string) => Promise<void>;
  onDownloadFile: (file: FileItem) => void;
  onRenameFile: (file: FileItem, newName: string) => Promise<void>;
  onDeleteFile: (file: FileItem) => Promise<void>;
  onDeleteFolder: (folder: Folder) => Promise<void>;
}

export const FileManagerView: React.FC<FileManagerViewProps> = ({
  files,
  folders,
  currentFolderId,
  folderPath,
  searchQuery,
  onSearchChange,
  onNavigateFolder,
  onNavigateBreadcrumb,
  onTriggerUpload,
  onCreateFolder,
  onDownloadFile,
  onRenameFile,
  onDeleteFile,
  onDeleteFolder,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFileForInfo, setSelectedFileForInfo] = useState<FileItem | null>(null);

  // Modals state
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [fileToRename, setFileToRename] = useState<FileItem | null>(null);
  const [newFileName, setNewFileName] = useState('');

  const [itemToDelete, setItemToDelete] = useState<{ type: 'file' | 'folder'; item: any } | null>(null);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  const getIconForExtension = (ext: string, className = "w-5 h-5") => {
    const category = getFileCategory(ext);
    switch (category) {
      case 'Document':
        return <FileText className={`${className} text-[#D97736]`} />;
      case 'Image':
        return <ImageIcon className={`${className} text-[#E9A65A]`} />;
      case 'Code':
        return <FileCode className={`${className} text-[#8EA58A]`} />;
      case 'Archive':
        return <Archive className={`${className} text-[#AAA69B]`} />;
      case 'Media':
        return <Film className={`${className} text-[#C48243]`} />;
      default:
        return <File className={`${className} text-[#AAA69B]`} />;
    }
  };

  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await onCreateFolder(newFolderName.trim());
    setNewFolderName('');
    setShowCreateFolderModal(false);
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToRename || !newFileName.trim()) return;
    await onRenameFile(fileToRename, newFileName.trim());
    setFileToRename(null);
    setNewFileName('');
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'file') {
      await onDeleteFile(itemToDelete.item);
    } else {
      await onDeleteFolder(itemToDelete.item);
    }
    setItemToDelete(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#F4F0E8] font-mono tracking-tight">
            FILE MANAGER
          </h2>
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-1.5 text-xs text-[#AAA69B] mt-1.5 flex-wrap">
            {folderPath.map((item, index) => {
              const isLast = index === folderPath.length - 1;
              return (
                <React.Fragment key={item.id || 'root'}>
                  <button
                    onClick={() => onNavigateBreadcrumb(index)}
                    className={`hover:text-[#F4F0E8] transition-colors ${
                      isLast ? 'text-[#E9A65A] font-semibold' : ''
                    }`}
                  >
                    {item.name}
                  </button>
                  {!isLast && <ChevronRight className="w-3.5 h-3.5 text-[#393A33]" />}
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#AAA69B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search current folder..."
              className="nexus-input pl-8 pr-3 py-1.5 text-xs w-48 sm:w-60 bg-[#22231F]"
            />
          </div>

          <div className="flex items-center bg-[#22231F] border border-[#393A33] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#2B2C27] text-[#E9A65A]'
                  : 'text-[#AAA69B] hover:text-[#F4F0E8]'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#2B2C27] text-[#E9A65A]'
                  : 'text-[#AAA69B] hover:text-[#F4F0E8]'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowCreateFolderModal(true)}
            className="nexus-btn-secondary text-xs py-1.5 px-3"
          >
            <FolderPlus className="w-3.5 h-3.5 text-[#E9A65A]" />
            <span>New Folder</span>
          </button>

          <button
            onClick={onTriggerUpload}
            className="nexus-btn-primary text-xs py-1.5 px-3"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Files</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {folders.length === 0 && files.length === 0 ? (
        <div className="nexus-card p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#22231F] border border-[#393A33] flex items-center justify-center text-[#AAA69B] mb-3">
            <FolderIcon className="w-7 h-7 text-[#D97736]" />
          </div>
          <h3 className="text-sm font-semibold text-[#F4F0E8]">This folder is empty</h3>
          <p className="text-xs text-[#AAA69B] mt-1 max-w-sm mx-auto">
            Upload files to store them directly into Apache Hadoop HDFS cluster blocks.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => setShowCreateFolderModal(true)}
              className="nexus-btn-secondary text-xs"
            >
              <FolderPlus className="w-3.5 h-3.5 text-[#E9A65A]" />
              <span>Create Folder</span>
            </button>
            <button
              onClick={onTriggerUpload}
              className="nexus-btn-primary text-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload to HDFS</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Folders Section */}
          {folders.length > 0 && (
            <div>
              <h3 className="text-xs font-mono uppercase font-semibold text-[#AAA69B] tracking-wider mb-2.5">
                Folders ({folders.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {folders.map((folder) => (
                  <div
                    key={folder._id}
                    className="nexus-card p-3 flex items-center justify-between group hover:border-[#D97736]/60 transition-all cursor-pointer"
                    onClick={() => onNavigateFolder(folder._id, folder.name)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FolderIcon className="w-5 h-5 text-[#E9A65A] shrink-0" />
                      <span className="text-xs font-medium text-[#F4F0E8] truncate" title={folder.name}>
                        {folder.name}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemToDelete({ type: 'folder', item: folder });
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#AAA69B] hover:text-[#D97736] transition-opacity"
                      title="Delete Folder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files Section */}
          <div>
            <h3 className="text-xs font-mono uppercase font-semibold text-[#AAA69B] tracking-wider mb-2.5">
              Files ({files.length})
            </h3>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                {files.map((file) => (
                  <div
                    key={file._id}
                    className="nexus-card p-3.5 flex flex-col justify-between hover:border-[#D97736]/60 transition-all group relative"
                  >
                    {/* Top Row: Icon & Action Menu Button */}
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-lg bg-[#22231F] border border-[#393A33] flex items-center justify-center">
                        {getIconForExtension(file.extension, 'w-5 h-5')}
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => setActionMenuOpenId(actionMenuOpenId === file._id ? null : file._id)}
                          className="p-1 rounded text-[#AAA69B] hover:text-[#F4F0E8] hover:bg-[#353630]"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Action Dropdown Menu */}
                        {actionMenuOpenId === file._id && (
                          <div className="absolute right-0 top-7 w-36 bg-[#22231F] border border-[#393A33] rounded-lg shadow-xl py-1 z-20 animate-in fade-in zoom-in-95">
                            <button
                              onClick={() => {
                                onDownloadFile(file);
                                setActionMenuOpenId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-[#F4F0E8] hover:bg-[#2B2C27] flex items-center gap-2"
                            >
                              <Download className="w-3.5 h-3.5 text-[#8EA58A]" />
                              <span>Download</span>
                            </button>
                            <button
                              onClick={() => {
                                setFileToRename(file);
                                setNewFileName(file.name);
                                setActionMenuOpenId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-[#F4F0E8] hover:bg-[#2B2C27] flex items-center gap-2"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#E9A65A]" />
                              <span>Rename</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedFileForInfo(file);
                                setActionMenuOpenId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-[#F4F0E8] hover:bg-[#2B2C27] flex items-center gap-2"
                            >
                              <Info className="w-3.5 h-3.5 text-[#AAA69B]" />
                              <span>HDFS Info</span>
                            </button>
                            <div className="border-t border-[#393A33] my-1" />
                            <button
                              onClick={() => {
                                setItemToDelete({ type: 'file', item: file });
                                setActionMenuOpenId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-[#D97736] hover:bg-[#2B2C27] flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-[#D97736]" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle: File Name */}
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-[#F4F0E8] truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-[11px] font-mono text-[#AAA69B] mt-0.5">
                        {formatBytes(file.size)}
                      </p>
                    </div>

                    {/* Bottom: Date & Quick Download */}
                    <div className="mt-3 pt-2 border-t border-[#393A33]/60 flex items-center justify-between text-[10px] text-[#AAA69B]">
                      <span className="font-mono uppercase">{file.extension || 'FILE'}</span>
                      <button
                        onClick={() => onDownloadFile(file)}
                        className="text-[#E9A65A] hover:text-[#D97736] flex items-center gap-1 font-medium"
                      >
                        <Download className="w-3 h-3" />
                        <span>Get</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View Table */
              <div className="nexus-card overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#22231F] text-[#AAA69B] uppercase font-mono text-[11px] border-b border-[#393A33]">
                    <tr>
                      <th className="py-2.5 px-4 font-medium">Filename</th>
                      <th className="py-2.5 px-4 font-medium">Size</th>
                      <th className="py-2.5 px-4 font-medium">Type</th>
                      <th className="py-2.5 px-4 font-medium">Date Uploaded</th>
                      <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#393A33]">
                    {files.map((file) => (
                      <tr key={file._id} className="hover:bg-[#22231F]/60 transition-colors">
                        <td className="py-3 px-4 font-medium text-[#F4F0E8]">
                          <div className="flex items-center gap-2.5">
                            {getIconForExtension(file.extension)}
                            <span className="truncate max-w-xs sm:max-w-md" title={file.name}>
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
                          {formatDateTime(file.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onDownloadFile(file)}
                              className="p-1.5 rounded text-[#AAA69B] hover:text-[#8EA58A] hover:bg-[#353630]"
                              title="Download from HDFS"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setFileToRename(file);
                                setNewFileName(file.name);
                              }}
                              className="p-1.5 rounded text-[#AAA69B] hover:text-[#E9A65A] hover:bg-[#353630]"
                              title="Rename file"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setSelectedFileForInfo(file)}
                              className="p-1.5 rounded text-[#AAA69B] hover:text-[#F4F0E8] hover:bg-[#353630]"
                              title="View HDFS block metadata"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setItemToDelete({ type: 'file', item: file })}
                              className="p-1.5 rounded text-[#AAA69B] hover:text-[#D97736] hover:bg-[#353630]"
                              title="Delete file"
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
      )}

      {/* Modal: Create Folder */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#2B2C27] border border-[#393A33] rounded-xl max-w-sm w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#F4F0E8] font-mono flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-[#E9A65A]" />
                NEW FOLDER
              </h3>
              <button
                onClick={() => setShowCreateFolderModal(false)}
                className="text-[#AAA69B] hover:text-[#F4F0E8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateFolderSubmit}>
              <div className="mb-4">
                <label className="block text-xs text-[#AAA69B] mb-1.5">Folder Name</label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Laboratory Assignments"
                  className="nexus-input text-xs"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateFolderModal(false)}
                  className="nexus-btn-secondary text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="nexus-btn-primary text-xs py-1.5 px-4"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Rename File */}
      {fileToRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#2B2C27] border border-[#393A33] rounded-xl max-w-sm w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#F4F0E8] font-mono flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#E9A65A]" />
                RENAME FILE
              </h3>
              <button
                onClick={() => setFileToRename(null)}
                className="text-[#AAA69B] hover:text-[#F4F0E8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRenameSubmit}>
              <div className="mb-4">
                <label className="block text-xs text-[#AAA69B] mb-1.5">New Filename</label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="nexus-input text-xs"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFileToRename(null)}
                  className="nexus-btn-secondary text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFileName.trim()}
                  className="nexus-btn-primary text-xs py-1.5 px-4"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#2B2C27] border border-[#D97736]/50 rounded-xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-[#F4F0E8] font-mono flex items-center gap-2 text-[#D97736]">
              <Trash2 className="w-4 h-4" />
              CONFIRM DELETION
            </h3>
            <p className="text-xs text-[#AAA69B] mt-2 leading-relaxed">
              Are you sure you want to delete{' '}
              <strong className="text-[#F4F0E8]">{itemToDelete.item.name}</strong>?
              {itemToDelete.type === 'file'
                ? ' This will permanently remove the raw block stream from the HDFS cluster and delete its metadata.'
                : ' All files contained in this folder will also be deleted from HDFS.'}
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="nexus-btn-secondary text-xs py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="bg-[#D97736] hover:bg-[#C26325] text-white font-semibold text-xs py-1.5 px-4 rounded-lg transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: File HDFS Metadata Info */}
      {selectedFileForInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#2B2C27] border border-[#393A33] rounded-xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#F4F0E8] font-mono flex items-center gap-2">
                <Database className="w-4 h-4 text-[#E9A65A]" />
                HDFS BLOCK METADATA
              </h3>
              <button
                onClick={() => setSelectedFileForInfo(null)}
                className="text-[#AAA69B] hover:text-[#F4F0E8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded-lg bg-[#22231F] border border-[#393A33]">
                <span className="text-[#AAA69B] block font-mono text-[10px] uppercase">Original Filename</span>
                <span className="text-[#F4F0E8] font-semibold break-all">{selectedFileForInfo.name}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#22231F] border border-[#393A33]">
                <span className="text-[#AAA69B] block font-mono text-[10px] uppercase">HDFS Internal Block Path</span>
                <span className="text-[#E9A65A] font-mono break-all">{selectedFileForInfo.hdfsPath}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-[#22231F] border border-[#393A33]">
                  <span className="text-[#AAA69B] block font-mono text-[10px] uppercase">File Size</span>
                  <span className="text-[#F4F0E8] font-mono">{formatBytes(selectedFileForInfo.size)}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#22231F] border border-[#393A33]">
                  <span className="text-[#AAA69B] block font-mono text-[10px] uppercase">MIME Type</span>
                  <span className="text-[#F4F0E8] font-mono">{selectedFileForInfo.mimeType}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#22231F] border border-[#393A33]">
                <span className="text-[#AAA69B] block font-mono text-[10px] uppercase">Created At</span>
                <span className="text-[#F4F0E8]">{formatDateTime(selectedFileForInfo.createdAt)}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end">
              <button
                onClick={() => setSelectedFileForInfo(null)}
                className="nexus-btn-secondary text-xs py-1.5 px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
