import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import { Package } from 'lucide-react';
import { motion } from 'framer-motion';

// Custom Tick Component to handle text truncation cleanly
const CustomYAxisTick = ({ x, y, payload, isMobile }) => {
    const text = payload.value || '';
    // limit characters to prevent wrapping issues on mobile
    const limit = isMobile ? 18 : 30; 
    const truncated = text.length > limit ? `${text.substring(0, limit)}...` : text;

    return (
        <g transform={`translate(${x},${y})`}>
            <text 
                x={0} 
                y={0} 
                dy={4} 
                textAnchor="end" 
                fill="#94a3b8" 
                fontSize={isMobile ? 11 : 12}
                className="font-medium"
            >
                {truncated}
            </text>
        </g>
    );
};

const CustomTooltip = ({ active, payload, isMobile }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-[#161922]/95 backdrop-blur-md p-3 border border-white/10 rounded-xl shadow-xl z-50 max-w-[250px]">
                <p className="text-white font-bold text-sm mb-1 leading-tight">{data.name}</p>
                <div className="h-px bg-white/10 w-full my-2" />
                <p className="text-white/70 text-xs">
                    Quantidade: <span className="font-mono font-bold text-emerald-400 text-sm ml-1">{data.value}</span>
                </p>
            </div>
        );
    }
    return null;
};

const ProductPerformanceChart = ({ data, isMobile }) => {
    // Sort data by value descending and take top 10
    const chartData = React.useMemo(() => {
        if (!data) return [];
        return [...data].sort((a, b) => b.value - a.value).slice(0, 10);
    }, [data]);

    // Dynamic height calculation:
    // Ensure enough vertical space per item to prevent cramping
    const itemHeight = isMobile ? 60 : 50; // Height allocated per bar row
    const minHeight = 300;
    // Base height (for empty states or few items) vs Calculated height
    const calculatedHeight = Math.max(chartData.length * itemHeight, minHeight);

    return (
        <Card className="bg-[#161922] border border-white/5 shadow-lg overflow-hidden relative group w-full flex flex-col">
            <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700" />
            
            <CardHeader className="p-4 sm:p-5 pb-2 relative z-10 shrink-0">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                        <Package className="w-4 h-4 text-emerald-400"/>
                    </div>
                    Produtos Mais Vendidos
                </CardTitle>
            </CardHeader>
            
            <CardContent className="p-0 relative z-10">
                {chartData && chartData.length > 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-full"
                        // Apply calculated height here to the container
                        style={{ height: calculatedHeight }}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={chartData}
                                margin={{ 
                                    top: 10, 
                                    right: 30, 
                                    left: 10, 
                                    bottom: 10 
                                }}
                                barGap={4}
                            >
                                <defs>
                                    <linearGradient id="productGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="#34D399" stopOpacity={1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                                <XAxis type="number" hide={true} />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    // Increased width to accommodate longer names without squashing the chart
                                    width={isMobile ? 130 : 180} 
                                    tick={<CustomYAxisTick isMobile={isMobile} />}
                                    interval={0}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip isMobile={isMobile} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                <Bar 
                                    dataKey="value" 
                                    // Thicker bars for better visibility
                                    barSize={isMobile ? 24 : 20} 
                                    radius={[0, 4, 4, 0]}
                                    fill="url(#productGradient)"
                                    animationDuration={1500}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] text-white/30 space-y-3">
                         <Package className="w-10 h-10 opacity-20" />
                         <p className="text-xs">Sem dados de produtos</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ProductPerformanceChart;