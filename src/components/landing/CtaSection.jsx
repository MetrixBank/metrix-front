import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const CtaSection = () => {
  return (
    <section id="cta" className="py-24 sm:py-32 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="relative rounded-3xl p-10 md:p-20 text-center overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7 }}
          style={{
            background: 'linear-gradient(140deg, rgba(10,8,24,0.97) 0%, rgba(7,27,26,0.97) 100%)',
            border: '1px solid rgba(17,222,180,0.18)',
            boxShadow: '0 0 120px rgba(17,222,180,0.06), inset 0 0 80px rgba(17,222,180,0.04)',
            backdropFilter: 'blur(24px)',
          }}
        >
          {/* Glow layers */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(17,222,180,0.5), transparent)' }}
          />
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(17,222,180,0.10) 0%, transparent 70%)' }}
          />
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'rgba(128,64,252,0.12)', filter: 'blur(80px)' }}
          />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-5 leading-tight">
              Pronto para transformar seus resultados hoje?
            </h2>

            <p className="text-base md:text-lg text-white/50 mb-10 max-w-xl mx-auto">
              Junte-se à comunidade MetriX e comece a crescendo de forma previsível e escalável.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button
                size="lg"
                className="h-12 px-8 text-sm font-semibold text-black hover:scale-[1.03] transition-all shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #11DEB4, #0ccfa2)',
                  boxShadow: '0 0 36px rgba(17,222,180,0.35)',
                }}
                asChild
              >
                <Link to="/login?mode=signup">
                  Criar Conta Gratuita
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <p className="mt-7 text-xs text-white/25">
              Não requer cartão de crédito · Setup em 2 minutos
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CtaSection;