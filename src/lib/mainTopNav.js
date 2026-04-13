import {
  BarChartBig,
  ListChecks,
  CalendarDays,
  Users as UsersIcon,
  Landmark,
} from 'lucide-react';

/** Rotas principais do shell (cinco itens do header desktop). */
export const MAIN_TOP_NAV_TABS = [
  { value: 'performance', label: 'Início', path: '/dashboard', icon: BarChartBig },
  { value: 'crm', label: 'CRM', path: '/sales', icon: ListChecks },
  { value: 'agenda', label: 'Agenda', path: '/agenda', icon: CalendarDays },
  { value: 'customers', label: 'Clientes', path: '/customers', icon: UsersIcon },
  { value: 'financial', label: 'MetriX Bank', path: '/fnx-solutions', icon: Landmark },
];

const MAIN_KEYS = new Set(MAIN_TOP_NAV_TABS.map((t) => t.value));

/**
 * Tab activa do CompanyManagementPage (conteúdo): performance, intelligence, crm, agenda, etc.
 * Mantém o mesmo comportamento que o antigo getTabFromPath.
 */
export function getCompanyShellTabFromLocation(pathname, search) {
  const params = new URLSearchParams(search);
  if (params.get('tab') === 'intelligence') return 'intelligence';

  if (pathname.startsWith('/agenda')) return 'agenda';
  if (pathname.startsWith('/sales')) return 'crm';
  if (pathname.startsWith('/customers')) return 'customers';
  if (pathname.startsWith('/stock')) return 'stock';
  if (pathname.startsWith('/goals')) return 'goals';
  if (pathname.startsWith('/fnx-solutions')) return 'financial';
  return 'performance';
}

/**
 * Qual dos cinco itens do header deve mostrar estado activo (gradiente + Spark), ou null.
 */
export function getMainTopNavHighlightKey(pathname, search) {
  if (pathname.startsWith('/fnx-solutions')) return 'financial';
  const shell = getCompanyShellTabFromLocation(pathname, search);
  if (MAIN_KEYS.has(shell)) return shell;
  return null;
}

/** Config do tutorial por tab do menu principal (passos 1–3 alinhados ao antigo grid). */
export function getMainNavTutorialConfig(tabValue) {
  const steps = {
    performance: {
      step: 1,
      content:
        "Primeiro, vamos para 'Desempenho' para analisar seus resultados com gráficos e indicadores.",
    },
    crm: {
      step: 2,
      content: "No 'CRM', você registra e acompanha suas negociações e funil de vendas.",
    },
    agenda: {
      step: 3,
      content: "Organize seus compromissos e atividades na 'Agenda'.",
    },
  };
  return steps[tabValue] || { step: -1, content: '' };
}
