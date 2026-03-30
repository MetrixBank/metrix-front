import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, XCircle, LayoutDashboard } from 'lucide-react';
import { format, subMonths, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import PersonalGoalsManager from './goals/PersonalGoalsManager';
import PersonalGoalsView from './goals/PersonalGoalsView';
import TeamGoalsView from './goals/TeamGoalsView';
import GoalsToggle from './goals/GoalsToggle';
import useTeamGoalsData from '@/hooks/useTeamGoalsData';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover/95 backdrop-blur-sm p-3 border border-border rounded-lg shadow-xl">
                <p className="font-bold text-sm text-foreground mb-1">{label}</p>
                <p className="text-primary font-mono font-medium">{`Valor: ${formatCurrency(payload[0].value)}`}</p>
            </div>
        );
    }
    return null;
};

const GoalsTab = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    
    // View State
    const [activeView, setActiveView] = useState('personal'); // 'personal' or 'team'
    
    // Data State
    const [opportunities, setOpportunities] = useState([]);
    const [personalGoals, setPersonalGoals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Team Goals Hook
    const { goals: teamGoals } = useTeamGoalsData();
    
    // UI State
    const [isManagerOpen, setIsManagerOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [selectedGoal, setSelectedGoal] = useState(null);

    const fetchData = async () => {
        setIsLoading(true);
        if (!user) return;

        try {
            // 1. Fetch sales data for charts and calculations
            const { data: salesData, error: salesError } = await supabase
                .from('sales_opportunities')
                .select('status,sale_value,visit_date,created_at')
                .eq('distributor_id', user.id);

            if (salesError) throw salesError;
            setOpportunities(salesData || []);

            // 2. Trigger auto-update of goal progress (DB function)
            await supabase.rpc('update_personal_goals_progress', { p_user_id: user.id });

            // 3. Fetch personal goals
            const { data: goalsData, error: goalsError } = await supabase
                .from('personal_goals')
                .select('*')
                .eq('user_id', user.id)
                .order('end_date', { ascending: false }); // Newest deadlines first

            if (goalsError) throw goalsError;
            setPersonalGoals(goalsData || []);

        } catch (error) {
            console.error('Error fetching data:', error);
            toast({ title: "Erro", description: "Falha ao carregar dados.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    // --- Derived Data for Charts ---

    const chartData = useMemo(() => {
        if (!user || opportunities.length === 0) return [];

        let data = [];
        
        // If a goal is selected, show data relevant to that goal's period
        if (selectedGoal && activeView === 'personal') {
            const start = startOfDay(parseISO(selectedGoal.start_date));
            const end = endOfDay(parseISO(selectedGoal.end_date));
            
            // Filter sales within goal period
            const relevantSales = opportunities.filter(op => {
                const saleDate = parseISO(op.visit_date);
                return op.status === 'sale_made' && isWithinInterval(saleDate, { start, end });
            });

            // Group by Day (if period < 32 days) or Month
            const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
            
            if (daysDiff <= 35) {
                // Daily view
                const salesByDay = {};
                relevantSales.forEach(op => {
                    const dayKey = format(parseISO(op.visit_date), 'dd/MM');
                    salesByDay[dayKey] = (salesByDay[dayKey] || 0) + op.sale_value;
                });
                
                // Fill in days
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const dayKey = format(d, 'dd/MM');
                    data.push({ name: dayKey, value: salesByDay[dayKey] || 0 });
                }
            } else {
                // Monthly view within range (simplified for longer goals)
                const salesByMonth = {};
                relevantSales.forEach(op => {
                    const monthKey = format(parseISO(op.visit_date), 'MMM/yy', { locale: ptBR });
                    salesByMonth[monthKey] = (salesByMonth[monthKey] || 0) + op.sale_value;
                });
                
                // We could iterate months here properly, but for simplicity of this task we just show captured months
                Object.entries(salesByMonth).forEach(([name, value]) => {
                     data.push({ name, value });
                });
            }

        } else {
            // Default: Last 6 Months History (Treasure Map)
            const now = new Date();
            const salesByMonth = {};
            
            opportunities.forEach(op => {
                if (op.status === 'sale_made' && op.sale_value) {
                    const d = parseISO(op.visit_date);
                    const key = format(d, 'MMM', { locale: ptBR });
                    // Only consider last 6 months
                    if (d >= subMonths(now, 5)) {
                        salesByMonth[key] = (salesByMonth[key] || 0) + op.sale_value;
                    }
                }
            });

            for (let i = 5; i >= 0; i--) {
                const d = subMonths(now, i);
                const key = format(d, 'MMM', { locale: ptBR });
                data.push({ 
                    name: key.charAt(0).toUpperCase() + key.slice(1), 
                    value: salesByMonth[key] || 0 
                });
            }
        }

        return data;
    }, [opportunities, selectedGoal, user, activeView]);

    // --- Actions ---

    const handleDelete = async (e, id) => {
        e.stopPropagation(); // Prevent card click
        try {
            const { error } = await supabase.from('personal_goals').delete().eq('id', id);
            if (error) throw error;
            toast({ title: "Meta excluída", description: "Meta removida com sucesso." });
            fetchData();
            if (selectedGoal?.id === id) setSelectedGoal(null);
        } catch (error) {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    };

    const handleEdit = (e, goal) => {
        e.stopPropagation();
        setEditingGoal(goal);
        setIsManagerOpen(true);
    };

    const handleSelectGoal = (goal) => {
        if (selectedGoal?.id === goal.id) {
            setSelectedGoal(null); // Deselect
        } else {
            setSelectedGoal(goal);
        }
    };

    const handleNewGoal = () => {
        setEditingGoal(null);
        setIsManagerOpen(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Toggle View */}
            <div className="flex justify-center mb-6">
                <GoalsToggle 
                    activeView={activeView} 
                    onToggle={setActiveView}
                    activeTeamGoalsCount={teamGoals?.length || 0}
                />
            </div>

            {/* Conditionally render Chart only for Personal View */}
            {activeView === 'personal' && (
                <Card className="border-border/40 shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-xl text-primary">
                                    <BarChart className="w-5 h-5" />
                                    {selectedGoal ? `Análise: ${selectedGoal.title}` : 'Mapa do Tesouro Mensal'}
                                </CardTitle>
                                <CardDescription>
                                    {selectedGoal 
                                        ? `Acompanhamento detalhado de ${format(parseISO(selectedGoal.start_date), 'dd/MM')} a ${format(parseISO(selectedGoal.end_date), 'dd/MM')}`
                                        : 'Seu histórico de vendas nos últimos 6 meses.'
                                    }
                                </CardDescription>
                            </div>
                            {selectedGoal && (
                                <Button variant="ghost" size="sm" onClick={() => setSelectedGoal(null)}>
                                    <XCircle className="w-4 h-4 mr-2" /> Limpar Seleção
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsBarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                        tickFormatter={(val) => `R$${val/1000}k`}
                                    />
                                    <Tooltip cursor={{ fill: 'hsl(var(--muted)/0.2)' }} content={<CustomTooltip />} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                        {chartData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={selectedGoal ? "hsl(var(--primary))" : (index === chartData.length - 1 ? "hsl(var(--primary))" : "hsl(var(--muted))")} 
                                                fillOpacity={selectedGoal ? 1 : (index === chartData.length - 1 ? 1 : 0.5)}
                                            />
                                        ))}
                                    </Bar>
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main Content Area based on View */}
            <div className="mt-6">
                {activeView === 'personal' ? (
                    <PersonalGoalsView 
                        goals={personalGoals}
                        isLoading={isLoading}
                        selectedGoal={selectedGoal}
                        onSelectGoal={handleSelectGoal}
                        onEditGoal={handleEdit}
                        onDeleteGoal={handleDelete}
                        onNewGoal={handleNewGoal}
                    />
                ) : (
                    <TeamGoalsView />
                )}
            </div>

            {/* Form Modal */}
            <PersonalGoalsManager 
                isOpen={isManagerOpen}
                onClose={() => setIsManagerOpen(false)}
                goalToEdit={editingGoal}
                onGoalSaved={fetchData}
            />
        </div>
    );
};

export default GoalsTab;