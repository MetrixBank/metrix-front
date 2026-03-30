import React, { useState, useEffect } from 'react';
    import { motion } from 'framer-motion';
    import { supabase } from '@/lib/supabaseClient';
    import { useToast } from '@/components/ui/use-toast';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
    import { Crown, Gem, Sparkles, Medal, User, GraduationCap, Loader2 } from 'lucide-react';
    import { useAuth } from '@/hooks/useAuth';
    import CelebrationAnimation from '@/components/management/goals/CelebrationAnimation';
    import { useDataSync } from '@/contexts/DataSyncContext';

    const PodiumItem = ({ distributor, rank }) => {
      const podiumConfig = {
        1: {
          height: 'h-40 sm:h-48',
          borderColor: 'border-blue-400',
          bgColor: 'bg-blue-400/20',
          icon: <Crown className="w-7 h-7 sm:w-8 sm:h-8 text-blue-400" />,
          textColor: 'text-blue-400',
          textSize: 'text-xl sm:text-2xl',
          rankText: '1º LUGAR'
        },
        2: {
          height: 'h-36 sm:h-40',
          borderColor: 'border-purple-400',
          bgColor: 'bg-purple-400/20',
          icon: <Medal className="w-6 h-6 sm:w-7 sm:h-7 text-purple-400" />,
          textColor: 'text-purple-400',
          textSize: 'text-lg sm:text-xl',
          rankText: '2º LUGAR'
        },
        3: {
          height: 'h-32 sm:h-32',
          borderColor: 'border-indigo-400',
          bgColor: 'bg-indigo-400/20',
          icon: <Medal className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />,
          textColor: 'text-indigo-400',
          textSize: 'text-base sm:text-lg',
          rankText: '3º LUGAR'
        },
      };

      const config = podiumConfig[rank];
      const userInitials = distributor.distributor_name ? distributor.distributor_name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

      return (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: rank * 0.2 }}
          className={`flex flex-col items-center justify-end ${config.height}`}
        >
          <Avatar className="w-16 h-16 sm:w-20 sm:h-20 mb-2 border-4" style={{ borderColor: config.borderColor.replace('border-', '') }}>
            <AvatarImage src={distributor.avatar_url} alt={distributor.distributor_name} />
            <AvatarFallback className="bg-primary/20 text-primary font-bold">{userInitials}</AvatarFallback>
          </Avatar>
          <p className="font-bold text-center text-sm w-24 sm:w-32 break-words">{distributor.distributor_name}</p>
          <div className="flex items-center text-xs text-muted-foreground">
            <Gem className="w-3 h-3 mr-1 text-blue-500" />
            {distributor.total_tokens.toLocaleString('pt-BR')}
          </div>
          <div className={`mt-2 flex-grow flex items-center justify-center w-24 sm:w-32 rounded-t-lg ${config.bgColor} border-t-4 ${config.borderColor} p-2`}>
            <div className="text-center">
                {config.icon}
                <p className={`font-bold ${config.textSize} ${config.textColor}`}>{config.rankText}</p>
            </div>
          </div>
        </motion.div>
      );
    };


    const TokenRankingGoal = ({ distributorType = 'all', teamMemberIds = null }) => {
      const [ranking, setRanking] = useState([]);
      const [loading, setLoading] = useState(true);
      const [showCelebration, setShowCelebration] = useState(false);
      const { user } = useAuth();
      const { syncKey } = useDataSync();
      const { toast } = useToast();

      useEffect(() => {
        const fetchRanking = async () => {
          setLoading(true);
          try {
            const params = {};
            if (teamMemberIds && teamMemberIds.length > 0) {
              params.p_team_member_ids = teamMemberIds;
            } else {
              params.p_distributor_type = distributorType === 'all' ? null : distributorType;
            }

            const { data, error } = await supabase.rpc('get_token_ranking', params);
            if (error) throw error;
            
            const rankedData = data || [];
            setRanking(rankedData);

            if(user && rankedData.length > 0 && rankedData[0].distributor_id === user.id) {
                setShowCelebration(true);
            }

          } catch (error) {
            toast({ title: "Erro ao buscar ranking de tokens", description: error.message, variant: "destructive" });
          } finally {
            setLoading(false);
          }
        };

        fetchRanking();
      }, [distributorType, user, syncKey, toast, teamMemberIds]);

      const handleAnimationComplete = () => {
        setShowCelebration(false);
      };

      return (
        <Card className="relative card-gradient shadow-xl border-border/30 overflow-hidden">
          {showCelebration && <CelebrationAnimation onAnimationComplete={handleAnimationComplete} />}
          <CardHeader>
            <div className="flex items-center space-x-4">
                <Gem className="w-8 h-8 text-blue-500" />
                <div>
                    <CardTitle className="text-2xl text-gradient">Corrida para a Graduação</CardTitle>
                    <CardDescription>Acumule tokens e garanta seu lugar na elite em Novembro!</CardDescription>
                </div>
            </div>
            <div className="flex items-center text-sm text-muted-foreground mt-2">
                <GraduationCap className="w-4 h-4 mr-2"/>
                Foco: Graduação de Novembro
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
            ) : ranking.length === 0 ? (
              <div className="text-center py-16">
                <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="font-semibold">A corrida pelos tokens já começou!</p>
                <p className="text-muted-foreground text-sm">Faça suas vendas e acumule para aparecer no ranking.</p>
              </div>
            ) : (
              <div>
                <div className="flex justify-center items-end space-x-2 sm:space-x-4 h-56 sm:h-64 mb-6">
                  {ranking[1] && <PodiumItem distributor={ranking[1]} rank={2} />}
                  {ranking[0] && <PodiumItem distributor={ranking[0]} rank={1} />}
                  {ranking[2] && <PodiumItem distributor={ranking[2]} rank={3} />}
                </div>
                
                {(ranking.length > 3) && (
                  <div className="space-y-2 mt-8 border-t border-border/30 pt-4">
                     <h4 className="font-semibold text-center text-muted-foreground text-sm mb-3">OUTROS DESTAQUES</h4>
                    {ranking.slice(3).map((distributor, index) => {
                      const userInitials = distributor.distributor_name ? distributor.distributor_name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
                      return (
                      <motion.div
                        key={distributor.distributor_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-background/50 rounded-lg border"
                      >
                        <div className="flex items-center space-x-3">
                            <p className="font-bold text-lg text-primary w-6 text-center">{index + 4}</p>
                            <Avatar className="w-10 h-10">
                                <AvatarImage src={distributor.avatar_url} alt={distributor.distributor_name} />
                                <AvatarFallback className="bg-primary/20 text-primary font-bold">{userInitials}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium text-sm">{distributor.distributor_name}</p>
                            </div>
                        </div>
                        <div className="flex items-center font-semibold text-primary">
                            <Gem className="w-4 h-4 mr-1.5 text-blue-500"/>
                            {distributor.total_tokens.toLocaleString('pt-BR')}
                        </div>
                      </motion.div>
                    )})}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      );
    };

    export default TokenRankingGoal;