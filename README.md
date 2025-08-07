# Chopper API Dashboard

A production-ready multi-API dashboard for monitoring, testing, and managing your API services. Built with React 18, TypeScript, Express, and modern tooling.

![Chopper API Dashboard](public/logo.png)

## Features

- 🔍 **Multi-API Monitoring** - Monitor multiple API services from a single dashboard
- 🧪 **Interactive API Testing** - Test API endpoints with custom headers, body, and authentication
- 📊 **Health Monitoring** - Real-time liveness and readiness checks for all APIs
- 📖 **Documentation Viewer** - Built-in OpenAPI documentation viewer
- 🌍 **Environment Management** - Support for multiple environments (local, staging, production)
- 🔐 **Authentication Support** - Bearer token authentication with secure handling
- 📋 **cURL Generation** - Automatic cURL command generation for easy testing
- ⚡ **Real-time Updates** - Auto-refresh health status every 60 seconds
- 🎨 **Modern UI** - Clean, responsive interface built with Radix UI and TailwindCSS

## Tech Stack

- **Frontend**: React 18 + React Router 6 + TypeScript + Vite + TailwindCSS 3
- **Backend**: Express server with CORS support
- **UI Components**: Radix UI + TailwindCSS + Lucide React icons
- **State Management**: React Hooks + Context
- **Testing**: Vitest
- **Build Tool**: Vite

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chopper-api-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure your APIs**
   Create a `.env` file in the root directory:
   ```env
   API_CONFIGS=infractions:http://localhost:8000:local,oathkeeper:https://api.example.com:production
   DEFAULT_TENANT=business
   DEFAULT_LANGUAGE=en
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:8080`

## Configuration

### Environment Variables

The dashboard is configured using environment variables:

#### API_CONFIGS
Define your APIs using the following format:
```
API_CONFIGS=name:base_url[:label][,name2:base_url2[:label2]]
```

**Examples:**

```env
# Single API
API_CONFIGS=infractions:http://localhost:8000

# Multiple APIs with environments
API_CONFIGS=infractions:http://localhost:8000:local,users:https://api.staging.com:staging,payments:https://api.prod.com:production

# Complex setup
API_CONFIGS=infractions:http://localhost:8000:local,infractions:https://api.staging.com:staging,infractions:https://api.prod.com:production,users:http://localhost:8001:local
```

#### Default Settings
```env
DEFAULT_TENANT=business     # Default tenant for API requests
DEFAULT_LANGUAGE=en         # Default language for API requests
```

### API Requirements

Each configured API should provide these endpoints:

- **`/liveness`** - Health check endpoint (should return `{"status": "ok"}`)
- **`/readiness`** - Readiness check endpoint (should return `{"status": "ready"}`)
- **`/api/{apiname}/*`** - Main API endpoints
- **`/api/{apiname}/openapi.json`** - OpenAPI specification (optional but recommended)

**Example API Structure:**
```
https://api.example.com
├── /liveness                           # Health check
├── /readiness                          # Readiness check
├── /api/infractions/                   # Main API endpoints
├── /api/infractions/openapi.json       # Documentation
└── /api/infractions/search             # Specific endpoints
```

## Usage

### 1. API Overview

The **Overview** tab shows:
- Total number of configured APIs
- Health status summary (healthy/unhealthy count)
- Last check timestamp
- Individual API status cards with health indicators

### 2. API Testing

The **API Tester** tab allows you to:

1. **Select an API** from the dropdown
2. **Choose HTTP method** (GET/POST)
3. **Enter endpoint path** (e.g., `/api/infractions/search` or just `/search`)
4. **Add authentication** with Bearer tokens
5. **Customize headers** (JSON format)
6. **Add request body** for POST requests (JSON format)
7. **Execute requests** and view responses
8. **Copy cURL commands** for external testing

#### Specialized Infractions API Interface

For APIs named "infractions", the dashboard provides a specialized interface with:
- Date range picker
- Tenant and language selection
- Per-page results configuration
- Infraction type filters
- Automatic request body generation

### 3. Documentation

The **Documentation** tab provides:
- OpenAPI specification viewer
- Interactive endpoint documentation
- Request/response schemas
- Example payloads
- Parameter details

### 4. Configuration (Production Mode)

In production mode, the **Settings** tab shows:
- Environment configuration examples
- API endpoint structure requirements
- Setup instructions
- Current configuration status

## API Endpoint Patterns

The dashboard supports flexible endpoint patterns:

### Option 1: Full API Path
```
Input: /api/infractions/search
Result: https://api.example.com/api/infractions/search
```

