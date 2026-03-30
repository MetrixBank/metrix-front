export const colors = {
  positive: '#10b981', // Green
  negative: '#ef4444', // Red
  warning: '#f59e0b',  // Yellow
  neutral: '#3b82f6',  // Blue
  standout: '#fbbf24', // Gold
  darkBg: '#1e293b',
  cardBg: 'rgba(255, 255, 255, 0.1)',
};

export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'active':
    case 'paid':
    case 'approved':
    case 'sale_made':
    case 'healthy':
      return colors.positive;
    case 'pending':
    case 'in_progress':
    case 'scheduled':
      return colors.neutral;
    case 'overdue':
    case 'cancelled':
    case 'rejected':
    case 'rupture':
    case 'at_risk':
    case 'critical':
      return colors.negative;
    case 'warning':
    case 'excess':
    case 'stagnant':
    case 'caution':
      return colors.warning;
    case 'vip':
    case 'standout':
      return colors.standout;
    default:
      return colors.neutral;
  }
};

export const getTrendColor = (value) => {
  if (value > 0) return colors.positive;
  if (value < 0) return colors.negative;
  return colors.neutral;
};