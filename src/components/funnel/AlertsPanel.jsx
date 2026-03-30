import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, TrendingDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useFunnelAlerts } from '@/hooks/useFunnelAlerts';

const AlertCard = ({ alert }) => {
    let Icon = AlertCircle;
    let colorClass = "bg-red-500/10 text-red-500 border-red-500/20";
    
    if (alert.type === 'cooling') {
        Icon = TrendingDown;
        colorClass = "bg-blue-500/10 text-blue-500 border-blue-500/20";
    } else if (alert.type === 'closing') {
        Icon = CheckCircle2;
        colorClass = "bg-green-500/10 text-green-500 border-green-500/20";
    } else if (alert.type === 'risk') {
        Icon = AlertCircle;
        colorClass = "bg-orange-500/10 text-orange-500 border-orange-500/20";
    }

    return (
        <motion.div 
            whileHover={{ scale: 1.02 }}
            className={cn("p-4 rounded-xl border flex items-start gap-4 mb-3 cursor-pointer transition-colors", colorClass)}
        >
            <div className="mt-1">
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm uppercase tracking-wide opacity-90">{alert.title}</h4>
                    <Badge variant="outline" className="text-[10px] h-5">{alert.priority}</Badge>
                </div>
                <p className="font-medium text-base mt-1">{alert.opportunity_name}</p>
                <p className="text-sm opacity-70 mt-0.5">{alert.message}</p>
                
                <div className="mt-3 flex gap-2">
                    <Button size="xs" variant="secondary" className="h-7 text-xs bg-white/10 hover:bg-white/20 border-0">Ver Detalhes</Button>
                </div>
            </div>
        </motion.div>
    );
};

const AlertsPanel = () => {
    const { alerts, loading } = useFunnelAlerts();

    return (
        <Card className="h-full bg-slate-900 border-slate-800 shadow-xl">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-indigo-400" />
                    Alertas de Inteligência
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-4rem)] overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
                    </div>
                ) : (
                    <div className="space-y-1">
                        {alerts.length > 0 ? (
                            alerts.map(alert => (
                                <AlertCard key={alert.id} alert={alert} />
                            ))
                        ) : (
                            <div className="text-center py-10 text-slate-500">
                                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                <p>Tudo em dia! Sem alertas pendentes.</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default AlertsPanel;