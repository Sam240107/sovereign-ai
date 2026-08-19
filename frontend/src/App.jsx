import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Terminal, 
  Lock, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Database, 
  Zap, 
  RefreshCw,
  Cpu
} from 'lucide-react';
import TransactionTimeline from './components/TransactionTimeline';

const API_BASE = "http://localhost:8000";

export default function App() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'ledger' | 'attack-lab'
  const [inputMessage, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState(null);
  const [pipelineSteps, setPipelineSteps] = useState([]);
  
  // Approval modal state
  const [approverId, setApproverId] = useState('campus-admin-001');
  
  // Ledger & Attack Lab state
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [attackResult, setAttackResult] = useState(null);
  const [attackLoading, setAttackLoading] = useState(false);

  // Fetch audit ledger on tab switch
  useEffect(() => {
    if (activeTab === 'ledger') {
      fetchLedger();
    }
  }, [activeTab]);

  const fetchLedger = async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/audit/ledger`);
      const data = await res.json();
      setLedgerEntries(data);
    } catch (err) {
      console.error("Failed to fetch ledger:", err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setLoading(true);
    setCurrentResponse(null);
    setPipelineSteps([
      { title: "1. Intent Extraction", description: "Parsing user command via Gemini AI...", status: "pending" }
    ]);

    try {
      const res = await fetch(`${API_BASE}/v1/agent/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputMessage })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || "Agent planning failed");

      setCurrentResponse(data);
      
      // Build animated timeline steps
      setPipelineSteps([
        {
          title: "1. Natural Language Intent Parsing",
          description: `Extracted action: ${data.action.action} to ${data.action.recipient} for ₹${data.action.amount}`,
          status: "completed",
          meta: data.action
        },
        {
          title: "2. Autonomous Policy Evaluation",
          description: `Decision reached: ${data.policy.decision} (${data.policy.reason})`,
          status: "completed",
          meta: { risk: data.policy.risk_level }
        },
        {
          title: "3. Human Approval & Guardian Audit",
          description: data.approval_required ? "Paused: Requires human authorization sign-off." : "Within autonomous limits, bypassed human gating.",
          status: data.approval_required ? "pending" : "completed"
        },
        {
          title: "4. RazorpayX Test Gateway Execution",
          description: data.execution ? `Dispatched payout successfully (ID: ${data.execution.transaction_id})` : "Awaiting approval sign-off...",
          status: data.execution ? "completed" : "pending",
          meta: data.execution ? { gateway: data.execution.gateway, id: data.execution.transaction_id } : null
        }
      ]);
    } catch (err) {
      alert(`Error: ${err.message}`);
      setPipelineSteps([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveApproval = async (approved) => {
    if (!currentResponse || !currentResponse.approval_request_id) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/approval/${currentResponse.approval_request_id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approver_id: approverId, approved })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || "Approval resolution failed");

      // Update response with execution result
      setCurrentResponse(prev => ({
        ...prev,
        execution: data.execution
      }));

      // Update timeline
      setPipelineSteps(prev => [
        prev[0],
        prev[1],
        {
          title: "3. Human Approval & Guardian Audit",
          description: approved ? `Approved by ${approverId} & passed Guardian Auditor.` : "Rejected by administrator.",
          status: approved ? "completed" : "error",
          meta: { approver: approverId, resolved_at: data.resolved_at }
        },
        {
          title: "4. RazorpayX Test Gateway Execution",
          description: data.execution ? `Successfully executed payout ID: ${data.execution.transaction_id}` : "Execution aborted due to rejection.",
          status: data.execution ? "completed" : "pending",
          meta: data.execution ? { gateway: data.execution.gateway, id: data.execution.transaction_id } : null
        }
      ]);
    } catch (err) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const runAttackSimulation = async (attackType) => {
    setAttackLoading(true);
    setAttackResult(null);
    try {
      const res = await fetch(`${API_BASE}/v1/attack-lab/${attackType}`, { method: 'POST' });
      const data = await res.json();
      setAttackResult(data);
    } catch (err) {
      alert(`Attack simulation error: ${err.message}`);
    } finally {
      setAttackLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-2">
              SOVEREIGN <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">v0.3.0 SECURE</span>
            </h1>
            <p className="text-xs text-slate-400">AI Control Plane • Policy Firewall • RazorpayX Test Gateway</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Agent Console
          </button>
          <button 
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'ledger' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Audit Ledger
          </button>
          <button 
            onClick={() => setActiveTab('attack-lab')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'attack-lab' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Attack Lab 🛡️
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Column: Command & Input */}
            <div className="md:col-span-1 space-y-5">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  Intent Input
                </h2>
                
                <form onSubmit={handleSendMessage} className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block font-mono">Natural Language Command</label>
                    <textarea 
                      rows="3"
                      value={inputMessage}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="e.g. Pay ₹500 to Anish for lunch or ₹5000 for design work"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono resize-none transition-colors"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold tracking-wide flex items-center justify-center space-x-2 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Evaluate & Execute</span>
                  </button>
                </form>

                {/* Quick Prompts */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <span className="text-[11px] text-slate-400 font-mono block">Quick Demo Prompts:</span>
                  <div className="flex flex-col gap-1.5">
                    <button 
                      onClick={() => setMessage("Pay ₹500 to Anish for lunch")} 
                      className="text-left text-xs bg-slate-950/80 hover:bg-slate-800 p-2 rounded border border-slate-800/80 text-indigo-300 font-mono transition-colors"
                    >
                      ⚡ Pay ₹500 to Anish (ALLOW)
                    </button>
                    <button 
                      onClick={() => setMessage("Pay ₹5000 to Anish for design work")} 
                      className="text-left text-xs bg-slate-950/80 hover:bg-slate-800 p-2 rounded border border-slate-800/80 text-amber-300 font-mono transition-colors"
                    >
                      🔒 Pay ₹5000 to Anish (REQUIRE_APPROVAL)
                    </button>
                  </div>
                </div>
              </div>

              {/* Approval Box if required */}
              {currentResponse && currentResponse.approval_required && currentResponse.approval_request_id && (
                <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-5 shadow-xl space-y-4 animate-fadeIn">
                  <div className="flex items-center space-x-2 text-amber-400">
                    <AlertTriangle className="w-5 h-5" />
                    <h3 className="text-sm font-bold tracking-wide">Human Sign-Off Required</h3>
                  </div>
                  <p className="text-xs text-slate-300">
                    This transaction exceeds autonomous spending thresholds and is paused for authorization.
                  </p>
                  
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-mono">Approver ID / Role</label>
                    <input 
                      type="text" 
                      value={approverId}
                      onChange={(e) => setApproverId(e.target.value)}
                      className="w-full bg-slate-950 border border-amber-500/30 rounded-lg p-2 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>

                  <div className="flex space-x-2 pt-1">
                    <button 
                      onClick={() => handleResolveApproval(true)}
                      disabled={loading}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all shadow"
                    >
                      Approve & Execute
                    </button>
                    <button 
                      onClick={() => handleResolveApproval(false)}
                      disabled={loading}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-all shadow"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Execution Timeline & Live Gateway Status */}
            <div className="md:col-span-2 space-y-5">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Live Governance Pipeline
                </h2>
                
                {pipelineSteps.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-slate-800 rounded-lg">
                    <Cpu className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
                    <p className="text-xs text-slate-500 font-mono">Submit a natural language command above to initiate Sovereign control flow.</p>
                  </div>
                ) : (
                  <TransactionTimeline steps={pipelineSteps} />
                )}
              </div>

              {/* RazorpayX Execution Receipt Card */}
              {currentResponse && currentResponse.execution && (
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                    <div className="flex items-center space-x-2 text-emerald-400">
                      <Zap className="w-5 h-5" />
                      <h3 className="text-sm font-bold tracking-wide">RazorpayX Test Sandbox Payout Success</h3>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                      {currentResponse.execution.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                      <span className="text-slate-500 block">Transaction ID:</span>
                      <span className="text-emerald-400 font-bold">{currentResponse.execution.transaction_id}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                      <span className="text-slate-500 block">Gateway / Env:</span>
                      <span className="text-indigo-300">{currentResponse.execution.gateway}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'ledger' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-400" />
                  Tamper-Evident Audit Ledger
                </h2>
                <p className="text-xs text-slate-400">Cryptographically hashed immutable receipts stored in SQLite.</p>
              </div>
              <button 
                onClick={fetchLedger}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono rounded border border-slate-700 flex items-center space-x-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Ledger</span>
              </button>
            </div>

            <div className="space-y-3">
              {ledgerEntries.length === 0 ? (
                <p className="text-xs text-slate-500 font-mono text-center py-10">No ledger entries recorded yet.</p>
              ) : (
                ledgerEntries.map((entry, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800/80 rounded-lg p-4 space-y-2 font-mono">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-indigo-400 font-bold">Receipt ID: {entry.receipt_id}</span>
                      <span className="text-slate-500 text-[11px]">{entry.timestamp}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-300 bg-slate-900/50 p-2.5 rounded border border-slate-800">
                      <div><span className="text-slate-500">Intent:</span> {entry.user_intent}</div>
                      <div><span className="text-slate-500">Decision:</span> <span className="text-emerald-400">{entry.policy_decision}</span></div>
                      <div><span className="text-slate-500">Hash:</span> <span className="text-amber-300 truncate block">{entry.receipt_hash}</span></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'attack-lab' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-base font-semibold text-rose-400 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Attack Lab & Mutation Defense Simulator
              </h2>
              <p className="text-xs text-slate-400">Simulate malicious payload alterations and prompt overrides to prove Sovereign's cryptographic security boundaries.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => runAttackSimulation('amount-escalation')}
                disabled={attackLoading}
                className="bg-slate-950 border border-slate-800 hover:border-rose-500/50 rounded-xl p-4 text-left space-y-2 transition-all group"
              >
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wide block group-hover:underline">1. Amount Escalation</span>
                <p className="text-[11px] text-slate-400 font-mono">Approved for ₹5,000 → Agent tries to execute ₹50,000.</p>
              </button>

              <button 
                onClick={() => runAttackSimulation('recipient-substitution')}
                disabled={attackLoading}
                className="bg-slate-950 border border-slate-800 hover:border-rose-500/50 rounded-xl p-4 text-left space-y-2 transition-all group"
              >
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wide block group-hover:underline">2. Recipient Substitution</span>
                <p className="text-[11px] text-slate-400 font-mono">Approved for Anish → Agent swaps to attacker wallet.</p>
              </button>

              <button 
                onClick={() => runAttackSimulation('velocity-structuring')}
                disabled={attackLoading}
                className="bg-slate-950 border border-slate-800 hover:border-rose-500/50 rounded-xl p-4 text-left space-y-2 transition-all group"
              >
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wide block group-hover:underline">3. Velocity Structuring</span>
                <p className="text-[11px] text-slate-400 font-mono">Rapid micro-transactions designed to bypass limits.</p>
              </button>
            </div>

            {attackResult && (
              <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-5 space-y-3 font-mono animate-fadeIn">
                <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
                  <span className="text-sm font-bold text-rose-400">🛡️ {attackResult.attack_name}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                    {attackResult.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{attackResult.reason}</p>
                <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] text-indigo-300 overflow-x-auto">
                  {JSON.stringify(attackResult, null, 2)}
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}