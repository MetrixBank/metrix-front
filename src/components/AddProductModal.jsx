import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { PackagePlus, Tag, DollarSign, FileText, Layers, AlertTriangle, Edit3 } from 'lucide-react';
import { useDataSync } from '@/contexts/DataSyncContext';

const AddProductModal = ({ isOpen, onClose, productData, user }) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [quantityInStock, setQuantityInStock] = useState('0');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { triggerSync } = useDataSync();

  useEffect(() => {
    if (isOpen) {
      if (productData && productData.id) {
        setIsEditing(true);
        setName(productData.name || '');
        setSku(productData.sku || '');
        setDescription(productData.description || '');
        setCostPrice(productData.cost_price?.toString() || '');
        setSalePrice(productData.sale_price?.toString() || '');
        setQuantityInStock(productData.quantity_in_stock?.toString() || '0');
        setLowStockThreshold(productData.low_stock_threshold?.toString() || '10');
      } else {
        setIsEditing(false); setName(''); setSku(''); setDescription('');
        setCostPrice(''); setSalePrice(''); setQuantityInStock('0');
        setLowStockThreshold('10');
      }
    }
  }, [isOpen, productData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const parsedCostPrice = parseFloat(costPrice);
    const parsedSalePrice = parseFloat(salePrice);
    const parsedQuantityInStock = parseInt(quantityInStock, 10);
    const parsedLowStockThreshold = parseInt(lowStockThreshold, 10);

    if (isNaN(parsedCostPrice) || isNaN(parsedSalePrice) || isNaN(parsedQuantityInStock) || isNaN(parsedLowStockThreshold) || parsedCostPrice < 0 || parsedSalePrice < 0 || parsedQuantityInStock < 0 || parsedLowStockThreshold < 0) {
        toast({ title: 'Valores Inválidos', description: 'Preços e quantidades devem ser números positivos.', variant: 'destructive'});
        setIsSubmitting(false);
        return;
    }

    const productPayload = { 
      name, sku, description, 
      cost_price: parsedCostPrice, 
      sale_price: parsedSalePrice,
      quantity_in_stock: parsedQuantityInStock,
      low_stock_threshold: parsedLowStockThreshold,
      updated_at: new Date().toISOString(),
    };

    try {
      let error;
      if (isEditing && productData?.id) {
        ({ error } = await supabase.from('products').update(productPayload).eq('id', productData.id));
      } else {
        productPayload.created_at = new Date().toISOString();
        productPayload.distributor_id = user.id;
        ({ error } = await supabase.from('products').insert([productPayload]));
      }

      if (error) {
        throw new Error(error.code === '23505' && error.message.includes('sku') ? 'Já existe um produto com este SKU.' : error.message);
      }
      
      toast({ title: isEditing ? 'Produto Atualizado!' : 'Produto Adicionado!', description: `${name} foi salvo com sucesso.` });
      triggerSync();
      onClose();
    } catch (error) {
      toast({ title: `Erro ao Salvar Produto`, description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg card-gradient border-border/50">
        <DialogHeader>
          <DialogTitle className="text-gradient flex items-center text-xl">
            {isEditing ? <Edit3 className="mr-2" /> : <PackagePlus className="mr-2" />} 
            {isEditing ? 'Editar Item do Arsenal' : 'Novo Item para o Arsenal'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize as informações do item.' : 'Preencha os detalhes para adicionar um novo item ao seu arsenal.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
          <div>
            <Label htmlFor="productName" className="flex items-center"><Tag className="w-4 h-4 mr-1.5 text-primary"/>Nome do Produto</Label>
            <Input id="productName" value={name} onChange={(e) => setName(e.target.value)} required className="bg-background/70"/>
          </div>
          <div>
            <Label htmlFor="productSku" className="flex items-center"><FileText className="w-4 h-4 mr-1.5 text-primary"/>SKU (Código Único)</Label>
            <Input id="productSku" value={sku} onChange={(e) => setSku(e.target.value)} required placeholder="Ex: PROD001" className="bg-background/70"/>
          </div>
          <div>
            <Label htmlFor="productDescription" className="flex items-center"><FileText className="w-4 h-4 mr-1.5 text-primary"/>Descrição</Label>
            <Textarea id="productDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes do item..." className="bg-background/70"/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="costPrice" className="flex items-center"><DollarSign className="w-4 h-4 mr-1.5 text-primary"/>Preço de Custo (R$)</Label>
              <Input id="costPrice" type="number" step="0.01" min="0" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} required className="bg-background/70"/>
            </div>
            <div>
              <Label htmlFor="salePrice" className="flex items-center"><DollarSign className="w-4 h-4 mr-1.5 text-primary"/>Preço de Venda (R$)</Label>
              <Input id="salePrice" type="number" step="0.01" min="0" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} required className="bg-background/70"/>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantityInStock" className="flex items-center"><Layers className="w-4 h-4 mr-1.5 text-primary"/>Quantidade em Estoque</Label>
              <Input id="quantityInStock" type="number" min="0" value={quantityInStock} onChange={(e) => setQuantityInStock(e.target.value)} required className="bg-background/70"/>
            </div>
            <div>
              <Label htmlFor="lowStockThreshold" className="flex items-center"><AlertTriangle className="w-4 h-4 mr-1.5 text-primary"/>Alerta Estoque Baixo</Label>
              <Input id="lowStockThreshold" type="number" min="0" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} required className="bg-background/70"/>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 text-white">
              {isSubmitting ? 'Salvando...' : 'Salvar Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
export default AddProductModal;