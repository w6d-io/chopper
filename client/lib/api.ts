// Configuration de l'API externe
export const API_CONFIG = {
  // URL de base de l'API infractions - à configurer selon votre environnement
  BASE_URL:
    "http://localhost:8000", // Remplacez par l'URL de votre API ou utilisez process.env.VITE_API_BASE_URL dans un environnement de développement

  // Endpoints disponibles
  ENDPOINTS: {
    ALL_INFRACTIONS: "/api/all",
  },
};

// Types pour l'API (basés sur le schéma OpenAPI fourni)
export interface Duration {
  ticks?: number | null;
  days?: number | null;
  hours?: number | null;
  milliseconds?: number | null;
  minutes?: number | null;
  seconds?: number | null;
  totalDays?: number | null;
  totalHours?: number | null;
  totalMilliseconds?: number | null;
  totalMinutes?: number | null;
  totalSeconds?: number | null;
}

export interface Infraction {
  infractionId: string;
  conducteurId: string;
  nomConducteur: string;
  permisNumero?: string | null;
  carteConducteurNumeroCarteLong?: string | null;
  typeInfractionCode?: string | null;
  typeInfractionLibelle?: string | null;
  causeInfractionLibelle?: string | null;
  dateInfraction: string;
  dureeAutorisee?: Duration | null;
  dureeEffectuee?: Duration | null;
  reposAutorise?: Duration | null;
  reposEffectue?: Duration | null;
  amenagementAutorise?: Duration | null;
  amenagementEffectue?: Duration | null;
  commentaire?: string | null;
  amendeMontant?: number | null;
  categorieAmende?: string | null;
  lienTexteLoi?: string | null;
}

export interface InfractionRequest {
  per_page?: number;
  type_infraction_libelles?: string | null;
  start_date: string;
  end_date: string;
}

export interface InfractionResponse {
  items: Infraction[];
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ApiResult {
  status: string;
  status_code: number;
  data?: InfractionResponse | null;
  message?: string | null;
}

export interface HTTPValidationError {
  detail?: Array<{
    loc: Array<string | number>;
    msg: string;
    type: string;
  }>;
}

export const INFRACTION_TYPES = [
  "BiweeklyDrivingTime",
  "ContinuousDriving",
  "WeeklyDriving",
  "DailyDriving",
  "WeeklyRest",
  "ReducedWeeklyRest",
  "UncompensatedReducedWeeklyRest",
  "DailyRest",
  "BreakTime",
  "BreakTime6HContinues",
  "BreakTime9HContinues",
  "WeeklyServiceTime",
  "DailyServiceTime",
  "AverageWeeklyServiceTime",
  "FourMonthlyServiceTime",
  "ThreeMonthlyServiceTime",
] as const;

export type InfractionType = (typeof INFRACTION_TYPES)[number];

// Fonction utilitaire pour appeler l'API
export async function callInfractionsAPI(
  request: InfractionRequest,
  page: number = 1,
): Promise<ApiResult> {
  const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ALL_INFRACTIONS}?page=${page}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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
