import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { Toaster } from "@/components/ui/toaster";
import { TutorialProvider } from '@/contexts/TutorialContext';
import { DataSyncProvider } from '@/contexts/DataSyncContext';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { AiAssistantProvider } from '@/contexts/AiAssistantContext';
import AppLogic from '@/components/routing/AppLogic';
import { TeamViewProvider } from '@/contexts/TeamViewContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
import { CartProvider } from '@/hooks/useCart';

function App() {
  return (
    <BrowserRouter>
      <HelmetProvider>
        <Helmet>
          <title>METRIX - Gestão de Sucesso</title>
          <meta name="description" content="METRIX é uma plataforma inteligente de gestão financeira que une organização, planejamento e soluções práticas em um só lugar." />
          <link rel="icon" type="image/png" href="/favicon.png" />
          <link rel="apple-touch-icon" href="/favicon.png" />
        </Helmet>
        <AuthProvider>
          <CartProvider>
            <LocalizationProvider>
              <DataSyncProvider>
                <NotificationProvider>
                  <AiAssistantProvider>
                    <TeamViewProvider>
                      <TutorialProvider>
                        <TooltipProvider>
                          <AppLogic />
                          <Toaster />
                        </TooltipProvider>
                      </TutorialProvider>
                    </TeamViewProvider>
                  </AiAssistantProvider>
                </NotificationProvider>
              </DataSyncProvider>
            </LocalizationProvider>
          </CartProvider>
        </AuthProvider>
      </HelmetProvider>
    </BrowserRouter>
  );
}

export default App;