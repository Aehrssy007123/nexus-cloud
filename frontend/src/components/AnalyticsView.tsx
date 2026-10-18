import React from 'react';
import {
  BarChart2,
  PieChart as PieIcon,
  HardDrive,
  Database,
  TrendingUp,
  FileCheck,
  Server,
  Activity,
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
  CartesianGrid,
} from 'recharts';
import { DashboardStats } from '../types.js';
import { formatBytes } from '../utils/formatters.js';

interface AnalyticsViewProps {
  stats: DashboardStats | null;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ stats }) => {
  const totalFiles = stats?.totalFiles || 0;
  const storageUsed = stats?.storageUsed || 0;
  const storageQuota = stats?.storageQuota || 1024 * 1024 * 1024;
  const percentUsed = Math.min(100, Math.round((storageUsed / storageQuota) * 100));

  const distribution = stats?.fileTypeDistribution || [];
  const activityData = stats?.uploadActivity || [];
  const hdfsStatus = stats?.hdfsStatus;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#F4F0E8] font-mono tracking-tight flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#D97736]" />
          STORAGE &amp; CLUSTER ANALYTICS
        </h2>
        <p className="text-xs text-[#AAA69B] mt-0.5">
          Real-time telemetry from MongoDB metadata registry and Apache Hadoop HDFS cluster blocks.
        </p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="nexus-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#AAA69B] uppercase font-mono">Storage Capacity</span>
            <HardDrive className="w-4 h-4 text-[#D97736]" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-[#F4F0E8]">
              {formatBytes(storageUsed)}
            </span>
            <span className="text-xs text-[#AAA69B] font-mono">/ {formatBytes(storageQuota)}</span>
          </div>
          <div className="mt-4 w-full bg-[#171816] h-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${percentUsed}%`,
                background: 'linear-gradient(90deg, #D97736, #E9A65A)',
              }}
            />
          </div>
          <p className="mt-2 text-[11px] text-[#AAA69B]">
            {percentUsed}% of user quota consumed
          </p>
        </div>

        <div className="nexus-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#AAA69B] uppercase font-mono">Metadata Objects</span>
            <FileCheck className="w-4 h-4 text-[#E9A65A]" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold font-mono text-[#F4F0E8]">{totalFiles}</span>
            <span className="text-xs text-[#AAA69B] ml-2">files indexed</span>
          </div>
          <p className="mt-5 text-[11px] text-[#AAA69B]">
            Consistent ACID records synchronized across MongoDB and HDFS
          </p>
        </div>

        <div className="nexus-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#AAA69B] uppercase font-mono">HDFS Node Health</span>
            <Server className="w-4 h-4 text-[#8EA58A]" />
          </div>
          <div className="mt-4 flex items-center gap-2.5">
            <div
              className={`w-3 h-3 rounded-full ${
                hdfsStatus?.connected ? 'bg-[#8EA58A]' : 'bg-[#D97736]'
              }`}
            />
            <span className="text-xl font-bold font-mono text-[#F4F0E8]">
              {hdfsStatus?.connected ? 'Operational' : 'Unreachable'}
            </span>
          </div>
          <p className="mt-4 text-[11px] text-[#AAA69B] font-mono truncate">
            {hdfsStatus?.connected
              ? `Roundtrip: ${hdfsStatus.latencyMs}ms | ${hdfsStatus.namenodeUrl}`
              : 'WebHDFS NameNode offline'}
          </p>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Chart */}
        <div className="nexus-card p-5">
          <h3 className="text-sm font-bold text-[#F4F0E8] font-mono mb-1">
            DISTRIBUTION BY FILE FORMAT
          </h3>
          <p className="text-xs text-[#AAA69B] mb-4">Volume allocated per file category</p>

          {distribution.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-[#AAA69B]">
              No files available to calculate distribution.
            </div>
          ) : (
            <div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribution}
                      dataKey="bytes"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
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

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {distribution.map((cat) => (
                  <div key={cat.name} className="p-2 rounded bg-[#22231F] border border-[#393A33]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-xs font-medium text-[#F4F0E8]">{cat.name}</span>
                    </div>
                    <p className="text-[11px] font-mono text-[#AAA69B]">{formatBytes(cat.bytes)}</p>
                    <p className="text-[10px] text-[#AAA69B]">{cat.count} files</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 7-Day Upload Volume Bar Chart */}
        <div className="nexus-card p-5">
          <h3 className="text-sm font-bold text-[#F4F0E8] font-mono mb-1">
            INGESTION TIMELINE (LAST 7 DAYS)
          </h3>
          <p className="text-xs text-[#AAA69B] mb-4">Total files uploaded to HDFS per day</p>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#393A33" vertical={false} />
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
    </div>
  );
};
