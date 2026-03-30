import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Phone, 
  Mail, 
  Calendar, 
  User, 
  MessageSquare, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLeadsRealtime } from '@/hooks/useLeadsRealtime';
import { Skeleton } from '@/components/ui/skeleton';

export default function RealtimeLeadsList() {
  const { leads, loading, error, refetch, isConnected, lastUpdate } = useLeadsRealtime();

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-500 hover:bg-blue-600';
      case 'contacted': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'qualified': return 'bg-purple-500 hover:bg-purple-600';
      case 'converted': return 'bg-emerald-500 hover:bg-emerald-600';
      case 'lost': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const translateStatus = (status) => {
    const map = {
      'new': 'Novo',
      'contacted': 'Contatado',
      'qualified': 'Qualificado',
      'converted': 'Convertido',
      'lost': 'Perdido'
    };
    return map[status] || status;
  };

  return (
    <div className="space-y-4">
      {/* Header with Status Indicators */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/30 p-4 rounded-lg border">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Leads em Tempo Real
            <Badge variant="outline" className="ml-2">
              {leads.length}
            </Badge>
          </h2>
          {isConnected ? (
            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Online
            </Badge>
          ) : (
            <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50 flex items-center gap-1">
              <WifiOff className="w-3 h-3" />
              Offline
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {lastUpdate && (
            <span>
              Atualizado: {format(lastUpdate, 'HH:mm:ss')}
            </span>
          )}
          <Button variant="ghost" size="icon" onClick={refetch} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm">
          Erro ao carregar leads: {error.message}
        </div>
      )}

      {/* Loading State */}
      {loading && leads.length === 0 && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && leads.length === 0 && !error && (
        <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
          <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Nenhum lead encontrado.</p>
          <p className="text-xs">Novos leads aparecerão aqui automaticamente.</p>
        </div>
      )}

      {/* Leads List */}
      <div className="grid gap-4">
        <AnimatePresence initial={false}>
          {leads.map((lead) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              layout
            >
              <Card className="overflow-hidden hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: lead.status === 'new' ? '#3b82f6' : 'transparent' }}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    
                    {/* Main Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{lead.name}</h3>
                        {lead.status === 'new' && (
                          <Badge className="bg-blue-500 hover:bg-blue-600 text-[10px] h-5">Novo</Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {lead.phone}
                        </div>
                        {lead.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {lead.email}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(lead.created_at), "d 'de' MMM 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                    </div>

                    {/* Actions & Status */}
                    <div className="flex flex-col items-end justify-between gap-4">
                      <Badge className={`${getStatusColor(lead.status)} text-white border-0`}>
                        {translateStatus(lead.status)}
                      </Badge>
                      
                      {lead.internal_notes && (
                        <div className="flex items-start gap-1 text-xs text-muted-foreground bg-muted p-2 rounded max-w-xs">
                          <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{lead.internal_notes}</span>
                        </div>
                      )}
                    </div>

                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}