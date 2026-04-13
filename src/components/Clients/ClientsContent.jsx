import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClientCard } from './ClientCard';
import { ClientEmptyState } from './ClientEmptyState';
import { ClientTableRow } from './ClientTableRow';

export const ClientsContent = ({
  hasRows,
  searchTerm,
  viewMode,
  columns,
  customers,
  emptyNoSearchTitle,
  emptyNoSearchDescription,
  emptySearchTitle,
  emptySearchDescription,
  onEdit,
  onDeleteRequest,
}) => {
  if (!hasRows) {
    const isFiltered = Boolean(searchTerm?.trim());
    return (
      <ClientEmptyState
        title={isFiltered ? emptySearchTitle : emptyNoSearchTitle}
        description={isFiltered ? emptySearchDescription : emptyNoSearchDescription}
      />
    );
  }

  return (
    <AnimatePresence mode="wait">
      {viewMode === 'grid' ? (
        <motion.div
          key="grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {customers.map((customer) => (
            <ClientCard
              key={customer.id}
              customer={customer}
              onEdit={() => onEdit(customer)}
              onDelete={(e) => onDeleteRequest(e, customer)}
            />
          ))}
        </motion.div>
      ) : (
        <motion.div
          key="table"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="overflow-hidden rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm"
        >
          <Table>
            <TableHeader className="bg-secondary/40">
              <TableRow className="border-border/40 hover:bg-transparent">
                {columns.map(
                  (col) =>
                    col.visible && (
                      <TableHead
                        key={col.id}
                        className="h-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {col.label}
                      </TableHead>
                    ),
                )}
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <ClientTableRow
                  key={customer.id}
                  customer={customer}
                  columns={columns}
                  onEdit={() => onEdit(customer)}
                  onDelete={(e) => onDeleteRequest(e, customer)}
                />
              ))}
            </TableBody>
          </Table>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
