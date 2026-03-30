import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, CheckCircle2, XCircle } from "lucide-react";

export const ActionMenu = ({ 
  type = 'activity', // 'activity' | 'financial'
  onEdit, 
  onDelete, 
  onConfirm, 
  onUnconfirm,
  status // 'paid' | 'pending' for financial
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {type === 'activity' && (
          <>
            <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
              <Edit className="mr-2 h-4 w-4" />
              <span>Editar</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive cursor-pointer focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Excluir</span>
            </DropdownMenuItem>
          </>
        )}

        {type === 'financial' && (
          <>
            {status !== 'paid' && (
                <DropdownMenuItem onClick={onConfirm} className="cursor-pointer text-emerald-600 focus:text-emerald-700">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                <span>Confirmar (Pago)</span>
                </DropdownMenuItem>
            )}
            
            {status === 'paid' && (
                <DropdownMenuItem onClick={onUnconfirm} className="cursor-pointer text-amber-600 focus:text-amber-700">
                <XCircle className="mr-2 h-4 w-4" />
                <span>Desmarcar (Pendente)</span>
                </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            
            {onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-destructive cursor-pointer focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Excluir</span>
                </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};