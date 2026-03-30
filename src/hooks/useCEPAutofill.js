import { useState, useEffect } from 'react';

/**
 * Hook to fetch address data from ViaCEP API based on provided CEP
 * @param {string} cep - The CEP string to lookup (can include mask)
 * @returns {Object} { addressData, loading, error }
 */
export const useCEPAutofill = (cep) => {
  const [addressData, setAddressData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Clean CEP: remove non-digits
    const cleanCep = cep?.replace(/\D/g, '');

    // Reset state if empty
    if (!cleanCep) {
      setAddressData(null);
      setError(null);
      return;
    }

    // Don't fetch if not valid length yet
    if (cleanCep.length !== 8) {
      return;
    }

    let isMounted = true;
    
    const fetchAddress = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        
        if (!response.ok) {
            throw new Error('Erro na conexão com serviço de CEP');
        }

        const data = await response.json();

        if (isMounted) {
          if (data.erro) {
            setError('CEP não encontrado.');
            setAddressData(null);
          } else {
            setAddressData({
              address: data.logradouro,
              neighborhood: data.bairro,
              city: data.localidade,
              state: data.uf,
              complement: data.complemento,
              zip_code: data.cep // formatted
            });
            setError(null);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('Erro ao buscar CEP. Verifique sua conexão.');
          setAddressData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Debounce the call to avoid hitting API on every keystroke if user types fast
    const timeoutId = setTimeout(() => {
        fetchAddress();
    }, 500);

    return () => {
        isMounted = false;
        clearTimeout(timeoutId);
    };
  }, [cep]);

  return { addressData, loading, error };
};