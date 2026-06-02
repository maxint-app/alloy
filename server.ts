import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// In-memory backlog of simulated/real GitHub Webhook deliveries
interface WebhookEvent {
  id: string;
  timestamp: string;
  repo: string;
  commitMessage: string;
  author: string;
  changelogGenerated: boolean;
}

const webhookHistory: WebhookEvent[] = [
  {
    id: "wh_01",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    repo: "alloy-group/core-elements",
    commitMessage: "feat: Refine the subtle button highlight margins and transition easing curves to be extraordinarily deliberate",
    author: "craft_pioneer",
    changelogGenerated: true,
  },
  {
    id: "wh_02",
    timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(),
    repo: "origin/rhythm-player",
    commitMessage: "fix: Solve the volume control crackle. It's now completely pure, absolutely magical, and quiet as a whisper.",
    author: "delight_pioneer",
    changelogGenerated: true,
  }
];

// Lazy-initialized Gemini API client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please manage it via settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST APIs

// Helper to gracefully extract JSON blocks from model outputs
function tryParseJson(text: string): any {
  try {
    const cleanText = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    return JSON.parse(cleanText);
  } catch (err) {
    const startIdx = text.indexOf("{");
    const endIdx = text.lastIndexOf("}");
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      try {
        return JSON.parse(text.slice(startIdx, endIdx + 1));
      } catch (innerErr) {
        throw new Error("Failed to parse response as JSON. Received content was: " + text);
      }
    }
    throw new Error("Failed to parse response as JSON. Received content was: " + text);
  }
}

