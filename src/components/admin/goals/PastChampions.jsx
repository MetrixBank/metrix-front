import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Crown, Medal, History, Loader2, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, getYear, getMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

const ChampionItem = ({ distributor, rank }) => {
    const rankConfig = {
        1: { icon: <Crown className="w-5 h-5 text-yellow-400" />, color: 'text-yellow-400' },
        2: { icon: <Medal className="w-5 h-5 text-gray-400" />, color: 'text-gray-400' },
        3: { icon: <Medal className="w-5 h-5 text-yellow-600" />, color: 'text-yellow-600' },
    };
    const config = rankConfig[rank] || {};
    const userInitials = distributor.distributor_name ? distributor.distributor_name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

    return (
        <div className="flex items-center justify-between p-2 rounded-md bg-background/50">
            <div className="flex items-center space-x-3">
                <div className={`flex items-center w-6 ${config.color}`}>
                    {config.icon}
                </div>
                <Avatar className="w-8 h-8">
                    <AvatarImage src={distributor.avatar_url} alt={distributor.distributor_name} />
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">{userInitials}</AvatarFallback>
                </Avatar>
                <p className="font-medium text-sm">{distributor.distributor_name}</p>
            </div>
            <p className="font-semibold text-sm text-primary">{parseFloat(distributor.total_points).toFixed(2)} pts</p>
        </div>
    );
};

const variants = {
    enter: (direction) => ({
        x: direction > 0 ? 1000 : -1000,
        opacity: 0,
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
    },
    exit: (direction) => ({
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        opacity: 0,
    }),
};

const PastChampions = ({ rankings: rawRankings, loading }) => {
    const [page, setPage] = useState(0);
    const [direction, setDirection] = useState(0);
    const [monthlyChampions, setMonthlyChampions] = useState([]);

    useEffect(() => {
        if (!rawRankings || rawRankings.length === 0) {
            setMonthlyChampions([]);
            return;
        }

        const currentMonth = getMonth(new Date());
        const currentYear = getYear(new Date());
        
        const groupedByMonth = rawRankings.reduce((acc, curr) => {
            const saleDate = new Date(curr.sale_date);
            const month = getMonth(saleDate);
            const year = getYear(saleDate);

            if (year < currentYear || (year === currentYear && month < currentMonth)) {
                const key = `${year}-${month}`;
                if (!acc[key]) {
                    acc[key] = { year, month: month + 1, rankings: {} };
                }
                if (!acc[key].rankings[curr.distributor_id]) {
                    acc[key].rankings[curr.distributor_id] = { ...curr, total_points: 0 };
                }
                acc[key].rankings[curr.distributor_id].total_points += curr.total_points;
            }
            return acc;
        }, {});

        const finalRankings = Object.values(groupedByMonth)
            .map(group => ({
                ...group,
                ranking: Object.values(group.rankings).sort((a, b) => b.total_points - a.total_points)
            }))
            .sort((a,b) => new Date(b.year, b.month - 1) - new Date(a.year, a.month - 1));
            
        setMonthlyChampions(finalRankings);
        setPage(0);

    }, [rawRankings]);

    if (loading) {
        return (
            <Card className="card-gradient shadow-lg border-border/30">
                <CardHeader>
                    <CardTitle className="text-xl font-semibold text-gradient flex items-center">
                        <History className="w-6 h-6 mr-3 text-primary" />
                        Campeões dos Meses Anteriores
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-center p-8 h-48">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }
    
    if (monthlyChampions.length === 0) {
        return null;
    }

    const paginate = (newDirection) => {
        setDirection(newDirection);
        setPage(prevPage => {
            const newPage = prevPage + newDirection;
            if (newPage < 0) return monthlyChampions.length - 1;
            if (newPage >= monthlyChampions.length) return 0;
            return newPage;
        });
    };

    const currentRanking = monthlyChampions[page];
    if (!currentRanking) return null;

    return (
        <Card className="card-gradient shadow-lg border-border/30 overflow-hidden">
            <CardHeader>
                <CardTitle className="text-xl font-semibold text-gradient flex items-center">
                    <History className="w-6 h-6 mr-3 text-primary" />
                    Campeões dos Meses Anteriores
                </CardTitle>
            </CardHeader>
            <CardContent className="relative h-64 flex items-center justify-center">
                <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                        key={page}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={(e, { offset, velocity }) => {
                            const swipe = Math.abs(offset.x) * velocity.x;
                            if (swipe < -10000) {
                                paginate(1);
                            } else if (swipe > 10000) {
                                paginate(-1);
                            }
                        }}
                        className="absolute w-full px-4"
                    >
                        <div className="bg-background/30 p-4 rounded-lg border border-border/50">
                            <h4 className="text-lg font-semibold text-center text-gradient mb-3 flex items-center justify-center">
                                <Trophy className="w-5 h-5 mr-2 text-accent" />
                                Pódio de {format(new Date(currentRanking.year, currentRanking.month - 1), 'MMMM, yyyy', { locale: ptBR })}
                            </h4>
                            <div className="space-y-2">
                                {currentRanking.ranking.slice(0, 3).map((distributor, index) => (
                                    <ChampionItem key={distributor.distributor_id} distributor={distributor} rank={index + 1} />
                                ))}
                                {currentRanking.ranking.length === 0 && (
                                    <p className="text-center text-sm text-muted-foreground py-4">Nenhum campeão neste mês.</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {monthlyChampions.length > 1 && (
                    <>
                        <Button variant="outline" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full z-10 bg-background/50 hover:bg-background/80" onClick={() => paginate(-1)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full z-10 bg-background/50 hover:bg-background/80" onClick={() => paginate(1)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default PastChampions;