import React, { useState } from 'react';
import { useTwinStore } from '../store/useTwinStore';
import { AlertCircle, AlertTriangle, Info, Check, Trash2, Bell } from 'lucide-react';

export const AlertTimeline: React.FC = () => {
  const { alertEvents, acknowledgeAlert, clearAlerts } = useTwinStore();
  const [filter, setFilter] = useState<'ALL' | 'INFO' | 'WARNING' | 'CRITICAL'>('ALL');

  const filteredAlerts = alertEvents.filter((a) => (filter === 'ALL' ? true : a.level === filter));

  const getAlertIcon = (level: 'INFO' | 'WARNING' | 'CRITICAL') => {
    switch (level) {
      case 'CRITICAL':
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'INFO':
        return <Info className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
  };

  const getAlertStyle = (level: 'INFO' | 'WARNING' | 'CRITICAL', acked?: boolean) => {
    if (acked) return 'bg-aerospace-950/40 border-slate-800/80 text-slate-500 opacity-60';
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-950/50 border-rose-500/80 text-rose-200 glow-rose';
      case 'WARNING':
        return 'bg-amber-950/50 border-amber-500/80 text-amber-200 glow-amber';
      case 'INFO':
        return 'bg-aerospace-900 border-cyan-500/40 text-cyan-200';
    }
  };

  return (
    <div className="bg-aerospace-900/90 rounded-xl border border-slate-800 p-2.5 sm:p-4 flex flex-col gap-2.5 sm:gap-3 shadow-xl">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
          <h2 className="font-tech text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-200">
            Event Log & Alert Timeline ({alertEvents.length})
          </h2>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          {/* Filters */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-aerospace-950 p-0.5 rounded border border-slate-800 text-[9px] sm:text-[10px] font-mono">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-1.5 sm:px-2 py-0.5 rounded ${filter === 'ALL' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'}`}
            >
              ALL
            </button>
            <button
              onClick={() => setFilter('CRITICAL')}
              className={`px-1.5 sm:px-2 py-0.5 rounded ${filter === 'CRITICAL' ? 'bg-rose-500/30 text-rose-200 font-bold' : 'text-slate-400'}`}
            >
              CRIT
            </button>
            <button
              onClick={() => setFilter('WARNING')}
              className={`px-1.5 sm:px-2 py-0.5 rounded ${filter === 'WARNING' ? 'bg-amber-500/30 text-amber-200 font-bold' : 'text-slate-400'}`}
            >
              WARN
            </button>
          </div>

          <button
            onClick={clearAlerts}
            className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-[9px] sm:text-[10px] font-mono"
            title="Clear all alerts"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Alert Stream Container */}
      <div className="flex flex-col gap-1.5 max-h-48 sm:max-h-56 overflow-y-auto pr-1">
        {filteredAlerts.length === 0 ? (
          <div className="p-4 text-center text-xs font-mono text-slate-500 bg-aerospace-950/40 rounded-lg border border-slate-800">
            No events logged in the selected category.
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-2 sm:p-2.5 rounded-lg border flex items-center justify-between gap-2 text-xs font-mono transition-all ${getAlertStyle(
                alert.level,
                alert.acknowledged
              )}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {getAlertIcon(alert.level)}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold tracking-wide">{alert.title}</span>
                    <span className="text-[9px] opacity-75 font-normal">
                      [{alert.timestamp}]
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] opacity-90 truncate">{alert.message}</span>
                </div>
              </div>

              {!alert.acknowledged && (
                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="px-1.5 sm:px-2 py-1 rounded bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[9px] sm:text-[10px] flex items-center gap-1 shrink-0 transition-colors"
                  title="Acknowledge Alert"
                >
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="hidden sm:inline">ACK</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
