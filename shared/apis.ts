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
  id?: string; // Unique identifier for multiple APIs with same name
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
// Supports formats:
// Simple: "name:url"
// With label: "name:url:label"
// Note: Bearer tokens should be provided at runtime, not stored in config
export function parseApiConfigs(configString?: string): ApiConfig[] {
  if (!configString) return [];

  return configString
    .split(",")
    .map((config) => {
      const trimmedConfig = config.trim();

      // Find first colon for name
      const firstColonIndex = trimmedConfig.indexOf(":");
      if (firstColonIndex === -1) {
        console.warn(
          `Invalid API config format: ${config}. Expected at least name:url`,
        );
        return null;
      }

      const name = trimmedConfig.substring(0, firstColonIndex).trim();
      const remainder = trimmedConfig.substring(firstColonIndex + 1);

      // For URL part, we need to be smarter about parsing
      // URLs can contain colons (http://localhost:8000)
      // So we look for the pattern that suggests end of URL
      let baseUrl: string;
      let label: string | undefined;
      let authToken: string | undefined;

      // Try to find if there are additional components after the URL
      // Look for patterns like :label or :label:token at the end
      const urlPattern = /^(https?:\/\/[^:]+(?::[0-9]+)?(?:\/[^:]*)?)(.*)/;
      const match = remainder.match(urlPattern);

      if (match) {
        baseUrl = match[1].trim();
        const additionalParts = match[2];

        if (additionalParts && additionalParts.startsWith(":")) {
          const extraParts = additionalParts.substring(1).split(":");
          label = extraParts[0]?.trim() || undefined;
          authToken = extraParts[1]?.trim() || undefined;
        }
      } else {
        // If it doesn't match URL pattern, treat the whole remainder as URL
        // and assume no additional parts
        const parts = remainder.split(":");
        baseUrl = parts[0].trim();
        label = parts[1]?.trim() || undefined;
        authToken = parts[2]?.trim() || undefined;
      }

      // Clean up baseUrl - remove trailing slashes and normalize
      baseUrl = baseUrl.replace(/\/+$/, "").trim();

      return {
        name,
        baseUrl,
        status: "unknown" as const,
        label: label || undefined,
        requiresAuth: false, // Auth determined at runtime
        authToken: undefined, // Tokens provided at runtime only
        id: `${name}-${baseUrl.replace(/[^a-zA-Z0-9]/g, "-")}`, // Generate unique ID
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
