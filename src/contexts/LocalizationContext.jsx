import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const LocalizationContext = createContext();

const translations = {
  BR: {
    currency: 'BRL',
    currencySymbol: 'R$',
    locale: 'pt-BR',
    dateFormat: 'dd/MM/yyyy',
    dateTimeFormat: 'dd/MM/yyyy HH:mm',
    labels: {
      // General
      welcome: 'Bem-vindo',
      dashboard: 'Painel de Controle',
      loading: 'Carregando...',
      save: 'Salvar',
      saving: 'Salvando...',
      cancel: 'Cancelar',
      delete: 'Excluir',
      edit: 'Editar',
      new: 'Novo',
      search: 'Buscar',
      filter: 'Filtrar',
      settings: 'Configurações',
      profile: 'Perfil',
      logout: 'Sair',
      login: 'Entrar',
      register: 'Registrar',
      error: 'Erro',
      success: 'Sucesso',
      warning: 'Aviso',
      next: 'Próximo',
      back: 'Voltar',
      confirm: 'Confirmar',
      
      // Activity / Sales
      new_activity: 'Nova Atividade',
      save_activity: 'Salvar Atividade',
      edit_activity: 'Editar Atividade',
      activity_type: 'Tipo de Atividade',
      status: 'Status',
      visit_date: 'Data da Visita',
      visit_time: 'Hora',
      notes: 'Observações',
      
      // Customer
      customer: 'Cliente',
      select_customer: 'Selecionar Cliente',
      create_customer: 'Criar Novo Cliente',
      find_customer: 'Buscar Cliente',
      full_name: 'Nome Completo',
      cpf: 'CPF',
      cnpj: 'CNPJ',
      cpf_cnpj: 'CPF/CNPJ',
      phone: 'Telefone',
      email: 'Email',
      birth_date: 'Data de Nascimento',
      
      // Address
      address: 'Endereço',
      street: 'Logradouro',
      number: 'Número',
      complement: 'Complemento',
      neighborhood: 'Bairro',
      city: 'Cidade',
      state: 'Estado',
      zip: 'CEP',
      address_found: 'Endereço encontrado!',
      zip_not_found: 'CEP não encontrado',
      
      // Sales Details
      sale_value: 'Valor da Venda',
      products: 'Produtos',
      add_product: 'Adicionar Produto',
      select_product: 'Selecionar Produto',
      quantity: 'Qtd',
      unit_price: 'Preço Unit.',
      cost_price: 'Preço Custo',
      subtotal: 'Subtotal',
      total: 'Total',
      financial_summary: 'Resumo Financeiro',
      costs_deductions: 'Custos e Deduções',
      commission: 'Comissão',
      discount_other: 'Desconto / Outros',
      tax: 'Imposto',
      tax_type: 'Tipo Imposto',
      net_profit: 'Lucro Líquido Estimado',
      margin: 'Margem',
      
      // Payment
      payment_terms: 'Condições de Pagamento',
      installments_question: 'Parcelado?',
      down_payment_question: 'Tem Entrada?',
      down_payment_amount: 'Valor da Entrada',
      installments_count: 'Nº Parcelas',
      first_due_date: 'Data 1ª Parcela',
      installments_preview: 'Prévia das Parcelas',
      
      // Validation / Errors
      required_field: 'Campo obrigatório',
      at_least_one_product: 'Pelo menos um produto é obrigatório para salvar a venda.',
      customer_exists_warning: 'Cliente já cadastrado. Considere usar o registro existente.',
      fill_required: 'Preencha os campos obrigatórios para continuar.',
      
      // Dashboard
      token_balance: 'Saldo de Tokens',
      my_points: 'Meus Pontos',
      total_invested: 'Total Investido',
      transactions: 'Transações',
      available: 'Disponível',
      loyalty_program: 'Programa de Fidelidade',
      confirmed_payments: 'Pagamentos Confirmados',
      total_history: 'Histórico Total',
      
      // Scheduling
      scheduling_success_title: 'Agendamento Confirmado!',
      scheduling_success_message: 'Seu agendamento foi marcado para {date} às {time}.',
      
      // Products
      water_gallon: 'Galão',
      water_refill: 'Refil',
      no_products: 'Nenhum produto disponível.',
      added_to_cart: 'Adicionado ao Carrinho!',
      
      // USA Specific (Default fallback)
      ssn: 'SSN',
      ein: 'EIN'
    }
  },
  USA: {
    currency: 'USD',
    currencySymbol: '$',
    locale: 'en-US',
    dateFormat: 'MM/dd/yyyy',
    dateTimeFormat: 'MM/dd/yyyy HH:mm',
    labels: {
      // General
      welcome: 'Welcome',
      dashboard: 'Dashboard',
      loading: 'Loading...',
      save: 'Save',
      saving: 'Saving...',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      new: 'New',
      search: 'Search',
      filter: 'Filter',
      settings: 'Settings',
      profile: 'Profile',
      logout: 'Logout',
      login: 'Login',
      register: 'Register',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      next: 'Next',
      back: 'Back',
      confirm: 'Confirm',
      
      // Activity / Sales
      new_activity: 'New Activity',
      save_activity: 'Save Activity',
      edit_activity: 'Edit Activity',
      activity_type: 'Activity Type',
      status: 'Status',
      visit_date: 'Visit Date',
      visit_time: 'Time',
      notes: 'Notes',
      
      // Customer
      customer: 'Customer',
      select_customer: 'Select Customer',
      create_customer: 'Create New Customer',
      find_customer: 'Find Customer',
      full_name: 'Full Name',
      cpf: 'SSN',
      cnpj: 'EIN',
      cpf_cnpj: 'SSN/EIN',
      phone: 'Phone',
      email: 'Email',
      birth_date: 'Birth Date',
      
      // Address
      address: 'Address',
      street: 'Street',
      number: 'No.',
      complement: 'Unit/Apt',
      neighborhood: 'District',
      city: 'City',
      state: 'State',
      zip: 'Zip Code',
      address_found: 'Address found!',
      zip_not_found: 'Zip Code not found',
      
      // Sales Details
      sale_value: 'Sale Value',
      products: 'Products',
      add_product: 'Add Product',
      select_product: 'Select Product',
      quantity: 'Qty',
      unit_price: 'Unit Price',
      cost_price: 'Cost Price',
      subtotal: 'Subtotal',
      total: 'Total',
      financial_summary: 'Financial Summary',
      costs_deductions: 'Costs & Deductions',
      commission: 'Commission',
      discount_other: 'Discount / Other',
      tax: 'Tax',
      tax_type: 'Tax Type',
      net_profit: 'Est. Net Profit',
      margin: 'Margin',
      
      // Payment
      payment_terms: 'Payment Terms',
      installments_question: 'Installments?',
      down_payment_question: 'Down Payment?',
      down_payment_amount: 'Down Payment Amount',
      installments_count: 'Installments Count',
      first_due_date: 'First Due Date',
      installments_preview: 'Installments Preview',
      
      // Validation / Errors
      required_field: 'Required field',
      at_least_one_product: 'At least one product is required to save the sale.',
      customer_exists_warning: 'Customer already exists. Consider using the existing record.',
      fill_required: 'Please fill in the required fields to continue.',
      
      // Dashboard
      token_balance: 'Token Balance',
      my_points: 'My Points',
      total_invested: 'Total Invested',
      transactions: 'Transactions',
      available: 'Available',
      loyalty_program: 'Loyalty Program',
      confirmed_payments: 'Confirmed Payments',
      total_history: 'Total History',
      
      // Scheduling
      scheduling_success_title: 'Scheduling Confirmed!',
      scheduling_success_message: 'Your water refill has been scheduled for {date} at {time}.',
      
      // Products
      water_gallon: 'Water Refill',
      water_refill: 'Refill',
      no_products: 'No products available.',
      added_to_cart: 'Added to Cart!',
      
      // USA Specific
      ssn: 'SSN',
      ein: 'EIN'
    }
  }
};

