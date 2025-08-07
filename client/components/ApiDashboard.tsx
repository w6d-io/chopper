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
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Server,
  Globe,
  Settings,
  Shield,
} from "lucide-react";
import { ApiStatus } from "@shared/apis";
import { apiManager } from "@/lib/apiManager";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ApiDashboardProps {
  onApiSelect?: (apiId: string) => void;
  selectedApi?: string;
}

export function ApiDashboard({ onApiSelect, selectedApi }: ApiDashboardProps) {
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadApiStatuses = async () => {
    setIsLoading(true);
    try {
      await apiManager.initialize();
      const statuses = await apiManager.checkAllApisHealth();
      setApiStatuses(statuses);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to load API statuses:", error);
      toast.error("Failed to load API statuses");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshApiStatus = async (apiName: string) => {
    try {
      apiManager.clearHealthCache();
      const health = await apiManager.checkApiHealth(apiName);
      const isHealthy =
        health.liveness?.status === "ok" &&
        health.readiness?.status === "ready";

      setApiStatuses((prev) =>
        prev.map((api) =>
          api.name === apiName
            ? {
                ...api,
                status: isHealthy ? "healthy" : "unhealthy",
                health,
                lastChecked: new Date(),
              }
            : api,
        ),
      );

      toast.success(`${apiName} API status refreshed`);
    } catch (error) {
      toast.error(`Failed to refresh ${apiName} API status`);
    }
  };

  useEffect(() => {
    loadApiStatuses();
    // Auto-refresh every 60 seconds
    const interval = setInterval(loadApiStatuses, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-100 dark:bg-green-900/20";
      case "unhealthy":
        return "text-red-600 bg-red-100 dark:bg-red-900/20";
      default:
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="h-4 w-4" />;
      case "unhealthy":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading && apiStatuses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <CardTitle>API Services</CardTitle>
          </div>
          <CardDescription>Loading API configurations...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (apiStatuses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <CardTitle>API Services</CardTitle>
          </div>
          <CardDescription>No API services configured</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No APIs Configured</h3>
            <p className="text-muted-foreground mb-4">
              Configure your APIs in the environment variables to get started.
            </p>
            <p className="text-sm text-muted-foreground">
              Set{" "}
              <code className="bg-muted px-1 py-0.5 rounded">API_CONFIGS</code>{" "}
              in your environment.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const healthyCount = apiStatuses.filter(
    (api) => api.status === "healthy",
  ).length;
  const unhealthyCount = apiStatuses.filter(
    (api) => api.status === "unhealthy",
  ).length;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total APIs</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiStatuses.length}</div>
            <p className="text-xs text-muted-foreground">Configured services</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {healthyCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Services operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unhealthy</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {unhealthyCount}
            </div>
            <p className="text-xs text-muted-foreground">Services down</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Check</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastRefresh.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {lastRefresh.toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* API Services List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <CardTitle>API Services</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadApiStatuses}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")}
              />
              Refresh All
            </Button>
          </div>
          <CardDescription>
            Monitor and manage your connected API services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiStatuses.map((api) => (
              <div
                key={api.id || `${api.name}-${api.baseUrl}`}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg border transition-colors",
                  selectedApi === (api.id || api.name)
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50",
                  onApiSelect && "cursor-pointer",
                )}
                onClick={() => onApiSelect?.(api.id || api.name)}
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={cn(
                      "flex items-center space-x-2 px-3 py-1 rounded-full",
                      getStatusColor(api.status),
                    )}
                  >
                    {getStatusIcon(api.status)}
                    <span className="text-sm font-medium capitalize">
                      {api.status}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-lg">{api.name}</h3>
                      {api.label && (
                        <Badge variant="secondary" className="text-xs">
                          {api.label}
                        </Badge>
                      )}
                      {api.requiresAuth && (
                        <div className="flex items-center space-x-1">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <span className="text-xs text-blue-600">Auth</span>
                        </div>
                      )}
                      {selectedApi === (api.id || api.name) && (
                        <Badge variant="outline" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {api.baseUrl}
                    </p>
                    {api.lastChecked && (
                      <p className="text-xs text-muted-foreground">
                        Last checked: {api.lastChecked.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Health Details */}
                  <div className="flex space-x-1">
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full",
                        api.health.liveness?.status === "ok"
                          ? "bg-green-500"
                          : "bg-red-500",
                      )}
                      title={`Liveness: ${api.health.liveness?.status || "unknown"}`}
                    />
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full",
                        api.health.readiness?.status === "ready"
                          ? "bg-green-500"
                          : "bg-red-500",
                      )}
                      title={`Readiness: ${api.health.readiness?.status || "unknown"}`}
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      refreshApiStatus(api.name);
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
