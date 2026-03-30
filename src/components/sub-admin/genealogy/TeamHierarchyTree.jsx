import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import DistributorDetailsPanel from './DistributorDetailsPanel';

// Define rank styles globally so they can be used across components if needed
export const RANKS = {
    'Distribuidor': 'bg-slate-100 text-slate-700 border-slate-200',
    'Master': 'bg-blue-50 text-blue-700 border-blue-200',
    'Executivo': 'bg-green-50 text-green-700 border-green-200',
    'Safira': 'bg-blue-100 text-blue-800 border-blue-300',
    'Rubi': 'bg-red-50 text-red-700 border-red-200',
    'Duplo Rubi': 'bg-red-100 text-red-800 border-red-300',
    'Diamante': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'Duplo Diamante': 'bg-cyan-100 text-cyan-800 border-cyan-300',
    'Triplo Diamante': 'bg-cyan-200 text-cyan-900 border-cyan-400',
    'Brilhante': 'bg-purple-50 text-purple-700 border-purple-200',
    'Brilhante Presidente': 'bg-purple-100 text-purple-800 border-purple-300 font-bold',
};

const TeamHierarchyTree = ({ node, level, onUpdate }) => {
    // Start expanded if it's a root node or if it was forced expanded by search
    const [isExpanded, setIsExpanded] = useState(node.isExpanded || level === 0); 
    const [showDetails, setShowDetails] = useState(false);

    const hasChildren = node.children && node.children.length > 0;
    
    // Determine rank based on distributor_type from DB
    const currentRank = node.distributor_type && RANKS[node.distributor_type] 
        ? node.distributor_type 
        : (node.role === 'sub-admin' ? 'Líder' : 'Distribuidor');
        
    const rankStyle = RANKS[currentRank] || 'bg-slate-100 text-slate-700';

    const handleToggle = (e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const handleRowClick = () => {
        setShowDetails(!showDetails);
    };

    return (
        <div className="w-full">
            {/* User Row */}
            <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`
                    relative flex flex-col bg-card border rounded-lg mb-2 overflow-hidden transition-all duration-200
                    ${showDetails ? 'ring-2 ring-primary/20 shadow-md border-primary/30' : 'hover:bg-accent/5 hover:shadow-sm'}
                `}
                style={{ marginLeft: `${Math.min(level * 24, 48)}px` }} // Indentation logic
            >
                <div 
                    className="flex items-center p-3 cursor-pointer select-none"
                    onClick={handleRowClick}
                >
                    {/* Expand/Collapse Children Button */}
                    <div className="mr-2 shrink-0">
                        {hasChildren ? (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 rounded-full hover:bg-primary/10 text-muted-foreground"
                                onClick={handleToggle}
                            >
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                        ) : (
                            <div className="w-6 h-6" /> // Spacer
                        )}
                    </div>

                    {/* Avatar & Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className={`h-10 w-10 border-2 ${showDetails ? 'border-primary' : 'border-transparent'} transition-colors`}>
                            <AvatarImage src={node.avatar_url} />
                            <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs">
                                {node.name ? node.name.substring(0, 2).toUpperCase() : 'UD'}
                            </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm truncate text-foreground">
                                    {node.name || 'Usuário Desconhecido'}
                                </span>
                                {node.role === 'sub-admin' && (
                                    <ShieldCheck className="w-3 h-3 text-primary" title="Sub-Admin / Líder" />
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                    {node.email}
                                </span>
                                <Badge variant="outline" className={`text-[10px] px-2 py-0 h-5 border shadow-sm ${rankStyle}`}>
                                    {currentRank}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Mini Stats (Right Side) */}
                    <div className="flex items-center gap-6 text-right hidden sm:flex mr-2">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Vendas</span>
                            <span className="text-sm font-bold text-foreground">{node.stats.totalSales}</span>
                        </div>
                        <div className="flex flex-col items-end min-w-[80px]">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Receita</span>
                            <span className="text-sm font-bold text-green-600">{formatCurrency(node.stats.totalRevenue)}</span>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${showDetails ? 'rotate-90' : ''}`} />
                    </div>
                </div>

                {/* Expanded Details Panel */}
                <AnimatePresence>
                    {showDetails && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t bg-muted/30"
                        >
                            <DistributorDetailsPanel node={node} onUpdate={onUpdate} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Children Recursion */}
            <AnimatePresence>
                {isExpanded && hasChildren && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        {node.children.map(child => (
                            <TeamHierarchyTree 
                                key={child.id} 
                                node={child} 
                                level={level + 1} 
                                onUpdate={onUpdate}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeamHierarchyTree;