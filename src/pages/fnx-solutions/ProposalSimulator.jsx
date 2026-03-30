import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { formatCurrency } from '@/lib/utils';
import { Calculator, Info, Landmark, User, ChevronsRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProposalSimulator = () => {
    const [proposalValue, setProposalValue] = useState(3000);
    const [installments, setInstallments] = useState(12);

    const simulation = useMemo(() => {
        const MONTHLY_INTEREST_RATE = 0.048;
        const IOF_RATE = 0.02;
        const BOLETO_FEE = 2.99;

        const productCost = proposalValue / 2;
        const distributorProfit = proposalValue / 2;
        
        const totalIof = proposalValue * IOF_RATE;
        const totalBoletoFees = installments * BOLETO_FEE;
        
        const financingValueForClient = proposalValue + totalIof + totalBoletoFees;
        
        const monthlyInstallment = financingValueForClient > 0 && installments > 0
            ? (financingValueForClient * (MONTHLY_INTEREST_RATE * Math.pow(1 + MONTHLY_INTEREST_RATE, installments))) / (Math.pow(1 + MONTHLY_INTEREST_RATE, installments) - 1)
            : 0;

        const installmentsToCoverCost = monthlyInstallment > 0 ? Math.ceil(productCost / monthlyInstallment) : 0;
        const remainingInstallments = installments - installmentsToCoverCost;
        const profitPerRemainingInstallment = remainingInstallments > 0 ? distributorProfit / remainingInstallments : 0;
        
        return {
            productCost,
            distributorProfit,
            totalFinancing: financingValueForClient,
            monthlyInstallment,
            installmentsToCoverCost,
            remainingInstallments,
            profitPerRemainingInstallment,
            boletoFee: BOLETO_FEE,
        };
    }, [proposalValue, installments]);

    const ResultItem = ({ icon: Icon, label, value, color, description, isFinal = false }) => (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex items-start gap-4 p-3 rounded-lg ${isFinal ? 'bg-blue-500/10' : 'bg-background/30'}`}
        >
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isFinal ? 'bg-blue-500/20' : 'bg-primary/10'}`}>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
                <p className="font-semibold text-muted-foreground text-sm">{label}</p>
                <p className={`font-bold text-lg ${color}`}>{value}</p>
                {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            </div>
        </motion.div>
    );

    return (
        <Card className="bg-gradient-to-b from-card/80 to-card/60 border-border/20 flex flex-col backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <Calculator className="text-primary" />
                    Simulador de Crédito Inteligente
                </CardTitle>
                <CardDescription>Entenda o fluxo de recebimento da FnX.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-grow flex flex-col">
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="proposalValue" className="flex justify-between text-sm mb-1">
                            <span>Valor da Proposta</span>
                            <span className="font-bold text-primary">{formatCurrency(proposalValue)}</span>
                        </Label>
                        <Slider
                            id="proposalValue"
                            min={500}
                            max={20000}
                            step={100}
                            value={[proposalValue]}
                            onValueChange={(value) => setProposalValue(value[0])}
                        />
                    </div>
                    <div>
                         <Label htmlFor="installments" className="flex justify-between text-sm mb-1">
                            <span>Nº de Parcelas</span>
                             <span className="font-bold text-primary">{installments}x</span>
                        </Label>
                        <Slider
                            id="installments"
                            min={1}
                            max={15}
                            step={1}
                            value={[installments]}
                            onValueChange={(value) => setInstallments(value[0])}
                        />
                    </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border/30 flex-grow">
                     <AnimatePresence mode="wait">
                        <motion.div key={installments + proposalValue} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                            <ResultItem
                                icon={Info}
                                label="Parcela para o Cliente Final"
                                value={formatCurrency(simulation.monthlyInstallment)}
                                color="text-blue-400"
                                description={`Inclui juros (4.8% a.m), IOF (2%) e taxa de boleto (R$ ${simulation.boletoFee.toFixed(2)}).`}
                                isFinal={true}
                            />
                             <div className="flex justify-center my-2">
                                <ChevronsRight className="w-5 h-5 text-primary/50 animate-pulse" />
                            </div>
                             <div className="space-y-3">
                                <ResultItem
                                    icon={Landmark}
                                    label="Cobertura do Custo"
                                    value={`${simulation.installmentsToCoverCost} parcela${simulation.installmentsToCoverCost > 1 ? 's' : ''}`}
                                    color="text-amber-400"
                                    description={`As primeiras parcelas pagas pelo cliente quitam os ${formatCurrency(simulation.productCost)} de custo.`}
                                />
                                <ResultItem
                                    icon={User}
                                    label="Recebimento do seu Lucro"
                                    value={formatCurrency(simulation.profitPerRemainingInstallment)}
                                    color="text-green-400"
                                    description={`Seu lucro de ${formatCurrency(simulation.distributorProfit)} será diluído nas ${simulation.remainingInstallments} parcelas restantes.`}
                                />
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProposalSimulator;