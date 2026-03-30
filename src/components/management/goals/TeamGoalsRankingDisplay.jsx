import React, { useState, useEffect } from 'react';
import GoalRankingCard from './GoalRankingCard';
import RankingList from './RankingList';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

const TeamGoalsRankingDisplay = ({ goal }) => {
    const { user } = useAuth();
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalProgress, setTotalProgress] = useState(0);

    const fetchRankingData = async () => {
        try {
            setLoading(true);
            
            // 1. Fetch participants (users who are part of the team or explicitly added)
            // For simplicity, we'll fetch goal_progress directly which acts as participation + score
            // Or join goal_participants with goal_progress if structure implies explicit joining first.
            // Based on previous context, we use goal_progress as the source of truth for "active participants with score"
            // But now we have a goal_participants table. Let's merge.
            
            // Fetch participants
            const { data: participantsData, error: partError } = await supabase
                .from('goal_participants')
                .select(`user_id, user:user_id(id, name, avatar_url)`)
                .eq('goal_id', goal.id);
                
            if (partError) throw partError;
            
            // Fetch scores from goal_progress or rankings table
            // We have a rankings table from previous tasks, let's use that for scores if available
            // OR calculate from goal_progress. Let's assume rankings table is the aggregate source.
            const { data: scoresData, error: scoreError } = await supabase
                .from('rankings')
                .select('user_id, value')
                .eq('goal_id', goal.id);

            if (scoreError) throw scoreError;

            // Merge Data
            const mergedData = (participantsData || []).map(p => {
                const scoreEntry = scoresData?.find(s => s.user_id === p.user_id);
                return {
                    id: p.user.id,
                    userId: p.user.id,
                    name: p.user.name,
                    avatar_url: p.user.avatar_url,
                    points: scoreEntry ? Number(scoreEntry.value) : 0
                };
            });
            
            // Also include users who have a score but maybe weren't in participants list (safety fallback)
            scoresData?.forEach(s => {
                if (!mergedData.find(m => m.userId === s.user_id)) {
                    // Fetch basic user info if missing
                    // Skipping for now to avoid N+1, relying on participants table being accurate
                }
            });

            setParticipants(mergedData);
            
            // Calculate total progress for the goal card
            const total = mergedData.reduce((acc, curr) => acc + curr.points, 0);
            setTotalProgress(total);

        } catch (err) {
            console.error("Error fetching ranking data:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (goal) {
            fetchRankingData();
        }
    }, [goal]);

    // Real-time updates on rankings table
    useEffect(() => {
        if (!goal) return;
        const channel = supabase
            .channel(`rankings_realtime_${goal.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'rankings', filter: `goal_id=eq.${goal.id}` },
                () => {
                    fetchRankingData(); // Re-fetch on change
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [goal]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
                <div className="lg:col-span-1">
                    <Skeleton className="h-full w-full rounded-xl" />
                </div>
                <div className="lg:col-span-2">
                    <Skeleton className="h-full w-full rounded-xl" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>Não foi possível carregar o ranking.</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[500px]">
            {/* Left Column: Goal Details */}
            <div className="lg:col-span-1 h-full">
                <GoalRankingCard goal={goal} currentProgress={totalProgress} />
            </div>

            {/* Right Column: Leaderboard */}
            <div className="lg:col-span-2 h-full min-h-[400px]">
                <RankingList participants={participants} currentUserId={user?.id} />
            </div>
        </div>
    );
};

export default TeamGoalsRankingDisplay;