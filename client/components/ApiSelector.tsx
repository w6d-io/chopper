import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ApiConfig } from "@shared/apis";
import { apiManager } from "@/lib/apiManager";
import { CheckCircle2, AlertCircle, Clock, Shield } from "lucide-react";

interface ApiSelectorProps {
  value?: string;
  onValueChange: (apiName: string) => void;
  className?: string;
}

export function ApiSelector({
  value,
  onValueChange,
  className,
}: ApiSelectorProps) {
  const [apis, setApis] = useState<ApiConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadApis = () => {
      try {
        apiManager.initialize();
        const availableApis = apiManager.getApis();
        setApis(availableApis);

        // Auto-select first API if none selected
        if (!value && availableApis.length > 0) {
          onValueChange(availableApis[0].name);
        }
      } catch (error) {
        console.error("Failed to load APIs:", error);
      } finally {
        setLoading(false);
      }
    };

    loadApis();
  }, [value, onValueChange]);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="h-3 w-3 text-green-600" />;
      case "unhealthy":
        return <AlertCircle className="h-3 w-3 text-red-600" />;
      default:
        return <Clock className="h-3 w-3 text-yellow-600" />;
    }
  };

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select an API">
          {value && (
            <div className="flex items-center space-x-2">
              {getStatusIcon(
                apis.find((api) => api.name === value)?.status || "unknown",
              )}
              <span>{value}</span>
              {apis.find((api) => api.name === value)?.label && (
                <Badge variant="outline" className="text-xs">
                  {apis.find((api) => api.name === value)?.label}
                </Badge>
              )}
              {apis.find((api) => api.name === value)?.requiresAuth && (
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
        {apis.map((api) => (
          <SelectItem key={api.id || `${api.name}-${api.baseUrl}`} value={api.name}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                {getStatusIcon(api.status)}
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
                  api.status === "healthy"
                    ? "default"
                    : api.status === "unhealthy"
                      ? "destructive"
                      : "secondary"
                }
                className="ml-2 text-xs"
              >
                {api.status}
              </Badge>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
