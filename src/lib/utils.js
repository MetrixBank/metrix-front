import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value, currency = 'BRL', locale = 'pt-BR') {
  if (value === undefined || value === null) {
    return currency === 'USD' ? '$ 0.00' : 'R$ 0,00';
  }
  
  const numberVal = Number(value);
  if (isNaN(numberVal)) return currency === 'USD' ? '$ 0.00' : 'R$ 0,00';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberVal);
}

export function formatCurrencyUSD(value) {
  return formatCurrency(value, 'USD', 'en-US');
}

export function formatDate(dateString, timeString = null) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  
  const formattedDate = new Intl.DateTimeFormat('pt-BR').format(date);
  
  if (timeString) {
    return `${formattedDate} ${timeString}`;
  }
  
  return formattedDate;
}

export function formatDateTime(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function getStatusBadge(status) {
  const styles = {
    'sale_made': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'completed': 'bg-green-100 text-green-800 border-green-200',
    'paid': 'bg-green-100 text-green-800 border-green-200',
    'approved': 'bg-green-100 text-green-800 border-green-200',
    'won': 'bg-green-100 text-green-800 border-green-200',
    
    'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'in_progress': 'bg-blue-100 text-blue-800 border-blue-200',
    'scheduled': 'bg-purple-100 text-purple-800 border-purple-200',
    'contacted': 'bg-blue-50 text-blue-700 border-blue-200',
    'new': 'bg-blue-50 text-blue-700 border-blue-200',
    'awaiting_adjustment': 'bg-orange-100 text-orange-800 border-orange-200',
    
    'cancelled': 'bg-red-100 text-red-800 border-red-200',
    'lost': 'bg-red-100 text-red-800 border-red-200',
    'rejected': 'bg-red-100 text-red-800 border-red-200',
    'overdue': 'bg-red-100 text-red-800 border-red-200',
    'completed_no_sale': 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return styles[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function getStatusPortuguese(status) {
  const map = {
    'scheduled': 'Agendado',
    'in_progress': 'Em Andamento',
    'sale_made': 'Venda Realizada',
    'completed_no_sale': 'Concluído (Sem Venda)',
    'cancelled': 'Cancelado',
    'postponed': 'Adiado',
    'pending': 'Pendente',
    'approved': 'Aprovado',
    'rejected': 'Rejeitado',
    'awaiting_signature': 'Aguardando Assinatura',
    'awaiting_adjustment': 'Aguardando Ajuste',
    'paid': 'Pago',
    'overdue': 'Atrasado',
    'contacted': 'Contatado',
    'new': 'Novo',
    'lost': 'Perdido',
    'won': 'Ganho',
    'rescheduled': 'Reagendado',
    'completed': 'Concluído',
    'visit_made': 'Visita Realizada'
  };
  return map[status] || status;
}

export function getActivityTypePortuguese(type) {
  const map = {
    'venda': 'Venda',
    'visita': 'Visita',
    'troca_refil': 'Troca de Refil',
    'manutencao': 'Manutenção',
    'pos_venda': 'Pós-venda',
    'prospeccao': 'Prospecção',
    'reuniao': 'Reunião',
    'outros': 'Outros',
    'daily_planning': 'Planejamento Diário',
    'review_inactive_customers': 'Revisar Inativos',
    'post_sale_follow_up': 'Follow-up Pós-venda',
    'cleaning_and_referrals': 'Limpeza e Indicações',
    'refill_replacement': 'Troca de Refil',
    'update_past_activity': 'Atualizar Atividade',
    'new_offer': 'Nova Oferta',
    'negocio': 'Negócio',
    'landing_page': 'Landing Page'
  };
  return map[type] || type;
}

export function getActivityTypeColor(type) {
    const map = {
        'venda': 'emerald',
        'sale_made': 'emerald',
        'visita': 'blue',
        'visit_made': 'blue',
        'prospeccao': 'purple',
        'prospecting': 'purple',
        'reuniao': 'amber',
        'troca_refil': 'cyan',
        'pos_venda': 'indigo',
        'manutencao': 'orange',
        'outros': 'slate'
    };
    return map[type] || 'slate';
}

export function getActivityTypeTailwindColor(type) {
    const color = getActivityTypeColor(type);
    switch (color) {
        case 'emerald': return { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500', bgSoft: 'bg-emerald-500/10' };
        case 'blue': return { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500', bgSoft: 'bg-blue-500/10' };
        case 'purple': return { bg: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500', bgSoft: 'bg-purple-500/10' };
        case 'amber': return { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500', bgSoft: 'bg-amber-500/10' };
        case 'cyan': return { bg: 'bg-cyan-500', text: 'text-cyan-500', border: 'border-cyan-500', bgSoft: 'bg-cyan-500/10' };
        case 'indigo': return { bg: 'bg-indigo-500', text: 'text-indigo-500', border: 'border-indigo-500', bgSoft: 'bg-indigo-500/10' };
        case 'orange': return { bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500', bgSoft: 'bg-orange-500/10' };
        default: return { bg: 'bg-slate-500', text: 'text-slate-500', border: 'border-slate-500', bgSoft: 'bg-slate-500/10' };
    }
}

export function formatCpfCnpj(value) {
  if (!value) return '';
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length <= 11) {
    return cleanValue.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
  }
  return cleanValue.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d)/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
}

export function formatNumberWithSuffix(number) {
  if (!number) return '0';
  const num = Number(number);
  if (isNaN(num)) return '0';
  if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

export function formatDecimal(value, decimals = 2) {
  if (value === undefined || value === null) return '0,00';
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}

export function formatNumber(value) {
  if (value === undefined || value === null) return '0';
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function formatGoalValue(value, type) {
  if (type === 'revenue') return formatCurrency(value);
  if (type === 'tokens') return `${formatNumber(value)} tokens`;
  return `${formatNumber(value)} pts`;
}

export function formatSSN(value) {
  if (!value) return '';
  const cleanValue = value.replace(/\D/g, '');
  return cleanValue
    .replace(/^(\d{3})(\d)/, '$1-$2')
    .replace(/-(\d{2})(\d)/, '-$1-$2')
    .slice(0, 11);
}

export function formatEIN(value) {
  if (!value) return '';
  const cleanValue = value.replace(/\D/g, '');
  return cleanValue
    .replace(/^(\d{2})(\d)/, '$1-$2')
    .slice(0, 10);
}

export function formatZIPCode(value) {
  if (!value) return '';
  const cleanValue = value.replace(/\D/g, '');
  return cleanValue.slice(0, 5);
}

export function calculateInstallmentDetails(totalValue, upfrontPayment, installments) {
  const principal = Number(totalValue) - Number(upfrontPayment);
  const rate = 0.048; // 4.8% monthly interest
  const iof = 0.02; // 2% IOF
  const boletoFee = 2.99; // R$ 2.99 per boleto

  const totalFinanced = principal + (principal * iof) + (boletoFee * installments);
  
  let installmentValue = 0;
  if (installments > 0) {
    installmentValue = (totalFinanced * (rate * Math.pow(1 + rate, installments))) / (Math.pow(1 + rate, installments) - 1);
  }

  const totalReceivable = installmentValue * installments;

  return {
    principal,
    totalFinanced,
    installmentValue,
    totalReceivable
  };
}