import React from 'react';
import { motion } from 'framer-motion';
import AnimatedCounter from '@/components/management/goals/AnimatedCounter';

const FnxStatCard = ({ title, value, icon: Icon, custom, variants }) => {
    const isNumeric = typeof value === 'number';

    return (
        <motion.div
            className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/60 rounded-2xl p-4 flex flex-col justify-between shadow-lg hover:shadow-primary/20 hover:border-primary/50 transition-all duration-300"
            custom={custom}
            variants={variants}
        >
            <div className="flex items-center justify-between text-muted-foreground">
                <span className="font-semibold text-sm">{title}</span>
                <Icon className="w-5 h-5 text-primary/80" />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-foreground mt-2">
                {isNumeric ? (
                    <AnimatedCounter value={value} />
                ) : (
                    value
                )}
            </div>
        </motion.div>
    );
};

export default FnxStatCard;