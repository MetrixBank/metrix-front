import { startOfDay } from 'date-fns';

export const initialState = {
  customer: {
    id: null,
    name: '',
    phone: '',
    document: '',
    address: '',
  },
  activity: {
    type: 'negocio',
    date: startOfDay(new Date()),
    status: 'scheduled',
    notes: '',
    estimated_value: '', // Changed from 0/undefined to empty string
  },
  sale: {
    isSale: false,
    products: [],
    paymentMethod: 'pix',
    totalValue: 0,
  },
};