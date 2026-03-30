import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Menu, Landmark } from 'lucide-react';
import useMediaQuery from '@/hooks/useMediaQuery';
import AdminDashboardContent from '@/components/admin/AdminDashboardContent';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { roles } from '@/lib/constants';

const AdminDashboard = ({ logoUrl }) => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // Updated to allow SUB_ADMIN access
  if (!user || (user.role !== roles.ADMIN && user.role !== roles.MASTER_ADMIN && user.role !== roles.SUB_ADMIN)) {
    return <div className="flex items-center justify-center h-screen">Acesso Negado.</div>;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      {isDesktop && (
        <AdminSidebar 
            user={user} 
            onLogout={signOut} 
            logoUrl={logoUrl} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
        />
      )}

      {/* Mobile Sidebar (Drawer) */}
      {!isDesktop && (
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetContent side="left" className="p-0 w-72 border-r border-border/30">
                <AdminSidebar 
                    user={user} 
                    onLogout={signOut} 
                    logoUrl={logoUrl} 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab}
                    isMobile={true}
                    onCloseMobile={() => setIsMobileMenuOpen(false)}
                />
            </SheetContent>
        </Sheet>
      )}

      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-background/50">
        {/* Header Bar (Mobile & Desktop) */}
        <div className="h-16 border-b border-border/30 flex items-center justify-between px-4 bg-card/80 backdrop-blur-sm flex-shrink-0 z-10">
            <div className="flex items-center">
                {!isDesktop && (
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)} className="mr-4">
                        <Menu className="h-6 w-6" />
                    </Button>
                )}
                {!isDesktop && <img src={logoUrl} alt="Logo" className="h-8" />}
                {isDesktop && (
                     <h1 className="text-lg font-semibold text-foreground hidden md:block">
                        {user.role === roles.SUB_ADMIN ? 'Painel de Equipe' : 'Painel Administrativo Master'}
                     </h1>
                )}
            </div>

            {/* Quick Navigation Actions */}
            <div className="flex items-center gap-2">
                 {/* Only show Bank for Admins/Master Admins if needed, or everyone. Keeping it for now. */}
                 <Button 
                    onClick={() => setActiveTab('fnx-unified')}
                    className={`gap-2 transition-all ${activeTab === 'fnx-unified' ? 'bg-[#8B5CF6] hover:bg-[#7C3AED]' : 'bg-secondary/50 hover:bg-secondary'}`}
                    variant={activeTab === 'fnx-unified' ? 'default' : 'outline'}
                 >
                    <Landmark className="w-4 h-4" />
                    <span className="hidden sm:inline">MetriX Bank</span>
                 </Button>
            </div>
        </div>

        {/* Content Area */}
        <AdminDashboardContent activeTab={activeTab} user={user} />
      </main>
    </div>
  );
};

export default AdminDashboard;