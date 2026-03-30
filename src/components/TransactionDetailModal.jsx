import React from 'react';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { Badge } from '@/components/ui/badge';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { AlertTriangle, CheckCircle, Clock, Copy, CreditCard, DollarSign, Hash, HelpCircle, Loader2, RefreshCw, XCircle, Coins, Gift } from 'lucide-react';
    import { formatCurrency, formatDate, getStatusBadge as getStatusBadgeUtil } from '@/lib/utils';
    import { toast } from '@/components/ui/use-toast';

    const TransactionDetailModal = ({ isOpen, onClose, transaction, onVerifyStatus, isVerifying }) => {
      if (!transaction) return null;

      const handleCopy = (text, fieldName) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copiado!', description: `${fieldName} copiado para a área de transferência.` });
      };

      const getStatusIcon = () => {
        switch (transaction.status) {
          case 'completed':
            return <CheckCircle className="w-5 h-5 text-green-500" />;
          case 'pending':
            return <Clock className="w-5 h-5 text-yellow-500" />;
          case 'failed':
          case 'cancelled':
            return <XCircle className="w-5 h-5 text-red-500" />;
          default:
            return <HelpCircle className="w-5 h-5 text-gray-500" />;
        }
      };
      
      const getStatusBadge = (status, className) => {
        let variant = "default";
        let text = status;
        switch (status) {
          case 'completed': variant = 'success'; text = 'Concluído'; break;
          case 'pending': variant = 'warning'; text = 'Pendente'; break;
          case 'failed': variant = 'destructive'; text = 'Falhou'; break;
          case 'cancelled': variant = 'destructive'; text = 'Cancelado'; break;
          default: text = status.charAt(0).toUpperCase() + status.slice(1); break;
        }
        return <Badge variant={variant} className={className}>{text}</Badge>;
      };


      const pixQrCodeBase64 = transaction.transactionData?.pixQrCode;
      const pixCopyPaste = transaction.transactionData?.pixCopyPaste;

      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-lg card-gradient backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-gradient flex items-center">
                <CreditCard className="w-6 h-6 mr-2" />
                Detalhes da Transação
              </DialogTitle>
              <DialogDescription>
                Informações detalhadas sobre o pagamento selecionado.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
                <div className="flex items-center space-x-3">
                  {getStatusIcon()}
                  <span className="font-medium text-lg">Status:</span>
                </div>
                {getStatusBadge(transaction.status, "text-lg px-3 py-1")}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <InfoItem icon={<DollarSign />} label="Valor:" value={formatCurrency(transaction.amount)} />
                <InfoItem icon={<Clock />} label="Data:" value={formatDate(transaction.date)} />
                <InfoItem icon={<CreditCard />} label="Método:" value={transaction.method === 'pix' ? 'PIX' : transaction.method} />
                {transaction.status === 'completed' && (
                  <>
                    <InfoItem icon={<Gift />} label="Pontos Gerados:" value={`${(transaction.points_earned || 0).toFixed(0)} PONTOS`} valueClass="text-primary font-semibold" />
                    <InfoItem icon={<Coins />} label="Tokens Gerados:" value={`${(transaction.tokens_earned || 0).toFixed(4)} TOKENS`} valueClass="text-accent font-semibold" />
                  </>
                )}
                {transaction.asaasPaymentId && (
                  <InfoItemCopyable icon={<Hash />} label="ID Asaas:" value={transaction.asaasPaymentId} onCopy={handleCopy} />
                )}
                <InfoItemCopyable icon={<Hash />} label="ID Interno:" value={transaction.id} onCopy={handleCopy} />
              </div>

              {transaction.status === 'pending' && pixQrCodeBase64 && (
                <div className="mt-4 p-4 border border-primary/30 rounded-lg bg-primary/5 space-y-3">
                  <h3 className="text-md font-semibold text-primary flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Pagamento Pendente - Finalize seu PIX
                  </h3>
                  <div className="flex flex-col items-center space-y-2">
                    <p className="text-xs text-muted-foreground text-center">
                      Escaneie o QR Code abaixo com o app do seu banco:
                    </p>
                    <div className="p-1 bg-white rounded-md inline-block">
                      <img-replace src={`data:image/png;base64,${pixQrCodeBase64}`} alt="PIX QR Code" class="w-36 h-36" />
                    </div>
                  </div>
                  {pixCopyPaste && (
                    <div className="space-y-1">
                      <Label htmlFor="pix-copy-paste-modal" className="text-xs">Ou copie o código PIX:</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="pix-copy-paste-modal"
                          readOnly
                          value={pixCopyPaste}
                          className="bg-background/70 text-xs h-8"
                        />
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleCopy(pixCopyPaste, "Código PIX")}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            <DialogFooter className="sm:justify-between gap-2">
              {transaction.status === 'pending' && onVerifyStatus && (
                <Button
                  variant="secondary"
                  onClick={() => onVerifyStatus(transaction.id, transaction.asaasPaymentId)}
                  disabled={isVerifying}
                  className="w-full sm:w-auto"
                >
                  {isVerifying ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Verificar Status Agora
                </Button>
              )}
              <Button onClick={onClose} variant="outline" className="w-full sm:w-auto">Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    };

    const InfoItem = ({ icon, label, value, valueClass = "text-foreground" }) => (
      <div className="flex items-start space-x-2 p-2 bg-background/30 rounded-md">
        <span className="text-primary mt-0.5">{React.cloneElement(icon, { className: "w-4 h-4" })}</span>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`font-medium text-sm ${valueClass}`}>{value}</p>
        </div>
      </div>
    );

    const InfoItemCopyable = ({ icon, label, value, onCopy }) => (
     <div className="flex items-start space-x-2 p-2 bg-background/30 rounded-md">
        <span className="text-primary mt-0.5">{React.cloneElement(icon, { className: "w-4 h-4" })}</span>
        <div className="flex-grow">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-medium text-sm text-foreground break-all">{value}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onCopy(value, label)}>
          <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
        </Button>
      </div>
    );


    export default TransactionDetailModal;