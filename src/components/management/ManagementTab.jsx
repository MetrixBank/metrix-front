import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomersTab from '@/components/management/CustomersTab';
import StockManagementTab from '@/components/management/StockManagementTab';
import { Users, Package } from 'lucide-react';
import { useTutorial } from '@/contexts/TutorialContext';
import TutorialStep from '@/components/tutorial/TutorialStep';

const ManagementTab = ({ user }) => {
  const { isTutorialActive } = useTutorial();

  return (
    <div className="p-1 md:p-0">
       <Tabs defaultValue="customers" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50">
           <TutorialStep
                step={5} // Adjusted step for Customers tab
                content="Passo 5: Comece pela gestão de 'Clientes' para adicionar, visualizar e gerenciar sua carteira."
                isActive={isTutorialActive}
            >
            <TabsTrigger value="customers">
                <Users className="w-4 h-4 mr-2" />
                Clientes
            </TabsTrigger>
          </TutorialStep>
          <TutorialStep
                step={6} // Adjusted step for Products tab
                content="Passo 6: Agora, vá para 'Produtos' e adicione os itens que você vende. Isso é crucial para o próximo passo!"
                isActive={isTutorialActive}
            >
            <TabsTrigger value="products">
                <Package className="w-4 h-4 mr-2" />
                Produtos
            </TabsTrigger>
          </TutorialStep>
        </TabsList>
        <TabsContent value="customers" className="mt-4">
            <CustomersTab user={user} />
        </TabsContent>
        <TabsContent value="products" className="mt-4">
            <StockManagementTab user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManagementTab;