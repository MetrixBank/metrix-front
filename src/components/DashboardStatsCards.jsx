import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Coins, Wallet, Star, CreditCard, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLocalization } from '@/contexts/LocalizationContext';

const StatCard = ({ item, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: index * 0.1, type: "spring", stiffness: 200, damping: 20 }}
            className="snap-center shrink-0 w-[85vw] sm:w-[300px] first:pl-4 last:pr-4"
        >
            <div className={`relative overflow-hidden rounded-[2rem] p-6 h-[180px] flex flex-col justify-between ${item.bgGradient} shadow-xl border border-white/10`}>
                
                {/* Background Decor */}
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none mix-blend-overlay" />
                <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-black/20 rounded-full blur-3xl pointer-events-none mix-blend-multiply" />

                <div className="flex justify-between items-start relative z-10">
                    <div className="flex flex-col">
                         <span className="text-sm font-medium text-white/90 flex items-center gap-2">
                             <div className="p-2 rounded-full bg-white/20 backdrop-blur-md shadow-inner border border-white/10">
                                <item.icon className="w-4 h-4 text-white" />
                             </div>
                             {item.title}
                         </span>
                    </div>
                    {/* Mock Percentage Change */}
                    <div className="flex items-center gap-1 text-xs font-bold bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-white border border-white/10 shadow-sm">
                        <ArrowUpRight className="w-3 h-3" />
                        <span>{item.percentage}%</span>
                    </div>
                </div>

                <div className="relative z-10 mt-auto">
                    <h3 className="text-3xl font-extrabold text-white tracking-tight mb-1 drop-shadow-sm">
                        {item.formattedValue}
                    </h3>
                    <p className="text-[10px] text-white/70 font-semibold tracking-wide uppercase">
                        {item.note}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

const DashboardStatsCards = ({ stats }) => {
  const { user } = useAuth();
  const { t, formatMoney } = useLocalization();
  const scrollRef = useRef(null);

  const cardData = [
    { 
        title: t('token_balance'), 
        value: stats.tokens || 0, 
        formattedValue: (stats.tokens || 0).toFixed(4), 
        icon: Coins, 
        bgGradient: "bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800",
        note: t('available'),
        percentage: 12.5
    },
    { 
        title: t('my_points'), 
        value: stats.points || 0, 
        formattedValue: (stats.points || 0).toFixed(0), 
        icon: Star, 
        bgGradient: "bg-gradient-to-br from-pink-500 via-rose-600 to-red-700",
        note: t('loyalty_program'),
        percentage: 5.2
    },
    { 
        title: t('total_invested'), 
        value: stats.totalPaid || 0, 
        formattedValue: formatMoney(stats.totalPaid || 0), 
        icon: Wallet, 
        bgGradient: "bg-gradient-to-br from-cyan-500 via-blue-600 to-blue-800",
        note: t('confirmed_payments'),
        percentage: 8.1
    },
    { 
        title: t('transactions'), 
        value: stats.transactionCount || 0, 
        formattedValue: (stats.transactionCount || 0).toString(), 
        icon: CreditCard, 
        bgGradient: "bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700",
        note: t('total_history'),
        percentage: 2.4
    }
  ];

  return (
    <div className="w-full -mx-4 sm:mx-0 sm:w-auto overflow-hidden pt-2 pb-6">
        <div 
            ref={scrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-4 sm:px-0 pb-4 no-scrollbar touch-pan-x"
            style={{ scrollBehavior: 'smooth' }}
        >
            {cardData.map((item, index) => (
                <StatCard key={index} item={item} index={index} />
            ))}
        </div>
        
        {/* Pagination Dots Indicator */}
        <div className="flex justify-center gap-2 mt-[-15px]">
             {cardData.map((_, i) => (
                 <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/20 transition-all duration-300" />
             ))}
        </div>
    </div>
  );
};

export default DashboardStatsCards;