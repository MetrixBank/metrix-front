// This hook is deprecated and has been replaced by inline logic in FunnelIntelligencePage.jsx
export const useContactDetail = () => {
  console.warn('useContactDetail is deprecated');
  return { contact: null, messages: [], loading: false, error: null, refetch: () => {} };
};