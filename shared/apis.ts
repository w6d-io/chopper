export interface ApiConfig {
  name: string;
  baseUrl: string;
  status: "healthy" | "unhealthy" | "unknown";
  lastChecked?: Date;
  response_time?: number;
  description?: string;
}

export interface ApiHealthCheck {
  liveness: { status: string; timestamp?: string; uptime?: number } | null;
  readiness: { status: string; timestamp?: string; checks?: any } | null;
}

export interface ApiStatus extends ApiConfig {
  health: ApiHealthCheck;
}

export interface MultiApiResponse<T = any> {
  status: "success" | "error";
  status_code: number;
  message?: string;
  data: T | null;
  api: string;
}

// Parse API configs from environment variable
export function parseApiConfigs(configString?: string): ApiConfig[] {
  if (!configString) return [];

  return configString
    .split(",")
    .map((config) => {
      const colonIndex = config.indexOf(":");
      if (colonIndex === -1) {
        console.warn(`Invalid API config format: ${config}`);
        return null;
      }

      const name = config.substring(0, colonIndex).trim();
      const baseUrl = config.substring(colonIndex + 1).trim();

      return {
        name,
        baseUrl,
        status: "unknown" as const,
      };
    })
    .filter((config) => config !== null) as ApiConfig[];
}

// Generate API endpoint for a specific API
export function getApiEndpoint(apiName: string, endpoint: string): string {
  return `/api/${apiName}${endpoint}`;
}

// Check if API name is valid
export function isValidApiName(apiName: string, configs: ApiConfig[]): boolean {
  return configs.some((config) => config.name === apiName);
}
