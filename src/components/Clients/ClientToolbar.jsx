import React from 'react';
import { Filter, LayoutGrid, List as ListIcon, Search, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export const ClientToolbar = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder,
  viewMode,
  onViewModeChange,
  columns,
  onToggleColumn,
  /** Conteúdo extra à direita (ex.: botão Excel), junto ao modo de visualização */
  toolbarEnd,
}) => (
  <Card className="card-gradient sticky top-4 z-30 border-border/30 shadow-lg shadow-black/20">
    <CardHeader className="pb-2 pt-4">
      <CardTitle className="text-md flex items-center text-gradient">
        <Filter className="mr-2 h-4 w-4" />
        Filtros
      </CardTitle>
    </CardHeader>
    <CardContent className="pb-4 pt-0">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md md:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 border-border/50 bg-background/70 pl-9 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/30"
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <div className="flex rounded-lg border border-border/50 bg-background/70 p-1">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={cn(
                'rounded-md p-2 transition-all',
                viewMode === 'grid' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
              title="Grade"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={cn(
                'rounded-md p-2 transition-all',
                viewMode === 'table' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
              title="Tabela"
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>

          {toolbarEnd}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="border-border/50 bg-background/70 hover:bg-secondary/80">
                <Settings2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-border/50 bg-card text-card-foreground">
              <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/50" />
              {columns.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.visible}
                  onCheckedChange={() => onToggleColumn(col.id)}
                  className="focus:bg-secondary focus:text-foreground"
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </CardContent>
  </Card>
);
