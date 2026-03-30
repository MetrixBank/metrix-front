import React, { useEffect, useRef } from 'react';
import { motion, useInView, useAnimation, animate } from 'framer-motion';

const Stat = ({ value, label, suffix = '', prefix = '' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const controls = useAnimation();
  const nodeRef = useRef();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
      const node = nodeRef.current;
      const animationControls = animate(0, value, {
        duration: 2.5,
        ease: "easeOut",
        onUpdate(latest) {
          if (node) {
            node.textContent = Math.round(latest).toLocaleString('pt-BR');
          }
        }
      });
      return () => animationControls.stop();
    }
  }, [isInView, value, controls]);

  return (
    <motion.div
      ref={ref}
      className="relative p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm text-center group hover:bg-white/10 transition-colors duration-500"
      variants={{
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1 }
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />
      <p className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
            {prefix}
        </span>
        <span ref={nodeRef} className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">0</span>
        <span className="text-primary ml-1">{suffix}</span>
      </p>
      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
    </motion.div>
  );
};

const StatsSection = () => {
  const stats = [
    { value: 120, label: 'Líderes Ativos', suffix: '+' },
    { value: 1500000, label: 'Vendas Gerenciadas', prefix: 'R$ ' },
    { value: 98, label: 'Satisfação', suffix: '%' },
    { value: 45, label: 'Mais Produtividade', suffix: '%' },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <section className="py-12 border-y border-white/5 bg-black/20 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
        >
          {stats.map((stat, index) => (
            <Stat key={index} {...stat} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default StatsSection;