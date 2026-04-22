import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const VslSection = () => {
  return (
    <section className="py-20 sm:py-28 relative overflow-hidden">
      <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/8 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute right-0 top-1/4 w-[400px] h-[400px] bg-[hsl(var(--teal))]/6 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-medium text-white/70 mb-6 backdrop-blur-sm gap-2">
              <Play className="w-3 h-3 fill-white" />
              Demonstração em Vídeo
            </div>

            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
              Transforme sua gestão em{' '}
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, hsl(var(--primary)), #a78bfa)' }}
              >
                2 minutos
              </span>
            </h2>

            <p className="text-base text-white/50 mb-8 leading-relaxed">
              Pare de perder tempo com planilhas desatualizadas. Descubra como a MetriX centraliza sua operação, automatiza o follow-up e entrega a visibilidade que você sempre sonhou.
            </p>

            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 h-12 px-7 font-semibold"
              asChild
            >
              <Link to="/login?mode=signup">
                Testar Gratuitamente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          {/* Video Container */}
          <motion.div
            className="relative mx-auto lg:mx-0 w-full max-w-[360px]"
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7 }}
          >
            {/* Glow behind video */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary to-purple-600 blur-2xl opacity-25 scale-105 rounded-3xl pointer-events-none" />

            {/* Video frame */}
            <div
              className="relative rounded-2xl overflow-hidden shadow-2xl"
              style={{
                border: '1px solid rgba(128,64,252,0.35)',
                aspectRatio: '9/16',
              }}
            >
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src="https://www.youtube.com/embed/FJFlYX__4hg?rel=0&modestbranding=1"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Apresentação Plataforma MetriX"
              />
            </div>

            {/* Floating badge */}
            <div
              className="absolute -bottom-5 -right-5 p-3.5 rounded-2xl shadow-xl hidden sm:block"
              style={{
                background: 'rgba(10,8,24,0.92)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Resultado Médio</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>+32% em Vendas</p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default VslSection;