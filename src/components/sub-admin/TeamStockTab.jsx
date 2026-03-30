import React from 'react';
    import { motion } from 'framer-motion';
    import { Loader2, Package } from 'lucide-react';
    import TeamStockSummary from '../admin/overview/TeamStockSummary';
    import DistributorStockList from '../admin/overview/DistributorStockList';

    const TeamStockTab = ({ teamData, loading, error }) => {
        if (loading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            );
        }

        if (error) {
            return <div className="text-center text-red-500 py-10">Ocorreu um erro ao carregar o estoque da equipe.</div>;
        }

        if (!teamData || !teamData.products || teamData.products.length === 0) {
          return (
              <div className="text-center py-16 bg-card/30 rounded-lg">
                  <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-semibold text-foreground">Nenhum produto encontrado</p>
                  <p className="text-muted-foreground">O estoque da sua equipe está vazio.</p>
              </div>
          )
        }

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <TeamStockSummary products={teamData.products} distributors={teamData.distributors} title="Resumo do Estoque da Equipe"/>
                <DistributorStockList products={teamData.products} distributors={teamData.distributors} />
            </motion.div>
        );
    };

    export default TeamStockTab;