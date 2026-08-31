import React from 'react';
import { useTwinStore } from '../store/useTwinStore';
import { ConnectionStatus } from '../types/telemetry';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

export const ConnectionBadge: React.FC = () => {
  const { connectionStatus, setConnectionStatus } = useTwinStore();

  const getStatusDetails = (status: ConnectionStatus) => {
    switch (status) {
      case 'CONNECTED':
        return {
          label: 'CONNECTED',
          sub: '500ms Live Telemetry Sync',
          color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40',
          dot: 'bg-emerald-400 animate-pulse',
          icon: <Wifi className="w-3.5 h-3.5 text-emerald-400" />,
        };
      case 'STALE':
        return {
          label: 'STALE DATA',
          sub: 'Packet Latency > 2.5s',
          color: 'text-amber-400 border-amber-500/40 bg-amber-950/40',
          dot: 'bg-amber-400',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
        };
      case 'DISCONNECTED':
        return {
          label: 'DISCONNECTED',
          sub: 'Telemetry Stream Halted',
          color: 'text-rose-400 border-rose-500/40 bg-rose-950/40',
          dot: 'bg-rose-400 animate-ping',
          icon: <WifiOff className="w-3.5 h-3.5 text-rose-400" />,
        };
    }
  };

  const current = getStatusDetails(connectionStatus);

  return (
    <div className="flex items-center gap-2">
      {/* Interactive connection state toggle dropdown */}
      <div className={`px-2.5 py-1 rounded border ${current.color} flex items-center gap-2 text-xs font-mono transition-all`}>
        <span className={`w-2 h-2 rounded-full ${current.dot}`}></span>
        {current.icon}
        <div className="flex flex-col">
          <span className="font-bold tracking-wider">{current.label}</span>
        </div>
      </div>

      {/* Simulator Switcher for Hackathon Demo */}
      <select
        value={connectionStatus}
        onChange={(e) => setConnectionStatus(e.target.value as ConnectionStatus)}
        className="bg-aerospace-900 border border-slate-700/60 rounded px-2 py-1 text-xs font-mono text-slate-300 hover:border-slate-500 focus:outline-none focus:border-cyan-500 cursor-pointer"
        title="Simulate Datalink State (Hackathon Testing)"
      >
        <option value="CONNECTED">Mode: Link Active</option>
        <option value="STALE">Mode: Link Stale</option>
        <option value="DISCONNECTED">Mode: Link Lost</option>
      </select>
    </div>
  );
};
