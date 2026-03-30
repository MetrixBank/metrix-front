import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Legend, Bar, CartesianGrid } from 'recharts';
import { BarChart2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

const CustomTooltip = ({ active, payload, label, isMobile }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#161922]/95 backdrop-blur-md p-3 border border-white/10 rounded-xl shadow-xl z-50">
                <p className="text-white font-bold text-sm mb-2 pb-2 border-b border-white/10">{label}</p>
                {payload.map((entry, index) => {
                    const formattedValue = formatCurrency(entry.value || 0);
                    return (
                         <div key={`item-${index}`} className="flex items-center gap-2 mb-1 last:mb-0">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <p className="text-white/70 text-xs flex justify-between w-full gap-4">
                                <span>{entry.name}:</span>
                                <span className="font-mono font-bold text-white">{formattedValue}</span>
                            </p>
                        </div>
                    );
                })}
            </div>
        );
    }
    return null;
};

const PerformanceChart = ({ title, icon, data, isMobile }) => {
    // Fixed height constraints to prevent layout issues
    const cardHeightClass = "h-[450px] max-h-[450px]"; 
    const chartHeightPx = 350;
    const chartAxisFontSize = isMobile ? 10 : 12;

    const yAxisTickFormatter = (value) => {
        if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
        return value.toLocaleString('pt-BR');
    };

    return (
        <Card className={`bg-[#161922] border border-white/5 shadow-lg overflow-hidden relative group w-full ${cardHeightClass}`}>
            {/* Background Gradient Blob */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700" />
            
            <CardHeader className="p-4 sm:p-5 pb-2 relative z-10">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                        <BarChart2 className="w-4 h-4 text-violet-400"/>
                    </div>
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-4 relative z-10 overflow-hidden" style={{ height: chartHeightPx }}>
                {data && data.length > 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-full h-full"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={data}
                                margin={{ top: 10, right: 10, left: isMobile ? -20 : -10, bottom: 0 }}
                                barGap={4}
                            >
                                <defs>
                                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1}/>
                                        <stop offset="100%" stopColor="#6D28D9" stopOpacity={0.8}/>
                                    </linearGradient>
                                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10B981" stopOpacity={1}/>
                                        <stop offset="100%" stopColor="#059669" stopOpacity={0.8}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis 
                                    dataKey="month" 
                                    fontSize={chartAxisFontSize} 
                                    tickMargin={10} 
                                    interval={0} 
                                    axisLine={false} 
                                    tickLine={false}
                                    stroke="rgba(255,255,255,0.4)"
                                />
                                <YAxis 
                                    allowDecimals={false} 
                                    fontSize={chartAxisFontSize} 
                                    tickMargin={10} 
                                    tickFormatter={yAxisTickFormatter} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    stroke="rgba(255,255,255,0.4)"
                                />
                                <Tooltip content={<CustomTooltip isMobile={isMobile} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                <Legend 
                                    wrapperStyle={{ paddingTop: "10px", fontSize: isMobile ? '10px' : '12px' }} 
                                    iconType="circle"
                                />
                                <Bar 
                                    dataKey="Vendas" 
                                    fill="url(#salesGradient)" 
                                    radius={[4, 4, 0, 0]} 
                                    barSize={isMobile ? 12 : 24} 
                                    animationDuration={1500}
                                />
                                <Bar 
                                    dataKey="Lucro" 
                                    fill="url(#profitGradient)" 
                                    radius={[4, 4, 0, 0]} 
                                    barSize={isMobile ? 12 : 24}
                                    animationDuration={1500}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>
                ) : <p className="text-xs sm:text-sm text-white/30 text-center pt-20">Sem dados para o período.</p>}
            </CardContent>
        </Card>
    );
};

export default PerformanceChart;