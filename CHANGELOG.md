# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **README.md & CHANGELOG.md**: Added comprehensive project documentation.

## [1.1.0] - 2026-06-01

### Added
- **Search Engine Optimization (SEO)**: Built complete open graph, twitter metadata, canonical URLs, and `application/ld+json` schema for advanced crawler indexing. Added `sitemap.xml` and `robots.txt`.
- **Large Language Model Optimization (LLMO)**: Integrated standard `/llms.txt` and `/llms-full.txt` files for AI ingestion frameworks to properly parse tool capabilities.
- **MCP Server over SSE**: Deployed the `@modelcontextprotocol/sdk` to support server-sent events for real-time multi-agent interactions, enabling endpoints `/mcp/sse` and `/mcp/messages`.
- **New MCP Tools**:
  - `fetch_github_readme`: Scrapes and summarizes repository context.
  - `simulate_webhook`: Emulates simulated push payloads from GitHub/GitLab.
  - `get_webhook_history`: Reads recent activity streams.
  - `generate_changelog_copies`: Formats commits against different archetypes and platform contexts.

## [1.0.0] - 2026-05-20

### Added
- **Initial Release**: Core functionality for the Alloy Studio continuous delivery workspace.
- **AI Engine**: Integrated `GEMINI_API_KEY` processing for transforming commit logs into structured changelogs.
- **UI Architecture**: Premium, high-contrast visual design, utilizing frosted glass effects and responsive tailwind modules (`AccountingModule`, `ReportsModule` aesthetic ports to `Changelog`).
- **Simulations**: Base mock-data implementations representing a fully formed workspace environment.
