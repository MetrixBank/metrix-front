import React from 'react';

const PremiumPaywall = ({ children }) => {
  // Always render children, removing the paywall
  return <>{children}</>;
};

export default PremiumPaywall;