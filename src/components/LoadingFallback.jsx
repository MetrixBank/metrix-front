import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Re-exporting LOGO_URL is critical as it is imported by AppRoutes and other components.
export const LOGO_URL = "https://horizons-cdn.hostinger.com/0c05ef73-d1d6-4ad5-b2e0-c9f1ef8a8a6c/c6cd491c9086d90da0346bf00585c67f.png";

export function LoadingFallback() {
  const [showManualReload, setShowManualReload] = useState(false);

  useEffect(() => {
    // Timer to detect stuck loading/freezing
    const timer = setTimeout(() => {
      // Check if we already tried reloading automatically in this session
      const hasReloaded = sessionStorage.getItem('metrix_auto_reload');
      
      if (!hasReloaded) {
        // Set flag and force reload
        console.log('Loading timeout detected. Attempting auto-reload...');
        sessionStorage.setItem('metrix_auto_reload', 'true');
        window.location.reload();
      } else {
        // If we already reloaded and it's still stuck, show manual controls
        setShowManualReload(true);
      }
    }, 5000); // 5 seconds threshold for auto-reload

    return () => clearTimeout(timer);
  }, []);

  const handleManualReload = () => {
    // Clear cache/session logic could go here if needed, but simple reload is usually enough
    sessionStorage.removeItem('metrix_auto_reload'); // Reset flag to allow auto-reload again if needed
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-950 text-white p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-8 max-w-sm text-center"
      >
        {/* Logo with breathing animation */}
        <motion.img 
          src={LOGO_URL} 
          alt="MetriX Logo" 
          className="h-24 w-auto sm:h-32"
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {showManualReload && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 items-center mt-4 bg-slate-900/50 p-6 rounded-lg border border-slate-800"
          >
            <div className="flex items-center gap-2 text-amber-400">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-medium">O carregamento está demorando mais que o esperado.</p>
            </div>
            <Button 
              onClick={handleManualReload}
              variant="secondary"
              className="gap-2 w-full"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar Aplicação
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}