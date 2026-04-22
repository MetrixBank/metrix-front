import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, Zap, Crown, Loader2, Star } from 'lucide-react';
import { createCheckoutSession } from '@/lib/stripe-utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const PlanCard = ({ plan, isFeatured, onSubscribe, loading }) => {
  return (
    <motion.div
      className={`relative flex flex-col h-full overflow-hidden rounded-3xl transition-all duration-300 ${
        isFeatured
          ? 'scale-[1.04] z-10'
          : 'hover:scale-[1.01]'
      }`}
      style={
        isFeatured
          ? {
              background: 'linear-gradient(145deg, rgba(128,64,252,0.20) 0%, rgba(22,16,46,0.95) 60%)',
              border: '1px solid rgba(128,64,252,0.55)',
              boxShadow: '0 0 60px rgba(128,64,252,0.18), 0 24px 48px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(20px)',
            }
          : {
              background: 'rgba(10,8,24,0.5)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(12px)',
            }
      }
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5 }}
    >
      {/* Top accent bar */}
      {isFeatured && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), #a78bfa, hsl(var(--primary)))' }}
        />
      )}

      <div className="flex flex-col h-full p-7">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className={`text-lg font-bold mb-1 ${isFeatured ? 'text-white' : 'text-white/85'}`}>
              {plan.name}
            </h3>
            {isFeatured && (
              <span
                className="inline-block text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full"
                style={{
                  background: 'rgba(128,64,252,0.25)',
                  border: '1px solid rgba(128,64,252,0.5)',
                  color: '#c4b5fd',
                }}
              >
                Recomendado
              </span>
            )}
            {plan.tag && !isFeatured && (
              <span className="inline-block text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                {plan.tag}
              </span>
            )}
          </div>
          <div
            className="p-2.5 rounded-xl"
            style={isFeatured ? { background: 'rgba(128,64,252,0.2)' } : { background: 'rgba(255,255,255,0.05)' }}
          >
            {plan.icon ?? (isFeatured ? <Zap className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} /> : <Star className="w-5 h-5 text-white/30" />)}
          </div>
        </div>

        {/* Price */}
        <div className="mb-5">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-white">{plan.price}</span>
            <span className="text-sm text-white/40">{plan.period}</span>
          </div>
          <p className="mt-3 text-sm text-white/45 leading-relaxed">{plan.description}</p>
        </div>

        {/* Features */}
        <ul className="flex-grow space-y-3 mb-7">
          {plan.features.map((feat, i) => (
            <li key={i} className="flex items-start gap-3">
              <div
                className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                style={
                  isFeatured
                    ? { background: 'hsl(var(--primary))', color: '#fff' }
                    : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }
                }
              >
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              </div>
              <span className="text-sm text-white/70">{feat}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Button
          size="lg"
          onClick={() => onSubscribe(plan.type)}
          disabled={loading}
          data-plan-type={plan.type}
          className={`w-full mt-auto font-semibold transition-all ${
            isFeatured
              ? 'text-white shadow-lg shadow-primary/25 hover:scale-[1.02]'
              : 'bg-white/8 hover:bg-white/14 text-white border-0'
          }`}
          style={isFeatured ? { background: 'hsl(var(--primary))', } : {}}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {plan.cta}
        </Button>
      </div>
    </motion.div>
  );
};

const PricingSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (planType) => {
    if (!planType) { navigate('/login?mode=signup'); return; }
    if (!user) {
      toast({ title: 'Faça Login', description: 'Você precisa estar logado para assinar.' });
      navigate('/login?mode=signup');
      return;
    }
    setLoading(true);
    try {
      const response = await createCheckoutSession(user.id, user.email, planType);
      if (response?.url) window.location.href = response.url;
      else if (response?.sessionId)
        window.location.href = `https://checkout.stripe.com/pay/${response.sessionId}`;
    } catch (error) {
      let msg = 'Não foi possível iniciar o checkout. Tente novamente.';
      if (error.message?.includes('No such product') || error.message?.includes('No such price'))
        msg = 'Erro de configuração do produto. Contate o suporte.';
      toast({ title: 'Erro no Pagamento', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      name: 'Consultor',
      description: 'Ideal para quem está começando e busca organização profissional.',
      price: 'Grátis',
      period: 'para sempre',
      cta: 'Começar Agora',
      type: null,
      features: [
        'Funil de vendas pessoal',
        'Gestão de clientes ilimitada',
        'Controle de estoque básico',
        'Metas pessoais',
        'App Mobile',
      ],
    },
    {
      name: 'Premium Anual',
      description: 'O melhor custo-benefício para líderes que buscam escala.',
      price: 'R$ 1.990',
      period: '/ano',
      cta: 'Assinar Agora',
      type: 'annual',
      icon: <Crown className="w-5 h-5 text-purple-400" />,
      features: [
        '7 ms de latência garantida',
        'IA Editorial Completa',
        'Multi-Equipes ilimitado',
        'Sync Global em tempo real',
        '5 serviços adicionais',
      ],
      isFeatured: true,
    },
    {
      name: 'Premium Mensal',
      description: 'Potência máxima para líderes que buscam escala.',
      price: 'R$ 199',
      period: '/mês',
      cta: 'Assinar Mensal',
      type: 'monthly',
      tag: '+ Flexível',
      features: [
        'Tudo do plano Consultor',
        'Gestão ilimitada de equipe',
        'Visão completa do funil do time',
        'Rankings e Gamificação',
        'IA Assistant avançado',
        'Relatórios financeiros detalhados',
      ],
    },
  ];

  return (
    <section id="pricing" className="py-24 sm:py-32 relative overflow-hidden">
      {/* Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-600/8 blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
            Planos{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, hsl(var(--primary)), #a78bfa)' }}
            >
              Flexíveis
            </span>
          </h2>
          <p className="text-base text-white/50">
            Encontre o plano ideal para começar hoje mesmo.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
          <PlanCard plan={plans[0]} onSubscribe={handleSubscribe} loading={false} />
          <PlanCard plan={plans[1]} onSubscribe={handleSubscribe} isFeatured loading={loading} />
          <PlanCard plan={plans[2]} onSubscribe={handleSubscribe} loading={loading} />
        </div>
      </div>
    </section>
  );
};

export default PricingSection;