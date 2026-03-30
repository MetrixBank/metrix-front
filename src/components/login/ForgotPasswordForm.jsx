import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';

const ForgotPasswordForm = ({ setAuthMode }) => {
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: redirectTo,
    });

    if (error) {
      toast({
        title: "Erro ao enviar e-mail",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "E-mail enviado!",
        description: "Verifique sua caixa de entrada para o link de redefinição de senha.",
        variant: "default"
      });
      setAuthMode('login');
      setResetEmail('');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handlePasswordReset} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Recuperar Senha</h2>
        <p className="text-sm text-muted-foreground">Enviaremos um link para você</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reset-email">Email cadastrado</Label>
        <Input
          id="reset-email"
          type="email"
          placeholder="seu@email.com"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          required
          className="bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 h-10"
        />
      </div>

      <div className="space-y-3">
          <Button type="submit" className="w-full h-10" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
            {loading ? 'Enviando...' : 'Enviar Link'}
          </Button>
          
          <Button
            variant="ghost"
            type="button"
            className="w-full h-10 text-muted-foreground hover:text-foreground"
            onClick={() => setAuthMode('login')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para o Login
          </Button>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;