// 1. Generate tailored changelogs
app.post("/api/generate", async (req, res) => {
  const { 
    changelogText, 
    archetypeId, 
    selectedChannels, 
    providerConfig,
    customAgents,
    customSkills,
    userInstructions,
    mcpServers,
    projectName,
    projectDescription
  } = req.body;

  if (!changelogText || !archetypeId || !selectedChannels || !Array.isArray(selectedChannels)) {
    return res.status(400).json({ error: "Missing required parameters in request body." });
  }

  try {
    const projectContextBlock = projectName ? `
PROJECT ASSOCIATED WITH CHANGELOG:
- Project Name: ${projectName}
- Project Description/Context: ${projectDescription || "No detailed description provided."}
` : "";

    // Setup persona style modifiers
    let styleDescription = "";
    
    // Check if selected archetype matches an active custom user-defined agent
    const matchedCustomAgent = Array.isArray(customAgents) && customAgents.find((a: any) => a.id === archetypeId);

    if (matchedCustomAgent) {
      styleDescription = `
        STYLE: ${matchedCustomAgent.name} (Custom Agent / ${matchedCustomAgent.role || "Specialist Lens"}).
        TONE & DETAILS: ${matchedCustomAgent.description || "Custom specified demeanor."}
        DIRECTIVE INSTRUCTIONS: ${matchedCustomAgent.systemInstruction || "Write aligned with this custom persona's intent."}
      `;
    } else {
      switch (archetypeId) {
        case "poetic":
          styleDescription = `
            STYLE: Poetic (Refined Tactility / Craft-focused).
            TONE: Extravagantly elegant, quiet, intellectual, somber, poetic, emphasizing fine structural craftsmanship.
            VOCABULARY: Focus on words like "extraordinarily deliberate", "relentless pursuit of simplicity", "singular focus", "purity of form", "unapologetic refinement", "milled from a single block", "profoundly thin", "material integrity".
            APPROACH: Present the changelog details not as mundane features, but as monumental design achievements. Describe the code updates, fixes, and enhancements as if they are artisanal modifications crafted down to the sub-micron level. Reject bloated marketing adjectives, preferring a quiet, heavy sincerity that commands absolute reverence.
          `;
          break;
        case "visionary":
          styleDescription = `
            STYLE: Visionary (Emotional Connection / Magical impact).
            TONE: High-octane inspiration, theatrical, direct, highly focused on the user experience and user delight.
            VOCABULARY: Words like "magical", "revolutionary", "mind-blowing", "incredible", "gorgeous", "it just works", "one more thing".
            APPROACH: Introduce the update as a game-changer. Condense complex tech features into beautiful, simple human benefits. Generate excitement. Structure it with high momentum, build anticipation, and deliver a "one more thing" that makes the update feel like an absolute gift to humanity.
          `;
          break;
        case "analytical":
          styleDescription = `
            STYLE: Analytical (First-Principles Essayist).
            TONE: Conversational, essayic, objective, highly analytical, self-reflective, simple.
            VOCABULARY: Plain English, direct verbs, conversational fillers ("I think", "Actually,", "The interesting thing is").
            APPROACH: Write clear, level-headed explanations of what changed and *why*. Question standard industry defaults. Explain structural fixes as lessons in satisfying users or tackling technical debt. Avoid any empty marketing words, exclamation marks, or synthetic hype. Treat the reader like a smart hacker friend.
          `;
          break;
        case "tactical":
          styleDescription = `
            STYLE: Tactical (High-Velocity / Pragmatic Developer).
            TONE: Extremely energetic, tech-savvy, helpful, rapid-fire.
            VOCABULARY: Emojis allowed (🚀, ⚙️, 🔥, 💻, ✨), developer slang, performance timings (e.g., "-25% boot-time latency"), clean references to dependency bumps.
            APPROACH: Break down the update dynamically. Walk through the git commits, package enhancements, or infrastructure optimizations with genuine enthusiasm. Perfect for a dev community that loves to ship constantly.
          `;
          break;
        case "objective":
        default:
          styleDescription = `
            STYLE: Objective (Pure Technical / Standardized Log).
            TONE: Absolutely dry, transparent, clean, and professional.
            VOCABULARY: Clear nouns, operational verbs, no adjectives.
            APPROACH: List updates clearly with zero emotional flourish. Ensure highest scannability. Categorize strictly into Added, Fixed, Deprecated, and Security. Ideal for enterprise consumers who need pure data.
          `;
          break;
      }
    }

    // Process custom active simulation skills Snippets
    let skillSnippets = "";
    if (Array.isArray(customSkills)) {
      const enabledSkills = customSkills.filter((s: any) => s.enabled);
      if (enabledSkills.length > 0) {
        skillSnippets = "\nINJECTED ACTIVE SKILLS FOR GENERATOR ENGINE:\n" + enabledSkills.map((s: any) => {
          return `- ${s.name}: ${s.description}\n  Active Skill Rule Snippet: ${s.systemPromptSnippet}`;
        }).join("\n");
      }
    }

    // Additional general context instructions
    let additionalInstructionsBlock = "";
    if (userInstructions && typeof userInstructions === "string" && userInstructions.trim().length > 0) {
      additionalInstructionsBlock = `\nADDITIONAL USER-DEFINED INSTRUCTIONS / CONTEXT:\n${userInstructions.trim()}\n`;
    }

    // Connect MCP local telemetry block
    let mcpContextBlock = "";
    if (Array.isArray(mcpServers)) {
      const connectedMcp = mcpServers.filter((m: any) => m.status === "connected");
      if (connectedMcp.length > 0) {
        mcpContextBlock = `\nCONNECTED MCP (Model Context Protocol) SERVICES:\nThe following active MCP servers are connected to this workspace. You may reference their simulated tools/methods in writing the code details/references:\n` + connectedMcp.map((m: any) => {
          return `- Server "${m.name}" (${m.url}): Tools/Capabilities available: ${m.methods ? m.methods.join(", ") : "general-context-retriever"}`;
        }).join("\n");
      }
    }

    // Set up standard instructions for each channel
    const channelInstructions: Record<string, string> = {
      blog: "Write a complete, structured corporate or personal blog post (Markdown formatted) that expands on these updates, explaining them in terms suitable for continuous readers.",
      app_store: "Write a high-density, beautifully structured App Store Release Notes text (including a summarizing tagline, highlighted changes, and bug fixes). Keep it concise, engaging, and within App Store compliance guidelines.",
      twitter: "Write a highly engaging Social Media thread of 2 to 4 tightly written posts (each max 280 characters). Label them clear and sequential (e.g., [1/3], [2/3]), optimized for rapid sharing and engagement.",
      linkedin: "Write a polished professional update for LinkedIn. Include a strong hook line, bulleted value propositions for professional networks, and relevant, sophisticated hashtags.",
      discord: "Write a bold, community-oriented update for a Discord announcement channel. Use bold text, clean lists, codebase syntax block references (```), styled headers, and clear emojis to fit a high-energy server atmosphere.",
      hacker_news: "Write a compelling submission text optimized for Hacker News (news.ycombinator.com). Focus on raw first-principles engineering breakthroughs, structural lessons, and metric benchmarks, entirely stripping away marketing buzzwords."
    };

    const channelPrompts = selectedChannels.map(ch => {
      return `Channel "${ch}": ${channelInstructions[ch] || "Summarize the update for this medium."}`;
    }).join("\n\n");

    const prompt = `
      You are an expert copywriter. Your task is to ingest the source changelog content and translate it into captivating product/system updates tailored precisely for different audience channels.
      ${projectContextBlock}
      SOURCE CHANGELOG CONTENT:
      """
      ${changelogText}
      """

      TARGET ARCHETYPE / PERSPECTIVE OVERVIEW:
      ${styleDescription}
      ${skillSnippets}
      ${additionalInstructionsBlock}
      ${mcpContextBlock}

      Tailor copies for the following requested channels:
      ${channelPrompts}

      Return your response strictly adhering to the JSON schema. Ensure each tailored content matches the requested channel id exactly. Keep markdown structures readable.

      CRITICAL: You MUST respond ONLY with a single JSON object strictly matching this schema:
      {
        "updates": [
          {
            "channelId": "blog" | "app_store" | "twitter" | "linkedin" | "discord" | "hacker_news",
            "content": "Tailored copy structured with appropriate spacing."
          }
        ],
        "personaUsed": "${archetypeId}"
      }
      Do not include any conversational preface or wrapping markdown outside of the JSON block if possible.
    `;

    const activeProvider = providerConfig?.provider || "gemini";
    let parsedResponse: any = null;

    if (activeProvider === "gemini") {
      // Ingest customized key if specified, or default to general system Gemini client
      let geminiClient = getGeminiClient();
      if (providerConfig?.apiKey) {
        geminiClient = new GoogleGenAI({
          apiKey: providerConfig.apiKey,
          httpOptions: { headers: { "User-Agent": "aistudio-build-custom" } }
        });
      }

      const response = await geminiClient.models.generateContent({
        model: providerConfig?.modelName || "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a master digital publisher who applies abstract figurative perspectives to mundane updates. Your writing must possess ultimate prestige, visual rhythm, and precise adherence to the requested archetypes.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              updates: {
                type: Type.ARRAY,
                description: "Array of generated copies for each channel.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    channelId: { type: Type.STRING },
                    content: { type: Type.STRING }
                  },
                  required: ["channelId", "content"]
                }
              },
              personaUsed: { type: Type.STRING }
            },
            required: ["updates", "personaUsed"]
          }
        }
      });
      parsedResponse = tryParseJson(response.text || "{}");

    } else if (activeProvider === "openai") {
      const url = `${providerConfig?.baseUrl || "https://api.openai.com/v1"}/chat/completions`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${providerConfig?.apiKey || ""}`
        },
        body: JSON.stringify({
          model: providerConfig?.modelName || "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a master digital publisher who applies abstract figurative perspectives to mundane updates. Your writing must possess ultimate prestige, visual rhythm, and precise adherence to the requested archetypes. Return strictly a raw JSON block matching the schema."
            },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI API returned error (${response.status}): ${errText}`);
      }

      const resJson: any = await response.json();
      const rawText = resJson.choices?.[0]?.message?.content || "{}";
      parsedResponse = tryParseJson(rawText);

    } else if (activeProvider === "anthropic") {
      const url = `${providerConfig?.baseUrl || "https://api.anthropic.com/v1"}/messages`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": providerConfig?.apiKey || "",
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: providerConfig?.modelName || "claude-3-5-haiku-20241022",
          max_tokens: 4000,
          system: "You are a master digital publisher who applies abstract figurative perspectives to mundane updates. Your writing must possess ultimate prestige, visual rhythm, and precise adherence to the requested archetypes. Return strictly raw valid JSON matching the schema, with no markdown framing.",
          messages: [
            { role: "user", content: prompt }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Anthropic API returned error (${response.status}): ${errText}`);
      }

      const resJson: any = await response.json();
      const rawText = resJson.content?.[0]?.text || "{}";
      parsedResponse = tryParseJson(rawText);

    } else if (activeProvider === "local") {
      // Local LLM instances (Ollama, LM Studio etc. standard OpenAI-compatible endpoints)
      const url = `${providerConfig?.baseUrl || "http://localhost:11434/v1"}/chat/completions`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(providerConfig?.apiKey ? { "Authorization": `Bearer ${providerConfig.apiKey}` } : {})
        },
        body: JSON.stringify({
          model: providerConfig?.modelName || "llama3",
          messages: [
            {
              role: "system",
              content: "You are a master digital publisher. Return strictly raw valid JSON matching: { \"updates\": [ { \"channelId\": \"...\", \"content\": \"...\" } ], \"personaUsed\": \"...\" }"
            },
            { role: "user", content: prompt }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Local LLM server returned error (${response.status}): ${errText}. Please check if your local server is running and accessible.`);
      }

      const resJson: any = await response.json();
      const rawText = resJson.choices?.[0]?.message?.content || "{}";
      parsedResponse = tryParseJson(rawText);
    }

    const wordCount = parsedResponse?.updates?.reduce((acc: number, curr: any) => acc + (curr.content?.split(/\s+/).length || 0), 0) || 0;

    res.json({
      updates: parsedResponse?.updates || [],
      metadata: {
        personaUsed: parsedResponse?.personaUsed || archetypeId,
        wordCount
      }
    });

  } catch (error: any) {
    console.error("Generation Error across providers:", error);
    res.status(500).json({ error: error.message || "Failed to generate updates." });
  }
});

// 2. GitHub Webhook Ingest simulation
app.post("/api/webhook/github", (req, res) => {
  const { repository, head_commit, secret } = req.body;

  // Synthesize custom event from payload or default to mockup data
  const newEvent: WebhookEvent = {
    id: `wh_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    repo: repository?.full_name || req.body.repo || "alloy-core/elements",
    commitMessage: head_commit?.message || req.body.commitMessage || "feat: Relentlessly engineered single-point trackpad with zero friction",
    author: head_commit?.author?.name || req.body.author || "craft_pioneer",
    changelogGenerated: true,
  };

  webhookHistory.unshift(newEvent);

  // Keep history size small
  if (webhookHistory.length > 20) {
    webhookHistory.pop();
  }

  res.json({
    status: "success",
    message: "GitHub webhook received and changelog processed.",
    event: newEvent
  });
});

// 3. Webhook simulation logs history feed
app.get("/api/webhook/history", (req, res) => {
  res.json({ history: webhookHistory });
});

// 4. API Configuration Status check
app.get("/api/config-status", (req, res) => {
  res.json({ hasGeminiKey: !!process.env.GEMINI_API_KEY });
});

// Auto-generate persona from writing samples
app.post("/api/generate-persona", async (req, res) => {
  const { sampleText } = req.body;
  if (!sampleText || typeof sampleText !== "string") {
    return res.status(400).json({ error: "Missing writing sample text in request body." });
  }

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are an expert copywriter, style analyst, and persona designer.
Analyze the following writing sample carefully. Extract the author's voice, tone, sentence construction habits, vocabulary choices, level of formality, and underlying philosophy.
Generate a cohesive AI persona/archetype based strictly on this style analysis.

Writing Sample to analyze:
"${sampleText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "A short, descriptive, professional name for the persona, e.g. 'Minimalist Hacker' or 'Visionary Lead'."
            },
            role: {
              type: Type.STRING,
              description: "A short professional role/subtitle for the perspective, e.g. 'The Raw Performance & Purity Angle'."
            },
            description: {
              type: Type.STRING,
              description: "A neat 2-3 sentence overview describing their unique tone, writing style, vocabulary, and delivery mannerisms."
            },
            avatarText: {
              type: Type.STRING,
              description: "A 2-character abbreviation or dynamic emoji capture (e.g. 'Mh', 'Sp', or '⚡')."
            },
            quote: {
              type: Type.STRING,
              description: "A simulated display quote showcasing their writing pattern and voice on change delivery."
            },
            systemInstruction: {
              type: Type.STRING,
              description: "Detailed system instructions/directives for the AI to emulate this exact voice when rewriting changelogs for newsletters, blogs, releases, list items, or Twitter threads. Be highly prescriptive about their syntax structure."
            }
          },
          required: ["name", "role", "description", "avatarText", "quote", "systemInstruction"]
        },
        systemInstruction: "Analyze the tone and voice of the writing sample precisely to create a high-fidelity system-ready translation archetype."
      }
    });

    const parsed = tryParseJson(response.text || "{}");
    res.json({ success: true, persona: parsed });
  } catch (err: any) {
    console.error("Error generating custom persona:", err);
    res.status(500).json({ error: err?.message || "Failed to analyze writing sample and construct persona." });
  }
});

// Auto-fetch and summarize GitHub Repository README.md
app.post("/api/fetch-github-readme", async (req, res) => {
  const { repoUrl, token, simulatePrivate, providerConfig } = req.body;
  if (!repoUrl || typeof repoUrl !== "string") {
    return res.status(400).json({ error: "Missing repoUrl parameter in request body." });
  }

  // Parse owner and repo from URL
  const parseGithubUrl = (urlString: string): { owner: string; repo: string } | null => {
    try {
      let clean = urlString.trim().replace(/\.git$/, "").replace(/\/+$/, "");
      if (clean.includes("github.com/")) {
        const parts = clean.split("github.com/")[1].split("/");
        if (parts.length >= 2) {
          return { owner: parts[0], repo: parts[1] };
        }
      } else {
        const parts = clean.split("/");
        if (parts.length === 2) {
          return { owner: parts[0], repo: parts[1] };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const parsed = parseGithubUrl(repoUrl);
  if (!parsed) {
    return res.status(400).json({ error: "Could not parse a valid owner/repo from the provided GitHub URL." });
  }

  const { owner, repo } = parsed;

  if (simulatePrivate) {
    // Return a simulated high-fidelity private repo response to ensure smooth UI workflows!
    try {
      const displayTitle = repo.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      const simulatedChangelog = `## [2.4.0] - 2026-06-01
### Added
- Implemented real-time telemetry pipelines and high-velocity database writes.
- Formulated custom metal viewport rendering configurations yielding 120fps physics-bounds tracking.
- Interactive OAuth key tunnels dynamically authorizing sandbox profiles.

### Changed
- Refactored index listeners to decouple thread operations.
- Fine-tuned line padding properties for pristine high-contrast layout grids.`;

      return res.json({
        success: true,
        name: `${displayTitle} (Simulated Auth)`,
        description: `Successfully analyzed private repository ${owner}/${repo} content over secure OAuth token tunnel. Features performance-oriented modules and responsive client bindings.`,
        repoPath: `${owner}/${repo}`,
        changelogText: simulatedChangelog
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  try {
    const headers: Record<string, string> = {
      "Accept": "application/vnd.github.raw",
      "User-Agent": "AlloyStudioBuildAgent"
    };
    if (token && token.trim().length > 0) {
      headers["Authorization"] = `token ${token.trim()}`;
    }

    const githubResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers });
    
    if (!githubResponse.ok) {
      if (githubResponse.status === 404 || githubResponse.status === 403 || githubResponse.status === 401) {
        return res.json({
          success: false,
          needsAuth: true,
          error: `Failed to fetch repository readme (HTTP ${githubResponse.status}). It might be a private repository or rate-limited. Please authenticate with a GitHub Token to proceed.`
        });
      }
      const errText = await githubResponse.text();
      return res.status(500).json({ error: `GitHub API error (${githubResponse.status}): ${errText}` });
    }

    const readmeText = await githubResponse.text();

    // Now, also check for a CHANGELOG file if URL is correct
    let fetchedChangelog = "";
    try {
      const changelogCandidates = ["CHANGELOG.md", "changelog.md", "HISTORY.md", "history.md", "RELEASES.md", "RELEASES", "ReleaseNotes.md", "CHANGELOG"];
      for (const file of changelogCandidates) {
        const clResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${file}`, { headers });
        if (clResponse.ok) {
          const rawText = await clResponse.text();
          if (rawText && rawText.trim().length > 0) {
            fetchedChangelog = rawText;
            console.log(`Successfully auto-fetched changelog from候选: ${file}`);
            break;
          }
        }
      }
    } catch (clErr) {
      console.warn("Silent failure searching for repositories changelog list:", clErr);
    }

    if (!readmeText || readmeText.trim().length === 0) {
      // Empty readme fallback
      const displayTitle = repo.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      return res.json({
        success: true,
        name: displayTitle,
        description: `Standard profile curated for ${owner}/${repo}. Formulate strategic contextual prompt guidelines here...`,
        changelogText: fetchedChangelog || undefined
      });
    }

    // Try summarizing using the user-selected inference engine configuration
    try {
      const activeProvider = providerConfig?.provider || "gemini";
      let profileParsed: any = null;
      const prompt = `You are an expert product analyst and layout designer.
Analyze the following GitHub repository README.md content and formulate a pristine, system-ready profile of constraints and name/identity.
Provide:
1. A clean, beautiful product name.
2. A premium system archetype/context descriptions in 1-2 polished sentences summarizing the key characteristics, design constraints, and user advantages.

CRITICAL: Return your response strictly adhering to this JSON schema:
{
  "name": "Concise product title, e.g. 'Hydra Core'",
  "description": "A summary style & identity guideline overview in 1-2 sentences."
}

Do not include any conversational preface or wrapping markdown outside of the JSON block.

README CONTENT:
"""
${readmeText.slice(0, 10000)}
"""`;

      if (activeProvider === "gemini") {
        let geminiClient = getGeminiClient();
        if (providerConfig?.apiKey) {
          geminiClient = new GoogleGenAI({
            apiKey: providerConfig.apiKey,
            httpOptions: { headers: { "User-Agent": "aistudio-build-custom" } }
          });
        }

        const response = await geminiClient.models.generateContent({
          model: providerConfig?.modelName || "gemini-3.5-flash",
          contents: prompt,
          config: {
            systemInstruction: "Formulate neat JSON with name and description matching the product's identity from its README context constraints.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: "Concise product title, e.g. 'Hydra Core'"
                },
                description: {
                  type: Type.STRING,
                  description: "A summary style & identity guideline overview in 1-2 sentences."
                }
              },
              required: ["name", "description"]
            }
          }
        });
        profileParsed = tryParseJson(response.text || "{}");

      } else if (activeProvider === "openai") {
        const url = `${providerConfig?.baseUrl || "https://api.openai.com/v1"}/chat/completions`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${providerConfig?.apiKey || ""}`
          },
          body: JSON.stringify({
            model: providerConfig?.modelName || "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are an expert product analyst. Return strictly a raw JSON block matching the schema with fields: name and description."
              },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenAI API returned error (${response.status}): ${errText}`);
        }

        const resJson: any = await response.json();
        const rawText = resJson.choices?.[0]?.message?.content || "{}";
        profileParsed = tryParseJson(rawText);

      } else if (activeProvider === "anthropic") {
        const url = `${providerConfig?.baseUrl || "https://api.anthropic.com/v1"}/messages`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": providerConfig?.apiKey || "",
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: providerConfig?.modelName || "claude-3-5-haiku-20241022",
            max_tokens: 1500,
            system: "You are an expert product analyst. Return strictly raw valid JSON matching the schema, with no markdown framing, featuring fields: name and description.",
            messages: [
              { role: "user", content: prompt }
            ]
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Anthropic API returned error (${response.status}): ${errText}`);
        }

        const resJson: any = await response.json();
        const rawText = resJson.content?.[0]?.text || "{}";
        profileParsed = tryParseJson(rawText);

      } else if (activeProvider === "local") {
        const url = `${providerConfig?.baseUrl || "http://localhost:11434/v1"}/chat/completions`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(providerConfig?.apiKey ? { "Authorization": `Bearer ${providerConfig.apiKey}` } : {})
          },
          body: JSON.stringify({
            model: providerConfig?.modelName || "llama3",
            messages: [
              {
                role: "system",
                content: "You are an expert product analyst. Return strictly raw valid JSON matching: { \"name\": \"...\", \"description\": \"...\" }"
              },
              { role: "user", content: prompt }
            ]
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Local LLM returned error (${response.status}): ${errText}`);
        }

        const resJson: any = await response.json();
        const rawText = resJson.choices?.[0]?.message?.content || "{}";
        profileParsed = tryParseJson(rawText);
      }

      return res.json({
        success: true,
        name: profileParsed?.name || repo,
        description: profileParsed?.description || "Descriptive context extracted from README.",
        repoPath: `${owner}/${repo}`,
        changelogText: fetchedChangelog || undefined
      });

    } catch (geminiErr) {
      console.warn("Gemini summarization failed, using default text triggers:", geminiErr);
      // Clean fallback parsing
      let fallbackName = repo.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      let fallbackDesc = `A customized project based on ${owner}/${repo}. Formulate strategic contextual prompt guidelines here...`;
      
      // Attempt rudimentary parsing of headers
      const lines = readmeText.split("\n");
      for (const line of lines) {
        if (line.startsWith("# ")) {
          fallbackName = line.replace("# ", "").trim();
          break;
        }
      }
      return res.json({
        success: true,
        name: fallbackName,
        description: fallbackDesc,
        repoPath: `${owner}/${repo}`,
        changelogText: fetchedChangelog || undefined
      });
    }

  } catch (error: any) {
    console.error("General error in fetch-github-readme:", error);
    res.status(500).json({ error: error.message || "Failed to process GitHub repository README retrieval." });
  }
});

