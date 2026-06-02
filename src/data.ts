import { Channel, Archetype, IntegrationConfig, Project } from "./types";

export const CHANNELS: Channel[] = [
  {
    id: "blog",
    name: "Corporate Blog",
    description: "Detailed, structured narratives detailing major architecture updates.",
    placeholder: "An elegant, comprehensive blog post summarizing your release stories..."
  },
  {
    id: "app_store",
    name: "App Stores",
    description: "High-density summaries detailing customer benefits, bugs resolved, and compliance notes.",
    placeholder: "Clean release notes including taglines, key improvements, and sub-micron bug fixes..."
  },
  {
    id: "twitter",
    name: "X / Twitter",
    description: "Engaging 240-char thread segments optimized for developers and consumers.",
    placeholder: "A sequential thread [1/X] presenting your release in punchy visual highlights..."
  },
  {
    id: "linkedin",
    name: "LinkedIn Professional",
    description: "Hook-driven summaries highlighting enterprise value, tech achievements, and hashtags.",
    placeholder: "A sophisticated, professional post explaining the business impact and industry milestones..."
  },
  {
    id: "discord",
    name: "Discord Server",
    description: "Bold markdown broadcasts with codebase embed formatting for guild updates.",
    placeholder: "An engaging announce-feed post complete with dynamic embed structures and styling emojis..."
  },
  {
    id: "hacker_news",
    name: "Hacker News",
    description: "Architectural showcases highlighting complex engineering and first-principles breakthroughs.",
    placeholder: "A tech-forward story submission highlighting deep engineering hurdles and how they were solved..."
  }
];

export const ARCHETYPES: Archetype[] = [
  {
    id: "poetic",
    name: "Poetic",
    role: "The Craft & Purity Perspective",
    description: "Solemn, artistic, and entirely focused on sub-micron details. Every line of code starts from zero and is milled down with singular intent.",
    avatarText: "Pt",
    quote: "It's about a relentless, almost fanatical pursuit of purity, stripping away the irrelevant until only the profound integrity of the system remains."
  },
  {
    id: "visionary",
    name: "Visionary",
    role: "The Human Delight Perspective",
    description: "Inspirational, emotional, and captivating. Translates complex technical features into magical benefits that delight the soul.",
    avatarText: "Vs",
    quote: "We've done something incredibly special here. It's beautiful, it's magical, it fits right in your hand. Let me show you how it works."
  },
  {
    id: "analytical",
    name: "Analytical",
    role: "The First-Principles Perspective",
    description: "Inquisitive, logical, and conversational. Simple, dry arguments explaining the structural truth of structural engineering decisions.",
    avatarText: "An",
    quote: "Startups succeed when they listen to users instead of building what they think people want. This update is a natural result of that feedback fold."
  },
  {
    id: "tactical",
    name: "Tactical",
    role: "The High-Velocity Developer",
    description: "Energetic, practical, and highly active. Complete with performance timings, package dependency upgrades, and dev slang.",
    avatarText: "Tc",
    quote: "Just squeezed an insane 42% performance boost into production! Clean build, green tests, let's ship this! 🚀🔥"
  },
  {
    id: "objective",
    name: "Objective",
    role: "The Pure Telemetry Perspective",
    description: "Dry, transparent, and direct. Standardized release logging, zero adjectives, and extreme ease of technical consumption.",
    avatarText: "Ob",
    quote: "Zero marketing fluff. Standardized semver, concise highlights, resolved incidents, and package telemetry. Ready to consume."
  }
];

