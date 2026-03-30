import React, { useState, useEffect, useCallback } from 'react';
    import { supabase } from '@/lib/supabaseClient';
    import { Button } from '@/components/ui/button';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
    import { toast } from '@/components/ui/use-toast';
    import { Loader2, ArrowDown, ArrowUp, Edit, RotateCw, FileDown, User, Shield } from 'lucide-react';
    import { ScrollArea } from '@/components/ui/scroll-area';
    import { Badge } from '@/components/ui/badge';
    import { exportToPDF } from '@/lib/exportUtils';
    import { formatDateTime } from '@/lib/utils';
    import {
      Tooltip,
      TooltipContent,
      TooltipProvider,
      TooltipTrigger,
    } from "@/components/ui/tooltip";

    const ManualTokenHistoryModal = ({ isOpen, onClose }) => {
      const [logs, setLogs] = useState([]);
      const [loading, setLoading] = useState(false);

      const fetchHistory = useCallback(async () => {
        if (!isOpen) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('manual_token_transactions')
                .select(`
                    id, 
                    tokens_added, 
                    reason, 
                    created_at,
                    admin:admin_id (name, email),
                    distributor:distributor_id (name, email)
                `)
                .order('created_at', { ascending: false });

          if (error) throw error;
          
          setLogs(data);
        } catch (error) {
          console.error("Error fetching manual token history:", error);
          toast({
            title: "Erro ao buscar histórico",
            description: error.message,
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }, [isOpen]);

      useEffect(() => {
        if (isOpen) {
            fetchHistory();
        }

        const channel = supabase
          .channel('manual-token-transactions-realtime-channel')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'manual_token_transactions' }, 
            (payload) => {
              if (isOpen) {
                toast({ title: "Histórico atualizado!", description: "Uma nova transação manual foi registrada." });
                fetchHistory();
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }, [isOpen, fetchHistory]);
      
      const handleExportPDF = () => {
        if (logs.length === 0) {
            toast({ title: "Nenhum dado para exportar.", variant: "destructive" });
            return;
        }

        const formattedData = logs.map(log => ({
            "Data": formatDateTime(log.created_at),
            "Distribuidor": log.distributor?.name || log.distributor?.email || 'N/A',
            "Alteração": `${log.tokens_added > 0 ? '+' : ''}${parseFloat(log.tokens_added).toFixed(4)}`,
            "Realizado Por": log.admin?.name || log.admin?.email || 'Admin',
            "Motivo": log.reason || ''
        }));

        const headers = ["Data", "Distribuidor", "Alteração", "Realizado Por", "Motivo"];
        
        exportToPDF(formattedData, "Histórico de Transações Manuais", headers, `historico_tokens_manuais_${new Date().toISOString().split('T')[0]}.pdf`);
    };

      const LogItem = ({ log }) => {
        const isAddition = log.tokens_added > 0;
        const distributorName = log.distributor?.name || log.distributor?.email || 'Destinatário Desconhecido';
        const performedBy = log.admin?.name || log.admin?.email || 'Admin';

        return (
          <div className="flex items-start space-x-4 p-3 border-b border-border/50 transition-colors hover:bg-muted/50">
            <div className={`mt-1 ${isAddition ? 'text-green-500' : 'text-red-500'}`}>
              <TooltipProvider>
                  <Tooltip>
                      <TooltipTrigger asChild>
                          <span>{isAddition ? <ArrowUp size={20} /> : <ArrowDown size={20} />}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                          <p>{isAddition ? 'Adição' : 'Remoção'} de Tokens</p>
                      </TooltipContent>
                  </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <p className="font-semibold text-sm flex items-center">
                    <User className="w-4 h-4 mr-2 text-muted-foreground"/> {distributorName}
                </p>
                <Badge variant={isAddition ? 'success' : 'destructive'} className="font-mono text-sm">
                  {isAddition ? '+' : ''}{parseFloat(log.tokens_added).toFixed(4)}
                </Badge>
              </div>
              
              <div className="text-xs text-muted-foreground flex items-center justify-between flex-wrap gap-x-4">
                  <span className="flex items-center gap-1.5"><Shield className={`text-muted-foreground`} size={14} /> Realizado por <span className="font-medium">{performedBy}</span></span>
              </div>
              
              <p className="text-xs text-muted-foreground pt-1">
                {formatDateTime(log.created_at)}
              </p>

              {log.reason && (
                <p className="text-sm mt-2 p-2 bg-muted rounded-md text-foreground/80">
                  {log.reason}
                </p>
              )}
            </div>
          </div>
        );
      };

      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-3xl bg-background/90 backdrop-blur-sm border-border">
            <DialogHeader>
              <DialogTitle>Histórico de Transações Manuais</DialogTitle>
              <DialogDescription>
                Registro de todos os ajustes manuais de tokens.
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="h-[60vh] pr-4 -mr-4">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : logs.length > 0 ? (
                <div className="space-y-1">
                  {logs.map(log => <LogItem key={log.id} log={log} />)}
                </div>
              ) : (
                <div className="flex justify-center items-center h-full text-center">
                  <p className="text-muted-foreground">Nenhuma transação manual foi encontrada.</p>
                </div>
              )}
            </ScrollArea>

            <DialogFooter className="justify-between sm:justify-between mt-4">
              <Button type="button" variant="outline" onClick={handleExportPDF} disabled={loading || logs.length === 0}>
                <FileDown className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    };

    export default ManualTokenHistoryModal;