import React, { useState } from 'react';
import { useTwinStore } from '../store/useTwinStore';
import { Bell, CheckCheck, Trash2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export const AlertTimeline: React.FC = () => {
  const { alertEvents, acknowledgeAlert, clearAlerts } = useTwinStore();
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');

  const filteredAlerts = alertEvents.filter((a) => {
    if (filterLevel === 'ALL') return true;
    return a.level === filterLevel;
  });

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
  };

  const getAlertBg = (level: string, acknowledged?: boolean) => {
    if (acknowledged) return 'bg-aerospace-950/40 border-slate-800/60 opacity-60';
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-950/40 border-rose-500/80 glow-rose';
      case 'WARNING':
        return 'bg-amber-950/30 border-amber-500/60 glow-amber';
      default:
        return 'bg-aerospace-950/80 border-slate-800';
    }
  };

  return (
    <div className="bg-aerospace-900/90 rounded-xl border border-slate-800 p-4 flex flex-col gap-3 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan-400" />
          <h2 className="font-tech text-xs font-bold uppercase tracking-wider text-slate-200">
            7. Alert & Event Timeline ({alertEvents.length})
          </h2>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          {/* Level Filter Tabs */}
          <div className="flex bg-aerospace-950 p-0.5 rounded border border-slate-800">
            {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  filterLevel === lvl
                    ? 'bg-slate-800 text-cyan-300 font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <button
            onClick={clearAlerts}
            className="p-1 rounded bg-slate-800 hover:bg-rose-950/50 hover:text-rose-300 text-slate-400 border border-slate-700"
            title="Clear Event Log"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable Events Log */}
      <div className="h-56 overflow-y-auto flex flex-col gap-2 pr-1">
        {filteredAlerts.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500 italic">
            No active alert events for filter: {filterLevel}
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-2.5 rounded-lg border flex items-start justify-between gap-3 transition-all ${getAlertBg(
                alert.level,
                alert.acknowledged
              )}`}
            >
              <div className="flex items-start gap-2.5">
                {getAlertIcon(alert.level)}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{alert.title}</span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      ENV: {alert.envMode}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">
                      {alert.timestamp} (T+{alert.simTime.toFixed(0)}s)
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-300 mt-0.5 leading-tight">
                    {alert.message}
                  </p>
                </div>
              </div>

              {!alert.acknowledged && (
                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="shrink-0 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 border border-slate-700 flex items-center gap-1"
                  title="Acknowledge Alert"
                >
                  <CheckCheck className="w-3 h-3 text-cyan-400" />
                  <span>ACK</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