export const SAMPLE_CHANGELOGS = [
  {
    title: "Aluminium OS v2.4 (Core System Engine)",
    content: `## [2.4.0] - 2026-05-31

### Added
- Created a single-layer, unified haptic physics simulation engine allowing ultra-low latency scroll dynamics.
- Introduced variable refresh rendering down to 1Hz, saving up to 35% battery life during quiescent periods.
- Implemented real-time hardware-milled visual themes utilizing custom silver-aluminum shaders.

### Refined
- Rebuilt the system scroll physics to respond linearly to micro-finger offsets.
- Enhanced standard tracking precision of stylus tools by 25%.

### Fixed
- Resolved a rare audio pop that occurred during transition between active and standby speaker states.
- Solved an issue where background process tasks were not immediately garbage collected on window closing.`
  },
  {
    title: "Scribble Notes v4.1 (Indie Vector Drawing)",
    content: `## v4.1.2 Rebranding & Vector Performance

- Added multi-layered canvases with high-precision pressure sensitivity mapping.
- Enhanced rendering pipeline speed by 48% through native metal pipeline optimizations.
- Streamlined integration bindings to iCloud and Dropbox for seamless background file replication.
- Squashed a bug that caused canvas flickers on rotating external iPad displays.
- Modified button UI colors and margin padding so that interactive zones are clean and spacious.
- Implemented auto-export functionality directly exporting vectors to SVG format with custom sizing presets.`
  },
  {
    title: "OmniDB v9.0 (Cloud Time-Series Database)",
    content: `# Release Notes - OmniDB v9.0.0 Stable

Major architectural upgrade targeting ultra-fast analytical ingestion speeds.

- **Added Distributed Log Structured Store**: New storage model yields up to 4x improvement in streaming writes.
- **Added TLS 1.3 Client Encryption**: Fully upgraded connection security handshake.
- **Fixed Memory Leak in Ring Buffer**: Fixed an out-of-memory issue during highly skewed partition indexes.
- **Refined Query Planner**: Optimized CTE join trees resulting in 30% faster analytics on cold storage nodes.`
  }
];

export const INITIAL_INTEGRATION_CONFIG: IntegrationConfig = {
  githubEnabled: true,
  githubRepo: "johnny-appleseed/aluminium-design-system",
  githubSecret: "shh_deliberate_token_123",
  appStoreEnabled: false,
  appStoreKeyId: "KEY_ID_IVY_419",
  playStoreEnabled: false,
  playStoreJson: "",
  twitterEnabled: false,
  twitterApiKey: "",
  twitterAuthType: "oauth",
  twitterClientId: "",
  twitterClientSecret: "",
  twitterAccessToken: "",
  twitterAccessSecret: "",
  twitterConnectedUser: "@alloy_studio",
  linkedinEnabled: false,
  linkedinAccessToken: "",
  linkedinAuthType: "oauth",
  linkedinClientId: "",
  linkedinClientSecret: "",
  linkedinOrgId: "",
  linkedinConnectedUser: "Alloy Publisher",
  webhookUrl: "https://your-domain.dev/api/webhook/github",
  zapierEnabled: false,
  zapierWebhookUrl: "https://hooks.zapier.com/hooks/catch/123456/b7xyz/",
  n8nEnabled: false,
  n8nWebhookUrl: "https://primary-n8n.instance.com/webhook-test/changelog-feed",
  discordEnabled: false,
  discordWebhookUrl: "https://discord.com/api/webhooks/12345/abcde",
  hnEnabled: false,
  hnUsername: "",
  hnPassword: ""
};

export const DEFAULT_PROJECTS: Project[] = [
  {
    id: "proj_aluminium_os",
    name: "Aluminium OS",
    description: "A custom operating system for premium metal-milled devices with high-precision physics-based scroll mechanics and variable refresh visual performance.",
    integrationConfig: {
      ...INITIAL_INTEGRATION_CONFIG,
      githubRepo: "alloy-os/aluminium-core",
      discordEnabled: true,
      discordWebhookUrl: "https://discord.com/api/webhooks/12345/os-announcements",
      webhookUrl: "https://your-domain.dev/api/webhook/github?project=aluminium_os",
      zapierEnabled: true
    }
  },
  {
    id: "proj_scribble_notes",
    name: "Scribble Notes",
    description: "A premium iPad-specific vector note-taking app featuring pressure sensitivity mapping and GPU optimizations for creator workflows.",
    integrationConfig: {
      ...INITIAL_INTEGRATION_CONFIG,
      githubRepo: "scribble-labs/scribble-notes-ipad",
      appStoreEnabled: true,
      appStoreKeyId: "KEY_ID_SCRIBBLE_X01",
      discordEnabled: false,
      discordWebhookUrl: "https://discord.com/api/webhooks/12345/scribble-updates",
      webhookUrl: "https://your-domain.dev/api/webhook/github?project=scribble_notes",
      n8nEnabled: true
    }
  },
  {
    id: "proj_omnidb",
    name: "OmniDB Labs",
    description: "A specialized time-series analytical database engine designed for log-structured high-velocity write benchmarks across cloud partitions.",
    integrationConfig: {
      ...INITIAL_INTEGRATION_CONFIG,
      githubRepo: "omnidb-labs/omnidb-core",
      hnEnabled: true,
      hnUsername: "omnidb_developer",
      discordEnabled: true,
      discordWebhookUrl: "https://discord.com/api/webhooks/12345/omnidb-logs",
      webhookUrl: "https://your-domain.dev/api/webhook/github?project=omnidb"
    }
  }
];

