import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Coins, PlusCircle, UserCheck, UserX, UserPlus, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DistributorItem = ({ distributor, index, onAddTokens, onDistributorTypeChange }) => {
  const isTeamMember = distributor.distributor_type === 'team';

  const handleClassificationChange = (value) => {
    onDistributorTypeChange(distributor.id, value);
  };

  return (
    <motion.div
      key={distributor.id}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg bg-background/50 border gap-3 sm:gap-2"
    >
      <div className="flex items-center space-x-3 flex-1">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isTeamMember ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
          {isTeamMember ? <UserCheck className="w-5 h-5 text-green-500" /> : <UserX className="w-5 h-5 text-blue-500" />}
        </div>
        <div>
          <p className="font-medium text-sm">{distributor.name}</p>
          <p className="text-xs text-muted-foreground">{distributor.email}</p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
        <div className="text-left sm:text-right">
          <p className="text-sm font-medium flex items-center">
            <Coins className="w-3.5 h-3.5 mr-1 text-accent" />
            {(distributor.tokens || 0).toFixed(4)} Tokens
          </p>
        </div>

        <div className="w-36">
          <Select
            value={distributor.distributor_type || 'external'}
            onValueChange={handleClassificationChange}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Classificação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="team"><div className="flex items-center"><UserPlus className="w-3 h-3 mr-2" />Equipe</div></SelectItem>
              <SelectItem value="external"><div className="flex items-center"><UserMinus className="w-3 h-3 mr-2" />Externo</div></SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onAddTokens(distributor)}>
          <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
          Adicionar Tokens
        </Button>
      </div>
    </motion.div>
  );
};

const DistributorsList = ({ distributors, onAddTokens, onDistributorTypeChange }) => {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6 }}
    >
      <Card className="card-gradient backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Distribuidores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[calc(100vh-26rem)] overflow-y-auto pr-2 custom-scrollbar">
            {distributors.length === 0 ? (
               <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum distribuidor encontrado</p>
                </div>
            ) : (
              distributors.map((distributor, index) => (
                <DistributorItem 
                  key={distributor.id} 
                  distributor={distributor} 
                  index={index} 
                  onAddTokens={onAddTokens}
                  onDistributorTypeChange={onDistributorTypeChange}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DistributorsList;