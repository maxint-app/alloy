import React, { useState } from "react";
import { LLMProviderConfig, LLMProviderId } from "../types";
import { Sparkles, Key, Globe, Cpu, Check, Server, Info, AlertTriangle } from "lucide-react";

interface LLMProviderSelectorProps {
  config: LLMProviderConfig;
  onChange: (config: LLMProviderConfig) => void;
}

export default function LLMProviderSelector({ config, onChange }: LLMProviderSelectorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Providers list
  const providers = [
    {
      id: "gemini" as LLMProviderId,
      name: "Google Gemini",
      tagline: "Standard Cloud Intelligence",
      description: "Uses Gemini Pro models automatically. Ultra fast with rich styling schema compliance.",
      icon: <Sparkles className="w-4 h-4" />,
      defaultModel: "gemini-3.5-flash",
      defaultUrl: ""
    },
    {
      id: "openai" as LLMProviderId,
      name: "OpenAI API",
      tagline: "GPT-4 / Mini Engines",
      description: "Direct connection with official OpenAI API endpoint. Highly precise structure.",
      icon: <Cpu className="w-4 h-4" />,
      defaultModel: "gpt-4o-mini",
      defaultUrl: "https://api.openai.com/v1"
    },
    {
      id: "anthropic" as LLMProviderId,
      name: "Anthropic Claude",
      tagline: "Claude 3.5 Models",
      description: "Superb prose generation and deep philosophical tone consistency.",
      icon: <Globe className="w-4 h-4" />,
      defaultModel: "claude-3-5-haiku-20241022",
      defaultUrl: "https://api.anthropic.com/v1"
    },
    {
      id: "local" as LLMProviderId,
      name: "Local LLM / Custom",
      tagline: "Ollama & Offline",
      description: "Runs entirely client/server-side to local instances. Zero data leaks, highly secure.",
      icon: <Server className="w-4 h-4" />,
      defaultModel: "llama3",
      defaultUrl: "http://localhost:11434/v1"
    }
  ];

  const handleProviderToggle = (id: LLMProviderId) => {
    const target = providers.find(p => p.id === id)!;
    onChange({
      provider: id,
      apiKey: id === "gemini" ? "" : config.apiKey, // preserve key if possible
      baseUrl: target.defaultUrl,
      modelName: target.defaultModel
    });
  };

  const updateField = (key: keyof LLMProviderConfig, val: string) => {
    onChange({
      ...config,
      [key]: val
    });
  };

  const activeProviderObj = providers.find(p => p.id === config.provider) || providers[0];

  return (
    <div className="space-y-6">
      
      {/* Label and Info */}
      <div className="flex flex-col space-y-1">
        <label className="text-[10px] font-semibold tracking-widest uppercase text-zinc-400">
          Inference Engine & LLM Provider
        </label>
        <span className="text-sm text-zinc-500">
          Toggle between state-of-the-art managed cloud services or route to your offline local network.
        </span>
      </div>

      {/* Grid of options */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {providers.map((p) => {
          const isSelected = config.provider === p.id;
          return (
            <button
              key={p.id}
              onClick={() => handleProviderToggle(p.id)}
              className={`flex flex-col justify-between text-left p-4.5 rounded-xl border transition-all duration-300 cursor-pointer select-none group focus:outline-none ${
                isSelected
                  ? "bg-white border-zinc-950/25 shadow-[0_4px_20px_rgb(0,0,0,0.02)]"
                  : "bg-zinc-50/55 border-zinc-100 hover:bg-zinc-100/40"
              }`}
            >
              <div className="flex items-start justify-between w-full mb-3">
                <span
                  className={`flex items-center justify-center w-7.5 h-7.5 rounded-lg transition-transform group-hover:scale-105 duration-300 ${
                    isSelected ? "bg-zinc-900 text-white" : "bg-zinc-200/50 text-zinc-600"
                  }`}
                >
                  {p.icon}
                </span>
                
                <span
                  className={`flex items-center justify-center w-5 h-5 rounded-full border transition-all duration-300 ${
                    isSelected
                      ? "bg-zinc-900 border-zinc-900 text-white"
                      : "bg-transparent border-zinc-200 group-hover:border-zinc-300"
                  }`}
                >
                  {isSelected && <Check className="w-3" />}
                </span>
              </div>

              <div>
                <h4 className="font-semibold text-xs text-zinc-900 leading-snug">
                  {p.name}
                </h4>
                <p className="text-[9.5px] uppercase tracking-wider text-zinc-400 font-semibold mt-0.5 mb-1.5">
                  {p.tagline}
                </p>
                <p className="text-[11px] text-zinc-400 font-normal leading-relaxed line-clamp-2">
                  {p.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Fields block */}
      <div className="bg-zinc-50/60 p-5 rounded-xl border border-zinc-100 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-zinc-400" />
            {activeProviderObj.name} Config Parameters
          </span>
          {config.provider === "local" && (
            <div className="text-[10px] text-zinc-500 bg-zinc-200/50 px-2 py-0.5 rounded flex items-center gap-1.5 font-mono">
              <Server className="w-3 h-3 text-zinc-400" />
              localhost ready
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* API Key Input (if not Local or if they seek key auth) */}
          <div className={`${config.provider === "local" ? "md:col-span-4" : "md:col-span-6"} flex flex-col space-y-1`}>
            <label className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
              {config.provider === "gemini" ? "Google API Key" : "API secret credentials"}
            </label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => updateField("apiKey", e.target.value)}
              placeholder={
                config.provider === "gemini" 
                  ? "Uses system secret key if blank" 
                  : config.provider === "local"
                    ? "Leave blank if unauthorized"
                    : `sk-... or specific provider password`
              }
              className="w-full bg-white border border-zinc-150 rounded-lg px-3 py-1.5 text-xs text-zinc-800 font-medium focus:border-zinc-950 focus:outline-none"
            />
          </div>

          {/* Base URL (for customizable routing or local instances) */}
          {(config.provider !== "gemini") && (
            <div className="md:col-span-4 flex flex-col space-y-1">
              <label className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                Gateway Base URL
              </label>
              <input
                type="text"
                value={config.baseUrl}
                onChange={(e) => updateField("baseUrl", e.target.value)}
                placeholder="e.g. http://localhost:11434/v1"
                className="w-full bg-white border border-zinc-150 rounded-lg px-3 py-1.5 text-xs text-zinc-800 font-mono focus:border-zinc-950 focus:outline-none"
              />
            </div>
          )}

          {/* Model Name Override */}
          <div className={`${config.provider === "gemini" ? "md:col-span-6" : config.provider === "local" ? "md:col-span-4" : "md:col-span-2"} flex flex-col space-y-1`}>
            <label className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
              Target Model identifier
            </label>
            <input
              type="text"
              value={config.modelName}
              onChange={(e) => updateField("modelName", e.target.value)}
              placeholder="e.g. gpt-4o-mini"
              className="w-full bg-white border border-zinc-150 rounded-lg px-3 py-1.5 text-xs text-zinc-800 font-mono focus:border-zinc-950 focus:outline-none"
            />
          </div>

        </div>

        {/* Helpful Tips based on selected provider */}
        {config.provider === "local" && (
          <div className="p-3 bg-white/80 border border-zinc-100 rounded-lg text-[11px] text-zinc-500 leading-relaxed space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-700">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              Offline Local Instance Integration
            </div>
            <p>
              To securely connect: Start your local LLM launcher. If using <strong>Ollama</strong>, verify the server is listening by executing <code className="bg-zinc-100 px-1 py-0.5 rounded text-[10px] font-mono">ollama run llama3</code> or run it directly in background mode on port <strong className="font-mono text-zinc-800">11434</strong>. Ensure your browser allow cross-origin requests or run the Alloy server to proxy standard client requests safely.
            </p>
          </div>
        )}

        {config.provider === "openai" && !config.apiKey && (
          <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg text-[11px] text-amber-700 leading-relaxed flex gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p>
              An API key is required to make completions on OpenAI server pools. Enter your confidential key starting with <code className="bg-amber-100/60 px-1 rounded font-mono font-medium">sk-</code> to enable remote distillation.
            </p>
          </div>
        )}

        {config.provider === "anthropic" && !config.apiKey && (
          <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg text-[11px] text-amber-700 leading-relaxed flex gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p>
              An API key is required to make completions on Anthropic pools. Enter your key starting with <code className="bg-amber-100/60 px-1 rounded font-mono font-medium">sk-ant-</code> to authorize Claude inference.
            </p>
          </div>
        )}

      </div>

    </div>
  );
}
