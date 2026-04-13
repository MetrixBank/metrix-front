import React, { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Home, Calendar, Users, Landmark, ListChecks } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { roles } from '@/lib/constants';

// Define navigation items for the bottom bar (Mobile only)
// Optimized for the 5 most important daily actions
const navItems = [
  { path: "/dashboard", icon: Home, label: "Início", roles: [roles.DISTRIBUTOR, roles.SUB_ADMIN, roles.ADMIN, roles.MASTER_ADMIN] },
  { path: "/sales", icon: ListChecks, label: "CRM", roles: [roles.DISTRIBUTOR, roles.SUB_ADMIN] },
  { path: "/agenda", icon: Calendar, label: "Agenda", roles: [roles.DISTRIBUTOR, roles.SUB_ADMIN] },
  { path: "/customers", icon: Users, label: "Clientes", roles: [roles.DISTRIBUTOR, roles.SUB_ADMIN] },
  { path: "/fnx-solutions", icon: Landmark, label: "MetriX Bank", roles: [roles.DISTRIBUTOR, roles.SUB_ADMIN, roles.ADMIN, roles.MASTER_ADMIN] },
];

const BottomNavigationBar = memo(() => {
  const { user } = useAuth();
  const userRole = user?.role;

  if (!user || !userRole) {
    return null;
  }

  // Filter items based on role
  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

  if (filteredNavItems.length === 0) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/40 shadow-lg block md:hidden safe-area-pb pb-1">
      <div className="flex justify-around h-16 items-center px-1">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center w-full h-full text-[10px] font-medium text-muted-foreground transition-colors active:scale-95",
                isActive && "text-primary"
              )
            }
          >
            {({ isActive }) => (
              <div className="flex flex-col items-center justify-center gap-1.5">
                <motion.div
                    initial={false}
                    animate={{
                        scale: isActive ? 1.05 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="relative"
                >
                    <item.icon 
                        className={cn(
                            "h-6 w-6 transition-all duration-200", 
                            isActive ? "fill-primary text-primary" : "stroke-current text-muted-foreground"
                        )} 
                    />
                </motion.div>
                <span className={cn("truncate max-w-[64px] leading-none", isActive ? "font-semibold" : "")}>{item.label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
});

BottomNavigationBar.displayName = 'BottomNavigationBar';
export default BottomNavigationBar;