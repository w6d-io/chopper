import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Code,
  Settings,
  FileText,
  Send,
  Copy,
  Activity,
  CalendarIcon,
} from "lucide-react";
import { ApiDashboard } from "@/components/ApiDashboard";
import { ApiSelector } from "@/components/ApiSelector";
import { apiManager } from "@/lib/apiManager";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { format, addDays } from "date-fns";

// Infraction types for the specialized interface
const INFRACTION_TYPES = [
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

type InfractionType = (typeof INFRACTION_TYPES)[number];

export default function MultiApiDashboard() {
  const [selectedApi, setSelectedApi] = useState<string>("");
  const [activeTab, setActiveTab] = useState("overview");
  const [requestEndpoint, setRequestEndpoint] = useState("");
  const [requestMethod, setRequestMethod] = useState<"GET" | "POST">("POST");
  const [requestHeaders, setRequestHeaders] = useState(`{
  "Content-Type": "application/json",
  "Tenant": "business",
  "Language": "en"
}`);
  const [requestBody, setRequestBody] = useState(`{
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z",
  "page": 0,
  "perPage": 10
}`);
  const [bearerToken, setBearerToken] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Infractions-specific state
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [selectedTypes, setSelectedTypes] = useState<InfractionType[]>([]);
  const [tenant, setTenant] = useState("premium");
  const [language, setLanguage] = useState("en");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);

  // Documentation state
  const [openApiSpec, setOpenApiSpec] = useState<any>(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // Auto-select first API on mount and update endpoint
  useEffect(() => {
    const initializeApi = async () => {
      await apiManager.initialize();
      const apis = apiManager.getApis();
      if (apis.length > 0 && !selectedApi) {
        setSelectedApi(apis[0].id || apis[0].name);
      }
    };
    initializeApi();
  }, [selectedApi]);

  // Update endpoint when selectedApi changes
  useEffect(() => {
    if (selectedApi) {
      const api =
        apiManager.getApiById(selectedApi) || apiManager.getApi(selectedApi);
      if (api) {
        // Pre-fill with the API pattern if endpoint is empty
        if (!requestEndpoint) {
          setRequestEndpoint(`/api/${api.name}/`);
        }
      }
    }
  }, [selectedApi]);

  const makeApiRequest = async () => {
    if (!selectedApi) {
      toast.error("Please select an API");
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      // Parse headers
      let headers: Record<string, string> = {};
      try {
        headers = JSON.parse(requestHeaders);
      } catch {
        toast.error("Invalid JSON in headers");
        return;
      }

      // Add Bearer token if provided
      if (bearerToken.trim()) {
        headers.Authorization = `Bearer ${bearerToken.trim()}`;
      }

      // Prepare request options
      const options: RequestInit = {
        method: requestMethod,
        headers,
      };

      // Add body for POST requests
      if (requestMethod === "POST" && requestBody.trim()) {
        try {
          JSON.parse(requestBody); // Validate JSON
          options.body = requestBody;
        } catch {
          toast.error("Invalid JSON in request body");
          return;
        }
      }

      // Get the actual API name from the selected API ID
      const api =
        apiManager.getApiById(selectedApi) || apiManager.getApi(selectedApi);
      if (!api) {
        toast.error("Selected API not found");
        return;
      }

      // Make the request through our API manager
      const result = await apiManager.callApi(
        api.name,
        requestEndpoint,
        options,
      );
      setResponse(result);
      setActiveTab("tester"); // Switch to tester tab to show results
      toast.success("Request completed successfully");
    } catch (error) {
      console.error("API request failed:", error);
      setResponse({
        error: true,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
      toast.error("Request failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Infractions-specific helper functions
  const handleTypeToggle = (type: InfractionType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const selectAllTypes = () => {
    setSelectedTypes([...INFRACTION_TYPES]);
    toast.success("All infraction types selected");
  };

  const deselectAllTypes = () => {
    setSelectedTypes([]);
    toast.success("All infraction types deselected");
  };

  const updateInfractionsRequestBody = () => {
    const requestBody = {
      typeInfractionLibelles: selectedTypes.length > 0 ? selectedTypes : null,
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString(),
      page: currentPage,
      perPage: perPage,
    };
    setRequestBody(JSON.stringify(requestBody, null, 2));
  };

  const updateInfractionsHeaders = () => {
    const headers = {
      "Content-Type": "application/json",
      Tenant: tenant,
      Language: language,
    };
    setRequestHeaders(JSON.stringify(headers, null, 2));
  };

  // Update request body and headers when infractions parameters change
  useEffect(() => {
    const api =
      apiManager.getApiById(selectedApi) || apiManager.getApi(selectedApi);
    if (api && api.name === "infractions") {
      updateInfractionsRequestBody();
      updateInfractionsHeaders();
    }
  }, [
    selectedApi,
    selectedTypes,
    dateRange,
    tenant,
    language,
    perPage,
    currentPage,
  ]);

  // Function to fetch OpenAPI documentation
  const fetchOpenApiDocs = async () => {
    if (!selectedApi) {
      toast.error("Please select an API first");
      return;
    }

    setIsLoadingDocs(true);
    try {
      const api =
        apiManager.getApiById(selectedApi) || apiManager.getApi(selectedApi);
      if (!api) {
        toast.error("Selected API not found");
        return;
      }
      const result = await apiManager.callApi(api.name, "/openapi.json");
      setOpenApiSpec(result);
      toast.success("Documentation loaded successfully!");
    } catch (error) {
      console.error("Error fetching OpenAPI docs:", error);
      toast.error("Failed to load documentation", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      setOpenApiSpec(null);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const generateCurlCommand = () => {
    if (!selectedApi) return "";

    const api =
      apiManager.getApiById(selectedApi) || apiManager.getApi(selectedApi);
    if (!api) return "";

    let headers: Record<string, string> = {};
    try {
      headers = JSON.parse(requestHeaders);
    } catch {
      headers = {};
    }

    // Add Bearer token if provided
    if (bearerToken.trim()) {
      headers.Authorization = `Bearer ${bearerToken.trim()}`;
    }

    let command = `curl -X ${requestMethod} \\\n`;
    let url: string;
    if (requestEndpoint.startsWith(`/api/${api.name}`)) {
      url = `${api.baseUrl}${requestEndpoint}`;
    } else {
      url = `${api.baseUrl}/api/${api.name}${requestEndpoint}`;
    }
    command += `  '${url}' \\\n`;

    Object.entries(headers).forEach(([key, value]) => {
      command += `  -H '${key}: ${value}' \\\n`;
    });

    if (requestMethod === "POST" && requestBody.trim()) {
      command += `  -d '${requestBody.replace(/'/g, "'\\''")}' \\\n`;
    }

    return command.slice(0, -3); // Remove trailing backslash
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm">
                C
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Chopper API Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                  Monitor, test, and manage your API services
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ApiSelector
                value={selectedApi}
                onValueChange={setSelectedApi}
                className="w-64"
              />
              <Badge variant="secondary" className="text-sm">
                v1.0.0
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList
            className={`grid w-full h-auto ${import.meta.env.VITE_NODE_ENV === "production" ? "grid-cols-4" : "grid-cols-3"}`}
          >
            <TabsTrigger value="overview" className="text-sm">
              <Activity className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tester" className="text-sm">
              <Search className="mr-2 h-4 w-4" />
              API Tester
            </TabsTrigger>
            <TabsTrigger value="docs" className="text-sm">
              <FileText className="mr-2 h-4 w-4" />
              Documentation
            </TabsTrigger>
            {import.meta.env.VITE_NODE_ENV === "production" && (
              <TabsTrigger value="settings" className="text-sm">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ApiDashboard
              onApiSelect={(apiId) => {
                setSelectedApi(apiId);
                setActiveTab("tester");
              }}
              selectedApi={selectedApi}
            />
          </TabsContent>

          <TabsContent value="tester" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Request Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Send className="h-5 w-5" />
                    <span>API Request</span>
                  </CardTitle>
                  <CardDescription>
                    Configure and send requests to {selectedApi || "selected"}{" "}
                    API
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label>Method</Label>
                      <select
                        className="w-full px-3 py-2 border rounded-md"
                        value={requestMethod}
                        onChange={(e) =>
                          setRequestMethod(e.target.value as any)
                        }
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                      </select>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Endpoint</Label>
                      <Input
                        value={requestEndpoint}
                        onChange={(e) => setRequestEndpoint(e.target.value)}
                        placeholder="/api/[apiname]/your-endpoint"
                      />
                      <p className="text-xs text-muted-foreground">
                        Endpoint path (e.g. /api/{(() => {
                          const api = apiManager.getApiById(selectedApi) || apiManager.getApi(selectedApi);
                          return api?.name || 'apiname';
                        })()}/your-endpoint or just /your-endpoint)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Bearer Token (Optional)</Label>
                    <Input
                      type="password"
                      value={bearerToken}
                      onChange={(e) => setBearerToken(e.target.value)}
                      placeholder="Enter Bearer token for authentication"
                    />
                    <p className="text-xs text-muted-foreground">
                      If provided, will be added as Authorization: Bearer header
                    </p>
                  </div>

                  {/* Infractions-specific UI */}
                  {(() => {
                    const api =
                      apiManager.getApiById(selectedApi) ||
                      apiManager.getApi(selectedApi);
                    return api && api.name === "infractions";
                  })() && (
                    <>
                      <div className="space-y-4 p-4 border border-primary/20 rounded-lg bg-primary/5">
                        <h3 className="font-semibold text-primary">
                          Infractions API Builder
                        </h3>

                        {/* Date Range */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !dateRange.from && "text-muted-foreground",
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {dateRange.from
                                    ? format(dateRange.from, "PPP")
                                    : "Pick a date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={dateRange.from}
                                  onSelect={(date) =>
                                    date &&
                                    setDateRange((prev) => ({
                                      ...prev,
                                      from: date,
                                    }))
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>

                          <div className="space-y-2">
                            <Label>End Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !dateRange.to && "text-muted-foreground",
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {dateRange.to
                                    ? format(dateRange.to, "PPP")
                                    : "Pick a date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={dateRange.to}
                                  onSelect={(date) =>
                                    date &&
                                    setDateRange((prev) => ({
                                      ...prev,
                                      to: date,
                                    }))
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>

                        {/* Tenant and Language */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Tenant</Label>
                            <Input
                              value={tenant}
                              onChange={(e) => setTenant(e.target.value)}
                              placeholder="premium"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Language</Label>
                            <Select
                              value={language}
                              onValueChange={setLanguage}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="en">English (en)</SelectItem>
                                <SelectItem value="fr">
                                  Français (fr)
                                </SelectItem>
                                <SelectItem value="es">Español (es)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Per Page</Label>
                            <Select
                              value={perPage.toString()}
                              onValueChange={(value) =>
                                setPerPage(parseInt(value))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="10">10 results</SelectItem>
                                <SelectItem value="25">25 results</SelectItem>
                                <SelectItem value="50">50 results</SelectItem>
                                <SelectItem value="100">100 results</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Page Number */}
                        <div className="space-y-2">
                          <Label>Page Number (0-based)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={currentPage}
                            onChange={(e) =>
                              setCurrentPage(parseInt(e.target.value) || 0)
                            }
                            placeholder="0"
                          />
                        </div>

                        {/* Infraction Types */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Infraction Types (optional)</Label>
                            <div className="flex items-center space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={selectAllTypes}
                              >
                                Select All
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={deselectAllTypes}
                              >
                                Clear All
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Selected: {selectedTypes.length}/
                            {INFRACTION_TYPES.length}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                            {INFRACTION_TYPES.map((type) => (
                              <div
                                key={type}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`type-${type}`}
                                  checked={selectedTypes.includes(type)}
                                  onCheckedChange={() => handleTypeToggle(type)}
                                />
                                <Label
                                  htmlFor={`type-${type}`}
                                  className="text-sm font-normal leading-none cursor-pointer"
                                >
                                  {type.replace(/([A-Z])/g, " $1").trim()}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label>Headers (JSON)</Label>
                    <Textarea
                      value={requestHeaders}
                      onChange={(e) => setRequestHeaders(e.target.value)}
                      rows={4}
                      className="font-mono text-sm"
                    />
                  </div>

                  {requestMethod === "POST" && (
                    <div className="space-y-2">
                      <Label>Request Body (JSON)</Label>
                      <Textarea
                        value={requestBody}
                        onChange={(e) => setRequestBody(e.target.value)}
                        rows={6}
                        className="font-mono text-sm"
                      />
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button
                      onClick={makeApiRequest}
                      disabled={isLoading || !selectedApi}
                      className="flex-1"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {isLoading ? "Sending..." : "Send Request"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(generateCurlCommand())}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* cURL Command */}
                  <div className="space-y-2">
                    <Label>Generated cURL Command</Label>
                    <div className="bg-muted p-3 rounded-lg">
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                        {generateCurlCommand()}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Response */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Code className="h-5 w-5" />
                    <span>Response</span>
                  </CardTitle>
                  <CardDescription>
                    API response data and status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {response ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={response.error ? "destructive" : "default"}
                          className="text-sm"
                        >
                          {response.error ? "Error" : "Success"}
                        </Badge>
                        {response.status_code && (
                          <Badge variant="outline">
                            {response.status_code}
                          </Badge>
                        )}
                      </div>

                      <div className="bg-muted rounded-lg p-4">
                        <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(response, null, 2)}
                        </pre>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(JSON.stringify(response, null, 2))
                        }
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Response
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        No Response Yet
                      </h3>
                      <p className="text-muted-foreground">
                        Send a request to see the API response here.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="docs" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>API Documentation</CardTitle>
                    <CardDescription>
                      Interactive OpenAPI documentation for{" "}
                      {selectedApi || "selected API"}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={fetchOpenApiDocs}
                    disabled={isLoadingDocs || !selectedApi}
                    variant="outline"
                  >
                    {isLoadingDocs ? "Loading..." : "Load Documentation"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!openApiSpec ? (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      Load Documentation
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Click "Load Documentation" to fetch the OpenAPI
                      specification for {selectedApi || "the selected API"}
                    </p>
                    {selectedApi && (
                      <Button
                        onClick={fetchOpenApiDocs}
                        disabled={isLoadingDocs}
                      >
                        {isLoadingDocs ? "Loading..." : "Load Documentation"}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* API Info */}
                    <div className="rounded-lg border p-4">
                      <h3 className="text-lg font-semibold mb-2">
                        {openApiSpec.info?.title || "API Documentation"}
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        {openApiSpec.info?.description ||
                          "No description available"}
                      </p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-muted-foreground">
                          Version:{" "}
                          <strong>
                            {openApiSpec.info?.version || "Unknown"}
                          </strong>
                        </span>
                        <span className="text-muted-foreground">
                          OpenAPI:{" "}
                          <strong>{openApiSpec.openapi || "Unknown"}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Endpoints */}
                    {openApiSpec.paths && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold border-b pb-2">
                          API Endpoints
                        </h3>
                        {Object.entries(openApiSpec.paths).map(
                          ([path, methods]: [string, any]) => (
                            <div key={path} className="space-y-4">
                              <h4 className="text-lg font-medium text-primary bg-muted/50 px-3 py-2 rounded">
                                {path}
                              </h4>
                              <div className="grid gap-4">
                                {Object.entries(methods).map(
                                  ([method, details]: [string, any]) => (
                                    <div
                                      key={method}
                                      className="border rounded-lg p-4 space-y-3"
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-3">
                                          <Badge
                                            variant={
                                              method === "get"
                                                ? "secondary"
                                                : method === "post"
                                                  ? "default"
                                                  : "outline"
                                            }
                                            className="text-sm font-mono"
                                          >
                                            {method.toUpperCase()}
                                          </Badge>
                                          <div>
                                            <h5 className="font-semibold">
                                              {details.summary || "No summary"}
                                            </h5>
                                            {details.operationId && (
                                              <p className="text-xs text-muted-foreground font-mono">
                                                {details.operationId}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {details.description && (
                                        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded border-l-4 border-blue-500">
                                          <p className="text-sm whitespace-pre-line">
                                            {details.description}
                                          </p>
                                        </div>
                                      )}

                                      {/* Parameters */}
                                      {details.parameters &&
                                        details.parameters.length > 0 && (
                                          <div>
                                            <h6 className="font-medium mb-2 text-sm">
                                              Parameters
                                            </h6>
                                            <div className="space-y-2">
                                              {details.parameters.map(
                                                (param: any, idx: number) => (
                                                  <div
                                                    key={idx}
                                                    className="bg-muted/50 p-3 rounded border"
                                                  >
                                                    <div className="flex items-start justify-between mb-1">
                                                      <div className="flex items-center space-x-2">
                                                        <code className="font-semibold text-sm">
                                                          {param.name}
                                                        </code>
                                                        <Badge
                                                          variant="outline"
                                                          className="text-xs"
                                                        >
                                                          {param.in}
                                                        </Badge>
                                                        {param.required && (
                                                          <Badge
                                                            variant="destructive"
                                                            className="text-xs"
                                                          >
                                                            required
                                                          </Badge>
                                                        )}
                                                      </div>
                                                      {param.schema?.type && (
                                                        <span className="text-xs text-muted-foreground font-mono">
                                                          {param.schema.type}
                                                        </span>
                                                      )}
                                                    </div>
                                                    {param.description && (
                                                      <p className="text-sm text-muted-foreground mt-1">
                                                        {param.description}
                                                      </p>
                                                    )}
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                          </div>
                                        )}

                                      {/* Request Body */}
                                      {details.requestBody && (
                                        <div>
                                          <h6 className="font-medium mb-2 text-sm">
                                            Request Body
                                          </h6>
                                          <div className="bg-muted/50 p-3 rounded border">
                                            <p className="text-sm">
                                              Content-Type: application/json
                                            </p>
                                            {details.requestBody.content?.[
                                              "application/json"
                                            ]?.examples && (
                                              <div className="mt-2">
                                                <span className="text-xs font-medium">
                                                  Examples:
                                                </span>
                                                {Object.entries(
                                                  details.requestBody.content[
                                                    "application/json"
                                                  ].examples,
                                                ).map(
                                                  ([exampleName, example]: [
                                                    string,
                                                    any,
                                                  ]) => (
                                                    <div
                                                      key={exampleName}
                                                      className="mt-2"
                                                    >
                                                      <div className="text-xs font-medium">
                                                        {example.summary}
                                                      </div>
                                                      <pre className="text-xs bg-background p-2 rounded mt-1 overflow-x-auto">
                                                        {JSON.stringify(
                                                          example.value,
                                                          null,
                                                          2,
                                                        )}
                                                      </pre>
                                                    </div>
                                                  ),
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Responses */}
                                      {details.responses && (
                                        <div>
                                          <h6 className="font-medium mb-2 text-sm">
                                            Responses
                                          </h6>
                                          <div className="space-y-1">
                                            {Object.entries(
                                              details.responses,
                                            ).map(
                                              ([code, response]: [
                                                string,
                                                any,
                                              ]) => (
                                                <div
                                                  key={code}
                                                  className="flex items-center space-x-2 text-sm"
                                                >
                                                  <Badge
                                                    variant={
                                                      code.startsWith("2")
                                                        ? "default"
                                                        : code.startsWith("4")
                                                          ? "destructive"
                                                          : "secondary"
                                                    }
                                                    className="font-mono"
                                                  >
                                                    {code}
                                                  </Badge>
                                                  <span>
                                                    {response.description}
                                                  </span>
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    )}

                    {/* Schemas */}
                    {openApiSpec.components?.schemas && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Data Models</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(openApiSpec.components.schemas).map(
                            ([name, schema]: [string, any]) => (
                              <div key={name} className="rounded-lg border p-4">
                                <h4 className="font-medium mb-2">{name}</h4>
                                {schema.description && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {schema.description}
                                  </p>
                                )}
                                {schema.properties && (
                                  <div className="space-y-1">
                                    <h5 className="text-sm font-medium">
                                      Properties:
                                    </h5>
                                    {Object.entries(schema.properties).map(
                                      ([propName, prop]: [string, any]) => (
                                        <div
                                          key={propName}
                                          className="text-xs bg-muted p-2 rounded"
                                        >
                                          <span className="font-medium">
                                            {propName}
                                          </span>
                                          <span className="text-muted-foreground ml-1">
                                            ({prop.type || "unknown"})
                                            {schema.required?.includes(propName)
                                              ? " required"
                                              : " optional"}
                                          </span>
                                          {prop.description && (
                                            <p className="text-muted-foreground mt-1">
                                              {prop.description}
                                            </p>
                                          )}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {import.meta.env.VITE_NODE_ENV === "production" && (
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration</CardTitle>
                  <CardDescription>
                    Manage your API configurations and settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded-lg bg-muted p-4">
                      <h4 className="font-medium mb-2">
                        Environment Configuration
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        APIs are configured via environment variables. Each API
                        follows the pattern:
                        <code className="bg-background px-1 py-0.5 rounded mx-1">
                          name:base_url[:label]
                        </code>
                        <br />
                        <strong>Security Note:</strong> Bearer tokens should be
                        entered at runtime in the API Tester tab, not stored in
                        environment variables.
                      </p>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium mb-1">
                            Simple API Example:
                          </p>
                          <pre className="text-xs bg-background p-3 rounded border">
                            API_CONFIGS=infractions:http://localhost:8000
                          </pre>
                        </div>

                        <div>
                          <p className="text-xs font-medium mb-1">
                            With Labels:
                          </p>
                          <pre className="text-xs bg-background p-3 rounded border">
                            API_CONFIGS=infractions:http://localhost:8000:local,users:http://localhost:8001:staging
                          </pre>
                        </div>

                        <div>
                          <p className="text-xs font-medium mb-1">
                            Complete Configuration:
                          </p>
                          <pre className="text-xs bg-background p-3 rounded border">
                            {`API_CONFIGS=infractions:http://localhost:8000:local,oathkeeper:https://api.example.com:production
DEFAULT_TENANT=business
DEFAULT_LANGUAGE=en`}
                          </pre>
                        </div>

                        <div>
                          <p className="text-xs font-medium mb-1">
                            Current Configuration:
                          </p>
                          <p className="text-xs text-muted-foreground mb-2">
                            Current configuration is loaded from server
                            environment variables. Check the Overview tab to see
                            active APIs.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 p-4">
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                        API Endpoint Structure
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                        Each configured API should provide these endpoints:
                      </p>
                      <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 font-mono">
                        <li>
                          • <strong>/api/{"{apiname}"}</strong> - Main API
                          endpoint
                        </li>
                        <li>
                          • <strong>/api/{"{apiname}"}/liveness</strong> -
                          Health check (should return {'{"status": "ok"}'})
                        </li>
                        <li>
                          • <strong>/api/{"{apiname}"}/readiness</strong> -
                          Readiness check (should return {'{"status": "ready"}'}
                          )
                        </li>
                        <li>
                          • <strong>/api/{"{apiname}"}/openapi.json</strong> -
                          OpenAPI specification
                        </li>
                      </ul>
                    </div>

                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20 p-4">
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                        Important Notes
                      </h4>
                      <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                        <li>
                          • Restart the server after changing environment
                          variables
                        </li>
                        <li>
                          • Ensure your APIs support CORS or use proper proxy
                          configuration
                        </li>
                        <li>
                          • APIs are accessed through the proxy at{" "}
                          <code>/api/{"{apiname}"}/*</code>
                        </li>
                        <li>
                          • Headers (Tenant, Language, Authorization) are
                          automatically forwarded
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
