import React from 'react';

const featureFlags = {
  // Adicione novas flags aqui. Ex: 'new-dashboard': true
};

const FeatureFlag = ({ name, children, fallback = null }) => {
  const isEnabled = featureFlags[name] || false;

  if (isEnabled) {
    return <>{children}</>;
  }
  
  return fallback;
};

export const useFeatureFlag = (name) => {
  return featureFlags[name] || false;
};

export default FeatureFlag;