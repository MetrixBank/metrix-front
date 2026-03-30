import { useState, useEffect, useCallback } from 'react';

/**
 * A custom hook for fetching data using a Supabase query.
 * @param {Function} queryFn - A function that returns a Supabase query promise (e.g., () => supabase.from('table').select('*')).
 * @param {Array} deps - An array of dependencies that will trigger a refetch when changed.
 * @returns {{data: any, loading: boolean, error: any, refetch: Function}}
 */
const useQuery = (queryFn, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: queryError } = await queryFn();
      if (queryError) {
        throw queryError;
      }
      setData(result);
    } catch (err) {
      setError(err);
      console.error("Error in useQuery:", err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryFn, ...deps]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

export default useQuery;