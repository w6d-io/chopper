import { RequestHandler } from "express";

// Demo liveness endpoint
export const handleDemoLiveness: RequestHandler = (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: "Demo Infractions API",
  });
};

// Demo readiness endpoint
export const handleDemoReadiness: RequestHandler = (req, res) => {
  res.json({
    status: "ready",
    timestamp: new Date().toISOString(),
    checks: {
      database: "ok",
      upstream_api: "ok",
    },
  });
};

// Demo OpenAPI spec endpoint
export const handleDemoOpenApi: RequestHandler = (req, res) => {
  const openApiSpec = {
    openapi: "3.1.0",
    info: {
      title: "Infractions API",
      description:
        "Multi‑tenant API for retrieving driving infractions data. Supports both GET and POST methods with comprehensive filtering options.",
      version: "1.0.0",
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:8000",
        description: "Development server",
      },
    ],
    paths: {
      "/api/infractions": {
        get: {
          tags: ["Infractions"],
          summary: "Get infractions summary (GET with query parameters)",
          description:
            "Retrieve paginated infractions data using query parameters. All parameters are optional except tenant.",
          operationId: "getInfractions",
          parameters: [
            {
              name: "tenant",
              in: "query",
              required: true,
              description: "Tenant identifier (e.g., 'premium', 'business')",
              schema: {
                type: "string",
                example: "premium",
              },
            },
            {
              name: "typeInfractionLibelles",
              in: "query",
              required: false,
              description: "Filter by specific infraction types. Can be specified multiple times.",
              style: "form",
              explode: true,
              schema: {
                type: "array",
                items: {
                  type: "string",
                  enum: [
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
                  ],
                },
              },
            },
            {
              name: "startDate",
              in: "query",
              required: false,
              description: "Start date for filtering infractions (ISO 8601 format)",
              schema: {
                type: "string",
                format: "date-time",
                example: "2024-08-06T14:25:04.078Z",
              },
            },
            {
              name: "endDate",
              in: "query",
              required: false,
              description: "End date for filtering infractions (ISO 8601 format)",
              schema: {
                type: "string",
                format: "date-time",
                example: "2025-08-06T14:25:04.078Z",
              },
            },
            {
              name: "page",
              in: "query",
              required: false,
              description: "Page number (0-based)",
              schema: {
                type: "integer",
                minimum: 0,
                default: 0,
                example: 0,
              },
            },
            {
              name: "perPage",
              in: "query",
              required: false,
              description: "Number of items per page",
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                default: 10,
                example: 10,
              },
            },
            {
              name: "Language",
              in: "header",
              required: false,
              description: "Response language preference",
              schema: {
                type: "string",
                enum: ["en", "fr", "es"],
                default: "en",
              },
            },
            {
              name: "Authorization",
              in: "header",
              required: false,
              description: "Bearer token for authentication",
              schema: {
                type: "string",
                example: "Bearer your-token-here",
              },
            },
          ],
          responses: {
            "200": {
              description: "Successful response with infractions data",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/InfractionsResponse",
                  },
                },
              },
            },
            "400": {
              description: "Bad Request - Invalid parameters",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                },
              },
            },
            "401": {
              description: "Unauthorized - Invalid or missing token",
            },
            "404": {
              description: "No infractions found for the given criteria",
            },
            "422": {
              description: "Validation Error",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ValidationError",
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Infractions"],
          summary: "Get infractions summary (POST with request body)",
          description:
            "Retrieve paginated infractions data using a JSON request body. Provides the same functionality as GET but with request body parameters.",
          operationId: "postInfractions",
          parameters: [
            {
              name: "Language",
              in: "header",
              required: false,
              description: "Response language preference",
              schema: {
                type: "string",
                enum: ["en", "fr", "es"],
                default: "en",
              },
            },
            {
              name: "Tenant",
              in: "header",
              required: true,
              description: "Tenant identifier",
              schema: {
                type: "string",
                example: "premium",
              },
            },
            {
              name: "Authorization",
              in: "header",
              required: false,
              description: "Bearer token for authentication",
              schema: {
                type: "string",
                example: "Bearer your-token-here",
              },
            },
          ],
          requestBody: {
            required: true,
            description: "Request parameters for filtering infractions",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SummaryRequest",
                },
                examples: {
                  basicExample: {
                    summary: "Basic request with date range",
                    value: {
                      startDate: "2024-08-06T14:25:04.078Z",
                      endDate: "2025-08-06T14:25:04.078Z",
                      page: 0,
                      perPage: 10,
                    },
                  },
                  filteredExample: {
                    summary: "Filtered request with specific infraction types",
                    value: {
                      typeInfractionLibelles: [
                        "ContinuousDriving",
                        "WeeklyDriving",
                        "DailyDriving",
                      ],
                      startDate: "2024-08-06T14:25:04.078Z",
                      endDate: "2025-08-06T14:25:04.078Z",
                      page: 0,
                      perPage: 25,
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Successful response with infractions data",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/InfractionsResponse",
                  },
                },
              },
            },
            "400": {
              description: "Bad Request",
            },
            "401": {
              description: "Unauthorized",
            },
            "404": {
              description: "No infractions found",
            },
            "422": {
              description: "Validation Error",
            },
          },
        },
      },
    },
    components: {
      schemas: {
        SummaryRequest: {
          type: "object",
          description: "Request parameters for filtering infractions",
          properties: {
            typeInfractionLibelles: {
              type: "array",
              description: "List of infraction types to filter by",
              items: {
                type: "string",
                enum: [
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
                ],
              },
              nullable: true,
            },
            startDate: {
              type: "string",
              format: "date-time",
              description: "Start date for filtering (ISO 8601 format)",
              example: "2024-08-06T14:25:04.078Z",
              nullable: true,
            },
            endDate: {
              type: "string",
              format: "date-time",
              description: "End date for filtering (ISO 8601 format)",
              example: "2025-08-06T14:25:04.078Z",
              nullable: true,
            },
            page: {
              type: "integer",
              description: "Page number (0-based)",
              minimum: 0,
              default: 0,
              example: 0,
              nullable: true,
            },
            perPage: {
              type: "integer",
              description: "Number of items per page",
              minimum: 1,
              maximum: 100,
              default: 10,
              example: 10,
              nullable: true,
            },
          },
        },
        InfractionsResponse: {
          type: "object",
          description: "Response containing infractions data",
          properties: {
            items: {
              type: "array",
              description: "List of infractions",
              items: {
                $ref: "#/components/schemas/Infraction",
              },
            },
            pageIndex: {
              type: "integer",
              description: "Current page index (0-based)",
              example: 0,
            },
            pageCount: {
              type: "integer",
              description: "Total number of pages",
              example: 5,
            },
            totalCount: {
              type: "integer",
              description: "Total number of infractions",
              example: 47,
            },
            itemsCount: {
              type: "integer",
              description: "Number of items in current page",
              example: 10,
            },
            hasPreviousPage: {
              type: "boolean",
              description: "Whether there is a previous page",
              example: false,
            },
            hasNextPage: {
              type: "boolean",
              description: "Whether there is a next page",
              example: true,
            },
          },
          required: [
            "items",
            "pageIndex",
            "pageCount",
            "totalCount",
            "itemsCount",
            "hasPreviousPage",
            "hasNextPage",
          ],
        },
        Infraction: {
          type: "object",
          description: "Individual infraction record",
          properties: {
            infractionId: {
              type: "string",
              description: "Unique identifier for the infraction",
              example: "inf-12345",
            },
            conducteurId: {
              type: "string",
              description: "Driver identifier",
              example: "driver-001",
            },
            nomConducteur: {
              type: "string",
              description: "Driver name",
              example: "John Doe",
            },
            typeInfractionCode: {
              type: "string",
              description: "Infraction type code",
              example: "DailyDriving",
            },
            typeInfractionLibelle: {
              type: "string",
              description: "Human-readable infraction type",
              example: "Daily Driving",
            },
            causeInfractionLibelle: {
              type: "string",
              description: "Cause of the infraction",
              example: "Exceeded daily driving limit",
            },
            dateInfraction: {
              type: "string",
              format: "date-time",
              description: "Date and time when the infraction occurred",
              example: "2024-01-15T10:30:00Z",
            },
            dureeAutorisee: {
              $ref: "#/components/schemas/Duration",
              description: "Authorized duration",
              nullable: true,
            },
            dureeEffectuee: {
              $ref: "#/components/schemas/Duration",
              description: "Actual duration performed",
              nullable: true,
            },
            amendeMontant: {
              type: "number",
              format: "decimal",
              description: "Fine amount in euros",
              example: 150.0,
              nullable: true,
            },
            permisNumero: {
              type: "string",
              description: "Driver license number",
              example: "DL123456789",
              nullable: true,
            },
          },
          required: [
            "infractionId",
            "conducteurId",
            "nomConducteur",
            "typeInfractionCode",
            "typeInfractionLibelle",
            "causeInfractionLibelle",
            "dateInfraction",
          ],
        },
        Duration: {
          type: "object",
          description: "Duration object with various time units",
          properties: {
            ticks: {
              type: "integer",
              format: "int64",
              description: "Duration in ticks",
            },
            days: {
              type: "integer",
              description: "Number of days",
            },
            milliseconds: {
              type: "integer",
              description: "Milliseconds component",
            },
            hours: {
              type: "integer",
              description: "Hours component",
            },
            minutes: {
              type: "integer",
              description: "Minutes component",
            },
            seconds: {
              type: "integer",
              description: "Seconds component",
            },
            totalDays: {
              type: "number",
              format: "double",
              description: "Total duration in days",
            },
            totalHours: {
              type: "number",
              format: "double",
              description: "Total duration in hours",
            },
            totalMinutes: {
              type: "number",
              format: "double",
              description: "Total duration in minutes",
            },
            totalSeconds: {
              type: "number",
              format: "double",
              description: "Total duration in seconds",
            },
            totalMilliseconds: {
              type: "number",
              format: "double",
              description: "Total duration in milliseconds",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          description: "Error response",
          properties: {
            status: {
              type: "string",
              example: "error",
            },
            status_code: {
              type: "integer",
              example: 400,
            },
            message: {
              type: "string",
              example: "Invalid request parameters",
            },
            data: {
              type: "object",
              nullable: true,
            },
          },
        },
        ValidationError: {
          type: "object",
          description: "Validation error details",
          properties: {
            detail: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  loc: {
                    type: "array",
                    items: {
                      oneOf: [{ type: "string" }, { type: "integer" }],
                    },
                    description: "Location of the error",
                  },
                  msg: {
                    type: "string",
                    description: "Error message",
                  },
                  type: {
                    type: "string",
                    description: "Error type",
                  },
                },
                required: ["loc", "msg", "type"],
              },
            },
          },
        },
      },
    },
  };

  res.json(openApiSpec);
};

// Demo infractions data endpoint
export const handleDemoInfractions: RequestHandler = (req, res) => {
  // Mock data response
  const mockResponse = {
    status: "success",
    data: {
      items: [
        {
          infractionId: "demo-001",
          conducteurId: "driver-001",
          nomConducteur: "John Doe",
          typeInfractionCode: "DailyDriving",
          typeInfractionLibelle: "Daily Driving",
          causeInfractionLibelle: "Exceeded daily driving limit",
          dateInfraction: "2024-01-15T10:30:00Z",
          amendeMontant: 150.0,
        },
        {
          infractionId: "demo-002",
          conducteurId: "driver-002",
          nomConducteur: "Jane Smith",
          typeInfractionCode: "WeeklyRest",
          typeInfractionLibelle: "Weekly Rest",
          causeInfractionLibelle: "Insufficient weekly rest period",
          dateInfraction: "2024-01-14T08:15:00Z",
          amendeMontant: 200.0,
        },
      ],
      page: 0,
      pageCount: 1,
      totalCount: 2,
      itemsCount: 2,
      hasPreviousPage: false,
      hasNextPage: false,
    },
  };

  res.json(mockResponse);
};
