export interface ApiConfig {
  name: string;
  baseUrl: string;
  status: "healthy" | "unhealthy" | "unknown";
  lastChecked?: Date;
  response_time?: number;
  description?: string;
  label?: string;
  requiresAuth?: boolean;
  authToken?: string;
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
// Supports both simple format: "name:url" and enhanced format: "name:url:label:token"
export function parseApiConfigs(configString?: string): ApiConfig[] {
  if (!configString) return [];

  return configString
    .split(",")
    .map((config) => {
      const parts = config.split(":").map((part) => part.trim());

      if (parts.length < 2) {
        console.warn(
          `Invalid API config format: ${config}. Expected at least name:url`,
        );
        return null;
      }

      const [name, baseUrl, label, authToken] = parts;

      // Reconstruct URL if it was split by colons (for http/https protocols)
      let finalBaseUrl = baseUrl;
      if (parts.length > 2 && (baseUrl === "http" || baseUrl === "https")) {
        finalBaseUrl = `${baseUrl}:${parts[2]}`;
        // Adjust other parts if URL contained protocol
        const adjustedParts = [name, finalBaseUrl, ...parts.slice(3)];
        const [, , adjustedLabel, adjustedAuthToken] = adjustedParts;

        return {
          name,
          baseUrl: finalBaseUrl,
          status: "unknown" as const,
          label: adjustedLabel || undefined,
          requiresAuth: adjustedAuthToken ? true : false,
          authToken: adjustedAuthToken || undefined,
        };
      }

      return {
        name,
        baseUrl: finalBaseUrl,
        status: "unknown" as const,
        label: label || undefined,
        requiresAuth: authToken ? true : false,
        authToken: authToken || undefined,
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
