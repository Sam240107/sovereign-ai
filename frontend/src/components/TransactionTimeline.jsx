import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Lock, Terminal, ShieldAlert, Loader2 } from 'lucide-react';

const statusStyles = {
  completed: {
    icon: CheckCircle2,
    ring: 'bg-emerald-500/20 border-emerald-400/50 text-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.35)]',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(52,211,153,0.2)]',
    card: 'border-emerald-500/25 hover:border-emerald-400/50 hover:shadow-[0_0_40px_rgba(52,211,153,0.15)]',
    glow: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    line: 'bg-emerald-400/60 shadow-[0_0_12px_rgba(52,211,153,0.5)]',
  },
  pending: {
    icon: Clock,
    ring: 'bg-amber-500/20 border-amber-400/50 text-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.35)] animate-pulse',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(251,191,36,0.2)]',
    card: 'border-amber-500/25 hover:border-amber-400/50 hover:shadow-[0_0_40px_rgba(251,191,36,0.15)] ring-1 ring-amber-400/20',
    glow: 'from-amber-500/15 via-amber-500/5 to-transparent',
    line: 'bg-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.5)]',
  },
  error: {
    icon: ShieldAlert,
    ring: 'bg-rose-500/20 border-rose-400/50 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.35)]',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]',
    card: 'border-rose-500/25 hover:border-rose-400/50 hover:shadow-[0_0_40px_rgba(244,63,94,0.15)]',
    glow: 'from-rose-500/15 via-rose-500/5 to-transparent',
    line: 'bg-rose-400/60 shadow-[0_0_12px_rgba(244,63,94,0.5)]',
  },
  default: {
    icon: Lock,
    ring: 'bg-slate-800/80 border-slate-600/50 text-slate-500',
    badge: 'bg-slate-800/80 text-slate-400 border-slate-700/50',
    card: 'border-slate-700/50 hover:border-slate-600/60',
    glow: 'from-slate-700/10 via-transparent to-transparent',
    line: 'bg-slate-600/40',
  },
};

