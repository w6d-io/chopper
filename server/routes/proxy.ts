import { RequestHandler } from "express";
import { parseApiConfigs, isValidApiName } from "../../shared/apis";

// Create a proxy handler for API requests
export const createApiProxy: RequestHandler = async (req, res) => {
  const { apiname, "*": path } = req.params;

  try {
    // Load API configurations
    const apiConfigString = process.env.API_CONFIGS || "";
    const apiConfigs = parseApiConfigs(apiConfigString);

    // Validate API name
    if (!isValidApiName(apiname, apiConfigs)) {
      return res.status(404).json({
        status: "error",
        status_code: 404,
        message: `API '${apiname}' not found. Available APIs: ${apiConfigs.map((c) => c.name).join(", ")}`,
        data: null,
        api: apiname,
      });
    }

    // Find the API configuration
    const apiConfig = apiConfigs.find((config) => config.name === apiname);
    if (!apiConfig) {
      return res.status(404).json({
        status: "error",
        status_code: 404,
        message: `API configuration for '${apiname}' not found`,
        data: null,
        api: apiname,
      });
    }

    // Construct the target URL
    // We append the endpoint path directly to the base URL
    // The path already includes the necessary structure
    const targetPath = path ? `/${path}` : "";
    const targetUrl = `${apiConfig.baseUrl}/api/${apiname}${targetPath}`;

    // Prepare headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Forward authorization header if present
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    // Forward custom headers (tenant, language, etc.)
    if (req.headers.tenant) {
      headers.Tenant = req.headers.tenant as string;
    }
    if (req.headers.language) {
      headers.Language = req.headers.language as string;
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method: req.method,
      headers,
    };

    // Include body for POST, PUT, PATCH requests
    if (["POST", "PUT", "PATCH"].includes(req.method) && req.body) {
      requestOptions.body = JSON.stringify(req.body);
    }

    // Add query parameters for GET requests
    let finalUrl = targetUrl;
    if (req.method === "GET" && Object.keys(req.query).length > 0) {
      const queryString = new URLSearchParams(
        req.query as Record<string, string>,
      ).toString();
      finalUrl = `${targetUrl}${targetUrl.includes("?") ? "&" : "?"}${queryString}`;
    }

    console.log(`Proxying ${req.method} ${req.originalUrl} -> ${finalUrl}`);

    // Make the request to the target API
    const response = await fetch(finalUrl, requestOptions);
    const responseData = await response.json();

    // Forward the response
    res.status(response.status).json({
      status: response.ok ? "success" : "error",
      status_code: response.status,
      message: response.statusText,
      data: responseData,
      api: apiname,
    });
  } catch (error) {
    console.error(`Error proxying request to ${apiname}:`, error);

    let errorMessage = "Internal server error";
    if (error instanceof Error) {
      if (error.message.includes("fetch")) {
        errorMessage = `Failed to connect to ${apiname} API`;
      } else {
        errorMessage = error.message;
      }
    }

    res.status(500).json({
      status: "error",
      status_code: 500,
      message: errorMessage,
      data: null,
      api: apiname,
    });
  }
};
