import { useState, useEffect } from 'react';
import { useDataSync } from '@/contexts/DataSyncContext';

export const useInsightGeneration = () => {
  const { syncKey } = useDataSync();
  const [insights, setInsights] = useState({
      hotOpportunities: [],
      untappedPotential: [],
      topProducts: [],
      projections: [],
      recommendations: [],
      risks: []
  });

  useEffect(() => {
      // Mock AI insights
      setInsights({
          hotOpportunities: [
              { id: 1, customer: 'Hospital Central', value: 45000, probability: 85, expectedDate: '2024-02-15' },
              { id: 2, customer: 'Clínica Vida', value: 22000, probability: 75, expectedDate: '2024-02-20' },
              { id: 3, customer: 'Dr. Roberto', value: 12500, probability: 90, expectedDate: '2024-02-10' },
          ],
          untappedPotential: [
              { id: 1, name: 'Equipe Delta', current: 290000, potential: 450000, score: 8.5 },
              { id: 2, name: 'Pedro Alves', current: 65000, potential: 120000, score: 7.9 },
          ],
          topProducts: [
              { name: 'Kit Alcaline Max', conversion: 35, units: 450, trend: 'up' },
              { name: 'Refil Energy', conversion: 42, units: 1200, trend: 'up' },
          ],
          recommendations: [
              { id: 1, type: 'critical', text: 'Realocar estoque de SP para RJ para evitar ruptura iminente.' },
              { id: 2, type: 'high', text: 'Iniciar campanha de reativação para clientes inativos > 90 dias.' },
          ],
          risks: [
              { id: 1, type: 'high', text: 'Equipe Charlie com atividade estagnada há 5 dias.' }
          ]
      });
  }, [syncKey]);

  return { insights };
};