import { FileText, Clock, CheckCircle, XCircle, AlertTriangle, FileCheck, PenTool } from 'lucide-react';

export const statusConfigs = {
    pending: {
        title: 'Rascunho',
        description: 'Proposta em preenchimento',
        timelineTitle: 'Rascunho Iniciado',
        timelineDescription: 'O distribuidor está preenchendo os dados da proposta.',
        color: 'gray',
        icon: FileText,
        bgColor: 'bg-gray-100 dark:bg-gray-900/50',
        borderColor: 'border-gray-200 dark:border-gray-800',
        textColor: 'text-gray-600 dark:text-gray-400'
    },
    awaiting_analysis: {
        title: 'Aguardando Análise',
        description: 'Em análise pela equipe FNX',
        timelineTitle: 'Enviada para Análise',
        timelineDescription: 'A proposta foi enviada e está sob revisão da equipe de crédito.',
        color: 'blue',
        icon: Clock,
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        borderColor: 'border-blue-200 dark:border-blue-800',
        textColor: 'text-blue-600 dark:text-blue-400'
    },
    awaiting_adjustment: {
        title: 'Aguardando Ajuste',
        description: 'Necessita correção do distribuidor',
        timelineTitle: 'Ajuste Solicitado',
        timelineDescription: 'A equipe FNX solicitou correções ou documentos adicionais.',
        color: 'yellow',
        icon: AlertTriangle,
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        textColor: 'text-yellow-600 dark:text-yellow-400'
    },
    awaiting_signature: {
        title: 'Aguardando Assinatura',
        description: 'Contrato enviado ao cliente',
        timelineTitle: 'Pronto para Assinatura',
        timelineDescription: 'A proposta foi aprovada e o link de assinatura enviado ao cliente.',
        color: 'purple',
        icon: PenTool,
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        borderColor: 'border-purple-200 dark:border-purple-800',
        textColor: 'text-purple-600 dark:text-purple-400'
    },
    approved: {
        title: 'Aprovada', // Often synonymous with signed/completed in simple flows, or 'Contract Active'
        description: 'Aprovada e Assinada',
        timelineTitle: 'Proposta Aprovada',
        timelineDescription: 'O crédito foi aprovado e o processo segue para pagamento.',
        color: 'green',
        icon: CheckCircle,
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        borderColor: 'border-green-200 dark:border-green-800',
        textColor: 'text-green-600 dark:text-green-400'
    },
    completed: {
        title: 'Concluída',
        description: 'Processo finalizado com sucesso',
        timelineTitle: 'Finalizada',
        timelineDescription: 'Todo o processo foi concluído.',
        color: 'emerald',
        icon: FileCheck,
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        textColor: 'text-emerald-600 dark:text-emerald-400'
    },
    rejected: {
        title: 'Rejeitada',
        description: 'Crédito negado ou cancelada',
        timelineTitle: 'Proposta Rejeitada',
        timelineDescription: 'A proposta não atendeu aos critérios ou foi cancelada.',
        color: 'red',
        icon: XCircle,
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        borderColor: 'border-red-200 dark:border-red-800',
        textColor: 'text-red-600 dark:text-red-400'
    },
    default: {
        title: 'Desconhecido',
        description: 'Status não identificado',
        color: 'gray',
        icon: FileText,
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-500'
    }
};