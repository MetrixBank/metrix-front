import React from 'react';
    import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { formatCurrency, formatNumberWithSuffix } from '@/lib/utils';
    import { FileText } from 'lucide-react';
    import { ptBR } from 'date-fns/locale';
    import { format } from 'date-fns';

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="p-2 bg-background/80 backdrop-blur-sm border rounded-lg shadow-lg text-sm">
                    <p className="font-bold text-foreground capitalize">{label}</p>
                    <p className="text-primary">{`A receber: ${formatCurrency(payload[0].value)}`}</p>
                </div>
            );
        }
        return null;
    };

    const ReceivablesPortfolioChart = ({ data, isMobile }) => {
        const formattedData = data.map(item => ({
            ...item,
            name: format(new Date(item.year, item.month), 'MMM', { locale: ptBR }),
        }));
        
        const hasData = data && data.length > 0 && data.some(d => d.value > 0);

        return (
            <Card className="card-gradient h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="text-gradient">Carteira de Recebíveis</CardTitle>
                    <CardDescription>Recebíveis de boletos nos próximos 6 meses.</CardDescription>
                </CardHeader>
                <CardContent className="h-[250px] md:flex-grow flex items-center justify-center">
                    {hasData ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={formattedData} 
                                margin={{ top: 10, right: isMobile ? 0 : 10, left: isMobile ? -30 : -20, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                                <XAxis 
                                    dataKey="name" 
                                    stroke="hsl(var(--muted-foreground))" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false} 
                                />
                                <YAxis 
                                    stroke="hsl(var(--muted-foreground))" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickFormatter={(value) => formatNumberWithSuffix(value, 0)} 
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent) / 0.3)' }} />
                                <Bar 
                                    dataKey="value" 
                                    fill="hsl(var(--primary))" 
                                    radius={[4, 4, 0, 0]} 
                                    barSize={isMobile ? 15 : 20}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center text-muted-foreground">
                            <FileText className="mx-auto h-10 w-10" />
                            <p className="mt-2 text-xs">Nenhum boleto a receber futuro.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    export default ReceivablesPortfolioChart;