import React, { useState, useEffect } from "react";
import { IntegrationConfig, LLMProviderConfig, Archetype, CustomSkill, McpServerConfig } from "../types";
import { 
  Github, Copy, Check, Terminal, Play, CheckCircle2, 
  HelpCircle, Sparkles, RefreshCw, Layers, Twitter, Linkedin, AlertCircle,
  Zap, GitFork, Sliders, Bot, Plus, Trash2, Cpu, Code, Link, Compass, Settings, AlertTriangle, FileText, ToggleLeft, ToggleRight, CheckSquare,
  MessageSquare, Flame, Briefcase, Globe, Info, Server, Eye, EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import AITab from "./tabs/AITab";
import WebhooksTab from "./tabs/WebhooksTab";
import PublishersTab from "./tabs/PublishersTab";

interface IntegrationPanelProps {
  config: IntegrationConfig;
  onUpdateConfig: (config: IntegrationConfig) => void;
  onSimulateWebhook: (commitMsg: string) => Promise<void>;
  loadingSimDetail: boolean;
  providerConfig: LLMProviderConfig;
  onUpdateProviderConfig: (config: LLMProviderConfig) => void;

  // Agent Customization section parameters
  customAgents: Archetype[];
  onUpdateConfigModel?: any; 
  onUpdateCustomAgents: (agents: Archetype[]) => void;
  customSkills: CustomSkill[];
  onUpdateCustomSkills: (skills: CustomSkill[]) => void;
  userInstructions: string;
  onUpdateUserInstructions: (instructions: string) => void;
  mcpServers: McpServerConfig[];
  onUpdateMcpServers: (servers: McpServerConfig[]) => void;
  projectName?: string;
}

type SandboxTabId = "ai" | "webhooks" | "publishers";

export default function IntegrationPanel({ 
  config, 
  onUpdateConfig, 
  onSimulateWebhook,
  loadingSimDetail,
  providerConfig,
  onUpdateProviderConfig,
  customAgents,
  onUpdateCustomAgents,
  customSkills,
  onUpdateCustomSkills,
  userInstructions,
  onUpdateUserInstructions,
  mcpServers,
  onUpdateMcpServers,
  projectName = "Default Project"
}: IntegrationPanelProps) {
  // Main tab state to separate settings and fix layout balance
  const [activeSandboxTab, setActiveSandboxTab] = useState<SandboxTabId>("ai");

  const [copiedLinkUri, setCopiedLinkUri] = useState(false);
  const [copiedTwitterUri, setCopiedTwitterUri] = useState(false);
  const [verifyingLinkedin, setVerifyingLinkedin] = useState(false);
  const [verifyingTwitter, setVerifyingTwitter] = useState(false);
  const [linkedinSavedState, setLinkedinSavedState] = useState(false);
  const [twitterSavedState, setTwitterSavedState] = useState(false);

  // Connection visibility secrets toggle
  const [showSecrets, setShowSecrets] = useState(false);

  // Listen for customized cross-origin OAuth messages per oauth-integration guidelines
  useEffect(() => {
    const handleOauthMessage = (e: MessageEvent) => {
      const origin = e.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
        return;
      }
      if (e.data && e.data.type === "OAUTH_AUTH_SUCCESS") {
        const platform = e.data.platform;
        if (platform === "linkedin") {
          onUpdateConfig({
            ...config,
            linkedinEnabled: true,
            linkedinAuthType: "oauth",
            linkedinConnectedUser: "Alloy Enterprise Account"
          });
        } else if (platform === "twitter") {
          onUpdateConfig({
            ...config,
            twitterEnabled: true,
            twitterAuthType: "oauth",
            twitterConnectedUser: "@alloy_studio"
          });
        }
      }
    };
    window.addEventListener("message", handleOauthMessage);
    return () => window.removeEventListener("message", handleOauthMessage);
  }, [config, onUpdateConfig]);

  const handleOauthConnect = async (platform: "linkedin" | "twitter") => {
    try {
      const response = await fetch(`/api/auth/url?platform=${platform}`);
      if (!response.ok) throw new Error("Failed to grab auth link");
      const { url } = await response.json();
      
      const width = 500;
      const height = 660;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const authWindow = window.open(
        url,
        `oauth_window_${platform}`,
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
      );

      if (!authWindow) {
        alert("Please enable popup windows in your browser to complete OAuth account connection.");
      }
    } catch (err) {
      console.error("OAuth init failure:", err);
    }
  };

  const handleOauthDisconnect = (platform: "linkedin" | "twitter") => {
    if (platform === "linkedin") {
      onUpdateConfig({
        ...config,
        linkedinEnabled: false,
        linkedinConnectedUser: ""
      });
    } else {
      onUpdateConfig({
        ...config,
        twitterEnabled: false,
        twitterConnectedUser: ""
      });
    }
  };

  const handleCopyUri = (uri: string, isLinkedin: boolean) => {
    navigator.clipboard.writeText(uri);
    if (isLinkedin) {
      setCopiedLinkUri(true);
      setTimeout(() => setCopiedLinkUri(false), 2000);
    } else {
      setCopiedTwitterUri(true);
      setTimeout(() => setCopiedTwitterUri(false), 2000);
    }
  };

  const handleSaveApiKeys = (platform: "linkedin" | "twitter") => {
    if (platform === "linkedin") {
      setVerifyingLinkedin(true);
      setTimeout(() => {
        setVerifyingLinkedin(false);
        setLinkedinSavedState(true);
        onUpdateConfig({
          ...config,
          linkedinEnabled: true,
          linkedinAuthType: "api_key"
        });
        setTimeout(() => setLinkedinSavedState(false), 2000);
      }, 1000);
    } else {
      setVerifyingTwitter(true);
      setTimeout(() => {
        setVerifyingTwitter(false);
        setTwitterSavedState(true);
        onUpdateConfig({
          ...config,
          twitterEnabled: true,
          twitterAuthType: "api_key"
        });
        setTimeout(() => setTwitterSavedState(false), 2000);
      }, 1000);
    }
  };



  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      
      {/* 1. Dynamic Project Context Highlight Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-white space-y-3 relative overflow-hidden shadow-lg">
        {/* Subtle grid decoration */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#2a2a2e_1px,transparent_1px),linear-gradient(to_bottom,#2a2a2e_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] opacity-25" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-800 text-zinc-300 shrink-0 border border-zinc-700">
              <Briefcase className="w-5 h-5 text-zinc-200" />
            </span>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-zinc-800 text-zinc-300 font-mono font-bold px-2 py-0.5 rounded tracking-wide uppercase">
                  Sandbox Context
                </span>
                <span className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Isolated Profile Mode
                </span>
              </div>
              <h4 className="font-semibold text-sm text-zinc-100">
                Customizing settings for <strong className="text-white bg-zinc-800 px-2 py-0.5 rounded border border-zinc-750 font-mono text-[12px] ml-0.5">{projectName}</strong>
              </h4>
              <p className="text-[11.5px] text-zinc-400 max-w-3xl leading-relaxed">
                Tokens, developer credentials, and webhook automation logic are isolated completely inside this context. Trigger change logs or modify profiles at the Generator workspace tab.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2 bg-zinc-800/60 border border-zinc-750 p-1 rounded-lg">
            <button
              onClick={() => setShowSecrets(!showSecrets)}
              className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              {showSecrets ? <EyeOff className="w-3.5 h-3.5 text-zinc-500" /> : <Eye className="w-3.5 h-3.5 text-zinc-400" />}
              {showSecrets ? "Hide secrets" : "Reveal credentials"}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showSecrets && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="relative mt-4 pt-4 border-t border-zinc-800 text-zinc-350 space-y-4 text-xs overflow-hidden"
            >
              <div className="flex items-center gap-2 text-zinc-100 font-mono uppercase text-[10px] tracking-wider font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Active Sandbox Credentials</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* Secret 1 */}
                <div className="p-3.5 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-1">
                  <div className="text-[9.5px] text-zinc-400 uppercase tracking-wider font-bold">AI Provider Key ({providerConfig?.provider || "Default"})</div>
                  <div className="font-mono text-[11px] truncate text-amber-400/90 selection:bg-amber-900/40" title={providerConfig?.apiKey || "System API Key"}>
                    {providerConfig?.apiKey ? providerConfig.apiKey : "System API Key (using container environment)"}
                  </div>
                </div>

                {/* Secret 2 */}
                <div className="p-3.5 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-1">
                  <div className="text-[9.5px] text-zinc-400 uppercase tracking-wider font-bold">GitHub Webhook Secret</div>
                  <div className="font-mono text-[11px] truncate text-emerald-400/90 selection:bg-emerald-900/40" title={config?.githubSecret || "Not set"}>
                    {config?.githubSecret ? config.githubSecret : "Unset (Webhook simulator active)"}
                  </div>
                </div>

                {/* Secret 3 */}
                <div className="p-3.5 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-1">
                  <div className="text-[9.5px] text-zinc-400 uppercase tracking-wider font-bold text-left">Active Integrations Tokens</div>
                  <div className="text-[10.5px] text-zinc-500 truncate font-mono">
                    {[
                      config?.twitterEnabled ? "Twitter Dev" : "",
                      config?.linkedinEnabled ? "LinkedIn API" : "",
                      config?.discordEnabled ? "Discord Hook" : "",
                      config?.zapierEnabled ? "Zapier Webhook" : ""
                    ].filter(Boolean).join(", ") || "No external credentials active"}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Sleek Central Workspace Navigation Tabs */}
      <div className="flex border border-zinc-200/60 p-1 bg-zinc-100/80 rounded-2xl max-w-xl shadow-[0_2px_10px_rgba(0,0,0,0.01)] transition-all">
        {([
          { id: "ai", label: "AI Intelligence", desc: "Provider & specialist agents", icon: <Cpu className="w-4 h-4" /> },
          { id: "webhooks", label: "Webhook Pipeline", desc: "Push ingest & sandbox simulation", icon: <Terminal className="w-4 h-4" /> },
          { id: "publishers", label: "Publisher Hub", desc: "Store & social outbound links", icon: <Layers className="w-4 h-4" /> }
        ] as const).map((tab) => {
          const isSelected = activeSandboxTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSandboxTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3.5 px-3.5 rounded-xl transition-all duration-300 relative focus:outline-none cursor-pointer ${
                isSelected 
                  ? "bg-white text-zinc-950 shadow-md scale-[1.01] border border-zinc-150 font-semibold" 
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`transition-transform duration-300 ${isSelected ? "scale-105 text-zinc-950" : "text-zinc-400"}`}>
                  {tab.icon}
                </span>
                <span className="text-xs">{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Dynamic Animated Workspace Views */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSandboxTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="space-y-8"
        >
          
          {/* TAB A: AI CONFIGURATION WORKSPACE */}
          {activeSandboxTab === "ai" && (
            <AITab
              providerConfig={providerConfig}
              onUpdateProviderConfig={onUpdateProviderConfig}
              customAgents={customAgents}
              onUpdateCustomAgents={onUpdateCustomAgents}
              customSkills={customSkills}
              onUpdateCustomSkills={onUpdateCustomSkills}
              userInstructions={userInstructions}
              onUpdateUserInstructions={onUpdateUserInstructions}
              mcpServers={mcpServers}
              onUpdateMcpServers={onUpdateMcpServers}
            />
          )}

          {/* TAB B: WEBHOOKS PIPELINE WORKSPACE */}
          {activeSandboxTab === "webhooks" && (
            <WebhooksTab
              config={config}
              onUpdateConfig={onUpdateConfig}
              showSecrets={showSecrets}
              onSimulateWebhook={onSimulateWebhook}
              loadingSimDetail={loadingSimDetail}
            />
          )}

          {/* TAB C: OUTBOUND SOCIAL & PUBLISHER HUB */}
          {activeSandboxTab === "publishers" && (
            <PublishersTab
              config={config}
              onUpdateConfig={onUpdateConfig}
              showSecrets={showSecrets}
              setShowSecrets={setShowSecrets}
              verifyingLinkedin={verifyingLinkedin}
              setVerifyingLinkedin={setVerifyingLinkedin}
              linkedinSavedState={linkedinSavedState}
              setLinkedinSavedState={setLinkedinSavedState}
              verifyingTwitter={verifyingTwitter}
              setVerifyingTwitter={setVerifyingTwitter}
              twitterSavedState={twitterSavedState}
              setTwitterSavedState={setTwitterSavedState}
              copiedLinkUri={copiedLinkUri}
              setCopiedLinkUri={setCopiedLinkUri}
              copiedTwitterUri={copiedTwitterUri}
              setCopiedTwitterUri={setCopiedTwitterUri}
            />
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}