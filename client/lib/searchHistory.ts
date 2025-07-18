import { InfractionRequest } from "./api";

export interface SearchHistoryItem {
  id: string;
  timestamp: number;
  query: InfractionRequest;
  selectedTypes: string[];
  dateRange: {
    from: Date;
    to: Date;
  };
  resultsCount?: number;
  label?: string; // User-friendly label for the search
}

const STORAGE_KEY = "infractions_search_history";
const MAX_HISTORY_ITEMS = 20;

// Generate a user-friendly label for a search
export function generateSearchLabel(item: SearchHistoryItem): string {
  const fromDate = new Date(item.dateRange.from).toLocaleDateString();
  const toDate = new Date(item.dateRange.to).toLocaleDateString();
  const typesCount = item.selectedTypes.length;

  let label = `${fromDate} - ${toDate}`;

  if (typesCount > 0) {
    if (typesCount === 1) {
      label += ` (${item.selectedTypes[0]})`;
    } else {
      label += ` (${typesCount} types)`;
    }
  } else {
    label += " (All types)";
  }

  if (item.resultsCount !== undefined) {
    label += ` - ${item.resultsCount} results`;
  }

  return label;
}

// Load search history from localStorage
export function loadSearchHistory(): SearchHistoryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return parsed.map((item: any) => ({
      ...item,
      dateRange: {
        from: new Date(item.dateRange.from),
        to: new Date(item.dateRange.to),
      },
    }));
  } catch (error) {
    console.error("Error loading search history:", error);
    return [];
  }
}

// Save search history to localStorage
export function saveSearchHistory(history: SearchHistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Error saving search history:", error);
  }
}

// Add a new search to history
export function addToSearchHistory(
  query: InfractionRequest,
  selectedTypes: string[],
  dateRange: { from: Date; to: Date },
  resultsCount?: number,
): SearchHistoryItem[] {
  const history = loadSearchHistory();

  const newItem: SearchHistoryItem = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    query,
    selectedTypes,
    dateRange,
    resultsCount,
  };

  // Add label
  newItem.label = generateSearchLabel(newItem);

  // Check if this search already exists (avoid duplicates)
  const isDuplicate = history.some(
    (item) =>
      JSON.stringify(item.query) === JSON.stringify(query) &&
      JSON.stringify(item.selectedTypes) === JSON.stringify(selectedTypes) &&
      item.dateRange.from.getTime() === dateRange.from.getTime() &&
      item.dateRange.to.getTime() === dateRange.to.getTime(),
  );

  if (!isDuplicate) {
    // Add to beginning of array (most recent first)
    history.unshift(newItem);

    // Keep only the most recent items
    const limitedHistory = history.slice(0, MAX_HISTORY_ITEMS);

    saveSearchHistory(limitedHistory);
    return limitedHistory;
  }

  return history;
}

// Remove a specific search from history
export function removeFromSearchHistory(id: string): SearchHistoryItem[] {
  const history = loadSearchHistory();
  const filteredHistory = history.filter((item) => item.id !== id);
  saveSearchHistory(filteredHistory);
  return filteredHistory;
}

// Clear all search history
export function clearSearchHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Get recent searches (last 5)
export function getRecentSearches(): SearchHistoryItem[] {
  return loadSearchHistory().slice(0, 5);
}
