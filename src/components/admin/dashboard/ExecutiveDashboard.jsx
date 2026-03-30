import React from 'react';
import { 
  DollarSign, Activity, ShoppingCart, Users, Coins, TrendingUp, BarChart2, PieChart
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useExecutiveData } from '@/hooks/useExecutiveData';
import { useInsightGeneration } from '@/hooks/useInsightGeneration';
import SalesCopilotWidget from './SalesCopilotWidget';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { colors } from '@/lib/chartColorScheme';

const KPICard = ({ title, value, trend, sparkline, icon: Icon, color }) => {
    const isPositive = trend >= 0;
    return (
        <Card className="bg-[#1e293b]/50 backdrop-blur-md border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden group hover:shadow-2xl hover:shadow-emerald-900/10 hover:-translate-y-1">
            <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-lg bg-opacity-20 ${color.bg} ${color.text}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                        {Math.abs(trend)}%
                    </div>
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight mb-1">{value}</h3>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{title}</p>
                </div>
                
                {/* Mini Sparkline Visualization */}
                <div className="h-10 mt-4 -mx-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparkline.map((v, i) => ({ val: v, i }))}>
                             <defs>
                                <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={isPositive ? colors.positive : colors.negative} stopOpacity={0.4}/>
                                    <stop offset="100%" stopColor={isPositive ? colors.positive : colors.negative} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="val" stroke={isPositive ? colors.positive : colors.negative} strokeWidth={2} fill={`url(#grad-${title})`} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

const ExecutiveDashboard = ({ period }) => {
    const { kpiData, chartsData, loading } = useExecutiveData(period);
    const { insights } = useInsightGeneration();

    if (loading) return <div className="p-8 text-center text-slate-400 animate-pulse">Carregando dados executivos...</div>;

    const kpiConfig = [
        { icon: DollarSign, color: { bg: 'bg-emerald-500', text: 'text-emerald-400' } },
        { icon: Activity, color: { bg: 'bg-blue-500', text: 'text-blue-400' } },
        { icon: ShoppingCart, color: { bg: 'bg-indigo-500', text: 'text-indigo-400' } },
        { icon: Users, color: { bg: 'bg-violet-500', text: 'text-violet-400' } },
        { icon: Coins, color: { bg: 'bg-amber-500', text: 'text-amber-400' } },
        { icon: BarChart2, color: { bg: 'bg-cyan-500', text: 'text-cyan-400' } },
        { icon: PieChart, color: { bg: 'bg-pink-500', text: 'text-pink-400' } },
        { icon: TrendingUp, color: { bg: 'bg-rose-500', text: 'text-rose-400' } },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* 1. KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiData.map((kpi, idx) => (
                    <KPICard 
                        key={kpi.id} 
                        {...kpi} 
                        icon={kpiConfig[idx]?.icon || Activity}
                        color={kpiConfig[idx]?.color || { bg: 'bg-slate-500', text: 'text-slate-400' }}
                    />
                ))}
            </div>

            {/* 2. Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Charts */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Revenue Chart */}
                    <Card className="bg-[#1e293b]/50 border-white/10 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-white">Receita vs. Projeção</h3>
                                <p className="text-sm text-slate-400">Comparativo mensal com intervalo de confiança</p>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartsData.revenueOverTime}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#64748b" tick={{fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val/1000}k`} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(val) => formatCurrency(val)}
                                    />
                                    <Legend iconType="circle" />
                                    <Area type="monotone" dataKey="actual" name="Realizado" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                    <Area type="monotone" dataKey="projected" name="Projetado" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorProjected)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Production by Team & Top Distributors Split */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <Card className="bg-[#1e293b]/50 border-white/10 p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Produção por Equipe</h3>
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartsData.productionByTeam} layout="vertical">
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={100} tick={{fill: '#94a3b8', fontSize: 11}} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '8px'}} />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                            {chartsData.productionByTeam.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.performance === 'high' ? colors.positive : entry.performance === 'medium' ? colors.standout : colors.negative} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                        
                        <Card className="bg-[#1e293b]/50 border-white/10 p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Top Distribuidores</h3>
                             <div className="space-y-4">
                                {chartsData.topDistributors.map((dist, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-amber-500 text-black' : 'bg-slate-700 text-slate-300'}`}>
                                                {idx + 1}
                                            </div>
                                            <span className="text-sm font-medium text-slate-200">{dist.name}</span>
                                        </div>
                                        <span className="text-sm font-mono text-emerald-400">{formatCurrency(dist.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Right Column: Copilot & Insights */}
                <div className="space-y-6">
                    <SalesCopilotWidget insights={insights} />
                    
                    {/* Activity Funnel Mini */}
                    <Card className="bg-[#1e293b]/50 border-white/10 p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Funil de Conversão</h3>
                         <div className="h-[200px]">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartsData.activityFunnel} layout="vertical" margin={{left: 20}}>
                                     <XAxis type="number" hide />
                                     <YAxis dataKey="name" type="category" width={80} tick={{fill: '#94a3b8', fontSize: 11}} axisLine={false} tickLine={false} />
                                     <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#0f172a', border: 'none'}} />
                                     <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                                         {chartsData.activityFunnel.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                         ))}
                                     </Bar>
                                </BarChart>
                             </ResponsiveContainer>
                         </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ExecutiveDashboard;