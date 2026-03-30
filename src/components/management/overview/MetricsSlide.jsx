import React from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Coins, Trophy, TrendingUp } from 'lucide-react';

const CircularProgress = ({ value, color, icon: Icon, label, subLabel }) => {
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    const getStrokeColor = (c) => {
        if (c === 'purple') return '#8B5CF6';
        if (c === 'cyan') return '#06b6d4';
        return '#3b82f6';
    };

    return (
        <div className="bg-[#161922] rounded-[2rem] p-4 flex flex-col items-center justify-center relative border border-white/5 shadow-lg aspect-square">
             {/* Glow */}
            <div className={`absolute inset-0 rounded-[2rem] opacity-10 blur-xl ${color === 'purple' ? 'bg-purple-600' : 'bg-cyan-500'}`} />
            
            <div className="relative w-20 h-20 flex items-center justify-center mb-2">
                 <svg className="transform -rotate-90 w-full h-full">
                    <circle cx="40" cy="40" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-[#0B0E14] drop-shadow-sm" />
                    <circle
                        cx="40" cy="40" r={radius}
                        stroke={getStrokeColor(color)}
                        strokeWidth="6" fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{value}%</span>
                </div>
            </div>
            <div className="text-center">
                <p className="text-white text-xs font-bold">{label}</p>
                <p className="text-white/40 text-[10px] uppercase">{subLabel}</p>
            </div>
        </div>
    );
};

const MetricsSlide = ({ stats, trendData }) => {
    return (
        <div className="w-full h-full flex flex-col px-6 pt-2 pb-6 space-y-4">
             {/* Top Row Widgets */}
             <div className="grid grid-cols-2 gap-4 h-[160px]">
                {/* Tokens Widget */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-[#1A1D2D] to-[#12141C] rounded-[2rem] p-5 flex flex-col justify-between border border-white/5 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 rounded-bl-[2rem] pointer-events-none" />
                    <div className="p-2 bg-cyan-500/10 w-fit rounded-full mb-2">
                        <Coins className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Meus Tokens</p>
                        <h3 className="text-white text-xl font-bold">{stats.tokens.toFixed(2)}</h3>
                    </div>
                     <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-cyan-400 w-[60%] rounded-full" />
                    </div>
                </motion.div>

                {/* Mini Chart Widget */}
                <motion.div 
                     initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                     className="bg-gradient-to-br from-[#2E1065] to-[#1E1B4B] rounded-[2rem] p-5 flex flex-col justify-between border border-white/10 relative overflow-hidden"
                >
                    <div className="flex justify-between items-start z-10 relative">
                         <div>
                            <p className="text-white/60 text-[10px] uppercase font-bold">Pontos</p>
                            <h3 className="text-white text-lg font-bold">{stats.points}</h3>
                         </div>
                         <div className="bg-white/10 p-1.5 rounded-lg">
                            <TrendingUp className="w-4 h-4 text-white" />
                         </div>
                    </div>
                    
                    <div className="h-[60px] w-[140%] -ml-4 -mb-4 opacity-50">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <Line type="monotone" dataKey="value" stroke="#fff" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
             </div>

             {/* Middle Row Circulars */}
             <div className="grid grid-cols-2 gap-4">
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <CircularProgress value={50} color="purple" label="Conversão" subLabel="Meta Mensal" />
                 </motion.div>
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <CircularProgress value={75} color="cyan" label="Atividades" subLabel="Concluídas" />
                 </motion.div>
             </div>

             {/* Bottom Progress Bar */}
             <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="bg-[#161922] rounded-[2rem] p-6 border border-white/5 mt-auto relative overflow-hidden"
             >
                <div className="flex justify-between items-end mb-2 relative z-10">
                    <div>
                         <h3 className="text-3xl font-bold text-violet-400">4,5K</h3>
                         <p className="text-white/40 text-xs font-medium max-w-[200px] leading-tight mt-1">
                             Total de transações realizadas em toda a rede.
                         </p>
                    </div>
                    <div className="bg-violet-500/10 p-2 rounded-xl border border-violet-500/20">
                        <Trophy className="w-6 h-6 text-violet-400" />
                    </div>
                </div>

                <div className="w-full h-3 bg-[#0B0E14] rounded-full mt-4 relative overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }} animate={{ width: "65%" }} transition={{ delay: 0.8, duration: 1 }}
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full" 
                    />
                    {/* Floating Indicator */}
                    <motion.div 
                        initial={{ left: 0 }} animate={{ left: "65%" }} transition={{ delay: 0.8, duration: 1 }}
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] border-2 border-violet-500"
                        style={{ marginLeft: -8 }}
                    />
                </div>
                 <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full blur-2xl pointer-events-none" />
             </motion.div>
        </div>
    );
};

export default MetricsSlide;