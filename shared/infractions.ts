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
