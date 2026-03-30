import React, { useState, useEffect } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Calendar, ShieldCheck, AlertCircle, History, ArrowUpRight, Check, Star } from 'lucide-react';
import { getStripeCustomerPortalUrl, cancelSubscriptionInStripe } from '@/lib/stripe-utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import PremiumUpgradeModal from '@/components/subscription/PremiumUpgradeModal';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import SubscriptionStatusBadge from '@/components/subscription/SubscriptionStatusBadge';

const SubscriptionPage = () => {
  const { subscription, loading, isPremium, refreshSubscription } = useSubscription();
  const { user } = useAuth();
  const [managing, setManaging] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) return;
      setLoadingPayments(true);
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (error) throw error;
        setPayments(data || []);
      } catch (err) {
        console.error("Error fetching payments:", err);
      } finally {
        setLoadingPayments(false);
      }
    };

    fetchPayments();
  }, [user]);

  const handleManage = async () => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }
    setManaging(true);
    try {
        const url = await getStripeCustomerPortalUrl();
        window.location.href = url;
    } catch (error) {
        toast({ title: "Erro", description: "Não foi possível abrir o portal de faturamento.", variant: "destructive" });
        setManaging(false);
    }
  };

  const handleCancel = async () => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }
    setManaging(true);
    try {
        await cancelSubscriptionInStripe();
        toast({ title: "Assinatura cancelada", description: "Sua assinatura não será renovada ao final do período." });
        refreshSubscription();
    } catch (error) {
        toast({ title: "Erro", description: "Falha ao cancelar assinatura.", variant: "destructive" });
    } finally {
        setManaging(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0B0E14] text-white"><Loader2 className="animate-spin w-8 h-8" /></div>;

  const formatDate = (dateStr) => dateStr ? format(new Date(dateStr), "dd 'de' MMMM, yyyy", { locale: ptBR }) : '-';
  const formatMoney = (amount) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">Minha Assinatura</h1>
              <SubscriptionStatusBadge isPremium={isPremium} expirationDate={subscription?.current_period_end} />
            </div>
            <p className="text-slate-400">Gerencie seu plano e informações de faturamento</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Active Plan Card */}
          {isPremium && subscription ? (
              <Card className="bg-[#161922] border-white/10 text-white">
                  <CardHeader>
                      <div className="flex justify-between items-start">
                          <div>
                              <CardTitle className="text-xl flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-violet-400" />
                                Plano Atual
                              </CardTitle>
                              <CardDescription className="text-slate-400 mt-1">
                                Você tem acesso total aos recursos do Metrix Premium
                              </CardDescription>
                          </div>
                          <Badge className={`${subscription.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'} text-white border-0`}>
                              {subscription.status === 'active' ? 'Ativo' : subscription.status}
                          </Badge>
                      </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-1">
                              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Plano</span>
                              <div className="flex items-center gap-2 text-lg font-medium">
                                  {subscription.plan_type === 'premium' ? 'Metrix Premium' : subscription.plan_type}
                              </div>
                              <p className="text-xs text-slate-400">R$ 49,90/mês</p>
                          </div>
                          <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-1">
                              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Ciclo Atual</span>
                              <div className="flex items-center gap-2 text-lg font-medium">
                                  <Calendar className="w-5 h-5 text-slate-400" />
                                  {subscription.cancel_at_period_end ? 'Encerra em' : 'Renova em'} {formatDate(subscription.current_period_end)}
                              </div>
                              <p className="text-xs text-slate-400">
                                {subscription.cancel_at_period_end 
                                  ? 'Acesso garantido até o fim do período' 
                                  : 'Cobrança automática no cartão cadastrado'}
                              </p>
                          </div>
                      </div>

                      {subscription.cancel_at_period_end && (
                          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg flex gap-3 items-start">
                              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                              <div>
                                  <h4 className="font-bold text-amber-500 text-sm">Cancelamento Agendado</h4>
                                  <p className="text-sm text-amber-200/80">
                                    Sua assinatura não será renovada. Você pode continuar usando os recursos Premium até {formatDate(subscription.current_period_end)}. 
                                    Para reativar, acesse o portal de faturamento.
                                  </p>
                              </div>
                          </div>
                      )}
                  </CardContent>
                  <CardFooter className="flex flex-col sm:flex-row gap-3 border-t border-white/5 pt-6">
                      <Button onClick={handleManage} disabled={managing} variant="outline" className="border-white/10 text-white hover:bg-white/5 w-full sm:w-auto">
                          {managing ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <CreditCard className="w-4 h-4 mr-2"/>}
                          Gerenciar no Stripe
                      </Button>
                      
                      {!subscription.cancel_at_period_end && (
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="ghost" className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 w-full sm:w-auto">Cancelar Assinatura</Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-[#1e2330] border-white/10 text-white">
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                      <AlertDialogDescription className="text-slate-400">
                                          Ao cancelar, você perderá acesso aos recursos Premium como Copiloto de Vendas, Metas de Equipe e Mentoria ao final do ciclo de cobrança atual.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5">Manter Assinatura</AlertDialogCancel>
                                      <AlertDialogAction onClick={handleCancel} className="bg-rose-600 hover:bg-rose-700 text-white">Confirmar Cancelamento</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                      )}
                  </CardFooter>
              </Card>
          ) : (
              // Free Plan State
              <Card className="bg-[#161922] border-white/10 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-32 bg-violet-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                  <CardHeader>
                      <CardTitle className="text-2xl">Plano Gratuito</CardTitle>
                      <CardDescription className="text-slate-400">Você está utilizando a versão básica do Metrix.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      <div className="bg-slate-800/50 rounded-xl p-8 border border-white/5 flex flex-col md:flex-row items-center gap-8">
                          <div className="flex-1 space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                              <Star className="w-5 h-5 text-amber-400 fill-current" />
                              Desbloqueie o Potencial Máximo
                            </h3>
                            <p className="text-slate-400 leading-relaxed">
                                O plano Premium oferece ferramentas avançadas de inteligência artificial para vendas, gestão de equipes ilimitada e relatórios financeiros detalhados.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                              {['Copiloto IA Ilimitado', 'Mentoria Exclusiva', 'Metas de Equipe', 'Suporte Prioritário'].map((feat, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                                  <div className="bg-emerald-500/20 p-1 rounded-full"><Check className="w-3 h-3 text-emerald-400" /></div>
                                  {feat}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="shrink-0 text-center md:text-right">
                             <div className="mb-4">
                               <span className="text-3xl font-bold text-white">R$ 49,90</span>
                               <span className="text-slate-400">/mês</span>
                             </div>
                             <Button onClick={() => setShowUpgrade(true)} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-900/20 w-full md:w-auto h-11 px-8">
                                Fazer Upgrade Agora
                             </Button>
                          </div>
                      </div>
                  </CardContent>
              </Card>
          )}

          {/* Payment History */}
          <Card className="bg-[#161922] border-white/10 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="w-5 h-5 text-slate-400" />
                Histórico de Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPayments ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin w-6 h-6 text-slate-500" /></div>
              ) : payments.length > 0 ? (
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-400">
                    <thead className="text-xs text-slate-500 uppercase bg-white/5">
                      <tr>
                        <th className="px-6 py-3 rounded-l-lg">Data</th>
                        <th className="px-6 py-3">Descrição</th>
                        <th className="px-6 py-3">Valor</th>
                        <th className="px-6 py-3 rounded-r-lg text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                            {format(new Date(payment.created_at), "dd/MM/yyyy")}
                          </td>
                          <td className="px-6 py-4">
                            {payment.transaction_data?.description || 'Assinatura Premium'}
                          </td>
                          <td className="px-6 py-4">
                            {formatMoney(payment.amount)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Badge variant="outline" className={`
                              ${payment.status === 'paid' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : ''}
                              ${payment.status === 'pending' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' : ''}
                              ${payment.status === 'failed' ? 'border-rose-500/30 text-rose-400 bg-rose-500/10' : ''}
                            `}>
                              {payment.status === 'paid' ? 'Pago' : payment.status === 'pending' ? 'Pendente' : 'Falhou'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 bg-white/5 rounded-lg border border-dashed border-white/10">
                  Nenhum histórico de pagamento encontrado.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <PremiumUpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
      </div>
    </div>
  );
};

export default SubscriptionPage;