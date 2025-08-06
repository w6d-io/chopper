import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ApiConfig } from '@shared/apis';
import { apiManager } from '@/lib/apiManager';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface ApiSelectorProps {
  value?: string;
  onValueChange: (apiName: string) => void;
  className?: string;
}

export function ApiSelector({ value, onValueChange, className }: ApiSelectorProps) {
  const [apis, setApis] = useState<ApiConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadApis = async () => {
      try {
        await apiManager.initialize();
        const availableApis = apiManager.getApis();
        setApis(availableApis);
        
        // Auto-select first API if none selected
        if (!value && availableApis.length > 0) {
          onValueChange(availableApis[0].name);
        }
      } catch (error) {
        console.error('Failed to load APIs:', error);
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
      case 'healthy': return <CheckCircle2 className="h-3 w-3 text-green-600" />;
      case 'unhealthy': return <AlertCircle className="h-3 w-3 text-red-600" />;
      default: return <Clock className="h-3 w-3 text-yellow-600" />;
    }
  };

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select an API">
          {value && (
            <div className="flex items-center space-x-2">
              {getStatusIcon(apis.find(api => api.name === value)?.status || 'unknown')}
              <span>{value}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {apis.map((api) => (
          <SelectItem key={api.name} value={api.name}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                {getStatusIcon(api.status)}
                <span>{api.name}</span>
              </div>
              <Badge 
                variant={api.status === 'healthy' ? 'default' : api.status === 'unhealthy' ? 'destructive' : 'secondary'}
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
