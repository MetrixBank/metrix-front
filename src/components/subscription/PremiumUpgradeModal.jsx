import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Sparkles, Star, AlertCircle, RefreshCw, BadgePercent } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { createCheckoutSession, STRIPE_PRICE_MONTHLY, STRIPE_PRICE_ANNUAL } from '@/lib/stripe-utils';
import { toast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const PremiumUpgradeModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  const handleSubscribe = async () => {
    console.log(`[PremiumUpgradeModal] Subscribe initiated. Plan: ${selectedPlan}`);

    if (!user) {
      toast({
        title: "Autenticação Necessária",
        description: "Por favor, faça login para assinar o plano Premium.",
        variant: "destructive"
      });
      return;
    }

    // Validate configuration before request
    const priceId = selectedPlan === 'annual' ? STRIPE_PRICE_ANNUAL : STRIPE_PRICE_MONTHLY;
    if (!priceId) {
        setError("Erro interno: ID do plano não configurado.");
        return;
    }

    setLoading(true);
    setError(null);

    try {
        // Explicitly pass 'monthly' or 'annual' based on selection
        const response = await createCheckoutSession(user.id, user.email, selectedPlan);
        
        if (response?.url) {
             console.log(`[PremiumUpgradeModal] Redirecting to: ${response.url}`);
             window.location.href = response.url;
        } else if (response?.sessionId) {
             // Fallback if URL missing but ID present (should handle via Stripe.js, but redirect URL preferred)
             throw new Error("URL de redirecionamento não recebida.");
        } else {
            throw new Error("Resposta inválida do servidor de pagamento.");
        }
    } catch (err) {
        console.error("[PremiumUpgradeModal] Error:", err);
        
        let errorMessage = "Ocorreu um erro ao processar seu pedido.";
        if (err.message) {
             if (err.message.includes("No such product") || err.message.includes("No such price")) {
                 errorMessage = "Erro de configuração do produto no Stripe. Contate o suporte.";
             } else {
                 errorMessage = err.message;
             }
        }

        setError(errorMessage);
        toast({
            title: "Falha no Pagamento",
            description: errorMessage,
            variant: "destructive"
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && onClose(open)}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-slate-900 to-slate-950 border-violet-500/20 text-white">
        <DialogHeader>
          <div className="mx-auto bg-violet-500/10 p-3 rounded-full mb-4 ring-1 ring-violet-500/30">
            <Sparkles className="w-8 h-8 text-violet-400" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-200 to-indigo-200">
             Upgrade para Premium
          </DialogTitle>
          <DialogDescription className="text-center text-slate-400">
            Acelere suas vendas com inteligência artificial e recursos exclusivos
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
            {error && (
                <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="monthly" value={selectedPlan} onValueChange={setSelectedPlan} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 p-1">
                <TabsTrigger value="monthly" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
                    Mensal
                </TabsTrigger>
                <TabsTrigger value="annual" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white relative">
                    Anual
                    <span className="absolute -top-2 -right-2 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                    </span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-3 mt-4">
                {[
                    "Copiloto de Vendas com IA Avançada",
                    "Gestão de Metas de Equipe",
                    "Programa de Mentoria Exclusivo",
                    "Relatórios Financeiros Detalhados",
                    "Suporte Prioritário VIP"
                ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="bg-emerald-500/10 p-1 rounded-full shrink-0">
                            <Check className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="text-sm font-medium text-slate-200">{benefit}</span>
                    </div>
                ))}
            </div>

            <div className="mt-6 p-5 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/5 border border-violet-500/20 text-center transition-all relative overflow-hidden">
                {selectedPlan === 'annual' && (
                    <div className="absolute top-0 right-0">
                         <Badge className="rounded-bl-xl rounded-tr-none bg-emerald-500 hover:bg-emerald-600 text-white border-0 px-3 py-1 flex items-center gap-1">
                            <BadgePercent className="w-3 h-3" /> -15% OFF
                         </Badge>
                    </div>
                )}
                
                <p className="text-sm text-slate-400 mb-2 uppercase tracking-wide font-semibold">
                  {selectedPlan === 'monthly' ? 'Plano Mensal' : 'Plano Anual'}
                </p>
                <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-extrabold text-white tracking-tight">
                      {selectedPlan === 'monthly' ? 'R$ 49,90' : 'R$ 499,00'}
                    </span>
                    <span className="text-base text-slate-500 font-medium">
                      {selectedPlan === 'monthly' ? '/mês' : '/ano'}
                    </span>
                </div>
                {selectedPlan === 'annual' && (
                  <p className="text-xs text-emerald-400 mt-2 font-medium bg-emerald-500/10 inline-block px-3 py-1 rounded-full border border-emerald-500/20">
                      Economize R$ 99,80 por ano!
                  </p>
                )}
            </div>
        </div>

        <DialogFooter className="flex-col gap-3 sm:gap-0 mt-2">
          <Button 
            onClick={handleSubscribe} 
            disabled={loading}
            className={`w-full font-bold h-12 text-base shadow-xl transition-all hover:scale-[1.02] ${
              selectedPlan === 'annual' 
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/20'
              : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-violet-900/20'
            }`}
          >
            {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : error ? (
                <RefreshCw className="w-5 h-5 mr-2" />
            ) : (
                <Star className="w-5 h-5 mr-2 fill-white/20" />
            )}
            {loading ? "Processando..." : error ? "Tentar Novamente" : `Assinar ${selectedPlan === 'monthly' ? 'Mensal' : 'Anual'}`}
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => onClose(false)} 
            disabled={loading} 
            className="w-full text-slate-400 hover:text-white hover:bg-white/5 mt-2"
          >
            Agora não
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumUpgradeModal;