// This hook is deprecated and has been replaced by inline logic in FunnelIntelligencePage.jsx
export const useMessageHistory = () => {
  console.warn('useMessageHistory is deprecated');
  return { history: [], loading: false, error: null, refetch: () => {} };
};