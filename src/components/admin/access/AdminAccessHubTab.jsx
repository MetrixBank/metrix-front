import React, { useState, useEffect, useCallback } from 'react';
    import { supabase } from '@/lib/supabaseClient';
    import { motion } from 'framer-motion';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Wifi, WifiOff, AlertTriangle, Clock, Users } from 'lucide-react';
    import { subDays, formatDistanceToNow } from 'date-fns';
    import { ptBR } from 'date-fns/locale';
    import { toast } from '@/components/ui/use-toast';

    const AdminAccessHubTab = () => {
        const [onlineUsers, setOnlineUsers] = useState([]);
        const [inactiveUsers, setInactiveUsers] = useState([]);
        const [loading, setLoading] = useState(true);

        const fetchInactiveUsers = useCallback(async () => {
            const sevenDaysAgo = subDays(new Date(), 7).toISOString();
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, email, last_login_at, avatar_url')
                .eq('role', 'distributor')
                .or(`last_login_at.is.null,last_login_at.lt.${sevenDaysAgo}`);

            if (error) {
                console.error('Error fetching inactive users:', error);
                toast({
                    title: 'Erro ao buscar usuários inativos',
                    description: error.message,
                    variant: 'destructive',
                });
            } else {
                setInactiveUsers(data || []);
            }
        }, []);

        useEffect(() => {
            const channel = supabase.channel('online-users');

            const handlePresence = () => {
                const presenceState = channel.presenceState();
                const presences = Object.values(presenceState).flat();
                const distributorPresences = presences.filter(p => p.role === 'distributor');
                const uniqueUsers = Array.from(new Map(distributorPresences.map(item => [item.user_id, item])).values());
                setOnlineUsers(uniqueUsers);
            };

            channel
                .on('presence', { event: 'sync' }, handlePresence)
                .on('presence', { event: 'join' }, handlePresence)
                .on('presence', { event: 'leave' }, handlePresence)
                .subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        handlePresence();
                    }
                });

            const initialLoad = async () => {
                setLoading(true);
                await fetchInactiveUsers();
                setLoading(false);
            };
            initialLoad();

            return () => {
                supabase.removeChannel(channel);
            };
        }, [fetchInactiveUsers]);

        const UserCard = ({ user, isOnline = false }) => {
            const userName = user.name || 'Nome não definido';
            const userEmail = user.email;
            const avatarSrc = user.avatar_url ? `${user.avatar_url}?ts=${new Date().getTime()}` : '';

            return (
                 <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    layout
                    className="flex items-center p-3 bg-background/50 rounded-lg border"
                >
                    <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src={avatarSrc} alt={userName} key={avatarSrc}/>
                        <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow truncate">
                        <p className="font-medium text-sm truncate">{userName}</p>
                        <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                        {!isOnline && (
                            <p className="text-xs text-muted-foreground flex items-center mt-1">
                                <Clock className="w-3 h-3 mr-1 shrink-0" />
                                {user.last_login_at 
                                    ? `Último acesso: ${formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true, locale: ptBR })}`
                                    : 'Nunca acessou'
                                }
                            </p>
                        )}
                    </div>
                </motion.div>
            );
        };

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
                <Card className="card-gradient shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-xl text-gradient flex items-center">
                            <Wifi className="w-6 h-6 mr-3 text-green-400" />
                            Distribuidores Online ({onlineUsers.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading && onlineUsers.length === 0 ? (
                            <p className="text-muted-foreground">Carregando...</p>
                        ) : onlineUsers.length > 0 ? (
                            <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar pr-2">
                                {onlineUsers.map(user => <UserCard key={user.user_id} user={user} isOnline={true} />)}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <WifiOff className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">Nenhum distribuidor online no momento.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="card-gradient shadow-xl border-amber-500/30">
                    <CardHeader>
                        <CardTitle className="text-xl text-gradient flex items-center">
                            <AlertTriangle className="w-6 h-6 mr-3 text-amber-400" />
                            Alerta de Inatividade ({inactiveUsers.length})
                        </CardTitle>
                        <CardDescription>Distribuidores que não acessam há mais de 7 dias.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading && inactiveUsers.length === 0 ? (
                             <p className="text-muted-foreground">Carregando...</p>
                        ) : inactiveUsers.length > 0 ? (
                            <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar pr-2">
                                {inactiveUsers.map(user => <UserCard key={user.id} user={user} />)}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">Nenhum distribuidor inativo. Bom trabalho!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        );
    };

    export default AdminAccessHubTab;