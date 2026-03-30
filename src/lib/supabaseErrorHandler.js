/**
 * Standardized error handler for Supabase/Postgres errors
 * Specifically targets Unique Violations (23505)
 */
export const handleSupabaseError = (error) => {
  if (!error) return { message: "Ocorreu um erro desconhecido.", isDuplicate: false };

  // Check for Postgres Unique Violation (23505)
  // Also check message content as sometimes the code isn't propagated perfectly by client libs
  if (
    error.code === '23505' || 
    error.message?.includes('duplicate key') || 
    error.details?.includes('already exists') ||
    error.message?.includes('unique_customer')
  ) {
    let field = 'registro';
    
    // Try to identify the conflicting field from the error details
    if (error.message?.includes('phone') || error.details?.includes('phone')) field = 'Telefone';
    else if (error.message?.includes('email') || error.details?.includes('email')) field = 'Email';
    else if (error.message?.includes('cpf') || error.details?.includes('cpf')) field = 'CPF/CNPJ';
    else if (error.message?.includes('name') || error.details?.includes('name')) field = 'Nome';

    return {
      message: `Este cliente já está cadastrado no sistema (${field}).`,
      isDuplicate: true,
      field,
      originalError: error
    };
  }

  return {
    message: error.message || "Erro ao processar solicitação.",
    isDuplicate: false,
    originalError: error
  };
};