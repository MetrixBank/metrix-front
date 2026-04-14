import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  BarChart3, TrendingUp, Users, Target, Package,
  DollarSign, Bell, CheckCircle2
} from 'lucide-react';

/* ── Brand palette ── */
const teal   = '#11DEB4';
const purple = '#8040FC';
const surface  = 'rgba(10, 8, 24, 0.95)';
const surface2 = 'rgba(22, 16, 46, 0.92)';

/* ── Mini bar chart data ── */
const BAR_DATA = [42, 68, 55, 80, 63, 90, 74, 95];

/* ── Sparkline points ── (normalised 0-1, flipped Y for SVG) ── */
const SPARK = [0.7, 0.55, 0.65, 0.4, 0.5, 0.3, 0.2, 0.15];
const toSvgPts = (pts, w, h) =>
  pts.map((v, i) => `${(i / (pts.length - 1)) * w},${v * h}`).join(' ');

const PlatformVisual = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 14 },
    animate: inView ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.6, delay, ease: 'easeOut' },
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.5 }}
      style={{
        width: '100%',
        background: surface,
        borderRadius: 16,
        overflow: 'hidden',
        fontFamily: "'Inter', 'Manrope', sans-serif",
        userSelect: 'none',
      }}
    >
      {/* ── Top bar ── */}
      <div style={{
        background: 'rgba(22, 16, 46, 0.98)',
        borderBottom: '1px solid rgba(128,64,252,0.18)',
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* traffic lights */}
          {['#FF5F57', '#FFBD2E', '#28C840'].map(c => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <div style={{
          fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: teal, boxShadow: `0 0 6px ${teal}` }} />
          Dashboard — MetriX
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Bell size={13} color="rgba(255,255,255,0.3)" />
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: purple + '55', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={10} color={purple} />
          </div>
        </div>
      </div>

      {/* ── Dashboard body ── */}
      <div style={{ padding: '18px 18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* KPI row */}
        <motion.div {...fadeUp(0.1)} style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            { label: 'Vendas Hoje',    value: 'R$ 8.420',  trend: '+12%', color: teal,   icon: DollarSign },
            { label: 'Meta do Mês',    value: '74%',        trend: '+5%',  color: purple, icon: Target },
            { label: 'Equipe Ativa',   value: '18 / 22',   trend: '+2',   color: '#60a5fa', icon: Users },
          ].map(({ label, value, trend, color, icon: Icon }) => (
            <div key={label} style={{
              background: surface2,
              border: `1px solid ${color}22`,
              borderRadius: 10,
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
                <Icon size={12} color={color} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{value}</span>
              <span style={{ fontSize: 9, color, fontWeight: 600 }}>↑ {trend}</span>
            </div>
          ))}
        </motion.div>

        {/* Chart + Ranking row */}
        <motion.div {...fadeUp(0.2)} style={{ display: 'grid', gridTemplateColumns: '1fr 0.85fr', gap: 10 }}>

          {/* Bar chart */}
          <div style={{
            background: surface2,
            border: '1px solid rgba(128,64,252,0.15)',
            borderRadius: 10,
            padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Funil de Vendas</span>
              <BarChart3 size={12} color={purple} />
            </div>
            {/* bars */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 54 }}>
              {BAR_DATA.map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={inView ? { height: `${v}%` } : {}}
                  transition={{ duration: 0.7, delay: 0.3 + i * 0.06, ease: 'easeOut' }}
                  style={{
                    flex: 1,
                    background: i === BAR_DATA.length - 1
                      ? `linear-gradient(180deg, ${teal}, ${teal}88)`
                      : `linear-gradient(180deg, ${purple}, ${purple}66)`,
                    borderRadius: '3px 3px 0 0',
                    minHeight: 4,
                  }}
                />
              ))}
            </div>
            {/* x labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago'].map(m => (
                <span key={m} style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)' }}>{m}</span>
              ))}
            </div>
          </div>

          {/* Ranking */}
          <div style={{
            background: surface2,
            border: '1px solid rgba(17,222,180,0.15)',
            borderRadius: 10,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Ranking Equipe</span>
              <Target size={12} color={teal} />
            </div>
            {[
              { name: 'Ana P.',    score: 98, bar: '95%' },
              { name: 'Carlos M.', score: 87, bar: '82%' },
              { name: 'Vitória S.',score: 76, bar: '70%' },
            ].map(({ name, score, bar }, idx) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{
                  width: 14, height: 14, borderRadius: '50%',
                  background: idx === 0 ? `${teal}33` : `${purple}22`,
                  border: `1px solid ${idx === 0 ? teal : purple}55`,
                  fontSize: 7, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: idx === 0 ? teal : purple,
                  flexShrink: 0,
                }}>{idx + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>{name}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: idx === 0 ? teal : 'rgba(255,255,255,0.5)' }}>{score}</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={inView ? { width: bar } : {}}
                      transition={{ duration: 0.8, delay: 0.5 + idx * 0.1 }}
                      style={{
                        height: '100%',
                        background: idx === 0 ? teal : `${purple}99`,
                        borderRadius: 2,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Sparkline + tasks row */}
        <motion.div {...fadeUp(0.3)} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

          {/* Sparkline */}
          <div style={{
            background: surface2,
            border: '1px solid rgba(128,64,252,0.15)',
            borderRadius: 10,
            padding: '10px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Crescimento</span>
              <TrendingUp size={12} color={teal} />
            </div>
            <svg width="100%" height="36" viewBox="0 0 100 36" preserveAspectRatio="none">
              <defs>
                <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={teal} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={teal} stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline
                points={toSvgPts(SPARK, 100, 36)}
                fill="none"
                stroke={teal}
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <polygon
                points={`0,36 ${toSvgPts(SPARK, 100, 36)} 100,36`}
                fill="url(#sparkFill)"
              />
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>Jan</span>
              <span style={{ fontSize: 9, color: teal, fontWeight: 600 }}>+38% ano</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>Ago</span>
            </div>
          </div>

          {/* Tasks */}
          <div style={{
            background: surface2,
            border: `1px solid rgba(17,222,180,0.15)`,
            borderRadius: 10,
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 7,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Tarefas IA</span>
              <CheckCircle2 size={12} color={teal} />
            </div>
            {[
              { text: 'Follow-up com cliente VIP', done: true },
              { text: 'Reativação — 3 inativos',   done: true },
              { text: 'Relatório semanal equipe',   done: false },
            ].map(({ text, done }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 12, height: 12, borderRadius: 3,
                  background: done ? `${teal}33` : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${done ? teal : 'rgba(255,255,255,0.1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {done && <CheckCircle2 size={7} color={teal} />}
                </div>
                <span style={{
                  fontSize: 9,
                  color: done ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.75)',
                  textDecoration: done ? 'line-through' : 'none',
                }}>{text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Stock mini row */}
        <motion.div {...fadeUp(0.4)} style={{
          background: surface2,
          border: '1px solid rgba(128,64,252,0.12)',
          borderRadius: 10,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={13} color={purple} />
            <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Estoque da Equipe</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label: 'Produto A', qty: 142, color: purple },
              { label: 'Produto B', qty: 87,  color: teal },
              { label: 'Produto C', qty: 23,  color: '#f59e0b' },
            ].map(({ label, qty, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color }}>{qty}</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PlatformVisual;