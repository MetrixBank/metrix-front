import React from 'react';
import { motion } from 'framer-motion';
import { User, DollarSign, Activity, Trophy, ChevronRight, Mail, Phone } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";

const TeamHierarchyList = ({ users }) => {
    // Safely check for valid users array
    if (!users || !Array.isArray(users) || users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground bg-muted/5 rounded-md border border-dashed m-4">
                <User className="w-12 h-12 mb-4 opacity-20" />
                <p>Nenhum membro encontrado com os filtros atuais.</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-auto max-h-[600px] custom-scrollbar">
            <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                    <TableRow>
                        <TableHead className="w-[300px]">Membro</TableHead>
                        <TableHead className="text-center">Nível</TableHead>
                        <TableHead className="text-right">Pontos (Período)</TableHead>
                        <TableHead className="text-right">Vendas</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user, index) => (
                        <TeamMemberRow key={user?.id || `user-${index}`} user={user} index={index} />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

const TeamMemberRow = ({ user, index }) => {
    const { toast } = useToast();
    
    // Defensive data access - absolute prevention of crashes
    if (!user) return null;
    
    const stats = user.stats || { points: 0, revenue: 0, activities: 0, sales_count: 0 };
    const points = Number(stats.points) || 0;
    const revenue = Number(stats.revenue) || 0;
    const activities = Number(stats.activities) || 0;
    const salesCount = Number(stats.sales_count) || 0;
    const level = Number(user.level) || 0;
    
    // Determine status color
    let statusColor = "bg-slate-100 text-slate-600 border-slate-200";
    let statusText = "Inativo";
    
    if (points > 1000) {
        statusColor = "bg-yellow-50 text-yellow-700 border-yellow-200";
        statusText = "Ouro";
    } else if (activities > 0) {
        statusColor = "bg-blue-50 text-blue-700 border-blue-200";
        statusText = "Ativo";
    }

    const handleEmailClick = (e) => {
        e.stopPropagation();
        try {
            if (user.email) {
                window.location.href = `mailto:${user.email}`;
            } else {
                toast({
                    title: "Email indisponível",
                    description: "Este usuário não possui um email cadastrado.",
                    variant: "destructive"
                });
            }
        } catch (err) {
            console.error("Error opening email:", err);
            toast({
                title: "Erro",
                description: "Não foi possível abrir o cliente de email.",
                variant: "destructive"
            });
        }
    };

    const handlePhoneClick = (e) => {
        e.stopPropagation();
        try {
            if (user.phone) {
                // Ensure phone is treated as string
                const phoneStr = String(user.phone);
                const cleanPhone = phoneStr.replace(/\D/g, '');
                
                if (cleanPhone.length > 0) {
                    window.open(`https://wa.me/${cleanPhone}`, '_blank');
                } else {
                     toast({
                        title: "Número inválido",
                        description: "O formato do telefone não é válido para WhatsApp.",
                        variant: "destructive"
                    });
                }
            } else {
                toast({
                    title: "Telefone indisponível",
                    description: "Este usuário não possui um telefone cadastrado.",
                    variant: "destructive"
                });
            }
        } catch (err) {
            console.error("Error opening WhatsApp:", err);
             toast({
                title: "Erro",
                description: "Ocorreu um erro ao tentar abrir o WhatsApp.",
                variant: "destructive"
            });
        }
    };

    return (
        <motion.tr 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.02, 0.5), duration: 0.3 }} // Cap delay for long lists
            className="group hover:bg-muted/30 border-b transition-colors"
        >
            <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                    {/* Indentation based on level to visualize hierarchy */}
                    <div style={{ width: `${Math.min(level, 10) * 16}px` }} className="shrink-0 transition-all" />
                    
                    {level > 0 && (
                         <div className="text-muted-foreground/30">
                            <ChevronRight className="w-4 h-4" />
                         </div>
                    )}
                    
                    <Avatar className="w-9 h-9 border border-border">
                        <AvatarImage src={user.avatar_url} alt={user.name || 'User'} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {user.name ? user.name.substring(0, 2).toUpperCase() : 'UD'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col max-w-[180px]">
                        <span className="text-sm font-semibold text-foreground flex items-center gap-1 truncate" title={user.name}>
                            {user.name || 'Usuário sem nome'}
                            {user.role === 'sub-admin' && <Trophy className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" />}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-2 truncate" title={user.email}>
                             {user.email || 'Sem email'}
                        </span>
                    </div>
                </div>
            </TableCell>
            <TableCell className="text-center">
                <Badge variant="outline" className="font-mono text-xs">
                    Lvl {level}
                </Badge>
            </TableCell>
            <TableCell className="text-right font-mono text-sm">
                <div className="flex flex-col items-end">
                    <span className="font-bold text-primary">{points.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} pts</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                         <DollarSign className="w-3 h-3" /> {formatCurrency(revenue)}
                    </span>
                </div>
            </TableCell>
            <TableCell className="text-right">
                <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="text-[10px] px-1 h-5">
                        {salesCount} Vendas
                    </Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                        <Activity className="w-3 h-3" /> {activities} Ativ.
                    </span>
                </div>
            </TableCell>
            <TableCell className="text-center">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
                    {statusText}
                </div>
            </TableCell>
            <TableCell className="text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary" 
                        title="Enviar Email" 
                        onClick={handleEmailClick}
                    >
                        <Mail className="w-4 h-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 hover:bg-green-500/10 hover:text-green-600" 
                        title="Contatar via WhatsApp" 
                        onClick={handlePhoneClick}
                        disabled={!user.phone}
                    >
                        <Phone className="w-4 h-4" />
                    </Button>
                </div>
            </TableCell>
        </motion.tr>
    );
};

export default TeamHierarchyList;