// OAuth Simulated Endpoints
app.get("/api/auth/url", (req, res) => {
  const { platform } = req.query;
  const targetPlatform = platform === "linkedin" ? "linkedin" : "twitter";
  // Deliver simulated authorization url
  res.json({ url: `/auth/authorize?platform=${targetPlatform}` });
});

app.get("/auth/authorize", (req, res) => {
  const { platform } = req.query;
  const isLinkedin = platform === "linkedin";

  const brandColor = isLinkedin ? "#0a66c2" : "#000000";
  const platformName = isLinkedin ? "LinkedIn" : "X / Twitter";
  const logoSvg = isLinkedin 
    ? `<svg style="width: 40px; height: 40px; fill: #0a66c2;" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>`
    : `<svg style="width: 36px; height: 36px; fill: #000000;" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Authorize Alloy Studio to access your account</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f4f4f5;
            color: #18181b;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100h;
            height: 100vh;
          }
          .card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
            width: 100%;
            max-width: 400px;
            padding: 32px;
            box-sizing: border-box;
            border: 1px solid #e4e4e7;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
          }
          .app-badge {
            background-color: #18181b;
            color: white;
            border-radius: 10px;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }
          h2 {
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 8px 0;
            letter-spacing: -0.025em;
          }
          .subtitle {
            font-size: 13px;
            color: #71717a;
            margin-bottom: 20px;
          }
          .permissions-list {
            background-color: #fafafa;
            border: 1px solid #f4f4f5;
            border-radius: 10px;
            padding: 16px;
            margin-bottom: 24px;
          }
          .permission-item {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            font-size: 12.5px;
            color: #3f3f46;
            margin-bottom: 11px;
            line-height: 1.4;
          }
          .permission-item:last-child {
            margin-bottom: 0;
          }
          .bullet {
            color: ${brandColor};
            font-weight: bold;
            font-size: 14px;
          }
          .actions {
            display: flex;
            gap: 12px;
          }
          .btn {
            flex: 1;
            padding: 11px 16px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 600;
            text-align: center;
            cursor: pointer;
            transition: all 0.15s ease-out;
            border: none;
            text-decoration: none;
          }
          .btn-cancel {
            background-color: #f4f4f5;
            color: #4b5563;
          }
          .btn-cancel:hover {
            background-color: #e4e4e7;
          }
          .btn-primary {
            background-color: ${brandColor};
            color: white;
          }
          .btn-primary:hover {
            filter: brightness(92%);
          }
          .footer-text {
            font-size: 11px;
            color: #a1a1aa;
            text-align: center;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            ${logoSvg}
            <span class="app-badge">Alloy Studio</span>
          </div>
          
          <h2>Authorize Access to ${platformName}</h2>
          <p class="subtitle">Authenticate your organization profile to authorize automatic changelog publishing.</p>
          
          <div class="permissions-list">
            <div class="permission-item">
              <span class="bullet">✓</span>
              <span><strong>Create posts & articles</strong> on your behalf</span>
            </div>
            <div class="permission-item">
              <span class="bullet">✓</span>
              <span><strong>Read profile statistics</strong> and page metadata</span>
            </div>
            <div class="permission-item">
              <span class="bullet">✓</span>
              <span><strong>Manage media uploads</strong> (images and release asset logs)</span>
            </div>
          </div>
          
          <div class="actions">
            <button class="btn btn-cancel" onclick="window.close()">Cancel</button>
            <a href="/auth/callback?platform=${platform}" class="btn btn-primary">Authorize App</a>
          </div>
          
          <p class="footer-text">You can revoke permission anytime in your ${platformName} account settings.</p>
        </div>
      </body>
    </html>
  `);
});

