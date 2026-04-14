import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, BarChart3, CalendarDays, Package, Target, Users, Zap } from 'lucide-react';
import PlatformVisual from './PlatformVisual';

/* ─── Floating icon cards — estilo da imagem de referência ─── */
const FLOAT_CARDS = [
  { icon: Zap,          color: '#11DEB4', bg: 'rgba(17,222,180,0.12)',  border: 'rgba(17,222,180,0.30)', top: '4%',  right: '12%', delay: 0    },
  { icon: BarChart3,    color: '#8040FC', bg: 'rgba(128,64,252,0.12)', border: 'rgba(128,64,252,0.30)', top: '28%', right: '2%',  delay: 0.4  },
  { icon: Target,       color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.30)', top: '52%', right: '14%', delay: 0.7  },
  { icon: Package,      color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.30)', top: '16%', right: '38%', delay: 1.1  },
  { icon: Users,        color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.30)', top: '68%', right: '4%',  delay: 0.9  },
  { icon: CalendarDays, color: '#e879f9', bg: 'rgba(232,121,249,0.12)',border: 'rgba(232,121,249,0.30)',top: '40%', right: '30%', delay: 0.55 },
];

/* CSS keyframe injetada inline — float suave sem JS loop */
const floatKeyframes = `
  @keyframes heroFloat0 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-10px)} }
  @keyframes heroFloat1 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-14px)} }
  @keyframes heroFloat2 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-8px)}  }
  @keyframes heroFloat3 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-12px)} }
  @keyframes heroFloat4 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-9px)}  }
  @keyframes heroFloat5 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-11px)} }
`;
const DURATIONS = ['3.8s','4.4s','3.3s','4.9s','3.6s','4.1s'];

const FloatingCard = ({ icon: Icon, color, bg, border, top, right, delay, index }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.6 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.6, delay: 0.5 + delay, ease: 'easeOut' }}
    style={{
      position: 'absolute',
      top,
      right,
      width: 52,
      height: 52,
      borderRadius: 14,
      background: bg,
      border: `1px solid ${border}`,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: `0 0 24px ${color}30, 0 6px 20px rgba(0,0,0,0.4)`,
      animation: `heroFloat${index} ${DURATIONS[index]} ease-in-out infinite`,
      animationDelay: `${delay}s`,
      zIndex: 10,
    }}
  >
    <Icon size={22} color={color} />
  </motion.div>
);

const HeroSection = () => {
  return (
    <section className="relative pt-28 pb-0 overflow-hidden">
      <style>{floatKeyframes}</style>

      {/* Background glows */}
      <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-primary/8 blur-[140px] rounded-full pointer-events-none -translate-x-1/3 -translate-y-1/4" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[hsl(var(--teal))]/8 blur-[120px] rounded-full pointer-events-none translate-x-1/4 translate-y-1/4" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ── Two-column: text left / floating cards right ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-4 items-center min-h-[72vh]">

          {/* Left — Text */}
          <motion.div
            className="text-left"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="inline-flex items-center rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-medium text-white/80 mb-6 backdrop-blur-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--teal))] mr-2 animate-pulse" />
              A plataforma de gestão para líderes de vendas
            </motion.div>

            {/* H1 */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.05]">
              Lidere sua Equipe.{' '}
              <br />
              <span
                style={{
                  backgroundImage: 'linear-gradient(135deg, #11DEB4 0%, #00C6A0 50%, #0DA88A 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Domine o Mercado.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-white/60 mb-10 leading-relaxed max-w-md">
              A plataforma definitiva para gestores que buscam escala, precisão e performance editorial em ambientes de alta pressão.
            </p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Button
                size="lg"
                className="h-12 px-7 text-sm font-semibold bg-white text-black hover:bg-white/90 shadow-[0_0_28px_-8px_rgba(255,255,255,0.4)] transition-all hover:scale-105"
                asChild
              >
                <Link to="/login?mode=signup">
                  Comece Agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-7 text-sm font-semibold border-white/10 bg-white/5 text-white hover:bg-white/10 backdrop-blur-sm transition-all hover:border-white/20 gap-2"
                asChild
              >
                <a href="#features">
                  <Play className="h-3.5 w-3.5 fill-white" />
                  Ver Demonstração
                </a>
              </Button>
            </motion.div>
          </motion.div>

          {/* Right — Floating icon cards */}
          <div className="relative hidden lg:block" style={{ height: '480px' }}>
            {FLOAT_CARDS.map((card, i) => (
              <FloatingCard key={i} {...card} index={i} />
            ))}
          </div>
        </div>

        {/* ── Dashboard mockup — full width below ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7, type: 'spring', stiffness: 50 }}
          className="mt-10 lg:mt-6"
        >
          <div className="relative rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-[hsl(var(--teal))]/10 opacity-50 group-hover:opacity-70 transition-opacity duration-700" />
            <PlatformVisual />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;