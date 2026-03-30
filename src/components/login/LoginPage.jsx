import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import LoginForm from '@/components/login/LoginForm';
import SignUpForm from '@/components/login/SignUpForm';
import ForgotPasswordForm from '@/components/login/ForgotPasswordForm';
import { LOGO_URL } from '@/components/LoadingFallback';

const LoginPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialMode = queryParams.get('mode') === 'signup' ? 'signup' : 'login';
  
  const [authMode, setAuthMode] = useState(initialMode);

  useEffect(() => {
    setAuthMode(initialMode);
  }, [initialMode]);

  const particlesInit = useCallback(async engine => {
    await loadSlim(engine);
  }, []);

  const particlesOptions = {
    background: {
      color: { value: "transparent" }
    },
    fpsLimit: 60,
    interactivity: {
      events: {
        onHover: { enable: true, mode: "grab" },
        resize: true
      },
      modes: {
        grab: { distance: 140, links: { opacity: 0.8 } }
      }
    },
    particles: {
      color: { value: ["#34d399", "#60a5fa", "#a78bfa"] },
      links: {
        color: "hsl(var(--foreground))",
        distance: 150,
        enable: true,
        opacity: 0.1,
        width: 1
      },
      move: {
        enable: true,
        speed: 1,
        direction: "none",
        random: true,
        straight: false,
        outModes: { default: "bounce" }
      },
      number: {
        density: { enable: true, area: 800 },
        value: 50
      },
      opacity: {
        value: { min: 0.1, max: 0.5 },
        animation: { enable: true, speed: 1, minimumValue: 0.1 }
      },
      shape: { type: "circle" },
      size: { value: { min: 1, max: 3 } }
    },
    detectRetina: true
  };

  const handleSignUpSuccess = () => {
    setAuthMode('login');
  };

  const getToggleText = () => {
    switch (authMode) {
      case 'signup':
        return 'Já tem uma conta? Faça login';
      case 'login':
      default:
        return 'Não tem uma conta? Cadastre-se';
    }
  };

  const handleToggle = () => {
    setAuthMode(prev => prev === 'signup' ? 'login' : 'signup');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background Particles */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={particlesOptions}
        className="absolute top-0 left-0 w-full h-full z-0"
      />
      
      {/* Ambient Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-background to-emerald-900/20 pointer-events-none z-0" />

      <div className="w-full max-w-[420px] z-10 flex flex-col items-center gap-8">
        
        {/* Logo Section */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center space-y-4"
        >
          <div className="relative w-24 h-24 mx-auto">
             <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
             <img 
                src={LOGO_URL} 
                alt="MetriX Logo" 
                className="relative w-full h-full object-contain drop-shadow-lg"
             />
          </div>
          <div className="space-y-1">
             <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
               MetriX
             </h1>
             <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
               Gestão de Sucesso
             </p>
          </div>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="w-full"
        >
          <Card className="border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl p-6 sm:p-8 rounded-2xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            
            <AnimatePresence mode="wait">
              <motion.div
                key={authMode}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {authMode === 'signup' && (
                  <SignUpForm onSignUpSuccess={handleSignUpSuccess} setAuthMode={setAuthMode} />
                )}
                {authMode === 'forgotPassword' && (
                  <ForgotPasswordForm setAuthMode={setAuthMode} />
                )}
                {authMode === 'login' && (
                  <LoginForm setAuthMode={setAuthMode} />
                )}
              </motion.div>
            </AnimatePresence>

            {authMode !== 'forgotPassword' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 text-center"
              >
                <Button 
                  variant="link" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors" 
                  onClick={handleToggle}
                >
                  {getToggleText()}
                </Button>
              </motion.div>
            )}
          </Card>
          
          <motion.p 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.5 }}
             className="text-center text-xs text-muted-foreground/50 mt-8"
          >
             © {new Date().getFullYear()} MetriX. Plataforma exclusiva Grupo Spartan.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;