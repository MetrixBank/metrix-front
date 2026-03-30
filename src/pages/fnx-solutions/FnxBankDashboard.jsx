import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Landmark, CheckCircle, Box, Percent, FilePlus } from 'lucide-react';
import FnxStatCard from './FnxStatCard';
import { formatCurrency } from '@/lib/utils';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
};

const FnxBankDashboard = ({ proposals, onNewProposalClick }) => {
    const stats = useMemo(() => {
        const totalProposals = proposals.length;
        const approvedProposals = proposals.filter(p => p.status === 'approved').length;
        const totalReleased = proposals
            .filter(p => p.status === 'approved')
            .reduce((sum, p) => sum + Number(p.total_value), 0);
        const approvalRate = totalProposals > 0 ? (approvedProposals / totalProposals) * 100 : 0;

        return {
            totalProposals,
            approvedProposals,
            totalReleased,
            approvalRate,
        };
    }, [proposals]);

    return (
        <motion.div
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FnxStatCard
                    title="Total de Propostas"
                    value={stats.totalProposals}
                    icon={Landmark}
                    custom={0}
                    variants={itemVariants}
                />
                <FnxStatCard
                    title="Aprovadas"
                    value={stats.approvedProposals}
                    icon={CheckCircle}
                    custom={1}
                    variants={itemVariants}
                />
                <FnxStatCard
                    title="Taxa de Aprovação"
                    value={`${stats.approvalRate.toFixed(0)}%`}
                    icon={Percent}
                    custom={2}
                    variants={itemVariants}
                />
                <FnxStatCard
                    title="Volume Liberado"
                    value={formatCurrency(stats.totalReleased)}
                    icon={Box}
                    custom={3}
                    variants={itemVariants}
                />
            </div>
            <motion.div variants={itemVariants}>
                <Button
                    onClick={onNewProposalClick}
                    className="w-full text-lg py-6 shiny-button"
                >
                    <FilePlus className="w-6 h-6 mr-3" />
                    Criar Nova Proposta
                </Button>
            </motion.div>
        </motion.div>
    );
};

export default FnxBankDashboard;