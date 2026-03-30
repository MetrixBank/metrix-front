import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Save, User, Edit3, Camera, Loader2, AlertTriangle, KeyRound, CreditCard, Sparkles, ExternalLink, XCircle, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { formatCpfCnpj as formatCpfCnpjUtil, formatSSN } from '@/lib/utils';
import { useLocalization } from '@/contexts/LocalizationContext';
import { useSubscription } from '@/hooks/useSubscription';
import { createCheckoutSession, getStripeCustomerPortalUrl, cancelSubscriptionInStripe } from '@/lib/stripe-utils';
import SubscriptionStatusBadge from '@/components/subscription/SubscriptionStatusBadge';
import PremiumUpgradeModal from '@/components/subscription/PremiumUpgradeModal';
import { Badge } from '@/components/ui/badge';
import DashboardHeader from '@/components/DashboardHeader'; 

const UserProfilePage = () => { 
  const { user, handleProfileUpdate } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { region } = useLocalization();
  const { isPremium, subscription, loading: subLoading, refreshSubscription } = useSubscription();
  const isUSA = region === 'USA';

  const [formData, setFormData] = useState({
    name: '',
    cpf_cnpj: '',
    distributor_code: ''
  });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const fileInputRef = useRef(null);
  
  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';

  const formatIdentity = (value) => {
    if (isUSA) return formatSSN(value);
    return formatCpfCnpjUtil(value);
  };

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        cpf_cnpj: formatIdentity(user.cpf_cnpj || ''),
        distributor_code: user.distributor_code || ''
      });
      if (user.avatar_url) {
        setAvatarUrl(user.avatar_url);
      } else {
        setAvatarUrl(null);
      }
      if (user.requires_password_change) {
        setShowPasswordChange(true);
        toast({
          title: "Alteração de Senha Necessária",
          description: "Por favor, crie uma nova senha para continuar.",
          variant: "destructive",
          duration: 8000
        });
      }
    }
     if(location.state?.forcePasswordChange) {
        setShowPasswordChange(true);
     }
  }, [user, location.state, isUSA]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { 
          toast({ title: "Arquivo muito grande", description: "Por favor, selecione uma imagem menor que 2MB.", variant: "destructive" });
          return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          toast({ title: "Formato inválido", description: "Apenas imagens JPG, PNG ou WEBP são permitidas.", variant: "destructive" });
          return;
      }
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file)); 
      setIsEditing(true); 
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return user.avatar_url;
    setUploading(true);

    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, {
            cacheControl: '3600',
            upsert: true,
        });

    if (uploadError) {
        setUploading(false);
        throw new Error(`Falha no upload da foto: ${uploadError.message}`);
    }
    
    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    
    setUploading(false);
    return publicUrlData.publicUrl;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
        toast({ title: "Erro", description: "O nome completo é obrigatório.", variant: "destructive" });
        return;
    }
    setLoading(true);

    try {
      const newAvatarUrl = await uploadAvatar();
      
      const profileDataToUpdate = {
          name: formData.name.trim(),
          cpf_cnpj: formData.cpf_cnpj.replace(/\D/g, ''),
          distributor_code: formData.distributor_code.trim() || null,
      };

      if (newAvatarUrl) {
        profileDataToUpdate.avatar_url = newAvatarUrl;
      }

      await handleProfileUpdate(profileDataToUpdate);
      
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso."
      });

      setAvatarFile(null);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erro ao salvar perfil",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if(newPassword.length < 6) {
        toast({ title: "Senha muito curta", description: "Sua nova senha deve ter no mínimo 6 caracteres.", variant: "destructive"});
        return;
    }
    if (newPassword !== confirmPassword) {
        toast({ title: "Senhas não coincidem", description: "Por favor, verifique se as senhas digitadas são iguais.", variant: "destructive"});
        return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
        toast({ title: "Erro ao alterar senha", description: error.message, variant: "destructive"});
    } else {
        await handleProfileUpdate({ requires_password_change: false });
        toast({ title: "Senha alterada com sucesso!", description: "Seu perfil está seguro com a nova senha."});
        setShowPasswordChange(false);
        setNewPassword('');
        setConfirmPassword('');
    }
    setLoading(false);
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    if (id === 'cpf_cnpj') {
      setFormData({ ...formData, [id]: formatIdentity(value) });
    } else {
      setFormData({ ...formData, [id]: value });
    }
    setIsEditing(true);
  };

  // Subscription Actions
  const handleSubscribe = async () => {
    setActionLoading(true);
    try {
        const result = await createCheckoutSession(user.id, user.email, 'monthly');
        if (result && result.url) {
            window.location.href = result.url;
        }
    } catch (error) {
        let msg = error.message;
        if (msg && (msg.includes("No such product") || msg.includes("No such price"))) {
            msg = "Erro de configuração do produto. Contate o suporte.";
        }
        toast({ title: "Erro ao iniciar checkout", description: msg, variant: "destructive" });
    } finally {
        setActionLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setActionLoading(true);
    try {
        const url = await getStripeCustomerPortalUrl();
        if (url) {
            window.location.href = url;
        }
    } catch (error) {
        toast({ title: "Erro ao abrir portal", description: error.message, variant: "destructive" });
    } finally {
        setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setActionLoading(true);
    try {
        await cancelSubscriptionInStripe();
        toast({ title: "Assinatura cancelada", description: "Sua assinatura foi cancelada. O acesso premium continuará até o fim do período." });
        setShowCancelDialog(false);
        refreshSubscription();
    } catch (error) {
        toast({ title: "Erro ao cancelar", description: error.message, variant: "destructive" });
    } finally {
        setActionLoading(false);
    }
  };
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        Carregando perfil...
      </div>
    );
  }
  
  const displayAvatarUrl = avatarFile ? URL.createObjectURL(avatarFile) : avatarUrl ? `${avatarUrl.split('?')[0]}?t=${new Date().getTime()}`: null;

  return (
    <>
    <Dialog open={showPasswordChange} onOpenChange={(isOpen) => { if (user.requires_password_change && !isOpen) return; setShowPasswordChange(isOpen)}}>
        <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handlePasswordChange}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/> Alteração de Senha Obrigatória</DialogTitle>
                    <DialogDescription>
                        Para garantir a segurança da sua conta, você precisa criar uma nova senha pessoal.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                         <Label htmlFor="new-password">Nova Senha</Label>
                         <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} placeholder="Mínimo 6 caracteres" />
                    </div>
                    <div className="space-y-2">
                         <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                         <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} placeholder="Repita a nova senha" />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar Nova Senha
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>

    {/* Cancel Subscription Confirmation Dialog */}
    <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Cancelar Assinatura?</DialogTitle>
                <DialogDescription>
                    Você tem certeza que deseja cancelar sua assinatura Premium? 
                    Você perderá acesso aos recursos exclusivos ao final do período atual.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Manter Assinatura</Button>
                <Button variant="destructive" onClick={handleCancelSubscription} disabled={actionLoading}>
                    {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Confirmar Cancelamento
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <PremiumUpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col bg-background" 
    >
      <DashboardHeader /> 

      <main className="flex-1 pt-20 p-3 sm:p-4 flex flex-col items-center">
        <div className="w-full max-w-xl space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground text-center sm:text-left">Minha Conta</h1>
            <p className="text-muted-foreground mt-2 text-center sm:text-left">Visualize e atualize suas informações de perfil e assinatura.</p>
        
            <Card className="card-gradient shadow-xl">
            <CardHeader>
                <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <Avatar className="w-28 h-28 border-4 border-primary/50 shadow-lg">
                    <AvatarImage src={displayAvatarUrl} alt={user.name} key={displayAvatarUrl} />
                    <AvatarFallback>
                        {getInitials(user.name) || <User className="w-12 h-12 text-muted-foreground" />}
                    </AvatarFallback>
                    </Avatar>
                    <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                    <Button variant="outline" size="icon" onClick={() => fileInputRef.current.click()} className="absolute bottom-0 right-0 rounded-full bg-background/80 hover:bg-background">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Camera className="w-4 h-4" />}
                    </Button>
                </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setShowPasswordChange(true)}>
                        <KeyRound className="w-4 h-4 mr-2" />
                        Alterar Senha
                    </Button>
                    {!isEditing && (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            <Edit3 className="w-4 h-4 mr-2" />
                            Editar Perfil
                        </Button>
                    )}
                </div>

                <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground">Email (não editável)</Label>
                <Input id="email" type="email" value={user.email || ''} readOnly className="bg-background/30 cursor-not-allowed" />
                </div>

                <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" type="text" placeholder="Seu nome completo" value={formData.name} onChange={handleInputChange} readOnly={!isEditing} className={isEditing ? "bg-background/50" : "bg-background/30 cursor-default border-transparent"} />
                </div>
                
                <div className="space-y-2">
                <Label htmlFor="cpf_cnpj">{isUSA ? 'SSN' : 'CPF/CNPJ'}</Label>
                <Input 
                    id="cpf_cnpj" 
                    type="text" 
                    placeholder={isUSA ? "XXX-XX-XXXX" : "Seu CPF ou CNPJ"} 
                    value={formData.cpf_cnpj} 
                    onChange={handleInputChange} 
                    readOnly={!isEditing} 
                    maxLength={isUSA ? 11 : 18} 
                    className={isEditing ? "bg-background/50" : "bg-background/30 cursor-default border-transparent"} 
                />
                </div>

                <div className="space-y-2">
                <Label htmlFor="distributor_code">Código de Distribuidor (D.I.)</Label>
                <Input id="distributor_code" type="text" placeholder="Seu código de distribuidor" value={formData.distributor_code} onChange={handleInputChange} readOnly={!isEditing} className={isEditing ? "bg-background/50" : "bg-background/30 cursor-default border-transparent"} />
                </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 pt-6">
                <Button variant="outline" onClick={() => navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard')} className="w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
                </Button>
                {isEditing && (
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <Button variant="ghost" onClick={() => {
                            setIsEditing(false);
                            setAvatarFile(null);
                            setFormData({ name: user.name || '', cpf_cnpj: formatIdentity(user.cpf_cnpj || ''), distributor_code: user.distributor_code || '' });
                            setAvatarUrl(user.avatar_url);
                        }} className="w-full sm:w-auto">
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveProfile} disabled={loading || uploading} className="w-full sm:w-auto">
                            {(loading || uploading) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            {(loading || uploading) ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </div>
                )}
            </CardFooter>
            </Card>

            {/* Minha Assinatura Section */}
            <Card className="shadow-lg border-l-4 border-l-violet-500 overflow-hidden relative">
                <div className="absolute inset-0 bg-violet-500/5 pointer-events-none"></div>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <CreditCard className="w-5 h-5 text-violet-500" />
                        Minha Assinatura
                    </CardTitle>
                    <CardDescription>
                        Gerencie seu plano e acesso aos recursos premium.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {subLoading ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                            <span className="ml-2 text-muted-foreground">Carregando status...</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-background/50 border border-border">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-muted-foreground">Status:</span>
                                        <Badge variant={isPremium ? "default" : "secondary"} className={isPremium ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700" : ""}>
                                            {isPremium ? (
                                                <>
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    Ativo - Premium
                                                </>
                                            ) : "Gratuito"}
                                        </Badge>
                                    </div>
                                    
                                    {isPremium && (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-muted-foreground">Plano:</span>
                                                <span className="text-sm font-semibold">Premium</span>
                                            </div>
                                            {subscription?.current_period_end && subscription.current_period_end < '2099-01-01' && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    Renova em: <span className="font-medium text-foreground">{new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                            )}
                                            {subscription?.current_period_end >= '2099-01-01' && (
                                                <div className="text-xs text-emerald-400 mt-1 font-medium">
                                                    Acesso Vitalício (Membro Fundador)
                                                </div>
                                            )}
                                        </>
                                    )}
                                    
                                    {!isPremium && (
                                        <p className="text-sm text-muted-foreground mt-1 max-w-md">
                                            Faça upgrade para acessar ferramentas exclusivas de IA, metas avançadas e mentoria.
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col w-full sm:w-auto gap-2">
                                    {!isPremium ? (
                                        <Button 
                                            onClick={handleSubscribe} 
                                            disabled={actionLoading}
                                            className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all"
                                        >
                                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                            Assinar Premium - R$ 199/mês
                                        </Button>
                                    ) : (
                                        <>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={handleManageSubscription}
                                                disabled={actionLoading || subscription?.current_period_end >= '2099-01-01'}
                                                className="w-full sm:w-auto justify-start sm:justify-center"
                                            >
                                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ExternalLink className="w-4 h-4 mr-2" />}
                                                Gerenciar no Stripe
                                            </Button>
                                            {subscription?.current_period_end < '2099-01-01' && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => setShowCancelDialog(true)}
                                                    disabled={actionLoading || subscription?.status === 'canceled'}
                                                    className="w-full sm:w-auto justify-start sm:justify-center text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    {subscription?.status === 'canceled' ? 'Cancelamento Agendado' : 'Cancelar Assinatura'}
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </main>
    </motion.div>
    </>
  );
};

export default UserProfilePage;