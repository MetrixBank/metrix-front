import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';

const testimonials = [
  {
    name: 'Carlos Silva',
    title: 'Líder Diamante',
    quote: 'A MetriX revolucionou minha gestão. A visão clara do funil de vendas da equipe e do estoque individual nos deu um aumento de 30% na eficiência em apenas 3 meses.',
    imageUrl: "https://images.unsplash.com/photo-1595872018818-97555653a011"
  },
  {
    name: 'Stephany Silveira',
    title: 'Gerente Regional',
    quote: 'O sistema de metas e ranking é fantástico! Minha equipe nunca esteve tão motivada. As vendas cresceram 25% no último trimestre, estou muito feliz com os resultados.',
    imageUrl: 'https://storage.googleapis.com/hostinger-horizons-assets-prod/0c05ef73-d1d6-4ad5-b2e0-c9f1ef8a8a6c/67fe761279e56d845d511c4df0292201.jpg',
  },
  {
    name: 'Roberto Almeida',
    title: 'Diretor de Expansão',
    quote: 'Finalmente uma plataforma que entende as dores de um líder. O controle financeiro individual e a gestão de desempenho da equipe são um divisor de águas para nós.',
    imageUrl: "https://images.unsplash.com/photo-1627577741153-74b82d87607b"
  },
];

const TestimonialCard = ({ name, title, quote, imageUrl, index }) => {
  const finalImageUrl = imageUrl.includes('unsplash') ? imageUrl : `${imageUrl}?v=${new Date().getTime()}`;
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="h-full"
    >
      <div className="h-full p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col relative overflow-hidden hover:border-primary/30 transition-colors duration-300">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Quote size={80} className="text-white rotate-180" />
        </div>
        
        <div className="mb-6 relative z-10">
            <div className="inline-block p-3 rounded-full bg-primary/10 mb-4">
                <Quote className="w-6 h-6 text-primary" />
            </div>
            <p className="text-lg text-white/90 leading-relaxed italic">"{quote}"</p>
        </div>
        
        <div className="mt-auto flex items-center pt-6 border-t border-white/10">
          <Avatar className="h-12 w-12 mr-4 ring-2 ring-primary/20">
            <AvatarImage src={finalImageUrl} alt={name} />
            <AvatarFallback className="bg-primary/10 text-primary"><User className="w-6 h-6" /></AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold text-white">{name}</p>
            <p className="text-sm text-primary">{title}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-24 sm:py-32 relative overflow-hidden">
       <div className="absolute inset-0 bg-black/20" />
       
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Líderes que confiam <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">na MetriX</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Veja o impacto real que nossa tecnologia está gerando em operações de vendas por todo o país.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            visible: { transition: { staggerChildren: 0.1 } },
          }}
        >
          {testimonials.map((testimonial, index) => (
            <TestimonialCard 
              key={index} 
              {...testimonial} 
              index={index} 
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;