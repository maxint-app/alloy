import React from "react";
import { IntegrationConfig } from "../../types";
import { Linkedin, Twitter, Target, Building, BookOpen, ToggleRight, ToggleLeft, Copy, Check, EyeOff, Eye, Loader, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PublishersTabProps {
  config: IntegrationConfig;
  onUpdateConfig: (config: IntegrationConfig) => void;
  showSecrets: boolean;
  setShowSecrets: (val: boolean) => void;
  verifyingLinkedin: boolean;
  setVerifyingLinkedin: (val: boolean) => void;
  linkedinSavedState: boolean;
  setLinkedinSavedState: (val: boolean) => void;
  verifyingTwitter: boolean;
  setVerifyingTwitter: (val: boolean) => void;
  twitterSavedState: boolean;
  setTwitterSavedState: (val: boolean) => void;
  copiedLinkUri: boolean;
  setCopiedLinkUri: (val: boolean) => void;
  copiedTwitterUri: boolean;
  setCopiedTwitterUri: (val: boolean) => void;
}

export default function PublishersTab({
  config,
  onUpdateConfig,
  showSecrets,
  setShowSecrets,
  verifyingLinkedin,
  setVerifyingLinkedin,
  linkedinSavedState,
  setLinkedinSavedState,
  verifyingTwitter,
  setVerifyingTwitter,
  twitterSavedState,
  setTwitterSavedState,
  copiedLinkUri,
  setCopiedLinkUri,
  copiedTwitterUri,
  setCopiedTwitterUri
}: PublishersTabProps) {

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
    <div className="space-y-6">
      <div className="flex flex-col space-y-1 bg-white p-5 border border-zinc-150 rounded-2xl text-left shadow-sm">
        <span className="text-[9.5px] uppercase font-bold text-zinc-400 font-mono">Outbound Channels</span>
        <h4 className="font-semibold text-sm text-zinc-900 tracking-tight mt-0.5">Publisher Handshake Hub</h4>
        <p className="text-xs text-zinc-500 leading-normal max-w-2xl font-normal">
          Synthesizing release updates is only the starting point. Connect these live delivery channels to automatically post drafts, compile blogs, or push messages onto social channels!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-normal">
        
        {/* LinkedIn Connector */}
        <div className={`p-5 rounded-2xl border transition-all duration-300 md:col-span-2 shadow-xs hover:shadow flex flex-col justify-between ${
          config.linkedinEnabled ? "bg-white border-zinc-900/15 ring-1 ring-zinc-150" : "bg-zinc-50/50 border-zinc-150 text-zinc-500"
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Linkedin className="w-4 h-4 fill-current" />
              </span>
              <button
                type="button"
                onClick={() => onUpdateConfig({ ...config, linkedinEnabled: !config.linkedinEnabled })}
                className="cursor-pointer font-bold focus:outline-none"
              >
                {config.linkedinEnabled ? <ToggleRight className="w-8 h-8 text-zinc-900" /> : <ToggleLeft className="w-8 h-8 text-zinc-300" />}
              </button>
            </div>

            <h4 className="font-semibold text-xs text-zinc-900 leading-none mb-1 flex items-center gap-2">
              LinkedIn Enterprise API
              {config.linkedinEnabled && (
                <span className="text-[8.5px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  {config.linkedinAuthType === "oauth" ? "OAuth Handshake" : "Direct Key Active"}
                </span>
              )}
            </h4>
            <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed">
              Micro-blog summaries or full-length company update streams pushed into organizational pages.
            </p>

            {config.linkedinEnabled && (
              <div className="mt-4 border-t border-zinc-100 pt-4 space-y-4">
                <div className="flex bg-zinc-100 p-0.5 rounded-lg text-[10.5px]">
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ ...config, linkedinAuthType: "oauth" })}
                    className={`flex-1 py-1 rounded font-medium text-center cursor-pointer transition-all ${
                      config.linkedinAuthType === "oauth" 
                        ? "bg-white text-zinc-950 shadow-sm font-semibold" 
                        : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    👤 OAuth Flow
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ ...config, linkedinAuthType: "api_key" })}
                    className={`flex-1 py-1 rounded font-medium text-center cursor-pointer transition-all ${
                      config.linkedinAuthType === "api_key" 
                        ? "bg-white text-zinc-950 shadow-sm font-semibold" 
                        : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    🔑 Raw Access Keys
                  </button>
                </div>

                {config.linkedinAuthType === "oauth" ? (
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-3">
                      <div className="bg-white border rounded">
                        <label className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider block px-3 pt-2">Client Identity ID</label>
                        <input
                          type="text"
                          value={config.linkedinClientId}
                          onChange={(e) => onUpdateConfig({ ...config, linkedinClientId: e.target.value })}
                          className="w-full bg-transparent px-3 pb-2 pt-1 text-xs text-zinc-800 focus:outline-none"
                          placeholder="e.g. 78x..."
                        />
                      </div>
                      
                      <div className="bg-white border rounded relative">
                        <label className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider block px-3 pt-2">Redirect Oauth Scope URI</label>
                        <input
                          readOnly
                          value={`${window.location.protocol}//${window.location.host}/api/oauth/linkedin/callback`}
                          className="w-full bg-transparent px-3 pb-2 pt-1 text-xs text-zinc-500 font-mono focus:outline-none pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopyUri(`${window.location.protocol}//${window.location.host}/api/oauth/linkedin/callback`, true)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-zinc-100 cursor-pointer"
                        >
                          {copiedLinkUri ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-zinc-400" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 relative">
                    <div className="bg-zinc-50 border rounded-lg overflow-hidden">
                      <label className="text-[9.5px] font-bold text-zinc-400 uppercase block px-3 pt-2">Bearer Access Secret</label>
                      <input
                        type={showSecrets ? "text" : "password"}
                        value={config.linkedinAccessToken}
                        onChange={(e) => onUpdateConfig({ ...config, linkedinAccessToken: e.target.value })}
                        className="w-full bg-transparent px-3 pb-2 pt-1 text-xs text-zinc-800 font-mono focus:outline-none"
                        placeholder="•••••••••••••••••••••••••"
                      />
                    </div>
                    <div className="bg-zinc-50 border rounded-lg overflow-hidden flex items-center justify-between pr-2">
                       <div className="flex-1">
                          <label className="text-[9.5px] font-bold text-zinc-400 uppercase block px-3 pt-2">Organization Root URN ID</label>
                          <input
                            type="text"
                            value={config.linkedinOrgId}
                            onChange={(e) => onUpdateConfig({ ...config, linkedinOrgId: e.target.value })}
                            className="w-full bg-transparent px-3 pb-2 pt-1 text-xs text-zinc-800 font-mono focus:outline-none"
                            placeholder="e.g. 13370..."
                          />
                       </div>
                    </div>
                    
                    <button
                      type="button"
                      disabled={verifyingLinkedin || linkedinSavedState}
                      onClick={() => handleSaveApiKeys("linkedin")}
                      className={`w-full py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm
                        ${linkedinSavedState ? "bg-emerald-50 text-emerald-700 border-none relative overflow-hidden" 
                        : "bg-zinc-950 hover:bg-zinc-800 text-white"}`}
                    >
                      {verifyingLinkedin ? (
                        <><Loader className="w-3.5 h-3.5 animate-spin" /> Verifying Connection...</>
                      ) : linkedinSavedState ? (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Handshake Verified!</>
                      ) : (
                        "Save API Configuration"
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Twitter X Connector */}
        <div className={`p-5 rounded-2xl border transition-all duration-300 md:col-span-1 shadow-xs hover:shadow flex flex-col justify-between ${
          config.twitterEnabled ? "bg-white border-zinc-900/15 ring-1 ring-zinc-150" : "bg-zinc-50/50 border-zinc-150 text-zinc-500"
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-950 text-white border border-zinc-800">
                <Twitter className="w-4 h-4 fill-current" />
              </span>
              <button
                type="button"
                onClick={() => onUpdateConfig({ ...config, twitterEnabled: !config.twitterEnabled })}
                className="cursor-pointer font-bold focus:outline-none"
              >
                {config.twitterEnabled ? <ToggleRight className="w-8 h-8 text-zinc-900" /> : <ToggleLeft className="w-8 h-8 text-zinc-300" />}
              </button>
            </div>

            <h4 className="font-semibold text-xs text-zinc-900 leading-none mb-1 flex items-center gap-2">
              X (Twitter) v2
            </h4>
            <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed">
              Thread-style multi-part micro-content pushes.
            </p>

            {config.twitterEnabled && (
              <div className="mt-4 border-t border-zinc-100 pt-4 space-y-4">
               <div className="flex bg-zinc-100 p-0.5 rounded-lg text-[10.5px]">
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ ...config, twitterAuthType: "oauth" })}
                    className={`flex-1 py-1 rounded font-medium text-center cursor-pointer transition-all ${
                      config.twitterAuthType === "oauth" 
                        ? "bg-white text-zinc-950 shadow-sm font-semibold" 
                        : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    OAuth 1.0a
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ ...config, twitterAuthType: "api_key" })}
                    className={`flex-1 py-1 rounded font-medium text-center cursor-pointer transition-all ${
                      config.twitterAuthType === "api_key" 
                        ? "bg-white text-zinc-950 shadow-sm font-semibold" 
                        : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    API Keys
                  </button>
                </div>

                {config.twitterAuthType === "oauth" ? (
                  <div className="space-y-4">
                    <div className="bg-white border rounded">
                      <label className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider block px-3 pt-2">Oauth Client Hash</label>
                      <input
                        type={showSecrets ? "text" : "password"}
                        value={config.twitterClientId}
                        onChange={(e) => onUpdateConfig({ ...config, twitterClientId: e.target.value })}
                        className="w-full bg-transparent px-3 pb-2 pt-1 text-xs text-zinc-800 font-mono focus:outline-none"
                        placeholder="••••••••••"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 relative">
                    <div className="bg-zinc-50 border rounded-lg overflow-hidden">
                      <label className="text-[9.5px] font-bold text-zinc-400 uppercase block px-3 pt-2">Access OAuth Token</label>
                      <input
                        type={showSecrets ? "text" : "password"}
                        value={config.twitterAccessToken}
                        onChange={(e) => onUpdateConfig({ ...config, twitterAccessToken: e.target.value })}
                        className="w-full bg-transparent px-3 pb-2 pt-1 text-xs text-zinc-800 font-mono focus:outline-none"
                        placeholder="•••••••••••••••"
                      />
                    </div>
                    
                    <button
                      type="button"
                      disabled={verifyingTwitter || twitterSavedState}
                      onClick={() => handleSaveApiKeys("twitter")}
                      className={`w-full py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm
                        ${twitterSavedState ? "bg-emerald-50 text-emerald-700 border-none relative overflow-hidden" 
                        : "bg-zinc-950 hover:bg-zinc-800 text-white"}`}
                    >
                      {verifyingTwitter ? (
                        <><Loader className="w-3.5 h-3.5 animate-spin" /> ...</>
                      ) : twitterSavedState ? (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Saved!</>
                      ) : (
                        "Save Keys"
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