app.get("/auth/callback", (req, res) => {
  const { platform } = req.query;
  const platformLabel = platform === "linkedin" ? "linkedin" : "twitter";

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Authentication Completed</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background-color: #fafafa;
            margin: 0;
            color: #18181b;
          }
          .container {
            background: white;
            padding: 32px 24px;
            border-radius: 16px;
            border: 1px solid #f4f4f5;
            box-shadow: 0 10px 30px rgba(0,0,0,0.02);
            text-align: center;
            max-width: 360px;
          }
          .check-icon {
            font-size: 36px;
            margin-bottom: 14px;
            animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }
          h3 {
            margin: 0 0 8px 0;
            font-size: 16px;
            font-weight: 600;
          }
          p {
            margin: 0;
            font-size: 13px;
            color: #71717a;
            line-height: 1.5;
          }
          @keyframes scaleIn {
            0% { transform: scale(0.6); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="check-icon">🚀</div>
          <h3>Simulated Connection Successful!</h3>
          <p>Your ${platformLabel === "linkedin" ? "LinkedIn Professional" : "X / Twitter"} account is now securely linked to Alloy Studio.</p>
        </div>
        <script>
          // Standard cross-origin postMessage as instructed by oauth-integration skill
          setTimeout(() => {
            if (window.opener) {
              window.opener.postMessage({ type: "OAUTH_AUTH_SUCCESS", platform: "${platformLabel}" }, "*");
              window.close();
            } else {
              window.close();
            }
          }, 1800);
        </script>
      </body>
    </html>
  `);
});


// --- MCP SERVER SETUP ---
const mcp = new McpServer({
  name: "Alloy Studio Changelog Generator",
  version: "1.0.0"
});

mcp.tool("get_webhook_history",
  "Fetches the recent simulated GitHub Webhook events",
  {},
  async () => {
    return {
      content: [{ type: "text", text: JSON.stringify(webhookHistory, null, 2) }]
    };
  }
);

mcp.tool("simulate_webhook",
  "Simulates receiving a GitHub webhook to initiate a workflow. Returns the generated webhook event ID",
  {
    repo: z.string().describe("The repository full name, e.g. alloy-core/elements"),
    commitMessage: z.string().describe("The head commit message"),
    author: z.string().optional().describe("The name of the commit author")
  },
  async ({ repo, commitMessage, author }) => {
    const newEvent: WebhookEvent = {
      id: `wh_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      repo: repo || "alloy-core/elements",
      commitMessage: commitMessage || "feat: Unknown update",
      author: author || "unknown",
      changelogGenerated: true,
    };
    webhookHistory.unshift(newEvent);
    if (webhookHistory.length > 20) {
      webhookHistory.pop();
    }
    return {
      content: [{ type: "text", text: JSON.stringify({ success: true, event: newEvent }) }]
    };
  }
);

