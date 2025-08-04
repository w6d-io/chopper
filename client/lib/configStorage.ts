// Configuration storage utilities for localStorage
export interface AppConfiguration {
  apiBaseUrl: string;
  tenant: string;
  language: string;
  apiToken: string;
  requestMethod: "GET" | "POST";
  perPage: number;
}

const CONFIG_STORAGE_KEY = "infractions-api-config";

export function saveConfiguration(config: AppConfiguration): void {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.warn("Failed to save configuration to localStorage:", error);
  }
}

export function loadConfiguration(): Partial<AppConfiguration> | null {
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn("Failed to load configuration from localStorage:", error);
  }
  return null;
}

export function clearConfiguration(): void {
  try {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear configuration from localStorage:", error);
  }
}
