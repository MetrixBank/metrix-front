import * as z from 'zod';

export const getSalesActivitySchema = (region = 'BR') => {
  const isUSA = region === 'USA';

  return z.object({
    // Customer Validation
    customer_id: z.string().nullable().optional(),
    customer_name: z.string().min(3, isUSA ? "Name required (min 3 chars)" : "Nome do Cliente é obrigatório (mín 3 caracteres)"),
    customer_phone: z.string().optional().nullable(),
    customer_email: z.string().email("Email inválido").optional().or(z.literal("")).nullable(),
    customer_cpf_cnpj: z.string().optional().nullable(),
    customer_birth_date: z.string().optional().nullable(),
    
    // Address
    customer_cep: z.string().optional().or(z.literal("")),
    customer_address: z.string().optional().or(z.literal("")),
    customer_address_number: z.string().optional().or(z.literal("")),
    customer_address_complement: z.string().optional().or(z.literal("")),
    customer_address_neighborhood: z.string().optional().or(z.literal("")),
    customer_address_city: z.string().optional().or(z.literal("")),
    customer_address_state: z.string().optional().or(z.literal("")),

    // Configuration
    is_new_customer: z.boolean().default(true),
    use_conexzap_webhook: z.boolean().optional(),
    custom_data: z.any().optional(),

    // Activity Fields
    status: z.string().min(1, "Status da atividade é obrigatório"),
    visit_date: z.string().min(1, "Data da visita é obrigatória"),
    visit_time: z.string().min(1, "Horário da visita é obrigatório"),
    consultant_name: z.string().optional(),
    notes: z.string().optional(),
    activity_type: z.string().min(1, "Tipo de atividade é obrigatório"),
    visits_count: z.preprocess(
      (val) => Number(val) || 1,
      z.number().min(1)
    ),
    
    // Intelligence Fields
    pathology: z.string().optional(),
    objections: z.string().optional(),
    potential_products: z.string().optional(),
    
    // Updated to be fully optional/nullable
    estimated_value: z.preprocess(
      (val) => {
        if (val === "" || val === null || val === undefined) return null;
        return Number(val);
      },
      z.number().nullable().optional()
    ),
    
    // Sales Financials
    sale_made: z.boolean().default(false),
    sale_value: z.preprocess(
      (val) => Number(val) || 0,
      z.number().optional()
    ),
    
    products: z.array(z.object({
        product_id: z.string().min(1, "Produto inválido"),
        quantity_sold: z.number().min(1, "Qtd deve ser maior que 0"),
        unit_sale_price_at_sale: z.number().min(0, "Preço deve ser positivo"),
        unit_cost_price_at_sale: z.number().optional()
    })).optional(),
    
    commission_value: z.preprocess((v) => Number(v) || 0, z.number().min(0).optional()),
    other_costs: z.preprocess((v) => Number(v) || 0, z.number().min(0).optional()),
    tax_amount: z.preprocess((v) => Number(v) || 0, z.number().min(0).optional()),
    
    // Tax Type - Optional with default handling in form
    tax_type: z.string().optional().nullable(),
    
    // Installments
    has_down_payment: z.boolean().optional(),
    down_payment: z.preprocess((v) => Number(v) || 0, z.number().optional()),
    installments_count: z.preprocess((v) => Number(v) || 1, z.number().optional()),
    first_installment_date: z.string().optional().nullable(),
  });
};