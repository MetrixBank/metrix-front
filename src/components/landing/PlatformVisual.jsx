import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { BarChart3, Package, Users, Target, CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/card';

const visualFeatures = [
  { title: 'Agenda Inteligente', icon: CalendarDays, delay: 1.0 },
  { title: 'Gestão de Estoque', icon: Package, delay: 0.4 },
  { title: 'Ranking de Performance', icon: Target, delay: 0.2 },
  { title: 'Equipes e Metas', icon: Users, delay: 0.6 },
  { title: 'Funil de Vendas', icon: BarChart3, delay: 0.8 },
];

const orderedFeatures = [
    visualFeatures[0],
    visualFeatures[2],
    visualFeatures[1],
    visualFeatures[3],
    visualFeatures[4],
];

const FeatureCard = ({ title, icon: Icon, style, delay }) => {
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', stiffness: 100, damping: 15, delay },
    },
  };

  const rotationTransition = {
    duration: 30,
    repeat: Infinity,
    ease: 'linear',
  };

  return (
    <motion.div
      className="absolute"
      style={style}
      variants={cardVariants}
    >
      <motion.div
        className="w-36 md:w-44"
        animate={{ rotate: -360 }}
        transition={rotationTransition}
      >
        <Card className="p-3 md:p-4 card-gradient flex items-center space-x-2 md:space-x-3 shadow-lg">
          <div className="p-2 rounded-md bg-primary/20">
            <Icon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          </div>
          <p className="text-xs md:text-sm font-semibold text-foreground">{title}</p>
        </Card>
      </motion.div>
    </motion.div>
  );
};

const PlatformVisual = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
  
  const points = React.useMemo(() => {
    const total = orderedFeatures.length;
    const radius = 32;
    const centerX = 50;
    const centerY = 50;

    return Array.from({ length: total }).map((_, index) => {
      const angle = -Math.PI / 2 + (index / total) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return { x, y };
    });
  }, []);

  const getCardStyle = (index) => {
    const point = points[index];
    return {
      top: `${point.y}%`,
      left: `${point.x}%`,
      transform: 'translate(-50%, -50%)',
    };
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const rotationTransition = {
    duration: 30,
    repeat: Infinity,
    ease: 'linear',
  };

  const svgPathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: 0.5, type: 'tween', duration: 2.5, ease: 'easeInOut' },
        opacity: { delay: 0.5, duration: 0.01 },
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className="relative w-full h-[30rem] sm:h-[34rem] md:h-[38rem] flex items-center justify-center"
      variants={containerVariants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      <motion.div 
        className="relative w-[min(95vw,26rem)] h-[min(95vw,26rem)] sm:w-[30rem] sm:h-[30rem] md:w-[34rem] md:h-[34rem]"
        animate={inView ? { rotate: 360 } : { rotate: 0 }}
        transition={inView ? rotationTransition : { duration: 0.5 }}
      >
        <motion.div 
            className="absolute inset-0"
            variants={{ hidden: {opacity: 0, scale: 0.8}, visible: {opacity: 1, scale: 1} }}
            transition={{ delay: 0.1, duration: 0.7 }}
        >
            <svg width="100%" height="100%" viewBox="0 0 100 100" className="overflow-visible">
                <motion.circle
                    cx="50"
                    cy="50"
                    r="32"
                    fill="none"
                    stroke="hsl(var(--primary) / 0.2)"
                    strokeWidth="0.6"
                    strokeDasharray="2 2"
                    variants={svgPathVariants}
                />
            </svg>
        </motion.div>
      
        {orderedFeatures.map((feature, index) => (
          <FeatureCard
            key={feature.title}
            {...feature}
            style={getCardStyle(index)}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

export default PlatformVisual;