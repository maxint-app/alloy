# Alloy Studio

> The premier AI-powered continuous delivery workspace.

Alloy Studio is an enterprise-grade workspace that monitors repository updates, intelligently extracts context, and reformats Git commits into brilliant, meticulously styled platform-oriented changelog copies.

## Features

- **Zero-Touch Configuration**: Receives standard GitHub/GitLab webhooks and automatically triggers the staging sequence.
- **Dynamic Archetypes**: Can write changelogs as a Visionary, a Tactical Developer, an Analytical Essayist, or directly follow Custom Personas.
- **Cross-Platform Generation**: Distinctively formats copies for Twitter, LinkedIn, Discord, Hacker News, Blog Posts, and App Stores simultaneously from a single PR/Commit list.
- **Model Context Protocol (MCP)**: Embedded MCP Server over SSE allowing LLM Agents to natively interface and dispatch capabilities.
- **LLM Optimization**: Exposes `/llms.txt` and `/llms-full.txt` for agents to easily index project documentation.
- **SEO Ready**: Full `robots.txt`, `sitemap.xml`, Canonical tags, and JSON-LD schema optimization for search engines.

## Quick Start / How It Works

Alloy handles the tedious work of translating raw code changes into polished release notes. Here is the standard workflow:

1. **Input Your Commits:** Pass your raw commit logs, PR descriptions, or let Alloy automatically capture them via GitHub/GitLab webhooks.
2. **Select an Archetype:** Choose a styling voice that aligns with your brand. Want a high-level *Visionary* announcement or a detailed *Tactical* breakdown? Alloy shifts its tone accordingly.
3. **Target Platforms:** Select where this update is being broadcasted (e.g., Twitter, LinkedIn, Hacker News, Discord, or standard Blog format).
4. **Generate & Review:** Alloy processes the context and instantly generates tailored, platform-native copy. Review the results, copy to your clipboard, and ship it.

## Setup

1. **Install Dependencies**
   ```bash
   pnpm install
   ```
2. **Environment Variables**
   Set up your `.env` file referencing `.env.example`.
   ```bash
   GEMINI_API_KEY=your_gemini_key
   ```
3. **Run Dev Server**
   ```bash
   pnpm run dev
   ```
4. **Build for Production**
   ```bash
   pnpm run build
   ```
5. **Start Production Server**
   ```bash
   pnpm start
   ```

## Integrations

### Model Context Protocol (MCP)

Alloy Studio acts as an MCP server. Connect your compatible LLM clients (like Claude Desktop) to:
- `http://localhost:3000/mcp/sse`

Tools available:
- `simulate_webhook`
- `get_webhook_history`
- `fetch_github_readme`
- `generate_changelog_copies`

## Philosophy

Alloy aims for "Zero-Touch" changelog generation. Developers push commits, and the system does the heavy lifting of extracting context and styling updates perfectly for any desired platform, letting the developer act as a strategic reviewer before broadcast.

## License

This project operates on an **Open-Core** model and is licensed under the [Apache License 2.0](LICENSE).

The core generation engine and basic workspace are open-source and free to use. Premium enterprise features (such as advanced custom archetypes, team collaboration, and dedicated hosted instances) may be offered under a commercial subscription, while the community edition remains open to everyone.
