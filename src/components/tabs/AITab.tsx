import React, { useState } from "react";
import { LLMProviderConfig, Archetype, CustomSkill, McpServerConfig } from "../../types";
import { Bot, Cpu, FileText, Compass, Trash2, Plus, AlertTriangle, RefreshCw, Sparkles, ToggleRight, ToggleLeft, Link } from "lucide-react";
import LLMProviderSelector from "../LLMProviderSelector";
import { AlertCircle } from "lucide-react";

interface AITabProps {
  providerConfig: LLMProviderConfig;
  onUpdateProviderConfig: (config: LLMProviderConfig) => void;
  customAgents: Archetype[];
  onUpdateCustomAgents: (agents: Archetype[]) => void;
  customSkills: CustomSkill[];
  onUpdateCustomSkills: (skills: CustomSkill[]) => void;
  userInstructions: string;
  onUpdateUserInstructions: (instructions: string) => void;
  mcpServers: McpServerConfig[];
  onUpdateMcpServers: (servers: McpServerConfig[]) => void;
}

export default function AITab({
  providerConfig,
  onUpdateProviderConfig,
  customAgents,
  onUpdateCustomAgents,
  customSkills,
  onUpdateCustomSkills,
  userInstructions,
  onUpdateUserInstructions,
  mcpServers,
  onUpdateMcpServers
}: AITabProps) {
  const [activeCustomTab, setActiveCustomTab] = useState<"agents" | "skills" | "context" | "mcp">("agents");

  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentRole, setNewAgentRole] = useState("");
  const [newAgentDesc, setNewAgentDesc] = useState("");
  const [newAgentPrompt, setNewAgentPrompt] = useState("");
  const [newAgentQuote, setNewAgentQuote] = useState("");
  const [newAgentAvatar, setNewAgentAvatar] = useState("");
  const [agentFormError, setAgentFormError] = useState("");

  const [sampleWriting, setSampleWriting] = useState("");
  const [isAnalyzingSample, setIsAnalyzingSample] = useState(false);
  const [analyzerError, setAnalyzerError] = useState("");

  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillDesc, setNewSkillDesc] = useState("");
  const [newSkillPrompt, setNewSkillPrompt] = useState("");
  const [skillFormError, setSkillFormError] = useState("");

  const [newMcpName, setNewMcpName] = useState("");
  const [newMcpUrl, setNewMcpUrl] = useState("");
  const [mcpFormError, setMcpFormError] = useState("");
  const [connectingMcpId, setConnectingMcpId] = useState<string | null>(null);

  const handleAddAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim() || !newAgentDesc.trim() || !newAgentPrompt.trim()) {
      setAgentFormError("Please fill out complete Name, Description, and System Instruction.");
      return;
    }
    const nameStr = newAgentName.trim();
    const newAgent: Archetype = {
      id: "agent_" + Date.now(),
      name: nameStr,
      role: newAgentRole.trim() || "Automated Expert Agent",
      description: newAgentDesc.trim(),
      systemInstruction: newAgentPrompt.trim(),
      quote: newAgentQuote.trim() || "Code should look like beautiful typography.",
      avatarText: newAgentAvatar.trim() || nameStr.slice(0, 2).toUpperCase()
    };
    onUpdateCustomAgents([...customAgents, newAgent]);
    
    setNewAgentName("");
    setNewAgentRole("");
    setNewAgentDesc("");
    setNewAgentPrompt("");
    setNewAgentQuote("");
    setNewAgentAvatar("");
    setAgentFormError("");
  };

  const handleAnalyzeWritingSample = async () => {
    if (!sampleWriting.trim()) {
      setAnalyzerError("Please provide a representative writing sample first.");
      return;
    }
    setIsAnalyzingSample(true);
    setAnalyzerError("");
    try {
      const res = await fetch("/api/generate-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleText: sampleWriting })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Analysis request failed.");
      }
      const data = await res.json();
      if (data.success && data.persona) {
        setNewAgentName(data.persona.name || "");
        setNewAgentRole(data.persona.role || "");
        setNewAgentDesc(data.persona.description || "");
        setNewAgentPrompt(data.persona.systemInstruction || "");
        setNewAgentQuote(data.persona.quote || "");
        setNewAgentAvatar(data.persona.avatarText || "");
        setSampleWriting("");
      } else {
        throw new Error("Could not parse persona from writing analysis.");
      }
    } catch (err: any) {
      console.error(err);
      setAnalyzerError(err?.message || "Error communicating with persona generator AI.");
    } finally {
      setIsAnalyzingSample(false);
    }
  };

  const handleRemoveAgent = (id: string) => {
    onUpdateCustomAgents(customAgents.filter(a => a.id !== id));
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim() || !newSkillDesc.trim() || !newSkillPrompt.trim()) {
      setSkillFormError("Please enter Title, Description, and active logic prompt.");
      return;
    }
    const newSkill: CustomSkill = {
      id: "skill_" + Date.now(),
      name: newSkillName.trim(),
      description: newSkillDesc.trim(),
      enabled: true,
      systemPromptSnippet: newSkillPrompt.trim()
    };
    onUpdateCustomSkills([...customSkills, newSkill]);
    setNewSkillName("");
    setNewSkillDesc("");
    setNewSkillPrompt("");
    setSkillFormError("");
  };

  const handleToggleSkill = (id: string) => {
    onUpdateCustomSkills(
      customSkills.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)
    );
  };

  const handleRemoveSkill = (id: string) => {
    onUpdateCustomSkills(customSkills.filter(s => s.id !== id));
  };

  const handleAddMcp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMcpName.trim() || !newMcpUrl.trim()) {
      setMcpFormError("Please enter the Server Name and reference URI.");
      return;
    }
    const newMcp: McpServerConfig = {
      id: "mcp_" + Date.now(),
      name: newMcpName.trim(),
      url: newMcpUrl.trim(),
      status: "disconnected" as const,
      methods: ["read-resource", "run-tool", "query-index"]
    };
    onUpdateMcpServers([...mcpServers, newMcp]);
    setNewMcpName("");
    setNewMcpUrl("");
    setMcpFormError("");
  };

  const handleToggleMcpConnection = (id: string, currentStatus: "connected" | "disconnected" | "connecting") => {
    if (currentStatus === "connected") {
      onUpdateMcpServers(mcpServers.map(m => m.id === id ? { ...m, status: "disconnected" as const } : m));
    } else {
      setConnectingMcpId(id);
      onUpdateMcpServers(mcpServers.map(m => m.id === id ? { ...m, status: "connecting" as const } : m));
      setTimeout(() => {
        onUpdateMcpServers(mcpServers.map(m => m.id === id ? { ...m, status: "connected" as const } : m));
        setConnectingMcpId(null);
      }, 1000);
    }
  };

  const handleRemoveMcp = (id: string) => {
    onUpdateMcpServers(mcpServers.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* First Row: LLM Selector Config */}
      <div className="bg-white p-6.5 rounded-2xl border border-zinc-150 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
        <LLMProviderSelector config={providerConfig} onChange={onUpdateProviderConfig} />
      </div>

      {/* Second Row: Specialist Control Room */}
      <div className="bg-white p-6.5 rounded-2xl border border-zinc-150 shadow-[0_4px_20px_rgba(0,0,0,0.01)] space-y-6">
        <div className="flex items-start space-x-3.5">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-950 text-zinc-100 shadow-sm shrink-0">
            <Bot className="w-5 h-5 text-zinc-200" />
          </span>
          <div>
            <h3 className="font-sans font-semibold text-xs tracking-tight text-zinc-900 uppercase">
              Agentic Control Room
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed font-normal">
              Design dedicated specialists, specify active prompt scripts, and couple Model Context Protocol (MCP) server targets.
            </p>
          </div>
        </div>

        {/* Sub Tab selection inside Agentic panel */}
        <div className="flex border-b border-zinc-100 p-0.5 bg-zinc-150/40 rounded-xl">
          {([
            { id: "agents", label: "Specialists", count: customAgents.length, icon: <Bot className="w-3.5 h-3.5" /> },
            { id: "skills", label: "Skills", count: customSkills.length, icon: <Cpu className="w-3.5 h-3.5" /> },
            { id: "context", label: "Instructions", count: userInstructions.trim() ? 1 : 0, icon: <FileText className="w-3.5 h-3.5" /> },
            { id: "mcp", label: "MCP", count: mcpServers.filter(m => m.status === "connected").length, icon: <Compass className="w-3.5 h-3.5" /> }
          ] as const).map((tab) => {
            const belongs = activeCustomTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCustomTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1 text-xs font-medium rounded-lg cursor-pointer transition-all ${
                  belongs 
                    ? "bg-white text-zinc-950 shadow-sm font-semibold" 
                    : "text-zinc-400 hover:text-zinc-700"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`text-[8.5px] px-1 py-0.2 rounded-full font-bold ml-1.5 ${belongs ? "bg-zinc-900 text-white" : "bg-zinc-200 text-zinc-500"}`}>
                    {tab.id === "mcp" && tab.count > 0 ? "LIVE" : tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Panel for selected Sub-Tab */}
        <div className="pt-2 min-h-[350px]">
          
          {/* Persona Panel */}
          {activeCustomTab === "agents" && (
            <div className="space-y-6">
              <div className="space-y-3.5">
                <h4 className="text-[10px] font-bold tracking-wider text-zinc-450 uppercase">
                  Custom Agent Specialist Networks
                </h4>
                
                {customAgents.length === 0 ? (
                  <div className="text-center py-7 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl text-zinc-400 text-xs font-normal">
                    No custom agents declared. System will fall back to preset perspective guides.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {customAgents.map((agent) => (
                      <div key={agent.id} className="relative bg-zinc-50/50 hover:bg-zinc-50/80 p-4 rounded-xl border border-zinc-150 flex flex-col justify-between transition-colors">
                        <button
                          type="button"
                          onClick={() => handleRemoveAgent(agent.id)}
                          className="absolute top-3 right-3 text-zinc-300 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove agent from network"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6.5 h-6.5 rounded bg-zinc-900 text-white flex items-center justify-center font-bold text-[10px]">
                              {agent.avatarText || agent.name.slice(0, 2).toUpperCase()}
                            </span>
                            <div>
                              <h5 className="font-semibold text-xs text-zinc-900">{agent.name}</h5>
                              <span className="text-[9.5px] text-zinc-400 font-medium italic block leading-none">{agent.role}</span>
                            </div>
                          </div>
                          <p className="text-[11px] text-zinc-500 leading-normal line-clamp-2">{agent.description}</p>
                        </div>
                        <div className="border-t border-zinc-150 pt-2.5 mt-2.5">
                          <span className="text-[8px] uppercase tracking-wider font-bold text-zinc-400 block mb-0.5">Instruction Snippet</span>
                          <p className="text-[10px] text-zinc-400 font-mono truncate">{agent.systemInstruction}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Forge Custom Persona */}
              <form onSubmit={handleAddAgent} className="bg-zinc-50/60 p-4 rounded-xl border border-zinc-150 space-y-4 font-normal">
                <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-4 h-4 text-zinc-500" />
                  Forge Custom Specialist Persona
                </span>

                {/* Tone extraction section */}
                <div className="bg-white p-3.5 rounded-lg border border-zinc-200/80 space-y-2">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide flex items-center gap-1">
                    ✨ Deep Learning Voice Sample Extraction
                  </span>
                  <p className="text-[10.5px] text-zinc-500 leading-relaxed">
                    Paste a text paragraph written in a person's native tone to auto-generate their active prompt and voice characteristics!
                  </p>

                  {analyzerError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-100 rounded text-[10px] text-rose-600 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      <span>{analyzerError}</span>
                    </div>
                  )}

                  <textarea
                    value={sampleWriting}
                    onChange={(e) => setSampleWriting(e.target.value)}
                    placeholder="Sample text: e.g. 'Keep release log explanations hyper-minimalist and extremely typography-clean. Remove decorative emojis and marketing fluff.'"
                    rows={2}
                    className="w-full bg-zinc-50 text-xs p-2.5 border border-zinc-200 rounded focus:bg-white focus:outline-none focus:border-indigo-400 font-sans"
                  />
                  <button
                    type="button"
                    onClick={handleAnalyzeWritingSample}
                    disabled={isAnalyzingSample}
                    className="w-full py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 disabled:bg-zinc-100 text-indigo-700 font-bold text-[10.5px] rounded border border-indigo-100 transition duration-300 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isAnalyzingSample ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Deconstructuring writing voice patterns...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Analyze Prose & Fill Form</span>
                      </>
                    )}
                  </button>
                </div>

                {agentFormError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-150 rounded text-xs text-rose-600 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {agentFormError}
                  </div>
                )}

                {/* Manual entry fallback grids */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
                  <div className="sm:col-span-6 flex flex-col space-y-1">
                    <label className="text-[9.5px] font-semibold text-zinc-400">Agent Name</label>
                    <input
                      type="text"
                      value={newAgentName}
                      onChange={(e) => setNewAgentName(e.target.value)}
                      placeholder="e.g. Minimalist Chef"
                      className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-zinc-550"
                    />
                  </div>
                  <div className="sm:col-span-6 flex flex-col space-y-1">
                    <label className="text-[9.5px] font-semibold text-zinc-400">Short Role / Subtitle</label>
                    <input
                      type="text"
                      value={newAgentRole}
                      onChange={(e) => setNewAgentRole(e.target.value)}
                      placeholder="e.g. Sub-micron prose inspector"
                      className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-zinc-550"
                    />
                  </div>
                  <div className="sm:col-span-12 flex flex-col space-y-1">
                    <label className="text-[9.5px] font-semibold text-zinc-400">Direct System Guideline Directive</label>
                    <textarea
                      value={newAgentPrompt}
                      onChange={(e) => setNewAgentPrompt(e.target.value)}
                      placeholder="e.g. Summarize changes strictly focusing on the functional pixel layout metrics, avoiding marketing adjectives."
                      rows={2}
                      className="w-full bg-white border border-zinc-200 rounded-lg p-2 text-xs text-zinc-800 font-mono focus:outline-none focus:border-zinc-550"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2 bg-zinc-950 hover:bg-zinc-850 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Register Persona into Network
                </button>
              </form>
            </div>
          )}

          {/* Skills Sub Tab */}
          {activeCustomTab === "skills" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold tracking-wider text-zinc-450 uppercase">
                  Injected Cognitive Skill Snippets
                </h4>
                
                {customSkills.length === 0 ? (
                  <div className="text-center py-7 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl text-zinc-400 text-xs font-normal">
                    No active custom skills. Write standard instructions or register a logic trigger below.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customSkills.map((skill) => (
                      <div key={skill.id} className="p-4 bg-zinc-55/60 border border-zinc-150 rounded-xl flex items-start justify-between gap-3 font-normal">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleSkill(skill.id)}
                            className="pt-0.5 cursor-pointer"
                          >
                            {skill.enabled ? (
                              <ToggleRight className="w-7 h-7 text-zinc-950" />
                            ) : (
                              <ToggleLeft className="w-7 h-7 text-zinc-300" />
                            )}
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-semibold ${skill.enabled ? "text-zinc-900" : "text-zinc-400 line-through"}`}>
                                {skill.name}
                              </span>
                              <span className={`text-[8px] font-mono px-1.5 uppercase rounded ${skill.enabled ? "bg-emerald-50 text-emerald-600" : "bg-zinc-200 text-zinc-400"}`}>
                                {skill.enabled ? "Active" : "Muted"}
                              </span>
                            </div>
                            <p className="text-[10.5px] text-zinc-400 mt-0.5">{skill.description}</p>
                            {skill.enabled && (
                              <div className="mt-2 text-[9.5px] font-mono bg-zinc-100 p-2 rounded text-zinc-500 max-h-16 overflow-y-auto">
                                <span className="font-bold text-zinc-600">Snippet:</span> "{skill.systemPromptSnippet}"
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill.id)}
                          className="text-zinc-300 hover:text-red-500 p-1 rounded hover:bg-rose-50 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Skill */}
              <form onSubmit={handleAddSkill} className="bg-zinc-50/60 p-4 rounded-xl border border-zinc-150 space-y-4">
                <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-4 h-4 text-zinc-500" />
                  Deploy Logic Skill Trigger
                </span>

                {skillFormError && (
                  <div className="p-2 bg-rose-50 border border-rose-100 rounded text-xs text-rose-600">
                    {skillFormError}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 font-normal">
                  <input
                    type="text"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    placeholder="Skill title (e.g. Core timings-only)"
                    className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newSkillDesc}
                    onChange={(e) => setNewSkillDesc(e.target.value)}
                    placeholder="Explanation (e.g. Always formats performance improvements with velocity records)"
                    className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none"
                  />
                  <textarea
                    value={newSkillPrompt}
                    onChange={(e) => setNewSkillPrompt(e.target.value)}
                    placeholder="System active rule snippet (e.g. Detect any bench timings/latency modifications and present their delta metrics clearly inside a formatted table.)"
                    rows={2.5}
                    className="bg-white border border-zinc-200 rounded-lg p-2 text-xs font-mono text-zinc-800 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-zinc-950 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Register Skill Vector
                </button>
              </form>
            </div>
          )}

          {/* Context Sub Tab */}
          {activeCustomTab === "context" && (
            <div className="space-y-4 font-normal">
              <div className="flex flex-col space-y-1">
                <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Global Prompt Directives
                </h4>
                <p className="text-[11.5px] text-zinc-400">
                  These instructions are appended globally to the prompt parameters to filter language outputs.
                </p>
              </div>

              <textarea
                value={userInstructions}
                onChange={(e) => onUpdateUserInstructions(e.target.value)}
                placeholder="e.g. - Keep tone thoroughly rationalist and direct.&#10;- Bullet lists must contain complete non-trivial statements.&#10;- Never construct empty templates."
                rows={7}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs font-mono focus:bg-white focus:outline-none focus:border-zinc-900 shadow-inner"
              />
            </div>
          )}

          {/* MCP Sub Tab */}
          {activeCustomTab === "mcp" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold tracking-wider text-zinc-450 uppercase">
                  Model Context Protocol Gateway Pool
                </h4>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Allow LLM models to dynamically fetch schemas and index scopes from connected localhost instances.
                </p>

                {mcpServers.length === 0 ? (
                  <div className="text-center py-7 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl text-zinc-400 text-xs">
                    No coupled MCP server gateways matching this sandbox configuration.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {mcpServers.map((srv) => {
                      const isLiveConnect = srv.status === "connected";
                      const isHandshake = srv.status === "connecting";
                      return (
                        <div key={srv.id} className="p-3.5 bg-zinc-55/60 border border-zinc-150 rounded-xl flex items-center justify-between gap-3 font-normal">
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-1.5 font-semibold text-zinc-900">
                              <Link className="w-3.5 h-3.5 text-zinc-400" />
                              {srv.name}
                              <span className={`w-1.5 h-1.5 rounded-full ${isLiveConnect ? "bg-green-500 animate-pulse" : isHandshake ? "bg-amber-500 animate-spin" : "bg-zinc-300"}`} />
                              <span className="text-[8.5px] font-mono font-bold uppercase text-zinc-400">{srv.status}</span>
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono truncate">{srv.url}</div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              disabled={isHandshake}
                              onClick={() => handleToggleMcpConnection(srv.id, srv.status)}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer border ${
                                isLiveConnect 
                                  ? "bg-zinc-100 hover:bg-zinc-150 text-zinc-700 border-zinc-200" 
                                  : "bg-zinc-900 hover:bg-zinc-800 text-white border-transparent"
                              }`}
                            >
                              {isHandshake ? "Waiting..." : isLiveConnect ? "Disconnect" : "Test Connect"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveMcp(srv.id)}
                              className="text-zinc-300 hover:text-red-500 p-1 rounded hover:bg-rose-50 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add MCP Form */}
              <form onSubmit={handleAddMcp} className="bg-zinc-50/60 p-4 rounded-xl border border-zinc-150 space-y-3.5">
                <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-wider block">
                  Couple Model Context Protocol Gateway
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <input
                    type="text"
                    value={newMcpName}
                    onChange={(e) => setNewMcpName(e.target.value)}
                    placeholder="Server identifier name"
                    className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newMcpUrl}
                    onChange={(e) => setNewMcpUrl(e.target.value)}
                    placeholder="HTTP gateway URL (e.g. http://localhost:8080/mcp)"
                    className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-850 font-mono focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-zinc-950 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Establish Server Binding
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
