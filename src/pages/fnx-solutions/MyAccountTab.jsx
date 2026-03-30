import React from 'react';
import { motion } from 'framer-motion';
import FnxBankDashboard from './FnxBankDashboard';

const MyAccountTab = ({ user, onNewProposal }) => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            <motion.div variants={itemVariants}>
                <FnxBankDashboard user={user} onNewProposal={onNewProposal} />
            </motion.div>
        </motion.div>
    );
};

export default MyAccountTab;