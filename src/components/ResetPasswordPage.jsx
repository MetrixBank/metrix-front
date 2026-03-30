import React, { useState, useEffect, useCallback } from 'react';
    import { motion } from 'framer-motion';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Card } from '@/components/ui/card';
    import { Label } from '@/components/ui/label';
    import { useToast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/supabaseClient';
    import { useNavigate } from 'react-router-dom';
    import { KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react';

    const LOGO_URL = "https://storage.googleapis.com/hostinger-horizons-assets-prod/0c05ef73-d1d6-4ad5-b2e0-c9f1ef8a8a6c/f96cbb85c74adc6f3504140b2cff4706.png";

    const ResetPasswordPage = () => {
      const [password, setPassword] = useState('');
      const [confirmPassword, setConfirmPassword] = useState('');
      const [showPassword, setShowPassword] = useState(false);
      const [showConfirmPassword, setShowConfirmPassword] = useState(false);
      const [loading, setLoading] = useState(false);
      const [tokenValid, setTokenValid] = useState(null);
      const navigate = useNavigate();
      const { toast } = useToast();

      const handleInvalidToken = useCallback(() => {
        toast({
            title: 'Link Inválido ou Expirado',
            description: 'O link para redefinição de senha não é mais válido. Por favor, solicite um novo.',
            variant: 'destructive',
            duration: 7000,
        });
        navigate('/login');
      }, [navigate, toast]);

      useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                if (session) {
                    setTokenValid(true);
                } else {
                    setTokenValid(false);
                    handleInvalidToken();
                }
            }
        });

        return () => {
            authListener?.subscription?.unsubscribe();
        };
      }, [handleInvalidToken]);

      const handleResetPassword = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
          toast({
            title: "Senhas não coincidem",
            description: "Por favor, verifique se as senhas digitadas são iguais.",
            variant: "destructive",
          });
          return;
        }
        if (password.length < 6) {
          toast({
            title: "Senha muito curta",
            description: "A senha deve ter no mínimo 6 caracteres.",
            variant: "destructive",
          });
          return;
        }

        setLoading(true);
        const { data, error } = await supabase.auth.updateUser({ password });
        if (error) {
          toast({
            title: "Erro ao redefinir senha",
            description: `O link pode ter expirado ou a sessão é inválida. ${error.message}`,
            variant: "destructive",
          });
          setLoading(false);
        } else {
            if (data.user?.id) {
                 const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ requires_password_change: false })
                    .eq('id', data.user.id);

                 if (profileError) {
                    toast({
                        title: "Aviso",
                        description: "Sua senha foi alterada, mas ocorreu um erro ao atualizar seu perfil. Por favor, contate o suporte.",
                    });
                 }
            }
          toast({
            title: "Senha redefinida com sucesso!",
            description: "Você já pode fazer login com sua nova senha.",
          });
          
          await supabase.auth.signOut().catch(err => {
            console.warn("Sign out after password reset resulted in a session error, which is expected. Proceeding.", err);
          });
          navigate('/login');
        }
      };

      if (tokenValid === null) {
        return (
          <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 gradient-bg">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground mt-4">Validando link...</p>
          </div>
        );
      }

      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen w-full flex items-center justify-center p-4 gradient-bg"
        >
          <div className="w-full max-w-md space-y-8 z-10">
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <img src={LOGO_URL} alt="Logo MCX GROUP" className="mx-auto h-20 w-auto mb-6 sm:h-24 animate-float" />
              <h1 className="text-3xl font-bold tracking-tighter text-gradient sm:text-4xl">Redefinir Senha</h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">Crie uma nova senha para sua conta.</p>
            </motion.div>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6 card-gradient-login backdrop-blur-lg">
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2 relative">
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="•••••••• (mínimo 6 caracteres)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-background/50 pr-10"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-[2.1rem] h-7 px-2"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="space-y-2 relative">
                    <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-background/50 pr-10"
                    />
                     <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-[2.1rem] h-7 px-2"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
                    {loading ? 'Redefinindo...' : 'Redefinir Senha'}
                  </Button>
                </form>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      );
    };

    export default ResetPasswordPage;