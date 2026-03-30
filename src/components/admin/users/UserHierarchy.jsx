import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';
import UserCard from './UserCard';

const UserHierarchy = ({
    allUsers,
    filteredUsers,
    onDeleteUser,
    onPromoteUser,
    onParentChange,
    adminUser,
}) => {
    const hierarchy = useMemo(() => {
        const userMap = new Map(allUsers.map(u => [u.id, { ...u, children: [] }]));
        const roots = [];

        allUsers.forEach(user => {
            if (user.parent_id && userMap.has(user.parent_id)) {
                userMap.get(user.parent_id).children.push(userMap.get(user.id));
            } else {
                roots.push(userMap.get(user.id));
            }
        });

        roots.forEach(root => {
             const sortChildren = (user) => {
                if (user.children.length > 0) {
                    user.children.sort((a,b) => a.name.localeCompare(b.name));
                    user.children.forEach(sortChildren);
                }
            }
            sortChildren(root);
        });
        
        roots.sort((a,b) => a.name.localeCompare(b.name));

        return roots;
    }, [allUsers]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };
    
    const filteredUserIds = new Set(filteredUsers.map(u => u.id));

    const renderUserAndChildren = (user) => {
        if (!filteredUserIds.has(user.id)) return null;

        return (
            <div key={user.id} className="space-y-4">
                <UserCard
                    user={user}
                    allUsers={allUsers}
                    onDeleteUser={onDeleteUser}
                    onPromoteUser={onPromoteUser}
                    onParentChange={onParentChange}
                    adminUser={adminUser}
                />
                {user.children && user.children.length > 0 && (
                    <div className="ml-6 pl-4 border-l-2 border-dashed border-primary/20 space-y-4">
                        {user.children.map(child => renderUserAndChildren(child))}
                    </div>
                )}
            </div>
        );
    };

    const renderedUsers = hierarchy.map(renderUserAndChildren).filter(Boolean);

    if (renderedUsers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Users className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold text-foreground">Nenhum Usuário Encontrado</h3>
                <p className="text-muted-foreground mt-2">
                    Não há usuários para exibir com a busca atual.
                </p>
            </div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="p-4 space-y-4"
        >
            <AnimatePresence>
                {renderedUsers}
            </AnimatePresence>
        </motion.div>
    );
};

export default UserHierarchy;