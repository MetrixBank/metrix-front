import { useState, useEffect } from 'react';
import { useDataSync } from '@/contexts/DataSyncContext';

export const useAlertSystem = () => {
  const { syncKey } = useDataSync();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
      // Mock alert generation logic
      const newAlerts = [
          { id: 1, type: 'critical', message: 'Ruptura de estoque: Kit Alcaline (SP)', category: 'stock' },
          { id: 2, type: 'warning', message: 'Queda de produção: Equipe Charlie (-15%)', category: 'production' },
          { id: 3, type: 'warning', message: '3 Metas em risco de não cumprimento', category: 'goals' },
          { id: 4, type: 'info', message: 'Anomalia de receita detectada em Curitiba', category: 'revenue' },
          { id: 5, type: 'info', message: '5 Novos distribuidores aguardando aprovação', category: 'team' }
      ];
      setAlerts(newAlerts);
  }, [syncKey]);

  return { alerts };
};