import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Bot, Package, CreditCard, Target, Users, Wallet, GraduationCap } from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    title: 'Visibilidade Total',
    description: 'Acompanhe cada oportunidade da sua equipe, desde o contato até o fechamento, com um funil visual e intuitivo.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
  },
  {
    icon: Bot,
    title: 'Assistente IA',
    description: 'Capacite sua equipe com tarefas inteligentes, como lembretes de pós-venda e reativação de clientes.',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/20',
  },
  {
    icon: Package,
    title: 'Gestão de Estoque',
    description: 'Controle o estoque de cada membro do time, evite perdas e otimize as compras de forma centralizada.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
  },
  {
    icon: CreditCard,
    title: 'Crédito Integrado',
    description: 'Permita que sua equipe ofereça crédito aos clientes de forma simplificada e segura, diretamente pela plataforma.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/20',
  },
  {
    icon: Target,
    title: 'Metas & Ranking',
    description: 'Estabeleça metas de vendas para a equipe e acompanhe o progresso com rankings que engajam a todos.',
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/20',
  },
  {
    icon: Users,
    title: 'Gestão de Time',
    description: 'Monitore o desempenho individual, defina metas e promova uma cultura de alta performance.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10',
    border: 'border-indigo-400/20',
  },
  {
    icon: Wallet,
    title: 'Financeiro',
    description: 'Ofereça uma visão clara das finanças para cada membro e tenha uma visão consolidada dos resultados.',
    color: 'text-green-400',
    bg: 'bg-green-400/10',
    border: 'border-green-400/20',
  },
  {
    icon: GraduationCap,
    title: 'Área de Ensino',
    description: 'Acesse uma área de treinamento completa com vídeos e materiais para capacitar você e sua equipe.',
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
    border: 'border-pink-400/20',
  },
];

const FeatureCard = ({ icon: Icon, title, description, color, bg, border, index }) => (
  <motion.div
    className="relative p-6 rounded-2xl border border-white/5 bg-black/30 backdrop-blur-lg overflow-hidden group cursor-default hover:border-white/10 transition-colors duration-300"
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    }}
    transition={{ duration: 0.5, delay: index * 0.05 }}
  >
    {/* Hover gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

    {/* Icon */}
    <div className={`p-3 rounded-xl ${bg} border ${border} w-fit mb-4 ${color} group-hover:scale-110 transition-transform duration-300`}>
      <Icon className="w-6 h-6" />
    </div>

    <h3 className={`text-lg font-bold text-white mb-2 group-hover:${color} transition-colors duration-300`}>{title}</h3>
    <p className="text-muted-foreground text-sm leading-relaxed group-hover:text-white/70 transition-colors duration-300">{description}</p>
  </motion.div>
);

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 sm:py-32 relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Ferramentas para{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Alta Performance
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Nossa plataforma foi construída com funcionalidades poderosas para resolver os maiores desafios dos líderes de equipe modernos.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
        >
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} index={index} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;