import React from 'react';
    import { motion } from 'framer-motion';

    const LOGO_URL = "https://storage.googleapis.com/hostinger-horizons-assets-prod/0c05ef73-d1d6-4ad5-b2e0-c9f1ef8a8a6c/f96cbb85c74adc6f3504140b2cff4706.png";

    const AuthCallbackPage = () => {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 gradient-bg">
          <img src={LOGO_URL} alt="Logo MCX GROUP" className="h-24 w-auto mb-8 animate-float sm:h-28" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
          />
          <p className="mt-4 text-foreground text-lg">Validando seu link...</p>
          <p className="text-muted-foreground">Aguarde um momento, você será redirecionado.</p>
        </div>
      );
    };

    export default AuthCallbackPage;