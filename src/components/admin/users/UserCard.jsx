import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Calendar, Crown, Trash2, ShieldCheck, Shield, MoreVertical, User as UserIcon, GitBranch, CheckCircle2, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { formatDate } from '@/lib/utils';

const UserCard = ({ user, onDeleteUser, onPromoteUser, onParentChange, adminUser, allUsers, isDraggable = false }) => {
    const isSubAdmin = user.role === 'sub-admin';
    const isTeamMember = user.distributor_type === 'team';
    const isMasterAdmin = adminUser?.role === 'master-admin';
    const isSelf = adminUser?.id === user.id;
    
    // Email Confirmation Logic
    const isEmailConfirmed = !!user.email_confirmed_at;
    const activationStatusLabel = isEmailConfirmed ? 'Ativada' : 'Não Ativada';
    const activationStatusColor = isEmailConfirmed ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
    const ActivationIcon = isEmailConfirmed ? CheckCircle2 : AlertCircle;

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    };

    const parent = allUsers.find(u => u.id === user.parent_id);

    const handleDragStart = (e) => {
        if (isDraggable) {
            e.dataTransfer.setData("application/reactflow", user.id);
            e.dataTransfer.effectAllowed = 'move';
        }
    };
    
    const avatarSrc = user.avatar_url ? `${user.avatar_url}?ts=${new Date().getTime()}` : '';

    return (
        <motion.div variants={cardVariants} className="h-full" draggable={isDraggable} onDragStart={handleDragStart}>
            <Card className="relative flex flex-col bg-card/80 backdrop-blur-sm border rounded-xl shadow-lg p-3 h-full transition-all duration-300 hover:shadow-primary/20 hover:border-primary/50 overflow-hidden group">
                
                {/* Header Section: Avatar & Basic Info */}
                <div className="flex items-start gap-3 mb-3">
                    <Avatar className={`w-12 h-12 border-2 flex-shrink-0 ${isTeamMember ? 'border-green-400' : 'border-blue-400'}`}>
                        <AvatarImage src={avatarSrc} alt={user.name} key={avatarSrc} />
                        <AvatarFallback className="bg-secondary text-lg">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                         <div className="flex items-center gap-2">
                            <p className="font-bold text-sm truncate text-foreground" title={user.name}>{user.name}</p>
                             {isSubAdmin && <Crown className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
                         </div>
                         <div className="flex flex-col gap-1 mt-1">
                            {/* Email Status Badge */}
                            <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-medium w-fit ${activationStatusColor}`}>
                                <ActivationIcon className="w-3 h-3" />
                                {activationStatusLabel}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact & Registration Info Grid */}
                <div className="grid grid-cols-1 gap-1.5 text-xs bg-secondary/20 p-2.5 rounded-lg mb-2">
                     <div className="flex items-center text-muted-foreground">
                        <Mail className="w-3.5 h-3.5 mr-2 opacity-70 flex-shrink-0" />
                        <span className="truncate" title={user.email}>{user.email}</span>
                     </div>
                     <div className="flex items-center text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 mr-2 opacity-70 flex-shrink-0" />
                        <span className="truncate">{user.phone || 'Não informado'}</span>
                     </div>
                     <div className="flex items-center text-muted-foreground border-t border-border/10 pt-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 mr-2 opacity-70 flex-shrink-0" />
                        <span>Cadastrado em: <span className="font-medium text-foreground">{user.created_at ? formatDate(user.created_at) : '-'}</span></span>
                     </div>
                </div>

                 {/* Footer: Hierarchy Info */}
                <div className="mt-auto pt-2 border-t border-border/30 text-xs flex justify-between items-center text-muted-foreground">
                    <div className="flex items-center gap-1" title={`Líder: ${parent ? parent.name : 'Nenhum'}`}>
                        <GitBranch className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{parent ? parent.name : 'Raiz'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                         {isSubAdmin ? 'Sub-Admin' : 'Distribuidor'}
                    </div>
                </div>

                {/* Actions Menu */}
                {isMasterAdmin && user.role !== 'master-admin' && !isSelf && (
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-secondary">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => onPromoteUser(user)}>
                                    {isSubAdmin ? <Shield className="mr-2 h-4 w-4" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                                    <span>{isSubAdmin ? 'Remover Admin' : 'Tornar Sub-Admin'}</span>
                                </DropdownMenuItem>
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        <GitBranch className="mr-2 h-4 w-4" />
                                        <span>Alterar Líder</span>
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuPortal>
                                        <DropdownMenuSubContent sideOffset={4} className="p-0 w-64">
                                            <Command>
                                                <CommandInput placeholder="Buscar líder..." autoFocus={true} className="h-9" />
                                                <CommandList>
                                                    <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
                                                    <CommandGroup>
                                                        <CommandItem onSelect={() => onParentChange(user.id, null)}>
                                                            <UserIcon className="mr-2 h-4 w-4" />
                                                            <span>Nenhum (Raiz)</span>
                                                        </CommandItem>
                                                        {allUsers
                                                            .filter(u => u.id !== user.id)
                                                            .map(u => (
                                                                <CommandItem key={u.id} onSelect={() => onParentChange(user.id, u.id)}>
                                                                    <UserIcon className="mr-2 h-4 w-4" />
                                                                    <span>{u.name}</span>
                                                                </CommandItem>
                                                            ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </DropdownMenuSubContent>
                                    </DropdownMenuPortal>
                                </DropdownMenuSub>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onDeleteUser(user)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Excluir Usuário</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </Card>
        </motion.div>
    );
};

export default UserCard;