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
    "openapi": "3.1.0",
    "info": {
      "title": "Demo Strada API",
      "description": "Multi‑tenant proxy over Strada Time infractions endpoints (Demo).",
      "version": "0.1.0"
    },
    "paths": {
      "/api/infractions": {
        "post": {
          "tags": ["Infractions"],
          "summary": "Get infractions summary (POST, only body)",
          "description": "Get a paginated summary of infractions by label (POST).",
          "operationId": "summary_post_api_infractions_post",
          "parameters": [
            {
              "name": "Language",
              "in": "header",
              "required": false,
              "schema": {
                "type": "string",
                "default": "en"
              }
            },
            {
              "name": "Tenant",
              "in": "header",
              "required": false,
              "schema": {
                "type": "string",
                "default": "business"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/SummaryRequest"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successful Response"
            }
          }
        }
      }
    },
    "components": {
      "schemas": {
        "SummaryRequest": {
          "type": "object",
          "properties": {
            "typeInfractionLibelles": {
              "type": "array",
              "items": { "type": "string" }
            },
            "startDate": { "type": "string" },
            "endDate": { "type": "string" },
            "page": { "type": "integer", "default": 0 },
            "perPage": { "type": "integer", "default": 100 }
          }
        }
      }
    }
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
          amendeMontant: 150.0
        },
        {
          infractionId: "demo-002",
          conducteurId: "driver-002",
          nomConducteur: "Jane Smith",
          typeInfractionCode: "WeeklyRest",
          typeInfractionLibelle: "Weekly Rest",
          causeInfractionLibelle: "Insufficient weekly rest period",
          dateInfraction: "2024-01-14T08:15:00Z",
          amendeMontant: 200.0
        }
      ],
      page: 0,
      pageCount: 1,
      totalCount: 2,
      itemsCount: 2,
      hasPreviousPage: false,
      hasNextPage: false
    }
  };

  res.json(mockResponse);
};
