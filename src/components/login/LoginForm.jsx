import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { LogIn, ArrowRight } from 'lucide-react';

const LoginForm = ({ setAuthMode }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          toast({
              title: "Erro de Conexão",
              description: "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.",
              variant: "destructive"
          });
      } else {
          toast({
            title: "Erro de autenticação",
            description: "Credenciais inválidas. Verifique seu e-mail e senha.",
            variant: "destructive"
          });
      }
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Bem-vindo de volta</h2>
        <p className="text-sm text-muted-foreground">Insira suas credenciais para acessar</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 transition-all h-10"
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Senha</Label>
          <Button
            type="button"
            variant="link"
            className="text-xs text-muted-foreground px-0 h-auto hover:text-primary"
            onClick={() => setAuthMode('forgotPassword')}
          >
            Esqueceu a senha?
          </Button>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          className="bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 transition-all h-10"
        />
      </div>

      <Button type="submit" className="w-full h-10 font-medium shadow-lg shadow-primary/20" disabled={loading}>
        {loading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"
          />
        ) : (
          <LogIn className="w-4 h-4 mr-2" />
        )}
        {loading ? 'Entrando...' : 'Acessar Plataforma'}
      </Button>
    </form>
  );
};

export default LoginForm;