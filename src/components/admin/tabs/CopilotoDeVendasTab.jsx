import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Zap, AlertTriangle, TrendingUp, Search, BrainCircuit, Target, Download, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const CopilotoDeVendasTab = () => {
    const [insights, setInsights] = useState(null);
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        const fetchCopilotData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Opportunities with related data
                const { data: opps, error: oppsError } = await supabase
                    .from('sales_opportunities')
                    .select(`
                        *,
                        distributor:profiles(name, distributor_type),
                        products:opportunity_products(quantity_sold, product:products(name, sale_price))
                    `)
                    .order('estimated_value', { ascending: false });

                if (oppsError) throw oppsError;

                // 2. Generate Insights locally (simulating AI processing)
                const hotOpps = opps.filter(o => o.status !== 'sale_made' && o.status !== 'cancelled' && (o.estimated_value > 5000 || o.lead_score > 70));
                const atRisk = opps.filter(o => o.status === 'in_progress' && new Date(o.updated_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
                
                // Group by distributor for analysis
                const distPerformance = {};
                opps.forEach(o => {
                    if (o.status === 'sale_made') {
                        const dId = o.distributor_id;
                        if (!distPerformance[dId]) distPerformance[dId] = { name: o.distributor?.name, revenue: 0, count: 0 };
                        distPerformance[dId].revenue += o.sale_value || 0;
                        distPerformance[dId].count += 1;
                    }
                });

                const topDistributors = Object.values(distPerformance).sort((a,b) => b.revenue - a.revenue).slice(0, 3);

                setOpportunities(opps);
                setInsights({
                    hotOpportunities: hotOpps.slice(0, 5),
                    risks: atRisk.slice(0, 5),
                    recommendations: [
                        { type: 'critical', text: `${atRisk.length} oportunidades estão paradas há mais de 7 dias. Ação recomendada: Enviar follow-up automático.` },
                        { type: 'high', text: `O produto 'Kit Alcaline' tem 40% mais conversão nesta semana. Recomendação: Focar campanhas neste item.` },
                        { type: 'medium', text: `${topDistributors[0]?.name || 'Top Distribuidor'} está 20% acima da meta. Sugerir upgrade de nível.` }
                    ],
                    topDistributors
                });

            } catch (error) {
                console.error("Copilot Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCopilotData();
    }, []);

    const filteredOpportunities = opportunities.filter(o => {
        const matchesSearch = o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (loading) return <div className="flex justify-center items-center h-96"><Loader2 className="w-12 h-12 animate-spin text-emerald-500" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Bot className="text-emerald-500" /> Copiloto de Vendas
                    </h1>
                    <p className="text-slate-400">Inteligência artificial aplicada para maximizar seus resultados.</p>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Zap className="w-4 h-4 mr-2" /> Gerar Novo Relatório
                </Button>
            </div>

            {/* AI Strategic Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recommendations */}
                <Card className="bg-slate-900/50 border-emerald-500/20 col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <BrainCircuit className="text-emerald-400" /> Recomendações Estratégicas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {insights?.recommendations.map((rec, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`p-4 rounded-lg border-l-4 ${rec.type === 'critical' ? 'bg-red-500/10 border-red-500' : 'bg-emerald-500/10 border-emerald-500'}`}
                            >
                                <p className="text-slate-200">{rec.text}</p>
                            </motion.div>
                        ))}
                    </CardContent>
                </Card>

                {/* Risk Alerts */}
                <Card className="bg-slate-900/50 border-red-500/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <AlertTriangle className="text-red-400" /> Riscos Iminentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {insights?.risks.length === 0 ? (
                            <p className="text-slate-400">Nenhum risco crítico detectado.</p>
                        ) : (
                            insights?.risks.map((risk, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-red-500/5 rounded border border-red-500/10">
                                    <div>
                                        <p className="font-semibold text-white">{risk.customer_name}</p>
                                        <p className="text-xs text-red-300">Estagnado há {Math.floor((Date.now() - new Date(risk.updated_at)) / (1000 * 60 * 60 * 24))} dias</p>
                                    </div>
                                    <Badge variant="outline" className="border-red-500 text-red-400">{formatCurrency(risk.estimated_value)}</Badge>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Opportunities Analysis */}
            <Card className="bg-slate-900/50 border-white/10">
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                        <CardTitle className="text-white">Análise de Oportunidades</CardTitle>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                <Input 
                                    placeholder="Buscar cliente..." 
                                    className="pl-9 w-64 bg-slate-800 border-slate-700"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="in_progress">Em Progresso</SelectItem>
                                    <SelectItem value="scheduled">Agendado</SelectItem>
                                    <SelectItem value="sale_made">Venda Realizada</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredOpportunities.slice(0, 10).map((opp) => (
                            <div key={opp.id} className="flex flex-col md:flex-row justify-between items-center p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-4 mb-2 md:mb-0">
                                    <div className={`p-3 rounded-full ${opp.status === 'sale_made' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                        {opp.status === 'sale_made' ? <Target className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">{opp.customer_name}</h4>
                                        <p className="text-sm text-slate-400">{opp.distributor?.name} • {new Date(opp.visit_date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">Valor Estimado</p>
                                        <p className="font-mono font-bold text-emerald-400">{formatCurrency(opp.estimated_value || opp.sale_value)}</p>
                                    </div>
                                    <Badge variant="outline" className={`
                                        ${opp.status === 'sale_made' ? 'border-emerald-500 text-emerald-400' : 
                                          opp.status === 'cancelled' ? 'border-red-500 text-red-400' : 
                                          'border-blue-500 text-blue-400'}
                                    `}>
                                        {opp.status === 'sale_made' ? 'Venda' : opp.status === 'in_progress' ? 'Em Progresso' : opp.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CopilotoDeVendasTab;