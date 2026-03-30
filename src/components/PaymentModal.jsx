import React, { useState, useEffect } from 'react';
    import { motion, AnimatePresence } from 'framer-motion';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { toast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/supabaseClient';
    import { X, QrCode, Copy, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';

    const PaymentModal = ({ isOpen, onClose, user }) => {
      const [amount, setAmount] = useState('');
      const [cpfCnpj, setCpfCnpj] = useState('');
      const [isLoading, setIsLoading] = useState(false);
      const [pixData, setPixData] = useState(null);
      const [error, setError] = useState(null);
      const [paymentStatus, setPaymentStatus] = useState('idle'); 

      useEffect(() => {
        if (isOpen) {
          const initialCpfCnpjFromUser = user?.cpf_cnpj ? String(user.cpf_cnpj).replace(/\D/g, '') : '';
          setCpfCnpj(initialCpfCnpjFromUser); 
          setAmount('');
          setPixData(null);
          setError(null);
          setIsLoading(false);
          setPaymentStatus('idle');
        }
      }, [isOpen, user]);

      const handleGeneratePix = async (e) => {
        e.preventDefault();
        if (!user) {
            toast({title: "Usuário não encontrado", description: "Por favor, faça login novamente.", variant: "destructive"});
            return;
        }
        if (!amount || parseFloat(amount) <= 0) {
          toast({ title: 'Valor inválido', description: 'Por favor, insira um valor maior que zero.', variant: 'destructive' });
          return;
        }
        
        const cleanedCpfCnpj = String(cpfCnpj).replace(/\D/g, '');

        if (!cleanedCpfCnpj || !validateCpfCnpj(cleanedCpfCnpj)) {
          toast({ title: 'CPF/CNPJ inválido', description: 'Por favor, insira um CPF ou CNPJ válido (apenas números).', variant: 'destructive' });
          return;
        }

        setIsLoading(true);
        setError(null);
        setPixData(null);
        setPaymentStatus('loading');

        try {
          console.log("PaymentModal: Invoking create-asaas-pix-charge with payload:", JSON.stringify({
            amount: parseFloat(amount),
            userIdAuth: user.id,
            customerName: user.name || user.email,
            customerEmail: user.email,
            customerCpfCnpj: cleanedCpfCnpj, 
            description: `Pagamento MCX Group - Distribuidor ${user.name || user.email}`,
            orderId: `MCX_${user.id}_${Date.now()}`
          }));

          const { data, error: functionError } = await supabase.functions.invoke('create-asaas-pix-charge', {
            body: JSON.stringify({
              amount: parseFloat(amount),
              userIdAuth: user.id,
              customerName: user.name || user.email,
              customerEmail: user.email,
              customerCpfCnpj: cleanedCpfCnpj, 
              description: `Pagamento MCX Group - Distribuidor ${user.name || user.email}`,
              orderId: `MCX_${user.id}_${Date.now()}`
            }),
          });

          console.log("PaymentModal: Raw response from create-asaas-pix-charge function:", { data, functionError });

          if (functionError) {
            console.error('PaymentModal: Supabase function invocation error:', functionError);
            let detailedErrorMessage = "Erro ao comunicar com o serviço de pagamento.";
            if (functionError.message && functionError.message.includes("Failed to fetch") || (functionError.message && functionError.message.includes("network error"))) {
                detailedErrorMessage = "Falha na rede ao tentar gerar PIX. Verifique sua conexão e tente novamente.";
            } else if (functionError.context && functionError.context.details) {
                detailedErrorMessage = functionError.context.details;
            } else if (typeof functionError.message === 'string') {
                detailedErrorMessage = functionError.message;
            }
            
            throw new Error(detailedErrorMessage);
          }
          
          if (data && (data.error || (data.errors && data.errors.length > 0))) {
            const errorMsg = data.details || (data.errors ? data.errors.map(e => e.description).join(', ') : 'Erro ao gerar PIX no Asaas. Resposta da função continha erro.');
            console.error("PaymentModal: Function returned error object in data:", data);
            throw new Error(errorMsg);
          }

          if (!data || !data.asaasPaymentId || !data.pixQrCode || !data.pixCopyPaste || !data.paymentId) {
            console.error("PaymentModal: Unexpected response structure from function. Missing required fields. Data received:", data);
            throw new Error('Resposta inesperada do servidor ao gerar PIX. Tente novamente.');
          }
          
          setPixData({
            qrCode: data.pixQrCode,
            copyPaste: data.pixCopyPaste,
            paymentId: data.paymentId, 
            asaasPaymentId: data.asaasPaymentId
          });
          setPaymentStatus('pix_generated');
          toast({ title: 'PIX Gerado!', description: 'Escaneie o QR Code ou copie o código para pagar.' });

        } catch (err) {
          console.error('PaymentModal: Error generating PIX:', err);
          const displayError = err.message || 'Ocorreu um erro ao gerar o PIX. Tente novamente.';
          setError(displayError);
          setPaymentStatus('error');
          toast({ title: 'Erro ao gerar PIX', description: displayError, variant: 'destructive' });
        } finally {
          setIsLoading(false);
        }
      };

      const validateCpfCnpj = (value) => {
        const cleanValue = String(value).replace(/\D/g, '');
        return cleanValue.length === 11 || cleanValue.length === 14;
      };

      const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copiado!', description: 'Código PIX copiado para a área de transferência.' });
      };

      const handleCpfCnpjChange = (e) => {
        const rawValue = e.target.value;
        const onlyNumbers = String(rawValue).replace(/\D/g, '');
        
        if (onlyNumbers.length > 14) {
          setCpfCnpj(formatCpfCnpj(onlyNumbers.substring(0, 14)));
        } else {
          setCpfCnpj(formatCpfCnpj(onlyNumbers));
        }
      };

      const formatCpfCnpj = (value = "") => {
        const cleanValue = String(value).replace(/\D/g, '');
        if (!cleanValue) return ''; 

        if (cleanValue.length <= 11) { 
          return cleanValue
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else { 
          return cleanValue
            .substring(0, 14) 
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2');
        }
      };
      
      const displayCpfCnpj = () => {
        const cleanValue = String(cpfCnpj).replace(/\D/g, '');
        return formatCpfCnpj(cleanValue);
      };


      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-md card-gradient backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-gradient">Realizar Pagamento PIX</DialogTitle>
              <DialogDescription>
                Insira o valor e seu CPF/CNPJ para gerar o código PIX.
              </DialogDescription>
            </DialogHeader>

            <AnimatePresence mode="wait">
              {paymentStatus === 'pix_generated' && pixData ? (
                <motion.div
                  key="pix-display"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4 py-4"
                >
                  <div className="flex flex-col items-center space-y-3">
                    <p className="text-sm text-muted-foreground text-center">
                      Escaneie o QR Code abaixo com o app do seu banco:
                    </p>
                    <div className="p-2 bg-white rounded-lg inline-block">
                      {pixData.qrCode && (
                        <img src={`data:image/png;base64,${pixData.qrCode}`} alt="PIX QR Code" className="w-48 h-48" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pix-copy-paste">Ou copie o código PIX:</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="pix-copy-paste"
                        readOnly
                        value={pixData.copyPaste}
                        className="bg-background/70"
                      />
                      <Button variant="outline" size="icon" onClick={() => handleCopy(pixData.copyPaste)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-center text-sm text-muted-foreground p-3 bg-primary/10 rounded-md border border-primary/30">
                    <CheckCircle className="w-5 h-5 inline mr-2 text-primary" />
                    Após o pagamento, seus pontos e tokens serão creditados automaticamente. Você pode fechar esta janela.
                  </div>
                   <Button onClick={onClose} className="w-full">Fechar</Button>
                </motion.div>
              ) : (
                <motion.form
                  key="payment-form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  onSubmit={handleGeneratePix}
                  className="space-y-4 py-4"
                >
                  <div>
                    <Label htmlFor="amount">Valor (R$)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Ex: 5000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="1"
                      step="any"
                      required
                      className="bg-background/50"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                    <Input
                      id="cpfCnpj"
                      type="text"
                      placeholder="Seu CPF ou CNPJ"
                      value={displayCpfCnpj()}
                      onChange={handleCpfCnpjChange}
                      required
                      className="bg-background/50"
                      disabled={isLoading}
                      maxLength={18} 
                    />
                  </div>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-500 bg-red-500/10 p-3 rounded-md flex items-center"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      {error}
                    </motion.div>
                  )}
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90"
                      disabled={isLoading || !user}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando PIX...
                        </>
                      ) : (
                        'Gerar PIX'
                      )}
                    </Button>
                  </DialogFooter>
                </motion.form>
              )}
            </AnimatePresence>
          </DialogContent>
        </Dialog>
      );
    };

    export default PaymentModal;