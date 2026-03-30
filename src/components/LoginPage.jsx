import React, { useState, useCallback } from 'react';
    import { motion } from 'framer-motion';
    import { Button } from '@/components/ui/button';
    import { Card } from '@/components/ui/card';
    import Particles from "react-tsparticles";
    import { loadSlim } from "tsparticles-slim";

    import LoginForm from '@/components/login/LoginForm';
    import SignUpForm from '@/components/login/SignUpForm';
    import ForgotPasswordForm from '@/components/login/ForgotPasswordForm';

    const LOGO_URL = "https://storage.googleapis.com/hostinger-horizons-assets-prod/0c05ef73-d1d6-4ad5-b2e0-c9f1ef8a8a6c/f96cbb85c74adc6f3504140b2cff4706.png";

    const LoginPage = ({ onLoginSuccess }) => {
      const [authMode, setAuthMode] = useState('login');

      const particlesInit = useCallback(async (engine) => {
        await loadSlim(engine);
      }, []);

      const particlesOptions = {
        background: {
          color: {
            value: "transparent",
          },
        },
        fpsLimit: 60,
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: "grab",
            },
            resize: true,
          },
          modes: {
            grab: {
                distance: 140,
                links: {
                    opacity: 0.8
                }
            },
          },
        },
        particles: {
          color: {
            value: ["#34d399", "#60a5fa", "#a78bfa"],
          },
          links: {
            color: "hsl(var(--foreground))",
            distance: 150,
            enable: true,
            opacity: 0.1,
            width: 1,
          },
          collisions: {
            enable: false,
          },
          move: {
            direction: "none",
            enable: true,
            outModes: {
              default: "bounce",
            },
            random: true,
            speed: 1,
            straight: false,
          },
          number: {
            density: {
              enable: true,
              area: 800,
            },
            value: 50,
          },
          opacity: {
            value: {min: 0.1, max: 0.5},
            animation: {
              enable: true,
              speed: 1,
              minimumValue: 0.1,
              sync: false,
            },
          },
          shape: {
            type: "circle",
          },
          size: {
            value: { min: 1, max: 3 },
          },
        },
        detectRetina: true,
      };

      const renderForm = () => {
        switch (authMode) {
          case 'signup':
            return <SignUpForm setAuthMode={setAuthMode} />;
          case 'forgotPassword':
            return <ForgotPasswordForm setAuthMode={setAuthMode} />;
          case 'login':
          default:
            return <LoginForm onLoginSuccess={onLoginSuccess} setAuthMode={setAuthMode} />;
        }
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
        if (authMode === 'signup') {
          setAuthMode('login');
        } else {
          setAuthMode('signup');
        }
      };

      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
        >
          <Particles
            id="tsparticles"
            init={particlesInit}
            options={particlesOptions}
            className="absolute top-0 left-0 w-full h-full z-0"
          />
          <div className="w-full max-w-md space-y-8 z-10">
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <img src={LOGO_URL} alt="Logo MCX GROUP" className="mx-auto h-24 w-auto mb-6 sm:h-28 animate-float" />
              <h1 className="text-4xl font-bold tracking-tighter text-gradient sm:text-5xl">MCX GROUP</h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">Plataforma EXCLUSIVA para distribuidores do GRUPO SPARTAN.</p>
            </motion.div>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6 card-gradient-login backdrop-blur-lg">
                {renderForm()}
                {authMode !== 'forgotPassword' && (
                  <Button
                    variant="link"
                    className="w-full mt-4 text-sm text-muted-foreground"
                    onClick={handleToggle}
                  >
                    {getToggleText()}
                  </Button>
                )}
              </Card>
            </motion.div>
          </div>
        </motion.div>
      );
    };

    export default LoginPage;