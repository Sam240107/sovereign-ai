import React from 'react';
import { CheckCircle2, ShieldAlert, Clock, Zap, Lock, Terminal } from 'lucide-react';

export default function TransactionTimeline({ steps = [] }) {
  if (!steps.length) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4 my-4 font-sans">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-indigo-400 animate-pulse" />
          <h3 className="text-white font-semibold tracking-wide text-sm">SOVEREIGN GOVERNANCE PIPELINE</h3>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
          SECURE EXECUTION MODE
        </span>
      </div>

      <div className="space-y-3 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-800">
        {steps.map((step, idx) => (
          <div key={idx} className="relative flex items-start space-x-3 group">
            {/* Step Icon Indicator */}
            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
              step.status === 'completed' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10' 
                : step.status === 'pending'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}>
              {step.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : 
               step.status === 'pending' ? <Clock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>

            {/* Step Details */}
            <div className="flex-1 bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {step.title}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  step.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                  step.status === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {step.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                {step.description}
              </p>
              {step.meta && (
                <div className="mt-2 text-[11px] bg-slate-900/80 p-2 rounded border border-slate-800 font-mono text-indigo-300 overflow-x-auto">
                  {JSON.stringify(step.meta, null, 2)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}