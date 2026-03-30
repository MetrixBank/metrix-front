import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, Star, Zap, Crown, Loader2 } from 'lucide-react';
import { createCheckoutSession } from '@/lib/stripe-utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const PlanCard = ({ plan, isFeatured, onSubscribe, loading }) => {
  return (
    <motion.div
      className={`relative p-8 rounded-3xl overflow-hidden flex flex-col h-full ${
        isFeatured 
          ? 'bg-black/60 border border-primary/50 shadow-2xl shadow-primary/10' 
          : 'bg-black/20 border border-white/5 hover:border-white/10'
      } backdrop-blur-xl transition-all duration-300`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5 }}
    >
      {isFeatured && (
        <>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-primary" />
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 blur-3xl rounded-full pointer-events-none" />
        </>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
            <h3 className={`text-xl font-bold ${isFeatured ? 'text-white' : 'text-white/90'}`}>{plan.name}</h3>
            {isFeatured && (
                <span className="inline-block mt-2 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full border border-primary/20">
                    Recomendado
                </span>
            )}
            {plan.tag && !isFeatured && (
              <span className="inline-block mt-2 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">
                  {plan.tag}
              </span>
            )}
        </div>
        <div className={`p-3 rounded-2xl ${isFeatured ? 'bg-primary/20' : 'bg-white/5'}`}>
            {plan.icon || (isFeatured ? <Zap className="w-6 h-6 text-primary" /> : <Star className="w-6 h-6 text-muted-foreground" />)}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline">
            <span className="text-4xl font-bold text-white">{plan.price}</span>
            <span className="text-muted-foreground ml-2">{plan.period}</span>
        </div>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
      </div>

      <div className="flex-grow">
        <ul className="space-y-4 mb-8">
            {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
                <div className={`mt-1 mr-3 flex-shrink-0 rounded-full p-0.5 ${isFeatured ? 'bg-primary text-black' : 'bg-white/10 text-white'}`}>
                    <Check className="h-3 w-3" strokeWidth={3} />
                </div>
                <span className="text-sm text-white/80">{feature}</span>
            </li>
            ))}
        </ul>
      </div>

      <Button 
        size="lg" 
        onClick={() => onSubscribe(plan.type)}
        disabled={loading}
        data-plan-type={plan.type}
        className={`w-full mt-auto ${isFeatured ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25' : 'bg-white/10 hover:bg-white/20 text-white border-transparent'}`} 
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        {plan.cta}
      </Button>
    </motion.div>
  );
};

const PricingSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (planType) => {
    console.log(`[PricingSection] Subscribe clicked for planType: ${planType}`);
    
    if (!planType) {
        // Free plan or other logic
        navigate('/login?mode=signup');
        return;
    }

    if (!user) {
        console.warn('[PricingSection] User not logged in, redirecting to login');
        toast({
            title: "Faça Login",
            description: "Você precisa estar logado para assinar.",
        });
        navigate('/login?mode=signup');
        return;
    }

    setLoading(true);
    try {
        console.log('[PricingSection] Initiating checkout...');
        const response = await createCheckoutSession(user.id, user.email, planType);
        
        if (response?.url) {
             console.log('[PricingSection] Redirecting to:', response.url);
             window.location.href = response.url;
        } else if (response?.sessionId) {
             window.location.href = `https://checkout.stripe.com/pay/${response.sessionId}`;
        }
    } catch (error) {
        console.error('[PricingSection] Error:', error);
        let msg = "Não foi possível iniciar o checkout. Tente novamente.";
        if (error.message && (error.message.includes("No such product") || error.message.includes("No such price"))) {
            msg = "Erro de configuração do produto. Contate o suporte.";
        }
        toast({
            title: "Erro no Pagamento",
            description: msg,
            variant: "destructive"
        });
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
      name: 'Premium Mensal',
      description: 'Potência máxima para líderes que buscam escala.',
      price: 'R$ 199',
      period: '/mês',
      cta: 'Assinar Mensal',
      type: 'monthly',
      features: [
        'Tudo do plano Consultor',
        'Gestão ilimitada de equipe',
        'Visão completa do funil do time',
        'Rankings e Gamificação',
        'IA Assistant avançado',
        'Relatórios financeiros detalhados',
      ],
    },
    {
      name: 'Premium Anual',
      description: 'O melhor custo-benefício com 2 meses grátis.',
      price: 'R$ 1.990',
      period: '/ano',
      cta: 'Assinar Anual',
      type: 'annual',
      tag: 'Economize 15%',
      icon: <Crown className="w-6 h-6 text-emerald-400" />,
      features: [
        'Todos os benefícios Premium',
        '2 meses grátis',
        'Prioridade máxima no suporte',
        'Mentoria exclusiva trimestral',
        'Acesso antecipado a novos recursos',
      ],
      isFeatured: true
    },
  ];

  return (
    <section id="pricing" className="py-24 sm:py-32 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/10 blur-[150px] rounded-full pointer-events-none" />
        
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Planos flexíveis para <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">sua jornada</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Escale sua operação com ferramentas profissionais, do iniciante ao líder de grandes equipes.
          </p>
        </motion.div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          <PlanCard plan={plans[0]} onSubscribe={handleSubscribe} loading={false} />
          <PlanCard plan={plans[1]} onSubscribe={handleSubscribe} loading={loading} />
          <PlanCard plan={plans[2]} onSubscribe={handleSubscribe} isFeatured loading={loading} />
        </div>
      </div>
    </section>
  );
};

export default PricingSection;