import { useState, useEffect } from 'react';
import { useDataSync } from '@/contexts/DataSyncContext';
import { supabase } from '@/lib/supabaseClient';

export const useExecutiveData = (period) => {
  const { syncKey } = useDataSync();
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState([]);
  const [chartsData, setChartsData] = useState({
    revenueOverTime: [],
    productionByTeam: [],
    topDistributors: [],
    activityFunnel: [],
    revenueProjection: []
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Mock data generation for demo purposes - in real app, replace with Supabase queries
        // aggregated by 'period' (day, month, quarter, year)
        
        // 1. KPI Data
        const kpis = [
            { id: 1, title: 'Faturamento Total', value: 'R$ 1.2M', trend: 12.5, sparkline: [40, 55, 45, 60, 75, 65, 85] },
            { id: 2, title: 'Atividades Registradas', value: '3,450', trend: 5.2, sparkline: [120, 140, 135, 160, 150, 180, 190] },
            { id: 3, title: 'Vendas Concluídas', value: '856', trend: 8.4, sparkline: [25, 30, 28, 35, 40, 38, 45] },
            { id: 4, title: 'Pontos Gerados', value: '450k', trend: -2.1, sparkline: [100, 95, 90, 85, 90, 88, 85] },
            { id: 5, title: 'Tokens em Circulação', value: '1.5M', trend: 15.0, sparkline: [50, 60, 70, 80, 90, 100, 110] },
            { id: 6, title: 'Receita Média / Dist.', value: 'R$ 4.2k', trend: 3.8, sparkline: [3.8, 3.9, 4.0, 4.1, 4.0, 4.1, 4.2] },
            { id: 7, title: 'Conversão (Ativ/Venda)', value: '24.8%', trend: 1.2, sparkline: [20, 21, 22, 23, 22, 24, 25] },
            { id: 8, title: 'Crescimento MoM', value: '18.5%', trend: 4.5, sparkline: [10, 12, 14, 15, 16, 17, 18.5] },
        ];
        setKpiData(kpis);

        // 2. Charts Data
        const revenueOverTime = [
            { name: 'Jan', actual: 40000, projected: 42000 },
            { name: 'Feb', actual: 45000, projected: 46000 },
            { name: 'Mar', actual: 50000, projected: 51000 },
            { name: 'Apr', actual: 48000, projected: 53000 },
            { name: 'May', actual: 60000, projected: 58000 },
            { name: 'Jun', actual: 75000, projected: 65000 },
        ];

        const productionByTeam = [
            { name: 'Equipe Alpha', value: 450000, performance: 'high' },
            { name: 'Equipe Bravo', value: 320000, performance: 'medium' },
            { name: 'Equipe Charlie', value: 180000, performance: 'low' },
            { name: 'Equipe Delta', value: 290000, performance: 'medium' },
        ];

        const topDistributors = [
            { name: 'Maria Silva', value: 85000, avatar: '' },
            { name: 'João Santos', value: 72000, avatar: '' },
            { name: 'Ana Costa', value: 68000, avatar: '' },
            { name: 'Pedro Alves', value: 65000, avatar: '' },
            { name: 'Carla Dias', value: 60000, avatar: '' },
        ];

        const activityFunnel = [
            { name: 'Atividades', value: 3450, fill: '#3b82f6' },
            { name: 'Oportunidades', value: 1200, fill: '#f59e0b' },
            { name: 'Propostas', value: 950, fill: '#8b5cf6' },
            { name: 'Vendas', value: 856, fill: '#10b981' },
        ];
        
        const revenueProjection = [
            { name: 'Atual', value: 1200000, ci_low: 1200000, ci_high: 1200000 },
            { name: '+30d', value: 1350000, ci_low: 1300000, ci_high: 1400000 },
            { name: '+60d', value: 1500000, ci_low: 1400000, ci_high: 1600000 },
            { name: '+90d', value: 1680000, ci_low: 1550000, ci_high: 1800000 },
        ];

        setChartsData({
            revenueOverTime,
            productionByTeam,
            topDistributors,
            activityFunnel,
            revenueProjection
        });

      } catch (error) {
        console.error("Failed to fetch executive data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period, syncKey]);

  return { kpiData, chartsData, loading, refetch: () => {} }; // Refetch triggers by syncKey in context
};