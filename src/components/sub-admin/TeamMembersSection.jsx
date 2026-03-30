import React, { useState } from 'react';
import { 
  Users, MoreHorizontal, Edit, Eye, Shield, Coins, Award, Search 
} from 'lucide-react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumberWithSuffix } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';

const TeamMembersSection = ({ members = [], loading }) => {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredMembers = members.filter(member => 
        member.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        member.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAction = (action, member) => {
        toast({
            title: "Funcionalidade em breve",
            description: `A ação de ${action} para ${member.name} será implementada futuramente.`,
        });
    };

    if (loading) {
        return <Skeleton className="w-full h-[400px] rounded-xl bg-slate-800/50" />;
    }

    if (members.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-700 rounded-xl bg-slate-900/50">
                <Users className="w-12 h-12 text-slate-500 mb-4" />
                <h3 className="text-lg font-medium text-slate-300">Nenhum membro encontrado</h3>
                <p className="text-sm text-slate-500 max-w-sm mt-2">
                    Sua equipe ainda não possui membros. Comece convidando distribuidores para sua rede.
                </p>
                <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAction('Convidar', {})}>
                    Convidar Membro
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Buscar membro..." 
                        className="pl-9 bg-slate-900/50 border-slate-700 focus:border-emerald-500/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="text-sm text-slate-400">
                    Total: <span className="text-emerald-400 font-medium">{filteredMembers.length}</span> membros
                </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-900/80">
                        <TableRow className="border-slate-800 hover:bg-transparent">
                            <TableHead className="text-slate-400 font-medium">Membro</TableHead>
                            <TableHead className="text-slate-400 font-medium">Status</TableHead>
                            <TableHead className="text-slate-400 font-medium text-center">Tipo</TableHead>
                            <TableHead className="text-slate-400 font-medium text-right">Pontos</TableHead>
                            <TableHead className="text-slate-400 font-medium text-right">Tokens</TableHead>
                            <TableHead className="text-slate-400 font-medium text-right">Cadastro</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMembers.map((member) => (
                            <TableRow key={member.id} className="border-slate-800 hover:bg-slate-800/50 transition-colors group">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border border-slate-700">
                                            <AvatarImage src={member.avatar_url} />
                                            <AvatarFallback className="bg-slate-800 text-emerald-400 font-semibold">
                                                {member.name?.charAt(0) || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-200">{member.name || 'Sem nome'}</span>
                                            <span className="text-xs text-slate-500">{member.email}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge 
                                        variant="outline" 
                                        className={`capitalize ${
                                            member.registration_status === 'active' || member.registration_status === 'approved'
                                            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' 
                                            : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'
                                        }`}
                                    >
                                        {member.registration_status === 'approved' ? 'Ativo' : member.registration_status || 'Pendente'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex justify-center">
                                        {member.role === 'sub-admin' ? (
                                            <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/20 gap-1">
                                                <Shield className="w-3 h-3" /> Sub-Admin
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20 gap-1">
                                                <Users className="w-3 h-3" /> Distribuidor
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1 text-slate-300 font-mono">
                                        <Award className="w-3 h-3 text-amber-500" />
                                        {formatNumberWithSuffix(member.points || 0)}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1 text-slate-300 font-mono">
                                        <Coins className="w-3 h-3 text-yellow-500" />
                                        {formatNumberWithSuffix(member.tokens || 0)}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right text-xs text-slate-500">
                                    {member.created_at ? format(new Date(member.created_at), 'dd MMM yyyy', { locale: ptBR }) : '-'}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white hover:bg-slate-700">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                                            <DropdownMenuItem onClick={() => handleAction('visualizar', member)} className="text-slate-300 focus:text-white focus:bg-slate-800 cursor-pointer">
                                                <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleAction('editar', member)} className="text-slate-300 focus:text-white focus:bg-slate-800 cursor-pointer">
                                                <Edit className="mr-2 h-4 w-4" /> Editar
                                            </DropdownMenuItem>
                                            <div className="p-1 px-2 text-[10px] text-slate-500 border-t border-slate-800 mt-1">
                                                * Exclusão apenas via Admin Master
                                            </div>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default TeamMembersSection;