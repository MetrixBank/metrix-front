import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { LifeBuoy, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FaqTab from '@/pages/support/FaqTab';
import ChatTab from '@/pages/support/ChatTab';
import DashboardHeader from '@/components/DashboardHeader'; 

const SupportPage = () => { 
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("faq");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <DashboardHeader />

      <main className="flex-1 pt-20 flex flex-col p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto w-full">
          <div className="text-center mb-8">
            <LifeBuoy className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-gradient">
              Central de Suporte
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Encontre respostas ou fale com nossa equipe.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="faq">
                <LifeBuoy className="w-4 h-4 mr-2" />
                Dúvidas Frequentes
              </TabsTrigger>
              <TabsTrigger value="chat">
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat com Suporte
              </TabsTrigger>
            </TabsList>
            <TabsContent value="faq" className="mt-6">
              <FaqTab />
            </TabsContent>
            <TabsContent value="chat" className="mt-6">
              <ChatTab user={user} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default SupportPage;