import { RequestHandler } from "express";
import {
  ApiResult,
  InfractionRequest,
  InfractionResponse,
  Infraction,
  INFRACTION_TYPES,
} from "@shared/infractions";

// Mock data generator for demonstration
function generateMockInfraction(id: number): Infraction {
  const types = [...INFRACTION_TYPES];
  const randomType = types[Math.floor(Math.random() * types.length)];
  const drivers = [
    "Jean Dupont",
    "Marie Martin",
    "Pierre Bernard",
    "Sophie Durand",
    "Lucas Moreau",
    "Emma Laurent",
    "Thomas Leroy",
    "Camille Dubois",
  ];
  const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - Math.floor(Math.random() * 90));

  return {
    infractionId: `inf-${id.toString().padStart(6, "0")}`,
    conducteurId: `drv-${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`,
    nomConducteur: randomDriver,
    permisNumero: `${Math.floor(Math.random() * 90000) + 10000}`,
    carteConducteurNumeroCarteLong: `${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    typeInfractionCode: randomType.substring(0, 3).toUpperCase(),
    typeInfractionLibelle: randomType,
    causeInfractionLibelle: "Dépassement de temps autorisé",
    dateInfraction: baseDate.toISOString(),
    dureeAutorisee: {
      totalHours: 9,
      hours: 9,
      minutes: 0,
    },
    dureeEffectuee: {
      totalHours: 9 + Math.random() * 3,
      hours: Math.floor(9 + Math.random() * 3),
      minutes: Math.floor(Math.random() * 60),
    },
    reposAutorise: {
      totalHours: 11,
      hours: 11,
      minutes: 0,
    },
    reposEffectue: {
      totalHours: Math.max(8, 11 - Math.random() * 3),
      hours: Math.floor(Math.max(8, 11 - Math.random() * 3)),
      minutes: Math.floor(Math.random() * 60),
    },
    commentaire: Math.random() > 0.7 ? "Infraction récurrente" : null,
    amendeMontant:
      Math.random() > 0.3 ? Math.floor(Math.random() * 500) + 100 : null,
    categorieAmende: Math.random() > 0.3 ? "Classe 4" : null,
    lienTexteLoi:
      "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006074228/",
  };
}

export const handleInfractions: RequestHandler = (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const body = req.body as InfractionRequest;

    // Validate required fields
    if (!body.start_date || !body.end_date) {
      const result: ApiResult = {
        status: "error",
        status_code: 404,
        message: "start_date and end_date are required",
      };
      return res.status(404).json(result);
    }

    // Validate date range
    const startDate = new Date(body.start_date);
    const endDate = new Date(body.end_date);

    if (startDate > endDate) {
      const result: ApiResult = {
        status: "error",
        status_code: 404,
        message: "start_date cannot be greater than end_date",
      };
      return res.status(404).json(result);
    }

    // Parse infraction types filter
    const selectedTypes = body.type_infraction_libelles
      ? body.type_infraction_libelles.split(",").filter(Boolean)
      : [];

    // Generate mock data based on filters
    const perPage = Math.min(body.per_page || 10, 100);
    const totalItems = Math.floor(Math.random() * 500) + 50; // Random total between 50-550
    const totalPages = Math.ceil(totalItems / perPage);

    // Generate items for current page
    const startIndex = (page - 1) * perPage;
    const items: Infraction[] = [];

    for (let i = 0; i < perPage && startIndex + i < totalItems; i++) {
      const infraction = generateMockInfraction(startIndex + i + 1);

      // Apply type filter if specified
      if (selectedTypes.length > 0) {
        if (!selectedTypes.includes(infraction.typeInfractionLibelle || "")) {
          continue;
        }
      }

      // Apply date filter
      const infractionDate = new Date(infraction.dateInfraction);
      if (infractionDate < startDate || infractionDate > endDate) {
        continue;
      }

      items.push(infraction);
    }

    const response: InfractionResponse = {
      items,
      page,
      per_page: perPage,
      total_items: totalItems,
      total_pages: totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    };

    const result: ApiResult = {
      status: "success",
      status_code: 200,
      data: response,
      message: `Found ${totalItems} infractions`,
    };

    res.json(result);
  } catch (error) {
    console.error("Error in infractions endpoint:", error);
    const result: ApiResult = {
      status: "error",
      status_code: 500,
      message: "Internal server error",
    };
    res.status(500).json(result);
  }
};
