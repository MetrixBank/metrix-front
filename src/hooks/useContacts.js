// This hook is deprecated and has been replaced by inline logic in FunnelIntelligencePage.jsx
export const useContacts = () => {
  console.warn('useContacts is deprecated');
  return { contacts: [], loading: false, error: null, refetch: () => {} };
};