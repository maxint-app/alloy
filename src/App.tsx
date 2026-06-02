import React, { useState, useEffect } from "react";
import { ChannelType, ArchetypeId, SavedUpdate, IntegrationConfig, GeneratedUpdate, LLMProviderConfig, Archetype, CustomSkill, McpServerConfig, Project } from "./types";
import { CHANNELS, ARCHETYPES, SAMPLE_CHANGELOGS, INITIAL_INTEGRATION_CONFIG, DEFAULT_PROJECTS } from "./data";
import ArchetypeSelector from "./components/ArchetypeSelector";
import ChannelSelector from "./components/ChannelSelector";
import IntegrationPanel from "./components/IntegrationPanel";
import LLMProviderSelector from "./components/LLMProviderSelector";
import {
  Sparkles, Code, Check, Copy, Settings, ArrowRight, PenTool,
  Terminal, Layers, Sliders, RefreshCw, Layers2, BookOpen, Clock,
  Trash2, HelpCircle, AlertCircle, ExternalLink, Heart, Send, CheckCircle2,
  FolderGit2, Plus, Edit3, Save, X, Briefcase, Lock, Unlock, Github
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Exquisite styled custom renderer to make md headers & lists visually stunning
function ElegantMarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split("\n");
  return (
    <div className="space-y-2.5 font-sans text-xs text-zinc-600 leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Headers h1 or h2
        if (trimmed.startsWith("# ")) {
          return (
            <h1 key={idx} className="font-serif italic text-lg text-zinc-900 pt-3 pb-1">
              {trimmed.substring(2)}
            </h1>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={idx} className="font-semibold text-xs tracking-wider uppercase text-zinc-950 pt-3 flex items-center gap-1.5 border-b border-zinc-100 pb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
              {trimmed.substring(3)}
            </h2>
          );
        }
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={idx} className="font-semibold text-zinc-800 text-[11px] uppercase tracking-wide pt-2">
              {trimmed.substring(4)}
            </h3>
          );
        }

        // Unordered list
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const rawText = trimmed.substring(2);
          // Highlight bold text inside bullet
          const boldMatch = rawText.match(/\*\*(.*?)\*\*(.*)/);
          if (boldMatch) {
            return (
              <li key={idx} className="pl-4 list-disc marker:text-zinc-300 text-zinc-600 leading-relaxed font-normal">
                <strong className="text-zinc-900 font-semibold">{boldMatch[1]}</strong>
                {boldMatch[2]}
              </li>
            );
          }
          return (
            <li key={idx} className="pl-4 list-disc marker:text-zinc-300 text-zinc-600 leading-relaxed font-normal">
              {rawText}
            </li>
          );
        }

        // Skip empty line
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Treat as paragraph
        return (
          <p key={idx} className="text-justify indent-0 text-[11.5px] font-normal text-zinc-600 leading-relaxed">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export default function App() {
  // Application Views: "generator" or "integrations"
  const [activeTab, setActiveTab] = useState<"generator" | "integrations">("generator");

  // Generator states
  const [changelogText, setChangelogText] = useState("");
  const [changelogTitle, setChangelogTitle] = useState("");
  const [selectedArchetype, setSelectedArchetype] = useState<ArchetypeId>("poetic");
  const [selectedChannels, setSelectedChannels] = useState<ChannelType[]>(["blog", "twitter"]);

  // Custom LLM provider configuration state
  const [providerConfig, setProviderConfig] = useState<LLMProviderConfig>({
    provider: "gemini",
    apiKey: "",
    baseUrl: "",
    modelName: "gemini-3.5-flash"
  });

  const [hasServerApiKey, setHasServerApiKey] = useState<boolean>(true);

  const DEFAULT_CUSTOM_AGENTS: Archetype[] = [
    {
      id: "agent_architect",
      name: "Architect",
      role: "The Systems Design Lens",
      description: "Focuses strictly on operational telemetry, performance multipliers, cache strategies, and layout constraints.",
      avatarText: "Ar",
      quote: "Software systems are static architecture in motion. If the caches leak, the structure is compromised.",
      systemInstruction: "Formulate release summaries from the perspective of an elite software systems architect. Explicitly detail memory allocation patterns, storage layouts, database lock optimizations, and structural performance timings."
    },
    {
      id: "agent_product",
      name: "Product Lead",
      role: "The Conversational Conversion Lens",
      description: "Empathetic, commercial, and customer-centric. Highlights direct user value and engagement gains.",
      avatarText: "Pd",
      quote: "Every feature update is a conversation with the user. Let's deliver unparalleled value clearly.",
      systemInstruction: "Formulate release summaries from the perspective of a user-centric Product Manager. Emphasize user-testing validation, feature accessibility, engagement conversions, and active consumer benefits."
    }
  ];

  const DEFAULT_CUSTOM_SKILLS: CustomSkill[] = [
    {
      id: "skill_timing",
      name: "Timing Metrics Multiplier",
      description: "Guarantees all database or performance improvements are quantified with sub-millisecond latencies.",
      enabled: true,
      systemPromptSnippet: "Enforce that any performance or latency improvements state precise millisecond (ms) or microsecond (µs) savings."
    },
    {
      id: "skill_plain",
      name: "Hype Reduction filter",
      description: "Restricts all promotional adjectives or empty buzzwords like 'revolutionize'.",
      enabled: false,
      systemPromptSnippet: "Strictly omit promotional filler words, and write in humble, objective prose containing pure factual data."
    }
  ];

  const DEFAULT_MCP_SERVERS: McpServerConfig[] = [
    {
      id: "mcp_git",
      name: "git-telemetry-server",
      url: "http://localhost:8080/mcp/git",
      status: "connected",
      methods: ["read-resource", "run-tool", "query-index"]
    }
  ];

  // Agent Customization states
  const [customAgents, setCustomAgents] = useState<Archetype[]>([]);
  const [customSkills, setCustomSkills] = useState<CustomSkill[]>([]);
  const [userInstructions, setUserInstructions] = useState<string>("");
  const [mcpServers, setMcpServers] = useState<McpServerConfig[]>([]);

  const saveProviderConfig = (cfg: LLMProviderConfig) => {
    setProviderConfig(cfg);
    localStorage.setItem("alloy_provider_config", JSON.stringify(cfg));
  };

  const saveCustomAgents = (agents: Archetype[]) => {
    setCustomAgents(agents);
    localStorage.setItem("alloy_custom_agents", JSON.stringify(agents));
  };

  const saveCustomSkills = (skills: CustomSkill[]) => {
    setCustomSkills(skills);
    localStorage.setItem("alloy_custom_skills", JSON.stringify(skills));
  };

  const saveUserInstructions = (inst: string) => {
    setUserInstructions(inst);
    localStorage.setItem("alloy_user_instructions", inst);
  };

  const saveMcpServers = (servers: McpServerConfig[]) => {
    setMcpServers(servers);
    localStorage.setItem("alloy_mcp_servers", JSON.stringify(servers));
  };

  // Projects states
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // GitHub README Autocomplete states
  const [projectRepoUrl, setProjectRepoUrl] = useState("");
  const [isFetchingReadme, setIsFetchingReadme] = useState(false);
  const [readmeFetchError, setReadmeFetchError] = useState<string | null>(null);
  const [githubToken, setGithubToken] = useState("");
  const [needsGithubAuth, setNeedsGithubAuth] = useState(false);
  const [readmeSuccessMsg, setReadmeSuccessMsg] = useState<string | null>(null);
  const [tempChangelog, setTempChangelog] = useState<string>("");

  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  useEffect(() => {
    if (activeProject) {
      setEditName(activeProject.name);
      setEditDesc(activeProject.description);
    }
  }, [selectedProjectId, projects]);

  // Automation config
  const [integrationConfig, setIntegrationConfig] = useState<IntegrationConfig>(INITIAL_INTEGRATION_CONFIG);

  // Core generated outputs container
  const [generatedUpdates, setGeneratedUpdates] = useState<GeneratedUpdate[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMetadata, setGenerationMetadata] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Past generation memory history
  const [savedHistory, setSavedHistory] = useState<SavedUpdate[]>([]);

  // Simulation indicators
  const [simWebHookLoading, setSimWebHookLoading] = useState(false);
  const [simulationSuccessMsg, setSimulationSuccessMsg] = useState<string | null>(null);

  // Interactive single channel simulated publishing indicator state
  const [publishingChannel, setPublishingChannel] = useState<ChannelType | null>(null);
  const [publishedSuccessChannels, setPublishedSuccessChannels] = useState<ChannelType[]>([]);

  // Load local state configurations on mount
  useEffect(() => {
    // Load projects list
    const savedProjects = localStorage.getItem("alloy_projects_list");
    let loadedProjects: Project[] = DEFAULT_PROJECTS;
    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedProjects = parsed;
        }
      } catch (e) {
        console.error("Failed to parse projects list:", e);
      }
    }
    setProjects(loadedProjects);

    // Load selected project ID
    const savedSelectedProjId = localStorage.getItem("alloy_selected_project_id");
    let targetProjId = loadedProjects[0].id;
    if (savedSelectedProjId && loadedProjects.some(p => p.id === savedSelectedProjId)) {
      targetProjId = savedSelectedProjId;
    }
    setSelectedProjectId(targetProjId);

    // Load integration config for selected project
    const currentProj = loadedProjects.find(p => p.id === targetProjId);
    if (currentProj) {
      setIntegrationConfig(currentProj.integrationConfig);
    } else {
      const savedConfig = localStorage.getItem("changelog_generator_integrations");
      if (savedConfig) {
        try { setIntegrationConfig(JSON.parse(savedConfig)); } catch (e) { console.error(e); }
      }
    }

    const savedProvider = localStorage.getItem("alloy_provider_config");
    if (savedProvider) {
      try { setProviderConfig(JSON.parse(savedProvider)); } catch (e) { console.error(e); }
    }

    const savedHistoryStr = localStorage.getItem("changelog_generator_history");
    if (savedHistoryStr) {
      try { setSavedHistory(JSON.parse(savedHistoryStr)); } catch (e) { console.error(e); }
    } else {
      // Ingest cold empty defaults for history
      const sampleHist: SavedUpdate[] = [
        {
          id: "hist_01",
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          changelogTitle: "Aluminium UI Core (Sub-micron Highlight Patches)",
          rawChangelog: "## v1.2.0\n- Refined absolute touch points padding by 2px.\n- Eliminated persistent jitter in hover gradients.",
          archetypeId: "poetic",
          updates: [
            {
              channelId: "blog",
              content: "### The Pursuit of Absolute Uniformity\n\nWhen we considered the interaction curves of the previous build, it became extraordinarily apparent that even a microscopic shift in layout margins represents a compromise. Today, we are releasing an update that is unapologetically simple. \n\nEvery boundary grid line has been audited, resulting in absolute tactile consistency."
            },
            {
              channelId: "twitter",
              content: "[1/2] Today we are releasing a deeply deliberate layout refinement for Aluminium UI.\n\n[2/2] We stripped away the redundant telemetry to focus entirely on the raw physical transition curves. It is unapologetically beautiful. Check it out today."
            }
          ]
        }
      ];
      setSavedHistory(sampleHist);
    }

    const savedCustomAgents = localStorage.getItem("alloy_custom_agents");
    if (savedCustomAgents) {
      try { setCustomAgents(JSON.parse(savedCustomAgents)); } catch (e) { console.error(e); }
    } else {
      setCustomAgents(DEFAULT_CUSTOM_AGENTS);
    }

    const savedCustomSkills = localStorage.getItem("alloy_custom_skills");
    if (savedCustomSkills) {
      try { setCustomSkills(JSON.parse(savedCustomSkills)); } catch (e) { console.error(e); }
    } else {
      setCustomSkills(DEFAULT_CUSTOM_SKILLS);
    }

    const savedUserInstructions = localStorage.getItem("alloy_user_instructions");
    if (savedUserInstructions) {
      setUserInstructions(savedUserInstructions);
    } else {
      setUserInstructions("- Enforce 100% human prose.\n- Focus on actual developer-centric telemetry features.\n- Do not use exclamation points.");
    }

    const savedMcpServers = localStorage.getItem("alloy_mcp_servers");
    if (savedMcpServers) {
      try { setMcpServers(JSON.parse(savedMcpServers)); } catch (e) { console.error(e); }
    } else {
      setMcpServers(DEFAULT_MCP_SERVERS);
    }

    // Default load initial preset value
    setChangelogTitle(SAMPLE_CHANGELOGS[0].title);
    setChangelogText(SAMPLE_CHANGELOGS[0].content);

    // Fetch server configuration status to see if GEMINI_API_KEY is available
    fetch("/api/config-status")
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.hasGeminiKey === "boolean") {
          setHasServerApiKey(data.hasGeminiKey);
        }
      })
      .catch(err => {
        console.warn("Failed to check server config status:", err);
      });
  }, []);

  const handleSelectProject = (projId: string) => {
    setSelectedProjectId(projId);
    localStorage.setItem("alloy_selected_project_id", projId);
    const targetProj = projects.find(p => p.id === projId);
    if (targetProj) {
      setIntegrationConfig(targetProj.integrationConfig);
    }
  };

  const handleUpdateProjectDetails = (projId: string, updatedName: string, updatedDesc: string) => {
    const updated = projects.map(p => {
      if (p.id === projId) {
        return {
          ...p,
          name: updatedName || p.name,
          description: updatedDesc || p.description
        };
      }
      return p;
    });
    setProjects(updated);
    localStorage.setItem("alloy_projects_list", JSON.stringify(updated));
  };

  const handleFetchReadme = async (simulatePrivate: boolean = false) => {
    if (!projectRepoUrl.trim()) {
      setReadmeFetchError("Please enter a valid GitHub URL or owner/repo format.");
      return;
    }
    setIsFetchingReadme(true);
    setReadmeFetchError(null);
    setReadmeSuccessMsg(null);
    setNeedsGithubAuth(false);

    try {
      const res = await fetch("/api/fetch-github-readme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: projectRepoUrl,
          token: githubToken,
          simulatePrivate,
          providerConfig
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setReadmeFetchError(data.error || "Failed to process repository request.");
        return;
      }

      if (data.success) {
        setNewName(data.name);
        setNewDesc(data.description);
        if (data.changelogText) {
          setTempChangelog(data.changelogText);
          setReadmeSuccessMsg(`✨ Autocomplete active: Form pre-filled for "${data.name}" utilizing the parsed README context, and auto-cached the repository's CHANGELOG!`);
        } else {
          setTempChangelog("");
          setReadmeSuccessMsg(`✨ Autocomplete active: Form pre-filled for "${data.name}" utilizing the parsed README context!`);
        }
        setNeedsGithubAuth(false);
      } else if (data.needsAuth) {
        setNeedsGithubAuth(true);
        setReadmeFetchError(data.error || "Authentication required. Private repository access needs a Personal Access Token (PAT).");
      } else {
        setReadmeFetchError(data.error || "Could not retrieve repository information.");
      }
    } catch (err: any) {
      setReadmeFetchError(err.message || "Network error while connecting to the readme parser endpoint.");
    } finally {
      setIsFetchingReadme(false);
    }
  };

  const handleCreateNewProject = (name: string, description: string) => {
    const newProjId = `proj_${Math.random().toString(36).substr(2, 9)}`;

    // Attempt parsing of repo path from inputted URL
    let repoPath = "";
    if (projectRepoUrl.trim()) {
      const clean = projectRepoUrl.trim().replace(/\.git$/, "").replace(/\/+$/, "");
      if (clean.includes("github.com/")) {
        const parts = clean.split("github.com/")[1].split("/");
        if (parts.length >= 2) {
          repoPath = `${parts[0]}/${parts[1]}`;
        }
      } else if (clean.split("/").length === 2) {
        repoPath = clean;
      }
    }

    const newProj: Project = {
      id: newProjId,
      name: name || "Custom Project Profile",
      description: description || "Enter contextual product description/notes to guide the copy generation...",
      integrationConfig: {
        ...INITIAL_INTEGRATION_CONFIG,
        githubRepo: repoPath || INITIAL_INTEGRATION_CONFIG.githubRepo
      }
    };
    const updated = [...projects, newProj];
    setProjects(updated);
    localStorage.setItem("alloy_projects_list", JSON.stringify(updated));
    setSelectedProjectId(newProjId);
    localStorage.setItem("alloy_selected_project_id", newProjId);
    setIntegrationConfig(newProj.integrationConfig);

    // If a cached changelog is present, automatically load it into the ingestion area!
    if (tempChangelog) {
      setChangelogText(tempChangelog);
      setChangelogTitle(`${name || "Repo"} CHANGELOG`);
      setSimulationSuccessMsg(`🎉 Auto-loaded parsed changelog context directly into your Update Desk Ingestion Board!`);
    }

    // Reset autocomplete states
    setProjectRepoUrl("");
    setGithubToken("");
    setNeedsGithubAuth(false);
    setReadmeFetchError(null);
    setReadmeSuccessMsg(null);
    setTempChangelog("");
  };

  const handleDeleteProject = (projId: string) => {
    if (projects.length <= 1) {
      setErrorMessage("At least one project profile must remain active.");
      return;
    }
    const filtered = projects.filter(p => p.id !== projId);
    setProjects(filtered);
    localStorage.setItem("alloy_projects_list", JSON.stringify(filtered));

    const fallbackId = filtered[0].id;
    setSelectedProjectId(fallbackId);
    localStorage.setItem("alloy_selected_project_id", fallbackId);
    setIntegrationConfig(filtered[0].integrationConfig);
  };

  const saveConfig = (newCfg: IntegrationConfig) => {
    setIntegrationConfig(newCfg);
    const updated = projects.map(p => {
      if (p.id === selectedProjectId) {
        return { ...p, integrationConfig: newCfg };
      }
      return p;
    });
    setProjects(updated);
    localStorage.setItem("alloy_projects_list", JSON.stringify(updated));
  };

  const handleGenerate = async () => {
    if (!changelogText.trim()) {
      setErrorMessage("Please input raw changelog markdown or load a preset first.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setGeneratedUpdates([]);
    setPublishedSuccessChannels([]);

    // Fun highly theatrical design loading triggers
    let statusMessages = [
      "Distilling irrelevant system telemetry...",
      "Pursuing the singular essence of form...",
      "Anodizing typographic highlight properties...",
      "Synthesizing deliberate, unapologetic content..."
    ];
    let msgIndex = 0;

    const timer = setInterval(() => {
      msgIndex = (msgIndex + 1) % statusMessages.length;
      setGenerationMetadata({ customLoadingMsg: statusMessages[msgIndex] });
    }, 1500);

    try {
      const currentProj = projects.find(p => p.id === selectedProjectId);
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changelogText,
          archetypeId: selectedArchetype,
          selectedChannels,
          providerConfig,
          customAgents,
          customSkills,
          userInstructions,
          mcpServers,
          projectName: currentProj ? currentProj.name : "",
          projectDescription: currentProj ? currentProj.description : ""
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to communicate with AI generation endpoint");
      }

      setGeneratedUpdates(data.updates);
      setGenerationMetadata(data.metadata);

      // Save this generation to local history
      const newSavedItem: SavedUpdate = {
        id: `gen_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        changelogTitle: changelogTitle || "Untitled Changelog Update",
        rawChangelog: changelogText,
        archetypeId: selectedArchetype,
        updates: data.updates
      };

      const updatedHistory = [newSavedItem, ...savedHistory];
      setSavedHistory(updatedHistory);
      localStorage.setItem("changelog_generator_history", JSON.stringify(updatedHistory));

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An error occurred during distillation.");
    } finally {
      clearInterval(timer);
      setIsGenerating(false);
    }
  };

  // Simulates a GitHub push webhook call
  const handleSimulateWebhookCall = async (commitMsg: string) => {
    setSimWebHookLoading(true);
    setSimulationSuccessMsg(null);
    try {
      const response = await fetch("/api/webhook/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo: integrationConfig.githubRepo,
          commitMessage: commitMsg,
          author: "github-pioneer"
        })
      });
      const data = await response.json();

      // Auto-trigger a simulated generation based on the received webhook push message!
      if (data.status === "success" && data.event) {
        // Trigger simulated process completed notification
        setSimulationSuccessMsg(`GitHub Autopilot Webhook received event '${data.event.id}'! Auto-distilling raw changelog using the ${ARCHETYPES.find(a => a.id === selectedArchetype)?.name || "Poetic"} perspective.`);

        // Feed the commit message directly as changelog and auto-run generation!
        setChangelogTitle(`GitHub Commit: ${commitMsg.split(":")[0] || "Autopilot Link"}`);
        setChangelogText(`### Commit Message Delivery\n\n- ${data.event.commitMessage}\n- Triggered via secure GitHub Webhook secret token.`);

        // Auto trigger generation to bring the UI to life!
        setIsGenerating(true);
        const currentProj = projects.find(p => p.id === selectedProjectId);
        const genRes = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            changelogText: `### Commit Message Delivery\n\n- ${data.event.commitMessage}\n- Webhook simulation completed.`,
            archetypeId: selectedArchetype,
            selectedChannels,
            providerConfig,
            customAgents,
            customSkills,
            userInstructions,
            mcpServers,
            projectName: currentProj ? currentProj.name : "",
            projectDescription: currentProj ? currentProj.description : ""
          })
        });
        const genData = await genRes.json();
        if (genRes.ok) {
          setGeneratedUpdates(genData.updates);
          setGenerationMetadata(genData.metadata);

          // Add this also to historical state
          const newSaved: SavedUpdate = {
            id: `gen_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            changelogTitle: `Commit Hook: "${data.event.commitMessage.substring(0, 30)}..."`,
            rawChangelog: `Push: ${data.event.commitMessage}`,
            archetypeId: selectedArchetype,
            updates: genData.updates
          };
          const hist = [newSaved, ...savedHistory];
          setSavedHistory(hist);
          localStorage.setItem("changelog_generator_history", JSON.stringify(hist));
        }
      }
    } catch (e) {
      console.error(e);
      setErrorMessage("Failed to simulate incoming github triggers.");
    } finally {
      setSimWebHookLoading(false);
    }
  };

  // Triggers publishing with elegant automation flows to Zapier & n8n if set up
  const handlePublishToPlatform = async (chId: ChannelType) => {
    setPublishingChannel(chId);

    // Pull current generated content for this specific channel
    const activeUpdate = generatedUpdates.find(u => u.channelId === chId);
    const content = activeUpdate ? activeUpdate.content : "";

    // Zapier & n8n Webhook delivery triggers for blog releases
    if (chId === "blog") {
      if (integrationConfig.zapierEnabled && integrationConfig.zapierWebhookUrl) {
        try {
          await fetch(integrationConfig.zapierWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              app: "Alloy",
              event: "publish_changelog",
              channel: "blog",
              title: changelogTitle || "Alloy Product Release Update",
              content: content,
              timestamp: new Date().toISOString()
            }),
            mode: "no-cors"
          });
        } catch (e) {
          console.warn("Zapier automation webhook error (benign if CORS restricted):", e);
        }
      }

      if (integrationConfig.n8nEnabled && integrationConfig.n8nWebhookUrl) {
        try {
          await fetch(integrationConfig.n8nWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              app: "Alloy",
              event: "publish_changelog",
              channel: "blog",
              title: changelogTitle || "Alloy Product Release Update",
              content: content,
              timestamp: new Date().toISOString()
            }),
            mode: "no-cors"
          });
        } catch (e) {
          console.warn("n8n automation webhook error (benign if CORS restricted):", e);
        }
      }
    }

    if (chId === "discord") {
      if (integrationConfig.discordEnabled && integrationConfig.discordWebhookUrl) {
        try {
          await fetch(integrationConfig.discordWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: "Alloy Publisher",
              content: content.substring(0, 2000)
            }),
            mode: "no-cors"
          });
        } catch (e) {
          console.warn("Discord webhook delivery failed:", e);
        }
      }
    }

    if (chId === "hacker_news") {
      if (integrationConfig.hnEnabled && integrationConfig.hnUsername) {
        console.log(`Sending story submission trigger to HN for user ${integrationConfig.hnUsername}...`);
      }
    }

    setTimeout(() => {
      setPublishedSuccessChannels(prev => [...prev, chId]);
      setPublishingChannel(null);
    }, 1800);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedHistory.filter(h => h.id !== id);
    setSavedHistory(updated);
    localStorage.setItem("changelog_generator_history", JSON.stringify(updated));
  };

  const loadFromHistory = (item: SavedUpdate) => {
    setChangelogTitle(item.changelogTitle);
    setChangelogText(item.rawChangelog);
    setSelectedArchetype(item.archetypeId);
    setGeneratedUpdates(item.updates);
    setGenerationMetadata({
      personaUsed: item.archetypeId,
      wordCount: item.updates.reduce((ac, c) => ac + (c.content.split(/\s+/).length || 0), 0)
    });
  };

  return (
    <div className="min-h-screen bg-[#fafafa] selection:bg-zinc-900 selection:text-white pb-24">

      {/* Exquisite Minimalist Header bar */}
      <header className="border-b border-zinc-150 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4.5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 select-none">
              <svg viewBox="0 0 100 100" className="w-10 h-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                <defs>
                  <linearGradient id="alloyGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#09090b" />
                    <stop offset="100%" stopColor="#52525b" />
                  </linearGradient>
                  <linearGradient id="alloyGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#27272a" />
                    <stop offset="100%" stopColor="#a1a1aa" />
                  </linearGradient>
                </defs>
                {/* Elegant interlocking curves represent fusing separate elements */}
                <path
                  d="M 32,50 C 32,32 48,22 64,32 C 80,42 85,58 69,68 C 53,78 37,68 32,50 Z"
                  fill="url(#alloyGrad1)"
                />
                <path
                  d="M 68,50 C 68,68 52,78 36,68 C 20,58 15,42 31,32 C 47,22 63,32 68,50 Z"
                  fill="url(#alloyGrad2)"
                  opacity="0.85"
                  style={{ mixBlendMode: 'multiply' }}
                />
                {/* Crisp core prism fusions */}
                <polygon points="50,42 58,50 50,58 42,50" fill="#ffffff" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-sans font-semibold text-sm tracking-tight text-zinc-900">
                  Alloy
                </h1>
                <span className="text-[9px] font-mono font-medium border border-zinc-200 text-zinc-400 rounded px-1.5 bg-zinc-50 align-baseline">
                  STUDIO
                </span>
              </div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400">
                An extraordinarily deliberate publisher
              </p>
            </div>
          </div>

          {/* Tab Selection Controllers */}
          <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200/40">
            <button
              onClick={() => setActiveTab("generator")}
              className={`flex items-center gap-1.5 px-4.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 ${activeTab === "generator"
                ? "bg-white text-zinc-950 shadow-[0_3px_10px_rgba(0,0,0,0.03)]"
                : "text-zinc-500 hover:text-zinc-900"
                }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              Update Desk
            </button>
            <button
              onClick={() => setActiveTab("integrations")}
              className={`flex items-center gap-1.5 px-4.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 ${activeTab === "integrations"
                ? "bg-white text-zinc-950 shadow-[0_3px_10px_rgba(0,0,0,0.03)]"
                : "text-zinc-500 hover:text-zinc-900"
                }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Autopilot Sandbox
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Studio Layout */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-8 md:pt-12">

        {/* Absolute API Key warning guard just in case */}
        {!hasServerApiKey && (
          <div className="mb-8 p-4 bg-amber-50/60 border border-amber-200/60 rounded-xl text-xs text-amber-800 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block">Missing server Gemini configuration</span>
              <p className="text-amber-700/90 leading-relaxed">
                We'll attempt to process updates using your workspace credentials, but if you experience any connection faults, satisfy this check by adding the <code className="bg-amber-100/60 px-1 rounded font-mono text-[10.5px]">GEMINI_API_KEY</code> variable in your <strong>Settings &gt; Secrets</strong> board within Alloy Studio.
              </p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* VIEW 1: GENERATION DESK WORKSPACE */}
          {activeTab === "generator" && (
            <motion.div
              key="generator-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-10"
            >

              {/* Dynamic Project Context Hub */}
              <div className="bg-white p-5 md:p-6 rounded-2xl border border-zinc-150 shadow-[0_4px_25px_rgb(0,0,0,0.01)] space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-zinc-100">
                  <div className="flex items-center space-x-2.5">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 text-white font-semibold">
                      <Briefcase className="w-4 h-4 text-zinc-300" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-xs tracking-tight text-zinc-900">Active Project Profile Node</h3>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold mt-0.5">Prompt & Automation Scope</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Project Selector Dropdown */}
                    <select
                      id="alloy-project-selector"
                      value={selectedProjectId}
                      onChange={(e) => handleSelectProject(e.target.value)}
                      className="bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-lg py-1.5 px-3 text-xs font-semibold text-zinc-800 focus:bg-white focus:outline-none focus:border-zinc-900 cursor-pointer transition-all"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          📁 {p.name}
                        </option>
                      ))}
                    </select>

                    {/* Edit Project Button */}
                    <button
                      id="alloy-edit-project-btn"
                      onClick={() => setIsEditingProject(!isEditingProject)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${isEditingProject
                        ? "bg-zinc-100 border-zinc-350 text-zinc-700"
                        : "bg-white border-zinc-200 hover:border-zinc-450 text-zinc-600"
                        }`}
                    >
                      <Edit3 className="w-3 h-3" />
                      Edit Context
                    </button>

                    {/* Create New Project Button */}
                    <button
                      id="alloy-create-project-btn"
                      onClick={() => {
                        setIsCreatingProject(true);
                        setNewName("");
                        setNewDesc("");
                      }}
                      className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-850 text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3 h-3 text-zinc-300" />
                      Add Project
                    </button>
                  </div>
                </div>

                {/* Display Active Project Overview */}
                {activeProject && !isEditingProject && !isCreatingProject && (
                  <div className="text-xs bg-zinc-50 rounded-xl p-4.5 border border-zinc-200/40 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1.5 max-w-3xl">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900 text-[12px]">{activeProject.name}</span>
                        <span className="text-[9.5px] font-mono bg-zinc-200/65 text-zinc-500 rounded px-1.5 py-0.5">
                          ID: {activeProject.id}
                        </span>
                        {/* Preset indicator */}
                        {activeProject.id.startsWith("proj_") && (
                          <span className="text-[9.5px] font-sans text-zinc-400 font-medium italic">
                            (System Native)
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-500 leading-relaxed text-[11px] font-sans italic">
                        "{activeProject.description}"
                      </p>

                      {/* Interactive Button to Load Associated Preset sample */}
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            // Find matching preset by title keywords
                            const titleKeywords = activeProject.name.toLowerCase();
                            const matchedPreset = SAMPLE_CHANGELOGS.find(s => s.title.toLowerCase().includes("aluminium") && titleKeywords.includes("aluminium")) ||
                              SAMPLE_CHANGELOGS.find(s => s.title.toLowerCase().includes("scribble") && titleKeywords.includes("scribble")) ||
                              SAMPLE_CHANGELOGS.find(s => s.title.toLowerCase().includes("omnidb") && titleKeywords.includes("omnidb")) ||
                              SAMPLE_CHANGELOGS[0];
                            setChangelogTitle(matchedPreset.title);
                            setChangelogText(matchedPreset.content);
                            setSimulationSuccessMsg(`Loaded associated preset template for ${activeProject.name}!`);
                          }}
                          className="text-[10px] text-zinc-500 hover:text-zinc-900 underline font-semibold cursor-pointer transition-all flex items-center gap-1"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                          Load associated preset changelog template
                        </button>
                      </div>
                    </div>

                    <div className="text-[10.5px] text-zinc-400 space-y-1 font-sans border-l border-zinc-200 pl-4 shrink-0 md:w-56 leading-relaxed">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Project Sandbox status:</span>
                      <div>GitHub: <code className="text-zinc-600 font-mono text-[9px]">{activeProject.integrationConfig.githubRepo || "none"}</code></div>
                      <div>Discord updates: <span className={activeProject.integrationConfig.discordEnabled ? "text-green-600 font-semibold" : "text-zinc-400"}>{activeProject.integrationConfig.discordEnabled ? "Active" : "Muted"}</span></div>
                      <div>HN pipeline: <span className={activeProject.integrationConfig.hnEnabled ? "text-green-600 font-semibold" : "text-zinc-400"}>{activeProject.integrationConfig.hnEnabled ? "Simulated" : "Muted"}</span></div>
                    </div>
                  </div>
                )}

                {/* EDITING EXHAUSTIVE BOARD */}
                {isEditingProject && activeProject && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-5 bg-zinc-50 rounded-xl border border-zinc-200 border-dashed space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                        <Edit3 className="w-4 h-4 text-zinc-500" />
                        Edit Context Constraints for {activeProject.name}
                      </span>
                      <button
                        onClick={() => handleDeleteProject(activeProject.id)}
                        className="text-[10.5px] text-red-500 hover:text-red-700 hover:bg-red-50 px-2   py-1 rounded font-semibold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Profile
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                      <div className="md:col-span-1 space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Project Title/Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="e.g. Aluminum UI"
                          className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-800 font-semibold focus:outline-none focus:border-zinc-950"
                        />
                      </div>
                      <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Project Context & Brand Theme (Sent to AI Prompt)</label>
                        <textarea
                          rows={2}
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="This project is a high-density, performance-milled widget system utilizing Sub-micron margins and eye-pleasing Slate themes."
                          className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-700 leading-relaxed font-sans focus:outline-none focus:border-zinc-900"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200/50">
                      <button
                        onClick={() => setIsEditingProject(false)}
                        className="px-3.5 py-1.5 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-500 hover:bg-zinc-100 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateProjectDetails(activeProject.id, editName, editDesc);
                          setIsEditingProject(false);
                        }}
                        className="px-4 py-1.5 bg-zinc-950 text-white hover:bg-zinc-900 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save Context Changes
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* CREATING EXHAUSTIVE BOARD */}
                {isCreatingProject && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-5 md:p-6 bg-zinc-50 rounded-2xl border border-zinc-200 border-dashed space-y-5"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-200/60 pb-3">
                      <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5 uppercase tracking-wider">
                        <Plus className="w-4 h-4 text-zinc-600" />
                        Provision New Project Profile
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">Profile Auto-Curator Active</span>
                    </div>

                    {/* Step 1: GitHub Link and Fetch */}
                    <div className="bg-white p-4 rounded-xl border border-zinc-200/80 space-y-3.5 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-md bg-zinc-100 text-zinc-800">
                          <Github className="w-3.5 h-3.5" />
                        </span>
                        <div>
                          <h4 className="text-xs font-semibold text-zinc-800 font-sans">1. GitHub Repository Detail (Optional)</h4>
                          <p className="text-[10px] text-zinc-400 font-sans">Specify repository to parse its README.md, utilize Gemini to pre-fill, and auto-anchor sandbox links.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-8 space-y-1">
                          <label className="text-[9px] font-bold text-zinc-450 uppercase tracking-widest block font-mono">Repository URL</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={projectRepoUrl}
                              onChange={(e) => setProjectRepoUrl(e.target.value)}
                              placeholder="e.g. https://github.com/alloy-os/aluminium-core"
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-800 placeholder-zinc-400 font-medium focus:outline-none focus:border-zinc-950 focus:bg-white font-sans"
                            />
                            <FolderGit2 className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                          </div>
                        </div>

                        <div className="sm:col-span-4 flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleFetchReadme(false)}
                            disabled={isFetchingReadme || !projectRepoUrl.trim()}
                            className="flex-1 px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-[10.5px] font-bold hover:bg-zinc-800 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            {isFetchingReadme ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                            )}
                            Fetch README
                          </button>
                        </div>
                      </div>

                      {/* Needs authentication block */}
                      {needsGithubAuth && (
                        <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-3.5 space-y-3">
                          <div className="flex items-start gap-2 text-amber-800">
                            <Lock className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
                            <div className="space-y-0.5">
                              <h5 className="text-[10.5px] font-bold uppercase tracking-wider font-sans">🔑 Credentials Required for Private Repository</h5>
                              <p className="text-[10px] text-amber-700 leading-relaxed font-sans">
                                That repository is either private or requires credential handshakes. Provide a Personal Access Token with <code className="bg-amber-100/80 font-mono px-1 rounded text-[9.5px]">repo</code> scope, or simulate secure OAuth sandbox login below.
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
                            <div className="sm:col-span-3 space-y-1">
                              <label className="text-[9px] font-bold text-amber-700 uppercase tracking-widest block font-mono">Personal Access Token (PAT) / Token</label>
                              <input
                                type="password"
                                value={githubToken}
                                onChange={(e) => setGithubToken(e.target.value)}
                                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-amber-400 font-mono"
                              />
                            </div>
                            <div className="sm:col-span-1">
                              <button
                                type="button"
                                onClick={() => handleFetchReadme(false)}
                                disabled={isFetchingReadme || !githubToken}
                                className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10.5px] transition-all cursor-pointer"
                              >
                                {isFetchingReadme ? "Connecting..." : "Auth & Connect"}
                              </button>
                            </div>
                          </div>

                          <div className="border-t border-amber-100 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-[10px] text-amber-600 font-medium font-sans">No real credentials? Complete test trial:</span>
                            <button
                              type="button"
                              onClick={() => handleFetchReadme(true)}
                              className="text-[10px] bg-white border border-amber-200 hover:bg-amber-100 text-amber-800 font-semibold px-2.5 py-1 rounded transition-all cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Unlock className="w-3 h-3 text-amber-600" />
                              Simulate Private Auth Validation
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Error State */}
                      {readmeFetchError && !needsGithubAuth && (
                        <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-[10.5px] font-medium flex items-start gap-2 leading-relaxed">
                          <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                          <div className="space-y-1">
                            <p className="font-sans">{readmeFetchError}</p>
                            <p className="text-[9.5px] text-red-500 font-sans">
                              For quick testing without actual keys, click below to try a simulated private or public fallback.
                            </p>
                            <button
                              type="button"
                              onClick={() => handleFetchReadme(true)}
                              className="text-[9.5px] bg-white border border-red-200 hover:bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded transition-all mt-1 cursor-pointer flex items-center gap-1"
                            >
                              <Unlock className="w-2.5 h-2.5 text-red-600" />
                              Authorize Simulated Private Tunnel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Success State */}
                      {readmeSuccessMsg && (
                        <div className="p-3 bg-green-50/80 border border-green-200 text-green-700 rounded-lg text-[10.5px] font-medium flex items-center gap-2 font-sans">
                          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                          <span>{readmeSuccessMsg}</span>
                        </div>
                      )}
                    </div>

                    {/* Step 2: Form Pre-filled */}
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-1.5 px-1 border-l-2 border-zinc-300 pl-2">
                        <span className="text-[10.5px] font-bold text-zinc-500 uppercase tracking-widest font-mono">2. Fine-tune Profile Metadata</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start font-sans">
                        <div className="md:col-span-1 space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">Project Title / Name</label>
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g. Orbit Wallet"
                            className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-800 font-semibold focus:outline-none focus:border-zinc-950 font-sans"
                          />
                        </div>
                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">System Archetype & Context (AI Guidance)</label>
                          <textarea
                            rows={3}
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                            placeholder="Describe the project purpose and design rules. Fetching a README automatically populates these constraints via Gemini."
                            className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-700 leading-relaxed font-sans focus:outline-none focus:border-zinc-900"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200/50">
                      <button
                        onClick={() => {
                          setIsCreatingProject(false);
                          setProjectRepoUrl("");
                          setGithubToken("");
                          setNeedsGithubAuth(false);
                          setReadmeFetchError(null);
                          setReadmeSuccessMsg(null);
                        }}
                        className="px-3.5 py-1.5 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-500 hover:bg-zinc-100 transition-all cursor-pointer font-sans"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (!newName.trim()) {
                            setErrorMessage("Please specify a valid Project Title.");
                            return;
                          }
                          handleCreateNewProject(newName, newDesc);
                          setIsCreatingProject(false);
                        }}
                        className="px-4 py-1.5 bg-zinc-950 text-white hover:bg-zinc-900 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 shadow-sm font-sans"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Create Project Profile
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Hint/Footer */}
                <div className="text-[10px] text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-1 border-t border-zinc-100 pt-2.5">
                  <span className="flex items-center gap-1 font-sans text-left">
                    <HelpCircle className="w-3.5 h-3.5 text-zinc-300" />
                    Project credentials, repositories, and webhook settings are project-isolated.
                    Manage settings for individual projects in the Autopilot Sandbox tab.
                  </span>
                  <button
                    onClick={() => {
                      if (window.confirm("Restore native template project lists? This will clear all custom created projects.")) {
                        localStorage.removeItem("alloy_projects_list");
                        localStorage.removeItem("alloy_selected_project_id");
                        const loaded = DEFAULT_PROJECTS;
                        setProjects(loaded);
                        setSelectedProjectId(loaded[0].id);
                        setIntegrationConfig(loaded[0].integrationConfig);
                      }
                    }}
                    className="text-[9px] text-zinc-400 hover:text-zinc-600 underline font-semibold cursor-pointer shrink-0"
                  >
                    Reset native projects
                  </button>
                </div>
              </div>

              {/* Main Split Layout: Ingestion Board and Style selection */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left side: Changelog Raw Input & Preset Library */}
                <div className="lg:col-span-7 bg-white p-6.5 md:p-8 rounded-2xl border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-6">

                  <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-zinc-100 gap-3">
                    <div className="flex items-center space-x-2.5">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-50 text-zinc-900 border border-zinc-200">
                        <Code className="w-4 h-4" />
                      </span>
                      <div>
                        <h2 className="font-semibold text-xs tracking-tight text-zinc-900">Changelog Ingestion Workspace</h2>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold mt-0.5">Raw Material Input</p>
                      </div>
                    </div>

                    {/* Presets populator toolbar */}
                    <div className="flex items-center gap-1.5 self-start">
                      <span className="text-[10px] font-sans text-zinc-400 font-medium">Examples:</span>
                      {SAMPLE_CHANGELOGS.map((sample, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setChangelogTitle(sample.title);
                            setChangelogText(sample.content);
                          }}
                          className="px-2 py-1 text-[10.5px] border border-zinc-2.0 hover:border-zinc-500 rounded bg-zinc-50 font-medium cursor-pointer transition-colors"
                        >
                          Preset {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">Version Identifier / Title</label>
                      <input
                        type="text"
                        value={changelogTitle}
                        onChange={(e) => setChangelogTitle(e.target.value)}
                        placeholder="e.g. Aluminium OS v2.0 Ingest Plan"
                        className="w-full bg-zinc-50 border border-zinc-150 rounded-xl px-4 py-2.5 text-xs text-zinc-800 font-medium focus:bg-white focus:border-zinc-950 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">Raw Changelog Content (Markdown)</label>
                        <span className="text-[10.5px] text-zinc-400 font-mono">Lines: {changelogText.split("\n").filter(Boolean).length}</span>
                      </div>
                      <textarea
                        value={changelogText}
                        onChange={(e) => setChangelogText(e.target.value)}
                        placeholder="Paste your raw # CHANGELOG.md items, or write release logs, git commit outputs, or standard changelogs directly here..."
                        rows={10}
                        className="w-full bg-zinc-50 text-zinc-700 border border-zinc-150 rounded-xl p-4.5 text-xs font-mono leading-relaxed focus:bg-white focus:border-zinc-950 focus:outline-none focus:shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                    <span className="text-[10.5px] text-zinc-400 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      Accepts both markdown logs and loose commit messages.
                    </span>
                    <button
                      onClick={() => {
                        setChangelogTitle("");
                        setChangelogText("");
                        setGeneratedUpdates([]);
                      }}
                      className="text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors font-medium cursor-pointer"
                    >
                      Clear workspace canvas
                    </button>
                  </div>

                </div>

                {/* Right side: Past History logs feed */}
                <div className="lg:col-span-5 bg-white p-6.5 rounded-2xl border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Changelog History Vault
                  </span>

                  <div className="space-y-3 max-h-[410px] overflow-y-auto pr-1">
                    {savedHistory.length === 0 ? (
                      <div className="text-center py-10 text-zinc-400 text-xs font-sans">
                        Historically, no saved logs were found in your localized workspace database drawer.
                      </div>
                    ) : (
                      savedHistory.map((hist) => {
                        const styleLabel = ARCHETYPES.find(a => a.id === hist.archetypeId)?.name || "Original";
                        return (
                          <div
                            key={hist.id}
                            onClick={() => loadFromHistory(hist)}
                            className="p-3.5 rounded-xl border border-zinc-100 hover:border-zinc-350 bg-zinc-50/50 hover:bg-white transition-all duration-300 cursor-pointer group flex justify-between items-start gap-4"
                          >
                            <div className="space-y-1 min-w-0">
                              <h4 className="font-semibold text-xs text-zinc-900 group-hover:text-zinc-950 truncate">
                                {hist.changelogTitle}
                              </h4>
                              <div className="flex items-center space-x-2 text-[9.5px] text-zinc-400">
                                <span className="font-medium bg-zinc-200/50 px-1.5 py-0.5 rounded text-zinc-500 uppercase font-mono">
                                  {styleLabel}
                                </span>
                                <span>&bull;</span>
                                <span>{new Date(hist.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleDeleteHistory(hist.id, e)}
                              className="text-zinc-350 hover:text-red-500 p-1.5 transition-colors cursor-pointer rounded-lg hover:bg-zinc-50"
                              title="Delete from history"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

              {/* Archetype selector and Target channels row */}
              <div className="bg-white p-6.5 md:p-8 rounded-2xl border border-zinc-100 space-y-8">

                {/* 1. Persona Selecting */}
                <ArchetypeSelector selectedId={selectedArchetype} onChange={setSelectedArchetype} customAgents={customAgents} />

                {/* Divider */}
                <div className="border-t border-zinc-100" />

                {/* 3. Destination selectors wrapper */}
                <ChannelSelector selectedChannels={selectedChannels} onChange={setSelectedChannels} />

                {/* Centered Generate Button Trigger */}
                <div className="pt-4 flex flex-col items-center justify-center space-y-3">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className={`px-8 py-3.5 rounded-xl text-xs font-semibold tracking-wide flex items-center gap-2 cursor-pointer transition-all duration-300 active:scale-[0.985] shadow-[0_10px_35px_rgba(0,0,0,0.06)] ${isGenerating
                      ? "bg-zinc-800 text-zinc-400"
                      : "bg-zinc-950 text-white hover:bg-zinc-900 hover:shadow-[0_12px_45px_rgba(0,0,0,0.12)] border border-transparent"
                      }`}
                  >
                    {isGenerating ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-zinc-400" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-zinc-300" />
                    )}
                    {isGenerating ? "Refining Content..." : "Synthesize Tailored Updates"}
                  </button>

                  <p className="text-[10.5px] font-sans text-zinc-400">
                    {providerConfig.provider === "gemini" && !providerConfig.apiKey ? (
                      "Propelled via native cloud-hosted Gemini services."
                    ) : (
                      `Propelled via customized ${providerConfig.provider === "local" ? "Local LLM" : providerConfig.provider.toUpperCase()} engine.`
                    )}
                  </p>
                </div>

              </div>

              {/* Dynamic simulation success messages (e.g. from Github autopilots) */}
              {simulationSuccessMsg && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-zinc-900 border border-zinc-950 p-4.5 rounded-xl text-zinc-200 text-xs flex items-center justify-between gap-4 shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-400">
                      <Code className="w-3.5 h-3.5" />
                    </span>
                    <p className="leading-relaxed">
                      {simulationSuccessMsg}
                    </p>
                  </div>
                  <button
                    onClick={() => setSimulationSuccessMsg(null)}
                    className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 hover:text-white"
                  >
                    Dimiss
                  </button>
                </motion.div>
              )}

              {/* Generation output section */}
              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="p-4 bg-red-50 text-red-700 text-xs rounded-xl flex items-start gap-3 border border-red-100"
                  >
                    <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-semibold block">Generation Fault Detected</span>
                      <p className="text-red-600 leading-relaxed">{errorMessage}</p>
                    </div>
                  </motion.div>
                )}

                {/* Loading animation screen simulating physical mill */}
                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl border border-zinc-100 p-12 text-center flex flex-col items-center justify-center space-y-4"
                  >
                    <RefreshCw className="w-9 h-9 text-zinc-900 animate-spin" />
                    <h3 className="font-serif italic text-base text-zinc-900 mt-2">
                      "{generationMetadata?.customLoadingMsg || "Pursuing absolute simplification..."}"
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-sans tracking-wide max-w-sm">
                      Milling prose highlights down to microscopic proportions. Removing superfluous adverbs and highlighting pure system achievements.
                    </p>
                  </motion.div>
                )}

                {/* Real-time generated highlights displaying side-by-side inside Jony Ivy styled desk cards */}
                {generatedUpdates.length > 0 && !isGenerating && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6"
                  >
                    {/* Header readout analytics banner */}
                    <div className="flex items-center justify-between px-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5" />
                        Aesthetic Output Dashboard
                      </span>
                      {generationMetadata && (
                        <div className="flex items-center gap-4 text-[10px] font-sans text-zinc-400">
                          <span className="font-medium">
                            Archetype: <strong className="text-zinc-800 uppercase font-mono">{generationMetadata.personaUsed || selectedArchetype}</strong>
                          </span>
                          <span>&bull;</span>
                          <span>
                            Prose density: <strong className="text-zinc-800 font-mono">{generationMetadata.wordCount} words</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Output Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {generatedUpdates.map((update) => {
                        const channelDef = CHANNELS.find((c) => c.id === update.channelId);
                        const isPublished = publishedSuccessChannels.includes(update.channelId);
                        const isCurrentlyPublishing = publishingChannel === update.channelId;

                        return (
                          <motion.div
                            key={update.channelId}
                            layout
                            className="bg-white rounded-xl border border-zinc-150 p-6 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-shadow duration-300"
                          >
                            <div className="space-y-4.5">
                              {/* Header toolbar */}
                              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                                <span className="font-semibold text-xs text-zinc-900 tracking-tight flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-zinc-900" />
                                  {channelDef?.name || update.channelId}
                                </span>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleCopyText(update.content)}
                                    className="p-1 px-2.5 bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 text-[10.5px] font-medium text-zinc-600 hover:text-zinc-900 rounded font-sans transition-colors cursor-pointer flex items-center gap-1"
                                    title="Copy copy text to clipboard drawer"
                                  >
                                    <Copy className="w-3 h-3 text-zinc-400" />
                                    Copy
                                  </button>
                                </div>
                              </div>

                              {/* Formatted Text Box */}
                              <div className="bg-zinc-50/50 rounded-lg p-4 max-h-[320px] overflow-y-auto border border-zinc-100 select-text">
                                <ElegantMarkdownRenderer content={update.content} />
                              </div>
                            </div>

                            {/* Automation Actions */}
                            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                              <span className="text-[10px] text-zinc-400 font-medium">
                                status: {isPublished ? "Posted to Live Grid" : "Draft Generated"}
                              </span>

                              <button
                                onClick={() => handlePublishToPlatform(update.channelId)}
                                disabled={isPublished || isCurrentlyPublishing}
                                className={`px-4 py-1.5 rounded-lg text-[10.5px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all duration-300 ${isPublished
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : isCurrentlyPublishing
                                    ? "bg-zinc-100 text-zinc-400 border border-zinc-200"
                                    : "bg-zinc-900 text-white hover:bg-zinc-800"
                                  }`}
                              >
                                {isCurrentlyPublishing && (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                )}
                                {isPublished && <Check className="w-3 h-3 stroke-[2.5]" />}
                                {isCurrentlyPublishing
                                  ? "Contacting Host API..."
                                  : isPublished
                                    ? "Update Published"
                                    : `Simulate Posting`}
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}

          {/* VIEW 2: AUTOPILOT WEBHOOK CONNECTIVITY INTEGRATIONS */}
          {activeTab === "integrations" && (
            <motion.div
              key="integrations-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <IntegrationPanel
                config={integrationConfig}
                onUpdateConfig={saveConfig}
                onSimulateWebhook={handleSimulateWebhookCall}
                loadingSimDetail={simWebHookLoading}
                providerConfig={providerConfig}
                onUpdateProviderConfig={saveProviderConfig}
                customAgents={customAgents}
                onUpdateCustomAgents={saveCustomAgents}
                customSkills={customSkills}
                onUpdateCustomSkills={saveCustomSkills}
                userInstructions={userInstructions}
                onUpdateUserInstructions={saveUserInstructions}
                mcpServers={mcpServers}
                onUpdateMcpServers={saveMcpServers}
                projectName={activeProject ? activeProject.name : ""}
              />
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* Exquisite footer watermark representing human designers collaboration */}
      <footer className="mt-24 border-t border-zinc-150 py-12 text-center space-y-3">
        <p className="text-[11px] text-zinc-400 tracking-wider font-light flex items-center justify-center gap-1.5">
          UNAPOLOGETICALLY CRAFTED IN SOLID ALUMINIUM WORKSPACES
        </p>
        <div className="flex items-center justify-center space-x-1.5 text-[10px] text-zinc-400">
          <span>All capabilities engineered using TypeScript</span>
          <span>&bull;</span>
          <span className="flex items-center gap-0.5 text-zinc-500 font-medium">
            Alloy Studio Build &copy; 2026
          </span>
        </div>
      </footer>

    </div>
  );
}
