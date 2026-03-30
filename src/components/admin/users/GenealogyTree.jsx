import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { hierarchy, tree } from 'd3-hierarchy';
import { Users, Search, XCircle } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import UserCard from './UserCard';

const Node = ({ node, onParentChange, onDeleteUser, onPromoteUser, adminUser, allUsers }) => {
    const handleDrop = (e, d) => {
        e.preventDefault();
        const childId = e.dataTransfer.getData("application/reactflow");
        if (childId && childId !== d.data.id) {
            onParentChange(childId, d.data.id);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            transform={`translate(${node.y}, ${node.x})`}
            className="cursor-pointer group"
            onDrop={(e) => handleDrop(e, node)}
            onDragOver={handleDragOver}
        >
            <foreignObject x="-150" y="-80" width="300" height="160">
                <div className="w-full h-full p-2">
                    <UserCard 
                        user={node.data} 
                        onDeleteUser={onDeleteUser} 
                        onPromoteUser={onPromoteUser}
                        onParentChange={onParentChange}
                        adminUser={adminUser}
                        allUsers={allUsers}
                        isDraggable={true}
                    />
                </div>
            </foreignObject>
        </motion.g>
    );
};

const Link = ({ link }) => (
    <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        d={`M${link.source.y + 150},${link.source.x} C ${link.source.y + 225},${link.source.x} ${link.target.y - 150},${link.target.x} ${link.target.y - 150},${link.target.x}`}
        fill="none"
        strokeWidth="2"
        className="stroke-primary/30"
    />
);

const GenealogyTree = ({ allUsers, filteredUsers, onParentChange, onDeleteUser, onPromoteUser, isMobile, adminUser }) => {
    const { nodes, links, width, height, minX } = useMemo(() => {
        if (!allUsers || allUsers.length === 0) {
            return { nodes: [], links: [], width: 0, height: 0, minX: 0 };
        }

        const dataMap = new Map(allUsers.map(d => [d.id, { ...d, children: [] }]));
        const treeData = [];

        // This ensures that even filtered-out users who are parents are in the map
        allUsers.forEach(d => {
            if (d.parent_id && dataMap.has(d.parent_id)) {
                const parent = dataMap.get(d.parent_id);
                if (parent) {
                    parent.children.push(dataMap.get(d.id));
                }
            } else {
                treeData.push(dataMap.get(d.id));
            }
        });

        const root = hierarchy({ id: 'root', children: treeData }, d => d.children);

        const nodeWidth = 300;
        const nodeHeight = 190;
        const treeLayout = tree().nodeSize([nodeHeight, nodeWidth + 100]);
        const layoutRoot = treeLayout(root);

        const allNodes = layoutRoot.descendants().slice(1);
        const allLinks = layoutRoot.links().slice(1);

        const filteredUserIds = new Set(filteredUsers.map(u => u.id));
        const nodesToRender = allNodes.filter(n => filteredUserIds.has(n.data.id));

        const getAncestors = (node) => {
          let ancestors = new Set();
          let current = node.parent;
          while(current && current.data.id !== 'root') {
            ancestors.add(current.data.id);
            current = current.parent;
          }
          return ancestors;
        }

        // If a search is active, show the user and their direct ancestors
        const finalNodes = filteredUsers.length < allUsers.length
          ? allNodes.filter(n => {
              if (filteredUserIds.has(n.data.id)) return true;
              const ancestors = getAncestors(n);
              for (const id of filteredUserIds) {
                if (ancestors.has(id)) return true; // Show descendants of filtered
                const nodeOfFiltered = allNodes.find(an => an.data.id === id);
                if(nodeOfFiltered && getAncestors(nodeOfFiltered).has(n.data.id)) return true; // Show ancestors of filtered
              }
              return false;
            })
          : allNodes;

        const finalNodeIds = new Set(finalNodes.map(n => n.data.id));
        const finalLinks = allLinks.filter(l => finalNodeIds.has(l.source.data.id) && finalNodeIds.has(l.target.data.id));

        let minX = 0, maxX = 0, minY = 0, maxY = 0;
        finalNodes.forEach(node => {
            minX = Math.min(minX, node.x);
            maxX = Math.max(maxX, node.x);
            minY = Math.min(minY, node.y);
            maxY = Math.max(maxY, node.y);
        });

        const width = maxY - minY + nodeWidth + 50;
        const height = maxX - minX + nodeHeight + 50;

        return { nodes: finalNodes, links: finalLinks, width, height, minX };
    }, [allUsers, filteredUsers]);

    if (filteredUsers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <Users className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold text-foreground">Nenhum Usuário Encontrado</h3>
                <p className="text-muted-foreground mt-2">Tente ajustar seus filtros de busca.</p>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="w-full overflow-auto p-4 rounded-lg bg-background/30" style={{ minHeight: isMobile ? 'calc(100vh - 200px)' : 'auto' }}>
                <svg width={width} height={height} className="min-w-full">
                    <g transform={`translate(150, ${-minX + 80})`}>
                        <AnimatePresence>
                            {links.map((link, i) => (
                                <Link key={`link-${link.source.data.id}-${link.target.data.id}`} link={link} />
                            ))}
                        </AnimatePresence>
                        {nodes.map((node, i) => (
                            <Node key={`node-${node.data.id}`} node={node} onParentChange={onParentChange} onDeleteUser={onDeleteUser} onPromoteUser={onPromoteUser} adminUser={adminUser} allUsers={allUsers} />
                        ))}
                    </g>
                </svg>
            </div>
        </TooltipProvider>
    );
};

export default GenealogyTree;