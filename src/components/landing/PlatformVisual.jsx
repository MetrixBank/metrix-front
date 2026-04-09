import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { BarChart3, Package, Users, Target, CalendarDays, Zap } from 'lucide-react';

/* ── Brand Palette ── */
const P = {
  primary:     '#8040FC',
  primaryDim:  'rgba(128,64,252,0.18)',
  primaryGlow: 'rgba(128,64,252,0.40)',
  tertiary:    '#11DEB4',
  tertiaryDim: 'rgba(17,222,180,0.15)',
  tertiaryGlow:'rgba(17,222,180,0.40)',
  surface:     'rgba(22,16,46,0.92)',
  surfaceHub:  'rgba(35,24,72,0.95)',
  border:      'rgba(128,64,252,0.30)',
  borderTeal:  'rgba(17,222,180,0.30)',
  text:        '#EDE9FF',
};

const FEATURES = [
  { title: 'Agenda Inteligente',     icon: CalendarDays, isPrimary: true  },
  { title: 'Gestão de Estoque',      icon: Package,      isPrimary: false },
  { title: 'Ranking de Performance', icon: Target,       isPrimary: true  },
  { title: 'Equipes e Metas',        icon: Users,        isPrimary: false },
  { title: 'Funil de Vendas',        icon: BarChart3,    isPrimary: true  },
];

const N          = FEATURES.length;
const ORBIT_R    = 160;   // px
const HUB_SIZE   = 380;   // container square
const DURATION   = '28s'; // one full revolution

/*
  Classic CSS orbit trick — no JS frame loop, no jitter:
    1. Wrapper div sits at center (left/top 50%)
    2. Wrapper rotates: rotate(offset + 360deg)  → moves around the ring
    3. Card inside counter-rotates the same amount → stays upright
*/

const keyframesStyle = `
  @keyframes orbitCW {
    from { transform: var(--orbit-start); }
    to   { transform: var(--orbit-end); }
  }
  @keyframes counterCCW {
    from { transform: var(--counter-start); }
    to   { transform: var(--counter-end); }
  }
`;

const PlatformVisual = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });

  return (
    <motion.div
      ref={ref}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '2.5rem 0' }}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, ease: 'easeOut' }}
    >
      {/* Inject keyframes once */}
      <style>{keyframesStyle}</style>

      {/* Root square — everything is relative to this */}
      <div style={{ position: 'relative', width: HUB_SIZE, height: HUB_SIZE }}>

        {/* ── SVG rings (static decorative layer) ── */}
        <svg
          width={HUB_SIZE} height={HUB_SIZE}
          viewBox={`0 0 ${HUB_SIZE} ${HUB_SIZE}`}
          style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
        >
          {/* Outer halo */}
          <circle cx={HUB_SIZE/2} cy={HUB_SIZE/2} r={ORBIT_R + 34}
            fill="none" stroke={P.primaryGlow} strokeWidth="1" opacity="0.12" />

          {/* Main orbit track */}
          <motion.circle
            cx={HUB_SIZE/2} cy={HUB_SIZE/2} r={ORBIT_R}
            fill="none" stroke={P.primary} strokeWidth="1"
            strokeDasharray="5 6" opacity="0.35"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={inView ? { pathLength: 1, opacity: 0.35 } : {}}
            transition={{ duration: 2.8, delay: 0.4, ease: 'easeInOut' }}
          />

          {/* Inner accent ring */}
          <circle cx={HUB_SIZE/2} cy={HUB_SIZE/2} r={48}
            fill={P.primaryDim} stroke={P.primary}
            strokeWidth="1" strokeDasharray="3 4" opacity="0.5" />

          {/* Hub circle */}
          <circle cx={HUB_SIZE/2} cy={HUB_SIZE/2} r={31} fill={P.surfaceHub} />
          <circle cx={HUB_SIZE/2} cy={HUB_SIZE/2} r={31}
            fill="none" stroke={P.primary} strokeWidth="1.5" opacity="0.85" />
        </svg>

        {/* ── Center icon ── */}
        <div style={{
          position: 'absolute',
          left: HUB_SIZE / 2 - 10,
          top:  HUB_SIZE / 2 - 10,
          width: 20, height: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 20,
        }}>
          <Zap size={18} color={P.tertiary} />
        </div>

        {/* ── Orbiting cards ── */}
        {FEATURES.map((f, i) => {
          const Icon     = f.icon;
          const color    = f.isPrimary ? P.primary    : P.tertiary;
          const colorDim = f.isPrimary ? P.primaryDim : P.tertiaryDim;
          const glow     = f.isPrimary ? P.primaryGlow: P.tertiaryGlow;
          const border   = f.isPrimary ? P.border     : P.borderTeal;

          // Starting angle: evenly spaced, top-first (-90°)
          const startDeg = (i / N) * 360 - 90;
          const endDeg   = startDeg + 360;

          // Wrapper: starts at center, rotates → card travels the orbit ring
          const wrapperStyle = {
            position: 'absolute',
            left: '50%',
            top:  '50%',
            width: 0,
            height: 0,
            // CSS custom props used by keyframes
            '--orbit-start':   `rotate(${startDeg}deg) translateX(${ORBIT_R}px)`,
            '--orbit-end':     `rotate(${endDeg}deg)   translateX(${ORBIT_R}px)`,
            '--counter-start': `translate(-50%,-50%) rotate(${-startDeg}deg)`,
            '--counter-end':   `translate(-50%,-50%) rotate(${-endDeg}deg)`,
            animation: `orbitCW ${DURATION} linear infinite`,
          };

          // Card: sits inside wrapper, counter-rotates to stay upright
          const cardStyle = {
            width: 162,
            height: 56,
            borderRadius: 12,
            background: P.surface,
            border: `1px solid ${border}`,
            boxShadow: `0 0 20px ${glow}, 0 4px 18px rgba(0,0,0,0.55)`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 14px',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            animation: `counterCCW ${DURATION} linear infinite`,
          };

          return (
            <div key={f.title} style={wrapperStyle}>
              <div style={cardStyle}>
                <div style={{
                  width: 32, height: 32, flexShrink: 0,
                  borderRadius: 8,
                  background: colorDim,
                  border: `1px solid ${color}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={15} color={color} />
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  color: P.text, lineHeight: 1.35, letterSpacing: '0.01em',
                }}>
                  {f.title}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default PlatformVisual;