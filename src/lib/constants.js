export const roles = {
  MASTER_ADMIN: 'master-admin',
  ADMIN: 'admin',
  SUB_ADMIN: 'sub-admin',
  DISTRIBUTOR: 'distributor',
};

export const applicationName = "MetriX";

export const defaultAvatarUrl = "https://api.dicebear.com/7.x/initials/svg";

// Task 1: Updated activityTypes with only the 7 valid enum values
export const activityTypes = [
  { id: 'venda', label: 'Venda Realizada' },
  { id: 'negocio', label: 'Negócio' },
  { id: 'troca_refil', label: 'Troca de Refil' },
  { id: 'pos_venda', label: 'Pós-venda' },
  { id: 'manutencao', label: 'Manutenção' },
  { id: 'follow_up', label: 'Follow-up' },
  { id: 'visita', label: 'Visita' }, // General visit type for new activity flow
];

// Task 1: Updated activityTypeLabels
export const activityTypeLabels = {
  venda: 'Venda Realizada',
  negocio: 'Negócio',
  troca_refil: 'Troca de Refil',
  pos_venda: 'Pós-venda',
  manutencao: 'Manutenção',
  follow_up: 'Follow-up',
  visita: 'Visita',
};

// Task 1: Updated activityTypeColors
export const activityTypeColors = {
  venda: 'bg-green-100 text-green-800',
  negocio: 'bg-violet-100 text-violet-800',
  troca_refil: 'bg-teal-100 text-teal-800',
  pos_venda: 'bg-cyan-100 text-cyan-800',
  manutencao: 'bg-indigo-100 text-indigo-800',
  follow_up: 'bg-purple-100 text-purple-800',
  visita: 'bg-blue-100 text-blue-800',
};