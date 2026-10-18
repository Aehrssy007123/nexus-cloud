import React from 'react';
import {
  LayoutDashboard,
  FolderClosed,
  BarChart2,
  Settings,
  HardDrive,
  LogOut,
  Database,
  CheckCircle2,
  AlertTriangle,
  Server,
} from 'lucide-react';
import { HDFSStatus, User } from '../types.js';
import { formatBytes } from '../utils/formatters.js';

export type NavTab = 'dashboard' | 'files' | 'analytics' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  user: User | null;
  hdfsStatus: HDFSStatus | null;
  onLogout: () => void;
  onOpenHdfsDiagnostics: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  user,
  hdfsStatus,
  onLogout,
  onOpenHdfsDiagnostics,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'files' as NavTab, label: 'My Files', icon: FolderClosed },
    { id: 'analytics' as NavTab, label: 'Analytics', icon: BarChart2 },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  const storageUsed = user?.storageUsed || 0;
  const storageQuota = user?.storageQuota || 1024 * 1024 * 1024;
  const percentUsed = Math.min(100, Math.round((storageUsed / storageQuota) * 100));

  return (
    <aside className="w-64 bg-[#22231F] border-r border-[#393A33] flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#393A33] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D97736] to-[#E9A65A] flex items-center justify-center shadow-md shadow-[#D97736]/20">
            <Server className="w-5 h-5 text-[#171816]" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-wider text-[#F4F0E8] flex items-center gap-1.5 font-mono">
              NEXUS<span className="text-[#D97736]">CLOUD</span>
            </h1>
            <p className="text-[11px] text-[#AAA69B] tracking-tight">SaaS LAN &bull; HDFS 3.x</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 space-y-1.5 flex-1">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider uppercase text-[#AAA69B]/70 font-mono">
          Cloud Console
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-[#D97736]/20 to-[#E9A65A]/10 text-[#F4F0E8] border-l-2 border-[#D97736]'
                  : 'text-[#AAA69B] hover:text-[#F4F0E8] hover:bg-[#2B2C27]'
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-[#D97736]' : 'text-[#AAA69B]'
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* HDFS Cluster Service Monitor Badge */}
      <div className="p-3 mx-3 mb-3 bg-[#2B2C27] border border-[#393A33] rounded-lg">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-1.5 font-mono text-[#AAA69B]">
            <Database className="w-3.5 h-3.5 text-[#E9A65A]" />
            <span>HDFS CLUSTER</span>
          </div>
          <button
            onClick={onOpenHdfsDiagnostics}
            className="text-[10px] text-[#E9A65A] hover:underline"
          >
            Diagnostics
          </button>
        </div>

        <div
          onClick={onOpenHdfsDiagnostics}
          className="cursor-pointer group flex items-center justify-between pt-1"
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                hdfsStatus?.connected
                  ? 'bg-[#8EA58A] shadow-sm shadow-[#8EA58A]'
                  : 'bg-[#D97736] animate-pulse-subtle'
              }`}
            />
            <span className="text-xs font-medium text-[#F4F0E8]">
              {hdfsStatus?.connected ? 'HDFS Connected' : 'HDFS Offline'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#AAA69B]">
            {hdfsStatus?.connected ? `${hdfsStatus.latencyMs}ms` : 'Err'}
          </span>
        </div>
      </div>

      {/* Storage Quota Usage Summary */}
      <div className="p-3 mx-3 mb-3 bg-[#2B2C27] border border-[#393A33] rounded-lg">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-[#AAA69B] flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-[#AAA69B]" />
            Personal Quota
          </span>
          <span className="font-mono text-[#F4F0E8] text-[11px]">{percentUsed}%</span>
        </div>
        <div className="w-full bg-[#171816] h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${percentUsed}%`,
              background: percentUsed > 90 ? '#D97736' : 'linear-gradient(90deg, #D97736, #E9A65A)',
            }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-[#AAA69B] mt-1.5 font-mono">
          <span>{formatBytes(storageUsed)}</span>
          <span>{formatBytes(storageQuota)}</span>
        </div>
      </div>

      {/* User Info & Logout */}
      <div className="p-3 border-t border-[#393A33] flex items-center justify-between bg-[#171816]/50">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#2B2C27] border border-[#393A33] flex items-center justify-center text-xs font-bold text-[#E9A65A] uppercase">
            {user?.name ? user.name[0] : 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#F4F0E8] truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-[#AAA69B] truncate font-mono">{user?.email || 'user@lan'}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          title="Sign out"
          className="p-1.5 rounded-md text-[#AAA69B] hover:text-[#D97736] hover:bg-[#2B2C27] transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
