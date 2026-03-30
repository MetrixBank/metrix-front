import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/supabaseClient';
import { detectDuplicateCustomers } from '@/lib/customerDeduplication';
import { syncCustomerDataFromActivities } from '@/lib/syncCrmDataToCustomer';
import { Loader2, RefreshCw, Layers, CheckCircle } from 'lucide-react';

const DataSyncValidationPage = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [testResults, setTestResults] = useState(null);

    const log = (msg, type = 'info') => {
        setLogs(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
    };

    const runValidation = async () => {
        if (!user) {
            log('User not authenticated', 'error');
            return;
        }

        setIsRunning(true);
        setLogs([]);
        setTestResults(null);
        log('Starting Data Sync & Deduplication Validation...');

        try {
            // 1. Fetch Sample Customers
            log('Fetching customers...');
            const { data: customers, error: custError } = await supabase
                .from('customers')
                .select('*')
                .eq('distributor_id', user.id)
                .limit(50);
            
            if (custError) throw custError;
            log(`Fetched ${customers.length} sample customers.`);

            // 2. Test Deduplication Logic
            log('Testing duplicate detection logic...');
            const duplicates = detectDuplicateCustomers(customers);
            log(`Found ${duplicates.length} duplicate groups in sample.`);
            
            // 3. Test Sync Function (Pick first customer with empty fields)
            const incompleteCustomer = customers.find(c => !c.phone || !c.email || !c.cpf_cnpj);
            
            let syncResult = null;
            if (incompleteCustomer) {
                log(`Testing sync on customer: ${incompleteCustomer.name} (ID: ${incompleteCustomer.id})`);
                syncResult = await syncCustomerDataFromActivities(incompleteCustomer.id, user.id);
                log(`Sync Result: ${syncResult.message}`);
                if (syncResult.success && Object.keys(syncResult.changes).length > 0) {
                     log(`Changes applied: ${JSON.stringify(syncResult.changes)}`, 'success');
                }
            } else {
                log('No incomplete customers found in sample to test sync.', 'warning');
            }

            setTestResults({
                sampleSize: customers.length,
                duplicateGroups: duplicates.length,
                syncTest: syncResult ? (syncResult.success ? 'Success' : 'Failed') : 'Skipped'
            });

        } catch (error) {
            log(`Error: ${error.message}`, 'error');
        } finally {
            setIsRunning(false);
            log('Validation completed.');
        }
    };

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-3xl font-bold">Data Sync Validation (Admin)</h1>
            <p className="text-muted-foreground">
                Use this dashboard to verify that customer deduplication logic and CRM activity syncing are working correctly.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Validation Controls</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button 
                            onClick={runValidation} 
                            disabled={isRunning}
                            className="w-full"
                        >
                            {isRunning ? <Loader2 className="mr-2 animate-spin"/> : <RefreshCw className="mr-2"/>}
                            Run Full Diagnostics
                        </Button>
                        
                        {testResults && (
                            <div className="mt-4 space-y-2 p-4 bg-muted/20 rounded-lg border">
                                <h3 className="font-semibold mb-2">Results Summary</h3>
                                <div className="flex justify-between items-center">
                                    <span>Sample Size:</span>
                                    <Badge variant="outline">{testResults.sampleSize}</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-2"><Layers className="w-4 h-4"/> Duplicates Found:</span>
                                    <Badge className={testResults.duplicateGroups > 0 ? "bg-amber-500" : "bg-emerald-500"}>
                                        {testResults.duplicateGroups} Groups
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Sync Test:</span>
                                    <Badge variant={testResults.syncTest === 'Success' ? 'default' : 'destructive'}>
                                        {testResults.syncTest}
                                    </Badge>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="h-[400px] flex flex-col">
                    <CardHeader>
                        <CardTitle>Execution Logs</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto bg-black/5 p-4 font-mono text-xs">
                        {logs.length === 0 ? (
                            <div className="text-center text-muted-foreground mt-20">Waiting to start...</div>
                        ) : (
                            <div className="space-y-1">
                                {logs.map((log, idx) => (
                                    <div key={idx} className={`
                                        ${log.type === 'error' ? 'text-red-500 font-bold' : ''}
                                        ${log.type === 'success' ? 'text-emerald-600 font-bold' : ''}
                                        ${log.type === 'warning' ? 'text-amber-500' : ''}
                                    `}>
                                        <span className="text-muted-foreground">[{log.time}]</span> {log.msg}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DataSyncValidationPage;