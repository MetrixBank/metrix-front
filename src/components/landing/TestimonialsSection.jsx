import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';

const testimonials = [
  {
    name: 'Carlos Silva',
    title: 'Líder Diamante',
    quote: 'A MetriX revolucionou minha gestão. A visão clara do funil de vendas da equipe e do estoque individual nos deu um aumento de 30% na eficiência em apenas 3 meses.',
    imageUrl: 'https://images.unsplash.com/photo-1595872018818-97555653a011',
  },
  {
    name: 'Stephany Silveira',
    title: 'Gerente Regional',
    quote: 'O sistema de metas e ranking é fantástico! Minha equipe nunca esteve tão motivada. As vendas cresceram 25% no último trimestre, estou muito feliz com os resultados.',
    imageUrl: 'https://storage.googleapis.com/hostinger-horizons-assets-prod/0c05ef73-d1d6-4ad5-b2e0-c9f1ef8a8a6c/67fe761279e56d845d511c4df0292201.jpg',
  },
  {
    name: 'Felipe H.',
    title: 'Diretor de Expansão',
    quote: 'Finalmente uma plataforma que entende as dores de um líder. O controle financeiro individual e a gestão de desempenho da equipe são um divisor de águas para nós.',
    imageUrl: 'https://images.unsplash.com/photo-1627577741153-74b82d87607b',
  },
];

const stars = (n = 5) => Array.from({ length: n }).map((_, i) => (
  <span key={i} className="text-amber-400 text-sm">★</span>
));

const TestimonialCard = ({ name, title, quote, imageUrl, index }) => {
  const src = imageUrl.includes('unsplash') ? imageUrl : `${imageUrl}?v=${Date.now()}`;
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      className="h-full"
    >
      <div
        className="h-full flex flex-col p-7 rounded-2xl relative overflow-hidden transition-all duration-300 hover:scale-[1.01]"
        style={{
          background: 'rgba(10, 8, 24, 0.6)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Top quote decoration */}
        <div
          className="absolute top-5 right-6 text-6xl font-serif leading-none select-none pointer-events-none"
          style={{ color: 'rgba(128,64,252,0.12)' }}
        >
          "
        </div>

        {/* Stars */}
        <div className="flex gap-0.5 mb-5">{stars()}</div>

        {/* Quote */}
        <p className="text-sm text-white/70 leading-relaxed italic flex-grow mb-6">
          "{quote}"
        </p>

        {/* Author */}
        <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <Avatar className="h-10 w-10 ring-2" style={{ '--tw-ring-color': 'rgba(128,64,252,0.3)' }}>
            <AvatarImage src={src} alt={name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              <User className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-white text-sm">{name}</p>
            <p className="text-xs" style={{ color: 'hsl(var(--teal))' }}>{title}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.15)' }} />
      <div className="absolute top-0 right-1/3 w-[500px] h-[400px] bg-purple-600/8 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
            Líderes que confiam
          </h2>
          <p className="text-base text-white/45">
            Veja o impacto real que nossa tecnologia está gerando em operações de vendas por todo o país.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} {...t} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;