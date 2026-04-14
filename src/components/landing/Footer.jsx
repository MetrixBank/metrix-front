import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Linkedin, Instagram } from 'lucide-react';

const Footer = ({ logoUrl }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-black/20 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative w-8 h-8">
                <img src={logoUrl} alt="Logo MetriX" className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">MetriX</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              A plataforma de gestão definitiva para líderes que não aceitam menos que a excelência.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-6">Produto</h4>
            <ul className="space-y-3">
              <li><a href="/#features" className="text-sm text-muted-foreground hover:text-primary transition-colors">Funcionalidades</a></li>
              <li><a href="/#pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">Planos</a></li>
              <li><a href="/#testimonials" className="text-sm text-muted-foreground hover:text-primary transition-colors">Depoimentos</a></li>
              <li><Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-6">Empresa</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Sobre Nós</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contato</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Carreiras</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-6">Legal</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacidade</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground/60">
            &copy; {currentYear} MetriX. Todos os direitos reservados.
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-muted-foreground hover:text-white transition-colors"><Twitter className="h-5 w-5" /></a>
            <a href="#" className="text-muted-foreground hover:text-white transition-colors"><Instagram className="h-5 w-5" /></a>
            <a href="#" className="text-muted-foreground hover:text-white transition-colors"><Linkedin className="h-5 w-5" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;