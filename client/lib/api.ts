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
  dateDebut?: string | null;
  dateFin?: string | null;
  pageIndex?: number | null;
  pageSize?: number | null;
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
  request: SummaryRequest;
  selectedTypes: InfractionType[]; // Pass selected types separately for query params
  queryParams?: {
    order_by_date?: boolean;
    order_desc?: boolean;
  };
  headers: {
    Tenantnamespace: string;
    Language?: string;
    "X-TOKEN-API"?: string;
  };
}

// Fonction utilitaire pour appeler l'API
export async function callInfractionsAPI(
  params: ApiCallParams,
): Promise<ApiResult> {
  const { request, selectedTypes, queryParams, headers } = params;

  // Build query string
  const searchParams = new URLSearchParams();

  // Only add query parameters if we want to override body values
  // According to swagger: query parameters override body values

  // Add selected types as query parameters only if we want to filter
  if (selectedTypes.length > 0) {
    selectedTypes.forEach((type) => {
      searchParams.append("typeInfractionLibelles", type);
    });
  }

  // Add ordering parameters
  if (queryParams?.order_by_date !== undefined) {
    searchParams.set("order_by_date", queryParams.order_by_date.toString());
  }

  if (queryParams?.order_desc !== undefined) {
    searchParams.set("order_desc", queryParams.order_desc.toString());
  }

  const queryString = searchParams.toString();
  const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INFRACTIONS}${queryString ? `?${queryString}` : ""}`;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Tenantnamespace: headers.Tenantnamespace,
  };

  if (headers.Language) {
    requestHeaders["Language"] = headers.Language;
  }

  if (headers["X-TOKEN-API"]) {
    requestHeaders["X-TOKEN-API"] = headers["X-TOKEN-API"];
  }

  const response = await fetch(url, {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    // Gérer les erreurs HTTP
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `API Error: ${response.status} - ${errorData.message || response.statusText}`,
    );
  }

  return response.json();
}
