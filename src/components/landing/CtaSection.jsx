import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

const CtaSection = () => {
  return (
    <section id="cta" className="py-24 sm:py-32 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="relative rounded-3xl p-8 md:p-20 text-center overflow-hidden border border-white/10 bg-black/40 backdrop-blur-xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7 }}
        >
          {/* Inner Glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center p-2 bg-white/5 rounded-full mb-8 border border-white/5 backdrop-blur-sm">
                <Sparkles className="w-5 h-5 text-yellow-400 mr-2" />
                <span className="text-sm font-medium text-white">Junte-se à elite das vendas</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
              Pronto para transformar seus <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">resultados hoje?</span>
            </h2>
            
            <p className="mt-4 text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Não deixe sua equipe esperando. Comece gratuitamente e veja a diferença na primeira semana de uso.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="h-14 px-8 text-lg bg-white text-black hover:bg-white/90 shadow-xl shadow-white/10" asChild>
                <Link to="/login?mode=signup">
                  Criar Conta Gratuita
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            
            <p className="mt-8 text-sm text-muted-foreground/60">
                Não requer cartão de crédito • Setup em 2 minutos
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CtaSection;