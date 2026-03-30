import React from 'react';

const PremiumFeatureGuard = ({ children }) => {
  // Always render children, removing any restrictions
  return <>{children}</>;
};

export default PremiumFeatureGuard;