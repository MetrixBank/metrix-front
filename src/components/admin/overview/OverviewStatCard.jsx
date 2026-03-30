import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const OverviewStatCard = ({ title, value, icon, unit, color }) => (
  <Card className="card-gradient shadow-md border-border/30">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-3">
      <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
      {React.cloneElement(icon, { className: `h-4 w-4 ${color || 'text-primary'}` })}
    </CardHeader>
    <CardContent className="pb-3 px-3">
      <div className="text-lg font-bold text-foreground">{value}{unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}</div>
    </CardContent>
  </Card>
);

export default OverviewStatCard;