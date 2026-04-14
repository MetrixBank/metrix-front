import React, { useEffect, useRef } from 'react';
import { motion, useInView, useAnimation, animate } from 'framer-motion';

const Stat = ({ value, label, suffix = '', prefix = '' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const nodeRef = useRef();

  useEffect(() => {
    if (isInView) {
      const node = nodeRef.current;
      const ctrl = animate(0, value, {
        duration: 2.2,
        ease: 'easeOut',
        onUpdate(latest) {
          if (node) node.textContent = Math.round(latest).toLocaleString('pt-BR');
        },
      });
      return () => ctrl.stop();
    }
  }, [isInView, value]);

  return (
    <motion.div
      ref={ref}
      className="flex flex-col items-center text-center px-4 py-2"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-1">
        {prefix && <span style={{ color: 'hsl(var(--teal))' }}>{prefix}</span>}
        <span ref={nodeRef}>0</span>
        {suffix && <span style={{ color: 'hsl(var(--teal))' }}>{suffix}</span>}
      </p>
      <p className="text-xs font-medium text-white/40 uppercase tracking-widest">{label}</p>
    </motion.div>
  );
};

const Divider = () => (
  <div className="hidden sm:block w-px h-10 bg-white/10 self-center" />
);

const StatsSection = () => {
  const stats = [
    { value: 120,     label: 'Líderes Ativos',     suffix: '+' },
    { value: 1500000, label: 'Vendas Gerenciadas',  prefix: 'R$ ' },
    { value: 98,      label: 'Satisfação',           suffix: '%' },
    { value: 45,      label: 'Mais Produtividade',   suffix: '%' },
  ];

  return (
    <section className="py-8 border-y border-white/5" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(12px)' }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-around gap-y-6 divide-y sm:divide-y-0 divide-white/5">
          {stats.map((stat, i) => (
            <React.Fragment key={stat.label}>
              <Stat {...stat} />
              {i < stats.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;