import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Medal, Crown, Star, TrendingUp } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const RankingGamificado = ({ rankingData, loading, activeGoalTitle }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-slate-800/50 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!rankingData || rankingData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800 text-center">
        <Trophy className="w-16 h-16 text-slate-700 mb-4" />
        <h3 className="text-xl font-bold text-white">Ranking Indisponível</h3>
        <p className="text-slate-400">Nenhum dado de progresso encontrado para as metas de equipe ativas.</p>
      </div>
    );
  }

  const topThree = rankingData.slice(0, 3);
  const restOfRanking = rankingData.slice(3);

  const getPositionColor = (index) => {
    switch (index) {
      case 0: return 'from-yellow-400 to-yellow-600 shadow-yellow-500/20'; // Gold
      case 1: return 'from-slate-300 to-slate-400 shadow-slate-400/20'; // Silver
      case 2: return 'from-orange-400 to-orange-600 shadow-orange-500/20'; // Bronze
      default: return 'from-violet-500 to-purple-600 shadow-purple-500/20';
    }
  };

  const getMedalIcon = (index) => {
    switch (index) {
      case 0: return <Crown className="w-6 h-6 text-white drop-shadow-md" />;
      case 1: return <Medal className="w-6 h-6 text-white drop-shadow-md" />;
      case 2: return <Medal className="w-6 h-6 text-white drop-shadow-md" />;
      default: return <span className="text-white font-bold">{index + 1}º</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            {activeGoalTitle || "Ranking de Metas"}
        </h2>
        <p className="text-slate-400">Confira quem está liderando a corrida!</p>
      </div>

      {/* Top 3 Podium Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mb-12">
        {/* Second Place */}
        {topThree[1] && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="order-2 md:order-1"
          >
            <RankingCard user={topThree[1]} index={1} color={getPositionColor(1)} icon={getMedalIcon(1)} />
          </motion.div>
        )}

        {/* First Place */}
        {topThree[0] && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="order-1 md:order-2 -mt-12 z-10"
          >
            <RankingCard user={topThree[0]} index={0} color={getPositionColor(0)} icon={getMedalIcon(0)} isChampion />
          </motion.div>
        )}

        {/* Third Place */}
        {topThree[2] && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="order-3 md:order-3"
          >
            <RankingCard user={topThree[2]} index={2} color={getPositionColor(2)} icon={getMedalIcon(2)} />
          </motion.div>
        )}
      </div>

      {/* Rest of Ranking List */}
      {restOfRanking.length > 0 && (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Classificação Geral
          </h3>
          <div className="space-y-3">
            {restOfRanking.map((user, idx) => (
              <motion.div
                key={user.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300 text-sm">
                  {idx + 4}º
                </div>
                <Avatar className="w-10 h-10 border border-slate-600">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback>{user.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{user.name}</p>
                  <div className="flex items-center gap-2">
                    <Progress value={user.percentage} className="h-1.5 w-24 bg-slate-700" indicatorClassName="bg-purple-500" />
                    <span className="text-xs text-slate-400">{Math.round(user.percentage)}%</span>
                  </div>
                </div>
                <div className="text-right">
                    <div className="font-bold text-white">{formatNumber(user.current_value)}</div>
                    <div className="text-xs text-slate-400">pontos</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const RankingCard = ({ user, index, color, icon, isChampion }) => {
  return (
    <Card className={cn(
      "relative overflow-hidden border-0 bg-gradient-to-b from-slate-800 to-slate-900 transition-all duration-300 hover:-translate-y-2",
      isChampion ? "shadow-2xl shadow-yellow-500/10 ring-1 ring-yellow-500/30" : "shadow-xl"
    )}>
      {/* Decorative Background Glow */}
      <div className={cn("absolute top-0 inset-x-0 h-1 bg-gradient-to-r", color)} />
      
      <CardContent className={cn("p-6 flex flex-col items-center text-center", isChampion ? "pt-10" : "pt-8")}>
        {/* Badge */}
        <div className={cn(
          "absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br shadow-lg",
          color
        )}>
          {icon}
        </div>

        {/* Avatar */}
        <div className="relative mb-4">
          <Avatar className={cn(
            "border-4", 
            isChampion ? "w-24 h-24 border-yellow-500/50" : "w-20 h-20 border-slate-700"
          )}>
            <AvatarImage src={user.avatar_url} className="object-cover" />
            <AvatarFallback className="bg-slate-700 text-slate-300 text-xl font-bold">
              {user.name?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isChampion && (
            <div className="absolute -bottom-2 -right-2 bg-yellow-500 rounded-full p-1.5 shadow-lg border-2 border-slate-900">
               <Star className="w-4 h-4 text-slate-900 fill-slate-900" />
            </div>
          )}
        </div>

        {/* Info */}
        <h3 className="text-lg font-bold text-white mb-1 line-clamp-1 w-full px-2">{user.name}</h3>
        <p className={cn("text-xs font-medium uppercase tracking-wider mb-4", 
            index === 0 ? "text-yellow-400" : index === 1 ? "text-slate-400" : "text-orange-400"
        )}>
            {index === 0 ? 'Campeão' : index === 1 ? 'Vice-Campeão' : '3º Lugar'}
        </p>

        {/* Stats */}
        <div className="w-full space-y-3 bg-slate-900/50 rounded-xl p-3 border border-slate-800">
            <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Pontuação</span>
                <span className="font-bold text-white">{formatNumber(user.current_value)}</span>
            </div>
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                    <span>Progresso</span>
                    <span>{Math.round(user.percentage)}%</span>
                </div>
                <Progress value={user.percentage} className="h-2 bg-slate-800" indicatorClassName={cn("bg-gradient-to-r", color)} />
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RankingGamificado;