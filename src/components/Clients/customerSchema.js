import * as z from 'zod';

export const customerSchema = z.object({
  customer_name: z.string().min(1, 'Nome é obrigatório'),
  customer_cpf_cnpj: z.string().optional(),
  customer_phone: z.string().min(1, 'Telefone é obrigatório'),
  customer_email: z.string().email('Email inválido').optional().or(z.literal('')),
  customer_address: z.string().optional(),
  customer_cep: z.string().optional(),
  customer_address_number: z.string().optional(),
  customer_address_complement: z.string().optional(),
  customer_address_neighborhood: z.string().optional(),
  customer_address_city: z.string().optional(),
  customer_address_state: z.string().optional(),
  customer_birth_date: z.string().optional().nullable(),
  customer_company: z.string().optional(),
  customer_position: z.string().optional(),
  is_new_customer: z.boolean().default(true),
  customer_id: z.string().optional().nullable(),
});
