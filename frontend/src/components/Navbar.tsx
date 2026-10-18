import React, { useState } from 'react';
import {
  Search,
  Upload,
  Wifi,
  Copy,
  Check,
  User as UserIcon,
  HardDrive,
  Server,
} from 'lucide-react';
import { User } from '../types.js';
import { formatBytes } from '../utils/formatters.js';
import { useToast } from './Toast.js';

interface NavbarProps {
  user: User | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onTriggerUpload: () => void;
  lanIp: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  searchQuery,
  onSearchChange,
  onTriggerUpload,
  lanIp,
}) => {
  const [copied, setCopied] = useState(false);
  const { info } = useToast();

  const currentPort = window.location.port || '5173';
  const lanUrl = `http://${lanIp || window.location.hostname || 'localhost'}:${currentPort}`;

  const handleCopyLanUrl = () => {
    navigator.clipboard.writeText(lanUrl);
    setCopied(true);
    info('LAN URL Copied', `Share ${lanUrl} with other devices on your local network.`);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <header className="h-16 bg-[#22231F] border-b border-[#393A33] px-6 flex items-center justify-between gap-4 shrink-0">
      {/* Search Input */}
      <div className="flex-1 max-w-md relative">
        <Search className="w-4 h-4 text-[#AAA69B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search files across your personal cloud..."
          className="nexus-input pl-9 pr-4 py-2 text-sm bg-[#171816] border-[#393A33] focus:border-[#D97736]"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#AAA69B] hover:text-[#F4F0E8]"
          >
            Clear
          </button>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* LAN Access Badge */}
        <button
          onClick={handleCopyLanUrl}
          title="Click to copy LAN address for peer computers in your lab"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2B2C27] border border-[#393A33] hover:border-[#4E5046] text-xs transition-colors group"
        >
          <Wifi className="w-3.5 h-3.5 text-[#8EA58A] group-hover:text-[#E9A65A] transition-colors" />
          <span className="text-[#AAA69B] font-mono">LAN:</span>
          <span className="text-[#F4F0E8] font-mono font-medium">{lanIp || '127.0.0.1'}</span>
          {copied ? (
            <Check className="w-3 h-3 text-[#8EA58A]" />
          ) : (
            <Copy className="w-3 h-3 text-[#AAA69B] opacity-60 group-hover:opacity-100" />
          )}
        </button>

        {/* Quick Upload Button */}
        <button
          onClick={onTriggerUpload}
          className="nexus-btn-primary text-sm py-2 px-4 shadow-sm"
        >
          <Upload className="w-4 h-4" />
          <span>Upload</span>
        </button>

        {/* User Mini Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#393A33]">
          <div className="w-9 h-9 rounded-lg bg-[#2B2C27] border border-[#393A33] flex items-center justify-center text-[#E9A65A] font-semibold text-sm">
            {user?.name?.slice(0, 2).toUpperCase() || 'NC'}
          </div>
        </div>
      </div>
    </header>
  );
};
