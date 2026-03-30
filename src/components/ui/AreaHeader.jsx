import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const AreaHeader = ({ 
  icon: Icon, 
  title, 
  subtitle,
  tabs = [], 
  activeTab, 
  onTabChange, 
  actionButton 
}) => {
  return (
    <div className="w-full bg-slate-950 border-b border-slate-800 sticky top-0 z-30 pt-4 px-4 sm:px-6 mb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2.5 bg-blue-900/20 border border-blue-900/30 rounded-xl text-blue-400 shrink-0">
              <Icon className="w-6 h-6" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">{title}</h1>
            {subtitle && (
              <p className="text-sm text-slate-400">{subtitle}</p>
            )}
          </div>
        </div>

        {actionButton && (
          <Button 
            onClick={actionButton.onClick} 
            className="shrink-0 gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm"
            size="sm"
            variant="outline"
          >
            {actionButton.icon && <actionButton.icon className="w-4 h-4 text-slate-400" />}
            {actionButton.label}
          </Button>
        )}
      </div>

      {tabs.length > 0 && (
        <div className="flex overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-6 border-b border-transparent min-w-full sm:min-w-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "relative pb-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2",
                  activeTab === tab.id
                    ? "text-blue-400"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                {tab.icon && <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-blue-400" : "text-slate-500")} />}
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AreaHeader;