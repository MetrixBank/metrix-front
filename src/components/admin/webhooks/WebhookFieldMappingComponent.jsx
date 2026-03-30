import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const INTERNAL_FIELDS = [
    { value: 'customer_name', label: 'Nome do Cliente' },
    { value: 'customer_email', label: 'Email do Cliente' },
    { value: 'customer_phone', label: 'Telefone do Cliente' },
    { value: 'sale_value', label: 'Valor da Venda' },
    { value: 'status', label: 'Status' },
    { value: 'notes', label: 'Observações' },
    { value: 'external_id', label: 'ID Externo' }
];

const DATA_TYPES = [
    { value: 'string', label: 'Texto' },
    { value: 'number', label: 'Número' },
    { value: 'boolean', label: 'Booleano' },
    { value: 'date', label: 'Data' },
    { value: 'object', label: 'Objeto JSON' }
];

const WebhookFieldMappingComponent = ({ mappings, onChange }) => {
    const handleAddMapping = () => {
        const newMapping = {
            id: `temp_${Date.now()}`,
            internal_field_name: '',
            external_field_name: '',
            data_type: 'string',
            is_required: false
        };
        onChange([...mappings, newMapping]);
    };

    const handleRemoveMapping = (index) => {
        const newMappings = [...mappings];
        newMappings.splice(index, 1);
        onChange(newMappings);
    };

    const handleUpdateMapping = (index, field, value) => {
        const newMappings = [...mappings];
        newMappings[index] = { ...newMappings[index], [field]: value };
        onChange(newMappings);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
                <Label className="text-base font-semibold">Mapeamento de Campos</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddMapping}>
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Campo
                </Button>
            </div>

            {mappings.length === 0 && (
                <div className="text-center p-6 border border-dashed rounded-lg text-muted-foreground text-sm">
                    Nenhum mapeamento configurado. Adicione campos para integrar dados.
                </div>
            )}

            <div className="space-y-3">
                {mappings.map((mapping, index) => (
                    <Card key={mapping.id || index} className="bg-muted/30">
                        <CardContent className="p-3 flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                            <div className="flex-1 w-full">
                                <Label className="text-xs mb-1 block">Campo Externo (JSON)</Label>
                                <Input 
                                    placeholder="ex: user.full_name" 
                                    value={mapping.external_field_name}
                                    onChange={(e) => handleUpdateMapping(index, 'external_field_name', e.target.value)}
                                    className="h-9"
                                />
                            </div>

                            <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block shrink-0 mt-4" />

                            <div className="flex-1 w-full">
                                <Label className="text-xs mb-1 block">Campo Interno (MétriX)</Label>
                                <Select 
                                    value={mapping.internal_field_name} 
                                    onValueChange={(val) => handleUpdateMapping(index, 'internal_field_name', val)}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {INTERNAL_FIELDS.map(f => (
                                            <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-full sm:w-28 shrink-0">
                                <Label className="text-xs mb-1 block">Tipo</Label>
                                <Select 
                                    value={mapping.data_type} 
                                    onValueChange={(val) => handleUpdateMapping(index, 'data_type', val)}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DATA_TYPES.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2 pb-2">
                                <div className="flex items-center gap-2 mr-2" title="Obrigatório">
                                    <Switch 
                                        checked={mapping.is_required}
                                        onCheckedChange={(checked) => handleUpdateMapping(index, 'is_required', checked)}
                                        id={`req-${index}`}
                                    />
                                    <Label htmlFor={`req-${index}`} className="text-xs cursor-pointer">Req.</Label>
                                </div>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                    onClick={() => handleRemoveMapping(index)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default WebhookFieldMappingComponent;