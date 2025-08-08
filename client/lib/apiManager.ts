import {
  ApiConfig,
  ApiStatus,
  ApiHealthCheck,
} from "@shared/apis";

class ApiManager {
  private configs: ApiConfig[] = [];

  // Cache is now keyed by a unique key per API (id or name@baseUrl)
  private healthCache: Map<
    string,
    { health: ApiHealthCheck; timestamp: number }
  > = new Map();

  private readonly CACHE_DURATION = 30000; // 30 seconds

  // ---------- INIT / CONFIGS ----------

  // Initialize API configurations from server
  async initialize(): Promise<void> {
    try {
      const response = await fetch("/api/config");
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.statusText}`);
      }
      const config = await response.json();
      this.configs = config.apis || [];
    } catch (error) {
      console.error("Failed to load API configurations:", error);
      this.configs = [];
    }
  }

  // Get all available APIs
  getApis(): ApiConfig[] {
    return [...this.configs];
  }

  // Get API by name (returns first match) — legacy, unsafe if duplicates exist
  getApi(name: string): ApiConfig | undefined {
    return this.configs.find((api) => api.name === name);
  }

  // Get API by unique ID
  getApiById(id: string): ApiConfig | undefined {
    return this.configs.find((api) => api.id === id);
  }

  // Get API by our composite key (id or name@baseUrl)
  getApiByKey(key: string): ApiConfig | undefined {
    return this.configs.find(
      (a) => (a.id && a.id === key) || `${a.name}@${a.baseUrl}` === key
    );
  }

  // Build a stable cache key for an API
  private cacheKeyFor(api: ApiConfig): string {
    return api.id || `${api.name}@${api.baseUrl}`;
  }

  // ---------- CALLS ----------

  // Preferred: Make API call to specific API by *key*
  async callApiByKey<T = any>(
    apiKey: string,
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const api =
      this.getApiByKey(apiKey) ||
      this.getApiById(apiKey) ||
      this.getApi(apiKey); // last resort (unsafe if duplicates)
    if (!api) {
      throw new Error(`API '${apiKey}' not found`);
    }
    return this.callResolvedApi<T>(api, endpoint, options);
  }

  // Legacy: Make API call to specific API by *name* (first match)
  async callApi<T = any>(
    apiName: string,
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const api = this.getApi(apiName);
    if (!api) {
      throw new Error(`API '${apiName}' not found`);
    }
    return this.callResolvedApi<T>(api, endpoint, options);
  }

  // Internal: perform the actual request
  private async callResolvedApi<T = any>(
    api: ApiConfig,
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const cleanEndpoint = endpoint || "/";

    // Normalize endpoint and prepend /api/{api.name} when needed
    const normalizedEndpoint = cleanEndpoint.startsWith("/")
      ? cleanEndpoint
      : `/${cleanEndpoint}`;

    const url = normalizedEndpoint.startsWith(`/api/${api.name}`)
      ? `${api.baseUrl}${normalizedEndpoint}`
      : `${api.baseUrl}/api/${api.name}${normalizedEndpoint}`;

    const response = await fetch(url, {
      headers: { "Content-Type": "application/json", ...options.headers },
      mode: "cors",
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    // If your APIs sometimes return empty bodies, you might want to guard here
    return response.json();
  }

  // ---------- HEALTH ----------

  // Check health of a specific API by *key* (id or name@baseUrl)
  async checkApiHealthByKey(apiKey: string): Promise<ApiHealthCheck> {
    const api =
      this.getApiByKey(apiKey) ||
      this.getApiById(apiKey) ||
      this.getApi(apiKey); // last resort
    if (!api) {
      return {
        liveness: { status: "error", error: "API not found" },
        readiness: { status: "error", error: "API not found" },
      };
    }
    return this.checkApiHealthForApi(api);
  }

  // Internal: actually ping liveness/readiness for the given api
  private async checkApiHealthForApi(api: ApiConfig): Promise<ApiHealthCheck> {
    const cacheKey = this.cacheKeyFor(api);
    const cached = this.healthCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.CACHE_DURATION) {
      return cached.health;
    }

    try {
      const [livenessResponse, readinessResponse] = await Promise.allSettled([
        fetch(`${api.baseUrl}/api/${api.name}/liveness`, {
          signal: AbortSignal.timeout(5000),
          mode: "cors",
        }),
        fetch(`${api.baseUrl}/api/${api.name}/readiness`, {
          signal: AbortSignal.timeout(5000),
          mode: "cors",
        }),
      ]);

      const liveness =
        livenessResponse.status === "fulfilled" && livenessResponse.value.ok
          ? await livenessResponse.value.json()
          : {
              status: "error",
              error:
                livenessResponse.status === "rejected"
                  ? "Connection failed"
                  : "API error",
            };

      const readiness =
        readinessResponse.status === "fulfilled" && readinessResponse.value.ok
          ? await readinessResponse.value.json()
          : {
              status: "error",
              error:
                readinessResponse.status === "rejected"
                  ? "Connection failed"
                  : "API error",
            };

      const health: ApiHealthCheck = { liveness, readiness };

      this.healthCache.set(cacheKey, { health, timestamp: now });
      return health;
    } catch (error) {
      const errorHealth: ApiHealthCheck = {
        liveness: { status: "error", error: "Connection timeout or network error" },
        readiness: { status: "error", error: "Connection timeout or network error" },
      };
      this.healthCache.set(cacheKey, { health: errorHealth, timestamp: now });
      return errorHealth;
    }
  }

  // Check health of all APIs (each entry uses its own baseUrl)
  async checkAllApisHealth(): Promise<ApiStatus[]> {
    const statuses = await Promise.all(
      this.configs.map(async (api) => {
        const health = await this.checkApiHealthForApi(api);
        const isHealthy = this.isHealthy(health);
        return {
          ...api,
          status: isHealthy ? "healthy" : "unhealthy",
          health,
          lastChecked: new Date(),
        };
      })
    );
    return statuses;
  }

  // More permissive healthy check (accepts ok/ready/alive/pass/healthy/200/UP)
  private isHealthy(health: ApiHealthCheck): boolean {
    const normalize = (v: any) =>
      (typeof v === "string"
        ? v
        : typeof v?.status === "string"
          ? v.status
          : v?.status)?.toString().toLowerCase();

    const okValues = new Set(["ok", "ready", "alive", "pass", "healthy", "200", "up"]);

    const live = normalize(health.liveness);
    const ready = normalize(health.readiness);

    return okValues.has(live) && okValues.has(ready);
  }

  // ---------- CACHE HELPERS ----------

  clearHealthCache(): void {
    this.healthCache.clear();
  }

  // Preferred: get cached health by key (id or name@baseUrl)
  getCachedHealthByKey(apiKey: string): ApiHealthCheck | null {
    const api =
      this.getApiByKey(apiKey) ||
      this.getApiById(apiKey) ||
      this.getApi(apiKey);
    if (!api) return null;

    const cacheKey = this.cacheKeyFor(api);
    const cached = this.healthCache.get(cacheKey);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp >= this.CACHE_DURATION) {
      this.healthCache.delete(cacheKey);
      return null;
    }
    return cached.health;
  }

  // Legacy: get cached health by *name* (first match). Avoid if duplicates exist.
  getCachedHealth(apiName: string): ApiHealthCheck | null {
    const api = this.getApi(apiName);
    if (!api) return null;
    return this.getCachedHealthByKey(this.cacheKeyFor(api));
  }
}

// Export singleton instance
export const apiManager = new ApiManager();
