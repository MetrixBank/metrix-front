import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, Save, PlusCircle, MinusCircle, Calculator, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDataSync } from '@/contexts/DataSyncContext';
import { formatCurrency } from '@/lib/utils';
import { DatePicker } from '@/components/ui/date-picker';
import { Helmet } from 'react-helmet-async';

// --- AUTOMATIC CALCULATION CONSTANTS ---
const STANDARD_MONTHLY_INTEREST_RATE = 4.8; // 4.8% Monthly
const IOF_RATE_ESTIMATE = 0.02; // 2% Flat rate on Principal
const BOLETO_FEE_PER_INSTALLMENT = 2.99; // R$ 2.99 per boleto

const productSchema = z.object({
    name: z.string().min(1, "Nome do produto é obrigatório"),
    quantity: z.number().min(1, "Quantidade deve ser no mínimo 1"),
    price: z.number().min(0.01, "Preço deve ser maior que zero"),
});

const proposalSchema = z.object({
    customer_name: z.string().min(3, "Nome do cliente é obrigatório"),
    customer_cpf_cnpj: z.string().optional(),
    customer_phone: z.string().optional(),
    customer_email: z.string().email("Email inválido").optional().or(z.literal('')),
    customer_cep: z.string().optional(),
    customer_address: z.string().optional(),
    customer_address_number: z.string().optional(),
    customer_address_complement: z.string().optional(),
    products_data: z.array(productSchema).min(1, "Adicione pelo menos um produto"),
    
    // Financials
    total_value: z.number().min(0), 
    upfront_payment: z.number().min(0, "Entrada é obrigatória"),
    installments: z.number().min(1, "Pelo menos uma parcela é necessária"),
    first_payment_due_date: z.date({ required_error: "Data do primeiro vencimento é obrigatória." }),
    
    // Hidden fields but kept for schema validation
    additional_fees: z.number().optional(),
    interest_rate: z.number().optional(),
});

