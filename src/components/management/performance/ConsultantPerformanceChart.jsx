import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import { Users, Crown, Medal, Award } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

const formatConsultantName = (name) => {
    if (!name) return 'N/A';
    const parts = name.split(' ');
    // Always show first name
    if (parts.length > 1) {
      // If name is long (more than 2 names), prefer First + Initial
      return `${parts[0]} ${parts[parts.length - 1].substring(0, 1)}.`;
    }
    return name;
};

// Pure SVG Icon Component for Top 3 Ranks
const RankIconSvg = ({ index }) => {
    if (index === 0) return <Crown size={14} color="#fbbf24" strokeWidth={2.5} />; // Amber-400
    if (index === 1) return <Medal size={14} color="#d1d5db" strokeWidth={2.5} />; // Gray-300
    if (index === 2) return <Award size={14} color="#b45309" strokeWidth={2.5} />; // Amber-700
    return null;
};

// Pure SVG Tick Component
const CustomTick = ({ x, y, payload, index }) => {
    const isTop3 = index < 3;
    let displayName = payload?.value || ""; // Safe access
    // Truncate logic
    if (displayName.length > 12) {
        displayName = displayName.substring(0, 10) + "...";
    }

    return (
        <g transform={`translate(${x},${y})`}>
            {/* Rank Indicator */}
            {isTop3 ? (
                <g transform="translate(-20, -7)">
                    <RankIconSvg index={index} />
                </g>
            ) : (
                <text 
                    x={-13} 
                    y={4} 
                    textAnchor="middle" 
                    fill="rgba(255,255,255,0.3)" 
                    fontSize={10} 
                    fontFamily="monospace"
                    fontWeight="bold"
                >
                    #{index + 1}
                </text>
            )}

            {/* Consultant Name */}
            <text 
                x={-28} 
                y={4} 
                textAnchor="end" 
                fill="#e2e8f0" 
                fontSize={11}
                fontWeight={500}
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
            >
                {displayName}
            </text>
        </g>
    );
};

const CustomTooltip = ({ active, payload, isMobile }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#161922]/95 backdrop-blur-md p-3 border border-white/10 rounded-xl shadow-xl min-w-[180px] z-50">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
              <div className="h-6 w-6 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-violet-300">
                    {data.name ? data.name.substring(0, 2).toUpperCase() : 'NA'}
                  </span>
              </div>
              <p className="font-bold text-white text-sm truncate max-w-[120px]">{data.name}</p>
          </div>
          <div className="space-y-1">
              <div className="flex justify-between text-xs">
                  <span className="text-white/50">Vendas:</span>
                  <span className="text-white font-medium">{data.sales}</span>
              </div>
              <div className="flex justify-between text-xs">
                  <span className="text-white/50">Comissão:</span>
                  <span className="text-emerald-400 font-medium">{formatCurrency(data.commission)}</span>
              </div>
               <div className="flex justify-between text-xs pt-1 border-t border-white/5 mt-1">
                  <span className="text-white/50">Total:</span>
                  <span className="text-violet-400 font-bold">{formatCurrency(data.revenue)}</span>
              </div>
          </div>
        </div>
      );
    }
    return null;
  };

const ConsultantPerformanceChart = ({ data, isMobile }) => {
    // Fixed height constraints
    const cardHeightClass = "h-[450px] max-h-[450px]";
    const chartHeightPx = 350;
    
    // Safety check for data
    if (!data || !Array.isArray(data)) return null;

    // Sort and enhance data
    const formattedData = data
        .map(c => ({
            ...c,
            displayName: formatConsultantName(c.name)
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8); // Top 8

    return (
        <Card className={`bg-[#161922] border border-white/5 shadow-lg overflow-hidden relative flex flex-col group w-full ${cardHeightClass}`}>
             {/* Background Gradient Blob */}
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/5 blur-[60px] rounded-full pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-500" />

            <CardHeader className="p-4 sm:p-5 pb-2 relative z-10 shrink-0">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                         <Users className="w-4 h-4 text-emerald-400"/>
                    </div>
                    Ranking de Consultores
                </CardTitle>
            </CardHeader>
            
            <CardContent className="p-2 sm:p-4 relative z-10 flex-1 min-h-0 overflow-hidden" style={{ height: chartHeightPx }}>
                {formattedData.length > 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-full h-full"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={formattedData}
                                margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                                barGap={4}
                            >
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="#34D399" stopOpacity={1} />
                                    </linearGradient>
                                     <linearGradient id="topBarGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.9} />
                                        <stop offset="100%" stopColor="#FCD34D" stopOpacity={1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                                <XAxis 
                                    type="number" 
                                    hide={true} 
                                />
                                <YAxis 
                                    dataKey="displayName" 
                                    type="category" 
                                    width={isMobile ? 95 : 120} 
                                    tick={<CustomTick />}
                                    interval={0}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip isMobile={isMobile} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                <Bar 
                                    dataKey="revenue" 
                                    barSize={isMobile ? 14 : 18} 
                                    radius={[0, 4, 4, 0]}
                                    animationDuration={1500}
                                >
                                    {formattedData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={index === 0 ? "url(#topBarGradient)" : "url(#barGradient)"} 
                                            className="transition-opacity hover:opacity-80 cursor-pointer"
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-white/30 space-y-3">
                         <Users className="w-10 h-10 opacity-20" />
                         <p className="text-xs">Sem dados de consultores</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ConsultantPerformanceChart;