import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Check, ArrowRight, AlertTriangle, Layers, Calendar, User, Phone, Mail, MapPin } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { motion } from 'framer-motion';

export const MergeCustomersInterface = ({ duplicateGroup, onMerge, onCancel, isMerging }) => {
    // Determine the "best" primary candidate initially (most data, oldest, or manually specified)
    // Here we default to the first one passed, which is usually the oldest in our logic
    const [primaryId, setPrimaryId] = useState(duplicateGroup[0]?.id);
    
    // State to track which value is selected for each field
    // keys: field names, values: the actual value selected
    const [fieldSelections, setFieldSelections] = useState({});

    // Define mergeable fields
    const fields = [
        { key: 'name', label: 'Nome Completo', icon: User },
        { key: 'cpf_cnpj', label: 'CPF/CNPJ', icon: User },
        { key: 'email', label: 'Email', icon: Mail },
        { key: 'phone', label: 'Telefone', icon: Phone },
        { key: 'address', label: 'Endereço', icon: MapPin },
        { key: 'company', label: 'Empresa', icon: Layers },
        { key: 'position', label: 'Cargo', icon: Layers },
        { key: 'birth_date', label: 'Data Nasc.', icon: Calendar },
        { key: 'zip_code', label: 'CEP', icon: MapPin },
        { key: 'address_number', label: 'Número', icon: MapPin },
        { key: 'address_neighborhood', label: 'Bairro', icon: MapPin },
        { key: 'address_city', label: 'Cidade', icon: MapPin },
    ];

    // Initialize selections when primaryId changes or on load
    useMemo(() => {
        const primary = duplicateGroup.find(c => c.id === primaryId) || duplicateGroup[0];
        const newSelections = { ...fieldSelections };
        
        fields.forEach(field => {
            // Default to primary's value if not already set, or if current selection is invalid
            if (newSelections[field.key] === undefined) {
                 newSelections[field.key] = primary[field.key];
            }
        });
        setFieldSelections(newSelections);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [primaryId, duplicateGroup]);

    const handleFieldSelect = (key, value) => {
        setFieldSelections(prev => ({ ...prev, [key]: value }));
    };

    const handleConfirm = () => {
        const duplicates = duplicateGroup.filter(c => c.id !== primaryId).map(c => c.id);
        onMerge(primaryId, duplicates, fieldSelections);
    };

    return (
        <div className="flex flex-col h-[600px] w-full max-w-5xl mx-auto bg-background rounded-lg border border-border shadow-xl overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/10 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Layers className="w-5 h-5 text-amber-500" />
                        Mesclar Clientes
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Selecione o registro principal e escolha os melhores dados de cada duplicata.
                    </p>
                </div>
                <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10">
                    {duplicateGroup.length} Registros Encontrados
                </Badge>
            </div>

            <ScrollArea className="flex-1 p-6">
                <div className="min-w-[800px]"> {/* Ensure table doesn't squish */}
                    {/* Header Row - Selecting Primary */}
                    <div className="grid grid-flow-col auto-cols-fr gap-4 mb-6 sticky top-0 bg-background z-10 py-2 border-b">
                        <div className="w-48 flex items-center font-semibold text-muted-foreground">
                            Definir Principal:
                        </div>
                        {duplicateGroup.map((customer, idx) => (
                            <div 
                                key={customer.id} 
                                onClick={() => setPrimaryId(customer.id)}
                                className={`
                                    p-4 rounded-lg border-2 cursor-pointer transition-all relative
                                    ${primaryId === customer.id 
                                        ? 'border-primary bg-primary/5 shadow-md' 
                                        : 'border-border hover:border-primary/50'
                                    }
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-sm truncate max-w-[120px]" title={customer.name}>
                                        {customer.name}
                                    </span>
                                    {primaryId === customer.id && <Badge className="bg-primary text-primary-foreground text-[10px]">Principal</Badge>}
                                </div>
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <p>ID: ...{customer.id.slice(-4)}</p>
                                    <p>Criado: {formatDate(customer.created_at)}</p>
                                </div>
                                {primaryId === customer.id && (
                                    <div className="absolute -top-3 -right-3 bg-primary text-white rounded-full p-1 shadow-sm">
                                        <Check className="w-3 h-3" />
                                    </div>
                                )}
                            </div>
                        ))}
                        <div className="w-64 p-4 font-bold text-center border-l-2 border-dashed border-border flex items-center justify-center bg-muted/5">
                             Resultado Final
                        </div>
                    </div>

                    {/* Data Fields Rows */}
                    <div className="space-y-2">
                        {fields.map((field) => (
                            <div key={field.key} className="grid grid-flow-col auto-cols-fr gap-4 items-center hover:bg-muted/5 rounded-md p-2 transition-colors">
                                <div className="w-48 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <field.icon className="w-4 h-4 opacity-70" />
                                    {field.label}
                                </div>
                                
                                {duplicateGroup.map((customer) => {
                                    const value = customer[field.key];
                                    const isSelected = fieldSelections[field.key] === value;
                                    const isEmpty = !value || value === '';

                                    return (
                                        <div 
                                            key={`${customer.id}-${field.key}`}
                                            onClick={() => !isEmpty && handleFieldSelect(field.key, value)}
                                            className={`
                                                p-3 rounded border text-sm cursor-pointer relative min-h-[44px] flex items-center break-words
                                                ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/10'}
                                                ${isEmpty ? 'opacity-50 cursor-not-allowed bg-muted/20' : ''}
                                            `}
                                        >
                                            {isEmpty ? (
                                                <span className="text-muted-foreground italic text-xs">Vazio</span>
                                            ) : (
                                                <span className="line-clamp-2" title={value}>{value}</span>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Final Result Column */}
                                <div className="w-64 p-3 rounded border border-dashed border-primary/30 bg-primary/5 text-sm font-medium flex items-center min-h-[44px] break-words">
                                    {fieldSelections[field.key] || <span className="text-muted-foreground italic text-xs">Vazio</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </ScrollArea>

            <div className="p-6 border-t border-border bg-muted/10 flex justify-between items-center">
                <div className="flex items-center gap-2 text-amber-500 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Esta ação não pode ser desfeita. Duplicatas serão removidas.</span>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onCancel} disabled={isMerging}>Cancelar</Button>
                    <Button onClick={handleConfirm} disabled={isMerging} className="bg-primary hover:bg-primary/90">
                        {isMerging ? (
                            <>Merging...</>
                        ) : (
                            <>
                                Mesclar e Salvar <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};