import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Activity, CheckCircle, XCircle, RefreshCw, Key, ShieldCheck, Terminal, Play
} from "lucide-react";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useConexzapWebhook } from '@/hooks/useConexzapWebhook';
import { simulateConexzapWebhook } from '@/api/conexzapLocal.js';

export default function WebhookStatusPage() {
  const { user } = useAuth();
  const { callWebhook, generateApiKey, loading } = useConexzapWebhook();
  const [apiKey, setApiKey] = useState('');
  
  // Updated payload structure for test
  const [testPayload, setTestPayload] = useState(JSON.stringify({
    body: {
      method: "contact-create-update",
      contact: {
        name: "Test User",
        number: "5511999998888",
        pushname: "Test Push",
        email: "test@example.com",
        id: "cz_12345"
      }
    },
    timestamp: Math.floor(Date.now() / 1000)
  }, null, 2));

  const [logs, setLogs] = useState([]);
  const [simulationResult, setSimulationResult] = useState(null);

  const handleGenerateKey = async () => {
    if (!user) return;
    const result = await generateApiKey(user.id);
    if (result.success) {
      setApiKey(result.key);
    }
  };

  const getParsedPayload = () => {
    try {
      return JSON.parse(testPayload);
    } catch (e) {
      alert("Invalid JSON format");
      return null;
    }
  };

  const handleTestWebhook = async () => {
    if (!apiKey) {
      alert('Please enter or generate an API Key first.');
      return;
    }
    const payload = getParsedPayload();
    if (!payload) return;

    const result = await callWebhook(payload, apiKey);
    
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      type: result.success ? 'success' : 'error',
      message: result.success ? 'Webhook Delivered' : 'Delivery Failed',
      details: result
    };
    
    setLogs(prev => [newLog, ...prev]);
  };

  const handleSimulation = async () => {
     if (!apiKey) {
        alert('Simulation requires an API key (even if mocked) to validate logic paths.');
        return;
     }
     const payload = getParsedPayload();
     if (!payload) return;

     const result = await simulateConexzapWebhook(payload, apiKey);
     setSimulationResult(result);

     const newLog = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      type: result.success ? 'info' : 'warning',
      message: result.success ? 'Simulation Success' : 'Simulation Failed',
      details: result
    };
    
    setLogs(prev => [newLog, ...prev]);
  };

  return (
    <div className="container mx-auto py-8 space-y-8 animate-in fade-in">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">ConexZap Webhook Monitor</h1>
        <p className="text-muted-foreground">Manage and monitor your ConexZap integration status and health.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </div>
            <p className="text-xs text-muted-foreground">System operational</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Encrypted</div>
            <p className="text-xs text-muted-foreground">API Key Authentication</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Environment</CardTitle>
            <Terminal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Edge</div>
            <p className="text-xs text-muted-foreground">Supabase Functions</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">Dashboard & Keys</TabsTrigger>
          <TabsTrigger value="test">Test & Simulation</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>Manage your webhook API keys securely.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-2">
                 <Label>Current API Key</Label>
                 <div className="flex gap-2">
                   <Input 
                     value={apiKey} 
                     onChange={(e) => setApiKey(e.target.value)} 
                     placeholder="Enter existing key or generate new..."
                     type="password"
                   />
                   <Button onClick={handleGenerateKey} disabled={loading}>
                     {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
                     Generate New
                   </Button>
                 </div>
                 <p className="text-sm text-muted-foreground">
                   Use this key in your ConexZap dashboard as the <code>X-API-Key</code> header.
                 </p>
               </div>
               
               <Separator />
               
               <div className="space-y-2">
                 <Label>Webhook Endpoint URL</Label>
                 <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                   {import.meta.env.VITE_SUPABASE_URL}/functions/v1/conexzap
                 </div>
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="h-full">
               <CardHeader>
                 <CardTitle>Payload Tester</CardTitle>
                 <CardDescription>Send test events to your webhook.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label>JSON Payload</Label>
                    <Textarea 
                      value={testPayload}
                      onChange={(e) => setTestPayload(e.target.value)}
                      className="font-mono text-xs h-[300px]"
                    />
                 </div>
                 
                 <div className="flex gap-2 pt-2">
                    <Button onClick={handleTestWebhook} disabled={loading} className="flex-1">
                       {loading && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
                       Test Real Endpoint
                    </Button>
                    <Button variant="outline" onClick={handleSimulation} disabled={loading} className="flex-1">
                       <Play className="w-4 h-4 mr-2" />
                       Simulate Local
                    </Button>
                 </div>
               </CardContent>
             </Card>

             <Card className="h-full">
               <CardHeader>
                 <CardTitle>Response Console</CardTitle>
                 <CardDescription>Real-time feedback from tests.</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-xs h-[300px] overflow-y-auto whitespace-pre-wrap">
                    {simulationResult ? (
                      JSON.stringify(simulationResult, null, 2)
                    ) : (
                      <span className="text-slate-500">// Waiting for test execution...</span>
                    )}
                 </div>
               </CardContent>
             </Card>
           </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Local log of test activities for this session.</CardDescription>
            </CardHeader>
            <CardContent>
               {logs.length === 0 ? (
                 <div className="text-center py-8 text-muted-foreground">No logs available yet.</div>
               ) : (
                 <div className="space-y-4">
                    {logs.map((log) => (
                      <Alert key={log.id} variant={log.type === 'error' ? 'destructive' : 'default'}>
                        {log.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                        <AlertTitle className="flex justify-between">
                          <span>{log.message}</span>
                          <span className="text-xs font-normal opacity-70">{log.timestamp}</span>
                        </AlertTitle>
                        <AlertDescription className="mt-2">
                          <pre className="text-xs bg-background/50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </AlertDescription>
                      </Alert>
                    ))}
                 </div>
               )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}