export default function TransactionTimeline({ steps = [], isExecuting = false, sentinelState = 'idle' }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [expandedSteps, setExpandedSteps] = useState(new Set());

  useEffect(() => {
    setVisibleCount(0);
    setExpandedSteps(new Set());

    if (!steps.length) return;

    const timers = steps.map((_, idx) =>
      setTimeout(() => {
        setVisibleCount(idx + 1);
        if (steps[idx]?.meta) {
          setExpandedSteps(prev => new Set([...prev, idx]));
        }
      }, idx * 180 + 80)
    );

    return () => timers.forEach(clearTimeout);
  }, [steps]);

  if (!steps.length) return null;

  const activePendingIdx = steps.findIndex(s => s.status === 'pending');

  const sentinelAccent = {
    idle: 'text-indigo-400',
    processing: 'text-violet-400',
    requires_approval: 'text-amber-400',
    executed: 'text-emerald-400',
    blocked: 'text-rose-400',
  }[sentinelState] || 'text-indigo-400';

  return (
    <>
      <style>{`
        @keyframes timelineSlideIn {
          from { opacity: 0; transform: translateX(-20px) translateY(10px) scale(0.97); }
          to { opacity: 1; transform: translateX(0) translateY(0) scale(1); }
        }
        @keyframes cardExpand {
          from { opacity: 0; max-height: 0; transform: translateY(-4px); }
          to { opacity: 1; max-height: 400px; transform: translateY(0); }
        }
        @keyframes statusPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(251,191,36,0.3); }
          50% { box-shadow: 0 0 40px rgba(251,191,36,0.6); }
        }
        @keyframes connectorFlow {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
        .timeline-step-enter {
          animation: timelineSlideIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .timeline-meta-expand {
          animation: cardExpand 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          overflow: hidden;
        }
        .status-pulse-active {
          animation: statusPulse 2s ease-in-out infinite;
        }
        .connector-flow {
          animation: connectorFlow 2.5s ease-in-out infinite;
        }
        .sentinel-idle { background: radial-gradient(ellipse at center, rgba(79,70,229,0.12), transparent 40%); }
        .sentinel-processing { background: radial-gradient(ellipse at center, rgba(139,92,246,0.14), transparent 40%); box-shadow: 0 0 30px rgba(139,92,246,0.12); }
        .sentinel-approval { background: radial-gradient(ellipse at center, rgba(245,158,11,0.12), transparent 40%); box-shadow: 0 0 28px rgba(245,158,11,0.12); }
        .sentinel-executed { background: radial-gradient(ellipse at center, rgba(16,185,129,0.14), transparent 40%); transform: translateY(-2px); animation: sentinelBounce 1.1s ease; }
        .sentinel-blocked { background: radial-gradient(ellipse at center, rgba(244,63,94,0.12), transparent 40%); box-shadow: 0 0 36px rgba(244,63,94,0.12); }
        @keyframes sentinelBounce { 0% { transform: translateY(0); } 50% { transform: translateY(-6px); } 100% { transform: translateY(0); } }
      `}</style>

      <div className="relative space-y-1 font-sans">
        <div className="flex items-center justify-between border-b border-slate-700/50 pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/40 flex items-center justify-center shadow-[0_0_25px_rgba(99,102,241,0.25)] backdrop-blur-md">
              <Terminal className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold tracking-wide text-sm">
                SOVEREIGN GOVERNANCE PIPELINE
              </h3>
              {isExecuting && (
                <p className={`text-[10px] font-mono mt-0.5 flex items-center gap-1.5 ${sentinelAccent}`}>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Sentinel orchestrating control flow…
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-44 p-2 rounded-xl border border-slate-700/40 backdrop-blur-md flex items-center gap-3 ${sentinelState === 'processing' ? 'sentinel-processing' : ''} ${sentinelState === 'requires_approval' ? 'sentinel-approval' : ''} ${sentinelState === 'executed' ? 'sentinel-executed' : ''} ${sentinelState === 'blocked' ? 'sentinel-blocked' : 'sentinel-idle'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${sentinelState === 'executed' ? 'ring-2 ring-emerald-400/30' : ''}`}>
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white opacity-90">
                  <path d="M12 2c2.2 0 4 .9 4 2v1h-8V4c0-1.1 1.8-2 4-2zM6 8v6c0 2.2 3.6 4 6 4s6-1.8 6-4V8H6z" fill="rgba(255,255,255,0.06)" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-semibold text-white">Sovereign Sentinel</div>
                <div className="text-[11px] text-slate-300 font-mono mt-0.5">
                  {sentinelState === 'idle' && 'Standing by for secure commands...'}
                  {sentinelState === 'processing' && 'Parsing natural language intent via Gemini...'}
                  {sentinelState === 'requires_approval' && 'Paused! Human sign-off required for high-value payout.'}
                  {sentinelState === 'executed' && 'Payout successfully executed through RazorpayX!'}
                  {sentinelState === 'blocked' && 'Threat neutralized by Guardian Auditor!'}
                </div>
              </div>
            </div>
            <span className="text-[10px] px-3 py-1.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/30 font-mono shadow-[0_0_25px_rgba(139,92,246,0.15)] backdrop-blur-md">
              SECURE EXECUTION MODE
            </span>
          </div>
        </div>

          <div className="space-y-5 relative pl-1">
          <div
            aria-hidden
            className="absolute left-[20px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500/50 via-violet-500/40 to-emerald-500/50 connector-flow rounded-full"
          />

          {steps.map((step, idx) => {
            if (idx >= visibleCount) return null;

            const styles = statusStyles[step.status] || statusStyles.default;
            const Icon = step.status === 'pending' && isExecuting ? Loader2 : styles.icon;
            const isActive = idx === activePendingIdx;
            const showMeta = step.meta && expandedSteps.has(idx);

            return (
              <div
                key={`${step.title}-${idx}`}
                className="timeline-step-enter relative flex items-start space-x-4 group"
              >
                <div className="relative flex flex-col items-center">
                  <div
                    className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center border-2 backdrop-blur-md transition-all duration-500 group-hover:scale-110 ${
                      isActive ? 'status-pulse-active' : ''
                    } ${styles.ring}`}
                  >
                    <Icon className={`w-4 h-4 ${step.status === 'pending' && isExecuting ? 'animate-spin' : ''}`} />
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`w-0.5 h-5 mt-1 rounded-full ${styles.line}`} />
                  )}
                </div>

                <div
                  className={`flex-1 relative overflow-hidden bg-slate-950/60 backdrop-blur-2xl border rounded-2xl p-4 transition-all duration-500 hover:scale-[1.015] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] ${styles.card}`}
                >
                  <div
                    aria-hidden
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${styles.glow}`}
                  />

                  <div className="relative flex items-center justify-between gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
                      {step.title}
                    </span>
                    <span
                      className={`shrink-0 text-[10px] font-mono px-2.5 py-1 rounded-full border backdrop-blur-sm transition-all duration-300 ${styles.badge}`}
                    >
                      {step.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="relative text-xs text-slate-400 mt-2 font-mono leading-relaxed">
                    {step.description}
                  </p>

                  {showMeta && (
                    <div className="timeline-meta-expand relative mt-3 text-[11px] bg-slate-900/70 backdrop-blur-xl p-3 rounded-xl border border-slate-700/50 font-mono text-indigo-300 overflow-x-auto shadow-[inset_0_0_30px_rgba(99,102,241,0.08)]">
                      {JSON.stringify(step.meta, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
