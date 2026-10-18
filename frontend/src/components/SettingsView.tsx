import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Wifi,
  Database,
  Server,
  User as UserIcon,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  ShieldCheck,
  Network,
} from 'lucide-react';
import { HDFSStatus, HealthInfo, User } from '../types.js';
import { formatBytes } from '../utils/formatters.js';
import { useToast } from './Toast.js';

interface SettingsViewProps {
  user: User | null;
  hdfsStatus: HDFSStatus | null;
  healthInfo: HealthInfo | null;
  onRefreshHdfs: () => Promise<void>;
  onOpenHdfsDiagnostics: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  hdfsStatus,
  healthInfo,
  onRefreshHdfs,
  onOpenHdfsDiagnostics,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [testingPing, setTestingPing] = useState(false);
  const { success, info } = useToast();

  const primaryLanIp = healthInfo?.recommendedHostIp || window.location.hostname || '127.0.0.1';
  const port = window.location.port || '5173';
  const fullLanUrl = `http://${primaryLanIp}:${port}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    success('Copied to clipboard', text);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleTestPing = async () => {
    setTestingPing(true);
    await onRefreshHdfs();
    setTestingPing(false);
    info('HDFS Health Checked', `NameNode: ${hdfsStatus?.namenodeUrl}`);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#F4F0E8] font-mono tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-[#E9A65A]" />
          SETTINGS &amp; LAN ARCHITECTURE
        </h2>
        <p className="text-xs text-[#AAA69B] mt-0.5">
          Laboratory network configuration, Cloud Controller parameters, and HDFS cluster storage.
        </p>
      </div>

      {/* LAN Network Configuration Card */}
      <div className="nexus-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#22231F] border border-[#393A33] flex items-center justify-center text-[#8EA58A]">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F4F0E8] font-mono">
                LOCAL AREA NETWORK (LAN) ACCESS
              </h3>
              <p className="text-xs text-[#AAA69B]">Allow peer computers in the laboratory to access SaaS</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-[#8EA58A]/15 border border-[#8EA58A]/30 text-[#8EA58A]">
            0.0.0.0 Bound
          </span>
        </div>

        <div className="p-4 rounded-lg bg-[#22231F] border border-[#393A33] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs text-[#AAA69B] block">Direct LAN URL for Peer Computers:</span>
              <span className="text-sm font-mono font-bold text-[#E9A65A] break-all">{fullLanUrl}</span>
            </div>
            <button
              onClick={() => handleCopy(fullLanUrl)}
              className="nexus-btn-secondary text-xs py-1.5 px-3 self-start sm:self-auto shrink-0"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#8EA58A]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'Copied' : 'Copy LAN URL'}</span>
            </button>
          </div>

          <div className="border-t border-[#393A33] pt-3 text-xs text-[#AAA69B] space-y-1.5 leading-relaxed">
            <p className="text-[#F4F0E8] font-medium">How to connect peer computers in your college lab:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Connect the peer device to the same Wi-Fi router or LAN switch.</li>
              <li>Open any browser on the peer computer and navigate to: <code className="text-[#E9A65A] font-mono">{fullLanUrl}</code>.</li>
              <li>Ensure Windows Firewall permits incoming TCP connections on ports 5000 (Backend) and 5173 (Frontend).</li>
            </ol>
          </div>
        </div>

        {/* Network Interfaces Table */}
        {healthInfo?.lanIps && healthInfo.lanIps.length > 0 && (
          <div className="mt-3">
            <span className="text-xs font-mono uppercase text-[#AAA69B] font-semibold block mb-2">
              Detected Network Interfaces on Host Machine:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {healthInfo.lanIps.map((ip, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-[#171816] border border-[#393A33] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#AAA69B] block text-[10px] font-mono">{ip.name}</span>
                    <span className="text-[#F4F0E8] font-mono font-medium">{ip.address}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(`http://${ip.address}:${port}`)}
                    className="p-1 rounded text-[#AAA69B] hover:text-[#E9A65A]"
                    title="Copy URL"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Apache Hadoop HDFS Cluster Card */}
      <div className="nexus-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#22231F] border border-[#393A33] flex items-center justify-center text-[#D97736]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F4F0E8] font-mono">
                APACHE HADOOP HDFS STORAGE
              </h3>
              <p className="text-xs text-[#AAA69B]">Distributed block store configuration and WebHDFS REST API</p>
            </div>
          </div>
          <button
            onClick={handleTestPing}
            disabled={testingPing}
            className="nexus-btn-secondary text-xs py-1.5 px-3"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingPing ? 'animate-spin text-[#E9A65A]' : ''}`} />
            <span>Ping Cluster</span>
          </button>
        </div>

        <div className="p-4 rounded-lg bg-[#22231F] border border-[#393A33] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#AAA69B] block text-[10px] font-mono uppercase">Configured WebHDFS Target:</span>
              <span className="text-sm font-mono text-[#F4F0E8]">{hdfsStatus?.namenodeUrl || 'http://localhost:9870/webhdfs/v1'}</span>
            </div>
            <div>
              <span className="text-[#AAA69B] block text-[10px] font-mono uppercase">Cluster Connection:</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`w-2.5 h-2.5 rounded-full ${hdfsStatus?.connected ? 'bg-[#8EA58A]' : 'bg-[#D97736]'}`} />
                <span className="font-semibold text-[#F4F0E8]">
                  {hdfsStatus?.connected ? `Connected (${hdfsStatus.latencyMs}ms)` : 'Offline / Unreachable'}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-[#393A33] pt-3 flex items-center justify-between">
            <span className="text-xs text-[#AAA69B]">
              Need to inspect block replication or start the HDFS node?
            </span>
            <button
              onClick={onOpenHdfsDiagnostics}
              className="nexus-btn-primary text-xs py-1.5 px-3"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Open HDFS Console</span>
            </button>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="nexus-card p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#22231F] border border-[#393A33] flex items-center justify-center text-[#E9A65A]">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F4F0E8] font-mono">
              USER ACCOUNT &amp; PERMISSIONS
            </h3>
            <p className="text-xs text-[#AAA69B]">Storage quota and authentication level</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-[#22231F] border border-[#393A33]">
            <span className="text-[#AAA69B] block text-[10px] uppercase font-mono">Name</span>
            <span className="text-sm font-semibold text-[#F4F0E8]">{user?.name}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#22231F] border border-[#393A33]">
            <span className="text-[#AAA69B] block text-[10px] uppercase font-mono">Email Address</span>
            <span className="text-sm font-semibold text-[#F4F0E8] font-mono">{user?.email}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#22231F] border border-[#393A33]">
            <span className="text-[#AAA69B] block text-[10px] uppercase font-mono">Storage Quota</span>
            <span className="text-sm font-semibold text-[#F4F0E8] font-mono">
              {formatBytes(user?.storageUsed || 0)} / {formatBytes(user?.storageQuota || 1024 * 1024 * 1024)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
