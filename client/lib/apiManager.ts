import {
  ApiConfig,
  ApiStatus,
  ApiHealthCheck,
  parseApiConfigs,
} from "@shared/apis";

class ApiManager {
  private configs: ApiConfig[] = [];
  private healthCache: Map<
    string,
    { health: ApiHealthCheck; timestamp: number }
  > = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds

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

  // Get API by name (returns first match)
  getApi(name: string): ApiConfig | undefined {
    return this.configs.find((api) => api.name === name);
  }

  // Get API by unique ID
  getApiById(id: string): ApiConfig | undefined {
    return this.configs.find((api) => api.id === id);
  }

  // Check health of a specific API
  async checkApiHealth(apiName: string): Promise<ApiHealthCheck> {
    const cached = this.healthCache.get(apiName);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.CACHE_DURATION) {
      return cached.health;
    }

    const api = this.getApi(apiName);
    if (!api) {
      const errorHealth: ApiHealthCheck = {
        liveness: { status: "error" },
        readiness: { status: "error" },
      };
      return errorHealth;
    }

    try {
      // Make direct calls to the API
      const [livenessResponse, readinessResponse] = await Promise.allSettled([
        fetch(`${api.baseUrl}/api/${apiName}/liveness`, {
          signal: AbortSignal.timeout(5000),
          mode: "cors",
        }),
        fetch(`${api.baseUrl}/api/${apiName}/readiness`, {
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

      // Cache the result
      this.healthCache.set(apiName, { health, timestamp: now });

      return health;
    } catch (error) {
      console.error(`Error checking health for ${apiName}:`, error);
      const errorHealth: ApiHealthCheck = {
        liveness: {
          status: "error",
          error: "Connection timeout or network error",
        },
        readiness: {
          status: "error",
          error: "Connection timeout or network error",
        },
      };

      this.healthCache.set(apiName, { health: errorHealth, timestamp: now });
      return errorHealth;
    }
  }

  // Check health of all APIs
  async checkAllApisHealth(): Promise<ApiStatus[]> {
    const promises = this.configs.map(async (api): Promise<ApiStatus> => {
      const health = await this.checkApiHealth(api.name);
      const isHealthy =
        health.liveness?.status === "ok" &&
        health.readiness?.status === "ready";

      return {
        ...api,
        status: isHealthy ? "healthy" : "unhealthy",
        health,
        lastChecked: new Date(),
      };
    });

    return Promise.all(promises);
  }

  // Make API call to specific API
  async callApi<T = any>(
    apiName: string,
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const api = this.getApi(apiName);
    if (!api) {
      throw new Error(`API '${apiName}' not found`);
    }

    const url = `${api.baseUrl}/api/${apiName}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      mode: "cors",
      ...options,
    });

    if (!response.ok) {
      throw new Error(
        `API call failed: ${response.status} ${response.statusText}`,
      );
    }

    return response.json();
  }

  // Clear health cache
  clearHealthCache(): void {
    this.healthCache.clear();
  }

  // Get cached health for an API
  getCachedHealth(apiName: string): ApiHealthCheck | null {
    const cached = this.healthCache.get(apiName);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp >= this.CACHE_DURATION) {
      this.healthCache.delete(apiName);
      return null;
    }

    return cached.health;
  }
}

// Export singleton instance
export const apiManager = new ApiManager();
