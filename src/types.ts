export type ChannelType = "blog" | "app_store" | "twitter" | "linkedin" | "discord" | "hacker_news";

export interface Channel {
  id: ChannelType;
  name: string;
  description: string;
  placeholder: string;
}

export type ArchetypeId = string;

export interface Archetype {
  id: string;
  name: string;
  role: string;
  description: string;
  avatarText: string;
  quote: string;
  systemInstruction?: string; // Optional custom system instructions for AI model runs
}

export interface CustomSkill {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  systemPromptSnippet: string;
}

export interface McpServerConfig {
  id: string;
  name: string;
  url: string;
  status: "connected" | "disconnected" | "connecting";
  methods?: string[];
}


export type LLMProviderId = "gemini" | "openai" | "anthropic" | "local";

export interface LLMProviderConfig {
  provider: LLMProviderId;
  apiKey: string;
  baseUrl: string;
  modelName: string;
}

export interface GenerationRequest {
  changelogText: string;
  archetypeId: ArchetypeId;
  selectedChannels: ChannelType[];
  providerConfig?: LLMProviderConfig;
}

export interface GeneratedUpdate {
  channelId: ChannelType;
  content: string;
}

export interface GenerationResponse {
  updates: GeneratedUpdate[];
  metadata: {
    promptTokens?: number;
    completionTokens?: number;
    personaUsed: string;
    wordCount: number;
  };
}

export interface SavedUpdate {
  id: string;
  createdAt: string;
  changelogTitle: string;
  rawChangelog: string;
  archetypeId: ArchetypeId;
  updates: GeneratedUpdate[];
}

export interface IntegrationConfig {
  githubEnabled: boolean;
  githubRepo: string;
  githubSecret: string;
  appStoreEnabled: boolean;
  appStoreKeyId: string;
  playStoreEnabled: boolean;
  playStoreJson: string;
  twitterEnabled: boolean;
  twitterApiKey: string;
  twitterAuthType: "oauth" | "api_key";
  twitterClientId: string;
  twitterClientSecret: string;
  twitterAccessToken: string;
  twitterAccessSecret: string;
  twitterConnectedUser: string;
  linkedinEnabled: boolean;
  linkedinAccessToken: string;
  linkedinAuthType: "oauth" | "api_key";
  linkedinClientId: string;
  linkedinClientSecret: string;
  linkedinOrgId: string;
  linkedinConnectedUser: string;
  webhookUrl: string;
  zapierEnabled: boolean;
  zapierWebhookUrl: string;
  n8nEnabled: boolean;
  n8nWebhookUrl: string;
  discordEnabled: boolean;
  discordWebhookUrl: string;
  hnEnabled: boolean;
  hnUsername: string;
  hnPassword?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  integrationConfig: IntegrationConfig;
}
