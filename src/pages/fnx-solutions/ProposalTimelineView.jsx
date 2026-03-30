import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, CheckCircle, AlertCircle, Edit, Download, Copy, Sparkles, Mail, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatDateTime, calculateInstallmentDetails } from '@/lib/utils';
import { statusConfigs } from './statusConfigs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Helmet } from 'react-helmet-async';

const TimelineItem = ({ icon, title, description, timestamp, isLast = false }) => {
    return (
        <div className="flex gap-4">
            <div className="flex flex-col items-center">
                <div className="bg-primary/20 text-primary rounded-full p-2">
                    {icon}
                </div>
                {!isLast && <div className="w-px flex-grow bg-border my-2"></div>}
            </div>
            <div className="pb-8">
                <p className="font-semibold text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
                {timestamp && <p className="text-xs text-muted-foreground/70 mt-1">{formatDateTime(timestamp)}</p>}
            </div>
        </div>
    );
};

const ProposalTimelineView = ({ proposal, onBack, onEdit }) => {
    const { toast } = useToast();
    const [showResendDialog, setShowResendDialog] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const currentStatusConfig = useMemo(() => {
        return statusConfigs[proposal.status] || statusConfigs.default;
    }, [proposal.status]);

    // Recalculate details with correct fees/interest for display
    const financialDetails = useMemo(() => {
        return calculateInstallmentDetails(
            proposal.total_value, 
            proposal.upfront_payment, 
            proposal.installments
        );
    }, [proposal.total_value, proposal.upfront_payment, proposal.installments]);

    const timelineEvents = useMemo(() => {
        let events = [
            {
                status: 'pending',
                icon: FileText,
                title: 'Proposta Criada',
                description: 'A proposta foi registrada no sistema.',
                timestamp: proposal.created_at,
            },
        ];

        if (proposal.edit_history && Array.isArray(proposal.edit_history)) {
            proposal.edit_history.forEach(entry => {
                events.push({
                    status: 'edited',
                    icon: Edit,
                    title: `Proposta Atualizada por ${entry.admin_name || 'Admin'}`,
                    description: entry.change_description,
                    timestamp: entry.timestamp,
                });
            });
        }
        
        const relevantStatuses = ['awaiting_signature', 'approved', 'rejected', 'awaiting_adjustment'];
        if (relevantStatuses.includes(proposal.status)) {
             const statusEventConfig = statusConfigs[proposal.status];
             if (statusEventConfig) {
                 events.push({
                    status: proposal.status,
                    icon: statusEventConfig.icon,
                    title: statusEventConfig.timelineTitle || statusEventConfig.title,
                    description: statusEventConfig.timelineDescription || statusEventConfig.description,
                    timestamp: proposal.updated_at,
                 });
             }
        }

        return events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    }, [proposal]);

    const handleResendEmail = async () => {
        setIsResending(true);
        toast({ title: "🚧 Recurso em implementação", description: "A funcionalidade de reenviar e-mail ainda não está disponível." });
        setIsResending(false);
        setShowResendDialog(false);
    };
    
    const handleCopyLink = () => {
        if (!proposal.signature_token) {
            toast({ title: "Link não disponível", description: "O link de assinatura ainda não foi gerado para esta proposta.", variant: "destructive" });
            return;
        }
        const signatureLink = `${window.location.origin}/sign/${proposal.signature_token}`;
        navigator.clipboard.writeText(signatureLink);
        toast({
            title: "Link Copiado!",
            description: "O link de assinatura foi copiado para a área de transferência.",
        });
    };
    
    const handleDownloadContract = () => {
        toast({ title: "🚧 Recurso em implementação", description: "O download do contrato ainda não está disponível." });
    };

    return (
        <>
            <Helmet>
                <title>Timeline da Proposta - FnX Solutions</title>
                <meta name="description" content={`Acompanhe o status e histórico da proposta para ${proposal.customer_name}.`} />
            </Helmet>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="mb-4">
                    <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Voltar ao Painel
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status Header */}
                        <div className={`p-6 rounded-lg border ${currentStatusConfig.borderColor} ${currentStatusConfig.bgColor} flex items-start gap-4`}>
                            <div className={`text-2xl ${currentStatusConfig.textColor}`}>
                                {React.createElement(currentStatusConfig.icon, { className: 'w-8 h-8' })}
                            </div>
                            <div>
                                <h2 className={`text-2xl font-bold ${currentStatusConfig.textColor}`}>{currentStatusConfig.title}</h2>
                                <p className={`mt-1 ${currentStatusConfig.textColor}/80`}>{currentStatusConfig.description}</p>
                                {proposal.status === 'awaiting_adjustment' && proposal.admin_notes && (
                                    <div className="mt-3 p-3 bg-background/50 rounded-md border border-border">
                                        <p className="font-semibold text-sm text-foreground">Notas do Administrador:</p>
                                        <p className="text-sm text-muted-foreground">{proposal.admin_notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">Histórico da Proposta</h3>
                            <div>
                                {timelineEvents.map((event, index) => (
                                    <TimelineItem
                                        key={index}
                                        icon={React.createElement(event.icon, { className: 'w-5 h-5' })}
                                        title={event.title}
                                        description={event.description}
                                        timestamp={event.timestamp}
                                        isLast={index === timelineEvents.length - 1}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Actions */}
                        <div className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">Ações Rápidas</h3>
                            <div className="space-y-3">
                                {proposal.status === 'awaiting_signature' && (
                                    <>
                                        <Button className="w-full" onClick={() => setShowResendDialog(true)}>
                                            <Mail className="w-4 h-4 mr-2" /> Reenviar E-mail
                                        </Button>
                                        <Button variant="secondary" className="w-full" onClick={handleCopyLink}>
                                            <Copy className="w-4 h-4 mr-2" /> Copiar Link de Assinatura
                                        </Button>
                                    </>
                                )}
                                {proposal.status === 'approved' && (
                                    <Button className="w-full" onClick={handleDownloadContract}>
                                        <Download className="w-4 h-4 mr-2" /> Baixar Contrato Assinado
                                    </Button>
                                )}
                                {proposal.status === 'awaiting_adjustment' && (
                                    <Button className="w-full shiny-button" onClick={() => onEdit(proposal)}>
                                        <Sparkles className="w-4 h-4 mr-2" /> Fazer Ajustes na Proposta
                                    </Button>
                                )}
                                 <Button variant="outline" className="w-full" onClick={() => onEdit(proposal)}>
                                    <FileText className="w-4 h-4 mr-2" /> Ver/Editar Detalhes
                                </Button>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">Detalhes Financeiros</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Cliente:</span>
                                    <span className="font-medium text-foreground text-right">{proposal.customer_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Valor dos Produtos:</span>
                                    <span className="font-medium text-foreground">{formatCurrency(proposal.total_value)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Entrada:</span>
                                    <span className="font-medium text-foreground">{formatCurrency(proposal.upfront_payment)}</span>
                                </div>
                                <div className="my-2 border-t border-border/50 pt-2">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Financiado (Principal + Taxas):</span>
                                        <span>{formatCurrency(financialDetails.totalFinanced)}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between bg-muted/30 p-2 rounded">
                                    <span className="font-semibold">Parcelas:</span>
                                    <span className="font-bold text-primary">{proposal.installments}x de {formatCurrency(financialDetails.installmentValue)}</span>
                                </div>
                                 <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Total do Contrato:</span>
                                    <span>{formatCurrency(financialDetails.totalReceivable + Number(proposal.upfront_payment))}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <AlertDialog open={showResendDialog} onOpenChange={setShowResendDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Reenviar E-mail de Assinatura?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Um novo e-mail será enviado para <span className="font-semibold">{proposal.customer_email}</span>. O link anterior será invalidado.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isResending}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleResendEmail} disabled={isResending}>
                                {isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sim, reenviar"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </motion.div>
        </>
    );
};

export default ProposalTimelineView;