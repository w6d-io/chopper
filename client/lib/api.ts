// Configuration de l'API externe
export const API_CONFIG = {
  // URL de base de l'API infractions - à configurer selon votre environnement
  BASE_URL: "http://localhost:8000", // Remplacez par l'URL de votre API ou utilisez process.env.VITE_API_BASE_URL dans un environnement de développement

  // Endpoints disponibles
  ENDPOINTS: {
    INFRACTIONS: "/api/infractions",
  },
};

// Types pour l'API (basés sur le nouveau schéma OpenAPI fourni)
export interface Duration {
  ticks: number;
  days: number;
  milliseconds: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
  totalMilliseconds: number;
}

export interface Infraction {
  infractionId: string;
  conducteurId: string;
  nomConducteur: string;
  typeInfractionCode: string;
  typeInfractionLibelle: string;
  causeInfractionLibelle: string;
  dateInfraction: string;
  dureeAutorisee?: Duration | null;
  dureeEffectuee?: Duration | null;
  amendeMontant?: number | null;
}

export interface SummaryRequest {
  typeInfractionLibelles?: InfractionType[] | null;
  startDate?: string | null;
  endDate?: string | null;
  page?: number | null;
  perPage?: number | null;
}

export interface SummaryResponse {
  items: Infraction[];
  pageIndex: number;
  pageCount: number;
  totalCount: number;
  itemsCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ApiResult {
  status: string;
  data?: SummaryResponse | null;
  message?: string | null;
}

export interface HTTPValidationError {
  detail?: Array<{
    loc: Array<string | number>;
    msg: string;
    type: string;
  }>;
}

// Infraction types matching the swagger enum exactly
export const INFRACTION_TYPES = [
  "ContinuousDriving",
  "WeeklyDriving",
  "DailyDriving",
  "WeeklyRest",
  "ReducedWeeklyRest",
  "NonCompensatedReducedWeeklyRest",
  "DailyRest",
  "DrivingTime",
  "BiweeklyDriving",
  "BreakTime",
  "BreakTimeOver6Hours",
  "BreakTimeOver9Hours",
  "RestTime",
  "ServiceTime",
  "WeeklyService",
  "AverageWeeklyService",
  "DailyService",
  "NightServiceTime",
  "FourMonthService",
  "QuarterlyService",
] as const;

export type InfractionType = (typeof INFRACTION_TYPES)[number];

// API call parameters
export interface ApiCallParams {
  method: "GET" | "POST";
  request: SummaryRequest;
  selectedTypes: InfractionType[]; // Pass selected types separately for query params
  tenant: string; // Tenant parameter (header for POST, query for GET)
  headers: {
    Language?: string;
    "X-TOKEN-API"?: string;
  };
}

// Fonction utilitaire pour appeler l'API
export async function callInfractionsAPI(
  params: ApiCallParams,
): Promise<ApiResult> {
  const { method, request, selectedTypes, tenant, headers } = params;

  // Build query string and request headers
  const searchParams = new URLSearchParams();
  const requestHeaders: Record<string, string> = {};

  if (method === "GET") {
    // GET method: all parameters in query string
    searchParams.set("tenant", tenant);

    if (selectedTypes.length > 0) {
      selectedTypes.forEach((type) => {
        searchParams.append("typeInfractionLibelles", type);
      });
    }

    if (request.startDate) {
      searchParams.set("startDate", request.startDate);
    }

    if (request.endDate) {
      searchParams.set("endDate", request.endDate);
    }

    if (request.page !== undefined) {
      searchParams.set("page", request.page.toString());
    }

    if (request.perPage !== undefined) {
      searchParams.set("perPage", request.perPage.toString());
    }

    // Only Language header for GET
    if (headers.Language) {
      requestHeaders["Language"] = headers.Language;
    }
  } else {
    // POST method: data in body, Tenant in header
    requestHeaders["Content-Type"] = "application/json";
    requestHeaders["Tenant"] = tenant;

    if (headers.Language) {
      requestHeaders["Language"] = headers.Language;
    }
  }

  // Add optional X-TOKEN-API header for both methods
  if (headers["X-TOKEN-API"]) {
    requestHeaders["X-TOKEN-API"] = headers["X-TOKEN-API"];
  }

  const queryString = searchParams.toString();
  const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INFRACTIONS}${queryString ? `?${queryString}` : ""}`;

  const fetchOptions: RequestInit = {
    method,
    headers: requestHeaders,
  };

  // Only add body for POST requests
  if (method === "POST") {
    fetchOptions.body = JSON.stringify(request);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    // Gérer les erreurs HTTP
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `API Error: ${response.status} - ${errorData.message || response.statusText}`,
    );
  }

  return response.json();
}
