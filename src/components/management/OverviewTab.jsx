import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useDataSync } from '@/contexts/DataSyncContext';
import { Button } from '@/components/ui/button';
import MainStatsSlide from '@/components/management/overview/MainStatsSlide';
import MetricsSlide from '@/components/management/overview/MetricsSlide';
import { useNavigate } from 'react-router-dom';

const OverviewTab = ({ user, onNavigate, onOpenActivityModal }) => {
    const { opportunities, payments } = useDataSync();
    const [stats, setStats] = useState({
        tokens: 0,
        points: 0,
        totalPaid: 0,
        transactionCount: 0
    });
    const [currentSlide, setCurrentSlide] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            const totalPaid = payments
                ?.filter(p => p.status === 'paid')
                .reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
            
            const transactionCount = payments?.filter(p => p.status === 'paid').length || 0;

            setStats({
                tokens: user.tokens || 0,
                points: user.points || 0,
                totalPaid,
                transactionCount
            });
        }
    }, [user, payments]);

    // Trend Data Logic
    const trendData = useMemo(() => {
        const data = [];
        let baseValue = stats.totalPaid * 0.6; 
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        
        for (let i = 0; i < 6; i++) {
            const randomJump = Math.random() * (stats.totalPaid * 0.2);
            baseValue = Math.min(stats.totalPaid * 1.2, Math.max(0, baseValue + randomJump));
            data.push({
                name: months[i],
                value: baseValue
            });
        }
        return data;
    }, [stats.totalPaid]);

    // Activity Data Logic
    const activityData = useMemo(() => {
        if (!opportunities) return [];
        return opportunities.slice(0, 7).map(op => ({
            name: new Date(op.created_at).getDate(),
            value: op.sale_value || 0
        }));
    }, [opportunities]);

    const handleNext = () => setCurrentSlide((prev) => (prev === 0 ? 1 : 0));
    const handlePrev = () => setCurrentSlide((prev) => (prev === 1 ? 0 : 1));

    const handleNavigateToStock = () => {
      navigate('/stock');
    };

    return (
        <div className="min-h-screen bg-[#0B0E14] text-white -m-4 sm:-m-6 lg:-m-8 pb-20 relative overflow-hidden font-sans">
            
            {/* Ambient Backgrounds */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#1E2332] to-transparent opacity-50 pointer-events-none" />
            
            {/* Navigation Header Overlay */}
            <div className="absolute top-6 left-0 w-full px-6 flex justify-between items-center z-50 pointer-events-none">
                <Button 
                    variant="ghost" size="icon" 
                    onClick={handlePrev} 
                    className={`rounded-full bg-white/5 hover:bg-white/10 text-white w-8 h-8 pointer-events-auto backdrop-blur-md transition-opacity ${currentSlide === 0 ? 'opacity-30' : 'opacity-100'}`}
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${currentSlide === 0 ? 'bg-white w-3' : 'bg-white/30'}`} />
                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${currentSlide === 1 ? 'bg-white w-3' : 'bg-white/30'}`} />
                </div>
                <Button 
                    variant="ghost" size="icon" 
                    onClick={handleNext} 
                    className={`rounded-full bg-white/5 hover:bg-white/10 text-white w-8 h-8 pointer-events-auto backdrop-blur-md transition-opacity ${currentSlide === 1 ? 'opacity-30' : 'opacity-100'}`}
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>

            {/* Main Carousel Area */}
            <div className="relative w-full h-full min-h-[600px] pt-14">
                <AnimatePresence mode="wait">
                    {currentSlide === 0 ? (
                        <motion.div 
                            key="slide1"
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="absolute inset-0 w-full"
                        >
                            <MainStatsSlide 
                                user={user} 
                                stats={stats} 
                                trendData={trendData} 
                                activityData={activityData} 
                                onNavigateToStock={handleNavigateToStock} 
                            />
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="slide2"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="absolute inset-0 w-full"
                        >
                            <MetricsSlide 
                                stats={stats} 
                                trendData={trendData} 
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Floating Add Button */}
            <div className="fixed bottom-24 right-6 z-50 md:hidden">
                <Button 
                    size="icon" 
                    className="h-14 w-14 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-[0_0_20px_rgba(139,92,246,0.5)] border border-white/20 hover:scale-105 transition-transform"
                    onClick={() => onOpenActivityModal()}
                >
                    <Plus className="h-7 w-7 text-white" />
                </Button>
            </div>
        </div>
    );
};

export default OverviewTab;