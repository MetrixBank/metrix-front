import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const DashboardCardSkeleton = () => (
    <div className="bg-[#161922] border border-white/5 rounded-2xl p-5 flex flex-col justify-between h-40">
        <div className="flex justify-between items-start mb-4">
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
            </div>
            <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
        <Skeleton className="h-4 w-40" />
    </div>
);

export const ChartSkeleton = () => (
    <div className="bg-[#161922] border border-white/5 rounded-2xl p-6 h-[400px]">
        <div className="flex justify-between mb-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-24" />
        </div>
        <div className="flex items-end gap-2 h-64 mt-8">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
    </div>
);

export const TableRowSkeleton = () => (
    <div className="flex items-center space-x-4 py-4 border-b border-white/5">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
        </div>
    </div>
);