import React, { useCallback } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import Header from '@/components/landing/Header';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import StatsSection from '@/components/landing/StatsSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import CtaSection from '@/components/landing/CtaSection';
import Footer from '@/components/landing/Footer';
import VslSection from '@/components/landing/VslSection';
import PricingSection from '@/components/landing/PricingSection';

const LOGO_URL = "https://horizons-cdn.hostinger.com/0c05ef73-d1d6-4ad5-b2e0-c9f1ef8a8a6c/c6cd491c9086d90da0346bf00585c67f.png";

const LandingPage = () => {
  const particlesInit = useCallback(async engine => {
    await loadSlim(engine);
  }, []);

  const particlesOptions = {
    background: { color: { value: "transparent" } },
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
        opacity: 0.05,
        width: 1
      },
      move: {
        enable: true,
        speed: 0.8,
        direction: "none",
        random: true,
        straight: false,
        outModes: { default: "bounce" }
      },
      number: {
        density: { enable: true, area: 1000 },
        value: 40
      },
      opacity: {
        value: { min: 0.1, max: 0.3 },
        animation: { enable: true, speed: 0.5, minimumValue: 0.1 }
      },
      shape: { type: "circle" },
      size: { value: { min: 1, max: 2 } }
    },
    detectRetina: true
  };

  return (
    <HelmetProvider>
      <Helmet>
        <title>MetriX - Lidere sua Equipe para o Sucesso</title>
        <meta name="description" content="A MetriX é a ferramenta definitiva para líderes que desejam gestão total sobre as vendas, metas e desempenho de suas equipes. Transforme sua liderança." />
      </Helmet>
      
      <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden font-sans selection:bg-primary/30">
        {/* Ambient Background Gradient - Matching Login Page */}
        <div className="fixed inset-0 bg-gradient-to-br from-violet-900/20 via-background to-emerald-900/20 pointer-events-none z-0" />
        
        {/* Particles Effect */}
        <Particles
          id="tsparticles"
          init={particlesInit}
          options={particlesOptions}
          className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none"
        />

        <div className="relative z-10">
          <Header logoUrl={LOGO_URL} />
          <main>
            <HeroSection />
            <VslSection />
            <StatsSection />
            <FeaturesSection />
            <PricingSection />
            <TestimonialsSection />
            <CtaSection />
          </main>
          <Footer logoUrl={LOGO_URL} />
        </div>
      </div>
    </HelmetProvider>
  );
};

export default LandingPage;