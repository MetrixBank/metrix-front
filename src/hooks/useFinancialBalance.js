import { useCallback, useEffect, useState } from 'react';
import { getBalance } from '@/services/financialService';

/**
 * Carrega saldo disponível/bloqueado (futura integração Asaas via financialService.getBalance).
 */
export function useFinancialBalance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getBalance();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar o saldo.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { data, loading, error, refetch: fetchBalance };
}
