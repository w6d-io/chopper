import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Globe, 
  Search, 
  Code, 
  Settings, 
  FileText,
  Send,
  Copy,
  Activity
} from 'lucide-react';
import { ApiDashboard } from '@/components/ApiDashboard';
import { ApiSelector } from '@/components/ApiSelector';
import { apiManager } from '@/lib/apiManager';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function MultiApiDashboard() {
  const [selectedApi, setSelectedApi] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');
  const [requestEndpoint, setRequestEndpoint] = useState('/api/infractions');
  const [requestMethod, setRequestMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('POST');
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
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-select first API on mount
  useEffect(() => {
    const initializeApi = async () => {
      await apiManager.initialize();
      const apis = apiManager.getApis();
      if (apis.length > 0 && !selectedApi) {
        setSelectedApi(apis[0].name);
      }
    };
    initializeApi();
  }, [selectedApi]);

  const makeApiRequest = async () => {
    if (!selectedApi) {
      toast.error('Please select an API');
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
        toast.error('Invalid JSON in headers');
        return;
      }

      // Prepare request options
      const options: RequestInit = {
        method: requestMethod,
        headers,
      };

      // Add body for POST/PUT requests
      if (['POST', 'PUT'].includes(requestMethod) && requestBody.trim()) {
        try {
          JSON.parse(requestBody); // Validate JSON
          options.body = requestBody;
        } catch {
          toast.error('Invalid JSON in request body');
          return;
        }
      }

      // Make the request through our API manager
      const result = await apiManager.callApi(selectedApi, requestEndpoint, options);
      setResponse(result);
      setActiveTab('tester'); // Switch to tester tab to show results
      toast.success('Request completed successfully');
    } catch (error) {
      console.error('API request failed:', error);
      setResponse({
        error: true,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      toast.error('Request failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const generateCurlCommand = () => {
    if (!selectedApi) return '';

    const api = apiManager.getApi(selectedApi);
    if (!api) return '';

    let headers: Record<string, string> = {};
    try {
      headers = JSON.parse(requestHeaders);
    } catch {
      headers = {};
    }

    let command = `curl -X ${requestMethod} \\\n`;
    command += `  '${api.baseUrl}${requestEndpoint}' \\\n`;
    
    Object.entries(headers).forEach(([key, value]) => {
      command += `  -H '${key}: ${value}' \\\n`;
    });

    if (['POST', 'PUT'].includes(requestMethod) && requestBody.trim()) {
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
              <Globe className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Multi-API Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                  Monitor and interact with multiple API services
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto">
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
            <TabsTrigger value="settings" className="text-sm">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ApiDashboard 
              onApiSelect={(apiName) => {
                setSelectedApi(apiName);
                setActiveTab('tester');
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
                    Configure and send requests to {selectedApi || 'selected'} API
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label>Method</Label>
                      <select
                        className="w-full px-3 py-2 border rounded-md"
                        value={requestMethod}
                        onChange={(e) => setRequestMethod(e.target.value as any)}
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Endpoint</Label>
                      <Input
                        value={requestEndpoint}
                        onChange={(e) => setRequestEndpoint(e.target.value)}
                        placeholder="/api/endpoint"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Headers (JSON)</Label>
                    <Textarea
                      value={requestHeaders}
                      onChange={(e) => setRequestHeaders(e.target.value)}
                      rows={4}
                      className="font-mono text-sm"
                    />
                  </div>

                  {['POST', 'PUT'].includes(requestMethod) && (
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
                      {isLoading ? 'Sending...' : 'Send Request'}
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
                          variant={response.error ? 'destructive' : 'default'}
                          className="text-sm"
                        >
                          {response.error ? 'Error' : 'Success'}
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
                        onClick={() => copyToClipboard(JSON.stringify(response, null, 2))}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Response
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Response Yet</h3>
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
                <CardTitle>API Documentation</CardTitle>
                <CardDescription>
                  Access documentation for your APIs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Documentation</h3>
                  <p className="text-muted-foreground">
                    API documentation will be loaded dynamically based on OpenAPI specs.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
                    <h4 className="font-medium mb-2">Environment Configuration</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      APIs are configured via environment variables. Each API follows the pattern:
                      <code className="bg-background px-1 py-0.5 rounded mx-1">name:base_url</code>
                    </p>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium mb-1">Single API Example:</p>
                        <pre className="text-xs bg-background p-3 rounded border">
API_CONFIGS=infractions:http://localhost:8000
                        </pre>
                      </div>

                      <div>
                        <p className="text-xs font-medium mb-1">Multiple APIs Example:</p>
                        <pre className="text-xs bg-background p-3 rounded border">
{`API_CONFIGS=infractions:http://localhost:8000,users:http://localhost:8001,orders:http://api.example.com
DEFAULT_TENANT=business
DEFAULT_LANGUAGE=en`}
                        </pre>
                      </div>

                      <div>
                        <p className="text-xs font-medium mb-1">Current Configuration:</p>
                        <pre className="text-xs bg-background p-3 rounded border">
{`API_CONFIGS=${process.env.API_CONFIGS || 'Not set'}
DEFAULT_TENANT=${process.env.DEFAULT_TENANT || 'business'}
DEFAULT_LANGUAGE=${process.env.DEFAULT_LANGUAGE || 'en'}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20 p-4">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                      Important Notes
                    </h4>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                      <li>• Restart the server after changing environment variables</li>
                      <li>• Ensure your APIs support CORS or use proper proxy configuration</li>
                      <li>• Health checks expect /liveness and /readiness endpoints</li>
                    </ul>
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
