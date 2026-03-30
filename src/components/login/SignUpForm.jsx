import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from 'react-router-dom';

const signUpSchema = z.object({
  name: z.string().min(3, { message: 'Mínimo 3 caracteres.' }).max(100),
  email: z.string().email({ message: 'E-mail inválido.' }),
  phone: z.string().min(10, { message: 'Mínimo 10 dígitos.' }),
  password: z.string().min(6, { message: 'Mínimo 6 caracteres.' }),
  confirmPassword: z.string().min(6),
  cpf_cnpj: z.string().min(1, { message: 'Obrigatório.' }),
  region: z.string().default('BR'),
  privacyAccepted: z.boolean().refine(val => val === true, {
    message: 'Você deve aceitar a Política de Privacidade para continuar.'
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem.',
  path: ['confirmPassword'],
});

const SignUpForm = ({ setAuthMode, onSignUpSuccess }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [detectedRegion, setDetectedRegion] = useState('BR');

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: { 
        region: 'BR',
        privacyAccepted: false
    }
  });

  const regionValue = watch('region');
  const cpfCnpjValue = watch('cpf_cnpj');
  const phoneValue = watch('phone');
  const privacyAcceptedValue = watch('privacyAccepted');

  useEffect(() => {
    const lang = navigator.language || navigator.userLanguage;
    if (lang.startsWith('en')) {
      setDetectedRegion('USA');
      setValue('region', 'USA');
    }
  }, [setValue]);

  const formatDocument = (value) => {
    if (!value) return '';
    const cleanValue = value.replace(/\D/g, '');
    if (regionValue === 'USA') {
        if (cleanValue.length <= 9) return cleanValue.replace(/(\d{3})(\d{2})(\d{4})/, '$1-$2-$3').substring(0, 11);
        return cleanValue.substring(0, 9);
    } else {
        if (cleanValue.length <= 11) return cleanValue.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        return cleanValue.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').substring(0, 18);
    }
  };
  
  const formatPhone = (value) => {
    if (!value) return '';
    const cleanValue = value.replace(/\D/g, '');
    if (regionValue === 'USA') {
        if (cleanValue.length > 10) return cleanValue.substring(0, 10);
        return cleanValue.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }
    if (cleanValue.length <= 10) return cleanValue.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
    return cleanValue.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').substring(0, 15);
  };

  const handleDocumentChange = (e) => setValue('cpf_cnpj', formatDocument(e.target.value), { shouldValidate: true });
  const handlePhoneChange = (e) => setValue('phone', formatPhone(e.target.value), { shouldValidate: true });

  const handleSignUp = async (formData) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            cpf_cnpj: formData.cpf_cnpj.replace(/\D/g, ''),
            phone: formData.phone.replace(/\D/g, ''),
            role: 'distributor',
            distributor_type: 'external',
            registration_status: 'pending',
            source: 'organic',
            region: formData.region,
            privacy_policy_accepted: true,
            privacy_policy_accepted_at: new Date().toISOString()
          },
          email_confirm: false, 
        },
      });

      if (error) {
          if (error.message.includes("User already registered")) {
             toast({ title: 'Email já cadastrado', variant: 'destructive' });
             return;
          }
          throw error;
      }

      if (data.user) {
        toast({
          title: regionValue === 'USA' ? 'Registration Successful!' : 'Cadastro realizado!',
          description: regionValue === 'USA' ? 'Please check your email.' : 'Verifique seu e-mail.',
          variant: 'success',
        });
        onSignUpSuccess();
      }
    } catch (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit(handleSignUp)}
      className="space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="text-center mb-4">
        <h2 className="text-lg font-semibold text-foreground">{regionValue === 'USA' ? 'Create Account' : 'Criar Conta'}</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-1.5">
            <Label htmlFor="region" className="text-xs">Região</Label>
            <Select value={regionValue} onValueChange={(val) => setValue('region', val)}>
                <SelectTrigger className="h-9 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="BR">🇧🇷 Brasil</SelectItem>
                    <SelectItem value="USA">🇺🇸 USA</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs">Nome Completo</Label>
            <Input id="name" className="h-9 bg-white/5 border-white/10" {...register('name')} />
            {errors.name && <p className="text-red-400 text-[10px]">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
            <Label htmlFor="email-signup" className="text-xs">E-mail</Label>
            <Input id="email-signup" type="email" className="h-9 bg-white/5 border-white/10" {...register('email')} />
            {errors.email && <p className="text-red-400 text-[10px]">{errors.email.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs">Telefone</Label>
                <Input id="phone" className="h-9 bg-white/5 border-white/10" {...register('phone')} value={phoneValue || ''} onChange={handlePhoneChange} />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="cpf_cnpj" className="text-xs">{regionValue === 'USA' ? 'SSN' : 'CPF/CNPJ'}</Label>
                <Input id="cpf_cnpj" className="h-9 bg-white/5 border-white/10" {...register('cpf_cnpj')} value={cpfCnpjValue || ''} onChange={handleDocumentChange} />
            </div>
        </div>
        {(errors.phone || errors.cpf_cnpj) && <p className="text-red-400 text-[10px]">Verifique telefone e documento.</p>}

        <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
                <Label htmlFor="password-signup" className="text-xs">Senha</Label>
                <Input id="password-signup" type="password" className="h-9 bg-white/5 border-white/10" {...register('password')} />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs">Confirmar</Label>
                <Input id="confirmPassword" type="password" className="h-9 bg-white/5 border-white/10" {...register('confirmPassword')} />
            </div>
        </div>
        {(errors.password || errors.confirmPassword) && <p className="text-red-400 text-[10px]">Senhas inválidas ou não conferem.</p>}

        <div className="flex items-start space-x-2 py-2 bg-black/10 p-2 rounded-md border border-white/5">
            <Checkbox 
                id="privacy" 
                checked={privacyAcceptedValue}
                onCheckedChange={(checked) => setValue('privacyAccepted', checked === true, { shouldValidate: true })}
                className="mt-0.5"
            />
            <div className="grid gap-1.5 leading-none">
                <Label htmlFor="privacy" className="text-xs font-normal leading-snug text-muted-foreground cursor-pointer">
                    Li e concordo com a <Link to="/privacy-policy" target="_blank" className="text-primary hover:underline font-medium">Política de Privacidade</Link> e o tratamento dos meus dados (LGPD/GDPR).
                </Label>
                {errors.privacyAccepted && <p className="text-red-400 text-[10px]">{errors.privacyAccepted.message}</p>}
            </div>
        </div>
      </div>

      <Button type="submit" className="w-full h-10 mt-2" disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
        {regionValue === 'USA' ? 'Register' : 'Cadastrar'}
      </Button>
    </motion.form>
  );
};

export default SignUpForm;