mcp.tool("fetch_github_readme",
  "Fetches and summarizes a GitHub repository README text for changelog context",
  {
     repoUrl: z.string().describe("The URL of the github repo e.g. https://github.com/facebook/react"),
     token: z.string().optional().describe("Optional GitHub Personal Access Token"),
     simulatePrivate: z.boolean().optional().describe("Set to true to use a simulated private repo context")
  },
  async (args) => {
    try {
      const res = await fetch(`http://localhost:${PORT}/api/fetch-github-readme`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args)
      });
      const data = await res.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
      };
    } catch (e: any) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);

mcp.tool("generate_changelog_copies",
  "Generates platform-tailored changelog copies using AI models based on git events and repo context",
  {
    changelogText: z.string().describe("The raw concatenated text of new commits or updates to process"),
    archetypeId: z.string().describe("The persona layout style: 'objective', 'poetic', 'visionary', 'analytical', 'tactical'"),
    selectedChannels: z.array(z.string()).describe("Array of platforms e.g. ['blog', 'twitter', 'linkedin', 'hacker_news', 'app_store', 'discord']"),
    projectName: z.string().optional().describe("Optional custom name of project context"),
    projectDescription: z.string().optional().describe("Optional custom description context")
  },
  async (args) => {
    try {
      const res = await fetch(`http://localhost:${PORT}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args)
      });
      const data = await res.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
      };
    } catch (e: any) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);

const mcpTransports = new Map<string, SSEServerTransport>();

app.get("/mcp/sse", async (req, res) => {
  const transport = new SSEServerTransport("/mcp/messages", res);
  mcpTransports.set(transport.sessionId, transport);
  await mcp.connect(transport);
  
  req.on("close", () => {
    mcpTransports.delete(transport.sessionId);
  });
});

app.post("/mcp/messages", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = mcpTransports.get(sessionId);
  if (!transport) {
    return res.status(400).send("Invalid sessionId");
  }
  await transport.handlePostMessage(req, res);
});
// --- END MCP SERVER SETUP ---

// Vite Dev / Static Production handling

async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    app.get("*", async (req, res, next) => {
      try {
        const fs = await import("fs");
        let html = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        html = await vite.transformIndexHtml(req.originalUrl, html);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Changelog AI server booted on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Critical error bootstrapping full-stack server:", err);
});
