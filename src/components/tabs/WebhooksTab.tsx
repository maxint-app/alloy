import React, { useState, useEffect } from "react";
import { IntegrationConfig } from "../../types";
import { Github, Copy, Terminal, Play, CheckCircle2, ToggleRight, ToggleLeft, RefreshCw, Layers } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface WebhooksTabProps {
  config: IntegrationConfig;
  onUpdateConfig: (config: IntegrationConfig) => void;
  showSecrets: boolean;
  onSimulateWebhook: (commitMsg: string) => Promise<void>;
  loadingSimDetail: boolean;
}

export default function WebhooksTab({ config, onUpdateConfig, showSecrets, onSimulateWebhook, loadingSimDetail }: WebhooksTabProps) {
  const [localCommit, setLocalCommit] = useState(
    "feat: Relentlessly refined button click response to use 150ms bezier curves\\n\\nIncreased animation threshold, reduced layout shift."
  );
  const [copied, setCopied] = useState(false);
  const [copiedCurlCmd, setCopiedCurlCmd] = useState(false);

  const [webhookHistory, setWebhookHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const webhookUrl = `${window.location.protocol}//${window.location.host}/api/webhook/github`;

  const fetchWebhookHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/webhook/history");
      const data = await res.json();
      if (data.history) {
        setWebhookHistory(data.history);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchWebhookHistory();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const commitPresets = [
    "feat: Relentlessly refined button click response to use 150ms bezier curves",
    "fix: Solve the pixel shift occurring on retina displays during scale adjustments",
    "docs: Ingest final architectural guidelines detailing our sub-micron layouts"
  ];

  const handleSimulateBtn = async () => {
    if (!localCommit.trim()) return;
    await onSimulateWebhook(localCommit);
    fetchWebhookHistory();
  };

  // Human-engineered curl mock generator
  const getCurlCmd = () => {
    return `curl -X POST -H "Content-Type: application/json" \\
  -d '{"event":{"id":"test_evt_${Date.now().toString().slice(-4)}","commitMessage":"${localCommit.replace(/'/g, "'\\''")}"}}' \\
  ${webhookUrl}`;
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(getCurlCmd());
    setCopiedCurlCmd(true);
    setTimeout(() => setCopiedCurlCmd(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Dual configuration side-by-side splits with logs running wide at the bottom! */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* B1. Left Side: GitHub Anchor Config Panel */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-zinc-155 shadow-[0_4px_20px_rgba(0,0,0,0.01)] space-y-6">
          <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100">
            <div className="flex items-center space-x-3 text-left">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 text-white shrink-0 border border-zinc-650">
                <Github className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-semibold text-zinc-900 leading-tight">GitHub Autopilot Ingestion Anchor</h4>
                <span className="text-[10.5px] text-zinc-400 block font-normal mt-0.5">Auto-trigger summarizing pipelines when commits land</span>
              </div>
            </div>

            <div className="flex items-center">
              <button
                type="button"
                onClick={() => onUpdateConfig({ ...config, githubEnabled: !config.githubEnabled })}
                className="cursor-pointer focus:outline-none shrink-0"
              >
                {config.githubEnabled ? (
                  <ToggleRight className="w-8 h-8 text-zinc-950" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-zinc-300" />
                )}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {config.githubEnabled ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase">Repository path</label>
                    <input
                      type="text"
                      value={config.githubRepo}
                      onChange={(e) => onUpdateConfig({ ...config, githubRepo: e.target.value })}
                      className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-mono text-zinc-850 focus:bg-white focus:outline-none focus:border-zinc-400 font-normal"
                      placeholder="username/repository"
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase">Push Secret handshake Token</label>
                    <div className="relative">
                      <input
                        type={showSecrets ? "text" : "password"}
                        value={config.githubSecret}
                        onChange={(e) => onUpdateConfig({ ...config, githubSecret: e.target.value })}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-3 pr-8 py-2 text-xs font-mono text-zinc-850 focus:bg-white focus:outline-none focus:border-zinc-400 font-normal"
                        placeholder={showSecrets ? "your_raw_webhook_handshake_secret_token" : "••••••••••••••••"}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-50/50 rounded-xl border border-zinc-150 p-4 font-normal text-left">
                  <span className="text-[9.5px] uppercase font-bold text-zinc-650 flex items-center gap-1.5 mb-2.5">
                    <Terminal className="w-3.5 h-3.5" /> Configure this anchor manually on github pipeline config
                  </span>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 bg-white border border-zinc-200 rounded p-2 text-[10px] font-mono text-indigo-700 truncate cursor-text select-all shadow-inner">
                      {webhookUrl}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="p-2 border border-zinc-200 rounded bg-white hover:bg-zinc-50 transition shrink-0 shadow-sm cursor-pointer"
                      title="Copy webhook payload router target"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-zinc-500" />}
                    </button>
                  </div>
                  <p className="text-[9.5px] text-zinc-400 font-medium">Verify your repository is dispatching events on 'push' and using JSON as payload serialization.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 flex flex-col items-center justify-center text-zinc-400"
              >
                <Github className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-xs font-medium">GitHub auto-trigger ingestion pipeline is entirely disabled.</p>
                <p className="text-[10px] uppercase font-bold mt-1 opacity-50">Toggle right to configure triggers</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* B2. Right Side: Telemetry Simulator Sandbox */}
        <div className="lg:col-span-5 flex flex-col items-stretch space-y-4 font-normal text-left">
          <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-900 shadow-xl overflow-hidden relative">
            {/* Terminal decoration */}
            <div className="absolute top-4 left-4 flex gap-1.5 opacity-50 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>

            <div className="pt-5 opacity-90 space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 pb-2 border-b border-zinc-800">
                <Terminal className="w-4 h-4" />
                <h5 className="font-mono text-xs uppercase font-bold">Simulator Forge</h5>
              </div>
              
              <div className="space-y-1">
                <label className="text-[8.5px] text-zinc-500 font-mono uppercase font-bold text-left block">
                  Mock Dispatch Payload Commit Message Body
                </label>
                <textarea
                  value={localCommit}
                  onChange={(e) => setLocalCommit(e.target.value)}
                  className="w-full bg-black/40 border border-zinc-800 focus:border-zinc-700 outline-none p-3 text-[11px] text-zinc-200 font-mono rounded overflow-auto resize-none"
                  rows={4}
                  placeholder="feat: injected layout..."
                />
              </div>
              
              {/* Presets wrapper mapping */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {commitPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setLocalCommit(preset)}
                    className="truncate max-w-[200px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[9px] text-zinc-400 font-mono px-2 py-1 rounded transition cursor-pointer"
                  >
                    {preset.split(":")[0]}: {preset.substring(preset.indexOf(":")+1, 15)}...
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleSimulateBtn}
                  disabled={loadingSimDetail}
                  className="flex-1 bg-white hover:bg-zinc-200 text-black py-2 px-3 rounded font-bold text-xs uppercase flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50 disabled:cursor-progress"
                >
                  <Play className="w-3.5 h-3.5" fill="currentColor" />
                  {loadingSimDetail ? "Firing event sequence..." : "Fire Test Webhook"}
                </button>

                <button
                  type="button"
                  onClick={handleCopyCurl}
                  title="Copy cURL snippet"
                  className="px-3 py-2 border border-zinc-800 hover:bg-zinc-900 bg-zinc-900/50 rounded flex items-center justify-center cursor-pointer transition"
                >
                  {copiedCurlCmd ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* B3. Bottom Pane Log Viewer - Full width */}
      <div className="bg-white rounded-2xl border border-zinc-150 p-6 flex flex-col mt-4 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
        <div className="flex items-center justify-between mb-4 border-b border-zinc-150 pb-2">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-zinc-100 text-zinc-500">
              <Layers className="w-3.5 h-3.5" />
            </span>
            <h4 className="text-xs font-semibold text-zinc-850 uppercase tracking-tight">Active Pipeline Logs & Analytics Stream</h4>
          </div>
          
          <button
            type="button"
            onClick={fetchWebhookHistory}
            disabled={loadingHistory}
            className="text-zinc-600 hover:text-zinc-950 cursor-pointer"
            title="Refresh logs from pipeline"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Glassmorphic console feel with high density formatting */}
        <div className="bg-zinc-950 text-zinc-100 p-4 rounded-xl border border-zinc-900 font-mono text-xs shadow-inner min-h-[180px] max-h-[350px] overflow-y-auto space-y-3 leading-relaxed select-text">
          {webhookHistory.length === 0 ? (
            <div className="text-zinc-500 text-center py-10 font-mono">
              // Telemetry gateway listening... Push test simulator parameters or copy cURL to fire webhook signals!
            </div>
          ) : (
            webhookHistory.map((log) => (
              <div key={log.id} className="border-b border-zinc-900 pb-3 last:border-0 last:pb-0 space-y-1.5 animate-fade-in relative group text-left">
                <div className="flex items-center justify-between pointer-events-none select-none border-b border-zinc-900 pb-1 mb-1">
                  <span className="text-zinc-500 text-[9.5px]">ID: <span className="text-zinc-400 font-bold">{log.id}</span></span>
                  <span className="text-zinc-650 text-[9px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-indigo-400 leading-snug">
                  <span className="text-zinc-600 font-bold pointer-events-none">[PAYLOAD_RECV] :</span> Ingest successful from repository <span className="text-zinc-200 underline decoration-zinc-700 underline-offset-2">{log.repo}</span>
                </p>
                <p className="text-zinc-450 italic pl-3 border-l-2 border-zinc-800">
                  "{log.commitMessage}"
                </p>
                <div className="text-emerald-400 flex items-center gap-1.5 font-bold text-[9.5px] pt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Milling completed: Content vectorized and cached in local db drawer</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
