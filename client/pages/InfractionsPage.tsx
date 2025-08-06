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
import { Calendar } from "@/components/ui/calendar";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  CalendarIcon,
  Search,
  FileText,
  AlertTriangle,
  Users,
  Clock,
  BarChart3,
  Download,
  Copy,
  Home,
  Settings,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Link } from "react-router-dom";

// Infraction types matching the API exactly
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

interface ApiConfiguration {
  baseUrl: string;
  tenant: string;
  language: string;
  apiToken: string;
  requestMethod: "GET" | "POST";
  perPage: number;
}

export default function InfractionsPage() {
  // Configuration state
  const [config, setConfig] = useState<ApiConfiguration>({
    baseUrl: "http://localhost:8000",
    tenant: "premium",
    language: "en",
    apiToken: "",
    requestMethod: "GET",
    perPage: 10,
  });

  // Query parameters state
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: addDays(new Date(), -365), // Default to 1 year ago
    to: new Date(),
  });

  const [selectedTypes, setSelectedTypes] = useState<InfractionType[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("builder");

  // Load configuration from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem("infractions-config");
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error("Failed to load saved configuration:", error);
      }
    }
  }, []);

  // Save configuration to localStorage
  const saveConfig = (newConfig: Partial<ApiConfiguration>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    localStorage.setItem("infractions-config", JSON.stringify(updatedConfig));
  };

  const handleTypeToggle = (type: InfractionType) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
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

  const generateUrl = () => {
    const queryParams = new URLSearchParams();
    
    queryParams.set("tenant", config.tenant);
    
    if (selectedTypes.length > 0) {
      selectedTypes.forEach(type => {
        queryParams.append("typeInfractionLibelles", type);
      });
    }
    
    queryParams.set("startDate", dateRange.from.toISOString());
    queryParams.set("endDate", dateRange.to.toISOString());
    queryParams.set("page", currentPage.toString());
    queryParams.set("perPage", config.perPage.toString());

    return `${config.baseUrl}/api/infractions?${queryParams.toString()}`;
  };

  const generateCurlCommand = () => {
    if (config.requestMethod === "GET") {
      const url = generateUrl();
      let curlCommand = `curl -X 'GET' \\\n  '${url}' \\\n`;
      curlCommand += `  -H 'accept: application/json' \\\n`;
      curlCommand += `  -H 'Language: ${config.language}'`;
      if (config.apiToken) {
        curlCommand += ` \\\n  -H 'Authorization: Bearer ${config.apiToken}'`;
      }
      return curlCommand;
    } else {
      // POST method
      const requestBody = {
        typeInfractionLibelles: selectedTypes.length > 0 ? selectedTypes : null,
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
        page: currentPage,
        perPage: config.perPage,
      };

      const url = `${config.baseUrl}/api/infractions`;
      
      let curlCommand = `curl -X 'POST' \\\n  '${url}' \\\n`;
      curlCommand += `  -H 'accept: application/json' \\\n`;
      curlCommand += `  -H 'Tenant: ${config.tenant}' \\\n`;
      curlCommand += `  -H 'Language: ${config.language}' \\\n`;
      if (config.apiToken) {
        curlCommand += `  -H 'Authorization: Bearer ${config.apiToken}' \\\n`;
      }
      curlCommand += `  -H 'Content-Type: application/json' \\\n`;
      curlCommand += `  -d '${JSON.stringify(requestBody, null, 2)}'`;
      
      return curlCommand;
    }
  };

  const executeRequest = async () => {
    setIsLoading(true);
    
    try {
      const headers: Record<string, string> = {
        "accept": "application/json",
        "Language": config.language,
      };

      if (config.apiToken) {
        headers["Authorization"] = `Bearer ${config.apiToken}`;
      }

      let url: string;
      let fetchOptions: RequestInit = { headers };

      if (config.requestMethod === "GET") {
        url = generateUrl();
        fetchOptions.method = "GET";
      } else {
        url = `${config.baseUrl}/api/infractions`;
        fetchOptions.method = "POST";
        headers["Tenant"] = config.tenant;
        headers["Content-Type"] = "application/json";
        
        const requestBody = {
          typeInfractionLibelles: selectedTypes.length > 0 ? selectedTypes : null,
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString(),
          page: currentPage,
          perPage: config.perPage,
        };
        
        fetchOptions.body = JSON.stringify(requestBody);
      }

      const response = await fetch(url, fetchOptions);
      const data = await response.json();

      if (response.ok) {
        setResults(data);
        toast.success("Request executed successfully!", {
          description: `Found ${data.totalCount || 0} infractions`,
        });
        setActiveTab("results");
      } else {
        throw new Error(`HTTP ${response.status}: ${data.message || response.statusText}`);
      }
    } catch (error) {
      console.error("Request failed:", error);
      toast.error("Request failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      setResults({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const formatDuration = (duration: any) => {
    if (!duration) return "N/A";
    if (duration.totalHours) return `${duration.totalHours.toFixed(1)}h`;
    if (duration.totalMinutes) return `${duration.totalMinutes.toFixed(0)}min`;
    return "N/A";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-muted-foreground hover:text-foreground">
                <Home className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Infractions API Builder
                </h1>
                <p className="text-muted-foreground mt-1">
                  Specialized interface for infractions API requests with all available fields
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm">
              Infractions v1.0
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="builder" className="text-sm">
              <Settings className="mr-2 h-4 w-4" />
              Request Builder
            </TabsTrigger>
            <TabsTrigger value="config" className="text-sm">
              Configuration
            </TabsTrigger>
            <TabsTrigger value="results" className="text-sm">
              Results
            </TabsTrigger>
            <TabsTrigger value="docs" className="text-sm">
              Generated Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Infractions API Request Builder</CardTitle>
                <CardDescription>
                  Configure all available fields for your infractions API request
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateRange.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? format(dateRange.from, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.from}
                          onSelect={date => date && setDateRange(prev => ({ ...prev, from: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateRange.to && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.to ? format(dateRange.to, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.to}
                          onSelect={date => date && setDateRange(prev => ({ ...prev, to: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
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
                    Leave empty to retrieve all types, or select specific types to filter. 
                    Selected: {selectedTypes.length}/{INFRACTION_TYPES.length}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto border rounded-lg p-4">
                    {INFRACTION_TYPES.map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={type}
                          checked={selectedTypes.includes(type)}
                          onCheckedChange={() => handleTypeToggle(type)}
                        />
                        <Label
                          htmlFor={type}
                          className="text-sm font-normal leading-none cursor-pointer"
                        >
                          {type.replace(/([A-Z])/g, " $1").trim()}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pagination */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="page">Page Number</Label>
                    <Input
                      id="page"
                      type="number"
                      min="0"
                      value={currentPage}
                      onChange={e => setCurrentPage(parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      0-based page index
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="per-page">Results per page</Label>
                    <Select
                      value={config.perPage.toString()}
                      onValueChange={value => saveConfig({ perPage: parseInt(value) })}
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

                {/* Generated URL Preview */}
                {config.requestMethod === "GET" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Generated URL</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generateUrl(), "URL")}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                    <div className="rounded-lg bg-muted p-3">
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                        {generateUrl()}
                      </pre>
                    </div>
                  </div>
                )}

                <Button
                  onClick={executeRequest}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  <Search className="mr-2 h-4 w-4" />
                  {isLoading ? "Executing Request..." : "Execute Request"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
                <CardDescription>
                  Configure the base settings for your infractions API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="base-url">API Base URL *</Label>
                  <Input
                    id="base-url"
                    type="url"
                    value={config.baseUrl}
                    onChange={e => saveConfig({ baseUrl: e.target.value })}
                    placeholder="http://localhost:8000"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tenant">Tenant *</Label>
                    <Input
                      id="tenant"
                      value={config.tenant}
                      onChange={e => saveConfig({ tenant: e.target.value })}
                      placeholder="premium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={config.language}
                      onValueChange={language => saveConfig({ language })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English (en)</SelectItem>
                        <SelectItem value="fr">Français (fr)</SelectItem>
                        <SelectItem value="es">Español (es)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method">HTTP Method</Label>
                  <Select
                    value={config.requestMethod}
                    onValueChange={(value: "GET" | "POST") => saveConfig({ requestMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET (query parameters)</SelectItem>
                      <SelectItem value="POST">POST (request body)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-token">API Token (optional)</Label>
                  <Input
                    id="api-token"
                    type="password"
                    value={config.apiToken}
                    onChange={e => saveConfig({ apiToken: e.target.value })}
                    placeholder="Bearer token for authentication"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {results ? (
              <Card>
                <CardHeader>
                  <CardTitle>API Response</CardTitle>
                  <CardDescription>
                    Results from your infractions API request
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {results.error ? (
                    <div className="text-center py-12">
                      <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
                      <h3 className="text-lg font-medium mb-2">Request Failed</h3>
                      <p className="text-muted-foreground">{results.error}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-lg bg-muted p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Total Count:</span>
                            <div className="text-lg font-bold">{results.totalCount || 0}</div>
                          </div>
                          <div>
                            <span className="font-medium">Page:</span>
                            <div className="text-lg font-bold">{(results.pageIndex || 0) + 1}</div>
                          </div>
                          <div>
                            <span className="font-medium">Items:</span>
                            <div className="text-lg font-bold">{results.itemsCount || 0}</div>
                          </div>
                          <div>
                            <span className="font-medium">Pages:</span>
                            <div className="text-lg font-bold">{results.pageCount || 0}</div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border">
                        <pre className="text-xs p-4 overflow-auto max-h-96">
                          {JSON.stringify(results, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No request executed yet</h3>
                  <p className="text-muted-foreground">
                    Use the Request Builder tab to execute your first request.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="docs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generated Code & Documentation</CardTitle>
                <CardDescription>
                  Copy the generated cURL command or use the URL for your applications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>cURL Command</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generateCurlCommand(), "cURL command")}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                      {generateCurlCommand()}
                    </pre>
                  </div>
                </div>

                {config.requestMethod === "GET" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Direct URL</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generateUrl(), "URL")}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                    <div className="rounded-lg bg-muted p-3">
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                        {generateUrl()}
                      </pre>
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 p-4">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Available Fields Summary
                  </h4>
                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <p><strong>tenant:</strong> {config.tenant}</p>
                    <p><strong>typeInfractionLibelles:</strong> {selectedTypes.length > 0 ? selectedTypes.join(", ") : "All types"}</p>
                    <p><strong>startDate:</strong> {dateRange.from.toISOString()}</p>
                    <p><strong>endDate:</strong> {dateRange.to.toISOString()}</p>
                    <p><strong>page:</strong> {currentPage}</p>
                    <p><strong>perPage:</strong> {config.perPage}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
