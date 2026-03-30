import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

const Header = ({ logoUrl }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-black/40 backdrop-blur-xl border-b border-white/10 py-2' 
          : 'bg-transparent py-4'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center group">
             {/* Increased logo size */}
             <div className="relative h-14 w-14 sm:h-20 sm:w-20"> 
                <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
                <img 
                  src="https://horizons-cdn.hostinger.com/0c05ef73-d1d6-4ad5-b2e0-c9f1ef8a8a6c/c6cd491c9086d90da0346bf00585c67f.png" 
                  alt="MetriX Logo" 
                  className="relative h-full w-full object-contain" 
                />
             </div>
          </Link>
          
          <nav className="flex items-center space-x-4">
            <Button 
              asChild 
              variant="ghost" 
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors hidden sm:inline-flex"
            >
              <a href="#features">Funcionalidades</a>
            </Button>
            <Button 
              asChild 
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 border border-primary/50 transition-all hover:scale-105"
            >
              <Link to="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Acessar
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;