export const LocalizationProvider = ({ children }) => {
  const { user } = useAuth();
  const [region, setRegion] = useState('BR');

  useEffect(() => {
    let selectedRegion = 'BR';
    
    // Priority: User Profile > LocalStorage > Browser Language
    if (user?.region) {
      selectedRegion = user.region;
    } else {
      const storedRegion = localStorage.getItem('app_region');
      if (storedRegion) {
        selectedRegion = storedRegion;
      } else {
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang && (browserLang.startsWith('en') || browserLang === 'en-US')) {
          selectedRegion = 'USA';
        }
      }
    }
    
    setRegion(selectedRegion);
    localStorage.setItem('app_region', selectedRegion);
  }, [user]);

  const t = (key) => {
    return translations[region].labels[key] || key;
  };

  const formatMoney = (value) => {
    const numericValue = Number(value);
    if (isNaN(numericValue) || value === null || value === undefined) {
      return translations[region].currencySymbol + ' 0.00';
    }
    
    return new Intl.NumberFormat(translations[region].locale, {
      style: 'currency',
      currency: translations[region].currency,
    }).format(numericValue);
  };

  const pointDivisor = region === 'USA' ? 1000 : 4000;

  const value = {
    region,
    setRegion,
    t,
    formatMoney,
    pointDivisor,
    locale: translations[region].locale,
    currencySymbol: translations[region].currencySymbol,
    dateFormat: translations[region].dateFormat,
    dateTimeFormat: translations[region].dateTimeFormat
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};