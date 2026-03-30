import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap } from 'lucide-react';
import PlatformVisual from './PlatformVisual';

const HeroSection = () => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Decorative glow behind hero text */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-sm font-medium text-primary mb-8 backdrop-blur-sm shadow-lg shadow-primary/5"
            >
              <Zap className="w-4 h-4 mr-2 text-yellow-400 fill-yellow-400" />
              <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                A revolução na gestão de equipes de vendas
              </span>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-8 leading-tight drop-shadow-2xl">
              Lidere sua Equipe. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-emerald-400 animate-gradient-x">
                Domine o Mercado.
              </span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
              A MetriX é a ferramenta definitiva para líderes que desejam controle total sobre as vendas, metas e desempenho. 
              <span className="text-white/80 font-medium"> Tudo em um só lugar.</span>
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-4"
          >
            <Button 
              size="lg" 
              className="w-full sm:w-auto h-12 px-8 text-base bg-white text-black hover:bg-white/90 shadow-[0_0_30px_-10px_rgba(255,255,255,0.3)] transition-all hover:scale-105" 
              asChild
            >
              <Link to="/login?mode=signup">
                Cadastre-se Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full sm:w-auto h-12 px-8 text-base border-white/10 bg-white/5 text-white hover:bg-white/10 backdrop-blur-sm transition-all hover:border-white/20"
              asChild
            >
              <a href="#pricing">
                Ver Planos Premium
              </a>
            </Button>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 40, rotateX: 20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1, delay: 0.6, type: "spring", stiffness: 50 }}
          className="mt-20 lg:mt-28 perspective-1000"
        >
          <div className="relative rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden transform-gpu group">
             <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-emerald-500/10 opacity-50 group-hover:opacity-70 transition-opacity duration-700" />
             <PlatformVisual />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;