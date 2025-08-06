import { RequestHandler } from "express";
import { parseApiConfigs } from "@shared/apis";

export const handleConfig: RequestHandler = (req, res) => {
  try {
    const apiConfigString = process.env.API_CONFIGS || '';
    const apis = parseApiConfigs(apiConfigString);
    
    const config = {
      apis,
      defaults: {
        tenant: process.env.DEFAULT_TENANT || 'business',
        language: process.env.DEFAULT_LANGUAGE || 'en',
      }
    };

    res.json(config);
  } catch (error) {
    console.error('Error loading API configuration:', error);
    res.status(500).json({
      error: 'Failed to load API configuration',
      apis: [],
      defaults: {
        tenant: 'business',
        language: 'en',
      }
    });
  }
};
