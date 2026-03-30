import React from 'react';
import { motion } from 'framer-motion';
import { User, DollarSign, Activity, Trophy, Target } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

const TeamGenealogyNode = ({ node }) => {
    // Use defensive access to node data
    if (!node || !node.data) return null;

    const { data } = node;
    const stats = data.stats || { points: 0, revenue: 0, activities: 0, sales_count: 0 };

    const avatarSrc = data.avatar_url ? `${data.avatar_url}?ts=${new Date().getTime()}` : '';

    // Determine node color based on performance (simple logic)
    const isHighPerformer = (stats.points || 0) > 1000;
    const hasActivity = (stats.activities || 0) > 0;
    
    // Safe formatted money
    const formattedRevenue = formatCurrency(stats.revenue || 0);
    const formattedPoints = (stats.points || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 });

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            className="relative"
        >
            <Card className={`w-[280px] p-3 flex flex-col gap-3 border-l-4 shadow-md backdrop-blur-sm bg-card/90 ${
                isHighPerformer ? 'border-l-yellow-500' : 
                hasActivity ? 'border-l-green-500' : 'border-l-muted'
            }`}>
                <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border border-border">
                        <AvatarImage src={avatarSrc} alt={data.name || 'User'} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {data.name ? data.name.substring(0, 2).toUpperCase() : 'UD'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                        <h4 className="font-semibold text-sm truncate leading-none mb-1">{data.name || 'Usuário Desconhecido'}</h4>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                           {data.role === 'sub-admin' ? <Trophy className="w-3 h-3 text-yellow-500"/> : <User className="w-3 h-3"/>}
                           {data.role === 'sub-admin' ? 'Líder / Sub-Admin' : 'Distribuidor'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                    <div className="flex flex-col bg-muted/30 p-1.5 rounded">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Target className="w-3 h-3" /> Pontos
                        </span>
                        <span className="text-sm font-bold text-primary">
                            {formattedPoints}
                        </span>
                    </div>
                    <div className="flex flex-col bg-muted/30 p-1.5 rounded">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> Vendas
                        </span>
                        <span className="text-sm font-bold text-green-600">
                            {formattedRevenue}
                        </span>
                    </div>
                </div>
                
                <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                     <div className="flex items-center gap-1" title="Total Activities">
                        <Activity className="w-3 h-3" /> {stats.activities || 0} Atividades
                     </div>
                     <div className="flex items-center gap-1" title="Sales Count">
                        <Badge variant="outline" className="h-4 px-1 text-[9px] font-normal">
                           {stats.sales_count || 0} Vendas
                        </Badge>
                     </div>
                </div>
            </Card>
            
            {/* Connection Dot */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-primary rounded-full border-2 border-background z-10" />
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-muted-foreground/50 rounded-full z-10" />
        </motion.div>
    );
};

export default TeamGenealogyNode;