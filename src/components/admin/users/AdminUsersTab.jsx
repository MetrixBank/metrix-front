import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Users, Filter, RefreshCw, Trash2, ShieldAlert, List, GitBranch as GitTree } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import UserHierarchy from './UserHierarchy';
import GenealogyTree from './GenealogyTree';
import { useAuth } from '@/hooks/useAuth';
import useMediaQuery from '@/hooks/useMediaQuery';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useDataSync } from '@/contexts/DataSyncContext';

const AdminUsersTab = () => {
    const { user: adminUser } = useAuth();
    const [allDistributors, setAllDistributors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchFilter, setSearchFilter] = useState('');
    const [userToDelete, setUserToDelete] = useState(null);
    const [userToPromote, setUserToPromote] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPromoting, setIsPromoting] = useState(false);
    const [viewMode, setViewMode] = useState('list');
    const isMobile = useMediaQuery('(max-width: 767px)');
    const { syncKey, triggerSync } = useDataSync();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Updated to use RPC to get email_confirmed_at from auth.users securely
            const { data, error } = await supabase.rpc('get_admin_users_list');

            if (error) throw error;
            setAllDistributors(data || []);
        } catch (err) {
            console.error(err);
            setError(err.message);
            toast({ title: "Erro ao buscar usuários", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData, syncKey]);
    
    const handleParentChange = async (childId, parentId) => {
        const { data, error } = await supabase
            .from('profiles')
            .update({ parent_id: parentId })
            .eq('id', childId)
            .select()
            .single();

        if (error) {
            toast({ title: "Erro ao atualizar líder", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Líder atualizado com sucesso!", variant: "success" });
            triggerSync();
        }
    };

    const confirmDeleteUser = (user) => {
        setUserToDelete(user);
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        setIsDeleting(true);

        try {
            const { error } = await supabase.rpc('delete_user_and_profile', {
                user_id_to_delete: userToDelete.id
            });
            
            if (error) throw error;

            toast({
                title: "Usuário Excluído!",
                description: `${userToDelete.name} e todos os seus dados foram removidos com sucesso.`,
                variant: "success",
            });
            
            triggerSync();

        } catch (error) {
            console.error("Erro ao excluir usuário:", error);
            toast({
                title: "Erro ao Excluir",
                description: `Não foi possível remover o usuário. Detalhe: ${error.message}`,
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
            setUserToDelete(null);
        }
    };

    const confirmPromoteUser = (user) => {
        setUserToPromote(user);
    };

    const handlePromoteUser = async () => {
        if (!userToPromote) return;
        setIsPromoting(true);
        const newRole = userToPromote.role === 'distributor' ? 'sub-admin' : 'distributor';

        try {
            const { error } = await supabase.rpc('set_user_role', {
                target_user_id: userToPromote.id,
                new_role: newRole
            });

            if (error) throw error;

            toast({
                title: "Perfil Atualizado!",
                description: `${userToPromote.name} agora é ${newRole === 'sub-admin' ? 'Sub-Admin' : 'Distribuidor'}.`,
                variant: "success",
            });
            triggerSync(); // Forces re-fetch of the list to update UI
        } catch (error) {
            console.error("Erro ao promover usuário:", error);
            toast({
                title: "Erro ao Atualizar Perfil",
                description: `Não foi possível alterar o perfil do usuário. Detalhe: ${error.message}`,
                variant: "destructive",
            });
        } finally {
            setIsPromoting(false);
            setUserToPromote(null);
        }
    };

    const filteredDistributors = useMemo(() => {
        let distributors = allDistributors;

        if (searchFilter.trim() === '') {
            return distributors;
        }

        const lowercasedFilter = searchFilter.toLowerCase();
        return distributors.filter(d => 
            (d.name && d.name.toLowerCase().includes(lowercasedFilter)) || 
            (d.email && d.email.toLowerCase().includes(lowercasedFilter))
        );

    }, [allDistributors, searchFilter]);

    if (error) {
        return (
            <div className="text-center text-red-500 p-8">
                <p>Ocorreu um erro ao carregar os dados.</p>
                <Button onClick={fetchData} className="mt-4">Tentar Novamente</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-2xl font-bold text-gradient flex items-center"><Users className="mr-3 w-7 h-7" />Gestão de Usuários</h1>
                <div className="flex items-center gap-2">
                    <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value)} aria-label="Visualização">
                        <ToggleGroupItem value="list" aria-label="Lista">
                            <List className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="tree" aria-label="Árvore">
                            <GitTree className="h-4 w-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                    <Button onClick={fetchData} disabled={loading} size="icon" variant="ghost">
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </motion.div>

            <Card className="card-gradient flex-shrink-0">
                <CardHeader>
                    <CardTitle className="text-md text-gradient flex items-center">
                        <Filter className="w-4 h-4 mr-2"/> Filtros
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Input
                        placeholder="Buscar por nome ou email..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="bg-background/70"
                    />
                </CardContent>
            </Card>

            <div className="flex-grow overflow-auto custom-scrollbar">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : viewMode === 'tree' ? (
                    <GenealogyTree
                        allUsers={allDistributors}
                        filteredUsers={filteredDistributors}
                        onParentChange={handleParentChange}
                        onDeleteUser={confirmDeleteUser}
                        onPromoteUser={confirmPromoteUser}
                        adminUser={adminUser}
                        isMobile={isMobile}
                    />
                ) : (
                    <UserHierarchy 
                        allUsers={allDistributors}
                        filteredUsers={filteredDistributors}
                        onDeleteUser={confirmDeleteUser}
                        onPromoteUser={confirmPromoteUser}
                        onParentChange={handleParentChange}
                        adminUser={adminUser}
                    />
                )}
            </div>
            
            <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl flex items-center gap-2">
                            <Trash2 className="text-destructive"/> Confirmar Exclusão de Usuário
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base pt-2">
                            Você tem certeza que deseja excluir permanentemente o usuário <strong className="text-foreground">{userToDelete?.name}</strong>?
                            <br/><br/>
                            <strong className="text-destructive">Atenção:</strong> Esta ação é irreversível e removerá todos os dados associados a este usuário.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            disabled={isDeleting}
                            onClick={handleDeleteUser}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Excluindo...</> : 'Sim, Excluir Usuário'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={!!userToPromote} onOpenChange={() => setUserToPromote(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl flex items-center gap-2">
                            <ShieldAlert className="text-primary"/> Confirmar Alteração de Perfil
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base pt-2">
                            Você tem certeza que deseja {userToPromote?.role === 'distributor' ? 'promover' : 'rebaixar'} o usuário <strong className="text-foreground">{userToPromote?.name}</strong> para <strong className="text-primary">{userToPromote?.role === 'distributor' ? 'Sub-Admin' : 'Distribuidor'}</strong>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPromoting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            disabled={isPromoting}
                            onClick={handlePromoteUser}
                        >
                            {isPromoting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Alterando...</> : 'Sim, Alterar Perfil'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AdminUsersTab;