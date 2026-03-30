import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion, AnimatePresence } from 'framer-motion';

const FaqTab = () => {
  const [faqItems, setFaqItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchFaqs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('faq_items')
        .select('*')
        .order('category', { ascending: true });

      if (error) {
        console.error('Error fetching FAQs:', error);
      } else {
        setFaqItems(data);
      }
      setLoading(false);
    };

    fetchFaqs();
  }, []);

  const filteredFaqs = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedFaqs = filteredFaqs.reduce((acc, item) => {
    const category = item.category || 'Geral';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar por dúvida..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <AnimatePresence>
        {Object.keys(groupedFaqs).length > 0 ? (
          Object.entries(groupedFaqs).map(([category, items]) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-semibold mb-4 text-primary">{category}</h2>
              <Accordion type="single" collapsible className="w-full">
                {items.map((item) => (
                  <AccordionItem key={item.id} value={`item-${item.id}`}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground whitespace-pre-wrap">{item.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-10"
          >
            <p className="text-muted-foreground">Nenhum resultado encontrado para "{searchTerm}".</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FaqTab;