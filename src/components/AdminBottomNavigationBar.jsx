import React from 'react';
    import { motion } from 'framer-motion';
    import { Button } from '@/components/ui/button';

    const NavButton = ({ isActive, onClick, icon: Icon, label }) => (
      <Button
        variant="ghost"
        className={`flex flex-col items-center justify-center h-full rounded-none flex-1 px-0.5 py-1.5 text-xs transition-colors duration-200 relative min-w-0 ${
          isActive ? 'text-primary font-semibold' : 'text-muted-foreground'
        }`}
        onClick={onClick}
        size="sm"
      >
        {isActive && <motion.div layoutId="active-admin-nav-indicator" className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />}
        <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-primary' : ''}`} />
        <span className="truncate max-w-full text-2xs">{label}</span>
      </Button>
    );

    const AdminBottomNavigationBar = ({ activeTab, setActiveTab, isMobile, tabsConfig }) => {
      if (!isMobile || !tabsConfig) return null;
      
      return (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 h-16 bg-card/90 backdrop-blur-md border-t border-border/60 shadow-t-xl z-50 flex justify-around items-stretch"
        >
          {tabsConfig.map((item) => (
            <NavButton
              key={item.value}
              isActive={activeTab === item.value}
              onClick={() => setActiveTab(item.value)}
              icon={item.icon}
              label={item.name}
            />
          ))}
        </motion.div>
      );
    };

    export default AdminBottomNavigationBar;