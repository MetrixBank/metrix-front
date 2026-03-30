import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ship } from 'lucide-react';

const CruiseGoalCard = () => {
    
    const handleWhatsAppClick = () => {
        const message = encodeURIComponent("Olá! Gostaria de mais informações sobre como garantir minha vaga no Cruzeiro dos Nipponflexianos. A vaga é paga e quero confirmar minha participação.");
        const phoneNumber = "551121233692";
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    };

    return (
        <Card className="card-gradient shadow-xl border-border/30 overflow-hidden">
            <CardHeader>
                <div className="flex items-center space-x-4">
                    <Ship className="w-8 h-8 text-blue-500" />
                    <div>
                        <CardTitle className="text-2xl text-gradient">Cruzeiro dos Nipponflexianos</CardTitle>
                        <CardDescription>A maior premiação do ano. Vagas limitadas!</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Esta é uma oportunidade única e exclusiva! A vaga para o cruzeiro é <strong>paga por cada distribuidor</strong> e garante uma experiência inesquecível.
                    </p>
                    
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button onClick={handleWhatsAppClick} className="w-full mt-2 bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30">
                           <svg className="w-5 h-5 mr-2" role="img" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12.04 2.016c-5.52 0-9.984 4.464-9.984 9.984 0 1.728.444 3.36 1.224 4.788L2.004 22l5.316-1.284a9.936 9.936 0 0 0 4.716 1.224h.012c5.52 0 9.984-4.464 9.984-9.984s-4.464-9.984-9.984-9.984zm0 18.252c-1.584 0-3.12-.42-4.476-1.176l-.324-.192-3.324.804.816-3.252-.216-.348c-.804-1.308-1.248-2.82-1.248-4.404 0-4.596 3.732-8.328 8.328-8.328 4.596 0 8.328 3.732 8.328 8.328s-3.732 8.328-8.328 8.328zm4.8-6.396c-.264-.132-1.56-.768-1.8- .864-.24-.096-.42-.132-.6.132-.18.264-.684.864-.84 1.032-.156.168-.312.18-.576.06s-1.104-.408-2.1-1.296c-.792-.696-1.32-1.56-1.476-1.824-.156-.264-.012-.408.12-.54.12-.12.264-.312.396-.468.132-.156.168-.264.264-.444.096-.18.048-.348-.012-.48s-.6-1.44-.816-1.968c-.204-.516-.42-.444-.6-.444-.168 0-.348-.012-.528-.012s-.468.072-.708.348c-.24.276-.924.9-.924 2.196s.948 2.556 1.08 2.736c.132.18 1.86 2.856 4.512 3.996.636.276 1.14.432 1.524.552.552.18 1.056.156 1.44.096.432-.06.156-.708.996-1.392.24-.192.24-.36.18-.48z"/></svg>
                           Garantir Minha Vaga no WhatsApp
                        </Button>
                    </motion.div>
                </div>
            </CardContent>
        </Card>
    );
};

export default CruiseGoalCard;