import React, { useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Terminal, Send, Database, User } from 'lucide-react';
import RealtimeLeadsList from '@/components/funnel/RealtimeLeadsList';

export default function ConexzapTestPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [manualPhone, setManualPhone] = useState('');
  const [manualName, setManualName] = useState('');

  const handleManualTest = async () => {
    if (!manualName || !manualPhone) {
      toast({ title: "Validation Error", description: "Name and Phone are required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Direct call to edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/conexzap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_CONEXZAP_API_KEY || 'test-key', // User needs to ensure this env var is set or use manual key
          // Note: In a real scenario, we might need to pass the user ID or let the function infer it from the key
        },
        body: JSON.stringify({
          nome: manualName,
          telefone: manualPhone,
          mensagem: "Test message from manual simulation",
          distributor_id: user?.id // Passing explicitly for test purposes if function supports it
        }),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Request failed');

      toast({
        title: "Webhook Sent",
        description: "The webhook was sent successfully. Check the list below for updates.",
        className: "bg-emerald-50 border-emerald-200"
      });
      
      setManualName('');
      setManualPhone('');

    } catch (error) {
      console.error('Test failed:', error);
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-5xl animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">ConexZap Integration Test</h1>
        <p className="text-muted-foreground">
          Validate real-time webhook reception, deduplication logic, and data synchronization.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* User Info Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" /> Current User
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-1 gap-1">
              <span className="text-muted-foreground text-xs uppercase">ID</span>
              <code className="bg-muted p-1 rounded text-xs break-all">{user?.id}</code>
            </div>
            <div className="grid grid-cols-1 gap-1">
              <span className="text-muted-foreground text-xs uppercase">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
          </CardContent>
        </Card>

        {/* Manual Test Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Terminal className="h-4 w-4" /> Manual Webhook Trigger
            </CardTitle>
            <CardDescription>Simulate an incoming webhook from ConexZap</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="grid w-full gap-2">
                <Label htmlFor="name">Lead Name</Label>
                <Input 
                  id="name" 
                  placeholder="John Doe" 
                  value={manualName} 
                  onChange={(e) => setManualName(e.target.value)} 
                />
              </div>
              <div className="grid w-full gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  placeholder="(11) 99999-9999" 
                  value={manualPhone} 
                  onChange={(e) => setManualPhone(e.target.value)} 
                />
              </div>
              <Button onClick={handleManualTest} disabled={loading} className="w-full sm:w-auto">
                {loading ? <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full" /> : <Send className="mr-2 h-4 w-4" />}
                Send
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="live-view" className="w-full">
        <TabsList>
          <TabsTrigger value="live-view" className="flex items-center gap-2">
            <Database className="h-4 w-4" /> Live Data View
          </TabsTrigger>
        </TabsList>
        <TabsContent value="live-view" className="space-y-4 mt-4">
          <RealtimeLeadsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}