import React from 'react';
    import { Button } from '@/components/ui/button';

    const AuthFormToggle = ({ authMode, setAuthMode }) => {
      if (authMode === 'forgot_password') {
        return (
          <Button
            variant="link"
            className="w-full mt-2 text-sm text-muted-foreground"
            onClick={() => setAuthMode('login')}
          >
            Voltar para o Login
          </Button>
        );
      }

      return (
        <Button
          variant="link"
          className="w-full mt-4 text-sm text-muted-foreground"
          onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
        >
          {authMode === 'login' ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
        </Button>
      );
    };

    export default AuthFormToggle;