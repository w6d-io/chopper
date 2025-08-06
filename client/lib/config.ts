// Configuration utilities for accessing build-time environment variables
import { parseApiConfigs } from "@shared/apis";

export interface AppConfig {
  apis: ReturnType<typeof parseApiConfigs>;
  defaults: {
    tenant: string;
    language: string;
  };
}

// Get the application configuration from build-time environment variables
export function getAppConfig(): AppConfig {
  return {
    apis: parseApiConfigs(__API_CONFIGS__),
    defaults: {
      tenant: __DEFAULT_TENANT__,
      language: __DEFAULT_LANGUAGE__,
    },
  };
}

// Get default values for common configuration
export function getDefaults() {
  return {
    tenant: __DEFAULT_TENANT__,
    language: __DEFAULT_LANGUAGE__,
  };
}
