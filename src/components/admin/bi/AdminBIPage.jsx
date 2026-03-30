import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';

const OpportunityCharts = React.lazy(() => import('@/components/admin/overview/OpportunityCharts'));
const OpportunityStats = React.lazy(() => import('@/components/admin/overview/OpportunityStats'));
const PlatformCharts = React.lazy(() => import('@/components/admin/overview/PlatformCharts'));
const TeamStockSummary = React.lazy(() => import('@/components/admin/overview/TeamStockSummary'));
const DistributorGoalsProgress = React.lazy(() => import('@/components/admin/overview/DistributorGoalsProgress'));

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const Section = ({ title, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-card p-4 sm:p-6 rounded-2xl shadow-lg border border-border/20"
  >
    <h2 className="text-xl sm:text-2xl font-bold mb-4 text-foreground">{title}</h2>
    {children}
  </motion.div>
);

const AdminBIPage = () => {
  const [data, setData] = useState({ opportunities: [], products: [], distributors: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: opportunities, error: oppError } = await supabase
          .from('sales_opportunities')
          .select('*, opportunity_products(*, products(*)), profiles!distributor_id(*)');

        if (oppError) throw oppError;

        const { data: products, error: prodError } = await supabase
          .from('products')
          .select('*');

        if (prodError) throw prodError;
        
        const { data: distributors, error: distError } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'distributor');
        
        if(distError) throw distError;

        setData({ opportunities: opportunities || [], products: products || [], distributors: distributors || [] });
      } catch (error) {
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível buscar os dados de BI. Tente novamente.",
          variant: "destructive",
        });
        console.error("BI data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <Helmet>
        <title>BI e Análises | Plataforma MCX</title>
        <meta name="description" content="Análise aprofundada de dados da plataforma." />
      </Helmet>
      <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-background to-background/90 text-foreground overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Business Intelligence</h1>
            <p className="text-muted-foreground mt-1">Análise de dados para decisões estratégicas.</p>
        </motion.div>
        
        <Tabs defaultValue="overview" className="mt-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="sales">Vendas</TabsTrigger>
                <TabsTrigger value="stock">Estoque</TabsTrigger>
                <TabsTrigger value="goals">Metas</TabsTrigger>
            </TabsList>
            
            <AnimatePresence mode="wait">
              {loading ? (
                  <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <LoadingSpinner />
                  </motion.div>
                ) : (
                <>
                  <TabsContent value="overview">
                    <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 mt-4">
                      <Section title="Estatísticas Gerais">
                        <Suspense fallback={<LoadingSpinner />}>
                            <OpportunityStats opportunities={data.opportunities} />
                        </Suspense>
                      </Section>
                      <Section title="Análise de Plataforma">
                        <Suspense fallback={<LoadingSpinner />}>
                            <PlatformCharts opportunities={data.opportunities} distributors={data.distributors} />
                        </Suspense>
                      </Section>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="sales">
                    <motion.div key="sales" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 mt-4">
                      <Section title="Análise de Oportunidades">
                          <Suspense fallback={<LoadingSpinner />}>
                            <OpportunityCharts opportunities={data.opportunities} />
                          </Suspense>
                      </Section>
                    </motion.div>
                  </TabsContent>
                  
                  <TabsContent value="stock">
                    <motion.div key="stock" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 mt-4">
                      <Section title="Resumo de Estoque da Equipe">
                        <Suspense fallback={<LoadingSpinner />}>
                            <TeamStockSummary distributors={data.distributors} products={data.products} />
                        </Suspense>
                      </Section>
                    </motion.div>
                  </TabsContent>
                  
                  <TabsContent value="goals">
                    <motion.div key="goals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 mt-4">
                      <Section title="Acompanhamento de Metas dos Distribuidores">
                        <Suspense fallback={<LoadingSpinner />}>
                            <DistributorGoalsProgress opportunities={data.opportunities} distributors={data.distributors}/>
                        </Suspense>
                      </Section>
                    </motion.div>
                  </TabsContent>
                </>
              )}
            </AnimatePresence>
        </Tabs>
      </div>
    </>
  );
};

export default AdminBIPage;