const ProposalForm = ({ user, onBack, existingProposal, isViewMode }) => {
    const { toast } = useToast();
    const { triggerSync } = useDataSync();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cepLoading, setCepLoading] = useState(false);
    const [calculatedInstallment, setCalculatedInstallment] = useState(0);
    const [calculationDetails, setCalculationDetails] = useState({
        principal: 0,
        iofValue: 0,
        boletoTotal: 0,
        totalFinanced: 0
    });

    const { register, handleSubmit, control, formState: { errors }, setValue, watch, reset } = useForm({
        resolver: zodResolver(proposalSchema),
        defaultValues: {
            customer_name: '',
            customer_cpf_cnpj: '',
            customer_phone: '',
            customer_email: '',
            customer_cep: '',
            customer_address: '',
            customer_address_number: '',
            customer_address_complement: '',
            products_data: [{ name: '', quantity: 1, price: 0 }],
            total_value: 0,
            upfront_payment: 0,
            installments: 1,
            first_payment_due_date: new Date(),
        }
    });

    const products = watch('products_data');
    const upfrontPayment = watch('upfront_payment');
    const installments = watch('installments');
    const totalValue = watch('total_value');

    // Initialize form with existing data
    useEffect(() => {
        if (existingProposal) {
            // Filter out fee items to prevent duplication in UI list
            const cleanProducts = (existingProposal.products_data || []).filter(p => !p.is_fee);
            
            reset({
                ...existingProposal,
                total_value: Number(existingProposal.total_value),
                upfront_payment: Number(existingProposal.upfront_payment),
                first_payment_due_date: existingProposal.first_payment_due_date ? new Date(existingProposal.first_payment_due_date) : new Date(),
                products_data: cleanProducts.length > 0 ? cleanProducts : [{ name: '', quantity: 1, price: 0 }],
            });
        }
    }, [existingProposal, reset]);

    // Calculate Total Value from Products
    useEffect(() => {
        const total = products.reduce((acc, product) => acc + (product.quantity * product.price), 0);
        setValue('total_value', total);
    }, [products, setValue]);

    // --- AUTOMATIC INSTALLMENT CALCULATION ---
    useEffect(() => {
        const productTotal = Number(totalValue) || 0;
        const downPayment = Number(upfrontPayment) || 0;
        const numberOfInstallments = Number(installments) || 1;

        // 1. Calculate Net Principal to Finance (Base Calculation)
        let principal = productTotal - downPayment;
        if (principal < 0) principal = 0;

        // 2. Calculate Automatic Fees (Based on Net Principal)
        const iofValue = principal * IOF_RATE_ESTIMATE; // 2% of Net Principal
        const boletoTotalCost = BOLETO_FEE_PER_INSTALLMENT * numberOfInstallments; // 2.99 * Installments

        // 3. Total Amount to be Financed (Principal + Fees)
        const totalFinanced = principal + iofValue + boletoTotalCost;

        // 4. Calculate Installment using PMT Formula
        const rate = STANDARD_MONTHLY_INTEREST_RATE / 100;
        
        let installmentVal = 0;

        if (principal <= 0) {
            installmentVal = 0;
        } else if (rate === 0) {
            installmentVal = totalFinanced / numberOfInstallments;
        } else {
            // PMT Formula: P * (r * (1+r)^n) / ((1+r)^n - 1)
            installmentVal = totalFinanced * (rate * Math.pow(1 + rate, numberOfInstallments)) / (Math.pow(1 + rate, numberOfInstallments) - 1);
        }

        setCalculatedInstallment(installmentVal);
        setCalculationDetails({
            principal,
            iofValue,
            boletoTotal: boletoTotalCost,
            totalFinanced
        });

    }, [totalValue, upfrontPayment, installments]);

    const handleCepSearch = useCallback(async (cep) => {
        if (cep.length !== 8) return;
        setCepLoading(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            if (!data.erro) {
                setValue('customer_address', `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`);
            } else {
                toast({ title: "CEP não encontrado", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Erro ao buscar CEP", description: error.message, variant: "destructive" });
        } finally {
            setCepLoading(false);
        }
    }, [setValue, toast]);

    const addProduct = () => {
        setValue('products_data', [...products, { name: '', quantity: 1, price: 0 }]);
    };

    const removeProduct = (index) => {
        if (products.length > 1) {
            const newProducts = products.filter((_, i) => i !== index);
            setValue('products_data', newProducts);
        }
    };

    const updateProduct = (index, field, value) => {
        const newProducts = [...products];
        const parsedValue = (field === 'quantity' || field === 'price') ? parseFloat(value) || 0 : value;
        newProducts[index][field] = parsedValue;
        setValue('products_data', newProducts);
    };

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            // Automatically embed the calculated fees into the saved data
            const calculatedFeesTotal = calculationDetails.iofValue + calculationDetails.boletoTotal;

            // Ensure we don't double-add fees if they somehow exist (though UI filters them)
            const cleanProducts = data.products_data.filter(p => !p.is_fee);

            const proposalData = {
                ...data,
                distributor_id: user.id,
                status: existingProposal ? existingProposal.status : 'pending',
                total_value: Number(data.total_value),
                upfront_payment: Number(data.upfront_payment),
                installments: Number(data.installments),
                interest_rate: STANDARD_MONTHLY_INTEREST_RATE,
                first_payment_due_date: data.first_payment_due_date.toISOString().split('T')[0],
                products_data: [
                    ...cleanProducts,
                    // Embed fees as metadata
                    { 
                        name: 'Encargos Financeiros (IOF + Boletos)', 
                        quantity: 1, 
                        price: Number(calculatedFeesTotal.toFixed(2)), 
                        is_fee: true 
                    }
                ]
            };

            let result;
            if (existingProposal) {
                result = await supabase.from('fnx_proposals').update(proposalData).eq('id', existingProposal.id).select();
            } else {
                result = await supabase.from('fnx_proposals').insert(proposalData).select();
            }

            const { error } = result;
            if (error) throw error;

            toast({
                title: `Proposta ${existingProposal ? 'atualizada' : 'criada'} com sucesso!`,
                description: "Sua proposta foi salva e está pronta para os próximos passos.",
            });
            triggerSync();
            onBack();
        } catch (error) {
            console.error(error);
            toast({
                title: `Erro ao ${existingProposal ? 'atualizar' : 'criar'} proposta`,
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formTitle = existingProposal ? "Editar Proposta" : "Criar Nova Proposta";
    const formDescription = existingProposal ? "Atualize os detalhes da proposta." : "Preencha os dados para gerar uma nova proposta.";

    return (
        <>
            <Helmet>
                <title>{formTitle} - FnX Solutions</title>
                <meta name="description" content={formDescription} />
            </Helmet>
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3 }}
            >
                <div className="mb-4">
                    <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Voltar ao Painel
                    </Button>
                </div>
                <Card className="bg-card/60 backdrop-blur-sm border-border/30 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">{formTitle}</CardTitle>
                        <CardDescription>{formDescription}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                            {/* Customer Section */}
                            <section>
                                <h3 className="text-lg font-semibold mb-4 border-b pb-2 text-primary">1. Dados do Cliente</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="customer_name">Nome Completo</Label>
                                        <Input id="customer_name" {...register('customer_name')} disabled={isViewMode} />
                                        {errors.customer_name && <p className="text-red-500 text-sm mt-1">{errors.customer_name.message}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="customer_cpf_cnpj">CPF/CNPJ</Label>
                                        <Input id="customer_cpf_cnpj" {...register('customer_cpf_cnpj')} disabled={isViewMode} />
                                    </div>
                                    <div>
                                        <Label htmlFor="customer_phone">Telefone</Label>
                                        <Input id="customer_phone" {...register('customer_phone')} disabled={isViewMode} />
                                    </div>
                                    <div>
                                        <Label htmlFor="customer_email">Email</Label>
                                        <Input id="customer_email" type="email" {...register('customer_email')} disabled={isViewMode} />
                                        {errors.customer_email && <p className="text-red-500 text-sm mt-1">{errors.customer_email.message}</p>}
                                    </div>
                                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                        <div>
                                            <Label htmlFor="customer_cep">CEP</Label>
                                            <div className="flex items-center">
                                                <Input id="customer_cep" {...register('customer_cep')} disabled={isViewMode} onChange={(e) => handleCepSearch(e.target.value.replace(/\D/g, ''))} maxLength={9} />
                                                {cepLoading && <Loader2 className="ml-2 animate-spin" />}
                                            </div>
                                        </div>
                                        <div className="md:col-span-2">
                                            <Label htmlFor="customer_address">Endereço</Label>
                                            <Input id="customer_address" {...register('customer_address')} disabled={isViewMode} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="customer_address_number">Número</Label>
                                            <Input id="customer_address_number" {...register('customer_address_number')} disabled={isViewMode} />
                                        </div>
                                        <div>
                                            <Label htmlFor="customer_address_complement">Complemento</Label>
                                            <Input id="customer_address_complement" {...register('customer_address_complement')} disabled={isViewMode} />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Products Section */}
                            <section>
                                <h3 className="text-lg font-semibold mb-4 border-b pb-2 text-primary">2. Produtos e Serviços</h3>
                                <div className="space-y-4">
                                    <AnimatePresence>
                                        {products.map((product, index) => (
                                            <motion.div
                                                key={index}
                                                className="flex flex-col md:flex-row md:items-end gap-4 p-4 bg-muted/30 rounded-lg"
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                            >
                                                <div className="flex-grow">
                                                    <Label>Descrição do Item</Label>
                                                    <Input value={product.name} onChange={(e) => updateProduct(index, 'name', e.target.value)} disabled={isViewMode} placeholder="Ex: Consultoria Financeira" />
                                                </div>
                                                <div className="w-full md:w-24">
                                                    <Label>Qtd.</Label>
                                                    <Input type="number" value={product.quantity} onChange={(e) => updateProduct(index, 'quantity', e.target.value)} disabled={isViewMode} />
                                                </div>
                                                <div className="w-full md:w-40">
                                                    <Label>Preço Unit. (R$)</Label>
                                                    <Input type="number" step="0.01" value={product.price} onChange={(e) => updateProduct(index, 'price', e.target.value)} disabled={isViewMode} />
                                                </div>
                                                {!isViewMode && (
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeProduct(index)} disabled={products.length <= 1} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                        <MinusCircle className="w-5 h-5" />
                                                    </Button>
                                                )}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                                {!isViewMode && (
                                    <Button type="button" variant="outline" onClick={addProduct} className="mt-4 border-dashed">
                                        <PlusCircle className="w-4 h-4 mr-2" /> Adicionar Item
                                    </Button>
                                )}
                                <div className="flex justify-end mt-4">
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Subtotal Produtos</p>
                                        <p className="text-xl font-bold">{formatCurrency(totalValue)}</p>
                                    </div>
                                </div>
                            </section>

                            {/* Payment & Interest Section - AUTOMATIC */}
                            <section className="bg-muted/10 p-6 rounded-xl border border-border/50">
                                <h3 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center gap-2 text-primary">
                                    <Calculator className="w-5 h-5" /> 
                                    3. Condições de Pagamento
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* Upfront Payment - User Input */}
                                    <div>
                                        <Label htmlFor="upfront_payment">Entrada (R$)</Label>
                                        <Controller
                                            name="upfront_payment"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    disabled={isViewMode}
                                                    className="border-green-500/20"
                                                />
                                            )}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">Subtraído do valor base</p>
                                    </div>

                                    {/* Installments - User Input */}
                                    <div>
                                        <Label htmlFor="installments">Número de Parcelas</Label>
                                        <Controller
                                            name="installments"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                                                    disabled={isViewMode}
                                                    min={1}
                                                    max={48}
                                                />
                                            )}
                                        />
                                    </div>

                                    <div>
                                        <Label>Vencimento da 1ª Parcela</Label>
                                        <Controller
                                            name="first_payment_due_date"
                                            control={control}
                                            render={({ field }) => (
                                                <DatePicker
                                                    date={field.value}
                                                    setDate={field.onChange}
                                                    disabled={isViewMode}
                                                />
                                            )}
                                        />
                                    </div>
                                    
                                    {/* Automated Information (Read Only) */}
                                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 bg-card/50 p-4 rounded-lg border border-dashed">
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                                                <Lock className="w-3 h-3" /> Juros Mensal
                                            </span>
                                            <span className="text-lg font-semibold">{STANDARD_MONTHLY_INTEREST_RATE}%</span>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                             <span className="text-sm text-muted-foreground flex items-center gap-2">
                                                <Lock className="w-3 h-3" /> Detalhamento
                                            </span>
                                            <span className="text-xs text-muted-foreground leading-tight mt-1">
                                                Inclui juros ({STANDARD_MONTHLY_INTEREST_RATE}% a.m), IOF ({(IOF_RATE_ESTIMATE * 100).toFixed(0)}%) e taxa de boleto (R$ {BOLETO_FEE_PER_INSTALLMENT}).
                                            </span>
                                        </div>
                                        <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                                            <Label className="text-primary">Valor da Parcela Final</Label>
                                            <p className="text-2xl font-bold text-primary mt-1">
                                                {formatCurrency(calculatedInstallment)}
                                            </p>
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                Total a Pagar: {formatCurrency(Number(upfrontPayment) + (calculatedInstallment * Number(installments)))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {!isViewMode && (
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={isSubmitting} className="shiny-button w-full md:w-auto min-w-[200px]">
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        {existingProposal ? 'Salvar Alterações' : 'Enviar Proposta para Análise'}
                                    </Button>
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </>
    );
};

export default ProposalForm;