/**
 * Exemplos de payload de atualização (customers.update), alinhados ao formulário / Supabase.
 * Úteis para testes e documentação de campos.
 */
export const sampleCustomerUpdatePayloads = [
  {
    name: 'Maria Silva',
    cpf_cnpj: '12345678901',
    phone: '(11) 98765-4321',
    email: 'maria@email.com',
    address: 'Rua das Flores',
    zip_code: '01310100',
    address_number: '100',
    address_complement: 'Apto 42',
    address_neighborhood: 'Centro',
    address_city: 'São Paulo',
    address_state: 'SP',
    birth_date: '1990-05-15',
    company: 'Tech Ltda',
    position: 'Gerente',
    updated_at: new Date().toISOString(),
  },
  {
    name: 'João Santos',
    cpf_cnpj: null,
    phone: '(21) 99999-1111',
    email: null,
    address: null,
    zip_code: null,
    address_number: null,
    address_complement: null,
    address_neighborhood: null,
    address_city: null,
    address_state: null,
    birth_date: null,
    company: null,
    position: null,
    updated_at: new Date().toISOString(),
  },
];
