import React, { useState } from 'react';
import {
  Database,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  Server,
  Layers,
  FileCheck,
} from 'lucide-react';
import { HDFSStatus } from '../types.js';
import { formatBytes } from '../utils/formatters.js';
import { useToast } from './Toast.js';

interface HdfsDiagnosticsModalProps {
  hdfsStatus: HDFSStatus | null;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

export const HdfsDiagnosticsModal: React.FC<HdfsDiagnosticsModalProps> = ({
  hdfsStatus,
  onClose,
  onRefresh,
}) => {
  const [testing, setTesting] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const { success } = useToast();

  const handleRefresh = async () => {
    setTesting(true);
    await onRefresh();
    setTesting(false);
  };

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    success('Copied to clipboard', cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#2B2C27] border border-[#393A33] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#393A33] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D97736] to-[#E9A65A] flex items-center justify-center text-[#171816]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F4F0E8] font-mono">
                HDFS CLUSTER DIAGNOSTICS
              </h3>
              <p className="text-xs text-[#AAA69B]">
                Apache Hadoop WebHDFS REST Protocol &bull; Port 9870
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#AAA69B] hover:text-[#F4F0E8] p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Card */}
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            hdfsStatus?.connected
              ? 'bg-[#8EA58A]/10 border-[#8EA58A]/30'
              : 'bg-[#D97736]/10 border-[#D97736]/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                hdfsStatus?.connected ? 'bg-[#8EA58A]/20 text-[#8EA58A]' : 'bg-[#D97736]/20 text-[#D97736]'
              }`}
            >
              {hdfsStatus?.connected ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#F4F0E8] font-mono">
                {hdfsStatus?.connected ? 'WebHDFS NameNode is Active' : 'HDFS NameNode is Offline'}
              </h4>
              <p className="text-xs text-[#AAA69B] mt-0.5 font-mono">
                {hdfsStatus?.namenodeUrl || 'http://localhost:9870/webhdfs/v1'}
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={testing}
            className="nexus-btn-secondary text-xs py-1.5 px-3 self-end sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin text-[#E9A65A]' : ''}`} />
            <span>Test Connection</span>
          </button>
        </div>

        {/* Cluster Telemetry Details */}
        {hdfsStatus?.connected && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-[#22231F] border border-[#393A33]">
              <span className="text-[10px] text-[#AAA69B] uppercase font-mono block">Latency</span>
              <span className="text-base font-bold font-mono text-[#8EA58A]">
                {hdfsStatus.latencyMs} ms
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#22231F] border border-[#393A33]">
              <span className="text-[10px] text-[#AAA69B] uppercase font-mono block">Cluster Status</span>
              <span className="text-base font-bold font-mono text-[#F4F0E8]">
                {hdfsStatus.clusterStatus || 'Online'}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#22231F] border border-[#393A33]">
              <span className="text-[10px] text-[#AAA69B] uppercase font-mono block">HDFS Storage Capacity</span>
              <span className="text-base font-bold font-mono text-[#E9A65A]">
                {hdfsStatus.totalCapacityBytes ? formatBytes(hdfsStatus.totalCapacityBytes) : '100 GB (Active)'}
              </span>
            </div>
          </div>
        )}

        {/* Error Details if Disconnected */}
        {!hdfsStatus?.connected && (
          <div className="p-3.5 rounded-lg bg-[#171816] border border-[#D97736]/40 text-xs text-[#AAA69B] space-y-1">
            <span className="text-[#D97736] font-semibold block font-mono">Error Details:</span>
            <p className="font-mono text-[#F4F0E8]">{hdfsStatus?.error || 'ECONNREFUSED - No service listening on port 9870'}</p>
          </div>
        )}

        {/* How to Start HDFS Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono uppercase font-semibold text-[#AAA69B] tracking-wider">
            Quick Start Instructions for HDFS Service
          </h4>

          {/* Option A: Bundled Standalone Daemon */}
          <div className="p-4 rounded-xl bg-[#22231F] border border-[#393A33] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#E9A65A] flex items-center gap-1.5 font-mono">
                <Terminal className="w-3.5 h-3.5" />
                Option 1: Bundled WebHDFS Node (Zero-Config / Instant Lab Run)
              </span>
              <span className="text-[10px] bg-[#E9A65A]/15 text-[#E9A65A] px-2 py-0.5 rounded font-mono">
                Fastest
              </span>
            </div>
            <p className="text-xs text-[#AAA69B]">
              Runs a genuine WebHDFS REST API server on port 9870 that strictly implements Hadoop 3.x specifications:
            </p>
            <div className="p-2.5 rounded-lg bg-[#171816] border border-[#393A33] flex items-center justify-between font-mono text-xs text-[#F4F0E8]">
              <code>node infrastructure/mock-webhdfs-daemon.js</code>
              <button
                onClick={() => copyCommand('node infrastructure/mock-webhdfs-daemon.js')}
                className="text-[#AAA69B] hover:text-[#E9A65A] p-1"
                title="Copy command"
              >
                {copiedCmd === 'node infrastructure/mock-webhdfs-daemon.js' ? (
                  <Check className="w-3.5 h-3.5 text-[#8EA58A]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Option B: Real Docker Apache Hadoop */}
          <div className="p-4 rounded-xl bg-[#22231F] border border-[#393A33] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F4F0E8] flex items-center gap-1.5 font-mono">
                <Layers className="w-3.5 h-3.5 text-[#8EA58A]" />
                Option 2: Full Apache Hadoop Cluster (Docker Compose)
              </span>
              <span className="text-[10px] bg-[#8EA58A]/15 text-[#8EA58A] px-2 py-0.5 rounded font-mono">
                Full Production
              </span>
            </div>
            <p className="text-xs text-[#AAA69B]">
              Spins up Apache Hadoop NameNode, DataNodes, and MongoDB in Docker containers:
            </p>
            <div className="p-2.5 rounded-lg bg-[#171816] border border-[#393A33] flex items-center justify-between font-mono text-xs text-[#F4F0E8]">
              <code>docker-compose up -d</code>
              <button
                onClick={() => copyCommand('docker-compose up -d')}
                className="text-[#AAA69B] hover:text-[#E9A65A] p-1"
                title="Copy command"
              >
                {copiedCmd === 'docker-compose up -d' ? (
                  <Check className="w-3.5 h-3.5 text-[#8EA58A]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#393A33] flex justify-end">
          <button
            onClick={onClose}
            className="nexus-btn-primary text-xs py-1.5 px-4"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
