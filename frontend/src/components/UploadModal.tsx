import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  X,
  File,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
} from 'lucide-react';
import { formatBytes } from '../utils/formatters.js';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  targetFolderName?: string;
  isHdfsConnected: boolean;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  targetFolderName = 'Root',
  isHdfsConnected,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setErrorText(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
      setErrorText(null);
    }
  };

  const handleStartUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setStatusText('Initiating 2-step WebHDFS protocol with NameNode...');
    setErrorText(null);

    try {
      setStatusText('Streaming file payload to HDFS DataNode...');
      await onUpload(selectedFile);
      setUploadProgress(100);
      setStatusText('Blocks committed and metadata recorded in MongoDB.');
      setTimeout(() => {
        handleReset();
        onClose();
      }, 1200);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Upload failed';
      setErrorText(msg);
      setStatusText('Operation aborted.');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploading(false);
    setUploadProgress(0);
    setStatusText('');
    setErrorText(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#2B2C27] border border-[#393A33] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#393A33] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#22231F] border border-[#393A33] flex items-center justify-center text-[#D97736]">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F4F0E8] font-mono">
                UPLOAD TO HDFS CLUSTER
              </h3>
              <p className="text-[11px] text-[#AAA69B]">
                Destination: <span className="text-[#E9A65A] font-semibold">{targetFolderName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (!uploading) {
                handleReset();
                onClose();
              }
            }}
            disabled={uploading}
            className="text-[#AAA69B] hover:text-[#F4F0E8] p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* HDFS Warning if offline */}
        {!isHdfsConnected && (
          <div className="p-3 rounded-lg bg-[#D97736]/15 border border-[#D97736]/40 text-xs text-[#F4F0E8] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#D97736] shrink-0 mt-0.5" />
            <div>
              <strong className="block text-[#D97736]">HDFS NameNode Unreachable</strong>
              HDFS cluster is currently offline. File upload will be rejected by Cloud Controller until HDFS is running.
            </div>
          </div>
        )}

        {/* Dropzone */}
        {!selectedFile ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#393A33] hover:border-[#D97736]/60 rounded-xl p-8 text-center cursor-pointer bg-[#22231F]/50 transition-colors"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 mx-auto rounded-full bg-[#2B2C27] border border-[#393A33] flex items-center justify-center text-[#D97736] mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-[#F4F0E8]">
              Select a file or drag it here
            </p>
            <p className="text-[11px] text-[#AAA69B] mt-1">
              Supports documents, archives, images, code, and binaries up to 100 MB
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[#22231F] border border-[#393A33] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <File className="w-5 h-5 text-[#E9A65A] shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#F4F0E8] truncate" title={selectedFile.name}>
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] font-mono text-[#AAA69B]">
                    {formatBytes(selectedFile.size)} &bull; {selectedFile.type || 'Binary'}
                  </p>
                </div>
              </div>
              {!uploading && (
                <button
                  onClick={handleReset}
                  className="text-xs text-[#AAA69B] hover:text-[#D97736]"
                >
                  Change
                </button>
              )}
            </div>

            {uploading && (
              <div className="space-y-1.5 pt-2 border-t border-[#393A33]">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-[#AAA69B]">{statusText}</span>
                </div>
                <div className="w-full bg-[#171816] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300 animate-pulse"
                    style={{
                      width: '100%',
                      background: 'linear-gradient(90deg, #D97736, #E9A65A)',
                    }}
                  />
                </div>
              </div>
            )}

            {errorText && (
              <div className="p-2.5 rounded-lg bg-[#D97736]/15 border border-[#D97736]/40 text-xs text-[#F4F0E8] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#D97736] shrink-0 mt-0.5" />
                <span className="break-words">{errorText}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#393A33]">
          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            disabled={uploading}
            className="nexus-btn-secondary text-xs py-1.5 px-3"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStartUpload}
            disabled={!selectedFile || uploading}
            className="nexus-btn-primary text-xs py-1.5 px-4 disabled:opacity-50"
          >
            {uploading ? 'Streaming to HDFS...' : 'Start Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};
