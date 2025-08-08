import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ApiConfig, ApiStatus } from "@shared/apis";
import { apiManager } from "@/lib/apiManager";
import { CheckCircle2, AlertCircle, Clock, Shield } from "lucide-react";

interface ApiSelectorProps {
  value?: string;
  onValueChange: (apiKey: string) => void;
  className?: string;
}

const apiKeyFor = (a: ApiConfig) => a.id || `${a.name}@${a.baseUrl}`;

export function ApiSelector({ value, onValueChange, className }: ApiSelectorProps) {
  // ---- Hooks (always called, no conditionals) ----
  const [apis, setApis] = useState<ApiConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // live statuses keyed by api key
  const [statuses, setStatuses] = useState<Map<string, ApiStatus>>(new Map());

  // ---- Effects ----
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        await apiManager.initialize();
        const availableApis = apiManager.getApis();
        if (!mounted) return;

        setApis(availableApis);
        if (!value && availableApis.length > 0) {
          onValueChange(apiKeyFor(availableApis[0]));
        }

        // initial health load
        const list = await apiManager.checkAllApisHealth();
        if (!mounted) return;
        const map = new Map<string, ApiStatus>();
        for (const s of list) {
          map.set(s.id || `${s.name}@${s.baseUrl}`, s);
        }
        setStatuses(map);
      } catch (e) {
        console.error("Failed to load APIs/statuses:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    // refresh statuses every 60s (matches dashboard)
    const interval = setInterval(async () => {
      try {
        const list = await apiManager.checkAllApisHealth();
        if (!mounted) return;
        const map = new Map<string, ApiStatus>();
        for (const s of list) {
          map.set(s.id || `${s.name}@${s.baseUrl}`, s);
        }
        setStatuses(map);
      } catch (e) {
        console.error("Failed to refresh statuses:", e);
      }
    }, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [onValueChange, value]);

  // ---- Helpers (plain variables, NOT hooks) ----
  const getApiStatus = (a: ApiConfig): string => {
    const key = apiKeyFor(a);
    const s = statuses.get(key);
    return s?.status || a.status || "unknown";
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="h-3 w-3 text-green-600" />;
      case "unhealthy":
        return <AlertCircle className="h-3 w-3 text-red-600" />;
      default:
        return <Clock className="h-3 w-3 text-yellow-600" />;
    }
  };

  // early returns are fine now (no hooks below this point)
  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Loading APIs..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (apis.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="No APIs configured" />
        </SelectTrigger>
      </Select>
    );
  }

  const selectedApi = apis.find((a) => apiKeyFor(a) === value);
  const selectedStatus = selectedApi ? getApiStatus(selectedApi) : "unknown";

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select an API">
          {value && selectedApi && (
            <div className="flex items-center space-x-2">
              {getStatusIcon(selectedStatus)}
              <span>{selectedApi.name}</span>
              {selectedApi.label && (
                <Badge variant="outline" className="text-xs">
                  {selectedApi.label}
                </Badge>
              )}
              {selectedApi.requiresAuth && (
                <Shield
                  className="h-3 w-3 text-blue-600"
                  title="Requires Authentication"
                />
              )}
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {apis.map((api) => {
          const key = apiKeyFor(api);
          const status = getApiStatus(api);
          return (
            <SelectItem key={key} value={key}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(status)}
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <span>{api.name}</span>
                      {api.label && (
                        <Badge variant="outline" className="text-xs">
                          {api.label}
                        </Badge>
                      )}
                      {api.requiresAuth && (
                        <Shield
                          className="h-3 w-3 text-blue-600"
                          title="Requires Authentication"
                        />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {api.baseUrl}
                    </span>
                  </div>
                </div>
                <Badge
                  variant={
                    status === "healthy"
                      ? "default"
                      : status === "unhealthy"
                      ? "destructive"
                      : "secondary"
                  }
                  className="ml-2 text-xs"
                >
                  {status}
                </Badge>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
