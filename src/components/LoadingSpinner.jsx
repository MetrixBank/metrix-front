import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  let spinnerSize;
  switch (size) {
    case 'sm':
      spinnerSize = 'w-6 h-6';
      break;
    case 'lg':
      spinnerSize = 'w-12 h-12';
      break;
    case 'xl':
      spinnerSize = 'w-16 h-16';
      break;
    case 'md':
    default:
      spinnerSize = 'w-8 h-8';
      break;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`flex justify-center items-center w-full h-full ${className}`}
    >
      <Loader2 className={`${spinnerSize} animate-spin text-primary`} />
    </motion.div>
  );
};

export default LoadingSpinner;