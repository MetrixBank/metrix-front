import React, { useMemo, useState } from 'react';
import { ArrowLeft, Search, TrendingUp, Landmark, CheckCircle2, Percent, Box, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import LoanSimulatorPanel from './LoanSimulatorPanel';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import AnimatedCounter from '@/components/management/goals/AnimatedCounter';

const filterTabs = [
  { id: 'all', label: 'Todas' },
  { id: 'active', label: 'Ativas' },
  { id: 'completed', label: 'Aprovadas' },
  { id: 'rejected', label: 'Recusadas' },
];

function shortStatus(proposal) {
  const s = proposal.status;
  if (['approved', 'completed'].includes(s)) {
    return { label: 'APROVADA', cls: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' };
  }
  if (['rejected', 'cancelled'].includes(s)) {
    return { label: 'RECUSADA', cls: 'border-red-500/50 text-red-400 bg-red-500/10' };
  }
  return { label: 'ANÁLISE', cls: 'border-[#A855F7]/50 text-[#B589FF] bg-[#A855F7]/10' };
}

/**
 * Tela única de empréstimo / simulador (mock: KPIs + simulador + tabela).
 */
const CreditLoanSimulatorView = ({
  proposals,
  loading,
  onBack,
  onCreateProposal,
  onEdit,
  onDelete,
  onViewTimeline,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const stats = useMemo(() => {
    const total = proposals.length;
    const approved = proposals.filter((p) => ['approved', 'completed'].includes(p.status)).length;
    const rate = total > 0 ? (approved / total) * 100 : 0;
    const volume = proposals
      .filter((p) => ['approved', 'completed'].includes(p.status))
      .reduce((sum, p) => sum + Number(p.total_value || 0), 0);
    return { total, approved, rate, volume };
  }, [proposals]);

  const filtered = proposals.filter((proposal) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (proposal.customer_name && proposal.customer_name.toLowerCase().includes(q)) ||
      (proposal.id && String(proposal.id).toLowerCase().includes(q));

    let tabOk = true;
    if (activeTab === 'active') {
      tabOk = ['pending', 'awaiting_analysis', 'awaiting_adjustment', 'awaiting_signature'].includes(proposal.status);
    } else if (activeTab === 'completed') {
      tabOk = ['approved', 'completed'].includes(proposal.status);
    } else if (activeTab === 'rejected') {
      tabOk = ['rejected', 'cancelled'].includes(proposal.status);
    }
    return matchesSearch && tabOk;
  });

  const isEditable = (p) =>
    ['pending', 'awaiting_adjustment'].includes(p.status) || p.allow_distributor_edit;

  return (
    <div className="space-y-8 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="text-[#94A3B8] hover:text-white hover:bg-white/5 w-fit -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao MetriX Bank
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/[0.08] bg-[#1A1625]/90 p-4 shadow-lg">
          <div className="flex justify-between items-start text-[#94A3B8] text-xs font-semibold uppercase tracking-wide">
            <span>Total propostas</span>
            <Landmark className="h-4 w-4 text-[#A855F7]" />
          </div>
          <div className="mt-2 text-2xl font-bold flex items-baseline gap-2">
            {loading ? '—' : <AnimatedCounter value={stats.total} />}
            <span className="text-xs font-semibold text-emerald-400">+12%</span>
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-[#1A1625]/90 p-4 shadow-lg">
          <div className="flex justify-between items-start text-[#94A3B8] text-xs font-semibold uppercase tracking-wide">
            <span>Aprovadas</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold flex items-center gap-2">
            {loading ? '—' : <AnimatedCounter value={stats.approved} />}
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-[#1A1625]/90 p-4 shadow-lg">
          <div className="flex justify-between items-start text-[#94A3B8] text-xs font-semibold uppercase tracking-wide">
            <span>Taxa de aprovação</span>
            <Percent className="h-4 w-4 text-[#A855F7]" />
          </div>
          <div className="mt-2 text-2xl font-bold flex items-center gap-2 flex-wrap">
            {loading ? '—' : `${stats.rate.toFixed(1)}%`}
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#A855F7]/20 text-[#B589FF] border border-[#A855F7]/30">
              Stable
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-[#1A1625]/90 p-4 shadow-lg">
          <div className="flex justify-between items-start text-[#94A3B8] text-xs font-semibold uppercase tracking-wide">
            <span>Volume liberado</span>
            <TrendingUp className="h-4 w-4 text-[#A855F7]" />
          </div>
          <div className="mt-2 text-xl font-bold tabular-nums">
            {loading ? '—' : formatCurrency(stats.volume)}
          </div>
        </div>
      </div>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Simulador de crédito inteligente</h2>
          <Button
            type="button"
            onClick={onCreateProposal}
            className="rounded-xl bg-gradient-to-r from-[#c4b5fd] to-[#A855F7] text-[#0f0d14] font-bold px-6 h-11 border-0 shadow-lg shadow-purple-500/25 whitespace-nowrap"
          >
            Criar nova proposta
          </Button>
        </div>
        <LoanSimulatorPanel />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#1A1625]/80 p-4">
          <div className="flex flex-wrap gap-2">
            {filterTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  'px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-colors',
                  activeTab === t.id
                    ? 'bg-[#2e1064] text-white border border-[#A855F7]/40 shadow-[0_0_20px_-4px_rgba(168,85,247,0.5)]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/5',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative w-full xl:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
            <Input
              placeholder="Filtrar por nome ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#0f0d14] border-white/10 text-white placeholder:text-[#64748B] rounded-xl h-11"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-[#14121c]">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Cliente</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Valor</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Parcelas</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Data</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Status</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-[#94A3B8]">
                    Carregando…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-[#94A3B8]">
                    Nenhuma proposta encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((proposal) => {
                  const st = shortStatus(proposal);
                  const initials = proposal.customer_name
                    ? proposal.customer_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    : '—';
                  return (
                    <TableRow key={proposal.id} className="border-white/10 hover:bg-white/[0.03]">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-white/10">
                            <AvatarFallback className="bg-[#2e1064] text-[#B589FF] text-xs">{initials}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-white">{proposal.customer_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-white font-medium tabular-nums">
                        {formatCurrency(proposal.total_value)}
                      </TableCell>
                      <TableCell className="text-[#94A3B8]">{proposal.installments ?? '—'}x</TableCell>
                      <TableCell className="text-[#94A3B8] text-sm">{formatDate(proposal.created_at)}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex text-[10px] font-bold uppercase px-2 py-1 rounded-full border',
                            st.cls,
                          )}
                        >
                          {st.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-[#94A3B8] hover:text-white">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1A1625] border-white/10 text-white">
                            <DropdownMenuItem onClick={() => onViewTimeline(proposal)} className="gap-2">
                              <Eye className="h-4 w-4" /> Ver timeline
                            </DropdownMenuItem>
                            {isEditable(proposal) && (
                              <DropdownMenuItem onClick={() => onEdit(proposal)} className="gap-2">
                                <Edit className="h-4 w-4" /> Editar
                              </DropdownMenuItem>
                            )}
                            {['pending', 'awaiting_adjustment'].includes(proposal.status) && (
                              <DropdownMenuItem
                                onClick={() => onDelete(proposal.id)}
                                className="gap-2 text-red-400 focus:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" /> Excluir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default CreditLoanSimulatorView;
