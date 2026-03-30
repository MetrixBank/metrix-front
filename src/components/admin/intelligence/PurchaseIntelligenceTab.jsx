import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BrainCircuit, Loader2, FileText, BarChart, ShoppingCart, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ResponsiveContainer, BarChart as ReBarChart, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const PurchaseIntelligenceTab = ({ user }) => {
    const { toast } = useToast();
    const [distributors, setDistributors] = useState([]);
    const [selectedDistributor, setSelectedDistributor] = useState('');
    const [points, setPoints] = useState('');
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [loadingDistributors, setLoadingDistributors] = useState(true);
    const [configError, setConfigError] = useState(false);

    const fetchDistributors = useCallback(async () => {
        setLoadingDistributors(true);
        try {
            // Modified query to fetch region as well
            let query = supabase.from('profiles').select('id, name, region').in('role', ['distributor', 'sub-admin']);
            
            if (user.role === 'sub-admin') {
                query = query.eq('id', user.id);
            }

            const { data, error } = await query.order('name', { ascending: true });
            if (error) throw error;

            setDistributors(data);
            if (user.role === 'sub-admin' && data.length > 0) {
                setSelectedDistributor(data[0].id);
            }
        } catch (error) {
            toast({ title: 'Erro ao buscar distribuidores', description: error.message, variant: 'destructive' });
        } finally {
            setLoadingDistributors(false);
        }
    }, [user.id, user.role, toast]);

    useEffect(() => {
        fetchDistributors();
    }, [fetchDistributors]);

    const getRateForDistributor = (distributorId) => {
        if (!distributorId) return 4000;
        const dist = distributors.find(d => d.id === distributorId);
        return dist?.region === 'USA' ? 1000 : 4000;
    };

    const currentRate = getRateForDistributor(selectedDistributor);

    const handleGenerateReport = async () => {
        if (!selectedDistributor || !points || parseInt(points) <= 0) {
            toast({ title: 'Dados inválidos', description: 'Selecione um distribuidor e insira um valor de pontos válido.', variant: 'destructive' });
            return;
        }
        setLoading(true);
        setReport(null);
        setConfigError(false);
        try {
            const { data, error } = await supabase.rpc('get_purchase_suggestion', {
                p_distributor_id: selectedDistributor,
                p_investment_points: parseInt(points)
            });

            if (error) {
                if (error.code === 'PGRST202' && error.message.includes('Could not find the function')) {
                    setConfigError(true);
                } else {
                    throw error;
                }
            } else {
                // Use the rate returned by the backend if available, otherwise calculate locally
                const usedRate = data.investment_rate_used || currentRate;
                
                setReport({
                    ...data,
                    investmentValue: parseInt(points) * usedRate
                });
                toast({ title: 'Relatório gerado com sucesso!', description: 'A sugestão de compra está pronta.' });
            }
        } catch (error) {
            toast({ title: 'Erro ao gerar relatório', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background/80 backdrop-blur-sm p-2 border border-border rounded-md shadow-lg text-xs">
                    <p className="font-bold text-foreground">{label}</p>
                    <p className="text-primary">Sugerido: <span className="font-semibold">{payload[0].value} un.</span></p>
                    <p className="text-muted-foreground">Vendas (6m): <span className="font-semibold">{payload[0].payload.sales_last_6_months} un.</span></p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            <Card className="card-gradient shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl text-gradient">
                        <BrainCircuit className="w-6 h-6 mr-3" />
                        Inteligência de Compra de Produtos
                    </CardTitle>
                    <CardDescription>
                        Insira os pontos de investimento para gerar uma sugestão de compra otimizada com base no histórico de vendas.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-2">
                            <Label htmlFor="distributor">Distribuidor / Equipe</Label>
                            {loadingDistributors ? <Loader2 className="animate-spin" /> :
                                <Select
                                    value={selectedDistributor}
                                    onValueChange={setSelectedDistributor}
                                    disabled={user.role === 'sub-admin'}
                                >
                                    <SelectTrigger id="distributor">
                                        <SelectValue placeholder="Selecione um distribuidor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {distributors.map(d => (
                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            }
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="points">Pontos para Investir</Label>
                            <Input
                                id="points"
                                type="number"
                                value={points}
                                onChange={(e) => setPoints(e.target.value)}
                                placeholder="Ex: 10"
                                min="1"
                            />
                        </div>
                        <Button onClick={handleGenerateReport} disabled={loading}>
                            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</> : 'Gerar Relatório'}
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Valor do Investimento: <span className="font-bold text-primary">{formatCurrency(points ? parseInt(points) * currentRate : 0)}</span> (1 Ponto = {formatCurrency(currentRate)})
                    </p>
                </CardContent>
            </Card>

            <AnimatePresence>
                 {configError && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <Card className="border-destructive/50 bg-destructive/10">
                            <CardHeader>
                                <CardTitle className="flex items-center text-destructive">
                                    <AlertTriangle className="w-5 h-5 mr-2" />
                                    Ação Necessária: Configuração da Ferramenta
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-destructive-foreground space-y-3">
                                <p>A ferramenta de inteligência de compra precisa ser ativada no seu banco de dados.</p>
                                <p className="font-semibold">Por favor, execute o script SQL que forneci anteriormente no Editor SQL do seu projeto Supabase para resolver o problema.</p>
                                <p>Se precisar do código novamente, é só pedir!</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {report && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center text-xl text-gradient">
                                    <FileText className="w-6 h-6 mr-3" />
                                    Relatório de Sugestão de Compra
                                </CardTitle>
                                <CardDescription>
                                    Baseado em um investimento de {points} pontos ({formatCurrency(report.investmentValue)}).
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-muted/50 p-4 rounded-lg">
                                        <p className="text-sm text-muted-foreground flex items-center"><ShoppingCart className="w-4 h-4 mr-2" /> Custo Total Sugerido</p>
                                        <p className="text-2xl font-bold text-primary">{formatCurrency(report.total_cost)}</p>
                                    </div>
                                    <div className="bg-muted/50 p-4 rounded-lg">
                                        <p className="text-sm text-muted-foreground flex items-center"><DollarSign className="w-4 h-4 mr-2" /> Receita Projetada</p>
                                        <p className="text-2xl font-bold text-green-500">{formatCurrency(report.projected_revenue)}</p>
                                    </div>
                                    <div className="bg-muted/50 p-4 rounded-lg">
                                        <p className="text-sm text-muted-foreground flex items-center"><TrendingUp className="w-4 h-4 mr-2" /> Lucro Bruto Projetado</p>
                                        <p className="text-2xl font-bold text-green-500">{formatCurrency(report.projected_profit)}</p>
                                    </div>
                                    <div className="bg-muted/50 p-4 rounded-lg">
                                        <p className="text-sm text-muted-foreground flex items-center"><BarChart className="w-4 h-4 mr-2" /> % de Lucro Bruto</p>
                                        <p className="text-2xl font-bold text-green-500">{report.total_cost > 0 ? ((report.projected_profit / report.total_cost) * 100).toFixed(2) : '0.00'}%</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2 text-gradient">Sugestão de Compra por Produto</h3>
                                        <div className="h-80 w-full">
                                            <ResponsiveContainer>
                                                <ReBarChart data={report.suggestion} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                                    <XAxis dataKey="product_name" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={0} angle={-45} textAnchor="end" height={80} />
                                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--primary) / 0.1)' }} />
                                                    <Bar dataKey="suggested_quantity" fill="hsl(var(--primary))" name="Quantidade Sugerida" radius={[4, 4, 0, 0]} />
                                                </ReBarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2 text-gradient">Detalhes da Sugestão</h3>
                                        <div className="border rounded-lg overflow-hidden">
                                            <div className="grid grid-cols-6 bg-muted/50 p-2 font-bold text-sm">
                                                <div className="col-span-2">Produto</div>
                                                <div className="text-center">Qtd. Sugerida</div>
                                                <div className="text-right">Custo Unit.</div>
                                                <div className="text-right">Custo Total</div>
                                                <div className="text-right">Vendas (6m)</div>
                                            </div>
                                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                {report.suggestion && report.suggestion.map(item => (
                                                    <div key={item.product_id} className="grid grid-cols-6 p-2 border-b text-sm items-center">
                                                        <div className="col-span-2 truncate" title={item.product_name}>{item.product_name}</div>
                                                        <div className="text-center font-bold text-primary">{item.suggested_quantity}</div>
                                                        <div className="text-right">{formatCurrency(item.cost_price)}</div>
                                                        <div className="text-right font-semibold">{formatCurrency(item.suggested_quantity * item.cost_price)}</div>
                                                        <div className="text-right">{item.sales_last_6_months}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PurchaseIntelligenceTab;