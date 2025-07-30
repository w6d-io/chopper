import React, { useState } from "react";
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
} from "lucide-react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  INFRACTION_TYPES,
  type SummaryRequest,
  type ApiResult,
  type InfractionType,
  type ApiCallParams,
  callInfractionsAPI,
} from "@/lib/api";
import {
  type SearchHistoryItem,
  loadSearchHistory,
  addToSearchHistory,
  removeFromSearchHistory,
  clearSearchHistory,
  getRecentSearches,
} from "@/lib/searchHistory";

export default function Index() {
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [selectedTypes, setSelectedTypes] = useState<InfractionType[]>([]);
  const [perPage, setPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ApiResult | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [apiBaseUrl, setApiBaseUrl] = useState("http://localhost:8000");
  const [activeTab, setActiveTab] = useState("query");
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [tenantNamespace, setTenantNamespace] = useState("dev");
  const [language, setLanguage] = useState<string>("fr");
  const [orderByDate, setOrderByDate] = useState(false);
  const [orderDesc, setOrderDesc] = useState(false);
  const [apiToken, setApiToken] = useState("");

  // Load search history on component mount
  React.useEffect(() => {
    setSearchHistory(loadSearchHistory());
  }, []);

  const handleSearch = async () => {
    // Validation des paramètres avant l'appel
    if (!dateRange.from || !dateRange.to) {
      toast.error("Validation Error", {
        description: "Please select both start and end dates.",
      });
      return;
    }

    if (dateRange.from > dateRange.to) {
      toast.error("Date Range Error", {
        description: "Start date cannot be greater than end date.",
      });
      return;
    }

    if (!apiBaseUrl || !apiBaseUrl.trim()) {
      toast.error("Configuration Error", {
        description:
          "Please configure the API base URL in the Configuration tab.",
      });
      setActiveTab("config");
      return;
    }

    if (!tenantNamespace || !tenantNamespace.trim()) {
      toast.error("Configuration Error", {
        description:
          "Please configure the tenant namespace in the Configuration tab.",
      });
      setActiveTab("config");
      return;
    }

    setIsLoading(true);
    toast.loading("Searching infractions...", { id: "search-toast" });

    try {
      const requestBody: SummaryRequest = {
        typeInfractionLibelles: selectedTypes.length > 0 ? selectedTypes : null,
        dateDebut: dateRange.from.toISOString(),
        dateFin: dateRange.to.toISOString(),
        pageIndex: currentPage - 1, // API uses 0-based indexing
        pageSize: perPage,
      };

      // Mise à jour temporaire de l'URL de base
      const originalBaseUrl = (await import("@/lib/api")).API_CONFIG.BASE_URL;
      (await import("@/lib/api")).API_CONFIG.BASE_URL = apiBaseUrl;

      const apiParams: ApiCallParams = {
        request: requestBody,
        selectedTypes: selectedTypes,
        queryParams: {
          order_by_date: orderByDate,
          order_desc: orderDesc,
        },
        headers: {
          Tenantnamespace: tenantNamespace,
          Language: language,
          ...(apiToken && { "X-TOKEN-API": apiToken }),
        },
      };

      const result = await callInfractionsAPI(apiParams);

      // Restaurer l'URL de base originale
      (await import("@/lib/api")).API_CONFIG.BASE_URL = originalBaseUrl;
      setResults(result);

      // Handle different response statuses
      if (result.status === "success") {
        const totalItems = result.data?.totalCount || 0;
        const page = (result.data?.pageIndex || 0) + 1; // Convert back to 1-based

        // Use different toast id for pagination vs initial search
        const toastId = currentPage > 1 ? "pagination-toast" : "search-toast";
        const message =
          currentPage > 1
            ? `Page ${page} loaded successfully!`
            : "Search completed successfully!";

        toast.success(message, {
          id: toastId,
          description: `Found ${totalItems} infractions matching your criteria.`,
        });

        // Save to search history only for initial searches (not pagination)
        if (currentPage === 1) {
          const newHistory = addToSearchHistory(
            requestBody,
            selectedTypes,
            dateRange,
            totalItems,
            tenantNamespace,
            language,
          );
          setSearchHistory(newHistory);
        }

        setActiveTab("results");
      } else if (result.status_code === 404) {
        const toastId = currentPage > 1 ? "pagination-toast" : "search-toast";
        toast.warning("No results found", {
          id: toastId,
          description:
            result.message ||
            "No infractions found for the specified criteria.",
        });
        setActiveTab("results");
      } else {
        const toastId = currentPage > 1 ? "pagination-toast" : "search-toast";
        toast.error("API Error", {
          id: toastId,
          description:
            result.message ||
            `Server returned status code ${result.status_code}`,
        });
      }
    } catch (error) {
      console.error("Error fetching infractions:", error);

      let errorMessage = "Connection Error";
      let errorDescription = "Please try again later.";

      if (error instanceof Error) {
        if (
          error.message.includes("fetch") ||
          error.message.includes("NetworkError")
        ) {
          errorDescription =
            "Failed to connect to the API. Please check your network connection and API URL.";
        } else if (error.message.includes("CORS")) {
          errorDescription =
            "Cross-origin request blocked. Please configure CORS on your API server or use a proxy.";
        } else if (error.message.includes("404")) {
          errorDescription =
            "API endpoint not found. Please verify your API base URL.";
        } else if (
          error.message.includes("401") ||
          error.message.includes("403")
        ) {
          errorDescription =
            "Authentication failed. Please check your API credentials.";
        } else if (error.message.includes("422")) {
          errorDescription =
            "Validation error. Please check your request parameters.";
        } else if (error.message.includes("500")) {
          errorDescription =
            "Internal server error. Please contact your API administrator.";
        } else {
          errorDescription = error.message;
        }
      }

      const toastId = currentPage > 1 ? "pagination-toast" : "search-toast";
      toast.error(errorMessage, {
        id: toastId,
        description: errorDescription,
      });

      // Set error state for display
      setResults({
        status: "error",
        status_code: 500,
        message: errorDescription,
        data: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeToggle = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const formatDuration = (duration: any) => {
    if (!duration) return "N/A";
    if (duration.totalHours) return `${duration.totalHours.toFixed(1)}h`;
    if (duration.totalMinutes) return `${duration.totalMinutes.toFixed(0)}min`;
    return "N/A";
  };

  const generateCurlCommand = () => {
    const requestBody = {
      typeInfractionLibelles: selectedTypes.length > 0 ? selectedTypes : null,
      dateDebut: dateRange.from.toISOString(),
      dateFin: dateRange.to.toISOString(),
      pageIndex: currentPage - 1,
      pageSize: perPage,
    };

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (selectedTypes.length > 0) {
      selectedTypes.forEach((type) => {
        queryParams.append("typeInfractionLibelles", type);
      });
    }
    if (orderByDate !== undefined) {
      queryParams.set("order_by_date", orderByDate.toString());
    }
    if (orderDesc !== undefined) {
      queryParams.set("order_desc", orderDesc.toString());
    }

    const queryString = queryParams.toString();
    const url = `${apiBaseUrl}/api/infractions${queryString ? `?${queryString}` : ""}`;

    let curlCommand = `curl -X 'POST' \\\n  '${url}' \\\n`;
    curlCommand += `  -H 'accept: application/json' \\\n`;
    curlCommand += `  -H 'Tenantnamespace: ${tenantNamespace}' \\\n`;
    curlCommand += `  -H 'Language: ${language}' \\\n`;
    if (apiToken) {
      curlCommand += `  -H 'X-TOKEN-API: ${apiToken}' \\\n`;
    }
    curlCommand += `  -H 'Content-Type: application/json' \\\n`;
    curlCommand += `  -d '${JSON.stringify(requestBody, null, 2)}'`;

    return curlCommand;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src="/logo.png"
                alt="W6D Logo"
                className="h-12 w-12 object-contain"
              />
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Infractions API Manager
                </h1>
                <p className="text-muted-foreground mt-1">
                  Monitor and analyze driving infractions data
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm">
              API v0.1.0
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Infractions
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {results?.data?.totalCount || "—"}
              </div>
              <p className="text-xs text-muted-foreground">From last query</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Unique Drivers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {results?.data?.items
                  ? new Set(results.data.items.map((i) => i.conducteurId)).size
                  : "—"}
              </div>
              <p className="text-xs text-muted-foreground">Affected drivers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pages Available
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {results?.data?.pageCount || "—"}
              </div>
              <p className="text-xs text-muted-foreground">Result pages</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Fine
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {results?.data?.items
                  ? `€${Math.round(
                      results.data.items
                        .filter((i) => i.amendeMontant)
                        .reduce((sum, i) => sum + (i.amendeMontant || 0), 0) /
                        results.data.items.filter((i) => i.amendeMontant)
                          .length || 1,
                    )}`
                  : "—"}
              </div>
              <p className="text-xs text-muted-foreground">Per infraction</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Interface */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="config" className="text-sm">
              Configuration
            </TabsTrigger>
            <TabsTrigger value="query" className="text-sm">
              Query Interface
            </TabsTrigger>
            <TabsTrigger value="results" className="text-sm">
              Results & Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration de l'API</CardTitle>
                <CardDescription>
                  Configurez l'URL de base de votre API d'infractions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-url">URL de base de l'API</Label>
                  <Input
                    id="api-url"
                    type="url"
                    value={apiBaseUrl}
                    onChange={(e) => {
                      const newUrl = e.target.value;
                      setApiBaseUrl(newUrl);

                      // Validate URL format
                      if (newUrl && newUrl.trim()) {
                        try {
                          new URL(newUrl);
                          toast.success("API URL updated", {
                            description: "Configuration saved successfully.",
                            duration: 2000,
                          });
                        } catch {
                          toast.error("Invalid URL format", {
                            description:
                              "Please enter a valid URL (e.g., https://example.com).",
                            duration: 3000,
                          });
                        }
                      }
                    }}
                    placeholder="https://votre-api-infractions.com"
                  />
                  <p className="text-sm text-muted-foreground">
                    L'URL de base de votre API d'infractions. L'endpoint
                    `/api/infractions` sera automatiquement ajouté.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tenant-namespace">Tenant Namespace *</Label>
                    <Input
                      id="tenant-namespace"
                      value={tenantNamespace}
                      onChange={(e) => setTenantNamespace(e.target.value)}
                      placeholder="dev"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Requis comme en-tête HTTP
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français (fr)</SelectItem>
                        <SelectItem value="en">English (en)</SelectItem>
                        <SelectItem value="es">Español (es)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-token">API Token (X-TOKEN-API)</Label>
                  <Input
                    id="api-token"
                    type="password"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder="Enter your API token"
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional authentication token sent as X-TOKEN-API header
                  </p>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <h4 className="font-medium mb-2">Information sur l'API</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      <strong>Endpoint:</strong> POST {apiBaseUrl}
                      /api/infractions
                    </p>
                    <p>
                      <strong>Headers:</strong> Tenantnamespace:{" "}
                      {tenantNamespace}, Language: {language}
                    </p>
                    <p>
                      <strong>Version OpenAPI:</strong> 3.1.0
                    </p>
                    <p>
                      <strong>Description:</strong> API sur les exports
                      spécifiques - Exports sur les infractions
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">
                    Note importante
                  </h4>
                  <p className="text-sm text-yellow-700">
                    Assurez-vous que votre API supporte les requêtes CORS si
                    elle est hébergée sur un domaine différent, ou configurez un
                    proxy pour éviter les erreurs de CORS.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="query" className="space-y-6">
            {/* Recent Searches */}
            {searchHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Recent Searches</CardTitle>
                      <CardDescription>
                        Click on a recent search to rerun it
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        clearSearchHistory();
                        setSearchHistory([]);
                        toast.success("Search history cleared");
                      }}
                    >
                      Clear All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {getRecentSearches().map((historyItem) => (
                      <div
                        key={historyItem.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer group"
                        onClick={() => {
                          // Load the search parameters
                          setDateRange(historyItem.dateRange);
                          setSelectedTypes(historyItem.selectedTypes);
                          setPerPage(historyItem.query.pageSize || 10);
                          setCurrentPage(1);
                          if (historyItem.tenantNamespace) {
                            setTenantNamespace(historyItem.tenantNamespace);
                          }
                          if (historyItem.language) {
                            setLanguage(historyItem.language);
                          }

                          toast.success("Search parameters loaded", {
                            description:
                              "Ready to search with previous criteria",
                          });
                        }}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {historyItem.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(historyItem.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Load the search parameters and run search immediately
                              setDateRange(historyItem.dateRange);
                              setSelectedTypes(historyItem.selectedTypes);
                              setPerPage(historyItem.query.pageSize || 10);
                              setCurrentPage(1);
                              if (historyItem.tenantNamespace) {
                                setTenantNamespace(historyItem.tenantNamespace);
                              }
                              if (historyItem.language) {
                                setLanguage(historyItem.language);
                              }

                              toast.loading("Running search from history...", {
                                id: "history-search",
                              });

                              // Trigger search after state update
                              setTimeout(() => {
                                handleSearch();
                              }, 100);
                            }}
                          >
                            <Search className="h-4 w-4 mr-1" />
                            Run
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newHistory = removeFromSearchHistory(
                                historyItem.id,
                              );
                              setSearchHistory(newHistory);
                              toast.success("Search removed from history");
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Search Infractions</CardTitle>
                <CardDescription>
                  Configure your query parameters to retrieve infraction data
                  from the API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
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
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(date) =>
                            date &&
                            setDateRange((prev) => ({ ...prev, from: date }))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
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
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.to}
                          onSelect={(date) =>
                            date &&
                            setDateRange((prev) => ({ ...prev, to: date }))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Per Page */}
                <div className="space-y-2">
                  <Label htmlFor="per-page">Results per page</Label>
                  <Select
                    value={perPage.toString()}
                    onValueChange={(value) => setPerPage(parseInt(value))}
                  >
                    <SelectTrigger className="w-full">
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

                {/* Ordering Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="order-by-date"
                      checked={orderByDate}
                      onCheckedChange={setOrderByDate}
                    />
                    <Label
                      htmlFor="order-by-date"
                      className="text-sm font-normal leading-none"
                    >
                      Order by date
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="order-desc"
                      checked={orderDesc}
                      onCheckedChange={setOrderDesc}
                      disabled={!orderByDate}
                    />
                    <Label
                      htmlFor="order-desc"
                      className="text-sm font-normal leading-none"
                    >
                      Descending order
                    </Label>
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
                        onClick={() => {
                          setSelectedTypes([...INFRACTION_TYPES]);
                          toast.success("All infraction types selected");
                        }}
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTypes([]);
                          toast.success("All infraction types deselected");
                        }}
                      >
                        Deselect All
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Leave empty to retrieve all types, or select specific types
                    to filter. Selected: {selectedTypes.length}/
                    {INFRACTION_TYPES.length}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {INFRACTION_TYPES.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={type}
                          checked={selectedTypes.includes(type)}
                          onCheckedChange={() => handleTypeToggle(type)}
                        />
                        <Label
                          htmlFor={type}
                          className="text-sm font-normal leading-none"
                        >
                          {type.replace(/([A-Z])/g, " $1").trim()}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Curl Command Display */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Generated cURL Command</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(generateCurlCommand());
                        toast.success("cURL command copied to clipboard!");
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                      {generateCurlCommand()}
                    </pre>
                  </div>
                </div>

                <Button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Search className="mr-2 h-4 w-4" />
                  {isLoading ? "Searching..." : "Search Infractions"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {results ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Search Results</CardTitle>
                      <CardDescription>
                        {results.data
                          ? `Found ${results.data.totalCount} infractions (Page ${(results.data.pageIndex || 0) + 1} of ${results.data.pageCount})`
                          : "No results found"}
                      </CardDescription>
                    </div>
                    {results.data?.items && results.data.items.length > 0 && (
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {results.data?.items && results.data.items.length > 0 ? (
                    <div className="space-y-4">
                      <div className="rounded-lg border">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[600px]">
                            <thead>
                              <tr className="border-b bg-muted/50">
                                <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-medium">
                                  Driver
                                </th>
                                <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-medium">
                                  Type
                                </th>
                                <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-medium">
                                  Date
                                </th>
                                <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-medium">
                                  Duration
                                </th>
                                <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-medium">
                                  Fine
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {results.data.items.map((infraction, index) => (
                                <tr
                                  key={infraction.infractionId}
                                  className={
                                    index % 2 === 0
                                      ? "bg-background"
                                      : "bg-muted/20"
                                  }
                                >
                                  <td className="px-2 md:px-4 py-3">
                                    <div>
                                      <div className="font-medium text-sm">
                                        {infraction.nomConducteur}
                                      </div>
                                      {infraction.permisNumero && (
                                        <div className="text-xs text-muted-foreground">
                                          License: {infraction.permisNumero}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-2 md:px-4 py-3">
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {infraction.typeInfractionLibelle
                                        ?.replace(/([A-Z])/g, " $1")
                                        .trim() || "Unknown"}
                                    </Badge>
                                  </td>
                                  <td className="px-2 md:px-4 py-3 text-xs md:text-sm">
                                    {format(
                                      new Date(infraction.dateInfraction),
                                      "MMM dd, yyyy",
                                    )}
                                  </td>
                                  <td className="px-2 md:px-4 py-3 text-xs md:text-sm">
                                    {formatDuration(infraction.dureeEffectuee)}
                                  </td>
                                  <td className="px-2 md:px-4 py-3">
                                    {infraction.amendeMontant ? (
                                      <span className="font-medium text-sm">
                                        €{infraction.amendeMontant}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground text-sm">
                                        —
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Pagination */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!results.data.hasPreviousPage}
                            onClick={() => {
                              const newPage = Math.max(1, currentPage - 1);
                              setCurrentPage(newPage);
                              toast.loading(`Loading page ${newPage}...`, {
                                id: "pagination-toast",
                              });
                              // Trigger search with new page
                              setTimeout(handleSearch, 0);
                            }}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!results.data.hasNextPage}
                            onClick={() => {
                              const newPage = currentPage + 1;
                              setCurrentPage(newPage);
                              toast.loading(`Loading page ${newPage}...`, {
                                id: "pagination-toast",
                              });
                              // Trigger search with new page
                              setTimeout(handleSearch, 0);
                            }}
                          >
                            Next
                          </Button>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Page {(results.data.pageIndex || 0) + 1} of{" "}
                          {results.data.pageCount}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        No infractions found
                      </h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search criteria or date range.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No search performed yet
                  </h3>
                  <p className="text-muted-foreground">
                    Use the Query Interface tab to search for infractions.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
