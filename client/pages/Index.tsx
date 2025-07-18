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
import {
  INFRACTION_TYPES,
  type InfractionRequest,
  type ApiResult,
  callInfractionsAPI,
} from "@/lib/api";

export default function Index() {
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [perPage, setPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ApiResult | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [apiBaseUrl, setApiBaseUrl] = useState(
    process.env.VITE_API_BASE_URL || "https://votre-api-infractions.com",
  );

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const requestBody: InfractionRequest = {
        start_date: dateRange.from.toISOString(),
        end_date: dateRange.to.toISOString(),
        type_infraction_libelles:
          selectedTypes.length > 0 ? selectedTypes.join(",") : "",
        per_page: perPage,
      };

      // Mise à jour temporaire de l'URL de base
      const originalBaseUrl = (await import("@/lib/api")).API_CONFIG.BASE_URL;
      (await import("@/lib/api")).API_CONFIG.BASE_URL = apiBaseUrl;

      const result = await callInfractionsAPI(requestBody, currentPage);

      // Restaurer l'URL de base originale
      (await import("@/lib/api")).API_CONFIG.BASE_URL = originalBaseUrl;
      setResults(result);
    } catch (error) {
      console.error("Error fetching infractions:", error);
      // Afficher un message d'erreur à l'utilisateur
      setResults({
        status: "error",
        status_code: 500,
        message: error instanceof Error ? error.message : "Erreur inconnue",
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
                {results?.data?.total_items || "—"}
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
                {results?.data?.total_pages || "—"}
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
        <Tabs defaultValue="query" className="space-y-6">
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
                    onChange={(e) => setApiBaseUrl(e.target.value)}
                    placeholder="https://votre-api-infractions.com"
                  />
                  <p className="text-sm text-muted-foreground">
                    L'URL de base de votre API d'infractions. L'endpoint
                    `/api/all` sera automatiquement ajouté.
                  </p>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <h4 className="font-medium mb-2">Information sur l'API</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      <strong>Endpoint:</strong> POST {apiBaseUrl}/api/all
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

                {/* Infraction Types */}
                <div className="space-y-3">
                  <Label>Infraction Types (optional)</Label>
                  <p className="text-sm text-muted-foreground">
                    Leave empty to retrieve all types, or select specific types
                    to filter
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
                          ? `Found ${results.data.total_items} infractions (Page ${results.data.page} of ${results.data.total_pages})`
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
                              // Trigger search with new page
                              setTimeout(handleSearch, 0);
                            }}
                          >
                            Next
                          </Button>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Page {results.data.page} of {results.data.total_pages}
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