### Option 2: Relative Path (Recommended)
```
Input: /search
Result: https://api.example.com/api/infractions/search
```

### Option 3: Root Path
```
Input: /
Result: https://api.example.com/api/infractions/
```

## Authentication

### Bearer Tokens
- Enter Bearer tokens in the dedicated field in the API Tester
- Tokens are automatically added as `Authorization: Bearer <token>` headers
- **Security Note**: Tokens are only stored in memory, never persisted

### Custom Headers
Add custom authentication headers in the Headers JSON field:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer your-token-here",
  "X-API-Key": "your-api-key",
  "Tenant": "business",
  "Language": "en"
}
```

## Development

### Project Structure

```
├── client/                    # React frontend
│   ├── components/           # Reusable components
│   │   ├── ui/              # UI component library
│   │   ├── ApiDashboard.tsx # Main dashboard component
│   │   └── ApiSelector.tsx  # API selection component
│   ├── lib/                 # Utilities and managers
│   │   ├── apiManager.ts    # API management logic
│   │   └── utils.ts         # Helper functions
│   ├── pages/               # Route components
│   └── App.tsx             # Main app component
├── server/                  # Express backend
│   ├── routes/             # API route handlers
│   └── index.ts           # Server setup
├── shared/                 # Shared types and utilities
└── public/                # Static assets
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run typecheck    # TypeScript validation
npm run format.fix   # Format code with Prettier
```

### Adding New Features

#### Adding a New API Route
1. Create handler in `server/routes/your-route.ts`
2. Register route in `server/index.ts`
3. Add shared types in `shared/api.ts` (optional)

#### Adding New UI Components
1. Create component in `client/components/`
2. Follow existing patterns using Radix UI + TailwindCSS
3. Use the `cn()` utility for conditional classes

### Testing APIs

#### Health Check Testing
```bash
# Test liveness
curl http://localhost:8080/liveness

# Test readiness
curl http://localhost:8080/readiness
```

#### API Configuration Testing
```bash
# Get current configuration
curl http://localhost:8080/api/config
```

## Production Deployment

### Build and Deploy

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   ```env
   NODE_ENV=production
   API_CONFIGS=your-production-apis
   DEFAULT_TENANT=production-tenant
   DEFAULT_LANGUAGE=en
   ```

3. **Start the production server**
   ```bash
   npm start
   ```

### Docker Deployment

A Dockerfile is included for containerized deployment:

```bash
# Build image
docker build -t chopper-api-dashboard .

# Run container
docker run -p 8080:8080 \
  -e API_CONFIGS="infractions:https://api.prod.com:production" \
  -e DEFAULT_TENANT="business" \
  chopper-api-dashboard
```

### Environment-Specific Configurations

#### Development
```env
API_CONFIGS=infractions:http://localhost:8000:local,users:http://localhost:8001:local
DEFAULT_TENANT=business
DEFAULT_LANGUAGE=en
```

#### Staging
```env
API_CONFIGS=infractions:https://api.staging.com:staging,users:https://users.staging.com:staging
DEFAULT_TENANT=staging
DEFAULT_LANGUAGE=en
```

#### Production
```env
API_CONFIGS=infractions:https://api.prod.com:production,users:https://users.prod.com:production
DEFAULT_TENANT=production
DEFAULT_LANGUAGE=en
```

## Troubleshooting

### Common Issues

#### APIs Showing as Unhealthy
1. Check that your APIs provide `/liveness` and `/readiness` endpoints
2. Verify the API base URLs are accessible
3. Ensure CORS is properly configured on your APIs
4. Check browser network tab for specific error details

#### Authentication Errors
1. Verify Bearer tokens are correct and active
2. Check that APIs accept the `Authorization` header
3. Ensure tokens have necessary permissions

#### Configuration Issues
1. Restart server after changing environment variables
2. Verify `API_CONFIGS` format is correct
3. Check server logs for configuration parsing errors

#### CORS Issues
```javascript
// Example API CORS setup (Express)
app.use(cors({
  origin: ['http://localhost:8080', 'https://your-dashboard-domain.com'],
  credentials: true
}));
```

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=1
LOG_LEVEL=debug
```

## Security Considerations

- **Bearer Tokens**: Never commit tokens to version control
- **Environment Variables**: Use secure storage for production secrets
- **CORS**: Configure APIs with appropriate CORS policies
- **HTTPS**: Use HTTPS in production for all API communications
- **Secrets**: Set secrets via environment variables, not in code

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Check the troubleshooting section above
- Review the configuration examples
- Check server logs for detailed error messages
- Open an issue on the repository

---

**Built with ❤️ using React, TypeScript, and Express**
