import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const VslSection = () => {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Text Content */}
          <motion.div
            className="text-center lg:text-left"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-medium text-white mb-6 backdrop-blur-sm">
                <Play className="w-3 h-3 mr-2 fill-white" />
                Demonstração em Vídeo
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
              Transforme sua gestão em <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">2 minutos</span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Pare de perder tempo com planilhas desatualizadas. Descubra como a MetriX centraliza sua operação, automatiza o follow-up e entrega a visibilidade que você sempre sonhou.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                 <Button size="lg" className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20" asChild>
                    <Link to="/login?mode=signup">
                    Testar Gratuitamente
                    <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
            </div>
          </motion.div>
          
          {/* Video Container */}
          <motion.div
            className="relative mx-auto lg:mx-0 w-full max-w-[400px]" 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7 }}
          >
            {/* Glow Effect behind video */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary to-purple-600 blur-2xl opacity-30 transform scale-105 rounded-2xl" />
            
            <div className="relative rounded-2xl border border-white/10 bg-black/80 shadow-2xl overflow-hidden aspect-[9/16]">
                 <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src="https://www.youtube.com/embed/FJFlYX__4hg"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Apresentação Plataforma GSP"
                ></iframe>
            </div>
            
            {/* Floating decorative badge */}
            <div className="absolute -bottom-6 -right-6 bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-xl hidden sm:block">
                <p className="text-xs text-muted-foreground mb-1">Resultado Médio</p>
                <p className="text-xl font-bold text-white">+32% em Vendas</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default VslSection;